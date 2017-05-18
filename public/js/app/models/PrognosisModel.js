/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone"],

    function(app, Backbone) {

        var PrognosisModel = Backbone.Model.extend({
          
            urlRoot: app.api.prognoses,
            
            defaults: {
              name: '',
              description: '',
              users: [],
              basisjahr: ''
            },

            initialize: function() {
            }
        });
        return PrognosisModel;
    }
);