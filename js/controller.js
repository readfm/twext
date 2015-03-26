/**
* Controller class control all twext classes and communication among them.
*/
Controller = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    // Initialize objects
    this.audio = new Audio(); // audio object
    this.syllabifier = new Syllabifier();  // create Syllabifier object that handles text syllabifications.
    this.twextArea = new TwextArea();  // create TwextArea object to represent the contenteditable element
    this.tapTimer = new TapTimer(this.twextArea, this.audio); // create TapTimer object
    this.player = new Player(this.twextArea, this.syllabifier, this.tapTimer); // create Player object that handles playing features
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
  * Reload page.
  */
  reload: function(e) {
    location.reload();
  },

  /**
  * Init drag and drop settings for tapArea.
  */
  initDragAndDropArea: function() {
    var tapArea = $("#tapArea")[0];
    tapArea.addEventListener('dragenter', controller.drag, false);
    tapArea.addEventListener('dragexit', controller.drag, false);
    tapArea.addEventListener('dragover', controller.drag, false);
    tapArea.addEventListener('drop', controller.drop, false);
  },

  /**
  * On drag event.
  */
  drag: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  /**
  * On drop event.
  */
  drop: function(e) {
    e.stopPropagation();
    e.preventDefault();

    // display droppped image
    var imageEl = $(e.dataTransfer.getData('text/html')); // get image tag
    var imageUrl = imageEl?imageEl.attr("src"):null; // get image url
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/gi; // Match url
    if(imageUrl && re.test(imageUrl)) { // valid server url or data url
      //controller.player.pause();  // pause play
      $("#tapImage").attr("src", imageUrl); // load image
      //controller.player.play(text); // resume play
    } else {  // not valid url, image maybe local file
      var f = e.dataTransfer.files[0];  // get image file
      if(f) { // local image file
        var fr = new FileReader();
        controller.player.pause();  // pause play
        fr.onload = function(ev) {  // file reader done with reading file
          $('#tapImage').attr('src', ev.target.result);
          var text = controller.twextArea.clearText(controller.twextArea.text());
          controller.player.play(text); // resume play
        };
        fr.readAsDataURL(f);
      }
    }
  },
    
  /**
  * Load some initial sample text into the input area.
  */
  loadSampleData: function() {
    // set src of sample audio
    $(this.audio.audio).attr("src", sampleAudioSrc);
    $(this.audio.audio).bind("canplaythrough", function() {
      controller.audio.startTime = 0;
      controller.audio.endTime = controller.audio.duration();
      sampleText = sampleText.split('\n').clean().join('\n'); // remove empty lines
      // render sample text
      controller.twextArea.renderLines(sampleText.split('\n'));  // display text
      // play text
      controller.player.getSegmentsData(sampleText, function() {
        $("#main").show();  // show page content
        controller.playPauseText();
      });
      $(controller.audio.audio).unbind("canplaythrough");
    });
  },

  /**
  * Display timing current state(on/off).
  * @param 'state' the current timing state; true if timing on, false if timing off
  */
  setTimingState: function(state) {
    if(state) { // timing on
      $('#data-bar-timing').html("time");
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
      this.resizeTapArea(); // resize image
      this.setTimingState(false); // set state to timing off
      // update player
      this.player.setDisplayMode("textonly");
      this.player.updateSegsPos();  // mode change, update segs positions
    } else {  // timings not displayed, show timings
      this.placeTimings(text, function() {
        controller.resizeTapArea(); // resize image
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

    // discard tap and enter edit mode if text is in tapping state
    if(this.tapTimer.isTapping) {
      this.discardTap(e);
      return;
    }

    // play/pause text
    if(this.player.isPlaying()) { // currently playing
      this.player.pause(); // pause playing
      this.toEditMode();
    } else { // currently paused playing
      var text = this.twextArea.clearText(this.twextArea.text());
      this.player.play(text); // play/resume playing
      this.toPlayMode();
    }
  },

  /**
  * Pause text play with media.
  */
  pauseText: function(e) {
    if(this.player.isPlaying()) { // text is playing
      if(e) e.preventDefault();
      this.player.pause();
      this.toEditMode();
    }
  },

  /**
  * Change ui to edit mode.
  */
  toEditMode: function() {
    this.setPlayState(false); // display current mode as edit
    this.twextArea.showBorder();
    //$('#tapArea').hide(); // hide tapArea
    $('#tapHint').hide(); // hide tap hint
  },

  /**
  * Change ui to play mode.
  */
  toPlayMode: function() {
    this.setPlayState(true); // display current mode as play
    this.twextArea.hideBorder();
    this.resizeTapArea(); // set height of tap area
    $('#tapArea').show(); // show tapArea
    $('#tapHint').show(); // show tap hint
  },

  /**
  * Resize tap area to fill space below main.
  */
  resizeTapArea: function() {
    var h = document.documentElement.clientHeight - $("#main").height() - 1;  // height of area below "main"
    $("#tapArea").height(h);  // set height of tap area to fill space below "main"
  },

  /**
  * Tap text.
  */
  tap: function(e) {
    if(!this.tapTimer.isTapping) this.tapTimer.start(e);
    else this.tapTimer.tap(e);
  },

  /**
  * Discard tap changes
  */
  discardTap: function(e) {
    this.tapTimer.discard(e);
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
  * Forward user to tap.html
  */
  showIntro: function(e) {
    window.location = "tap.html";
  },

  /**
  * On window resize event.
  */
  handleWindowResize: function(e) {
    console.log('window resize');

    // realign chunks on resize
    this.twextArea.realign();

    // resize tap area
    this.resizeTapArea();
  },

  /**
  * On window load event.
  */
  handleWindowLoad: function(e) {
    console.log('window load');

    // load a sample data
    this.loadSampleData();
    // allow drag&drop in tapArea
    this.initDragAndDropArea();
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
    if(!e.ctrlKey && !e.altKey && !e.shiftKey) {
      if(e.keyCode == 27) this.discardTap(e);  // esc key press, discard tap
      else if(e.keyCode < 112 || e.keyCode > 123) this.tap(e);  // tap any key except FKeys
    }
  },

  /**
  * On document click event.
  */
  handleDocumentClick: function(e) {
    var inTapArea = !$.contains($("#main")[0], e.target);  // tap area any where outside main
    var inTextArea = $.contains($("#data-show")[0], e.target); // inside text area
    if(inTapArea) this.tap(e);
    else if(inTextArea) {
      if(this.player.isPlaying()) this.pauseText();
      else if(this.tapTimer.isTapping) this.discardTap(e);
    }
  }
});