"use strict";
const Guides        = require('../models/guides');
const Users         = require('../models/users');
const AWS           = require('aws-sdk');
const ImageHelper   = require('../utility/image-helper');
const bucketURL     = "https://s3.amazonaws.com/howdiy/";
const S3            = new AWS.S3();

const processNewGuide = guide => {
  guide.meta.createDate = Date.now();
  
  if (guide.picturePath.length === 0) {
    guide.picturePath = ImageHelper.defaultStepImage;
  }
  let guideImageBuffer = ImageHelper.decodeBase64Image(guide.picturePath);
  let guideImageFilename = `${guide._id}/GuideImage.jpg`;
  guide.picturePath = bucketURL + guideImageFilename;
  var guidePathParams = {
    Bucket: "howdiy",
    Key: guideImageFilename,
    Body: guideImageBuffer.data
  };
  S3.putObject(guidePathParams, (err, data) => {
    if (err) {       
      console.log(err)   
    }
    else {
      console.log(`Successfully uploaded ${guide._id} guide image`);
    }
  });
  
  let imagesUploaded = 0;
  for(let i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    let filename = `${guide._id}/${guide.steps[i]._id}.jpg`;
    let imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
    guide.steps[i].picturePath = bucketURL + filename;
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
        console.log(`Successfully uploaded ${guide._id}image #${imagesUploaded}`);
        imagesUploaded++;
        
        if (imagesUploaded === guide.steps.length) {
          Guides.updateGuide({'_id' : guide._id}, guide, {new: true}, (err, updatedGuide) => {
            if (err) {
              console.log('Error occured in image URL update');
              console.log(err);
            } 
            else {
              console.log('image URL update success');
            }
          });
        }
      }
    });
  }
  
  let userUpdate;
  if (guide.draft) {
    userUpdate = {$push : { drafts : guide._id.toString()} }
  }
  else {
    userUpdate = {$push : { submittedGuides : guide._id.toString() } }
  }
          
  Users.updateUser({'username' : guide.author}, userUpdate, {new: true},
    (err, updatedUser) => {
      if (err) {
        console.log('Error occured in user update');
        console.log(err);
      } else {
        console.log('user update success');
        if (!guide.draft) {
          guideSubmissionActivityFeedUpdate(updatedUser, guide);
        }
      }
    }
  );
  
};

const updateExistingGuide = guide => {
  if (!guide.draft) {
    guide.meta.createDate = Date.now();
  }
  
  for (let i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    if (ImageHelper.isBase64String(guide.steps[i].picturePath)) {
      let filename = `${guide._id}/${guide.steps[i]._id}.jpg`;
      let imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
      guide.steps[i].picturePath = bucketURL + filename;
      let s3Params = {
        Bucket: "howdiy",
        Key: filename,
        Body: imageBuffer.data
      };
      S3.putObject(s3Params, (err, data) => {
        if (err) {       
          console.log(err);
        }
        else {
          console.log(data);
        }
      });
    }
    
    //updates guide
    if (i === guide.steps.length - 1) {
      Guides.updateGuide({'_id' : guide._id}, guide, {new: true}, (err, updatedGuide) => {
        if (err) {
          console.log('Error occured in draft image URL update');
          console.log(err);
        } 
        else {
          console.log('draft image URL update success');
        }
      });
    }
  }
  
  //removes guide id from user drafts array and adds to user submitted array
  if (!guide.draft) {
    let userUpdate = {$pull : { drafts : guide._id.toString() }, $push : { submittedGuides : guide._id.toString() } }
    Users.updateUser(
      {'username' : guide.author},
      userUpdate,
      {new: true},
      (err, updatedUser) => {
        if (err) {
          console.log('Error occured in user update');
          console.log(err);
        } 
        else {
          console.log('user update success');
          guideSubmissionActivityFeedUpdate(updatedUser, guide);
        }
      }
    );
  }
};

const deleteGuide = (req, res) => {
  Guides.getGuide({'_id': req.params._id}, (err, guide) => {
    if (err) {
      console.log(err);
    }
    else {
      let keys = [];
      let params = {
        Bucket: 'howdiy',
        Prefix: req.params._id
      }
      S3.listObjects(params, function(err, data) {
        if (err) {
          console.log(err);
        }
        else {
          keys.push({'Key': `${req.params._id}/GuideImage.jpg`});
          for (let i = 0; i < data.Contents.length; i++) {
            keys.push({'Key': data.Contents[i].Key});
          }
          s3Delete(keys);
        }
      });

      Guides.deleteGuide({'_id' : req.params._id}, err => {
        if (err) {
          console.log('Error occured in deleting');
          console.log(err);
        } 
        else {
          res.json({response : `${req.params._id} guide deleted`});
        }
      });
    }
  });
  
  let update;
  if (req.body.guideType === 'draft') {
    update = {$pull : {drafts : req.params._id}};
  }
  else {
    update = {$pull : {submittedGuides : req.params._id}}
  }
  Users.updateUser(
    {'username' : req.body.username},
    update,
    {new: true},
    (err, updatedUser) => {
      if (err) {
        console.log('Error occured in user update');
        console.log(err);
      } 
      else {
        console.log('user update for guide deletion success');
      }
    }
  );
};

const s3Delete = keys => {
  let params = {
    Bucket: 'howdiy', 
    Delete: {
      Objects: keys
    },
  };

  S3.deleteObjects(params, (err, data) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(data);
    }
  });
};

const guideSubmissionActivityFeedUpdate = (submitterUser, guide) => {
  for (let i = 0; i < submitterUser.followers.length; i++) {
    let activityInfo = guide.author + ' posted a new guide "' + guide.title + '"';
    let activityFeedUpdate = {
      'userId' : guide.author, 
      'guideId' : guide._id.toString(), 
      'activityInfo' : activityInfo, 
      'timestamp' : Date.now(),
      'image' : ImageHelper.bucketURL + "profilepicture_" + guide.author + ".jpg"
    }
    Users.updateUser({'username' : submitterUser.followers[i]}, {$push : {'activityFeed' : {$position: 0, $each: [activityFeedUpdate]}}}, {new : true}, (err, updatedActivityUser) => {
      if (err) {
        console.log(err);
      }
    });
  }
};

const guideCommentActivityFeedUpdate = (req) => {
  Guides.getGuide({'_id': req.params._id}, (err, guide) => {
    if (err) {
      console.log(err);
    }
    else {
      let activityInfo = req.body.$push.comments.username + ' commented on your guide "' + guide.title + '"';
      let activityFeedUpdate = {
        'userId' : req.body.$push.comments.username, 
        'guideId' : guide._id.toString(), 
        'activityInfo' : activityInfo, 
        'timestamp' : Date.now(),
        'image' : ImageHelper.bucketURL + "profilepicture_" + req.body.$push.comments.username + ".jpg"
      }
      Users.updateUser({'username' : guide.author}, {$push : {'activityFeed' : {$position: 0, $each: [activityFeedUpdate]}}}, {new : true}, (err, updatedActivityUser) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });
};

module.exports.processNewGuide = processNewGuide;
module.exports.updateExistingGuide = updateExistingGuide;
module.exports.deleteGuide = deleteGuide;
module.exports.s3Delete = s3Delete;
module.exports.guideSubmissionActivityFeedUpdate = guideSubmissionActivityFeedUpdate;
module.exports.guideCommentActivityFeedUpdate = guideCommentActivityFeedUpdate;