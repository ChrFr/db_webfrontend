//28.04.2015
//author: Christoph Franke
//client: GGR

var crypto = require('crypto');

//base64 encoded password hashes
//pattern: <hashed salted password>$<nr of iterations used>$<salt hash>
var pbkdf2Hash = {
    createSalt: function(){
        return crypto.randomBytes(64).toString('base64');
    },
    hash: function(options, callback){
        if (!options.salt)
            options.salt = this.createSalt();
        //default 10000 iterations
        if (!options.iterations)
            options.iterations = 10000;
        crypto.pbkdf2(options.plainPass, options.salt, options.iterations, 64, 'sha256', function(err, key) {
            if(err)
                return callback(err);
            var result = key.toString('base64') + '$' + options.iterations + '$' + options.salt;
            callback(null, result);
      });
    },
    //callback(error, hashedPass) 
    verify: function(options, callback){
        var iterations = this.getIterations(options.hashedPass),
            salt = this.getSalt(options.hashedPass);
        this.hash({
            plainPass: options.plainPass,
            iterations: iterations,
            salt: salt
            }, function(err, result){
                if(err)
                    return callback(err);
                if(result === options.hashedPass)
                    return callback(null, result);
                else
                    return callback("Passwords don't match");
        });
    },
    getIterations: function(hashedPass){
        return parseInt(hashedPass.split('$')[1]);
    },
    getSalt: function(hashedPass){
        return hashedPass.split('$')[2];
    }
}

module.exports = pbkdf2Hash;