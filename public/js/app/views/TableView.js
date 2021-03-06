/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["backbone", "jquery", "text!templates/table.html", "bootstraptable", "tableexport", 'views/misc'],
    function(Backbone, $, template){
      /*
       * renders a table with given data
       * 
       * @param options.el  the parent container of the rendered table
       * 
       * @see table
       */
      var TableView = Backbone.View.extend({
        // The DOM Element associated with this view
        el: document,
        // View constructor
        initialize: function(options){
          // workaround for IE11
          if (!String.prototype.endsWith) {
            String.prototype.endsWith = function(searchString, position) {
                var subjectString = this.toString();
                if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                  position = subjectString.length;
                }
                position -= searchString.length;
                var lastIndex = subjectString.indexOf(searchString, position);
                return lastIndex !== -1 && lastIndex === position;
            };
          }
          
          _.bindAll(this, 'render');
          this.columns = options.columns;
          this.data = options.data;
          this.title = options.title || '';
          this.selectable = options.selectable;
          this.pagination = options.pagination;
          this.dataHeight = options.dataHeight;
          this.startPage = options.startPage || 1;
          this.pageSize = options.pageSize || 20;
          this.clickable = options.highlight;
          this.sortBy = options.sortBy;
          this.render();
          //this.model.fetch({success: this.render});
        },
        
        events: {
        },
        
        render: function(){
          this.template = _.template(template, {title: this.title,
            columns: this.columns});
          this.el.innerHTML = this.template;
          this.table = $(this.el).find('#table');
          if(this.selectable){
            this.table.attr('data-click-to-select', 'true');
            /*table.attr('data-single-select', 'true');
             this.table.on('click','tr',function(e){
             })*/
          }
          else
            this.table.find('#checkboxes').attr('data-visible', 'false');

          if(this.pagination){
            this.table.attr('data-pagination', 'true');
            this.table.attr('data-page-number', this.startPage);
            this.table.attr('data-page-size', this.pageSize);
          }

          if(this.dataHeight)
            this.table.attr('data-height', this.dataHeight);

          if(this.sortBy)
            this.table.attr('data-sort-name', this.sortBy);

          this.table.bootstrapTable({
            data: this.data
          });

          //row clicked -> highlight
          if(this.clickable)
            this.table.on('click', 'tr', function(e){
              if(!($(this).hasClass('highlight'))){
                $(this).addClass('highlight');
                $(this).siblings().removeClass('highlight');
              }
              else
                $(this).removeClass('highlight');

            });

          this.table.find('td').css('max-width', '200px');
          this.table.find('td').css('overflow', 'auto');

        },
        
        getState: function(){
          var state = {};
          state.page = $(this.el).find('.page-number.active > a').text();
          state.size = $(this.el).find('.page-size').text();
          return state;
        },
        
        getSelections: function(){
          return this.table.bootstrapTable('getSelections');
        },
        
        save: function(filename){
          if(!filename)
            filename = this.title;
          // tableExport adds the extension automatically
          else if(filename.endsWith('.csv'))
            filename = filename.slice(0, -4);
          this.table.tableExport({
            type: 'csv',
            fileName: filename,
            csvSeparator: ';'});
        },
        
        //remove the view
        close: function(){
          clearElement(this.table);
          this.unbind(); // Unbind all local event bindings
          this.remove(); // Remove view from DOM
        }

      });

      // Returns the View class
      return TableView;

    }

);