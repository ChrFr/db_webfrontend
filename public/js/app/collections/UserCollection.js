/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["backbone", "models/UserModel"],

    function(Backbone, UserModel) {

        // Creates a new Backbone Collection class object
        var UserCollection = Backbone.Collection.extend({

            model: UserModel,
            
            url: 'api/users',

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