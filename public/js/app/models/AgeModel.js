define(["backbone"],

    function(Backbone) {

        var AgeModel = Backbone.Model.extend({
            
            url: 'api/gemeinden/{rs}/bevoelkerungsprognose/{year}',

            initialize: function(options) {
                this.url = this.url.replace('{rs}', options.rs)
                                   .replace('{year}', options.year);
            },
        });
        return AgeModel;
    }
);