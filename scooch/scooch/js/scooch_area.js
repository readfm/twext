/**
* This class is used to do handle area (contenteditable element) functionalities
*/
window.ScoochArea = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  * @param 'area' the contenteditable element
  */
	__init__: function(area){
		this.area = area; // contenteditable element
		this.text_lines = new Array(); // the Text/Twext lines values
		this.caret_coord = null;  // object contains two elements: the line number(key=lines), cursor position in the line(key=offset)
    this.firebaseRef = "https://readfm.firebaseio.com/foo"; // firebase readfm server url
    /*
      lang_chunks is an array of languages,index is language number; each element is a key/value object contains two elements: language, versions
      language is a string represents language name
      versions is an array, index is version number; each element is a key/value object contains two elements: version, lines
      version is a string represents version name
      lines is an array, index is Text line number; each element is a key/value object contains two elements: chunksChanged, chunks
      chunksChanged is boolean to detect whether the line text has been modified or not
      chunks is a key/value object contains Text/Twext chunks; key=n "Twext word number", value=N "Text word number"; start index is 1
    */
    this.lang_chunks = [];
    this.language = 0; // The current language number
    this.version = 0; // The current version number
    this.lang_codes = lang_names_codes;  // key/value array contains lang name/abbreviation(eg: {"French": "fr", "Italian": "it", "Spanish": "es"})
    this.orgLines = []; // The unchanged text lines (either loaded from gtranslate or firebase)
    this.ignore_BR = false; // boolean to ignore new lines, set to true when needing to append node values into one value

    // TODO
    //this.cached_nNs = false;
    //this.lines_chunks = {}; // The chunks of the current language, key/value array contains line number with n:N chunks. The key is the text line number, the value is a key/value array contains nN chunks in the form of {key: n, value: N}
    //this.languages = [];
    //this.versions = [];
    //this.lang_chunks = {}; // key/value array contains language with its chunks. The key is the language number, the value is its chunks.
    //this.cached_formatted_chunks = false;
    //End TODO zone

    // Attach area key events
    $(area).bind("keydown","space",$.proxy(this.onSpace,this)); // space key down event
   	$(area).bind("keydown",'backspace',$.proxy(this.onBackspace,this)); // backspace key down event
    $(area).bind("keydown",'delete',$.proxy(this.onDelete,this)); // delete key down event
    // Attach window key events
    $(window).bind("resize", $.proxy(this.realign, this));  // window resize event
    $(window).bind("beforeunload", $.proxy(this.save, this)); // refresh/close window event
	},

  /**
  * Realign chunks on window resize using span aligner.
  */
  realign: function() {
    var aligner = new SpanAligner();
    aligner.align($(this.area), this.getnNs()); // align chunks with span aligner
  },

  /**
  * Reformat chunks of all lines from the form key/value array to the form of "n:N" string array.
  * @return array of n:N strings, index is the Text line number; e.g: nNs[0] = ["1:1", "2:2", ...]
  */
  getnNs: function() {
    // If there are cached chunks, then return them; else calulate the chunks
    //if(this.cached_nNs) return this.cached_nNs; // return cached nNs
    var i, nN, nNs = [];
    var lines = this.lang_chunks[this.language].versions[this.version].lines; // lines of the current language/version
    for(i=0; i<lines.length; i=i+2) { // loop over lines
      nN = this.getnN(lines[i].chunks); // reformat chunks of this Text line to be in the form of "n:N" string array
      nNs[i] = nN;  // set the chunks of this line to the formated chunks
    }
    //this.cached_nNs = nNs;  // set the cached nNs
    return nNs; // return nNs array of all lines, index is the Text line number
  },

  /**
  * Reformat chunks of Text/Twext lines from the form key/value array to the form of "n:N" string array
  * @param 'chunks' the chunks of the current Text/Twext lines pair.
  * @return array of n:N strings e.g: ["1:1", "2:2"...]
  */
  getnN: function(chunks) {
    var nN = new Array();
    for(var key in chunks) {  // Loop over chunks key/value array
      nN.push(key+":"+chunks[key]); // Put n,N in the form of n:N string and push it to the array
    }
    return nN;  // return array of n:N strings
  },

  /**
  * Save chunks and edits of lines into firebase db.
  * This method is called on window close or refresh(instead of direct call to saveData for any future need of event paramater)
  */
  save: function() {
    this.saveData(this.language, this.version, this.orgLines, this.area.innerText);
  },

  /**
  * Load chunks(either from gtranslate or firebase) into the lang_chunks object.
  * @param 'languages' object carry chunks of all languages/versions
  */
  loadChunks: function(languages) {
    var i, j, k;
    for(i=0; i<languages.length; i++) { // loop over languages
      if(!this.lang_chunks[i]) {  // if this language is not yet loaded
        this.lang_chunks[i] = {language: this.lang_codes[languages[i].language], versions:{}};
      }
      //this.languages[i] = this.lang_abrs[languages[i].language];
      for(j=0; j<languages[i].versions.length; j++) { // loop over versions of this language
        if(!this.lang_chunks[i].versions[j]) {  // if this version is not yet loaded
          this.lang_chunks[i].versions[j] = {version: languages[i].versions[j].version, lines:[]};
        }
        //this.versions[j] = languages[i].versions[j].version;
        for(k=0; k<languages[i].versions[j].lines.length; k=k+2) { // loop over lines
          if(!this.lang_chunks[i].versions[j].lines[k]) { // if this line is not yet loaded
            this.lang_chunks[i].versions[j].lines[k] = {chunksChanged: false, chunks:{}};
          }
          if(languages[i].versions[j].lines[k]) {  // if there are chunks for this line
            // get chunks in the form of key/value object and set it to the line chunks; k*2 represents the Text line number
            this.lang_chunks[i].versions[j].lines[k].chunks = this.getChunks(languages[i].versions[j].lines[k].chunks.toArray(' '));
          }
        }
      }
    }
  },

  /**
  * Reformat chunks of Text/Twext lines from the form of "n:N" string array to the form of key/value array
  * @param 'chunks' the chunks of the current Text/Twext lines pair in the form of string array eg: ["1:1", "2:2",..]
  * @return key/value array of chunks; key=n, value=N
  */
  getChunks: function(nNs) {
    var chunks = {}, i, tmp = "";
    if(nNs.length > 0) {  // if there are chunks
      for(i=0; i<nNs.length; i++) { // loop over nNs
        tmp = nNs[i].split(':');  // get n, N
        chunks[tmp[0]] = tmp[1];  // add chunk
      }
    }
    return chunks;  // return key/value chunks
  },

  /**
  * Save chunks and edits of lines into firebase.
  * @param 'lang' the language number
            'ver' the version number
            'orgLines' the unchanged text lines (array contains Twexts, index = Text line number); 
            'text' the changed text(Text/Twext lines array) to be saved (won't be saved if not changed)
  * @return 'orgLines' after update
  */
  saveData: function(lang, ver, orgLines, changedText) {
    var i, saveTwexts = false, saveChunks = false, words = null, line = "", changedTwext = "", orgTwext = "", nNString = "";

    changedText = cleanText(changedText); // clean text from html characters
    var changedLines = changedText.split('\n'); // get changed text lines
    // Get the language code; lang is language number, this.lang_chunks[lang].language is the language name
    var theLanguage = this.lang_chunks[lang].language; // the langugage code, eg: fr, en, it...
    // Get the version name
    var theVersion = this.lang_chunks[lang].versions[ver].version;  // the version name, eg: 1-0, 2-0,...
    var chunksLines = this.lang_chunks[lang].versions[ver].lines;
    for(i=0; i<changedLines.length; i=i+2) { //i is counter for lines (i=Text line number)
      // Prepare to save twexts
      changedTwext = changedLines[i+1].replace(/\ +/g, ' '); // get the Twext value, remove any extra spaces that may be added for alignment
      orgTwext = orgLines[i].value; // original twext (value before changing)
      if(changedTwext != orgTwext) {  // twext has been changed
        console.log("Save twext into firebase....");
        saveTwexts = true;  // save this twext
        orgLines[i].value = changedTwext; // update the orgLines with the new Twext value
      } else {  // Twext not changed
        saveTwexts = false; // do not save this twext
      }

      // Prepare to save chunks
      saveChunks = chunksLines[i].chunksChanged;  // chunks has been changed
      nNString = saveChunks?this.getnN(chunksLines[i].chunks).join(' '):""; // get chunks string, eg: "1:1 2:2 3:3"
      orgLines[i].chunks = saveChunks?nNString:orgLines[i].chunks; // update the orgLines chunks with the new chunks

      // Get firebase entry (Text line words separated by -)
      words = changedLines[i]?getStrWords(changedLines[i]):null; // Get words of the Text line
      line = words?$.trim(words.join('-')):null; // Text line in the format of firebase entries(words separated by -)

      // Save data
      if(line) {  // Available firebase entry (Text line)
        if(saveTwexts && saveChunks) {  // save twexts and chunks
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion).set({nN: nNString, value: changedTwext}); // firebase save request
          this.lang_chunks[lang].versions[ver].lines[i].chunksChanged = false;  // chunks are saved, reset chunksChanged
        } else if(saveTwexts && !saveChunks) {  // save twexts and not chunks
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion+"/value").set(changedTwext);  // firebase save request
        } else if(!saveTwexts && saveChunks) {  // save chunks and not twexts
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion+"/nN").set(nNString);
          this.lang_chunks[lang].versions[ver].lines[i].chunksChanged = false;  // chunks are saved, reset chunksChanged
        }
      }
    }
    return orgLines;  // return orgLines after updates
  },

  /**
  * Takes html content, identifies #text nodes and appends it on "lines" array.
  * Each element in "lines" represents a text line, null values represent empty lines.
  * It reads only DIV and SPAN, BR, and #text elements for nesting, new lines and content as it corresponds; other elements are discarded.
  * TODO:This method is under test; many changes have been made, should be altered if not matching code updates.
  * @param 'nodes' contenteditable element childnodes
            'lines' empty array to be filled with lines text values
  */
  parse_text_lines: function(nodes, lines){
    this.ignore_BR = false; // initially, consider all new lines (nodes)
    this.parse_text_sub(nodes, lines); // start adding nodes text values
  },

  /**
  * The same as parse_text_lines; separated because of recursion calls.
  * ignore new lines (ignore_BR=true) only when the node type is #text, cos when moving to next node, and its type is #text, will append its value to the previous node (ignore it being a new line and consider it as a part of the previous node value), and so with the next nodes.
  * @param 'nodes' element childnodes
            'lines' array to be filled with lines text values
  */
  parse_text_sub: function(nodes, lines){
    var type, index;
    var nodes_length = nodes.length;  // length of nodes

    for(index=0; index < nodes_length; index++) { // loop over childnodes
      type = nodes[index].nodeName; // get the node type
      switch(type) {  // switch on node type
        case "DIV": // <div> element
          this.ignore_BR = false; // div element, consider new lines, recursive call to the method with div childnodes (no break, jump to next case)
        case "SPAN":
          this.parse_text_sub( nodes[index].childNodes, lines );  // inspecting children for DIV and SPAN
          break;
        case "BR":  // empty line
          if(!this.ignore_BR) lines.push( null ); // push null if considering BR
          this.ignore_BR = false;
          break;
        case "#text": // #text node
          //pending to strip-out new-lines
          lines.push(this.ignore_BR?lines.pop()+nodes[index].nodeValue:nodes[index].nodeValue);//push value(append to pre val if pre line is #text)
          this.ignore_BR = true;  // to merge consecutive text nodes values
          break;   
      }
    }
  },
    
  /**
  * Count the number of previous lines of current node.
  * If the current node is null, then count the previous lines of last child of parent node; if last child is null, then count previous lines of parent node. If both current and parent nodes are null, then return 0 (no count of previous lines for a null node)
  * If node type is BR, then increment previous lines count, move to previous sibliing.
  * If node type is DIV or SPAN, then count previous lines of its last child(#text) and add it to lines count (breaks).
  * If node type is #text or any other type, move to previous sibling, if it's null, move to previous sibling of parent.
  * TODO:This method is under test.
  * @param 'parent_node' the parent node of the current node
           'current_node' the current node
  * @return number of the previous nodes (lines)
  */
  count_previous_lines: function(parent_node, current_node) {
    var breaks = 0; // number of previous lines, initially 0
    var start = true; // boolean represents initial state
    var old = null;
    if(current_node == null) {  // if current node is null
      if(parent_node != null) { // if parent node is not null
        current_node = parent_node.lastChild || parent_node;//set current to last child of parent,if last child is null then set current to parent
      } else {  // both current and parent nodes are null, then return 0 (no counting of previous lines of null)
        return 0;
      }
    }
    // Count number of previous lines of current node
    do { // loop over previous nodes till reach to parent node or no more nodes to go through
      while(current_node!= null) {  // loop over previous nodes till reach to null node (no more previous siblings)
        if(current_node.nodeName == "BR") { // empty line
          if(!start) breaks++;  // increment lines count if it's not at the start (start state is the current node, not counted)
          //start = false;
        }
        if(current_node.nodeName == "DIV") {  // <div> element
          var this_breaks = start? 0:this.count_previous_lines(current_node, null); // count previous lines of last child of current node(#text)
          if(this_breaks == 0) this_breaks = 1;
          breaks+=this_breaks;  // add this count to breaks
        }
        if(current_node.nodeName == "SPAN"){  // <span> element
          breaks += this.count_previous_lines(current_node, null);  // count previous lines of last child of current node(#text)
        }
        start = false;
        old = current_node;
        current_node = current_node.previousSibling;  // move to previous sibling
      } // current node is null, move to its parent
      start = false;
      old = old.parentNode;
      if(old == parent_node || old == null) break;  // end of count, reached to parent node or no more previous nodes
      /*
      try{
        if(current_node.nodeName == "DIV" && breaks == 0)
          breaks = 1;
      }catch(e){
        alert("this AN error : " + e);
      }
      */
      //old = current_node;
      current_node = old.previousSibling; // move to previous sibling of current node parent
    } while(true);
    return breaks;  // return count
  },

  /**
  * Get the caret position.
  * @return key/value object contains two elements:'line number' where cursor positioned and position 'index' in the line where the cursor points
  */
  getCaretPos: function() {
    var node = window.getSelection().focusNode; // Get node where the cursor positioned
    var focus_offset = window.getSelection().focusOffset; // Get the index in the line where the cursor points
    var node_index = 0;

    if(node == this.area) { // if focus node is the whole contenteditable div, then line index and cursor offset are 0s (mozilla fix)
      try {
        node = node.childNodes[focus_offset];
      } catch(e){}
      focus_offset = 0; // cursor position is 0
    }
    else {
      node_index = this.count_previous_lines(this.area, node);  // count previous lines to get the number of the current line
    }
    return { lines:node_index, offset:focus_offset }; // return line index and cursor position in the line
  },

  /**
   * Set the caret position manually.
   * To move the caret to a specific position: create range, set its start/end to the required node/offset where the cursor will move, add the range to window selection
   * @param 'line_index' the index of the line where the cursor should be
            'offset' the index in the line where the cursor should point
   */
  setCaretPos: function(line_index, offset){
    var child_focus = 0;  // counter for lines
    var focus_now = this.area.children[child_focus];  // first child
    while(child_focus < line_index && focus_now.nextSibling != null) {  // loop over area children to find the reguired node
      // increment lines counter only if the node is not a secondry node (span or text), cos line is represented by <div> node
      if(focus_now.nodeName != "SPAN" && focus_now.nodeName != "#text") { // is a main node (line is represented by a <div> node)
        child_focus++;  // increment counter
      }
      focus_now = focus_now.nextSibling;  // move to next sibling
    }

    try {
      // get the #text node; if focus_now has childnodes (not #text) then get the childnode (#text node)
      if(focus_now.childNodes.length > 0) focus_now = focus_now.childNodes[0];
    }
    catch(e){ 
      console.log("Sorry: " + e); console.log("- area::" + this.area);
    }

    var caret_range = document.createRange(); // create range
    // Set range start and end to the required node/offset for the cursor to be positioned
    caret_range.setStart( focus_now, offset);
    caret_range.setEnd( focus_now, offset);
    // get window selection
    var selection = window.getSelection();
    selection.removeAllRanges();  // reset selection range
    selection.addRange(caret_range);  // Add the caret range to window selection
  },

  /**
  * Return index of first line on the current pair (Text line of Text/Twext pair)
  * The algorithm: Get the index of empty line before the current pair, if no one found then the index is -1
                   empty_offset is egual to current line "case1"(incase of no empty line before current pair), or equal to current line - index of line before empty(line before empty represents Text line, and empty line represents Twext line) "case2"
                   If empty_offset is even (case1 means current line is even "Text line"; case2 means difference between current line and line before empty (represents Text line) is even, means both are same type(Text or Twext), then current line is also Text), then return current line
                   If empty_offset is odd (case1 mean current line is odd "Twext line"; case2 means difference between current line and line before empty (represents Text line) is odd, means ther are in different type(Text or Twext), then current line is Twext), then return current line -1
                   If empty_offset <= 0 (empty line is before current, then current is Text), return current line
  * @param 'lines' text lines in the area
           'current_line' line index where the cursor is positioned
  * @return first line index (Text line) of the current pair (Text/Twext)
  */
  getPairIndex: function(lines, current_line) {
    var index_empty = current_line - 1;
    while(index_empty >= 0) { // loop till reach to empty line or start node
      if(lines[index_empty] == null) break; // empty line
      index_empty--;  // jump to previous line
    };
    var empty_offset = current_line - index_empty - 1;// equal current_line if no empty line found, equal current_line-index of line before empty
    if(empty_offset > 0) {
      var even_offset = (empty_offset % 2 == 0);  // is empty_offset even value
      if(even_offset && lines[current_line + 1]==null)  // if node after current (Twext) is null, return -1
        return -1;
      return current_line - (even_offset?0:1);// return current line if even, line before current if odd
    } else if(current_line  < lines.length - 1 && lines[current_line + 1]!=null) {  // if valid Text line number and Twext node not null
      return current_line;  // return current line
    }
    return -1;
  },

  /**
  * Replace any text spaces by html spaces (nbsp)
  * @param 'string' value where replace is performed
  * @return string with nbsp instead of text spaces
  */
  nbsp_spaces:function(string){
    return string.replace(/\s/g, '&nbsp;');
  },

  /**
  * Display text lines as html content in the area
  * @param 'lines' text lines to be displayed
  */
  render_html: function(lines){
    var index, big = true, html_lines = new Array();
    var big_span = '<div class="text">';  // Text line div element
    var small_span = '<div class="twext">'; // Twext line div element

    for(index=0; index < lines.length; index++) { // loop over text lines
      if(typeof(lines[index]) == 'string' && lines[index].trim().length > 0) {  // if line is not empty
        html_lines[index] = (big?big_span:small_span) + this.nbsp_spaces(lines[index]) + "</div>";
        big = !big; // first big (Text) and second small (Twext) to create a pair
      }
      /*else{
        html_lines[index] = "<div class=\"line-break\"></div>";
      }*/
    }
    console.log("to unbind...");
    console.log(html_lines);
    this.area.innerHTML = html_lines.join("");  // display html
  },

  /**
  * Count the number of spaces between the cursor position and the nonspace previous caharacter.
  */
  count_previous_blanks: function(){
    var node = window.getSelection().focusNode; // Get the focus node where the cursor is positioned
    var focus_offset = window.getSelection().focusOffset; // Get the index where the cursor points
    return countPreviousSpaces(node.nodeValue, focus_offset); // return previous spaces count
    //var blanks = 0;
    //while( focus_offset > blanks && /\s/.test( node.nodeValue.charAt(focus_offset - 1 - blanks) ) ){ blanks++; }
    //return blanks;
  },

  /**
  * Renumber following chunks when number of line words changes (add/delete word).
  * Number of line words is increased (by 1) if 'space' is pressed within a word, divided the word into two words "Make"
  * Number of line words is decreased (by 1) if 'backspace' is pressed and merged two words together.
  * Chunks after the current word (word at cursor) must be updated to handle those two cases (incremented/decremented by 1)
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'wordNum' the current word at cursor
           'chunks' chunks of current line; key=n, value=N
  */
  renumberChunks: function(first, wordNum, chunks) {
    var newChunks = {};
    if(first) { // Cursor in Text line, wordNum = N (chunks[key])
      for(var key in chunks) {  // loop over current line chunks
        chunks[key] = parseInt(chunks[key]);  // Get integer value of the chunks[key]
        if(chunks[key] > wordNum) { // if following chunk
          newChunks[key] = chunks[key]+1; // increment/decrement word N
        } else {  // not a following chunk
          newChunks[key] = chunks[key]; // copy word N without change
        }
      }
    } else {  // Cursor in Twext line, wordNum = n
      for(var key in chunks) {  // loop over current line chunks
        key = parseInt(key);  // Get integer value of the key
        if(key > wordNum) { // if following chunk
          newChunks[key+1] = chunks[key]; //increment/decrement word n
        } else {  // not a following chunk
          newChunks[key] = chunks[key]; // copy word n without change
        }
      }
    }
    return newChunks; // return updated chunk
  },

  /**
  * This method is called when a 'space' key is pressed.
  * Push chunk to next word when space key is pressed.
  * @param 'event' space key down event
  */
  onSpace: function(event) {
    this.caret_coord = this.getCaretPos();  // Get cursor coordinates (line number, position in the line)

    this.text_lines = new Array();  // initialize text_lines object
    this.parse_text_lines( this.area.childNodes, this.text_lines);  // Get the area text lines, put them in this.text_lines object

    var pair_index = this.getPairIndex( this.text_lines, this.caret_coord.lines); //Get index of first line of the Text/Twext pair (Text line index)
    if(pair_index == -1) return;  // return if no Text line index found

    var line_1 = new ScoochEditorLine(this.text_lines[pair_index]); // Create ScoochEditLine object for the Text line
    line_1.lineNumber(pair_index);  // Set its line number
    var line_2 = new ScoochEditorLine(this.text_lines[pair_index + 1]); // Create ScoochEditLine object for the Twext line
    line_2.lineNumber(pair_index + 1);  // Set its line number (the line after Text)

    // Put the two lines into ScoochEditorLines object
    var lines = new ScoochEditorLines();
    lines.setLines([line_1, line_2]);
    //lines.setLine(0, line_1);
    //lines.setLine(1, line_2);

    // boolean to detect whether cursor on Text line or Twext line, true if cursor on Text
    var caret_on_first = this.caret_coord.lines == pair_index;  // If line where cursor positioned = pair_index(Text line), then cursor on Text line
    //Get the current line object
    var line = this.lang_chunks[this.language].versions[this.version].lines[pair_index];

    //If no spaces before cursor,then space is pressed within a word,divide it into two words "Make case", following words numbers incremented by 1
    if(this.count_previous_blanks() == 0 && this.caret_coord.offset > 0) {  // no spaces before cursor
      //var chunks = line.chunks;
      //var chunks = this.lines_chunks[pair_index].chunks;
      // Make case, words numbers after cursor are changed, renumber following chunks to correct words numbers in the chunks
      var wordNum = caret_on_first ? line_1.wordNumber(this.caret_coord.offset) : line_2.wordNumber(this.caret_coord.offset); // word at cursor
      if(wordNum != -1) {
        line.chunks = this.renumberChunks(caret_on_first, wordNum+1, line.chunks);  // Renumber following chunks
        line.chunksChanged = true;  // set chunksChanged to true, this is used for saving chunks into firebase
        //this.lang_chunks[this.language].versions[this.version].lines[pair_index] = line; // update line object with the new one
        //this.lines_chunks[pair_index].chunks = chunks;
        //this.cached_formatted_chunks = false;
        //this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
        //this.lines_chunks[pair_index].chunksChanged = true;
      }
      return; // return, no push chunk in case of one space only
    }

    // Stop the bubbling of space key press event to parent elements
    event.stopPropagation();
    // prevent the space key press action from happening.
    event.preventDefault();

    var chunks = lines.pushChunk(caret_on_first, this.caret_coord.offset, line.chunks); // push chunk to next word
    if(chunks) {
      line.chunks = chunks; // set line chunks to the updated chunks
      line.chunksChanged = true;  // set chunksChanged to true, this is used for saving chunks into firebase
      //this.lang_chunks[this.language].versions[this.version].lines[pair_index] = line; // update line object with the new one
      //this.cached_formatted_chunks = false;
      //this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
      //this.lines_chunks[pair_index].chunksChanged = true;
    }
    this.setCaretPos(this.caret_coord.lines, lines.cursor_offset); // set cursor position to new position after push chunk
  },

  /**
  * This method is called when a 'backspace' key is pressed.
  * Pull chunk to previous word when backspace key is pressed.
  * @param 'event' backspace key down event
  */
  onBackspace: function(event){
    this.caret_coord = this.getCaretPos();  // Get cursor coordinates (line number, position in the line)
    // If cursor is at line start (or whole line is selected and removed) or at end of a word, return, no pull
    if(this.caret_coord.offset == 0 || this.count_previous_blanks() == 0) return;

    this.text_lines = new Array();  // initialize text_lines object
    this.parse_text_lines( this.area.childNodes, this.text_lines);  // Get the area text lines, put them in this.text_lines object

    var pair_index = this.getPairIndex(this.text_lines, this.caret_coord.lines);//Get index of first line of the Text/Twext pair (Text line index)
    if(pair_index == -1) return;  // return if no Text line index found

    var line_1 = new ScoochEditorLine( this.text_lines[pair_index] ); // Create ScoochEditLine object for the Text line
    line_1.lineNumber(pair_index);  // Set its line number
    var line_2 = new ScoochEditorLine( this.text_lines[pair_index + 1]);  // Create ScoochEditLine object for the Twext line
    line_2.lineNumber(pair_index+1);  // Set its line number

    // Put the two lines into ScoochEditorLines object
    var lines = new ScoochEditorLines();
    lines.setLines([line_1, line_2]);
    //lines.setLine( 0, line_1);
    //lines.setLine( 1, line_2);

    var currentLine = this.text_lines[this.caret_coord.lines];  // line where cursor is positioned
    // If only one space, return without line text change(not applying the backspace key press), no pull on one space
    if(this.count_previous_blanks() == 1 && !/\s/.test(currentLine.charAt(this.caret_coord.offset))) {
      // Stop the bubbling of space key press event to parent elements
      event.stopPropagation();
      // prevent the space key press action from happening.
      event.preventDefault();
      return;
    }

    // Reset chunks of the line if backspace remove all line value
    //if(this.resetChunksIfEmptyLine(caret_on_first, this.caret_coord.lines)) {
      //return; // backspace remove line value, return, no pull chunk
    //}

    //If char to delete is not a space(at cursor-1) and both chars before and after it is space,then backspace delete a word, following words numbers should be decremented by 1
    //var currentLine = this.text_lines[this.caret_coord.lines];  // line where cursor is positioned
    /*if(/\s/.test(currentLine.charAt(this.caret_coord.offset)) && !/\s/.test(currentLine.charAt(this.caret_coord.offset-1)) && /\s/.test(currentLine.charAt(this.caret_coord.offset-2))) {
      // Renumber chunks in case of word deletion
      //var chunks = this.lines_chunks[pair_index].chunks;
      var wordNum = caret_on_first?line_1.next_word_pos(this.caret_coord.offset):line_2.next_word_pos(this.caret_coord.offset);//word after cursor
      if(wordNum != -1) { // wordNum is an index(start with 0), word number should be used(start with 1)
        line.chunks = this.renumberChunks(caret_on_first, wordNum, line.chunks, -1); //wordNum without incrementing, represent word before cursor
        line.chunksChanged = true;  // set chunksChanged to true, this is used for saving chunks into firebase
        this.lang_chunks[this.language].version[this.version].lines[pair_index] = line; // update line object with the new one
        //this.lines_chunks[pair_index].chunks = chunks;
        //this.cached_formatted_chunks = false;
        //this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
        //this.lines_chunks[pair_index].chunksChanged = true;
      }
      return; // return, no pull chunk
    }*/

    // Stop the bubbling of space key press event to parent elements
    event.stopPropagation();
    // prevent the space key press action from happening.
    event.preventDefault();

    // boolean to detect whether cursor on Text line or Twext line, true if cursor on Text
    var caret_on_first = this.caret_coord.lines == pair_index; //If line where cursor positioned = pair_index(Text line), then cursor on Text line
    //Get the current line object
    var line = this.lang_chunks[this.language].versions[this.version].lines[pair_index];

    // Pull chunk
    var chunks = lines.pullChunk(caret_on_first, this.caret_coord.offset, line.chunks); // pull chunk to previous word
    if(chunks) {
      line.chunks = chunks; // set line chunks to the updated chunks
      line.chunksChanged = true;  // set chunksChanged to true, this is used for saving chunks into firebase
      //this.lang_chunks[this.language].versions[this.version].lines[pair_index] = line; // update line object with the new one
      //this.lines_chunks[pair_index].chunks = chunks;
      //this.cached_formatted_chunks = false;
      //this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
      //this.lines_chunks[pair_index].chunksChanged = true;
    }
    this.setCaretPos( this.caret_coord.lines, lines.cursor_offset); // set cursor position to new position after pull chunk
  },

  /**
  * Remove chunks of Text/Twext lines pair if current line value is removed
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'currentLine' current line index
  * @return true if chunks have been deleted, false if no reset is made(line value is not removed)
  */
  resetChunksIfEmptyLine: function(first, currentLine) {
    if(this.area.childNodes[currentLine].nodeValue == "") { // If line value is removed
      if(first) { // cursor on Text line, currentLine is Text line index
        this.lang_chunks[this.language].versions[this.version].lines[currentLine].chunks = {}; // delete line chunks
        this.lang_chunks[this.language].versions[this.version].lines[currentLine].chunksChanged = true; // for saving chunks into firebase
      } else {  // cursor on Twext line, currentLine is Twext line index, Text line is the line before Twext
        this.lang_chunks[this.language].versions[this.version].lines[currentLine-1].chunks = {}; // delete line chunks
        this.lang_chunks[this.language].versions[this.version].lines[currentLine-1].chunksChanged = true;  // for saving chunks into firebase
      }
      return true;  // Reset is done
      //this.lines_chunks[currentLine-1] = {};  // Reset the chunks of the line when twexts is deleted.
    }
    return false; // no reset
  },

  /**
  * Delete chunks of current lines pair on delete text line value.
  * @param 'event' delete key down event
  */
  onDelete: function(event) {
    var currentLine = this.getCaretPos().lines; // Get line number where cursor is positioned
    this.text_lines = new Array();  // initialize text_lines object
    this.parse_text_lines( this.area.childNodes, this.text_lines);  // Get the area text lines, put them in this.text_lines object
    var pair_index = this.getPairIndex(this.text_lines, currentLine); //Get index of first line of the Text/Twext pair (Text line index)
    if(pair_index == -1) return;  // return if no Text line index found, no reset is made
    this.resetChunksIfEmptyLine(currentLine == pair_index, currentLine);  // reset chunks of current pair if current line value is deleted
  }
});
/*render_update:function(event){
      this.caret_coord = this.getCaretPos();

      this.text_lines = new Array();
      this.parse_text_lines( this.area.childNodes, this.text_lines);

      this.render_html( this.text_lines );
      this.setCaretPos( this.caret_coord.lines, this.caret_coord.offset);

  },*/
