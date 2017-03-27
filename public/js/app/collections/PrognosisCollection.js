/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone","models/PrognosisModel"],

    function(app, Backbone, PrognosisModel) {

        // Creates a new Backbone Collection class object
        var PrognosisCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: PrognosisModel,
            
            url: app.api.prognoses,

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