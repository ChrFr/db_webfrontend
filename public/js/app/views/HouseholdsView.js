/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'jquery', 'backbone', 'text!templates/households.html',
        'collections/HouseholdsCollection', 'views/TableView',
        'views/visualizations/LineChart', ],

  function(app, $, Backbone, template, HouseholdsCollection, TableView){
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
       * render the given region by fetching and visualizing it's household data
       */
      renderRegion: function (region) {       
        var _this = this;
        var model = this.collection.getRegion(region);

        // don't need to keep track of loader divs, all children of the visualisations will be removed when rendered (incl. loader-icon)
        Loader(this.el.querySelector('#absolute'));

        model.fetch({success: function(){    
          
          _this.currentModel = model;
          _this.renderData();
        }});
      },
      
      renderData: function (){
        if(!this.currentModel)
          return;        
        
        // show tables
        this.el.querySelector('#tables').style.display = 'block';
        
        var data = this.currentModel.get('data');
        this.width = parseInt(this.el.querySelector('.tab-content').offsetWidth);
        
        this.renderDevelopment(data);
        this.renderDevTable(data);
      },
      
      /*
       * render 2 line charts with demo. development
       */
      renderDevelopment: function (data) {
        var households = [],
            years = [];

        // ABSOLUTE DATA
        
        var prog = app.get('activePrognosis'),
            baseYear = prog.get('basisjahr'),   
            baseIndex = 0;
        
        _.each(data, function (d, i) {
            households.push(d.hhstand);
            years.push(d.jahr);
            if(d.jahr === baseYear){
              baseIndex = i;
            }
        });

        // we put 2 lines into the diagram: the date from first to last available year
        // and a cut off data beginning with base year (so in fact last part is duplicated, 
        // but this way you don't have to change the code of LineChart.js)
        
        var dataAbs = {
          label: '',
          x: years,
          y: households
        };
        
        var dataPrognosed = {
            label: '',
            x: years.slice(baseIndex, years.length),
            y: households.slice(baseIndex, households.length)
        };

        var vis = this.el.querySelector('#absolute');
        clearElement(vis);

        var width = this.width - 40;
        var height = width * 0.5;
        
        this.absoluteChart = new LineChart({
          el: vis,
          data: [dataAbs, dataPrognosed],
          width: width,
          height: height,
          title: 'Haushaltsentwicklung absolut',
          subtitle: this.currentModel.get('name'),
          xlabel: '', // you may put 'Jahr' here, but it's obvious
          ylabel: 'Anzahl Haushalte in absoluten Zahlen',
          groupLabels: ['Ist-Daten', 'Prognosedaten'],
          colors: ["RoyalBlue", "YellowGreen"],
          separator: prog.get('basisjahr'),
          minY: 0
        });
        this.absoluteChart.render();

        // RELATIVE DATA (to first year)

        // clone data (prevent conflicts in drawing dots in both line charts)
        var dataRel = JSON.parse(JSON.stringify(dataAbs));

        var relVal = dataRel.y[0];

        for (var i = 0; i < dataRel.y.length; i++) {
          dataRel.y[i] *= 100 / relVal;
          dataRel.y[i] = round(dataRel.y[i], app.DECIMALS);
        };        
        
        var relPrognosed = {
            label: '',
            x: dataRel.x.slice(baseIndex, years.length),
            y: dataRel.y.slice(baseIndex, households.length)
        };
        
        vis = this.el.querySelector('#relative');
        clearElement(vis);        
        
        this.relativeChart = new LineChart({
          el: vis,
          data: [dataRel, relPrognosed],
          width: width,
          height: height,
          title: 'Haushaltsentwicklung relativ',
          subtitle: this.currentModel.get('name'),
          groupLabels: ['Ist-Daten', 'Prognosedaten'],
          xlabel: '', // you may put 'Jahr' here, but it's obvious
          ylabel: 'Anzahl Haushalte in Prozent (relativ zu ' + dataRel.x[0] + ')',
          separator: prog.get('basisjahr'),
          colors: ["RoyalBlue", "YellowGreen"],
          minY: prog.get('min_rel') * 100,
          maxY: prog.get('max_rel') * 100
        });

        this.relativeChart.render();
      },
      
      renderDevTable: function (data) {
        var columns = [],
            title = 'Haushaltsentwicklung',
            rows = [],      
            prog = app.get('activePrognosis'),
            baseYear = prog.get('basisjahr'),
            baseYearTotal,
            years = [],
            households = [];    

        // adapt age data to build table (arrays to single entries)
        columns.push({name: 'year', description: 'Jahr'});
        columns.push({name: 'total', description: 'Anzahl Haushalte'});
        columns.push({name: 'perc', description: 'Vergleich Basisjahr (' + baseYear + ')'});
        
        _.each(data, function (d) {
            households.push(d.hhstand);
            years.push(d.jahr);
            if (d.jahr === baseYear)
              baseYearTotal = d.hhstand;            
        });
        
        years.forEach(function(year, i){
          var perc = round((100 * households[i] / baseYearTotal - 100), app.DECIMALS);
          var percRep = roundRep(perc, app.DECIMALS);
          if(perc >= 0)
            percRep = '+' + percRep;
          percRep += '%';
          
          rows.push({
            year: year,
            total: roundRep(households[i], app.DECIMALS),
            perc: percRep
          });
        });        

        this.devTable = new TableView({
          el: this.el.querySelector('#dev-data'),
          columns: columns,
          title: title,
          data: rows,
          dataHeight: 500,
          pagination: false,
          highlight: true
        });
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