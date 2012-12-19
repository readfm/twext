var OneLine = Class({
  value: "",            // Oneline value
  text: "",             // Text part
  textTwext: "",            // text with twext
  nN: null,             // n:N alignment notation, n is twext word number, N is text word number
  newLine: false,       // Detect is the oneline is a new one, not saved in storage yet.
  LINE_MARK: "  ",       // Line separator, 2 spaces
  ROW_MARK: "        ",  // Row separator, 8 spaces

  /**
    Initialize class attributes.
  */
  initialize: function(str) {
    if(str != "") {
      var oneLineValues = this.extractOneLineValues(str);
      this.value = str;
      this.text = oneLineValues[0];
      this.textTwext = oneLineValues[1];
      this.nN = oneLineValues[2];
    }
    return this;
  },

  /**
    Extract text, twext and nN values from oneline string.
  */
  extractOneLineValues: function(str) {
    var textTmp = "", twextTmp = "", textTwextTmp = "", arr, re, textLines, twextLines, nNTmp = new Array();
    arr = str.split(this.ROW_MARK);  // 8 spaces.
    re = new RegExp(this.LINE_MARK, 'g');  // 2 spaces.
    textTmp = arr[0].replace(re, "\n");
    twextTmp = arr[1].replace(re, "\n");
    textLines = textTmp.split('\n');
    twextLines = twextTmp.split('\n');
    re = /\d+\:\d+/;
    for(i=0; i<textLines.length; i++) {
      textTwextTmp += textLines[i] + "\n";
      matchIndex = twextLines[i].search(re);
      textTwextTmp += twextLines[i].substring(0, matchIndex-1) + "\n";  // -1 to remove the last space.
      nNTmp.push(twextLines[i].slice(matchIndex));
    }
    textTwextTmp = textTwextTmp.substring(0, textTwextTmp.length-1);
    return [textTmp, textTwextTmp, nNTmp];
  },

  /**
    Return text.
  */
  getText: function() {
    return this.text;
  },

  /**
    Set text, and update oneline value.
  */
  setText: function(text) {
    var textTwext = "";
    var textLines = text.split('\n');
    var textTwextLines = this.textTwext.split('\n');
    for(i=0; i<textLines.length; i++) {
      textTwext += textLines[i] + '\n' + textTwextLines[i+1] + '\n';
    }
    textTwext = textTwext.substring(0, textTwext.length-1); // Remove last \n
    this.text = text;
    this.textTwext = textTwext;
    var twext = this.value.split(this.ROW_MARK)[1];
    this.value = text.replace(/\n/g, this.LINE_MARK) + this.ROW_MARK + twext;
  },

  /**
    Return textTwext.
  */
  getTextTwext: function() {
    return this.textTwext;
  },

  /**
    Set textTwext, and update oneline value
  */
  setTextTwext: function(textTwext) {
    var i, j, text = "", twext = "", value = "", re;
    var lines = textTwext.split('\n');
    for(i=0, j=0; i<lines.length, j<this.nN.length; i=i+2, j++) {
      text += lines[i] + this.LINE_MARK;
      twext += lines[i+1] +  " " + this.nN[j] + this.LINE_MARK;
    }
    text = text.substring(0, text.length-2);  // -2 to remove last 2 spaces
    twext = twext.substring(0, twext.length-2); // -2 to remove last 2 spaces
    re = new RegExp(this.LINE_MARK, 'g');
    this.text = text.replace(re, '\n');
    this.textTwext = textTwext;
    this.value = text + this.ROW_MARK + twext;
  },

  /**
    Return the value of nN array.
  */
  getnN: function() {
    return this.nN;
  },

  /**
    Return the value of oneline
  */
  getValue: function() {
    return this.value;
  },

  /**
    Check if it is a new line.
  */
  isNewLine: function() {
    return this.newLine;
  },

  /**
    Set newLine.
  */
  setNewLine: function(newLine) {
    this.newLine = newLine;
  }
});