define(["backbone", "models/DDModel"],

    function(Backbone, DDModel) {

        var DemographicDevelopmentAggregate = DDModel.extend({
            idAttribute: 'rs',
            
            urlRoot: null,
            url: 'api/prognosen/{progId}/bevoelkerungsprognose/aggregiert?{rs}',

            initialize: function(options) {
                this.setURL(options.progId, options.rs);
                this.set('name', options.name);
            },
            
            setURL: function(progId, rs) {
                if(progId)
                    this.url = this.url.replace('{progId}', progId);
                if(rs)
                    this.url = this.url.replace('{rs}', 'rs[]=' + rs.join('&rs[]='));
            }
        });
        return DemographicDevelopmentAggregate;
    }
);