/*
    Author: Christoph Franke
    Publisher: GGR
*/

var GroupedBarChart = function(options){
    this.el = options.el || document;
    this.data = options.data;
    this.width = options.width;
    this.height = options.height;
    this.css = options.css;
    this.xlabel = options.xlabel || "x";
    this.ylabel = options.ylabel || "y";
    this.yNegativeLabel = options.yNegativeLabel;
    this.title = options.title || "";
    this.groupLabels = options.groupLabels;
    var minY = options.minY;
    if (minY === undefined)  
        minY = d3.min(this.data, function(d) { return d3.min(d.values); }) * 1.3;
    var maxY = options.maxY;
    if (maxY === undefined)
        maxY = d3.max(this.data, function(d) { return d3.max(d.values); }) * 1.3;
    
    //prevent that there are no pos. or neg. axes, axis is at least 30% of other axis (or 1)
    this.minY = d3.min([minY, -(maxY * 0.3), -1]);
    this.maxY = d3.max([-(minY * 0.3), maxY, 1]);
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        
        var _this = this;                         

        var margin = {
          top: 30,
          right: 0,
          bottom: 70,
          left: 40
        };

        var innerwidth = this.width - margin.left - margin.right,
            innerheight = this.height - margin.top - margin.bottom ;     
        
        var top = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', this.width )
            .attr('height', this.height);  
    
        if(this.css){
            var defs = top.append('defs');
            var style = defs.append('style');  
            //style.type = 'text/css';                
            style.attr("type", "text/css");     
            style.html(this.css);  
        }

        // create svg
        var svg = top.append('svg')
              .append('g')
              .attr('transform', translation(margin.left, margin.top));   

        // TITLE

        svg.append("text")
            .attr('class', 'title')
            .attr("x", margin.left / 2)             
            .attr("y", 0 - (margin.top / 2))
            .text(this.title);

        // SCALES
        
        var x0Scale = d3.scale.ordinal()
            .rangeRoundBands([0, innerwidth], .1)
            .domain(this.data.map(function(d) { return d.label; }));

        var x1Scale = d3.scale.ordinal()
            .domain(this.groupLabels).rangeRoundBands([0, x0Scale.rangeBand()]);
    
        var yScale = d3.scale.linear()
            .range([innerheight, 0])
            .domain([ _this.minY, _this.maxY ]) ;

        var colorScale = d3.scale.category10()
            .domain(d3.range(this.groupLabels.length));

        // AXES
        
        var xAxis = d3.svg.axis()
            .scale(x0Scale)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");  
  
        var xApp = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", translation(0, innerheight)) 
            .call(xAxis);
    
        xApp.append("text")
            .attr("dy", "-.71em")
            .attr("x", innerwidth)
            .style("text-anchor", "end")
            .text(this.xlabel)
            .attr("transform", translation(0, 0));
            
        var yApp = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    
        yApp.append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(this.ylabel)
            .attr("transform", "rotate(-90), " + translation(0,-margin.left));  
    
        if(this.yNegativeLabel)
            yApp.append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(this.yNegativeLabel)
            .attr("transform", "rotate(-90), " + translation(- innerheight + margin.bottom, -margin.left)); 
    
        // BARS
        
        var groups = svg.selectAll(".group")
            .data(this.data)
            .enter().append("g")
              .attr("class", "g")
              .attr("transform", function(d) { return translation(x0Scale(d.label), 0); });
      
        groups.selectAll("rect")
            .data(function(d) { return d.values; })
            .enter().append("rect")
                .attr("width", x1Scale.rangeBand())
                .attr("x", function(d, i) { return x1Scale(_this.groupLabels[i]); })
                .attr("y", function(d) { return yScale(Math.max(0, d)); })
                .attr("height", function(d) { return Math.abs(yScale(d) - yScale(0)); })
                .style("fill", function(d, i) { return colorScale(i); });

        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }
        
        var legend = svg.selectAll(".legend")
            .data(_this.groupLabels.slice().reverse())
            .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return translation(0, innerheight + 20 + i * 20); });

        legend.append("rect")
            .attr("x", innerwidth - 18)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d, i) { return colorScale(i); });

        legend.append("text")
            .attr("x", innerwidth - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

        if(callback)
            callback(this.el.innerHTML);
    };
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = GroupedBarChart;
