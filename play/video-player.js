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
    this.playbackRate = 1;
    $(this.videoEl).bind('pause', function(e){
      clearTimeout(videoPlayer.playTimeout);
      //e.preventDefault();
      //player.pauseText();
    });
    // pause before change rate, replay after change
    $(this.videoEl).bind('ratechange', function(e) {
      player.play();
    });
  },

  loadVideo: function(loadOnly) {
    this.displayMsg("Loading video");  // display Loading message
    var vidPlayer = this;
    this.videoUrl(this.videoName, function(path) {
      if(path != -1) {
        vidPlayer.videoEl.src = "http://" + path;
        // show video div when the video is fully laoded
        $(vidPlayer.videoEl).bind('canplaythrough', function(e) {
          vidPlayer.hideMsg();
          vidPlayer.showVideo();
          // restart play if required
          if(!loadOnly) player.restartPlay();
        });
        $(this.videoEl).unbind('canplaythrough');

        // Save video url into firebase
        vidPlayer.saveVideoUrl($("#youtubeLink").val());
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
    var playPeriod = round((this.to - this.startTime)/this.playbackRate);
    if(playPeriod > 0) {console.log("loop:" +loop+" "+playPeriod);
      if(loop) this.playTimeout = setTimeout(function(){player.restartPlay();}, playPeriod*1000);// make video player restart play text when loop to sync text with video(video currenttime has a portion of secs less than window timeout)
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
  },

  /**
  * Save video link into firebase.
  * @param 'link' video link to be saved
  */
  saveVideoUrl: function(link) {
    var shortcut = window.location.hash;  // get text shortcut
    if(shortcut && shortcut.slice(1)) { // if there is a hash value in the url
      shortcut = shortcut.slice(1);
      new Firebase(firebaseRef+"mapping/url-text/"+shortcut+"/video").set(link); // save video link
    }
  },

  playFast: function() {
    this.videoEl.playbackRate = 1;
    this.playbackRate = 1;
  },

  playSlow: function() {
    this.videoEl.playbackRate = 0.5;
    this.playbackRate = 0.5;
  }
});