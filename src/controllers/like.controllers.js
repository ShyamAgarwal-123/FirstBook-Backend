import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Review } from "../models/review.models.js"



const toggleReviewLike = asyncHandler(async (req, res) => {

    const {reviewId} = req.params
    if (!isValidObjectId(reviewId)) {
        throw new ApiError(401,"invalid reviewId recevied")
    }
    try {
        const review = await Review.findById(reviewId)
        const existingLike = await Like.findOne({owner: req.user?._id,review:reviewId});
        if (existingLike) {
            const removedLike = await Like.findByIdAndDelete(existingLike?._id)
            if (!removedLike) {
                throw new ApiError(500,"Something went wrong While removing a like data")
            }
            return res.status(200).json(new ApiResponse(200,{},"Like is Removed Successfully"))
        }
        else{
            const like = await Like.create(
                {
                    owner: new mongoose.Types.ObjectId(req.user?._id),
                    review: new mongoose.Types.ObjectId(reviewId),
                    book: new mongoose.Types.ObjectId(review.book) 
                }
            )
            if (!like) {
                throw new ApiError(500,"Something went wrong while creating a like data")
            }
            return res.status(200)
            .json(
                new ApiResponse(200,like,"Like is Successfully saved")
            )
        }
    } catch (error) {
        throw new ApiError(402,error)
    }

    //TODO: toggle like on review
})

export {toggleReviewLike}