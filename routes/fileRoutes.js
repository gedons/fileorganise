const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile, getFiles, moveFile, searchFiles, getStorageUsage } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const checkStorageLimit = require('../middleware/checkStorageLimit');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/api/upload',protect, checkStorageLimit, upload.single('file'), uploadFile);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', protect, deleteFile);

// @route   GET /api/files
// @desc    Get all files for a user
// @access  Private
router.get('/', protect, getFiles);

// @route   POST /api/files/:id/move
// @desc    Move a file to a folder
// @access  Private
router.put('/:id/move', protect, moveFile);

router.get('/search', protect, searchFiles);

router.get('/storage-usage', protect, getStorageUsage);

module.exports = router;
