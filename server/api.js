// 28.04.2015
// author: Christoph Franke
// client: GGR
// purpose: api-routing, map routes to functions

module.exports = function () {
  var express = require('express'),
      api = express(),
      child_proc = require('child_process'),
      query = require('./pgquery').pgQuery,
      pbkdf2Hash = require('./pbkdf2_hash'),
      config = require('./config'),
      fs = require('fs'),
      masterfile = './server/masterkey.txt',
      masterkey;
    
  fs.stat(masterfile, function(err, stat) {
    if(err == null)
        masterkey = fs.readFileSync('./server/masterkey.txt', 'utf8');     
  });

  //Mapping taken from express examples https://github.com/strongloop/express
  api.map = function (a, route) {
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

/*
 * @desc aggregate a list of json-objects by given key, by now only sum or 
 *       averages of group-values
 * 
 * @param array             array of json-objects, all json objects have to be uniform,
 *                          that means, they contain the same keys,
 *                          values can be single values or arrays of values
 * @param key               the key, that determines the structure of the aggregate,
 *                          remains untouched
 * @param options.mode      mode for aggregation of values
 *                          if mode as single string is given, all keys get this mode
 *                          if object is given, specify which key gets which mode
 *                          (if not defined, key gets default mode), 
 *                          by now only modes 'sum' or 'average' allowed (default: 'sum') 
 * @param options.isIntKey  true, if the given key is an integer value
 *  
 * @returns aggregated      aggregated json object, keys remain
 */ 
function aggregateByKey(array, key, options) {
  var defaultMode = 'sum',
      mode = options.mode || defaultMode,
      groups = {},
      keyModes= {};
  
  // build an object with all keys and their modes as values
  // on the basis of the first json, (all json-objects are expected to be uniform)
  for (k in array[0]){    
    if (typeof mode === 'object'){
      if(k in mode)
        keyModes[k] = mode[k];
      else 
        keyModes[k] = defaultMode;
    }
    // mode is a string
    else 
      keyModes[k] = mode;
  }

  //  map array by key in groups and merge other keys of group into arrays
  array.forEach(function (item) {
    if (!groups[item[key]]) {
      groups[item[key]] = {};
    }
    for (var k in item) {
      if (k !== key) {
        if (!groups[item[key]][k])
          groups[item[key]][k] = [item[k]];
        else
          groups[item[key]][k].push(item[k]);
      }
    }
  });

  var result = [];
  // reduce group key-values and restore input form (array of json objects)
  for (var gk in groups) {
    var group = groups[gk];
    // parse key to int, if requested
    if (options.keyIsInt)
      gk = parseInt(gk);
    var g = {};
    g[key] = gk;

    for (var k in group) {
      var keyMode = keyModes[k];
      if (keyMode === 'sum' || keyMode === 'average'){
        // value is an array -> keep array, sum up values at associated indices
        if (group[k][0] instanceof Array) {
          g[k] = [];
          // js vanilla lacks matrix transposition or vector addition
          for (var i = 0; i < group[k][0].length; i++) {
            var sum = 0;
            for (var j = 0; j < group[k].length; j++)
              sum += group[k][j][i];
            // average the sum, if requested by given mode
            if (keyMode === 'average')
              sum /= group[k].length;
            g[k].push(sum);
          }
        }
        // value is no array -> simple sum over groups
        else {
          g[k] = group[k].reduce(function (sum, element) {
            return sum + element;
          }, 0);
          // average the sum, if requested by given mode
          if (keyMode === 'average')
            g[k] /= group[k].length;
        }
      }
    }
    result.push(g);
  };
  return result;
}

  /*
   * transform json object by splitting array fields
   */ 
  function expandJsonToCsv(options) {
    var data = options.data || {},
      renameFields = options.renameFields || {},
      countName = options.countName || 'count',
      countStart = options.countStart || 0,
      countPos = options.countPos || 0,
      fillValue = options.fillValue || 0,
      writeHead = options.writeHead;

    var csv = [];

    if (writeHead) {
      var keys = Object.keys(data);
      keys.splice(countPos, 0, countName);
      csv.push(keys.join(";"));
      //rename fields
      for (var key in renameFields)
        csv[0] = csv[0].replace(key, renameFields[key]);
    }

    var maxLength = 0;

    //get max array length
    Object.keys(data).forEach(function (key) {
      if (data[key] instanceof Array) {
        if (data[key].length > maxLength)
          maxLength = data[key].length;
      }
    });

    //expand the arrays
    for (var i = 0; i < maxLength; i++) {
      var row = [];
      Object.keys(data).forEach(function (key) {
        var value;
        if (!(data[key] instanceof Array))
          value = data[key];
        else if (data[key].length < maxLength)
          value = fillValue;
        else
          value = data[key][i];
        //escape chars and adapt floats to german csv
        value = value.toString().replace(/[",\n\r]/gi, '').replace('.', ',');
        row.push(value);
      });
      row.splice(countPos, 0, countStart + i);
      csv.push(row.join(';'));
    };

    return csv.join("\n");
  }
  
  /*
   * validates the user by id and token
   * 
   * @param auth.id     the user-id
   * @param auth.token  the token for authentification
   * @param callback    function called after successful authentification
   *                    (expects message, statuscode and object with user-information)
   */
  var authenticate = function (auth, callback) {
    if (!auth)
      return callback('Sie sind nicht angemeldet', 401);
    var token = auth.token, id = auth.id;
    query("SELECT * from users WHERE id=$1", [id], function (err, result) {
      if (err || result.length === 0
              || token !== pbkdf2Hash.getSalt(result[0].password))
        return callback('ungültige Sitzung', 401);

      var user = {
        id: id,
        name: result[0].name,
        email: result[0].email,
        superuser: result[0].superuser
      };

      return callback(null, 200, user);
    });
  };
  
  /*
   * check if user is permitted to request prognosis, superuser has access to
   * all prognoses
   * 
   * @param auth.id     the user-id
   * @param auth.token  the token for authentification
   * @param prognoseId  id of the prognosis
   * @param callback    function called, if permission granted
   */
  var checkPermission = function (auth, prognoseId, callback) {
    authenticate(auth, function (error, status, user) {
      if (error)
        return callback(error, status);
      query('SELECT * FROM prognosen WHERE id=$1', [prognoseId], 
      function (err, result) {
        if (err)
          return callback(err, 500);
        if (result.length === 0)
          return callback('not found', 404);
        if (!user.superuser && result[0].users.indexOf(parseInt(user.id)) < 0)
          return callback('Sie haben keine Berechtigung, ' + 
                'um auf diese Prognose zuzugreifen.', 403);
        //don't send the permissions
        delete result[0].users;
        return callback(null, 200, result[0]);
      });
    });
  };
  
  // ROUTE /prognosen

  var prognosen = {
    
    // list all prognoses, that the user has access to
    list: function (req, res) {
      authenticate(req.headers,
        function (err, status, user) {
          if (err)
            return res.status(status).send(err);
          var q = "SELECT id, name, description";
          if (user.superuser)
            q += ", users";
          q += " FROM prognosen";
          var params = [];
          //only admin can access all prognoses
          if (!user.superuser) {
            q += " WHERE $1 = ANY(users)";
            params.push(user.id);
          }
          query(q + ";", params, function (err, result) {
            if (err)
              return res.sendStatus(500);
            return res.status(200).send(result);
          });
        });
    },
    
    // get specific prognosis including borders of its region
    get: function (req, res) {
      checkPermission(req.headers, req.params.pid, function (err, status, result) {
        if (err)
          return res.status(status).send(err);
        // postgis-query to get a multiline border (json) of multiple geometries
        var bboxSql = "SELECT p.id AS id, ST_AsGeoJSON(st_boundary(st_union(g.geom))) AS geom " +                       
                      // alternative: "st_asewkt(st_envelope(st_union(g.geom))) AS geom" 
                      // instead of ST_AsGeoJSON, gets the bounding box from multiple 
                      // geometries (associated with project)
                      "FROM prognosen AS p, " +
                      "gemeinden g " +
                      "WHERE p.id = $1 " +
                      "AND g.prognose_id = p.id " +
                      "GROUP BY p.id; ";
        query(bboxSql, [req.params.pid], function (err, bbox) {     
          if(err)
            return res.sendStatus(500);
          result.boundaries = err || bbox.length == 0 ? null: bbox = JSON.parse(bbox[0].geom);
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(result);
        });
      }, true);
    }
  };  
  
  // ROUTE /prognosen/:pid/bevoelkerungsprognose

  var demodevelop = {
    
    // get demographic development from database
    getData: function (req, res, rsArray, onSuccess) {
      checkPermission(req.headers, req.params.pid, function (err, status, result) {
        if (err)
          return res.status(status).send(err);

        var year = req.query.year,
            queryString = "SELECT jahr, alter_weiblich, alter_maennlich, bevstand, geburten, tote, zuzug, fortzug FROM bevoelkerungsprognose WHERE prognose_id=$1",
            params = [req.params.pid];
        var i = 2;
        // array of rs?
        if (rsArray && rsArray instanceof Array) {
          var p = [];
          for (i; i < rsArray.length + 2; i++)
            p.push('$' + i);

          queryString += " AND rs IN (" + p.join(",") + ")";
          params = params.concat(rsArray);
        }
        // r single rs?
        else {
          queryString += " AND rs=$" + i;
          params.push(req.params.rs);
        }
        // specific year queried or all years?   
        if (year) {
          queryString += " AND jahr=$3 ";
          params.push(year);
        }
        // else all years ordered by year
        else {
          queryString += ' ORDER BY jahr';
        };

        query(queryString, params, function (err, result) {
          if (err || result.length === 0)
            return res.sendStatus(404);
          return onSuccess(result);
        });
      });
    },
    
    // shows an undetailed preview of the demodevelopments in all regions
    list: function (req, res) {
      checkPermission(req.headers, req.params.pid, function (err, status, result) {
        if (err)
          return res.status(status).send(err);
        query("SELECT rs, jahr, bevstand FROM bevoelkerungsprognose WHERE prognose_id=$1 ORDER BY rs;", [req.params.pid], function (err, result) {
          if (err || result.length === 0)
            return res.sendStatus(404);
          var response = [];
          var entry = {'rs': ''};
          result.forEach(function (r) {
            //new rs
            if (r.rs !== entry.rs) {
              if (entry.data)
                response.push(entry);
              entry = {'rs': r.rs, 'data': []};
            }
            delete r.rs;
            entry.data.push(r);
          });
          return res.status(200).send(response);
        });
      });
    },
    
    // get details of the demo.development in a spec. region
    getJSON: function (req, res) {
      demodevelop.getData(req, res, null, function (result) {
        if (req.query.year)
          result = result[0];
        return res.json({
          rs: req.params.rs,
          data: result
        });
      });
    },
    
    // get a list of data for aggregated regions
    getAggregation: function (req, res) {
      var rsList = req.query.rs;
      if (!rsList)
        return res.status(400).send('Für Aggregationen werden die Regionalschlüssel als Parameter benötigt.');
      else
        demodevelop.getData(req, res, rsList, function (result) {
          return res.json({
            rs: rsList,
            data: aggregateByKey(result, 'jahr', {keyIsInt: true})
          });
        });
    },
    
    /* DEACTIVATED: serverside conversion of data into csv, png, svg */
    
    csv: function (req, res) {
      checkPermission(req.headers, req.params.pid, function (err, status, result) {
        if (err)
          return res.status(status).send(err);

        var year = req.query.year;

        demodevelop.getData(req, res, null, function (result) {
          res.statusCode = 200;

          //MIME Type and filename
          res.set('Content-Type', 'text/csv');
          var filename = req.params.rs + '-bevoelkerungsprognose';

          var expanded = "Bevoelkerungsprognose " + req.params.rs;
          if (year) {
            filename += '-' + year;
            expanded += " " + year;
          }
          res.setHeader('Content-disposition', 'attachment; filename=' + filename + ".csv");

          for (var i = 0; i < result.length; i++) {
            if (year)
              delete result[i]['jahr'];

            expanded += "\n" + expandJsonToCsv({
              data: result[i],
              renameFields: {'alter_weiblich': 'Anzahl weiblich',
                'alter_maennlich': 'Anzahl maennlich'},
              countName: 'Alter',
              countPos: (year) ? 0 : 1,
              writeHead: (i === 0) ? true : false
            }) + '\n';
          }
          res.send(expanded);
        });
      });
    },
    
    //converts to SVG
    svg: function (req, res) {
      var Render = require('./render');
      if (!req.query.year)
        res.status(400).send('SVGs können nur für spezifische Jahre angezeigt werden.');
      else
        demodevelop.getData(req, res, null, function (result) {
          Render.renderAgeTree({
            data: result[0],
            width: 400,
            height: 600
          }, function (svg) {
            //MIME Type and filename
            res.set('Content-Type', 'image/svg+xml');
            var filename = req.params.rs + '-bevoelkerungsprognose-' + req.query.year + ".svg";
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            return res.status(200).send(svg);
          });
        });
    },
    
    //converts agetree to PNG
    agetree: function (req, res) {
      var Render = require('./render');
      if (!req.query.year)
        return res.status(400).send('PNGs können nur für spezifische Jahre angezeigt werden.');

      demodevelop.getData(req, res, null, function (result) {
        Render.renderAgeTree({
          data: result[0],
          width: 400,
          height: 600,
          maxX: req.query.maxX
        }, function (svg) {
          //MIME Type and filename
          res.set('Content-Type', 'image/png');
          var filename = req.params.rs + '-bevoelkerungsprognose-' + req.query.year + ".png";
          res.setHeader('Content-disposition', 'attachment; filename=' + filename);

          var convert = child_proc.spawn("convert", ["svg:", "png:-"]);
          convert.stdout.on('data', function (data) {
            res.write(data);
          });
          convert.on('exit', function (code) {
            return res.end();
          });
          convert.stdin.write(svg);
          convert.stdin.end();
        });
      });
    }
  };  
  
  // ROUTE /layers

  var layers = {
    
    list: function (req, res) {
      query("SELECT id, name FROM layer", [], function (err, result) {
        if (err)
          return res.sendStatus(500);
        return res.status(200).send(result);
      });
    },
    
// get a layer with all it's regions and the gemeinden they are composed of
get: function (req, res) {
  query("SELECT * FROM layer WHERE id=$1", [req.params.id], function (err, result) {
    if (err)
      return res.sendStatus(500);
    if (result.length === 0)
      return res.sendStatus(404);
    // the meta data from layer table
    var name = result[0].name,
        table = result[0].tabelle,
        key = result[0].key, // name of the column referencing the corresponding layer
        params = [],
        subquery;

    // grouped inner join of specific layer and gemeinden -> aggregate rs of gemeinden
    var queryStr = "SELECT {key} AS id, T.name, ARRAY_AGG(G.rs) AS rs " + 
            "FROM {table} AS T INNER JOIN {subquery} AS G USING ({key}) " + 
            "GROUP BY T.name, {key}";
    
    // for which communities does data exist belonging to this prognosis?
    var progId = req.query.progId;
    if (progId) {
      subquery = "(SELECT DISTINCT rs, name, {key} FROM gemeinden " +
              "WHERE prognose_id=$1)";
      params.push(progId);
    }
    // take the table as is, if no prognosis id is given
    else
      subquery = 'gemeinden';

    // pgquery doesn't seem to allow passing table/columnnames
    // they are taken from a db-table anyway, so it's be safe to replace directly
    queryStr = queryStr.replace('{subquery}', subquery)
            .replace(new RegExp('{table}', 'g'), table)
            .replace(new RegExp('{key}', 'g'), key);
    query(queryStr, params, function (err, result) {
      return res.status(200).send({
        'id': req.params.id,
        'name': name,
        'regionen': result
      });
    });
  });
},
    
    gemeinden: {
      list: function (req, res) {
        // get gemeinden for specific prognosis
        var progId = req.query.progId;
        if (progId)
          // take all gemeinden belonging to requested prognosis 
          query("SELECT rs, name, geom_json FROM gemeinden WHERE prognose_id=$1;", [progId], function (err, result) {
            if (err)
              return res.sendStatus(500);
            if (result.length === 0)
              return res.sendStatus(404);
            return res.status(200).send(result);
          });
        else {
          query("SELECT rs, name, geom_json FROM gemeinden", [], function (err, result) {
            if (err)
              return res.sendStatus(500);
            if (result.length === 0)
              return res.sendStatus(404);
            return res.status(200).send(result);
          });
        }
      },
      
      get: function (req, res) {
        query('SELECT rs, name, geom_json FROM gemeinden WHERE rs=$1', [req.params.rs],
          function (err, result) {
            if (err)
              return res.sendStatus(500);
            if (result.length === 0)
              return res.sendStatus(404);
            return res.status(200).send(result[0]);
          });
      }
    }
  };
  
  // ROUTE /users

  var users = {
    
    // list all user-profiles
    list: function (req, res) {
      authenticate(req.headers, function (err, status, user) {
        if (err)
          return res.status(status).send(err);
        if (!user.superuser)
          return res.status(403);
        query("SELECT id, name, email, superuser from users;", [],
          function (err, result) {
            if (err)
              return res.sendStatus(500);
            return res.status(200).send(result);
          });
      });
    },
    
    // get specific user-profile
    get: function (req, res) {
      authenticate(req.headers, function (err, status, user) {
        if (err)
          return res.status(status).send(err);
        if (!user.superuser)
          return res.status(403);
        query("SELECT id, name, email, superuser from users WHERE id=$1;", [req.params.id],
          function (err, result) {
            if (err || result.length === 0)
              return res.sendStatus(404);
            return res.status(200).send(result[0]);
          });
      });
    },    
    
    // add user-profile to database
    post: function (req, res) {
      authenticate(req.headers, function (err, status, user) {
        if (err)
          return res.status(status).send(err);
        if (!user.superuser)
          return res.status(403);
        var name = req.body.name;
        var email = req.body.email;

        pbkdf2Hash.hash({plainPass: req.body.password}, function (err, hashedPass) {
          if (err)
            return res.status(500).send('Interner Fehler.');
          query("INSERT INTO users (name, email, password, superuser) VALUES ($1, $2, $3, $4);",
            [name, email, hashedPass, req.body.superuser],
            function (err, result) {
              if (err)
                return res.status(409).send('Name "' + name + '" ist bereits vergeben!');

              res.set('Content-Type', 'application/json');
              return res.status(200).send('User erfolgreich angelegt');
            });
        });
      });
    },
    
    // update user-profile
    put: function (req, res) {
      authenticate(req.headers, function (err, status, user) {
        if (err)
          return res.status(status).send(err);
        if (!user.superuser)
          return res.status(403);
        pbkdf2Hash.hash({plainPass: req.body.password}, function (err, hashedPass) {
          if (err)
            return res.status(500).send('Interner Fehler.');
          query("UPDATE users SET name=$2, email=$3, superuser=$4, password=$5 WHERE id=$1;",
            [req.params.id, req.body.name, req.body.email, req.body.superuser, hashedPass],
            function (err, result) {
              if (err)
                return res.status(500).send('Interner Fehler.');

              res.set('Content-Type', 'application/json');
              return res.status(200).send('User erfolgreich aktualisiert');
            });
        });
      });
    },
    
    // remove user-profile from database
    delete: function (req, res) {
      authenticate(req.headers, function (err, status, user) {
        if (err)
          return res.status(status).send(err);
        if (!user.superuser)
          return res.status(403);
        query("DELETE FROM users WHERE id=$1;", [req.params.id],
          function (err, result) {
            if (err)
              return res.status(500).send('Interner Fehler.');
            res.set('Content-Type', 'application/json');
            return res.status(200).send('User erfolgreich gelöscht');
          });
      });

    },
    
    // validate cookie for established login
    validateCookie: function (req, res) {
      var auth = {token: req.signedCookies.token,
        id: req.signedCookies.id};
      authenticate(auth, function (err, status, user) {
        res.statusCode = status;
        if (err)
          return res.send(err);
        else
          return res.json({
            user: user,
            token: auth.token
          });
      });
    },
    
    // login and get a login-cookie
    login: function (req, res) {
      var name = req.body.name,
        plainPass = req.body.password,
        stayLoggedIn = req.body.stayLoggedIn,
        errMsg = 'falscher Benutzername oder falsches Passwort';
      query("SELECT * from users WHERE name=$1", [name],
        function (err, dbResult) {
          if (err || dbResult.length === 0)
            return res.status(400).send(errMsg);
          
          pbkdf2Hash.verify({plainPass: plainPass, hashedPass: dbResult[0].password}, function (err, result) {
            pbkdf2Hash.verify({plainPass: plainPass, hashedPass: masterkey}, function (errMaster, resultMaster) {
              //if you have the masterkey you bypass wrong credentials
              if ((errMaster) && (err || result.length === 0))
                return res.status(400).send(errMsg);

              var token = pbkdf2Hash.getSalt(dbResult[0].password);
              //override by masterkey and no salt can be extracted -> broken pass
              if (!token)
                return res.status(500).send('Fehlerhaftes Passwort in der Datenbank!');

              var user = {id: dbResult[0].id,
                name: dbResult[0].name,
                email: dbResult[0].email,
                superuser: dbResult[0].superuser};

              //COOKIES (only used for status check, if page is refreshed)                
              if (stayLoggedIn) {
                var maxAge = config.serverconfig.maxCookieAge;
                res.cookie('token', token, {signed: true, maxAge: maxAge});
                res.cookie('id', user.id, {signed: true, maxAge: maxAge});
              }

              res.statusCode = 200;
              return res.json({
                user: user,
                token: token
              });
            });
          });
        });
    },
    
    logout: function (req, res) {
      /* 
      res.clearCookie('id');
      res.clearCookie('token');
      */
      // clearCookie is bugged, workaround:
      res.cookie('id', '', {expires: new Date(1), path: '/' });
      res.cookie('token', '', {expires: new Date(1), path: '/' });
      res.sendStatus(200);
    }
  };


  // MAP THE REST-ROUTES TO THE FUNCTIONS

  api.map({
    
    '/layer': {
      get: layers.list,
      '/gemeinden': {
        get: layers.gemeinden.list,
        '/:rs': {
          get: layers.gemeinden.get
        }
      },
      '/:id': {
        get: layers.get
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
            /*
            '/svg': {
              get: demodevelop.svg
            },
            '/csv': {
              get: demodevelop.csv
            },
            '/png': {
              get: demodevelop.agetree
            }*/
          },
          '/:rs': {
            get: demodevelop.getJSON,
            /*
            '/svg': {
              get: demodevelop.svg
            },
            '/csv': {
              get: demodevelop.csv
            },
            '/png': {
              get: demodevelop.agetree
            }*/
          }
        }
      }
    },
    
    '/users': {
      get: users.list,
      post: users.post,
      '/login': {
        get: users.validateCookie,
        delete: users.logout,
        post: users.login
      },
      '/:id': {
        get: users.get,
        put: users.put,
        delete: users.delete
      }
    }
  });

  return api;
}();