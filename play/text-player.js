/**
* Text player class handles text segments animations according to timing slot for each segment.
* Player needs Syllabifier and TimingCreator class objects to be able to work.
* Syllabifier object used to get text segments.
* TimingCreator object used to get segments' timings.
*/
TextPlayer = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(el, syllab, timing) {
    this.element = el;  // Input area
    this.syllabifier = syllab?syllab:new Syllabifier(); // syllabifier object
    this.timingCreator = timing?timing:new TimingCreator(); // timingCreator object
    this.displayMode = null;  // current display mode
    this.previousSeg = null;  // key/value obj contains line and seg number of previous seg
    this.currentSeg = null; // key/value obj contains line and seg number of current seg
    this.nextSeg = null;  // key/value obj contains line and seg number of next seg
    this.sourceText = null; // Text lines currently displayed
    this.segTimingLines = []; // index of the array is the Text line number; each entry is an array of line segments(index is seg number); each entry is an obj contains seg, timing
    this.segIndices = []; // index of the array is the Text line number; each entry is an array of line segments(index is seg number); each entry is seg index
    this.timeout = 0; // window timeout value
    this.doneTapTiming = false;  // boolean detects if all segs has been tapped
    this.endTiming = 1; // the number of seconds for the last seg to be highlighted before start over again "Loop"
    this.date = null;  // The date of the last tap, used to calculate number of seconds between taps that equals to difference between current tap and previous tap times
  },

  /**
  * Animate text segments according to timings.
  * @param 'text' the Text lines only
  */
  playText: function() {
    var player = this;  // create object of the player to be sent to the timeout
    var lastSeg = false;
    var text = this.text();
    var isNewText = this.sourceText == null || this.sourceText != text;
    if(isNewText) {
      this.sourceText = text;
      this.createSegTiming(); // create array of segments and timings per each Text line, this method will recall playText
    } else {
      this.unhighlightSeg(); // unhighlight current seg
      this.setCurrentSeg();
      this.setNextSeg();
      this.highlightSeg();
      // Set window timeout to allow playing next seg after difference between current and next timing amount of time
      this.timeout = setTimeout(function(){player.playText();}, (player.calculateSegTimeout(this.isLastSeg()))*1000);
    }
  },

  /**
  * Set the current segment.
  * If at start of play or end of play, set current segment to the first segment, else set it to the next segment.
  */
  setCurrentSeg: function() {
    if(!this.currentSeg || !this.nextSeg) {  // start playing or loop
      this.currentSeg = {line: 0, seg: 0};
    } else {
      this.previousSeg = this.currentSeg;
      this.currentSeg = this.nextSeg;
    }
  },

  /**
  * Set the next segment.
  * If end of play, set current segment to the first segment to loop, 
    else if current segment is last segment in line, set next segment to be the first segment of the next line,
    else set next segment to the next segment in the current line.
  */
  setNextSeg: function() {
    var currentLine = this.segTimingLines[this.currentSeg.line];  // current line segments
    if(this.currentSeg.seg == currentLine.length-1) { // last seg in the line, move to next line
      if(this.currentSeg.line == this.segTimingLines.length-1) {  // last line
        this.nextSeg = {line: 0, seg: 0}; // start loop, move to first seg again
      } else {
        this.nextSeg = {line: this.currentSeg.line+1, seg: 0};
      }
    } else {  // move to next seg of the line
      this.nextSeg = {line: this.currentSeg.line, seg: this.currentSeg.seg+1};
    }
  },

  /**
  * Check if the current segment is the last segment in text.
  */
  isLastSeg: function() {
    var currentLine = this.segTimingLines[this.currentSeg.line];  // current line segments
    return this.currentSeg.seg == currentLine.length-1 && this.currentSeg.line == this.segTimingLines.length-1;
  },

  /**
  * Calculate the timeout for the current seg.
  * Last seg timeout(period before loop) = last seg timing + end time - first seg timing
  * If not last seg, seg timeout = next seg timing - current seg timing.
  * @param 'lastSeg' boolean detects if the current segment is the last segment in the text.
  */
  calculateSegTimeout: function(lastSeg) {
    var currentLine = this.segTimingLines[this.currentSeg.line];  // current line segments
    var currentTiming = parseFloat(currentLine[this.currentSeg.seg].timing);  // current seg timing
    var nextLine = this.segTimingLines[this.nextSeg.line];  // next line segments
    var nextTiming = nextLine?parseFloat(nextLine[this.nextSeg.seg].timing):currentTiming;  // next seg timing
    //if last seg,the seg remains highlighted for a period equal to the current seg timing + endtiming - first seg timing
    if(lastSeg) return currentTiming + this.endTiming - nextTiming;
    //if not last seg,the seg remains highlighted for a period equals to difference between next and current timing
    return nextTiming-currentTiming;
  },

  /**
  * Pause text animation.
  */
  pauseText: function() {
    this.unhighlightSeg();
    clearTimeout(this.timeout);
  },

  /**
  * Extract Text lines from the area.
  * @return Text lines
  */
  text: function() {
    var lines = [], i, text = "";
    var nodes = this.element.childNodes; // area child nodes
    if(this.displayMode == "twext" || this.displayMode == "timing") { // if twext displayed
      for(i=0; i<nodes.length; i++) { // loop over area childnodes
        if(nodes[i].className == "text") lines.push(nodes[i].innerText);  // push text line
      }
      text = lines.join('\n');  // construct text string
      if(this.displayMode == "timing") text = this.syllabifier.unsyllabifyText(text);
    } else {  // twext not displayed
      text = this.element.innerText; // text is the input
    }
    return cleanText(text);  // return text
  },

  /**
  * Get number of seconds between taps.
  */
  getSeconds: function() {
    var now = new Date();
    return (now.getTime() - this.date.getTime())/1000;
  },

  /**
  * Enter taptiming mode.
  */
  startTimer: function() {
    this.date = new Date(); // set current date
    clearTimeout(this.timeout);
    this.doneTapTiming = false;

    // Highlight first seg
    this.unhighlightSeg();
    this.previousSeg = null;
    this.currentSeg = {line: 0, seg: 0};
    this.setNextSeg();
    this.highlightSeg("timerHighlighted");
  },

  /**
  * Tap segment means move to next segment and override its timing.
  */
  tap: function() {
    if(this.doneTapTiming) return;

    var previousLine, previousTiming = 0;
    var secs = this.getSeconds();

    if(!this.previousSeg) { // if first segment
      this.previousSeg = this.currentSeg; // set previous seg for the next tap to jump to else case
    } else {
      // move to next seg
      this.unhighlightSeg();
      this.setCurrentSeg();
      this.setNextSeg();
      this.highlightSeg("timerHighlighted");

      // Get previous seg timing
      previousLine = this.segTimingLines[this.previousSeg.line];  // current line segments
      previousTiming = parseFloat(previousLine[this.previousSeg.seg].timing);  // current seg timing
    }

    // calculate new timing for next seg
    var newTiming = previousTiming + secs;
    // update timing of current segment
    this.segTimingLines[this.currentSeg.line][this.currentSeg.seg].timing = timingCreator.timingStr(newTiming);
    this.date = new Date();

    // save timing in fb and update in timingCreator class
    var newTimingLine = this.getTimingsOfCurrentLine();
    if(area.isTimingOn()) { // update displayed timing line
      var text = area.area.innerText;
      var lines = text.split('\n');
      var lineNum = this.getCurrentTextNode()+1;
      area.area.childNodes[lineNum].innerText = newTimingLine;
      
      // realign segs
      this.unhighlightSeg();  // unhighlight current seg
      area.realign(); // realign chunks
      player.highlightSeg("timerHighlighted");  // rehighlight current seg
    }

    if(this.isLastSeg()) this.doneTapTiming = true;

    var currentSegLine = this.currentSeg.line;
    timingCreator.saveTimingLine(newTimingLine, currentSegLine);  // save timing line into fb
  },

  /**
  * Get timings of current line segs.
  */
  getTimingsOfCurrentLine: function() {
    var i, timings = [];
    var segs = this.segTimingLines[this.currentSeg.line];
    for(i=0; i<segs.length; i++) {
      timings.push(segs[i].timing);
    }
    return timings.join(" ");
  },

  /**
  * Highlight the current seg.
  * Put the segment in <span>, set to uppercase and add background color.
  */
  highlightSeg: function(clazz) {
    var clss = clazz?clazz:"playHighlighted";
    if(this.segTimingLines.length == 0) return; // No segments/timings generated yet
    var before, after, spanNode;
    var currentSeg = this.segTimingLines[this.currentSeg.line][this.currentSeg.seg].seg;
    var currentSegIx = this.segIndices[this.currentSeg.line][this.currentSeg.seg];
    var nodeIx = this.getCurrentTextNode();
    var currentNode = this.element.childNodes[nodeIx];
    var nodeVal = currentNode.innerText;

    // highlight the new seg
    before = nodeVal.substring(0, currentSegIx);
    after = nodeVal.slice(currentSegIx+currentSeg.length);
    spanNode = $("<span class='" + clss + "'>" + currentSeg + "</span>");
    currentNode.childNodes[0].nodeValue = before;
    spanNode.insertAfter(currentNode.childNodes[0]);
    $(document.createTextNode(after)).insertAfter(spanNode); // Create text node to contain the text string after the span

    this.sourceText = this.text(); // update the source text with the text in play
  },

  /**
  * Unhighlight segment, default segment is the current.
  * @return class of the unhighlighted seg
  */
  unhighlightSeg: function() {
    var clazz = null;
    if($('.playHighlighted').length != 0) clazz = "playHighlighted";
    else if($('.timerHighlighted').length != 0) clazz = "timerHighlighted";
    else return;  // nothing to unhighlight

    var seg = this.currentSeg;
    var currentNode = this.element.childNodes[this.getCurrentTextNode()];
    var spanNode = $('.'+clazz)[0];
    var preVal = spanNode.previousSibling?spanNode.previousSibling.nodeValue:"";
    var afterVal = spanNode.nextSibling?spanNode.nextSibling.nodeValue:"";
    var segVal = this.segTimingLines[seg.line][seg.seg].seg;
    $('.'+clazz).remove();
    currentNode.innerText = preVal + segVal + afterVal;
    this.sourceText = this.text(); // update the source text with the text in play
    return clazz;
  },

  /**
  * Get the current Text node number. (this should be altered if multiple versions are displayed)
  * If the mode is text only, then the seg line number is the same as the displayed Text line number.
  * If the mode is timing or twext, then the displayed Text line number is the seg line number multiplied by 2, to count twext/timing lines.
  * @return current Text node index
  */
  getCurrentTextNode: function() {
    if(this.displayMode == "text")  return this.currentSeg.line;
    else if(this.displayMode == "twext" || this.displayMode == "timing")  return this.currentSeg.line*2;
    return -1;
  },

  /**
  * Create object contains segments and their timing slots.
  * Index of the array represents Text line number; each entry is an array(index is seg number) of key/value objects contains seg value, seg position and timing slot.
  */
  createSegTiming: function() {
    var segTiming = [], i, j, k, wSegs, timings;
    var player = this;
    var syllabifier = this.syllabifier;
    var timingCrt = this.timingCreator;
    this.syllabifier.syllabifyText(this.sourceText, function(hText) {
      timingCrt.getSegTiming(player.sourceText, hText, function(timingLines) {
        var lines = hText.split('\n');
        for(i=0; i<lines.length; i++) {
          k = 0;
          segTiming[i] = [];
          timings = timingLines[i].split(' ');  // timing slots of this line segments
          words = strWords(lines[i]);
          for(j=0; j<words.length; j++) { // loop words of this line
            wSegs = words[j].split('-').clean();
            $.each(wSegs, function() {
              segTiming[i].push({seg: this, timing: timings[k]});
              k++;
            });
          }
        }
        player.segTimingLines = segTiming;
        player.getSegIndices();
        player.playText(player.sourceText); // recall of play after getting segs and timings
      });
    });
  },

  /**
  * Get all segments indices per line.
  * The index of the array is the Text line number, each entry is array of line segments indices.
  * The method loop on displayed Text lines, loop on segments of the line, find the index of the first occurence of the seg in the line then take the substring after the segment and repeat until donne with all line segments.
  */
  getSegIndices: function() {
    if(this.segTimingLines.length == 0) return; // No segments/timings generated yet
    var i, j, k = 0;  // i is counter for element child nodes, k is counter for text lines in segTimingLines obj
    var  line, subLine, seg, segs, segIx = 0, segIxCount = 0, indicesLine, segIndices = [];
    var lines = this.element.childNodes;
    for(i=0; i<lines.length; i++) {
      if(lines[i].className == "text") {  // Text line
        segIxCount = 0;  // start with the first seg in the line where the index is 0
        indicesLine = []
        line = lines[i].innerText; // line text
        segs = this.segTimingLines[k];
        for(j=0; j<segs.length; j++) {
          seg = segs[j].seg;  // seg value
          segIx = line.indexOf(seg);  // index of seg in the line
          indicesLine.push(segIx + segIxCount); // push index of the seg
          line = line.slice(segIx + seg.length); // new text after dropping the previous segment
          segIxCount += segIx + seg.length;
        }
        segIndices.push(indicesLine);
        k++;  // increment text lines counter
      }
    }
    this.segIndices = segIndices;
  },

  /**
  * Set the current display mode.
  * @param 'mode' current mode (text, twext or timing)
  */
  setDisplayMode: function(mode) {
    //this.reset();
    this.displayMode = mode;
  },

  /**
  * Check if there is a highlighted segment displayed "Text is playing".
  * @return boolean detects if the current segment is highlighted
  */
  isPlaying: function() {
    return $('.playHighlighted').length > 0;
  },

  /**
  * Check if there is a highlighted segment displayed in timer mode.
  * @return boolean detects if the current segment is highlighted in timer mode
  */
  isTapTiming: function() {
    return $('.timerHighlighted').length > 0;
  },

  /**
  * Reset player.
  */
  reset: function() {
    this.unhighlightSeg();
    this.displayMode = null;
    this.previousSeg = null;
    this.currentSeg = null;
    this.nextSeg = null;
    this.sourceText = null;
    this.segTimingLines = [];
    this.segIndices = [];
    //this.done = false;
  }
});