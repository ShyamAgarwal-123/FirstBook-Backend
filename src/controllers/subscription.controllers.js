import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {clickedUserId} = req.params
    if (!isValidObjectId(clickedUserId)) {
        throw new ApiError(401,"invalid clickedUserId recevied")
    }
    const existingSubscription = await Subscription.findOne({follower:req.user?._id,followedTo:clickedUserId})
    if (existingSubscription) {
        const deletedSubscription = await Subscription.findByIdAndDelete(existingSubscription._id)
        if (!deletedSubscription) {
            throw new ApiError(500,"Something went Wrong While removing the Subscription")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Subscription is Successfully removed")
        )

    }else{
        const newSubscription = await Subscription.create(
            {
                follower:req.user?._id,
                followedTo:clickedUserId
            }
        )
        if (!newSubscription) {
            throw new ApiError(500,"Something went Wrong While creating a Subscription")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,newSubscription,"Subscription is Successfully removed")
        )
    }
    
    // TODO: toggle subscription
})

// controller to return Followers list of a clickedUserProfile
const getUserProfileFollowers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return users list to which clickedUserProfile has followed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {toggleSubscription}