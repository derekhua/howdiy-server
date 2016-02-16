var Guides        = require('../models/guides');
var Users         = require('../models/users');
var Thumbnails    = require('../models/thumbnails');
var AWS           = require('aws-sdk');
var ImageHelper   = require('../utility/image-helper');
var bucketURL    = "https://s3.amazonaws.com/howdiy/";
var S3 = new AWS.S3();

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
              console.log(err);y
            } else {
              console.log('image URL update success');
            }
          });
          
          var userUpdate;
          if (guide.draft) {
            userUpdate = {$push : { drafts : {"guideId" : guide._id} } }
          }
          else {
            userUpdate = {$push : { submittedGuides : {"guideId" : guide._id} } }
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
          
          var guideThumbnail = {
            guideId : guide._id,
            title : guide.title,
            author : guide.author,
            image : bucketURL + guide._id + "_" + guide.steps[0]._id + ".jpg",
            description : guide.description
          };
          
          Thumbnails.addThumbnail(guideThumbnail, function(err, addedThumbnail) {
            if (err) {
              console.log('Error occured in adding thumbnail');
              console.log(err);
            } else {
              console.log('thumbnail successfully added');
            }
          });
        }
      }
    });
  }
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
    
    //updates guide and thumbnail
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
      
      var guideThumbnail = {
        guideId : guide._id,
        title : guide.title,
        author : guide.author,
        image : bucketURL + guide._id + "_" + guide.steps[0]._id + ".jpg",
        description : guide.description
      };
      
      Thumbnails.updateThumbnail({'guideId' : guide._id}, guideThumbnail, function(err, addedThumbnail) {
        if (err) {
          console.log('Error occured in updating thumbnail');
          console.log(err);
        } 
        else {
          console.log('thumbnail successfully updated');
        }
      });
    }
  }
  
  //removes guide id from user drafts array and adds to user submitted array
  if (!guide.draft) {
    userUpdate = {$pull : { drafts : {"guideId" : guide._id} }, $push : { submittedGuides : {"guideId" : guide._id} } }
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

module.exports.processNewGuide = processNewGuide;
module.exports.updateExistingGuide = updateExistingGuide;