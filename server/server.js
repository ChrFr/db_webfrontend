//author: Christoph Franke
//client: GGR
//purpose: configuration and start of node.js, call of api

// DEPENDENCIES

var express = require("express"),
    config = require('./config').serverconfig,
    http = require("http"),
    port = (process.env.PORT || config.port),
    app = module.exports = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    errorHandler = require('error-handler');

// SERVER CONFIGURATION
    
app.use(cookieParser(config.cookieSecret));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(express["static"](__dirname + "/../public"));
app.use('/api', require('./api')); 
    
// SERVER

// Start Node.js Server
http.createServer(app).listen(port);
