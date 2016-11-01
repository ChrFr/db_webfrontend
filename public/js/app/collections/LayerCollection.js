/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["backbone"],

    function(Backbone) {

        // Creates a new Backbone Collection class object
        var LayerCollection = Backbone.Collection.extend({
            
            url: 'api/gebiete/',

            initialize: function(){   
            },    
        });
        return LayerCollection;
    }
);