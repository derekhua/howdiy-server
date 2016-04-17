"use strict";
const express   = require('express');
const passport  = require('passport');
const AWS       = require('aws-sdk'); 
const router    = express.Router();

const TokenHelpers  = require('../utility/token-helpers');
const Users         = require('../models/users');
const Guides        = require('../models/guides');
const ImageHelper   = require('../utility/image-helper');
const UserHelpers   = require('../utility/user-helpers');
const bucketURL    = "https://s3.amazonaws.com/howdiy/";

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

// Returns part of the user's news feed
router.get('/:username/feed',
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      Users.getUser({'username': req.params.username}, (err, user) => {
        if(err) {
          console.log(err);
        }
        let part;
        let index = parseInt(req.query.index, 10);
        // 3 is how many guides to retrieve at a time
        if (index - 3 <= 0) {
          part = user.newsFeed.feed.slice(0, index);
        } else {
          part = user.newsFeed.feed.slice(index-3, index);
        }
        res.json(part.reverse());
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
        UserHelpers.updateProfilePicture(req,res);
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
            } 
            else {
              res.json(user);
              if (req.body.$push !== undefined && req.body.$push.likedGuides !== undefined) {
                UserHelpers.guideLikeActivityFeedUpdate(user, req.body.$push.likedGuides);
              }
              else if (req.body.$push !== undefined && req.body.$push.followings !== undefined) {
                UserHelpers.userFollowActivityFeedUpdate(user, req.body.$push.followings);
              }
            }
          }
        );
      }
    });
  }
);

// Updates the news feed
// POST
router.post('/:username/updateNewsFeed',
  passport.authenticate('jwt', { session: false}), (req, res) => {
    TokenHelpers.verifyToken(req, res, (req, res) => {
      Users.getUser({'username': req.params.username}, (err, user) => {
        if(err) {
          console.log(err);
        }
        // Get all followings guides
        Guides.getGuides(
          {'author': {$in: user['followings']}, 'draft': false},
          'title picturePath author description category meta comments',
          (err, guides) => {
            if(err) {
              console.log('get guides error')
              console.log(err);
            }
            // Sort by createDate
            if (guides) {
              guides.sort((a, b) => {
                if (a.meta.createDate < b.meta.createDate) {
                  return -1;
                }
                if (a.meta.createDate > b.meta.createDate) {
                  return 1;
                }
                return 0;
              });
            }
            Users.updateUser(
              {'username': req.params.username},
              {
                'newsFeed': {
                  'lastUpdated': Date.now(),
                  'feed': guides
                }
              },
              {new: true},
              (err, user) => {
                if (err) {
                  console.log('Update newsfeed error');
                  console.log(err);
                }
                else {
                  // Respond with the new length
                  if (guides) {
                    res.json(guides.length);
                  } else {
                    res.json(-1);
                  }
                }
              }
            );
          }
        );
      });   
    });
  }
);

module.exports = router;
