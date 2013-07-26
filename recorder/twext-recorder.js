/**
* Twext recorder class handles all audio recording features.
*/
TwextRecorder = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.audio_context = null;
    this.recorder = null;
    this.volume = null;
    this.volumeLevel = 0;
    this.initContext();
  },

  initContext: function() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      window.URL = window.URL || window.webkitURL || window.mozURL;

      this.audio_context = new AudioContext();
      console.log('Audio context set up.' + this.audio_context);
      console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      console.warn('No web audio support in this browser!');
    }
  
    navigator.getUserMedia({audio: true}, this.startUserMedia, function(e) {
      console.warn('No live audio input: ' + e);
    });
  },

  /**
  * Start recording.
  */
  startRecording: function() {
    if(!this.recorder)  return;
    this.recorder.record();
    console.log('Recording...');
  },

  /**
  * Stop recording.
  * @param 'callback' a function to be called after recording stopped.
  */
  stopRecording: function(callback) {
    if(!this.recorder)  {
      callback();
      return;
    }
    this.recorder.stop();
    console.log('Stopped recording.');

    this.recorder.exportWAV(function(s) {
      var audio = document.querySelector('audio');
      audio.src = window.URL.createObjectURL(s);
      callback();
    });

    this.recorder.clear();
  },

  startUserMedia: function(stream) {
    var input = twextRecorder.audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    console.log("stream " + stream);
    console.log("Input "+input);

    twextRecorder.volume = twextRecorder.audio_context.createGainNode();console.log("volume:"+twextRecorder.volume);
    twextRecorder.volume.gain.value = twextRecorder.volumeLevel;console.log("volume gain:"+twextRecorder.volume.gain.value);
    input.connect(twextRecorder.volume);
    twextRecorder.volume.connect(twextRecorder.audio_context.destination);console.log("audio dest:"+twextRecorder.audio_context.destination);
    console.log('Input connected to audio context destination.');
    
    twextRecorder.recorder = new Recorder(input);console.log("recorder:"+twextRecorder.recorder);
    console.log('Recorder initialised.');
  },

  playAudio: function() {
    var audio = document.querySelector('audio');console.log("play audio:"+audio.src);
    if(audio.src) audio.play();
  },

  pauseAudio: function() {
    var audio = document.querySelector('audio');console.log("pause audio:"+audio.src);
    if(audio.src) audio.pause();
  },

  audioDuration: function() {
    var audio = document.querySelector('audio');console.log("pause audio:"+audio.src);
    if(audio.src) return audio.duration;
    return -1;
  },

  /**
  * Seek audio to the given time.
  * @param 'time' time to be seeked to
  */
  seekAudio: function(time) {
    var audio = document.querySelector('audio');console.log("seek audio:"+audio.src + ",time"+time);
    if(audio.src) audio.currentTime = time;
  },

  clearAudio: function() {
    var audio = document.querySelector('audio');console.log("clear audio:"+audio.src);
    if(audio.src) audio.src = null;
  }
});