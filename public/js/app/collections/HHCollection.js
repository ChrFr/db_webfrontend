/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['backbone', 'collections/GenericPrognosisDataCollection', 
        'models/DDModel', 'models/DDAggregate'],
  function (Backbone, GenericPrognosisDataCollection, DDModel, DDAggregate) {

    /** 
     * @author Christoph Franke
     * 
     * @desc collection to store models for demographic data 
     * 
     * @param  options.progId  id of the prognosis the demo. data belongs to  
     *  
     * @return the DemographicDevelopmentCollection class
     */   
    var DemographicDevelopmentCollection = GenericPrognosisDataCollection.extend({
      // Tells the Backbone Collection that all of it's models will be of type Model 
      // (listed up top as a dependency), models can be AggregateModels as well (derived) 
      model: DDModel,
      AggregateModel: DDAggregate,
      url: 'api/prognosen/{progId}/haushaltsprognose/',
      
      initialize: function (options) {
        this.progId = options.progId;
        this.url = this.url.replace('{progId}', this.progId);
      }
    });
    return DemographicDevelopmentCollection;
  }
);