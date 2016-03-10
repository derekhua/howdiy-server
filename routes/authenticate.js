"use strict";
const express = require('express');
const jwt     = require('jwt-simple');
const config  = require('../config/database');
const router  = express.Router();

const User = require('../models/users');

// Route to authenticate a user (POST http://localhost:8080/api/auth)
router.post('/', (req, res) => {
  User.getUser({username: req.body.username}, (err, user) => {
    if (err) {
      console.log(err);
    }
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          // If user is found and password is right create a token
          const token = jwt.encode(user, config.secret);
          // Return the information including token as JSON
          res.json({success: true, token: `JWT ${token}`});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

module.exports = router;
