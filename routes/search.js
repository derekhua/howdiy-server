var express   = require('express');
var passport  = require('passport'); 
var router    = express.Router();
var TokenHelpers  = require('../utility/token-helpers');
var Guides        = require('../models/guides');
var Users         = require('../models/users');
require('../config/passport')(passport);

// GET
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuides({"title": {$regex: req.query.q}}, function(err, guides) {
      if(err) {
        console.log(err);
      }
      res.json(guides);
    });
  });
});

module.exports = router;
