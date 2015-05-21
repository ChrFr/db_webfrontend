
define(["app", "backbone", "text!templates/prognosis.html", 
    "views/DemographicDevelopmentView"],

    function(app, Backbone, template, DemographicDevelopmentCollection,
            DemographicDevelopmentView){
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
                app.onChange("activePrognosis", function(){
                    _this.renderPrognosis(app.get("activePrognosis"));
                });
                this.renderPrognosis(app.get("activePrognosis"));
                return this;
            },       
            
            renderPrognosis: function(pid){
                var textarea = this.el.querySelector("#description");
                if(!textarea)
                    return
                if (!pid || pid < 0){
                    textarea.value = 'Bitte eine Prognose im Menü auswählen!';
                    return;
                }
                else{
                    var prognosis = app.prognoses.find(function(item){
                        return item.get('id') == pid;
                    });

                    textarea.value = prognosis.get('description');
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