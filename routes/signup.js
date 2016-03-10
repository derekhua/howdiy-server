"use strict";
const express = require('express');
const router  = express.Router();
const User    = require('../models/users');

// Create a new user account (POST http://localhost:8080/api/signup)
router.post('/', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    let newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      bio: "",
      website: "",
      phone: "",
      gender: "Not Specified",
      savedGuides: [],
      submittedGuides: [],
      drafts: [],
      likedGuides: {},
      sharedGuides: {}
    });
    // Save the user
    newUser.save(err => {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

module.exports = router;