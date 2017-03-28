/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone"],

    function(app, Backbone) {

        var UserModel = Backbone.Model.extend({
            
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