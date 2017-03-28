/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['jquery', 'app', 'backbone', 'text!templates/prognosis.html', 
  'views/DemographicsView', 'views/HouseholdsView', 
  'collections/SubunitCollection', 'collections/LayerCollection',
  'views/OptionView', 'views/visualizations/Map', 'views/Loader', 'views/misc'],
    function($, app, Backbone, template, DemographicsView, HouseholdsView,
        SubunitCollection, LayerCollection, OptionView){

      /** 
       * 
       * @desc view on a specific prognosis, wraps a map, the household and 
       * demographic prognoses and guides the user to the specific prognoses
       * @see map of area of prognoses, description of prognoses, household 
       * and demographic prognoses
       */
      var PrognosisView = Backbone.View.extend({
        // The DOM Element associated with this view
        el: document,
        
        // View constructor
        initialize: function(){
          // Calls the view's render method
          var _this = this;
          this.layers = new LayerCollection();
          this.subunits = new SubunitCollection();
          // layer information needed to region selection and to finally render 
          // map, so you can already fetch them before rendering view
          this.layers.fetch({
            success: function(){
              _this.render();
            },
            error: function(){
              _this.render(); // render anyway, if fetching layers fails, 
              //you can at least choose Gesamtgebiet/subunits on layer selection
            }
          });          
        
          var delay = (function(){
            var timer = 0;
            return function(callback, ms){
              clearTimeout (timer);
              timer = setTimeout(callback, ms);
            };
          })();

          var _this = this;
          //listen to resize event of the window and rerender, if resized
          $(window).resize(function(e) {             
            if (e.target === window)
              delay(function(){
                _this.rerender();
              }, 1000);
          });
        },
        
        events: {
          // navigate to the specific prognoses
          'click #sub-map-nav>a': 'tabChange'
        },
        
        /*
         * activate the menu link in the navbar when a link is clicked here
         * not best practice, because cross linking with navbar, but better 
         * for usability
         */
        tabChange: function(e){
          // don't know why it is currentTarget instead of target here, 
          // e.target is strangely enough the headline inside the link
          var href = e.currentTarget.getAttribute("href");
          var links = document.querySelector('#prognosis-collapse').getElementsByTagName('li');
          for(var i = 0; i < links.length; i++)
            links[i].className = '';
          if(href === '#overview-tab')
            document.querySelector('#li-overview').className = 'active';
          if(href === '#dd-tab')
            document.querySelector('#li-dd').className = 'active';
          if(href === '#hh-tab')
            document.querySelector('#li-hh').className = 'active';
        },
        
        /*
         * render the view
         */
        render: function(){
          var _this = this;
          this.template = _.template(template, {});
          this.el.innerHTML = this.template;

          // overview should be opened, when new prognosis is selected
          document.querySelector('#li-overview>a').click();
          
          var prog = app.get('activePrognosis');
          this.createMap();
          
         /*
          * prepare the region selection and the specific prognoses views
          * id: id of selected prognosis (available regions depend on this)
          */
          function prepareViews(prognosis){            
            var success = _this.renderOverview(app.get('activePrognosis'));
            if(success){
              var loader = Loader(_this.el.querySelector('#map'));

              _this.subunits.fetch({ //get the smallest entities to build up regions
                data: {progId: prognosis.id},
                error: function(){
                },
                success: function(){
                  loader.remove();              
                  var prog = app.get('activePrognosis');
                  var progId = prog.get('id');
                  _this.map.zoomTo(prog.get('boundaries'), true);

                  _this.el.querySelector('#description-div').style.display = 'block';
                  _this.el.querySelector('#overview').style.display = 'block';
                  _this.el.querySelector('#layer-select-wrapper').style.display = 'block';
                  _this.el.querySelector('#sub-map-nav').style.display = 'block';
                  // remove old options
                  var layerSelector = _this.el.querySelector('#layer-select');
                  clearElement(layerSelector);

                  // create options for layer selection in preparation for map rendering
                  // default layers first
                  new OptionView({el: layerSelector, name: 'Gesamtgebiet', value: -2});  

                  var minLevel = Number.MAX_SAFE_INTEGER;
                  var firstLayerId;
                  _this.layers.each(function(layer){
                    // only take options of active prognosis
                    if (layer.get('prognose_id') === progId){
                      var level = layer.get('level');
                      var layerId = layer.get('id');
                      if (level < minLevel){
                        minLevel = level;
                        firstLayerId = layerId;
                      }
                      new OptionView({
                        el: layerSelector,
                        name: layer.get('name'),
                        value: layerId
                      });
                    }
                  });

                  _this.subunits.comparator = 'name';
                  _this.subunits.sort();

                  _this.map.setOverlayText('Bitte wählen Sie eine Gliederungsebene aus.');
                  _this.el.querySelector('#selection-label').innerHTML = 'aktuelle Auswahl: <b>keine</b> <br> (Bitte klicken Sie auf der Karte ein Gebiet an!)';
                  // change layer on selection of different one
                  layerSelector.onchange = function(e){
                    if(e.target.value !== null){
                      _this.changeLayer(e.target.value);
                    }
                  };
                  
                  // select min layer to show first
                  layerSelector.value = firstLayerId;
                  layerSelector.onchange({target: {value: firstLayerId}});
                }
              });

              // remove old views        
              if(_this.ddView)
                _this.ddView.close();
              if(_this.hhView)
                _this.hhView.close();
              _this.ddView = new DemographicsView({
                el: _this.el.querySelector('#dd-tab').appendChild(
                        document.createElement('div'))
              });
              _this.hhView = new HouseholdsView({
                el: _this.el.querySelector('#hh-tab').appendChild(
                        document.createElement('div'))
              });
            }
            else{
              // hide all elements interacting with prognoses, when no prognosis is loaded
              _this.el.querySelector('#description-div').style.display = 'none';
              _this.el.querySelector('#overview').style.display = 'none';
              _this.el.querySelector('#layer-select-wrapper').style.display = 'none';
              _this.el.querySelector('#sub-map-nav').style.display = 'none';
              _this.el.querySelector('#region-select').style.display = 'none';
              _this.el.querySelector('#region-label').style.display = 'none';
              if(_this.ddView)
                _this.ddView.close();
              if(_this.hhView)
                _this.hhView.close();
              _this.map.removeMaps();
              _this.el.querySelector('#selection-label').innerHTML = '';
            }
          }
          
          // id of active prognosis changed in navbar -> prepare prognosis to be viewed
          app.bind('activePrognosis', prepareViews);
          
          // do the same right at start
          prepareViews(app.get('activePrognosis'));          
          
          return this;
        },
        
        /*
         * rerender graphical elements to adapt to current window size
         */
        rerender: function(){       
          // rerender visualisations of the demographic development view
          if(this.ddView)
            this.ddView.renderData();
          
          // resize the map
          if(this.map){
            var vis = this.el.querySelector('#map');            
            var width = parseInt(vis.offsetWidth) - 20, // rendering exceeds given limits -> 10px less
                height = width;
            this.map.changeViewport(width, height);
          }
        },
        
        /*
         * render the start messages like description and title
         */
        renderOverview: function(prognosis){
          var title = this.el.querySelector('#title');
          var description = this.el.querySelector('#description');          
          if(!app.get('session').get('user')){
            this.map.setOverlayText('Bitte loggen Sie sich zunächst ein!');
            return false;
          }
          else if(!prognosis){
            this.map.setOverlayText('Bitte wählen Sie eine Prognose im Menü aus.');
            return false;
          }
          else{       
            this.map.setOverlayText('');
            title.innerText = prognosis.get('name');
            description.innerHTML = prognosis.get('description');
            this.el.querySelector('#max-inhabitants').innerHTML = prognosis.get('max_bevstand');
            this.el.querySelector('#base-year').innerHTML = prognosis.get('basisjahr');
            return true;
          }
        },
        
        /*
         * change the region-layer (e.g. whole area, landkreis, subunits ...) 
         * to given layerId and rerender map subunits are smallest entities, 
         * so all higher layers have to be aggregated from those
         */
        changeLayer: function(layerId){
          this.map.setOverlayText('');          
          var _this = this;
          var progId = app.get('activePrognosis').id,
              regionSelector = this.el.querySelector('#region-select'),
              multiTip = this.el.querySelector('#multi-tip');      
          
          multiTip.style.display = 'none';

          clearElement(regionSelector);
          
          // SPECIAL CASE: WHOLE area (all subunits summed up); 
          // needs no region-selection
          if(layerId == -2){
            // if overview is active switch to demodevelopment tab
            if (document.querySelector('#li-overview').classList.contains('active'))
              document.querySelector('#li-dd a').click();
            var _this = this;
            regionSelector.style.display = 'none';
            this.el.querySelector('#region-label').style.display = 'none';
            var allSubunits = [];
            this.subunits.each(function(region){
              allSubunits.push(region.get('rs'));
            });

            // aggregation over all available subunits
            var region = {id: 0, name: 'Gesamtgebiet', rs: allSubunits};
            _this.renderMap({
              aggregates: [region],
              callback: function(){
                _this.map.select(0);
              }
            }); // update map
            app.set('activeRegion', region);
            _this.el.querySelector('#selection-label').innerHTML = 'aktuelle Auswahl: <b>Gesamtgebiet</b><br>';
          }

          // BASE AND AGGREGATION LAYERS (e.g. landkreise)
          else {
            multiTip.style.display = 'block';

            this.layers.get(layerId).fetch({
              data: {progId: progId},
              success: function(layer){
                // selector for entity (single region)
                regionSelector.style.display = 'block';
                _this.el.querySelector('#region-label').style.display = 'block';
                new OptionView({el: regionSelector, name: 'Bitte wählen', value: null});

                // aggregate smallest entities to regions
                var rsMap = {}; // relate enitity ids to id of aggregation of those entities
                var aggregates = layer.get('regionen');
                aggregates.forEach(function(region){
                  new OptionView({// options for selector
                    el: regionSelector,
                    name: region.name,
                    value: region.id
                  });
                  rsMap[region.id] = region.rs;
                });

                _this.renderMap({aggregates: aggregates});

                // listen to selection
                regionSelector.onchange = function(){
                  // if overview is active switch to demodevelopment tab
                  if (document.querySelector('#li-overview').classList.contains('active'))
                    document.querySelector('#li-dd a').click();
                  if(regionSelector.selectedIndex <= 0)
                    return;
                  var rsAggr = [], names = [], values = [];

                  // check which regions are selected
                  for(var i = 0, len = regionSelector.options.length; i < len; i++){
                    var opt = regionSelector.options[i];
                    if(opt.selected){
                      values.push(opt.value);
                      rsAggr = rsAggr.concat(rsMap[opt.value]);
                      names.push(opt.innerHTML);
                    }
                  }
                  var name = names.join(', ');

                  var region = {
                    name: name,
                    rs: rsAggr
                  };

                  app.set('activeRegion', region);
                  _this.el.querySelector('#selection-label').innerHTML = 'aktuelle Auswahl: <b>' + name + '</b><br>';
                  _this.map.select(values);
                };
              }
            });
          }
        },
        
        /*
         * create the map with a background-layer containing germany
         */
        createMap: function(callback){    
          var vis = this.el.querySelector('#map');
          clearElement(vis);
          
          var width = parseInt(vis.offsetWidth) - 20, // rendering exceeds given limits -> 10px less
              height = width;
          
          // create map
          this.map = new Map({
            el: vis,
            width: width,
            height: height,
            background: {
              source: './shapes/bundeslaender.json',
              isTopoJSON: true,
              callback: callback
            },
            copyright: {
              text: 'Kartenmaterial: © Bundesamt für Kartographie und Geodäsie, Frankfurt am Main',
              link: 'http://www.bkg.bund.de'
            }
          });
        },
        
        /*
         * render the map of regions
         * options.aggregates: array of regions with id, name and rs 
         *                     (array of rs); regions on map with the given rs 
         *                     will be aggregated to given id/name
         * options.callback: called after map is rendered
         */
        renderMap: function(options){
          
          var _this = this,
              subunits = [],
              options = options || {};

          // click handler, if map is clicked, render data of selected region
          var onClick = function(rs, name, rsAggr){
            //update selector to match clicked region
            var regionSelector = _this.el.querySelector('#region-select');
            for(var i = 0, j = regionSelector.options.length; i < j; ++i){
              if(regionSelector.options[i].innerHTML === name){
                // ctrl or shift pressed while clicking -> allow multiselect
                if(d3.event.ctrlKey || d3.event.shiftKey)
                  //invert selection (maybe it was already selected
                  regionSelector.options[i].selected = !regionSelector.options[i].selected;
                // simple click -> single selection
                else{
                  regionSelector.selectedIndex = i;
                  break;
                }
              }
            }
            // trigger onchange event
            regionSelector.onchange();
          };

          // build geojson object from geometries attached to the subunits
          var topology = {
            'type': 'FeatureCollection',
            'features': []
          };
          this.subunits.each(function(model){
            subunits.push(model.get('rs'));
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
                    
          _this.map.removeMaps();

          _this.map.render({
            topology: topology,
            subunits: subunits,
            aggregates: options.aggregates,
            isTopoJSON: false,
            callback: options.callback,
            onClick: onClick
          });
        },
        
        /*
         * remove the view
         */
        close: function(){
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