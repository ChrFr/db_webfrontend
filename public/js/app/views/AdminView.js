define(["jquery", "backbone", "text!templates/admin.html",
  "collections/UserCollection", "collections/PrognosisCollection",
  "models/UserModel", "models/PrognosisModel",
  "views/TableView", "bootstrap"],
  function($, Backbone, template, UserCollection, PrognosisCollection,
            UserModel, PrognosisModel, TableView){
                            
    /** 
    * @author Christoph Franke
    * 
    * view on the admin area to administer users and prognoses-data
    *  
    * @return the AdminView class
    * @see    admin area with editable data-tables
    */        
    var AdminView = Backbone.View.extend({
      
      // The DOM Element associated with this view
      el: document,
      // View constructor
      initialize: function(){
        _.bindAll(this, 'render');
        this.users = null;
        this.prognoses = null;
        this.render();
        //this.users.bind('reset', this.renderUserTable, this);
        //this.users.bind('change', this.renderUserTable, this);
        //this.users.fetch({success: _this.render});
      },
      
      events: {
        'click #newUser, #editUser, #deleteUser, #newPrognosis, #editPrognosis, #deletePrognosis': 'showModal',
        'click :submit.post': 'onSubmit',
        'click :submit.delete': 'onDelete'
      },
      
      render: function(){
        this.template = _.template(template, {});
        this.el.innerHTML = this.template;

        // hide all alerts at the start
        $('.alert').hide();
        
        this.showUserTable();
        this.showPrognoses();
        return this;
      },
      
      showUserTable: function(){

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

        this.prognoses = new PrognosisCollection();
        var _this = this;
        this.prognoses.fetch({success: function(){
          var columns = [];
          var data = [];

          columns.push({name: "id", description: "ID"});
          columns.push({name: "name", description: "Name"});
          columns.push({name: "description", description: "Beschreibung"});
          columns.push({name: "users", description: "berechtigte Nutzer"});

          _this.prognoses.each(function(prog){
            var description = prog.get('description') || '';
            if(description.length > 100)
              description = description.substring(0, 100) + " [...]";
            data.push({
              'id': prog.get('id'),
              'name': prog.get('name'),
              'description': description,
              'users': prog.get('users')
            });
          });

          _this.prognosisTable = new TableView({
            el: _this.el.querySelector("#prognosestable"),
            columns: columns,
            data: data,
            selectable: true
          });    
        }});
        
        var preview = this.el.querySelector("#preview");
        var textinput = this.el.querySelector("#description");
        textinput.oninput = function(){
          preview.innerHTML = textinput.value;
        };        
      },
      
      //show modal dialogs depending on button clicked
      showModal: function(event){
        var dialog,
                models = [],
                _this = this,
                target = event.target.id;

        // USERS

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
          var userId = selected[0].id;
          models = [this.users.get(userId)];
        }
        else if(target === 'deleteUser'){
          var selected = this.userTable.getSelections();
          if(selected.length === 0){
            this.alert('warning', 'Sie müssen einen Nutzer auswählen!');
            return;
          }
          _.each(selected, function(selection){
            var userId = selection.id;
            models.push(_this.users.get(userId));
          });
          dialog = $('#deleteDialog');
        }

        // PROGNOSES

        else if(target === 'deletePrognosis'){
          var selected = this.prognosisTable.getSelections();
          if(selected.length === 0){
            this.alert('warning', 'Sie müssen eine Prognose auswählen!');
            return;
          }
          _.each(selected, function(selection){
            var progId = selection.id;
            models.push(_this.prognoses.get(progId));
          });
          dialog = $('#deleteDialog');
        }

        else if(target === 'newPrognosis'){
          dialog = $('#editPrognosisDialog');
          models = [new PrognosisModel()];
        }
        else if(target === 'editPrognosis' && this.prognosisTable){
          var selected = this.prognosisTable.getSelections();
          if(selected.length === 0){
            this.alert('warning', 'Sie müssen eine Prognose auswählen!');
            return;
          }
          else if(selected.length > 1){
            this.alert('warning', 'Sie können nur eine Prognose gleichzeitig editieren!');
            return;
          }
          dialog = $('#editPrognosisDialog');
          var progId = selected[0].id;
          models = [this.prognoses.get(progId)];
          
        }

        if(dialog){
          $('.alert').hide();
          //no effect for deletion, as it has no inputs
          this.fillForm(dialog, models[0]);
          
          dialog.modal('show');
          this.activeDialog = dialog;
          this.selectedModels = models;    
          
          // ADDITIONAL FILLINGS
          
          // Prognoses          
          if(target === 'newPrognosis' || target === 'editPrognosis'){   
            // description text
            var preview = this.el.querySelector("#preview");
            var textinput = this.el.querySelector("#description");
            preview.innerHTML = textinput.value;
            
            // users
            var usersCheck = _this.el.querySelector("#user-select>div");
            var userIDs = [];
            while (usersCheck.firstChild)
              usersCheck.removeChild(usersCheck.firstChild);
            if (target === 'editPrognosis')
              userIDs = models[0].get('users');
            
            _this.users.fetch({success: function(){
              _this.users.each(function(user){
                // add checkbox for each user in db (superusers can access everything anyway)
                if(!user.get('superuser')){
                  var checkbox = document.createElement('input');              
                  checkbox.type = "checkbox";
                  var id = user.get('id');            
                    if(userIDs.indexOf(id) > -1)
                      checkbox.checked = true;
                    checkbox.value = id;
                    usersCheck.appendChild(checkbox);
                    usersCheck.appendChild(document.createTextNode(user.get('name') + " - ID " + id));
                    usersCheck.appendChild(document.createElement('br'));   
                };
              });
            }});
          }      
        }        
      },
      
      // fill the form inside the given dialog with the attributes of the model (the 'name' of the field hast to match an attribute of the model to be filled)
      fillForm: function(dialog, model){
        var inputs = dialog.find('input, textarea');
        _.each(inputs, function(input){
          var input = $(input);
          var value = model.get(input.attr('name'));
          if(input.attr('type') === 'checkbox')
            input.prop('checked', value);
          else
            value = input.val(value);
        });
      },
      
      // combination of put and post forms
      // parse form inputs into model and submit it
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
              // update tables
              _this.showUserTable();
              _this.showPrognoses();
            },
            error: function(m, response){
              _this.alert('danger', response.responseText);
            }
          });
        }
      },
      
      // send the command to destroy all selected models (users or prognoses) to the server
      onDelete: function(){
        var _this = this;
        _.each(this.selectedModels, function(model){
          model.destroy({
            dataType: 'text',
            success: function(m, response){
              _this.alert('success', 'Löschen war erfolgreich!');
              // update tables
              _this.showUserTable();
              _this.showPrognoses();
            },
            error: function(m, response){
              _this.alert('danger', response.responseText);
            }
          });
        });
        this.activeDialog.modal('hide');
      },
      
      // check if all needed fields are filled (they have the class "needed")
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
      
      // show the given alert message
      // types can be warning, alert and danger
      alert: function(type, message){
        $('.alert').hide();
        var alertDiv = $('.alert-' + type);
        alertDiv.find('label').text(message);
        alertDiv.show();
      },
      
      //remove the view
      close: function(){
        this.unbind(); // Unbind all local event bindings
        this.remove(); // Remove view from DOM
      }

    });

    // Returns the View class
    return AdminView;
  }
);