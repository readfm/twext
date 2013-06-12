/**
* Remove empty elements from the array.
* @return the array after removing empty entries
*/
Array.prototype.clean = function() {
  for (var i = 0; i < this.length; i++) { // loop over array elements
    if (this[i] == undefined || this[i] == "") {  // if empty entry
      this.splice(i, 1);  // remove entry
      i--;
    }
  }
  return this;  // return array after removing empty entries
};

/**
  Extract words from text.
*/
function getWords(text) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words, any non space char
  return text.match(re);  // return array of all words in the text
}

/**
  Get indices of words in text.
*/
function getWordsIndices(text) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words
  return getMatchesIndices(text, re); // Get indices of regular expression matches.
}

/**
  Get the indices of regular expression matches in the string.
*/
function getMatchesIndices(str, re) {
  var result, indices = [];
  while(result = re.exec(str)) {
    indices.push(result.index); // Match found, push its index in the array
  }
  return indices;
}

/**
  Set cursor position.
*/
function setCaretPos(node, offset) {
  if(node.childNodes.length > 0) {  // If the node not of type #TEXT
    node = node.childNodes[0];  // Set the node to its #TEXT childNode
  }
  var range = document.createRange();
  range.setStart(node, offset);
  range.setEnd(node, offset);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
  Clean text from possible html characters
*/
function cleanText(text) {
  var re, str = "", i;
  var spaces = [String.fromCharCode(160), '&nbsp;'];  // Possible html spaces
  for (i = 0; i < spaces.length; i++) {
    str += spaces[i] + "|";
  }
  re = new RegExp(str.substring(0, str.length-1), 'g'); // Create regular expression of possible html spaces
  text = text.replace(re, ' '); // replace html spaces by text spaces
  return $.trim(text);
}

/**
  Clean whitespaces from html
*/
function cleanHtml(html) {
  var re, str = "", i;
  var whitespacesList = ['\\n'];
  for (i = 0; i < whitespacesList.length; i++) {
    str += whitespacesList[i] + "|";
  }
  re = new RegExp(str.substring(0, str.length-1), 'g'); // Create regular expression of possible whitespaces
  html = html.replace(re, '');  // Remove all whitespaces from html
  return $.trim(html);
}

/**
  Convert text into html; construct <div> tag (with a specific class) for each line of text.
  Params: 'text' text to be converted to html
          'clazz' the class to set for each div (line)
*/
function textToHtml(text, clazz) {
  var i, html = "";
  //text = text.replace(/\ /g, '&nbsp;')
  var lines = text.split('\n'); // get text lines
  if(clazz) { // If class is specified
    for(i=0; i<lines.length; i++) {
      html += "<div class='"+clazz+"'>" + lines[i] + "</div>";  // Construct div with spicified class for the text line
    }
  } else {  // no class specified
    for(i=0; i<lines.length; i++) {
      html += "<div>" + lines[i] + "</div>";  // Construct div without class for the text line
    }
  }
  return html;  // return html created
}

/**
  All span related operations are gathered in Span.Utils
*/
SpanUtils = {
  /**
    Remove span node created to perform aligning. Creation of span node divided the original node to three nodes, the one before the span, the one after the span and the span node. This method combine the three nodes' values and set it to the first node (the node before the span), and then delete the other two.
    Params: 'parentEl' the parent element of the span
            'id' the id of the span node
            'firstWord' boolean to detect if the word at the begining of the line
            'lastWord' boolean to detect if the word at the end of the line
  */
  removeSpanNode: function(parentEl, id, firstWord, lastWord) {
    // Get the combined value of the node, the node value before the span+the span value+the node value after the span
    var data = SpanUtils.getCombinedValue(id, firstWord, lastWord);
    parentEl.childNodes[0].nodeValue = data;  // Set the first node value to the combined value
    $(parentEl.childNodes[2]).remove(); // remove the node after the span
    $('#'+id).remove(); // remove the span node
  },

  /**
    Get the combined value of the three childnodes of element; the node value before span+the node value after span+the span node value
    Params: 'id' the id of the span node
            'firstWord' boolean to detect if the word at the begining of the line
            'lastWord' boolean to detect if the word at the end of the line
  */
  getCombinedValue: function(id, firstWord, lastWord) {
    var data = "";
    if(firstWord) { // first word of the line
      var preVal = cleanText($('#'+id)[0].previousSibling.nodeValue); // Get node value before span
      // Remove a space from the begining of the value (if any) that may be added when adding the span tag for the first word in the line
      $('#'+id)[0].previousSibling.nodeValue = preVal.charAt(0) != " " ? $('#'+id)[0].previousSibling.nodeValue : $('#'+id)[0].previousSibling.nodeValue.slice(1);
    } else if(lastWord) { // Last word of the line
      var nextVal = cleanText($('#'+id)[0].nextSibling.nodeValue);  // Get node value after span
      // Remove a space from the begining of the value (if any) that may be added when adding the span tag for the last word in the line
      $('#'+id)[0].nextSibling.nodeValue = nextVal.charAt(0) != " " ? $('#'+id)[0].nextSibling.nodeValue : $('#'+id)[0].nextSibling.nodeValue.slice(1);
    }
    // Get the combined value
    if($('#'+id)[0].childNodes[0]) {  // If the span node is not empty
      data = $('#'+id)[0].previousSibling.nodeValue + $('#'+id)[0].childNodes[0].nodeValue + $('#'+id)[0].nextSibling.nodeValue;
    } else {
      data = $('#'+id)[0].previousSibling.nodeValue + $('#'+id)[0].nextSibling.nodeValue;
    }
    return data;
  },

  /**
    Put word in span tag and append it to the dom. Creation of span node divided the original node to three nodes, the one before the span, the one after the span and the span node. This method put the word to align in a span node to use its left position in span align algorithm.
    Params: 'node' is the node contains the word.
            'index' is the index of the word.
            'word' the word to be put in span tag
            'id' the id of the span tag
  */
  putWordInSpan: function(node, index, word, id) {
    // Get the text string parts before/after the word.
    // If the string before/after the word is empty (first/last word in the line), then set the value to a space; This is needed to keep the number of nodes as three (the one before the span, the one after the span and the span tag) because the node will be deleted if empty
    var valBefore = node.nodeValue.substring(0, index) == "" ? " " : node.nodeValue.substring(0, index);
    var valAfter = node.nodeValue.slice(index+word.length) == "" ? " " : node.nodeValue.slice(index+word.length);
    // Set the original node value to the text string before the word.
    node.nodeValue = valBefore;
    var spanNode = $('<span id="' + id + '">' + word + '</span>');  // Create a span node contains the word
    spanNode.insertAfter(node); // Append the span node to the dom; inserted after the text before the word
    $(document.createTextNode(valAfter)).insertAfter(spanNode); // Create text node to contain the text string after the word; inserted after span
  },

  /**
    Clean node value from html characters and remove any extra spaces added for alignment.
    Params: 'textEl' the input div element (textEl[0]).
            'line' line number (child node number)
  */
  cleanAndUnalignNode: function(textEl, line) {
    var node = textEl.childNodes[line].childNodes.length > 0 ? textEl.childNodes[line].childNodes[0] : textEl.childNodes[line];
    node.nodeValue = cleanText(node.nodeValue).replace(/\ +/g, ' ');
  }
}