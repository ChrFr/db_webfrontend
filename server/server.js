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

// SERVER CONFIGURATION
// ====================
    
server.use(cookieParser());
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json());
server.use(session({secret: 'some_secret', 
                    saveUninitialized: true,
                    resave: true,
                    cookie: {
                        httpOnly: true,
                        secure: false
                    }
                }));

server.use(csrf());

server.use(express["static"](__dirname + "/../public"));
server.set('views', __dirname + '/../views');
server.engine('html', require('ejs').renderFile);
server.set('view engine', 'html');
server.get("/", function(req, res){
    res.render('index.html', { csrfToken: req.csrfToken() });
});    
server.use('/api', require('./api_routes')); 
    
//};


// SERVER
// ======

// Start Node.js Server
http.createServer(server).listen(port);
