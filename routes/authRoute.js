import express, { Router } from 'express'
import {registerController,loginController,forgetPasswordController,testRouters,logoutController,createPost, getPosts, getPostById, updatePost, deletePost} from '../controllers/authController.js'
import { isAdmin, registerSignIn,authenticate } from '../middleware/authMiddleware.js';
import multer from 'multer';
const router = express.Router();
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


//post method/register
router.post('/register',registerController)

//post method/login
router.post('/login',loginController)

//logout 
router.post('/logout',authenticate,logoutController)
//post for forget Password
router.post('/forget',forgetPasswordController)


//registerSign Route for authenication
router.get('/middleware',registerSignIn,isAdmin, testRouters)

// POST endpoint to create a new post
router.post('/create',authenticate, upload.single('imageURL'), createPost);

// GET endpoint to fetch all posts
router.get('/posts', getPosts);

// GET endpoint to fetch a post by ID
router.get('/posts/:id', getPostById);

// PUT endpoint to update a post
router.put('/posts/:id',authenticate, upload.single('imageURL'), updatePost);

// DELETE endpoint to delete a post
router.delete('/posts/:id',authenticate, deletePost);


export default router;