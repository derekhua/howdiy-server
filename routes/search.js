"use strict";
const express   = require('express');
const passport  = require('passport'); 
const router    = express.Router();
const TokenHelpers  = require('../utility/token-helpers');
const Guides        = require('../models/guides');
const Users         = require('../models/users');
require('../config/passport')(passport);

// GET
router.get('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Guides.getGuides({"title": {$regex: req.query.q, $options: 'i'}, "draft": false}, req.query.projection, (err, guides) => {
      if(err) {
        console.log(err);
      }
      Users.getUsers({"username": {$regex: req.query.q, $options: 'i'}}, req.query.projection, (err, users) => {
        res.json(users.concat(guides))
      });
    });
  });
});

module.exports = router;
