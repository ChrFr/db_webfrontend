/*
 Author: Christoph Franke
 Publisher: GGR
 */

/*
 * a stacked bar chart comparing groups of data
 * 
 * @param options.el             the parent container of the rendered vis.
 * @param options.data           list of objects, each object represents a group,
 *                               single objects contain the key "values" (an array of values) and a key containing the band-label 
 * @param options.width          the width of the rendered svg
 * @param options.height         the height of the rendered svg
 * @param options.xlabel         label of the x-axis
 * @param options.ylabel         label of positive the y-axis
 * @param options.title          optional, main title
 * @param options.subtitle       optional, subtitle
 * @param options.stackLabels    array of the labels of the stacks (rendered in legend)
 * @param options.bandName       the name of the key containing the band in options.data
 * @param options.minY           optional, lowest value of the y-axis
 * @param options.maxY           optional, highest value of the y-axis
 * @param options.css            optional, css instructions, only needed if rendered on server
 * @param options.cssSource      optional, name of the embedded stylesheet (default: visualizations.css)
 * 
 * @see stacked bar chart
 */
var StackedBarChart = function (options) {
  this.el = options.el || document;
  // data will be modified
  this.data = JSON.parse(JSON.stringify(options.data));
  this.width = options.width;
  this.height = options.height;
  this.css = options.css;
  this.cssSource = options.cssSource || "visualizations.css";
  this.xlabel = options.xlabel || 'x';
  this.ylabel = options.ylabel || 'y';
  this.title = options.title || '';
  this.subtitle = options.subtitle || '';
  this.stackLabels = options.stackLabels;
  this.bandName = options.bandName || 'band';
  this.maxY = options.maxY;

  this.render = function (callback) {
    //server-side d3 needs to be loaded seperately
    if (!d3)
      var d3 = require('d3');

    var _this = this;

    // preprocess data
    this.data.forEach(function (d) {
      if (! 'total' in d)
        d.total = d.values.length ? d.values.reduce(function (a, b) {
          return a + b;
        }) : 0;
      d.mapped = [];
      //stack the bars by adding the predecessor to its length
      for (var i = 0; i < d.values.length; i++) {
        var summed = (i == 0) ? d.values[0] : d.values[i] + d.mapped[i - 1].summed;
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

    if (!this.maxY)
      this.maxY = d3.max(this.data, function (d) {
        return d.total;
      }) * 1.1;

    var margin = {
      top: 50,
      right: 50,
      bottom: 70,
      left: 60
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
      var parsed = '\n'
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

    var xScale = d3.scale.ordinal()
            .rangeRoundBands([0, innerwidth], .1)
            .domain(this.data.map(function (d) {
              return d[_this.bandName];
            }));

    var yScale = d3.scale.linear()
            .rangeRound([innerheight, 0])
            .domain([0, this.maxY]);

    var colorScale = d3.scale.category10()
            .domain(d3.range(this.data.length));

    // AXES

    var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .tickSize(0);

    var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient('left')
            .tickSize(-innerwidth);

    var xApp = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', translation(0, innerheight))
            .call(xAxis)
            .selectAll("text")  
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)" );

    var yApp = svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

    yApp.append('text')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .style('text-anchor', 'end')
            .text(this.ylabel)
            .attr('transform', 'rotate(-90), ' + translation(0, 0));

    // BARS

    var mouseOverBar = function (d) {
      var stack = d3.select(this);
      stack.selectAll('rect').classed('highlight', true);
      
      var tooltip = d3.select('body').append('div').attr('class', 'tooltip');
      var text = _this.xlabel + ': ' + d[_this.bandName] + '<br>';
      tooltip.style('opacity', .9);
      
      d.values.forEach(function(value, i){
        text += '<b>' + _this.stackLabels[i] + '</b>: ' + value + '<br>';
      });      
      text += '<b>gesamt</b>: ' + d.total + '<br>';
      tooltip.html(text);
      tooltip.style('left', (d3.event.pageX + 10) + 'px')
             .style('top', (d3.event.pageY - parseInt(tooltip.style('height'))) + 'px');
    };

    var mouseOutBar = function (d, i) {
      var stack = d3.select(this);
      stack.selectAll('rect').classed('highlight', false);      
      d3.select('body').selectAll('div.tooltip').remove();
    };
    
    var groups = svg.selectAll('.group')
            .data(this.data)
            .enter().append('g')
            .attr('class', 'stack')
            .attr('transform', function (d) {
              return translation(xScale(d[_this.bandName]), 0);
            })
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseover', mouseOverBar)
            .on('mouseout', mouseOutBar);
    
    groups.selectAll('rect')
            .data(function (d) {
              return d.mapped;
            })
            .enter().append('rect')
            .attr('width', xScale.rangeBand() * 0.6)
            .attr('y', function (d, i) {
              return yScale(d.summed);
            })
            .attr('height', function (d, i) {
              return Math.abs(yScale(d.summed) - yScale(0));
            })
            .style('fill', function (d, i) {
              return colorScale(i);
            })  
            //.on('mouseover', mouseOverBar)
            //.on('mouseout', mouseOutBar);  
           
    /*
    groups.selectAll('g')
            .data(this.data)
            .enter().append('rect')
            .attr('class', 'overlay')
            .attr('transform', function (d) {
              return translation(xScale(d[_this.bandName]), 0);
            });*/
    
    svg.append('text')
            .attr('x', innerwidth)
            .attr('y', 10)
            .attr('font-size', '1em')
            .attr('dy', '1em')
            .text('Legende');

    var legend = svg.selectAll('.legend')
            .data(_this.stackLabels.slice())
            .enter().append('g')
            .attr('class', 'legend')
            // mod operations move all uneven numbers to line below even numbers
            .attr('transform', function (d, i) {
              return translation(innerwidth, 30 + i * 20);
            });            

    legend.append('rect')
            .attr('x', 0)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', function (d, i) {
              return colorScale(i);
            });

    legend.append('text')
            .attr('x', 12)
            .attr('y', 6)
            .attr('dy', '.35em')
            .text(function (d) {
              return d;
            });

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }

    if (callback)
      callback(this.el.innerHTML);
  };

};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = StackedBarChart;
