define(["backbone"],

    function(Backbone) {

        var DemographicDevelopmentModel = Backbone.Model.extend({
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/{rs}',

            initialize: function(options) {
                this.setURL(options.progId, options.rs);
            },
            
            setURL: function(progId, rs) {
                if(progId)
                    this.url = this.url.replace('{progId}', progId);
                if(rs)
                    this.url = this.url.replace('{rs}', rs);
            },
            
            csvUrl: function(year){
                var url = this.url + '/csv'
                if(year)
                    url += '?year=' + year;
                return url
            }
        });
        return DemographicDevelopmentModel;
    }
);