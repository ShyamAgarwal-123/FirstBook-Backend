import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({
    comment:{
        type: String,
        required: true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    rating:{
        type:Number,
        required:true
    },
    book:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Book"
    }
},{timestamps:true})



export const Review = mongoose.model("Review",reviewSchema);