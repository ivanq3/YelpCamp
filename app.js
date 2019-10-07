require('dotenv').config();
const express		= require("express"),
	  app			= express(),
	  bodyParser	= require("body-parser"),
	  mongoose 		= require("mongoose"),
	  flash			= require("connect-flash"),
	  passport		= require("passport"),
	  LocalStrategy	= require("passport-local"),
	  methodOverride = require("method-override"),
	  Campground	= require("./models/campground"),
	  Comment		= require("./models/comment"),
	  User			= require("./models/user"),
	  seedDB		= require("./seeds");

var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");

var dbUrl = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";

mongoose.connect(dbUrl, {useNewUrlParser: true, useFindAndModify: false });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// Seeding the database
// seedDB();

// moment js
app.locals.moment = require('moment');

// Passport configuration
app.use(require("express-session")({
	secret: "just a secret used to generate... encription",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash messages
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// requiring routes
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

// port configuration
var port = process.env.PORT || 3000;

app.listen(port, process.env.IP, () =>{
	console.log("The YelpCamp server has started!");
});