const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
require("dotenv").config();
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./Schema.js");
const Review = require("./models/review.js");

const MONGO_URL = process.env.MONGO_URL;

main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")))

// joi function for schema validation 
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(errMsg, 400);
    } else {
        next();
    }
}

app.get("/", (req, res) => {
    res.send("hi")
})

// index routes
app.get("/listings", wrapAsync(async (req, res, next) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
})
);

//new route
app.get("/listings/new", (req, res) => {
    res.render("listings/new");
});

//show route
app.get("/listings/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show", { listing });
})
);

// //create route
app.post("/listings", validateListing,wrapAsync(async (req, res, next) => {
    await Listing.create(req.body.listing);
    res.redirect("/listings");
})
);

// //edit route
app.get("/listings/:id/edit", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
})
);

// //update route
app.put("/listings/:id", validateListing,wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
})
);

// //delete route
app.delete("/listings/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})
);

// reviews post route
app.post("/listings/:id/reviews", wrapAsync(async(req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.send("New Review Saved");
})
);

// error handling
app.all(/.*/, (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((error, req, res, next) => {
    let { message = "Something went wrong", statusCode = 500 } = error;
    res.status(statusCode).render("listings/error", { error, message, statusCode });
});

app.listen(8080);