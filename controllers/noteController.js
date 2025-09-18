const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Function to clean HTML content and convert to plain text for PDF
const cleanHtmlContent = (htmlContent) => {
  if (!htmlContent) return '';
  
  let cleanContent = htmlContent;
  
  // Remove &nbsp; entities and replace with regular spaces
  cleanContent = cleanContent.replace(/&nbsp;/g, ' ');
  
  // Replace other common HTML entities
  cleanContent = cleanContent.replace(/&amp;/g, '&');
  cleanContent = cleanContent.replace(/&lt;/g, '<');
  cleanContent = cleanContent.replace(/&gt;/g, '>');
  cleanContent = cleanContent.replace(/&quot;/g, '"');
  cleanContent = cleanContent.replace(/&#39;/g, "'");
  
  // Convert HTML formatting to plain text with basic formatting
  // Handle headings
  cleanContent = cleanContent.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n');
  
  // Handle paragraphs
  cleanContent = cleanContent.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Handle line breaks
  cleanContent = cleanContent.replace(/<br\s*\/?>/gi, '\n');
  
  // Handle bold text
  cleanContent = cleanContent.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '$2');
  
  // Handle italic text
  cleanContent = cleanContent.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '$2');
  
  // Handle lists
  cleanContent = cleanContent.replace(/<ul[^>]*>/gi, '\n');
  cleanContent = cleanContent.replace(/<\/ul>/gi, '\n');
  cleanContent = cleanContent.replace(/<ol[^>]*>/gi, '\n');
  cleanContent = cleanContent.replace(/<\/ol>/gi, '\n');
  cleanContent = cleanContent.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  
  // Handle divs and spans
  cleanContent = cleanContent.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
  cleanContent = cleanContent.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
  
  // Remove any remaining HTML tags
  cleanContent = cleanContent.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace and line breaks
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple line breaks to double
  cleanContent = cleanContent.replace(/^\s+|\s+$/g, ''); // Trim start and end
  cleanContent = cleanContent.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  
  return cleanContent;
};

// Function to wrap text for PDF generation
const wrapText = (text, maxWidth, fontSize = 12) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  const charWidth = fontSize * 0.6; // Approximate character width
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  
  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

const noteController = {
  createNote: async (req, res) => {
    try {
      const { subjectName, title, content } = req.body;
      const [result] = await pool.execute(
        'INSERT INTO notes (user_id, subject_name, title, content) VALUES (?, ?, ?, ?)',
        [1, subjectName, title, content]
      );

      res.status(201).json({
        id: result.insertId,
        message: 'Note created successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getNotes: async (req, res) => {
    try {
      const [notes] = await pool.execute(
        'SELECT * FROM notes ORDER BY created_at DESC'
      );
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { subjectName, title, content } = req.body;

      await pool.execute(
        'UPDATE notes SET subject_name = ?, title = ?, content = ? WHERE id = ?',
        [subjectName, title, content, id]
      );

      res.json({ message: 'Note updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteNote: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  generatePDF: async (req, res) => {
    try {
      const { subjectName, title, content } = req.body;

      // Clean the content to remove HTML tags and entities
      const cleanContent = cleanHtmlContent(content);

      // Create directory if it doesn't exist
      const dir = path.join(__dirname, `../uploads/notes/${subjectName}`);
      fs.mkdirSync(dir, { recursive: true });

      // Clean title for filename (remove special characters)
      const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').trim();
      const pdfPath = path.join(dir, `${cleanTitle}.pdf`);

      // Generate PDF with better formatting
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Add header
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Subject: ${subjectName}`, { align: 'right' });

      doc.moveDown(0.5);

      // Add title
      doc.fontSize(20)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });

      // Add a line under title
      doc.moveTo(50, doc.y + 10)
         .lineTo(545, doc.y + 10)
         .stroke();

      doc.moveDown(2);

      // Add content with proper text wrapping
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#333333');

      // Split content into paragraphs
      const paragraphs = cleanContent.split('\n\n');
      
      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
          // Check if it's a bullet point
          if (paragraph.trim().startsWith('•')) {
            doc.fontSize(12)
               .text(paragraph.trim(), {
                 indent: 20,
                 align: 'left',
                 lineGap: 2
               });
          } else {
            // Regular paragraph
            doc.fontSize(12)
               .text(paragraph.trim(), {
                 align: 'justify',
                 lineGap: 4
               });
          }
          
          // Add space between paragraphs
          if (index < paragraphs.length - 1) {
            doc.moveDown(0.5);
          }
        }
      });

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#666666')
           .text(`Page ${i + 1} of ${pageCount}`, 
                  50, 
                  doc.page.height - 30, 
                  { align: 'center' });
      }

      doc.end();

      // Wait for PDF to finish writing
      stream.on('finish', () => {
        const relativePath = `/uploads/notes/${subjectName}/${cleanTitle}.pdf`;
        res.json({ 
          success: true,
          message: 'PDF generated successfully',
          filePath: relativePath 
        });
      });

      stream.on('error', (error) => {
        console.error('Error writing PDF:', error);
        res.status(500).json({ 
          success: false,
          message: 'Error generating PDF',
          error: error.message 
        });
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error generating PDF',
        error: error.message 
      });
    }
  }
};

module.exports = noteController;
