import mongoose from 'mongoose';
import colors from 'colors'
import dotenv from 'dotenv'

dotenv.config();

const connectionDB = async ()=>{
    try{
      const conn = await mongoose.connect(process.env.MONGO_URL);
      console.log(`Connection SuccessFul with MongoDB ${conn.connection.host}`.bgYellow )
    }catch(error){
       console.log(`Connextion Failed With MongoDB ${error}`)
    }
    
}
export default connectionDB;