/*
    Author: Christoph Franke
    Publisher: GGR
*/

var Map = function(options){
    this.el = options.el || document;
    // data will be modified
    this.data = JSON.parse(JSON.stringify(options.data));
    this.width = options.width;
    this.height = options.height;
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        
        var _this = this;                       
        
        var margin = {
          top: 30,
          right: 0,
          bottom: 70,
          left: 60
        };

        var innerwidth = this.width - margin.left - margin.right,
            innerheight = this.height - margin.top - margin.bottom ;     
        
        var top = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', this.width )
            .attr('height', this.height);  
    
        // create svg
        var svg = top.append('svg')
            .append('g')
            .attr('transform', translation(margin.left, margin.top));   

        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }

        if(callback)
            callback(this.el.innerHTML);
    };
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = StackedBarChart;
