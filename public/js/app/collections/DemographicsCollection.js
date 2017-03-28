/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'backbone', 'collections/GenericPrognosisDataCollection', 
        'models/DemographicsModel'],
  function (app, Backbone, GenericPrognosisDataCollection, DemographicsModel) {

    var DemographicsCollection = GenericPrognosisDataCollection.extend({
      model: DemographicsModel,
      category: app.api.demographics
    });
    return DemographicsCollection;
  }
);