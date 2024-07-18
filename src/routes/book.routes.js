import { Router } from "express";
import { 
    publishABook,
    getAllBooks,
    getBookById,
    deleteBook,
    saveFavouriteBook,
    removeFavouriteBook,
    bookList
 } from "../controllers/book.controlers.js";
 
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const bookRouter = Router();
bookRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


// route for publishing a book
bookRouter.route("/publish").post(upload.single("coverImage"),publishABook)
bookRouter.route("/").get(bookList)

export default bookRouter;