/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone"],

    function(app, Backbone) {

        // Creates a new Backbone Collection class object
        var LayerCollection = Backbone.Collection.extend({
            
            url: app.api.layers
        });
        return LayerCollection;
    }
);