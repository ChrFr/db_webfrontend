define(["backbone"],

    function(Backbone) {

        var UserModel = Backbone.Model.extend({
            
            urlRoot: 'api/users',
            
            defaults: {
                name: '',
                email: '',
                password: '',
                superuser: false
            },

            initialize: function() {
            },
            
        });
        return UserModel;
    }
);