import express from 'express';
import {
  registerController,
  loginController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  createPost,
  getPosts,
  updatePost,
  deletePost
} from '../controllers/authController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const suffix = Date.now();
    cb(null, `${suffix}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// Authentication Routes
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', authenticate, logoutController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

// Test Protected Route
router.get('/test', authenticate, isAdmin, (req, res) => {
  res.json({ message: 'Protected admin route' });
});

// Post Routes
router.route('/posts')
  .post(authenticate, upload.single('image'), createPost)
  .get(getPosts);

router.route('/posts/:id')
  .put(authenticate, upload.single('image'), updatePost)
  .delete(authenticate, deletePost);

export default router;
