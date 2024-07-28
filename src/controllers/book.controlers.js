import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {Book} from "../models/book.models.js";
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.models.js";
import mongoose ,{isValidObjectId} from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { BookSubscription } from "../models/bookSubscription.models.js";


// controller for publishing a book
const publishABook = asyncHandler( async (req,res)=>{
    const user_id = new mongoose.Types.ObjectId(`${req.user?._id}`)
    const { title, content , genre , price} = req.body
    if (
        [title,content,genre,price].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400,"All Fields are Required")
    }
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image is Required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
        throw new ApiError(500," Something Went Wrong while uploading coverImage to Cloudinary")
    }

    const bookCreated = await Book.create({
        title,
        genre,
        content,
        price,
        coverImage : coverImage.url,
        coverImage_id : coverImage.public_id,
        author: user_id,
        isAvailable:true
    })
    if (!bookCreated) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(200).json(
        new ApiResponse(200,bookCreated,"Book is Successfully Published")
    )
})

// controller for toggel a book availibility
const deleteBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params
    if (!isValidObjectId(bookId)) {
        throw new ApiError(401,"invalid bookId recevied")
    }
    try {
        const existingBook = await Book.findById(bookId);
        if(!existingBook){
            throw new ApiError(404,"Book doesnot Exist")
        }
        const isAvailable = existingBook.isAvailable
        let updatedBook;
        if (isAvailable) {
            updatedBook = await Book.findByIdAndUpdate(bookId,{
                isAvailable:false
            })
        }else{
            updatedBook = await Book.findByIdAndUpdate(bookId,{
                isAvailable:true
            })
        }
        if (!updatedBook) {
            throw new ApiError(500,"Something Went Wrong While Toggeling the book availabilty data in db")
        }
        return res.status(200).json( new ApiResponse(200,{},"Book Successfully Toggeled"))
    }catch (error) {
    throw new ApiError(401,error)
   }
})


