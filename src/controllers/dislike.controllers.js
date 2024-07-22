import mongoose ,{isValidObjectId} from "mongoose"
import { Dislike } from "../models/dislike.models.js"
import { ApiError } from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Review } from "../models/review.models.js"



const toggleReviewDislike = asyncHandler(async (req, res) => {

    const {reviewId} = req.params
    if (!isValidObjectId(reviewId)) {
        throw new ApiError(401,"invalid reviewId recevied")
    }
    try {
        const review  = await Review.findById(reviewId);
        const existingDislike = await Dislike.findOne({owner: req.user?._id,review:reviewId});
        if (existingDislike) {
            const removeDislike = await Dislike.findByIdAndDelete(existingDislike?._id)
            if (!removeDislike) {
                throw new ApiError(500,"Something went wrong while removing Dislike data")
            }
            return res.status(200).json(new ApiResponse(200,{},"Dislike is Removed Successfully"))
        }
        else{
            const dislike = await Dislike.create(
                {
                    owner: new mongoose.Types.ObjectId(req.user?._id),
                    review: new mongoose.Types.ObjectId(reviewId),
                    book: new mongoose.Types.ObjectId(review.book)
                }
            )
            if (!dislike) {
                throw new ApiError(500,"Something went wrong while creating a Dislike data")
            }
            return res.status(200)
            .json(
                new ApiResponse(200,dislike,"Dislike is Successfully saved")
            )
        }
    } catch (error) {
        throw new ApiError(402,error)
    }

    //TODO: toggle dislike on review
})

export {toggleReviewDislike}