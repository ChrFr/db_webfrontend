
define(["backbone", "text!templates/test.html", "models/AgeModel", 
    "collections/AgeCollection", "collections/RegionCollection", 
    "views/OptionView", "views/DemographicDevelopmentView"],

    function(Backbone, template, AgeModel, AgeCollection, RegionCollection, 
            OptionView, DemographicDevelopmentView){
        var HomeView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {         
                // Calls the view's render method
                this.render();  
                this.rs = '';
                this.year = 0;
            },

            events: {
                
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;   
                
                var regions = new RegionCollection();
                var regionSelector = this.el.querySelector("#rsSelect");
                
                regions.fetch({success: function(){
                    new OptionView({el: regionSelector, name: 'Bitte wählen', value: null}); 
                    regions.each(function(region){
                        new OptionView({el: regionSelector,
                            name: region.get('name'), 
                            value: region.get('rs')})
                    });
                    regionSelector.onchange = function(bla) {
                        if (bla.target.value !== null){
                            _this.rs = bla.target.value;       
                            _this.renderYears();
                        }
                    }
                }});  
                                           
                return this;
            },       
            
            renderYears: function(){
                var _this = this;
                var ageColl = new AgeCollection({rs: this.rs});
                this.ageColl = ageColl;
                var yearSelector = this.el.querySelector("#yearSelect");
                while (yearSelector.firstChild) {
                    yearSelector.removeChild(yearSelector.firstChild);
                };
                ageColl.fetch({success: function(){
                    new OptionView({el: yearSelector, name: 'Bitte wählen', value: -2}); 
                    new OptionView({el: yearSelector, name: 'alle anzeigen', value: -1}); 
                    ageColl.each(function(ageModel){                        
                        new OptionView({el: yearSelector,
                            name: ageModel.get('jahr'), 
                            value: ageModel.get('jahr')})
                    });
                    yearSelector.onchange = function(bla) { 
                        if (bla.target.value > 0){
                            _this.year = bla.target.value;       
                            _this.renderData();
                        }
                    }
                }});
            },
            
            renderData: function(){          
                var _this = this;
                var ages = this.ageColl.find(function(item){
                    return item.get('jahr') == _this.year;
                });
                var dataView = this.el.querySelector("#dataView");
                this.dataView = new DemographicDevelopmentView({
                    el: dataView,
                    model: ages});     
            },
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return HomeView;

    }

);