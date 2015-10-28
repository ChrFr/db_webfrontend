/** 
 * @author Christoph Franke
 * 
 * @desc require.js configurations
 */

require.config({
  // Sets the js folder as the base directory for all future relative paths
  baseUrl: 'js/app',
  
  // alias names for required scripts + paths
  paths: {
    // Core Libraries      
    'jquery': '../libs/jquery',
    'underscore': '../libs/lodash',
    'backbone': '../libs/backbone',
    
    // Plugins      
    'backbone.validateAll': '../libs/Backbone.validateAll',
    'bootstrap': '../libs/bootstrap.min',
    'bootstraptable': '../libs/bootstrap-table.min',
    'text': '../libs/text',
    'jasminejquery': '../libs/jasmine-jquery',
    
    // D3 and geo-libs      
    'd3': '../libs/d3.min',
    'd3slider': '../libs/d3.slider',
    'topojson': '../libs/topojson.v1.min',
    
    // libs used to export data/graphics
    'filesaver': '../libs/FileSaver.min',
    'tableexport': '../libs/tableExport.min',
    'stackblur': '../libs/StackBlur',
    'rgbcolor': '../libs/rgbcolor',
    'canvg': '../libs/canvg',
    'pnglink': '../libs/jquery.pnglink',
    'jspdf': '../libs/jspdf.min'
  },
  // configuration for scripts that are not AMD compatible
  shim: {
    // jQuery Mobile
    'jquerymobile': ['jquery'],
    // Twitter Bootstrap jQuery plugins
    'bootstrap': ['jquery'],
    'bootstraptable': ['jquery'],
    // Backbone.validateAll plugin that depends on Backbone
    'backbone.validateAll': ['backbone'],
    // Jasmine-jQuery plugin
    'jasminejquery': ['jquery'],
    // for some reason this doesn't load into d3
    'd3slider': ['d3'],
    // pnglink as jquery-plugin
    'rgbcolor': ['pnglink'],
    'stackblur': ['pnglink'],
    'pnglink': ['jquery']
  }  
});
// load main file
require(['main']);