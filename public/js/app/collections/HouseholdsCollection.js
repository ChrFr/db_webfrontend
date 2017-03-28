/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'backbone', 'collections/GenericPrognosisDataCollection', 
        'models/HouseholdsModel'],
  function (app, Backbone, GenericPrognosisDataCollection, HouseholdsModel) {

    var HouseholdsCollection = GenericPrognosisDataCollection.extend({
      model: HouseholdsModel,
      category: app.api.households
    });
    return HouseholdsCollection;
  }
);