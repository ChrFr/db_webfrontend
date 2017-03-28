/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone"],

    function(app, Backbone) {

        var LayerCollection = Backbone.Collection.extend({            
            url: app.api.layers
        });
        return LayerCollection;
    }
);