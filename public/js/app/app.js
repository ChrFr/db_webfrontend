//used to store globals of the app
define(["backbone"],
function(Backbone) {

    var app = {
        root : "/",                     // The root path to run the application through.
        URL : "/",                      // Base application URL
        API : "/api",                   // Base API URL (used by models & collections)
    };

    return app;

});