// author: Christoph Franke
// client: GGR
// purpose: create a masterkey, store masterkey hashed in masterkey.txt in parent directory
// 
// arguments: password

var pbkdf2Hash = require('../pbkdf2_hash');
var query = require('../pgquery').pgQuery;
fs = require('fs');
keypath = '../masterkey.txt'

var plainPass = process.argv[2];

pbkdf2Hash.hash({plainPass: plainPass}, function(err, hashedPass){
  if(err)
    console.log(err);
  else
    pbkdf2Hash.hash({plainPass: plainPass}, function(err, hashedPass){
      if(err){
        console.log('Interner Fehler bei Erzeugung des Hashwertes. Bitte versuchen Sie es erneut.');
        process.exit(code = 1);
      }
      fs.writeFile(keypath, hashedPass, function(err, data){
        if(err){
          console.log(err);
          process.exit(code = 1);
        }
        else{
          console.log('Masterkey erfolgreich erzeugt');
          process.exit(code = 0);
        }
      });
    });
});