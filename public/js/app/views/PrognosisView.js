
define(["app", "jquery", "backbone", "text!templates/prognosis.html"],

    function(app, $, Backbone, template){
        var PrognosisView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {         
                // Calls the view's render method
                this.render();  
            },

            events: {
                
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;  
                //id of active prognosis changed in navbar -> render it
                app.bind("activePrognosis", function(){
                    _this.renderPrognosis(app.get("activePrognosis"));
                });                
                this.renderPrognosis(app.get("activePrognosis"));
                return this;
            },       
            
            renderPrognosis: function(pid){
                var title = this.el.querySelector("#title");
                var text = this.el.querySelector("#description");
                if(!text)
                    return;
                if (!pid || pid < 0){
                    title.innerText = "Bitte eine Prognose im Menü auswählen!";
                    text.innerHTML = '';
                    return;
                }
                else{
                    var prognosis = app.prognoses.find(function(item){
                        return item.get('id') == pid;
                    });
                    
                    title.innerText = prognosis.get('name');
                    text.innerHTML = prognosis.get('description');
                }
            },
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return PrognosisView;

    }

);