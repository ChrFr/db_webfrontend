define(["backbone"],

    function(Backbone) {

        var DemographicDevelopmentModel = Backbone.Model.extend({
            idAttribute: 'rs',
            
            urlRoot: 'api/prognosen/{progId}/bevoelkerungsprognose/',

            initialize: function(options) {
                this.setURL(options.progId);
            },
            
            setURL: function(progId) {
                if(progId)
                    this.urlRoot = this.urlRoot.replace('{progId}', progId);
            },
            
            csvUrl: function(year){
                var url = this.url + '/csv'
                if(year)
                    url += '?year=' + year;
                return url
            },
            
            pngUrl: function(year, maxX){
                var url = this.url + '/png?year=' + year;
                if(maxX)
                    url += '&maxX=' + maxX;
                return url
            }
        });
        return DemographicDevelopmentModel;
    }
);