var SpanAligner = Class({
  /**
    Initialize class attributes.
  */
  initialize: function() {
    return this;
  },

  /**
    Align text/twext rows in the input element.
    Params: 'textEl' the contenteditable element.
            'nNs' key/value array contains nNs for each text/twext pair. The key is the text line number, the value is nN array.
  */
  align: function(textEl, nNs) {
    var i;
    textEl.html(cleanHtml(textEl.html()));
    for(i=0; i<textEl[0].childNodes.length; i=i+2) {
      if(textEl[0].childNodes[i].innerHTML == '<br>') {
        i--;
        continue;
      }
      this.alignChunks(textEl, i, i+1, nNs[i]?nNs[i]:[]);
    }
  },

  /**
    Align chunks in text/twext rows.
    Put N,n words in <span> and compare their left position to align chunks.
  */
  alignChunks: function(textEl, textLine, twextLine, nN) {
    var i, textNode, twextNode;
    cleanTextTwext(textEl, textLine, twextLine);    
    for(i=0; i<nN.length; i++) {
      this.alignChunk(textEl[0], textLine, twextLine, nN[i]);
    }
  },

  /**
    Align text word N and twext word n.
    Put words in <span> and compare their left position to align.
    Params: 'nN' twext/text word number in the form of n:N string.
  */
  alignChunk: function(textEl, textLine, twextLine, nN) {
    var textNode = textEl.childNodes[textLine].childNodes.length > 0 ? textEl.childNodes[textLine].childNodes[0] : textEl.childNodes[textLine];
    var twextNode = textEl.childNodes[twextLine].childNodes.length > 0 ? textEl.childNodes[twextLine].childNodes[0] : textEl.childNodes[twextLine];
    var textWords = getWords(textNode.nodeValue);
    var twextWords = getWords(twextNode.nodeValue);
    var textWordsIndices = getWordsIndices(textNode.nodeValue);
    var twextWordsIndices = getWordsIndices(twextNode.nodeValue);
    var tmp = nN.split(":");
    var n = parseInt(tmp[0]) - 1; // Twext word number
    var N = parseInt(tmp[1]) - 1; // Text word number
    // Put text word in span
    putWordInSpan(textNode, textWordsIndices[N], textWords[N], "textWord");
    // Put twext word in span
    putWordInSpan(twextNode, twextWordsIndices[n], twextWords[n], "twextWord");
    // Get words left position
    NPos = parseInt($('#textWord').position().left);
    nPos = parseInt($('#twextWord').position().left);
    if(NPos < nPos) { // Move text word
      parentEl = textNode.parentElement;
      while(NPos < nPos) {
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
      }
      // Take span value of text word and remove span tag
      removeSpanNode(parentEl, "textWord", N == 0, N == textWords.length-1);
      // Take span value of twext word and remove span tag
      removeSpanNode(textEl.childNodes[twextLine], "twextWord", n == 0, n == twextWords.length-1);
      // Check if text is moved after twext, this may occur because the text font size is bigger that twext.
      if(NPos > nPos) {
        this.alignChunk(textEl, textLine, twextLine, nN);
      }
    } else if(NPos > nPos) {  // Move twext word
      parentEl = twextNode.parentElement;
      while(NPos > nPos) {
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
      }
      // Take span value of text word and remove span tag
      if(textEl.childNodes[textLine].nodeType == 3) { // Text node (First node)
        removeSpanNode(textEl, "textWord", N == 0, N == textWords.length-1);
      } else {
        removeSpanNode(textEl.childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
      }
      // Take span value of twext word and remove span tag
      removeSpanNode(parentEl, "twextWord", n == 0, n == twextWords.length-1);
    } else {  // =
      parentEl = twextNode.parentElement;
      parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
      // Take span value of text word and remove span tag
      if(textEl.childNodes[textLine].nodeType == 3) { // Text node (First node)
        removeSpanNode(textEl, "textWord", N == 0, N == textWords.length-1);
      } else {
        removeSpanNode(textEl.childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
      }
      // Take span value of twext word and remove span tag
      removeSpanNode(parentEl, "twextWord", n == 0, n == twextWords.length-1);
    }
  }
});