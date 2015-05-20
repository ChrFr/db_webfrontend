
var d3 = require('d3'),
    jsdom = require('jsdom'),
    AgeTree = require("../public/js/app/views/visuals/AgeTree"),
    htmlStub = '<html><head></head><body><div id="dataviz-container"></div><script src="js/d3.v3.min.js"></script></body></html>',
    fs = require('fs'),
    visualsCss = fs.readFileSync("./public/css/visuals.css", 'utf8');

//var exports;
exports.renderAgeTree = (function(options, callback){
    var data = options.data,
        width = options.width,
        height = options.height,
        maxX = options.maxX || Math.max(d3.max(data.alter_weiblich), d3.max(data.alter_maennlich)),
        maxY = options.maxY || Math.max(data.alter_weiblich.length, data.alter_maennlich.length);
        
    // pass the html stub to jsDom
    jsdom.env({ features : { QuerySelector : true }, html : htmlStub,
        done : function(errors, window) {   
            
            var el = window.document.querySelector('#dataviz-container');
            
            if(!maxY)
                var maxY = Math.max(data.alter_weiblich.length, data.alter_maennlich.length);
            
            var ageTree = new AgeTree.init({
                el: el,
                data: data, 
                width: width, 
                height: height,
                maxX: maxX,
                maxY: maxY,
                css: visualsCss
            });
            ageTree.render(callback);
        }
    });
});