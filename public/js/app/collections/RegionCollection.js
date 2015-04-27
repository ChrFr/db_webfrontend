define(["backbone","models/RegionModel"],

    function(Backbone, AgeModel) {

        // Creates a new Backbone Collection class object
        var RegionCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: AgeModel,
            
            url: 'api/gemeinden/',

            initialize: function(options){   
            },    
        });
        return RegionCollection;
    }
);