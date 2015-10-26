define(["backbone","models/PrognosisModel"],

    function(Backbone, PrognosisModel) {

        // Creates a new Backbone Collection class object
        var PrognosisCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: PrognosisModel,
            
            url: 'api/prognosen/',

            initialize: function(options){ 
            },    
            
            //order function
            comparator: function(model) {
                return model.id;
            },
        });
        return PrognosisCollection;
    }
);