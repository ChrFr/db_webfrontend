define(["app", "backbone", "text!templates/demodevelop.html", "collections/RegionCollection",  
    "collections/DDCollection", "models/DDAggregate", "views/OptionView", 
    "views/TableView", "d3", "d3slider", "bootstrap", "views/visuals/AgeTree", 
    "views/visuals/LineChart", "views/visuals/GroupedBarChart"],

    function(app, Backbone, template, RegionCollection, DDCollection, DDAggregate,
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
                    this.collection = new DDCollection({progId: progId});
                    this.collection.fetch({success: function(){    
                        _this.regions = new RegionCollection();
                        _this.regions.fetch({data: {progId: progId},
                                             success: _this.render});
                    }});
                }     
            },

            events: {
                'click .download-btn#csv': 'openCurrentYearCsvTab',
                'click .download-btn#png': 'openCurrentYearPngTab',
                'click #play': 'play'
            },

            render: function() {
                var _this = this;
                this.regions.comparator = 'name';
                this.regions.sort();
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;   
                var layerSelector = this.el.querySelector("#layer-select");
                
                new OptionView({el: layerSelector, name: 'Bitte wählen', value: null});                 
                new OptionView({el: layerSelector, name: 'Gesamtgebiet', value: "gesamt"});             
                new OptionView({el: layerSelector, name: 'Landkreise', value: "landkreise"});          
                new OptionView({el: layerSelector, name: 'Gemeinden', value: "gemeinden"});
                
                layerSelector.onchange = function(e) { 
                    if (e.target.value){
                        _this.changeLayer(e.target.value);
                    }
                };  
                
                return this;
            },     
            
            changeLayer: function(region){
                var _this = this;
                
                if(region === "gesamt"){
                    var m = this.collection.find(function(model) { return model.get('name') == 'Gesamtgebiet'; });
                    if(!m){
                        var allRegions = [];
                        this.regions.each(function(region){   
                            allRegions.push(region.get('rs'));
                        });
                        m = new DDAggregate({progId: this.collection.progId, rs: allRegions});
                        
                    };
                    this.renderModel(m);
                }
                else{
                    var regionSelector = this.el.querySelector("#region-select");

                    regionSelector.style.display = "block";                
                    this.el.querySelector("#region-label").style.display = "block";

                    new OptionView({el: regionSelector, name: 'Bitte wählen', value: -2}); 
                    this.regions.each(function(region){                        
                        new OptionView({
                            el: regionSelector,
                            name: region.get('name'), 
                            value: region.get('rs')
                        });
                    });

                    regionSelector.onchange = function(e) { 
                        if (e.target.value > 0){
                            var model = _this.collection.get(e.target.value);
                            _this.renderModel(model);
                        }
                    };  
                }
            },
            
            renderModel: function(model){
                var _this = this;
                this.stop();                
                model.fetch({success: function(){  
                    var maxYear = model.get('maxYear');
                    var minYear = model.get('minYear');
                    _this.currentModel = model;
                    
                    //draw first year if not assigned yet
                    if(!_this.currentYear){
                        _this.yearData = _this.currentModel.get('data')[0];
                        _this.currentYear = minYear;
                    }
                    //keep year of previous region, if new region has data for it
                    else{
                        var found = false;
                        _.each(_this.currentModel.get('data'), (function(data){                     
                            if(data.jahr == _this.currentYear) {
                                found = true;
                                _this.yearData = data;
                            }
                        }));
                        if(!found){
                            _this.currentYear = minYear;
                            _this.yearData = this.currentModel.get('data')[0];
                        }
                    }   

                    // UPDATE SLIDERS    
                    var tabContent = _this.el.querySelector(".tab-content");                  
                    var width = parseInt(tabContent.offsetWidth) - 90;
                    _this.el.querySelector("#slide-controls").style.display = 'block';
                    var sliderDiv = _this.el.querySelector("#year-slider");                    
                    while (sliderDiv.firstChild) 
                        sliderDiv.removeChild(sliderDiv.firstChild);
                    
                    sliderDiv.style.width = width + "px";  
                    var yearStep = Math.floor((maxYear - minYear) / 4);
                      
                    _this.yearSlider = d3slider()
                        .axis(
                            d3.svg.axis().orient("down")
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
                    var minScale = 10;
                    if(!_this.xScale || !checked){// || minScale > _this.xScale) 
                        _this.xScale = Math.ceil(model.get('maxNumber'));  
                        _this.xScale *= 1.3;
                    }
                        
                    var maxScale = 1000;
                    
                    var scaleSlider = d3slider().value(maxScale - _this.xScale + minScale).orientation("vertical")
				.min(minScale).max(maxScale).step(10)
				.axis( d3.svg.axis().orient("right")
                                        .tickValues([minScale, maxScale/4, maxScale/2, maxScale*3/4 ,maxScale])
					.tickFormat(d3.format(""))
					);
                                
                    d3.select('#scale-slider').call(scaleSlider);
                    
                    scaleSlider.on("slide", function(evt, value) {
                        evt.stopPropagation();
                        _this.xScale = maxScale - value + minScale;
                        _this.renderTree();
                    });
                    
                    _this.renderDataTable();
                    _this.renderTree();
                    _this.renderDevelopment();
                    _this.renderAgeGroup();
                    _this.renderBarChart();
                }});
            },
            
            renderDataTable: function(){
                
                var title = this.currentYear,
                    columns = [];                   
                
                columns.push({name: "year", description: "Alter"});
                columns.push({name: "female", description: "Anzahl weiblich"});                
                columns.push({name: "male", description: "Anzahl männlich"});
                
                var femaleAges = this.yearData.alter_weiblich;
                var maleAges = this.yearData.alter_maennlich;
                
                var data = [];
                for (var i = 0; i < femaleAges.length; i++) { 
                    data.push({
                        year: i,
                        female: femaleAges[i],
                        male: maleAges[i]
                    });
                }
                
                //get state of prev. table to apply on new one
                var state = (this.table) ? this.table.getState(): {};
                
                this.table = new TableView({
                    el: this.el.querySelector("#prognosis-data"),
                    columns: columns,
                    title: title,
                    data: data,
                    dataHeight: 400,
                    pagination: false,
                    startPage: state.page,
                    pageSize: state.size,
                    highlight: true
                });
            },
            
            renderTree: function(){
                
                var vis = this.el.querySelector("#agetree");
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 70;
                //width / height ratio is 1 : 1.2
                var height = width * 0.8;
                this.ageTree = new AgeTree({
                    el: vis,
                    data: this.yearData, 
                    width: width, 
                    height: height,
                    maxY: this.currentModel.get('maxAge'),
                    maxX: this.xScale
                });
                this.ageTree.render();     
            },       
            
            renderDevelopment: function(){
                var data = this.currentModel.get('data'),
                    total = [],
                    years = [];
            
                // ABSOLUTE DATA
                
                _.each(data, function(d){       
                    total.push(d.sumFemale + d.sumMale);
                    years.push(d.jahr);
                });
                
                var dataSet = { label: "",
                                x: years,
                                y: total
                              };       
                              
                var vis = this.el.querySelector("#absolute");
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);
                
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 70;
                var height = width * 0.5;
                this.absoluteChart = new LineChart({
                    el: vis,
                    data: [dataSet], 
                    width: width, 
                    height: height,
                    title: "Bevölkerungsentwicklung absolut",
                    xlabel: "Jahr",
                    ylabel: "Gesamtbevölkerung in absoluten Zahlen",                    
                    minY: 0
                });
                this.absoluteChart.render();    
                
                // RELATIVE DATA (to first year)
                
                var relVal = dataSet.y[0];
                
                for(var i = 0; i < dataSet.y.length; i++){
                    dataSet.y[i] *= 100 / relVal;
                };
                              
                vis = this.el.querySelector("#relative");
                
                while (vis.firstChild) 
                    vis.removeChild(vis.firstChild);     
                
                this.relativeChart = new LineChart({
                    el: vis,
                    data: [dataSet], 
                    width: width, 
                    height: height,
                    title: "Bevölkerungsentwicklung relativ",
                    xlabel: "Jahr",
                    ylabel: "Gesamtbevölkerung in Prozent (relativ zu " + dataSet.x[0] + ")"
                });
                
                this.relativeChart.render();  
            },
            
            renderBarChart: function(){
                var data = this.currentModel.get('data'),
                    dataSets = [];
                
                _.each(data, function(d){                      
                    var values = [
                        d.geburten - d.tote,
                        d.zuzug - d.fortzug,
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
                    title: "Bevölkerungsentwicklung",
                    xlabel: "Jahr",
                    groupLabels: ["A: Geburten - Sterbefälle", "B: Zuwanderung - Abwanderung", "gesamt: A + B"],
                    ylabel: "Zuwachs",    
                    yNegativeLabel: "Abnahme"
                });
                this.barChart.render();    
            },
            
            renderAgeGroup: function(){
                var columns = [];
                
                columns.push({name: "ageGroup", description: "Altersgruppe"});
                columns.push({name: "sumAll", description: "Anzahl"});
                columns.push({name: "percentage", description: "gesamt"});
                //columns.push({name: "perMale", description: "männlich"});
                //columns.push({name: "perFemale", description: "weiblich"});
                                
                var femaleAges = this.yearData.alter_weiblich;
                var maleAges = this.yearData.alter_maennlich;
                
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
                    title: this.currentYear,
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
                var win = window.open(this.currentModel.pngUrl(this.currentYear, this.xScale), '_blank');
                win.focus();
            },
            
            changeYear: function(year){ 
                this.currentYear = year;          
                var data = this.currentModel.get('data');          
                this.yearData = data[data.length - 1 - (this.currentModel.get('maxYear') - year)]; 
                this.renderDataTable();
                this.renderAgeGroup();  
                this.ageTree.changeData(this.yearData);
            },
            
            play: function(event){
                var _this = this;  
                if(!this.timerId){
                    event.target.innerHTML = 'Stop';
                    this.timerId = setInterval(function(){
                        var currentYear = _this.yearSlider.value();
                        if(currentYear == _this.currentModel.get('maxYear')){ 
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