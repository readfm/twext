VideoPlayer = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.videoEl = document.querySelector('video');
    this.videoContainer = $('#videoPlayerContainer');
    this.videoName = null,
    this.from = -1;
    this.to = -1;
    this.paused = false;
    this.startTime = -1;
    this.playTimeout = 0; // video player timeout value
    this.pauseTimeout = 0;
    $(this.videoEl).bind('pause', function(e){
      clearTimeout(videoPlayer.playTimeout);
      //e.preventDefault();
      //player.pauseText();
    });
  },

  loadVideo: function() {
    this.displayMsg("Loading video");  // display Loading message
    var vidPlayer = this;
    this.videoUrl(this.videoName, function(path) {
      if(path != -1) {
        vidPlayer.hideMsg();
        vidPlayer.videoEl.src = "http://" + path;
        vidPlayer.showVideo();
      } else {
        vidPlayer.clear();
        vidPlayer.displayMsg("Video not found");
      }
    });
  },

  videoUrl: function(vidName, callback) {
    vidName = vidName + ".mp4";
    $.post(
      'phpScripts/video/checkVideo.php',
      {videoName: vidName},
      function(path) {
        callback(path);
      }
    );
  },

  displayMsg: function(msg) {
    $('#video-msg').html(msg);
    $('#video-msg').show();
  },

  hideMsg: function() {
    $('#video-msg').hide();
  },

  showVideo: function() {
    this.videoContainer.show();
  },

  hideVideo: function() {
    this.videoContainer.hide();
  },

  setParams: function(params) {
    this.videoName = params['videoName'];
    this.from = parseFloat(params['loopFrom']);
    this.to = parseFloat(params['loopTo']);
  },

  /**
  * Play a piece of the video and loop.
  * @param 'start' the start seconds of the video to play from, if not specified "this.from" is used
  */
  playVideo: function(loop) {
    if(!this.videoEl.src) return;

    if(this.paused) {
      this.seekVideo(this.startTime);
      this.paused = false;
      //playPeriod = this.to - start;
    } else if(this.from != -1) {
      this.seekVideo(this.from);
      this.startTime = this.from;
    //  playPeriod = this.to - this.from;
    }
    this.videoEl.play();
    var playPeriod = this.to - this.startTime;
    if(playPeriod > 0) {console.log("loop:" +playPeriod);
      if(loop) this.playTimeout = setTimeout(function(){videoPlayer.playVideo(true);}, playPeriod*1000);
      else this.pauseTimeout = setTimeout(function(){videoPlayer.pauseVideo();}, playPeriod*1000);
    }
  },

  pauseVideo: function() {
    if(this.videoEl.src) {
      this.paused = true;
      clearTimeout(this.playTimeout);
      clearTimeout(this.pauseTimeout);
      this.videoEl.pause();
    }
  },

  seekVideo: function(time) {
    if(this.videoEl.src)  this.videoEl.currentTime = time;
  },

  setStartTime: function(time) {
    this.startTime = time;
  },

  /**
  * Clear video data.
  */
  clear: function() {
    clearTimeout(this.playTimeout);
    clearTimeout(this.pauseTimeout);
    this.videoEl.src = null;
    this.from = -1;
    this.to = -1;
    this.startTime = -1;
    this.paused = false;
    this.hideVideo();
  },

  videoSet: function() {
    if(this.videoEl.src) return true;
    else return false;
  },

  currentTime: function() {
    return this.videoEl.currentTime;
  }
});