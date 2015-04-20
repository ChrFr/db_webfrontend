
define(["backbone", "jquery", "text!templates/Table.html", "bootstraptable"],

    function(Backbone, $, template){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function(options) {       
                _.bindAll(this, 'render');
                this.columns = options.columns;
                this.data = options.data;
                this.title = options.title;
                this.render();
                //this.model.fetch({success: this.render});
            },

            events: {
                
            },

            render: function() {
                this.template = _.template(template, {title: this.title,
                    columns: this.columns});
                
                this.el.innerHTML = this.template;   
                console.log($('#table'));
                $('#table').bootstrapTable({
                    data: this.data
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