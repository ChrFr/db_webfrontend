/*
    Author: Christoph Franke
    Publisher: GGR
*/

var StackedBarChart = function(options){
    this.el = options.el || document;
    // data will be modified
    this.data = JSON.parse(JSON.stringify(options.data));
    this.width = options.width;
    this.height = options.height;
    this.css = options.css;
    this.xlabel = options.xlabel || "x";
    this.ylabel = options.ylabel || "y";
    this.title = options.title || "";
    this.stackLabels = options.stackLabels;
    this.bandName = options.bandName || 'band';
    this.maxY = options.maxY;
    
    this.render = function(callback){
        //server-side d3 needs to be loaded seperately
        if(!d3)            
            var d3 = require('d3');
        
        var _this = this;                       
        
        // preprocess data
        this.data.forEach(function(d) {
            d.total =  d.values.reduce(function(a, b) {return a + b;});
            d.mapped = [];
            //stack the bars by adding the predecessor to its length
            for(var i = 0; i < d.values.length; i++){
                var summed = (i == 0)? d.values[0]:  d.values[i] + d.mapped[i-1].summed;
                d.mapped.push({
                    value: d.values[i],
                    summed: summed,
                    total: d.total,
                    label: d[_this.bandName]
                });
            }
            //reverse values, so that the bigger ones are drawn first (smaller ones are in front)
            d.mapped.reverse();
        });
        //reversed values -> labels have to be reversed as well
        this.stackLabels.reverse();
        
        if(!this.maxY)
            this.maxY = d3.max(this.data, function(d) {return d.total }) * 1.1;    
        
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
    
        if(this.css){
            var defs = top.append('defs');
            var style = defs.append('style');  
            //style.type = 'text/css';                
            style.attr("type", "text/css");     
            style.html(this.css);  
        }
        else{            
            var parsed = "\n"
            for (var i = 0; i < document.styleSheets.length; i++) {
              if(!document.styleSheets[i].href)
                  continue;
              var str = document.styleSheets[i].href.split("/");
              if (str[str.length-1] == "visuals.css"){
                var rules = document.styleSheets[i].rules;
                for (var j=0; j<rules.length;j++){
                  parsed += (rules[j].cssText + "\n");
                }
                break;
              }
            }     

            var style = top.append('style');  
            //style.type = 'text/css';                
            style.attr("type", "text/css");
            style.html("\n<![CDATA[" + parsed + "]]>\n");
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
        
        var xScale = d3.scale.ordinal()
            .rangeRoundBands([0, innerwidth], .1)
            .domain(this.data.map(function(d) { return d[_this.bandName]; }));
    
        var yScale = d3.scale.linear()
            .rangeRound([innerheight, 0])
            .domain([ 0, this.maxY]) ;

        var colorScale = d3.scale.category10()
            .domain(d3.range(this.data.length));

        // AXES
        
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickSize(0); 

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickSize(-this.width);  
  
        var xApp = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", translation(0, innerheight)) 
            .call(xAxis);
                
        var yApp = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    
        yApp.append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(this.ylabel)
            .attr("transform", "rotate(-90), " + translation(0, 0));  
        
        // BARS
        
        var groups = svg.selectAll(".year")
            .data(this.data)
            .enter().append("g")
              .attr("class", "g")
              .attr("transform", function(d) { return translation(xScale(d[_this.bandName]), 0); });      
        
        var mouseOverBar = function(d, i) {
            var tooltip = d3.select('body').append("div").attr("class", "tooltip");
            var bar = d3.select(this);
            bar.classed("highlight", true);
            tooltip.style("opacity", .9);     
            var parent = d3.select(this.parentNode); 
            tooltip.html(_this.xlabel + ": " + d.label + "<br>" + _this.stackLabels[i] + ": <b>" + d.value + "</b><br>" + "Summe: " + d.total);
            
            tooltip.style("left", (d3.event.pageX + 10) + "px")     
                   .style("top", (d3.event.pageY - parseInt(tooltip.style("height"))) + "px"); 
        };     
            
        var mouseOutBar = function(){
            d3.select(this).classed("highlight", false);     
            d3.select('body').selectAll("div.tooltip").remove();
        };
        
        groups.selectAll("rect")
            .data(function(d) { return d.mapped; })
            .enter().append("rect")
                .attr("width", xScale.rangeBand()*0.75)
                .attr("y", function(d, i) { return yScale(d.summed); })
                .attr("height", function(d, i) { return Math.abs(yScale(d.summed) - yScale(0)); })
                .style("fill", function(d, i) { return colorScale(i); })        
            .on("mouseover", mouseOverBar)
            .on("mouseout", mouseOutBar);
        
        var legend = svg.selectAll(".legend")
            .data(_this.stackLabels.slice())
            .enter().append("g")
                .attr("class", "legend")
                // mod operations move all uneven numbers to line below even numbers
                .attr("transform", function(d, i) { return translation((i - (i % 2)) * 40, innerheight + 20 + 25 * (i % 2)); });

        legend.append("rect")
            .attr("x", 0)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", function(d, i) { return colorScale(i); });

        legend.append("text")
            .attr("x", 12)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(function(d) { return d; });    
    
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
