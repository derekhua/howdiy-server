var Guides        = require('../models/guides');
var Users         = require('../models/users');
var AWS           = require('aws-sdk');
var ImageHelper   = require('../utility/image-helper');
var bucketURL     = "https://s3.amazonaws.com/howdiy/";
var S3            = new AWS.S3();

var processNewGuide = function(guide) {
  var imagesUploaded = 0;
  
  for(i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    var filename = guide._id + "_" + guide.steps[i]._id + ".jpg";
    var imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
    guide.steps[i].picturePath = bucketURL + filename;
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
        console.log("Successfully uploaded " + guide._id + "image #" + imagesUploaded);
        imagesUploaded++;
        
        if (imagesUploaded === guide.steps.length) {
          Guides.updateGuide({'_id' : guide._id}, guide, {new: true}, function(err, updatedGuide) {
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
  
  var userUpdate;
  if (guide.draft) {
    userUpdate = {$push : { drafts : guide._id.toString()} }
  }
  else {
    userUpdate = {$push : { submittedGuides : guide._id.toString() } }
  }
          
  Users.updateUser({'username' : guide.author}, userUpdate,
  {new: true}, function(err, updatedGuide) {
    if (err) {
      console.log('Error occured in user update');
      console.log(err);
    } else {
      console.log('user update success');
    }
  });
};

var updateExistingGuide = function(guide) {
  for (i = 0; i < guide.steps.length; i++) {
    //sets picture to default image if no image is uploaded with a step
    if (guide.steps[i].picturePath.length === 0) {
      guide.steps[i].picturePath = ImageHelper.defaultStepImage;
    }
    
    if (ImageHelper.isBase64String(guide.steps[i].picturePath)) {
      var filename = guide._id + "_" + guide.steps[i]._id + ".jpg";
      var imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
      guide.steps[i].picturePath = bucketURL + filename;
      var s3Params = {
        Bucket: "howdiy",
        Key: filename,
        Body: imageBuffer.data
      };
      S3.putObject(s3Params, function(err, data) {
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
      Guides.updateGuide({'_id' : guide._id}, guide, {new: true}, function(err, updatedGuide) {
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
    Users.updateUser({'username' : guide.author}, userUpdate,
    {new: true}, function(err, updatedGuide) {
      if (err) {
        console.log('Error occured in user update');
        console.log(err);
      } 
      else {
        console.log('user update success');
      }
    });
  }
};

var deleteGuide = function(req, res) {
  
  Guides.getGuide({'_id': req.params._id}, function(err, guide) {
    if (err) {
      console.log(err);
    }
    else {
      var keys = [];
      for (i = 0; i < guide.steps.length; i++) {
        keys.push({'Key' : req.params._id + "_" + guide.steps[i]._id + ".jpg"});
      }
      s3Delete(keys);
      Guides.deleteGuide({'_id' : req.params._id}, function(err) {
        if (err) {
          console.log('Error occured in deleting');
          console.log(err);
        } 
        else {
          res.json({response : req.params._id + " guide deleted"});
        }
      });
    }
  });
  
  var update;
  if (req.body.guideType === 'draft') {
    update = {$pull : {drafts : req.params._id}};
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
}

var s3Delete = function(keys) {
  var params = {
    Bucket: 'howdiy', 
    Delete: {
      Objects: keys
    },
  };

  S3.deleteObjects(params, function(err, data) {
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