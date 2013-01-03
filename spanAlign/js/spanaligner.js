var SpanAligner = Class({
  /**
    Initialize class attributes.
  */
  initialize: function() {
    return this;
  },

  /**
    Align text/twext rows in the input element.
  */
  align: function(textEl) {
    var i;
    textEl.html(cleanHtml(textEl.html()));
    for(i=0; i<textEl[0].childNodes.length; i=i+2) {
      if(textEl[0].childNodes[i].innerHTML == '<br>') {
        i--;
        continue;
      }
      this.alignChuncks(textEl, i, i+1);
    }
  },

  /**
    Align chunks in text/twext rows.
    Put N,n words in <span> and compare their left position to align chunks.
  */
  alignChuncks: function(textEl, textLine, twextLine) {
    var i, n=0, N=0, textWordsIndices, twextWordsIndices, textWords, twextWords, tmp, Npos, npos, textSpacesCount = 0, twextSpacesCount = 0, parentEl, textNode, twextNode, data;
    var nodes = getTextTwext(textEl, textLine, twextLine);
    textNode = nodes[0];
    twextNode = nodes[1];
    
    for(i=0; i<nN.length; i++) {
      
      this.alignChunck(textEl, textNode, twextNode, nN[i], textLine);
      
      
      textNode = textEl[0].childNodes[textLine].childNodes.length > 0 ? textEl[0].childNodes[textLine].childNodes[0] : textEl[0].childNodes[textLine];
      twextNode = textEl[0].childNodes[twextLine].childNodes.length > 0 ? textEl[0].childNodes[twextLine].childNodes[0] : textEl[0].childNodes[twextLine];
    }
  },

  /**
    Align text word N and twext word n.
    Put words in <span> and compare their left position to align.
    Params: 'nN' twext/text word number in the form of n:N string.
  */
  alignChunck: function(textEl, textNode, twextNode, nN, textLine) {
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
      removeSpanNode(textEl[0].childNodes[twextLine], "twextWord", n == 0, n == twextWords.length-1);
    } else if(NPos > nPos) {  // Move twext word
      parentEl = twextNode.parentElement;
      while(NPos > nPos) {
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
      }
      // Take span value of text word and remove span tag
      if(textLine == 0) { // First node
        removeSpanNode(textEl[0], "textWord", N == 0, N == textWords.length-1);
      } else {
        removeSpanNode(textEl[0].childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
      }
      // Take span value of twext word and remove span tag
      removeSpanNode(parentEl, "twextWord", n == 0, n == twextWords.length-1);
    } else {  // =
      parentEl = twextNode.parentElement;
      parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
      twextSpacesCount++;
      // Take span value of text word and remove span tag
      if(textLine == 0) { // First node
        removeSpanNode(textEl[0], "textWord", N == 0, N == textWords.length-1);
      } else {
        removeSpanNode(textEl[0].childNodes[textLine], "textWord", N == 0, N == textWords.length-1);
      }
      // Take span value of twext word and remove span tag
      removeSpanNode(parentEl, "twextWord", n == 0, n == twextWords.length-1);
    }
  }
});