define(['app', 'jquery', 'backbone', 'text!templates/navbar.html', 'views/OptionView'],
  function (app, $, Backbone, template, OptionView) {
    
    /**
     * @author Christoph Franke
     * 
     * @desc A View that renders the Main Navigation Bar
     *
     * @param options.el       the tag of the DOM Element, the view will be rendered in
     * @param options.session  a LoginModel with the current login status 
     * @return                 the NavbarView class
     * @see                    the main navigation bar
     */
    var NavbarView = Backbone.View.extend({
      // The DOM Element associated with this view
      el: '.navbar.navbar-default',
      // constructor
      initialize: function () {
        var _this = this;
        this.render();

        //show login status and available prognoses on user change
        if (app.get('session'))
          app.get('session').bind('change:user', function () {
            _this.displayUserContent();
          });
        //update navbar on route change
        app.get('router').on('route', _this.displayRoute);
        //display current route (needed when entering site or reload)
        this.displayRoute(app.get('router').routes[Backbone.history.getFragment()]);
      },
      events: {
        'click .menu-link': 'openSubMenu'
      },
      // Renders the view's template to the UI
      render: function () {
        this.template = _.template(template, {});
        this.el.innerHTML = this.template;
        this.displayUserContent();
        return this;

      },
      displayUserContent: function () {
        //change the text of the menu item, to show, that the user is logged in
        var session = app.get('session');
        if (session.get('user')) {
          var user = session.get('user');
          this.$el.find('#login').text('Eingeloggt als ' + user.name);
          if (user.superuser) {
            this.el.querySelector('#admin').style.display = 'block';
          }
          else
            this.el.querySelector('#admin').style.display = 'none';
        }
        else {
          this.el.querySelector('#admin').style.display = 'none';
          this.$el.find('#login').text('Einloggen');
        }

        var progSelector = this.el.querySelector('#progSelect');
        while (progSelector.firstChild) {
          progSelector.removeChild(progSelector.firstChild);
        };

        app.set('activePrognosis', null, true); //reset prognosis (suppress event while setting to null, trigger later on)
        var progTabs = this.el.querySelector('#prognosis-collapse').querySelector('ul');
        progTabs.style.display = 'none';

        //update prognoses available for this user
        var prognoses = app.get('prognoses');
        prognoses.fetch({success: function () {
            new OptionView({el: progSelector, name: 'Bitte wählen', value: -1});
            prognoses.each(function (prognosis) {
              new OptionView({
                el: progSelector,
                name: prognosis.get('name'),
                value: prognosis.get('id')
              });
            });
            progSelector.onchange = function (t) {
              var pid = t.target.value;
              var prognosis = prognoses.get(pid);
              if(prognosis)
                prognosis.fetch({success: function(){
                  app.set('activePrognosis', prognosis);              
                  if(pid)
                    progTabs.style.display = 'block';
                  else
                    progTabs.style.display = 'none';
                  app.get('router').navigate('prognosen', {trigger: true});
                  }
                });
              else
                app.set('activePrognosis', null); 
            };            
          }});
      },
      
      openSubMenu: function (event) {
        $('.submenu').removeClass('active');
        var id = event.target.id;
        if (id === 'prognosis')
          $('#prognosis-menu').addClass('active');
        else if (id === 'login')
          $('#login-menu').addClass('active');
        else if (id === 'admin')
          $('#admin-menu').addClass('active');
      },
      
      displayRoute: function (route, params) {
        $('.submenu').removeClass('active');
        var item = $('');
        var subitem = $('');
        if (route === 'home') {
          item = $('#main-menu').find('#home').parent();
          $('#home-menu').addClass('active');
        }
        else if (route === 'prognoses') {
          item = $('#main-menu').find('#prognosis').parent();
          subitem = $('.submenu').find('#prognosis-content').parent();
          $('#prognosis-menu').addClass('active');
        }
        else if (route === 'login') {
          item = $('#main-menu').find('#login').parent();
          $('#login-menu').addClass('active');
        }
        else if (route === 'admin') {
          item = $('#main-menu').find('#admin').parent();
          $('#admin-menu').addClass('active');
        }
        item.siblings().removeClass('active');
        item.addClass('active');
        subitem.siblings().removeClass('active');
        subitem.addClass('active');
      }
    });

    // Returns the View class
    return NavbarView;
  }
);