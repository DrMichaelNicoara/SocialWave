var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());


var bodyParser = require('body-parser');

// Set the maximum size of incoming requests to 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

exports.app = app;
