/**
  This class is used to do handle two lines of text (Text and Twext)
*/
window.ScoochEditorLines = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
	__init__: function(area){
		this.lines = [];  // text input lines; lines[0] is the Text line, lines[1] is the Twext line
		this.cursor_offset; // current cursor position
    this.area = area; // contenteditable <div> element
    this.aligner = new SpanAligner(); // Span aligner object
	},

  /**
  * Set lines (Text/Twext pair)
  * @param 'lines' the lines values (Text/Twext lines)
  */
  setLines: function(lines){
		this.lines = lines;
	},

  /**
  * Move 'align' the current word to the next reference word.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'cursor_pos' the position of the cursor
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
	*/
	pushChunk: function(first, cursor_pos, chunks) {
    // Get current and reference lines
    var current_line = this.lines[first? 0:1];
    var ref_line = this.lines[first? 1:0];
    // Get current node
    var current_node = this.area.childNodes[current_line.lineNumber()];
    // Get current line text
    var current_string = current_line.text();
    // Get current and reference lines' words positions
    var current_words = current_line.words();
    var ref_words = ref_line.words();

    // if chars after cursor are only spaces, then trim them; this is necessary to check wether the cursor at the end of the line text or not.
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));  // trim substring after cursor
    if(trimmed.length == 0) { // spaces after cursor are trimmed and the length is 0, then all chars after cursor were only spaces
      current_string = current_string.substring(0, cursor_pos); // exclude after cursor spaces from the current string
      current_node.textContent = current_string;  // update node value
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
    var current_word_ix = current_line.wordAtCaret(cursor_pos); // current word index (moving word)
    var next_word_ix = this.nextWord(first, current_line.lineNumber(), current_word_ix, chunks);  // reference word index (moving to word)

    // Check if next word is out of the reference line boundries
    if(next_word_ix < 0 || next_word_ix > ref_words.length-1) { // If before the begining or after the end of reference line
      this.cursor_offset = cursor_pos;  // keep current cursor position
      return false; // no next word, return false
    }

    // Add new pair to chunks array.
    chunks = this.addChunk(first, current_word_ix+1, next_word_ix+1, chunks, true);

    // Use span aligner to align chunks
    var nN = TwextUtils.chunksTonN(chunks); // Reformat chunks from the form key/value array to the form of n:N string array
    this.aligner.alignChunks(this.area, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);

    // Update cursor position after aligning words
    //var current_aligned_text = this.area.childNodes[current_line.lineNumber()].textContent; // current text after alignment
    current_line.text(current_node.textContent);  // set text of current_line to the new text after alignment
    this.cursor_offset = current_line.words()[current_word_ix];  // set cursor position to the new position (after alignment) of the current word
    return chunks;  // return updated chunks
  },

  /**
  * Move 'align' cursor to the next reference word.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'current_word' number of the current word to be moved to the next word in the ref line, start index is 1.
           'currentLine' current line number
           'cursor_pos' the position of the cursor
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  pushCursor: function(first, current_word, currentLine, cursor_pos, chunks) {
    // get next ref word to cursor
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    var next_word = this.aligner.nextWordToCursor(this.area, currentLine, refLine, cursor_pos)+1; // add 1 to represent n/N chunk number

    if(next_word != 0) {  // If next word is available
      var n = first?next_word:null; // Twext word number 'n' (if current line is Text then n is next word; else n is not needed)
      var N = first?null:next_word; // Text word number 'N' (if current line is Text then N is not needed; else N is next word)
      var pos = this.aligner.alignCursor(this.area, this.lines[0].lineNumber(), this.lines[1].lineNumber(), N-1, n-1, cursor_pos);  // Align cursor (sub 1 from N/n to represent index)

      this.addChunk(first, current_word, next_word, chunks, true); // add new chunk pair for the new typed word

      this.cursor_offset = pos; // set cursor position to the new position after aligning
      return chunks;  // return updated chunks array
    } else {  // no next word available
      this.cursor_offset = cursor_pos;  // keep cursor position in its place
      return false; // no alignment, no chunks updates, return false
    }
  },

  /**
  * Get the next reference word for the current word, this is used to move current word to the next reference word.
  * Try to get the next word from chunks array, if not found then get it using spans; a spanaligner function call.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'currentLine' current line number containing the word to be moved.
           'wordNumber' number of the current word to be moved to the next word in the ref line, start index is 0.
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  * @return next ref word index, -1 chunk pair not found
  */
  nextWord: function(first, currentLine, wordNumber, chunks) {
    //Get next word from chunks array of the current pair. Adding 1 to wordNumber because words are saved in chunks array with start index 1 not 0
    var word_num = chunks?this.nextChunk(first, wordNumber+1, chunks):-1;
    if(word_num != -1) return word_num-1; //Subtract 1 to return word with start index 0 not 1(words are saved in chunks array with start index 1)

    // If no next chunk(current word is not a chunk), get the next word using spans.
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    return this.aligner.nextWord(this.area, currentLine, refLine, wordNumber);
  },

  /**
  * Get the next reference word for the current word from chunks array of the current lines pair.
  * Look for the current word number in chunks array; if found return its pair word number incremented by 1 to represent next word not the current.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
            'wordNum' number of the current word to be moved to the next word in the ref line, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  nextChunk: function(first, wordNum, chunks) {
    if(first) { // Text is the current line, current word number is a 'N', check equality with chunk pair 'value'
      var key = Object.find(chunks, wordNum);
      if(key != -1) return parseInt(key)+1; // chunk pair found, return key 'n' incremented by 1 to represent next word
    } else {  // Twext is the current line, current word number is a 'n', check equality with chunk pair 'key'
      var value = chunks[wordNum];
      if(value) return parseInt(value)+1; // chunk is found, return value 'N' incremented by 1 to represent the next word
    }
    return -1;  // chunk not found
  },

  /**
  * Add the new chunk created when push/pull chunk to the chunks array.
  * If the current word is busy(aligned with another word), delete this pair to merge.
  * If chunk can be moved, delete chunk pair if ref word is busy and add the new one.
  * The check of canMoveChunk is used in pull case. Pull word can only be done within the spaces between current word and the word before it, so word cannot be pulled backward if there is no room for it(if spaces before word less than 2 or previous word is positioned before all spaces preceding the current word)
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'current_word' number of the current word to be moved to the ref word in the ref line, start index is 1.
           'ref_word' number of the reference word, start index is 1.
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
           'canMoveChunk' boolean to detect if there is a room(current moving position is a space) for the current word to move backward
  */
  addChunk: function(first, current_word, ref_word, chunks, canAlignChunk) {
    var current_chunk_key = this.busyChunk(first, current_word, chunks);  // Check if the current word is a chunk
    if(current_chunk_key != -1) {  // current word is a chunk
      delete chunks[current_chunk_key]; // Delete the exisiting chunk pair 'merge'
    }
    var ref_chunk_key = this.busyChunk(!first, ref_word, chunks);  // Check if the ref word is a chunk
    if(canAlignChunk) { // There is available space for the current chunk to be moved, needed in pull, always true in push
      if(ref_chunk_key != -1) {  // ref word is a chunk
        delete chunks[ref_chunk_key]; // Delete the exisiting chunk pair to add the new one.
      }
      if(!chunks || Object.size(chunks) == 0) { // If there are saved chunks
        chunks = {};
      }
      // Add new pair
      var key = first?ref_word:current_word; // Twext word number 'n' (if current line is Text then n is next word; else n is current word)
      var value = first?current_word:ref_word; // Text word number 'N' (if current line is Text then N is current word; else N is next word)
      if(ref_word != 0) { // No alignment with the first word
        chunks[key] = value;  // Add the new pair.
      }
    }
    return chunks;  // return updated chunks
  },

  /**
  * Check if the given word is a chunk (has an entry in chunks array).
  * @param 'first' boolean to detect if the word is Text 'N' or Twext 'n', true if word is Text.
            'wordNum' number of the word to be checked, start index is 1.
            'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  * @return key of the chunk if found, -1 otherwise
  */
  busyChunk: function(first, wordNum, chunks) {
    if(chunks && Object.size(chunks) > 0) {
      if(first) { // the word number is a 'N', check equality with chunk pair 'value'
        var key = Object.find(chunks, wordNum);
        if(key != -1) return key; // return key
      } else {  // the word number is a 'n', check equality with chunk pair 'key'
        var value = chunks[wordNum];
        if(value) return wordNum; // return key
      }
    }
    return -1;  // chunk not found
  },

  /**
  * Move 'align' the current word to the previous reference word.
  * If there is a space in the current word moving position (position where the current word should move to), then current word will be moved to it,
  * If not, then just delete the current chunk pair (if any) to merge.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'cursor_pos' the position of the cursor
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
	*/
	pullChunk: function(first, cursor_pos, chunks){
    // Get current and reference lines
    var current_line = this.lines[first? 0:1];
    var ref_line = this.lines[first? 1:0];
    // Get current node
    var current_node = this.area.childNodes[current_line.lineNumber()];
    // Get current line text
    var current_string = current_line.text();
    // Get current and reference lines' words
    var current_words = current_line.words();
    var ref_words = ref_line.words();

    // if chars after cursor are only spaces, then trim them; this is necessary to check wether the cursor at the end of the line text or not.
    var trimmed = $.trim(current_string.substring(cursor_pos, current_string.length));  // trim substring after cursor
    if(trimmed.length == 0) { // spaces after cursor are trimmed and the length is 0, then all chars after cursor were only spaces
      current_string = current_string.substring(0, cursor_pos);  // exclude after cursor spaces from the current string
      current_node.textContent = current_string;  // update node value
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
    var current_word_ix = current_line.wordAtCaret(cursor_pos); // current word index (moving word)
    var previous_word_ix = this.previousWord(first, current_line.lineNumber(), current_word_ix, chunks); // reference word index (moving to word)
    
    // Check if previous word is out of the reference line boundries
    if(previous_word_ix < 0 || previous_word_ix > ref_words.length-1) { // If before the begining or after the end of reference line
      this.cursor_offset = cursor_pos;  // keep current cursor position
      return false; // no previous word, return false
    }

    // Check if there is a room (moving position contains a space) for the current word to be moved backward to align with previous ref word.
    var canAlignChunk = this.canAlignChunk(current_word_ix, previous_word_ix, current_line, ref_line, cursor_pos);
    chunks = this.addChunk(first, current_word_ix+1, previous_word_ix+1, chunks, canAlignChunk);  // update chunks array

    // Use span aligner to align chunks
    var nN = TwextUtils.chunksTonN(chunks); // Reformat chunks from the form key/value array to the form of n:N string array
    this.aligner.alignChunks(this.area, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);

    // Update cursor position after aligning words
    //var current_aligned_text = this.area.childNodes[current_line.lineNumber()].textContent; // current text after alignment
    current_line.text(current_node.textContent);  // set text of current_line to the new text
    this.cursor_offset = current_line.words()[current_word_ix];  // set cursor position to the new position (after alignment) of the current word
    return chunks;  // return updated chunks
  },

  /**
  * Move 'align' cursor to the previous reference word.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'current_word' number of the current word to be moved to the previous word in the ref line, start index is 1.
           'current_line' current line number
           'cursor_pos' the position of the cursor
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  pullCursor: function(first, current_word, currentLine, cursor_pos, chunks) {
    // get the previous reference word index (start index 0)
    var refLine = first?currentLine+1:currentLine-1;  //If current line is Text, ref line is the following line; else ref line is the preceding line
    var previous_word = this.aligner.previousWordToCursor(this.area, currentLine, refLine, cursor_pos)+1;// Add 1 to represent n/N chunk number

    if(previous_word != 0) {  // If previous word is available
      var n = first?previous_word:null; // Twext word number 'n' (if current line is Text then n is previous word; else n is not needed)
      var N = first?null:previous_word; // Text word number 'N' (if current line is Text then N is not needed; else N is previous word)
      var pos = this.aligner.alignCursor(this.area, this.lines[0].lineNumber(), this.lines[1].lineNumber(), N-1, n-1, cursor_pos);  // Align cursor

      this.addChunk(first, current_word, previous_word, chunks, true); // add new chunk pair for the new typed word

      this.cursor_offset = pos != -1?pos:$.trim(this.lines[currentLine].text()).length; // set cursor position to the new position after aligning
      return chunks;  // return updated chunks array
    } else {  // no previous word available
      this.cursor_offset = cursor_pos;  // keep cursor position in its place
      return false; // no alignment, no chunks updates, return false
    }
  },

  /**
  * Get the previous reference word for the current word, this is used to move current word to the previous reference word.
  * Try to get the previous word from chunks array, if not found then get it using spans; a spanaligner function call.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
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
    return this.aligner.previousWord(this.area, currentLine, refLine, wordNumber);    
  },

  /**
  * Get the previous reference word for the current word from chunks array of the current lines pair.
  * Look for the current word number in chunks array; if found return its pair word number decremented by 1 to represent previous word not current.
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'wordNum' number of the current word to be moved to the previous word in the ref line, start index is 1.
           'chunks' key/value array represents chunks of the current Text/Twext lines pair; key=n, value=N
  */
  previousChunk: function(first, wordNum, chunks) {
    if(first) { // Text is the current line, current word number is a 'N', check equality with chunk pair 'value'
      var key = Object.find(chunks, wordNum);
      if(key != -1) return parseInt(key)-1; // chunk pair found, return key 'n' decremented by 1 to represent previous word
    } else {  // Twext is the current line, current word number is a 'n', check equality with chunk pair 'key'
      var value = chunks[wordNum];
      if(value) return parseInt(value)-1; // chunk is found, return value 'N' decremented by 1 to represent the previous word
    }
    return -1;  // chunk not found
  },

  /**
  * Check if current chunk can be moved backward. The idea of 'pull' is to move the word backward only if it will be moved to an empty position (contains space); this method check if the moving position contains space. 
  * Get the position of the reference word using spans, get the position of the space after the word before the current(end of previous word), return true if the position of the space is less than the position of the reference word (space is placed before the ref word)
  * @param 'currentWord' The current word number (start index is 0)
           'refWord' The reference word number (starts index is 0)
           'current_line' The current line (type is Scooch_edit_line)
           'ref_line' The reference line (type is Scooch_edit_line)
           'cursorPos' cursor position
  */
  canAlignChunk: function(currentWord, refWord, currentLine, refLine, cursorPos) {
    // Get the span position of space after the word(that is before the current)
    var currentValue = currentLine.text();  // current line text
    var currentWordsPos = currentLine.words();  // line words positions
    var spaceIx = currentWordsPos[currentWord-1] + currentValue.slice(currentWordsPos[currentWord-1]).indexOf(' ');// index of space after the word
    var currentPos = this.aligner.wordPos(this.area, currentLine.lineNumber(), ' ', spaceIx); // space span position

    // Get the span position of ref word
    var refValue = refLine.text();
    var refWords = strWords(refValue);
    var refWordsPos = refLine.words();
    var refPos = this.aligner.wordPos(this.area, refLine.lineNumber(), refWords[refWord], refWordsPos[refWord]);  // ref word span position

    if(currentPos < refPos) return true;
    return false;
  }
});
