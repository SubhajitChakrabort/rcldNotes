const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');

router.post('/', folderController.createFolder);
router.get('/', folderController.getFolders);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);
router.post('/:folderId/documents', folderController.addDocumentToFolder);
// Add this route
router.get('/:folderId/contents', folderController.getFolderContents);
router.delete('/:folderId/documents/:documentId', folderController.removeDocumentFromFolder);
module.exports = router;
