define(["app", "jquery", "backbone", "text!templates/login.html"],
  function (app, $, Backbone, template) {
    
    /**
     * A View that renders a login and registration form onto the screen. 
     * Shows informations about the login status, if already logged in
     *
     * @param  options.el        the tag of the DOM Element, the view will be rendered in
     * @param  options.session   a LoginModel with the current login status 
     * @return                   the LoginView class
     * @see                      a login and registration form
     */
    var LoginView = Backbone.View.extend({
      // The DOM Element associated with this view
      el: "#mainFrame",
      //constructor
      initialize: function () {
        var _this = this;

        //render view, each time user changes (to show login status)
        if (app.get('session'))
          app.get('session').bind("change:user", function () {
            _this.render()
          });
        this.render();
      },
      // the Event Handlers of the login form
      events: {
        "click #login-button": "login",
      },
      // Renders the view's template to the UI
      render: function () {
        // Setting the view's template property using the Underscore template method
        this.template = _.template(template, {});

        // Dynamically updates the UI with the view's template
        this.$el.html(this.template);
        var user = app.get('session').get('user');
        if (user) {
          $(this.el).find('.checkbox').hide();
          $(this.el).find('#login-button').text('Ausloggen');
          //no changes wanted 
          $(this.el).find("input").prop('disabled', true);
          $(this.el).find('#name').val(user.name);
          $(this.el).find('#email').val(user.email);
          $(this.el).find('#password').val(user.password);
          var status =
                  $(this.el).find('#status');
          if (user.superuser)
            status.text('Sie sind als Superuser angemeldet');
          else
            status.text('Sie sind eingeloggt.');
        }
        else {
          $(this.el).find('#email').hide();
          $(this.el).find('.checkbox').show();
          $(this.el).find('#mail-label').hide();
          $(this.el).find('#login-button').text('Einloggen');
        }

        // Maintains chainability
        return this;
      },
      //log in with the entries made in the login form
      login: function () {
        var _this = this;
        if ($(this.el).find('#login-button').text() === 'Einloggen') {
          var name = $(this.el).find('#name').val() || '',
                  password = $(this.el).find('#password').val() || '',
                  stayLoggedIn = $(this.el).find('#stay-check').is(":checked");
          app.get('session').login({
            name: name,
            password: password,
            stayLoggedIn: stayLoggedIn,
            error: function (response) {
              $(_this.el).find('#status').text(response);
            }
          });
        }
        else
          app.get('session').logout();
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