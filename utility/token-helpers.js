"use strict";
const config  = require('../config/database');
const jwt     = require('jwt-simple');
const Users   = require('../models/users');

const verifyToken = (req, res, callback) => {
  let token = getToken(req.headers);
  if (token) {
    let decoded = jwt.decode(token, config.secret);
    Users.getUser({username: decoded.username}, (err, user) => {
      if (err) {
        console.log(err);
      }
      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }
      callback(req, res);
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
};

const getToken = headers => {
  if (headers && headers.authorization) {
    let parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports.verifyToken = verifyToken;
module.exports.getToken = getToken;
