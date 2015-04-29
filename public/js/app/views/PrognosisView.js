
define(["backbone", "text!templates/prognosis.html",  
    "collections/AgeCollection", "collections/RegionCollection", 
    "collections/PrognosisCollection", "views/OptionView", 
    "views/DemographicDevelopmentView"],

    function(Backbone, template, AgeCollection, RegionCollection, 
            PrognosisCollection, OptionView, DemographicDevelopmentView){
        var PrognosisView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: document,
            // View constructor
            initialize: function() {         
                // Calls the view's render method
                this.collection = new PrognosisCollection();
                this.render();  
            },

            events: {
                
            },

            render: function() {
                var _this = this;
                this.template = _.template(template, {});
                this.el.innerHTML = this.template;   
                
                var regions = new RegionCollection();
                var progSelector = this.el.querySelector("#progSelect");
                var regionSelector = this.el.querySelector("#rsSelect");
                
                this.collection.fetch({success: function(){
                    new OptionView({el: progSelector, name: 'Bitte wählen', value: -1}); 
                    _this.collection.each(function(prognosis){
                        new OptionView({
                            el: progSelector,
                            name: prognosis.get('name'), 
                            value: prognosis.get('id')
                        })
                    });
                    progSelector.onchange = function(t) {
                        var pid = t.target.value;         
                        _this.renderPrognosis(pid);
                    };                    
                }});
                                           
                return this;
            },       
            
            renderPrognosis: function(pid){
                var textarea = this.el.querySelector("#description");
                if (pid < 0){
                    textarea.value = '';
                    return;
                }
                var prognosis = this.collection.find(function(item){
                    return item.get('id') == pid;
                });
                textarea.value = prognosis.get('description');
                
                var progView = new DemographicDevelopmentView({
                    el: this.el.querySelector("#demographics")})
                /*
                var _this = this;
                var ageColl = new AgeCollection({rs: this.rs});
                ageColl.fetch({success: function(){
                    var dataView = _this.el.querySelector("#dataView");
                    _this.dataView = new DemographicDevelopmentView({
                        el: dataView,
                        collection: ageColl});
                }});*/
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