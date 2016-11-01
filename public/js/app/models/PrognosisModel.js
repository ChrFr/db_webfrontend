define(["backbone"],

    function(Backbone) {

        var PrognosisModel = Backbone.Model.extend({
            
            urlRoot: 'api/prognosen',            
            
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