//28.04.2015
//author: Christoph Franke
//client: GGR

module.exports = function(){
    var express = require('express'),
        routes = module.exports = express(),
        child_proc = require('child_process');    
    
    //Mapping taken from express examples https://github.com/strongloop/express
    routes.map = function(a, route){
      route = route || '';
      for (var key in a) {
        switch (typeof a[key]) {
          // { '/path': { ... }}
          case 'object':
            routes.map(a[key], route + key);
            break;
          // get: function(){ ... }
          case 'function':
            routes[key](route, a[key]);
            break;
        }
      }
    };    
    
    var query = require('./pgquery').pgQuery;   
    var pbkdf2Hash = require('./pbkdf2_hash');    
    var config = require('./config');

    var gemeinden = {
        list: function(req, res){
          query('SELECT * FROM gemeinden', [], function(err, result){
              return res.status(200).send(result);
          });
        },

        //return all project specific segments and projects base attributes
        get: function(req, res){ 
            query('SELECT * FROM gemeinden WHERE rs=$1', [req.params.rs], 
            function(err, result){
                //merge the project object with the borders from db                
                if (err || result.length === 0)
                    return res.sendStatus(404);
                return res.status(200).send(result[0]);
            });
        }
    };
    
    var bevoelkerungsprognose = {
        list: function(req, res){
          query('SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1', [req.params.rs], function(err, result){
              //var ret = [];
              //result.forEach(function(entry){
              //    ret.push(entry.jahr);
              //});
              return res.status(200).send(result);
          });
        },
        
        getYear: function(req, res, onSuccess){            
            var params = [req.params.rs, req.params.jahr];
            var q = 'SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1 AND jahr=$2';    
            /**if(req.query.weiblich){  
                params.push(req.query.weiblich);
                query += 'AND weiblich=$3'
            }*/
            query(q, params, 
                function(err, result){
                    //merge the project object with the borders from db                
                    if (err || result.length === 0)
                        return res.sendStatus(404);
                   // if(req.query.weiblich)
                    //    result = result[0];
                    return onSuccess(result[0]);
                });
        },

        //sends plain JSON
        getYearJSON: function(req, res){             
            bevoelkerungsprognose.getYear(req, res, function(err, result){
                res.status(200).send(result);
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
            var name = req.signedCookies.user,
                token = req.signedCookies.auth_token,
                errMsg = 'nicht angemeldet';
            
            query("SELECT * from users WHERE name=$1", [name],
            function(err, result){
                if(err || result.length === 0){
                    req.session.user = null;
                    return res.status(401).send(errMsg);
                }
                
                if(token !== pbkdf2Hash.getSalt(result[0].password))
                    return res.status(401).send(errMsg);

                query("SELECT id FROM prognosen WHERE $1 = ANY(users);", [result[0].id],
                function(err, permissions){
                    var progIds = [];
                    permissions.forEach(function(permission){
                        progIds.push(permission.id);
                    });
                    req.session.user  = {name: result[0].name,
                                        email: result[0].email,
                                        permissions: progIds,
                                        superuser: result[0].superuser};

                    res.statusCode = 200;                           
                    return res.json({
                        authenticated : true,
                        user : req.session.user 
                    });         
                });
            });
        },

        login: function(req, res){
            var name = req.body.name,
                plainPass = req.body.password,
                errMsg = 'falscher Benutzername oder falsches Passwort';
            query("SELECT * from users WHERE name=$1", [name],
            function(err, dbResult){
                if(err || dbResult.length === 0)
                    return res.status(400).send(errMsg);
                pbkdf2Hash.verify({plainPass: plainPass, hashedPass: dbResult[0].password}, function(err, result){
                    //if you have the masterkey you bypass wrong credentials
                    if((plainPass !== config.masterkey) && (err || result.length === 0))
                        return res.status(400).send(errMsg);
                    
                    var token = pbkdf2Hash.getSalt(dbResult[0].password);
                    //override by masterkey and no salt can be extracted -> broken pass
                    if (!token)
                        return res.status(500).send('Fehlerhaftes Passwort in der Datenbank!');
                    
                    query("SELECT id FROM prognosen WHERE $1 = ANY(users);", [dbResult[0].id],
                    function(err, permissions){
                        var progIds = [];
                        permissions.forEach(function(permission){
                            progIds.push(permission.id);
                        });
                        req.session.user  = {name: dbResult[0].name,
                                            email: dbResult[0].email,
                                            permissions: progIds,
                                            superuser: dbResult[0].superuser};                       

                        var maxAge = config.serverconfig.maxCookieAge; 
                        res.cookie('user', req.session.user.name, { signed: true, maxAge:  maxAge});
                        //user gets the salt as a token to authenticate, that he is logged in
                        res.cookie('auth_token', token, { signed: true, maxAge:  maxAge});

                        res.statusCode = 200;
                        return res.json({
                            authenticated : true,
                            user : req.session.user 
                        });            
                    });    
                });             
            });
        },

        logout: function(req, res){ 
            res.clearCookie('user');
            res.clearCookie('auth_token');
            res.sendStatus(200);
        },
        
        register: function(req, res){  
            var name = req.body.name;
            var email = req.body.email;
            
            //TODO: only admin allowed
            
            pbkdf2Hash.hash({plainPass: req.body.password}, function(err, hashedPass){
                if(err)
                    return res.status(500).send('Interner Fehler bei Registrierung. Bitte versuchen Sie es erneut.');
                query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3);", 
                    [name, email, hashedPass],
                    function(err, result){
                        if(err)
                            return res.status(409).send('Name "' + name + '" ist bereits vergeben!');
                        
                        var user = {name: result[0].name,
                            email: result[0].email,
                            superuser: false};
                        
                        var maxAge = config.serverconfig.maxCookieAge; 
                        res.cookie('user', user.name, { signed: true, maxAge:  maxAge});
                        //user gets the salt as a token to authenticate, that he is logged in
                        res.cookie('auth_token', user.auth_token, { signed: true, maxAge:  maxAge});
                        return res.status(200).send(user);            
                    });
            });
        }
    };
   
    routes.map({
        
        '/session': {
            get: session.getStatus,
            delete: session.logout,   
            post: session.login,
            '/register':{
                post: session.register
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
    
    return routes;
}();