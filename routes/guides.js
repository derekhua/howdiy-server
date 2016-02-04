var express   = require('express');
var passport  = require('passport');
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers');
var Guides        = require('../models/guides');

require('../config/passport')(passport);

// GET
// Returns all guides
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuides(function(err, guides) {
      if(err) {
        console.log(err);
      }
      res.json(guides);
    });
  });
});

// Returns single guide according to id
router.get('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuide({ '_id': req.params._id }, function(err, guide) {
      if(err) {
        console.log(err);
      }
      res.json(guide);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.addGuide(req.body, function(err, guide) {
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(guide);
      }
    });
  });
});

// updates guide
// POST
router.post('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.updateGuide({'_id' : req.params._id}, req.body, {new: true}, function(err, guide) {
      if(err) {
        console.log('Error occured in updating');
        console.log(err);
      } else {
        res.json(guide);
      }
    });
  });
});

module.exports = router;
