/*
 Author: Christoph Franke
 Publisher: GGR
 */

/*
 * a line chart drawing a line to show functional relation between two characteristics
 * 
 * @param options.el         the parent container of the rendered vis.
 * @param options.data.x     values in x direction  
 * @param options.data.y     values in y direction 
 * @param options.data.label optional, label the line gets      
 * @param options.width      the width of the rendered svg
 * @param options.height     the height of the rendered svg
 * @param options.xlabel     label of the x-axis
 * @param options.ylabel     label of the y-axis
 * @param options.title      optional, main title
 * @param options.subtitle   optional, subtitle
 * @param options.minY       optional, lowest value of the y-axis
 * @param options.maxY       optional, highest value of the y-axis
 * @param options.css        optional, css instructions
 * @param options.cssSource  optional, name of the embedded stylesheet (default: visualizations.css)
 * @param options.separator  optional, separating line, drawn vertically at given x-Value
 * @param options.colors     optional, color of each line drawn from given data (in array, css-style)
 * 
 * @see line chart
 */
var LineChart = function (options) {
  this.el = options.el || document;
  this.data = options.data;
  this.width = options.width;
  this.height = options.height;
  this.css = options.css;
  this.cssSource = options.cssSource || "visualizations.css";
  this.xlabel = options.xlabel || "";
  this.ylabel = options.ylabel || "";
  this.title = options.title || "";
  this.subtitle = options.subtitle || "";
  this.minY = options.minY;
  this.separator = options.separator;
  this.colors = options.colors;
  this.groupLabels = options.groupLabels;
  
  if (this.minY === undefined)
    this.minY = d3.min(this.data, function (d) {
      return d3.min(d.y);
    });
  this.maxY = options.maxY;
  if (this.maxY === undefined) {
    this.maxY = d3.max(this.data, function (d) {
      return d3.max(d.y);
    });
    this.maxY += (this.maxY - this.minY) * 0.1;
  };

  this.render = function (callback) {
    //server-side d3 needs to be loaded separately
    if (!d3)
      var d3 = require('d3');

    var _this = this;

    var margin = {
      top: 50,
      right: 35,
      bottom: 90,
      left: 70
    };

    var innerwidth = this.width - margin.left - margin.right,
        innerheight = this.height - margin.top - margin.bottom;

    var top = d3.select(this.el).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
    if (this.css) {
      var defs = top.append('defs');
      var style = defs.append('style');
      //style.type = 'text/css';
      style.attr("type", "text/css");
      style.html(this.css);
    }
    else {
      var parsed = "\n";
      for (var i = 0; i < document.styleSheets.length; i++) {
        if (!document.styleSheets[i].href)
          continue;
        var str = document.styleSheets[i].href.split("/");
        if (str[str.length - 1] == this.cssSource) {
          var rules = document.styleSheets[i].cssRules;
          for (var j = 0; j < rules.length; j++) {
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
    
    // background
    top.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "white");

    // create svg
    var svg = top.append('svg')
            .append('g')
            .attr('transform', translation(margin.left, margin.top));

    // TITLE

    svg.append('text')
            .attr('class', 'title')
            .attr('x', 0)
            .attr('y', 30 - (margin.top))
            .text(this.title);

    svg.append('text')
            .attr('class', 'subtitle')
            .attr('x', 0)
            .attr('y', 30 - (margin.top))
            .attr('font-size', '1em')
            .attr('dy', '1em')
            .text(this.subtitle);
    
    // SCALES

    var xScale = d3.scale.linear()
            .range([0, innerwidth])
            .domain([d3.min(this.data, function (d) {
                return d3.min(d.x);
              }),
              d3.max(this.data, function (d) {
                return d3.max(d.x);
              })]);

    var yScale = d3.scale.linear()
            .range([innerheight, 0])
            .domain([_this.minY, _this.maxY]);

    var colorScale =  d3.scale.category10()
                              .domain(d3.range(this.data.length));
    if (this.colors)
      colorScale = function(i){
        return _this.colors[i];
      }

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
            .x(function (d) {
              return xScale(d[0]);
            })
            .y(function (d) {
              return yScale(d[1]);
            });

    var xApp = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", translation(0, innerheight))
            .call(xAxis);

    xApp.append("text")
            .attr("dy", "-.71em")
            .attr("x", innerwidth)
            .style("text-anchor", "end")
            .text(this.xlabel)
            .attr("transform", translation(0, 30));        

    var yApp = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        
    /*  // move tick labes to the left
    yApp.selectAll('text')
            .attr("transform", translation(-20, 0))*/

    yApp.append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text(this.ylabel)
            .attr("transform", "rotate(-90), " + translation(0, -margin.left));

    var lines = svg.selectAll(".d3-chart-line")
            .data(this.data.map(function (d) {
              return d3.zip(d.x, d.y);
            }))
            .enter().append("g")
            .attr("class", ".d3-chart-line");

    lines.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
              return drawLine(d);
            })
            .attr("stroke", function (d, i) {
              return colorScale(i);
            });                

    lines.append("text")
            .datum(function (d, i) {
              return {
                name: _this.data[i].label,
                final: d[d.length - 1]};
            })
            .attr("transform", function (d) {
              return (translation(xScale(d.final[0]), yScale(d.final[1])));
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .attr("fill", function (_, i) {
              return colorScale(i);
            })
            .text(function (d) {
              return d.name;
            });

    var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

    focus.append("circle")
            .attr("r", 4.5)
            .attr("fill", "gold")
            .attr("stroke", colorScale(0));

    // tooltip
    focus.append("rect")
            .attr("fill", "white")
            .style("fill-opacity", "0.7")
            .attr("x", 9)
            .attr("y", -5);
    focus.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

    //overlay for capturing mouse move
    svg.append("rect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", innerwidth + 20)
            .attr("height", innerheight)
            .on("mouseover", function () {
              focus.style("display", null);
            })
            .on("mouseout", function () {
              focus.style("display", "none");
            })
            .on("mousemove", mousemove);

    var bisect = d3.bisector(function (d) {
      return d;
    }).left;

    function mousemove() {
      //first dataset is taken to show dots
      var mousePos = d3.mouse(this)[0];
      if (mousePos < 0)
        return;      
      var xData = _this.data[0].x,
          yData = _this.data[0].y,
          x0 = xScale.invert(mousePos),
          i = bisect(xData, x0) - 1,
          d = xData[i];
      focus.attr("transform", translation(xScale(d), yScale(yData[i])));
      var back = focus.select("rect");
      var text = focus.select("text");
      back.style("width", parseInt(text.style("width")) + 10);
      back.style("height", text.style("height"));
      text.text(Math.round(yData[i]* 100) / 100);
    }

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }

    if (callback)
      callback(this.el.innerHTML);
    
    xApp.selectAll('g.tick line')
            .filter(function(d){ 
              return d == _this.separator;
            })
            .attr('class', 'separator'); 
        
     
    var legend = svg.selectAll('.legend')
            .data(_this.groupLabels.slice())
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
              return translation(0, innerheight + 40 + i * 15);
            });

    legend.append('rect')
            .attr('x', innerwidth - 14)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', function (d, i) {
              return colorScale(i);
            });

    legend.append('text')
            .attr('x', innerwidth - 24)
            .attr('y', 6)
            .attr('dy', '.35em')
            .style('text-anchor', 'end')
            .text(function (d) {
              return d;
            });

  };

};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = LineChart;
