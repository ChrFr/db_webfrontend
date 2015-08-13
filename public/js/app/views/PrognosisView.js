define(['app', 'backbone', 'text!templates/prognosis.html', 'collections/CommunityCollection', 
  'collections/LayerCollection', 'views/OptionView', 'views/visuals/Map'],
  function (app, Backbone, template, CommunityCollection, LayerCollection, OptionView) {
    
    /** 
      * @author Christoph Franke
      * 
      * @desc this class will hold functions for user interaction
      * @see map of area of prognoses and description of prognoses
    */
    var PrognosisView = Backbone.View.extend({
      // The DOM Element associated with this view
      el: document,
      // View constructor
      initialize: function () {
        // Calls the view's render method
        var _this = this;
        this.layers = new LayerCollection();
        this.communities = new CommunityCollection();   
        // layer information needed to region selection and to finally render map, so you can already fetch them before rendering view
        this.layers.fetch({
          success: function () {
            _this.render();
          },
          error: function() {
            _this.render(); // render anyway, if fetching layers fails, you can at least choose Gesamtgebiet/Gemeinde on layer selection
          }
        });        
      },
      
      render: function () {
        var _this = this;
        this.template = _.template(template, {});
        this.el.innerHTML = this.template;
        
        //id of active prognosis changed in navbar -> render it
        app.bind('activePrognosis', function (progId) {
          
          var success = _this.renderOverview(app.get('activePrognosis'));
          
          if(success){
            var prepareSelect = function(){
              _this.el.querySelector('#map-wrapper').style.display = 'block';

              // remove old options
              var layerSelector = _this.el.querySelector('#layer-select');
              while (layerSelector.firstChild)
                layerSelector.removeChild(layerSelector.firstChild);
              
              // create options for layer selection in preparation for map rendering
              new OptionView({el: layerSelector, name: 'Bitte wählen', value: null});
              new OptionView({el: layerSelector, name: 'Gesamtgebiet', value: -2});  // this and next line are default layers and do not depend on any other layer information
              new OptionView({el: layerSelector, name: 'Gemeinde', value: -1});

              _this.layers.each(function (layer) {
                new OptionView({
                  el: layerSelector,
                  name: layer.get('name'),
                  value: layer.get('id')
                });
              });

              _this.communities.comparator = 'name';
              _this.communities.sort();

              // change layer on selection of different one
              layerSelector.onchange = function (e) {
                if (e.target.value !== null) {
                  _this.changeLayer(e.target.value);
                }
              };
            };
            
            _this.communities.fetch({
                    data: {progId: progId},
                    success: prepareSelect
            });
          }
        });
        
        _this.renderOverview(app.get('activePrognosis'));
        return this;
      },
      
      renderOverview: function (pid) {
        var title = this.el.querySelector('#title');
        var text = this.el.querySelector('#description') || '';
        this.el.querySelector('#map-wrapper').style.display = 'none';
        var warningGlyph = '<span class="glyphicon glyphicon-warning-sign"></span>&nbsp';
        if (!app.get('session').get('user')) {
          title.innerHTML = warningGlyph + ' Sie sind nicht eingeloggt';
          text.innerHTML = 'Sie müssen sich <a href="#login">einloggen</a>, um auf die Prognosen zugreifen zu können.';
          return false;
        }
        else if (!pid || pid < 0) {
          title.innerHTML = warningGlyph + 'keine Prognose gewählt! ';
          text.innerHTML = 'Bitte wählen Sie eine Prognose im Menü aus.';
          return false;
        }
        else {
          var prognosis = app.get('prognoses').find(function (item) {
            return item.get('id') == pid;
          });

          title.innerText = prognosis.get('name');
          text.innerHTML = prognosis.get('description');
          return true;
        }
      },
      
      
      // change the region-layer (e.g. whole area, landkreis, gemeinde ...) to given layerId and rerender map
      // gemeinden (communities) are smallest entities, so all higher layers have to be aggregated from those
      changeLayer: function (layerId) {
        var _this = this;
        var progId = app.get('activePrognosis');
        var regionSelector = this.el.querySelector('#region-select');

        while (regionSelector.firstChild)
          regionSelector.removeChild(regionSelector.firstChild);

        // special case: WHOLE area (all communities summed up); needs no region-selection
        if (layerId == -2) {
          var _this = this;
          regionSelector.style.display = 'none';
          this.el.querySelector('#region-label').style.display = 'none';
          var allCommunities = [];
          this.communities.each(function (region) {
            allCommunities.push(region.get('rs'));
          });

          // create aggregation over all available regions
          var model = [{id: 0, name: 'Gesamtgebiet', rs: allCommunities}];
          _this.renderMap(model); // update map
          _this.map.select(0); // select area on map
          //this.renderRegion(this.getAggregateRegion(0, allCommunities, 'Gesamtgebiet')); // render data
        }
        
        // BASIC layer gemeinden (community, smallest enitity)
        else if (layerId == -1) {
          _this.el.querySelector('#region-label').innerHTML = 'Gemeinde';
          regionSelector.style.display = 'block';
          this.el.querySelector('#region-label').style.display = 'block';

          // selector for entity (single region)
          new OptionView({el: regionSelector, name: 'Bitte wählen', value: -2});
          this.communities.each(function (community) {
            new OptionView({
              el: regionSelector,
              name: community.get('name'),
              value: community.get('rs')
            });
          });
          console.log(this.communities)
          _this.renderMap();

          // multiple selector
          regionSelector.onchange = function (e) {
            if (e.target.value > 0) {
              var rsAggr = [], model, names = [], ids;
              
              // check which regions are selected
              for (var i = 0, len = regionSelector.options.length; i < len; i++) {
                var opt = regionSelector.options[i];
                if (opt.selected) {
                  rsAggr.push(opt.value);
                  names.push(opt.innerHTML);
                }
              }
              
              // multiple regions are selected -> aggregate regions
              if (rsAggr.length > 1) {
               // model = _this.getAggregateRegion(rsAggr.join('-'), rsAggr, names.join());
                ids = rsAggr;
              }
              // get single region model
              else {
                model = _this.collection.get(rsAggr[0]);
                model.set('name', names[0]);
                ids = model.get('rs');
              }
              
              _this.map.select(ids);
              //_this.renderRegion(model);
            }
          };
        }

        // SPECIFIC custom layer (e.g. landkreise)
        else if (layerId > 0) {

          this.layers.get(layerId).fetch({
            data: {progId: progId}, 
            success: function (layer) {
              // selector for entity (single region)
              _this.el.querySelector('#region-label').innerHTML = layer.get('name');
              regionSelector.style.display = 'block';
              _this.el.querySelector('#region-label').style.display = 'block';
              new OptionView({el: regionSelector, name: 'Bitte wählen', value: null});

              // aggregate smallest entities to regions
              var rsMap = {}; // relate enitity ids to id of aggregation of those entities
              var aggregates = layer.get('regionen');
              aggregates.forEach(function (region) {
                new OptionView({ // options for selector
                  el: regionSelector,
                  name: region.name,
                  value: region.id
                });
                rsMap[region.id] = region.rs; 
              });
              
              _this.renderMap(aggregates);

              // listen to selection
              regionSelector.onchange = function (e) {
                if (e.target.value !== null) {
                  var rsAggr = rsMap[e.target.value];
                  var name = e.target.selectedOptions[0].innerHTML;
                  name += '_' + layerId; //id suffix (there may be other layers with same names); must be removed to get name
                  //var model = _this.getAggregateRegion(e.target.value, rsAggr, name);
                  _this.map.select(model.id);
                 // _this.renderRegion(model);
                }
              };
            }
          });
        }      
      },
      
      // render the map of regions
      // aggregates: array of objects with id, name and rs (array of rs); regions on map with the given rs will be aggregated to given id/name
      renderMap: function (aggregates) {
        var _this = this;

        // click handler, if map is clicked, render data of selected region
        var onClick = function (rs, name, rsAggr) {
          var model;
          // get existing model or aggregate (if higher layer)
          if (rsAggr)
            model = _this.getAggregateRegion(rs, rsAggr, name);
          else {
            model = _this.collection.get(rs);
            model.set('name', name);
          }

          // TODO: multiselect on map with ctrl+click
          if (d3.event.ctrlKey)
            console.log('strg')
          
          _this.map.select(rs);
          //update selector to match clicked region
          var regionSelector = _this.el.querySelector('#region-select');
          for (var i = 0, j = regionSelector.options.length; i < j; ++i) {
            if (regionSelector.options[i].innerHTML === name) {
              regionSelector.selectedIndex = i;
              break;
            }
          }
          //_this.renderRegion(model); // render region-data
        };

        var vis = this.el.querySelector('#map');
        while (vis.firstChild)
          vis.removeChild(vis.firstChild);

        var width = parseInt(vis.offsetWidth) - 10, // rendering exceeds given limits -> 10px less
            height = width,
            units = [];

        // build geojson object from geometries attached to the communities
        var topology = {
          'type': 'FeatureCollection',
          'features': []
        };        
        this.communities.each(function (model) {
          units.push(model.get('rs'));
          var feature = {
            'type': 'Feature',
            'geometry': JSON.parse(model.get('geom_json')),
            'id': model.get('rs'),
            'properties': {
              'name': model.get('name')
            }
          };
          topology.features.push(feature);
        });

        // create and render map
        this.map = new Map({
          el: vis,
          topology: topology,
          //source: './shapes/gemeinden.json', 
          //source: '/api/layers/gemeinden/map', 
          isTopoJSON: false,
          units: units,
          width: width,
          height: height,
          aggregates: aggregates,
          onClick: onClick
        });
        this.map.render();
      },
            
      //remove the view
      close: function () {
        this.unbind(); // Unbind all local event bindings
        this.remove(); // Remove view from DOM
      }

    });

    // Returns the View class
    return PrognosisView;
  }
);