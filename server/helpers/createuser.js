var pbkdf2Hash = require('../pbkdf2_hash');
var query = require('../pgquery').pgQuery;   

var user = process.argv[2],
    plainPass = process.argv[3],
    superuser = false;

if(process.argv[4] === 'true')
    superuser = true;

pbkdf2Hash.hash({plainPass: plainPass}, function(err, hashedPass){
    if(err)
        console.log(err);
    else
        //TODO: only admin allowed

        pbkdf2Hash.hash({plainPass: plainPass}, function(err, hashedPass){
            if(err){
                console.log('Interner Fehler bei Registrierung. Bitte versuchen Sie es erneut.');
                process.exit(code=1);
            }
            query("INSERT INTO users (name, password, superuser) VALUES ($1, $2, $3);", 
                [user, hashedPass, superuser],
                function(err, result){
                    if(err){
                        console.log(err);
                        process.exit(code=1);
                    }
                    else{                       
                        console.log('User "' + user + '" erfolgreich hinzugefügt'); 
                        process.exit(code=0);
                    }
                });
        });
});
