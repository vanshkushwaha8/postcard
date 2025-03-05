 import { comparePasword, hashedPassword } from '../helpers/authhelper.js';
import userModel from '../models/userModel.js';
import PostCard from '../models/postModel.js'
import JWT from 'jsonwebtoken'
import nodemailer from 'nodemailer';
import crypto from 'crypto';

 //Controller for register
 export const registerController = async(req,res)=>{
    try {
        
        const{name,email,password,phone,address} = req.body
        if(!name){
            return res.send({error:'The name is required'})
        }
        if(!email){
            return res.send({error:'The email is required'})
        }
        if(!password){
            return res.send({error:'The pasword is required'})
        }
        if(!phone){
            return res.send({error:'The phone is required'})
        }
        if(!address){
            return res.send({error:'The adddress is required'})
        }

        //check existing user
        const existingUserEmail = await userModel.findOne({email})
   
        //condition for existing user
        if(existingUserEmail){
            return res.status(500).send({
               success:true,
               message:'This Email is Already Registered Use Different',
               
            })
        }
        
        // hashed password
        const hashedPasswords = await hashedPassword(password)
        const user = await new userModel({name,email,phone, address,password:hashedPasswords}).save()

        //user register
        res.status(201).send({
            success:true,
            message:"User register successfully",
            user
        })

        //catch of register
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'registration Failed',
            error
        })
    }
}
//controller for Login
export const loginController =async (req,res)=>{
    try {
        const {email,password} =  req.body
        //validation
        if(!email || !password){
           return  res.status(404).send({
                success:false,
                message:'Invalid Email And Password',
                
            })
        }
     //check the user is registered user or not
     const user = await userModel.findOne({email})
     if(!user){
        return res.status(404).send({
            success:false,
            message:'Email is not Registered'
        })
     }
    //comparing the compare password
      const match = await comparePasword(password,user.password) 
      if(!match){
        return res.status(200).send({
            success:false,
            message:'Incorrect password'
        })
      }
      //create jwt token 
      const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.status(200).send({
        success:true,
        message:"Login Successfully"
       
        ,token
      })
      //catch of login
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Login Failed',
            error
        })
    }
}

//


export const logoutController = async (req, res) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authorization.replace('Bearer', '').trim();
        if (!token) {
            return res.status(401).json({ message: 'Token not provided' });
        }

        // Clear the JWT token from the client's cookies
        res.clearCookie('token');

        // Optionally, add the token to a blacklist
        // This step requires additional setup and is not shown here

        res.status(200).send({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to log out' });
    }
};



//controller for forgetPasswordController
export const forgetPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1-hour expiration

        await user.save();

        // Send Reset Email (Example: Using Nodemailer)
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset.</p>
                   <p>Click <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}">here</a> to reset your password.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Reset link sent to your email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
//registerSignIn for testing routes
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user by reset token and check expiry
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token should not be expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Hash new password
        const saltRounds = 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);

        // Clear reset token fields
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const testRouters = (req,res)=>{
        res.send('this is protected')
}
//create post
export const createPost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({ success: false, message: "Unauthorized: Login required" });
        }

        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and description are required" });
        }

        const newPost = new PostCard({
            title,
            description,
            imageURL: req.file?.originalname || null,
            user: req.user._id, // Associate post with the logged-in user
        });

        await newPost.save();
        return res.status(201).json({ success: true, message: "Post created successfully", data: newPost });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to create post" });
    }
};

// Get posts
export const getPosts = async (req, res) => {
    try {
        const posts = await PostCard.find();
        return res.status(200).json({ success: true, data: posts });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
};

// Get post by ID
export const getPostById = async (req, res) => {
    try {
        const post = await PostCard.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        return res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
};

// Update post
export const updatePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({ success: false, message: "Unauthorized: Login required" });
        }

        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: "Title and description are required" });
        }

        const updatedPost = await PostCard.findByIdAndUpdate(req.params.id, { title, description }, { new: true });
        if (!updatedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        return res.status(200).json({ success: true, data: updatedPost });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to update post" });
    }
};


// Delete post
export const deletePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({ success: false, message: "Unauthorized: Login required" });
        }

        const deletedPost = await PostCard.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        return res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to delete post" });
    }
};
