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
    Guides.getGuides({"title": {$regex: req.query.q}}, (err, guides) => {
      if(err) {
        console.log(err);
      }
      res.json(guides);
    });
  });
});

module.exports = router;
