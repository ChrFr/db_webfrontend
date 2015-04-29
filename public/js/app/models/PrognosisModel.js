define(["backbone"],

    function(Backbone) {

        var PrognosisModel = Backbone.Model.extend({
            
            url: 'api/prognosen/{prognosis}',

            initialize: function(options) {
                this.url = this.url.replace('{prognosis}', options.prognosisId);
            },
        });
        return PrognosisModel;
    }
);