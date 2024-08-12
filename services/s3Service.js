const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); 
const mime = require('mime-types'); 
const s3 = new AWS.S3();



// Upload a file to S3
const uploadFile = async (fileContent, originalFileName) => {
    const bucketName = process.env.S3_BUCKET_NAME;  
    const keyName = `${uuidv4()}-${originalFileName}`;  

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

// Delete a file from S3
const deleteFile = async (keyName) => {
    const bucketName = process.env.S3_BUCKET_NAME; 

    const params = {
        Bucket: bucketName,
        Key: keyName,
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`File deleted successfully: ${keyName}`);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file');
    }
};

module.exports = {
    uploadFile,
    deleteFile,
};
