define(["backbone","models/RegionModel"],

    function(Backbone, RegionModel) {

        // Creates a new Backbone Collection class object
        var RegionCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: RegionModel,
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/gemeinden/',

            initialize: function(options){   
                this.url = this.url.replace('{progId}', options.progId);
            },    
        });
        return RegionCollection;
    }
);