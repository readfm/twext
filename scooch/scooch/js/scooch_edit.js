
/*
  This file is not used in twext, will be removed
*/

/*ScoochEditError = function (message) {  
    this.name = "MyError";  
    this.message = message || "Scooch Edit Error";  
}
ScoochEditError.prototype = new Error();
ScoochEditError.prototype.name = "ScoochEditError";
ScoochEditError.prototype.constructor = ScoochEditError;*/


//window.ScoochEdit = Class.$extend({
	
	/*__init__: function(editor){
		this.editor = editor;
    	$(editor).bind("keydown","space",$.proxy(this.onSpace,this));
    	$(editor).bind("keydown",'backspace',$.proxy(this.onBackspace,this));
	},*/

	/**
     * Insert myValue at current cursor position
     *
     * @param {String} myValue
     */
   /* insertAtCaret: function(myValue){
        var sel,editor = this.editor;

        if (document.selection) {
            editor.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
            editor.focus();
        } else if (editor.selectionStart || editor.selectionStart == '0'){
            var startPos = editor.selectionStart;
            var endPos = editor.selectionEnd;
            var scrollTop = editor.scrollTop;
            editor.value = editor.value.substring(0, startPos)+ myValue+ editor.value.substring(endPos,editor.value.length);
            editor.focus();
            editor.selectionStart = startPos + myValue.length;
            editor.selectionEnd = startPos + myValue.length;
            editor.scrollTop = scrollTop;
        }
    },*/

    /**
    * Insert value at  position. Cursor is not handled in this function
    */
  /*  insertAtPos: function(pos,value){
        var editor = this.editor;
        var val = editor.value;

        editor.value = val.substring(0,pos)+value+val.substring(pos,val.length);
    },

    removeAtCaret: function(num){
        var sel,editor = this.editor;
        var end = this.caretPos();
        var start = end - (num-1);
        var val = editor.value;

        editor.value = val.substring(0,start) + val.substring(end,val.length);
        this.caretPos(start);
        editor.focus();
    },

    removeRange: function(start,end){
        var sel,editor = this.editor;
        var val = editor.value;
        editor.value = val.substring(0,start) + val.substring(end,val.length);
        this.caretPos(start);
        editor.focus();
    },*/

    /**
     * Get editor contents
     */
  /*  value: function(text){
        if(text){
            return this.editor.value = text;
        }else{
            return this.editor.value;
        }
    },*/

    /**
    * Optionally sets caret position and then returns position
    */
   /* caretPos: function(pos){
        if(pos){
            return this._setCaretPos(pos);
        }else{
            return this._getCaretPos();
        }
    },*/

    /**
     * Get current caret position
     *
     * @return {int} Number of character to caret position
     */
    /*_getCaretPos: function(){
        var sel, editor = this.editor;
        var caretpos = 0;
        if (document.selection) {
            editor.focus();
            sel = document.selection.createRange();
            sel.moveStart ('character', -editor.value.length);
            caretpos = Sel.text.length;
        }else if (editor.selectionStart || editor.selectionStart == '0'){
            caretpos = editor.selectionStart;
        }
        return caretpos;
    },*/

    /**
     * Function to manually set the caret position.
     *
     * @param {int} pos Number of characters to put Caret starting from beginning of string.
     */
   /* _setCaretPos: function(pos){
        var sel, editor = this.editor;
        if(editor.setSelectionRange){
            editor.focus();
            editor.setSelectionRange(pos,pos);
        }else if(editor.createTextRange){
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
        return pos;
    },*/

    /**
     * Normalize the line breaks. For counting chars I need to make sure all string are using "\n" type of line breaks.
     *
     * @param string
     */
   /* _normalize_linebreaks: function(string){
        return string.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    },*/

    /**
     * Get the current line where the caret is positioned
     *
     * @return {int} Line number. Starting at 1.
     */
    /*getLinePos: function(){
        var caretpos = this.caretPos();
        var value = this.editor.value;
        var sub;

        if(caretpos >= value.length){
            sub = value;
        }else{
            sub = value.substring(0,caretpos);
        }
        return this._normalize_linebreaks(sub).split("\n").length;
    },*/

    /**
     * Gets the line number, caret position on that line starting from beginning of line, and the line text.
     *
     * @return {Array}
     */
    /*getLineCaretPos: function(doSub){
        var caretpos = this.caretPos();
        var value = this._normalize_linebreaks(this.editor.value);
        if(caretpos >= value.length){
            sub = value;
        }else{
            sub = value.substring(0,caretpos);
        }
        var line = sub.split("\n").length;

        var i,pcount=0;

        for(i=0;i<caretpos;i++){
            if(value.charAt(i) == "\n"){
                pcount=0;
            }else{
                pcount++;
            }
        }

        return doSub ? [line,pcount,value.split("\n")[line-1]] : [line,pcount];
    },*/

    /**
    * Get start position of line
    */
    /*getLineStartPos: function(line){
        
        if(line==0) return 0;

        var caretpos = this.caretPos();
        var value = this._normalize_linebreaks(this.editor.value);
        var i,lineCount=0;


        for(i=0;i<value.length;i++){
            if(value.charAt(i)=="\n"){
                lineCount++;
                if(lineCount==line) return i+1;
            }
        }

        return false;
    },*/

    /**
     * Gets the stating position of each word for a line and return it in an Array of numbers
     *
     * @param {int} line Line Number
     */
    /*getLineWordPositions: function(line){
        var s = new ScoochEditorLine(line);
        return s.wordPositions();
    },*/

    /**
     * Get the text for the previous line. This is used to quickly grab the previous line and calculate word positions.
     *
     * @param {int} line Line Number
     * @return {string} the text for the previous line
     */
    /*getPreviousLine_old: function(line){
        if(line < 2) return false;
        var value = this._normalize_linebreaks(this.editor.value);
        return value.split("\n")[line-2];
    },*/

    /**
     * This is a helper function that gets the word start positions from the previous line.
     *
     * @param {int} line Optional, the line number. if not given, will use current line.
     */
   /* getWordPositionsForPreviousLine: function(line){
        var cline = line || this.getLinePos();
        return this.getLineWordPositions(this.getPreviousLine(cline));
    },*/


    /**
    * Improved get line functions
    * 
    * @param {int} The current line number
    * @param {bool} If you know this is the current line set this to true so it adds line number and cursor position.
    * @return {ScoochEditorLine} Return ScoochEditorLine object with text set.
    */
   /* getLine: function(line,isCurrent){
        var value = this._normalize_linebreaks(this.editor.value);
        var lines = value.split("\n");
        if(line > lines.length) throw new ScoochEditError("can't get line that does not exist");
        var line = new ScoochEditorLine(lines[line-1]);
        
        if(isCurrent){
            var pos = this.getLineCaretPos();
            if(pos){
                line.cursorPos(pos[1]);
                line.lineNumber(pos[0]);
            }
        }
        
        return line;
    },*/

    /**
    * Gets current line and returns ScoochEditorLine object
    */
    /*getCurrentLine: function(){
        var pos = this.getLineCaretPos();
        if(!pos) throw new ScoochEditError("Can't get current line");
        var value = this._normalize_linebreaks(this.editor.value);
        var lines = value.split("\n");
        if(pos[0] > lines.length) throw new ScoochEditError("can't get line that does not exist");
        var line = ScoochEditorLine(lines[pos[0]-1]);
        line.cursorPos(pos[1]);
        line.lineNumber(pos[0]);
        return line;
    },*/

    /**
    * Get a line pair starting at startLine param and the next line.
    *
    * @param {int} the first line in the pair.
    * @return {Array} array of ScoochEditorLine objects.
    */
    /*getLinePair: function(startLine){
        var value = this._normalize_linebreaks(this.editor.value);
        var lines = value.split("\n");
        if(startLine > lines.length) throw new ScoochEditError("can't get line that does not exist");
        var line1 = new ScoochEditorLine(lines[startLine-2]);
        var line2 = new ScoochEditorLine(lines[startLine-1]);

        console.log(lines[startLine-2]);
        console.log(lines[startLine-1]);

        line2.lineNumber(--startLine);
        line1.lineNumber(--startLine);
        var lines = new ScoochEditorLines();
        lines.setLine(0,line1);
        lines.setLine(1,line2);
        return lines;
    },



    //-------------- New Command System to Run Caculation. Needs count to line function --------------------

    run: function(cmds,line){
        
        var i,len = cmds.length,sp=0;
        if(line) --line;

        for(i=0;i<len;i++){
            
            switch(cmds[i].cmd){
                case 'add':
                    this._cmd_add(cmds[i],line);
                    break;
                case 'remove':
                    this._cmd_remove(cmds[i],line);
                    break;
                case 'cursor':
                    if(cmds[i].move) this.caretPos(this.caretPos()+cmds[i].move);
                    if(cmds[i].linePos){
                        sp = this.getLineStartPos(cmds[i].line || line);
                        sp = sp + cmds[i].linePos;
                        this.caretPos(sp);
                    }
                    if(cmds[i].pos) this.caretPos(cmds[i].pos);
                    break;
            }
        }
          
    },

    _cmd_add: function(cmd,line){
        console.log("line: "+line);
        var sp = this.getLineStartPos(cmd.line || (line));
        sp = sp + cmd.pos;
        var c = cmd.chr || ' ';
        var buff = '';
        while(cmd.length--) buff=buff+c;
        this.insertAtPos(sp,buff);
    },

    _cmd_remove: function(cmd,line){
        var sp = this.getLineStartPos(cmd.line || line);
        sp = sp + cmd.pos;
        this.removeRange(sp,sp+cmd.length);
    },*/

    //---------------------------------------------------------------------------------------------------------

    /**
     * This function is called everytime the space bar is used. If there is more then one space it looks
     * at previous line to see if it can jump to the next word start.
     */
   /* onSpace: function(event){
        var count = 0;
        var i = 1;
        var editor = this.editor;
        while( editor.value.charAt(this.caretPos()-i) == ' ' ){ count++;i++; }

        //If there is only one space, then ignore.
        if(count<1) return;

        var pos = this.getLineCaretPos();
        if(pos[0]==0) return;

        var lines = this.getLinePair(pos[0]);

        var cmds = lines.pushChunk(1,pos[1],0);

        //if(cmds === 0 || cmds === -1) return;

        if(typeof cmds == 'object'){
            console.log("do cmds");
            console.log(cmds);
            event.stopPropagation();
            event.preventDefault();
            this.run(cmds,pos[0]);
        }
    },

    onBackspace: function(event){
        var count = 0;
        var i = 1;
        var editor = this.editor;
        var val = editor.value;

        while( val.charAt(this.caretPos()-i) == ' ' ){ count++;i++; }

        if(count<2) return;

        var pos = this.getLineCaretPos();
        if(pos[0]==0) return;

        var lines = this.getLinePair(pos[0]);

        var cmds = lines.pullChunk(1,pos[1],0);

        console.log([1,pos[1],0]);
        console.log(cmds);

        if(typeof cmds == 'object'){
            event.stopPropagation();
            event.preventDefault();
            this.run(cmds,pos[0]);
        }
    }
*/
//})