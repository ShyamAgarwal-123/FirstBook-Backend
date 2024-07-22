import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { toggleReviewLike } from "../controllers/like.controllers.js";

const likeRouter = Router();

likeRouter.use(verifyJWT)

likeRouter.route("/:reviewId").put(toggleReviewLike);

export default likeRouter