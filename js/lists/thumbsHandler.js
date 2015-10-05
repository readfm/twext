/**
* UrlListHandler class handles all url list features.
*/
ThumbsHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    // good tier
    this.goodTierId = "goodThumbs"; // id of good tier dom element
    this.goodTierEl = $("#"+this.goodTierId); // good tier dom element
    this.goodThumbs = []; // array of objects contains urls
    // ok tier
    this.okTierId = "okThumbs"; // id of ok tier dom element
    this.okTierEl = $("#"+this.okTierId); // ok tier dom element
    this.okThumbs = []; // array of objects contains urls

    this.currentTier = null; // current toggle tier

    // allow drag/drop images
    allowDragDrop(this.goodTierEl[0], function(data){
      controller.thumbsHandler.onDropThumb(data, 0);
    });
    allowDragDrop(this.okTierEl[0], function(data){
      controller.thumbsHandler.onDropThumb(data, 1);
    });
  },

  /**
  * Drag thumbs to horizontal scrolling.
  */
  slideThumbs: function(dd, tierType) {
    var ix, newThumbIx, id, thumbs, el;
    if(tierType == 0) {
      id = this.goodTierId;
      thumbs = this.goodThumbs;
      el = this.goodTierEl;
    } else {
      id = this.okTierId;
      thumbs = this.okThumbs;
      el = this.okTierEl;
    }
    var first = $("#"+id+">span").first();
    var last = $("#"+id+">span").last();
    var fpos = first.offset().left;
    var lpos = last.offset().left;
    var x = dd.start - dd.deltaX;
    var tw = first.width();
    var cWidth = document.documentElement.clientWidth;  // screen width
    if(dd.offsetX > dd.prevOffset) {  // slide to right
      if(x < 0) {
        ix = first.data("index");
        newThumbIx = ix==0?thumbs.length-1:ix-1;
        this.createThumb(newThumbIx, thumbs[newThumbIx], tierType, 0);
        dd.start += tw+2;
        el[0].scrollLeft = tw+2;
      } else {
        el[0].scrollLeft = x;
      }
      if(lpos > cWidth) last.remove();
    } else { // slide to left
      var fepos = fpos + tw + 2;
      var lepos = lpos + tw;
      if(lepos <= cWidth) {
        ix = last.data("index");
        newThumbIx = ix==thumbs.length-1?0:ix+1;
        this.createThumb(newThumbIx, thumbs[newThumbIx], tierType);
        if(fepos >= 0) {
          dd.start -= 1;
          el[0].scrollLeft += 1;
        }
        
      } else {
        el[0].scrollLeft = x;
      }
      if(fepos < 0) {
        first.remove();
        dd.start -= tw+2;
        el[0].scrollLeft -= tw+2;
      }
    }
    dd.prevOffset = dd.offsetX;
  },

  /**
  * On drop event.
  * @param data: event data
           tierType: indicate what tier to drop in, 0 represents good tier, 1 represents ok tier
  */
  onDropThumb: function(data, tierType) {
    var k = null;
    // display dropped image
    var imageEl = $(data.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      controller.thumbsHandler.addThumb(imageUrl, tierType);
    } else {  // not valid url, image maybe local file
      var f = data.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        fr.onload = function(ev) {  // file reader done with reading file
          controller.thumbsHandler.addThumb(ev.target.result, tierType);
        };
        fr.readAsDataURL(f);
      }
    }
  },

  /**
  * Display list of thumbs repeatedly till fill screen.
  */
  displayThumbs: function(thumbs, tierType, w) {
    var id, tw;
    if(tierType == 0) {
      this.goodThumbs = thumbs;
      id = this.goodTierId;
      tw = 82;
    } else {
      this.okThumbs = thumbs;
      id = this.okTierId;
      tw = 52;
    }
    var cWidth = document.documentElement.clientWidth;  // screen width
    var thumbsWidth = w?w:$('#'+id+'>span').length * tw;
    var pixLeft = cWidth - thumbsWidth;
    for(var i=0; i<thumbs.length; i++) {
      if(pixLeft <= 2) break;
      this.createThumb(i, thumbs[i], tierType);
      thumbsWidth += tw;
      pixLeft = cWidth - thumbsWidth;
    }
    if(pixLeft > 2) { // repeat thumbs if there is a room for more
      this.displayThumbs(thumbs, tierType, thumbsWidth);
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
  addThumb: function(url, tierType) {
    var el, thumbs, tLen, id, tier="";
    if(tierType == 0) { // good
      id = this.goodTierId;
      el = this.goodTierEl;
      thumbs = this.goodThumbs;
      tLen = thumbs.length;
      this.goodThumbs.push(url);
      tier = "good";
    } else {  // ok
      id = this.okTierId;
      el = this.okTierEl;
      thumbs = this.okThumbs;
      tLen = thumbs.length;
      this.okThumbs.push(url);
      tier = "ok";
    }
    if(tLen > 0) {
      var lastNodes = $("#"+id+" ."+(tLen-1));
      var index;
      for(var i=0;i<lastNodes.length; i++) {
        index = childIndex(lastNodes[i]);
        this.createThumb(tLen, url, tierType, index+1);
        el.children().last().remove();
        lastNodes = $("#"+id+" ."+(tLen-1)); // lastNodes array is updated after each insertion of a new thumb, in case that one of them is pushed out of the screen and deleted
      }
    } else { // first thumb to add
      this.displayThumbs(thumbs, tierType);
    }
    this.saveThumb(url, thumbs, tier); //save into fb
  },

  /**
  * Create thumb for the given image
  */
  createThumb: function(thumbIndex, url, tierType, index) {
    if(!url) return;
    var thumb;
    var el, id;
    if(tierType == 0) {
      id = this.goodTierId;
      el = this.goodTierEl;
    } else {
      id = this.okTierId;
      el = this.okTierEl;
    }
    if(index != null && index >= 0 && index < el.children().length) {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").insertBefore(el.children()[index]);
    } else {
      thumb = $(document.createElement('span')).attr('href', url).css('background-image', "url("+url+")").appendTo("#"+id);
    }
    thumb.addClass("thumb");
    thumb.addClass(thumbIndex+"");
    thumb.data("index", thumbIndex); // save real index to the element
    var thumbsHandler = this;
    thumb.click(function(e) {
      if(e.ctrlKey && e.shiftKey) {
        thumbsHandler.removeThumb(this, tierType);
        return;
      }
      $('.active').removeClass('active');
      $(this).addClass('active');
      thumbsHandler.currentTier = this.parentNode.id;
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
      dd.start = el[0].scrollLeft;
      dd.prevOffset = 0;
    });
    thumb.drag(function( ev, dd ){
      controller.thumbsHandler.slideThumbs(dd, tierType);
    },{click:false});
    return thumb;
  },

  /**
  * Remove thumb.
  */
  removeThumb: function(thumb, tierType) {
    var index = $(thumb).data("index");
    var thumbs, id, tier="";
    if(tierType == 0) {
      this.goodThumbs.splice(index, 1); // remove from thumbs array
      thumbs = this.goodThumbs;
      id = this.goodTierId;
      tier = "good";
    } else {
      this.okThumbs.splice(index, 1); // remove from thumbs array
      thumbs = this.okThumbs;
      id = this.okTierId;
      tier = "ok";
    }
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs/"+tier, thumbs); // reset the whole array to keep the indices correct

    if(thumbs.length == 0) { // no more thumbs to display
      if(tierType == 0) this.goodTierEl.empty();
      else this.okTierEl.empty();
      return;
    }
    // remove nodes
    var nodes = $("#"+id+" ."+index);
    for(var i=0; i<nodes.length; i++) {
      if($(nodes[i]).hasClass('active')) this.toggleForward(); // move to next before delete node
      nodes[i].remove();
      // add thumb at the end of list to replace the deleted one
      var ind = $("#"+id+">span").last().data("index");
      if(ind >= thumbs.length-1) { //last thumb
        this.createThumb(0, thumbs[0], tierType);
      } else {
        this.createThumb(ind+1, thumbs[ind+1], tierType);
      }
    }
    // update indices of thumbs after deleted one
    var nodes = [];
    for(var j=index; j<thumbs.length; j++) {
      nodes = $("#"+id+" ."+(j+1));
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
    var current = $('.active')[0];
    //var id = current.parentNode.id;
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
          var first = $("#"+this.currentTier+">span").first();
          first.click();
          return $(first).attr("href");
        }
      }
    } else { // video displayed, toggle to first element
      var first = $("#"+this.currentTier+">span").first();
      first.click();
      return $(first).attr("href");
    }
  },

  /**
  * Toggle images backward.
  */
  toggleBackward: function() {
    var current = $('.active')[0];
    //var id = current.parentNode.id;
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
          var last = $("#"+this.currentTier+">span").last();
          last.click();
          return $(last).attr("href");
        }
      }
    } else { // video displayed, toggle to last element
      var last = $("#"+this.currentTier+">span").last();
      last.click();
      return $(last).attr("href");
    }
  },

  /**
  * Move thumb from position to another.
  */
  moveThumb: function(from, to, tierType) {
    var thumbs, fromUrl, id, tier="";
    if(tierType == 0) {
      if(from == to || to >= this.goodThumbs.length) return;
      fromUrl = this.goodThumbs[from];
      this.goodThumbs.move(from, to); // move element to the new position
      thumbs = this.goodThumbs;
      id = this.goodTierId;
      tier = "good";
    } else {
      if(from == to || to >= this.okThumbs.length) return;
      fromUrl = this.okThumbs[from];
      this.okThumbs.move(from, to); // move element to the new position
      thumbs = this.okThumbs;
      id = this.okTierId;
      tier = "ok";
    }

    // move dom elements
    var allFrom = $("#"+id+" ."+from);
    var allTo = $("#"+id+" ."+to);
    var pendingUpdate = false, last;
    for(var i=0,j=0; ; i++,j++) {
      if(i >= allFrom.length && j >= allTo.length) break;
      else if(i < allFrom.length && j >= allTo.length) { // one element left from allFrom needs to be moved to non existing position
        $(allFrom[i]).remove();
        pendingUpdate = true; // replace last node by the one following later(after indices updated)
      } else if(i >= allFrom.length && j < allTo.length) { // one element left from allTo needs to a non existing element to be moved before it
        ci = childIndex(allTo[j]);
        this.createThumb(from, fromUrl, tierType, ci-1);
        last = $("#"+id+">span").last();
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
    nodes = $("#"+id+" ."+from);
    obj[to] = nodes;
    if(from < to) { // move to right
      for(var i=from+1; i<=to; i++) {
        nodes = $("#"+id+" ."+i);
        obj[i-1] = nodes;
      }
    } else {  // move to left
      for(var i=from-1; i>=to; i--) {
        nodes = $("#"+id+" ."+i);
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
      last = $("#"+this.goodTierId+">span").last();
      var ix = last.data("index");
      ix = ix<thumbs.length-1?ix:-1;
      this.createThumb(ix+1, thumbs[ix+1], tierType);
    }

    // update fb
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs/"+tier, thumbs);
  },

  /**
  * Move current active thumb to the other tier.
  * @param 'toTier' tier to move to
  */
  moveToTier: function(fromTier, toTier) {
    var thumb = $('.active')[0];
    var url = $(thumb).attr('href');

    this.removeThumb(thumb, fromTier);
    this.addThumb(url, toTier);
  },

  /**
  * show thumbs.
  */
  showThumbs: function() {
    $("#thumbs").show();
    //if(this.goodTierEl.children().length > 0) this.goodTierEl.show();
  },

  /**
  * hide thumbs.
  */
  hideThumbs: function() {
    //this.goodTierEl.hide();
    $("#thumbs").hide();
  },

  /**
  * Save image to thumbs list on firebase
  */
  saveThumb: function(url, thumbs, tier) {
    var textUrl = window.location.hash?window.location.hash.slice(1):null;
    if(textUrl) firebaseHandler.set(refs.mapping+textUrl+"/thumbs/"+tier+"/"+(thumbs.length-1), url);
  },

  clear: function() {
    this.goodThumbs = []; // thumbs urls
    this.okThumbs = []; // thumbs urls
    this.goodTierEl.children().remove();
    this.okTierEl.children().remove();
    this.hideThumbs();
  },

  resetToggle: function() {
    $('#'+this.goodTierId+'> .active').removeClass('active');
    $('#'+this.okTierId+'> .active').removeClass('active');
  }
});