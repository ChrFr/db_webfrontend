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
            
            url : 'api/session',
            
            defaults: {
                authenticated: false,
                user: null
            },

            initialize : function(){
                var _this = this;
                //on change of csrf
                this.bind('change:csrf', function(){
                    var csrf = _this.get('csrf');
                    //always send csrf with request header
                    $.ajaxSetup({                    
                        headers : {
                            'X-CSRF-Token' : _this.get('csrf')
                        }}
                    );                            
                });
            },
            
            check: function(){
                
            },
            
            //authenticate by sending the data wit the user information
            //to the server
            login : function(data){
                var _this = this;
                var login = $.ajax({
                    url : this.url,
                    data : data,
                    type : 'POST'
                });
                login.done(function(response){
                    _this.set('authenticated', true);
                    _this.set('user', response.user); 
                });
                login.fail(function(response){
                    _this.set('authenticated', false);
                    _this.set('user', null);
                });
            },
            
            //send the register data to the server
            register : function(data){
                var _this = this;
                var login = $.ajax({
                    url : _this.url + '/register',
                    data : data,
                    type : 'POST'
                });
                login.done(function(response){
                });
                login.fail(function(response){
                });
            },

            //logout by sending delete session request to server
            logout : function(){
                var _this = this;
                $.ajax({
                    url : this.url,
                    type : 'DELETE'
                }).done(function(response){
                    _this.clear();
                    //get new token
                    _this.initialize();
                });
            }
        });
        return SessionModel;
    }
);