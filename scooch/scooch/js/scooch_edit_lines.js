
window.ScoochEditorLines = Class.$extend({
	
	__init__: function(ratio){
		this.lines = [];
		this.cursor_offset;
		this.ratio = ratio?ratio:1;
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
	* This function is used to calculate pushing a chunk
	*/
	pushChunk: function(first, cursor_pos){//1, 7, 0
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
    //no ref forward position to align?
    var next_word_ix = ref_line.next_word_ix( first? this.to_ratio(cursor_pos):this.from_ratio(cursor_pos) );
    if(next_word_ix < 0) return false;

    var chunks = this.chunks(),
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
      var cursor_move = { index:1, offset:0 };
      return this.text_for_chunks(current_chunk_strings, ref_chunk_strings, first, cursor_move);

    return false;
  },
	
  rtrim: function(str){
    return str.replace(/\s+$/,"");
  },

  fill_up_to: function(str, length){
    while(str.length < length) str += " ";
    return str;
  },

	pullChunk: function(on_first, cursor_pos){
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
    //no ref backward position to align?
    var previous_word_ix = ref_line.prev_word_ix( on_first? this.to_ratio(cursor_pos):this.from_ratio(cursor_pos) );
    if(previous_word_ix < 0) return false;

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
    return this.text_for_chunks(current_chunk_strings, ref_chunk_strings, on_first, cursor_move);
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
