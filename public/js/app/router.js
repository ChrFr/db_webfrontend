// Router.js
// ----------------
define(["backbone", "views/NavbarView", "views/HomeView", "views/TestView", 
    "views/LoginView", "models/SessionModel"],

    function(Backbone, Navbar, Home, Test, Login, Session) {

        /**
        * Routes the applications URL's when using hash tags. 
        * <p>
        * @return   the DesktopRouterClass
        */
        var Router = Backbone.Router.extend({
            
            initialize: function() {
                this.navbar = new Navbar({session: this.session});
                this.session = new Session();
                Backbone.history.start();
            },

            routes: {
                "": "home",
                "test": "test",
                "login": "login"
            },

            home: function() {   
                this.view = new Home({el: document.getElementById('mainFrame')});
            },
            
            test: function() {   
                this.view = new Test({el: document.getElementById('mainFrame')});
            },
            
            login: function() {   
                this.view = new Login({el: document.getElementById('mainFrame'),
                                       session: this.session});
            }

        });

        return Router;
    }
);