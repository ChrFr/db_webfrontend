// Router.js
// ----------------
define(["app", "backbone", "views/HomeView", 
    "views/LoginView", "views/PrognosisView", "views/AdminView", 
    "views/DemographicDevelopmentView"],

    function(app, Backbone, Home, Login, Prognosis, Admin, DemographicDevelopmentView) {

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
                "bevoelkerungsprognose": "demodevelop"
            },

            home: function() {   
                this.view = new Home({el: document.getElementById('mainFrame')});
            },
            
            prognoses: function() {
               // if (!app.session.get('authenticated')) {
               //     this.navigate("login", {trigger: true});
               // } 
              //  else
                this.view = new Prognosis({el: document.getElementById('mainFrame')});
            },
            
            demodevelop: function(bla, blu){
                if(!app.get('activePrognosis') || app.get('activePrognosis') < 0){
                    this.navigate("prognosen", {trigger: true});
                }
                else
                    this.view = new DemographicDevelopmentView({el: document.getElementById('mainFrame')});
            },
            
            login: function() {   
                this.view = new Login({el: document.getElementById('mainFrame'),
                                       session: this.session});
            },
            
            admin: function(){
                var user = app.session.get('user');
                if (user && user.superuser)
                    this.view = new Admin({el: document.getElementById('mainFrame')});
            }

        });

        return Router;
    }
);