/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(['app', 'jquery', 'backbone', 'text!templates/households.html',
        'collections/HouseholdsCollection', 'views/TableView',
        'views/visualizations/LineChart', 
        'views/visualizations/StackedBarChart'],

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
        var _this = this;
        this.user = app.get('session').get('user');
        
        // you need an active prognosis to proceed (else nothing to show, is intercepted by router anyway)
        var progId = app.get('activePrognosis').id;
        if (progId) {
          // container for all household developments (aggregated regions too)
          // serves as cache
          this.collection = new HouseholdsCollection({progId: progId});
          this.collection.fetch({
            success: this.render,
            error : function() {
                _this.el.innerHTML = '<h4><i> Keine Haushaltsprognose verf&uumlgbar </i></h4>';
            }
          });
          this.width = options.width;
        }
      },

      events: {
        // download buttons clicked
        'click .sizes-tab .download-btn.png': 'downloadSizesPng',
        'click .sizes-tab .download-btn.csv': 'downloadSizesCsv', 
        'click #relative-c .download-btn.png': 'downloadRelativePng',
        'click #absolute-c .download-btn.png': 'downloadAbsolutePng',
        'click .development-tab .download-btn.csv': 'downloadDevelopmentCsv',    
        'click #raw-data-btn': 'downloadRawCsv',
      },

      // render view
      render: function() {
        this.template = _.template(template, {user: this.user});
        this.el.innerHTML = this.template; 
        this.canvas = document.getElementById('pngRenderer');
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
          var sideControls = _this.el.getElementsByClassName('side-controls');
          for (var i = 0; i < sideControls.length; i++) 
            sideControls[i].style.display = 'block';   
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
        
        this.renderDevelopmentChart(data);
        this.renderDevTable(data);
        this.renderSizesChart(data);
        this.renderSizesTable(data);
        this.renderRawData(data);
        
        // description        
        this.renderDescription(this.currentModel.get('description'));
      },
      
      /*
       * render 2 line charts with demo. development
       */
      renderDevelopmentChart: function (data) {
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
            
      renderDescription: function(html){
        //if(html.length == 0)
        //  html = "keine";
        var div = this.el.querySelector('#description');
        div.innerHTML = html;
      },      
      
      /*
       * render a stacked bar-chart with agegroups
       */
      renderSizesChart: function (data) {
        var vis = this.el.querySelector('#sizes-chart');
        clearElement(vis);
        var groupedData = [];

        var width = this.width - 20;
        var height = width * 0.8;
        var maxSize = this.currentModel.get('maxSize');
        
        _.each(data, function (d) {
            groupedData.push({'jahr': d.jahr,
                              'values': d.hhgroessen});   
        });
        
        var groupNames = [];//_.range(1, maxSize + 1);
        for (var i = 1; i < maxSize + 1; i++){
          var name = i + ' Person';
          if (i > 1) name += 'en';
          if (i == maxSize) name += ' und mehr';
          groupNames.push(name);          
        }
        var prog = app.get('activePrognosis');

        this.sizesChart = new StackedBarChart({
          el: vis,
          data: groupedData,
          width: width,
          height: height,
          title: 'Haushaltsgrößen',
          subtitle: this.currentModel.get('name'),
          xlabel: 'Jahr',
          ylabel: 'Summe',
          stackLabels: groupNames,
          bandName: 'jahr',
          separator: prog.get('basisjahr')
        });
        this.sizesChart.margin.right = 120;
        this.sizesChart.render();
      },
      
      renderSizesTable: function (data) {
        var columns = [],
            title = 'Haushaltsgrößen';   
        var firstYearData = data[0];
        var lastYearData = data[data.length-1]; 
        
        columns.push({name: 'size', description: 'Person(en) je Haushalt'});
        columns.push({name: 'firstYear', description: firstYearData.jahr});
        columns.push({name: 'lastYear', description: lastYearData.jahr});
        columns.push({name: 'devperc', description: 'Entwicklung'});
        
        var rows = [];
        var maxSize = this.currentModel.get('maxSize');
        for (var i = 0; i < maxSize; i++) {          
          
          var firstSize = firstYearData.hhgroessen[i];
          var lastSize = lastYearData.hhgroessen[i];
          var devperc = (100 * lastSize / firstSize - 100);
          if(devperc > 0)
            devperc = '+' + devperc;
          
          rows.push({
            size: i + 1,
            firstYear: roundRep(firstSize, app.DECIMALS),
            lastYear: roundRep(lastSize, app.DECIMALS),
            devperc: roundRep(devperc, app.DECIMALS) + '%'
          });
        };
        
        this.sizesTable = new TableView({
          el: this.el.querySelector('#sizes-data'),
          columns: columns,
          data: rows,
          dataHeight: 300,
          title: title,
          clickable: true
        });
      },
      
      /*
       * render a table with the raw data received from the server
       * table is currently hidden, but rendered to export the data when requested
       */
      renderRawData: function (data) {
        var columns = [];
        var maxSize = this.currentModel.get('maxSize');
                
        var mappedData = [];
        data.forEach(function (yearData, n){
          var yearMapped = new Array();
          // transform data and split the age-columns
          Object.keys(yearData).forEach(function (key) {    
            if (key != 'sumHouseholds') {        
              if(key == 'hhgroessen'){
                for(var i = 0; i < maxSize; i++){
                  // header
                  var splitName = i + 1 + '_Person';
                  if (i > 0) splitName += 'en';
                  if (n == 0)                
                    columns.push({name: splitName, description: splitName});
                  var nP = 0;
                  if (i < yearData[key].length)
                    nP = yearData[key][i]
                  yearMapped[splitName] = roundRep(nP, app.DECIMALS);
                }               
              }
              else{
                // header
                if (n == 0)
                  columns.push({name: key, description: key});
                yearMapped[key] = roundRep(yearData[key], app.DECIMALS);
              }
            }
          });
          mappedData.push(yearMapped); 
        });
        
        this.rawTable = new TableView({
          el: this.el.querySelector('#raw-data'),
          columns: columns,
          data: mappedData,
          title: data[0].jahr + ' bis ' + data[data.length - 1].jahr,// + ' - ' + this.currentModel.get('name'),
          highlight: true
        });
      },
      
      downloadDevelopmentCsv: function(){
        if (this.user.limited_access) return;
        var filename = this.currentModel.get('name') + '-Haushaltsentwicklung.csv';
        this.devTable.save(filename);
      },
      
      downloadSizesCsv: function(){
        if (this.user.limited_access) return;
        var filename = this.currentModel.get('name') + '-Haushaltsgroessen.csv';
        this.sizesTable.save(filename);
      },
      
      downloadRawCsv: function () {
        if (this.user.limited_access) return;
        var filename = this.currentModel.get('name') + '-Haushaltsprognose-Gesamtdaten.csv';
        this.el.querySelector('#raw-data').style.display = 'block';
        this.rawTable.save(filename);
        this.el.querySelector('#raw-data').style.display = 'none';
      },
      
      downloadRelativePng: function (e) {
        var filename = this.currentModel.get('name') + '-Haushaltsentwicklung-relativ.png';
        var svg = $(this.el.querySelector('#relative>svg'));
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
      },
      
      downloadAbsolutePng: function (e) {
        var filename = this.currentModel.get('name') + '-Haushaltsentwicklung-absolut.png';
        var svg = $(this.el.querySelector('#absolute>svg'));
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
      },
      
      
      downloadSizesPng: function (e) {
        var filename = this.currentModel.get('name') + '-Haushaltsgroessen.png';
        var svg = $(this.el.querySelector('#sizes-chart>svg'));
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
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