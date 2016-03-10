"use-strict";
const JwtStrategy = require('passport-jwt').Strategy;

// Load up the user model
const User = require('../models/users');
// Get db config file
const config = require('./database');

module.exports = passport => {
  var opts = {};
  opts.secretOrKey = config.secret;
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findOne({id: jwt_payload.id}, (err, user) => {
      if (err) {
          return done(err, false);
      }
      if (user) {
          done(null, user);
      } else {
          done(null, false);
      }
    });
  }));
};
