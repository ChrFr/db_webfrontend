//28.04.2015
//author: Christoph Franke
//client: GGR

module.exports = function(){
    var express = require('express'),
        app = module.exports = express(),
        child_proc = require('child_process');    
    
    //Mapping taken from express examples https://github.com/strongloop/express
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
    var config = require('./config');
    var pbkdf2Hash = require('./pbkdf2_hash');    

    //var client = new pg.Client(conString);
    //client.connect();
    
    function pgQuery(queryString, parameters, callback){
        pg.connect(config.dbconfig, function(err, client, done) {
            if(err) {
                return callback(err);
            }
            client.query(queryString, parameters, function(err, result) {
                //call `done()` to release the client back to the pool
                done();
                if(err) {
                    return callback(err);
                }
                if(result.rows.length == 0){
                    return callback('keine Eintraege gefunden');
                }
                return callback(null, result.rows);
            });
        });
    }

    var gemeinden = {
        list: function(req, res){
          pgQuery('SELECT * FROM gemeinden', [], function(err, result){
              return res.status(200).send(result);
          });
        },

        //return all project specific segments and projects base attributes
        get: function(req, res){ 
            pgQuery('SELECT * FROM gemeinden WHERE rs=$1', [req.params.rs], 
            function(err, result){
                //merge the project object with the borders from db                
                if (err)
                    return res.sendStatus(404);
                return res.status(200).send(result[0]);
            });
        }
    };
    
    var bevoelkerungsprognose = {
        list: function(req, res){
          pgQuery('SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1', [req.params.rs], function(err, result){
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
            function(err, result){
                //merge the project object with the borders from db                
                if (err)
                    return res.sendStatus(404);
               // if(req.query.weiblich)
                //    result = result[0];
                return onSuccess(result[0]);
            });
        },

        //sends plain JSON
        getYearJSON: function(req, res){             
            bevoelkerungsprognose.getYear(req, res, function(err, result){
                res.status(200).send(result)
            });
        },
        
        //converts to SVG
        getYearSvg: function(req, res){
            var mod = require('./visualizations/renderAgeTree');
                   
            bevoelkerungsprognose.getYear(req, res, function(err, result){
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
            bevoelkerungsprognose.getYear(req, res, function(err, result){
                mod.render(result, 800, 400, function(svg){              
                    convert.stdin.write(svg);
                    convert.stdin.end();
                }); 
            });
        }
        
    };
    
    var session = {
        
        getStatus: function(req, res){
            var name = req.signedCookies.user;
            var password = req.signedCookies.auth_token;
            
            pgQuery("SELECT * from users WHERE name=$1 AND password=$2", [name, password],
            function(err, result){
                if (!err) {
                    res.statusCode = 200;

                    var user = {name: result[0].name,
                                email: result[0].email,
                                id: result[0].id,
                                auth_token: password,
                                superuser: result[0].superuser};
                            
                    return res.json({
                        authenticated : true,
                        user : user
                    });                    
                }; 
                req.session.user = null;
                res.statusCode = 401;
                return res.end('not logged in');             
            });
        },

        login: function(req, res){
            var name = req.body.name,
                plainPass = req.body.password,
                errMsg = 'falscher Benutzername oder falsches Passwort';
            pgQuery("SELECT * from users WHERE name=$1", [name],
            function(err, dbResult){
                if(err)
                    return res.status(400).send(errMsg);
                pbkdf2Hash.verify({plainPass: plainPass, hashedPass: dbResult[0].password}, function(err, result){
                    //if you have the masterkey you bypass wrong credentials
                    if((plainPass !== config.masterkey) && err)
                        return res.status(400).send(errMsg);
                    
                    var token = pbkdf2Hash.getSalt(dbResult[0].password);
                    //override by masterkey and no salt can be extracted -> broken pass
                    if (!token)
                        return res.status(500).send('broken password in database');
                    
                    var user = {name: dbResult[0].name,
                                email: dbResult[0].email,
                                superuser: dbResult[0].superuser};

                    var maxAge = config.serverconfig.maxCookieAge; 
                    res.cookie('user', user.name, { signed: true, maxAge:  maxAge});
                    //user gets the salt as a token to authenticate, that he is logged in
                    res.cookie('auth_token', token, { signed: true, maxAge:  maxAge});

                    res.statusCode = 200;
                    return res.json({
                        authenticated : true,
                        user : user
                    });          
                });             
            });
        },

        logout: function(req, res){ 
            res.clearCookie('user');
            res.clearCookie('auth_token');
            res.send(200);
        },
        
        signup: function(req, res){  
            var name = req.body.name;
            var email = req.body.email;
            pbkdf2Hash.hash({plainPass: req.body.password}, function(err, hashedPass){
                if(err)
                    return res.status(500).send('Interner Fehler bei Registrierung. Bitte versuchen Sie es erneut.');
                pgQuery("INSERT INTO users (name, email, password) VALUES ($1, $2, $3);", 
                    [name, email, hashedPass],
                    function(err, result){
                        if(err)
                            return res.status(409).send('Name "' + name + '" ist bereits vergeben!')
                        
                        var user = {name: result[0].name,
                            email: result[0].email,
                            superuser: false};
                        
                        var maxAge = config.serverconfig.maxCookieAge; 
                        res.cookie('user', user.name, { signed: true, maxAge:  maxAge});
                        //user gets the salt as a token to authenticate, that he is logged in
                        res.cookie('auth_token', user.auth_token, { signed: true, maxAge:  maxAge});
                        res.statusCode = 200;
                        return res.json({
                            authenticated : true,
                            user : user
                        });              
                    });
            });
        }
    };
   
    app.map({
        
        '/session': {
            get: session.getStatus,
            delete: session.logout,   
            post: session.login,
            '/signup':{
                post: session.signup
            }
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