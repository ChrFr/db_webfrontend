
define(["backbone", "text!templates/test.html", "collections/AgeCollection", "views/AgeTreeView"],

    function(Backbone, template, AgeCollection, AgeTreeView){
        var HomeView = Backbone.View.extend({
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
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;      
                var maleFemale = new AgeCollection({rs: '130730035', 
                                                    year: '2011'})
                                     
                var agetree = new AgeTreeView({el: this.el.getElementsByClassName("visualization"),
                                               collection: maleFemale});
                                           
                return this;
            },        
            
            //remove the view
            close: function () {
                this.unbind(); // Unbind all local event bindings
                this.remove(); // Remove view from DOM
            }

        });

        // Returns the View class
        return HomeView;

    }

);