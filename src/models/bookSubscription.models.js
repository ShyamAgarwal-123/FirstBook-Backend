import mongoose from "mongoose";


const bookSubscriptionSchema = new mongoose.Schema({

},{timestamps:true})

export const BookSubscription = mongoose.model("BookSubscription",bookSubscriptionSchema)