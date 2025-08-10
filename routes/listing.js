const express = require("express");
const router = express();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("../Schema.js");

// joi function for schema validation of listing
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(errMsg, 400);
    } else {
        next();
    }
}


// index routes
router.get("/", wrapAsync(async (req, res, next) => {
    const allListings = await Listing.find({}); 5
    res.render("listings/index", { allListings });
})
);

//new route
router.get("/new", (req, res) => {
    res.render("listings/new");
});

//show route
router.get("/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show", { listing });
})
);

// //create route
router.post("/", validateListing, wrapAsync(async (req, res, next) => {
    await Listing.create(req.body.listing);
    res.redirect("/listings");
})
);

// //edit route
router.get("/:id/edit", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
})
);

// //update route
router.put("/:id", validateListing, wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
})
);

// //delete route
router.delete("/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})
);

module.exports = router;