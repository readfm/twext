/**
* Audio recorder class handles all audio recording features.
*/
AudioRecorder = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(audio) {
    this.audio_context = null;
    this.recorder = null;
    this.volume = null;
    this.volumeLevel = 0;
    this.audio = audio;
    this.initContext();
  },

  /**
  * Init audio context.
  */
  initContext: function() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext; // audioContext supported in current browser
      // userMedia in current browser
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL || window.mozURL; // windowUrl supported in current browser

      this.audio_context = new AudioContext();  // create audio context
      console.log('Audio context set up.' + this.audio_context);
      console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      console.warn('No web audio support in this browser!');
    }

    // Start looking for audio input
    if(navigator.getUserMedia != undefined) {
      navigator.getUserMedia({audio: true}, $.proxy(this.startUserMedia, this), function(e) {
        console.warn('No live audio input: ' + e);  // audio input not set
      });
    }
  },

  /**
  * Start looking for audio input
  */
  startUserMedia: function(stream) {
    var input = this.audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    console.log("stream " + stream);
    console.log("Input "+input);

    // Connect input to context destination
    this.volume = this.audio_context.createGainNode();
    this.volume.gain.value = this.volumeLevel;
    input.connect(this.volume);
    this.volume.connect(this.audio_context.destination);
    console.log('Input connected to audio context destination.');
    
    this.recorder = new Recorder(input);  // set recorder to the input
    console.log('Recorder initialised.');
  },

  /**
  * Start recording.
  */
  start: function() {
    if(!this.recorder)  return; // no recording input
    this.recorder.record(); // start recording audio
    console.log('Recording...');
  },

  /**
  * Stop recording.
  * @param 'callback' a function to be called after recording stopped.
  */
  stop: function(callback) {
    if(!this.recorder)  { // no recording input, return
      callback();
      return;
    }

    this.recorder.stop(); // stop recording
    console.log('Stopped recording.');

    var audioRecorder = this;
    this.recorder.exportWAV(function(s) { // export recorded audio
      var audioObj = audioRecorder.audio;
      audioObj.audio.src = window.URL.createObjectURL(s);  // set audio src
      $(audioObj.audio).bind("canplaythrough", function() {
        audioObj.startTime = 0; // set audio start time
        audioObj.endTime = audioObj.duration();  // set audio end time
        callback(); // return
        $(audioObj.audio).unbind("canplaythrough");
      });
    });
    this.recorder.clear();  // clear audio data
  }
});