define(["backbone", "d3", "d3slider"],

    function(Backbone, d3, d3slider){
        var AgeTreeView = Backbone.View.extend({
            el: "mainFrame",
            
            initialize: function(options) { 
                this.width = options.width;
                this.height = options.height;
                this.data = options.data;
                this.render();
                                
            },

            render: function() {
                var slider = d3slider().axis(true).min(2000).max(2100).step(5);
                d3.select('#slider').call(slider);
                
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
                    return (d % 5 !== 0) ? '': d;
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
            
            close: function () {
                this.unbind();
                this.remove();
            }

        });

        // Returns the View class
        return AgeTreeView;

    }

);