/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'jquery', 'backbone', 'text!templates/hhdevelop.html',
        'collections/HouseholdsCollection'],

  function(app, $, Backbone, template, HouseholdsCollection){
    /** 
    * 
    * @desc view on development of households
    *  
    * @return the HouseholdsDevelopmentView class
    * @see    nothing yet besides placeholder text
    */        
    var HouseholdsView = Backbone.View.extend({
      // The DOM Element associated with this view
      el: document,

      initialize: function (options) {
        _.bindAll(this, 'render', 'renderRegion');

        console.log(this.el);
        // you need an active prognosis to proceed (else nothing to show, is intercepted by router anyway)
        var progId = app.get('activePrognosis').id;
        if (progId) {
          // container for all demographic developments (aggregated regions too)
          // serves as cache
          this.collection = new HouseholdsCollection({progId: progId});
          this.collection.fetch({success: this.render});
          this.width = options.width;
        }
      },

      events: {

      },

      // render view
      render: function() {
        this.template = _.template(template, {});
        this.el.innerHTML = this.template; 
        app.bind('activeRegion', this.renderRegion);
        return this;
      },       

      /*
       * render the given region by fetching and visualizing it's demographic data
       */
      renderRegion: function (region) {       
        var model = this.collection.getRegion(region);

        // don't need to keep track of loader divs, all children of the visualisations will be removed when rendered (incl. loader-icon)
        Loader(this.el.querySelector('#absolute'));

        model.fetch({success: function(){    
            console.log(model);
          this.renderData();
        }});
      },

      //remove the view
      close: function () {
        this.unbind(); // Unbind all local event bindings
        this.remove(); // Remove view from DOM
      }

    });

    // Returns the View class
    return HouseholdsView;
  }
);