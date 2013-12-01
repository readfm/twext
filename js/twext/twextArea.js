/**
* This class is used to do handle area (contenteditable element) functionalities
*/
TwextArea = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
	__init__: function() {
    this.area = $('#data-show')[0]; // contenteditable div element
    this.limit = 320; // The maximum number of characters allowed to be entered in the area
    //array of all languages chunks, allChunks[lang][ver] is array, index is Text line(0,2,4..),value is key/val obj (key is n, val is N)
    this.chunks = [];
    this.language = 0;  // current language
    this.version = 0; // current version
    //this.chunks = []; // current language/version chunks, index is Text line(0,2,4..), value is key/val obj of n:N of the line(key is n, val is N)
    this.aligner = new SpanAligner(); // Aligner object to align chunks/timings using spans
  },

  /**
  * Ensure that the area is not over limit.
  * Stop typing event if the number of characters reachs the limit, the key code represents a typing character
  * @param 'charCode' typed character code
  */
  adjustLimit: function(charCode) {
    var text = this.value();
    if(this.textMode() == "textOnly" && isTypingChar(charCode) && text.length >= this.limit) {
      event.stopPropagation(); // Stop the bubbling of key press event to parent elements
      event.preventDefault(); // prevent the key press action from happening.
      return false; // text is over limit
    }
    return true;  // text not over limit
  },

  /**
  * Realign chunks/timings of current displayed language/version.
  */
  realign: function() {
    var mode = this.textMode();
    if(mode == "twext" || mode == "timing") {  // if twext lines are displayed
      this.aligner.align(this.area, this.getnNs()); // align chunks with span aligner
    }
  },

  /**
  * Realign chunks/timings of specified line pair.
  * @param 'textLine' text line number
           'pairLine' twext/timing line number
  */
  realignPair: function(textLine, pairLine) {
    var mode = this.textMode();
    if(mode == "twext") this.aligner.alignChunks(this.area, textLine, pairLine, this.getnNs()[textLine]);
    else if(mode == "timing") this.aligner.alignTimings(this.area, textLine, pairLine);
  },

  /**
  * Hide area.
  */
  hide: function() {
    $(this.area).hide();
  },

  /**
  * Show area.
  */
  show: function() {
    $(this.area).show();
  },

  /**
  * Reformat chunks of all lines from the form key/value array to the form of "n:N" string array.
  * @return array of n:N strings, index is the Text line number; e.g: nNs[0] = ["1:1", "2:2", ...]
  */
  getnNs: function() {
    var i, nN, nNs = [];
    if(this.chunks[this.language]) {
      var chunks = this.chunks[this.language][this.version];
      if(chunks) {
        for(i=0; i<chunks.length; i=i+2) { // loop over lines
          nN = TwextUtils.chunksTonN(chunks[i]); // reformat chunks of this Text line to be in the form of "n:N" string array
          nNs[i] = nN;  // set the chunks of this line to the formated chunks
        }
      }
    }
    return nNs; // return nNs array of all lines, index is the Text line number
  },

  /**
  * Add language/version chunks to chunks obj(cache chunks for faster usage).
  * Put chunksStr in array form(in the form of this.chunks obj) and set it to allChunks with the given lang/ver.
  * @param 'lang' language number
           'ver' version number
           'chunks' array contains chunks, index is text line(0, 1, 2....), value is n:N pairs string "1:2 3:4..."
  */
  loadToAllChunks: function(lang, ver, chunks) {
    if(!chunks) return;
    //chunksArr.clean();

    var i, lineChunks = [], chunksArr = [], nNs = {};
    for(var j=0;j<chunks.length;j++) {  // loop on Text lines chunks
      if(chunks[j] && chunks[j].length > 0) {
        lineChunks = chunks[j].split(' ');  // chunks of Text line
        for(i=0; i<lineChunks.length; i++) {  // loop on chunks pairs of lines
          t = lineChunks[i].split(':');
          n = t[0]; // get small sized word number
          N = t[1]; // get big sized word number
          nNs[n] = N; // add pair, key = n, value = N
        }
        chunksArr[j*2] = nNs;  // set nNs array of Text line
      } else {
        chunksArr[j*2] = {};
      }
    }
    // initialize chunks arrays
    if(!this.chunks[lang]) this.chunks[lang] = [];
    if(!this.chunks[lang][ver]) this.chunks[lang][ver] = [];

    this.chunks[lang][ver] = chunksArr;  // set chunks of lang, ver
  },

  /**
  * Set current language/version chunks.
  * @param 'lang' current language
           'ver' current version
  */
  /*setCurrentChunks: function(lang, ver) {
    var c = this.allChunks[lang]?this.allChunks[lang][ver]:null;  // get chunks of given language/version
    this.chunks = c?c:[];
  },*/

  /**
  * Update current lang/ver chunks in allChunks obj before switching to other language.
  */
  /*updateAllChunks: function(lang, ver) {
    if(!this.allChunks[lang]) {
      this.allChunks[lang] = [];
    }
    this.allChunks[lang][ver] = this.chunks;
  },*/

  /**
  * Get Text only displayed in the area.
  * Loop over childNodes of the area, collect text content of each node. Using this way instead of getting the whole innerText or textContent (even if textonly is displayed) provides a safe way of getting the area value when the area is hidden.
  * Using "textContent" over "innerText" saves time because innerText needs information from the layout to determine how the text is presented to the user, in addition to that innerText is not standard and not supported in all browsers.
  * @return Text only of the area.
  */
  text: function() {
    var lines = [], i;
    var nodes = this.area.childNodes; // area child nodes
    for(i=0; i<nodes.length; i++) { // loop over area childnodes
      if(nodes[i].className == "text") lines.push(nbsp_to_spaces(nodes[i].textContent));  // push text line
    }
    return lines.join('\n');  // return text string
  },

  /**
  * Get Twext/Timing lines displayed in the area.
  * Using "textContent" over "innerText" saves time because innerText needs information from the layout to determine how the text is presented to the user, in addition to that innerText is not standard and not supported in all browsers.
  * @return Twext/Timings displayed in the area.
  */
  smallText: function(clazz) {
    var lines = [], i;
    var nodes = this.area.childNodes; // area child nodes
    for(i=0; i<nodes.length; i++) { // loop over area childnodes
      if(nodes[i].className == clazz) lines.push(nbsp_to_spaces(nodes[i].textContent));  // push text line
    }
    return lines.join('\n');  // return text string
  },

  /**
  * Get input value displayed in the area.
  * Loop over childNodes of the area, collect text content of each node. Using this way instead of getting the whole innerText or textContent (even if textonly is displayed) provides a safe way of getting the area value when the area is hidden.
  * Using "textContent" over "innerText" saves time because innerText needs information from the layout to determine how the text is presented to the user, in addition to that innerText is not standard and not supported in all browsers.
  * @return Text only of the area.
  */
  value: function() {
    var lines = [], i;
    var nodes = this.area.childNodes; // area child nodes
    for(i=0; i<nodes.length; i++) { // loop over area childnodes
      lines.push(nbsp_to_spaces(nodes[i].textContent));  // push line value
    }
    return lines.join('\n');  // return text string
  },

  /**
  * Get the original text before syllabification, align, play.
  * @param 'text' text to cleared
  * @return cleared text
  */
  clearText: function(text) {
    if(this.textMode() == "timing") {
      text = controller.syllabifier.unsyllabifyText(text);
    }
    text = text.replace(/\ +/g, ' '); // unalign
    return text;
  },

  /**
  * Check if the area is visible.
  * @return true if visible, false if not
  */
  isVisible: function() {
    return $(this.area).is(":visible");
  },

  /**
  * Get the current display mode.
  * @return the current display mode (twext, timing or textonly)
  */
  textMode: function() {
    if($('.twext').length > 0) return 'twext';
    else if($('.timing').length > 0) return 'timing';
    else return 'textonly';
  },

  /**
  * Disable typing on the area.
  */
  disable: function() {
    $(this.area).attr('contenteditable', false);  // disable area editing
  },

  /**
  * Enable typing on the area.
  */
  enable: function() {
    $(this.area).attr('contenteditable', true);  // enable area editing
  },

  /**
  * Display TEXT lines as html content in the area
  * @param 'lines' TEXT lines to be displayed
  */
  renderLines: function(lines) {
    var index, html_lines = new Array();

    for(index=0; index < lines.length; index++) { // loop over lines
      if(typeof(lines[index]) == 'string' && lines[index].trim().length > 0) {  // if line is not empty
        html_lines[index] = '<div class="text">' + spaces_to_nbsp(lines[index]) + "</div>";
      }
    }
    console.log("rendering TEXT lines...");
    console.log(html_lines);
    this.area.innerHTML = html_lines.join("");  // display html
  },

  /**
  * Display paired(text/twext, text/timing ...) lines as html content in the area
  * @param 'lines' paired lines to be displayed
  */
  renderPairedLines: function(lines, smallClass){
    var index, big = true, html_lines = new Array();
    var small_class = smallClass?smallClass:"twext";
    var big_span = '<div class="text">';  // Text line div element
    var small_span = '<div class="'+small_class+'">'; // Twext line div element

    for(index=0; index < lines.length; index++) { // loop over lines
      if(typeof(lines[index]) == 'string' && lines[index].trim().length > 0) {  // if line is not empty
        html_lines[index] = (big?big_span:small_span) + spaces_to_nbsp(lines[index]) + "</div>";
        big = !big; // first big (Text) and second small (Twext) to create a pair
      }
    }
    console.log("rendering paired lines...");
    console.log(html_lines);
    this.area.innerHTML = html_lines.join("");  // display html
  },

  /**
  * Count the number of previous lines of current node.
  * If the current node is null, then count the previous lines of last child of parent node; if last child is null, then count previous lines of parent node. If both current and parent nodes are null, then return 0 (no count of previous lines for a null node)
  * If node type is BR, then increment previous lines count, move to previous sibling.
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
      while(current_node != null) {  // loop over previous nodes till reach to null node (no more previous siblings)
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

    if(node == this.area) { // if focus node is the area (cursor at begining of the text), then line index and cursor offset are 0s (mozilla fix)
      try {
        node = node.childNodes[focus_offset];
      } catch(e){}
      focus_offset = 0; // cursor position is 0
    } else {
      node_index = this.count_previous_lines(this.area, node);  // count previous lines to get the number of the current line
    }
    return { lines:node_index, offset:focus_offset }; // return line index and cursor position in the line
  },

  /**
   * Set the caret position manually.
   * To move the caret to a specific position: create range, set its start/end to the required node/offset where the cursor will move, add the range to window selection
   * @param 'line' the index of the line where the cursor should be
            'offset' the index in the line where the cursor should point
   */
  setCaretPos: function(line, offset){
    var child_focus = 0;  // counter for lines
    var focus_now = this.area.children[child_focus];  // first child
    while(child_focus < line && focus_now.nextSibling != null) {  // loop over area children to find the reguired node
      // increment lines counter only if the node is not a secondry node (span or text), cos line is represented by <div> node
      if(focus_now.nodeName != "SPAN" && focus_now.nodeName != "#text") { // is a main node (line is represented by a <div> node)
        child_focus++;  // increment counter
      }
      focus_now = focus_now.nextSibling;  // move to next sibling
    }

    try {
      // get the #text node; if focus_now has childnodes (not #text) then get the childnode (#text node)
      if(focus_now.childNodes.length > 0) focus_now = focus_now.childNodes[0];
    } catch(e){ 
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
  * Takes html content, identifies #text nodes and appends it on "lines" array.
  * Each element in "lines" represents a text line, null values represent empty lines.
  * It reads only DIV and SPAN, BR, and #text elements for nesting, new lines and content as it corresponds; other elements are discarded.
  * TODO:This method is under test; many changes have been made, should be altered if not matching code updates.
  * @author 'Josev'
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
          this.parse_text_sub(nodes[index].childNodes, lines );  // inspecting children for DIV and SPAN
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
  * Return index of first line on the current pair (Text line of Text/Twext pair)
  * The algorithm: Get the index of empty line before the current pair, if no one found then the index is -1
                   empty_offset is egual to current line "case1"(incase of no empty line before current pair), or equal to current line - index of line before empty(line before empty represents Text line, and empty line represents Twext line) "case2"
                   If empty_offset is even (case1 means current line is even "Text line"; case2 means difference between current line and line before empty (represents Text line) is even, means both are same type(Text or Twext), then current line is also Text), then return current line
                   If empty_offset is odd (case1 mean current line is odd "Twext line"; case2 means difference between current line and line before empty (represents Text line) is odd, means ther are in different type(Text or Twext), then current line is Twext), then return current line -1
                   If empty_offset <= 0 (empty line is before current, then current is Text), return current line
  * TODO: this method is under test
  * @author 'Josev'
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
  * Renumber following chunks when number of line words changes (Make case).
  * Number of line words is increased (by 1) if 'space' is pressed within a word, divided the word into two words "Make"
  * Chunks after the current word (word at cursor) must be updated to handle those two cases (incremented/decremented by 1)
  * @param 'first' boolean to detect if the current line is Text or Twext, true if current line is Text.
           'wordNum' the current word at cursor, start index is 1
           'line' Text line index
  */
  renumberChunks: function(first, wordNum, line) {
    if(!this.chunks[this.language] || !this.chunks[this.language][this.version]) return;

    var newChunks = {}, chunkWord;
    var chunks = this.chunks[this.language][this.version][line];  // current line chunks
    if(first) { // Cursor in Text line, wordNum = N (chunks[key])
      for(var key in chunks) {  // loop over current line chunks
        chunkWord = parseInt(chunks[key]);  // Get integer value of the chunks[key]
        if(chunkWord >= wordNum) { // if following chunk
          newChunks[key] = chunkWord+1; // increment word N
        } else {  // not a following chunk
          newChunks[key] = chunkWord; // copy word N without change
        }
      }
    } else {  // Cursor in Twext line, wordNum = n
      for(var key in chunks) {  // loop over current line chunks
        chunkWord = parseInt(key);  // Get integer value of the key
        if(chunkWord >= wordNum) { // if following chunk
          newChunks[chunkWord+1] = chunks[key]; //increment word n
        } else {  // not a following chunk
          newChunks[chunkWord] = chunks[key]; // copy word n without change
        }
      }
    }
    this.chunks[this.language][this.version][line] = newChunks; // set updated chunks
  },

  /**
  * This method is called when a 'space' key is pressed.
  * Push chunk to next word when space key is pressed.
  * @param 'event' space key down event
  */
  pushChunk: function(event) {
    if(this.textMode() != "twext") return; // if no twext displayed, return

    var caret_coord = this.getCaretPos();  // Get cursor coordinates (line number, position in the line)

    this.text_lines = new Array();  // initialize text_lines object
    this.parse_text_lines(this.area.childNodes, this.text_lines);  // Get the area text lines, put them in text_lines object

    var pair_index = this.getPairIndex(this.text_lines, caret_coord.lines); // Get index of first line of the Text/Twext pair (Text line index)
    if(pair_index == -1) return;  // return if no Text line index found

    var textLine = new ScoochEditorLine(this.text_lines[pair_index]); // Create ScoochEditLine object for the Text line
    textLine.lineNumber(pair_index);  // Set its line number
    var twextLine = new ScoochEditorLine(this.text_lines[pair_index + 1]); // Create ScoochEditLine object for the Twext line
    twextLine.lineNumber(pair_index + 1);  // Set its line number (the line after Text)

    // Put the two lines into ScoochEditorLines object
    var scoochLines = new ScoochEditorLines(this.area);
    scoochLines.setLines([textLine, twextLine]);

    // boolean to detect whether cursor on Text line or Twext line, true if cursor on Text
    var caret_on_first = caret_coord.lines == pair_index;  // If line where cursor positioned = pair_index(Text line), then cursor on Text line

    var currentLine = this.text_lines[caret_coord.lines]; // line at cursor where chunk is moved
    //If char before and at cursor is not space,then space is pressed within a word,divide it into two words "Make case", renumber following chunks
    if(caret_coord.offset > 0 && !/\s/.test(currentLine.charAt(caret_coord.offset)) && !/\s/.test(currentLine.charAt(caret_coord.offset-1))) {
      // Make case, words numbers after cursor are changed, renumber following chunks to correct words numbers in the chunks
      var wordIx = TwextUtils.wordAtCaret(currentLine, caret_coord.offset); // word at cursor
      if(wordIx != -1) {
        this.renumberChunks(caret_on_first, wordNum+1, pair_index); // @TODO in save method, update allChunks object with new chunks
      }
      return; // return, no push chunk in case of one space only
    }

    // Stop the bubbling of space key press event to parent elements
    event.stopPropagation();
    // prevent the space key press action from happening.
    event.preventDefault();

    // push chunk to next word
    if(!this.chunks[this.language]) this.chunks[this.language] = [];
    if(!this.chunks[this.language][this.version]) this.chunks[this.language][this.version] = [];
    var chunks = scoochLines.pushChunk(caret_on_first, caret_coord.offset, this.chunks[this.language][this.version][pair_index]);
    if(chunks) {
      this.chunks[this.language][this.version][pair_index] = chunks;
    }
    this.setCaretPos(caret_coord.lines, scoochLines.cursor_offset); // set cursor position to new position after push chunk
  },

  /**
  * This method is called when a 'backspace' key is pressed.
  * Pull chunk to previous word when backspace key is pressed.
  * @param 'event' backspace key down event
  */
  pullChunk: function(event) {
    if(this.textMode() != "twext") return; // if no twext displayed, return

    var caret_coord = this.getCaretPos();  // Get cursor coordinates (line number, position in the line)

    this.text_lines = new Array();  // initialize text_lines object
    this.parse_text_lines(this.area.childNodes, this.text_lines);  // Get the area text lines, put them in this.text_lines object

    var pair_index = this.getPairIndex(this.text_lines, caret_coord.lines);//Get index of first line of the Text/Twext pair (Text line index)
    if(pair_index == -1) return;  // return if no Text line index found

    var textLine = new ScoochEditorLine(this.text_lines[pair_index]); // Create ScoochEditLine object for the Text line
    textLine.lineNumber(pair_index);  // Set its line number
    var twextLine = new ScoochEditorLine(this.text_lines[pair_index + 1]);  // Create ScoochEditLine object for the Twext line
    twextLine.lineNumber(pair_index+1);  // Set its line number

    // Put the two lines into ScoochEditorLines object
    var lines = new ScoochEditorLines(this.area);
    lines.setLines([textLine, twextLine]);

    var currentLine = this.text_lines[caret_coord.lines];  // line where cursor is positioned
    var previousSpaces = countPreviousSpaces(currentLine, caret_coord.offset);

    // If cursor is at line start (or whole line is selected and removed) or at end of a word, return, no pull
    if(caret_coord.offset == 0 || previousSpaces == 0) return;

    // Stop the bubbling of space key press event to parent elements
    event.stopPropagation();
    // prevent the space key press action from happening.
    event.preventDefault();

    // If only one space before word, return without line text change(not applying the backspace key press), no pull on one space
    if(previousSpaces == 1 && !/\s/.test(currentLine.charAt(caret_coord.offset))) return;

    // boolean to detect whether cursor on Text line or Twext line, true if cursor on Text
    var caret_on_first = caret_coord.lines == pair_index; //If line where cursor positioned = pair_index(Text line), then cursor on Text line

    // pull chunk to previous word
    if(!this.chunks[this.language]) this.chunks[this.language] = [];
    if(!this.chunks[this.language][this.version]) this.chunks[this.language][this.version] = [];
    var chunks = lines.pullChunk(caret_on_first, caret_coord.offset, this.chunks[this.language][this.version][pair_index]);
    if(chunks) {
      this.chunks[this.language][this.version][pair_index] = chunks;
    }
    this.setCaretPos(caret_coord.lines, lines.cursor_offset); // set cursor position to new position after pull chunk
  }
});