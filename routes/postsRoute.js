import express from 'express';
const router = express.Router();
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../controllers/postsController.js';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/temporaryimage/');
    },
    filename: (req, file, cb) => {
        const suffix = Date.now();
        cb(null, suffix + '_' + file.originalname);
    }
}); 

const upload = multer({ storage });

// POST endpoint to create a new post
router.post('/create', upload.single('imageURL'), createPost);

// GET endpoint to fetch all posts
router.get('/posts', getPosts);

// GET endpoint to fetch a post by ID
router.get('/posts/:id', getPostById);

// PUT endpoint to update a post
router.put('/posts/:id', upload.single('imageURL'), updatePost);

// DELETE endpoint to delete a post
router.delete('/posts/:id', deletePost);

export default router;
