define(["backbone", "text!templates/demodevelop.html", "collections/RegionCollection", 
    "views/OptionView", "views/AgeTreeView", "views/TableView", "bootstrap"],

    function(Backbone, template, RegionCollection, OptionView, AgeTreeView, TableView){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                _.bindAll(this, 'render');
                var _this = this;
                this.collection.fetch({success: function(){    
                    _this.regions = new RegionCollection({progId: _this.collection.progId});
                    _this.regions.fetch({success: _this.render});
                }});
            },

            events: {
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;   
                
                var regionSelector = this.el.querySelector("#rsSelect");
                
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
                        _this.changeRegion(e.target.value);
                    }
                };
                return this;
            },            
            
            changeRegion: function(rs){
                var _this = this;
                
                this.collection.fetchDetails({rs: rs, success: function(model){  
                    var yearSelector = _this.el.querySelector("#yearSelect");
                    while (yearSelector.firstChild) {
                        yearSelector.removeChild(yearSelector.firstChild);
                    };

                    //TODO: sort years
                    _.each(model.get('data'), (function(data){  
                        new OptionView({
                            el: yearSelector,
                            name: data.jahr, 
                            value: data.jahr});
                    }));

                    yearSelector.onchange = function(e) { 
                        if (e.target.value > 0){
                            _this.renderTable(model, parseInt(e.target.value));
                        }
                    };

                    //draw first year
                    _this.renderTable(model, yearSelector.options[0].value);
                    
                    _this.renderTree(model);
                }});
            },
            
            renderTable: function(model, year){
                var rs = model.get('rs'),
                    title = "Bevölkerungsentwicklung " + rs + " " + year,
                    columns = [],
                    yearData;                
                
                
                _.each(model.get('data'), (function(data){                     
                    if(data.jahr == year) 
                        yearData = data;
                }));                
                console.log(yearData)
                
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
                    el: this.el.querySelector("#datatable"),
                    columns: columns,
                    title: title,
                    data: data
                });
            },
            
            renderTree: function(model){
                var vis = this.el.querySelector("#agetree");
                while (vis.firstChild) {
                    vis.removeChild(vis.firstChild);
                };
                var width = document.getElementsByTagName('body')[0].clientWidth;
                this.agetree = new AgeTreeView({el: vis,
                                                model: model,
                                                width: 0.9 * width,
                                                height: 600});                
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