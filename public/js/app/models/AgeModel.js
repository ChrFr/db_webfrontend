define(["backbone"],

    function(Backbone) {

        var AgeModel = Backbone.Model.extend({
            
            url: 'db/gemeinden/{rs}/bevoelkerungsprognose/{year}',

            initialize: function(options) {
                this.url = this.url.replace('{rs}', options.rs)
                                   .replace('{year}', options.year);
                if(typeof(options.female) !== 'undefined')
                    this.url += '?weiblich=' + options.female.toString();
                                   
            },
        });
        return AgeModel;
    }
);