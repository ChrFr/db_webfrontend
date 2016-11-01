/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['backbone', 'models/DDModel', 'models/DDAggregate'],
  function (Backbone, DDModel, DDAggregate) {

    /** 
     * @author Christoph Franke
     * 
     * @desc collection to store models for demographic data 
     * 
     * @param  options.progId  id of the prognosis the demo. data belongs to  
     *  
     * @return the DemographicDevelopmentCollection class
     */   
    var DemographicDevelopmentCollection = Backbone.Collection.extend({
      // Tells the Backbone Collection that all of it's models will be of type Model 
      // (listed up top as a dependency), models can be AggregateModels as well (derived) 
      model: DDModel,
      url: 'api/prognosen/{progId}/bevoelkerungsprognose/',
      
      initialize: function (options) {
        this.progId = options.progId;
        this.url = this.url.replace('{progId}', this.progId);
      },
      
      // Override
      // set the url to each model matching the id of current prognosis
      fetch: function (options) {
        options || (options = {});
        var callback = options.success;
        options.success = function (collection, res, opt) {
          collection.each(function (model) {
            model.setURL(collection.progId);
          });
          //call given callback
          if (callback)
            callback(collection, res, opt);
        };
        // call overriden method of prototype
        return Backbone.Model.prototype.fetch.call(this, options);     
      },
      
      /*
       * @desc get demographic model according to given region
       * 
       * @param region: object with id, name and rs (if aggregated)
       * 
       * @return
       */
      getRegion: function (region) {
        // not aggregated -> get simple community-model ("gemeinde")        
        if (!region.rs){
          var model = this.find(
            // for single communities rs is the id, only aggregates get an id 
            // (see _getAggregateRegion)
            function (model) {return model.get('rs') == region.id;
          }); 
          // set name here, because server doesn't send it when fetching
          model.set('name', region.name); 
          return model;
        }
        // aggregated -> get aggregation of communities
        else
          return this._getAggregateRegion(region.id, region.name, region.rs);
      },
      
      /*
       * @desc get an aggregated region from the collection or create it (as cache)
       * 
       * @param id     the id of the aggregate region you look for 
       *               (respectively a newly created one gets, if not exists)
       * @param rsAggr array of the keys of the regions (= rs) the aggregate consists of
       * @param name   the name the newly created aggregate gets if id not found
       * 
       * @return
       */
      _getAggregateRegion: function (id, name, rsAggr) {
        var model = this.find(function (model) {
          return model.get('id') == id;
        });
        if (!model) {
          model = new DDAggregate({
            id: id,
            name: name,
            progId: this.progId,
            rsAggr: rsAggr
          });
          this.add(model);
        };
        return model;
      },
      
      fromCSV: function(file){
        var reader = new FileReader();
        reader.onload = (function(theFile) {
          return function(e) {
            console.log(e.target.result);
          };
        })(file);
      reader.readAsText(file);
      }       
    });
    return DemographicDevelopmentCollection;
  }
);