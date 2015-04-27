define(["backbone","models/AgeModel"],

    function(Backbone, AgeModel) {

        // Creates a new Backbone Collection class object
        var AgeCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: AgeModel,
            
            url: 'api/gemeinden/{rs}/bevoelkerungsprognose/',

            initialize: function(options){    
                this.url = this.url.replace('{rs}', options.rs);
            },    
        });
        return AgeCollection;
    }
);