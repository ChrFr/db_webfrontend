define(["backbone"],

    function(Backbone) {

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

                    _.each(data, function(item){
                        var femaleAges = item.alter_weiblich,
                            maleAges = item.alter_maennlich;

                        item.sumFemale = femaleAges.reduce(function(sum,e){return sum + e});                            
                        item.sumMale = maleAges.reduce(function(sum,e){return sum + e});

                        var max = Math.max(femaleAges.length, maleAges.length);
                        if (maxAge < max) maxAge = max;
                        max = Math.max(Math.max.apply(null, femaleAges), 
                                       Math.max.apply(null, maleAges))
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
            },
            
            csvUrl: function(year){
                var url = this.urlRoot || this.url
                url += this.get('rs') + '/csv'
                if(year)
                    url += '?year=' + year;
                return url
            },
            
            pngUrl: function(year, maxX){
                var url = this.urlRoot || this.url
                url += this.get('rs') + '/png?year=' + year;
                if(maxX)
                    url += '&maxX=' + maxX;
                return url
            }
        });
        return DemographicDevelopmentModel;
    }
);