const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const User = require("../models/user");

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
        user: "catharine.bergstrom30@ethereal.email",
        pass: "uq5sSjK1JVd4qvceuX",
    },
});

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMsg: message,
        oldData: {
            email: "",
        },
        validationError: [],
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash("passNotMatchErr");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMsg: message,
        oldData: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationError: [],
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMsg: message,
    });
};

exports.getResetPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ token: token, tokenEXP: { $gt: Date.now() } })
        .then((user) => {
            if (user) {
                let message = req.flash("error");
                if (message.length > 0) {
                    message = message[0];
                } else {
                    message = null;
                }
                res.render("auth/new-password", {
                    path: "/new-password",
                    pageTitle: "Reset Password",
                    errorMsg: message,
                    userId: user._id.toString(),
                });
            }
        })
        .catch((err) => console.log(err));
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMsg: error.errors[0].msg,
            oldData: {
                email: email,
            },
            validationError: error.errors,
        });
    }
    User.findOne({ email: email })
        .then((user) => {
            if (user) {
                bcrypt
                    .compare(password, user.password)
                    .then((doMatch) => {
                        if (!doMatch) {
                            req.flash("error", "Enter valid password");
                            return res.redirect("/login");
                        }
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect("/");
                        });
                    })
                    .catch((err) => console.log(err));
            } else {
                req.flash("error", "Enter valid email");
                res.redirect("/login");
            }
        })
        .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    transporter
        .sendMail({
            from: '"Code marshals" <davin32@ethereal.email>', // sender address
            to: email, // list of receivers
            subject: "Testing mail", // Subject line
            text: "This is first mail", // plain text body
            html: "<b>Please consider mail</b>", // html body
        })
        .then((data) => {
            console.log("email sending data", data.messageId);
        })
        .catch((err) => console.log(err));

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMsg: error.errors[0].msg,
            oldData: {
                email: email,
            },
            validationError: error.errors,
        });
    }
    bcrypt
        .hash(password, 12)
        .then((bcryptPassword) => {
            const user = new User({
                email: email,
                password: bcryptPassword,
                cart: { items: [] },
            });
            return user.save();
        })
        .then((data) => {
            res.redirect("/login");
        })
        .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect("/");
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buff) => {
        if (err) {
            console.log(err);
            req.flash("error", "Please try after some ime");
            res.redirect("/reset");
        }
        const token = buff.toString("hex");

        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash("error", "This user does not Exist.");
                    return res.redirect("/reset");
                }

                user.token = token;
                user.tokenEXP = Date.now() + 3600000;

                return user.save();
            })
            .then((result) => {
                res.redirect("/");
                return transporter.sendMail({
                    from: '"Code marshals" <davin32@ethereal.email>', // sender address
                    to: req.body.email, // list of receivers
                    subject: "Reset password", // Subject line
                    text: "This mail helps you to reset password securely", // plain text body
                    html: `
            <p>Click on below link to reset your password</p>
            <a href= "localhost:3000/reset/${token}">Click</a>
            `, // html body
                });
            })
            .then((data) => {
                console.log("email sending data", data.messageId);
            })
            .catch((err) => console.log(err));
    });
};

exports.postResetPassword = (req, res, next) => {
    if (req.body.password === req.body.confirmPassword) {
        bcrypt
            .hash(req.body.password, 12)
            .then((bcryptPassword) => {
                return User.findById(req.body.userId).then((user) => {
                    user.password = bcryptPassword;
                    user.token = undefined;
                    user.tokenEXP = undefined;
                    return user.save();
                });
            })
            .then((result) => {
                req.flash("errorMsg", "Password changed");
                res.redirect("/login");
            })
            .catch((err) => console.log(err));
    } else {
        req.flash("passNotMatchErr", "Both password must be same.");
        res.redirect("/reset/:token");
    }
};
