define(['backbone'],
  function (Backbone) {

    // Creates a new Backbone Collection class object
    var SubunitCollection = Backbone.Collection.extend({
      url: 'api/gebiete/basiseinheiten',
      initialize: function () {
      },
      
      //order function
      comparator: function (model) {
        return model.get('rs');
      },
    });
    return SubunitCollection;
  }

);