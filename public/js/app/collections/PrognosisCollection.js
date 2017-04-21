/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone","models/PrognosisModel"],

    function(app, Backbone, PrognosisModel) {

        var PrognosisCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: PrognosisModel,
            
            url: app.api.prognoses,
            
            //order function
            comparator: function(model) {
                return model.id;
            }
        });
        return PrognosisCollection;
    }
);