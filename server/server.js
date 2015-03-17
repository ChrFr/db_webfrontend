// DEPENDENCIES
// ============
var express = require("express"),
    config = require('./config').serverconfig,
    http = require("http"),
    port = (process.env.PORT || config.port),
    server = module.exports = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorHandler = require('error-handler'),
    csrf = require('csurf');

//var env = process.env.NODE_ENV || 'development';
//if ('development' == env) {
// SERVER CONFIGURATION
// ====================
    
    server.use(cookieParser());
    server.use(bodyParser.urlencoded({ extended: false }))
    server.use(bodyParser.json());
    server.use(session({secret: 'secret', 
                        saveUninitialized: true,
                        resave: true}));
    server.use(express["static"](__dirname + "/../public"));

    /*
    server.use(errorHandler({

      dumpExceptions: true,

      showStack: true

    }));*/

    server.use(csrf());
    
    server.use('/db', require('./api_routes')); 
    
//};


// SERVER
// ======

// Start Node.js Server
http.createServer(server).listen(port);
