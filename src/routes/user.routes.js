import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    userPasswordUpdate,
    getCurrentUser,
    userAvatarUpdate,
    userClickedProfile,
    getAllFavouriteBooks,
    updateAccountDetails,
    getAllMyBooks,
    getAllUsers,
    getAllBoughtBooks
  
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
//route for getting clicked user profile
userRouter.route("/c/:username").get(verifyJWT,userClickedProfile)

// route for updating userProfile
userRouter.route("/update-account").patch(verifyJWT,updateAccountDetails)

// route for getting all the favBooks
userRouter.route("/favBooks/").get(verifyJWT,getAllFavouriteBooks);

// route for getting all the favBooks
userRouter.route("/myBooks/").get(verifyJWT,getAllMyBooks);

// route for getting all the users
userRouter.route("/").get(verifyJWT,getAllUsers)

// route for getting all the purchased books
userRouter.route("/purchasedBooks/").get(verifyJWT,getAllBoughtBooks)






export default userRouter;