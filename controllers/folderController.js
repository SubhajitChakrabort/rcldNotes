const pool = require('../config/db');

const folderController = {
  createFolder: async (req, res) => {
    try {
      const { name } = req.body;
      const [result] = await pool.execute(
        'INSERT INTO folders (name) VALUES (?)',
        [name]
      );
      res.status(201).json({
        id: result.insertId,
        message: 'Folder created successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getFolders: async (req, res) => {
    try {
      const [folders] = await pool.execute('SELECT * FROM folders ORDER BY created_at DESC');
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateFolder: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      await pool.execute(
        'UPDATE folders SET name = ? WHERE id = ?',
        [name, id]
      );
      res.json({ message: 'Folder renamed successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteFolder: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM folders WHERE id = ?', [id]);
      res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addDocumentToFolder: async (req, res) => {
    try {
      const { folderId } = req.params;
      const { documentId, documentType } = req.body;
      
      await pool.execute(
        'INSERT INTO folder_documents (folder_id, document_id, document_type) VALUES (?, ?, ?)',
        [folderId, documentId, documentType]
      );
      
      res.json({ message: 'Document added to folder successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Add this function to your controller
getFolderContents: async (req, res) => {
  try {
    const { folderId } = req.params;
    const [documents] = await pool.execute(
      `SELECT fd.*, n.title, n.subject_name, n.content 
       FROM folder_documents fd 
       JOIN notes n ON fd.document_id = n.id 
       WHERE fd.folder_id = ?`,
      [folderId]
    );
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},
  removeDocumentFromFolder: async (req, res) => {
    try {
      const { folderId, documentId } = req.params;
      
      await pool.execute(
        'DELETE FROM folder_documents WHERE folder_id = ? AND document_id = ?',
        [folderId, documentId]
      );
      
      res.json({ message: 'Document removed from folder successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

};

module.exports = folderController;
