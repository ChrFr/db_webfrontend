define(['app', 'jquery', 'backbone', 'text!templates/hhdevelop.html'],

    function(app, $, Backbone, template){
      /** 
      * @author Christoph Franke
      * 
      * @desc view on development of households
      *  
      * @return the HouseholdsDevelopmentView class
      * @see    nothing yet besides placeholder text
      */        
      var HouseholdsDevelopmentView = Backbone.View.extend({
        // The DOM Element associated with this view
        el: document,
        // View constructor
        initialize: function() {         
          // Calls the view's render method
          this.render();  
        },

        events: {

        },

        // render view
        render: function() {
          this.template = _.template(template, {});
          this.el.innerHTML = this.template;  
          return this;
        },       

        //remove the view
        close: function () {
          this.unbind(); // Unbind all local event bindings
          this.remove(); // Remove view from DOM
        },

      });

      // Returns the View class
      return HouseholdsDevelopmentView;

    }

);