import { Router } from "express";
import { 
    publishABook,
    getAllBooks,
    getBookById,
    deleteBook,
    updateBook
 } from "../controllers/book.controlers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const bookRouter = Router();


// secured routes

// route for publishing a book
bookRouter.route("/publish").post(verifyJWT,upload.single("coverImage"),publishABook)

export default bookRouter;