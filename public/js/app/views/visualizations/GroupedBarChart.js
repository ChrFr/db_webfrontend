/*
 Author: Christoph Franke
 Publisher: GGR
 */

/*
 * a grouped bar chart comparing groups of data
 * 
 * @param options.el             the parent container of the rendered vis.
 * @param options.data           list of objects, each object represents a group,
 *                               single objects contain keys "label" and key "values" (an array of values) 
 * @param options.width          the width of the rendered svg
 * @param options.height         the height of the rendered svg
 * @param options.xlabel         label of the x-axis
 * @param options.ylabel         label of positive the y-axis
 * @param options.yNegativeLabel label of the negative y-axis
 * @param options.title          optional, main title
 * @param options.subtitle       optional, subtitle
 * @param options.groupLabels    array of the labels of the groups
 * @param options.minY           optional, lowest value of the y-axis
 * @param options.maxY           optional, highest value of the y-axis
 * @param options.css            optional, css instructions, only needed if rendered on server
 * @param options.cssSource      optional, name of the embedded stylesheet (default: visualizations.css)
 * @param options.separator      optional, separating line, drawn vertically at given x-Value
 * 
 * @see grouped bar chart
 */
var GroupedBarChart = function (options) {
  this.el = options.el || document;
  this.data = options.data;
  this.width = options.width;
  this.height = options.height;
  this.css = options.css;
  this.cssSource = options.cssSource || "visualizations.css";
  this.xlabel = options.xlabel || 'x';
  this.ylabel = options.ylabel || 'y';
  this.yNegativeLabel = options.yNegativeLabel;
  this.title = options.title || '';
  this.subtitle = options.subtitle || '';
  this.groupLabels = options.groupLabels;
  this.separator = options.separator;
  
  var minY = options.minY;
  if (minY === undefined)
    minY = d3.min(this.data, function (d) {
      return d3.min(d.values);
    }) * 1.3;
  var maxY = options.maxY;
  if (maxY === undefined)
    maxY = d3.max(this.data, function (d) {
      return d3.max(d.values);
    }) * 1.3;

  //prevent that there are no pos. or neg. axes, axis is at least 30% of other axis (or 1)
  this.minY = d3.min([minY, -(maxY * 0.3), -1]);
  this.maxY = d3.max([-(minY * 0.3), maxY, 1]);

  this.render = function (callback) {
    //server-side d3 needs to be loaded seperately
    if (!d3)
      var d3 = require('d3');

    var _this = this;

    var margin = {
      top: 50,
      right: 0,
      bottom: 90,
      left: 40
    };

    var innerwidth = this.width - margin.left - margin.right,
        innerheight = this.height - margin.top - margin.bottom;

    var top = d3.select(this.el).append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
            .attr('width', this.width)
            .attr('height', this.height);

    if (this.css) {
      var defs = top.append('defs');
      var style = defs.append('style');
      //style.type = 'text/css';                
      style.attr('type', 'text/css');
      style.html(this.css);
    }
    else {
      var parsed = '\n';
      for (var i = 0; i < document.styleSheets.length; i++) {
        if (!document.styleSheets[i].href)
          continue;
        var str = document.styleSheets[i].href.split('/');
        if (str[str.length - 1] == this.cssSource) {
          var rules = document.styleSheets[i].cssRules;
          for (var j = 0; j < rules.length; j++) {
            parsed += (rules[j].cssText + '\n');
          }
          break;
        }
      }

      var style = top.append('style');
      //style.type = 'text/css';                
      style.attr('type', 'text/css');
      style.html('\n<![CDATA[' + parsed + ']]>\n');
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

    var x0Scale = d3.scale.ordinal()
            .rangeRoundBands([0, innerwidth], .1)
            .domain(this.data.map(function (d) {
              return d.label;
            }));

    var x1Scale = d3.scale.ordinal()
            .domain(this.groupLabels).rangeRoundBands([0, x0Scale.rangeBand()]);

    var yScale = d3.scale.linear()
            .range([innerheight, 0])
            .domain([_this.minY, _this.maxY]);

    var colorScale = d3.scale.category10()
            .domain(d3.range(this.groupLabels.length));     
    
    // background of groups, color should change on hover (defined in css)
    var back = svg.selectAll('rect')
            .data(this.data)
            .enter().append('rect')
            .attr('class', 'group-back')
            .attr('transform', function (d) {
              return translation(x0Scale(d.label), 0);
            })
            .attr('height', innerheight).attr('height', innerheight)
            .attr('width', x0Scale.rangeBand());

    // AXES

    var xAxis = d3.svg.axis()
            .scale(x0Scale)
            .orient('bottom')
            .tickSize(0);

    var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient('left')
            .tickSize(-this.width);

    var xApp = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', translation(0, innerheight))
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)" )
            .attr("font-weight", function(d){
              if (d == _this.separator)
                return "bold";
            });;

    /*
     xApp.append('text')
     .attr('dy', '-.71em')
     .attr('x', innerwidth)
     .style('text-anchor', 'end')
     .text(this.xlabel)
     .attr('transform', translation(0, 0));*/

    var yApp = svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

    yApp.append('text')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .style('text-anchor', 'end')
            .text(this.ylabel)
            .attr('transform', 'rotate(-90), ' + translation(0, 0));

    if (this.yNegativeLabel)
      yApp.append('text')
              .attr('y', 6)
              .attr('dy', '0.71em')
              .style('text-anchor', 'end')
              .text(this.yNegativeLabel)
              .attr('transform', 'rotate(-90), ' + translation(-innerheight + margin.bottom, 0));

    // BARS        
    var groups = svg.selectAll('.group')
            .data(this.data)
            .enter().append('g')
            .attr('class', 'g')
            .attr('xvalue', function (d) {
              return d.label;
            })
            .attr('transform', function (d) {
              return translation(x0Scale(d.label), 0);
            });

    var mouseOverBar = function (d, i) {
      var tooltip = d3.select('body').append('div').attr('class', 'tooltip');
      var bar = d3.select(this);
      bar.classed('highlight', true);
      tooltip.style('opacity', .9);
      var parent = d3.select(this.parentNode);
      tooltip.html(_this.groupLabels[i] + '<br>' + _this.xlabel + ': ' + parent.datum().label + '<br><b>' + d + '</b>');

      tooltip.style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - parseInt(tooltip.style('height'))) + 'px');
    };

    var mouseOutBar = function () {
      d3.select(this).classed('highlight', false);
      d3.select('body').selectAll('div.tooltip').remove();
    };

    groups.selectAll('rect')
            .data(function (d, i) {
              return d.values;
            })
            .enter().append('rect')
            .attr('width', x1Scale.rangeBand())
            .attr('x', function (d, i) {
              return x1Scale(_this.groupLabels[i]);
            })
            .attr('y', function (d) {
              return yScale(Math.max(0, d));
            })
            .attr('height', function (d) {
              return Math.abs(yScale(d) - yScale(0));
            })
            .style('fill', function (d, i) {
              return colorScale(i);
            })
            .on('mouseover', mouseOverBar)
            .on('mouseout', mouseOutBar);
        
    groups.filter(function(d){
              return d.label <= _this.separator;
            })
          .selectAll('rect')          
          .style('opacity', function (d, i) {
            return "0.8";
          });

    // won't get the ticks with xApp.selectAll, no idea why 
    var sepTick = svg.selectAll('.x.axis g.tick')
            .filter(function(d){
              return d == _this.separator;
            });
    sepTick.selectAll('line')
            .attr('class', 'separator')
            .attr('y2', -innerheight)
            .attr('transform', translation( x1Scale.rangeBand() * 3 / 2 + 2, 0));
        
    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }

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

    if (callback)
      callback(this.el.innerHTML);
  };

};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = GroupedBarChart;
