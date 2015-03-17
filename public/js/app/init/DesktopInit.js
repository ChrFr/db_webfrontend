// DesktopInit.js
// --------------

// Includes Desktop Specific JavaScript files here (or inside of your Desktop router)
require(["jquery", "backbone", "routers/Router",
    "jqueryui", "bootstrap", "backbone.validateAll"],

  function($, Backbone, Router) {
    //Desktop and Mobile Router call the same Router by now, no difference made
    new Router();
  }

);