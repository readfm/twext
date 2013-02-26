

ScoochAreaError = function (message) {  
    this.name = "MyError";  
    this.message = message || "Scooch Area Error";  
}
ScoochAreaError.prototype = new Error();
ScoochAreaError.prototype.name = "ScoochAreaError";
ScoochAreaError.prototype.constructor = ScoochAreaError;


window.trim_ = function(str){
   if(typeof str != 'string') return str;
   var str = str.replace(/^\s\s*/, ''),
           ws = /\s/,
           i = str.length;
   while (ws.test(str.charAt(--i)));
   return str.slice(0, i + 1);
};

window.rtrim_ = function(str){
    return str.replace(/\s+$/,"");
};

window.pad_ = function( input, pad_length, pad_string, pad_type ) {
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
};

window.rpad_ = function(str, length, padString) {
    while (str.length < length)
        str = str + padString;
    return str;
};


window.ScoochArea = Class.$extend({
	
	__init__: function(area){
		this.area = area;
		this.text_lines = new Array();
		this.caret_coord = null;
		this.ignore_BR = false;
    this.lines_chunks = {}; // The chunks of the current language, key/value array contains line number with n:N chunks. The key is the text line number, the value is a key/value array contains nN chunks in the form of {key: n, value: N}
    this.language = 0; // The current language number
    this.version = 0; // The current version number
    this.languages = [];
    this.versions = [];
    this.lang_chunks = {}; // key/value array contains language with its chunks. The key is the language number, the value is its chunks.
    this.cached_formatted_chunks = false;
    this.firebaseRef = "https://readfm.firebaseio.com/foo";
    this.lang_abrs = {"French": "fr", "Italian": "it", "Spanish": "es", "English": "en"};  // key/value array contains lang name/abreviation
    this.savedLines = [];
    this.oldText = "";

    $(area).bind("keydown","space",$.proxy(this.onSpace,this));
   	$(area).bind("keydown",'backspace',$.proxy(this.onBackspace,this));
    $(area).bind("keydown",'delete',$.proxy(this.onDelete,this));
    $(window).bind("resize", $.proxy(this.realign, this));
    $(window).bind("beforeunload", $.proxy(this.save, this)); // Attach refresh/close window event
	},

  /**
    Realign chunks on resize.
  */
  realign: function() {
    var aligner = new SpanAligner();
    aligner.align($(this.area), this.getFormattedChunks());
  },

  /**
    Save chunks and edits of lines, this is called on window close or refresh.
  */
  save: function() {
    this.saveData(this.language, this.version, this.savedLines, this.area.innerText);
  },

  /**
    Put chunks nNs key/value arrays in a normal arrays to be sent to span aligner.
  */
  getFormattedChunks: function() {
    if(this.cached_formatted_chunks) return this.cached_formatted_chunks;
    var nN = new Array();
    var chunks = {};
    for(var key in this.lines_chunks) { // key is the line number
      nN = new Array();
      for(var key1 in this.lines_chunks[key].chunks) {
        nN.push(key1+":"+this.lines_chunks[key].chunks[key1]);
      }
      chunks[key] = nN;
    }
    this.cached_formatted_chunks = chunks;
    return chunks;
  },

  /**
    Put nN key/value array into n:N pair string.
  */
  constructChunksString: function(chunks) {
    var nN = "";
    for(var key in chunks) {
      nN += key+":"+chunks[key] + " ";
    }
    return nN.substring(0, nN.length-1);  // Remove the last space
  },

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
    Load saved chunks.
  */
  loadChunks: function(languages) {
    var i, j, k;
    for(i=0; i<languages.length; i++) {
      if(!this.lang_chunks[i]) {
        this.lang_chunks[i] = {versions:{}};
      }
      this.languages[i] = this.lang_abrs[languages[i].language];
      for(j=0; j<languages[i].versions.length; j++) {
        if(!this.lang_chunks[i].versions[j]) {
          this.lang_chunks[i].versions[j] = {};
        }
        this.versions[j] = languages[i].versions[j].version;
        for(k=0; k<languages[i].versions[j].data.lines.length; k++) {
          if(!this.lang_chunks[i].versions[j][k*2]) {
            this.lang_chunks[i].versions[j][k*2] = {isChanged: false, chunks:{}};
          }
          if(languages[i].versions[j].data.lines[k]) {
            this.lang_chunks[i].versions[j][k*2].chunks = this.formatnNPairs(languages[i].versions[j].data.lines[k].chunks); // k*2 to save line number after adding twexts
          }
        }
      }
    }
  },

  /**
    Construct key/value array of nN pairs from string.
  */
  formatnNPairs: function(str) {
    var formatted = {};
    if(str) {
      var nNs = str.split(' ');
      var i, tmp = "";
      for(i=0; i<nNs.length; i++) {
        tmp = nNs[i].split(':');
        formatted[tmp[0]] = tmp[1];
      }
    }
    return formatted;
  },

  /**
    Update the current chunks when language change.
  */
  setCurrentChunks: function() {
    this.lines_chunks = (this.lang_chunks[this.language] && this.lang_chunks[this.language].versions[this.version])?this.lang_chunks[this.language].versions[this.version]:{};
    this.cached_formatted_chunks = false;
  },

  /**
    Return a deep copy of the object.
  */
  /*copyObj: function(obj) {
    return $.extend(true, {}, obj);
  },*/

  /**
    Save chunks and edits of lines into firebase.
  */
  saveData: function(lang, ver, savedLines, text) {
    var i, j, saveTwexts = false, saveChunks = false, words = null, line = "", currentTwext = "", savedTwext = "", nNValue = "", data = null;
    text = cleanText(text);
    var textLines = text.split('\n');
    var theLanguage = this.languages[lang];
    var theVersion = this.versions[ver];
    var chunksLines = this.lang_chunks[lang].versions[ver];
    for(i=0,j=0; i<textLines.length; i=i+2,j++) { // i is the index of textLines (0,1,2,3..), j is the index of savedLines(1,2,4...)
      // Get firebase entry (text line)
      words = textLines[i]?getWords(textLines[i]):null; // Get words of the text line
      line = words?$.trim(words.join('-')):null; // Get the text line with the format of firebase entries

      // Prepare to save twexts
      currentTwext = textLines[i+1].replace(/\ +/g, ' '); // get the current twext, remove any extra spaces that may be put to align
      savedTwext = savedLines[j].value;
      if(currentTwext != savedTwext) {
        console.log("Save twext into firebase....");
        saveTwexts = true;
        savedLines[j].value = currentTwext;
      } else {
        saveTwexts = false;
      }

      // Prepare to save chunks
      saveChunks = chunksLines[i].isChanged;
      nNValue = saveChunks?this.constructChunksString(chunksLines[i].chunks):"";

      // Save data
      if(line) {
        if(saveTwexts && saveChunks) {
          data = {nN: nNValue, value: currentTwext};
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion).set(data);
          this.lang_chunks[lang].versions[ver][i].isChanged = false;
        } else if(saveTwexts && !saveChunks) {
          this.lang_chunks[lang].versions[ver][i].chunks = {};
          data = {nN: "", value: currentTwext};
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion).set(data);
        } else if(!saveTwexts && saveChunks) {
          new Firebase(this.firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion+"/nN").set(nNValue);
          this.lang_chunks[lang].versions[ver][i].isChanged = false;
        }
      }
    }
    return savedLines;
  },

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

    /**
    Takes html content, identifies #text nodes and appends it on "lines" array.
    Each element in "lines" represents a text line, null values represent empty lines.
    It reads only DIV and SPAN, BR, and #text elements for nesting, new lines and content
    as it corresponds; other elements are discarded. 
    */
    parse_text_lines: function(nodes, lines){
      this.ignore_BR = false;
      this.parse_text_sub(nodes, lines);
    },
    
    parse_text_sub: function(nodes, lines){
      var type;
      var index = 0;
      var nodes_length = nodes.length;
      
      for(; index < nodes_length; index++ ){
        type = nodes[index].nodeName;
        switch( type ){
          case "DIV":
            this.ignore_BR = false;
          case "SPAN":
            //inspecting children for DIV and SPAN
            this.parse_text_sub( nodes[index].childNodes, lines );
            break;
          case "BR":
            if(!this.ignore_BR) lines.push( null );
            this.ignore_BR = false;
            break;
          case "#text":
            //pending to strip-out new-lines
            lines.push( this.ignore_BR? lines.pop() + nodes[index].nodeValue:nodes[index].nodeValue );
            this.ignore_BR = true;
            break;   
        }
      }
    },
    
    /**
    TODO: Put this method to the test.
    */
    count_previous_lines: function(parent_node, current_node){
      var breaks = 0;
      var start = true;
      var old = null;
      if(current_node==null){
        if(parent_node!=null){
          current_node = parent_node.lastChild || parent_node;
        }
        else{
          return 0;
        }
      }
      do{  
        while(current_node!= null){
          if(current_node.nodeName == "BR"){
            if(!start) breaks++;
            start = false;
          }
          if(current_node.nodeName == "DIV"){
            var this_breaks = start? 0:this.count_previous_lines(current_node, null);
            if(this_breaks==0) this_breaks = 1;
            breaks+=this_breaks;
          }
          if(current_node.nodeName == "SPAN"){
            breaks += this.count_previous_lines(current_node, null);
          }
          start = false;
          old = current_node;
          current_node = current_node.previousSibling;
        }
        start = false;
        old = old.parentNode;
        if(old == parent_node || old == null) break;
        /*
        try{
          if(current_node.nodeName == "DIV" && breaks == 0)
            breaks = 1;
        }catch(e){
          alert("this AN error : " + e);
        }
        */
        //old = current_node;
        current_node = old.previousSibling;
      }while(true);
      return breaks;
    },

    getCaretPos: function(){
      var node = window.getSelection().focusNode;
      var focus_offset = window.getSelection().focusOffset;
      var node_index = 0;
      //mozilla fix
      if(node == this.area){
        try{
          node = node.childNodes[focus_offset];
        }catch(e){}
        focus_offset = 0;
      }
      else{
        node_index = this.count_previous_lines(this.area, node);
      }
      return { lines:node_index, offset:focus_offset };
    },


    /**
     * Function to manually set the caret position.
     */
    setCaretPos: function(line_index, offset){

      var child_focus = 0;
      var focus_now = this.area.children[child_focus];
      while(child_focus < line_index && focus_now.nextSibling != null){
        if(focus_now.nodeName != "SPAN" && focus_now.nodeName != "#text"){
          child_focus++;
        }
        focus_now = focus_now.nextSibling;
      }
      var caret_range = document.createRange();
      try{
        if( focus_now.childNodes.length > 0 ) focus_now = focus_now.childNodes[0];
      }
      catch(e){ 
        console.log("Sorry: " + e); console.log("- area::" + this.area);
       }
      caret_range.setStart( focus_now, offset);
      caret_range.setEnd( focus_now, offset);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange( caret_range );


    },

    /**
    * Return index of first line on the current pair.
    */
    getPairIndex: function(lines, current_line){
      var index_empty = current_line - 1;
      while(index_empty >= 0){
        if( lines[index_empty] == null ) break;
        index_empty--;
      };
      var empty_offset = current_line - index_empty - 1;
      if(empty_offset > 0){
        var even_offset = (empty_offset % 2 == 0);
        if(even_offset && lines[current_line + 1]==null)
          return -1;
        return current_line - (even_offset?0:1);
      }
      else if(current_line  < lines.length - 1 && lines[current_line + 1]!=null){
        return current_line;
      }
      return -1;
    },
    
    nbsp_spaces:function(string){
        return string.replace(/\s/g, '&nbsp;');
    },

    render_html: function(lines){
      var index = 0;
        big = true,
        big_span = '<div class="text">',
        small_span = '<div class="twext">',
        html_lines = new Array();
      for(; index < lines.length; index++){
        if( typeof(lines[index]) == 'string' && lines[index].trim().length > 0){
          html_lines[index] = (big?big_span:small_span) + this.nbsp_spaces(lines[index]) + "</div>";//<br/>";
          big = !big;
        }
        /*else{
          html_lines[index] = "<div class=\"line-break\"></div>";
        }*/
      }
      console.log("to unbind...");
      console.log(html_lines);
      this.area.innerHTML = html_lines.join("");
    },
    
    render_update:function(event){
        this.caret_coord = this.getCaretPos();

        this.text_lines = new Array();
        this.parse_text_lines( this.area.childNodes, this.text_lines);

        this.render_html( this.text_lines );
        this.setCaretPos( this.caret_coord.lines, this.caret_coord.offset);

    },

    count_previous_blanks: function(){
      var node = window.getSelection().focusNode;
      var focus_offset = window.getSelection().focusOffset;
      var blanks = 0;
      while( focus_offset > blanks && /\s/.test( node.nodeValue.charAt(focus_offset - 1 - blanks) ) ){ blanks++; }
      return blanks;
    },

    /**
      Renumber following chunks when 'make' occurs.
    */
    renumberChunks: function(chunks, wordNum, first) {
      var newChunks = {};
      if(first) { // make in text, wordNum = N
        for(var key in chunks) {
          key = parseInt(key);
          if(chunks[key] > wordNum) {
            newChunks[key] = chunks[key]+1;
          } else {
            newChunks[key] = chunks[key];
          }
        }
      } else {  // make in twext, wordNum = n
        for(var key in chunks) {
          key = parseInt(key);
          if(key > wordNum) {
            newChunks[key+1] = chunks[key];
          } else {
            newChunks[key] = chunks[key];
          }
        }
      }
      return newChunks;
    },

    onSpace: function(event){
        this.caret_coord = this.getCaretPos();

        this.text_lines = new Array();
        this.parse_text_lines( this.area.childNodes, this.text_lines);

        var pair_index = this.getPairIndex( this.text_lines, this.caret_coord.lines);
        if(pair_index == -1) return;

        var line_1 = new ScoochEditorLine( this.text_lines[pair_index] );
        line_1.lineNumber(pair_index);
        var line_2 = new ScoochEditorLine( this.text_lines[pair_index + 1], 2 );
        line_2.lineNumber(pair_index + 1);
        var lines = new ScoochEditorLines(2);
        lines.setLine( 0, line_1);
        lines.setLine( 1, line_2);

        var caret_on_first = this.caret_coord.lines == pair_index;

        //If there is only one space, then ignore.
        if(this.count_previous_blanks() == 0 && this.caret_coord.offset > 0) {
          // Renumber chunks in case of 'make'
          var chunks = this.lines_chunks[pair_index].chunks;
          var wordNum = caret_on_first ? line_1.wordNumber(this.caret_coord.offset) : line_2.wordNumber(this.caret_coord.offset);
          if(wordNum != -1) {
            chunks = this.renumberChunks(chunks, wordNum+1, caret_on_first);
            this.lines_chunks[pair_index].chunks = chunks;
            this.cached_formatted_chunks = false;
            this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
            this.lines_chunks[pair_index].isChanged = true;
          }
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        var chunks = lines.pushChunk( caret_on_first, this.caret_coord.offset, this.lines_chunks);
        if(chunks) {
          this.lines_chunks = chunks;
          this.cached_formatted_chunks = false;
          this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
          this.lines_chunks[pair_index].isChanged = true;
        }
        this.setCaretPos( this.caret_coord.lines, lines.cursor_offset);
    },

    onBackspace: function(event){
        this.caret_coord = this.getCaretPos();

        // Check if the line is deleted
        if(this.area.childNodes[this.caret_coord.lines].nodeValue == "") {
          this.lines_chunks[this.caret_coord.lines-1] = {};  // Reset the chunks of the line when twexts is deleted.
          return;
        }

        this.text_lines = new Array();
        this.parse_text_lines( this.area.childNodes, this.text_lines);

        var pair_index = this.getPairIndex( this.text_lines, this.caret_coord.lines);
        if(pair_index == -1) return;

        var line_1 = new ScoochEditorLine( this.text_lines[pair_index] );
        line_1.lineNumber(pair_index);
        var line_2 = new ScoochEditorLine( this.text_lines[pair_index + 1], 2 );
        line_2.lineNumber(pair_index+1);
        var lines = new ScoochEditorLines(2);
        lines.setLine( 0, line_1);
        lines.setLine( 1, line_2);
        
        var caret_on_first = this.caret_coord.lines == pair_index;

        //If there is only one space, then ignore.
        if(this.count_previous_blanks() <= 0) {
          // Renumber chunks in case of 'make'
          var chunks = this.lines_chunks[pair_index].chunks;
          var wordNum = caret_on_first ? line_1.wordNumber(this.caret_coord.offset) : line_2.wordNumber(this.caret_coord.offset);
          if(wordNum != -1) {
            chunks = this.renumberChunks(chunks, wordNum+1, caret_on_first);
            this.lines_chunks[pair_index].chunks = chunks;
            this.cached_formatted_chunks = false;
            this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
            this.lines_chunks[pair_index].isChanged = true;
          }
          return;
        }

        event.stopPropagation();
        event.preventDefault();
        var chunks = lines.pullChunk( caret_on_first, this.caret_coord.offset, this.lines_chunks );
        if(chunks) {
          this.lines_chunks = chunks;
          this.cached_formatted_chunks = false;
          this.lang_chunks[this.language].versions[this.version] = this.lines_chunks;
          this.lines_chunks[pair_index].isChanged = true;
        }
        this.setCaretPos( this.caret_coord.lines, lines.cursor_offset);
    },

    /**
      Delete chunks of current lines on delete text line value.
    */
    onDelete: function(event) {
      var currentLine = this.getCaretPos().lines;
      if(this.area.childNodes[currentLine].nodeValue == "") {
        this.lines_chunks[currentLine-1] = {};  // Reset the chunks of the line when twexts is deleted.
      }
    }

})
