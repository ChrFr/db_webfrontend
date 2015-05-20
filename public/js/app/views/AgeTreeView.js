define(["backbone", "d3", "d3slider", './visuals/AgeTree'],

    function(Backbone, d3, d3slider){
        var AgeTreeView = Backbone.View.extend({
            el: "mainFrame",
            
            initialize: function(options) {      
                var _this = this;
                
                this.width = options.width;
                this.height = options.height;
                this.data = this.model.get('data');
                
                //get minima and maxima
                this.maxAge = this.maxNumber = 0;     
                this.minYear = this.data[0].jahr;
                this.maxYear = this.data[this.data.length-1].jahr;

                _.each(this.data, function(item){
                    var femaleAges = item.alter_weiblich,
                        maleAges = item.alter_maennlich;
                    var max = Math.max(femaleAges.length, maleAges.length);
                    if (_this.maxAge < max) _this.maxAge = max;
                    max = Math.max(d3.max(femaleAges), d3.max(maleAges))
                    if (_this.maxNumber < max) _this.maxNumber = max;
                });
                
                this.playing = false;
                this.render();
                                
            },
            
            events: {
                'click #play': 'play',
                'click #csvAll': 'openAllYearsCsvTab',
                'click #csvCurrent': 'openCurrentYearCsvTab',
                'click #pngCurrent': 'openCurrentYearPngTab'
            },

            render: function() {
                
                var yearStep = Math.floor((this.maxYear - this.minYear) / 4);
                var _this = this;              
                
                var margin = {
                  top: 30,
                  right: 20,
                  bottom: 24,
                  left: 20,
                  middle: 0
                };
                
                var width = this.width - margin.left - margin.right,
                    height = this.height - margin.top - margin.bottom;            
                
                this.ageTree = new AgeTree({
                    el: this.el,
                    data: this.data[0], 
                    width: width, 
                    height: height,
                    maxY: this.maxAge,
                    maxX: this.maxNumber
                });
                this.ageTree.render();                       
                
                // PLAY BUTTON
                var playBtn = document.createElement("button");
                playBtn.setAttribute("id", "play"); 
                playBtn.innerHTML = "Play";
                this.el.appendChild(playBtn);
                
                // DOWNLOAD BUTTONS
                var csvBtn = document.createElement("button");
                csvBtn.setAttribute("id", "csvAll"); 
                csvBtn.innerHTML = "Csv Alle";
                this.el.appendChild(csvBtn);
                
                var csvCBtn = document.createElement("button");
                csvCBtn.setAttribute("id", "csvCurrent"); 
                csvCBtn.innerHTML = "Csv Jahr";
                this.el.appendChild(csvCBtn);                   
                
                var pngBtn = document.createElement("button");
                pngBtn.setAttribute("id", "pngCurrent"); 
                pngBtn.innerHTML = "PNG Jahr";
                this.el.appendChild(pngBtn);   
                  
                // SLIDER                
                this.slider = d3slider()
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
                this.el.appendChild(sliderDiv);
                d3.select('#slider').call(this.slider);
                
                // update svg on slide
                this.slider.on("slide", function(evt, value) {
                    evt.stopPropagation();
                    _this.changeYear(value);
    		});
                return this;
            },
            
            changeYear: function(year){    
                var yearData = this.data[this.data.length - 1 - (this.maxYear - year)];       
                this.ageTree.changeData(yearData);
            },
            
            play: function(event){
                var _this = this;
                
                var stop = function(){                    
                    event.target.innerHTML = 'Play';
                    clearInterval(_this.timerId);
                }
                
                this.playing = !this.playing;
                if(this.playing){
                    event.target.innerHTML = 'Stop';
                    this.timerId = setInterval(function(){
                        var currentYear = _this.slider.value();
                        if(currentYear == _this.maxYear){ 
                            stop();
                        }
                        else{
                            _this.slider.value(currentYear + 1);
                            _this.changeYear(currentYear + 1);
                        }
                    }, 1000);
                }
                else
                    stop()
            },            
            
            openAllYearsCsvTab: function() {
                var win = window.open(this.model.csvUrl(), '_blank');
                win.focus();
            },
            
            openCurrentYearCsvTab: function() {
                var currentYear = this.slider.value();
                var win = window.open(this.model.csvUrl(currentYear), '_blank');
                win.focus();
            },
            
            openCurrentYearPngTab: function() {
                var currentYear = this.slider.value();
                var win = window.open(this.model.pngUrl(currentYear), '_blank');
                win.focus();
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