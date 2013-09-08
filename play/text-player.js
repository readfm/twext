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
    this.audioTimeout = 0;
    this.doneTapTiming = false;  // boolean detects if all segs has been tapped
    this.endTiming = 1; // the number of seconds for the last seg to be highlighted before start over again "Loop"
    this.date = null;  // The date of the last tap, used to calculate number of seconds between taps that equals to difference between current tap and previous tap times
    this.playing = false;
  },

  /**
  * Play text and audio previously recorded.
  */
  play: function() {
    this.playing = true;
    var text = this.text();
    var isNewText = this.sourceText == null || this.sourceText != text;
    if(isNewText) {
      this.resetSegments();
      twextRecorder.clearAudio();
      this.createSegTiming(text); // create array of segments and timings per each Text line, this method will recall playText
      return;
    }

    if(videoPlayer.videoSet()) {
      videoPlayer.playVideo(true);
      //videoPlayer.loop();
    } else twextRecorder.playAudio();

    if(!this.currentSeg) {
      var currentTiming = parseFloat(this.segTimingLines[0][0].timing);  // current seg timing
      var segTimeout = currentTiming;
      if(videoPlayer.videoSet() && videoPlayer.from < currentTiming) segTimeout = round(currentTiming - videoPlayer.from)/videoPlayer.playbackRate;
      console.log("FIRST TIMEOUT: "+segTimeout);
      this.timeout = setTimeout(function(){player.playText();}, segTimeout*1000);
    } else {
      this.playText();
    }
  },

  /**
  * Animate text segments according to timings.
  * @param 'text' the Text lines only
  */
  playText: function() {
    if(this.currentSeg && this.currentSeg.line == 0 && this.currentSeg.seg == 0) game.tappedSegs = [];
    game.checkIfMissedSeg(this.currentSeg);console.log("MISSED: "+game.missedSegs);
    if(game.isOn() && game.missedSegs < 3) {
      if(game.segState == "cue") {
        this.setCurrentSeg();
        this.setNextSeg();
        game.segState = "cuePlay";
      } else {
        segSpan = this.currentSeg?$('#'+this.currentSeg.line+""+this.currentSeg.seg):null;
        if(segSpan && segSpan.attr("class") == "play") this.unhighlightSeg(); // unhighlight old seg
        this.setCurrentSeg();
        this.setNextSeg();
        // change tapped seg class to good because Master seg can't be showed with Play seg
        if(game.segState == "master" && (this.currentSeg.line != game.currentSeg.line || this.currentSeg.seg != game.currentSeg.seg)) {
          $('#'+game.currentSeg.line+""+game.currentSeg.seg).removeClass("master");
          $('#'+game.currentSeg.line+""+game.currentSeg.seg).addClass("good");
          game.segState = "good";
        }
        //if(game.segState != "cue") {
        segSpan = $('#'+this.currentSeg.line+""+this.currentSeg.seg);
        if(!segSpan || segSpan.attr("class") != "master") {
          this.unhighlightSeg(); // unhighlight new seg. to rehighlight it with different class
          this.highlightSeg(null, "play");
        }
        //var t = setTimeout(function(){game.checkIfMissedSeg(player.currentSeg);}, game.outOfRangeTiming*1000);
        //game.timeouts[this.currentSeg.line+""+this.currentSeg.seg] = t;
        //}
      }
    } else {
      if(game.missedSegs >= 3) {
        game.showScore();
        this.unhighlightSeg(game.tappedSegs[game.tappedSegs.length-1]);
      }
      game.reset();
      this.unhighlightSeg(); // unhighlight current seg
      this.setCurrentSeg();
      this.setNextSeg();
      this.highlightSeg();
      // Display current seg timing
      var currentTiming = floatToStr(this.segTimingLines[this.currentSeg.line][this.currentSeg.seg].timing);
      game.setSegTimeLabel(currentTiming, "timeFade");
      game.showSegTimeLabel();
    }
    //game.showFeedback();  //@TODO

    var lastSeg = this.isLastSeg();
    var segTimeout = player.calculateSegTimeout(lastSeg)/videoPlayer.playbackRate;
    if(lastSeg) {
      // loop audio/video
      this.audioTimeout = setTimeout(function(){player.playMedia();}, segTimeout*1000);
    }
    // Set window timeout to allow playing next seg after difference between current and next timing amount of time
    this.timeout = setTimeout(function(){player.playText();}, segTimeout*1000);
    //}
  },

  getCurrentSeg: function() {
    return this.currentSeg;
  },

  getNextSeg: function(segment) {
    if(!segment) return this.nextSeg;
    var nextSeg = null;
    var currentLine = this.segTimingLines[segment.line];  // current line segments
    if(segment.seg == currentLine.length-1) { // last seg in the line, move to next line
      if(segment.line == this.segTimingLines.length-1) {  // last line
        nextSeg = {line: 0, seg: 0}; // start loop, move to first seg again
      } else {
        nextSeg = {line: segment.line+1, seg: 0};
      }
    } else {  // move to next seg of the line
      nextSeg = {line: segment.line, seg: segment.seg+1};
    }
    return nextSeg;
  },

  getNextSegTiming: function(segment) {
    var nextSeg = this.getNextSeg(segment);
    return this.segTimingLines[nextSeg.line][nextSeg.seg].timing;
  },

  restartPlay: function() {
    this.resetSegments();
    clearTimeout(this.audioTimeout);
    clearTimeout(videoPlayer.playTimeout);
    clearTimeout(videoPlayer.pauseTimeout);
    this.play();
  },

  playMedia: function() {
    if(!videoPlayer.videoSet()) {
      var nextTiming = parseFloat(this.segTimingLines[this.nextSeg.line][this.nextSeg.seg].timing);  // next seg timing
      twextRecorder.seekAudio(nextTiming);
      twextRecorder.playAudio();
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
    this.nextSeg = this.getNextSeg(this.currentSeg);
    /*var currentLine = this.segTimingLines[this.currentSeg.line];  // current line segments
    if(this.currentSeg.seg == currentLine.length-1) { // last seg in the line, move to next line
      if(this.currentSeg.line == this.segTimingLines.length-1) {  // last line
        this.nextSeg = {line: 0, seg: 0}; // start loop, move to first seg again
      } else {
        this.nextSeg = {line: this.currentSeg.line+1, seg: 0};
      }
    } else {  // move to next seg of the line
      this.nextSeg = {line: this.currentSeg.line, seg: this.currentSeg.seg+1};
    }*/
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
    if(lastSeg) {
      if(videoPlayer.videoSet()) {
        return round(videoPlayer.to - currentTiming + nextTiming - videoPlayer.from);
      } else if(twextRecorder.audioDuration() != -1) {
        return round(twextRecorder.audioDuration() - currentTiming + nextTiming);
      } else {
        return this.endTiming + nextTiming;
      }
      //return currentTiming + this.endTiming - nextTiming;
    }
    //if not last seg,the seg remains highlighted for a period equals to difference between next and current timing
    return nextTiming-currentTiming;
  },

  /**
  * Pause text animation.
  */
  pauseText: function() {
    this.playing = false;
    this.unhighlightSeg();
    clearTimeout(this.timeout);
    clearTimeout(this.audioTimeout);
    twextRecorder.pauseAudio();
    videoPlayer.pauseVideo();
    if(this.nextSeg) {
      var nextTiming = parseFloat(this.segTimingLines[this.nextSeg.line][this.nextSeg.seg].timing);
      twextRecorder.seekAudio(nextTiming);
      videoPlayer.setStartTime(nextTiming);
    }
    game.reset();
    game.resetFeedback();
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
      
      // Firefox doesn't support innerText
      if (this.element.innerText == undefined)
      	text = this.element.textContent;
      else	// for other browsers
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
    //clearTimeout(this.timeout);
    this.pauseText();
    this.doneTapTiming = false;

    // Highlight first seg
    //this.unhighlightSeg();
    this.previousSeg = null;
    this.currentSeg = {line: 0, seg: 0};
    this.setNextSeg();
    this.highlightSeg(null, "recordingHighlighted");
    videoPlayer.setStartTime(videoPlayer.from);
    videoPlayer.playVideo();
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
      // Move from recording state to timer state
      this.unhighlightSeg();
      this.highlightSeg(null, "timerHighlighted");
    } else {
      // move to next seg
      this.unhighlightSeg();
      this.setCurrentSeg();
      this.setNextSeg();
      this.highlightSeg(null, "timerHighlighted");

      // Get previous seg timing
      previousLine = this.segTimingLines[this.previousSeg.line];  // current line segments
      previousTiming = parseFloat(previousLine[this.previousSeg.seg].timing);  // current seg timing
    }

    // calculate new timing for next seg
    var newTiming = videoPlayer.videoSet()?videoPlayer.currentTime():(previousTiming + secs);
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
      player.highlightSeg(null, "timerHighlighted");  // rehighlight current seg
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
  highlightSeg: function(seg, clazz) {
    var clss = clazz?clazz:"playHighlighted";
    var segment = seg?seg:this.currentSeg;

    if(this.segTimingLines.length == 0) return; // No segments/timings generated yet

    var currentSeg = this.segTimingLines[segment.line][segment.seg].seg;
    var currentSegIx = this.segIndices[segment.line][segment.seg];
    var nodeIx = this.getCurrentTextNode(segment);
    var currentNode = this.element.childNodes[nodeIx];
    //var nodeVal = currentNode.innerText;

    var i, index = 0;
    var before, after, spanNode, nodeVal, beforeNode = null, afterNode = null;
    for(i=0; i<currentNode.childNodes.length; i++) { // node will have multiple childnodes if there is another word highlighted "span"
      index += currentNode.childNodes[i].textContent.length;
      if(currentSegIx < index) { // update this node
        // highlight the new seg
        nodeVal = currentNode.childNodes[i].textContent;
        newSegIx = currentSegIx - (index - currentNode.childNodes[i].length);
        before = nodeVal.substring(0, newSegIx);
        after = nodeVal.slice(newSegIx+currentSeg.length);
        spanNode = $("<span id='"+segment.line+""+segment.seg+"' "+"class='" + clss + "'>" + currentSeg + "</span>");
        currentNode.childNodes[i].nodeValue = " ";
        spanNode.insertAfter(currentNode.childNodes[i]);
        currentNode.childNodes[i].remove();
        
        if(currentNode.childNodes[i-1] && currentNode.childNodes[i-1] == "#text") {
          currentNode.childNodes[i-1].nodeValue += before;
          //spanNode.insertAfter(currentNode.childNodes[i-1]);
          //currentNode.childNodes[i].remove();
        } else {
          beforeNode = $(document.createTextNode(before));
          //spanNode.insertAfter(currentNode.childNodes[i]);
        }
        if(currentNode.childNodes[i+1] && currentNode.childNodes[i+1] == "#text") {
          currentNode.childNodes[i+1].nodeValue = after + currentNode.childNodes[i+1].nodeValue;
        } else {
          afterNode = $(document.createTextNode(after)); // Create text node to contain the text string after the span
        }
        if(beforeNode) beforeNode.insertBefore(spanNode);
        if(afterNode) afterNode.insertAfter(spanNode);
        //$(document.createTextNode(after)).insertAfter(spanNode); // Create text node to contain the text string after the span
        break;
      }
    }
    this.sourceText = this.text(); // update the source text with the text in play
  },

  /**
  * Unhighlight segment, default segment is the current.
  */
  unhighlightSeg: function(seg) {
    var segVal;
    var segment = seg?seg:this.currentSeg;
    if(!segment) return;
    var currentNode = this.element.childNodes[this.getCurrentTextNode(segment)];
    var spanNode = $("#"+segment.line+""+segment.seg)[0];
    if(spanNode) {
      if(spanNode.previousSibling && spanNode.previousSibling.nodeName == "#text" && spanNode.nextSibling && spanNode.nextSibling.nodeName == "#text") {
        segVal = this.segTimingLines[segment.line][segment.seg].seg;
        spanNode.previousSibling.nodeValue += segVal + spanNode.nextSibling.nodeValue;
        spanNode.nextSibling.remove();
        $("#"+segment.line+""+segment.seg).remove();
      } else if(spanNode.previousSibling && spanNode.previousSibling.nodeName == "#text") {
        segVal = this.segTimingLines[segment.line][segment.seg].seg;
        spanNode.previousSibling.nodeValue += segVal;
        $("#"+segment.line+""+segment.seg).remove();
        //currentNode.innerText = preVal + segVal + afterVal;
      } else if(spanNode.nextSibling && spanNode.nextSibling.nodeName == "#text") {
        segVal = this.segTimingLines[segment.line][segment.seg].seg;
        spanNode.nextSibling.nodeValue += segVal;
        $("#"+segment.line+""+segment.seg).remove();
      } else {
        segVal = this.segTimingLines[segment.line][segment.seg].seg;
        $(document.createTextNode(segVal)).insertAfter(spanNode); // Create text node to contain the text string after the span
        $("#"+segment.line+""+segment.seg).remove();
      }
      //var preVal = spanNode.previousSibling?spanNode.previousSibling.nodeValue:"";
      //var afterVal = spanNode.nextSibling?spanNode.nextSibling.nodeValue:"";
      //var segVal = this.segTimingLines[segment.line][segment.seg].seg;
      //$("#"+segment.line+""+segment.seg).remove();
      //currentNode.innerText = preVal + segVal + afterVal;
      this.sourceText = this.text(); // update the source text with the text in play
    }
  },

  /**
  * Get the current Text node number. (this should be altered if multiple versions are displayed)
  * If the mode is text only, then the seg line number is the same as the displayed Text line number.
  * If the mode is timing or twext, then the displayed Text line number is the seg line number multiplied by 2, to count twext/timing lines.
  * @return current Text node index
  */
  getCurrentTextNode: function(seg) {
    var segment = seg?seg:this.currentSeg;
    if(this.displayMode == "text")  return segment.line;
    else if(this.displayMode == "twext" || this.displayMode == "timing")  return segment.line*2;
    return -1;
  },

  /**
  * Create object contains segments and their timing slots.
  * Index of the array represents Text line number; each entry is an array(index is seg number) of key/value objects contains seg value, seg position and timing slot.
  */
  createSegTiming: function(text) {
    var segTiming = [], i, j, k, wSegs, timings;
    //var player = this;
    var syllabifier = this.syllabifier;
    var timingCrt = this.timingCreator;
    this.syllabifier.syllabifyText(text, function(hText) {
      timingCrt.getSegTiming(text, hText, function(timingLines) {
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
        player.sourceText = text;
        player.play(); // recall of play after getting segs and timings
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
    //return $('.playHighlighted').length > 0;
    return this.playing;
  },

  /**
  * Check if there is a highlighted segment displayed in timer mode.
  * @return boolean detects if the current segment is highlighted in timer mode
  */
  isTapTiming: function() {
    return $('.timerHighlighted').length > 0 || $('.recordingHighlighted').length > 0;
  },

  /**
  * Reset segments.
  */
  resetSegments: function() {
    this.unhighlightSeg(); // unhighlight current seg
    this.previousSeg = null;
    this.currentSeg = null;
    this.nextSeg = null;
    clearTimeout(this.timeout);
  },

  /**
  * Reset player.
  */
  reset: function() {
    this.pauseText();
    //this.unhighlightSeg();
    this.displayMode = null;
    this.resetSegments();
    this.sourceText = null;
    this.segTimingLines = [];
    this.segIndices = [];
    //this.done = false;
  }
});