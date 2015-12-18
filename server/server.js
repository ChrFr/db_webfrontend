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
    errorHandler = require('error-handler'),
    fs = require('fs'),
    morgan = require('morgan'),
    FileStreamRotator = require('file-stream-rotator'),
    log4js = require('log4js');

// SERVER CONFIGURATION

// morgan logger for automated logging (logs all requests in seperate daily files)
fs.existsSync(__dirname + '/../logs') || fs.mkdirSync(__dirname + '/../logs'); //create parent directory if not exists
var logDirectory = __dirname + '/../logs/daily-access';
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
var accessLogStream = FileStreamRotator.getStream({
  filename: logDirectory + '/%DATE%.log',
  frequency: 'daily',
  verbose: false
});
app.use(morgan('combined', {stream: accessLogStream}));

// custom logging with log4js
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file(__dirname + '/../logs/access.log'), 'access');
var log = log4js.getLogger('access');
log.setLevel('ALL');

app.use(cookieParser(config.cookieSecret));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(express["static"](__dirname + "/../public"));
app.use('/api', require('./api')); 
    
// SERVER

// Start Node.js Server
http.createServer(app).listen(port);
