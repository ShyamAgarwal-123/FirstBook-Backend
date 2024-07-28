import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";


const app = express();


//configure 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))//use to handel json data

app.use(express.urlencoded({limit: "16kb",extended: true}))//With the urlencoded middleware, data( URL-encoded format) is automatically parsed and available in req.body as a JavaScript object,genrally used for form data

app.use(express.static("public"))// serves static files from the “public” directory.Using express.static, you can efficiently serve static assets in your Express application, making it easy to deliver the necessary files to the client. using to send files to cloudinary 

app.use(cookieParser())//to parse cookies attached to the client request object. This middleware allows you to easily access and manipulate cookies within your Express routes.

//cookies sent by the client will be available in the req.cookies object.You can set cookies using the res.cookie() method


//routes import
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js";
import dislikeRouter from "./routes/dislike.routes.js";
import reviewRouter from "./routes/review.routes.js";
import bookSub from "./routes/bookSubscription.routes.js";
import bookRouter from "./routes/book.routes.js";

//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/dislikes",dislikeRouter)
app.use("/api/v1/reviews",reviewRouter)
app.use("/api/v1/book-subscriptions",bookSub)
app.use("/api/v1/books",bookRouter)

//http://localhost:8000/api/v1/users then calls the userRouter

export {app};