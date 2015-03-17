//enter valid entries and rename the file to dbconfig.js
module.exports = function(){
    var config = {
        serverconfig: {
            port: "port the service will listen to"
        },
        dbconfig: {
            user: "username",
            password: "password",
            host: "the adress of the database server (if using unix sockets: the path to the socket file)",
            port: "port the database listens to (default: 5432)",
            database: "name of the database"
        }
    };
    return config;
}();