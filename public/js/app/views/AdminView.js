define(["jquery", "backbone", "text!templates/admin.html", 
    "collections/UserCollection", "collections/PrognosisCollection",
    "models/UserModel",
    "views/TableView", "bootstrap"],

    function($, Backbone, template, UserCollection, PrognosisCollection, 
            UserModel, TableView){
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
                //'click #userLink': 'showUserTable',
                //'click #progLink': 'showPrognoses',
                'click #newUser, #editUser, #deleteUser': 'showModal',
                'click :submit.post': 'onSubmit',                
                'click :submit.delete': 'onDelete'
            },

            render: function() {
                this.template = _.template(template, {});                
                this.el.innerHTML = this.template;   
                
                $('.alert').hide();
                
                this.showUserTable();
                this.showPrognoses();
                return this;
            },            
                        
            showUserTable: function(){
                
                //workaround: bootstrap pills sometimes fails setting active tab
                //$('.tab-pane').removeClass('active');
                //$('#usertable').parent().addClass('active');
                
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
                            'superuser': user.get('superuser'),
                            'password': '&#8226;&#8226;&#8226;&#8226;'
                        });
                    });
                    
                    _this.userTable = new TableView({
                        el: _this.el.querySelector("#usertable"),
                        columns: columns,
                        data: data,
                        selectable: true
                    });
                }});
            },
            
            showPrognoses: function(){
                
                //workaround: bootstrap pills sometimes fails setting active tab
                //$('.tab-pane').removeClass('active');
                //$('#prognosestable').parent().addClass('active');
                
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

                    _this.prognosisTable = new TableView({
                        el: _this.el.querySelector("#prognosestable"),
                        columns: columns,
                        data: data,
                        selectable: true
                    });    
                }});
            },
            
            //show modal dialogs depending on button clicked
            showModal: function(event){
                var dialog,
                    models = [],
                    _this = this,
                    target = event.target.id;
            
                if(target === 'newUser'){
                    dialog = $('#editUserDialog');
                    models = [new UserModel()];
                }
                else if(target === 'editUser' && this.userTable){
                    var selected = this.userTable.getSelections();
                    if(selected.length === 0){
                        this.alert('warning', 'Sie müssen einen Nutzer auswählen!');
                        return;
                    }
                    else if(selected.length > 1){
                        this.alert('warning', 'Sie können nur einen Nutzer gleichzeitig editieren!');
                        return;
                    }
                    dialog = $('#editUserDialog');
                    var userId = selected[0].id
                    models = [this.users.get(userId)];
                }
                else if(target === 'deleteUser'){
                    var selected = this.userTable.getSelections();
                    if(selected.length === 0){
                        this.alert('warning', 'Sie müssen einen Nutzer auswählen!');
                        return;
                    }
                    _.each(selected, function(selection){
                        var userId = selection.id
                        models.push(_this.users.get(userId));
                    });  
                    dialog = $('#deleteDialog');
                }
                
                if (dialog){
                    $('.alert').hide();
                    //no effect for deletion, as it has no inputs
                    this.fillForm(dialog, models[0]);
                    dialog.modal('show');
                    this.activeDialog = dialog;
                    this.selectedModels = models;                    
                }                    
            },
            
            fillForm: function(dialog, model){                
                var inputs = dialog.find('input');
                _.each(inputs, function(input){
                    var input = $(input);
                    var value = model.get(input.attr('name'));
                    if(input.attr('type') === 'checkbox') 
                        input.prop('checked', value);
                    else 
                        value = input.val(value);
                });  
            },
            
            //combination of put and post forms
            //parse form inputs into model and submit it
            onSubmit: function(){
                //console.log(event);
                var _this = this;
                //by now only one model supported for submission
                var model = _this.selectedModels[0];
                if(this.validateForm()){
                    this.activeDialog.modal('hide');
                    var inputs = this.activeDialog.find('input');
                    _.each(inputs, function(input){
                        var input = $(input);
                        var value = '';
                        if(input.attr('type') === 'checkbox') 
                            value = input.prop('checked');
                        else 
                            value = input.val();
                        model.set(input.attr('name'), value);
                    });                    
                    model.save({}, {  
                        dataType: 'text',
                        success: function(m, response){
                            _this.alert('success', 'Anfrage war erfolgreich!');
                            _this.showUserTable();
                            _this.showPrognoses();
                        },
                        error: function(m, response) {
                            _this.alert('danger', response.responseText);
                        }
                    });
                }
            },
            
            onDelete: function(){ 
                var _this = this;
                _.each(this.selectedModels, function(model){
                    model.destroy({
                        dataType: 'text', 
                        success: function(m, response){
                            _this.alert('success', 'Löschen war erfolgreich!');
                            _this.showUserTable();
                            _this.showPrognoses();
                        },
                        error: function(m, response) {
                            _this.alert('danger', response.responseText);
                        }
                    });
                });
                this.activeDialog.modal('hide');
            },
            
            validateForm: function(){
                var inputs = this.activeDialog.find('input');
                inputs.removeClass('invalid');
                var errMsg = '';
                _.each(inputs, function(input){
                    input = $(input);
                    if(input.hasClass('needed') && !input.val()){
                        input.addClass('invalid');
                        errMsg = 'Bitte alle Pflichtfelder ausfüllen!'
                    }
                });
                this.activeDialog.find('#status').text(errMsg);
                if(errMsg)
                    return false;
                return true;
            },     
            
            alert: function(type, message){
                $('.alert').hide();
                var alertDiv = $('.alert-' + type);
                alertDiv.find('label').text(message);
                alertDiv.show();
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