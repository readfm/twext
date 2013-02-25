
window.ScoochEditorLines = Class.$extend({
	
	__init__: function(ratio){
		this.lines = [];
		this.cursor_offset;
		this.ratio = /*ratio?ratio:*/1;
    this.element = $('#data-show');
	},

    length: function(lineNum){
        return this.lines[lineNum].length;
    },

	setLine: function(num,line){
		if(line instanceof ScoochEditorLine) this.lines[num] = line;
		else throw "The line needs to be an instanceof ScoochEditorLine";
	},

	setLines: function(lines){
		this.lines = lines;
	},

	words: function(lineNum){
		if(this.lines[lineNum] instanceof ScoochEditorLine){
			return this.lines[lineNum].words();
		}else{
			throw "Line Index out of range";
		}
	},
	
	to_ratio: function(base_pos){
	  return base_pos * this.ratio;
	},
	
	from_ratio:function(pos){
	  return Math.round(pos / this.ratio); 
	},

	chunks: function(){
	  var first = this.words(0),
	      second = this.words(1);
	      first_line = this.lines[0].text(),
	      second_line = this.lines[1].text();
	  var chunks = new Array();
    var two_spaces = /\s\s/;
	  var i = 0;
	  var pos;
	  while(i < first.length){
	    pos = first[i];
	    if( second.indexOf( this.to_ratio(pos) ) != -1 &&
	        ( pos < 2 || two_spaces.test( first_line.substring(pos-2, pos) ) || two_spaces.test( second_line.substring(this.to_ratio(pos)-2, this.to_ratio(pos)) ) ) 
	      ){
	      chunks.push(pos);
	    }
	    i++;
	  };
	  return chunks;
	},

  wordIndex: function(lineNum){
        if(this.lines[lineNum] instanceof ScoochEditorLine){
            return this.lines[lineNum].wordIndex();
        }else{
            throw "Line Index out of range";
        }
  },

  /**
    Get the next reference word for the current cursor position, this is used to move the cursor to the next word.
  */
  getNextWordToCursor: function(first, lineNumber, cursorPos) {
    var currentNode = this.element[0].childNodes[lineNumber].childNodes.length > 0 ? this.element[0].childNodes[lineNumber].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refNode = this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes.length > 0 ? this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refValue = cleanText(refNode.nodeValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    putWordInSpan(currentNode, cursorPos, "", "tempWord");
    var currentWordPos = parseInt($('#tempWord').position().left);
    removeSpanNode(currentNode.parentElement, "tempWord", false, true);
    for(var i=0; i<refWordsPos.length; i++) {
      putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");
      refWordPos = parseInt($('#testWord').position().left);
      removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);
      if(refWordPos > currentWordPos) {
        return i;
      }
    }
    return -1;
  },

  /**
    Get the next word available for the current word to be aligned with.
    Params: 'first' boolean to detect if the moving word in text or twext, true when moving text word.
            'lineNumber' number of the current line containing the word to be moved.
            'wordNumber' number of the current word to be moved to the next word in the ref line, starts from 0.
            'chunks' the line chunks.
  */
  getNextRefWord: function(first, lineNumber, wordNumber, chunks) {
    var word_num = chunks?this.getNextChunk(first, chunks, wordNumber+1):-1;
    
    if(word_num != -1) return word_num-1;
    // If current word is not a chunk, get the next word using spans.
    return this.getNextWordWithSpans(first, lineNumber, wordNumber);
  },

  /**
    Look for the current word in chunks array. If found, return its aligned word number incremented by one to represent the next ref word.
  */
  getNextChunk: function(first, chunks, wordNum) {
    if(first) { // Text is the current line
      for(var key in chunks) {
        if(chunks[key] == wordNum) return parseInt(key)+1;
      }
    } else {  // Twext is the current line
      for(var key in chunks) {
        if(key == wordNum) return parseInt(chunks[key])+1;
      }
    }
    return -1;
  },

  /**
    Get the available next word using spans.
  */
  getNextWordWithSpans: function(first, lineNumber, wordNumber) {
    var i, refWordpos;
    var currentNode = this.element[0].childNodes[lineNumber].childNodes.length > 0 ? this.element[0].childNodes[lineNumber].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refNode = this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes.length > 0 ? this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes[0] : this.element[0].childNodes[lineNumber];
    var currentValue = cleanText(currentNode.nodeValue);
    var refValue = cleanText(refNode.nodeValue);
    var currentWords = getWords(currentValue);
    var currentWordsPos = getWordsIndices(currentValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "tempWord");
    var currentWordPos = parseInt($('#tempWord').position().left);
    removeSpanNode(currentNode.parentElement, "tempWord", wordNumber == 0, wordNumber == currentWords.length-1);
    for(var i=0; i<refWordsPos.length; i++) {
      putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");
      refWordPos = parseInt($('#testWord').position().left);
      removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);
      if(refWordPos > currentWordPos) return i;
    }
    return -1;
  },

  /**
    Check if the current word is a chunk
    Params: 'chunks' the chunks of the current pair lines
            'wordNum' the current word number
            'first' detects if the current moving line is the text line.
  */
  busyChunk: function(chunks, wordNum, first) {
    if(first) {
      for(var key in chunks) {
        if(chunks[key] == wordNum) return key;
      }
    } else {
      for(var key in chunks) {
        if(key == wordNum) return key;
      }
    }
    return -1;
  },

  /**
    Return nN chunks in the form of n:N array.
  */
  getnN: function(chunks) {
    var nN = new Array();
    for(var key in chunks) {
      nN.push(key+":"+chunks[key]);
    }
    return nN;
  },

	/**
	* This function is used to calculate pushing a chunk
	*/
	pushChunk: function(first, cursor_pos, chunks){//1, 7, 0
    var key = "", value = "", nN = "";
    var current_line = this.lines[first? 0:1],
      current_string = current_line.text(),
      ref_line = this.lines[first? 1:0],
      //ref_string = ref_line.text(),
      ref_words = ref_line.words(),
      current_words = current_line.words(),
      next_word_ix, current_word_ix;
    var textLineNum = first?current_line.lineNumber():ref_line.lineNumber();
    var lineChunks = chunks[textLineNum].chunks;
    var aligner = new SpanAligner();

    // Move cursor to next word if at end of string
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));
    if(trimmed.length == 0) current_string = current_string.substring(0, cursor_pos);  // if chars after cursor are spaces, then trim
    if(cursor_pos == current_string.length) { // The cursor is at the end of the line
      current_word_ix = current_words.length;
      next_word_ix = this.getNextWordToCursor(first, current_line.lineNumber(), cursor_pos);
      if(next_word_ix != -1) {
        key = first?next_word_ix+1:current_word_ix+1; // n
        value = first?current_word_ix+1:next_word_ix+1; // N
        nN = key + ":" + value;
        var pos = aligner.alignCursor(this.element[0], this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN, cursor_pos);
        lineChunks[key] = value;
        chunks[textLineNum].chunks = lineChunks;
        this.cursor_offset = pos;
        return chunks;
      } else {
        this.cursor_offset = cursor_pos;
        return false;
      }
    }
    
    //detect -between spaces-
    if(/\s/.test(current_string.charAt(cursor_pos))){
      cursor_pos = current_line.next_word_pos(cursor_pos);
      if(cursor_pos < 0) return false;
    }
    current_word_ix = current_line.wordAtCaret(cursor_pos); // The word to move number

    //no ref forward position to align?
    next_word_ix = this.getNextRefWord(first, current_line.lineNumber(), current_word_ix, lineChunks);
    if(next_word_ix < 0 || next_word_ix > ref_words.length-1) { // Second condition for the last word in the line
      this.cursor_offset = cursor_pos;
      return false;
    }

    // Update chunks array.
    key = first?next_word_ix+1:current_word_ix+1; // n
    value = first?current_word_ix+1:next_word_ix+1; // N
    if(this.size(lineChunks) > 0) {
      var next_chunk_key = this.busyChunk(lineChunks, next_word_ix+1, !first);  // Check if the next word is a chunk, return chunk key
      if(next_chunk_key != -1) {  // next word is a chunk
        delete lineChunks[next_chunk_key]; // Delete the exisiting nN pair to add the new one.
      }
      var current_chunk_key = this.busyChunk(lineChunks, current_word_ix+1, first);  // Check if the current word is a chunk, return chunk key
      if(current_chunk_key != -1) {  // current word is a chunk
        delete lineChunks[current_chunk_key]; // Delete the exisiting nN pair to add the new one.
      }
      lineChunks[key] = value; // Add the new pair, this line will work also if the ref chunk is busy.
      chunks[textLineNum].chunks = lineChunks;
    } else {  //No previous chunks
      lineChunks = {};
      lineChunks[key] = value;
      chunks[textLineNum].chunks = lineChunks;
    }

    // Use span aligner to align chunks
    nN = this.getnN(lineChunks); // Get nN array to align chunks
    aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);
    var updated_text = first?this.element[0].childNodes[this.lines[0].lineNumber()].textContent:this.element[0].childNodes[this.lines[1].lineNumber()].textContent;
    current_line.text(updated_text);
    var current_words = current_line.words();
    this.cursor_offset = current_words[current_word_ix];
    return chunks;
  },

  /**
    Get the size of associative array
  */
  size: function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  },
	
  rtrim: function(str){
    return str.replace(/\s+$/,"");
  },

  fill_up_to: function(str, length){
    while(str.length < length) str += " ";
    return str;
  },

  /**
    Get the previous reference word for the current cursor position, this is used to move the cursor to the previous word.
  */
  getPreviousWordToCursor: function(first, lineNumber, cursorPos) {
    var currentNode = this.element[0].childNodes[lineNumber].childNodes.length > 0 ? this.element[0].childNodes[lineNumber].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refNode = this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes.length > 0 ? this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refValue = cleanText(refNode.nodeValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    putWordInSpan(currentNode, cursorPos, "", "tempWord");
    var currentWordPos = parseInt($('#tempWord').position().left);
    removeSpanNode(currentNode.parentElement, "tempWord", false, true);
    for(var i=0; i<refWordsPos.length; i++) {
      putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");
      refWordPos = parseInt($('#testWord').position().left);
      removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);
      if(refWordPos >= currentWordPos) {
        return i-1;
      }
    }
    return -1;
  },

  /**
    Get the previous word available for the current word to be aligned with.
    Params: 'first' boolean to detect if the moving word in text or twext, true when moving text word.
            'lineNumber' number of the current line containing the word to be moved.
            'wordNumber' number of the current word to be moved to the previous word in the ref line.
            'chunks' the line chunks
  */
  getPreviousRefWord: function(first, lineNumber, wordNumber, chunks) {
    var word_num = this.getPrevChunk(first, chunks, wordNumber+1);
    if(word_num != -1) return word_num-1; // -1 to return index  
    // If current word is not a chunk, get the previous word using spans.
    return this.getPrevWordWithSpans(first, lineNumber, wordNumber);    
  },

  /**
    Look for the current word in chunks array. If found, return its aligned word number decremented by one to represent the next ref word.
  */
  getPrevChunk: function(first, chunks, wordNum) {
    if(first) { // Text is the current line
      for(var key in chunks) {
        if(chunks[key] == wordNum) return parseInt(key)-1;
      }
    } else {  // Twext is the current line
      for(var key in chunks) {
        if(key == wordNum) return parseInt(chunks[key])-1;
      }
    }
    return -1;
  },

  /**
    Get the available previous word using spans.
  */
  getPrevWordWithSpans: function(first, lineNumber, wordNumber) {
    var i, refWordpos;
    var currentNode = this.element[0].childNodes[lineNumber].childNodes.length > 0 ? this.element[0].childNodes[lineNumber].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refNode = this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes.length > 0 ? this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes[0] : this.element[0].childNodes[lineNumber];
    var currentValue = cleanText(currentNode.nodeValue);
    var refValue = cleanText(refNode.nodeValue);
    var currentWords = getWords(currentValue);
    var currentWordsPos = getWordsIndices(currentValue);
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    putWordInSpan(currentNode, currentWordsPos[wordNumber], currentWords[wordNumber], "tempWord");
    var currentWordPos = parseInt($('#tempWord').position().left);
    removeSpanNode(currentNode.parentElement, "tempWord", wordNumber == 0, wordNumber == currentWords.length-1);
    for(var i=0; i<refWordsPos.length; i++) {
      putWordInSpan(refNode, refWordsPos[i], refWords[i], "testWord");
      refWordPos = parseInt($('#testWord').position().left);
      removeSpanNode(refNode.parentElement, "testWord", i == 0, i == refWords.length-1);
      if(refWordPos >= currentWordPos) return i-1;
      
    }
    return -1;
  },
  /**
    Count the number of spaces before caret.
  */
  countPreviousSpaces: function(str, pos){
    var spaces = 0;
    while(pos > spaces && /\s/.test(str.charAt(pos-1-spaces) ) ){
      spaces++;
    }
    return spaces;
  },

  /**
    Check if current chunk can be moved backward.
    Get the previous ref word pos, check if the char at the same pos in current line is space, if yes then the chunk can be pulled.
    Params: 'currentWord' The current word number (starts with 0)
            'refWord' The ref word number (starts with 0)
            'lineNumber' The current line number
            'cursorPos' cursor position
  */
  canMoveChunk: function(currentWord, refWord, lineNumber, cursorPos, first) {
    var currentNode = this.element[0].childNodes[lineNumber].childNodes.length > 0 ? this.element[0].childNodes[lineNumber].childNodes[0] : this.element[0].childNodes[lineNumber];
    var currentValue = cleanText(currentNode.nodeValue);
    var refNode = this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes.length > 0 ? this.element[0].childNodes[first?lineNumber+1:lineNumber-1].childNodes[0] : this.element[0].childNodes[lineNumber];
    var refValue = cleanText(refNode.nodeValue);

    // Check if there is more than 1 space, a must to move backward.
    var spaces = this.countPreviousSpaces(currentValue, cursorPos);  // count previous spaces
    if(spaces < 2) return false;

    // Get previous ref word pos    
    var refWords = getWords(refValue);
    var refWordsPos = getWordsIndices(refValue);
    putWordInSpan(refNode, refWordsPos[refWord], refWords[refWord], "refWord");
    var refWordPos = parseInt($('#refWord').position().left);
    removeSpanNode(refNode.parentElement, "refWord", refWord == 0, refWord == refWords.length-1);
    // Get pos of space after previous word of current line, comparing it with previous ref word pos detects if the index to pull to is busy.
    var currentWords = getWords(currentValue);
    var currentWordsPos = getWordsIndices(currentValue);
    putWordInSpan(currentNode, currentWordsPos[currentWord-1]+currentWords[currentWord-1].length, ' ', "currentWord");
    var endSpacePos = parseInt($('#currentWord').position().left);
    removeSpanNode(currentNode.parentElement, "currentWord", currentWord == 0, currentWord == currentWords.length-1);

    if(endSpacePos < refWordPos) return true;
    return false;
  },

	pullChunk: function(on_first, cursor_pos, chunks){
    var key = "", value = "", nN = "";
    var current_line = this.lines[on_first? 0:1],
      current_string = current_line.text(),
      ref_line = this.lines[on_first? 1:0],
      ref_string = ref_line.text(),
      ref_words = ref_line.words(),
      current_words = current_line.words(),
      previous_word_ix;
    var textLineNum = on_first?current_line.lineNumber():ref_line.lineNumber();
    var lineChunks = chunks[textLineNum].chunks;
    var aligner = new SpanAligner();

    // Move cursor to previous word if at end of string
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));
    if(trimmed.length == 0) current_string = current_string.substring(0, cursor_pos);  // if chars after cursor are spaces, then trim
    if(cursor_pos == current_string.length) { // The cursor is at the end of the line
      current_word_ix = current_words.length;
      previous_word_ix = this.getPreviousWordToCursor(on_first, current_line.lineNumber(), cursor_pos);
      if(previous_word_ix != -1) {
        key = on_first?previous_word_ix+1:current_word_ix+1; // n
        value = on_first?current_word_ix+1:previous_word_ix+1; // N
        nN = key + ":" + value;
        var pos = aligner.alignCursor(this.element[0], this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN, cursor_pos);
        //lineChunks[key] = value;
        delete lineChunks[key];
        chunks[textLineNum].chunks = lineChunks;
        this.cursor_offset = pos;
        return chunks;
      } else {
        this.cursor_offset = cursor_pos;
        return false;
      }
    }
    //detect -between spaces-
    if(/\s/.test(current_string.charAt(cursor_pos))){
      cursor_pos = current_line.next_word_pos(cursor_pos);
      if(cursor_pos < 0) return false;
    }
    current_word_ix = current_line.wordAtCaret(cursor_pos); // The word to move number

    //no ref backward position to align?
    previous_word_ix = this.getPreviousRefWord(on_first, current_line.lineNumber(), current_word_ix, lineChunks);
    if(previous_word_ix < 0) {
      this.cursor_offset = cursor_pos;
      return false;
    }

    // Update chunks array.
    key = on_first?previous_word_ix+1:current_word_ix+1; // n
    value = on_first?current_word_ix+1:previous_word_ix+1; // N
    if(this.size(lineChunks) > 0) {
      var previous_chunk_key = this.busyChunk(lineChunks, previous_word_ix+1, !on_first);  // Check if the previous word is a chunk, return chunk key
      var current_chunk_key = this.busyChunk(lineChunks, current_word_ix+1, on_first);  // Get the current chunk key
      //var spaces = this.countPreviousSpaces(current_string, cursor_pos);  // count previous spaces, merge if 1 space, merge(if needed) and align if 2+
      // Delete current pair, if chunk
      if(current_chunk_key != -1) {  // current word is a chunk
        delete lineChunks[current_chunk_key]; // Delete the exisiting nN pair (merge)
      }
      if(this.canMoveChunk(current_word_ix, previous_word_ix, current_line.lineNumber(), cursor_pos, on_first)) { // There is available space for the current chunk to be moved backward, pull chunk 'align'.
        if(previous_chunk_key != -1) {  // previous word is a chunk, delete pair
          delete lineChunks[previous_chunk_key]; // Delete the exisiting nN pair
        }
        if(previous_word_ix != 0) { // Don't try to align with the first word
          // Add the new pair (align)
          lineChunks[key] = value;
          chunks[textLineNum].chunks = lineChunks;
        }
      }
    }

    // Use span aligner to align chunks
    nN = this.getnN(lineChunks); // Get nN array to align chunks
    aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);
    var updated_text = on_first?this.element[0].childNodes[this.lines[0].lineNumber()].textContent:this.element[0].childNodes[this.lines[1].lineNumber()].textContent;
    current_line.text(updated_text);
    var current_words = current_line.words();
    this.cursor_offset = current_words[current_word_ix];
    return chunks;
  },
  
  text_for_chunks: function(actual_chunks, ref_chunks, is_first, cursor_move){
    var top, below, longest, length_so_far = 0, i = 0;
    var first_chunks = new Array(), second_chunks = new Array();
    for(; i< actual_chunks.length; i++){
      top = is_first? actual_chunks[i]:ref_chunks[i];
      below = is_first? ref_chunks[i]:actual_chunks[i];
      if(top.length == this.from_ratio(below.length) && i < actual_chunks.length - 1){
        longest = top.length + 1;
       }
       else{
        longest = Math.max(top.length, this.from_ratio(below.length));
      }
      first_chunks[i] = this.fill_up_to(top, longest);
      second_chunks[i] = this.fill_up_to(below, this.to_ratio(longest));
      if(cursor_move.index > i) length_so_far += is_first? (longest + 1):this.to_ratio(longest + 1);
    }
    this.cursor_offset = length_so_far + cursor_move.offset;
    return [ first_chunks.join(" "), second_chunks.join( this.fill_up_to(" ", this.ratio) ) ];
  }

});
