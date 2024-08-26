const User = require('../models/User');

const checkStorageLimit = async (req, res, next) => {
    const userId = req.user.id;
    const { size } = req.file;

    try {
        const user = await User.findById(userId);
        if (user.storageUsed + size > user.storageLimit) {
            return res.status(403).json({ message: 'Storage limit exceeded. Please upgrade your plan.' });
        }
        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = checkStorageLimit;
