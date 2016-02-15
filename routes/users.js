var express   = require('express');
var passport  = require('passport');
var AWS       = require('aws-sdk'); 
var router    = express.Router();

var TokenHelpers = require('../utility/token-helpers');
var Users = require('../models/users');
var ImageHelper   = require('../utility/image-helper');
var bucketLink    = "https://s3.amazonaws.com/howdiy/";

require('../config/passport')(passport);

// GET
// Returns all users
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Users.getUsers(function(err, user) {
      if(err) {
        console.log(err);
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
        console.log(err);
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
    if (typeof req.body.profilePicture !== 'undefined') {
      var S3 = new AWS.S3();
      var imageBuffer = ImageHelper.decodeBase64Image(req.body.profilePicture);
      var filename = "Profilepicture_" + req.params.username + ".jpg";
      var s3Params = {
        Bucket: "howdiy",
        Key: filename,
        Body: imageBuffer.data
      };
      
      S3.putObject(s3Params, function(err, data) {
        if (err) {       
          console.log(err)   
        }
        else {
          req.body.profilePicture = bucketLink + filename;
          Users.updateUser({'username' : req.params.username}, req.body, {new: true}, function(err, user) {
            if(err) {
              console.log('Error occured in updating');
              console.log(err);
            } else {
              console.log("profile picture update success");
              res.json(user);
            }
          });
        }
      });
    }
    else {
      Users.updateUser({'username' : req.params.username}, req.body, {new: true}, function(err, user) {
        if(err) {
          console.log('Error occured in updating');
          console.log(err);
        } else {
          res.json(user);
        }
      });
    }
  });
});

module.exports = router;
