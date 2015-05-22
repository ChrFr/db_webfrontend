define(["app", "backbone", "text!templates/demodevelop.html", "collections/RegionCollection",  
    "collections/DemographicDevelopmentCollection",  "views/OptionView", 
    "views/AgeTreeView", "views/TableView", "bootstrap"],

    function(app, Backbone, template, RegionCollection, DemographicDevelopmentCollection,
            OptionView, AgeTreeView, TableView){
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
            },

            events: {
                'click .download-btn#csv': 'openCurrentYearCsvTab',
                'click .download-btn#png': 'openCurrentYearPngTab'
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
                    var yearSelector = _this.el.querySelector("#yearSelect");
                    while (yearSelector.firstChild) {
                        yearSelector.removeChild(yearSelector.firstChild);
                    };

                    //TODO: sort years
                    _.each(_this.currentModel.get('data'), (function(data){  
                        new OptionView({
                            el: yearSelector,
                            name: data.jahr, 
                            value: data.jahr});
                    }));

                    yearSelector.onchange = function(e) { 
                        if (e.target.value > 0){
                            _this.renderTable(_this.currentModel, parseInt(e.target.value));
                        }
                    };

                    //draw first year and render it
                    _this.currentModel.set('currentYear', yearSelector.options[0].value);
                    
                    _this.renderTable();
                    _this.renderTree();
                }});
            },
            
            renderTable: function(){
                var year = this.currentModel.get('currentYear');
                
                var rs = this.currentModel.get('rs'),
                    title = "Bevölkerungsentwicklung " + rs + " " + year,
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
            
            renderTree: function(){
                var vis = this.el.querySelector("#agetree");
                while (vis.firstChild) {
                    vis.removeChild(vis.firstChild);
                };
                var tabContent = this.el.querySelector(".tab-content");                
                var width = parseInt(tabContent.offsetWidth) - 20;
                //width / height ratio is 1 : 1.2
                var height = width * 1.2;
                this.agetree = new AgeTreeView({
                    el: vis,
                    model: this.currentModel,
                    width: width,
                    height: height
                });                
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