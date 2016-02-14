var express   = require('express');
var passport  = require('passport');
var AWS       = require('aws-sdk'); 
var fs        = require('fs');
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers');
var Guides        = require('../models/guides');
require('../config/passport')(passport);

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  
  return response;
}

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
      if(err) {
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
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(guide);
        var S3 = new AWS.S3();
        var imagesUploaded = 0;
        for(i = 0; i < guide.steps.length; i++) {
          var filename = guide._id + "_" + i + ".jpg";
          var imageBuffer = decodeBase64Image(guide.steps[i].base64Picture);
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
              guide.steps[imagesUploaded].base64Picture = "";
              guide.steps[imagesUploaded].picturePath = "https://s3.amazonaws.com/howdiy/" + guide._id + "_" + imagesUploaded + ".jpg";
              imagesUploaded++;
              
              if (imagesUploaded === guide.steps.length) {
                Guides.updateGuide({'_id' : guide._id}, guide, {new: true}, function(err, updatedGuide) {
                  if(err) {
                    console.log('Error occured in image update');
                    console.log(err);
                  } else {
                    console.log('mongodb image update success');
                  }
                });
              }
            }
          });
        }
      }
    });
  });
});

// updates guide
// POST
router.post('/:_id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.updateGuide({'_id' : req.params._id}, req.body, {new: true}, function(err, guide) {
      if(err) {
        console.log('Error occured in updating');
        console.log(err);
      } else {
        res.json(guide);
      }
    });
  });
});

module.exports = router;
