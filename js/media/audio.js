/**
* Audio class represents html5 audio element.
*/
Audio = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.audio = $('#htmlAudio')[0]; // video DOM element
    this.id = null;
    this.startTime = -1; // play start time
    this.endTime = -1; // play end time
    this.seekedTo = -1; // time where audio is seeked
    this.playbackRate = 1;  // audio playback rate, 1 is normal speed
  },

  /**
  * Get the audio path on the server.
  * @param 'id' audio id
           'callback' return with audio path or null if not found
  */
  requestPath: function(id, callback) {
    audId = id + ".wav";  // audio name on server
    $.post(
      'php/checkFile.php',
      {filename: "audios/"+audId},
      function(path) {
        callback(path);
      }
    );
  },

  /**
  * Load audio with the given id from server into the htmlAudio element.
  * @param 'id' audio id
  */
  load: function(id) {
    this.id = id;
    var aud = this;
    // Get video path on the server
    this.requestPath(id, function(path) {
      if(path != -1) {
        aud.audio.src = "http://" + path;  // set video src
        // callback when the video and its metadata are fully loaded
        $(aud.audio).bind('canplaythrough', function(e) {
          aud.startTime = 0;
          aud.endTime = aud.duration();  // set audio end time;
          console.log("Audio loaded");
          $(aud.audio).unbind('canplaythrough');
        });
      } else {
        //callback(false); // return with not found confirmation
        console.log("No recordings attached to this text");
      }
    });
  },

  /**
  * Play audio.
  */
  play: function() {
    if(this.audio.src) {
      var seekTo = this.seekedTo != -1?this.seekedTo:this.startTime;  // if audio seeked, start from seeked time, else start from video startTime
      if(seekTo != -1) this.seek(seekTo);
      this.audio.play();  // play audio
    }
  },

  /**
  * Pause audio.
  */
  pause: function() {
    if(this.audio.src) {
      this.seekedTo = this.audio.currentTime;
      this.audio.pause();  // pause audio
    }
  },

  /**
  * Seek audio to given time.
  * @param 'time' time to be seeked to
  */
  seek: function(time) {
    if(this.audio.src) {  // if audio is set
      this.audio.currentTime = time;  // seek audio
      this.seekedTo = time;
    }
  },

  /**
  * Get the current time of the audio.
  */
  currentTime: function() {
    return this.audio.currentTime;
  },

  /**
  * Get duration of the audio
  * @return duration of the audio, -1 if no audio found
  */
  duration: function() {
    if(this.audio.src) return this.audio.duration;
    return -1;
  },

  /**
  * Check if there is an audio recorded and loaded into the element.
  * @return true if audio loaded, false if not
  */
  isOn: function() {
    if(this.audio && this.audio.src) return true;
    else return false;
  },

  /**
  * Set seekedTo value.
  * @param 'time' seekedTo time
  */
  setSeekedTo: function(time) {
    this.seekedTo = time;
  },

  /**
  * Clear audio data.
  */
  clear: function() {
    this.audio.src = null;  // reset src
    this.playbackRate = 1;
  },
});