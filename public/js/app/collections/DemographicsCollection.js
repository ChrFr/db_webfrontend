/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['backbone', 'collections/GenericPrognosisDataCollection', 
        'models/DemographicsModel'],
  function (Backbone, GenericPrognosisDataCollection, DemographicsModel) {

    var DemographicsCollection = GenericPrognosisDataCollection.extend({
      model: DemographicsModel,
      category: 'bevoelkerung'
    });
    return DemographicsCollection;
  }
);