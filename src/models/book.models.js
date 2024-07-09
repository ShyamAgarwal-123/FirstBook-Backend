import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const bookSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true,"title is Required"],
        index: true,
        trim: true,
    },
    coverImage:{
        type:String,//from cloudinary
        required:true
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

bookSchema.plugin(mongooseAggregatePaginate)


export const Book = mongoose.model("Book",bookSchema);