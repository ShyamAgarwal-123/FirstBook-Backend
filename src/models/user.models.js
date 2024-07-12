import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true,"username is Required"],
        lowercase: true,
        unique: true,
        index: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: [true,"Fullname is Required"],
        trim: true,
        index: true
    },
    favouriteBooks:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book"
        }
    ],
    avatar:{
        type: String, // cloudinary url
        required:true,
    },
    avatar_id:{
        type: String, // cloudinary url
        required:true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
},{timestamps: true});
// hook before a save (before saving a user to db it encrypts the password and then pass the next command to save function. 
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User",userSchema);