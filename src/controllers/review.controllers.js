import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Review } from "../models/review.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Book} from "../models/book.models.js";

// controller for submiting a review
const submitReview = asyncHandler(async (req,res)=>{
    const {comment , rating} = req.body
    const { bookId } = req.params

    if(!bookId){
        throw new ApiError(401,"Invalid Request")
    }
    const book = await Book.findById(bookId)
    if(!book){
        throw new ApiError(404,"Book does not Exist")
    }
    if (!book.isAvailable) {
        throw new ApiError(400,"Book is not Available")
    }
    if(comment?.trim() ==="" || rating?.trim() ===""){
        throw new ApiError(400,"All Fields are Required")
    }

    const review = await Review.create(
        {
            comment,
            rating,
            owner : new mongoose.Types.ObjectId(req.user?._id),
            book: new mongoose.Types.ObjectId(bookId)
        }
    )
    if (!review) {
        throw new ApiError(500,"Something went wrong while creating a review document ")
    }
    return res
    .status(200)
    .json(
        new ApiError(200,review,"review is successfully submited")
    )    
})

// controller for deleting a review
const deleteReviewById = asyncHandler(async (req,res)=>{
    const {reviewId} = req.params
    if (!isValidObjectId(reviewId)) {
        throw new ApiError(400,"Invalid review Id")
    }
    const review = await Review.findById(reviewId)
    if (!review) {
        throw new ApiError(404,"Review Does not Exist")
    }
    if(review.owner !== new mongoose.Types.ObjectId(req.user?._id)){
        throw new ApiError(401,"Unauthorised Request")
    }
    const updatedBook = await Book.updateOne({reviews:reviewId},{
        $pull:{
            reviews: reviewId
        }
    })
    if (!updatedBook) {
        throw new ApiError(500,"Something went wrong while deleting the review")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Successfully deleted the review")
    )


})

// controller for updating the review
const updateReviewById = asyncHandler(async(req,res)=>{

    const {reviewId} = req.params
    const {comment,rating } = req.body
    const review = await Review.findById(reviewId)
    if (!review) {
        throw new ApiError(404,"Review Does not Exist")
    }
    if(review.owner !== new mongoose.Types.ObjectId(req.user?._id)){
        throw new ApiError(401,"Unauthorised Request")
    }
    if(comment?.trim() ==="" || rating?.trim() ===""){
        throw new ApiError(400,"All Fields are Required")
    }

    const updatedReview = await Review.findByIdAndUpdate(reviewId,{
        $set:{
            comment,
            rating
        }
    },
    {new: true}
    )

    if (!updatedReview) {
        throw new ApiResponse(500,"Something went Wrong while updatig the review")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,updatedReview,"Successfully Updated the Review")
    )
})


export {
    submitReview,
    deleteReviewById,
    updateReviewById
}