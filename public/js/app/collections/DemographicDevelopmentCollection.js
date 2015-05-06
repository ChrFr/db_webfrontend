define(["backbone","models/DemographicDevelopmentModel"],

    function(Backbone, DemographicDevelopmentModel) {

        // Creates a new Backbone Collection class object
        var DemographicDevelopmentCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: DemographicDevelopmentModel,
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/',

            initialize: function(options){ 
                this.progId = options.progId;                
                this.rs = options.rs;
                this.url = this.url.replace('{progId}', this.progId);
            },    
            
            fetchDetails: function(options){
                if(!options.rs)
                    options.error(null, 'rs is missing')
                var ddModel = this.find(function(item){
                    return item.get('rs') === options.rs;
                });              
                ddModel.setURL(this.progId, options.rs);
                ddModel.fetch({success: options.success,
                               error: options.error});
            }
        });
        return DemographicDevelopmentCollection;
    }
);