/**
* TapTimer class handles timings creation and features.
*/
TapTimer = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(twextArea, audio) {
    this.timings = sampleTimings;  // cached timing lines string, initially set to timings of sample text/audio
    this.tappedTimings = "";  // current tapped timings
    this.sourceText = sampleText; // source text
    this.tapDate = null;  // The date of the last tap, used to calculate number of seconds between previous and current taps
    this.player = null; // player object
    this.twextArea = twextArea; // twextArea object
    this.audioRecorder = new AudioRecorder(audio);  // audio recorder used in recording audio in tapping
    this.isTapping = false; // boolean to detect tapping start
    this.tapDelay = 0.1;  // +/- add to / subtract from each timing value
    this.tapIgnore = 3; // period where retapping not allowed after tapping done
    this.tapBlocked = false;  // if true, tap is blocked

    // css classes of segments
    this.TIMER_CSS_CLASS = 'timerHighlighted'; // css class of start timer
    this.TAP_CSS_CLASS = 'tapHighlighted';  // css class of tapping seg
    this.LAST_TAP_CSS_CLASS = 'lastTapHighlighted'; // css class of tapping last seg
  },

  /**
  * Get timing lines for text lines.
  * Load timing lines from fb; create fake timings if no saved timings in firebase.
  * @param 'text' the input text
           'hText' hyphenated text
           'callback' callback function to return to toggle.data
  * @retutn timing lines string
  */
  getTimings: function(text, hText, callback) {
    var i, timingLines = [], ref;
    var timer = this;

    var isNewText = this.sourceText == null || this.sourceText != text; // check if it's a new text
    if(isNewText) {  // new text
      // Create timing slots for this new text
      this.sourceText = text; // set source text
      var fakeTimings = this.createFakeTimings(hText);
      this.timings = fakeTimings;  // cache timings string
      callback(fakeTimings);
    } else {  // old text, return cached timing
      callback(this.timings);
    }
  },

  /**
  * Create fake time slots for segments; each seg has 0.2 incremented timing.
  * @param 'hText' the hyphenated input text
  * @retutn timing lines string
  */
  createFakeTimings: function(hText) {
    var z = 0.2, i, j, timing = "", segs = [], words = [], timingLines = [], zStr = "";

    // Create timing slots for the text
    var lines = hText.split('\n'); // hyphenated text lines
    for(i=0; i<lines.length; i++) {
      // Create timing slots for this line
      timing = "";
      words = strWords(lines[i]);
      for(j=0; j<words.length; j++) {
        segs = words[j].split('-');
        $.each(segs, function() {
          if(this != "") {
            zStr = floatToStr(round(z));  // round number to nearest float with 2 floating digits
            timing += zStr + " ";
            z += 0.2;
          }
        });
      }
      timingLines.push($.trim(timing));
    }
    return timingLines.join('\n');  // return timing lines string
  },

  /**
  * Start timer for tapping.
  */
  start: function(e) {
    if(!this.player) this.player = controller.getPlayer();
    if(!this.player.isPlaying()) return;  // tapping only if text playing
    if(this.tapBlocked) return; // tap not allowed

    e.preventDefault();
    this.tapDate = new Date(); // set start date
    this.isTapping = true;  // tapping started
    this.twextArea.disable(); // disable typing
    this.player.pause(); // pause player

    // Highlight first seg
    this.player.currentSeg = {line: 0, seg: 0}; // set player current seg to the first seg to start tapping
    this.player.setNextSeg();  // set next seg
    this.player.highlightSeg(this.player.currentSeg, this.TIMER_CSS_CLASS); // highlight segment with start timer class
    this.audioRecorder.start(); // start recording audio if mic is on
  },

  /**
  * Tap segment means set timing of the current segment.
  */
  tap: function(e) {
    if(!this.isTapping) return; // timer not started
    e.preventDefault();

    var seconds = this.getSecondsBetweenTaps(); // get time between two taps
    this.tapDate = new Date();  // set the new tap time

    var preSegment = null, preSegTiming = 0;
    var currentSeg = this.player.currentSeg;  // current highlighted segment

    var lastSeg = this.player.getLastSeg(); // get the last seg to compare with current seg
    if(currentSeg.line == lastSeg.line && currentSeg.seg == lastSeg.seg) {  // if current seg is the last one
      var timer = this;
      var diff = 1 - seconds;
      if(diff > 0) setTimeout(function(){timer.stop(e);}, diff * 1000);
      else this.stop(e);
      return; // last seg already tapped, return
    }

    if(currentSeg.line == 0 && currentSeg.seg == 0 && $('.'+this.TIMER_CSS_CLASS).length > 0) { // first seg not yet tapped
      this.player.unhighlightSeg(currentSeg);  // unhighlight seg
      this.player.highlightSeg(currentSeg, this.TAP_CSS_CLASS); // highlight seg with tap class
    } else {
      preSegTiming = parseFloat(this.player.getTiming(currentSeg) - this.tapDelay); // get timing of current seg before moving to next seg
      this.player.unhighlightSeg(currentSeg);  // unhighlight current seg
      // move to next seg
      this.player.setCurrentSeg();
      this.player.setNextSeg();
      lastSeg = this.player.getLastSeg();
      if(lastSeg.line == this.player.currentSeg.line && lastSeg.seg == this.player.currentSeg.seg) {  // last seg tapped
        this.player.highlightSeg(null, this.LAST_TAP_CSS_CLASS); // highlight last seg with tapped class
      } else {
        this.player.highlightSeg(null, this.TAP_CSS_CLASS); // highlight current seg with tapped class
      }
    }

    // tap timing is the current time of video/audio, if no media then it's the seconds between the two taps plus previous segment timing
    var newTiming = floatToStr(round(preSegTiming + seconds + this.tapDelay));
    this.player.setTiming(null, newTiming); // update timing of current segment

    var timingsLine = this.player.getCurrentTimingLine(); // updated timing line
    this.updateTappedTimingLine(this.player.currentSeg.line, timingsLine);  // update cached timings
    if(this.player.displayMode == "timing") {
      var textLineIx = this.player.getTextNode();
      var timingLineIx = textLineIx+1; //index of timing line
      this.twextArea.area.childNodes[timingLineIx].textContent = timingsLine;  // update timing line in the input area
      this.twextArea.realignPair(textLineIx, timingLineIx); // realign timings of current line pair
    }
  },

  /**
  * Stop tapping.
  */
  stop: function(e) {
    if(!this.isTapping) return; // no tapping started

    e.preventDefault();
    var timer = this; // instance of taptimer to be used in callback
    this.tapBlocked = true; // block tapping for a certain period of time "tapIgnore"
    setTimeout(function(){timer.tapBlocked = false;}, timer.tapIgnore*1000);  // release block on tap after a certain period of time "tapIgnore"
    this.isTapping = false; // stop tapping
    this.twextArea.enable();  // enable typing
    this.timings = this.tappedTimings;
    this.audioRecorder.stop(function() {
      timer.player.restart(); // restart playing
    });
  },

  /**
  * Discard tapped timings.
  */
  discard: function(e) {
    if(!this.isTapping) return; // no tapping started

    e.preventDefault();
    var timer = this; // instance of taptimer to be used in callback
    this.isTapping = false;
    this.twextArea.enable();
    this.tappedTimings = "";  // reset tapped timings
    this.audioRecorder.stop(function() {
      timer.player.setTimings(timer.timings.split('\n')); // set player timings to old timings before tap
      if(timer.player.displayMode == "timing") {
        controller.placeTimings(timer.sourceText, function() {  // display old timings before tap
          timer.player.restart(); // restart playing
        });
      } else timer.player.restart(); // restart playing
    }, true);
  },

  /**
  * Update cahched timings lines with the given one
  * @param 'index' index of timing line
           'timingStr' the new timing line
  */
  updateTappedTimingLine: function(index, timingStr) {
    var lines = this.tappedTimings.split('\n'); // timing lines
    lines[index] = timingStr;
    this.tappedTimings = lines.join('\n');
  },

  /**
  * Get number of seconds between taps.
  */
  getSecondsBetweenTaps: function() {
    var now = new Date(); // current tap time
    return (now.getTime() - this.tapDate.getTime())/1000;  // seconds between current and previous tap time
  }
});