/**
    Put nN key/value array into n:N pair string.
  */
  /*constructChunksString: function(chunks) {
    var nN = "";
    for(var key in chunks) {
      nN += key+":"+chunks[key] + " ";
    }
    return nN.substring(0, nN.length-1);  // Remove the last space
  },*/
    /**
    Update the current chunks when language change.
  */
  /*setCurrentChunks: function() {
    this.lines_chunks = (this.lang_chunks[this.language] && this.lang_chunks[this.language].versions[this.version])?this.lang_chunks[this.language].versions[this.version]:{};
    this.cached_formatted_chunks = false;
  },*/
  /**
    Apply the current chunks to all other languages at the first language switch only.
  */
  /*initLanguagesChunks: function(lCount) {
    if(this.firstLangSwitch) {
      for(var i=0; i<lCount; i++) {
        this.lang_chunks[i] = this.copyObj(this.lines_chunks);//$.extend(true, {}, this.lines_chunks);
      }
      this.firstLangSwitch = false;
    }
  },*/
  /**
    Return a deep copy of the object.
  */
  /*copyObj: function(obj) {
    return $.extend(true, {}, obj);
  },*/
  /**
    Save updated chunks into firebase db. This method is called on toggle, window refresh and window close.
  */
  /*saveChunks: function(lang, ver) {
    var line = "", words = null;
    var lines = this.lang_chunks[lang].versions[ver];
    if(this.text_lines.length > 0) {  // the text_lines are filled only when space/backspace pressed, where a chunk added/deleted
      for(var key in lines) {
        line = this.text_lines[key]?cleanText(this.text_lines[key]).replace(/\ +/g, ' '):null;
        words = line?getWords(line):null;
        line = words?$.trim(words.join('-')):null;
        if(line && lines[key].isChanged) {  // Chunks of this line is changed, save into db
          new Firebase(this.firebaseRef+"/"+line+"/"+this.languages[lang]+"/"+this.versions[ver]+"/nN").set(this.constructChunksString(lines[key].chunks));
          lines[key].isChanged = false;
        }
      }
    }
  },*/
