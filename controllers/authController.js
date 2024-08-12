const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/auth');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(payload, jwtSecret, { expiresIn: jwtExpire }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};
