//28.04.2015
//author: Christoph Franke
//client: GGR

module.exports = function(){
    var express = require('express'),
        api = express(),
        child_proc = require('child_process'),  
        query = require('./pgquery').pgQuery,   
        pbkdf2Hash = require('./pbkdf2_hash'),    
        config = require('./config');
    
    //Mapping taken from express examples https://github.com/strongloop/express
    api.map = function(a, route){
      route = route || '';
      for (var key in a) {
        switch (typeof a[key]) {
          // { '/path': { ... }}
          case 'object':
            api.map(a[key], route + key);
            break;
          // get: function(){ ... }
          case 'function':
            api[key](route, a[key]);
            break;
        }
      }
    };    
    
    // transform json object by splitting array fields e.g. 
    function expandJsonToCsv(options){
        var data = options.data || {},
            renameFields = options.renameFields || {},
            countName = options.countName || 'count',
            countStart = options.countStart || 0,
            countPos = options.countPos || 0,
            fillValue = options.fillValue || 0,
            writeHead = options.writeHead;  
    
        var csv = [];
        
        if (writeHead){
            var keys = Object.keys(data);
            keys.splice(countPos, 0, countName);
            csv.push(keys.join(";"));  
            //rename fields
            for (var key in renameFields)
                csv[0] = csv[0].replace(key, renameFields[key]);
        }
        
        var maxLength = 0;        
        
        //get max array length
        Object.keys(data).forEach(function(key){
            if(data[key] instanceof Array){
                if(data[key].length > maxLength)
                    maxLength = data[key].length;
            }
        });
        
        //expand the arrays
        for(var i = 0; i < maxLength; i++){
            var row = [];        
            Object.keys(data).forEach(function(key){   
                var value;
                if(!(data[key] instanceof Array))
                    value = data[key];
                else if (data[key].length < maxLength )
                    value = fillValue;
                else
                    value = data[key][i];
                //escape chars and adapt floats to german csv
                value = value.toString().replace( /[",\n\r]/gi, '' ).replace('.', ',');
                row.push(value);
            });
            row.splice(countPos, 0, countStart + i);
            csv.push(row.join(';'));
        };
        
        return csv.join("\n");
    }

    var checkPermission = function(prognoseId, user, callback){           
        if(!user)
            return callback('Nur angemeldete Nutzer haben Zugriff!', 403);
        query('SELECT * FROM prognosen WHERE id=$1', [prognoseId], 
        function(err, result){
            if (err)
                return callback(err, 500); 
            if (result.length === 0)
                return callback('not found', 404);
            if (!user.superuser && result[0].users.indexOf(user.id) < 0)
                return callback('Sie haben keine Berechtigung, um auf diese Prognose zuzugreifen.', 403);
            //don't send the permissions
            delete result[0].users;
            return callback(null, 200, result[0]);
        });
    };    
    
    var prognosen = {   
        list: function(req, res){
            //TODO session or cookie (check every time auth_token?) ?
            if(!req.session.user)
                return res.status(403).send('Nur angemeldete Nutzer haben Zugriff!');
            
            var q = "SELECT id, name, description FROM prognosen";
            var params = [];
            //only admin can access all prognoses
            if(!req.session.user.superuser){
                q+= " WHERE $1 = ANY(users)";
                params.push(req.session.user.id);
            }
            query(q+";", params,
            function(err, result){
                if (err)
                    return res.sendStatus(500);
                return res.status(200).send(result);      
            });
        },
        
        get: function(req, res){ 
            checkPermission(req.params.id, req.session.user, function(err, status, result){
                if(err)
                    return res.status(status).send(err);
                return res.status(status).send(result);
            }, true);
        }
    };
    
    var demodevelop = {
        list: function(req, res){            
            checkPermission(req.params.id, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);
                query("SELECT DISTINCT rs, name FROM gemeinden NATURAL LEFT JOIN bevoelkerungsprognose WHERE prognose_id=$1;", [req.params.id], function(err, result){
                    return res.status(200).send(result);
                });
            });
        },
        
        get: function(req, res){           
            checkPermission(req.params.id, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);
                query('SELECT jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE prognose_id=$1 AND rs=$2 ORDER BY jahr', [req.params.id, req.params.rs], function(err, result){
                    res.statusCode = 200;                  
                    return res.json({
                        rs: req.params.rs,
                        data: result
                    });
                    
                });
            });
        },
        
        csv: function(req, res){
                     
            checkPermission(req.params.id, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);
                
                var year = req.query.year,
                    queryString = "",
                    params = [];
                
                //specific year queried or all years?   
                if (year){
                    queryString = 'SELECT jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE prognose_id=$1 AND rs=$2 AND jahr=$3';
                    params = [req.params.id, req.params.rs, year];
                }
                else{
                    queryString = 'SELECT jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE prognose_id=$1 AND rs=$2 ORDER BY jahr';
                    params = [req.params.id, req.params.rs];                    
                }
                    
                query(queryString, params, function(err, result){
                    res.statusCode = 200;    
                    
                    //MIME Type and filename
                    res.set('Content-Type', 'text/csv');
                    var filename = req.params.rs + '-bevoelkerungsprognose';                    
                    if(year)
                        filename += '-' + year;                                         
                    filename += '.csv';
                    res.setHeader('Content-disposition', 'attachment; filename=' + filename);  
                    
                    var expanded = "";
                    for(var i = 0; i < result.length; i++){
                        if(year)                            
                            delete result[i]['jahr'];
                        
                        expanded += expandJsonToCsv({
                            data: result[i],
                            renameFields: {'alter_weiblich': 'Anzahl weiblich', 
                                           'alter_maennlich': 'Anzahl maennlich'},     
                            countName: 'Alter',
                            countPos: (year) ? 0: 1,
                            writeHead: (i === 0) ? true: false
                        }) + '\n';
                           
                    }
                    
                    res.send(expanded);                      
                });
            });
        },
        
        svg: function(req, res){
                     
            checkPermission(req.params.id, req.session.user, function(err, status, result){
                var year = 'bla';
                if (err)
                    return res.status(status).send(err);
                query('SELECT jahr, ROUND(alter_weiblich,decimals), ROUND(alter_maennlich,decimals) FROM bevoelkerungsprognose WHERE prognose_id=$1 AND rs=$2 ORDER BY jahr', [req.params.id, req.params.rs], function(err, result){
                    res.statusCode = 200;    
                    res.set('Content-Type', 'text/csv');
                    res.setHeader('Content-disposition', 'attachment; filename=' + req.params.rs + '-' + year + '-bevoelkerungsprognose.csv');
                    res.send(jsonToCsv(result));                      
                });
            });
        }
        /*
        getYear: function(req, res, onSuccess){            
            var params = [req.params.rs, req.params.jahr];
            var q = 'SELECT rs, jahr, alter_weiblich, alter_maennlich FROM bevoelkerungsprognose WHERE rs=$1 AND jahr=$2';    
            //if(req.query.weiblich){  
            //    params.push(req.query.weiblich);
            //    query += 'AND weiblich=$3'}
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
        }*/
        
    };
    
    var session = {
        
        getStatus: function(req, res){
            var id = req.signedCookies.user_id,
                token = req.signedCookies.auth_token,
                errMsg = 'nicht angemeldet';
            
            query("SELECT * from users WHERE id=$1", [id],
            function(err, result){
                if(err || result.length === 0){
                    req.session.user = null;
                    return res.status(401).send(errMsg);
                }
                
                if(token !== pbkdf2Hash.getSalt(result[0].password))
                    return res.status(401).send(errMsg);

                req.session.user  = {id: result[0].id,
                                    name: result[0].name,
                                    email: result[0].email,
                                    superuser: result[0].superuser};

                res.statusCode = 200;                           
                return res.json({
                    authenticated : true,
                    user : req.session.user 
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
                    
                    req.session.user  = {id: dbResult[0].id,
                                        name: dbResult[0].name,
                                        email: dbResult[0].email,
                                        superuser: dbResult[0].superuser};    
                                    
                    //COOKIES (only used for status check, if page is refreshed)
                    var maxAge = config.serverconfig.maxCookieAge; 
                    res.cookie('user_id', req.session.user.id, { signed: true, maxAge:  maxAge});
                    //user gets the salt as a token to authenticate, that he is logged in
                    res.cookie('auth_token', token, { signed: true, maxAge:  maxAge});

                    res.statusCode = 200;
                    return res.json({
                        authenticated : true,
                        user : req.session.user 
                    });            
                });            
            });
        },

        logout: function(req, res){ 
            res.clearCookie('user_id');
            res.clearCookie('auth_token');
            req.session.user = null;
            res.sendStatus(200);
        }
        
    };
    
    var users = {
        list: function(req, res){
            //admin only
            if(!req.session.user || !req.session.user.superuser)
                return res.sendStatus(403);
            query("SELECT id, name, email, superuser from users", [],
            function(err, result){
                if(err)
                    return res.sendStatus(500);
                return res.status(200).send(result);
                
            });
        },        
        
        get: function(req, res){
            //admin only
            if(!req.session.user || !req.session.user.superuser)
                return res.sendStatus(403);
            query("SELECT id, name, email, superuser from users WHERE id=$1", [req.params.id], 
            function(err, result){
                if (err || result.length === 0)
                    return res.sendStatus(404);
                return res.status(200).send(result[0]);
            });
        },
        
        post: function(req, res){
            //TODO: only admin allowed to create
            //TODO: check, if already exists, else update
            var name = req.body.name;
            var email = req.body.email;
            
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
        },
        
        delete: function(req, res){
            
        }
    };
   
    api.map({
        
        '/session': {
            get: session.getStatus,
            delete: session.logout,   
            post: session.login,
            '/register':{
                post: session.register
            }
        },
        '/prognosen': {
            get: prognosen.list,        
            '/:id': {                
                get: prognosen.get,
                '/bevoelkerungsprognose': {
                    get: demodevelop.list,        
                        '/:rs': {                
                            get: demodevelop.get,
                            '/svg':{
                                get: demodevelop.svg
                            },
                            '/csv':{
                                get: demodevelop.csv
                            }
                        }                    
                }
            }
        },
        '/users': {
            get: users.list,
            '/:id':{
                get: users.get,
                post: users.post,
                delete: users.delete
            }
        }
    });
    
    return api;
}();