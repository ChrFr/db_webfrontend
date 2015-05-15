var d3 = require('d3');

var AgeTree = function(options){
    this.el = options.el || document;
    this.data = options.data;
    this.width = options.width;
    this.height = options.height;
    this.maxX = options.maxX || 100;
    this.maxY = options.maxY || 1000;
    this.css = options.css;
    
    this.render = function(callback){
        var _this = this;                                

        var femaleAges = this.data.alter_weiblich;
        var maleAges = this.data.alter_maennlich;

        var year = this.data.jahr;
        var title = year;

        var margin = {
          top: 30,
          right: 20,
          bottom: 24,
          left: 20,
          middle: 0
        };

        var regionWidth = this.width/2 - margin.middle;
        var pointA = regionWidth,
            pointB = this.width - regionWidth;

        var barHeight = (this.height-margin.bottom)/this.maxX;  
        
        
        var top = d3.select(this.el).append('svg')
            .attr('width', margin.left + this.width + margin.right)
            .attr('height', margin.top + this.height + margin.bottom);  
    
        if(this.css){
            var defs = top.append('defs');
            var style = defs.append('style');  
            //style.type = 'text/css';                
            style.attr("type", "text/css");     
            style.html(this.css);  
        }

        // create svg
        var svg = top.append('svg')
              .append('g')
              .attr('transform', translation(margin.left, margin.top));   

        // TITLE

        svg.append("text")
            .attr('class', 'title')
            .attr("x", (this.width / 2))             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .text(title);

        // SCALES

        this.xScale = d3.scale.linear()
          .domain([0, _this.maxY])
          .range([0, regionWidth])
          .nice();

        this.yScale = d3.scale.linear()
          .domain([0, _this.maxX])
          .range([this.height-margin.bottom, 0]);

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
            .attr("transform", function(d, i) { return translation(0, (_this.maxX - i) * barHeight - barHeight/2); });

        rightBars.append("rect")
            .attr("width", this.xScale)
            .attr("height", barHeight - 1);            

        var leftBars = leftBarGroup.selectAll("g")
            .data(maleAges)
            .enter().append("g")
            .attr("transform", function(d, i) { return translation(0, (_this.maxX - i) * barHeight - barHeight/2); });

        leftBars.append("rect")
            .attr("width", _this.xScale)
            .attr("height", barHeight - 1);


        // AXES

        var yAxis = d3.svg.axis()
          .scale(_this.yScale)
          .orient('left')
          .ticks(_this.maxX)
          .tickSize(2,0)
          .tickPadding(margin.middle);

        yAxis.tickFormat(function(d) {
            return (d % 5 !== 0) ? '': d;
        });

        var xAxisRight = d3.svg.axis()
          .scale(_this.xScale)
          .orient('bottom')
          .ticks(5)
          .tickSize(-this.height);

        var xAxisLeft = d3.svg.axis()
          .scale(_this.xScale.copy().range([pointA, 0]))
          .orient('bottom')
          .ticks(5)
          .tickSize(-this.height);

        svg.append('g')
          .attr('class', 'axis y left')
          .attr('transform', translation(pointA, 0))
          .call(yAxis);


        svg.append('g')
          .attr('class', 'axis x left')
          .attr('transform', translation(0, this.height))
          .call(xAxisLeft);

        svg.append('g')
          .attr('class', 'axis x right')
          .attr('transform', translation(pointB, this.height))
          .call(xAxisRight);

        // LEGEND

        svg.append("rect")
            .attr('class', 'female')
            .attr("x", 10)
            .attr("y", 0)
            .attr("width", 10)
            .attr("height", 10);            

        svg.append("text")
            .attr("x", 30)             
            .attr("y", 10 )
            .text('weiblich');

        svg.append("rect")
            .attr('class', 'male')
            .attr("x", 10)
            .attr("y", 30)
            .attr("width", 10)
            .attr("height", 10);

        svg.append("text")
            .attr("x", 30)             
            .attr("y", 40 )
            .text('männlich');

        function translation(x,y) {
          return 'translate(' + x + ',' + y + ')';
        }

        if(callback)
            callback(this.el.innerHTML);
    };
    
    this.changeData = function(data){
        this.data = data;
        var _this = this;
        var title = data.jahr;
        d3.select('.title').text(title);

        //update bars
        d3.select('.female').selectAll("g")
            .data(data.alter_weiblich)
            .select("rect").attr("width", _this.xScale);    

        d3.select('.male').selectAll("g")
            .data(data.alter_maennlich)
            .select("rect").attr("width", _this.xScale);    
    }    
};
//supress warning on client side, exports only needed serverside
if (typeof exports !== 'undefined') 
    exports.init = AgeTree;
