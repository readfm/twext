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
  * nNs used only if text/twext align.
  * @param: 'textEl' the contenteditable <div> input element.
            'nNs' array of key/value obj contains nNs pairs for text/twext rows.key is Text line ix(0,2,4..),value is nN array '["1:1","2:2",...]'
  */
  align: function(textEl, nNs) {
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
      } else {  // if second line is twext
        this.alignChunks(textEl, i, i+1, nNs[i]?nNs[i]:[]); // Align chunks of the given text/twext line pair.
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
  * Align chunks of text/twext lines pair.
  * @param: 'textEl' the contenteditable element
            'textLine' the Text line number
            'twextLine' the Twext line number
            'nN' an array contains the n:N pairs ["1:1", "2:2",....]
  */
  alignChunks: function(textEl, textLine, twextLine, nN) {
    var i, tmp, n, N;
    // Clean and unalign Text/Twext nodes; get rid of html characters and remove any extra spaces
    this.unalignNode(textEl, textLine);
    this.unalignNode(textEl, twextLine);
    // Loop over nN array which represent the chunks of text/twext lines to be aligned
    for(i=0; i<nN.length; i++) {
      tmp = nN[i].split(":");
      n = parseInt(tmp[0]) - 1; // Twext word number, start with index 0
      N = parseInt(tmp[1]) - 1; // Text word number, start with index 0
      this.alignChunk(textEl, textLine, twextLine, N, n); // Align given chunk (n:N pair) of the text/twext lines
    }
  },

  /**
  * Align Twext word n to Text word N.
  * Put words in <span> and compare their left position to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
  * @param: 'textEl' the input div element (textEl[0]).
            'textLine' the Text line number
            'twextLine' the Twext line number
            'N' text word index; starts with index 0
            'n' twext word index; starts with index 0
  */
  alignChunk: function(textEl, textLine, twextLine, N, n) {
    var spanIx;
    var realign = false;  // realign this pair to move Twext word a little bit util aligned to Text word if text word moved further
    // Get Text/Twext nodes
    var textNode = textEl.childNodes[textLine];
    var twextNode = textEl.childNodes[twextLine];
    // Get Text/Twext nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = textNode.textContent;
    var twextVal = twextNode.textContent;
    // Get Text/Twext lines' words
    var textWords = strWords(textVal);
    var twextWords = strWords(twextVal);
    // Get Text/Twext lines' words indices
    var textWordsIndices = strWordsIndices(textVal);
    var twextWordsIndices = strWordsIndices(twextVal);

    if(n >= twextWords.length || N >= textWords.length) return; // invalid Text/Twext word index

    // Put Text/Twext words in span tag
    var textId = SpanUtils.putWordInSpan(textNode, textWordsIndices[N], textWords[N], "textWord");
    var twextId = SpanUtils.putWordInSpan(twextNode, twextWordsIndices[n], twextWords[n], "twextWord");
    // Get words left position
    var NPos = parseInt($('#'+textId).position().left);
    var nPos = parseInt($('#'+twextId).position().left);
    if(NPos < nPos) { // Text word has less position, move it to Twext word
      //parentEl = textNode.parentElement;
      while(NPos < nPos) {  // add spaces before Text word till it's aligned with twext(reach its position)
        /*spanIx = textNode.innerHTML.indexOf('<span');
        // Add space before word
        textNode.innerHTML = textNode.innerHTML.substring(0, spanIx) + "&nbsp;" + textNode.innerHTML.slice(spanIx);*/
        $('#'+textId)[0].outerHTML = "&nbsp;" + $('#'+textId)[0].outerHTML;
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#'+textId).position().left);
        nPos = parseInt($('#'+twextId).position().left);
      }
      // Check if Text word is moved after Twext word a little bit; This may occur because the Text font size is usually bigger than twext, so 1 space of Text may equal to more than one space of Twext.
      if(NPos > nPos) {
        realign = true; // realign later after removing spans
      }
    } else if(NPos > nPos) {  // Twext word has less position, move it to Text word
      //parentEl = twextNode.parentElement;
      while(NPos > nPos) {
        /*spanIx = twextNode.innerHTML.indexOf('<span');
        // Add space before word
        twextNode.innerHTML = twextNode.innerHTML.substring(0, spanIx) + "&nbsp;" + twextNode.innerHTML.slice(spanIx);*/
        $('#'+twextId)[0].outerHTML = "&nbsp;" + $('#'+twextId)[0].outerHTML;
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#'+textId).position().left);
        nPos = parseInt($('#'+twextId).position().left);
      }
    } else {  // Positions are equal; Text and Twext words are already aligned, move twext one space to create a chunk 'bump align'
      /*spanIx = twextNode.innerHTML.indexOf('<span');
      // Add space before Twext word
      twextNode.innerHTML = twextNode.innerHTML.substring(0, spanIx) + "&nbsp;" + twextNode.innerHTML.slice(spanIx);*/
      $('#'+twextId)[0].outerHTML = "&nbsp;" + $('#'+twextId)[0].outerHTML;
    }
    // Remove span tag from Text node
    SpanUtils.removeSpanNode("textWord");
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode("twextWord");
    if(realign) this.alignChunk(textEl, textLine, twextLine, N, n); // realign this pair to move Twext word a little bit util aligned to Text word
  },

  /**
  * Align cursor to Text or Twext word; Move cursor positioned at the end of Text line to the next/previous Twext word, cursor positioned at the end of Twext line to the next/previous Text word.
  * Detect the cursor pos line(text or twext), Put word and cursor pos in <span> tags and compare their left position to detect the direction of cursor move.
  * If the cursor preceding the word, then move cursor forward; else move backward. 
  * @param: 'textEl' the contenteditable element
            'textLine' the text line number
            'twextLine' the twext line number
            'N' text word index, used if cursor positioned in twext line and should be pushed/pulled to Text word; starts with index 0
            'n' twext word index, used if cursor positioned in text line and should be pushed/pulled to Twext word; starts with index 0
            'cursorPos' the cursor position
  */
  alignCursor: function(textEl, textLine, twextLine, N, n, cursorPos) {
    var nWordIndex, NWordIndex, nWord = "", NWord = "", html = "", spanIndex;
    // Get Text/Twext nodes
    var textNode = textEl.childNodes[textLine];
    var twextNode = textEl.childNodes[twextLine];
    // Get Text/Twext nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = textNode.textContent;
    var twextVal = twextNode.textContent;
    // Get Text/Twext lines' words
    var textWords = strWords(textVal);
    var twextWords = strWords(twextVal);
    // Get Text/Twext lines' words indices
    var textWordsIndices = strWordsIndices(textVal);
    var twextWordsIndices = strWordsIndices(twextVal);
    // nIsLast: detect if the cursor is at the end of Twext line; NIsLast: detect is the cursor is at the end of Text line
    var nIsLast = false, NIsLast = false;
    var textEndIx = textWordsIndices[textWordsIndices.length-1]+textWords[textWords.length-1].length; // last word start index+last word length
    var twextEndIx = twextWordsIndices[twextWordsIndices.length-1]+twextWords[twextWords.length-1].length; // last word start index+last word length
    if(N && cursorPos >= twextEndIx) {  // cursor positioned at the end of the Twext line
      nWordIndex = cursorPos; // the Twext word is where the cursor positioned
      NWordIndex = textWordsIndices[N];
      NWord = textWords[N]; // and nWord is empty because it represents the cursor position
      nIsLast = true;
    } else if(n && cursorPos >= textEndIx) {  // cursor positioned at the end of the Text line
      NWordIndex = cursorPos; // the Text word is where the cursor positioned
      nWordIndex = twextWordsIndices[n];
      nWord = twextWords[n];  // and NWord is empty because it represents the cursor position
      NIsLast = true;
    } else {  // invalid operation
      return;
    }
    // Put Text/Twext words in span tag
    var textId = SpanUtils.putWordInSpan(textNode, NWordIndex, NWord, "textWord");
    var twextId = SpanUtils.putWordInSpan(twextNode, nWordIndex, nWord, "twextWord");
    // Get words left position
    NPos = parseInt($('#'+textId).position().left);
    nPos = parseInt($('#'+twextId).position().left);
    if(nIsLast) { // Cursor positioned at the end of Twext line, move it
      //parentEl = twextNode.parentElement;
      if(NPos < nPos) { // cursor is positioned after the N word, move cursor backward by deleting spaces before cursor.
        while(NPos < nPos) {
          // Convert the html to text by replacing the nbsp by text space to check on the char before span wether it is a space or not
          html = nbsp_to_spaces(twextNode.innerHTML);
          spanIndex = html.indexOf('<span');  // Get the span index
          // If the char to delete is not a space, then ignore
          if(!/\s/.test(html.charAt(spanIndex-1)))  break;
          // Remove a space before cursor, and convert the text back to html
          twextNode.innerHTML = spaces_to_nbsp(html.substring(0, spanIndex-1) + html.slice(spanIndex));
          // Get the positions again after removing the space to recompare
          NPos = parseInt($('#'+textId).position().left);
          nPos = parseInt($('#'+twextId).position().left);
        }
      } else if(NPos > nPos) {  // N word is a next word to the cursor, move cursor forward
        while(NPos > nPos) {
          html = twextNode.innerHTML;
          spanIndex = html.indexOf('<span');    // Get the span index
          // Add a space before cursor
          twextNode.innerHTML = html.substring(0, spanIndex) + "&nbsp;" + html.slice(spanIndex);
          // Get the positions again after adding the space to recompare
          NPos = parseInt($('#'+textId).position().left);
          nPos = parseInt($('#'+twextId).position().left);
        }
      }
    } else if(NIsLast) {  // Cursor in text line, move it
      //parentEl = textNode.parentElement;
      if(NPos < nPos) { // n word is a next word to the cursor, move cursor forward
        while(NPos < nPos) {
          html = textNode.innerHTML;
          spanIndex = html.indexOf('<span');  // Get the span index
          // Add a space before cursor
          textNode.innerHTML = html.substring(0, spanIndex) + "&nbsp;" + html.slice(spanIndex);
          // Get the positions again after adding the space to recompare
          NPos = parseInt($('#'+textId).position().left);
          nPos = parseInt($('#'+twextId).position().left);
        }
      } else if(NPos > nPos) {  // n word is a previous word to the cursor, move cursor backward
        while(NPos > nPos) {
          // Convert the html to text by replacing the nbsp by text space to check on the char before span wether it is a space or not
          html = nbsp_to_spaces(textNode.innerHTML);
          spanIndex = html.indexOf('<span');  // Get the span index
          // If the char to delete is not a space, then ignore
          if(!/\s/.test(html.charAt(spanIndex-1)))  break;
          // Remove a space before cursor
          textNode.innerHTML = spaces_to_nbsp(html.substring(0, spanIndex-1) + html.slice(spanIndex));
          // Get the positions again after removing the space to recompare
          NPos = parseInt($('#'+textId).position().left);
          nPos = parseInt($('#'+twextId).position().left);
        }
      }
    }
    // Remove span tag from Text node
    SpanUtils.removeSpanNode("textWord");
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode("twextWord");
    // Return the current cursor position
    if(nIsLast) return textEl.childNodes[twextLine].textContent.length;
    if(NIsLast) return textEl.childNodes[textLine].textContent.length;
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
  },

  /**
  * Get the next word in the reference line to be aligned with the current word in the current line; if the current word is in Text line, then the reference line is Twext line; if the current word is in Twext line, then the reference line is Text line.
  * Put the current word in <span> and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the current word postion, return the word index if its position is greater than the current word position.
  * @param: 'el' the input <div> element
            'currentLine' the line index contains the current word
            'refLine' the reference line index contains the next word to be found
            'wordNumber' the current word number; word number starts with index 0
  */
  nextWord: function(el, currentLine, refLine, wordNumber) {
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine];
    var refNode = el.childNodes[refLine];
    // Get current and reference nodes' values
    var currentValue = currentNode.textContent;
    var refValue = refNode.textContent;
    // Get current words and positions
    var currentWords = strWords(currentValue);
    var currentWordsPos = strWordsIndices(currentValue);
    // Get reference words and positions
    var refWords = strWords(refValue);
    var refWordsPos = strWordsIndices(refValue);

    // Put current word in <span>, get its left position and remove the span tag
    var currentWordId = SpanUtils.putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "currentWord");
    var currentWordPos = parseInt($('#'+currentWordId).position().left);
    SpanUtils.removeSpanNode("currentWord");
    // Loop over reference words to look for the word with position greater than the current word position
    var i, refWordpos, refWordId;
    for(i=0; i<refWordsPos.length; i++) {
      refWordId = SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "refWord");  // Put word on <span>
      refWordPos = parseInt($('#'+refWordId).position().left);  // Get word left position
      SpanUtils.removeSpanNode("refWord");  // remove span tag
      if(refWordPos > currentWordPos) return i; // return reference word index if its position is greater than current word potition
    }
    return -1;  // return -1 if no next word found
  },

  /**
  * Get the next word in the reference line to be aligned with the cursor in the current line; if the cursor is in Text line, then the reference line is Twext line; if the cursor is in Twext line, then the reference line is Text line.
  * Create <span> where the cursor is positioned and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the cursor span postion, return the word index if its position is greater than the cursor span position.
  * @param: 'el' the input div element (textEl[0]).
            'currentLine' the line index where the cursor is positioned (start index is 0)
            'refLine' the reference line index contains the next word to be found (start index is 0)
            'cursorPos' the position of the cursor.
  * @return next word index (start index is 0)
  */
  nextWordToCursor: function(el, currentLine, refLine, cursorPos) {
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine];
    var refNode = el.childNodes[refLine];

    // Get reference node value, words and positions
    var refValue = refNode.textContent;
    var refWords = strWords(refValue);
    var refWordsPos = strWordsIndices(refValue);

    // Create <span> where the cursor is positioned, get its left position and remove the span tag
    var currentWordId = SpanUtils.putWordInSpan(currentNode, cursorPos, "", "currentWord");
    var currentWordPos = parseInt($('#'+currentWordId).position().left);
    SpanUtils.removeSpanNode("currentWord");
    // Loop over reference words to look for the word with position greater than the cursor span position
    var refWordPos, i, refWordId;
    for(i=0; i<refWordsPos.length; i++) {
      refWordId = SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "refWord");  // Put word on <span>
      refWordPos = parseInt($('#'+refWordId).position().left);  // Get word left position
      SpanUtils.removeSpanNode("refWord");  // remove span tag
      if(refWordPos > currentWordPos) return i; // return reference word index if its position is greater than cursor span potition
    }
    return -1;  // return -1 if no next word found
  },

  /**
  * Get the previous word in the reference line to be aligned with the current word in the current line; if the current word is in Text line, then the reference line is Twext line; if the current word is in Twext line, then the reference line is Text line.
  * Put the current word in <span> and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the current word postion, return the word index if its position is less than the current word position.
  * @param: 'el' the input div element
            'currentLine' the line number contains the current word
            'refLine' the reference line number contains the previous word to be found
            'wordNumber' the current word number; word number starts with index 0
  */
  previousWord: function(el, currentLine, refLine, wordNumber) {
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine];
    var refNode = el.childNodes[refLine];
    // Get current and reference nodes' values
    var currentValue = currentNode.textContent;
    var refValue = refNode.textContent;
    // Get current words and positions
    var currentWords = strWords(currentValue);
    var currentWordsPos = strWordsIndices(currentValue);
    // Get reference words and positions
    var refWords = strWords(refValue);
    var refWordsPos = strWordsIndices(refValue);
    // Put current word in <span>, get its left position and remove the span tag
    var currentWordId = SpanUtils.putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "currentWord");
    var currentWordPos = parseInt($('#'+currentWordId).position().left);
    SpanUtils.removeSpanNode("currentWord");
    // Loop over reference words to look for the word with position less than the current word position
    var i, refWordpos, refWordId;
    for(i=refWordsPos.length-1; i<refWordsPos.length; i--) {
      refWordId = SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "refWord");  // Put word on <span>
      refWordPos = parseInt($('#'+refWordId).position().left);  // Get word left position
      SpanUtils.removeSpanNode("refWord");  // remove span tag
      if(refWordPos < currentWordPos) return i; // return reference word index if its position is less than current word potition
    }
    return -1;   // return -1 if no previous word found
  },

  /**
  * Get the previous word in the reference line to be aligned with the cursor in the current line; if the cursor is in Text line, then the reference line is Twext line; if the cursor is in Twext line, then the reference line is Text line.
  * Create <span> where the cursor is positioned and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the cursor span postion, return the word index if its position is less than the cursor span position.
  * @param: 'el' the input div element
            'currentLine' the line number where the cursor is positioned
            'refLine' the reference line number contains the previous word to be found
            'cursorPos' the position of the cursor.
  */
  previousWordToCursor: function(el, currentLine, refLine, cursorPos) {
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine];
    var refNode = el.childNodes[refLine];

    // Get reference node value, words and positions
    var refValue = refNode.textContent;
    var refWords = strWords(refValue);
    var refWordsPos = strWordsIndices(refValue);

    // Create <span> where the cursor is positioned, get its left position and remove the span tag
    var currentWordId = SpanUtils.putWordInSpan(currentNode, cursorPos, "", "currentWord");
    var currentWordPos = parseInt($('#'+currentWordId).position().left);
    SpanUtils.removeSpanNode("currentWord");

    // Loop over reference words to look for the word with position less than the cursor span position
    var i, refWordPos, refWordId;
    for(i=refWordsPos.length-1; i<refWordsPos.length; i--) {
      refWordId = SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "refWord");  // Put word on <span>
      refWordPos = parseInt($('#'+refWordId).position().left);  // Get word left position
      SpanUtils.removeSpanNode("refWord");  // remove span tag
      if(refWordPos < currentWordPos) return i; // return reference word index if its position is less than cursor span potition
    }
    return -1;
  },

  /**
  * Get the position of the start of a word.
  * Put the word in <span>, get its left position, remove span tag, return the position.
  * @param: 'el' the input div element
            'line' the index of line
            'word' the word
            'wordIx' the word position
  */
  wordPos: function(el, line, word, wordIx) {
    var node = el.childNodes[line];
    // Put word in <span>, get its left position and remove the span tag
    var wordId = SpanUtils.putWordInSpan(node, wordIx, word, "word"); // put word in span
    var pos = parseInt($('#'+wordId).position().left); // get word left position
    SpanUtils.removeSpanNode("word"); // remove span tag
    return pos; // return position
  }
});