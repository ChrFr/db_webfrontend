define(['jquery', 'app', 'backbone', 'text!templates/prognosis.html', 'views/DemographicDevelopmentView', 
  'views/HouseholdsDevelopmentView', 'collections/CommunityCollection', 'collections/LayerCollection', 
  'views/OptionView', 'views/visuals/Map', 'views/Loader'],
  function ($, app, Backbone, template, DemographicDevelopmentView, HouseholdsDevelopmentView,
    CommunityCollection, LayerCollection, OptionView) {
    
    /** 
      * @author Christoph Franke
      * 
      * @desc view on a specific prognosis, leads to household and demographic prognoses
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
      
      events: {
        // age group controls
        'click #demo-link-div>a': 'tabChange',
        'click #hh-link-div>a': 'tabChange',
      },
      
      // activate the menu link in the navbar when a link is clicked here
      // not best practice, because cross linking with navbar, but better for usability
      tabChange: function(e){
        // don't know why it is currentTarget instead of target here, e.target is strangely enough the headline inside the link
        var href = e.currentTarget.getAttribute("href");
        var links = document.querySelector('#prognosis-collapse').getElementsByTagName('li');
        for(var i = 0; i < links.length; i++)
          links[i].className = '';
        if(href === '#dd-tab')
          document.querySelector('#li-dd').className = 'active';
        if(href === '#hh-tab')
          document.querySelector('#li-hh').className = 'active';
      },
      
      render: function () {
        var _this = this;
        this.template = _.template(template, {});
        this.el.innerHTML = this.template;  
                
        var prog = app.get('activePrognosis');
        if(prog){
          this.el.querySelector('#description-div').style.display = 'block';
          this.prepareSelections(prog.id);
        }
        
        //id of active prognosis changed in navbar -> render it
        app.bind('activePrognosis', function (progId) {
          
          var success = _this.renderOverview(app.get('activePrognosis'));
          if(success){
            _this.prepareSelections(progId);
          }
          else{            
            _this.el.querySelector('#description-div').style.display = 'none';
            _this.el.querySelector('#layer-select-wrapper').style.display = 'none';
            _this.el.querySelector('#demo-link-div').style.display = 'none';
            _this.el.querySelector('#hh-link-div').style.display = 'none';
            var vis = _this.el.querySelector('#map');
            while (vis.firstChild)
            vis.removeChild(vis.firstChild);
          }
        });
        
        _this.renderOverview(app.get('activePrognosis'));
        return this;
      },
      
      // prepare the region selection and the specific prognoses views
      // id: id of selected prognosis (available regions depend on this)
      prepareSelections: function(id){
        var _this = this;
        var mapLoader = Loader(this.el.querySelector('#map'));
        
        this.communities.fetch({ //get the smallest entities (=communities) to build up regions
                  data: {progId: id},
                  error: function(){
                      
                  },
                  success: function(){

            _this.el.querySelector('#description-div').style.display = 'block';
            _this.el.querySelector('#layer-select-wrapper').style.display = 'block';
            _this.el.querySelector('#demo-link-div').style.display = 'block';
            _this.el.querySelector('#hh-link-div').style.display = 'block';

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
            
            mapLoader.remove();
            _this.renderMap({renderRegions: false});

            // change layer on selection of different one
            layerSelector.onchange = function (e) {
              if (e.target.value !== null) {
                _this.changeLayer(e.target.value);
              }
            };
          }
        });
        
        // prepare the views        
        if(this.ddView)
          this.ddView.close();
        if(this.hhView)
          this.hhView.close();
        this.ddView = new DemographicDevelopmentView({
          el: this.el.querySelector('#dd-tab'),
          visTabWidth: parseInt(this.el.querySelector('#vis-reference').offsetWidth)
        });
        this.hhView = new HouseholdsDevelopmentView({el: this.el.querySelector('#hh-tab')});
        
      },
      
      renderOverview: function (pid) {
        var title = this.el.querySelector('#title');
        var text = this.el.querySelector('#description') || '';
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

        // SPECIAL CASE: WHOLE area (all communities summed up); needs no region-selection
        if (layerId == -2) {
          var _this = this;
          regionSelector.style.display = 'none';
          this.el.querySelector('#region-label').style.display = 'none';
          var allCommunities = [];
          this.communities.each(function (region) {
            allCommunities.push(region.get('rs'));
          });

          // aggregation over all available communities
          var region = {id: 0, name: 'Gesamtgebiet', rs: allCommunities};
          _this.renderMap({
            aggregates: [region], 
            renderRegions: true, 
            success: function(){_this.map.select(0);}
          }); // update map
          app.set('activeRegion', region);
          //this.renderRegion(this.getAggregateRegion(0, allCommunities, 'Gesamtgebiet')); // render data
        }
        
        // BASIC LAYER gemeinden (community, smallest enitity)
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
          _this.renderMap({renderRegions: true});

          // multiple selector
          regionSelector.onchange = function (e) {
            if(regionSelector.selectedIndex <= 0)
              return;
            var rsAggr = [], model, names = [], id;

            // check which regions are selected
            for (var i = 0, len = regionSelector.options.length; i < len; i++) {
              var opt = regionSelector.options[i];
              if (opt.selected) {
                rsAggr.push(opt.value);
                names.push(opt.innerHTML);
              }
            }

            // multiple communities selected -> concatenate rs to get a unique id
            // if single one is selected, rs becomes id
            id = rsAggr.join('-');      
            if(rsAggr.length <= 1)
              rsAggr = null; // single rs means no aggregation at all

            var region = {
              id: id, 
              name: names.join(', '), 
              rs: rsAggr
            };
            app.set('activeRegion', region);
            _this.map.select(rsAggr || id); // if there are no multiple selected rs, select id (in this case equals single rs)            
          };
        }

        // SPECIFIC CUSTOM LAYER (e.g. landkreise)
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
              
              _this.renderMap({aggregates: aggregates, renderRegions: true});

              // listen to selection
              regionSelector.onchange = function () {
                if(regionSelector.selectedIndex <= 0)
                  return;
                var rsAggr = [], names = [], values = [];

                // check which regions are selected
                for (var i = 0, len = regionSelector.options.length; i < len; i++) {
                  var opt = regionSelector.options[i];
                  if (opt.selected) {
                    values.push(opt.value);
                    rsAggr = rsAggr.concat(rsMap[opt.value]);
                    names.push(opt.innerHTML);
                  }
                }

                var region = {
                  id: values.join('-'), 
                  name: names.join(', '), 
                  rs: rsAggr
                };
                
                app.set('activeRegion', region);
                _this.map.select(values);
              };
            }
          });
        }      
      },
      
      
      // render the map of regions
      // aggregates: array of regions with id, name and rs (array of rs); regions on map with the given rs will be aggregated to given id/name
      // options.success: only if renderregions
      renderMap: function (options) {
        var _this = this;
        
        var vis = this.el.querySelector('#map');
        while (vis.firstChild)
        vis.removeChild(vis.firstChild);
      
        var width = parseInt(vis.offsetWidth) - 10, // rendering exceeds given limits -> 10px less
            height = width,
            units = [];

        if(options.renderRegions){
          // click handler, if map is clicked, render data of selected region
          var onClick = function (rs, name, rsAggr) {
            
            //update selector to match clicked region
            var regionSelector = _this.el.querySelector('#region-select');
            for (var i = 0, j = regionSelector.options.length; i < j; ++i) {
              if (regionSelector.options[i].innerHTML === name) {
                //invert selection (maybe it was already selected
                regionSelector.options[i].selected = !regionSelector.options[i].selected;
              }
            }
            regionSelector.onchange();
          };

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
        }

        // create map
        this.map = new Map({
          el: vis,
          units: units,
          width: width,
          height: height,
          aggregates: options.aggregates,
          onClick: onClick
        });
        
        // only render selected regions, if asked for
        if(options.renderRegions)
          var success = function(){
            _this.map.renderMap({          
              topology: topology,
              isTopoJSON: false,
              success: options.success
            });        
          }
        
        this.map.renderMap({          
          source: './shapes/bundeslaender.json',
          isTopoJSON: true,
          success: success
        });
      },
            
      //remove the view
      close: function () {
        app.unbind('activePrognosis');
        if(this.ddView)
          this.ddView.close();
        if(this.hhView)
          this.hhView.close();
        this.unbind(); // Unbind all local event bindings
        this.remove(); // Remove view from DOM
      }

    });

    // Returns the View class
    return PrognosisView;
  }
);