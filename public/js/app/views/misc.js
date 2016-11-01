/*
 Author: Christoph Franke
 Publisher: GGR
 */

/*
 * create and return a div containing a bootstrap-alert with the given type and text
 * available types: success, info, danger, warning
 */
function createAlert(type, text) {
  var div = document.createElement('div');
  div.innerHTML = '<div class="alert alert-' + type + '">' +
          '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
          text;
  return div;
};

/*
 * clear given dom-element by removing its children
 */
function clearElement(el){
  while (el.firstChild)
    el.removeChild(el.firstChild);
}