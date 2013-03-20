/**
* This class is used to do handle one line of text
*/
window.ScoochEditorLine = Class.$extend({

  /**
  * Initilize class variables (classy.js is used for class creation)
  */
	__init__: function(lineText){
		this.lineText = lineText; // The line text value
    this.lineNum = -1;  // The line number
    this._cache_wordpos = false;  // cached words' positions (indices) of the line text value; used for not recalulating words positions
	},

  /**
  * Get or Set the text value for this line of text. 
  * @param 'str' the line text value to be set(optional)
  * @return the line text value
  */
	text: function(str) {
    // If there is a value sent with the function call, set the line text value; else keep the current value
    if(str && typeof str == 'string') {
      this.lineText = str;  // set the line text value with the new value
      this._cache_wordpos = false;  // the line text changed, clear the cached words (of the old line text value)
    }
    return this.lineText; // return the line text value
  },

  /**
  * Get or Set the line number for this line of text.
  * @param 'line' the line number to be set(optional); start index is 0
  * @return the line number
  */
  lineNumber: function(line){
    // If there is a valid value sent with the function call, set the line number; else keep the current line number
    if(line >= 0) this.lineNum = line;  // set the line number with new value
    return this.lineNum;  // return the line number
  },    

  /**
  * Get all words start positions in a line of text.
  * TODO:This method is under test, should be replaced by clean text and regular expression detection if mismatch with span aligner has been occured
  * @return Array of words start positions
  */
  words: function() {
    var i, chr, t;
    // If there are cached positions, then return them; else calulate the positions
    if(this._cache_wordpos) return this._cache_wordpos; // return cached positions
    var line = this.lineText; // the text of the line
    var len = line.length;  // text line length
    var lastCharSpace = true; //boolean to detect if the previous char was a space,used for word start detection;initially true to detect first word
    var wordPositions = [];
    //if(len == 0 || this._trim(line) == '') return false;

    for(i = 0 ; i < len ; i++) {  // loop over line characters
      chr = line.charAt(i); // get current character
      if(!(/\s/.test(chr))  && lastCharSpace) { // if the current char is not a space and the previous char was a space
        t = i - 2;
        lastCharSpace = false;
        // If there is no char before previous space(first word) or the char before space is not - (to detect syllables)
        if(t < 0 || line.charAt(t) != '-') {
          wordPositions.push(i);  // push the word position
        }
      } else {  // the current char is a space or the previous char is not a space (then it's not a word)
        lastCharSpace = /\s/.test(chr);
      }
    }
    this._cache_wordpos = wordPositions;  // set the cached positions
    return wordPositions; // return words positions
  },

  /**
  * Get the next available word position after the cursor is placed.
  * @param 'cursor_pos' the position of the cursor
  * @return the index of the next word after the cursor position
  */
  next_word_pos:function(cursor_pos) {
    if(!this._cache_wordpos) this.words();  // Get line words positions if no cached 
    for(var i=0; i<this._cache_wordpos.length; i++) {  // loop over the words' positions
      if(this._cache_wordpos[i] > cursor_pos) { // If the position of word is greater than the position of cursor (next word)
        return this._cache_wordpos[i];  // return the word position
      }
    }
    return -1;  // return -1 if no word found
  },

  /**
  * Get the word number where the cursor points at its start or any character of it.
  * @param 'cursor_pos' the position of the cursor
  * @return the word number, start index is 0
  */
  wordNumber: function(cursor_pos) {
    if(!this._cache_wordpos) this.words();  // Get line words positions if no cached 
    var startPos, endPos;
    for(var i=0; i<this._cache_wordpos.length; i++){  // loop over the words positions
      startPos = this._cache_wordpos[i];  // start position of word
      endPos = this._cache_wordpos[i] + this.lineText.slice(this._cache_wordpos[i]).indexOf(' '); // end position of word(index of space after word)
      // if the cursor is at the start of the word, or points to any character of it
      if(this._cache_wordpos[i] == cursor_pos || (cursor_pos < endPos && cursor_pos > startPos)) {
        return i; // return word number
      }
    }
    return -1;  // return -1 if no word found
  },
  /**
    Get the word number where the cursor points. 
  */
  /*wordAtCaret: function(cursor_pos) {
    if(!this._cache_wordpos) this.words();
    for(var i=0; i<this._cache_wordpos.length; i++){
      if(this._cache_wordpos[i] == cursor_pos){
        return i;
      }
    }
    return -1;
  },*/
   /* wordNumber: function(cursor_pos) {
      if(!this._cache_wordpos) this.words();
      for(var i=0; i<this._cache_wordpos.length; i++){
        if(!/\s/.test(this.lineText.charAt(cursor_pos-1)) && !/\s/.test(this.lineText.charAt(cursor_pos+1)) && this._cache_wordpos[i] < cursor_pos && (this._cache_wordpos[i+1] && this._cache_wordpos[i+1] > cursor_pos)){
          return i;
        }
      }
      return -1;
    },*/
   /*  maxLength: function(){
        return this._rtrim(this.lineText).length;
    },*/
  /**
  * This currently not being used but might be transformed to find another type of chunk method
  */
  /*chucks: function(){
      var line = this.lineText;
      var len = line.length;
      var i,chr,lastCharSpace=true;
      var wordPositions = [];

      if(len==0 || this._trim(line)=='') return false;

      for(i = 0 ; i < len ; i++){
          chr = line.charAt(i);

          if(chr != ' ' && lastCharSpace){
              wordPositions.push(i);
              lastCharSpace = false;
          }else if(chr==' '){
              lastCharSpace = true;
          }else{
              lastCharSpace = false;
          }
      }

      return wordPositions;
  },*/
  /*to_ratio:function(value){
      return Math.round(this.ratio * value);
    },
    
    ratio_substring:function(initial, end){
      return this.lineText.substring( this.to_ratio(initial), !isNaN(end)?this.to_ratio(end):this.lineText.length);
    },*/
    /*prev_word_ix:function(cursor_pos){
      if(!this._cache_wordpos) this.words();
      for(var i=this._cache_wordpos.length-1; i>=0; i--){
        if(this._cache_wordpos[i] < cursor_pos){
          return i;
        }
      }
      return -1;
    },*/

    /*next_word_ix:function(cursor_pos){
      if(!this._cache_wordpos) this.words();
      for(var i=0; i<this._cache_wordpos.length; i++){
        if(this._cache_wordpos[i] > cursor_pos){
          return i;
        }
      }
      return -1;
    },*/
    /*raw_substring:function(initial, end){
      return this.lineText.substring( initial, !isNaN(end)?end:this.lineText.length);
    },*/
    /**
    * This create a [start position, stop position] array list for every word in a line of text.
    * This is used to caclulate stuff
    */
    /*wordIndex: function(){
    	var line = this.lineText;
      var len = line.length;
      var wordIdx = [];

    	var findWordStart = function(start){
    		var i,chr,lchr=false,llchr=false;
    		for(i = start; i < len; i++){
    			chr = line.charAt(i);
    			if(!lchr) lchr = (i-1)>=0 ? line.charAt(i-1) : false;
    			if(!llchr) llchr = (i-2)>=0 ? line.charAt(i-2) : false;
    			if( !( /\s/.test(chr) ) && ( lchr == ' ' || /\s/.test(lchr) ) && llchr != '-'){
    				return i;
    			}
    			llchar = lchr;
    			lchr = chr;
    		}
    		return false;
    	};
    	var findWordEnd = function(start){
    		var i,chr,fchr=false;
        for(i = start; i < len; i++){
          chr = line.charAt(i);
          fchr = (i+1)<len ? line.charAt(i+1) : false;
    			if( !(/\s/.test(chr)) && chr != '-' && /\s/.test(fchr) ){
    				return i;
    			}
    		}
    		return false;
    	};

    	var i,start,end;
    	for(i = 0; i < len; i++){
    		start = findWordStart(i);
    		if(start!==false){
    			end = findWordEnd(start);
    			if(end!==false){
    				wordIdx.push([start,end]);
            i = end;
    			}else{
    				wordIdx.push([start,len]);
    				break;
    			}
    		}else{
    			break;
    		}
    	}
    	return wordIdx;
    },*/
  /**
    * This function can be used to see if i chunk can be move. if it can it will return a position to move chunk or false
    * 
    * @param {string} Current Line Text
    * @param {int} Cursor position
    * @param {string} Direction: 'b' for back and 'f' for forward.
    */
    /*moveChunk: function(curline,pos,direction){
        var wordPos = this._cache_wordpos || this.wordPositions();
        var beforePos = 0,i=0;
        var dir = direction || 'b';

        if(this._trim(this.text)==''){
            //console.log("string empty");
            return false;
        }
        if(!(wordPos instanceof Array) || wordPos.length < 1){
            //console.log("wordpos fail check");
            return false;
        }

        if(pos < this.maxLength()){
            while(wordPos[i] < pos && i < wordPos.length) i++;
        }else{
            //console.log("pos greater string");
            return false;
        }

        if(dir=='b'){
        	beforePos = wordPos[i-1];

	        if(this._trim(curline.substring(beforePos,pos))==''){
	            return beforePos;
	        }else{

	            var wlen = this._rtrim( curline.substring(0,pos) ).length;

	            if(wlen>0){
	                //console.log("back word");
	                return wlen+1;
                }
            }
        }else{
        	//TODO CHECK FORWARD MOVE.
        	return false;
        }
            
        
        return false;
        
    },*/
    /**
   * Trims whitespace from before and after string
   *
   * @param {string} str
   * @return {string}
   */
  //_trim: function(str){
    //  if(typeof str != 'string') return str;
      //var str = str.replace(/^\s\s*/, ''),
        //      ws = /\s/,
          //    i = str.length;
      //while (ws.test(str.charAt(--i)));
      //return str.slice(0, i + 1);
  //},
});
