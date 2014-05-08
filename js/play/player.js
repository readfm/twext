/**
* Player class handles text segments animations with media according to timing slot for each segment.
* Syllabifier object used to get text segments.
* TapTimer object used to get segments' timings and handles tapping action.
*/
Player = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(area, syllabifier, tapTimer) {
    this.twextArea = area;  // twext area
    this.syllabifier = syllabifier; // syllabifier object
    this.tapTimer = tapTimer; // TapTimer object, send this to be accessed by the taptimer
    this.media = null;  // video or audio
    this.currentSeg = null; // key/value obj contains line and seg number of current seg
    this.nextSeg = null;  // key/value obj contains line and seg number of next seg
    this.segmentsData = []; // index is the Text line number(0,1,..); each entry is k/v array contains 3 arrays: segments values, positions, timings; index of each array is seg number
    this.segTimeout = 0; // timout for segment
    this.loopTimeout = 0; // timeout for loop
    this.endTiming = 1; // the number of seconds for the last seg to be highlighted before start over again "Loop"
    this.sourceText = sampleText; // Text lines currently displayed
    this.displayMode = null;  // current display mode
    this.playing = false; // flag to detect if text is playing
  },

  /**
  * Play text with media(audio/video if exist)
  * @param 'text' Text rows
  */
  play: function(text) {
    var p = this;
    var isNewText = this.sourceText == null || this.sourceText != text; // check if text is new
    if(isNewText) { // new text
      controller.audio.clear(); // clear audio if exist
      this.reset(); // reset player
      this.getSegmentsData(text, function() { // create array of segments and timings per each Text line
        p.play(text);
      });
      return; // return to be recalled after getting segments/timings data
    }

    // Start text playing
    this.playing = true;  // start playing
    this.setDisplayMode(this.twextArea.textMode());
    this.twextArea.disable();  // disable typing on the area while playing
    this.setMedia();  // set media object to either video or audio
    this.playMedia(); // play video/audio

    var player = this;
    if(!this.currentSeg) {  // first run, highlight first segment after its timing period
      var currentTiming = parseFloat(this.segmentsData[0].timings[0]);  // current seg timing (first seg timing)
      var currSegTimeout = currentTiming;
      this.segTimeout = setTimeout(function(){player.playText();}, currSegTimeout*1000);  // highlight seg when its time is reached
    } else {
      this.playText();  // resume playing
    }

    // loop
    this.loop();
  },

  /**
  * Animate text segments with media(audio/video if exists) according to timings.
  */
  playText: function() {
    // unhighlight old seg
    this.unhighlightSeg();

    this.setCurrentSeg(); // set new current segment
    this.setNextSeg();  // set new next segment

    // highlight the new current segment
    this.highlightSeg();

    // set the timout for the segment for how long current seg is highlighted
    var player = this;  // instance of this used in setTimeout
    var timeout = this.calculateCurrentSegTimeout(); // get seg timeout for current seg
    if(timeout == -1) return;

    this.segTimeout = setTimeout(function(){player.playText();}, timeout*1000);
  },

  /**
  * Play media (video or audio) if exists.
  */
  playMedia: function() {
    if(this.media) this.media.play();
  },

  /**
  * loop text animation with media, play period is the period of media if exists, or time between first and last seg if no media.
  */
  loop: function() {
    var player = this;  // instance of this used in setTimout
    var playPeriod = null;
    if(!this.media) { // no media
      var currentSegTiming = this.currentSeg?parseFloat(this.segmentsData[this.currentSeg.line].timings[this.currentSeg.seg]):0;
      var lastSeg = this.getLastSeg();  // last segment
      var lastSegTiming = parseFloat(this.segmentsData[lastSeg.line].timings[lastSeg.seg]);  // last seg timing
      playPeriod = lastSegTiming - currentSegTiming + this.endTiming;  // period of all segments playing + last segment highlight period
    } else if(this.media instanceof Audio) {
      playPeriod = this.media.seekedTo != -1?this.media.duration()-this.media.seekedTo:this.media.duration(); // audio duration
    }
    this.loopTimeout = setTimeout(function(){player.restart();}, playPeriod*1000); // repeat
  },

  /**
  * Restart text with media play from first seg.
  */
  restart: function() {
    this.pause();
    if(this.media) this.media.setSeekedTo(-1);  // to start from the start time
    this.currentSeg = this.nextSeg = null;  // reset first and next segments
    this.play(this.sourceText);  // play
  },

  /**
  * Pause text animation with media.
  */
  pause: function() {
    this.playing = false; // stop playing
    this.twextArea.enable(); // enable typing on the area

    this.unhighlightSeg();  // unhighlight current seg

    if(this.media) {
      this.media.pause();  // pause video/audio
      var nextTiming = this.nextSeg?parseFloat(this.segmentsData[this.nextSeg.line].timings[this.nextSeg.seg]):null;
      if(nextTiming && nextTiming >= this.media.startTime && nextTiming <= this.media.endTime) this.media.seek(nextTiming);
    }
    clearTimeout(this.segTimeout); // clear seg timeout
    clearTimeout(this.loopTimeout); // clear loopTimout

    // If paused at the last seg, then start from first seg when play again
    var lastSeg = this.getLastSeg();
    if(this.currentSeg && this.currentSeg.line == lastSeg.line && this.currentSeg.seg == lastSeg.seg) {
      this.currentSeg = this.nextSeg = null;
      if(this.media) this.media.setSeekedTo(-1);  // to start from the start time
    }
  },

  /**
  * Get timing of given seg.
  * @param 'seg' segment
  * @return timing of the given seg
  */
  getTiming: function(seg) {
    if(this.segmentsData.length > 0)  return this.segmentsData[seg.line].timings[seg.seg];
    return 0;
  },

  /**
  * Set timing of given seg.
  * @param 'seg' segment, if null then current segment
           'timing' timing value to set
  */
  setTiming: function(seg, timing) {
    seg = seg?seg:this.currentSeg;
    this.segmentsData[seg.line].timings[seg.seg] = timing;  // set timing
  },

  /**
  * Set timings lines in segmentsData object.
  * @param "timingLines" timings to be set
  */
  setTimings: function(timingLines) {
    var i;
    for(i=0; i<timingLines.length; i++) {
      this.segmentsData[i].timings = timingLines[i].split(' ');
    }
  },

  /**
  * Get timings of current line segs.
  * @return string of timings of current line
  */
  getCurrentTimingLine: function() {
    var timings = this.segmentsData[this.currentSeg.line].timings;  // timings of current seg line
    return timings.join(" ");
  },

  /**
  * Get the last segment of the text.
  * @return last segment line and seg number
  */
  getLastSeg: function() {
    var lastLine = this.segmentsData.length-1;  // last line index
    var lastSeg = this.segmentsData[lastLine].segments.length-1;  // last seg index
    return {line: lastLine, seg: lastSeg};  // last segment
  },

  /**
  * Set the current media object, video or audio or nothing.
  */
  setMedia: function() {
    this.media = controller.getMedia(); // get current media object
  },

  /**
  * Highlight the given seg.
  * Put the segment in <span>, set its class to give it a background color and set it to uppercase.
  * @param 'seg' segment to be highlighted, if null then highlight current segment
           'clazz' class of the span, default is playHighlighted
  */
  highlightSeg: function(seg, clazz) {
    var clss = clazz?clazz:"playHighlighted"; // use default class if clazz is not set
    var segment = seg?seg:this.currentSeg;  // use current segment if seg is not set

    if(!segment || this.segmentsData.length == 0) return; // No segments data, return

    var segValue = this.segmentsData[segment.line].segments[segment.seg]; // segment value
    var segIx = this.segmentsData[segment.line].positions[segment.seg]; // segment position
    var nodeIx = this.getTextNode(segment); // node index
    var node = this.twextArea.area.childNodes[nodeIx]; // node contains the seg
    var segSpanId = segment.line+""+segment.seg;

    // put the word in span
    SpanUtils.putWordInSpan(node, segIx, segValue, segSpanId);  // put word in span
    $('#'+segSpanId).addClass(clss);  // set class for the span
  },

  /**
  * Unhighlight the given segment.
  * Remove the segment from the span.
  * @param 'seg' segment to be unhighlighted, if null then unhighlight current segment
  */
  unhighlightSeg: function(seg) {
    var segment = seg?seg:this.currentSeg;  // use current segment if seg is not set
    if(!segment || this.segmentsData.length == 0) return; // No segments data, return

    var segSpanId = segment.line+""+segment.seg;  // id of the span
    if($('#'+segSpanId).length == 0) return; // no word to unhighlight

    // remove span node
    SpanUtils.removeSpanNode(segSpanId);
  },

  /**
  * Get the Text node number contains the given segment.
  * If the mode is text only, then the seg line number is the same as the displayed Text line number.
  * If the mode is timing or twext, then the displayed Text line number is the seg line number multiplied by 2, to count twext/timing lines.
  * @return Text node index
  */
  getTextNode: function(seg) {
    var segment = seg?seg:this.currentSeg;
    if(this.displayMode == "textonly")  return segment.line;  // only text lines displayed
    else if(this.displayMode == "timing")  return segment.line*2;  // paired lines displayed
    return -1;  // invalid mode
  },

  /**
  * Set the current segment.
  * If at start of play, set current segment to the first segment, else set it to the next segment.
  */
  setCurrentSeg: function() {
    if(!this.currentSeg) {  // start playing
      this.currentSeg = {line: 0, seg: 0};  // first seg
    } else {
      this.currentSeg = this.nextSeg; // next seg
    }
  },

  /**
  * Set the next segment.
  * If end of play, set current segment to the first segment to loop, 
    else if current segment is last segment in line, set next segment to be the first segment of the next line,
    else set next segment to the next segment in the current line.
  */
  setNextSeg: function() {
    this.nextSeg = this.getNextSeg(this.currentSeg);
  },

  /**
  * Get the next segment of a specific segment.
  * @param 'segment' segment before the one required, if null then get next segment of the current segment
  * @return next segment of the given segment
  */
  getNextSeg: function(segment) {
    if(!segment) return this.nextSeg; // next segment of the current segment
    var nextSeg = null;
    var lineSegments = this.segmentsData[segment.line].segments;  // current line segments
    if(segment.seg == lineSegments.length-1) { // last seg in the line, move to next line
      if(segment.line == this.segmentsData.length-1) {  // last line
        nextSeg = null; // no next segment
      } else {  // move to next line
        nextSeg = {line: segment.line+1, seg: 0}; // first segment in next line
      }
    } else {  // move to next seg of the line
      nextSeg = {line: segment.line, seg: segment.seg+1}; // next segment in the same line
    }
    return nextSeg; // return next segment
  },

  /**
  * Calculate the timeout for the current seg (how long the seg would be highlighted).
  */
  calculateCurrentSegTimeout: function() {
    var currentTiming, nextTiming;
    if(this.currentSeg) currentTiming = parseFloat(this.segmentsData[this.currentSeg.line].timings[this.currentSeg.seg]);
    else currentTiming = 0; // currentSeg not set (unreached case)
    if(this.nextSeg) nextTiming = parseFloat(this.segmentsData[this.nextSeg.line].timings[this.nextSeg.seg]);
    else return -1; // no next seg, current is last seg, no timout for last seg, last segment should still highlighted till loop start

    return nextTiming - currentTiming;  // current seg will be highlighted for a period equals to next seg timing - current seg timing
  },

  /**
  * Create object contains segments and their timing slots.
  * Index of the array represents Text line number; each entry is an array(index is seg number) of key/value objects contains seg value, seg position and timing slot.
  */
  getSegmentsData: function(text, callback) {
    var i, j, wSegs, wSegPos, slots, timingCount;
    var segsData = [], segs = [], posArr = [], times = [];
    var player = this;  // player object called on callback
    this.syllabifier.syllabifyText(text, function(hText) {
      player.tapTimer.getTimings(text, hText, function(timings) {
        var lines = hText.split('\n');  // get hyphenated text lines
        var timingLines = timings.split('\n');  // get timing lines
        for(i=0; i<lines.length; i++) { // loop on htext lines
          timingCount = 0;
          segs = [];
          posArr = [];
          times = [];
          slots = timingLines[i].split(' ');  // timing slots of this line segments
          words = strWords(lines[i]); // get line words
          wordsPos = strWordsIndices(lines[i]);  // get line words positions
          for(j=0; j<words.length; j++) { // loop on line words
            wSegPos = 0;  // positions of word subsegment
            wSegs = words[j].split('-').clean();  // get word segs
            $.each(wSegs, function() {  // loop over word segs
              segs.push(this+"");  // push seg value
              posArr.push(wordsPos[j]+wSegPos);  // push position of seg
              times.push(slots[timingCount]); // push timing of seg
              timingCount++;  // increment counter for timings
              wSegPos += this.length+1; // add seg length + 1 for the -
            });
          }
          segsData[i] = {segments: segs, positions: posArr, timings: times}; // add line segs data
        }
        player.segmentsData = segsData; // set segmentsData object
        // positions are got from hyphenated text, so they're not correct if current mode is not timing(hyphenated text not dispalyed)
        if(player.displayMode != "timing")  player.updateSegsPos();// update segs positions if current mode is not timing(text is not syllabified)
        player.sourceText = text; // set source text
        callback();  // return to calling function
        //else player.play(text); // recall of play after getting segs and timings
      });
    });
  },

  /**
  * Get positions of all lines segments.
  * The method loop on displayed Text lines, loop on segments of the line, find the index of the first occurence of the seg in the line then take the substring after the segment and repeat until donne with all line segments.
  */
  updateSegsPos: function() {
    if(this.segmentsData.length == 0) return; // No segments data generated yet

    var i, j, k = 0;  // i is counter for element child nodes, k is counter for text lines in segTimingLines obj
    var  line, subLine, seg, segs, segIx = 0, segIxCount = 0, indicesLine, segIndices = [];
    var lines = this.twextArea.text().split('\n'); // get Text lines
    for(i=0; i<lines.length; i++) {
      segIxCount = 0;  // start with the first seg in the line where the index is 0
      posArr = [];
      line = lines[i];
      segs = this.segmentsData[i].segments; // line segments
      for(j=0; j<segs.length; j++) {
        segIx = line.indexOf(segs[j]);  // index of seg in the line
        posArr.push(segIx + segIxCount); // push index of the seg
        line = line.slice(segIx + segs[j].length); // new text after dropping the previous segment
        segIxCount += segIx + segs[j].length; // consider dropping text
      }
      this.segmentsData[i].positions = posArr; // push positions of line segments
    }
  },

  /**
  * Set the current display mode.
  * @param 'mode' current mode (textonly, twext or timing)
  */
  setDisplayMode: function(mode) {
    this.displayMode = mode;
  },

  /**
  * Check if text is playing.
  * @return boolean detects if the text is playing
  */
  isPlaying: function() {
    return this.playing;
  },

  /**
  * Reset player data.
  */
  reset: function() {
    // clear window timeouts
    clearTimeout(this.segTimeout);
    clearTimeout(this.loopTimeout);

    this.media = null;  // video or audio
    this.currentSeg = null; // key/value obj contains line and seg number of current seg
    this.nextSeg = null;  // key/value obj contains line and seg number of next seg
    this.segmentsData = []; // index is the Text line number(0,1,..); each entry is k/v array contains 3 arrays: segments values, positions, timings; index of each array is seg number
    this.segTimeout = 0; // timout for segment
    this.loopTimeout = 0; // timeout for loop
    this.sourceText = null; // Text lines currently displayed
    this.displayMode = null;  // current display mode
    this.playing = false; // flag to detect if text is playing
  }
});