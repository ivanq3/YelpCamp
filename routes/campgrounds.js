const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware"); // requires the contents of index.js middleware directory - index.js is special name used in this case, doesn't have to be specified

// npm geocoder setup for google geocode
var NodeGeocoder = require('node-geocoder');
var options = {
	provider: 'google',
	httpAdapter: 'https',
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null
};
var geocoder = NodeGeocoder(options);

// ROUTES
// REST - INDEX
router.get("/", function(req,res) {
	// Get all campgrounds from db
	Campground.find({}, (err, allCampgrounds) =>{
		if(err){
			console.log(err);
		} else {
			res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
		}
	});
});

// REST - NEW
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

// REST - CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
// get data from form and add to campgrounds array
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
    	id: req.user._id,
    	username: req.user.username
	};
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		var newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
		// Create a new campground and save to DB
		Campground.create(newCampground, function(err, newlyCreated){
			if(err){
				console.log(err);
			} else {
				//redirect back to campgrounds page
				res.redirect("/campgrounds");
			}
		});
	});
});

// REST - SHOW - more info about one campground
router.get("/:id", function(req, res) {
	// Find the campground with provided ID
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err || !foundCampground){
			req.flash("error", "Campground not found");
			res.redirect("back");
		}	else {
			// console.log(foundCampground);
			// Render show template with that campground
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

// REST - EDIT
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findById(req.params.id, (err, foundCampground) =>{
		res.render("campgrounds/edit",{campground: foundCampground});
	});
});

// REST - UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
    	req.flash('error', err.message);
    	return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", "Location not found!");
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// REST - DESTROY
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findByIdAndRemove(req.params.id, (err, campgroundRemoved) =>{
		if(err) {
			res.redirect("/campgrounds");
		} 
        Comment.deleteMany( {_id: { $in: campgroundRemoved.comments } }, (err) => {
            if (err) {
                console.log(err);
            }
            res.redirect("/campgrounds");
        });
	});
});

module.exports = router;