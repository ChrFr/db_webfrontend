define(["backbone", "text!templates/admin.html", 
    "collections/UserCollection", "collections/PrognosisCollection", 
    "views/TableView", "bootstrap"],

    function(Backbone, template, UserCollection, PrognosisCollection, TableView){
        var AdminView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {       
                var _this = this;
                _.bindAll(this, 'render');
                this.users = new UserCollection();
                this.prognoses = new PrognosisCollection();
                //TODO load on click on tab
                this.users.fetch({success: function(){
                    _this.prognoses.fetch({success: _this.render});
                }});
            },

            events: {
                
            },

            render: function() {
                this.template = _.template(template, {});
                
                this.el.innerHTML = this.template;   
                
                this.renderUserTable();
                this.renderPrognoses();
                return this;
            },            
                        
            renderUserTable: function(){
                var columns = [];
                var data = [];            
                
                columns.push({name: "id", description: "ID"});
                columns.push({name: "name", description: "Name"});                
                columns.push({name: "email", description: "E-Mail"});               
                columns.push({name: "superuser", description: "Superuser"});             
                columns.push({name: "password", description: "Passwort"});
                
                this.users.each(function(user){
                    data.push({
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email'),
                        'superuser': user.get('superuser')
                    });
                });
                console.log(data)
                new TableView({
                    el: this.el.querySelector("#usertable"),
                    columns: columns,
                    data: data,
                    selectable: true
                });
            },
            
            renderPrognoses: function(){
                var columns = [];
                var data = [];       
                
                columns.push({name: "id", description: "ID"});
                columns.push({name: "name", description: "Name"});    
                
                this.prognoses.each(function(user){
                    data.push({
                        'id': user.get('id'),
                        'name': user.get('name')
                    });
                });
                 
                new TableView({
                    el: this.el.querySelector("#prognosestable"),
                    columns: columns,
                    data: data,
                    selectable: true
                });
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