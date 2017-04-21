/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["app", "backbone"],
  function (app, Backbone) {

    /** 
     * @author Christoph Franke
     * 
     * @desc model for prognosis data 
     * 
     * @param  options.rs the rs of the region the data is based on, serves as an id  
     * @param  options.name optional, alternative name for region
     * @param  options.rsAggr optional, array of rs of multiple regions, if region is aggregated
     * @param  options.url optional, needed if region is manually added (e.g. when aggregated)
     *  
     * @return the model holding prognosis data
     */   
    var DataModel = Backbone.Model.extend({
      idAttribute: 'rs',
      aggregationSuffix: 'aggregiert?{rs}',      
      initialize: function (options) {
        if (options.rsAggr){
          this.url = options.url + 'aggregiert?rs[]=' + 
                     options.rsAggr.join('&rs[]=');
        }
        if (options.name){
          this.set('name', options.name);
        }
      },
      
    });
    return DataModel;
  }
);