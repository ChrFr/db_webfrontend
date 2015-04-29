define(["backbone"],

    function(Backbone) {

        var DemographicDevelopmentModel = Backbone.Model.extend({
            
            url: 'api/prognosen/{progId}/bevoelkerungsprognose',

            initialize: function(options) {
                this.url = this.url.replace('{progId}', options.prognosisId);
            },
        });
        return DemographicDevelopmentModel;
    }
);