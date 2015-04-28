//author: Christoph Franke
//client: GGR

// DEPENDENCIES
// ============
var express = require("express"),
    config = require('./config').serverconfig,
    http = require("http"),
    port = (process.env.PORT || config.port),
    app = module.exports = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorHandler = require('error-handler'),
    csrf = require('csurf');

// SERVER CONFIGURATION
// ====================
    
app.use(cookieParser(config.cookieSecret));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(session({secret: config.sessionSecret, 
                saveUninitialized: true,
                resave: true,
                cookie: {
                    httpOnly: true,
                    secure: false
                }
        }));

app.use(csrf());

app.use(express["static"](__dirname + "/../public"));
app.set('views', __dirname + '/../views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.get("/", function(req, res){
    res.render('index.html', { csrfToken: req.csrfToken() });
});    
app.use('/api', require('./api_routes')); 
    
// SERVER
// ======

// Start Node.js Server
http.createServer(app).listen(port);
