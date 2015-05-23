
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
                this.pagination = options.pagination;
                this.dataHeight = options.dataHeight || 400;
                this.startPage = options.startPage || 1;
                this.pageSize = options.pageSize || 20;
                this.render();
                //this.model.fetch({success: this.render});
            },

            events: {
                
            },

            render: function() {
                this.template = _.template(template, {title: this.title,
                    columns: this.columns});
                this.el.innerHTML = this.template;  
                this.table = $(this.el).find('#table');
                if(this.selectable){
                    this.table.attr('data-click-to-select', 'true');
                    //table.attr('data-single-select', 'true');
                    this.table.on('click','tr',function(e){
                        console.log(table.bootstrapTable('getSelections'));
                     })
                }
                else                    
                    this.table.find('#checkboxes').attr('data-visible', 'false');
                
                if (this.pagination){
                    this.table.attr('data-pagination', 'true');
                    this.table.attr('data-height', this.dataHeight);
                    this.table.attr('data-page-number', this.startPage);                    
                    this.table.attr('data-page-size', this.pageSize);
                }
                this.table.bootstrapTable({
                    data: this.data
                });
            },   
            
            getState: function (){
                var state = {};
                state.page = $(this.el).find('.page-number.active > a').text();
                state.size = $(this.el).find('.page-size').text();
                return state;
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