const express = require('express');
const router = express.Router();
const { createFolder, renameFolder, deleteFolder, getAllFoldersWithFiles } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/folders
// @desc    Create a folder
// @access  Private
router.post('/', protect, createFolder);

// @route   PUT /api/folders/rename
// @desc    Rename a folder
// @access  Private
router.put('/rename', protect, renameFolder);

// @route   DELETE /api/folders
// @desc    Delete a folder
// @access  Private
router.delete('/:folderId', protect, deleteFolder);

// @route   GET /api/folders
// @desc    Get all folders with their files
// @access  Private
router.get('/', protect, getAllFoldersWithFiles);

module.exports = router;
