/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone"],

    function(app, Backbone) {

        var UserModel = Backbone.Model.extend({
          
            urlRoot: app.api.users,
            
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