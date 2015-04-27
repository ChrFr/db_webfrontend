// LoginView.js
// -------
define(["app","jquery", "backbone", "text!templates/login.html"],

    /**
    * A View that renders a login and registration form onto the screen. 
    * Shows informations about the login status, if already logged in
    *
    * @param  options.el        the tag of the DOM Element, the view will be rendered in
    * @param  options.session   a LoginModel with the current login status 
    * @return                   the LoginView class
    * @see                      a login and registration form
    */
    function(app, $, Backbone, template){

        var LoginView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: "#mainFrame",

            //constructor
            initialize: function() {
                var _this = this;
                
                //render view, each time user changes (to show login status)
                if (app.session) 
                    app.session.bind("change:user", function() {_this.render()});
                this.render();      
            },            

            // the Event Handlers of the login form
            events: {
                "click #loginButton": "login",
                "click #logoutButton": "logout",
            },        

            // Renders the view's template to the UI
            render: function() {        
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {});
                
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template); 
                if (app.session.get('authenticated')){
                    $('#loginForm').hide();
                    $('#loginStatus').show();
                    this.displayStatus();
                }
                else{
                    $('#loginForm').show();
                    $('#loginStatus').hide();
                }
            
                // Maintains chainability
                return this;
            },
            
            //log in with the entries made in the login form
            login: function() {
                var name = $('#loginForm').find('#name').val() || '';      
                var password = $('#loginForm').find('#password').val() || '';
                app.session.login({
                    name: name,
                    password: password
                });
            },
            
            //log out
            logout: function(){
                app.session.logout();
            },            
            
            //display the login status in the form
            displayStatus: function(){            
                var user = this.session.get('user');                
                $('#loginStatus').find('#name').val(user.name);
                $('#loginStatus').find('#email').val(user.email);
                $('#loginStatus').find('#password').val(user.password);
                if (user.superuser)
                    $('#loginStatus').find('#status').text('Sie sind als Superuser angemeldet');
            },
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }
            
        });
        
        return LoginView;

    }

);