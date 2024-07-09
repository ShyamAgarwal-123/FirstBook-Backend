import mongoose from "mongoose";


const bookSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true,"title is Required"],
        index: true,
        unique:true,
        trim: true,
    },
    coverImage:{
        type:String,//from cloudinary
        required:true
    },
    coverImage_id:{
        type: String,
        required: true
    },
    genre:{
        type:String,
        required:true,
        trim: true
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    reviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review"
        }
    ]

},{timestamps:true})



export const Book = mongoose.model("Book",bookSchema);