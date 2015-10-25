/** 
 * @author Christoph Franke
 * 
 * @desc initialize the app
 */

require(['app', 'router', 'models/SessionModel', 'views/NavbarView',
  'collections/PrognosisCollection'],
  function (app, Router, SessionModel, Navbar, PrognosisCollection) {
    
    // before anything else happens, check if user is already logged by checking cookies (server-side)
    var session = new SessionModel();
    app.set('session', session);
    session.fetch({
      success: render,
      error: render // render in any case (if logged in or not)
    });

    // already fetched prognosis are stored globally
    app.set('prognoses', new PrognosisCollection());

    // render site
    function render() {
      // important: router needs to be loaded first (navbar links to it)
      app.set('router', new Router()); // render subsites provided by router
      app.set('navbar', new Navbar()); // render navbar
    }
  }
);