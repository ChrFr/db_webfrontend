/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', "backbone", "models/UserModel"],

    function(app, Backbone, UserModel) {

        // Creates a new Backbone Collection class object
        var UserCollection = Backbone.Collection.extend({

            model: UserModel,
            
            url: app.api.users,

            initialize: function(){   
            },
            
            //order function
            comparator: function(model) {
                return model.get('name');
            },
        });
        return UserCollection;
    }
);