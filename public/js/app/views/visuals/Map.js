/*
    Author: Christoph Franke
    Publisher: GGR
*/

var Map = function(options){
    this.el = options.el || document;
    // data will be modified
    this.url = options.url;
    this.width = options.width;
    this.height = options.height;
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        if(!topojson)            
            var topojson = require('topojson');
        
        var _this = this;                       
        
        var margin = {
          top: 30,
          right: 0,
          bottom: 70,
          left: 60
        };

        var innerwidth = this.width - margin.left - margin.right,
            innerheight = this.height - margin.top - margin.bottom ;     
        
        var svg = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', this.width )
            .attr('height', this.height);  
    

        d3.json(this.url, function(error, map) {
            if (error) return console.error(error);
            console.log(map)
            
            var projection = d3.geo.mercator()
                .center([10.5, 51.35])
                .scale(innerwidth * 4)
                .translate([innerwidth / 2, innerheight / 2]);
        
            var path = d3.geo.path()
                .projection(projection);
        
            var mouseover = function(d, i) {
                var tooltip = d3.select('body').append("div").attr("class", "tooltip");
                var bar = d3.select(this);
                bar.classed("highlight", true);
                tooltip.style("opacity", .9);     
                //var parent = d3.select(this.parentNode); 
                console.log(d.properties.name)
                tooltip.html(d.properties.name);

                tooltip.style("left", (d3.event.pageX + 10) + "px")     
                       .style("top", (d3.event.pageY - parseInt(tooltip.style("height"))) + "px"); 
            };     

            var mouseout = function(){
                d3.select(this).classed("highlight", false);     
                d3.select('body').selectAll("div.tooltip").remove();
            };
        
            // FEATURE-SHAPES
            svg.selectAll(".subunit")
                .data(topojson.feature(map, map.objects.test).features)
              .enter().append("path")
                .attr("class", function(d) { return "subunit rs" + d.id; })
                .attr("d", path)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        
            // INTERIOR BOUNDARIES
            svg.append("path")
                .datum(topojson.mesh(map, map.objects.test, function(a, b) {return a !== b }))
                .attr("d", path)
                .attr("class", "subunit-boundary");        
        
            if(callback)
                callback(this.el.innerHTML);
        });
        
        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }
    };
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = Map;
