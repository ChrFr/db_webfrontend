define(["backbone", "text!templates/demodevelop.html", "views/OptionView",  
    "views/AgeTreeView", "views/TableView", "bootstrap"],

    function(Backbone, template, OptionView, AgeTreeView, TableView){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                _.bindAll(this, 'render');
                this.render();
                //this.model.fetch({success: this.render});
            },

            events: {
                
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;    
                
                var yearSelector = this.el.querySelector("#yearSelect");
                while (yearSelector.firstChild) {
                    yearSelector.removeChild(yearSelector.firstChild);
                };
                
                new OptionView({el: yearSelector, name: 'Bitte wählen', value: -2}); 
                new OptionView({el: yearSelector, name: 'alle anzeigen', value: -1}); 
                this.collection.each(function(ageModel){                        
                    new OptionView({el: yearSelector,
                        name: ageModel.get('jahr'), 
                        value: ageModel.get('jahr')})
                });
                                
                yearSelector.onchange = function(bla) { 
                    if (bla.target.value > 0){
                        _this.renderData(bla.target.value);
                    }
                }
                /*
                    var ages = ageColl.find(function(item){
                        return item.get('jahr') == _this.year;
                    });*/
                
                return this;
            },            
            
            renderData: function(year){
                var vis = this.el.getElementsByClassName("visualization")[0];
                while (vis.firstChild) {
                    vis.removeChild(vis.firstChild);
                };
                var ageModel = this.collection.find(function(item){
                    return item.get('jahr') == year;
                });
                var width = document.getElementsByTagName('body')[0].clientWidth;
                this.agetree = new AgeTreeView({el: vis,
                                                model: ageModel,
                                                width: 0.9 * width,
                                                height: 600});
                var columns = [];
                
                var region = ageModel.get('rs');
                var title = "Bevölkerungsentwicklung " + region + " " + year;                
                
                columns.push({name: "year", description: "Alter"});
                columns.push({name: "female", description: "Anzahl weiblich"});                
                columns.push({name: "male", description: "Anzahl männlich"});
                
                var femaleAges = ageModel.get('alter_weiblich');
                var maleAges = ageModel.get('alter_maennlich');
                var data = [];
                for (var i = 0; i < femaleAges.length; i++) { 
                    data.push({
                        year: i,
                        female: femaleAges[i],
                        male: maleAges[i]
                    });
                }
                this.table = new TableView({
                    el: this.el.getElementsByClassName("table"),
                    columns: columns,
                    title: title,
                    data: data
                });
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