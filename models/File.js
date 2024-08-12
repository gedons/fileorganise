const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    s3Key: {
        type: String,
        required: true,
    },
    s3Url: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const File = mongoose.model('File', FileSchema);
module.exports = File;
