
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
                            _this.renderData();
                        }
                    }
                }});  
                                           
                return this;
            },       
            
            renderData: function(){
                var _this = this;
                var ageColl = new AgeCollection({rs: this.rs});
                ageColl.fetch({success: function(){
                    var dataView = _this.el.querySelector("#dataView");
                    _this.dataView = new DemographicDevelopmentView({
                        el: dataView,
                        collection: ageColl});
                }});
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