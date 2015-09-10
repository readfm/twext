/**
* Image class represents img element.
*/
Image = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.image = $('#image'); // image DOM element
    this.container = $('#imgContainer');  // video container DOM element

    // allow drag/drop images
    allowDragDrop(this.container[0], this.onDropImage);
  },

  /**
  * On drop image into ImageResource.
  */
  onDropImage: function(data) {
    if(!controller.gifArea.isVisible()) return;

    var k = null;
    // display dropped image
    var imageEl = $(data.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      controller.image.load(imageUrl);
      k = controller.thumbsHandler.saveThumb(imageUrl); //save into fb
      controller.thumbsHandler.createThumb(imageUrl, k).click();
    } else {  // not valid url, image maybe local file
      var f = data.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        fr.onload = function(ev) {  // file reader done with reading file
          controller.image.load(ev.target.result);
          k = controller.thumbsHandler.saveThumb(ev.target.result); //save into fb
          controller.thumbsHandler.createThumb(ev.target.result, k).click();
        };
        fr.readAsDataURL(f);
      }
    }
  },

  /**
  * Load Image with the given url.
  * @param 'url' image src url
  */
  load: function(url) {
    this.image.attr('src', url);
  },

  /**
  * Show image.
  */
  show: function() {
    this.container.show();
    $('#playerContainer').show();
  },

  /**
  * Hide image.
  */
  hide: function() {
    this.container.hide();
    $('#playerContainer').hide();
  },

  /**
  * Check if there is an image loaded in the element.
  * @return true if image loaded, false if not
  */
  isOn: function() {
    if(this.image && this.image.attr('src')) return true;
    else return false;
  },

  /**
  * Set Width of the image.
  */
  width: function(w) {
    if(w) this.image.attr("width", w);
    else this.image.removeAttr("width");
  },

  /**
  * Set Height of the image.
  */
  height: function(h) {
    this.container.height(h);
    this.image.height(h);
  },

  /**
  * Save image to firebase
  * @param 'text' firebase text key
  */
  /*save: function(text) {
    firebaseHandler.set(refs.data+text+"/translations/img/1-0/value", this.image.attr('src'));
  },*/

  /**
  * Clear image data.
  */
  clear: function() {
    this.image.attr('src', null);  // reset src
    this.hide();  // hide image
  }
});