var express   = require('express');
var passport  = require('passport');
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers');
var Thumbnails    = require('../models/thumbnails');

require('../config/passport')(passport);

// GET
// Returns all thumbnails
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Thumbnails.getThumbnails(function(err, thumbnails) {
      if(err) {
        throw err;
      }
      res.json(thumbnails);
    });
  });
});

// Returns single thumbnail according to id
router.get('/:guideId', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Thumbnails.getThumbnail({ 'guideId': req.params.guideId }, function(err, thumbnail) {
      if(err) {
        throw err;
      }
      res.json(thumbnail);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Thumbnails.addThumbnail(req.body, function(err, thumbnail) {
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(thumbnail);
      }
    });
  });
});

module.exports = router;
