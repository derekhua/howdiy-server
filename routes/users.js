"use strict";
const express   = require('express');
const passport  = require('passport');
const AWS       = require('aws-sdk'); 
const router    = express.Router();

const TokenHelpers  = require('../utility/token-helpers');
const Users         = require('../models/users');
const Guides        = require('../models/guides');
const ImageHelper   = require('../utility/image-helper');
const bucketLink    = "https://s3.amazonaws.com/howdiy/";

require('../config/passport')(passport);

// GET
router.get('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Users.getUsers({}, req.query.projection, (err, user) => {
      if(err) {
        console.log(err);
      }
      res.json(user);
    });
  });
});

// Returns single user
router.get('/:username',
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      Users.getUser({'username': req.params.username}, req.query.projection, (err, user) => {
        if(err) {
          console.log(err);
        }
        res.json(user);
      });
    });
  }
);

// Returns the user's guides specified by type
router.get('/:username/guides',
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      Users.getUser({'username': req.params.username}, (err, user) => {
        if(err) {
          console.log(err);
        }
        Guides.getGuides(
          {'_id': {$in: user[req.query.type]}},
          req.query.projection,
          (err, guides) => {
            if(err) {
              console.log(err);
            }
            res.json(guides);
          }
        );
      });
    });
  }
);

// POST
router.post('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  TokenHelpers.verifyToken(req, res, (req, res) => {
    Users.addUser(req.body, (err, user) => {
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
router.post('/:username',
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      if (typeof req.body.profilePicture !== 'undefined') {
        let S3 = new AWS.S3();
        let imageBuffer = ImageHelper.decodeBase64Image(req.body.profilePicture);
        let filename = `profilepicture_${req.params.username}.jpg`;
        let s3Params = {
          Bucket: "howdiy",
          Key: filename,
          Body: imageBuffer.data
        };
        
        S3.putObject(s3Params, (err, data) => {
          if (err) {       
            console.log(err)   
          }
          else {
            req.body.profilePicture = bucketLink + filename;
            Users.updateUser(
              {'username' : req.params.username},
              req.body,
              {new: true},
              (err, user) => {
                if(err) {
                  console.log('Error occured in updating');
                  console.log(err);
                } else {
                  console.log("profile picture update success");
                  res.json(user);
                }
              }
            );
          }
        });
      }
      else {
        Users.updateUser(
          {'username' : req.params.username},
          req.body,
          {new: true},
          (err, user) => {
            if(err) {
              console.log('Error occured in updating');
              console.log(err);
            } else {
              res.json(user);
            }
          }
        );
      }
    });
  }
);

module.exports = router;
