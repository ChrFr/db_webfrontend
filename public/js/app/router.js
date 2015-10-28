define(['app', 'backbone', 'views/CustomView',
  'views/LoginView', 'views/PrognosisView', 'views/AdminView',
  'text!templates/home.html', 'text!templates/legaldetails.html'],
  function (app, Backbone, Custom, Login, Prognosis, Admin, homeTemplate, legalTemplate) {
            
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
        'prognosen': 'prognosen',
        'login': 'login',
        'admin': 'admin',
        'impressum': 'impressum'
      },
      
      // welcome page
      home: function(){
        this.resetView();
        this.view = new Custom({
          el: document.getElementById('mainFrame'),
          templateString: homeTemplate
        });
      },
      
      impressum: function(){  
        this.resetView();      
        this.view = new Custom({
          el: document.getElementById('mainFrame'),
          templateString: legalTemplate
        });
      },
      
      // prognoses overview / selection
      prognosen: function() {
        this.resetView();
        this.view = new Prognosis({el: document.getElementById('mainFrame')});
      },
      
      // login page
      login: function() {
        this.resetView();
        this.view = new Login({el: document.getElementById('mainFrame'),
          session: this.session});
      },
      
      // admin area
      admin: function(){
        this.resetView();
        var user = app.get('session').get('user');
        if (user && user.superuser)
          this.view = new Admin({el: document.getElementById('mainFrame')});
      },
      
      // remove old view and events on it
      resetView: function(){
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