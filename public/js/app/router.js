define(['app', 'backbone', 'views/HomeView',
  'views/LoginView', 'views/PrognosisView', 'views/AdminView',
  'views/DemographicDevelopmentView', 'views/HouseholdsDevelopmentView'],
  function (app, Backbone, Home, Login, Prognosis, Admin,
          DemographicDevelopmentView, HouseholdsDevelopmentView) {
            
    /** 
    * @author Christoph Franke
    * 
    * @desc Routes the applications URL's when using hash tags. 
    */        
    var Router = Backbone.Router.extend({
      
      initialize: function () {
        Backbone.history.start(); // backbone history tracks last visited routes (for use of 'back' in browser)
      },
      
      // the routes (<baseURL>/#<name of route>)
      routes: {
        '': 'home',
        'prognosen': 'prognoses',
        'login': 'login',
        'admin': 'admin',
        'bevoelkerungsprognose': 'demodevelop',
        'haushaltsprognose': 'hhdevelop'
      },
      
      // welcome page
      home: function () {
        this.resetView();
        this.view = new Home({el: document.getElementById('mainFrame')});
      },
      
      // prognoses overview / selection
      prognoses: function () {
        this.resetView();
        this.view = new Prognosis({el: document.getElementById('mainFrame')});
      },
      
      // login page
      login: function () {
        this.resetView();
        this.view = new Login({el: document.getElementById('mainFrame'),
          session: this.session});
      },
      
      // admin area
      admin: function () {
        this.resetView();
        var user = app.get('session').get('user');
        if (user && user.superuser)
          this.view = new Admin({el: document.getElementById('mainFrame')});
      },
      
      // remove old view and events on it
      resetView: function () {
        if (this.view)
          this.view.close();
        //unbinding and removing views removes the parent element too
        if (!document.getElementById('mainFrame')) {
          var mainFrame = document.createElement('div');
          mainFrame.id = 'mainFrame';
          document.body.appendChild(mainFrame);
        }
      }
    });

    return Router;
  }
);