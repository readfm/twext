
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
    Get the next word available for the current word to be aligned with.
    Params: 'first' boolean to detect if the moving word in text or twext, true when moving text word.
            'lineNumber' number of the current line containing the word to be moved.
            'wordNumber' number of the current word to be moved to the next word in the ref line, starts from 0.
            'chunks' the line chunks.
  */
  getNextRefWord: function(first, lineNumber, wordNumber, chunks) {
    var word_num = this.getNextChunk(first, chunks, wordNumber+1);
    
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
    var current_line = this.lines[first? 0:1],
      current_string = current_line.text(),
      ref_line = this.lines[first? 1:0],
      //ref_string = ref_line.text(),
      ref_words = ref_line.words();

    //detect -between spaces-
    if(/\s/.test(current_string.charAt(cursor_pos))){
      cursor_pos = current_line.next_word_pos(cursor_pos);
      if(cursor_pos < 0) return false;
    }
    var current_word_ix = current_line.wordAtCaret(cursor_pos); // The word to move number
    var textLineNum = first?current_line.lineNumber():ref_line.lineNumber();
    var lineChunks = chunks[textLineNum];

    //no ref forward position to align?
    var next_word_ix = this.getNextRefWord(first, current_line.lineNumber(), current_word_ix, lineChunks);//ref_line.next_word_ix( first? this.to_ratio(cursor_pos):this.from_ratio(cursor_pos) );
    if(next_word_ix < 0 || next_word_ix > ref_words.length-1) { // Second condition for the last word in the line
      this.cursor_offset = cursor_pos;
      return false;
    }

    // Update chunks array.
    var key = first?next_word_ix+1:current_word_ix+1; // n
    var value = first?current_word_ix+1:next_word_ix+1; // N
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
      chunks[textLineNum] = lineChunks;
    } else {  //No previous chunks
      var lineChunks = {};
      lineChunks[key] = value;
      chunks[textLineNum] = lineChunks;
    }

    // Use span aligner to align chunks
    var nN = this.getnN(lineChunks); // Get nN array to align chunks
    var aligner = new SpanAligner();
    aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);
    var updated_text = first?this.element[0].childNodes[this.lines[0].lineNumber()].textContent:this.element[0].childNodes[this.lines[1].lineNumber()].textContent;
    current_line.text(updated_text);
    var current_words = current_line.words();
    this.cursor_offset = current_words[current_word_ix];
    return chunks;
    
    
    /* to be removed*/
    /*var chunks = this.chunks(),
        current_chunk_ix = 0;
    //find which chunk we are moving to
    var i = 0, 
        chunk_pos = first? cursor_pos:this.from_ratio(cursor_pos);
    for(; i<chunks.length; i++){
        if(chunks[i] < chunk_pos){
            current_chunk_ix = i+1;
        }
        else{
          break;
        }
    }

    var in_chunk = chunks[current_chunk_ix] == chunk_pos;
    var new_current_string, new_ref_string, longest;

      var current_chunk_strings = [];
      var ref_chunk_strings = [];
      var next_chunk = in_chunk? current_chunk_ix+1:current_chunk_ix;
      var next_pos_is_chunk = (first?this.from_ratio(ref_words[next_word_ix]):ref_words[next_word_ix]) == chunks[next_chunk];
      
      var into_last_chunk = next_chunk == chunks.length || (chunks.length == next_chunk + 1) && next_pos_is_chunk;
      //REF
      var first_piece;
      if(in_chunk && chunk_pos > 0){//merge happens
        first_piece = this.rtrim( ref_line.ratio_substring(0, chunk_pos) ) + " " +ref_line.raw_substring(ref_line.to_ratio(chunk_pos), ref_words[next_word_ix]).trim();
      }
      else{
        first_piece = this.rtrim( ref_line.raw_substring(0, ref_words[next_word_ix]) );
      }
      ref_chunk_strings.push( first_piece );
      //curr
      current_chunk_strings.push( this.rtrim( current_line.raw_substring(0, cursor_pos) ) );

      if(!next_pos_is_chunk){
        if(chunks[next_chunk]){
          ref_chunk_strings.push( ref_line.raw_substring( ref_words[next_word_ix], ref_line.to_ratio(chunks[next_chunk]) ).trim() );
          ref_chunk_strings.push( ref_line.ratio_substring(chunks[next_chunk]).trim() );
          current_chunk_strings.push( current_line.raw_substring(cursor_pos, current_line.to_ratio(chunks[next_chunk])).trim() );
          current_chunk_strings.push( current_line.ratio_substring(chunks[next_chunk]).trim() );
        }
        else{
          ref_chunk_strings.push( ref_line.raw_substring( ref_words[next_word_ix] ).trim() );
          current_chunk_strings.push( current_line.raw_substring(cursor_pos).trim() );
        }
      }
      else{
        if(into_last_chunk){
          ref_chunk_strings.push( ref_line.raw_substring( ref_words[next_word_ix] ).trim() );
          to_merge = current_line.ratio_substring(chunks[next_chunk]).trim();
          current_chunk_strings.push( current_line.raw_substring(cursor_pos, current_line.to_ratio(chunks[next_chunk])).trim() + " " + to_merge);
        }
        else{
          ref_chunk_strings.push( ref_line.ratio_substring(chunks[next_chunk], chunks[next_chunk+1]).trim() );
          ref_chunk_strings.push( ref_line.ratio_substring(chunks[next_chunk+1]).trim() );
          to_merge = current_line.ratio_substring(chunks[next_chunk], chunks[next_chunk + 1]).trim();
          current_chunk_strings.push( current_line.raw_substring(cursor_pos, current_line.to_ratio(chunks[next_chunk])).trim() + " " + to_merge);
          current_chunk_strings.push( current_line.ratio_substring(chunks[next_chunk + 1]).trim() );
        }
      }
      
      //var cursor_move = { index:1, offset:0 };
      //return this.text_for_chunks(current_chunk_strings, ref_chunk_strings, first, cursor_move);

    return false;*/
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

	pullChunk: function(on_first, cursor_pos, chunks){
    var current_line = this.lines[on_first? 0:1],
      current_string = current_line.text(),
      ref_line = this.lines[on_first? 1:0],
      ref_string = ref_line.text(),
      ref_words = ref_line.words();

    //detect -between spaces-
    if(/\s/.test(current_string.charAt(cursor_pos))){
      cursor_pos = current_line.next_word_pos(cursor_pos);
      if(cursor_pos < 0) return false;
    }
    current_word_ix = current_line.wordAtCaret(cursor_pos); // The word to move number
    var textLineNum = on_first?current_line.lineNumber():ref_line.lineNumber();
    var lineChunks = chunks[textLineNum];

    //no ref backward position to align?
    var previous_word_ix = this.getPreviousRefWord(on_first, current_line.lineNumber(), current_word_ix, lineChunks);
    if(previous_word_ix < 0) {
      this.cursor_offset = cursor_pos;
      return false;
    }

    // Update chunks array.
    var key = on_first?previous_word_ix+1:current_word_ix+1; // n
    var value = on_first?current_word_ix+1:previous_word_ix+1; // N
    if(this.size(lineChunks) > 0) {
      var previous_chunk_key = this.busyChunk(lineChunks, previous_word_ix+1, !on_first);  // Check if the previous word is a chunk, return chunk key
      var current_chunk_key = this.busyChunk(lineChunks, current_word_ix+1, on_first);  // Get the current chunk key
      var spaces = this.countPreviousSpaces(current_string, cursor_pos);  // count previous spaces, merge if 1 space, merge(if needed) and align if 2+
      if((previous_chunk_key != -1 && current_chunk_key != -1) || (previous_chunk_key == -1 && current_chunk_key != -1 && spaces == 1)) {  // previous word and current word are busy, delete current pair
        delete lineChunks[current_chunk_key]; // Delete the current exisiting nN pair (merge)
      } else {
        if(previous_chunk_key != -1) {  // previous word is a chunk, delete pair
          delete lineChunks[previous_chunk_key]; // Delete the exisiting nN pair
        }
        if(current_chunk_key != -1) {  // current word is a chunk, delete pair
          delete lineChunks[current_chunk_key]; // Delete the exisiting nN pair (merge)
        }
        if(previous_word_ix != 0) { // Don't try to align with the first word
          // Add the new pair (align)
          lineChunks[key] = value;
          chunks[textLineNum] = lineChunks;
        }
      }
    } else {  //No previous chunks
      if(previous_word_ix != 0) { // Don't try to align with the first word
        // Add the new pair (align)
        var lineChunks = {};
        lineChunks[key] = value;
        chunks[textLineNum] = lineChunks;
      }
    }

    // Use span aligner to align chunks
    var nN = this.getnN(lineChunks); // Get nN array to align chunks
    var aligner = new SpanAligner();
    aligner.alignChunks(this.element, this.lines[0].lineNumber(), this.lines[1].lineNumber(), nN);
    var updated_text = on_first?this.element[0].childNodes[this.lines[0].lineNumber()].textContent:this.element[0].childNodes[this.lines[1].lineNumber()].textContent;
    current_line.text(updated_text);
    var current_words = current_line.words();
    this.cursor_offset = current_words[current_word_ix];
    return chunks;

 
    // To be removed
    /*
    var chunks = this.chunks();
    var i,
        previous_chunk_ix = -1,
        chunk_pos = on_first? cursor_pos:this.from_ratio(cursor_pos);
    //find which chunk we are moving
    for(i=0; i<chunks.length; i++){
        if(chunks[i] < chunk_pos){
            previous_chunk_ix = i;
        }
        else{
          break;
        }
    }

    var current_chunk_strings = [], ref_chunk_strings = [];
    var into_chunk = previous_chunk_ix > -1 && ref_words[previous_word_ix] == chunks[previous_chunk_ix];
    var in_chunk = chunk_pos == chunks[previous_chunk_ix + 1];
    var next_chunk_ix = previous_chunk_ix + (in_chunk? 2:1);
    var cursor_move = { index:0, offset:0 };

    var to_merge;
    if(chunks[previous_chunk_ix] && chunks[previous_chunk_ix] > 0){
      ref_chunk_strings.push( this.rtrim( ref_line.ratio_substring(0, chunks[previous_chunk_ix]) ) );

      to_merge = this.rtrim( current_line.ratio_substring(0, chunks[previous_chunk_ix]) );
      if(into_chunk && !in_chunk){
        current_chunk_strings.push( to_merge + " " + current_line.raw_substring( current_line.to_ratio(chunks[previous_chunk_ix]), cursor_pos).trim() );
      }
      else{
        current_chunk_strings.push( to_merge );
      }
      cursor_move.index = 1;
    }

    if(into_chunk){
      if( in_chunk ){//merge happens
        to_merge = ref_line.ratio_substring(chunks[previous_chunk_ix], chunk_pos).trim();
        to_merge += " " + ref_line.ratio_substring(chunk_pos, chunks[next_chunk_ix] ).trim();
        ref_chunk_strings.push( to_merge );
        to_merge = current_line.raw_substring( current_line.to_ratio(chunks[previous_chunk_ix]), cursor_pos).trim();
        cursor_move.offset = to_merge.length + 1;
        to_merge += " " + current_line.raw_substring(cursor_pos, current_line.to_ratio(chunks[next_chunk_ix]) ).trim();
        current_chunk_strings.push( to_merge );
      }
      else{
        ref_chunk_strings.push( ref_line.ratio_substring(chunks[previous_chunk_ix], chunks[next_chunk_ix] ).trim() );
        if(chunks[previous_chunk_ix] == 0 ) 
          return false;
        current_chunk_strings.push( current_line.raw_substring(cursor_pos, current_line.to_ratio(chunks[next_chunk_ix]) ).trim() );
      }
    }
    else{
      if(previous_word_ix > 0){
        ref_chunk_strings.push( this.rtrim( ref_line.raw_substring( ref_line.to_ratio(chunks[previous_chunk_ix] || 0 ), ref_words[previous_word_ix]) ) );
        current_chunk_strings.push( current_line.raw_substring( current_line.to_ratio(chunks[previous_chunk_ix] || 0), cursor_pos).trim() );
        cursor_move.index++;
      }

      to_merge = ref_line.raw_substring( ref_words[previous_word_ix], ref_words[previous_word_ix + 1] ).trim();
      if( ref_words[previous_word_ix + 1] ){
        to_merge += " " + ref_line.raw_substring( ref_words[previous_word_ix + 1], ref_line.to_ratio(chunks[next_chunk_ix]) ).trim();
      }
      ref_chunk_strings.push( to_merge );
      current_chunk_strings.push( current_line.raw_substring(cursor_pos, current_line.to_ratio( chunks[next_chunk_ix]) ).trim() );
    }
    if(chunks[next_chunk_ix]){
      ref_chunk_strings.push( ref_line.ratio_substring( chunks[next_chunk_ix] ).trim() );
      current_chunk_strings.push( current_line.ratio_substring(chunks[next_chunk_ix]).trim() );
    }
    return this.text_for_chunks(current_chunk_strings, ref_chunk_strings, on_first, cursor_move);*/
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
