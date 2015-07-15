/*
    Author: Christoph Franke
    Publisher: GGR
*/

var Map = function(options){
    this.el = options.el || document;
    // data will be modified
    this.source = options.source;
    this.width = options.width;
    this.height = options.height;
    this.units = options.units || [];
    this.aggregates = options.aggregates;
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        if(!topojson)            
            var topojson = require('topojson');
        
        var _this = this;                       
        
        var margin = {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };

        var innerwidth = this.width - margin.left - margin.right,
            innerheight = this.height - margin.top - margin.bottom ;     
            
        var projection = d3.geo.mercator()
            .center([10.5, 51.35])
            .scale(2000)
            .translate([innerwidth / 2, innerheight / 2]);

        var path = d3.geo.path()
            .projection(projection);

        var zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([this.height, 150 * this.height]) //max zoom 150
            .on("zoom", zoomed);

        var mouseover = function(d, i) {
            var tooltip = d3.select('body').append("div").attr("class", "tooltip");
            var key = d3.select(this).attr('key');
            d3.selectAll('.key' + key).classed("highlight", true);
            tooltip.style("opacity", .9);     
            //var parent = d3.select(this.parentNode); 
            tooltip.html(d.properties.name);

            tooltip.style("left", (d3.event.pageX + 10) + "px")     
                   .style("top", (d3.event.pageY - parseInt(tooltip.style("height"))) + "px"); 
        };     

        var mouseout = function(){            
            //d3.select(this).classed("highlight", false); 
            d3.selectAll('.subunit').classed("highlight", false);
            d3.select('body').selectAll("div.tooltip").remove();
            };
            
        var svg = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', this.width )
            .attr('height', this.height);  
    
        var g = svg.append("g")
            .call(zoom);

        g.append("rect")
            .attr("class", "background")
            .attr("width", innerwidth)
            .attr("height", innerheight);

        d3.json(this.source, function(error, map) {
            if (error) return console.error(error);
            
            // only draw required shapes
            var subunits = {type: "GeometryCollection"};
            subunits.geometries = map.objects.subunits.geometries.filter( function( el ) {
                return _this.units.indexOf( el.id ) >= 0;
            });
            
            // join shapes
            if(_this.aggregates){
                
                var aggregationMap = {};
                _this.aggregates.forEach(function(aggr){
                    aggr.rs.forEach(function(rs){                        
                        aggregationMap[rs] = aggr.id;
                    });
                });
                subunits.geometries.map( function( el ) {
                    el.id = aggregationMap[el.id];
                });
            }
            
            // TOP-LEVEL
            g.append("g")
              .selectAll(".toplevel")
                .data(topojson.feature(map, map.objects.toplevel).features)
              .enter().append("path")
                .attr("class", "toplevel id")
                .attr("d", path);
        
            // FEATURE-SHAPES
            g.append("g")
              .selectAll(".subunit")
                .data(topojson.feature(map, subunits).features)
              .enter().append("path")
                .attr("class",  function(d){return "subunit key" + d.id;})
                .attr("key", function(d){return d.id})
                .attr("d", path)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        
            // INTERIOR BOUNDARIES
            g.append("path")
                .datum(topojson.mesh(map, subunits, function(a, b) {return a !== b }))
                .attr("d", path)
                .attr("class", "subunit-boundary");        
        
            // OUTER BOUNDARY
            g.append("path")
                .datum(topojson.mesh(map, subunits, function(a, b) {return a === b }))
                .attr("d", path)
                .attr("class", "outer-boundary");    
        
            if(callback)
                callback(this.el.innerHTML);
            
        });
        
        function zoomed() {
            projection.translate(d3.event.translate).scale(d3.event.scale);
            g.selectAll("path").attr("d", path);
        }
        
        function translation(x,y) {
            return 'translate(' + x + ',' + y + ')';
        }
    };
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = Map;
