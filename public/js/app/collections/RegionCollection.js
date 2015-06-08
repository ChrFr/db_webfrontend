define(["backbone"],

    function(Backbone, RegionModel) {

        // Creates a new Backbone Collection class object
        var RegionCollection = Backbone.Collection.extend({
            
            url: 'api/regionen/gemeinden',

            initialize: function(options){   
            },    
            
            //order function
            comparator: function(model) {
                return model.get('rs');
            },
        });
        return RegionCollection;
    }
);