const File = require('../models/File');
const { uploadFile, deleteFile } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');  

exports.uploadFile = async (req, res) => {
    const { originalname, buffer, mimetype } = req.file;
    const userId = req.user.id;

    try {
        // Upload the file to S3 using the service
        const s3Response = await uploadFile(buffer, originalname);

        // Save file metadata to MongoDB
        const file = new File({
            user: userId,
            fileName: originalname,
            s3Key: s3Response.Key,
            s3Url: s3Response.Location,
            fileType: mimetype,
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
