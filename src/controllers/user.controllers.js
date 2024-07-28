import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fs from "fs"; 
import { BookSubscription } from "../models/bookSubscription.models.js";
import { Book } from "../models/book.models.js";

// functions for Access and Refresh Token generator
const generateAccessToken = async (userid) =>{
    try {
        const user = await User.findById(userid);
        const accessToken = user.generateAccessToken();
        return { accessToken }
    } catch (error) {
        throw new ApiError(500,"Something went Wrong while creating Access Token")
    }
}

const generateRefreshToken = async (userid) =>{
    try {
        const user = await User.findById(userid);
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        return { refreshToken }
    } catch (error) {
        throw new ApiError(500,"Something went Wrong while creating Refresh Token")
    }
}

// controller for register
const registerUser = asyncHandler( async (req,res)=>{
    //get details of user from the frontend
    const {fullname, username, email, password} = req.body
    //validation ki empty to nahi
    if (
        [fullname,username,email,password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400,"All Field is Required")
    }   
    //check if user is unique:email,username
    const existingUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    if (existingUser) {
        fs.unlinkSync(req.files.avatar[0].path)
        throw new ApiError(409,"Username or Email already exists")
    }

    //check for images,check for avatar
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is Required")
    }
    //upload on cloudinary images and avatar,check if avatar is uploaded
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400,"Avatar file is Required")
    }
    //user object creation-create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        avatar_id: avatar.public_id,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    })
    //remove the password and respone token field from the db response
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check if user is created
    if (!userCreated) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    //return response
    return res.status(200).json(
        new ApiResponse(200,{},"User is Successfully Registerd")
    )

})

// controller for login
const loginUser = asyncHandler( async (req,res)=>{ 
    //take login credentials from the user(password & (email,username))
    const {email,password} = req.body
    //check all fileds are their 
    if(password?.trim() ==="" || email?.trim() ===""){
        throw new ApiError(400,"All Fields are Required")
    }
    //validate the user from data base
    const foundedUser = await User.findOne({email : email})
    if(!foundedUser){
        throw new ApiError(404,"User not found")
    }
    const isPasswordValid = await foundedUser.isPasswordCorrect(password)
    // const isPasswordCorrect = await bcrypt.compare(password,foundedUser.password)
    if (!isPasswordValid) {
        throw new ApiError(401,"Password is incorrect")
    }
    //acceskey and refresh key 
    const {accessToken} = await generateAccessToken(foundedUser._id)
    const {refreshToken} = await generateRefreshToken(foundedUser._id)
    // login user
    const loginUser = await User.findById(foundedUser._id).select(
        "-password -refreshToken"
    )
    //create cookie option
    const option = {
        httpOnly: true,
        secure: true
    }
    //return response
    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user: loginUser,accessToken,refreshToken

            },
            "User has Successfully Logged In"
        )
    )
    
})

//controller for logout
const logOutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset : {refreshToken : 1}// removes the field from the document
    })
    const option = {
        httpOnly: true,
        secure: true,
        path: '/',
    }
    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(
        new ApiResponse(200,{},"user logged out Successfully")
    )

})

//controller for refresh AccessToken
const refreshAccessToken= asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(400,"Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const foundedUser = await User.findById(decodedToken?._id)
        if (!foundedUser) {
            throw new ApiError(400,"Invalid Refresh Token")
        }
        if (incomingRefreshToken !== foundedUser?.refreshToken) {
            throw new ApiError(400,"Reresh Token is Expired")
        }
        const {accessToken} = await generateAccessToken(foundedUser._id)
        const option = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .json(
            new ApiResponse(
                200,
            {accessToken},
            "Access Token is Successfully Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }

})


//controller for password update
const userPasswordUpdate =asyncHandler( async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    if (newPassword?.trim() === "" || oldPassword?.trim() ==="") {
        throw new ApiError(400,"Password is Required")
    }
    if (oldPassword === newPassword) {
        throw new ApiError(402,"New Password is Required") 
    }
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404,"User not found")
    }
    const isPassword = await user.isPasswordCorrect(oldPassword);

    if (!isPassword) {
        throw new ApiError(403,"Password is Incorrect")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password is Successfully Changed"
        )
    )



})

// controller for current user
const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "current user Fetched"
        )
    )
})

