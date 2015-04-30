
define(["backbone", "jquery", "text!templates/table.html", "bootstraptable"],

    function(Backbone, $, template){
        var DemographicDevelopmentView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function(options) {       
                _.bindAll(this, 'render');
                this.columns = options.columns;
                this.data = options.data;
                this.title = options.title || '';
                this.selectable = options.selectable;
                this.render();
                //this.model.fetch({success: this.render});
            },

            events: {
                
            },

            render: function() {
                this.template = _.template(template, {title: this.title,
                    columns: this.columns});
                this.el.innerHTML = this.template;  
                var table = $(this.el).find('#table');
                if(this.selectable){
                    table.attr('data-click-to-select', 'true');
                    //table.attr('data-single-select', 'true');
                    table.on('click','tr',function(e){
                        console.log(table.bootstrapTable('getSelections'));
                     })
                }
                else                    
                    table.find('#checkboxes').attr('data-visible', 'false');
                table.bootstrapTable({
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