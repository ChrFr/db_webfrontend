/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["backbone"],

    function(Backbone) {

        var PrognosisModel = Backbone.Model.extend({
            
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