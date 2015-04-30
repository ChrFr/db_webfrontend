require(["app", "router", "models/SessionModel", "views/NavbarView"],

function(app, Router, SessionModel, Navbar) {
    //before anything else happens, check if already logged in by fetching
    //(cookies are used)
    app.session = new SessionModel();
    app.session.fetch({
        success: render,
        error: render
    });
    
    function render(){
        app.router = new Router();
        app.navbar = new Navbar();        
    }
});