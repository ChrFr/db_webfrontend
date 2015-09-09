define(['backbone'],
  function (Backbone) {

    // Creates a new Backbone Collection class object
    var CommunityCollection = Backbone.Collection.extend({
      url: 'api/layers/gemeinden',
      initialize: function () {
      },
      
      //order function
      comparator: function (model) {
        return model.get('rs');
      },
    });
    return CommunityCollection;
  }

);