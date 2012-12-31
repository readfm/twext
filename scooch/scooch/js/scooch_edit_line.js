
/**
* This class is used to do handle one line of text
*/
window.ScoochEditorLine = Class.$extend({
	
	__init__: function(lineText, ratio){
		this.lineText = lineText;
		this.ratio = ratio?ratio:1;
//    	this.lineNum = num || false;
//    	this.cursor = cursor || false;
    	this._cache_wordpos = false;
	},

    /**
    * Get or Set the text for this line of text
    * 
    * @param {string} the line text (optional)
    * @return {string} the line text
    */
	text: function(str){
        if(str && typeof str == 'string'){
            this.lineText = str;
            this._cache_wordpos = false;
        }
        return this.lineText;
    },

    /**
    * set or get the line number for this line of text
    */
    lineNumber: function(line){
        if(line) this.lineNum = line;
        return this.lineNum;
    },

    /**
     * Trims whitespace from before and after string
     *
     * @param {string} str
     * @return {string}
     */
    _trim: function(str){
        if(typeof str != 'string') return str;
        var str = str.replace(/^\s\s*/, ''),
                ws = /\s/,
                i = str.length;
        while (ws.test(str.charAt(--i)));
        return str.slice(0, i + 1);
    },


    maxLength: function(){
        return this._rtrim(this.lineText).length;
    },

    /**
    * This currently not being used but might be transformed to find another type of chunk method
    */
    chucks: function(){
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
    },

    /**
    * This finds all work start positions in a line of text. This function understand syllables chunks
    *
    * @return {Array} Array of start positions
    */
    words: function(){
      if(this._cache_wordpos)
        return this._cache_wordpos;
        var line = this.lineText;
        var len = line.length;
        var i,chr,lastCharSpace=true,t;
        var wordPositions = [];

        if(len==0 || this._trim(line)=='') return false;

        for(i = 0 ; i < len ; i++){
            chr = line.charAt(i);
            if( !(/\s/.test(chr))  && lastCharSpace){
                t = i - 2;
                lastCharSpace = false;
                if(t < 0 || line.charAt(t) != '-'){
                    wordPositions.push(i);
                }
            }else {
                lastCharSpace = /\s/.test(chr);
            }
        }
        this._cache_wordpos = wordPositions;
        return wordPositions;
    },

    prev_word_ix:function(cursor_pos){
      if(!this._cache_wordpos) this.words();
      for(var i=this._cache_wordpos.length-1; i>=0; i--){
        if(this._cache_wordpos[i] < cursor_pos){
          return i;
        }
      }
      return -1;
    },

    next_word_ix:function(cursor_pos){
      if(!this._cache_wordpos) this.words();
      for(var i=0; i<this._cache_wordpos.length; i++){
        if(this._cache_wordpos[i] > cursor_pos){
          return i;
        }
      }
      return -1;
    },

    next_word_pos:function(cursor_pos){
      if(!this._cache_wordpos) this.words();
      for(var i=0; i<this._cache_wordpos.length; i++){
        if(this._cache_wordpos[i] > cursor_pos){
          return this._cache_wordpos[i];
        }
      }
      return -1;
    },
    
    to_ratio:function(value){
      return Math.round(this.ratio * value);
    },
    
    ratio_substring:function(initial, end){
      return this.lineText.substring( this.to_ratio(initial), !isNaN(end)?this.to_ratio(end):this.lineText.length);
    },

    raw_substring:function(initial, end){
      return this.lineText.substring( initial, !isNaN(end)?end:this.lineText.length);
    },

    /**
    * This create a [start position, stop position] array list for every word in a line of text.
    * This is used to caclulate stuff
    */
    wordIndex: function(){
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
    },

    /**
    * This function can be used to see if i chunk can be move. if it can it will return a position to move chunk or false
    * 
    * @param {string} Current Line Text
    * @param {int} Cursor position
    * @param {string} Direction: 'b' for back and 'f' for forward.
    */
    moveChunk: function(curline,pos,direction){
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
        
    }

});
