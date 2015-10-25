define(['jquery', 'app', 'backbone', 'text!templates/demodevelop.html', 'collections/DDCollection',
  'views/TableView', 'd3', 'd3slider', 'bootstrap', 'views/visualizations/AgeTree', 'views/visualizations/Map',
  'views/visualizations/LineChart', 'views/visualizations/GroupedBarChart', 'views/visualizations/StackedBarChart',
  'canvg', 'pnglink', 'filesaver', 'topojson', 'views/Loader', 'views/svgConversion'],
  function ($, app, Backbone, template, DDCollection, TableView, d3, d3slider) {
            
    /** 
     * @author Christoph Franke
     * 
     * @desc view on demographic development 
     * 
     * @param options.width  initial size of the visualizations; is taken, 
     *                       if width of wrapping div can't be determined 
     *                       (if in inactive tab)
     * @param options.el     html-element, the view will be rendered in                      
     * 
     * @return the DemographicDevelopmentView class (for chaining)
     * @see    data-visualisations, data-tables
     */        
    var DemographicDevelopmentView = Backbone.View.extend({
      // The DOM Element associated with this view
      el: document,
      
      /*
       * view-constructor
       */
      initialize: function (options) {
        _.bindAll(this, 'render', 'renderRegion');

        // you need an active prognosis to proceed (else nothing to show, is intercepted by router anyway)
        var progId = app.get('activePrognosis').id;
        if (progId) {
          // container for all demographic developments (aggregated regions too)
          // serves as cache
          this.collection = new DDCollection({progId: progId});
          this.collection.fetch({success: this.render});
          this.width = options.width;
        }       
      },
      
      
      /*
       * dom events (managed by jquery)
       */
      events: {
        // age group controls
        'click #new-group': 'addAgeGroup',
        'change #agegroup-from': 'ageInput',
        'click #delete-agegroups': 'deleteAgeGroups',
        
        // download buttons clicked
        'click #age-tab>.download-btn.csv': 'downloadAgeTableCsv',
        'click #raw-tab>.download-btn.csv': 'downloadRawCsv',
        'click #agegroup-tab>.download-btn.csv': 'downloadAgeGroupCsv',
        'click #agetree-tab .download-btn.png': 'downloadAgeTreePng',
        'click #development-tab .download-btn.png': 'downloadDevelopmentPng',
        'click #barchart-tab .download-btn.png': 'downloadBarChartPng',
        'click #agegroupchart-tab .download-btn.png': 'downloadAgeGroupChartPng',
        
        // other controls clicked
        'click #play': 'play',
        'click #agetree-tab .watch': 'watchYear',
        'click #visualizations li': 'tabChange',
        'click #hiddenPng': 'test',
        'click #fix-scale': 'fixScale'
      },
      
      /*
       * render view
       */ 
      render: function () {
        this.template = _.template(template, {});
        this.el.innerHTML = this.template;     
        // aux. canvas for conversion into png
        this.canvas = document.getElementById('pngRenderer');
        
        this.validateAgeGroups();
        app.bind('activeRegion', this.renderRegion);
        return this;
      },
      
      /*
       * render the given region by fetching and visualizing it's demographic data
       */
      renderRegion: function (region) {         
        
        var model = this.collection.getRegion(region);
        this.el.querySelector('#agetree-tab .watch').classList.remove('active');
        this.compareData = null;
        var _this = this;
        this.stop();
        
        // don't need to keep track of loader divs, all children of the visualisations will be removed when rendered (incl. loader-icon)
        Loader(this.el.querySelector('#absolute'));
        Loader(this.el.querySelector('#agegroupchart'));
        Loader(this.el.querySelector('#barchart'));
        Loader(this.el.querySelector('#agetree'));
        
        model.fetch({success: function () {
          //_this.el.querySelector('#visualizations').style.display = 'block';
          _this.el.querySelector('#tables').style.display = 'block';
          var sideControls = _this.el.getElementsByClassName('side-controls');
          for (var i = 0; i < sideControls.length; i++) 
            sideControls[i].style.display = 'block';   
          var bottomControls =  _this.el.getElementsByClassName('bottom-controls');
          for (var i = 0; i < bottomControls.length; i++) 
            bottomControls[i].style.display = 'block';   

          // you get 0 as widths of elements in inactive tabs
          _this.width = parseInt(_this.el.querySelector('.tab-content').offsetWidth);

          //_this.width = width? width: _this.width // if you can't determine current width get last known

          var maxYear = model.get('maxYear'),
              minYear = model.get('minYear'),
              data = model.get('data');

          _this.currentModel = model;
          //draw first year if not assigned yet
          if (!_this.currentYear) {
            _this.yearData = data[0];
            _this.currentYear = minYear;
          }
          //keep year of previous region, if new region has data for it
          else {
            var found = false;
            _.each(model.get('data'), (function (yd) {
              if (yd.jahr == _this.currentYear) {
                found = true;
                _this.yearData = yd;
              }
            }));
            if (!found) {
              _this.currentYear = minYear;
              _this.yearData = data[0];
            }
          }
          // UPDATE SLIDERS    
          var width = _this.width - 150; // - padding etc.
          var sliderDiv = _this.el.querySelector('#year-slider');
          clearElement(sliderDiv);
          //var btnWidth = parseInt(_this.el.querySelector('#play').clientWidth; returns 0, why?
          sliderDiv.style.width = width + 'px';
          var yearStep = Math.floor((maxYear - minYear) / 4);

          _this.yearSlider = d3slider()
              .axis(
                d3.svg.axis().orient('down')
                  //4 ticks
                  .tickValues([minYear, minYear + yearStep, minYear + yearStep * 2, minYear + yearStep * 3, maxYear])
                  .tickFormat(d3.format('d'))
                  .ticks(maxYear - minYear)
                  .tickSize(10)
              )
              .min(minYear)
              .max(maxYear)
              .step(1)
              .value(_this.currentYear);

          d3.select('#year-slider').call(_this.yearSlider);

          _this.yearSlider.on('slide', function (evt, value) {
            evt.stopPropagation();
            _this.changeYear(value);
          });

          sliderDiv = _this.el.querySelector('#scale-slider');
          var locked = (_this.el.querySelector('#fix-scale').className === 'active');
          clearElement(sliderDiv);

          //you can only scale below highest number, if you fixed scale before (for comparison)
          var min = Math.ceil(model.get('maxNumber'));
          var minScale = (!_this.xScale || min < _this.xScale) ? min : _this.xScale;
          if (minScale < 1)
            minScale = 1;

          if (!_this.xScale || !locked) {
            _this.xScale = model.get('maxNumber');
            _this.xScale *= 1.3;
            _this.xScale = Math.ceil(_this.xScale);
            _this.el.querySelector('#current-scale').innerHTML = _this.xScale;
          }

          var maxScale = 10000;

          var xScale = d3.scale.log()
              .domain([minScale, maxScale]);

          _this.el.querySelector('#min-scale').innerHTML = minScale;
          _this.el.querySelector('#max-scale').innerHTML = maxScale;

          var scaleSlider = d3slider()
              .scale(xScale)
              .value(_this.xScale)
              .axis(d3.svg.axis().orient('right').tickFormat(d3.format('')).ticks(10).tickFormat(''))
              .orientation('vertical');

          d3.select('#scale-slider').call(scaleSlider);

          scaleSlider.on('slide', function (evt, value) {
            evt.stopPropagation();
            _this.xScale = Math.ceil(value);
            _this.el.querySelector('#current-scale').innerHTML = _this.xScale;
            _this.renderAgeTree(_this.yearData);
          });

          _this.calculateAgeGroups();            
          _this.renderData();
        }});
      },
      
      /*
       * call functions to render visualizations and tables with active data
       */
      renderData: function(){
        // no active model -> nothing to render
        if(!this.currentModel)
          return;        
        
        this.width = parseInt(this.el.querySelector('.tab-content').offsetWidth);
        var data = this.currentModel.get('data');
        
        //visualizations        
        this.renderAgeTree(this.yearData);
        this.renderDevelopment(data);
        this.renderBarChart(data);
        this.renderAgeGroupChart(this.groupedData);
        //data tables
        this.renderAgeGroupTable(this.currentYear);
        this.renderAgeTable(this.yearData);
        this.renderRawData(data);
        
        // TODO: change size of yearSlider
      },
      
      /* 
       * render the agetree 
       */     
      renderAgeTree: function(data) {
        var vis = this.el.querySelector('#agetree');
        
        clearElement(vis);

        var width = this.width - 5;
        //width / height ratio is 1 : 1.2
        var height = width * 0.8;
        this.ageTree = new AgeTree({
          el: vis,
          data: data,
          compareData: this.compareData,
          title: 'Bevölkerungspyramide',
          subtitle: this.currentModel.get('name'),
          width: width,
          height: height,
          maxY: this.currentModel.get('maxAge'),
          maxX: this.xScale
        });
        this.ageTree.render();
      },
      
      /*
       * render 2 line charts with demo. development
       */
      renderDevelopment: function (data) {
        var total = [],
            years = [];

        // ABSOLUTE DATA

        _.each(data, function (d) {
          total.push(d.sumFemale + d.sumMale);
          years.push(d.jahr);
        });

        var dataAbs = {
          label: '',
          x: years,
          y: total
        };

        var vis = this.el.querySelector('#absolute');
        clearElement(vis);

        var width = this.width - 40;
        var height = width * 0.5;
        this.absoluteChart = new LineChart({
          el: vis,
          data: [dataAbs],
          width: width,
          height: height,
          title: 'Bevölkerungsentwicklung absolut',
          subtitle: this.currentModel.get('name'),
          xlabel: 'Jahr',
          ylabel: 'Gesamtbevölkerung in absoluten Zahlen',
          minY: 0
        });
        this.absoluteChart.render();

        // RELATIVE DATA (to first year)

        // clone data (prevent conflicts in drawing dots in both line charts)
        var dataRel = JSON.parse(JSON.stringify(dataAbs));

        var relVal = dataRel.y[0];

        for (var i = 0; i < dataRel.y.length; i++) {
          dataRel.y[i] *= 100 / relVal;
          dataRel.y[i] = Math.round(dataRel.y[i] * 100) / 100;
        }
        ;

        vis = this.el.querySelector('#relative');
        clearElement(vis);

        this.relativeChart = new LineChart({
          el: vis,
          data: [dataRel],
          width: width,
          height: height,
          title: 'Bevölkerungsentwicklung relativ',
          subtitle: this.currentModel.get('name'),
          xlabel: 'Jahr',
          ylabel: 'Gesamtbevölkerung in Prozent (relativ zu ' + dataRel.x[0] + ')'
        });

        this.relativeChart.render();
      },
      
      /*
       * render bar chart with factors influencing the development
       */
      renderBarChart: function (data) {
        var dataSets = [];

        _.each(data, function (d) {
          var values = [
            d.geburten - d.tote,
            d.zuzug - d.fortzug
          ];
          values.push(values[0] + values[1]);

          var dataSet = {label: d.jahr,
            values: values};
          dataSets.push(dataSet);
        });


        var vis = this.el.querySelector('#barchart');
        clearElement(vis);
        
        var width = this.width - 70;
        var height = width * 0.8;
        this.barChart = new GroupedBarChart({
          el: vis,
          data: dataSets,
          width: width,
          height: height,
          title: 'Bevölkerungsentwicklung',
          subtitle: this.currentModel.get('name'),
          xlabel: 'Jahr',
          groupLabels: ['A: Geburten - Sterbefälle', 'B: Zuwanderung - Abwanderung', 'gesamt: A + B'],
          ylabel: 'Zuwachs',
          yNegativeLabel: 'Abnahme'
        });
        this.barChart.render();
      },
      
      /*
       * render a table with mail and female ages for given year
       */
      renderAgeTable: function (yearData) {
        var columns = [],
            title = '';

        if (yearData.jahr == this.currentModel.get('minYear'))
          title = 'Basisjahr';
        else
          title = 'Prognose';

        // adapt age data to build table (arrays to single entries)
        columns.push({name: 'age', description: 'Alter'});
        columns.push({name: 'female', description: 'Anzahl weiblich'});
        columns.push({name: 'male', description: 'Anzahl männlich'});

        var femaleAges = yearData.alter_weiblich;
        var maleAges = yearData.alter_maennlich;

        var data = [];
        for (var i = 0; i < femaleAges.length; i++) {
          data.push({
            age: i,
            female: Math.round(femaleAges[i]),
            male: Math.round(maleAges[i])
          });
        }

        //get state of prev. table to apply on new one
        var state = (this.ageTable) ? this.ageTable.getState() : {};

        this.ageTable = new TableView({
          el: this.el.querySelector('#age-data'),
          columns: columns,
          title: title + ' ' + yearData.jahr,// + ' - ' + this.currentModel.get('name'),
          data: data,
          dataHeight: 400,
          pagination: false,
          startPage: state.page,
          pageSize: state.size,
          highlight: true
        });
      },
      
      /*
       * render a table with the raw data received from the server
       */
      renderRawData: function (data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (i) {
          columns.push({name: i, description: i});
        });

        this.rawTable = new TableView({
          el: this.el.querySelector('#raw-data'),
          columns: columns,
          data: data,
          title: data[0].jahr + ' bis ' + data[data.length - 1].jahr,// + ' - ' + this.currentModel.get('name'),
          highlight: true
        });
      },
      
      /*
       * divide the range of ages into the defined agegroups 
       */
      calculateAgeGroups: function () {
        var _this = this;
        this.groupedData = [];
        var ageGroups = JSON.parse(JSON.stringify(app.get('ageGroups')));
        //calc sum over all ages eventually
        ageGroups.push({from: 0, to: Number.MAX_VALUE});

        this.currentModel.get('data').forEach(function (yearData) {
          var groupedYearData = {jahr: yearData.jahr, values: [], female: [], male: []};
          ageGroups.forEach(function (ageGroup) {
            var from = (ageGroup.from !== null) ? ageGroup.from : 0,
                    femaleSum, maleSum,
                    femaleAges = yearData.alter_weiblich,
                    maleAges = yearData.alter_maennlich;
            maleSum = femaleSum = 0;

            //sum up female ages
            var to = (ageGroup.to === null || ageGroup.to >= femaleAges.length) ? femaleAges.length : ageGroup.to;
            for (var i = from; i < to; i++)
              femaleSum += femaleAges[i];

            //sum up male ages
            to = (ageGroup.to === null || ageGroup.to >= maleAges.length) ? maleAges.length : ageGroup.to;
            for (var i = from; i < to; i++)
              maleSum += maleAges[i];

            var count = Math.round(maleSum + femaleSum);

            groupedYearData.values.push(count);
            groupedYearData.female.push(femaleSum);
            groupedYearData.male.push(maleSum);
          });
          groupedYearData.count = groupedYearData.values.pop();
          groupedYearData.maleTotal = groupedYearData.male.pop();
          groupedYearData.femaleTotal = groupedYearData.female.pop();
          _this.groupedData.push(groupedYearData);
        });
      },
      
      /*
       * render a stacked bar-chart with agegroups
       */
      renderAgeGroupChart: function (data) {
        var vis = this.el.querySelector('#agegroupchart');
        clearElement(vis);

        var width = this.width - 70;
        var height = width * 0.8;

        var groupNames = [];
        app.get('ageGroups').forEach(function (g) {
          groupNames.push(g.name);
        });

        this.ageGroupChart = new StackedBarChart({
          el: vis,
          data: data,
          width: width,
          height: height,
          title: 'Altersgruppen',
          subtitle: this.currentModel.get('name'),
          xlabel: 'Jahr',
          ylabel: 'Summe',
          stackLabels: groupNames,
          bandName: 'jahr'
        });
        this.ageGroupChart.render();
      },
      
      /*
       * render a table with ages divided into agegroups
       */
      renderAgeGroupTable: function (year) {
        var columns = [],
            title = '';
        columns.push({name: 'ageGroup', description: 'Altersgruppe'});
        columns.push({name: 'female', description: 'weiblich'});
        columns.push({name: 'male', description: 'männlich'});
        columns.push({name: 'count', description: 'Anzahl'});
        columns.push({name: 'percentage', description: 'Anteil gesamt'});

        // find precalculated agegroups for given year
        var yearData;
        for (var i = 0; i < this.groupedData.length; i++) {
          if (this.groupedData[i].jahr == year) {
            yearData = this.groupedData[i];
            break;
          }
        };
        // return if no data found
        if (!yearData)
          return;
        
        if (yearData.jahr == this.currentModel.get('minYear'))
          title = 'Basisjahr';
        else
          title = 'Prognose';

        var rows = [];
        var index = 0;
        app.get('ageGroups').forEach(function (ageGroup) {
          var groupName = ageGroup.name;
          if (ageGroup.intersects)
            groupName += '&nbsp&nbsp<span class="glyphicon glyphicon-warning-sign"></span>';

          var count = yearData.values[index],
                  femaleSum = yearData.female[index],
                  maleSum = yearData.male[index],
                  femaleP = (count > 0) ? Math.round((femaleSum / count) * 1000) / 10 + '%' : '-',
                  maleP = (count > 0) ? Math.round((maleSum / count) * 1000) / 10 + '%' : '-';

          rows.push({
            index: index,
            ageGroup: groupName,
            count: count,
            female: femaleP,
            male: maleP
          });
          index++;
        });

        rows.push({
          index: index,
          ageGroup: 'gesamt',
          count: yearData.count,
          female: Math.round((yearData.femaleTotal / yearData.count) * 1000) / 10,
          male: Math.round((yearData.maleTotal / yearData.count) * 1000) / 10
        });

        rows.forEach(function (row) {
          row.percentage = Math.round((row.count / yearData.count) * 1000) / 10 + '%';
        });

        this.ageGroupTable = new TableView({
          el: this.el.querySelector('#agegroup-data'),
          columns: columns,
          data: rows,
          dataHeight: 300,
          title: title + ' ' + yearData.jahr,// + ' - ' + this.currentModel.get('name'),
          clickable: true,
          selectable: true
        });
      },
      
      /*
       * sorted insertion of user defined agegroups (in app)
       */
      addAgeGroup: function () {
        var from = parseInt(this.el.querySelector('#agegroup-from').value),
                to = parseInt(this.el.querySelector('#agegroup-to').value),
                groupName = from + ((to === null || isNaN(to)) ? '+' : ' - ' + to);

        //you need at least one input
        if (isNaN(to) && isNaN(from))
          return alert('Sie müssen mindestens ein Feld ausfüllen!');

        //no 'to' input is treated like 'from' to infinite (from+)
        if (isNaN(to))
          to = null;
        ////no 'from' input is treated like 0 to 'from'
        if (isNaN(from))
          from = 0;

        //sorted insertion
        var ageGroups = app.get('ageGroups');
        for (var i = 0; i < ageGroups.length; i++) {
          if (from < ageGroups[i].from)
            break;
          if (to && from === ageGroups[i].from && to < ageGroups[i].to)
            break;
        }
        ageGroups.splice(i, 0, {from: from, to: to, name: groupName});
        this.validateAgeGroups();
        this.calculateAgeGroups();

        //rerender table and chart
        this.renderAgeGroupTable(this.currentYear);
        this.renderAgeGroupChart(this.groupedData);
      },
      
      /*
       * flags intersections of groups, condition: sorted order of agegroups
       */
      validateAgeGroups: function () {
        //compare every row with its successor (except last row, it simply has none)
        var showWarning = false;
        var ageGroups = app.get('ageGroups');
        for (var i = 0; i < ageGroups.length - 1; i++) {
          if (//easiest case: same start value
                  ageGroups[i].from === ageGroups[i + 1].from ||
                  //if any row except last one has no upper limit it is definitely intersecting with successor
                  ageGroups[i].to === null ||
                  //group shouldn't have higher upper limit than successor starts with (special sort order assumed here)
                  ageGroups[i].to > ageGroups[i + 1].from) {
            ageGroups[i].intersects = showWarning = true;
          }
          else
            ageGroups[i].intersects = false;
        }
        var tab = this.el.querySelector('#agegroup-tab');
        //remove old alerts
        var warnings = this.el.querySelectorAll('.alert');
        for (var i = 0; i < warnings.length; i++)
          warnings[i].remove();
        //add new warning, if there is need to
        if (showWarning) {
          var text = '<span class="glyphicon glyphicon-warning-sign"></span><strong>Achtung!</strong> Es gibt Überschneidungen zwischen dieser und der nachfolgenden Altersgruppe!';
          tab.appendChild(createAlert('warning', text));
        }
      },
      
      /*
       * adjust age input range, if first input field changed
       */
      ageInput: function (event) {
        var from = parseInt(event.target.value),
                toInput = this.el.querySelector('#agegroup-to'),
                to = parseInt(toInput.value);

        toInput.setAttribute('min', from + 1);

        if (toInput.value && toInput.value <= from) {
          toInput.value = from + 1;
        }
      },
      
      /*
       * remove agegroups
       */
      deleteAgeGroups: function () {
        var selections = this.ageGroupTable.getSelections();
        //mark for deletion
        
        var ageGroups = app.get('ageGroups');
        selections.forEach(function (ageGroup) {
          var index = ageGroup.index;
          if (typeof index !== 'undefined' && index < ageGroups.length)
            ageGroups[index] = null;
        });
        //remove marked entries in reverse order (so splice doesn't mess up the order)
        for (var i = ageGroups.length - 1; i >= 0; i--) {
          if (ageGroups[i] === null) {
            ageGroups.splice(i, 1);
          }
        }

        this.validateAgeGroups();
        this.calculateAgeGroups();

        //rerender table and chart
        this.renderAgeGroupTable(this.currentYear);
        this.renderAgeGroupChart(this.groupedData);
      },
      
      /*
       * rerender visualisations according to the given year
       */
      changeYear: function(year) {
        this.currentYear = year;
        var data = this.currentModel.get('data');
        var idx = data.length - 1 - (this.currentModel.get('maxYear') - year);
        this.yearData = data[idx];
        this.ageTree.changeData(this.yearData);
        this.renderAgeGroupTable(this.currentYear);
        this.renderAgeTable(this.yearData);        
      },
      
      /*
       * if tab changed, show specific data tables
       */
      tabChange: function (event) {
        this.stop();
        
        // no model loaded yet (because no region selected)
        if(!this.currentModel)
          return;
        
        if (event.target.getAttribute('href') === '#agetree-tab') {
          // age tree can render multiple years -> render data of current one  
          this.changeYear(this.currentYear);
        }
        //the others render summary over years -> render data of first year (thats the year the predictions base on)
        else {
          this.yearData = this.currentModel.get('data')[0];
          this.renderAgeTable(this.yearData);
          this.renderAgeGroupTable(this.yearData.jahr);
        }

      },
      
      /*
       * cycle through the years (change year every 1000 ms)
       */
      play: function (event) {
        var _this = this;
        var t = 1000;
        if (!this.timerId) {
          var btn = event.target;
          btn.classList.remove('stopped');
          btn.classList.add('active');
          var maxYear = _this.currentModel.get('maxYear');
          var minYear = _this.currentModel.get('minYear');
          // slider reached end? -> reset
          if (_this.yearSlider.value() >= maxYear) {
            _this.yearSlider.value(minYear);
            _this.changeYear(minYear);
          }
          this.timerId = setInterval(function () {
            var currentYear = _this.yearSlider.value();
            if (currentYear == maxYear) {
              _this.stop();
            }
            else {
              _this.yearSlider.value(currentYear + 1);
              _this.changeYear(currentYear + 1);
            }
          }, t);
        }
        else
          this.stop();
      },
      
      /*
       * stop the cycle through the years
       */
      stop: function () {
        var btn = this.el.querySelector('#play');
        if (!btn)
          return;
        btn.classList.remove('active');
        btn.classList.add('stopped');
        if (this.timerId) {
          clearInterval(this.timerId);
          this.timerId = null;
        }
      },
      
      /*
       * watch/unwatch the current model
       */
      watchYear: function (event) {
        var watchBtn = event.target;
        if (!this.compareData) {
          watchBtn.classList.add('active');
          this.compareData = this.yearData;
        }
        else {
          watchBtn.classList.remove('active');
          this.compareData = null;
        }
        this.renderAgeTree(this.yearData);
      },
      
      /*
       * fix the current scale (agetree)
       */
      fixScale: function (event) {
        var btn = event.target;
        var slider = this.el.querySelector('#scale-slider-container');
        if (btn.className === 'active') {
          btn.classList.remove('active');
          slider.classList.remove('disabled');
        }
        else {
          btn.classList.add('active');
          slider.classList.add('disabled');
        }
      },
      
      // FUNCTIONS FOR CONVERTING CURRENT MODELDATA TO CSV/PNG
      
      downloadAgeTableCsv: function () {
        var filename = this.currentModel.get('name') + '-' + this.currentYear + '-Alterstabelle.csv';
        this.ageTable.save(filename);
      },
      
      downloadRawCsv: function () {
        var filename = this.currentModel.get('name') + '-Rohdaten.csv';
        this.rawTable.save(filename);
      },
      
      downloadAgeGroupCsv: function () {
        var filename = this.currentModel.get('name') + '-' + this.currentYear + '-Altersgruppen.csv';
        this.ageGroupTable.save(filename);
      },
      
      downloadAgeTreePng: function (e) {
        var filename = this.currentModel.get('name') + '-' + this.currentYear + '-Alterspyramide.png';
        var svg = $('#agetree>svg');
        downloadPng(svg, filename, this.canvas);//, {width: 2, height: 2});
      },
      
      downloadBarChartPng: function (e) {
        var filename = this.currentModel.get('name') + '-Barchart.png';
        var svg = $('#barchart>svg');
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
      },
      
      downloadAgeGroupChartPng: function (e) {
        var filename = this.currentModel.get('name') + '-Altersgruppen.png';
        var svg = $('#agegroupchart>svg');
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
      },
      
      downloadDevelopmentPng: function (e) {
        var filename = this.currentModel.get('name') + '-Bevoelkerungsentwicklung-absolut.png';
        var svg = $('#absolute>svg');
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
        var filename = this.currentModel.get('name') + '-Bevoelkerungsentwicklung-relativ.png';
        var svg = $('#relative>svg');
        downloadPng(svg, filename, this.canvas, {width: 2, height: 2});
      },
      
      //remove the view
      close: function () {
        this.stop();
        app.unbind('activeRegion');
        this.unbind(); // Unbind all local event bindings
        this.remove(); // Remove view from DOM
      }

    });

    /*
     * create and return a div containing a bootstrap-alert with the given type and text
     * available types: success, info, danger, warning
     */
    function createAlert(type, text) {
      var div = document.createElement('div');
      div.innerHTML = '<div class="alert alert-' + type + '">' +
              '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
              text;
      return div;
    };
    
    /*
     * clear given dom-element by removing its children
     */
    function clearElement(el){
      while (el.firstChild)
        el.removeChild(el.firstChild);
    }

    // return the view class (for chaining)
    return DemographicDevelopmentView;
  }
);