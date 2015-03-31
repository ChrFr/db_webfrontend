var d3 = require('d3'),
    jsdom = require('jsdom'),
    htmlStub = '<html><head></head><body><div id="dataviz-container"></div><script src="js/d3.v3.min.js"></script></body></html>'; // html file skull with a container div for the d3 dataviz

//var exports;
exports.render = (function(data, width, height, callback){
    // pass the html stub to jsDom
    jsdom.env({ features : { QuerySelector : true }, html : htmlStub,
        done : function(errors, window) {
        
            var el = window.document.querySelector('#dataviz-container'),
                body = window.document.querySelector('body');

            var title = "Bevölkerungsentwicklung " + data.rs + " " + data.jahr;
            var femaleAges = data.alter_weiblich;
            var maleAges = data.alter_maennlich;

            var margin = {
              top: 30,
              right: 20,
              bottom: 24,
              left: 20,
              middle: 0
            };
/**
            var width = this.el.clientWidth - margin.left - margin.right,
                height = this.el.clientHeight - margin.top - margin.bottom;*/

            var regionWidth = width/2 - margin.middle;
            var pointA = regionWidth,
                pointB = width - regionWidth;


            var maxAge = Math.max(femaleAges.length, maleAges.length);
            var barHeight = (height-margin.bottom)/maxAge

            // CREATE SVG
            var top = d3.select(el).append('svg')
              .attr('width', margin.left + width + margin.right)
              .attr('height', margin.top + height + margin.bottom);              
            var defs = top.append('defs');
            var style = defs.append('style');            
            style.attr("type", "text/css");     
            style.html("\
                svg {\
                  font: 10px sans-serif;\
                }\
\
\
                .title{    \
                    font-size: 1.5em;\
                }\
\
                .axis line,\
                .axis path {\
                  shape-rendering: crispEdges;\
                  fill: transparent;\
                  stroke: #555;\
                }\
\
                .x.axis line {\
                  stroke: #777;\
                  stroke-dasharray: 2,2;\
                }\
\
                .male rect {\
                  fill-opacity: 1;\
                  fill: #5EDAFF;\
                }\
\
                .female rect {\
                  fill-opacity: 1;\
                  fill: #FFE573;\
                }\
            ");
            
            var svg = top.append('svg')
              .append('g')
              .attr('transform', translation(margin.left, margin.top));

            var maxValue = Math.max(
              d3.max(femaleAges),
              d3.max(maleAges)
            );

            // TITLE

            svg.append("text")
                .attr('class', 'title')
                .attr("x", (width / 2))             
                .attr("y", 0 - (margin.top / 2))
                .attr("text-anchor", "middle")  
                .text(title);
            // SET UP SCALES

            var xScale = d3.scale.linear()
              .domain([0, maxValue])
              .range([0, regionWidth])
              .nice();

            var yScale = d3.scale.linear()
              .domain([0, maxAge])
              .range([height-margin.bottom, 0]);

            // BARS                

            var leftBarGroup = svg.append('g')
              .attr('class', 'female')
              .attr('transform', translation(pointA, 0) + 'scale(-1,1)');

            var rightBarGroup = svg.append('g')
              .attr('class', 'male')
              .attr('transform', translation(pointB, 0));

            var rightBars = rightBarGroup.selectAll("g")
                .data(femaleAges)
                .enter().append("g")
                .attr("transform", function(d, i) { return translation(0, (maxAge - i) * barHeight - barHeight/2); });

            rightBars.append("rect")
                .attr("width", xScale)
                .attr("height", barHeight - 1);            

            var leftBars = leftBarGroup.selectAll("g")
                .data(maleAges)
                .enter().append("g")
                .attr("transform", function(d, i) { return translation(0, (maxAge - i) * barHeight - barHeight/2); });

            leftBars.append("rect")
                .attr("width", xScale)
                .attr("height", barHeight - 1);


            // SET UP AXES
            var yAxis = d3.svg.axis()
              .scale(yScale)
              .orient('left')
              .ticks(maxAge)
              .tickSize(2,0)
              .tickPadding(margin.middle);

            yAxis.tickFormat(function(d) {
                return (d % 5 != 0) ? '': d;
            });

            var xAxisRight = d3.svg.axis()
              .scale(xScale)
              .orient('bottom')
              .tickSize(-height);

            var xAxisLeft = d3.svg.axis()
              .scale(xScale.copy().range([pointA, 0]))
              .orient('bottom')
              .tickSize(-height);

            // AXES

            svg.append('g')
              .attr('class', 'axis y left')
              .attr('transform', translation(pointA, 0))
              .call(yAxis);


            svg.append('g')
              .attr('class', 'axis x left')
              .attr('transform', translation(0, height))
              .call(xAxisLeft);

            svg.append('g')
              .attr('class', 'axis x right')
              .attr('transform', translation(pointB, height))
              .call(xAxisRight);

            function translation(x,y) {
              return 'translate(' + x + ',' + y + ')';
            }
            callback(el.innerHTML);
        }
    });
});
/*
    render: function() {

        var femaleModel = this.collection.findWhere({weiblich: true});
        var femaleAges = femaleModel.get('alter');
        var maleModel = this.collection.findWhere({weiblich: false});
        var maleAges = maleModel.get('alter');

        var region = femaleModel.get('rs');
        var year = femaleModel.get('jahr');
        var title = "Bevölkerungsentwicklung " + region + " " + year;

        var margin = {
          top: 30,
          right: 20,
          bottom: 24,
          left: 20,
          middle: 0
        };

        var width = this.el.clientWidth - margin.left - margin.right,
            height = this.el.clientHeight - margin.top - margin.bottom;

        var regionWidth = width/2 - margin.middle;
        var pointA = regionWidth,
            pointB = width - regionWidth;


        var maxAge = Math.max(femaleAges.length, maleAges.length);
        var barHeight = (height-margin.bottom)/maxAge

        // CREATE SVG
        var svg = d3.select(this.el).append('svg')
          .attr('width', margin.left + width + margin.right)
          .attr('height', margin.top + height + margin.bottom)
          .append('g')
          .attr('transform', translation(margin.left, margin.top));

        var maxValue = Math.max(
          d3.max(femaleAges),
          d3.max(maleAges)
        );

        // TITLE

        svg.append("text")
            .attr('class', 'title')
            .attr("x", (width / 2))             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .text(title);
        // SET UP SCALES

        var xScale = d3.scale.linear()
          .domain([0, maxValue])
          .range([0, regionWidth])
          .nice();

        var yScale = d3.scale.linear()
          .domain([0, maxAge])
          .range([height-margin.bottom, 0]);

        // BARS                

        var leftBarGroup = svg.append('g')
          .attr('class', 'female')
          .attr('transform', translation(pointA, 0) + 'scale(-1,1)');

        var rightBarGroup = svg.append('g')
          .attr('class', 'male')
          .attr('transform', translation(pointB, 0));

        var rightBars = rightBarGroup.selectAll("g")
            .data(femaleAges)
            .enter().append("g")
            .attr("transform", function(d, i) { return translation(0, (maxAge - i) * barHeight - barHeight/2); });

        rightBars.append("rect")
            .attr("width", xScale)
            .attr("height", barHeight - 1);            

        var leftBars = leftBarGroup.selectAll("g")
            .data(maleAges)
            .enter().append("g")
            .attr("transform", function(d, i) { return translation(0, (maxAge - i) * barHeight - barHeight/2); });

        leftBars.append("rect")
            .attr("width", xScale)
            .attr("height", barHeight - 1);


        // SET UP AXES
        var yAxis = d3.svg.axis()
          .scale(yScale)
          .orient('left')
          .ticks(maxAge)
          .tickSize(2,0)
          .tickPadding(margin.middle);

        yAxis.tickFormat(function(d) {
            return (d % 5 != 0) ? '': d;
        });

        var xAxisRight = d3.svg.axis()
          .scale(xScale)
          .orient('bottom')
          .tickSize(-height);

        var xAxisLeft = d3.svg.axis()
          .scale(xScale.copy().range([pointA, 0]))
          .orient('bottom')
          .tickSize(-height);

        // AXES

        svg.append('g')
          .attr('class', 'axis y left')
          .attr('transform', translation(pointA, 0))
          .call(yAxis);


        svg.append('g')
          .attr('class', 'axis x left')
          .attr('transform', translation(0, height))
          .call(xAxisLeft);

        svg.append('g')
          .attr('class', 'axis x right')
          .attr('transform', translation(pointB, height))
          .call(xAxisRight);

        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }
        return this;
    },        

    close: function () {
        this.unbind();
        this.remove();
    }

});*/