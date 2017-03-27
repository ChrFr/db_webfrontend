/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'backbone'],
  function (app, Backbone) {

    // Creates a new Backbone Collection class object
    var SubunitCollection = Backbone.Collection.extend({
      url: app.api.subunits,
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