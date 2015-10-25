/*
 * @author Christoph Franke
 * 
 * @desc convert given svg to png, call saveas-dialog of browser
 * 
 * @param svg      the svg-element to be converted 
 * @param scale    resizing factor (e.g. scale=2 doubles the resolution of the
 *                 created png-file)
 * @param filename proposal of the name of the file inside the saveas-dialog
 * @param canvas   auxiliary canvas element, the svg element will be drawn into
 */
function downloadPng(svg, filename, canvas, scale) {
  var oldWidth = svg.width(),
      oldHeight = svg.height(),
      oldScale = svg.attr('transform') || '';

  //change scale
  if (scale) {
    svg.width(scale.width * oldWidth);
    svg.height(scale.height * oldHeight);
    svg.attr('transform', 'scale(' + scale.width + ' ' + scale.height + ')');
  }

  //get svg plain text (eventually scaled)
  var svgText = new XMLSerializer().serializeToString(svg[0]);

  //reset scale
  if (scale) {
    svg.height(oldHeight);
    svg.width(oldWidth);
    svg.attr('transform', oldScale);
  }

  //draw svg on hidden canvas
  canvg(canvas, svgText);

  //save canvas to file
  var dataURL = canvas.toDataURL('image/png');
  // convert the dataURL to a blob-string
  var blob = dataURLtoBlob(dataURL);
  //call saveas-dialog
  window.saveAs(blob, filename);

  /*
   // this kind of download works with Chrome only
   var link = document.createElement('a');
   link.download = filename;
   link.href = dataURL;            
   link.click();
   */
};

/*
 * convert a dataURI to a blob-string
 * source: http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 */
function dataURLtoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);
  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type: mimeString});
};
