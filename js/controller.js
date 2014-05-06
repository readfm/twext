/**
* Controller class control all twext classes and communication among them.
*/
Controller = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    // Initialize objects
    this.sampleText = "Write any text.\n"+
                     "Tap while you say it.\n"+
                     "Last tap plays it.\n"+
                     "Sync Vocal Text.";
    this.audio = new Audio(); // audio object
    this.syllabifier = new Syllabifier();  // create Syllabifier object that handles text syllabifications.
    this.twextArea = new TwextArea();  // create TwextArea object to represent the contenteditable element
    this.tapTimer = new TapTimer(this.twextArea, this.audio, this.sampleText); // create TapTimer object
    this.player = new Player(this.twextArea, this.syllabifier, this.tapTimer, this.sampleText); // create Player object that handles playing features
  },

  /**
  * Return media object.
  * if there is an audio, then return audio object; return null otherwise.
  */
  getMedia: function() {
    if(this.audio.isOn())  return this.audio;  // audio is on
    return null;
  },

  /**
  * Return player object.
  */
  getPlayer: function() {
    return this.player;
  },
    
  /**
  * Load some initial sample text into the input area.
  */
  loadSampleData: function() {
    // Initiate some sample data
    this.twextArea.renderLines(this.sampleText.split('\n'));  // display text
    // play text
    this.player.getSegmentsData(this.sampleText, function() {
      $("#main").show();  // show page content
      controller.audio.startTime = 0;
      controller.audio.endTime = controller.audio.duration();
      controller.playPauseText();
    });
  },

  /**
  * Display timing current state(on/off).
  * @param 'state' the current timing state; true if timing on, false if timing off
  */
  setTimingState: function(state) {
    if(state) { // timing on
      $('#data-bar-timing').html("timing");
    } else {  // timing off
      $('#data-bar-timing').html("text");
    }
  },

  /**
  * Display current play state(play/edit).
  * @param 'state' the current play state; true if play on, false if play off
  */
  setPlayState: function(state) {
    if(state) { // play on
      $('#data-bar-play').html("play");
    } else {  // play off
      $('#data-bar-play').html("edit");
    }
  },

  /**
  * Toggle between textonly mode and timing mode (on/off timing switch).
  * If current mode is textonly, switch to timing
  * If current mode is timing, switch to textonly
  */
  textOnlyTimingToggle: function(e) {
    var text = this.twextArea.text();
    text = this.twextArea.clearText(text);
    var mode = this.twextArea.textMode();
    if(mode == "timing") { // timings are displayed, show text only
      this.twextArea.renderLines(text.split('\n'));  // display text only
      this.setTimingState(false); // set state to timing off
      // update player
      this.player.setDisplayMode("textonly");
      this.player.updateSegsPos();  // mode change, update segs positions
    } else {  // timings not displayed, show timings
      this.placeTimings(text, function() {
        controller.setTimingState(true); // set state to timing on
        // update player
        controller.player.setDisplayMode("timing");
        controller.player.updateSegsPos();  // mode change, update segs positions
      }); // display timing slots
    }
  },

  /**
  * Get timing lines and display paired text/timing lines.
  * @param 'text' text to be rendered with timings
  */
  placeTimings: function(text, callback) {
    this.syllabifier.syllabifyText(text, function(hText) { // syllabify text to get segments
      controller.tapTimer.getTimings(text, hText, function(timings) {
        var lines = controller.meldPairedLines(hText, timings);  // merge lines
        controller.twextArea.renderPairedLines(lines, "timing");  // render the lines
        controller.twextArea.realign(); // align Text/Twext lines
        callback();
      }); // timing lines
    });
  },

  /**
  * Get paired lines.
  * @param 'big' big sized string source text
           'small' small sized string (twext or timing)
  * @return Text/Timing lines
  */
  meldPairedLines: function(big, small) {
    var i = 0, j = 0, lines = [];
    var bigLines = big.split("\n"); // TEXT lines
    var smallLines = small.split("\n"); // small lines (twext or timing)
    for(i=0; i<bigLines.length ; i++) {  // loop over source text lines
      lines.push(bigLines[i]); // add Text line
      lines.push(smallLines[i]); // add Twext line
    }
    return lines;  // return Text/Twext lines
  },

  /**
  * Animate text segments according to timings.
  */
  playPauseText: function(e) {
    if(e) e.preventDefault();

    // play/pause text
    if(this.player.isPlaying()) { // currently playing
      this.player.pause(); // pause playing
      this.setPlayState(false); // display current mode as edit
      this.twextArea.showBorder();
      $('body').css("background-color", "white");
      $('#tapHint').hide(); // hide tap hint
    } else { // currently paused playing
      var text = this.twextArea.clearText(this.twextArea.text());
      this.player.play(text); // play/resume playing
      this.setPlayState(true); // display current mode as play
      this.twextArea.hideBorder();
      $('body').css("background-color", "silver");
      $('#tapHint').show(); // show tap hint
    }
  },

  /**
  * Pause text play with media.
  */
  pauseText: function(e) {
    if(this.player.isPlaying()) { // text is playing
      if(e) e.preventDefault();
      this.player.pause();
      this.setPlayState(false); // display current mode as edit
      this.twextArea.showBorder();
      $('body').css("background-color", "white");
      $('#tapHint').hide(); // hide tap hint
    }
  },

  /**
  * Tap text.
  */
  tap: function(e) {
    if(!this.tapTimer.isTapping) this.tapTimer.start(e);
    else this.tapTimer.tap(e);
  },

  /**
  * Switch font type from/to monospace/proportional.
  */
  switchFontType: function(e) {
    var area = this.twextArea; 
    var currentFont = area.area.className;  // current font
    if(currentFont == "" || currentFont == "monospaceFont") area.area.className = "proportionalFont";  // switch to monospaceFont
    else area.area.className = "monospaceFont";  // switch to proportionalFont

    area.realign(); // realign lines
  },

  /**
  * On window resize event.
  */
  handleWindowResize: function(e) {
    console.log('window resize');

    // realign chunks on resize
    this.twextArea.realign();
  },

  /**
  * On window load event.
  */
  handleWindowLoad: function(e) {
    console.log('window load');

    // load a sample data
    this.loadSampleData();
  },

  /**
  * Handle backspace keydown on data-show input area.
  */
  handleBackspaceKeydown: function(e) {
    // check if it's undo hyphenation trial in timing mode
    if(this.twextArea.textMode() == "timing") {  // timing mode
      var cursorCoord = this.twextArea.getCaretPos(); // get cursor position
      var text = this.twextArea.value();  // get area input data
      var line = text.split('\n')[cursorCoord.lines]; // current line on focus
      if(line.charAt(cursorCoord.offset-1) == '-') {  // undo hyphenation
        // Delete - from all occurrences of the word where - deleted
        var txt = this.syllabifier.undoWordHyphenation(text, cursorCoord);
        if(txt) {
          e.preventDefault();
          this.twextArea.renderPairedLines(txt.split('\n'), 'timing');  // render updated lines
          this.twextArea.setCaretPos(cursorCoord.lines, cursorCoord.offset-1);  // set cursor position after deleting the -
          this.syllabifier.setHyphenatedText(this.twextArea.text());  // set new hyphenated text
        }
      }
    }
  },

  /**
  * On data-show input area keyup event.
  */
  handleAreaKeyup: function(e) {
    if(this.twextArea.textMode() == "timing") { // timing lines are displayed
      var cursorCoord = this.twextArea.getCaretPos(); // cursor position
      var text = this.twextArea.value(); //get area input data
      var line = text.split('\n')[cursorCoord.lines]; // current line on focus
      if(line.charAt(cursorCoord.offset-1) == '-') {  // hyphenate word
        // Insert - in all occurrences of the word where - inserted
        var txt = this.syllabifier.hyphenateWord(text, cursorCoord);
        if(txt) {
          this.twextArea.renderPairedLines(txt.split('\n'), 'timing');  // render updated lines
          this.twextArea.setCaretPos(cursorCoord.lines, cursorCoord.offset);  // set cursor position after inserting the -
          this.syllabifier.setHyphenatedText(this.twextArea.text()); // set new hyphenated text
        }
      }
    }
  },

  /**
  * On data-show input area keydown event.
  */
  handleAreaKeydown: function(e) {
    // Adjust area limit, if user type a character without ctrlKey and is over limit then stop the event and return.
    if(!e.ctrlKey && !this.twextArea.adjustLimit(e.keyCode)) return false;
  },

  /**
  * On document keydown.
  */
  handleDocumentKeydown: function(e) {
    if(!e.ctrlKey && !e.altKey && !e.shiftKey && (e.keyCode < 112 || e.keyCode > 123)) { // 112 to 123 are FKeys, exclude them from tap keys
      this.tap(e);
    }
  },

  /**
  * On document click event.
  */
  handleDocumentClick: function(e) {
    var inTapArea = !$.contains($("#main")[0], e.target);  // tap area any where outside main
    var inTextArea = $.contains($("#data-show")[0], e.target); // inside text area
    if(inTapArea) this.tap(e);
    else if(inTextArea && this.player.isPlaying()) this.pauseText();
  },
});