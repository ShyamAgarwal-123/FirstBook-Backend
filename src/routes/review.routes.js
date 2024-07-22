import { Router } from 'express';
import {
    submitReview,
    deleteReviewById,
    updateReviewById,
    getAllReviews
} from "../controllers/review.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const reviewRouter = Router();

reviewRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

reviewRouter.route("/:bookId").get(getAllReviews).post(submitReview);
reviewRouter.route("/:reviewId").delete(deleteReviewById).patch(updateReviewById);

export default reviewRouter;