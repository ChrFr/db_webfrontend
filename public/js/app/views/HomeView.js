
define(["backbone", "text!templates/home.html"],

    function(Backbone, template){
        var HomeView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {         
                // Calls the view's render method
                this.render();  
            },

            events: {
            },

            render: function() {
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;     
                return this;
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