/**
* Video class represents html5 video element.
*/
Video = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.video = $('#htmlVideo')[0]; // video DOM element
    this.container = $('#videoContainer');  // video container DOM element
    this.id = null; // video id, videos are saved on server at the path "/draft/textime/videos/" in the form id.mp4
    this.startTime = -1; // play start time
    this.endTime = -1; // play end time
    this.seekedTo = -1; // time where video is seeked to
    this.playbackRate = 1;  // how fast the video is played, default is normal speed
    this.playTimeout = null;  // timout where the video should stop playing

    // allow drag/drop images
    allowDragDrop(this.container[0], this.onDropImage);
  },

  /**
  * On drop image into videoResource.
  */
  onDropImage: function(data) {
    if(!controller.gifArea.isVisible()) return;

    var k = null;
    // display dropped image
    var imageEl = $(data.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      controller.video.hide();
      controller.image.load(imageUrl);
      controller.image.show(); 
      k = controller.thumbsHandler.saveThumb(imageUrl); //save into fb
      controller.thumbsHandler.createThumb(imageUrl, k).click();
      controller.gifArea.setResource(controller.image); // update current resource
      controller.gifArea.show();
    } else {  // not valid url, image maybe local file
      var f = data.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        fr.onload = function(ev) {  // file reader done with reading file
          controller.video.hide();
          controller.image.load(ev.target.result);
          controller.image.show();
          k = controller.thumbsHandler.saveThumb(ev.target.result); //save into fb
          controller.thumbsHandler.createThumb(ev.target.result, k).click();
          controller.gifArea.setResource(controller.image); // update current resource
          controller.gifArea.show();
        };
        fr.readAsDataURL(f);
      }
    }
  },

  /**
  * Get the video path on the server.
  * @param 'id' video id
           'callback' return with video path or null if not found
  */
  requestPath: function(id, callback) {
    vidId = id + ".mp4";  // video name on server
    $.post(
      'php/checkFile.php',
      {filename: "videos/"+vidId},
      function(path) {
        callback(path);
      }
    );
  },

  /**
  * Load video with the given id from server into the htmlVideo element.
  * @param 'id' video id
           'from' play start time
           'to' play end time
           'callback' callback function
  */
  load: function(id, from, to, callback) {
    this.startTime = from;
    this.endTime = to;
    if(id == this.id) { // video already loaded before
      callback(true);
    } else {
      this.id = id;
      var vid = this;
      // Get video path on the server
      this.requestPath(id, function(path) {
        if(path != -1) {
          vid.video.src = "https://" + path;  // set video src
          // callback when the video and its metadata are fully loaded
          $(vid.video).bind('canplaythrough', function(e) {
            //vidPlayer.hideMsg();
            //vidPlayer.showVideo();
            // restart play if required
            //if(!loadOnly) player.restartPlay();
            callback(true); // return with loaded confirmation
            $(vid.video).unbind('canplaythrough');
          });
        } else {
          callback(false); // return with not found confirmation
        }
      });
    }
  },

  /**
  * Show video.
  */
  show: function() {
    this.container.show();
    $('#playerContainer').show();
  },

  /**
  * Hide video.
  */
  hide: function() {
    this.container.hide();
    $('#playerContainer').hide();
  },

  /**
  * Clear video data.
  */
  clear: function() {
    clearTimeout(this.playTimeout);
    $(this.video).removeAttr("src");  // reset src
    this.startTime = -1; // reset start time
    this.endTime = -1; // reset end time
    this.seekedTo = -1; // time where video is seeked
    this.hide();  // hide video
  },

  /**
  * Play video.
  */
  play: function() {
    if(!this.video.src) return; // nothing to play

    var seekTo = this.seekedTo != -1?this.seekedTo:this.startTime;  // if video seeked, start from seeked time, else start from video startTime
    if(seekTo != -1) {
      this.seek(seekTo);  // seek video to given time
    }
    //if(this.paused) {
      //this.seekVideo(this.startTime);
      //this.paused = false;
      //playPeriod = this.to - start;
    //} else if(this.from != -1) {
      //this.seekVideo(this.from);
      //this.startTime = this.from;
    //  playPeriod = this.to - this.from;
    //}
    var vid = this; // instance of this to be used in inner function
    this.video.play();  // play video
    var playPeriod = round((this.endTime - this.seekedTo)/this.playbackRate); // playing period
    this.playTimout = setTimeout(function(){vid.pause();}, playPeriod*1000); // play video till "to" value is reached
    //var playPeriod = round((this.to - this.startTime)/this.playbackRate);
    //if(playPeriod > 0) {console.log("loop:" +loop+" "+playPeriod);
      //if(loop) this.playTimeout = setTimeout(function(){player.restartPlay();}, playPeriod*1000);// make video player restart play text when loop to sync text with video(video currenttime has a portion of secs less than window timeout)
      //else this.pauseTimeout = setTimeout(function(){videoPlayer.pauseVideo();}, playPeriod*1000);
    //}
  },

  /**
  * Seek video to given time.
  * @param 'time' time to be seeked to
  */
  seek: function(time) {
    if(this.video.src) {  // if video is set
      this.video.currentTime = time;  // seek video
      this.seekedTo = time; // set seekedTo value
    }
  },

  /**
  * Pause video.
  */
  pause: function() {
    if(this.video.src) {  // if video is set
      this.video.pause(); // pause video
      this.seekedTo = this.video.currentTime; // set seekedTo to pause time
      clearTimeout(this.playTimout);  // clear play timeout
    }
  },

  /**
  * Get the current time of the video.
  */
  currentTime: function() {
    return this.video.currentTime;
  },

  /**
  * Check if there is a video loaded in the element.
  * @return true if video loaded, false if not
  */
  isOn: function() {
    if(this.video && this.video.src) return true;
    else return false;
  },

  /**
  * Set playbackRate.
  * @param 'rate' playbackRate
  */
  setPlaybackRate: function(rate) {
    if(this.video.src) {
      this.video.playbackRate = rate;
      this.playbackRate = rate;
    }
  },

  /**
  * Set seekedTo value.
  * @param 'time' seekedTo time
  */
  setSeekedTo: function(time) {
    this.seekedTo = time;
  },

  /**
  * Set Width of the video.
  */
  width: function(w) {
    $(this.video).attr("width", w);
  },

  /**
  * Set Height of the video.
  */
  height: function(h) {
    this.container.height(h);
    $(this.video).height(h);
  },

  /**
  * Check if the video is visible.
  * @return true if visible, false if not
  */
  isVisible: function() {
    return $(this.container).is(":visible");
  }
});