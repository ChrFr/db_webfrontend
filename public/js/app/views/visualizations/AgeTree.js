/*
 Author: Christoph Franke
 Publisher: GGR
 */

/*
 * an age tree (aka age pyramid) comparing female and male population
 * 
 * @param options.el                   the parent container of the rendered vis.
 * @param options.data.alter_maennlich array, ascending number of male population at ages starting from 0
 * @param options.data.alter_weiblich  array, ascending number of female population at ages starting from 0
 * @param options.data.jahr            visualized year
 * @param options.compareData          optional, will be rendered as green outline, same structure as options.data
 * @param options.width                the width of the rendered svg
 * @param options.height               the height of the rendered svg
 * @param options.title                optional, main title
 * @param options.subtitle             optional, subtitle
 * @param options.maxX                 optional, end value of the x-Axis
 * @param options.maxY                 optional, end value of the y-axis
 * @param options.css                  optional, css instructions, only needed if rendered on server
 * @param options.cssSource            optional, name of the embedded stylesheet (default: visualizations.css)
 * 
 * @see age tree
 */
var AgeTree = function (options) {
  this.el = options.el || document;
  this.data = options.data;
  this.width = options.width;
  this.height = options.height;
  this.maxX = options.maxX;// || 1000;
  this.maxY = options.maxY || 100;
  // optional: css is written in svg meta
  this.css = options.css;
  this.cssSource = options.cssSource || "visualizations.css";
  // optional: compared data is outlines
  this.compareData = options.compareData;
  this.title = options.title || '';
  this.subtitle = options.subtitle || '';

  this.render = function (callback) {
    //server-side d3 needs to be loaded seperately
    if (!d3)
      var d3 = require('d3');

    var _this = this;

    var femaleAges = this.data.alter_weiblich,
        maleAges = this.data.alter_maennlich;

    var margin = {
      top: 60,
      right: 40,
      bottom: 40,
      left: 20,
      middle: 10
    };

    this.regionWidth = this.width / 2 - margin.middle;
    var pointA = this.regionWidth,
        pointB = this.width - this.regionWidth;    

    var svgWidth = this.width,
        svgHeight = this.height;
    
    this.width -= (margin.left + margin.right) - 20;
    this.height -= (margin.top + margin.bottom);

    var top = d3.select(this.el).append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
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

    this.xScale = d3.scale.linear()
            .domain([0, _this.maxX])
            .range([0, this.regionWidth])
            .nice();

    this.yScale = d3.scale.linear()
            .domain([0, _this.maxY])
            .range([this.height, 0]);

    // TOOLTIP
    var mouseOverBar = function (d, i) {
      var leftBar = d3.select(leftBars[0][i]);
      var rightBar = d3.select(rightBars[0][i]);
      leftBar.selectAll('rect').classed('highlight', true);
      rightBar.selectAll('rect').classed('highlight', true);
      var tooltip = d3.select('body').append('div').attr('class', 'tooltip');
      
      var text = 'Alter: ' + i + '<br>';
      text += 'Anzahl weiblich: <b>' + _this.data.alter_weiblich[i] + '</b><br>';
      text += 'Anzahl männlich: <b>' + _this.data.alter_maennlich[i] + '</b><br>';

      tooltip.html(text);

      tooltip.style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - parseInt(tooltip.style('height'))) + 'px');
    };

    var mouseOutBar = function (d, i) {
      var leftBar = d3.select(leftBars[0][i]);
      var rightBar = d3.select(rightBars[0][i]);
      leftBar.selectAll('rect').classed('highlight', false);
      rightBar.selectAll('rect').classed('highlight', false);
      d3.select('body').selectAll('div.tooltip').remove();
    };

    // BARS                
    this.barHeight = this.height / this.maxY;

    var maleGroup = svg.append('g')
            .attr('class', 'maleGroup')
            .attr('transform', translation(pointA, 0) + 'scale(-1,1)');

    var femaleGroup = svg.append('g')
            .attr('class', 'femaleGroup')
            .attr('transform', translation(pointB, 0));

    var rightBars = femaleGroup.selectAll('g')
            .data(femaleAges)
            .enter().append('g')
            .attr('transform', function (d, i) {
              return translation(0, (_this.maxY - i) * _this.barHeight - _this.barHeight / 2);
            });

    rightBars.append('rect')
            .attr('class', 'female')
            .attr('width', this.xScale)
            .attr('height', this.barHeight - 1)
            .attr('age', function (d, i) {
              return i;
            })
            .on('mouseover', mouseOverBar)
            .on('mouseout', mouseOutBar);

    var leftBars = maleGroup.selectAll('g')
            .data(maleAges)
            .enter().append('g')
            .attr('transform', function (d, i) {
              return translation(0, (_this.maxY - i) * _this.barHeight - _this.barHeight / 2);
            });

    leftBars.append('rect')
            .attr('class', 'male')
            .attr('width', this.xScale)
            .attr('height', this.barHeight - 1)
            .attr('age', function (d, i) {
              return i;
            })
            .on('mouseover', mouseOverBar)
            .on('mouseout', mouseOutBar);

    // OUTLINE FOR COMPARED DATA
    if (this.compareData) {
      var femaleCompare = this.compareData.alter_weiblich,
          maleCompare = this.compareData.alter_maennlich;
  
      var femaleOutline = svg.append('g')
          .attr('transform', translation(pointB, 0))
          .attr('class', 'compare'),
          maleOutline = svg.append('g')
          .attr('transform', translation(pointA, 0))
          .attr('class', 'compare');

      var femaleLine = [],
          maleLine = [];

      var lineFunction = d3.svg.line()
          .x(function (d) {
            return d.x;
          })
          .y(function (d) {
            return d.y;
          })
          .interpolate('linear');

      for (var i = 0; i < femaleCompare.length; i++) {
        femaleLine.push({
          x: _this.xScale(femaleCompare[i]),
          y: (_this.maxY - i + 1) * _this.barHeight - _this.barHeight / 2
        });
        femaleLine.push({
          x: _this.xScale(femaleCompare[i]),
          y: (_this.maxY - i) * _this.barHeight - _this.barHeight / 2
        });
        maleLine.push({
          x: -_this.xScale(maleCompare[i]),
          y: (_this.maxY - i + 1) * _this.barHeight - _this.barHeight / 2
        });
        maleLine.push({
          x: -_this.xScale(maleCompare[i]),
          y: (_this.maxY - i) * _this.barHeight - _this.barHeight / 2
        });

      }

      femaleOutline.append('path')
              .attr('d', lineFunction(femaleLine))
              .attr('fill', 'none');
      maleOutline.append('path')
              .attr('d', lineFunction(maleLine))
              .attr('fill', 'none');
    }

    // AXES

    var yAxis = d3.svg.axis()
            .scale(_this.yScale)
            .orient('right')
            .ticks(_this.maxY)
            .tickSize(0, 0)
            .tickPadding(1);

    yAxis.tickFormat(function (d) {
      return ((d === 0) || (d % 5 !== 0)) ? '' : d;
    });

    var xAxisRight = d3.svg.axis()
            .scale(_this.xScale)
            .orient('bottom')
            .ticks(5)
            .tickSize(-this.height);

    var xAxisLeft = d3.svg.axis()
            .scale(_this.xScale.copy().range([pointA, 0]))
            .orient('bottom')
            .ticks(5)
            .tickSize(-this.height);

    svg.append('g')
            .attr('class', 'axis y left')
            .attr('transform', translation(this.width / 2  + margin.left / 2 + 8, 0))
            .call(yAxis)
            .selectAll('text')
            .style('text-anchor', 'middle');

    svg.append('g')
            .attr('class', 'axis x left')
            .attr('transform', translation(0, this.height))
            .call(xAxisLeft);

    svg.append('g')
            .attr('class', 'axis x right')
            .attr('transform', translation(pointB, this.height))
            .call(xAxisRight);

    // LEGEND

    svg.append('text')
            .attr('x', (this.width / 2) + margin.left + 2)
            .attr('y', -5)
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text('Alter');

    svg.append('text')
            .attr('class', 'male')
            .attr('text-anchor', 'middle')
            .text('Anzahl männlich')
            .attr('x', this.width / 4)
            .attr('y', this.height + margin.bottom - 10);

    svg.append('text')
            .attr('class', 'female')
            .attr('text-anchor', 'middle')
            .text('Anzahl weiblich')
            .attr('x', 3 * this.width / 4)
            .attr('y', this.height + margin.bottom - 10);

    if (this.compareData){
      svg.append('text')
              .attr('class', 'compare')
              .attr('x', this.width - 20)
              .attr('y', 5 - (margin.top / 2))
              .style('text-anchor', 'end') 
              .style('dominant-baseline', 'ideographic')
              .text('Vergleichsjahr ' + this.compareData.jahr);
    }
      
    // remove the black borders caused by the domain
    svg.selectAll('.domain').style('display', 'none');

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }

    if (callback)
      callback(this.el.innerHTML);
  };

  this.changeData = function (data) {
    this.data = data;
    var _this = this;
    var title = this.title + ' - ' + data.jahr;
    var d3el = d3.select(this.el);
    d3el.select('.title').text(title);

    //update bars
    d3el.select('.femaleGroup').selectAll('g')
            .data(data.alter_weiblich)
            .select('rect').attr('width', _this.xScale);

    d3el.select('.maleGroup').selectAll('g')
            .data(data.alter_maennlich)
            .select('rect').attr('width', _this.xScale);

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }
  };
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = AgeTree;
