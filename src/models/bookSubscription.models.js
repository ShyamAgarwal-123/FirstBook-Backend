import mongoose from "mongoose";


const bookSubscriptionSchema = new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    book:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Book"
    }
},{timestamps:true})

export const BookSubscription = mongoose.model("BookSubscription",bookSubscriptionSchema)



 