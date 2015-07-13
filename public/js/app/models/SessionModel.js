// LoginModel.js
// --------
define(["jquery", "backbone"],

    /**
    * Holds the informations about a session. Manages the CSRF-Token.
    * 
    * @return  the LoginModel class
    */    
    function($, Backbone) {

        var SessionModel = Backbone.Model.extend({
            
            url : 'api/users/login',
            
            defaults: {
                user: null,
                token: null
            },
            
            fetch: function(options){
                var _this = this;
                options || (options = {});
                var callback = options.success;
                
                options.success = function(model, res, opt){
                    _this.setHeader(model.get('user').id, model.get('token'));                    
                    if(callback)
                        callback(model, res, opt);
                };

                return Backbone.Model.prototype.fetch.call(this, options);
            },    
            
            setHeader: function(id, token){
                $.ajaxSetup({                    
                    headers : { 
                        id: id,
                        token: token
                    }
                });
            },
            
            //authenticate by sending the data wit the user information
            //to the server
            login : function(options){
                var _this = this;
                var data = {'name': options.name, 'password': options.password};
                if(options.stayLoggedIn)
                    data.stayLoggedIn = true;
                
                var login = $.ajax({
                    url : this.url,
                    data : data,
                    type : 'POST'
                });
                login.done(function(response){
                    _this.setHeader(response.user.id, response.token);
                    _this.set('token', response.token); 
                    _this.set('user', response.user); 
                    if(options.success)
                        options.success(response);
                });
                login.fail(function(response){
                    _this.set('user', null);
                    if(options.error){
                        options.error(response.responseText);
                    }                    
                    _this.setHeader(null, null);
                });
            },

            //logout by sending delete session request to server
            logout : function(){
                var _this = this;
                $.ajax({
                    url : this.url,
                    type : 'DELETE'
                }).done(function(response){       
                    _this.setHeader(null, null);
                    _this.clear();
                });
            }
        });
        return SessionModel;
    }
);