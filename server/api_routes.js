module.exports = function(){
    var express = require('express'),
        app = module.exports = express(),
        child_proc = require('child_process');
    
    
    //Mapping taken from https://github.com/visionmedia/express/blob/master/examples/route-map/index.js

    app.map = function(a, route){
      route = route || '';
      for (var key in a) {
        switch (typeof a[key]) {
          // { '/path': { ... }}
          case 'object':
            app.map(a[key], route + key);
            break;
          // get: function(){ ... }
          case 'function':
            app[key](route, a[key]);
            break;
        }
      }
    };
    
    var pg = require("pg");
    
    var config = require('./config').dbconfig;

    //var client = new pg.Client(conString);
    //client.connect();
    
    function pgQuery(queryString, parameters, callback){
        pg.connect(config, function(err, client, done) {
            if(err) {
                return callback([]);
            }
            client.query(queryString, parameters, function(err, result) {
                //call `done()` to release the client back to the pool
                done();
                if(err) {
                    return callback([]);
                }
                return callback(result.rows);
            });
        });
    }

    var gemeinden = {
        list: function(req, res){
          pgQuery('SELECT * FROM gemeinden', [], function(result){
              return res.status(200).send(result);
          });
        },

        //return all project specific segments and projects base attributes
        get: function(req, res){ 
            pgQuery('SELECT * FROM gemeinden WHERE rs=$1', [req.params.rs], 
            function(result){
                //merge the project object with the borders from db                
                if (result.length === 0)
                    return res.sendStatus(404);
                return res.status(200).send(result[0]);
            });
        }
    };
    
    var bevoelkerungsprognose = {
        list: function(req, res){
          pgQuery('SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1', [req.params.rs], function(result){
              //var ret = [];
              //result.forEach(function(entry){
              //    ret.push(entry.jahr);
              //});
              return res.status(200).send(result);
          });
        },
        
        getYear: function(req, res, onSuccess){            
            var params = [req.params.rs, req.params.jahr];
            var query = 'SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1 AND jahr=$2';    
            /**if(req.query.weiblich){  
                params.push(req.query.weiblich);
                query += 'AND weiblich=$3'
            }*/
            pgQuery(query, params, 
            function(result){
                //merge the project object with the borders from db                
                if (result.length === 0)
                    return res.sendStatus(404);
               // if(req.query.weiblich)
                //    result = result[0];
                return onSuccess(result[0]);
            });
        },

        //sends plain JSON
        getYearJSON: function(req, res){             
            bevoelkerungsprognose.getYear(req, res, function(result){
                res.status(200).send(result)
            });
        },
        
        //converts to SVG
        getYearSvg: function(req, res){
            var mod = require('./visualizations/renderAgeTree');
                   
            bevoelkerungsprognose.getYear(req, res, function(result){
                mod.render(result, 800, 400, function(svg){
                    return res.status(200).send(svg);
                }); 
            });
        },
        
        //converts to PNG
        getYearPng: function(req, res){
            var mod = require('./visualizations/renderAgeTree');       
            var convert = child_proc.spawn("convert", ["svg:", "png:-"]);
            res.writeHeader(200, {'Content-Type': 'image/png'});
            convert.stdout.on('data', function (data) {
              res.write(data);
            });
            convert.on('exit', function(code) {
              res.end();
            });
            bevoelkerungsprognose.getYear(req, res, function(result){
                mod.render(result, 800, 400, function(svg){              
                    convert.stdin.write(svg);
                    convert.stdin.end();
                }); 
            });
        }
        
    };
    
    var session = {
        
        getStatus: function(req, res){
            if(req.session.user){
              res.send(200, {
                  auth : true,
                  user : req.session.user
                });
            }else{
                res.send(401, {
                    auth : false,
                    csrf : req.session._csrf
                });
            }
        },

        login: function(req, res){
            var name = req.body.name;
            var password = req.body.password;
            pgQuery("SELECT * from users WHERE name=$1", [name],
            function(result){
                for (var i=0; i < result.length; i++) {
                    if(result[i].password === password){    
                        res.statusCode = 200;
                        req.session.user = {name: result[i].name,
                                            email: result[i].email,
                                            id: result[i].id,
                                            superuser: result[i].superuser};
                        return res.json({
                            auth : true,
                            user : req.session.user
                        });
                    }
                }; 
                req.session.user = null;
                res.statusCode = 400;
                return res.end('invalid user or password');             
            });
        },

        logout: function(req, res){ 
            req.session.user = null;
            res.send(200);
        }
    };
   
    app.map({
        
        '/session': {
            get: session.getStatus,
            delete: session.logout,   
            post: session.login
        },
        '/gemeinden': {
            get: gemeinden.list,
            '/:rs': {
                get: gemeinden.get,
                '/bevoelkerungsprognose': {
                    get: bevoelkerungsprognose.list,
                    '/:jahr': {
                        get: bevoelkerungsprognose.getYearJSON,
                        '/svg': {
                            get: bevoelkerungsprognose.getYearSvg
                        },
                        '/png': {
                            get: bevoelkerungsprognose.getYearPng
                        }
                    }
                }
            }
        }
    });
    
    return app;
}();