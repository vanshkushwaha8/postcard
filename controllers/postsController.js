import { comparePassword, hashedPassword } from '../helpers/authhelper.js';
import userModel from '../models/userModel.js';
import PostCard from '../models/postModel.js';
import JWT from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { userValidation } from '../validation/validation.js';  

// Controller for register
export const registerController = async (req, res) => {
    try {
        // Validate request body
        const { error } = userValidation.validate(req.body, { abortEarly: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message }); // Show first error only
        }

        const { username, email, password, phone, address } = req.body;

        // Check existing user
        const existingUserEmail = await userModel.findOne({ email });
        if (existingUserEmail) {
            return res.status(400).json({ success: false, message: 'This email is already registered, use a different one' });
        }

        // Hash password and save user
        const hashedPasswords = await hashedPassword(password);
        const user = new userModel({ username, email, phone, address, password: hashedPasswords });
        await user.save();

        res.status(201).json({ success: true, message: "User registered successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Registration failed', error });
    }
};

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
      const match = await comparePassword(password,user.password) 
      if(!match){
        return res.status(200).send({
            success:false,
            message:'Incorrect password'
        })
      }
      //create jwt token 
      const token = JWT.sign(
        { 
            _id: user._id,
            role: user.role  // Add role to token payload
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
    );
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


// Logout Controller
export const logoutController = (req, res) => {
    res.clearCookie('token').json({ message: 'Logged out successfully' });
};

// Forgot Password Controller
export const forgotPasswordController = async (req, res) => {
    try {
        // Validate email first
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        // Check user exists
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "Reset email sent if account exists" });

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save({ validateBeforeSave: false });

        // Verify environment variables exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email credentials not configured');
        }

        // Configure transporter (WORKING CONFIG)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
                clientId: process.env.OAUTH_CLIENT_ID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('SMTP connection ready');

        // Send email
        await transporter.sendMail({
            from: `"Your App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset',
            text: `Reset token: ${resetToken}`,
            html: `<b>Reset Token:</b> ${resetToken}`
        });

        res.json({ success: true, message: "Reset email sent" });
    } catch (error) {
        console.error('Password Reset Error:', error);
        res.status(500).json({
            success: false,
            message: "Password reset failed",
            error: error.message,
            solution: "Verify Gmail credentials and enable less secure apps"
        });
    }
};
// Reset Password Controller
export const resetPasswordController = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Validate input
        if (!token || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: "Token and new password are required" 
            });
        }

        // Find user with valid token
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`Invalid token attempt: ${token}`);
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired token" 
            });
        }

        // Update password
        user.password = await hashedPassword(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save with validation
        await user.save({ validateModifiedOnly: true });
        
        console.log(`Password updated for user: ${user.email}`);
        res.json({ 
            success: true,
            message: "Password reset successful" 
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ 
            success: false,
            message: "Password reset failed",
            error: error.message 
        });
    }
};
export const testRouters = (req,res)=>{
        res.send('this is protected')
}
// Post Controllers
export const createPost = async (req, res) => {
    try {
        const post = await PostCard.create({
            ...req.body,
            imageURL: req.file?.path,
            user: req.user._id
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Post creation failed' });
    }
};

export const getPosts = async (req, res) => {
    try {
        res.json(await PostCard.find().populate('user', 'username'));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch posts' });
    }
};

export const updatePost = async (req, res) => {
    try {
        const post = await PostCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(post || { message: 'Post not found' });
    } catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
};

export const deletePost = async (req, res) => {
    try {
        await PostCard.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Deletion failed' });
    }
};
