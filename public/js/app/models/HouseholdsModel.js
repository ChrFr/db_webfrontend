/*
 Author: Christoph Franke
 Publisher: GGR
 */

define(["app", "backbone", 'models/GenericPrognosisDataModel'],
  function (app, Backbone, GenericPrognosisDataModel) {

    var HouseholdsModel = GenericPrognosisDataModel.extend({

      //Override
      //calculate additional data after successful fetch from server
      fetch: function (options) {
        options || (options = {});
        var callback = options.success;

        options.success = function (model, res, opt) {
          var data = model.get('data');
          var maxSize = 0;

          // preprocess other characteristic numbers and round to defined decimals
          _.each(data, function (item) {
            
            maxSize = Math.max(maxSize, item.hhgroessen.length);
            var hhsizes = item.hhgroessen,
                sumHouseholds = 0,
                roundingFactor = Math.pow(10, app.DECIMALS);

            for (var i = 0; i < hhsizes.length; i++) {
              hhsizes[i] = Math.round(hhsizes[i] * roundingFactor) / roundingFactor;
              sumHouseholds += hhsizes[i];
            };
            item.sumHouseholds = sumHouseholds;
          });
          model.set('maxSize', maxSize);
          if (callback)
            callback(model, res, opt);
        };

        return Backbone.Model.prototype.fetch.call(this, options);
      },            
    });
    return HouseholdsModel;
  }
);