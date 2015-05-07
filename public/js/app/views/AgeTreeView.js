define(["backbone", "d3", "d3slider"],

    function(Backbone, d3, d3slider){
        var AgeTreeView = Backbone.View.extend({
            el: "mainFrame",
            
            initialize: function(options) {      
                var _this = this;
                
                this.width = options.width;
                this.height = options.height;
                this.data = options.data;
                
                //get minima and maxima
                this.maxAge = this.maxNumber = 0;     
                this.minYear = this.data[0].jahr;
                this.maxYear = this.data[this.data.length-1].jahr;

                _.each(options.data, function(item){
                    var femaleAges = item.alter_weiblich,
                        maleAges = item.alter_maennlich;
                    var max = Math.max(femaleAges.length, maleAges.length);
                    if (_this.maxAge < max) _this.maxAge = max;
                    max = Math.max(d3.max(femaleAges), d3.max(maleAges))
                    if (_this.maxNumber < max) _this.maxNumber = max;
                });
                
                this.render();
                                
            },

            render: function() {
                
                var yearStep = Math.floor((this.maxYear - this.minYear) / 4);
                var _this = this;
                
                var slider = d3slider()
                    .axis(
                        d3.svg.axis().orient("down")
                        .tickValues([_this.minYear, _this.minYear + yearStep, _this.minYear + yearStep * 2, _this.minYear + yearStep * 3, _this.maxYear])
                        .tickFormat(d3.format("d"))
                        .ticks(_this.maxYear - _this.minYear)
                        )
                    .min(_this.minYear)
                    .max(_this.maxYear)
                    .step(1);
                
                var sliderDiv = document.createElement("div");
                sliderDiv.setAttribute("id", "slider");
                sliderDiv.style.width = this.width+"px";  
                
                
                var femaleAges = this.data[0].alter_weiblich;
                var maleAges = this.data[0].alter_maennlich;
                
                //var region = this.model.get('rs');
                var year = this.data[0].jahr;
                var title = "Bevölkerungsentwicklung " + year;
                
                var margin = {
                  top: 30,
                  right: 20,
                  bottom: 24,
                  left: 20,
                  middle: 0
                };
                
                var width = this.width - margin.left - margin.right,
                    height = this.height - margin.top - margin.bottom;
            
                var regionWidth = width/2 - margin.middle;
                var pointA = regionWidth,
                    pointB = width - regionWidth;
            
                var barHeight = (height-margin.bottom)/this.maxAge;
            
                // CREATE SVG
                var svg = d3.select(this.el).append('svg')
                  .attr('width', margin.left + width + margin.right)
                  .attr('height', margin.top + height + margin.bottom)
                  .append('g')
                  .attr('transform', translation(margin.left, margin.top));          
                  
                this.el.appendChild(sliderDiv);
                d3.select('#slider').call(slider);
                
                slider.on("slide", function(evt, value) {
                    evt.stopPropagation();
                    _this.changeYear(value);
    		});
        
                // TITLE
                
                svg.append("text")
                    .attr('class', 'title')
                    .attr("x", (width / 2))             
                    .attr("y", 0 - (margin.top / 2))
                    .attr("text-anchor", "middle")  
                    .text(title);
                // SET UP SCALES

                this.xScale = d3.scale.linear()
                  .domain([0, _this.maxNumber])
                  .range([0, regionWidth])
                  .nice();

                this.yScale = d3.scale.linear()
                  .domain([0, _this.maxAge])
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
                    .attr("transform", function(d, i) { return translation(0, (_this.maxAge - i) * barHeight - barHeight/2); });
            
                rightBars.append("rect")
                    .attr("width", this.xScale)
                    .attr("height", barHeight - 1);            
                
                var leftBars = leftBarGroup.selectAll("g")
                    .data(maleAges)
                    .enter().append("g")
                    .attr("transform", function(d, i) { return translation(0, (_this.maxAge - i) * barHeight - barHeight/2); });
            
                leftBars.append("rect")
                    .attr("width", _this.xScale)
                    .attr("height", barHeight - 1);
            
                
                // SET UP AXES
                var yAxis = d3.svg.axis()
                  .scale(_this.yScale)
                  .orient('left')
                  .ticks(_this.maxAge)
                  .tickSize(2,0)
                  .tickPadding(margin.middle);
          
                yAxis.tickFormat(function(d) {
                    return (d % 5 !== 0) ? '': d;
                });

                var xAxisRight = d3.svg.axis()
                  .scale(_this.xScale)
                  .orient('bottom')
                  .ticks(5)
                  .tickSize(-height);

                var xAxisLeft = d3.svg.axis()
                  .scale(_this.xScale.copy().range([pointA, 0]))
                  .orient('bottom')
                  .ticks(5)
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
                return this;
            },
            
            changeYear: function(year){           
                var _this = this;
                
                var title = "Bevölkerungsentwicklung " + year;
                d3.select('.title').text(title);
                var yearData = this.data[this.data.length - (this.maxYear - year -1)];

                //update bars
                d3.select('.female').selectAll("g")
                    .data(yearData.alter_weiblich)
                    .select("rect").attr("width", _this.xScale);    
            
                d3.select('.male').selectAll("g")
                    .data(yearData.alter_maennlich)
                    .select("rect").attr("width", _this.xScale);      
                
            },
            
            close: function () {
                this.unbind();
                this.remove();
            }

        });
        
        // Returns the View class
        return AgeTreeView;
        
    }

);