define(["backbone","models/PrognosisModel"],

    function(Backbone, PrognosisModel) {

        // Creates a new Backbone Collection class object
        var DemographicDevelopmentCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: PrognosisModel,
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose',

            initialize: function(options){ 
                this.progId = options.progId;
                this.url = this.url.replace('{progId}', this.progId);
            },    
        });
        return DemographicDevelopmentCollection;
    }
);