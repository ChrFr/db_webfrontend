define(["backbone"],

    function(Backbone) {

        var UserModel = Backbone.Model.extend({
            
            urlRoot: 'api/users',
            
            defaults: {
                name: '',
                email: '',
                password: '',
                superuser: ''
            },

            initialize: function() {
            },
            
        });
        return UserModel;
    }
);