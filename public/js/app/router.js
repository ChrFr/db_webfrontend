// Router.js
// ----------------
define(["app", "backbone", "views/HomeView", 
    "views/LoginView", "views/PrognosisView", "views/AdminView", 
    "views/DemographicDevelopmentView", "views/HouseholdsDevelopmentView"],

    function(app, Backbone, Home, Login, Prognosis, Admin, 
            DemographicDevelopmentView, HouseholdsDevelopmentView) {

        /**
        * Routes the applications URL's when using hash tags. 
        * <p>
        * @return   the DesktopRouterClass
        */
        var Router = Backbone.Router.extend({
            
            initialize: function() {
                Backbone.history.start();
            },

            routes: {
                "": "home",
                "prognosen": "prognoses",
                "login": "login",
                "admin": "admin",
                "bevoelkerungsprognose": "demodevelop",
                "haushaltsprognose": "hhdevelop"
            },

            home: function() {  
                this.resetView();
                this.view = new Home({el: document.getElementById('mainFrame')});
            },
            
            prognoses: function() {
                this.resetView();
                this.view = new Prognosis({el: document.getElementById('mainFrame')});
            },
            
            demodevelop: function(){
                this.resetView();
                if(!app.get('activePrognosis') || app.get('activePrognosis') < 0){
                    this.navigate("prognosen", {trigger: true});
                }
                else
                    this.view = new DemographicDevelopmentView({el: document.getElementById('mainFrame')});
            },
            
            hhdevelop: function(){
                this.resetView();
                if(!app.get('activePrognosis') || app.get('activePrognosis') < 0){
                    this.navigate("prognosen", {trigger: true});
                }
                else
                    this.view = new HouseholdsDevelopmentView({el: document.getElementById('mainFrame')});
            },
            
            login: function() {
                this.resetView();
                this.view = new Login({el: document.getElementById('mainFrame'),
                                       session: this.session});
            },
            
            admin: function(){
                this.resetView();
                var user = app.session.get('user');
                if (user && user.superuser)
                    this.view = new Admin({el: document.getElementById('mainFrame')});
            },
            
            resetView: function(){
                if(this.view) 
                    this.view.close(); 
                //unbinding and removing views removes the parent element too
                if(!document.getElementById('mainFrame')){
                    var mainFrame = document.createElement("div");
                    mainFrame.id = 'mainFrame';
                    document.body.appendChild(mainFrame);
                }
            }

        });

        return Router;
    }
);