"use strict";
const express       = require('express');
const passport      = require('passport'); 
const router        = express.Router();
const GuideHelpers  = require('../utility/guide-helpers');
const TokenHelpers  = require('../utility/token-helpers');
const Guides        = require('../models/guides');
const Users         = require('../models/users');
require('../config/passport')(passport);

// GET
router.get('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Guides.getGuides({}, req.query.projection, (err, guides) => {
      if(err) {
        console.log(err);
      }
      res.json(guides);
    });
  });
});

// Returns single guide according to id
router.get('/:_id', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Guides.getGuide({'_id': req.params._id}, req.query.projection, (err, guide) => {
      if (err) {
        console.log(err);
      }
      res.json(guide);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Guides.addGuide(req.body, (err, guide) => {
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
router.post('/:_id', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Guides.updateGuide({'_id' : req.params._id}, req.body, {new: true}, (err, guide) => {
      if (err) {
        console.log('Error occured in updating');
        console.log(err);
      } 
      else {
        if (req.body.steps !== undefined && req.body.draft !== undefined) {
          GuideHelpers.updateExistingGuide(guide);
        }
        if (req.body.$push !== undefined && req.body.$push.comments !== undefined) {
          GuideHelpers.guideCommentActivityFeedUpdate(req);
        }
        res.json(guide);
      }
    });
  });
});

// deletes guide
// POST
router.post('/:_id/delete', 
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      GuideHelpers.deleteGuide(req, res);
    });
  }
);

module.exports = router;
