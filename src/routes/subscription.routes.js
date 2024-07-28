import { Router } from "express";
import {toggleSubscription} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const subscriptionRouter = Router();
subscriptionRouter.use(verifyJWT)
subscriptionRouter.route("/userSub/:clickedUserId").put(toggleSubscription);
export default subscriptionRouter;