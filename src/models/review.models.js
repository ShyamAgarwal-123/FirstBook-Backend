import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({

},{timestamps:true})



export const Review = mongoose.model("Review",reviewSchema);