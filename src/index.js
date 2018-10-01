
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors')

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const blockchainService = require('./core/blockchain/service');

const {
  MONGO_URL,
  PORT
} = require('./config');

mongoose.connect(MONGO_URL);


const whitelist = ['http://localhost']
var corsOptions = {
  credentials: false,
  origin: function (origin, callback) {
    if (true)
      callback(null, true)
    else 
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

//app.use(cors(corsOptions));
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({
  extended: true
}));


// routes ======================================================================
require('./core/api/index')(app); // load our routes


// launch service 
blockchainService.startDaemon();

// launch ======================================================================
app.listen(PORT);
console.log('Listening on port ' + PORT);
