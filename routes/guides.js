var express   = require('express');
var passport  = require('passport'); 
var router    = express.Router();
var GuideHelpers = require('../utility/guide-helpers');
var TokenHelpers  = require('../utility/token-helpers');
var Guides        = require('../models/guides');
var Users     = require('../models/users');
require('../config/passport')(passport);

// GET
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuides({}, req.query.projection, function(err, guides) {
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
    Guides.getGuide({'_id': req.params._id}, req.query.projection, function(err, guide) {
      if (err) {
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
      if (err) {
        console.log('Error occured in adding');
        console.log(err);
      } 
      else {
        GuideHelpers.processNewGuide(guide);     
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
      if (err) {
        console.log('Error occured in updating');
        console.log(err);
      } 
      else {
        if (req.body.steps !== undefined && req.body.draft !== undefined) {
          GuideHelpers.updateExistingGuide(guide);
        }
        res.json(guide);
      }
    });
  });
});

// deletes guide
// POST
router.post('/:_id/delete', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.deleteGuide({'_id' : req.params._id}, function(err) {
      if (err) {
        console.log('Error occured in deleting');
        console.log(err);
      } 
      else {
        res.json({response : req.params._id + " guide deleted"});
      }
    });
    
    var update;
    if (req.body.guideType === 'draft') {
      update = {$pull : {draft : req.params._id}};
    }
    else {
      update = {$pull : {submittedGuides : req.params._id}}
    }
    Users.updateUser({'username' : req.body.username}, update, {new: true}, function(err, updatedUser) {
      if (err) {
        console.log('Error occured in user update');
        console.log(err);
      } 
      else {
        console.log('user update for guide deletion success');
      }
    });
  });
});

module.exports = router;
