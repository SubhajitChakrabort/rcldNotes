const express = require('express');
const router = express.Router();
const studyFolderController = require('../controllers/studyFolderController');

router.get('/', studyFolderController.getStudyMaterials);
router.get('/search', studyFolderController.searchMaterials);
router.post('/save-pdf/:noteId', studyFolderController.savePDFToStudyFolder);

module.exports = router;
