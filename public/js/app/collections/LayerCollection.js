define(["backbone"],

    function(Backbone) {

        // Creates a new Backbone Collection class object
        var LayerCollection = Backbone.Collection.extend({
            
            url: 'api/layer/',

            initialize: function(){   
            },    
        });
        return LayerCollection;
    }
);