var express   = require('express');
var passport  = require('passport');
var AWS       = require('aws-sdk'); 
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers');
var Guides        = require('../models/guides');
var Users         = require('../models/users');
var Thumbnails    = require('../models/thumbnails');
var ImageHelper   = require('../utility/image-helper');
var bucketLink    = "https://s3.amazonaws.com/howdiy/";
var S3 = new AWS.S3();
require('../config/passport')(passport);

// GET
// Returns all guides
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuides(function(err, guides) {
      if(err) {
        console.log(err);
      }
      res.json(guides);
    });
  });
});

// Returns single guide according to id
router.get('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuide({ '_id': req.params._id }, function(err, guide) {
      if (err) {
        console.log(err);
      }
      res.json(guide);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.addGuide(req.body, function(err, guide) {
      if (err) {
        console.log('Error occured in adding');
        console.log(err);
      } 
      else {
        var imagesUploaded = 0;
        for(i = 0; i < guide.steps.length; i++) {
          var filename = guide._id + "_" + i + ".jpg";
          var imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
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
              console.log("Successfully uploaded " + guide._id + "_" + imagesUploaded + ".jpg");
              guide.steps[imagesUploaded].picturePath = bucketLink + guide._id + "_" + imagesUploaded + ".jpg";
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
                  image : bucketLink + guide._id + "_0.jpg",
                  description : guide.description
                }
                
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
        res.json(guide);
      }
    });
  });
});

// updates guide
// POST
router.post('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.updateGuide({'_id' : req.params._id}, req.body, {new: true}, function(err, guide) {
      if (err) {
        console.log('Error occured in updating');
        console.log(err);
      } 
      else {
        for (i = 0; i < guide.steps.length; i++) {
          if (ImageHelper.isBase64String(guide.steps[i].picturePath)) {
            var filename = guide._id + "_" + i + ".jpg";
            var imageBuffer = ImageHelper.decodeBase64Image(guide.steps[i].picturePath);
            guide.steps[i].picturePath = bucketLink + filename;
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
              image : bucketLink + guide._id + "_0.jpg",
              description : guide.description
            }
            
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
        if (guide.draft === false) {
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
        
        res.json(guide);
      }
    });
  });
});

module.exports = router;
