// Router.js
// ----------------
define(["app", "backbone", "views/HomeView", 
    "views/LoginView", "views/PrognosisView"],

    function(app, Backbone, Home, Login, Prognosis) {

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
                "login": "login"
            },

            home: function() {   
                this.view = new Home({el: document.getElementById('mainFrame')});
            },
            
            prognoses: function() {   
                this.view = new Prognosis({el: document.getElementById('mainFrame')});
            },
            
            login: function() {   
                this.view = new Login({el: document.getElementById('mainFrame'),
                                       session: this.session});
            }

        });

        return Router;
    }
);