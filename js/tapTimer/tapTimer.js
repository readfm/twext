/**
* TapTimer class handles timings creation and features.
*/
TapTimer = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(twextArea, audio, sampleText) {
    this.timings = "0.64 1.03 1.26\n2.17 2.49 2.69 2.84 2.97\n4.35 4.48 4.74 5.07\n5.22 6.22 6.50 6.79";  // cached timing lines string, initially set to timings of sample text/audio
    this.sourceText = sampleText; // source text
    this.tapDate = null;  // The date of the last tap, used to calculate number of seconds between previous and current taps
    this.player = null; // player object
    this.twextArea = twextArea; // twextArea object
    this.audioRecorder = new AudioRecorder(audio);  // audio recorder used in recording audio in tapping
    this.isTapping = false; // boolean to detect tapping start
    this.tapDelay = 0.1;  // +/- add to / subtract from each timing value

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
      this.player.unhighlightSeg(currentSeg, this.TIMER_CSS_CLASS);  // unhighlight seg
      this.player.highlightSeg(currentSeg, this.TAP_CSS_CLASS); // highlight seg with tap class
    } else {
      preSegTiming = parseFloat(this.player.getTiming(currentSeg) - this.tapDelay); // get timing of current seg before moving to next seg
      this.player.unhighlightSeg(currentSeg, this.TAP_CSS_CLASS);  // unhighlight current seg
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
    this.updateTimingLine(this.player.currentSeg.line, timingsLine);  // update cached timings
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
    this.isTapping = false; // stop tapping
    this.twextArea.enable();  // enable typing
    this.audioRecorder.stop(function() {
      timer.player.restart(); // restart playing
    });
  },

  /**
  * Update cahched timings lines with the given one
  * @param 'index' index of timing line
           'timingStr' the new timing line
  */
  updateTimingLine: function(index, timingStr) {
    var lines = this.timings.split('\n'); // timing lines
    lines[index] = timingStr;
    this.timings = lines.join('\n');
  },

  /**
  * Get number of seconds between taps.
  */
  getSecondsBetweenTaps: function() {
    var now = new Date(); // current tap time
    return (now.getTime() - this.tapDate.getTime())/1000;  // seconds between current and previous tap time
  }
});