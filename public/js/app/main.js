require(["app", "router", "models/SessionModel", "views/NavbarView",  
    "collections/PrognosisCollection"],

function(app, Router, SessionModel, Navbar, PrognosisCollection) {
    //before anything else happens, check if already logged in by fetching
    //(cookies are used)
    app.session = new SessionModel();
    app.session.fetch({
        success: render,
        error: render
    });   
    
    //load available prognoses on user change
    app.prognoses = new PrognosisCollection();    
    
    function render(){
        console.log(app.session)
        app.router = new Router();
        app.navbar = new Navbar();        
    }
});