require(["app", "router", "models/SessionModel", "views/NavbarView"],

function(app, Router, SessionModel, Navbar) {
    //before anything else happens, check if already logged in by fetching
    //(cookies are used)
    app.session = new SessionModel();
    app.session.fetch();
    
    //attach navbar
    app.navbar = new Navbar();
    
    //start backbone routing
    app.router = new Router();
});