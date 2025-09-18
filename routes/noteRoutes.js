const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.post('/', noteController.createNote);
router.get('/', noteController.getNotes);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);
router.post('/save-pdf', noteController.generatePDF);

module.exports = router;
