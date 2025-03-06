import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Unified authentication middleware
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'Authorization token required' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        
        // Attach full user data to request
        const user = await userModel.findById(decoded._id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication Error:', error.message);
        
        const message = error.name === 'JsonWebTokenError' 
            ? 'Invalid token' 
            : 'Session expired';
            
        res.status(401).json({ 
            success: false,
            message 
        });
    }
};

// Admin check middleware
export const isAdmin = (req, res, next) => {
    if (req.user?.role !== 1) {
        return res.status(403).json({ 
            success: false,
            message: 'Admin access required' 
        });
    }
    next();
};
