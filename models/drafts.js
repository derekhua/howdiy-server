var mongoose = require('mongoose');

// Draft Schema
var draftSchema = mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  picturePath: {
    type: String
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
      type: String
    },
    body: {
      type: String,
      default: ""
    },
    comments: [{
      body: String,
      date: Date
    }]
  }],
  comments: [{
    body: String,
    date: Date
  }],
  meta: {
    favs: Number,
    createDate: {
      type: Date,
      default: Date.now
    }
  }
});

var Drafts = module.exports = mongoose.model('Drafts', draftSchema);

module.exports.getDraft = function(params, callback, limit) {
  Drafts.findOne(params, callback).limit(limit);
};

module.exports.getDrafts = function(params, callback, limit) {
  Drafts.find(params, callback).limit(limit);
};

module.exports.addDraft = function(draft, callback) {
  Drafts.create(draft, callback);
};
