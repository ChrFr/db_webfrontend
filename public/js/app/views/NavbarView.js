// NavbarView.js
// -------
define(["jquery", "backbone", "text!templates/navbar.html"],

    /**
    * A View that renders the Main Navigation Bar
    *
    * @param options.el       the tag of the DOM Element, the view will be rendered in
    * @param options.session  a LoginModel with the current login status 
    * @return                 the NavbarView class
    * @see                    the main navigation bar
    */
    function($, Backbone, template){

        var NavbarView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: ".navbar.navbar-default",

            // constructor
            initialize: function(options) {
                var _this = this;
                var options = options || {};
                this.session = options.session;
                // Calls the view's render method
                this.render();                
                //change active item if navbar item is clicked
                $('ul.nav > li').click(function (e) {
                    $('ul.nav > li').removeClass('active');
                    $(this).addClass('active');                
                });     
                if (this.session) 
                    this.session.bind("change:user", function(){_this.displayLogin()});
            },

            events: {
            },

            // Renders the view's template to the UI
            render: function() {         
                this.template = _.template(template, {});
                this.$el.html(this.template);      
                return this;

            },
            
            //change the text of the menu item, to show, that the user is logged in
            displayLogin: function(){
                if (this.session.get('authenticated')){
                    var user = this.session.get('user');
                    this.$el.find('#login').text('Eingeloggt als ' + user.name);   
                }
                else{
                    this.$el.find('#login').text('Einloggen'); 
                }
            }

        });

        // Returns the View class
        return NavbarView;

    }

);