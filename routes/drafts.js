var express   = require('express');
var passport  = require('passport');
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers');
var Drafts        = require('../models/drafts');

require('../config/passport')(passport);

// GET
// Returns all drafts
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Drafts.getDrafts(function(err, drafts) {
      if(err) {
        console.log(err);
      }
      res.json(drafts);
    });
  });
});

// Returns single draft according to id
router.get('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Drafts.getDraft({ '_id': req.params._id }, function(err, draft) {
      if(err) {
        console.log(err);
      }
      res.json(draft);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Drafts.addDraft(req.body, function(err, draft) {
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(draft);
      }
    });
  });
});

module.exports = router;
