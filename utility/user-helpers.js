"use strict";
const express   = require('express');
const passport  = require('passport');
const AWS       = require('aws-sdk'); 
const router    = express.Router();

const TokenHelpers  = require('../utility/token-helpers');
const Users         = require('../models/users');
const Guides        = require('../models/guides');
const ImageHelper   = require('../utility/image-helper');
const bucketURL     = "https://s3.amazonaws.com/howdiy/";
const S3            = new AWS.S3();

const updateProfilePicture = (req,res) => {
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
      req.body.profilePicture = bucketURL + filename;
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
 
const guideLikeActivityFeedUpdate = (likingUser, guideId) => {
  Guides.getGuide({'_id': guideId}, (err, guide) => {
    if (err) {
      console.log(err);
    }
    else {
      let activityInfo = likingUser.username + ' liked your guide "' + guide.title + '"';
      let activityFeedUpdate = {
        'userId' : likingUser.username, 
        'guideId' : guide._id.toString(), 
        'activityInfo' : activityInfo, 
        'timestamp' : Date.now(), 
        'image' : ImageHelper.bucketURL + "profilepicture_" + likingUser.username + ".jpg"
      }
      Users.updateUser({'username' : guide.author}, {$push : {'activityFeed' : {$position: 0, $each: [activityFeedUpdate]}}}, {new : true}, (err, updatedActivityUser) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });
};

const userFollowActivityFeedUpdate = (follower, followee) => {
  let activityInfo = follower.username + ' is following you';
  let activityFeedUpdate = {
    'userId' : follower.username, 
    'activityInfo' : activityInfo, 
    'timestamp' : Date.now(), 
    'image' : ImageHelper.bucketURL + "profilepicture_" + follower.username + ".jpg"
  };
  Users.updateUser({'username' : followee}, {$push : {'activityFeed' : {$position: 0, $each: [activityFeedUpdate]}}}, {new : true}, (err, updatedActivityUser) => {
    if (err) {
      console.log(err);
    }
  });
};

module.exports.updateProfilePicture = updateProfilePicture;
module.exports.guideLikeActivityFeedUpdate = guideLikeActivityFeedUpdate;
module.exports.userFollowActivityFeedUpdate = userFollowActivityFeedUpdate;