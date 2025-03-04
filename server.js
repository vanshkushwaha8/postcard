import express from 'express';
import colors from 'colors';
import dotenv from 'dotenv';
import morgan from 'morgan'
import connectionDB from './config/db.js';
import authRoutes from './routes/authRoute.js'

//config .env
dotenv.config();


//connection of database
connectionDB();
const app = express();
//middleware
app.use(express.json())
app.use(morgan('dev'))
// All routes
app.use('/api/v1/auth',authRoutes)
//rest api
app.get('/',(req,res)=>{
    res.send("<h1>Welcome to ecommerce project")
});

const PORT = process.env.PORT || 9090;

app.listen(PORT , ()=>{
    console.log(`The Server Is Running On ${process.env.DEV_MODE} mode  ${PORT}`.bgGreen)
})