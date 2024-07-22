import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { toggleReviewDislike } from "../controllers/dislike.controllers.js";


const dislikeRouter = Router();

dislikeRouter.use(verifyJWT)

dislikeRouter.route("/:reviewId").put(toggleReviewDislike);


export default dislikeRouter