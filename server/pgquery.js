//28.04.2015
//author: Christoph Franke
//client: GGR

var pg = require("pg");   
var config = require('./config');

module.exports = {
    pgQuery: function(queryString, parameters, callback){
        pg.connect(config.dbconfig, function(err, client, done) {
            if(err) {
                console.log(err);
                return callback(err);
            }
            client.query(queryString, parameters, function(err, result) {
                //call `done()` to release the client back to the pool
                
            console.log(queryString)
            console.log(parameters)
                done();
                if(err) {
                    return callback(err);
                }
                return callback(null, result.rows);
            });
        });
    }
}
