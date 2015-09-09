/*
 Author: Christoph Franke
 Publisher: GGR
 */

var Map = function (options) {
  this.el = options.el || document;
  // data will be modified
  this.map = options.topology;
  this.source = options.source;
  this.width = options.width;
  this.height = options.height;
  this.units = options.units || [];
  this.aggregates = options.aggregates;
  this.onClick = options.onClick;
  this.isTopoJSON = options.isTopoJSON;
  //server-side d3 needs to be loaded seperately
  if (!d3)
    var d3 = require('d3');
  if (!d3slider)
    var d3slider = require('d3slider');
  if (!topojson)
    var topojson = require('topojson');

  var _this = this;

  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  var innerwidth = this.width - margin.left - margin.right,
      innerheight = this.height - margin.top - margin.bottom;
  
  var projection = d3.geo.mercator()
                    .center([13.23, 52.31]) // centered on berlin by default; doesn't matter, if zoomed on bounding box
                    .scale(10000)
                    .translate([innerwidth / 2, innerheight / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var minZoom = innerheight,
      maxZoom = 100 * minZoom;

  var zoom = d3.behavior.zoom()
          .translate(projection.translate())
          .scale(projection.scale())
          .scaleExtent([minZoom, maxZoom])
          .on('zoom', zoomed);

  var mouseover = function (d, i) {
    // ignore unmapped areas
    if (typeof d.id === 'undefined' || d.id === null)
      return;

    var tooltip = d3.select('body').append('div').attr('class', 'tooltip');
    var key = d3.select(this).attr('key');
    d3.selectAll('.key' + key).classed('highlight', true);
    tooltip.style('opacity', .9);
    //var parent = d3.select(this.parentNode); 
    tooltip.html(d.properties.name);

    tooltip.style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - parseInt(tooltip.style('height'))) + 'px');
  };

  var mouseout = function () {
    //d3.select(this).classed('highlight', false); 
    d3.selectAll('.subunit').classed('highlight', false);
    d3.select('body').selectAll('div.tooltip').remove();
  };

  //var timerId;
  //ZOOM EVENT
  function zoomed() {
    var scale = d3.event.scale;
    projection.translate(d3.event.translate).scale(scale);
    g.selectAll('path').attr('d', path);
    zoomLabel.text(Math.round(100 * scale / maxZoom) + '%');
    //ZOOM SLIDER DEACTIVATED (DOESN'T CENTER)
    //if you zoom in and out too fast, d3 can't set the values properly and throws error
    //timer prevents this
    //clearTimeout(timerId);
    //timerId = setTimeout(function() { zoomSlider.value(100 * scale / maxZoom); }, 100);            
  }

  function translation(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  var svg = d3.select(this.el).append('svg')
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
          .attr('width', this.width)
          .attr('height', this.height);

  var g = svg.append('g')
          .call(zoom);

  svg.append('line')
          .attr('x1', 20)
          .attr('y1', 20)
          .attr('x2', 40)
          .attr('y2', 40)
          .style('stroke', 'black')
          .style('stroke-width', '2');

  svg.append('circle')
          .attr('cx', 20)
          .attr('cy', 20)
          .attr('r', 15)
          .style('fill', 'white')
          .style('stroke', 'black');

  var zoomLabel = svg.append('text')
          .attr('x', 20)
          .attr('y', 20)
          .style('text-anchor', 'middle')
          .attr('dy', '.3em');

  /* ZOOM DOESN'T CENTER!
   var slideDiv = d3.select(this.el).append('div')
   .attr('id', 'zoom-slider')
   .style('position', 'absolute')
   .style('width', innerwidth + 'px');
   
   var slideZoom = function(event, value){
   zoom.scale(maxZoom * value / 100).event(g);
   };
   
   var zoomSlider = d3slider().axis(d3.svg.axis())
   .min(100 * minZoom/maxZoom).max(100)
   .on('slide', slideZoom);
   
   slideDiv.call(zoomSlider);
   */
  g.append('rect')
    .attr('class', 'background')
    .attr('width', innerwidth)
    .attr('height', innerheight)
    .attr('cursor', 'move');

  var loadMap = function (map, options) {
    // only draw required shapes       
    if (options.isTopoJSON && !map.objects.subunits)
      map.objects.subunits = {};
    var subunits = {type: 'GeometryCollection'},
    geometries = !options.isTopoJSON ? map.features : map.objects.subunits.geometries;

    if (geometries)
      subunits.geometries = geometries.filter(function (el) {
        return _this.units.indexOf(el.id) >= 0;
      });

    // join shapes
    if (_this.aggregates && geometries) {

      var aggregationMap = {};
      _this.aggregates.forEach(function (aggr) {
        aggr.rs.forEach(function (rs) {
          aggregationMap[rs] = {id: aggr.id, rsArr: aggr.rs, name: aggr.name};
        });
      });
      subunits.geometries.map(function (el) {
        var mapped = aggregationMap[el.id];
        // unmapped areas (not belonging to any aggregate) will be ignored later
        el.id = mapped ? mapped.id : null;
        el.properties.name = mapped ? mapped.name : null;
        el.properties.rsArr = mapped ? mapped.rsArr : null;
      });
    };

    if (options.isTopoJSON) {
      // TOP-LAYER (background map)
      g.append('g')
              .selectAll('.toplayer')
              .data(topojson.feature(map, map.objects.toplayer).features)
              .enter().append('path')
              .attr('class', 'toplayer id')
              .attr('d', path)
              .attr('cursor', 'move');
      var boundaries;

      // detailed map
      if (geometries) {

        // FEATURE-SHAPES
        g.append('g')
                .selectAll('.subunit')
                .data(topojson.feature(map, subunits).features)
                .enter().append('path')
                .attr('class', function (d) {
                  return 'subunit key' + d.id;
                })
                .attr('key', function (d) {
                  return d.id;
                })
                .attr('d', path)
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .on('click', function (d) {
                  _this.onClick(d.id, d.properties.name, d.properties.rsArr);
                })
                .attr('cursor', 'pointer');

        // INTERIOR BOUNDARIES
        g.append('path')
                .datum(topojson.mesh(map, subunits, function (a, b) {
                  return a !== b;
                }))
                .attr('d', path)
                .attr('class', 'subunit-boundary');

        // DRAW OUTER BOUNDARY OF SUBUNITS
        boundaries = topojson.mesh(map, subunits, function (a, b) {
          return a === b;
        });

        g.append('path')
                .datum(boundaries)
                .attr('d', path)
                .attr('class', 'subunit-outer-boundary');
      }
      else {
        //  OUTER BOUNDARY OF TOPLAYER      
        boundaries = topojson.mesh(map, map.objects.toplayer, function (a, b) {
          return a === b;
        });
      }

      // ZOOM TO OUTER PATH
      var bounds = path.bounds(boundaries),
        bdx = bounds[1][0] - bounds[0][0],
        bdy = bounds[1][1] - bounds[0][1],
        bx = (bounds[0][0] + bounds[1][0]) / 2,
        by = (bounds[0][1] + bounds[1][1]) / 2,
        bscale = .9 / Math.max(bdx / innerwidth, bdy / innerheight),
        translate = [innerwidth / 2 - bscale * bx, innerheight / 2 - bscale * by];

        g.attr("transform", "translate(" + translate + ")scale(" + bscale + ")");
    }

    else {
      g.append('g').selectAll('path')
              .data(subunits.geometries)
              .enter().append('path')
              .attr('class', function (d) {
                return 'subunit key' + d.id;
              })
              .attr('key', function (d) {
                return d.id
              })
              .attr('d', path)
              .attr('cursor', 'pointer')
              .on('mouseover', mouseover)
              .on('mouseout', mouseout)
              .on('click', function (d) {
                if (d.id)
                  _this.onClick(d.id, d.properties.name, d.properties.rsArr);
              });

      if (options.boundaries) {  
        var bounds = path.bounds(options.boundaries),
            bdx = bounds[1][0] - bounds[0][0],
            bdy = bounds[1][1] - bounds[0][1],
            bx = (bounds[0][0] + bounds[1][0]) / 2,
            by = (bounds[0][1] + bounds[1][1]) / 2,
            bscale = .9 / Math.max(bdx / innerwidth, bdy / innerheight),
            translate = [innerwidth / 2 - bscale * bx, innerheight / 2 - bscale * by];
    
        if(options.transform)
          g.attr("transform", options.transform);
        
        g.transition()
          .duration(1500)
          .style("stroke-width", 1.5 / bscale + "px")
          .attr("transform", "translate(" + translate + ")scale(" + bscale + ")");
      }
    }
    
    if (options.success)
      options.success();

    zoomLabel.text(Math.round(100 * zoom.scale() / maxZoom) + '%');
    if (this.selectedIds)
      this.select(selectedIds);
  };  
  
  
  this.getTransform = function(){
    return g.attr("transform");
  } 

  this.renderMap = function (options) {
    if (options.topology) {
      loadMap(options.topology, options);
    }
    else if (options.source) {
      d3.json(options.source, function (error, map) {
        if (error)
          return console.error(error);
        loadMap(map, options);
      });
    }
  };

  // highlight regions with given ids
  this.select = function (ids) {
    if (!(ids instanceof Array))
      ids = [ids];
    this.selectedIds = ids;
    d3.selectAll('.subunit').classed('selected', false);
    ids.forEach(function (id) {
      d3.selectAll('.key' + id).classed('selected', true);
    })
  };

};
//suppress client-side error (different ways to import on client and server)
if (typeof exports !== 'undefined')
  exports.init = Map;
