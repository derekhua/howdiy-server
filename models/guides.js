var mongoose = require('mongoose');

// Guide Schema
var guideSchema = mongoose.Schema({
  draft: {
    type: Boolean,
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
  category: {
    type: String,
    required: true
  },
  steps: [{
    picturePath: {
      type: String,
      default: ""
    },
    body: {
      type: String,
      default: ""
    }
  }],
  comments: [{
    username: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true 
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  meta: {
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    createDate: {
      type: Date,
      default: Date.now
    }
  },
});

var Guides = module.exports = mongoose.model('Guides', guideSchema);

module.exports.getGuide = function(params, callback, limit) {
  Guides.findOne(params, callback).limit(limit);
};

module.exports.getGuides = function(params, callback, limit) {
  Guides.find(params, callback).limit(limit);
};

module.exports.addGuide = function(guide, callback) {
  Guides.create(guide, callback);
};

module.exports.updateGuide = function(conditions, update, options, callback) {
  Guides.findOneAndUpdate(conditions, update, options, callback);
}