/** 
 * @author Christoph Franke
 * 
 * @desc app singleton that is supposed to hold globals such as active session;
 * attributes can be set and monitored (set, get, bind), no direct access
 * remember to unbind bound functions, if you delete the monitoring object!
 */

define(['backbone'],
  function (Backbone) {

    var app = {
      root: '/', // root path of the application
      URL: '/', // base application URL
      API: '/api' // base Rest-API URL
    };
    
    // closure (private variables)
    var callbacks = {},
        attributes = {};

    // DEFAULTS      
    attributes.ageGroups =  [ // predefined age groups (may be varied by user)
      {from: 0, to: 19, name: '0 - 19'},
      {from: 20, to: 64, name: '20 - 64'},
      {from: 65, to: null, name: '65+'}
    ];
    attributes.session = null;
    attributes.activePrognosis = null;
    attributes.activeRegion = null;
    

    // bind an attribute to a callback (is called on change)
    app.bind = function (attribute, callback) {      
      if(!callbacks[attribute])
        callbacks[attribute] = [];
      callbacks[attribute].push(callback);
    };
    
    // unbind an attribute (possible ToDo: keep track of object asking, so not all listeners have to removed)
    app.unbind = function (attribute, callback) {     
      delete callbacks[attribute];
    };

    // set value of an attribute, bound callback is called 
    // (callbacks can be suppressed by passing doIgnore = true)
    app.set = function (attribute, value, doIgnore) {
      attributes[attribute] = value;
      if (!doIgnore && callbacks[attribute]){
        callbacks[attribute].forEach(function(callback){
          callback(value);
        });        
      }
    };

    // get the value of an attribute
    app.get = function (attribute) {
      return attributes[attribute];
    };

    return app;
  }
);