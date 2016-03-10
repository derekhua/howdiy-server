"use strict";
const bodyParser  = require('body-parser');
const express     = require('express');
const helmet      = require('helmet');
const jwt         = require('jwt-simple');
const mongoose    = require('mongoose');
const morgan      = require('morgan');
const passport    = require('passport');

const index     = require('./routes/index');
const config    = require('./config/database');
const signup    = require('./routes/signup');
const auth      = require('./routes/authenticate');
const guides    = require('./routes/guides');
const users     = require('./routes/users');
const search    = require('./routes/search');

const app = express();

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
// Parse application/json
app.use(bodyParser.json({limit: '50mb'}));
app.use(helmet());
// HTTP request logger
app.use(morgan('combined'));
app.use(passport.initialize());

// Connect to the howdiy_db
mongoose.connect(config.database);
const db = mongoose.connection;

// Set port number
app.set('port', process.env.PORT || 3000);

// For cross-domain requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Authorization"
  );
  next();
});

app.get('/', (req, res) => {res.send('Use /api/');});
app.use('/api/', index);
app.use('/api/signup', signup);
app.use('/api/auth', auth);
app.use('/api/g', guides);
app.use('/api/u', users);
app.use('/api/search', search);

app.listen(app.get('port'), () => {
  console.log(
    `Express started! Running on port ${app.get('port')}. Press CTRL-C to terminate`
  );
});
