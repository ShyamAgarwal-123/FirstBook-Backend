import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (locaFilePath)=>{
    try {
        if (!locaFilePath) return null;
        //upload the file to cloudinary
        const response = await cloudinary.uploader.upload(locaFilePath,{
            resource_type:'auto'
        })
        // remove the locally saved file as the file uploaded does not take place
        fs.unlinkSync(locaFilePath)
        //return response
        return response
    } catch (error) {
        fs.unlinkSync(locaFilePath)// remove the locally saved file as the file uploaded does not take place
        return null
    }
}

const deleteFromCloudinary = async (filePath) =>{
    try {
        if (!filePath) return null;
        await cloudinary.uploader
        .destroy(filePath,{resource_type:"image",invalidate : true })
    } catch (error) {
        throw error
    }
//.then(result => console.log(result)).catch((err)=>{console.log(err);})
}
 export {uploadOnCloudinary,deleteFromCloudinary}


    