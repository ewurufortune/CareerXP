//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// mongodb://localhost:27017/expmapDB
// mongodb+srv://ewurufortune:pmX0GdJHQumI8jVb@resourcecluster.inplmwx.mongodb.net/roadmapDB
mongoose.connect("mongodb+srv://ewurufortune:pmX0GdJHQumI8jVb@resourcecluster.inplmwx.mongodb.net/roadmapDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const roadmapSchema = new mongoose.Schema ({
  experience: String,
  criteria: String,
  result: String,
  industry:String
});
const RoadMap = new mongoose.model("RoadMap", roadmapSchema);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  category: String,
  storyRoadMap: [roadmapSchema]
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/roadmaps",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));





app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/roadmaps",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to roadmaps.
    res.redirect("/roadmaps");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/roadmaps", function(req, res){



  User.find({"storyRoadMap": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {

      console.log('FIRST USER'+foundUsers+'END USER')
      if (foundUsers) {
        res.render("roadmaps", {usersWithRoadmaps: foundUsers});
      }
    }
  });
});

app.get("/startup", function(req, res){



  User.find({"storyRoadMap": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {

      console.log('FIRST USER'+foundUsers+'END USER')
      if (foundUsers) {
        res.render("startup", {usersWithStartup: foundUsers});
      }
    }
  });
});

app.get("/about", function(req, res){



  User.find({"storyRoadMap": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {

      if (foundUsers) {
        res.render("about", {usersWithAbout: foundUsers});
      }
    }
  });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
 
  const targetDemo = req.body.targetDemo;
    const experience = req.body.experience;
      const result = req.body.result;
      const industry=req.body.industry

//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
    const latestExp = new RoadMap({
      experience:experience,
      criteria:targetDemo,
      result:result,
      industry:industry
    })
console.log(latestExp)
        foundUser.storyRoadMap.push( latestExp);

        foundUser.save(function(){

          res.redirect("/roadmaps");
        });
   
      }
    }
  });
  });

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/roadmaps");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password,
    category: 'un-trained'
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/roadmaps");
      });
    }
  });

});







const PORT = process.env.PORT || 3030;

// your code

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
