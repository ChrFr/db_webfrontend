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
        if(!user){
            return callback('Nur angemeldete Nutzer haben Zugriff!', 403);
        }
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
            if(!req.session.user){
                return res.status(403).send('Nur angemeldete Nutzer haben Zugriff!');
            }
            
            var q = "SELECT id, name, description"
            if(req.session.user.superuser)
                q += ", users"
            q += " FROM prognosen";
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
            checkPermission(req.params.pid, req.session.user, function(err, status, result){
                if(err)
                    return res.status(status).send(err);
                return res.status(status).send(result);
            }, true);
        }
    };
    
    var regions = {        
        
        gemeinden: {
            list: function(req, res){ 
                //get gemeinden for specific prognosis
                var progId = req.query.progId;
                if(progId)
                    checkPermission(progId, req.session.user, function(err, status, result){
                        if (err)
                            return res.status(status).send(err);
                        query("SELECT DISTINCT rs, name FROM gemeinden NATURAL LEFT JOIN bevoelkerungsprognose WHERE prognose_id=$1;", [progId], function(err, result){
                            return res.status(200).send(result);
                        });
                    });
                else{
                    query("SELECT * FROM gemeinden", [], function(err, result){
                        return res.status(200).send(result);
                    });
                }
            },

            get: function(req, res) {
                query('SELECT * FROM gemeinden WHERE rs=$1', [req.params.rs], 
                    function(err, result){
                        return res.status(200).send(result[0]);
                });
            }
        },
        
        landkreise: {
            list: function(req, res){ 
                query("SELECT * FROM landkreise", [], function(err, result){
                    return res.status(200).send(result);
                });
                
            },

            get: function(req, res) {
                query('SELECT * FROM landkreise WHERE id=$1', [req.params.pid], 
                    function(err, result){
                        return res.status(200).send(result[0]);
                });
            }
        }
    }
    
    var demodevelop = {        

        // get demographic development from database
        getYears: function(req, res, rsArray, onSuccess){   
            checkPermission(req.params.pid, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);

                var year = req.query.year,
                    queryString = "SELECT jahr, alter_weiblich, alter_maennlich, bevstand, geburten, tote, zuzug, fortzug FROM bevoelkerungsprognose WHERE prognose_id=$1",
                    params = [req.params.pid];
                var i = 2;
                if (rsArray && rsArray instanceof Array) {
                    var p = [];
                    for(i; i < rsArray.length + 2; i++)
                        p.push('$' + i)
                    
                    queryString += " AND rs IN (" + p.join(",") + ")";    
                    params = params.concat(rsArray);
                }
                else{
                    queryString += " AND rs=$" + i;
                    params.push(req.params.rs);
                }
                
                //specific year queried or all years?   
                if (year){
                    queryString += " AND jahr=$3 ";
                    params.push(year);
                }
                else {
                    queryString += ' ORDER BY jahr';                    
                };
                
                query(queryString, params, function(err, result){  
                    if (err || result.length === 0)
                        return res.sendStatus(404);
                    return onSuccess(result);                     
                });
            });     
        },
        
        // shows a undetailed preview over the demodevelopments in all regions
        list: function(req, res){    
            checkPermission(req.params.pid, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);
                query("SELECT rs, jahr, bevstand FROM bevoelkerungsprognose WHERE prognose_id=$1 ORDER BY rs;", [req.params.pid], function(err, result){                    
                    var response = [];
                    var entry = {'rs': ''};
                    result.forEach(function(r){
                        //new rs
                        if(r.rs !== entry.rs){
                            if(entry.data)
                                response.push(entry);
                            entry = {'rs' : r.rs, 'data': []};
                        }
                        delete r.rs;
                        entry.data.push(r);
                    });
                    return res.status(200).send(response);
                });
            });
        },

        // get details of the demo.development in a spec. region
        getJSON: function(req, res){ 
            demodevelop.getYears(req, res, null, function(result){                
                if(req.query.year)
                    result = result[0];
                return res.json({
                    rs: req.params.rs,
                    data: result
                });
            });
        },
        
        getAggregation: function(req, res){
            var rsList = req.query.rs;
            if(!rsList)
                return res.status(400).send('Für Aggregationen werden die Regionalschlüssel als Parameter benötigt.')
            else demodevelop.getYears(req, res, rsList, function(result){  
                res.send(result);
            });
        },

        csv: function(req, res){

            checkPermission(req.params.pid, req.session.user, function(err, status, result){
                if (err)
                    return res.status(status).send(err);

                var year = req.query.year;

                demodevelop.getYears(req, res, null, function(result){
                    res.statusCode = 200;    

                    //MIME Type and filename
                    res.set('Content-Type', 'text/csv');
                    var filename = req.params.rs + '-bevoelkerungsprognose'; 

                    var expanded = "Bevoelkerungsprognose " + req.params.rs;
                    if(year){
                        filename += '-' + year; 
                        expanded += " " + year;
                    }
                    res.setHeader('Content-disposition', 'attachment; filename=' + filename + ".csv");                      

                    for(var i = 0; i < result.length; i++){
                        if(year)                            
                            delete result[i]['jahr'];

                        expanded += "\n" + expandJsonToCsv({
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

        //converts to SVG
        svg: function(req, res){
            var Render = require('./render');
            if(!req.query.year)       
                res.status(400).send('SVGs können nur für spezifische Jahre angezeigt werden.')
            else
                demodevelop.getYears(req, res, null, function(result){
                    Render.renderAgeTree({
                        data: result[0],
                        width: 400,
                        height: 600
                    }, function(svg){
                        //MIME Type and filename
                        res.set('Content-Type', 'image/svg+xml' );
                        var filename = req.params.rs + '-bevoelkerungsprognose-' + req.query.year + ".svg";
                        res.setHeader('Content-disposition', 'attachment; filename=' + filename); 
                        return res.status(200).send(svg);
                }); 
            });
        },

        //converts to PNG
        png: function(req, res){
            var Render = require('./render');
            if(!req.query.year)       
                return res.status(400).send('PNGs können nur für spezifische Jahre angezeigt werden.');
            
            demodevelop.getYears(req, res, null, function(result){                    
                Render.renderAgeTree({
                    data: result[0],
                    width: 400,
                    height: 600,
                    maxX: req.query.maxX
                }, function(svg){
                    //MIME Type and filename
                    res.set('Content-Type', 'image/png' );
                    var filename = req.params.rs + '-bevoelkerungsprognose-' + req.query.year + ".png";
                    res.setHeader('Content-disposition', 'attachment; filename=' + filename);                         

                    var convert = child_proc.spawn("convert", ["svg:", "png:-"]);
                    convert.stdout.on('data', function (data) {
                      res.write(data);
                    });
                    convert.on('exit', function(code) {
                      return res.end();
                    });                                   
                    convert.stdin.write(svg);
                    convert.stdin.end();
                }); 
            });
            
        }
                    
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
            if(!req.session.user || !req.session.user.superuser){
                return res.sendStatus(403);
            }
            query("SELECT id, name, email, superuser from users", [],
            function(err, result){
                if(err)
                    return res.sendStatus(500);
                return res.status(200).send(result);
                
            });
        },        
        
        get: function(req, res){
            //admin only
            if(!req.session.user || !req.session.user.superuser){
                return res.sendStatus(403);
            }
            query("SELECT id, name, email, superuser from users WHERE id=$1", [req.params.id], 
            function(err, result){
                if (err || result.length === 0)
                    return res.sendStatus(404);
                return res.status(200).send(result[0]);
            });
        },
        
        post: function(req, res){
            if(!req.session.user || !req.session.user.superuser){
                return res.sendStatus(403);
            }
            //TODO: only admin allowed to create
            //TODO: check, if already exists, else create
            var name = req.body.name;
            var email = req.body.email;
            
            pbkdf2Hash.hash({plainPass: req.body.password}, function(err, hashedPass){
                if(err)
                    return res.status(500).send('Interner Fehler.');
                query("INSERT INTO users (name, email, password, superuser) VALUES ($1, $2, $3, $4);", 
                    [name, email, hashedPass, req.body.superuser],
                    function(err, result){
                        if(err)
                            return res.status(409).send('Name "' + name + '" ist bereits vergeben!');
                        
                        res.set('Content-Type', 'application/json');
                        return res.status(200).send('User erfolgreich angelegt');            
                    });
            });
        },
        
        put: function(req, res){  
            if(!req.session.user || !req.session.user.superuser){
                return res.sendStatus(403);
            }          
            pbkdf2Hash.hash({plainPass: req.body.password}, function(err, hashedPass){
                if(err)
                    return res.status(500).send('Interner Fehler.');
                query("UPDATE users SET name=$2, email=$3, superuser=$4, password=$5 WHERE id=$1;", 
                    [req.params.id, req.body.name, req.body.email, req.body.superuser, hashedPass],
                    function(err, result){
                        if(err)
                            return res.status(500).send('Interner Fehler.');
                        
                        res.set('Content-Type', 'application/json');
                        return res.status(200).send('User erfolgreich aktualisiert');            
                    });
            });
        },
        
        delete: function(req, res){
            if(!req.session.user || !req.session.user.superuser){
                return res.sendStatus(403);
            }
            query("DELETE FROM users WHERE id=$1;", [req.params.id],
                function(err, result){
                    if(err)
                        return res.status(500).send('Interner Fehler.');
                    res.set('Content-Type', 'application/json');
                    return res.status(200).send('User erfolgreich gelöscht');            
                });
            
        }
    };   
    
    
    // MAP THE REST-ROUTES TO THE FUNCTIONS
    
    api.map({
        
        '/session': {
            get: session.getStatus,
            delete: session.logout,   
            post: session.login,
            '/register':{
                post: session.register
            }
        },
        '/regionen': {
            '/gemeinden':{
                get: regions.gemeinden.list, 
                '/:rs': {                
                    get: regions.gemeinden.get
                }
            },
            '/landkreise':{
                get: regions.landkreise.list, 
                '/:id': {                
                    get: regions.landkreise.get
                }
            }
        },
        '/prognosen': {
            get: prognosen.list,        
            '/:pid': {                
                get: prognosen.get, 
                '/bevoelkerungsprognose': {      
                    get: demodevelop.list,                        
                    '/aggregiert': {                
                        get: demodevelop.getAggregation,                    
                        '/svg':{
                            get: demodevelop.svg
                        },
                        '/csv':{
                            get: demodevelop.csv
                        },                            
                        '/png':{
                            get: demodevelop.png
                        }
                    },     
                    '/:rs': {                
                        get: demodevelop.getJSON,                    
                        '/svg':{
                            get: demodevelop.svg
                        },
                        '/csv':{
                            get: demodevelop.csv
                        },                            
                        '/png':{
                            get: demodevelop.png
                        }
                    }
                }    
            }            
        },
        '/users': {
            get: users.list,
            post: users.post,
            '/:id':{
                get: users.get,
                put: users.put,
                delete: users.delete
            }
        }
    });
    
    return api;
}();