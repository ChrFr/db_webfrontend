define(["jquery", "backbone", "text!templates/admin.html", 
    "collections/UserCollection", "collections/PrognosisCollection", 
    "views/TableView", "bootstrap"],

    function($, Backbone, template, UserCollection, PrognosisCollection, TableView){
        var AdminView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                var _this = this;
                _.bindAll(this, 'render');
                this.users = null;
                this.prognoses = null;
                this.render();
                //this.users.bind('reset', this.renderUserTable, this);
                //this.users.bind('change', this.renderUserTable, this);
                //this.users.fetch({success: _this.render});
            },

            events: {
                'click #userLink': 'showUserTable',
                'click #progLink': 'showPrognoses'
            },

            render: function() {
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;   
                
                this.showUserTable();
                return this;
            },            
                        
            showUserTable: function(){
                
                //workaround: bootstrap pills sometimes fails setting active tab
                $('.tab-pane').removeClass('active');
                $('#usertable').parent().addClass('active');
                if(this.users)
                    return;
                
                this.users = new UserCollection();
                var _this = this;
                this.users.fetch({success: function(){
                    var columns = [];
                    var data = [];            

                    columns.push({name: "id", description: "ID"});
                    columns.push({name: "name", description: "Name"});                
                    columns.push({name: "email", description: "E-Mail"});               
                    columns.push({name: "superuser", description: "Superuser"});             
                    columns.push({name: "password", description: "Passwort"});

                    _this.users.each(function(user){
                        data.push({
                            'id': user.get('id'),
                            'name': user.get('name'),
                            'email': user.get('email'),
                            'superuser': user.get('superuser')
                        });
                    });
                    
                    new TableView({
                        el: _this.el.querySelector("#usertable"),
                        columns: columns,
                        data: data,
                        selectable: true
                    });
                }});
            },
            
            showPrognoses: function(){
                
                //workaround: bootstrap pills sometimes fails setting active tab
                $('.tab-pane').removeClass('active');
                $('#prognosestable').parent().addClass('active');
                
                if(this.prognoses)
                    return;
                
                this.prognoses = new PrognosisCollection();
                var _this = this;
                this.prognoses.fetch({success: function(){
                    var columns = [];
                    var data = [];       

                    columns.push({name: "id", description: "ID"});
                    columns.push({name: "name", description: "Name"});    

                    _this.prognoses.each(function(prog){
                        data.push({
                            'id': prog.get('id'),
                            'name': prog.get('name')
                        });
                    });

                    new TableView({
                        el: _this.el.querySelector("#prognosestable"),
                        columns: columns,
                        data: data,
                        selectable: true
                    });    
                }});
            },
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return AdminView;

    }

);