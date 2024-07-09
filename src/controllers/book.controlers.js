import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {Book} from "../models/book.models.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.models.js";
import mongoose, { mongo } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

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

// controller for deleting a book
const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!bookId) {
        throw new ApiError(401,"Invalid Delete Request")
    }
    await Book.findByIdAndDelete(bookId)
    return res.status(200).json( new ApiResponse(200,{},"Book Successfully Deleted"))
})


//controller for getting a book 
const getBookById = asyncHandler(async (req, res) => {
    const currentUser = new mongoose.Types.ObjectId(req.user?._id)
    const { bookId } = req.params
    if (!bookId) {
        throw new ApiError(401,"bookId doesnot recevied")
    }
    const foundedBook = await Book.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(bookId)
            }
        },
        {
            $lookup:{
                from:"User",
                localField:"author",
                foreignField:"_id",
                as:"author",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1,
                        }
                    }
                ]

            }
        },
        {
            $lookup:{
                from:"reviews",
                localField:"reviews",
                foreignField:"_id",
                as:"reviews",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"review",
                            as:"likes"
                        }
                    },
                    {
                        $lookup:{
                            from:"dislikes",
                            localField:"_id",
                            foreignField:"review",
                            as:"dislikes"
                        } 
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            },
                            totalLikes:{
                                $size: "$likes"
                            },
                            totalDislikes:{
                                $size: "$dislikes"
                            },
                            isLiked:{
                                $cond:{
                                    if:{$in :[currentUser,"$likes.owner"]},
                                    then: true,
                                    else: false
                                }
                            },
                            isDisliked:{
                                $cond:{
                                    if:{$in :[currentUser,"$dislikes.owner"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            totalDislikes:1,
                            totalLikes:1,
                            owner:1,
                            rating:1,
                            comment:1,
                            isLiked:1,
                            isDisliked:1
                        }
                    }
                ]
            }
        }
    ])

    if(!foundedBook){
        throw new ApiError(401,"book does not exist")
    }
    return res.status(200).json(
        new ApiResponse(200,foundedBook,"Book successfully fetched")
    )
})

const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all books based on query, sort, pagination
})

const saveFavouriteBook = asyncHandler(async(req,res)=>{
    const { bookId } = req.params
    const userId = new mongoose.Types.ObjectId(`${req.user?._id}`)
    if(!bookId){
        throw new ApiError(401,"Invalid save to favourites request")
    }
    const foundedBook = await Book.findById(bookId)
    if(!foundedBook){
        throw new ApiError(401,"Book does not exist")
    }
    const user = await User.findOne({ _id: userId , favouriteBooks: foundedBook._id })
    if (user) {
        throw new ApiError(401,"Invalid request")
    }
    await User.findByIdAndUpdate(req.user?._id,{
        $push:{
            favouriteBooks : foundedBook._id
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{},"successfully saved to favourites"))

})
// controller for removing favourite book
const removeFavouriteBook = asyncHandler( async (req,res)=>{
    const { bookId } = req.params
    const userId = new mongoose.Types.ObjectId(`${req.user?._id}`)
    if(!bookId){
        throw new ApiError(401,"Invalid request")
    }
    const foundedBook = await Book.findById(bookId)
    if(!foundedBook){
        throw new ApiError(401,"Book does not exist")
    }
    const user = await User.findOne({ _id: userId , favouriteBooks: foundedBook._id })
    if (!user) {
        throw new ApiError(401,"Invalid request")
    }
    await User.updateOne({_id:userId},{$pull :{favouriteBooks:foundedBook._id}})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"successfully removed from favourites"))
})



export {
    publishABook,
    getAllBooks,
    getBookById,
    deleteBook,
    saveFavouriteBook,
    removeFavouriteBook
}