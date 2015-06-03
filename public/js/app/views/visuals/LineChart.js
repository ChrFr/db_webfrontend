/*
    Author: Christoph Franke
    Publisher: GGR
*/

var LineChart = function(options){
    this.el = options.el || document;
    this.data = options.data;
    this.width = options.width;
    this.height = options.height;
    this.css = options.css;
    this.xlabel = options.xlabel || "x";
    this.ylabel = options.ylabel || "y";
    this.title = options.title || "";
    this.minY = options.minY;
    if (this.minY === undefined)  
        this.minY = d3.min(this.data, function(d) { return d3.min(d.y); });
    this.maxY = options.maxY;
    if (this.maxY === undefined){
        this.maxY = d3.max(this.data, function(d) { return d3.max(d.y); });
        this.maxY += (this.maxY - this.minY) * 0.1;
    };
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        
        var _this = this;                         

        var year = this.data.jahr;

        var margin = {
          top: 30,
          right: 50,
          bottom: 30,
          left: 40
        };

        var innerwidth = this.width - margin.left - margin.right,
            innerheight = this.height - margin.top - margin.bottom ;     
        
        var top = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', margin.left + this.width + margin.right)
            .attr('height', margin.top + this.height + margin.bottom);  
    
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

        var xScale = d3.scale.linear()
            .range([0, innerwidth])
            .domain([ d3.min(this.data, function(d) { return d3.min(d.x); }), 
                      d3.max(this.data, function(d) { return d3.max(d.x); }) ]) ;

        var yScale = d3.scale.linear()
            .range([innerheight, 0])
            .domain([ _this.minY, _this.maxY ]) ;

        var colorScale = d3.scale.category10()
            .domain(d3.range(this.data.length));
    
        // AXES

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient('left')
            .tickSize(-innerwidth);

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .tickSize(-innerheight)
            .tickFormat(d3.format("d"));
  
        var drawLine = d3.svg.line()
            .interpolate("basis")
            .x(function(d) { return xScale(d[0]); })
            .y(function(d) { return yScale(d[1]); }) ;
  
        var xApp = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", translation(0, innerheight)) 
            .call(xAxis);
    
        xApp.append("text")
            .attr("dy", "-.71em")
            .attr("x", innerwidth)
            .style("text-anchor", "end")
            .text(this.xlabel)
            .attr("transform", translation(0, margin.bottom));
            
        var yApp = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    
        yApp.append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(this.ylabel)
            .attr("transform", "rotate(-90), " + translation(0,-margin.left));
        
        var lines = svg.selectAll(".d3-chart-line")
            .data(this.data.map(function(d) {return d3.zip(d.x, d.y);}))
            .enter().append("g")
            .attr("class", ".d3-chart-line") ;
            
        lines.append("path")
            .attr("class", "line")
            .attr("d", function(d) {return drawLine(d); })
            .attr("stroke", function(_, i) {return colorScale(i);}) ;

        lines.append("text")
            .datum(function(d, i) { 
                return {
                    name: _this.data[i].label, 
                    final: d[d.length-1]}; 
                }) 
            .attr("transform", function(d) { 
                return ( translation(xScale(d.final[0]), yScale(d.final[1])));
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .attr("fill", function(_, i) { return colorScale(i); })
            .text(function(d) { return d.name; }) ;

        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }

        if(callback)
            callback(this.el.innerHTML);
    };
    
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined') 
    exports.init = LineChart;
