const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); 
const mime = require('mime-types'); 
const s3 = new AWS.S3();



// Upload a file to S3
const uploadFile = async (fileContent, originalFileName, folderPath = '') => {
    const bucketName = process.env.S3_BUCKET_NAME;
    const keyName = folderPath ? `${folderPath}/${uuidv4()}-${originalFileName}` : `${uuidv4()}-${originalFileName}`;

    const params = {
        Bucket: bucketName,
        Key: keyName,
        Body: fileContent,
        ContentType: mime.lookup(originalFileName) || 'application/octet-stream',
    };

    try {
        const data = await s3.upload(params).promise();
        return data;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file');
    }
};

// Move an existing file to a folder
const moveFile = async (originalKey, destinationFolder) => {
    const bucketName = process.env.S3_BUCKET_NAME;
    const newKey = `${destinationFolder}/${originalKey.split('/').pop()}`;

    // Copy the file to the new location
    await s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/${originalKey}`,
        Key: newKey
    }).promise();

    // Delete the original file
    await s3.deleteObject({
        Bucket: bucketName,
        Key: originalKey
    }).promise();

    return newKey;
};

const deleteFile = async (key) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`Deleted file from S3: ${key}`);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};

// Create a folder (simulated by uploading a marker file with a trailing slash)
const createFolderInS3 = async (folderPath) => {
    if (!folderPath || typeof folderPath !== 'string') {
        throw new Error('Invalid folder path');
    }

    // Ensure the folder path ends with a slash
    const keyName = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${keyName}folder_marker.txt`, 
        Body: '', 
        ContentType: 'text/plain',
    };

    try {
        await s3.upload(params).promise();
        return { key: keyName };
    } catch (error) {
        console.error('Error creating folder in S3:', error);
        throw new Error('Failed to create folder');
    }
};

// Rename a folder (by renaming all objects with the old prefix)
const renameFolderInS3 = async (oldFolderPath, newFolderPath) => {
    if (!oldFolderPath || !newFolderPath) {
        throw new Error('Invalid folder paths');
    }

    // Ensure paths end with a slash
    const oldPrefix = oldFolderPath.endsWith('/') ? oldFolderPath : `${oldFolderPath}/`;
    const newPrefix = newFolderPath.endsWith('/') ? newFolderPath : `${newFolderPath}/`;

    const bucketName = process.env.S3_BUCKET_NAME;

    // List all objects with the old folder path prefix
    const listParams = {
        Bucket: bucketName,
        Prefix: oldPrefix,
    };

    try {
        const listedObjects = await s3.listObjectsV2(listParams).promise();

        if (listedObjects.Contents.length === 0) {
            return;
        }

        // Copy each object to the new folder path
        for (const obj of listedObjects.Contents) {
            const copySource = `${bucketName}/${obj.Key}`;
            const newKey = obj.Key.replace(oldPrefix, newPrefix);

            await s3.copyObject({
                Bucket: bucketName,
                CopySource: copySource,
                Key: newKey,
            }).promise();

            // Delete the old object
            await s3.deleteObject({
                Bucket: bucketName,
                Key: obj.Key,
            }).promise();
        }
    } catch (error) {
        console.error('Error renaming folder in S3:', error);
        throw new Error('Failed to rename folder');
    }
};

// Delete a folder (by deleting all objects with the prefix)
const deleteFolderFromS3 = async (folderPath) => {
    if (!folderPath) {
        throw new Error('Invalid folder path');
    }

    // Ensure the folder path ends with a slash
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    const bucketName = process.env.S3_BUCKET_NAME;

    // List all objects with the folder path prefix
    const listParams = {
        Bucket: bucketName,
        Prefix: prefix,
    };

    try {
        const listedObjects = await s3.listObjectsV2(listParams).promise();

        if (listedObjects.Contents.length === 0) {
            return;
        }

        // Delete each object
        for (const obj of listedObjects.Contents) {
            await s3.deleteObject({
                Bucket: bucketName,
                Key: obj.Key,
            }).promise();
        }
    } catch (error) {
        console.error('Error deleting folder from S3:', error);
        throw new Error('Failed to delete folder');
    }
};


module.exports = {
    uploadFile,
    moveFile,
    deleteFile,
    createFolderInS3,
    renameFolderInS3,
    deleteFolderFromS3
};
