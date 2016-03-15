"use strict";
const express = require('express');
const router  = express.Router();
const AWS     = require('aws-sdk');
const User    = require('../models/users');
const ImageHelper = require('../utility/image-helper');
const S3      = new AWS.S3();

// Create a new user account (POST http://localhost:8080/api/signup)
router.post('/', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } 
  else {
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
      sharedGuides: {},
      profilePicture: ""
    });
    newUser.profilePicture = ImageHelper.bucketURL + "profilepicture_" + newUser.username + ".jpg";
    // Save the user
    newUser.save(err => {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
    
    let params = {
      Bucket: 'howdiy',
      CopySource: 'howdiy/default_profilepicture.jpg',
      Key: 'profilepicture_' + newUser.username + '.jpg',
    };
    S3.copyObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } 
    });
  }
});

module.exports = router;