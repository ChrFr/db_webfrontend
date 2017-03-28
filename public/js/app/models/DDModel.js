/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["app", "backbone"],

    function(app, Backbone) {

        var DemographicDevelopmentModel = Backbone.Model.extend({
            idAttribute: 'rs',
            
            urlRoot: 'api/prognosen/{progId}/bevoelkerungsprognose/',

            initialize: function(options) {
                this.setURL(options.progId);
            },
            
            //Override
            //calculate additional data after successful fetch from server
            fetch: function(options){
                options || (options = {});
                var callback = options.success;
                
                options.success = function(model, res, opt){
                    var data = model.get('data');

                    //preset minima and maxima for easier use in the views
                    model.set('minYear', data[0].jahr); 
                    model.set('maxYear', data[data.length-1].jahr); 
                    var maxAge, maxNumber;
                    var maxAge = maxNumber = 0;

                    // preprocess other characteristic numbers and round to defined decimals
                    _.each(data, function(item){
                        var femaleAges = item.alter_weiblich,
                            maleAges = item.alter_maennlich,
                            sumFemale = 0, 
                            sumMale = 0,
                            roundingFactor = Math.pow(10, app.DECIMALS);
                            
                        for(var i = 0; i < femaleAges.length; i++){
                          femaleAges[i] = Math.round(femaleAges[i] * roundingFactor) / roundingFactor;
                          sumFemale += femaleAges[i];
                        };
                        item.sumFemale = sumFemale;
                        
                        for(var i = 0; i < maleAges.length; i++){
                          maleAges[i] = Math.round(maleAges[i] * roundingFactor) / roundingFactor;
                          sumMale += maleAges[i];
                        };
                        item.sumMale = sumMale;

                        // same as above with reduce and without rounding
                        //item.sumFemale = femaleAges.reduce(function(sum,e){return sum + e;});                            
                        //item.sumMale = maleAges.reduce(function(sum,e){return sum + e;});

                        var max = Math.max(femaleAges.length, maleAges.length);
                        if (maxAge < max) maxAge = max;
                        max = Math.max(Math.max.apply(null, femaleAges), 
                                       Math.max.apply(null, maleAges));
                        if (maxNumber < max) maxNumber = max;
                    });

                    model.set('maxAge', maxAge);
                    model.set('maxNumber', maxNumber);  
                    //call given callback
                    if(callback)
                        callback(model, res, opt);
                };

                return Backbone.Model.prototype.fetch.call(this, options);
            },            
            
            setURL: function(progId) {
                if(progId)
                    this.urlRoot = this.urlRoot.replace('{progId}', progId);
            }
            /*
            serverside rendering is deactivated by now! rendered clientside
            
            download: function(url, mimeType, fn){                
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'arraybuffer';

                xhr.onload = function(e) {
                  if (this.status == 200) {
                    var blob = new Blob([xhr.response], {type: mimeType});
                    saveAs(blob, fn);
                  }
                };

                xhr.setRequestHeader("id", app.session.get('user').id );
                xhr.setRequestHeader("token", app.session.get('token'));
                xhr.send();
            },
            
            downloadCsv: function(year, fn){
                var url = this.urlRoot || this.url;
                url += this.get('rs') + '/csv';
                if(year)
                    url += '?year=' + year;
                this.download(url, "text/csv", fn ||  this.get('rs') + "-" + year + ".png");
            },
            
            downloadAgeTreePng: function(year, maxX, fn){
                var url = this.urlRoot || this.url;
                url += this.get('rs') + '/png?year=' + year;
                if(maxX)
                    url += '&maxX=' + maxX;
                
                this.download(url, "image/png", fn ||  this.get('rs') + "-" + year + ".png");
            }
            */
        });
        return DemographicDevelopmentModel;
    }
);