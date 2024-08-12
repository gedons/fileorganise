const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    folderName: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    }
}, {
    timestamps: true
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
