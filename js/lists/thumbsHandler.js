/**
* UrlListHandler class handles all url list features.
*/
ThumbsHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.element = $("#thumbs"); // thumbs dom element
    this.thumbs = []; // array of objects contains urls and fb keys
    this.currentImage = -1; // current image index
    this.mainImage = -1; // index of F7 image url if exists

    // allow drag/drop images
    var handler = this;
    this.element[0].addEventListener('dragenter', handler.dragIntoThumbs, false);
    this.element[0].addEventListener('dragexit', handler.dragIntoThumbs, false);
    this.element[0].addEventListener('dragover', handler.dragIntoThumbs, false);
    this.element[0].addEventListener('drop', handler.dropIntoThumbs, false);
  },

  /**
  * On drag event.
  */
  dragIntoThumbs: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  /**
  * On drop event.
  */
  dropIntoThumbs: function(e) {
    e.stopPropagation();
    e.preventDefault();

    var k = null;
    // display droppped image
    var imageEl = $(e.dataTransfer.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      k = controller.thumbsHandler.saveThumb(imageUrl); //save into fb
      controller.thumbsHandler.createThumb(imageUrl, k);
    } else {  // not valid url, image maybe local file
      var f = e.dataTransfer.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        fr.onload = function(ev) {  // file reader done with reading file
          k = controller.thumbsHandler.saveThumb(ev.target.result); //save into fb
          controller.thumbsHandler.createThumb(ev.target.result, k);
        };
        fr.readAsDataURL(f);
      }
    }
  },

  /**
  * Create thumb for the given image
  */
  createThumb: function(url, key, mainImg) {
    if(!url) return;
    var thumb;
    var thmbs = this.element.children();
    if(mainImg) {
      if(this.mainImage == -1) {
        thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").appendTo("#thumbs");
        this.thumbs.push({url: url, key: null});
        this.mainImage = this.thumbs.length-1;
      } else {  // update existing
        thumb = $(thmbs[this.mainImage]).attr('href', url).css('background-image', "url("+url+")");
        this.thumbs[this.mainImage].url = url; // update url
      }
    } else {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").appendTo("#thumbs");
      this.thumbs.push({url: url, key: key});
    }
    thumb.addClass("thumb");
    var thumbsHandler = this;
    thumb.click(function(e) {
      if(e.ctrlKey && e.shiftKey) {
        thumbsHandler.removeThumb(this);
        return;
      }
      $('#thumbs > .active').removeClass('active');
      $(this).addClass('active');
      thumbsHandler.currentImage = thumbsHandler.thumbIndex(this); // update current image
      // update input data
      var input = $('#mediaInputLink').val();
      if(input) {
        var i = input.indexOf('+');
        $('#mediaInputLink').val((i != -1?input.substr(0, i):input) + "+" + $(this).attr('href'));
      }
      // load image
      controller.video.hide();
      controller.image.load(url); // load image url to image object
      controller.image.show();  // show image
    });
    this.showThumbs();
    return thumb;
  },

  /**
  * Remove thumb.
  */
  removeThumb: function(thumb) {
    var index = this.thumbIndex(thumb);
    var k = this.thumbs[index].key;
    if(index == this.mainImage) this.mainImage = -1;
    // remove from fb
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl && k) firebaseHandler.set(refs.mapping+textUrl+"/thumbs/"+k, null);
    // remove node
    $(thumb).remove();
    this.thumbs.splice(index, 1);
    // move to next image
    if(this.currentImage == index) {
      this.currentImage--;  // current image deleted, make previous image the current one.
      controller.toggleThumbs();  // move to next image
    }
  },

  /**
  * Get node index.
  */
  thumbIndex: function(node) {
    var index = 0;
    while(node.previousSibling) {
      if(node.previousSibling.nodeName == 'SPAN') {
        index++;
      }
      node = node.previousSibling;
    }
    return index;
  },

  /**
  * Toggle images forward.
  */
  getNextThumb: function() {
    this.currentImage++;
    if(this.currentImage >= this.thumbs.length) {
      if(controller.video.isOn()) {
        $('#thumbs > .active').removeClass('active');
        this.currentImage = -1; // back to video
        return null;
      } else {
        this.currentImage = 0;  // back to first image
      }
    }
    this.element.children()[this.currentImage].click();
    return this.thumbs[this.currentImage].url;
  },

  /**
  * Toggle images backward.
  */
  getPreviousThumb: function() {
    this.currentImage--;
    var len = this.thumbs.length;
    if(this.currentImage < -1) this.currentImage = len - 1;
    else if(this.currentImage < 0) {
      if(controller.video.isOn()) {
        $('#thumbs > .active').removeClass('active');
        this.currentImage = -1;
        return null;
      } else {
        this.currentImage = len - 1;
      }
    }
    this.element.children()[this.currentImage].click();
    return this.thumbs[this.currentImage].url;
  },

  /**
  * show thumbs.
  */
  showThumbs: function() {
    if(this.element.children().length > 0) this.element.show();
  },

  /**
  * hide thumbs.
  */
  hideThumbs: function() {
    this.element.hide();
  },

  /**
  * Save image to thumbs list on firebase
  */
  saveThumb: function(url) {
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) return firebaseHandler.push(refs.mapping+textUrl+"/thumbs", url);
    return null;
  },

  clear: function() {
    this.thumbs = []; // thumbs urls
    this.currentImage = -1; // current image index
    this.element.children().remove();
    this.hideThumbs();
  }
});