var mongoose = require('mongoose');

// Thumbnail Schema
var thumbnailSchema = mongoose.Schema({
  guideId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  picturePath: {
    type: String,
    default: ""
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
});

var Thumbnails = module.exports = mongoose.model('Thumbnails', thumbnailSchema);

module.exports.getThumbnail = function(params, callback, limit) {
  Thumbnails.findOne(params, callback).limit(limit);
};

module.exports.getThumbnails = function(params, callback, limit) {
  Thumbnails.find(params, callback).limit(limit);
};

module.exports.addThumbnail = function(thumbnail, callback) {
  Thumbnails.create(thumbnail, callback);
};
