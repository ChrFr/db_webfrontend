//enter valid entries and rename the file to dbconfig.js
module.exports = function(){
    var config = {
        //grants access to all accounts
        masterkey: 'password',
        serverconfig: {
            port: "8080",
            sessionSecret: "some secret",
            cookieSecret: "another secret",
            maxCookieAge: 1000 * 60 * 60 //in ms
        },
        dbconfig: {
            user: "postgres",
            password: "hallo",
            host: '127.0.0.1',
            port: "5432",
            database: "db_webfrontend"
        }
    };
    return config;
}();