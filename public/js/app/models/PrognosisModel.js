define(["backbone"],

    function(Backbone) {

        var PrognosisModel = Backbone.Model.extend({
            
            urlRoot: 'api/prognosen',            
            
            defaults: {
            },

            initialize: function() {
            },
        });
        return PrognosisModel;
    }
);