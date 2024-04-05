const { validationResult } = require("express-validator");

const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        invalid: false,
        product: undefined,
        errorMsg: undefined,
        error: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            invalid: true,
            product: {
                title: title,
                imageUrl: imageUrl,
                price: price,
                description: description,
            },
            errorMsg: error.errors[0].msg,
            error: error.errors,
        });
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user._id,
    });
    product
        .save()
        .then((result) => {
            req.flash("success", "Product added successfully");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error("Product not fetched!");
            error.httpStatusCode = 500;
            next(err)
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return res.redirect("/");
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
                invalid: false,
                errorMsg: undefined,
                error: [],
            });
        })
        .catch((err) => {
            const error = new Error("Product not fetched!");
            error.httpStatusCode = 500;
            next(err)
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;
    const error = validationResult(req);

    if (!error.isEmpty()) {
        return res.render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: true,
            invalid: true,
            product: {
                title: updatedTitle,
                imageUrl: updatedImageUrl,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId,
            },
            errorMsg: error.errors[0].msg,
            error: error.errors,
        });
    }

    Product.findById(prodId)
        .then((product) => {
            throw new Error("dummy error")
            if (product.userId.toString() === req.user._id.toString()) {
                product.title = updatedTitle;
                product.price = updatedPrice;
                product.description = updatedDesc;
                product.imageUrl = updatedImageUrl;
                return product.save();
            }
            return false;
        })
        .then((result) => {
            req.flash("success", "Product Edited successfully.");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error("Product not fetched!");
            error.httpStatusCode = 500;
            next(error)
        });
};

exports.getProducts = (req, res, next) => {
    let message = req.flash("success");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    Product.find({ userId: req.user._id })
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
                successMsg: message,
            });
        })
        .catch((err) => {
            const error = new Error("Product not fetched!");
            error.httpStatusCode = 500;
            next(err)
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteOne({ _id: prodId, userId: req.user._id })
        .then(() => {
            req.flash("success", "Product Deleted successfully.");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error("Product not fetched!");
            error.httpStatusCode = 500;
            next(err)
        });
};
