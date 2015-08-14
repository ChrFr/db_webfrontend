/*
 Author: Christoph Franke
 Publisher: GGR
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
  // optional: compared data is outlines
  this.compareData = options.compareData;
  this.title = options.title || "";

  this.render = function (callback) {
    //server-side d3 needs to be loaded seperately
    if (!d3)
      var d3 = require('d3');

    var _this = this;

    var femaleAges = this.data.alter_weiblich,
        maleAges = this.data.alter_maennlich;

    var margin = {
      top: 30,
      right: 20,
      bottom: 30,
      left: 20,
      middle: 10
    };

    this.regionWidth = this.width / 2 - margin.middle;
    var pointA = this.regionWidth,
        pointB = this.width - this.regionWidth;

    var svgWidth = margin.left + this.width + margin.right,
        svgHeight = margin.top + this.height + margin.bottom;

    var top = d3.select(this.el).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('xmlns:xmlns:xlink', "http://www.w3.org/1999/xlink")
            .attr('width', svgWidth)
            .attr('height', svgHeight);
    if (this.css) {
      var defs = top.append('defs');
      var style = defs.append('style');
      //style.type = 'text/css';                
      style.attr("type", "text/css");
      style.html(this.css);
    }
    else {
      var parsed = "\n"
      for (var i = 0; i < document.styleSheets.length; i++) {
        if (!document.styleSheets[i].href)
          continue;
        var str = document.styleSheets[i].href.split("/");
        if (str[str.length - 1] == "visuals.css") {
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

    // create svg
    var svg = top.append('svg')
            .append('g')
            .attr('transform', translation(margin.left, margin.top));

    // TITLE

    svg.append("text")
            .attr('class', 'title')
            .attr("x", margin.left)
            .attr("y", 0 - (margin.top / 2))
            .text(this.title + " - " + this.data.jahr);

    // SCALES

    this.xScale = d3.scale.linear()
            .domain([0, _this.maxX])
            .range([0, this.regionWidth])
            .nice();

    this.yScale = d3.scale.linear()
            .domain([0, _this.maxY])
            .range([this.height, 0]);

    // TOOLTIP
    var mouseOverBar = function (d) {
      var tooltip = d3.select('body').append("div").attr("class", "tooltip");
      var bar = d3.select(this);
      bar.classed("highlight", true);
      var sex = '';
      if (bar.classed('female'))
        sex = 'weiblich';
      else if (bar.classed('male'))
        sex = 'männlich';

      tooltip.html("Geschlecht: " + sex + "<br>Alter: " + bar.attr("age") + "<br><b>Anzahl: " + Math.round(d) + "</b>");

      tooltip.style("left", (d3.event.pageX + 10) + "px")
              .style("top", (d3.event.pageY - parseInt(tooltip.style("height"))) + "px");
    };

    var mouseOutBar = function (d) {
      d3.select(this).classed("highlight", false);
      d3.select('body').selectAll("div.tooltip").remove();
    };

    // BARS                
    this.barHeight = this.height / this.maxY;

    var maleGroup = svg.append('g')
            .attr('class', 'maleGroup')
            .attr('transform', translation(pointA, 0) + 'scale(-1,1)');

    var femaleGroup = svg.append('g')
            .attr('class', 'femaleGroup')
            .attr('transform', translation(pointB, 0));

    var rightBars = femaleGroup.selectAll("g")
            .data(femaleAges)
            .enter().append("g")
            .attr("transform", function (d, i) {
              return translation(0, (_this.maxY - i) * _this.barHeight - _this.barHeight / 2);
            });

    rightBars.append("rect")
            .attr('class', 'female')
            .attr("width", this.xScale)
            .attr("height", this.barHeight - 1)
            .attr("age", function (d, i) {
              return i;
            })
            .on("mouseover", mouseOverBar)
            .on("mouseout", mouseOutBar);

    var leftBars = maleGroup.selectAll("g")
            .data(maleAges)
            .enter().append("g")
            .attr("transform", function (d, i) {
              return translation(0, (_this.maxY - i) * _this.barHeight - _this.barHeight / 2);
            });

    leftBars.append("rect")
            .attr('class', 'male')
            .attr("width", this.xScale)
            .attr("height", this.barHeight - 1)
            .attr("age", function (d, i) {
              return i;
            })
            .on("mouseover", mouseOverBar)
            .on("mouseout", mouseOutBar);

    // OUTLINE FOR COMPARED DATA
    if (this.compareData) {
      var femaleCompare = this.compareData.alter_weiblich,
          maleCompare = this.compareData.alter_maennlich;
  
      var femaleOutline = svg.append("g")
          .attr("transform", translation(pointB, 0))
          .attr("class", "compare"),
          maleOutline = svg.append("g")
          .attr("transform", translation(pointA, 0))
          .attr("class", "compare");

      var femaleLine = [],
          maleLine = [];

      var lineFunction = d3.svg.line()
          .x(function (d) {
            return d.x
          })
          .y(function (d) {
            return d.y
          })
          .interpolate("linear");

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

      femaleOutline.append("path")
              .attr("d", lineFunction(femaleLine))
              .attr("fill", "none");
      maleOutline.append("path")
              .attr("d", lineFunction(maleLine))
              .attr("fill", "none");
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
            .attr('transform', translation(this.width / 2, 0))
            .call(yAxis)
            .selectAll("text")
            .style("text-anchor", "middle");

    svg.append('g')
            .attr('class', 'axis x left')
            .attr('transform', translation(0, this.height))
            .call(xAxisLeft);

    svg.append('g')
            .attr('class', 'axis x right')
            .attr('transform', translation(pointB, this.height))
            .call(xAxisRight);

    // LEGEND

    svg.append("text")
            .attr("x", (this.width / 2))
            .attr("y", -5)
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .text('Alter');

    svg.append("text")
            .attr('class', 'male')
            .attr("text-anchor", "middle")
            .text('Anzahl männlich')
            .attr("x", this.width / 4)
            .attr("y", this.height + 25);

    svg.append("text")
            .attr('class', 'female')
            .attr("text-anchor", "middle")
            .text('Anzahl weiblich')
            .attr("x", 3 * this.width / 4)
            .attr("y", this.height + 25);

    if (this.fixYear)
      svg.append("text")
              .attr('class', 'compare')
              .text('Vergleichsjahr ' + this.data.jahr)
              .attr("x", margin.left)
              .attr("y", 20);

    svg.selectAll(".domain").style("display", "none");

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }

    if (callback)
      callback(this.el.innerHTML);
  };

  this.changeData = function (data) {
    this.data = data;
    var _this = this;
    var title = this.title + " - " + data.jahr;
    var d3el = d3.select(this.el);
    d3el.select('.title').text(title);

    //update bars
    d3el.select('.femaleGroup').selectAll("g")
            .data(data.alter_weiblich)
            .select("rect").attr("width", _this.xScale);

    d3el.select('.maleGroup').selectAll("g")
            .data(data.alter_maennlich)
            .select("rect").attr("width", _this.xScale);

    function translation(x, y) {
      return 'translate(' + x + ',' + y + ')';
    }
  };
};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = AgeTree;
