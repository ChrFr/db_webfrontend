//used to store globals of the app
define(["backbone"],
function(Backbone) {

    var app = {
        root : "/",                     // The root path to run the application through.
        URL : "/",                      // Base application URL
        API : "/api",                   // Base API URL (used by models & collections)
        session : null,
        activePrognosis : null,
        callbacks : {},
        attributes : {}
    };    
    
    app.bind = function(attribute, callback){
        app.callbacks[attribute] = callback;
    }
    
    app.set = function(attribute, value){
        app.attributes[attribute] = value;
        if(app.callbacks[attribute])
            app.callbacks[attribute]();
    }
    
    app.get = function(attribute){
        return app.attributes[attribute];
    }

    return app;

});