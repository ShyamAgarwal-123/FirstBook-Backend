import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {Book} from "../models/book.models.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.models.js";
import mongoose, { mongo } from "mongoose";

// controller for publishing a book
const publishABook = asyncHandler( async (req,res)=>{
    const user_id = new mongoose.Types.ObjectId(req.user?._id)
    const { title, content , genre , price} = req.body
    if (
        [title,content,genre,price].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400,"All Field is Required")
    }
    const existingBook = await Book.findOne({title: title})
    if (existingBook) {
        throw new ApiError(409,"Username or Email already exists")

    }
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image is Required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
        throw new ApiError(400,"Cover Image is Required")
    }

    const bookCreated = await Book.create({
        title,
        genre,
        content,
        price,
        coverImage : coverImage.url,
        coverImage_id : coverImage.public_id,
        author: user_id
    })
    if (!bookCreated) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(200).json(
        new ApiResponse(200,bookCreated,"Book is Successfully Published")
    )
})

// controller for updating a book
const updateBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    //TODO: update Book details like content,price

})

const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    //TODO: delete book
})

const getBookById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get book by id
})

const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all books based on query, sort, pagination
})



export {
    publishABook,
    getAllBooks,
    getBookById,
    deleteBook,
    updateBook
}