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
  * Drag thumbs to horizontal scrolling.
  */
  slideThumbs: function(dd) {
    var ix, newThumbIx;
    var first = $("#thumbs>span").first();
    var last = $("#thumbs>span").last();
    var fpos = first.offset().left;
    var lpos = last.offset().left;
    var x = dd.start - dd.deltaX;
    var tw = first.width();
    var cWidth = document.documentElement.clientWidth;  // screen width
    if(dd.offsetX > dd.prevOffset) {  // slide to right
      if(x < 0) {
        ix = first.data("index");
        newThumbIx = ix==0?this.thumbs.length-1:ix-1;
        this.createThumb(newThumbIx, this.thumbs[newThumbIx], 0);
        dd.start += tw+2;
        this.element[0].scrollLeft = tw+2;
      } else {
        this.element[0].scrollLeft = x;
      }
      if(lpos > cWidth) last.remove();
    } else { // slide to left
      var fepos = fpos + tw + 2;
      var lepos = lpos + tw;
      if(lepos <= cWidth) {
        ix = last.data("index");
        newThumbIx = ix==this.thumbs.length-1?0:ix+1;
        this.createThumb(newThumbIx, this.thumbs[newThumbIx]);
        if(fepos >= 0) {
          dd.start -= 1;
          this.element[0].scrollLeft += 1;
        }
        
      } else {
        this.element[0].scrollLeft = x;
      }
      if(fepos < 0) {
        first.remove();
        dd.start -= tw+2;
        this.element[0].scrollLeft -= tw+2;
      }
    }
    dd.prevOffset = dd.offsetX;
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
    this.thumbs = thumbs;
    var cWidth = document.documentElement.clientWidth;  // screen width
    var thumbsWidth = w?w:$('#thumbs>span').length * 62;
    var pixLeft = cWidth - thumbsWidth;
    for(var i=0; i<this.thumbs.length; i++) {
      if(pixLeft <= 2) break;
      this.createThumb(i, this.thumbs[i]);
      thumbsWidth += 62;
      pixLeft = cWidth - thumbsWidth;
    }
    if(pixLeft > 2) { // repeat thumbs if there is a room for more
      this.displayThumbs(this.thumbs, thumbsWidth);
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
    controller.thumbsHandler.thumbs.push(url);
    if(tLen > 0) {
      var lastNodes = $("#thumbs ."+(tLen-1));
      var index;
      for(var i=0;i<lastNodes.length; i++) {
        index = childIndex(lastNodes[i]);
        controller.thumbsHandler.createThumb(tLen, url, index+1);
        el.children().last().remove();
        lastNodes = $("#thumbs ."+(tLen-1)); // lastNodes array is updated after each insertion of a new thumb, in case that one of them is pushed out of the screen and deleted
      }
    } else { // first thumb to add
      this.displayThumbs(controller.thumbsHandler.thumbs);
    }
    controller.thumbsHandler.saveThumb(url); //save into fb
  },

  /**
  * Create thumb for the given image
  */
  createThumb: function(thumbIndex, url, index) {
    if(!url) return;
    var thumb;
    if(index != null && index >= 0 && index < this.element.children().length) {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").insertBefore(this.element.children()[index]);
    } else {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").appendTo("#thumbs");
    }
    thumb.addClass("thumb");
    thumb.addClass(thumbIndex+"");
    thumb.data("index", thumbIndex); // save real index to the element
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
    thumb.drag("start", function( ev, dd ){
      dd.start = $("#thumbs")[0].scrollLeft;
      dd.prevOffset = 0;
    });
    thumb.drag(function( ev, dd ){
      controller.thumbsHandler.slideThumbs(dd);
    },{click:false});
    return thumb;
  },

  /**
  * Remove thumb.
  */
  removeThumb: function(thumb) {
    var index = $(thumb).data("index");
    this.thumbs.splice(index, 1); // remove from thumbs array
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs", this.thumbs); // reset the whole array to keep the indices correct

    if(this.thumbs.length == 0) { // no more thumbs to display
      $("#thumbs").empty();
      return;
    }
    // remove nodes
    var nodes = $("#thumbs ."+index);
    for(var i=0; i<nodes.length; i++) {
      if($(nodes[i]).hasClass('active')) this.toggleForward(); // move to next before delete node
      nodes[i].remove();
      // add thumb at the end of list to replace the deleted one
      var ind = $("#thumbs>span").last().data("index");
      if(ind == this.thumbs.length-1) { //last thumb
        this.createThumb(0, this.thumbs[0]);
      } else {
        this.createThumb(ind+1, this.thumbs[ind+1]);
      }
    }
    // update indices of thumbs after deleted one
    var nodes = [];
    for(var j=index; j<this.thumbs.length; j++) {
      nodes = $("#thumbs ."+(j+1));
      for(var m=0; m<nodes.length; m++) {
        $(nodes[m]).removeClass(""+(j+1));
        $(nodes[m]).addClass(""+j);
        $(nodes[m]).data("index", j);
      }
    }
  },

  /**
  * Toggle images forward.
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
  * Move thumb from position to another.@TODO realIx updates
  */
  moveThumb: function(from, to) {
    if(from == to || to >= this.thumbs.length) return;
    var fromUrl = this.thumbs[from];
    this.thumbs.move(from, to); // move element to the new position
    // move dom elements
    var allFrom = $("#thumbs ."+from);
    var allTo = $("#thumbs ."+to);
    var pendingUpdate = false, last;
    for(var i=0,j=0; ; i++,j++) {
      if(i >= allFrom.length && j >= allTo.length) break;
      else if(i < allFrom.length && j >= allTo.length) { // one element left from allFrom needs to be moved to non existing position
        $(allFrom[i]).remove();
        pendingUpdate = true; // replace last node by the one following later(after indices updated)
      } else if(i >= allFrom.length && j < allTo.length) { // one element left from allTo needs to a non existing element to be moved before it
        ci = childIndex(allTo[j]);
        this.createThumb(from, fromUrl, ci-1);
        last = $("#thumbs>span").last();
        $(last).remove();
      } else {
        if(from < to) { // move to right
          $(allFrom[i]).insertAfter($(allTo[j])); // move "from" element to new position
        } else { // from > to, move to left
          $(allFrom[i]).insertBefore($(allTo[j])); // move "from" element to new position
        }
      }
    } // end for

    // update indices in background
    // get all nodes to be updated and save in obj, key is the new index
    // loop on obj and update indices.
    // nodes cannot be updated at the same loop where they been called, that's because nodes might be updated to index that will be caleld later, in this case nodes already updated will be called again
    var obj = {}, nodes, node;
    nodes = $("#thumbs ."+from);
    obj[to] = nodes;
    if(from < to) { // move to right
      for(var i=from+1; i<=to; i++) {
        nodes = $("#thumbs ."+i);
        obj[i-1] = nodes;
      }
    } else {  // move to left
      for(var i=from-1; i>=to; i--) {
        nodes = $("#thumbs ."+i);
        obj[i+1] = nodes;
      }
    }
    for(var k in obj) {
      nodes = obj[k];
      k = parseInt(k);
      for(var j=0; j<nodes.length; j++) {
        node = $(nodes[j]);
        x = node.data("index");
        node.removeClass(""+x);
        node.addClass(""+ k);
        node.data("index", k);
      }
    }
    if(pendingUpdate) {
      last = $("#thumbs>span").last();
      var ix = last.data("index");
      ix = ix<this.thumbs.length-1?ix:-1;
      this.createThumb(ix+1, this.thumbs[ix+1]);
    }

    // update fb
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs", this.thumbs);
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
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs/"+(this.thumbs.length-1), url);
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