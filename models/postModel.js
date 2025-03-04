import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title:{
        type :String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imageURL:{
        type:String
        
    }
},{timestamps:true})

const PostCard= mongoose.model('postcards',postSchema);
export default PostCard;
 