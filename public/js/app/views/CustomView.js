define(['backbone'],

    function(Backbone){
        var CustomView = Backbone.View.extend({
            el: document,
            initialize: function(options) {   
              this.templateString = options.templateString;
              this.values = options.values || {};
              this.render();  
            },

            render: function() {
                this.template = _.template(this.templateString, this.values);
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
        return CustomView;

    }

);