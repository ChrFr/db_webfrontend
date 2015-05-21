// NavbarView.js
// -------
define(["app", "jquery", "backbone", "text!templates/navbar.html", "views/OptionView"],

    /**
    * A View that renders the Main Navigation Bar
    *
    * @param options.el       the tag of the DOM Element, the view will be rendered in
    * @param options.session  a LoginModel with the current login status 
    * @return                 the NavbarView class
    * @see                    the main navigation bar
    */
    function(app, $, Backbone, template, OptionView){

        var NavbarView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: ".navbar.navbar-default",

            // constructor
            initialize: function() {
                var _this = this;
                this.render();   
                
                //show login status and available prognoses on user change
                if (app.session) 
                    app.session.bind("change:user", function() {_this.displayUserContent()});                     
                                                
                //change active item if navbar item is clicked
                $('ul.nav > li').click(function (e) {
                    $(this).siblings().removeClass('active');
                    $(this).addClass('active');                
                });      
                
            },

            events: {
                'click .menu-link': 'openSubMenu'
            },

            // Renders the view's template to the UI
            render: function() {         
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;  
                this.displayUserContent();
                return this;

            },
            
            displayUserContent: function(){
                //change the text of the menu item, to show, that the user is logged in
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
                
                var progSelector = this.el.querySelector("#progSelect");               
                while (progSelector.firstChild) {
                    progSelector.removeChild(progSelector.firstChild);
                };
                         
                app.attributes.activePrognosis = null;
                //update prognoses available for this user
                app.prognoses.fetch({success: function(){     
                    new OptionView({el: progSelector, name: 'Bitte wählen', value: -1}); 
                    app.prognoses.each(function(prognosis){
                        new OptionView({
                            el: progSelector,
                            name: prognosis.get('name'), 
                            value: prognosis.get('id')
                        })
                    });
                    progSelector.onchange = function(t) {
                        var pid = t.target.value;    
                        app.set("activePrognosis", pid);
                        app.router.navigate("prognosen", {trigger: true});
                        $('#prognosis-menu').find('li').removeClass('active');
                    };                    
                }});
            },
            
            openSubMenu: function(event){
                $('.submenu').removeClass('active');
                var id = event.target.id;
                if(id === 'prognosis')
                    $('#prognosis-menu').addClass('active');
                else if(id === 'login')
                    $('#login-menu').addClass('active');
                else if(id === 'admin')
                    $('#admin-menu').addClass('active');
            }
         

        });

        // Returns the View class
        return NavbarView;

    }

);