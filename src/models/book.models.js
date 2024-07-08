import mongoose from "mongoose";


const bookSchema = new mongoose.Schema({

},{timestamps:true})



export const Book = mongoose.model("Book",bookSchema);