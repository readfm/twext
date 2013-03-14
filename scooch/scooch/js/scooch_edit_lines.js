/**
  This class is used to do handle two lines of text (Text and Twext)
*/
window.ScoochEditorLines = Class.$extend({
  /**
    Initilize class variables (classy.js is used for class creation)
  */
	__init__: function(){
		this.lines = [];  // text input lines; lines[0] is the Text line, lines[1] is the Twext line
		this.cursor_offset; // current cursor position
    this.element = $('#data-show'); // contenteditable element
    this.aligner = new SpanAligner(); // Span aligner object
	},

  /**
    Set line value.
    @param 'num' the line number to set
            'line' the new line value
  */
	setLine: function(num, line){
		if(line instanceof ScoochEditorLine) this.lines[num] = line;  // Set line value if it's instanceof ScoochEditorLine
		else throw "The line needs to be an instanceof ScoochEditorLine";
	},

  /**
    Get the next reference word for the current cursor position, this is used to move the cursor to the next word.
    Get the next word using spans, a spanaligner function call.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'currentLine' current line number where the cursor positioned
            'cursorPos' the position of the cursor
  */
  nextWordToCursor: function(first, currentLine, cursorPos) {
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    return this.aligner.nextWordToCursor(this.element[0], currentLine, refLine, cursorPos);
  },

  /**
    Get the next reference word for the current word, this is used to move current word to the next reference word.
    Try to get the next word from chunks array, if not found then get it using spans; a spanaligner function call.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'currentLine' current line number containing the word to be moved.
            'wordNumber' number of the current word to be moved to the next word in the ref line, start index is 0.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  nextWord: function(first, currentLine, wordNumber, chunks) {
    //Get next word from chunks array of the current pair. Adding 1 to wordNumber because words are saved in chunks array with start index 1 not 0
    var word_num = chunks?this.nextChunk(first, wordNumber+1, chunks):-1;
    if(word_num != -1) return word_num-1; //Subtract 1 to return word with start index 0 not 1(words are saved in chunks array with start index 1)

    // If no next chunk(current word is not a chunk), get the next word using spans.
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    return this.aligner.nextWord(this.element[0], currentLine, refLine, wordNumber);
  },

  /**
    Get the next reference word for the current word from chunks array of the current lines pair.
    Look for the current word number in chunks array; if found return its pair word number incremented by 1 to represent next word not the current.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'wordNum' number of the current word to be moved to the next word in the ref line, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  nextChunk: function(first, wordNum, chunks) {
    if(first) { // Text is the current line, current word number is a 'N', check equality with chunk pair 'value'
      for(var key in chunks) {  // Loop over chunks array
        if(chunks[key] == wordNum) return parseInt(key)+1;  // chunk is found, return key 'n' incremented by 1 to represent the next word
      }
    } else {  // Twext is the current line, current word number is a 'n', check equality with chunk pair 'key'
      for(var key in chunks) {  // Loop over chunks array
        if(key == wordNum) return parseInt(chunks[key])+1;  // chunk is found, return value 'N' incremented by 1 to represent the next word
      }
    }
    return -1;  // chunk not found
  },

  /**
    Check if the current word is a chunk (has an entry in chunks array).
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'wordNum' number of the current word to be moved to the next word in the ref line, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
    @return key of the chunk if found, -1 otherwise
  */
  busyChunk: function(first, wordNum, chunks) {
    if(first) { // Text is the current line, current word number is a 'N', check equality with chunk pair 'value'
      for(var key in chunks) {  // Loop over chunks array
        if(chunks[key] == wordNum) return key;  // chunk is found, return key 'n' of the chunk
      }
    } else {  // Twext is the current line, current word number is a 'n', check equality with chunk pair 'key'
      for(var key in chunks) {  // Loop over chunks array
        if(key == wordNum) return key;  // chunk is found, return key 'n' of the chunk 
      }
    }
    return -1;  // chunk not found
  },

  /**
    Reformat chunks from the form key/value array to the form of n:N string array; the reformatted array will be sent to spanAligner to align chunks
    @param 'chunks' the chunks of the current Text/Twext lines pair.
  */
  getnN: function(chunks) {
    var nN = new Array();
    for(var key in chunks) {  // Loop over chunks key/value array
      nN.push(key+":"+chunks[key]); // Put n,N in the form of n:N string and push it to the array
    }
    return nN;  // return array of n:N strings
  },

  /**
    Move 'align' cursor to the next reference word.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'current_word' number of the current word to be moved to the next word in the ref line, start index is 1.
            'current_line' current line number
            'cursor_pos' the position of the cursor
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  pushCursor: function(first, current_word, current_line, cursor_pos, chunks) {
    // get the next reference word index (start index 0)
    var next_word = this.nextWordToCursor(first, current_line, cursor_pos) + 1; // Adding 1 to get the word number (start index 1)
    if(next_word != 0) {  // If next word is available
      var key = first?next_word:current_word; // Twext word number 'n' (if current line is Text then n is next word; else n is current word)
      var value = first?current_word:next_word; // Text word number 'N' (if current line is Text then N is current word; else N is next word)
      var nN = key + ":" + value; // n:N string
      var pos = this.aligner.alignCursor(this.element[0], this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN, cursor_pos);  // Align cursor
      chunks[key] = value;  // create new chunk for the current word to be written in cursor position and the next word
      this.cursor_offset = pos; // set cursor position to the new position after aligning
      return chunks;  // return updated chunks array
    } else {  // no next word available
      this.cursor_offset = cursor_pos;  // keep cursor position in its place
      return false; // no alignment, no chunks updates, return false
    }
  },

  /**
    Add the new chunk created when pushing chunk(hitting a space) to the chunks array.
    If the next reference word is busy(aligned with another word), delete this pair to create a new pair containing current word and next ref word.
    If the current word is busy(aligned with another word), delete this pair to create a new pair containing current word and next ref word.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'current_word' number of the current word to be moved to the next word in the ref line, start index is 1.
            'next_word' number of the next reference word, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  updateChunksForPush: function(first, current_word, next_word, chunks) {
    var key = first?next_word:current_word; // Twext word number 'n' (if current line is Text then n is next word; else n is current word)
    var value = first?current_word:next_word; // Text word number 'N' (if current line is Text then N is current word; else N is next word)
    if(Object.size(chunks) > 0) { // If there are another saved chunks
      var current_chunk_key = this.busyChunk(first, current_word, chunks);  // Check if the current word is a chunk
      if(current_chunk_key != -1) {  // current word is a chunk
        delete chunks[current_chunk_key]; // Delete the exisiting chunk pair to add the new one.
      }
      var next_chunk_key = this.busyChunk(!first, next_word, chunks);  // Check if the next word is a chunk
      if(next_chunk_key != -1) {  // next word is a chunk
        delete chunks[next_chunk_key]; // Delete the exisiting chunk pair to add the new one.
      }
    }
    chunks[key] = value; // Add the new pair.
    return chunks;  // return updated chunks
  },

	/**
    Move 'align' the current word to the next reference word.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'cursor_pos' the position of the cursor
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
	*/
	pushChunk: function(first, cursor_pos, chunks) {
    // Get current and reference lines
    var current_line = this.lines[first? 0:1];
    var ref_line = this.lines[first? 1:0];
    // Get current node
    var current_node = this.element[0].childNodes[current_line.lineNumber()].childNodes.length>0?this.element[0].childNodes[current_line.lineNumber()].childNodes[0]:this.element[0].childNodes[current_line.lineNumber()];
    // Get current line text
    var current_string = current_line.text();
    // Get current and reference lines' words
    var current_words = current_line.words();
    var ref_words = ref_line.words();

    // if chars after cursor are only spaces, then trim them; this is necessary to check wether the cursor at the end of the line text or not.
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));  // trim substring after cursor
    if(trimmed.length == 0) { // spaces after cursor are trimmed and the length is 0, then all chars after cursor were only spaces
      current_string = current_string.substring(0, cursor_pos); // exclude after cursor spaces from the current string
      current_node.nodeValue = current_string;  // update node value
    }
    // Push cursor to next word if the cursor is positioned at the end of the line
    if(cursor_pos == current_string.length) { // The cursor is at the end of the line
      return this.pushCursor(first, current_words.length+1, current_line.lineNumber(), cursor_pos, chunks); // Move cursor to next word and return
    }
    
    //If cursor positioned between spaces(between two words) in current line,jump cursor to next current word(for cursor to correctly represent current word position)
    if(/\s/.test(current_string.charAt(cursor_pos))) {  // If character at cursor position is a space
      cursor_pos = current_line.next_word_pos(cursor_pos);  // set the cursor position to the next word position of the line
      if(cursor_pos < 0) return false;  // return false if no next word in the line
    }

    // Get current and reference word numbers, start index is 0
    var current_word_ix = current_line.wordNumber(cursor_pos); // current word index (moving word)
    var next_word_ix = this.nextWord(first, current_line.lineNumber(), current_word_ix, chunks);  // reference word index (moving to word)

    // Check if next word is out of the reference line boundries
    if(next_word_ix < 0 || next_word_ix > ref_words.length-1) { // If before the begining or after the end of reference line
      this.cursor_offset = cursor_pos;  // keep current cursor position
      return false; // no next word, return false
    }

    // Update chunks array.
    chunks = this.updateChunksForPush(first, current_word_ix+1, next_word_ix+1, chunks);

    // Use span aligner to align chunks
    var nN = this.getnN(chunks); // Reformat chunks from the form key/value array to the form of n:N string array
    this.aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);

    // Update cursor position after aligning words
    var current_aligned_text = this.element[0].childNodes[current_line.lineNumber()].textContent; // current text after alignment
    current_line.text(current_aligned_text);  // set text of current_line to the new text
    var current_words = current_line.words(); // get current text words' positions
    this.cursor_offset = current_words[current_word_ix];  // set cursor position to the new position (after alignment) of the current word
    return chunks;  // return updated chunks
  },

  /**
    Get the previous reference word for the current cursor position, this is used to move the cursor to the previous word.
    Get the previous word using spans, a spanaligner function call.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'currentLine' current line number where the cursor positioned
            'cursorPos' the position of the cursor
  */
  previousWordToCursor: function(first, currentLine, cursorPos) {
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    return this.aligner.previousWordToCursor(this.element[0], currentLine, refLine, cursorPos);
  },

  /**
    Get the previous reference word for the current word, this is used to move current word to the previous reference word.
    Try to get the previous word from chunks array, if not found then get it using spans; a spanaligner function call.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'currentLine' current line number containing the word to be moved.
            'wordNumber' number of the current word to be moved to the previous word in the ref line, start index is 0.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  previousWord: function(first, currentLine, wordNumber, chunks) {
    //Get previous word from chunks array of current pair. Adding 1 to wordNumber because words are saved in chunks array with start index 1 not 0
    var word_num = chunks?this.previousChunk(first, wordNumber+1, chunks):-1;
    if(word_num != -1) return word_num-1; //Subtract 1 to return word with start index 0 not 1(words are saved in chunks array with start index 1)

    // If no previous chunk(current word is not a chunk), get the previous word using spans.
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    return this.aligner.previousWord(this.element[0], currentLine, refLine, wordNumber);    
  },

  /**
    Get the previous reference word for the current word from chunks array of the current lines pair.
    Look for the current word number in chunks array; if found return its pair word number decremented by 1 to represent previous word not current.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'wordNum' number of the current word to be moved to the previous word in the ref line, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  previousChunk: function(first, wordNum, chunks) {
    if(first) { // Text is the current line, current word number is a 'N', check equality with chunk pair 'value'
      for(var key in chunks) {  // Loop over chunks array
        if(chunks[key] == wordNum) return parseInt(key)-1;  // chunk is found, return key 'n' decremented by 1 to represent the previous word
      }
    } else {  // Twext is the current line, current word number is a 'n', check equality with chunk pair 'key'
      for(var key in chunks) {  // Loop over chunks array
        if(key == wordNum) return parseInt(chunks[key])-1;  // chunk is found, return value 'N' decremented by 1 to represent the previous word
      }
    }
    return -1;  // chunk not found
  },

  /**
    Move 'align' cursor to the previous reference word.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'current_word' number of the current word to be moved to the previous word in the ref line, start index is 1.
            'current_line' current line number
            'cursor_pos' the position of the cursor
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  pullCursor: function(first, current_word, current_line, cursor_pos, chunks) {
    // get the previous reference word index (start index 0)
    var previous_word = this.previousWordToCursor(first, current_line, cursor_pos) + 1;  // Adding 1 to get the word number (start index 1)
    if(previous_word != 0) {  // If previous word is available
      var key = first?previous_word:current_word; // Twext word number 'n' (if current line is Text then n is previous word; else n is current word)
      var value = first?current_word:previous_word; // Text word number 'N' (if current line is Text then N is current word; else N is next word)
      var nN = key + ":" + value; // n:N string
      var pos = this.aligner.alignCursor(this.element[0], this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN, cursor_pos);  // Align cursor
      chunks[key] = value; // create new chunk for the current word to be written in cursor position and the previous word
      this.cursor_offset = pos; // set cursor position to the new position after aligning
      return chunks;  // return updated chunks array
    } else {  // no previous word available
      this.cursor_offset = cursor_pos;  // keep cursor position in its place
      return false; // no alignment, no chunks updates, return false
    }
  },

  /**
    Add the new chunk created when pulling chunk(hitting a backspace) to the chunks array.
    If the current word is busy(aligned with another word), delete this pair to merge.
    If the position where the current word should move to contains space (there is a room to move), delete previous ref word chunk pair (if previous word is busy) and create a new pair containing current word and previous ref word.
    @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'current_word' number of the current word to be moved to the previous word in the ref line, start index is 1.
            'previous_word' number of the previous reference word, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
            'canMoveChunk' boolean to detect if there is a room(current moving position is a space) for the current word to move backward
  */
  updateChunksForPull: function(first, current_word, previous_word, chunks, canMoveChunk) {
    var key = first?previous_word:current_word; // Twext word number 'n' (if current line is Text then n is next word; else n is current word)
    var value = first?current_word:previous_word; // Text word number 'N' (if current line is Text then N is current word; else N is next word)
    if(Object.size(chunks) > 0) { // If there are another saved chunks
      var current_chunk_key = this.busyChunk(first, current_word, chunks);  // Check if the current word is a chunk
      if(current_chunk_key != -1) {  // current word is a chunk
        delete chunks[current_chunk_key]; // Delete the exisiting chunk pair 'merge'
      }
      var previous_chunk_key = this.busyChunk(!first, previous_word, chunks);  // Check if the previous word is a chunk
      if(canMoveChunk) { // There is available space for the current chunk to be moved backward, pull chunk 'align'.
        if(previous_chunk_key != -1) {  // previous word is a chunk
          delete chunks[previous_chunk_key]; // Delete the exisiting chunk pair to add the new one.
        }
        if(previous_word != 0) { // No alignment with the first word
          chunks[key] = value;  // Add the new pair.
        }
      }
    }
    return chunks;  // return updated chunks
  },

  /**
    Move 'align' the current word to the previous reference word.
    If there is a space in the current word moving position (position where the current word should move to), then current word will be moved to it,
    If not, then just delete the current chunk pair (if any) to merge.
    @param 'on_first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'cursor_pos' the position of the cursor
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
	*/
	pullChunk: function(first, cursor_pos, chunks){
    // Get current and reference lines
    var current_line = this.lines[first? 0:1];
    var ref_line = this.lines[first? 1:0];
    // Get current node
    var current_node = this.element[0].childNodes[current_line.lineNumber()].childNodes.length>0?this.element[0].childNodes[current_line.lineNumber()].childNodes[0]:this.element[0].childNodes[current_line.lineNumber()];
    // Get current line text
    var current_string = current_line.text();
    // Get current and reference lines' words
    var ref_words = ref_line.words();
    var current_words = current_line.words();

    // if chars after cursor are only spaces, then trim them; this is necessary to check wether the cursor at the end of the line text or not.
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));  // trim substring after cursor
    if(trimmed.length == 0) { // spaces after cursor are trimmed and the length is 0, then all chars after cursor were only spaces
      current_string = current_string.substring(0, cursor_pos);  // exclude after cursor spaces from the current string
      current_node.nodeValue = current_string;  // update node value
    }
    // Pull cursor to previous word if the cursor is positioned at the end of the line
    if(cursor_pos == current_string.length) { // The cursor is at the end of the line
      return this.pullCursor(first, current_words.length+1, current_line.lineNumber(), cursor_pos, chunks); //Move cursor to previous word, return
    }

    //If cursor positioned between spaces(between two words) in current line,jump cursor to next current word(for cursor to correctly represent current word position)
    if(/\s/.test(current_string.charAt(cursor_pos))){ // If character at cursor position is a space
      cursor_pos = current_line.next_word_pos(cursor_pos);  // set the cursor position to the next word position of the line
      if(cursor_pos < 0) return false;  // return false if no next word in the line
    }

    // Get current and reference word numbers, start index is 0
    var current_word_ix = current_line.wordNumber(cursor_pos); // current word index (moving word)
    var previous_word_ix = this.previousWord(first, current_line.lineNumber(), current_word_ix, chunks); // reference word index (moving to word)
    
    // Check if previous word is out of the reference line boundries
    if(previous_word_ix < 0 || previous_word_ix > ref_words.length-1) { // If before the begining or after the end of reference line
      this.cursor_offset = cursor_pos;  // keep current cursor position
      return false; // no previous word, return false
    }

    // Check if there is a room (moving position contains a space) for the current word to be moved backward to align with previous ref word.
    var canMoveChunk = this.canMoveChunk(current_word_ix, previous_word_ix, current_line, ref_line, cursor_pos);
    chunks = this.updateChunksForPull(first, current_word_ix+1, previous_word_ix+1, chunks, canMoveChunk);  // Update chunks array.

    // Use span aligner to align chunks
    var nN = this.getnN(chunks); // Reformat chunks from the form key/value array to the form of n:N string array
    this.aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);

    // Update cursor position after aligning words
    var current_aligned_text = this.element[0].childNodes[current_line.lineNumber()].textContent; // current text after alignment
    current_line.text(current_aligned_text);  // set text of current_line to the new text
    var current_words = current_line.words(); // get current text words' positions
    this.cursor_offset = current_words[current_word_ix];  // set cursor position to the new position (after alignment) of the current word
    return chunks;  // return updated chunks
  },

  /**
    Check if current chunk can be moved backward. The idea of 'pull' is to move the word backward only if it will be moved to an empty position (contains space); this method check if the moving position contains space. 
    This method first check if number of spaces are exceeding or equal 2, return false if less than 2 (chunk can not be moved backward if only one space before the word).
    If 2 spaces or more, get the position of the reference word using spans, get the position of the space after the word before the current(end of previous word), return true if the position of the space is less than the position of the reference word (space is placed before the ref word)
    @param 'currentWord' The current word number (start index is 0)
            'refWord' The reference word number (starts index is 0)
            'current_line' The current line (type is Scooch_edit_line)
            'ref_line' The reference line (type is Scooch_edit_line)
            'cursorPos' cursor position
  */
  canMoveChunk: function(currentWord, refWord, current_line, ref_line, cursorPos) {
    // Check if there is more than 1 space before the current word, a must to be moved backward.
    var spaces = this.countPreviousSpaces(current_line.text(), cursorPos);  // count spaces befor current word
    if(spaces < 2) return false;  // no moving backward if less than 2 spaces

    // Get space aftar word(before current word) and reference word positions 
    var endSpacePos = this.aligner.wordEndPos(this.element[0], current_line.lineNumber(), currentWord-1);
    var refWordPos = this.aligner.wordStartPos(this.element[0], ref_line.lineNumber(), refWord);

    if(endSpacePos < refWordPos) return true;
    return false;
  },

  /**
    Count the number of spaces between the specified position and the nonspace previous caharacter.
  */
  countPreviousSpaces: function(str, pos){
    var spaces = 0;
    // check the characters before the pos one at a time, break when a nonspace char is found
    while(pos > spaces && /\s/.test(str.charAt(pos-1-spaces) ) ){
      spaces++; // if space, increment spaces count
    }
    return spaces;
  }

  /*setLines: function(lines){
		this.lines = lines;
	},*/

	/*words: function(lineNum){
		if(this.lines[lineNum] instanceof ScoochEditorLine){
			return this.lines[lineNum].words();
		}else{
			throw "Line Index out of range";
		}
	},*/
	
	/*to_ratio: function(base_pos){
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
	},*/

  /*wordIndex: function(lineNum){
        if(this.lines[lineNum] instanceof ScoochEditorLine){
            return this.lines[lineNum].wordIndex();
        }else{
            throw "Line Index out of range";
        }
  },*/
  /*length: function(lineNum){
      return this.lines[lineNum].length;
  },*/
  /*rtrim: function(str){
    return str.replace(/\s+$/,"");
  },*/

  /*fill_up_to: function(str, length){
    while(str.length < length) str += " ";
    return str;
  },*/
  /*text_for_chunks: function(actual_chunks, ref_chunks, is_first, cursor_move){
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
  }*/
});
