/**
* This class is used to do handle one line of text
* @author Josev
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
  * Get or Set the text value for this line of text. 
  * @param 'text' the string value of the line
  * @return the line text value
  */
	text: function(text) {
    if(text) {
      this.lineText = text;  // set line text
      this._cache_wordpos = false;  // reset cached wordpos
    }
    return this.lineText; // return the line text value
  },

  /**
  * Get all words start positions in a line of text.
  * @return Array of words start positions
  */
  words: function() {
    // If there are cached positions, then return them; else calulate the positions
    if(this._cache_wordpos) return this._cache_wordpos; // return cached positions
    var words = strWordsIndices(this.lineText);
    this._cache_wordpos = words;  // cache words positions
    return words;
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
  wordAtCaret: function(cursor_pos) {
    return TwextUtils.wordAtCaret(this.lineText, cursor_pos);
  }
});
