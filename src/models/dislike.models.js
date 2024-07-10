import mongoose from "mongoose";


const dislikeSchema = new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    review:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review"
    },
    book:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Book"
    }
},{timestamps:true})



export const Dislike = mongoose.model("Dislike",dislikeSchema);