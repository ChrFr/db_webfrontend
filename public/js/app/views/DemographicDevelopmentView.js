define(["app", "backbone", "text!templates/demodevelop.html", "collections/CommunityCollection",  
    "collections/LayerCollection", "collections/DDCollection", "models/DDAggregate", "views/OptionView", 
    "views/TableView", "d3", "d3slider", "bootstrap", "views/visuals/AgeTree", 
    "views/visuals/LineChart", "views/visuals/GroupedBarChart"],

    function(app, Backbone, template, CommunityCollection, LayerCollection, 
            DDCollection, DDAggregate, OptionView, TableView, d3, d3slider){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                _.bindAll(this, 'render');
                var _this = this;
                var progId = app.get('activePrognosis');
                
                if(progId){
                    // container for all demographic developments (aggregated too)
                    // serves as cache
                    this.collection = new DDCollection({progId: progId});
                    //available comunities (base entity)
                    this.communities = new CommunityCollection();
                    //layers for community-aggregations
                    this.layers = new LayerCollection();
                    
                    // nested fetch collections and finally render (all coll.'s needed for rendering)
                    this.collection.fetch({success: function(){    
                        _this.layers.fetch({success: function(){
                            _this.communities.fetch({
                                data: {progId: progId},
                                success: _this.render
                            });                          
                        }});
                    }});
                }     
            },

            events: {
                'click .download-btn#csv': 'openCurrentYearCsvTab',
                'click .download-btn#png': 'openCurrentYearPngTab',
                'click #play': 'play',
                'click #visualizations li': 'tabChange'
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;   
                var layerSelector = this.el.querySelector("#layer-select");
                
                new OptionView({el: layerSelector, name: 'Bitte wählen', value: null});                 
                new OptionView({el: layerSelector, name: 'Gesamtgebiet', value: -2});
                new OptionView({el: layerSelector, name: 'Gemeinde', value: -1});
                
                this.layers.each(function(layer){   
                    new OptionView({
                        el: layerSelector, 
                        name: layer.get('name'), 
                        value: layer.get('id')
                    });
                });
                                
                this.communities.comparator = 'name';
                this.communities.sort();     
                
                layerSelector.onchange = function(e) { 
                    if (e.target.value !== null){
                        _this.changeLayer(e.target.value);
                    }
                };  
                
                return this;
            },     
            
            changeLayer: function(layerId){
                var _this = this;
                var progId = app.get('activePrognosis');
                var regionSelector = this.el.querySelector("#region-select"); 
                
                while (regionSelector.firstChild) 
                    regionSelector.removeChild(regionSelector.firstChild);
                
                // special case: whole area (all entities summed up) needs no region-selection
                if(layerId == -2){
                    var _this = this;
                    regionSelector.style.display = "none";      
                    this.el.querySelector("#region-label").style.display = "none";
                    var allRegions = [];
                    this.communities.each(function(region){   
                        allRegions.push(region.get('rs'));
                    });
                    this.renderRegion(this.getAggregateRegion(allRegions, 'Gesamtgebiet'));
                }
                                
                // specific layer
                else if(layerId > 0){
                    
                    this.layers.get(layerId).fetch({
                        data: {progId: progId}, success: function(layer){
                            _this.el.querySelector("#region-label").innerHTML = layer.get('name');
                            regionSelector.style.display = "block";                
                            _this.el.querySelector("#region-label").style.display = "block";
                            new OptionView({el: regionSelector, name: 'Bitte wählen', value: null}); 
                            
                            var rsArr = [];
                            var i = 0;
                            layer.get('regionen').forEach(function(region){ 
                                new OptionView({
                                    el: regionSelector,
                                    name: region.name, 
                                    value: i
                                });
                                rsArr.push(region.rs);
                                i++;
                            });

                            regionSelector.onchange = function(e) { 
                                if (e.target.value !== null){
                                    var rs = rsArr[e.target.value];
                                    var name = e.target.selectedOptions[0].innerHTML;
                                    //id suffix (there may be other layers with same names)
                                    name += '_' + layerId;
                                    _this.renderRegion(_this.getAggregateRegion(rs, name));
                                }
                            };  
                        }                        
                    });
                                            
                }
                
                // basic layer gemeinden
                else if(layerId == -1){
                    _this.el.querySelector("#region-label").innerHTML = 'Gemeinde';
                    regionSelector.style.display = "block";                
                    this.el.querySelector("#region-label").style.display = "block";

                    new OptionView({el: regionSelector, name: 'Bitte wählen', value: -2}); 
                    this.communities.each(function(community){                        
                        new OptionView({
                            el: regionSelector,
                            name: community.get('name'), 
                            value: community.get('rs')
                        });
                    });

                    regionSelector.onchange = function(e) { 
                        if (e.target.value > 0){
                            var name = e.target.selectedOptions[0].innerHTML;
                            var model = _this.collection.get(e.target.value);
                            model.set('name', name);
                            _this.renderRegion(model);
                        }
                    };  
                }
            },
            
            //get an aggregated region from the collection or create it (as cache)
            getAggregateRegion: function(rs, name){
                var region = this.collection.find(function(model) { 
                    return model.get('name') == name; });
                if(!region){
                    region = new DDAggregate({
                        name: name,
                        progId: this.collection.progId, 
                        rs: rs
                    });   
                    this.collection.add(region);
                };
                return region;
            },
            
            renderRegion: function(model){
                var _this = this;
                this.stop();                
                model.fetch({success: function(){  
                    var data = model.get('data')[0];
                    var maxYear = model.get('maxYear'),
                        minYear = model.get('minYear'),
                        yearData,
                        data = model.get('data');
                    _this.currentModel = model;
                    
                    //draw first year if not assigned yet
                    if(!_this.currentYear){
                        yearData = data[0];
                        _this.currentYear = minYear;
                    }
                    //keep year of previous region, if new region has data for it
                    else{
                        var found = false;
                        _.each(model.get('data'), (function(yd){                     
                            if(yd.jahr == _this.currentYear) {
                                found = true;
                                yearData = yd;
                            }
                        }));
                        if(!found){
                            _this.currentYear = minYear;
                            yearData = data[0];
                        }
                    }   
                    // UPDATE SLIDERS    
                    var tabContent = _this.el.querySelector(".tab-content");                  
                    var width = parseInt(tabContent.offsetWidth) - 90;
                    var sliderDiv = _this.el.querySelector("#year-slider");                    
                    while (sliderDiv.firstChild) 
                        sliderDiv.removeChild(sliderDiv.firstChild);
                    //var btnWidth = parseInt(_this.el.querySelector("#play").clientWidth; returns 0, why?
                    sliderDiv.style.width = width - 30 + "px";  
                    var yearStep = Math.floor((maxYear - minYear) / 4);
                      
                    _this.yearSlider = d3slider()
                        .axis(
                            d3.svg.axis().orient("down")
                            //4 ticks
                            .tickValues([minYear, minYear + yearStep, minYear + yearStep * 2, minYear + yearStep * 3, maxYear])
                            .tickFormat(d3.format("d"))
                            .ticks(maxYear - minYear)
                            .tickSize(10)
                        )
                        .min(minYear)
                        .max(maxYear)
                        .step(1)
                        .margin(20)
                        .value(_this.currentYear);              
                          
                    d3.select('#year-slider').call(_this.yearSlider);
                    
                    _this.yearSlider.on("slide", function(evt, value) {
                        evt.stopPropagation();
                        _this.changeYear(value);
                    });
                    
                    sliderDiv = _this.el.querySelector("#scale-slider"); 
                    var checked = _this.el.querySelector("#fix-scale").checked;
                    while (sliderDiv.firstChild) 
                        sliderDiv.removeChild(sliderDiv.firstChild);
                    
                    //var minScale = Math.ceil(model.get('maxNumber'));
                    var minScale = 1;
                    if(!_this.xScale || !checked){// || minScale > _this.xScale) 
                        _this.xScale = model.get('maxNumber');  
                        _this.xScale *= 1.3;
                        _this.xScale = Math.ceil(_this.xScale);
                        _this.el.querySelector('#current-scale').innerHTML = _this.xScale;
                    }
                        
                    var maxScale = 10000;
                    
                    var xScale = d3.scale.log()
                            .domain([minScale, maxScale]);
                        
                    var scaleSlider = d3slider().scale(xScale)
                                                .value(_this.xScale)
                                                .axis(d3.svg.axis().orient("right").tickFormat(d3.format("")).ticks(10))
                                                .orientation("vertical");
                                
                    d3.select('#scale-slider').call(scaleSlider);
                    
                    scaleSlider.on("slide", function(evt, value) {
                        evt.stopPropagation();
                        _this.xScale = Math.ceil(value);
                        _this.el.querySelector('#current-scale').innerHTML = _this.xScale;
                        _this.renderTree();
                    });
                    
                    //visualizations
                    _this.renderTree(yearData);
                    _this.renderDevelopment(data);
                    _this.renderBarChart(data);
                    
                    //data tables
                    _this.renderAgeGroup(yearData);
                    _this.renderAgeTable(yearData);
                    _this.renderRawData(data);
                }});
            },
            
            renderTree: function(data){
                
                var vis = this.el.querySelector("#agetree"),
                    title = this.getRegionName();
            
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 70;
                //width / height ratio is 1 : 1.2
                var height = width * 0.8;
                this.ageTree = new AgeTree({
                    el: vis,
                    data: data, 
                    title: title,
                    width: width, 
                    height: height,
                    maxY: this.currentModel.get('maxAge'),
                    maxX: this.xScale
                });
                this.ageTree.render();     
            },       
            
            renderDevelopment: function(data){
                var total = [],
                    years = [],
                    title = this.getRegionName();
            
                // ABSOLUTE DATA
                
                _.each(data, function(d){       
                    total.push(d.sumFemale + d.sumMale);
                    years.push(d.jahr);
                });
                
                var dataAbs = { label: "",
                                x: years,
                                y: total
                              };       
                              
                var vis = this.el.querySelector("#absolute");
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 30;
                var height = width * 0.5;
                this.absoluteChart = new LineChart({
                    el: vis,
                    data: [dataAbs], 
                    width: width, 
                    height: height,
                    title: title + " - Bevölkerungsentwicklung absolut",
                    xlabel: "Jahr",
                    ylabel: "Gesamtbevölkerung in absoluten Zahlen",                    
                    minY: 0
                });
                this.absoluteChart.render();    
                
                // RELATIVE DATA (to first year)
                
                // clone data (prevent conflicts in drawing dots in both line charts)
                var dataRel = JSON.parse(JSON.stringify(dataAbs))
                
                var relVal = dataRel.y[0];
                
                for(var i = 0; i < dataRel.y.length; i++){
                    dataRel.y[i] *= 100 / relVal;
                    dataRel.y[i] = Math.round(dataRel.y[i] * 100) / 100
                };
                              
                vis = this.el.querySelector("#relative");
                
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);     
                
                this.relativeChart = new LineChart({
                    el: vis,
                    data: [dataRel], 
                    width: width, 
                    height: height,
                    title: title + " - Bevölkerungsentwicklung relativ",
                    xlabel: "Jahr",
                    ylabel: "Gesamtbevölkerung in Prozent (relativ zu " + dataRel.x[0] + ")"
                });
                
                this.relativeChart.render();  
            },
            
            renderBarChart: function(data){
                var dataSets = [],
                    title = this.getRegionName();
                
                _.each(data, function(d){                      
                    var values = [
                        d.geburten - d.tote,
                        d.zuzug - d.fortzug
                    ];
                    values.push(values[0] + values[1]);
                    
                    var dataSet = { label: d.jahr,
                                    values: values };   
                    dataSets.push(dataSet);            
                });
                    
                              
                var vis = this.el.querySelector("#barchart");
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 70;
                var height = width * 0.8;
                this.barChart = new GroupedBarChart({
                    el: vis,
                    data: dataSets, 
                    width: width, 
                    height: height,
                    title: title + " - Bevölkerungsentwicklung",
                    xlabel: "Jahr",
                    groupLabels: ["A: Geburten - Sterbefälle", "B: Zuwanderung - Abwanderung", "gesamt: A + B"],
                    ylabel: "Zuwachs",    
                    yNegativeLabel: "Abnahme"
                });
                this.barChart.render();    
            },
            
            renderAgeTable: function(yearData){  
                var columns = [],
                    title = this.getRegionName();

                if(yearData.jahr == this.currentModel.get('minYear'))
                    title += ' - Basisjahr';
                else
                    title += ' - Prognose';
                
                // adapt age data to build table (arrays to single entries)
                columns.push({name: "age", description: "Alter"});
                columns.push({name: "female", description: "Anzahl weiblich"});                
                columns.push({name: "male", description: "Anzahl männlich"});  
                
                var femaleAges = yearData.alter_weiblich;
                var maleAges = yearData.alter_maennlich;
                
                var data = [];
                for (var i = 0; i < femaleAges.length; i++) { 
                    data.push({
                        age: i,
                        female: femaleAges[i],
                        male: maleAges[i]
                    });
                }
                
                //get state of prev. table to apply on new one
                var state = (this.ageTable) ? this.ageTable.getState(): {};
                
                this.ageTable = new TableView({
                    el: this.el.querySelector("#age-data"),
                    columns: columns,
                    title: title + " " + yearData.jahr,
                    data: data,
                    dataHeight: 400,
                    pagination: false,
                    startPage: state.page,
                    pageSize: state.size,
                    highlight: true
                });
            },
            
            renderRawData: function(data){  
                var columns = [];
                Object.keys(data[0]).forEach(function(i){
                    columns.push({name: i, description: i});
                });
                
                this.rawTable = new TableView({
                    el: this.el.querySelector("#raw-data"),
                    columns: columns,
                    data: data,
                    title: data[0].jahr + " - " + data[data.length -1].jahr,
                    highlight: true
                });
            },
            
            renderAgeGroup: function(yearData){
                
                var columns = [],
                    title = this.getRegionName();

                if(yearData.jahr == this.currentModel.get('minYear'))
                    title += ' - Basisjahr';
                else
                    title += ' - Prognose';                
                
                columns.push({name: "ageGroup", description: "Altersgruppe"});
                columns.push({name: "sumAll", description: "Anzahl"});
                columns.push({name: "percentage", description: "gesamt"});
                //columns.push({name: "perMale", description: "männlich"});
                //columns.push({name: "perFemale", description: "weiblich"});
                                
                var femaleAges = yearData.alter_weiblich;
                var maleAges = yearData.alter_maennlich;
                
                var cat2 = 20;
                var cat3 = 65;
                
                var cat1Fem, cat2Fem, cat3Fem, cat1Male, cat2Male, cat3Male;
                cat1Fem = cat2Fem = cat3Fem = cat1Male = cat2Male = cat3Male = 0;
                
                for(var i = 0; i < femaleAges.length; i++){
                    if(i < cat2)
                        cat1Fem += Math.round(femaleAges[i]);
                    else if(i < cat3)
                        cat2Fem += Math.round(femaleAges[i]);
                    else
                        cat3Fem += Math.round(femaleAges[i]);
                }
                
                for(var i = 0; i < maleAges.length; i++){
                    if(i < cat2)
                        cat1Male += Math.round(maleAges[i]);
                    else if(i < cat3)
                        cat2Male += Math.round(maleAges[i]);
                    else
                        cat3Male += Math.round(maleAges[i]);
                }
                
                var ageGroup = ["0 - " + cat2, cat2 + " - " + cat3, cat3 + "+", "alle"];
                var sumAll = [cat1Fem + cat1Male, cat2Fem + cat2Male, cat3Fem + cat3Male];
                var sum = d3.sum(sumAll);
                sumAll.push(sum);
                
                var percentage = [];                
                for(var i = 0; i < sumAll.length; i++){
                    percentage.push(Math.round(sumAll[i] * 100 / sum));
                }
                
                var data = [];                
                for(var i = 0; i < ageGroup.length; i++){
                    data.push({
                        ageGroup: ageGroup[i],
                        sumAll: sumAll[i],
                        percentage: percentage[i] + '%'
                    });
                }
                this.ageGroupTable = new TableView({
                    el: this.el.querySelector("#agegroup-data"),
                    columns: columns,
                    data: data,
                    title: title + " " + yearData.jahr,
                    highlight: true
                });
            },
            
            openAllYearsCsvTab: function() {
                var win = window.open(this.currentModel.csvUrl(), '_blank');
                win.focus();
            },
            
            openCurrentYearCsvTab: function() {
                var win = window.open(this.currentModel.csvUrl(this.currentYear), '_blank');
                win.focus();
            },
            
            openCurrentYearPngTab: function() {
                var xhr = new XMLHttpRequest;

                xhr.open( "GET", this.currentModel.pngUrl(this.currentYear, this.xScale) ); //I had test.pdf this on my local server

                xhr.setRequestHeader("id", app.session.get('user').id );
                xhr.setRequestHeader("token", app.session.get('token'));
                xhr.send(null);
            },
            
            changeYear: function(year){ 
                this.currentYear = year;          
                var data = this.currentModel.get('data');   
                var idx = data.length - 1 - (this.currentModel.get('maxYear') - year);
                var yearData = data[idx]; 
                this.ageTree.changeData(yearData);
                this.renderAgeGroup(yearData); 
                this.renderAgeTable(yearData); 
            },
            
            /*
             * if tab changed, show specific data and controls
             */
            tabChange: function(event){
                this.stop();              
                if(event.target.getAttribute('href') === "#agetree-tab"){
                    // age tree can render multiple years -> render data of current one  
                    this.changeYear(this.currentYear);
                    // age tree needs slider to change years                    
                    this.el.querySelector("#slide-controls").style.display = 'block';
                }
                //the others render summary over years -> render data of first year (thats the year the predictions base on)
                else{
                    var yearData = this.currentModel.get('data')[0];
                    this.renderAgeTable(yearData);
                    this.renderAgeGroup(yearData);  
                    
                    //no need for changing years
                    this.el.querySelector("#slide-controls").style.display = 'none';
                }
                    
            },
            
            play: function(event){
                var _this = this;  
                if(!this.timerId){
                    event.target.innerHTML = 'Stop';
                    var maxYear = _this.currentModel.get('maxYear');
                    var minYear = _this.currentModel.get('minYear');
                    // slider reached end? -> reset
                    if(_this.yearSlider.value() >= maxYear){
                        _this.yearSlider.value(minYear);
                        _this.changeYear(minYear);
                    }
                    this.timerId = setInterval(function(){
                        var currentYear = _this.yearSlider.value();
                        if(currentYear == maxYear){ 
                            _this.stop();
                        }
                        else{
                            _this.yearSlider.value(currentYear + 1);
                            _this.changeYear(currentYear + 1);
                        }
                    }, 1000);
                }
                else
                    this.stop();
            },
            
            stop: function(){               
                this.el.querySelector("#play").innerHTML = 'Play';
                if(this.timerId){
                    clearInterval(this.timerId);
                    this.timerId = null;
                }
            },
            
            // get name of region and remove suffix
            getRegionName: function(){                
                var name = this.currentModel.get('name'); 
                var idx = name.indexOf('_');
                if(idx > 0)
                    name = name.substring(0, idx);
                return name;
            },
            
            //remove the view
            close: function () {
                this.stop();
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return DemographicDevelopmentView;

    }

);