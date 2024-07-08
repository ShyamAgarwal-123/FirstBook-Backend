import mongoose from "mongoose";


const dislikeSchema = new mongoose.Schema({

},{timestamps:true})



export const Dislike = mongoose.model("Dislike",dislikeSchema);