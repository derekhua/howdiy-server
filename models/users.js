var mongoose        = require('mongoose');
var bcrypt          = require('bcrypt');
var uniqueValidator = require('mongoose-unique-validator');

// User Schema
var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String, 
    unique: true,
    required: true 
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
  profilePicture: {
    type: String,
    default: "https://s3.amazonaws.com/howdiy/default_profilepicture.png"
  },
  savedGuides: [],
  submittedGuides: [],
  drafts: [],
  likedGuides: [],
  sharedGuides: [],
  followers: [],
  followings: []
},{minimize: false});

// Apply the uniqueValidator plugin to userSchema.
userSchema.plugin(uniqueValidator);

userSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        console.log('here');
        next();
      });
    });
  } else {
    return next();
  }
});

userSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

var Users = module.exports = mongoose.model('Users', userSchema);

module.exports.getUser = function(params, projection, callback, limit) {
  Users.findOne(params, projection, callback).limit(limit);
};

module.exports.getUsers = function(params, projection, callback, limit) {
  Users.find(params, projection, callback).limit(limit);
};

module.exports.addUser = function(user, callback) {
  Users.create(user, callback);
};

module.exports.updateUser = function(conditions, update, options, callback) {
  Users.findOneAndUpdate(conditions, update, options, callback);
}
