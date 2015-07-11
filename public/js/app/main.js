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
                
    app.ageGroups = [
        {from: 0, to: 20, name: "0 - 20"},
        {from: 20, to: 65, name: "20 - 65"},
        {from: 65, to: null, name: "65+"}
    ];
    
    function render(){
        app.router = new Router();
        app.navbar = new Navbar();        
    }
});