/**
* SpanAligner class.
* Span aligner is a tool for pair words aligning operation (text/twext, text/timing, word/cursor...) using <span> tags.
* The main concept of span aligner is to put text/twext (or any pair) words in span tags and compare their left positions to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
* n refers to the Twext(small size) word, N refers to the Text(big size) word, n:N pair represents the twext/text words to be aligned.
* @author Wafaa
*/
SpanAligner = Class.$extend({

  /**
  * Initilize class variables (classy.js is used for class creation)
  */
	__init__: function(){
    return this;  // return instance of spanAligner
  },

  /**
  * Align all pair rows of the input element.
  * @param: 'textEl' the contenteditable <div> input element.
  */
  align: function(textEl) {
    var i;
    $(textEl).html(nbsp_to_spaces($(textEl).html()));  // convert nbsp to text spaces
    // Loop on element child nodes which represent the lines pairs, increment i by 2 to move through text/twext lines pair.
    for(i=0; i<textEl.childNodes.length; i=i+2) {
      if(textEl.childNodes[i].innerHTML == '<br>' || textEl.childNodes[i].className == "line-break") {  // If empty line, then skip it
        i--;  // only one line to skip, need to update the counter to move one step not two
        continue;
      }
      if(textEl.childNodes[i+1].className == 'timing') { // if second line is timing
        this.alignTimings(textEl, i, i+1);  // align timings with words
      }
    }
  },

  /**
  * Align timing slots of text segments with text line words. timing slot is aligned with words not segs
  * @param: 'textEl' the contenteditable element
            'textLine' the Text line number
            'timingLine' the Timing line number
  */
  alignTimings: function(textEl, textLine, timingLine) {
    var i, segLength = 0, timingIx = 0;
    // Clean and unalign Text/Timing nodes; get rid of html characters and remove any extra spaces
    this.unalignNode(textEl, textLine);
    this.unalignNode(textEl, timingLine);
    // Get Text node
    var textNode = textEl.childNodes[textLine];
    // Get Text words
    var textWords = strWords(textNode.textContent);
    for(i=1; i<textWords.length; i++) { // loop on Text words, start with second word, first word already aligned
      segLength = textWords[i-1].split('-').clean().length; // get previous word seg count to know the next timing to be aligned
      timingIx += segLength; // accumulate seg count
      this.alignTiming(textEl, textLine, timingLine, i, timingIx); // align Text/Timing pair
    }
  },

  /**
  * Align Timing slot to Text word.
  * Put words in <span> and compare their left position to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
  * @param: 'textEl' the input div element
            'textLine' the Text line number
            'timingLine' the Timing line number
            'N' text word index; starts with index 0
            'n' timing slot index; starts with index 0
  */
  alignTiming: function(textEl, textLine, timingLine, N, n) {
    var spanIx;
    var realign = false; // realign this pair to move Timing word a little bit util aligned to Text word if text word moved further
    // Get Text/Timing nodes
    var textNode = textEl.childNodes[textLine];
    var timingNode = textEl.childNodes[timingLine];
    // Get Text/Timing nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = textNode.textContent;
    var timingVal = timingNode.textContent.replace(/\./g, '-'); // temporarily replace . by - to consider timing slot as one word ('-' considered as part of word but '.' not)
    // Get Text/Timing lines' words
    var textWords = strWords(textVal);
    var timingWords = strWords(timingVal);
    // Get Text/Timing lines' words indices
    var textWordsIndices = strWordsIndices(textVal);
    var timingWordsIndices = strWordsIndices(timingVal);

    if(n >= timingWords.length || N >= textWords.length) return;  // invalid Text/Timing word index

    var textWord = textWords[N];  // Text word
    var timingWord = timingWords[n].replace(/\-/g, '.');  // Timing word, get the original word with the '.'
    // Put Text/Timing words in span tag
    var textId = SpanUtils.putWordInSpan(textNode, textWordsIndices[N], textWord, "textWord"); // put text word in span
    var timingId = SpanUtils.putWordInSpan(timingNode, timingWordsIndices[n], timingWord, "timingWord"); // put timing slot in span
    // Get words left position
    var NPos = parseInt($('#'+textId).position().left);  // left position of Text word
    var nPos = parseInt($('#'+timingId).position().left);  // left position of Timing slot
    if(NPos < nPos) { // Text word has less position, move it to Timing word
      //parentEl = textNode.parentElement;
      while(NPos < nPos) {  // add spaces before Text word till it's aligned with timing(reach its position)
        /*spanIx = textNode.innerHTML.indexOf('<span');
        // Add space before word
        textNode.innerHTML = textNode.innerHTML.substring(0, spanIx) + "&nbsp;" + textNode.innerHTML.slice(spanIx);*/
        $('#'+textId)[0].outerHTML = "&nbsp;" + $('#'+textId)[0].outerHTML;
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#'+textId).position().left);
        nPos = parseInt($('#'+timingId).position().left);
      }
      // Check if Text word is moved after Timing word a little bit; This may occur because the Text font size is usually bigger than timing, so 1 space of Text may equal to more than one space of Timing.
      if(NPos > nPos) {
        realign = true; // realign later after removing spans
      }
    } else if(NPos > nPos) {  // Timing word has less position, move it to Text word
      //parentEl = timingNode.parentElement;
      while(NPos > nPos) {  // add spaces before Timing slot till it's aligned with Text word(reach its position)
        /*spanIx = timingNode.innerHTML.indexOf('<span');
        // Add space before word
        timingNode.innerHTML = timingNode.innerHTML.substring(0, spanIx) + "&nbsp;" + timingNode.innerHTML.slice(spanIx);*/
        $('#'+timingId)[0].outerHTML = "&nbsp;" + $('#'+timingId)[0].outerHTML;
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#'+textId).position().left);
        nPos = parseInt($('#'+timingId).position().left);
      }
    } else {  // Positions are equal; Text and Twext words are already aligned, move twext one space to create a chunk 'bump align'
      /*spanIx = timingNode.innerHTML.indexOf('<span');
      // Add space before Twext word
      timingNode.innerHTML = timingNode.innerHTML.substring(0, spanIx) + "&nbsp;" + timingNode.innerHTML.slice(spanIx);*/
      $('#'+timingId)[0].outerHTML = "&nbsp;" + $('#'+timingId)[0].outerHTML;
    }
    // Remove created span tags from Text node
    SpanUtils.removeSpanNode("textWord");
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode("timingWord");
    if(realign) this.alignTiming(textEl, textLine, timingLine, N, n); //realign this pair to move Timing word a little bit till aligned to Text word
  },

  /**
  * Clean node and remove any extra spaces added for alignment.
  * Loop on node childNodes and clean each, this is for considering span nodes existance.
  * @param: 'textEl' the input div element (textEl[0]).
            'line' line number (child node number)
  */
  unalignNode: function(textEl, line) {
    var node = textEl.childNodes[line];
    for(i=0; i<node.childNodes.length; i++) {
      node.childNodes[i].textContent = nbsp_to_spaces(node.childNodes[i].textContent).replace(/\ +/g, ' ');
    }
  }
});