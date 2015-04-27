require(["app", "router", "models/SessionModel", "views/NavbarView"],

function(app, Router, SessionModel, Navbar) {
    //before anything else happens, check if already logged in
    app.session = new SessionModel();
    app.session.check();
    
    //attach navbar
    app.navbar = new Navbar();
    
    //start backbone routing
    app.router = new Router();
});