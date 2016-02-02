var express   = require('express');
var passport  = require('passport');
var router    = express.Router();

var TokenHelpers = require('../utility/token-helpers');
var Users = require('../models/users');

require('../config/passport')(passport);

// GET
// Returns all users
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Users.getUsers(function(err, user) {
      if(err) {
        throw err;
      }
      res.json(user);
    });
  });
});

// Returns single user
router.get('/:username', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Users.getUser({'username': req.params.username}, function(err, user) {
      if(err) {
        throw err;
      }
      res.json(user);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Users.addUser(req.body, function(err, user) {
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(user);
      }
    });
  });
});

// updates user
// POST
router.post('/:username', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Users.updateUser({'username' : req.params.username}, req.body, {new: true}, function(err, user) {
      if(err) {
        console.log('Error occured in updating');
        console.log(err);
      } else {
        res.json(user);
      }
    });
  });
});

module.exports = router;
