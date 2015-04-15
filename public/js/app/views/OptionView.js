define(["backbone"],

    function(Backbone){
        var OptionView = Backbone.View.extend({
            el: null,
            
            initialize: function(options) {       
                this.name = options.name;
                this.value = options.value;
                this.render();
            },
            
            render: function() {
                var option = document.createElement("option");
                option.value = this.value;
                option.innerHTML = this.name;
                this.el.appendChild(option);
            }
        });

        // Returns the View class
        return OptionView;

    }

);