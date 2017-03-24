/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['backbone', 'collections/GenericPrognosisDataCollection', 
        'models/DemographicsModel', 'models/DemographicsAggregate'],
  function (Backbone, GenericPrognosisDataCollection, DemographicsModel, 
            DemographicsAggregate) {

    /** 
     * @author Christoph Franke
     * 
     * @desc collection to store models for demographic data 
     * 
     * @param  options.progId  id of the prognosis the demo. data belongs to  
     *  
     * @return the DemographicsCollection class
     */   
    var DemographicsCollection = GenericPrognosisDataCollection.extend({
      // Tells the Backbone Collection that all of it's models will be of type Model 
      // (listed up top as a dependency), models can be AggregateModels as well (derived) 
      model: DemographicsModel,
      AggregateModel: DemographicsAggregate,
      url: 'api/prognosen/{progId}/bevoelkerungsprognose/',
      
      initialize: function (options) {
        this.progId = options.progId;
        this.url = this.url.replace('{progId}', this.progId);
      }
    });
    return DemographicsCollection;
  }
);