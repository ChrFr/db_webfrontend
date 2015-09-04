/** 
* @author Christoph Franke
* 
* @desc class for adding/removing animated loader image to a div
*/
var Loader = function (parent) {
    var div = document.createElement('div');
    div.className = 'loader';
    parent.appendChild(div);
    
    this.remove = function(){
        parent.removeChild(div);
    }
    
    return this;
}