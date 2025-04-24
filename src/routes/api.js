const express = require('express');
const router = express.Router();
const plagiarismController = require('../controllers/plagiarismController');

// Check text for plagiarism
router.post('/check', plagiarismController.checkPlagiarism);

// Get history of checks
router.get('/history', plagiarismController.getHistory);

// Get detailed result by ID
router.get('/result/:id', plagiarismController.getResultById);

module.exports = router;