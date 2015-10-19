//28.04.2015
//author: Christoph Franke
//client: GGR

var crypto = require('crypto');

var pbkdf2Hash = {  
  
    // create salt of size 64
    createSalt: function(){
        return crypto.randomBytes(64).toString('base64');
    },
    
    /*
     * @desc hash a given plain password
     * 
     * @param options.plainPass  plain password
     * @param options.salt       optional, salt (will be created, if not given)
     * @param options.iterations optional, number of iterations (default: 10000)
     * 
     * @return hashed password <hash>$<iterations>$<salt>
     */
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
    
    // extract number of iterations from hashedPass
    getIterations: function(hashedPass){
        return parseInt(hashedPass.split('$')[1]);
    },
    
    // extract salt from hashedPass
    getSalt: function(hashedPass){
        return hashedPass.split('$')[2];
    },
    
    // 
    // callback expects error and hashedPass
    
    /*
     * @desc verify given plainPass by hashing and comparing to given hashedPass
     * 
     * @param options.plainPass plain password
     * @param options.hashedPass hashed password
     * @param callback optional, handles error/success; is called, when verification is done; expects error and hashedPass as parameters
     * 
     */
    verify: function(options, callback){
      if(!options.plainPass || !options.hashedPass)
        return callback("Passwords must not be empty");
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
    }
}

module.exports = pbkdf2Hash;