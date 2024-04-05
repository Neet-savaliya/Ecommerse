const express = require("express");
const { check } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.get("/reset", authController.getReset);

router.get("/reset/:token", authController.getResetPassword);

router.post(
    "/login",
    [
        check("email", "Enter valid email").isEmail().normalizeEmail(),
        check(
            "password",
            "Password can only contain text and number and 5 char long"
        )
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim(),
    ],
    authController.postLogin
);

router.post(
    "/signup",
    [
        check("email", "Please enter valid email")
            .isEmail()
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then((data) => {
                    if (data) {
                        return Promise.reject("This email already exist");
                    }
                });
            })
            .normalizeEmail(),
        check(
            "password",
            "Password can only contain text and number and 5 char long"
        )
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        check("confirmPassword" , "Confirm password should be same.")
            .custom((value, { req }) => {
                return req.body.password.toString() === value.toString()
            })
            .trim()
    ],
    authController.postSignup
);

router.post("/logout", authController.postLogout);

router.post("/reset", authController.postReset);

router.post("/new-password", authController.postResetPassword);

module.exports = router;