// controller to update avatar
const userAvatarUpdate =asyncHandler( async(req,res)=>{
    const oldAvatarFile = req.user?.avatar_id;
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is Required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400,"Avatar file is Required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar : avatar.url,
            avatar_id : avatar.public_id
        }},
        {new: true}
    ).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(402,"Something Went wrong while updatng the user details")
    }
    await deleteFromCloudinary(oldAvatarFile);
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "New Avatar is updated"
    ))
})
// controller for getting userClickedProfile
const userClickedProfile = asyncHandler(async (req,res)=>{
    const {username} =req.params
    const currentUser = new mongoose.Types.ObjectId(req.user?._id)
    if(!username){
        throw ApiError(400,"User is missing")
    }
    let profile = await User.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField:"followedTo",
                as: "followers"
            }
            
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField:"follower",
                as: "followedTo"
            }
        },
        {
            $addFields:{
                followerCount : 
                
                  {
                    $size: "$followers"
                  },
                    
                
                followedToCount:
                {
                  $size : "$followedTo"
                    
                },
                isFollower:
                {
                    $cond:{
                        if:{$in :[currentUser,"$followers.follower"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                followerCount:1,
                followedToCount:1,
                avatar:1,
                coverImage:1,
                isFollower:1,
                email:1
            }
        }
    ])
    if (!profile?.length) {
        throw new ApiError(400,"profile doesnot exist")
    }
    const clickedUserId = new mongoose.Types.ObjectId(profile[0]?._id);
    const books = await Book.aggregate([
        {
            $match:{
                author: clickedUserId
            }
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
    ])
    profile = profile[0];
    return res
    .status(200)
    .json(new ApiResponse(200,{
        profile,
        books
    },"Profile is Successfully Fetched"))
}) // !! todo add functionality for getting all the books and top five reviews of that user
//controller for updating user profile
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {email} = req.body

    if (email?.trim() === "") {
        throw new ApiError(400, "field is empty")
    }

    const existingUser =  await User.countDocuments({email: email})
    if (existingUser) {
        throw new ApiError(409,"Email already exists") 
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email
            }
        },
        {new: true}
        
    ).select("-password")
    if (!user) {
        throw new ApiError(402,"Something Went wrong while updatng the user details")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        user, 
        "Account details updated successfully"
    ))
});
   
//controller for getting all favouriteBooks
const getAllFavouriteBooks = asyncHandler( async (req,res)=>{

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

    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $addFields:{
                totalBooks:{
                    $size: "$favouriteBooks"
                }
            }
        },
        {
            $lookup:{
                from: "books",
                localField: "favouriteBooks",
                foreignField: "_id",
                as: "favouriteBooks",
                pipeline:[
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
                        $lookup:{
                            from : "users",
                            localField: "author",
                            foreignField:"_id",
                            as: "author",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                        _id:1
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
                        $lookup:{
                            from:"reviews",
                            localField:"reviews",
                            foreignField:"_id",
                            as:"reviews",
                            pipeline:[
                                {
                                    $project:{
                                        rating:1
                                    }
                                },
                                
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
                ]
            }
        }
    ])
    if (!user.length) {
        throw new ApiError(500,"Somthig went wrong while getting Favourite Books")
    }
    const books = user[0]?.favouriteBooks;
    const totalBooks = user[0]?.totalBooks;
    return res.status(200)
    .json(
        new ApiResponse(200,{
            books,
            totalPages: Math.ceil(totalBooks / limit) || 1,
            currentPage: parseInt(page),
        },"Favourite Books ")
    )
})   
// controller for getting all the user based on search
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 9, query, sortBy, sortType, userId } = req.query

    const filter = {};
    if(query){
            filter.$or = [
                {username: {$regex: query, $options: 'i'}},
                {fulname: {$regex: query, $options: 'i'}}
            ]
        
    }

    const sort ={};
    if (sortBy) {
        sort[sortBy] = sortType === "asc" ? 1 : -1
    }

    const skip = (page-1)*limit;

    const users = await User.find(filter).select("-password -favouriteBooks -refreshToken").sort(sort).skip(skip).limit(parseInt(limit, 10) )
    if (!users.length) {
        throw new ApiError(500,"Something Went wrong while fetching the users")
    }
    const totalUsers = await User.countDocuments();
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {
                users,
                totalPages: Math.ceil(totalUsers / limit) || 1,
                currentPage: parseInt(page),
            },
            "Users successfully fetched")
    )
})
//controllers for getting all bought book
const getAllBoughtBooks = asyncHandler(async(req,res)=>{
  const { page = 1, limit = 9} = req.query

  //pagination
  const skip = (page-1)*limit;
  const purchasedBooks = await BookSubscription.aggregate([
    {
      $match:{
        owner: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from: "books",
        localField: "book",
        foreignField: "_id",
        as: "book",
        pipeline:[
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
          }
        ]
      }
    },
    {
      $addFields:{
        book:{
          $first:"$book"
        }
      }
    },
    {
      $project:{
        book:1,
        _id:-1
      }
    }
  ]).skip(skip).limit(parseInt(limit))

    const totalBooks = (await BookSubscription.find({owner:req.user?._id})).length;

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        {
            purchasedBooks,
            totalPages: Math.ceil(totalBooks / limit) || 1,
            currentPage: parseInt(page),
        },
        "Books fetched Successfully"))
})

const getAllMyBooks = asyncHandler( async(req,res)=>{
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
            $match:{
                author:new mongoose.Types.ObjectId(req.user?._id)
            }
          }, 
          {
            $match: filter,
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
        const totalBooks = (await Book.find({author:req.user?._id})).length;

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

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    userPasswordUpdate,
    getCurrentUser,
    userAvatarUpdate,
    userClickedProfile,
    updateAccountDetails,
    getAllFavouriteBooks,
    getAllUsers,
    getAllBoughtBooks,
    getAllMyBooks
}