//controller for getting a book 
const getBookById = asyncHandler(async (req, res) => {
    const currentUser = new mongoose.Types.ObjectId(req.user?._id)
    const { bookId } = req.params
    if (!isValidObjectId(bookId)) {
        throw new ApiError(402," invalid bookId recevied")
    }
    const foundedBook = await Book.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(bookId)
            }
        },
        // {
        //   $match:{
        //     isAvailable : true
        //   }
        // },
        {
            $lookup:{
                from:"users",
                localField:"author",
                foreignField:"_id",
                as:"author",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1,
                            _id:1
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
                                        _id:1
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
                            },
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
                            isDisliked:1,
                        }
                    }
                ]
            }
        },
        {
          $addFields: {
            averageRating: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $size: "$reviews"
                    },
                    0
                  ]
                },
                then: {
                  $avg: "$reviews.rating"
                },
                else: 0
              }
            },
            totalReviews: {
              $size: "$reviews"
            }
          }
        },
    ])
    if(!foundedBook){
        throw new ApiError(402,"book does not exist")
    }
    let isBought = false;
    let isFav = false;
    const bookSubscription = await BookSubscription.findOne({owner:currentUser._id,book:bookId})
    const favBook = await User.findOne({_id:currentUser._id,favouriteBooks:bookId})
    if(bookSubscription){
        isBought = true;
    }
    if(favBook){
      isFav = true;
  }
    return res.status(200).json(
        new ApiResponse(200,{foundedBook,isBought,isFav},"Book successfully fetched")
    )
})
// controllers for getting all books based on search query
const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, genre} = req.query

    // filter object
    const filter = {};
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { genre: { $regex: query, $options: 'i' } }
        ];
    }
    if (genre) {
        filter.genre = { $regex: genre, $options: 'i' };
    }
    // sort object
    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === 'asc' ? 1 : -1;
    }
    //pagination
    const skip = (page-1)*limit;

    try {
        const books = await Book.aggregate([
          {
            $match: filter,
          },
          {
            $match:{
              isAvailable : true
            }
          },
          {
            $skip: skip
          },
          {
            $limit: parseInt(limit)
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              totalReviews: {
                $size: "$reviews"
              }
            }
          },
          {
            $lookup: {
              from: "reviews",
              localField: "reviews",
              foreignField: "_id",
              as: "reviews",
              pipeline: [
                {
                  $project: {
                    rating: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              author: {
                $first: "$author"
              }
            }
          },
          {
            $addFields: {
              averageRating: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $size: "$reviews"
                      },
                      0
                    ]
                  },
                  then: {
                    $avg: "$reviews.rating"
                  },
                  else: 0
                }
              }
            }
          },
          {
            $project: {
              author: 1,
              totalReviews: 1,
              title: 1,
              coverImage: 1,
              price: 1,
              averageRating: 1,
              genre: 1,
              isAvailable: 1
            }
          },
          {
            $sort: sort 
          }
        ]);
        const totalBooks = (await Book.find({isAvailable : true})).length;

        return res
        .status(200)
        .json( new ApiResponse(
            200,
            {
                books,
                totalPages: Math.ceil(totalBooks / limit) || 1,
                currentPage: parseInt(page),
            },
            "Books fetched Successfully"))

    } catch (error) {
        throw new ApiError(500,error.message)
    }
})
//controllers for getting 10 books
const bookList = asyncHandler( async (req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = parseInt((page - 1) * limit)
  
    try {
        const books = await Book.aggregate(
            [
                {
                  "$skip": skip
                },
                {
                  "$limit": limit
                },
                {
                  "$lookup": {
                    "from": "users",
                    "localField": "author",
                    "foreignField": "_id",
                    "as": "author",
                    "pipeline": [
                      {
                        "$project": {
                          "_id": 1,
                          "username": 1,
                          "fullname": 1,
                          "avatar": 1
                        }
                      }
                    ]
                  }
                },
                {
                  "$addFields": {
                    "totalReviews": {
                      "$size": "$reviews"
                    }
                  }
                },
                {
                  "$lookup": {
                    "from": "reviews",
                    "localField": "reviews",
                    "foreignField": "_id",
                    "as": "reviews",
                    "pipeline": [
                      {
                        "$project": {
                          "rating": 1
                        }
                      }
                    ]
                  }
                },
                {
                  "$addFields": {
                    "author": {
                      "$first": "$author"
                    }
                  }
                },
                {
                  "$addFields": {
                    "averageRating": {
                      "$cond": {
                        "if": {
                          "$gt": [
                            { "$size": "$reviews" },
                            0
                          ]
                        },
                        "then": {
                          "$avg": "$reviews.rating"
                        },
                        "else": null
                      }
                    }
                  }
                },
                {
                  "$project": {
                    "author": 1,
                    "totalReviews": 1,
                    "title": 1,
                    "coverImage": 1,
                    "price": 1,
                    "averageRating": 1,
                    "genre": 1,
                    "isAvailable": 1
                  }
                }
              ]
        );
      const totalBooks = await Book.countDocuments();
  
      return res.status(200)
      .json(
        new ApiResponse(
            200,
            {
                books,
                totalPages: Math.ceil(totalBooks / limit),
                currentPage: page,
            },
            `Booklist is successfully Fetched For page no.${page}`

        )
      );
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
})
// controller for saving favourite book
const saveFavouriteBook = asyncHandler(async(req,res)=>{
    const { bookId } = req.params
    const userId = new mongoose.Types.ObjectId(`${req.user?._id}`)
    if(!isValidObjectId(bookId)){
        throw new ApiError(401,"invalid bookId recevied")
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
    console.log(bookId)
    const userId = new mongoose.Types.ObjectId(`${req.user?._id}`)
    if(!isValidObjectId(bookId)){
        throw new ApiError(401,"invalid bookId recevied")
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
    removeFavouriteBook,
    bookList
}