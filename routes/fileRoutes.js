const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile, getFiles } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', protect, upload.single('file'), uploadFile);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', protect, deleteFile);

// @route   GET /api/files
// @desc    Get all files for a user
// @access  Private
router.get('/', protect, getFiles);

module.exports = router;
