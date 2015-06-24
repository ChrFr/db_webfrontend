// Require.js Configurations
// -------------------------
require.config({

  // Sets the js folder as the base directory for all future relative paths
  baseUrl: "js/app",

  // 3rd party script alias names (Easier to type "jquery" than "libs/jquery, etc")
  // probably a good idea to keep version numbers in the file names for updates checking
  paths: {

      // Core Libraries
      // --------------
      "jquery": "../libs/jquery",

      "underscore": "../libs/lodash",

      "backbone": "../libs/backbone",
      
      "d3": "../libs/d3.min",
      
      "d3slider": "../libs/d3.slider",
      
      "filesaver": "../libs/FileSaver.min",
      
      "tableexport": "../libs/tableExport.min",

      // Plugins
      // -------
      "backbone.validateAll": "../libs/Backbone.validateAll",

      "bootstrap": "../libs/bootstrap.min",
      
      "bootstraptable": "../libs/bootstrap-table.min",

      "text": "../libs/text",

      "jasminejquery": "../libs/jasmine-jquery"
  },

  // Sets the configuration for your third party scripts that are not AMD compatible
  shim: {

      // jQuery Mobile
      "jquerymobile": ["jquery"],

      // Twitter Bootstrap jQuery plugins
      "bootstrap": ["jquery"],     
      
      "bootstraptable": ["jquery"],

      // Backbone.validateAll plugin that depends on Backbone
      "backbone.validateAll": ["backbone"],

      // Jasmine-jQuery plugin
      "jasminejquery": ["jquery"],
      
      "d3slider": ["d3"]

  }

});
require(['main']);