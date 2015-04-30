define(["backbone"],

    function(Backbone) {

        // Creates a new Backbone Collection class object
        var UserCollection = Backbone.Collection.extend({

            //model: RegionModel,
            
            url: 'api/users',

            initialize: function(){   
            },    
        });
        return UserCollection;
    }
);