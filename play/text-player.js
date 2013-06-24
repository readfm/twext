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
    this.done = false;  // boolean detects if all segs has been played
  },

  /**
  * Animate text segments according to timings.
  * @param 'text' the Text lines only
  */
  playText: function() {
    var text = this.text();
    var isNewText = this.sourceText == null || this.sourceText != text;
    if(isNewText) {
      this.sourceText = text;
      this.createSegTiming(); // create array of segments and timings per each Text line, this method will recall playText
    } else {
      this.unhighlightSeg(); // unhighlight current seg
      if(!this.currentSeg) {  // start playing with the first seg
        this.currentSeg = {line: 0, seg: 0};
        this.done = false;
      } else if(!this.nextSeg) { // current seg is the last seg, start over again
        this.currentSeg = {line: 0, seg: 0}; //start over again
        this.done = false;
      } else {
        this.previousSeg = this.currentSeg;
        this.currentSeg = this.nextSeg;
      }
      var currentLine = this.segTimingLines[this.currentSeg.line];  // current line segments
      if(this.currentSeg.seg == currentLine.length-1) { // last seg in the line, move to next line
        if(this.currentSeg.line == this.segTimingLines.length-1) {  // last line, end of playing
          clearTimeout(this.timeout);
          this.nextSeg = null;
          this.highlightSeg();
          this.done = true;  // done playing
          return;
        } else {
          this.nextSeg = {line: this.currentSeg.line+1, seg: 0};
        }
      } else {  // move to next seg of the line
        this.nextSeg = {line: this.currentSeg.line, seg: this.currentSeg.seg+1};
      }
      this.highlightSeg();
      // Set window timeout to allow playing next seg after difference between current and next timing amount of time
      var currentTiming = currentLine[this.currentSeg.seg].timing;
      var nextLine = this.segTimingLines[this.nextSeg.line];
      var nextTiming = nextLine?nextLine[this.nextSeg.seg].timing:currentTiming;
      var player = this;  // create object of the player to be sent to the timeout
      this.timeout = setTimeout(function(){player.playText();}, (nextTiming-currentTiming)*1000);
    }
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
  * Highlight the current seg.
  * Put the segment in <span>, set to uppercase and add background color.
  */
  highlightSeg: function() {
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
    spanNode = $("<span class='highlighted'>" + currentSeg + "</span>");
    currentNode.childNodes[0].nodeValue = before;
    spanNode.insertAfter(currentNode.childNodes[0]);
    $(document.createTextNode(after)).insertAfter(spanNode); // Create text node to contain the text string after the span

    this.sourceText = this.text(); // update the source text with the text in play
  },

  /**
  * Unhighlight segment, default segment is the current.
  */
  unhighlightSeg: function() {
    if($('.highlighted').length != 0) { // If there is a highlighted segment
      var seg = this.currentSeg;
      var currentNode = this.element.childNodes[this.getCurrentTextNode()];
      var spanNode = $('.highlighted')[0];
      var preVal = spanNode.previousSibling?spanNode.previousSibling.nodeValue:"";
      var afterVal = spanNode.nextSibling?spanNode.nextSibling.nodeValue:"";
      var segVal = this.segTimingLines[seg.line][seg.seg].seg;
      $('.highlighted').remove();
      currentNode.innerText = preVal + segVal + afterVal;
    }
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
    return $('.highlighted').length > 0;
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
    this.done = false;
  }
});