import mongoose from "mongoose"
import { Book } from "../models/book.models"
import {BookSubscription} from "../models/bookSubscription.models.js"
import { ApiError } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"




// controller to buy a book
const bookSubscription = asyncHandler( async (req,res) =>{
    const {bookId} = req.params
    if (!isValidObjectId(bookId)) {
        throw new ApiError(400," invalid bookId recevied")
    }
    const book = await Book.findById(bookId);
    if(!book){
        throw new ApiError(404,"Book doesnot Exist")
    }
    const existingSubscription  = await BookSubscription.findOne({owner: req.user?._id,book:bookId})
    if(existingSubscription){
        throw new ApiError(401,"Book Already Bought")
    }
    const newBookSubscription = await BookSubscription.create({
        owner: new mongoose.Types.ObjectId(req.user?._id),
        book: new mongoose.Types.ObjectId(bookId)
    })
    if (!newBookSubscription) {
        throw new ApiError(500,"Something went Wrong While Storing the bookSubscription data")
    }
    return res.status(200,
        new ApiResponse(200,newBookSubscription,"Book Successfully Purchased")
    )
})



export {
    bookSubscription
}