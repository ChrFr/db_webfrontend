define(["app", "backbone", "text!templates/demodevelop.html", "collections/RegionCollection",  
    "collections/DemographicDevelopmentCollection",  "views/OptionView", 
    "views/TableView", "d3", "d3slider", "bootstrap", "views/visuals/AgeTree"],

    function(app, Backbone, template, RegionCollection, DemographicDevelopmentCollection,
            OptionView, TableView, d3, d3slider){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                _.bindAll(this, 'render');
                var _this = this;
                var progId = app.get('activePrognosis');
                if(progId){
                    this.collection = new DemographicDevelopmentCollection({progId: progId});
                    this.collection.fetch({success: function(){    
                        _this.regions = new RegionCollection({progId: progId});
                        _this.regions.fetch({success: _this.render});
                    }});
                }                
                this.playing = false;
            },

            events: {
                'click .download-btn#csv': 'openCurrentYearCsvTab',
                'click .download-btn#png': 'openCurrentYearPngTab',
                'click #play': 'play'
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;   
                
                var regionSelector = this.el.querySelector("#rsSelect");
                
                new OptionView({el: regionSelector, name: 'Bitte wählen', value: -2}); 
                this.regions.comparator = 'name';
                this.regions.sort();
                this.regions.each(function(region){                        
                    new OptionView({
                        el: regionSelector,
                        name: region.get('name'), 
                        value: region.get('rs')
                    });
                });
                
                regionSelector.onchange = function(e) { 
                    if (e.target.value > 0){
                        _this.changeRegion(e.target.value);
                    }
                };                
                
                return this;
            },            
            
            changeRegion: function(rs){
                var _this = this;
                
                this.collection.fetchDetails({rs: rs, success: function(model){ 
                    _this.currentModel = model;

                    // UPDATE SLIDER    
                    var tabContent = _this.el.querySelector(".tab-content");                  
                    var width = parseInt(tabContent.offsetWidth) - 90;
                    _this.el.querySelector("#slide-controls").style.display = 'block';
                    var sliderDiv = _this.el.querySelector("#slider");
                    sliderDiv.style.width = width + "px";  
                    var maxYear = model.get('maxYear');
                    var minYear = model.get('minYear');   
                    var yearStep = Math.floor((maxYear - minYear) / 4);
                      
                    _this.slider = d3slider()
                        .axis(
                            d3.svg.axis().orient("down")
                            .tickValues([minYear, minYear + yearStep, minYear + yearStep * 2, minYear + yearStep * 3, maxYear])
                            .tickFormat(d3.format("d"))
                            .ticks(maxYear - minYear)
                        )
                        .min(minYear)
                        .max(maxYear)
                        .step(1)
                        .margin(20);              
                    
                    d3.select('#slider').call(_this.slider);
                    
                    _this.slider.on("slide", function(evt, value) {
                        evt.stopPropagation();
                        _this.changeYear(value);
                    });
                    
                    //draw first year and render it
                    _this.currentYear = minYear;
                    _this.renderTable(_this.currentYear);
                    _this.renderTree(_this.currentYear);
                }});
            },
            
            renderTable: function(year){
                
                var title = year,
                    columns = [],
                    yearData;         
                
                _.each(this.currentModel.get('data'), (function(data){                     
                    if(data.jahr == year) 
                        yearData = data;
                }));                
                
                columns.push({name: "year", description: "Alter"});
                columns.push({name: "female", description: "Anzahl weiblich"});                
                columns.push({name: "male", description: "Anzahl männlich"});
                
                var femaleAges = yearData.alter_weiblich;
                var maleAges = yearData.alter_maennlich;
                
                var data = [];
                for (var i = 0; i < femaleAges.length; i++) { 
                    data.push({
                        year: i,
                        female: femaleAges[i],
                        male: maleAges[i]
                    });
                }
                this.table = new TableView({
                    el: this.el.querySelector("#prognosis-data"),
                    columns: columns,
                    title: title,
                    data: data
                });
            },
            
            renderTree: function(year){
                var yearData;
                
                _.each(this.currentModel.get('data'), (function(data){                     
                    if(data.jahr == year) 
                        yearData = data;
                }));       
                
                var vis = this.el.querySelector("#agetree");
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 50;
                //width / height ratio is 1 : 1.2
                var height = width * 1.2;
                this.ageTree = new AgeTree({
                    el: vis,
                    data: yearData, 
                    width: width, 
                    height: height,
                    maxY: this.currentModel.get('maxAge'),
                    maxX: this.currentModel.get('maxNumber')
                });
                this.ageTree.render();     
            },           
            
            openAllYearsCsvTab: function() {
                var win = window.open(this.currentModel.csvUrl(), '_blank');
                win.focus();
            },
            
            openCurrentYearCsvTab: function() {
                var currentYear = this.currentModel.get('currentYear');
                var win = window.open(this.currentModel.csvUrl(currentYear), '_blank');
                win.focus();
            },
            
            openCurrentYearPngTab: function() {
                var currentYear = this.currentModel.get('currentYear');
                var win = window.open(this.currentModel.pngUrl(currentYear), '_blank');
                win.focus();
            },
            
            changeYear: function(year){ 
                this.currentModel.set('currentYear', year);
                this.renderTable(year);
                var data = this.currentModel.get('data');
                var yearData = data[data.length - 1 - (this.currentModel.get('maxYear') - year)];       
                this.ageTree.changeData(yearData);
            },
            
            play: function(event){
                var _this = this;
                
                var stop = function(){                    
                    event.target.innerHTML = 'Play';
                    clearInterval(_this.timerId);
                }
                
                this.playing = !this.playing;
                if(this.playing){
                    event.target.innerHTML = 'Stop';
                    this.timerId = setInterval(function(){
                        var currentYear = _this.slider.value();
                        if(currentYear == _this.maxYear){ 
                            stop();
                        }
                        else{
                            _this.slider.value(currentYear + 1);
                            _this.changeYear(currentYear + 1);
                        }
                    }, 1000);
                }
                else
                    stop()
            },
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return DemographicDevelopmentView;

    }

);