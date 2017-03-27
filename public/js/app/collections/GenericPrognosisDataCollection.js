/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'backbone'],
  function (app, Backbone) {

    /** 
     * @author Christoph Franke
     * 
     * @desc collection to store models for prognosis data, deriving collections
     *       have to set the 'model' they are based on and a 'category' that 
     *       defines the subroute to the resources
     * 
     * @param  options.progId  id of the prognosis the data belongs to  
     *  
     * @return the collection holding models with prognosis data for different regions
     */   
    var GenericPrognosisDataCollection = Backbone.Collection.extend({
      
      url: function(){
        var url = app.api.prognoses + this.progId +  '/' + this.category + '/';
        return url;
      },
      
      initialize: function (options) {
        this.progId = options.progId;
      },
      
      /*
       * @desc get demographic model according to given region
       * 
       * @param region: object with name (optional) and rs
       * 
       * @return
       */
      getRegion: function (region) {        
        // check if model is already fetched (either base or aggregated region)
        // rs is the id of the models (resp. joined rs)
        var id = region.rs.join('-');
        var model = this.find(
          function (model) {
            return model.get('rs') == id;
        });
        if (model)
          // set name here, because server doesn't send it when fetching
          model.set('name', region.name);
        // fetch, if not fetched yet, may only happen with aggregated regions
        // (base regions are always fetched beforehand)
        else 
          model = this._getAggregateRegion(id, region.name, region.rs)
        return model;
        
        // aggregated -> get aggregation of communities
        
          //return this._getAggregateRegion(region.id, region.name, region.rs);
      },
      
      _getAggregateRegion: function (id, name, rsAggr) {
        var model = new this.model({
          rs: id,
          url: this.url(),
          name: name,
          progId: this.progId,
          rsAggr: rsAggr
        });
        this.add(model);
        return model;
      },
      
      fromCSV: function(file){
        var reader = new FileReader();
        reader.onload = (function(f) {
          return function(e) {
            console.log(e.target.result);
          };
        })(file);
      reader.readAsText(file);
      }       
      
    });
    return GenericPrognosisDataCollection;
  }
);