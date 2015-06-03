define(["backbone"],

    function(Backbone) {

        var PrognosisModel = Backbone.Model.extend({
            
            urlRoot: 'api/users',            
            
            defaults: {
                name: '',
                description: '',
                users: []
            },

            initialize: function() {
            },
        });
        return PrognosisModel;
    }
);