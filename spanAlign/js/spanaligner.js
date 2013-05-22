/**
  SpanAligner class.
  Span aligner is a tool to align chunks (text/twext words' pairs) using <span> tags.
  The main concept of span aligner is to put text/twext words in span tags and compare their left positions to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
  n refers to the Twext word, N refers to the Text word, n:N pair represents the twext/text words to be aligned.
  @author Wafaa
*/
var SpanAligner = Class({

  /**
    Initialize class attributes.
  */
  initialize: function() {
    return this;
  },

  /**
    Align all text/twext rows of the input element.
    Params: 'textEl' the contenteditable element.
            'nNs' array or key/value object contains nNs pairs for text/twext rows. key is Text line number, value is nN array '["1:1","2:2",...]'
  */
  align: function(textEl, nNs) {
    var i;
    textEl.html(cleanHtml(textEl.html()));  // Clean the element html, get rid of unnecessary whitespaces.
    // Loop over elements child nodes which represent the text/twext lines, increment i by 2 to move through text/twext lines pair.
    for(i=0; i<textEl[0].childNodes.length; i=i+2) {
      if(textEl[0].childNodes[i].innerHTML == '<br>' || textEl[0].childNodes[i].className == "line-break") {  // If empty line, then skip it
        i--;  // only one line to skip, need to update the counter to move one step not two
        continue;
      }
      if(textEl[0].childNodes[i+1].className == 'timing') { // if second line is timing
        this.alignTimings(textEl, i, i+1);  // align timings with words
      } else {  // if second line is twext
        this.alignChunks(textEl, i, i+1, nNs[i]?nNs[i]:[]); // Align chunks of the given text/twext line pair.
      }
    }
  },

  /**
    Align timing slots of text segments with text line words.
    Params: 'textEl' the contenteditable element
            'textLine' the Text line number
            'timingLine' the Timing line number
  */
  alignTimings: function(textEl, textLine, timingLine) {
    var i, segLength = 0, timingIx = 0;
    // Clean and unalign Text/Twext nodes; get rid of html characters and remove any extra spaces
    SpanUtils.cleanAndUnalignNode(textEl[0], textLine);
    SpanUtils.cleanAndUnalignNode(textEl[0], timingLine);
    // Get Text node
    var textNode = textEl[0].childNodes[textLine].childNodes.length > 0?textEl[0].childNodes[textLine].childNodes[0]:textEl[0].childNodes[textLine];
    // Get Text node value cleaned (convert any nbsp to normal spaces)
    var textVal = cleanText(textNode.nodeValue);
    // Get Text words
    var textWords = getWords(textVal);
    for(i=1; i<textWords.length; i++) {
      segLength = textWords[i-1].split('-').length;
      timingIx += segLength;
      this.alignTiming(textEl[0], textLine, timingLine, i, timingIx);
    }
  },

  /**
    Align Timing slot to Text word.
    Put words in <span> and compare their left position to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
    Params: 'textEl' the input div element (textEl[0]).
            'textLine' the Text line number
            'timingLine' the Timing line number
            'N' text word index; starts with index 0
            'n' timing slot index; starts with index 0
  */
  alignTiming: function(textEl, textLine, timingLine, N, n) {
    var realign = false; // realign this pair to move Timing word a little bit util aligned to Text word if text word moved further
    // Get Text/Timing nodes
    var textNode = textEl.childNodes[textLine].childNodes.length > 0 ? textEl.childNodes[textLine].childNodes[0] : textEl.childNodes[textLine];
    var timingNode = textEl.childNodes[timingLine].childNodes.length > 0?textEl.childNodes[timingLine].childNodes[0]:textEl.childNodes[timingLine];
    // Get Text/Timing nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = cleanText(textNode.nodeValue);
    var timingVal = cleanText(timingNode.nodeValue).replace(/\./g, '-'); // replace . by - to consider timing slot as one word ("1.00" not "1","00")
    // Get Text/Timing lines' words
    var textWords = getWords(textVal);
    var timingWords = getWords(timingVal);
    // Get Text/Timing lines' words indices
    var textWordsIndices = getWordsIndices(textVal);
    var timingWordsIndices = getWordsIndices(timingVal);

    if(n >= timingWords.length || N >= textWords.length) return;

    // Put Text/Timing words in span tag
    SpanUtils.putWordInSpan(textNode, textWordsIndices[N], textWords[N], "textWord");
    SpanUtils.putWordInSpan(timingNode, timingWordsIndices[n], timingWords[n].replace(/\-/g, '.'), "timingWord");
    // Get words left position
    var NPos = parseInt($('#textWord').position().left);
    var nPos = parseInt($('#timingWord').position().left);
    if(NPos < nPos) { // Text word has less position, move it to Timing word
      parentEl = textNode.parentElement;
      while(NPos < nPos) {
        // Add space before word
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#timingWord').position().left);
      }
      // Check if Text word is moved after Timing word a little bit; This may occur because the Text font size is usually bigger than timing, so 1 space of Text may equal to more than one space of Timing.
      if(NPos > nPos) {
        realign = true;
        //this.alignTiming(textEl, textLine, timingLine, N, n); // realign this pair to move Timing word a little bit till aligned to Text word
      }
    } else if(NPos > nPos) {  // Timing word has less position, move it to Text word
      parentEl = timingNode.parentElement;
      while(NPos > nPos) {
        // Add space before word
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#timingWord').position().left);
      }
    } else {  // Positions are equal; Text and Twext words are already aligned, move twext one space to create a chunk 'bump align'
      parentEl = timingNode.parentElement;
      // Add space before Twext word
      parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
    }
    // Remove span tag from Text node; All nodes are #div elements except (sometimes) the first node, if it's a #TEXT node, use the parent element
    if(textEl.childNodes[textLine].nodeType == 3) {
      SpanUtils.removeSpanNode(textEl, "textWord", N == 0, N == textWords.length-1);
    } else {
      SpanUtils.removeSpanNode(textEl.childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
    }
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode(textEl.childNodes[timingLine], "timingWord", n == 0, n == timingWords.length-1);
    if(realign) this.alignTiming(textEl, textLine, timingLine, N, n); //realign this pair to move Timing word a little bit till aligned to Text word
  },

  /**
    Align chunks of text/twext lines pair.
    Params: 'textEl' the contenteditable element
            'textLine' the Text line number
            'twextLine' the Twext line number
            'nN' an array contains the n:N pairs ["1:1", "2:2",....]
  */
  alignChunks: function(textEl, textLine, twextLine, nN) {
    var i;
    // Clean and unalign Text/Twext nodes; get rid of html characters and remove any extra spaces
    SpanUtils.cleanAndUnalignNode(textEl[0], textLine);
    SpanUtils.cleanAndUnalignNode(textEl[0], twextLine);
    // Loop over nN array which represent the chunks of text/twext lines to be aligned
    for(i=0; i<nN.length; i++) {
      this.alignChunk(textEl[0], textLine, twextLine, nN[i]); // Align given chunk (n:N pair) of the text/twext lines
    }
  },

  /**
    Align Twext word n to Text word N.
    Put words in <span> and compare their left position to detect which word to move forward to the other. The word with the less position value is the one to move to the other; Moving the word is by adding spaces before it.
    Params: 'textEl' the input div element (textEl[0]).
            'textLine' the Text line number
            'twextLine' the Twext line number
            'nN' twext/text word number in the form of n:N string (eg:"1:1"); word number starts with index 1
  */
  alignChunk: function(textEl, textLine, twextLine, nN) {
    var realign = false;  // realign this pair to move Twext word a little bit util aligned to Text word if text word moved further
    // Get Text/Twext nodes
    var textNode = textEl.childNodes[textLine].childNodes.length > 0 ? textEl.childNodes[textLine].childNodes[0] : textEl.childNodes[textLine];
    var twextNode = textEl.childNodes[twextLine].childNodes.length > 0 ? textEl.childNodes[twextLine].childNodes[0] : textEl.childNodes[twextLine];
    // Get Text/Twext nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = cleanText(textNode.nodeValue);
    var twextVal = cleanText(twextNode.nodeValue);
    // Get Text/Twext lines' words
    var textWords = getWords(textVal);
    var twextWords = getWords(twextVal);
    // Get Text/Twext lines' words indices
    var textWordsIndices = getWordsIndices(textVal);
    var twextWordsIndices = getWordsIndices(twextVal);
    // Obtain Text/Twext words' numbers from n:N pair, subtract 1 to make the word number represents an index
    var tmp = nN.split(":");
    var n = parseInt(tmp[0]) - 1; // Twext word number, start with index 0
    var N = parseInt(tmp[1]) - 1; // Text word number, start with index 0
    if(n >= twextWords.length || N >= textWords.length) return;
    // Put Text/Twext words in span tag
    SpanUtils.putWordInSpan(textNode, textWordsIndices[N], textWords[N], "textWord");
    SpanUtils.putWordInSpan(twextNode, twextWordsIndices[n], twextWords[n], "twextWord");
    // Get words left position
    var NPos = parseInt($('#textWord').position().left);
    var nPos = parseInt($('#twextWord').position().left);
    if(NPos < nPos) { // Text word has less position, move it to Twext word
      parentEl = textNode.parentElement;
      while(NPos < nPos) {
        // Add space before word
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
      }
      // Check if Text word is moved after Twext word a little bit; This may occur because the Text font size is usually bigger than twext, so 1 space of Text may equal to more than one space of Twext.
      if(NPos > nPos) {
        realign = true;
        //this.alignChunk(textEl, textLine, twextLine, nN); // realign this pair to move Twext word a little bit util aligned to Text word
      }
    } else if(NPos > nPos) {  // Twext word has less position, move it to Text word
      parentEl = twextNode.parentElement;
      while(NPos > nPos) {
        // Add space before word
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        // Get the positions again after adding the space to recompare
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
      }
    } else {  // Positions are equal; Text and Twext words are already aligned, move twext one space to create a chunk 'bump align'
      parentEl = twextNode.parentElement;
      // Add space before Twext word
      parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
    }
    // Remove span tag from Text node; All nodes are #div elements except (sometimes) the first node, if it's a #TEXT node, use the parent element
    if(textEl.childNodes[textLine].nodeType == 3) {
      SpanUtils.removeSpanNode(textEl, "textWord", N == 0, N == textWords.length-1);
    } else {
      SpanUtils.removeSpanNode(textEl.childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
    }
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode(textEl.childNodes[twextLine], "twextWord", n == 0, n == twextWords.length-1);
    if(realign) this.alignChunk(textEl, textLine, twextLine, nN); // realign this pair to move Twext word a little bit util aligned to Text word
  },

  /**
    Align cursor to Text or Twext word; Move cursor positioned at the end of Text line to the next/previous Twext word, cursor positioned at the end of Twext line to the next/previous Text word.
    Detect the cursor pos line(text or twext), Put word and cursor pos in <span> tags and compare their left position to detect the direction of cursor move.
    If the cursor preceding the word, then move cursor forward; else move backward. 
    Params: 'textEl' the contenteditable element
            'textLine' the text line number
            'twextLine' the twext line number
            'nN' twext/text word number in the form of n:N string, word number starts with index 1
            'cursorPos' the cursor position
  */
  alignCursor: function(textEl, textLine, twextLine, nN, cursorPos) {
    var nWordIndex, NWordIndex, nWord = "", NWord = "", html = "";
    // Get Text/Twext nodes
    var textNode = textEl.childNodes[textLine].childNodes.length > 0 ? textEl.childNodes[textLine].childNodes[0] : textEl.childNodes[textLine];
    var twextNode = textEl.childNodes[twextLine].childNodes.length > 0 ? textEl.childNodes[twextLine].childNodes[0] : textEl.childNodes[twextLine];
    // Get Text/Twext nodes' values cleaned (convert any nbsp to normal spaces)
    var textVal = cleanText(textNode.nodeValue);
    var twextVal = cleanText(twextNode.nodeValue);
    // Get Text/Twext lines' words
    var textWords = getWords(textVal);
    var twextWords = getWords(twextVal);
    // Get Text/Twext lines' words indices
    var textWordsIndices = getWordsIndices(textVal);
    var twextWordsIndices = getWordsIndices(twextVal);
    // nIsLast: detect if the cursor is at the end of Twext line; NIsLast: detect is the cursor is at the end of Text line
    var nIsLast = false, NIsLast = false;
    // Obtain Text/Twext words' numbers from n:N pair, subtract 1 to make the word number represents an index
    var tmp = nN.split(":");
    var n = parseInt(tmp[0]) - 1; // Twext word number
    var N = parseInt(tmp[1]) - 1; // Text word number
    if(n == twextWords.length) {  // cursor positioned at the end of the Twext line
      nWordIndex = cursorPos; // the Twext word is where the cursor positioned
      NWordIndex = textWordsIndices[N];
      NWord = textWords[N]; // and nWord is empty because it represents the cursor position
      nIsLast = true;
    } else if(N == textWords.length) {  // cursor positioned at the end of the Text line
      NWordIndex = cursorPos; // the Text word is where the cursor positioned
      nWordIndex = twextWordsIndices[n];
      nWord = twextWords[n];  // and NWord is empty because it represents the cursor position
      NIsLast = true;
    }
    // Put Text/Twext words in span tag
    SpanUtils.putWordInSpan(textNode, NWordIndex, NWord, "textWord");
    SpanUtils.putWordInSpan(twextNode, nWordIndex, nWord, "twextWord");
    // Get words left position
    NPos = parseInt($('#textWord').position().left);
    nPos = parseInt($('#twextWord').position().left);
    
    if(nIsLast) { // Cursor positioned at the end of Twext line, move it
      parentEl = twextNode.parentElement;
      if(NPos < nPos) { // cursor is positioned after the N word, move cursor backward by deleting spaces before cursor.
        while(NPos < nPos) {
          // Convert the html to text by replacing the nbsp by text space to check on the char before span wether it is a space or not
          html = parentEl.innerHTML.replace(/\&nbsp;/g, ' ');
          spanIndex = html.indexOf('<span');  // Get the span index
          // If the char to delete is not a space, then ignore
          if(!/\s/.test(html.charAt(spanIndex-1)))  break;  // Equivalent to (el.innerText.charAt(el.innerText.length-1) != 160)
          // Remove a space before cursor, and convert the text back to html
          parentEl.innerHTML = html.substring(0, spanIndex-1).replace(/\s/g, '&nbsp;') + html.slice(spanIndex);
          // Get the positions again after removing the space to recompare
          NPos = parseInt($('#textWord').position().left);
          nPos = parseInt($('#twextWord').position().left);
        }
      } else if(NPos > nPos) {  // N word is a next word to the cursor, move cursor forward
        while(NPos > nPos) {
          spanIndex = parentEl.innerHTML.indexOf('<span');    // Get the span index
          // Add a space before cursor
          parentEl.innerHTML = parentEl.innerHTML.substring(0, spanIndex) + "&nbsp;" + parentEl.innerHTML.slice(spanIndex);
          // Get the positions again after adding the space to recompare
          NPos = parseInt($('#textWord').position().left);
          nPos = parseInt($('#twextWord').position().left);
        }
      }
    } else if(NIsLast) {  // Cursor in text line, move it
      parentEl = textNode.parentElement;
      if(NPos < nPos) { // n word is a next word to the cursor, move cursor forward
        while(NPos < nPos) {
          spanIndex = parentEl.innerHTML.indexOf('<span');  // Get the span index
          // Add a space before cursor
          parentEl.innerHTML = parentEl.innerHTML.substring(0, spanIndex) + "&nbsp;" + parentEl.innerHTML.slice(spanIndex);
          // Get the positions again after adding the space to recompare
          NPos = parseInt($('#textWord').position().left);
          nPos = parseInt($('#twextWord').position().left);
        }
      } else if(NPos > nPos) {  // n word is a previous word to the cursor, move cursor backward
        while(NPos > nPos) {
          // Convert the html to text by replacing the nbsp by text space to check on the char before span wether it is a space or not
          html = parentEl.innerHTML.replace(/\&nbsp;/g, ' ');
          spanIndex = html.indexOf('<span');  // Get the span index
          // If the char to delete is not a space, then ignore
          if(!/\s/.test(html.charAt(spanIndex-1)))  break;  // Equivalent to (el.innerText.charAt(el.innerText.length-1) != 160)
          // Remove a space before cursor
          parentEl.innerHTML = html.substring(0, spanIndex-1).replace(/\s/g, '&nbsp;') + html.slice(spanIndex);
          // Get the positions again after removing the space to recompare
          NPos = parseInt($('#textWord').position().left);
          nPos = parseInt($('#twextWord').position().left);
        }
      }
    }
    // Remove span tag from Text node; All nodes are #div elements except (sometimes) the first node, if it's a #TEXT node, use the parent element
    if(textEl.childNodes[textLine].nodeType == 3) { // Text node (First node)
      SpanUtils.removeSpanNode(textEl, "textWord", N == 0, NIsLast);
    } else {
      SpanUtils.removeSpanNode(textEl.childNodes[textLine], "textWord", N == 0, NIsLast);
    }
    // Remove span tag from Twext node
    SpanUtils.removeSpanNode(textEl.childNodes[twextLine], "twextWord", n == 0, nIsLast);
    // Return the current cursor position
    if(nIsLast) return textEl.childNodes[twextLine].innerText.length;
    if(NIsLast) return textEl.childNodes[textLine].innerText.length;
  },

  /**
    Get the next word in the reference line to be aligned with the current word in the current line; if the current word is in Text line, then the reference line is Twext line; if the current word is in Twext line, then the reference line is Text line.
    Put the current word in <span> and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the current word postion, return the word index if its position is greater than the current word position.
    Params: 'el' the input div element (textEl[0]).
            'currentLine' the line number contains the current word
            'refLine' the reference line number contains the next word to be found
            'wordNumber' the current word number; word number starts with index 0
  */
  nextWord: function(el, currentLine, refLine, wordNumber) {
    var i, refWordpos, currentWordPos;
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine].childNodes.length > 0 ? el.childNodes[currentLine].childNodes[0] : el.childNodes[currentLine];
    var refNode = el.childNodes[refLine].childNodes.length > 0 ? el.childNodes[refLine].childNodes[0] : el.childNodes[refLine];
    // Get current and reference nodes' values
    var currentValue = cleanText(currentNode.nodeValue);
    var refValue = cleanText(refNode.nodeValue);
    // Get current words and positions
    var currentWords = getWords(currentValue);
    var currentWordsPos = getWordsIndices(currentValue);
    // Get reference words and positions
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    // Put current word in <span>, get its left position and remove the span tag
    SpanUtils.putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "tempWord");
    currentWordPos = parseInt($('#tempWord').position().left);
    SpanUtils.removeSpanNode(currentNode.parentElement, "tempWord", wordNumber == 0, wordNumber == currentWords.length-1);
    // Loop over reference words to look for the word with position greater than the current word position
    for(i=0; i<refWordsPos.length; i++) {
      SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");  // Put word on <span>
      refWordPos = parseInt($('#testWord').position().left);  // Get word left position
      SpanUtils.removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);  // remove span tag
      if(refWordPos > currentWordPos) return i; // return reference word index if its position is greater than current word potition
    }
    return -1;  // return -1 if no next word found
  },

  /**
    Get the next word in the reference line to be aligned with the cursor in the current line; if the cursor is in Text line, then the reference line is Twext line; if the cursor is in Twext line, then the reference line is Text line.
    Create <span> where the cursor is positioned and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the cursor span postion, return the word index if its position is greater than the cursor span position.
    Params: 'el' the input div element (textEl[0]).
            'currentLine' the line number where the cursor is positioned
            'refLine' the reference line number contains the next word to be found
            'cursorPos' the position of the cursor.
  */
  nextWordToCursor: function(el, currentLine, refLine, cursorPos) {
    var i, currentWordPos, refWordPos;
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine].childNodes.length > 0 ? el.childNodes[currentLine].childNodes[0] : el.childNodes[currentLine];
    var refNode = el.childNodes[refLine].childNodes.length > 0 ? el.childNodes[refLine].childNodes[0] : el.childNodes[refLine];
    // Get reference node value, words and positions
    var refValue = cleanText(refNode.nodeValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    // Create <span> where the cursor is positioned, get its left position and remove the span tag
    SpanUtils.putWordInSpan(currentNode, cursorPos, "", "tempWord");
    var currentWordPos = parseInt($('#tempWord').position().left);
    SpanUtils.removeSpanNode(currentNode.parentElement, "tempWord", false, true);
    // Loop over reference words to look for the word with position greater than the cursor span position
    for(i=0; i<refWordsPos.length; i++) {
      SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");  // Put word on <span>
      refWordPos = parseInt($('#testWord').position().left);  // Get word left position
      SpanUtils.removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);  // remove span tag
      if(refWordPos > currentWordPos) return i; // return reference word index if its position is greater than cursor span potition
    }
    return -1;  // return -1 if no next word found
  },

  /**
    Get the previous word in the reference line to be aligned with the current word in the current line; if the current word is in Text line, then the reference line is Twext line; if the current word is in Twext line, then the reference line is Text line.
    Put the current word in <span> and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the current word postion, return the word index if its position is less than the current word position.
    Params: 'el' the input div element (textEl[0]).
            'currentLine' the line number contains the current word
            'refLine' the reference line number contains the previous word to be found
            'wordNumber' the current word number; word number starts with index 0
  */
  previousWord: function(el, currentLine, refLine, wordNumber) {
    var i, refWordpos, currentWordPos;
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine].childNodes.length > 0 ? el.childNodes[currentLine].childNodes[0] : el.childNodes[currentLine];
    var refNode = el.childNodes[refLine].childNodes.length > 0 ? el.childNodes[refLine].childNodes[0] : el.childNodes[refLine];
    // Get current and reference nodes' values
    var currentValue = cleanText(currentNode.nodeValue);
    var refValue = cleanText(refNode.nodeValue);
    // Get current words and positions
    var currentWords = getWords(currentValue);
    var currentWordsPos = getWordsIndices(currentValue);
    // Get reference words and positions
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    // Put current word in <span>, get its left position and remove the span tag
    SpanUtils.putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "tempWord");
    currentWordPos = parseInt($('#tempWord').position().left);
    SpanUtils.removeSpanNode(currentNode.parentElement, "tempWord", wordNumber == 0, wordNumber == currentWords.length-1);
    // Loop over reference words to look for the word with position less than the current word position
    for(i=refWordsPos.length-1; i<refWordsPos.length; i--) {
      SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");  // Put word on <span>
      refWordPos = parseInt($('#testWord').position().left);  // Get word left position
      SpanUtils.removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);  // remove span tag
      if(refWordPos < currentWordPos) return i; // return reference word index if its position is less than current word potition
    }
    return -1;   // return -1 if no previous word found
  },

  /**
    Get the previous word in the reference line to be aligned with the cursor in the current line; if the cursor is in Text line, then the reference line is Twext line; if the cursor is in Twext line, then the reference line is Text line.
    Create <span> where the cursor is positioned and get its left position. Loop over reference line words, put word in <span>, get its left position and compare it with the cursor span postion, return the word index if its position is less than the cursor span position.
    Params: 'el' the input div element (textEl[0]).
            'currentLine' the line number where the cursor is positioned
            'refLine' the reference line number contains the previous word to be found
            'cursorPos' the position of the cursor.
  */
  previousWordToCursor: function(el, currentLine, refLine, cursorPos) {
    var i, currentWordPos, refWordPos;
    // Get the current and reference nodes
    var currentNode = el.childNodes[currentLine].childNodes.length > 0 ? el.childNodes[currentLine].childNodes[0] : el.childNodes[currentLine];
    var refNode = el.childNodes[refLine].childNodes.length > 0 ? el.childNodes[refLine].childNodes[0] : el.childNodes[refLine];
    // Get reference node value, words and positions
    var refValue = cleanText(refNode.nodeValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    // Create <span> where the cursor is positioned, get its left position and remove the span tag
    SpanUtils.putWordInSpan(currentNode, cursorPos, "", "tempWord");
    currentWordPos = parseInt($('#tempWord').position().left);
    SpanUtils.removeSpanNode(currentNode.parentElement, "tempWord", false, true);
    // Loop over reference words to look for the word with position less than the cursor span position
    for(i=refWordsPos.length-1; i<refWordsPos.length; i--) {
      SpanUtils.putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");  // Put word on <span>
      refWordPos = parseInt($('#testWord').position().left);  // Get word left position
      SpanUtils.removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);  // remove span tag
      if(refWordPos < currentWordPos) return i; // return reference word index if its position is less than cursor span potition
    }
    return -1;
  },

  /**
    Get the position of the start of a word.
    Put the word in <span>, get its left position, remove span tag, return the position.
    Params: 'el' the input div element (textEl[0]).
            'lineNumber' the number of line
            'word' the word number, start index is 0
  */
  wordStartPos: function(el, lineNumber, word) {
    // Get the node with the specified line number
    var node = el.childNodes[lineNumber].childNodes.length > 0 ? el.childNodes[lineNumber].childNodes[0] : el.childNodes[lineNumber];
    // Get node value
    var nodeValue = cleanText(node.nodeValue);
    // Get line words and words' positions
    var words = getWords(nodeValue);
    var wordsPos = getWordsIndices(nodeValue);
    // Put word in <span>, get its left position and remove the span tag
    SpanUtils.putWordInSpan(node, wordsPos[word], words[word], "word");
    var pos = parseInt($('#word').position().left);
    SpanUtils.removeSpanNode(node.parentElement, "word", word == 0, word == words.length-1);
    return pos; // return position
  },

  /**
    Get the position of the end of a word.
    Put the space after the word (represents the end of the word) in <span>, get its left position, remove span tag, return the position.
    Params: 'el' the input div element (textEl[0]).
            'lineNumber' the number of line
            'word' the word number, start index is 0
  */
  wordEndPos: function(el, lineNumber, word) {
    // Get the node with the specified line number
    var node = el.childNodes[lineNumber].childNodes.length > 0 ? el.childNodes[lineNumber].childNodes[0] : el.childNodes[lineNumber];
    // Get node value
    var nodeValue = cleanText(node.nodeValue);
    // Get line words and words' positions
    var wordsPos = getWordsIndices(nodeValue);
    // Get the index of space after the word
    var spaceAfterWordIx = wordsPos[word] + nodeValue.slice(wordsPos[word]).indexOf(' ');
    // Put the space in <span>, get its left position and remove the span tag
    SpanUtils.putWordInSpan(node, spaceAfterWordIx, ' ', "word");
    var pos = parseInt($('#word').position().left);
    SpanUtils.removeSpanNode(node.parentElement, "word", word == 0, word == wordsPos.length-1);
    return pos; // return position
  }
});