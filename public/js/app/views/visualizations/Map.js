/**
 * Author: Christoph Franke
 * Publisher: GGR
 *
 * an interactive zoomable, clickable map of regions, 
 * call render(options) to render maps on top of the background map,
 * removeMap() removes all maps but the background
 * 
 * @param options.el parent html-element the map will be placed in
 * @param options.width the width of the viewport
 * @param options.height the height of the viewport
 * @param options.background options for a background map, see comments above function renderMap() to see how it is formed
 *  
 */
var Map = function(options){  
  
  this.el = options.el || document;
  this.width = options.width;
  this.height = options.height;
  this.background = options.background || {};
  
 /** 
  * render given map-data (geoJSON or topoJSON, file or data) into map
  * the smallest units are always referred to as subunits!
  * the background units are always referred to as toplayer!
  * 
  * @param options.topology ready map-data, excludes options.source
  * @param options.source path to file with map-data, excludes options.topology
  * @param options.boundaries boundaries (needed for bounding box) can not be computed with geoJSON-data, pass boundaries instead, if you want a zoom to the bbox (ignored when topoJSON-data is passed) 
  * @param options.subunits the subunits, their names and their ids
  * @param options.aggregates the areas that will be aggregated from subunits (e.g. landkreise are composed of gemeinden)
  * @param options.isTopoJSON indicator for the data-type, if the data is topoJSON set it to true else false (or don't set at all)
  * @param options.callback callback is called after map is rendered (loading from file is asynchronous!)
  *  
  */
  this.render = function(options){
    if(!options.subunits) options.subunits = [];
    // process data
    if(options.topology){
      loadMap(options.topology, options);
    }
    // load file and process data then
    else if(options.source){
      d3.json(options.source, function(error, map){
        if(error)
          return console.error(error);
        loadMap(map, options);
      });
    }
  };
    
  //server-side d3 needs to be loaded seperately
  if(!d3)
    var d3 = require('d3');
  if(!d3slider)
    var d3slider = require('d3slider');
  if(!topojson)
    var topojson = require('topojson');

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
   
  var timerId;
  //ZOOM EVENT
  function zoomed(){
    var scale = d3.event.scale;
    projection.translate(d3.event.translate).scale(scale);
    g.selectAll('path').attr('d', path);
    //if you zoom in and out too fast, d3 can't set the values properly and throws error
    //timer prevents this
    clearTimeout(timerId);
    timerId = setTimeout(function() { zoomSlider.value(100 * scale / maxZoom); }, 100);            
  }

  var mouseover = function(d, i){
    // ignore unmapped areas
    if(typeof d.id === 'undefined' || d.id === null)
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

  var mouseout = function(){
    //d3.select(this).classed('highlight', false); 
    d3.selectAll('.subunit').classed('highlight', false);
    d3.select('body').selectAll('div.tooltip').remove();
  };

  function translation(x, y){
    return 'translate(' + x + ',' + y + ')';
  }

  var svg = d3.select(this.el).append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('xmlns:xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('width', innerwidth)
      .attr('height', innerheight);

  var g = svg.append('g')
      .call(zoom);
  
  var zoomWrapper = d3.select(this.el).insert('div', ':first-child');

  zoomWrapper.append('span')
      .attr('class', 'glyphicon glyphicon-zoom-out')
      .attr('aria-hidden', 'true')
      .style('float', 'left')
      .style('margin-left', 10 + 'px')
      .attr('width', 20);
  
  var slideDiv = zoomWrapper.append('div')
      .attr('id', 'zoom-slider')
      .style('float', 'left')
      .style('width', innerwidth - 65 + 'px')
      .style('margin-left', 5 + 'px')
      .style('margin-right', 5 + 'px')
      .style('margin-top', 5 + 'px');
  
  zoomWrapper.append('span')
      .attr('class', 'glyphicon glyphicon-zoom-in')
      .attr('aria-hidden', 'true')
      .style('float', 'left')
      .attr('width', 20);
  
  var slideZoom = function(event, value){
   zoom.scale(maxZoom * value / 100).event(g);
  };

  var zoomSlider = d3slider().axis(d3.svg.axis())
    .min(100 * minZoom/maxZoom).max(100)
    .axis(d3.svg.axis().ticks(0))
    .on('slide', slideZoom)
    .value(Math.round(100 * zoom.scale() / maxZoom));

  slideDiv.call(zoomSlider);
  
  var sliderHandle = slideDiv.select('.d3-slider-handle');
    
  if (options.background){     
      // you shouldn't zoom on background map, because it can messup the later zoom
      options.background.disableZoom = true;
      this.render(options.background);
  }
  
  // add overlaying text, can be addressed by id
  svg.append('text')
    .attr('id', 'overlay-text')
    .attr('x', innerwidth / 2)
    .attr('y', innerheight / 2)
    .attr("text-anchor", "middle");
  
  function zoomTo(boundaries, smooth){    
    // ZOOM TO OUTER PATH
    var bounds = path.bounds(boundaries),
        bdx = bounds[1][0] - bounds[0][0],
        bdy = bounds[1][1] - bounds[0][1],
        bx = (bounds[0][0] + bounds[1][0]) / 2,
        by = (bounds[0][1] + bounds[1][1]) / 2,
        bscale = .9 / Math.max(bdx / innerwidth, bdy / innerheight),
        translate = [innerwidth / 2 - bscale * bx, innerheight / 2 - bscale * by];

    if(smooth)
      g.transition()
          .duration(1500)
          .style("stroke-width", 1.5 / bscale + "px")
          .attr("transform", "translate(" + translate + ")scale(" + bscale + ")"); 
    else
      g.attr("transform", "translate(" + translate + ")scale(" + bscale + ")");
  };
  this.zoomTo = zoomTo;
  
  /*
   * does the job for this.render(); seperated, for optional asynchronous file-loading by d3
   * map is for options see this.render()
   */
  function loadMap(map, options){
    // only draw required shapes       
    if(options.isTopoJSON && !map.objects.subunits)
      map.objects.subunits = {};    
    var subunits = {type: 'GeometryCollection'},
    geometries = !options.isTopoJSON ? map.features : map.objects.subunits.geometries;

    if(geometries)
      subunits.geometries = geometries.filter(function(el){
        return options.subunits.indexOf(el.id) >= 0;
      });

    // join shapes
    if(options.aggregates && geometries){

      var aggregationMap = {};
      options.aggregates.forEach(function(aggr){
        aggr.rs.forEach(function(rs){
          aggregationMap[rs] = {id: aggr.id, rsArr: aggr.rs, name: aggr.name};
        });
      });
      subunits.geometries.map(function(el){
        var mapped = aggregationMap[el.id];
        // unmapped areas (not belonging to any aggregate) will be ignored later
        el.id = mapped ? mapped.id : null;
        el.properties.name = mapped ? mapped.name : null;
        el.properties.rsArr = mapped ? mapped.rsArr : null;
      });
    };

    /* render TopoJSON */
    if(options.isTopoJSON){
      
      // background map
      g.append('g')
          .selectAll('.background')
          .data(topojson.feature(map, map.objects.toplayer).features)
          .enter().append('path')
          .attr('class', 'background id')
          .attr('d', path)
          .attr('cursor', 'move');

      var boundaries;

      // detailed map
      if(geometries){

        // FEATURE-SHAPES
        g.append('g')
            .attr('class', 'submap')
            .selectAll('.subunit')
            .data(topojson.feature(map, subunits).features)
            .enter().append('path')
            .attr('class', function(d){
              return 'subunit key' + d.id;
            })
            .attr('key', function(d){
              return d.id;
            })
            .attr('d', path)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', function(d){
              options.onClick(d.id, d.properties.name, d.properties.rsArr);
            })
            .attr('cursor', 'pointer');

        // INTERIOR BOUNDARIES
        g.append('path')
            .datum(topojson.mesh(map, subunits, function(a, b){
              return a !== b;
            }))
            .attr('d', path)
            .attr('class', 'subunit-boundary');

        // DRAW OUTER BOUNDARY OF SUBUNITS
        boundaries = topojson.mesh(map, subunits, function(a, b){
          return a === b;
        });

        g.append('path')
            .datum(boundaries)
            .attr('d', path)
            .attr('class', 'subunit-outer-boundary');
      }
      else{
        //  OUTER BOUNDARY OF TOPLAYER      
        boundaries = topojson.mesh(map, map.objects.toplayer, function(a, b){
          return a === b;
        });
      }
      zoomTo(boundaries, false);
    }

    /* render GeoJSON */
    else{
      g.append('g')
          .attr('class', 'submap')
          .selectAll('path')
              .data(subunits.geometries)
              .enter().append('path')
              .attr('class', function(d){
                return 'subunit key' + d.id;
              })
              .attr('key', function(d){
                return d.id;
              })
              .attr('d', path)
              .attr('cursor', 'pointer')
              .on('mouseover', mouseover)
              .on('mouseout', mouseout)
              .on('click', function(d){
                if(d.id)
                  options.onClick(d.id, d.properties.name, d.properties.rsArr);
              });
    }

    // disable the zoom-controls
    if(options.disableZoom){
      zoomWrapper.classed('disabled', true);
      sliderHandle.style('display', 'none');
      svg.selectAll('.background').attr('cursor','not-allowed');
    }
    // enable the zoom-controls
    else{
      zoomWrapper.classed('disabled', false);
      sliderHandle.style('display', 'block');
      svg.selectAll('.background').attr('cursor', 'move');
    }
    
    if(options.callback)
      options.callback();

    if(this.selectedIds)
      this.select(selectedIds);
  };

  this.getTransform = function(){
    return g.attr("transform");
  };

  this.removeMaps = function(){
    g.selectAll('.submap').remove();
  };

  // highlight regions with given ids
  this.select = function(ids){
    if(!(ids instanceof Array))
      ids = [ids];
    this.selectedIds = ids;
    d3.selectAll('.subunit').classed('selected', false);
    ids.forEach(function(id){
      d3.selectAll('.key' + id).classed('selected', true);
    });
  };
  
  /*
   * change size of the view
   */
  this.changeViewport = function(width, height){
    // resize svg
    var iw = width - margin.left - margin.right,
        ih = height - margin.top - margin.bottom;
    svg.attr('width', iw).attr('height', ih);
      
    // resize slider
    slideDiv.style('width', iw - 45 + 'px');
  };
  
  this.setOverlayText = function(text){
    svg.select('#overlay-text').text(text);
  };

};
//suppress client-side error (different ways to import on client and server)
if(typeof exports !== 'undefined')
  exports.init = Map;
