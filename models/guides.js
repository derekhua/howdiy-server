"use-strict";
const mongoose = require('mongoose');

// Guide Schema
const guideSchema = mongoose.Schema({
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
      type: Number,
      default: Date.now()
    }
  },
});

const Guides = module.exports = mongoose.model('Guides', guideSchema);

module.exports.getGuide = (params, projection, callback, limit) => {
  Guides.findOne(params, projection, callback).limit(limit);
};

module.exports.getGuides = (params, projection, callback, limit) => {
  Guides.find(params, projection, callback).limit(limit);
};

module.exports.addGuide = (guide, callback) => {
  Guides.create(guide, callback);
};

module.exports.updateGuide = (conditions, update, options, callback) => {
  Guides.findOneAndUpdate(conditions, update, options, callback);
};

module.exports.deleteGuide = (conditions, callback) => {
  Guides.remove(conditions, callback);
};
