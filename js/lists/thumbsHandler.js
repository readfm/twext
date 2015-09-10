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

    // allow drag/drop images
    // allow drag/drop images
    allowDragDrop(this.element[0], this.onDropThumb);
  },

  /**
  * On drop event.
  */
  onDropThumb: function(data) {
    var k = null;
    // display dropped image
    var imageEl = $(data.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      controller.thumbsHandler.addThumb(imageUrl);
    } else {  // not valid url, image maybe local file
      var f = data.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        fr.onload = function(ev) {  // file reader done with reading file
          controller.thumbsHandler.addThumb(ev.target.result);
        };
        fr.readAsDataURL(f);
      }
    }
  },

  /**
  * Display list of thumbs repeatedly till fill screen.
  */
  displayThumbs: function(thumbs, w) {
    var cWidth = document.documentElement.clientWidth;  // screen width
    var thumbsWidth = w?w:$('#thumbs>span').length * 62;
    var pixLeft = cWidth - thumbsWidth;
    var index = 0;
    for(var i in thumbs) {
      if(pixLeft <= 2) break;
      this.createThumb(thumbs[i], i, null, index);
      index++;
      thumbsWidth += 62;
      pixLeft = cWidth - thumbsWidth;
    }
    if(pixLeft > 2) { // repeat thumbs if there is a room for more
      this.displayThumbs(thumbs, thumbsWidth);
      return;
    }
    this.showThumbs();
  },

  /**
  * Add thumb.
  * The procedure is to add thumb after every occurrence of the thumbs list, meaning that if list displayed(repeated) 2 times, new thumb added twice after each list.
  * Index matching fb thumb order is saved with each thumb dom element.
  * Get all dom elements that has the last index (the last thumb) and add the new thumb after each of them.
  */
  addThumb: function(url) {
    var el = controller.thumbsHandler.element;
    var tLen = controller.thumbsHandler.thumbs.length;
    var index;
    var k = controller.thumbsHandler.saveThumb(url); //save into fb
    controller.thumbsHandler.thumbs.push({key:k, url:url});
    if(tLen > 0) {
      var lastNodes = $("#thumbs ."+(tLen-1));
      for(var i=0;i<lastNodes.length; i++) {
        index = childIndex(lastNodes[i]);
        controller.thumbsHandler.createThumb(url, k, index+1, tLen);
        el.children().last().remove();
        lastNodes = $("#thumbs ."+(tLen-1)); // lastNodes array is updated after each insertion of a new thumb, in case that one of them is pushed out of the screen and deleted
      }
    } else { // first thumb to add
      var t = {};
      t[k] = url;
      this.displayThumbs(t);
    }
  },

  /**
  * Create thumb for the given image
  */
  createThumb: function(url, key, index, realIndex) {
    if(!url) return;
    var thumb;
    if(index && index > 0) {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").insertAfter(this.element.children()[index-1]);
    } else {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").appendTo("#thumbs");
    }
    this.thumbs[realIndex] = {url:url, key:key};
    thumb.addClass("thumb");
    thumb.addClass(realIndex+"");
    thumb.data("index", realIndex); // save real index to the element
    var thumbsHandler = this;
    thumb.click(function(e) {
      if(e.ctrlKey && e.shiftKey) {
        thumbsHandler.removeThumb(this);
        return;
      }
      $('#thumbs > .active').removeClass('active');
      $(this).addClass('active');
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
    //this.showThumbs();
    return thumb;
  },

  /**
  * Remove thumb.
  */
  removeThumb: function(thumb) {
    // check if one thumb displayed
    if(this.thumbs.length <= 1) {
      $("#thumbs").empty();
      this.thumbs = [];
      return;
    }

    var index = $(thumb).data("index");
    var k = this.thumbs[index].key;
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl && k) firebaseHandler.remove(refs.mapping+textUrl+"/thumbs/"+k); // remove from fb
    this.thumbs.splice(index, 1);
    // remove nodes
    //var x, s;
    var nodes = $("#thumbs ."+index);
    for(var i=0; i<nodes.length; i++) {
      if($(nodes[i]).hasClass('active')) this.toggleForward(); // move to next before delete node
      //update following thumbs indices
      /*s = $(nodes[i].nextSibling);
      x = s.length>0?s.data("index"):null;
      while(x && x > index) {
        s.removeClass(x+"");
        x--;
        s.addClass(x+"");
        s.data("index", x);
        s = $(s.nextSibling);  // move forward
      }*/
      nodes[i].remove();
      // add thumb at the end of list to replace the deleted one
      var ind = $("#thumbs>span").last().data("index");
      if(ind == this.thumbs.length-1) { //last thumb
        this.createThumb(this.thumbs[0].url, this.thumbs[0].key, this.element.children().length, 0);
      } else {
        this.createThumb(this.thumbs[ind+1].url, this.thumbs[ind+1].key, this.element.children().length, ind+1);
      }
    }
    // update indices of thumbs after deleted one
    var nodes = [];
    for(var j=index; j>this.thumbs.length; j++) {
      nodes = $("#thumbs ."+(j+1));
      for(var m=0; m<nodes.length; m++) {
        nodes[m].removeClass(""+(j+1));
        nodes[m].addClass(""+j);
        nodes[m].data("index", j);
      }
    }
  },

  /**
  * Toggle images forward.//@UPDATE use nextSibling
  */
  toggleForward: function() {
    var current = $('#thumbs > .active')[0];
    if(current) {
      var next = current.nextSibling;
      $(current).removeClass("active");
      if(next) {
        next.click();
        return $(next).attr("href");
      } else {
        if(controller.video.isOn()) {
          return null;
        } else {  // active is first element, toggle to last
          var first = $("#thumbs>span").first();
          first.click();
          return $(first).attr("href");
        }
      }
    } else { // video displayed, toggle to first element
      var first = $("#thumbs>span").first();
      first.click();
      return $(first).attr("href");
    }
  },

  /**
  * Toggle images backward.
  */
  toggleBackward: function() {
    var current = $('#thumbs > .active')[0];
    if(current) {
      var previous = current.previousSibling;
      $(current).removeClass("active");
      if(previous) {
        previous.click();
        return $(previous).attr("href");
      } else {
        if(controller.video.isOn()) {
          return null;
        } else {  // active is first element, toggle to last
          var last = $("#thumbs>span").last();
          last.click();
          return $(last).attr("href");
        }
      }
    } else { // video displayed, toggle to last element
      var last = $("#thumbs>span").last();
      last.click();
      return $(last).attr("href");
    }
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
  },

  resetToggle: function() {
    $('#thumbs > .active').removeClass('active');
  }
});