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
  * Realign timings.
  */
  realign: function() {
    var mode = this.textMode();
    if(mode == "timing") {  // if twext lines are displayed
      this.aligner.align(this.area); // align timings with span aligner
    }
  },

  /**
  * Realign timings of specified line pair.
  * @param 'textLine' text line number
           'pairLine' twext/timing line number
  */
  realignPair: function(textLine, pairLine) {
    var mode = this.textMode();
    if(mode == "timing") this.aligner.alignTimings(this.area, textLine, pairLine);
  },

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
  * Get the current display mode.
  * @return the current display mode (twext, timing or textonly)
  */
  textMode: function() {
    if($('.timing').length > 0) return 'timing';
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
  * Display paired(text/timing) lines as html content in the area
  * @param 'lines' paired lines to be displayed
  */
  renderPairedLines: function(lines, smallClass){
    var index, big = true, html_lines = new Array();
    var small_class = smallClass?smallClass:"timing";
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
  }
});