const File = require('../models/File');
const { uploadFile, moveFile, deleteFile } = require('../services/s3Service');
  

exports.uploadFile = async (req, res) => {
    const { originalname, buffer, mimetype } = req.file;
    const userId = req.user.id;
    const folderPath = req.body.folderPath || '';   
    const folderId = req.body.folderId || null;  

    try {
        // Upload the file to S3, include folder path in the key
        const s3Response = await uploadFile(buffer, originalname, folderPath);

        // Save file metadata to MongoDB
        const file = new File({
            user: userId,
            fileName: originalname,
            s3Key: s3Response.Key,
            s3Url: s3Response.Location,
            fileType: mimetype,
            folder: folderId   
        });

        await file.save();

        res.status(201).json({
            message: 'File uploaded successfully',
            file,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Move a file to a folder
exports.moveFile = async (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;
    const { destinationFolder, folderId } = req.body;

    try {
        const file = await File.findById(fileId);

        if (!file || file.user.toString() !== userId) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Encode the S3 key
        const encodedKey = encodeURIComponent(file.s3Key);

        // Log the current key and destination for debugging
        console.log('Original S3 Key:', encodedKey);
        console.log('Destination Folder:', destinationFolder);

        // Move the file in S3 (copy to new location)
        const newKey = await moveFile(encodedKey, destinationFolder);

        // Delete the file from the original location
        await deleteFile(file.s3Key);

        // Update the file record in MongoDB
        file.s3Key = newKey;
        file.s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${newKey}`;
        file.folder = folderId || null;
        await file.save();

        res.json({ message: 'File moved successfully', file });
    } catch (error) {
        console.error('Error moving file:', error.message);
        res.status(500).send('Server error');
    }
};


exports.deleteFile = async (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  try {
    const file = await File.findById(fileId);

    if (!file || file.user.toString() !== userId) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file from S3
    await deleteFile(process.env.S3_BUCKET_NAME, file.s3Key);

    // Delete the file record from MongoDB
    await File.findByIdAndDelete(fileId); 

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

exports.getFiles = async (req, res) => {
    const userId = req.user.id;

    try {
        const files = await File.find({ user: userId });
        res.json(files);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};


// Search files by name, filter by file type or date added
exports.searchFiles = async (req, res) => {
    const { fileName, fileType, startDate, endDate } = req.query;

    // Build query object
    let query = {};

    if (fileName) {
        query.fileName = new RegExp(fileName, 'i');  
    }

    if (fileType) {
        query.fileType = fileType;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.createdAt.$lte = new Date(endDate);
        }
    }

    try {
        const files = await File.find(query).exec();

        res.json(files);
    } catch (error) {
        console.error('Error searching files:', error.message);
        res.status(500).send('Server error');
    }
};






