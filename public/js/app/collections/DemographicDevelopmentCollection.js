define(["backbone","models/DemographicDevelopmentModel"],

    function(Backbone, DemographicDevelopmentModel) {

        // Creates a new Backbone Collection class object
        var DemographicDevelopmentCollection = Backbone.Collection.extend({

            // Tells the Backbone Collection that all of it's models will be of type Model (listed up top as a dependency)
            model: DemographicDevelopmentModel,
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/',

            initialize: function(options){ 
                this.progId = options.progId;                
                this.rs = options.rs;
                this.url = this.url.replace('{progId}', this.progId);
            },    
            
            fetchDetails: function(options){
                if(!options.rs)
                    options.error(null, 'rs is missing')
                var ddModel = this.find(function(item){
                    return item.get('rs') === options.rs;
                });              
                ddModel.setURL(this.progId, options.rs);
                ddModel.fetch({
                    success: function(model){                        
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
                        options.success(model);
                    },
                    error: options.error});
            }
        });
        return DemographicDevelopmentCollection;
    }
);