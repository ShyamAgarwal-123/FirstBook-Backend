import { Router } from "express";
import { bookSubscription } from "../controllers/bookSubscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const bookSub = Router();

bookSub.route("/subBook/:bookId").put(verifyJWT,bookSubscription)

export default bookSub;