import { Book } from "../models/book.models.js"
import {BookSubscription} from "../models/bookSubscription.models.js"
import { ApiError } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose, {isValidObjectId} from "mongoose"




// controller to buy a book
const bookSubscription = asyncHandler( async (req,res) =>{
    try {
        const { bookId } = req.params;

        if (!isValidObjectId(bookId)) {
            return next(new ApiError(400, "Invalid bookId received"));
        }

        const existingSubscription = await BookSubscription.findOne({ owner: req.user?._id, book: bookId });

        if (existingSubscription) {
            return next(new ApiError(402, "Book Already Bought"));
        }

        const newBookSubscription = await BookSubscription.create({
            owner: new mongoose.Types.ObjectId(req.user?._id),
            book: new mongoose.Types.ObjectId(bookId)
        });

        if (!newBookSubscription) {
            return next(new ApiError(500, "Something went wrong while storing the bookSubscription data"));
        }

        return res.status(200).json(new ApiResponse(200, newBookSubscription, "Book Successfully Purchased"));
    } catch (error) {
        console.error('Error purchasing book:', error);
        return next(new ApiError(500, "Internal Server Error"));
    }
})



export {
    bookSubscription
}