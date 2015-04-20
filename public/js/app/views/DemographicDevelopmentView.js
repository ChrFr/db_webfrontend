
define(["backbone", "text!templates/DemographicDevelopment.html",  "views/AgeTreeView"],

    function(Backbone, template, AgeTreeView){
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