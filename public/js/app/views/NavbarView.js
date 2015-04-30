// NavbarView.js
// -------
define(["app", "jquery", "backbone", "text!templates/navbar.html"],

    /**
    * A View that renders the Main Navigation Bar
    *
    * @param options.el       the tag of the DOM Element, the view will be rendered in
    * @param options.session  a LoginModel with the current login status 
    * @return                 the NavbarView class
    * @see                    the main navigation bar
    */
    function(app, $, Backbone, template){

        var NavbarView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: ".navbar.navbar-default",

            // constructor
            initialize: function() {
                var _this = this;
                this.render();      
                if (app.session) 
                    app.session.bind("change:user", function() {_this.displayLogin()});
                //change active item if navbar item is clicked
                $('ul.nav > li').click(function (e) {
                    $('ul.nav > li').removeClass('active');
                    $(this).addClass('active');                
                });               
            },

            events: {
            },

            // Renders the view's template to the UI
            render: function() {         
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;  
                this.displayLogin();
                return this;

            },
            
            //change the text of the menu item, to show, that the user is logged in
            displayLogin: function(){
                if (app.session.get('authenticated')){
                    var user = app.session.get('user');
                    this.$el.find('#login').text('Eingeloggt als ' + user.name);  
                    if (user.superuser){
                        this.el.querySelector("#admin").style.display = 'block';
                    }
                    else
                        this.el.querySelector("#admin").style.display = 'none';
                }
                else{
                    this.el.querySelector("#admin").style.display = 'none';
                    this.$el.find('#login').text('Einloggen'); 
                }
            }

        });

        // Returns the View class
        return NavbarView;

    }

);