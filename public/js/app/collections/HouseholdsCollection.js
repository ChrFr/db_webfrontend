/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['backbone', 'collections/GenericPrognosisDataCollection', 
        'models/DemographicsModel', 'models/GenericPrognosisDataModel'],
  function (Backbone, GenericPrognosisDataCollection, GenericPrognosisDataModel, 
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
    var HouseholdsCollection = GenericPrognosisDataCollection.extend({
      // Tells the Backbone Collection that all of it's models will be of type Model 
      // (listed up top as a dependency), models can be AggregateModels as well (derived) 
      model: GenericPrognosisDataModel,
      category: 'haushalte'

      //urlRoot: null,
      //url: 'api/prognosen/{progId}/bevoelkerung/aggregiert?{rs}',
    });
    return HouseholdsCollection;
  }
);