define(["backbone", "models/DDModel"],

    function(Backbone, DDModel) {

        // Creates a new Backbone Collection class object
        var DemographicDevelopmentCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: DDModel,
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/',

            initialize: function(options){ 
                this.progId = options.progId;                
                this.rs = options.rs;
                this.url = this.url.replace('{progId}', this.progId);
            },    
            
            //Override
            //calculate additional data after successful fetch from server
            fetch: function(options){
                options || (options = {});
                var callback = options.success;
                
                options.success = function(collection, res, opt){
                    collection.each(function(model){
                        model.setURL(collection.progId);
                    })
                    //call given callback
                    if(callback)
                        callback(collection, res, opt);
                };

                return Backbone.Model.prototype.fetch.call(this, options);
            },            
            
        });
        return DemographicDevelopmentCollection;
    }
);