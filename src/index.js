import dotenv from 'dotenv';
dotenv.config({
    path : './.env'
})
import connetDB from "./db/index.js";
import { app } from './app.js';

connetDB()
.then(()=>{
    app.on("error",(err)=>{
        console.log(`App error: ${err}`);
        throw err;
    })
    
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`server is connected at port: ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(`MongoDB connection Failed: ${err}`);
})