/*ScoochAreaError = function (message) {  
    this.name = "MyError";  
    this.message = message || "Scooch Area Error";  
}
ScoochAreaError.prototype = new Error();
ScoochAreaError.prototype.name = "ScoochAreaError";
ScoochAreaError.prototype.constructor = ScoochAreaError;*/


//window.trim_ = function(str){
  // if(typeof str != 'string') return str;
   //var str = str.replace(/^\s\s*/, ''),
     //      ws = /\s/,
       //    i = str.length;
   //while (ws.test(str.charAt(--i)));
   //return str.slice(0, i + 1);
//};

/*window.rtrim_ = function(str){
    return str.replace(/\s+$/,"");
};*/

/*window.pad_ = function( input, pad_length, pad_string, pad_type ) {
    var half = '', pad_to_go;
    var str_pad_repeater = function(s, len) {
        var collect = '', i;
        while(collect.length < len){ collect += s; }
        collect = collect.substr(0,len);
        return collect;
    };
    input += '';
    if (pad_type != 'L' && pad_type != 'R' && pad_type != 'B') { pad_type = 'R'; }
    if ((pad_to_go = pad_length - input.length) > 0) {
        if (pad_type == 'L') { input = str_pad_repeater(pad_string, pad_to_go) + input; }
        else if (pad_type == 'R') { input = input + str_pad_repeater(pad_string, pad_to_go); }
        else if (pad_type == 'B') {
        half = str_pad_repeater(pad_string, Math.ceil(pad_to_go/2));
        input = half + input + half;
        input = input.substr(0, pad_length);
        }
    }
    return input;
};*/

/*window.rpad_ = function(str, length, padString) {
    while (str.length < length)
        str = str + padString;
    return str;
};*/