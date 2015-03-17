// MobileInit.js
// -------------

// Include Mobile Specific JavaScript files here (or inside of your Mobile router)
require(["jquery", "backbone", "routers/Router", "jquerymobile", "backbone.validateAll"],

  function($, Backbone, Router) {

    // Prevents all anchor click handling
    $.mobile.linkBindingEnabled = false;

    // Disabling this will prevent jQuery Mobile from handling hash changes
    $.mobile.hashListeningEnabled = false;

    //Desktop and Mobile Router call the same Router by now, no difference made
    new Router();

  }

);