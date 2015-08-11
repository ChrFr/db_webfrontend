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
    this.onClick = options.onClick;
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        if(!d3slider)
            var d3slider = require('d3slider');
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

        var minZoom = this.height,
            maxZoom = 20 * minZoom;

        var zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([minZoom, maxZoom])
            .on("zoom", zoomed);

        var mouseover = function(d, i) {
            // ignore unmapped areas
            if(typeof d.id === 'undefined') return;
            
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

        var slideDiv = d3.select(this.el).append('div')
                .attr("id", "zoom-slider")
                .style("position", "absolute")
                .style("width", innerwidth + 'px');
    
        var slideZoom = function(event, value){
            zoom.scale(maxZoom * value / 100).event(g);
        };
    
        var zoomSlider = d3slider().axis(d3.svg.axis())
                .min(100 * minZoom/maxZoom).max(100)
                .on("slide", slideZoom);
                                
        slideDiv.call(zoomSlider);
        
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
                        aggregationMap[rs] = {id: aggr.id, rsArr: aggr.rs, name: aggr.name};
                    });
                });
                subunits.geometries.map( function( el ) {
                    var mapped = aggregationMap[el.id];
                    // unmapped areas (not belonging to any aggregate) will be ignored later
                    el.id = mapped? mapped.id: null;
                    el.properties.name = mapped? mapped.name: null;
                    el.properties.rsArr = mapped? mapped.rsArr: null;
                });
                
            };
            
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
                    .on("mouseout", mouseout)
                    .on("click", function(d) {
                        // aggregated?
                        //var rsArr = d.properties.rsArr? d.properties.rsArr: d.id;
                        _this.onClick(d.id, d.properties.name, d.properties.rsArr);
                    });
        
            // INTERIOR BOUNDARIES
            g.append("path")
                .datum(topojson.mesh(map, subunits, function(a, b) {return a !== b }))
                .attr("d", path)
                .attr("class", "subunit-boundary");        
        
            // DRAW OUTER BOUNDARY
            var outerPath = topojson.mesh(map, subunits, function(a, b) {return a === b });
            g.append("path")
                .datum(outerPath)
                .attr("d", path)
                .attr("class", "outer-boundary");           
        
            //ZOOM TO BOUNDING BOX OF OUTER PATH
            g.append("path")
                .datum(outerPath)
                .attr("d", path)
                .attr("class", "outer-boundary");    
            var bounds = path.bounds(outerPath),
                bdx = bounds[1][0] - bounds[0][0],
                bdy = bounds[1][1] - bounds[0][1],
                bx = (bounds[0][0] + bounds[1][0]) / 2,
                by = (bounds[0][1] + bounds[1][1]) / 2,
                bscale = .9 / Math.max(bdx / innerwidth, bdy / innerheight),
                translate = [innerwidth / 2 - bscale * bx, innerheight / 2 - bscale * by];  
                
            g.style("stroke-width", 1 / bscale + "px").attr("transform", "translate(" + translate + ")scale(" + bscale + ")");
        
            if(callback)
                callback(this.el.innerHTML);
            
            if(this.selectedId)
                this.select(selectedId);
        });
        var timerId;
        //ZOOM EVENT
        function zoomed() {
            var scale = d3.event.scale;
            projection.translate(d3.event.translate).scale(scale);
            g.selectAll("path").attr("d", path); 
            //if you zoom in and out too fast, d3 can't set the values properly and throws error
            //timer prevents this
            clearTimeout(timerId);
            timerId = setTimeout(function() { zoomSlider.value(100 * scale / maxZoom); }, 100);            
        }
        
        function translation(x,y) {
            return 'translate(' + x + ',' + y + ')';
        }
    };
    this.select = function(id){
        this.selectedId = id;
        d3.selectAll('.subunit').classed("selected", false);
        d3.selectAll('.key' + id).classed("selected", true);
    };
    
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = Map;
