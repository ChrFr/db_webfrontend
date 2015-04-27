
define(["backbone", "text!templates/DemographicDevelopment.html",  
    "views/AgeTreeView", "views/TableView", "bootstrap"],

    function(Backbone, template, AgeTreeView, TableView){
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
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;    
                var width = document.getElementsByTagName('body')[0].clientWidth;
                this.agetree = new AgeTreeView({el: this.el.getElementsByClassName("visualization"),
                                                model: this.model,
                                                width: 0.9 * width,
                                                height: 600});
                var columns = [];
                
                var region = this.model.get('rs');
                var year = this.model.get('jahr');
                var title = "Bevölkerungsentwicklung " + region + " " + year;                
                
                columns.push({name: "year", description: "Jahr"});
                columns.push({name: "female", description: "Anzahl weiblich"});                
                columns.push({name: "male", description: "Anzahl männlich"});
                
                var femaleAges = this.model.get('alter_weiblich');
                var maleAges = this.model.get('alter_maennlich');
                var data = [];
                for (var i = 0; i < femaleAges.length; i++) { 
                    data.push({
                        year: i,
                        female: femaleAges[i],
                        male: maleAges[i]
                    });
                }
                this.table = new TableView({el: this.el.getElementsByClassName("table"),
                                            columns: columns,
                                            title: title,
                                            data: data
                                        });
                return this;
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