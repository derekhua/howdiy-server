"use strict";
const Guides        = require('../models/guides');
const Users         = require('../models/users');
const AWS           = require('aws-sdk');
const ImageHelper   = require('../utility/image-helper');
const bucketURL     = "https://s3.amazonaws.com/howdiy/";
const S3            = new AWS.S3();

const processNewGuide = guide => {
  let imagesUploaded = 0;
  
  for(let i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    let filename = `${guide._id}_${guide.steps[i]._id}.jpg`;
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
            } else {
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
          
  Users.updateUser(
    {'username' : guide.author},
    userUpdate,
    {new: true},
    (err, updatedGuide) => {
      if (err) {
        console.log('Error occured in user update');
        console.log(err);
      } else {
        console.log('user update success');
      }
    }
  );
};

const updateExistingGuide = guide => {
  for (let i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    if (ImageHelper.isBase64String(guide.steps[i].picturePath)) {
      let filename = `${guide._id}_${guide.steps[i]._id}.jpg`;
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
    userUpdate = {$pull : { drafts : guide._id.toString() }, $push : { submittedGuides : guide._id.toString() } }
    Users.updateUser(
      {'username' : guide.author},
      userUpdate,
      {new: true},
      (err, updatedGuide) => {
        if (err) {
          console.log('Error occured in user update');
          console.log(err);
        } 
        else {
          console.log('user update success');
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
      for (let i = 0; i < guide.steps.length; i++) {
        keys.push({'Key' : `${req.params._id}_${guide.steps[i]._id}.jpg`});
      }
      s3Delete(keys);
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

var s3Delete = keys => {
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

module.exports.processNewGuide = processNewGuide;
module.exports.updateExistingGuide = updateExistingGuide;
module.exports.deleteGuide = deleteGuide;
module.exports.s3Delete = s3Delete;