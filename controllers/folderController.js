const Folder = require('../models/Folder');
const File = require('../models/File');
const { createFolderInS3, renameFolderInS3, deleteFolderFromS3 } = require('../services/s3Service');

// Create a folder
exports.createFolder = async (req, res) => {
    const { folderName, parentFolderId } = req.body;
    const userId = req.user.id;

    if (!folderName) { 
        return res.status(400).json({ message: 'Folder name is required' });
    }

    try {
        const parentFolder = parentFolderId ? await Folder.findById(parentFolderId) : null;
        const parentFolderPath = parentFolder ? parentFolder.s3Key : '';
        const s3Key = `${parentFolderPath}${folderName}/`;

        await createFolderInS3(s3Key);

        const folder = new Folder({
            user: userId,
            folderName,
            s3Key,
            parentFolder: parentFolderId || null
        });

        await folder.save();

        res.status(201).json({
            message: 'Folder created successfully',
            folder
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Rename a folder
exports.renameFolder = async (req, res) => {
    const { folderId, newFolderName } = req.body;

    if (!folderId || !newFolderName) {
        return res.status(400).json({ message: 'Folder ID and new folder name are required' });
    }

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        const newS3Key = folder.s3Key.replace(folder.folderName, newFolderName);
        await renameFolderInS3(folder.s3Key, newS3Key);

        folder.folderName = newFolderName;
        folder.s3Key = newS3Key;
        await folder.save();

        res.json({
            message: 'Folder renamed successfully',
            folder
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
    const { folderId } = req.params;

    if (!folderId) {
        return res.status(400).json({ message: 'Folder ID is required' });
    }

    try {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Delete folder from S3
        await deleteFolderFromS3(folder.s3Key);

        // Delete folder from MongoDB
        await Folder.deleteOne({ _id: folderId });

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};


exports.getAllFoldersWithFiles = async (req, res) => {
    const userId = req.user.id;
    try {
        // Fetch all folders
        const folders = await Folder.find({ user: userId }).populate('parentFolder');

        // Fetch all files and populate the folder they belong to
        const files = await File.find({}).populate('folder');

        // Structure the response, ensuring files are associated with their respective folders
        const folderData = folders.map(folder => {
            return {
                ...folder._doc,
                files: files.filter(file => file.folder && file.folder._id.toString() === folder._id.toString())
            };
        });

        res.json(folderData);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};


