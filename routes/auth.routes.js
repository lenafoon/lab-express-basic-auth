const { Router } = require("express");
const router = new Router();
const mongoose = require("mongoose"); 
const bcryptjs = require("bcryptjs");
const saltRounds = 10;
const User = require("../models/User.model");


router.get("/signup", isLoggedOut, (req, res) => res.render("auth/signup"));

router.post("/signup", (req, res, next) => {

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.render("auth/signup", {
      errorMessage: "All fields are mandatory. Please provide your username, email and password."
    });
    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("auth/signup", {
      errorMessage:
        "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter."
    });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return User.create({
  
        username,
        email,
        passwordHash: hashedPassword
      });
    })
    .then((userFromDB) => {
    
      res.redirect("/userProfile");
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("auth/signup", { errorMessage: error.message });
      } 
      else if (error.code === 11000) {
        res.status(500).render("auth/signup", {
          errorMessage: "User not found and/or incorrect password."
        });
      } 
      else {
        next(error);
      }
    }); 
});


router.get("/login", (req, res) => res.render("auth/login"));

router.post("/login", (req, res, next) => {

  console.log("SESSION =====> ", req.session);

  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Please enter both, email and password to login."
    });
    return;
  }

  User.findOne({ email }) 
    .then((user) => {
      
      if (!user) {
        
        res.render("auth/login", { errorMessage: "User not found and/or incorrect password." });
        return;
      }
      else if (bcryptjs.compareSync(password, user.passwordHash)) {
        
        req.session.currentUser = user;
        res.redirect("/userProfile");
      } 
      else {
        res.render("auth/login", { errorMessage: "User not found and/or incorrect password." });
      }
    })
    .catch((error) => next(error));
});



router.get("/userProfile", isLoggedIn, (req, res) => {
  res.render("users/user-profile", { userInSession: req.session.currentUser });

});


router.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard.js');


router.get('/main', isLoggedIn, (req, res) => {

  res.render('main'); 
});

router.get('/private', isLoggedIn, (req, res) => {

  res.render('private'); 
});



module.exports = router;
