const express = require("express");
const router = express.Router({mergeParams: true});
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

// REST - NEW
router.get("/new", middleware.isLoggedIn, (req, res) =>{
	Campground.findById(req.params.id, (err, foundCampground) =>{
		if(err) {
			console.log(err);
			//res.redirect("/campgrounds");
		} else {
			res.render("comments/new", {campground: foundCampground});
		}
	})
});

// REST - CREATE
router.post("/", middleware.isLoggedIn, (req, res) =>{
	// Lookup for campground by id
	Campground.findById(req.params.id, (err, foundCampground) =>{
		if(err) {
			console.log(err);
			//res.redirect("/campgrounds");
		} else {
			// Create new comment
			Comment.create(req.body.comment, (err, comment) =>{
				if(err) {
					req.flash("error", "Something went wrong");
					console.log(err);
				} else {
					// Add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					// Connect new comment to campground
					comment.save();
					foundCampground.comments.push(comment);
					foundCampground.save()
					req.flash("success", "Successfully added comment");
					// Redirect to campground show page
					res.redirect("/campgrounds/" + foundCampground._id);
				}
			});
		}
	});
});

// REST - EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) =>{
		if(err || !foundCampground) {
			req.flash("error","Campground not found");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, (err, foundComment) =>{
			if(err || !foundComment) {
				res.redirect("back");
			} else {
				res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
			}
		});
	});
});

// REST - UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) =>{
		if(err) {
			res.redirect("back");
		} else {
			req.flash("success", "Successfully updated");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// REST - DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err) =>{
		if(err) {
			res.redirect("back");
		} else {
			req.flash("success","Comment deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;