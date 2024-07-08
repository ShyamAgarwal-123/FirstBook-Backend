import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    userPasswordUpdate,
    getCurrentUser,
    userAvatarUpdate,
    userClickedChannelProfile
} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const userRouter = Router();
// api end point for register 
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1

        }
    ]),
    registerUser
);
// route for login
userRouter.route("/login").post(loginUser)


//secured Routes

// route for logout
userRouter.route("/logout").post(verifyJWT,logOutUser)

// route for refreshAccessTohen
userRouter.route("/refresh-token").post(refreshAccessToken)

// route for password update
userRouter.route("/update-password").post(verifyJWT,userPasswordUpdate)

// route to get current user
userRouter.route("/current-user").get(verifyJWT,getCurrentUser)

// route to update avatar
userRouter.route("/update-avatar").patch(verifyJWT,
    upload.single("avatar"),
    userAvatarUpdate
)
//route for getting clicked user channel
userRouter.route("/c/:username").get(verifyJWT,userClickedChannelProfile)


export default userRouter;