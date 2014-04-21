/**
* Image class represents img element.
*/
Image = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.image = $('#image')[0]; // image DOM element
    this.container = $('#imgContainer');  // video container DOM element
  },

  /**
  * Load Image with the given url.
  * @param 'url' image src url
  */
  load: function(url) {
    this.image.src = url;
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
    if(this.image && this.image.src) return true;
    else return false;
  },

  /**
  * Set Width of the image.
  */
  width: function(w) {
    if(w) $(this.image).attr("width", w);
    else $(this.image).removeAttr("width");
  },

  /**
  * Set Height of the image.
  */
  height: function(h) {
    this.container.height(h);
    $(this.image).height(h);
  },

  /**
  * Save image to firebase
  * @param 'text' firebase text key
  */
  save: function(text) {
    firebaseHandler.set("data/"+text+"/translations/img/1-0/value", this.image.src);
  },

  /**
  * Clear image data.
  */
  clear: function() {
    this.image.src = null;  // reset src
    this.hide();  // hide video
  }
});