// Router.js
// ----------------
define(["backbone", "views/HomeView", "views/TestView"],

    function(Backbone, Home, Test) {

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
                "test": "test"
            },

            home: function() {   
                this.view = new Home({el: document.getElementById('mainFrame')});
            },
            
            test: function() {   
                this.view = new Test({el: document.getElementById('mainFrame')});
            }

        });

        return Router;
    }
);