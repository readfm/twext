/**
  Append span node value to the parent node and remove the span node.
  Params: 'parentEl' the parent element of the span
          'firstWord' boolean detects if the word at the begining of the line
          'lastWord' boolean detects if the word at the end of the line
*/
function removeSpanNode(parentEl, id, firstWord, lastWord) {
  var data = getNodeNewData(id, firstWord, lastWord);
  parentEl.childNodes[0].nodeValue = data;
  $(parentEl.childNodes[2]).remove();
  $('#'+id).remove();
}

/**
  Get the new parent node value after appending span node value
  Params: 'id' the id of the word
          'firstWord' boolean detects if the word at the begining of the line
          'lastWord' boolean detects if the word at the end of the line
*/
function getNodeNewData(id, firstWord, lastWord) {
  if(firstWord) { // first word
    var preVal = cleanText($('#'+id)[0].previousSibling.nodeValue);
    $('#'+id)[0].previousSibling.nodeValue = preVal.charAt(0) != " " ? preVal : preVal.slice(1);
  } else if(lastWord) { // Last word
    var nextVal = cleanText($('#'+id)[0].nextSibling.nodeValue);
    $('#'+id)[0].nextSibling.nodeValue = nextVal.charAt(0) != " " ? nextVal : nextVal.slice(1);
  }
  var data = $('#'+id)[0].previousSibling.nodeValue + $('#'+id)[0].childNodes[0].nodeValue + $('#'+id)[0].nextSibling.nodeValue;
  return data;
}

/**
  Put word in span tag and insert it in the dom.
  Params: 'node' is the node contains the word.
          'index' is the index of the word.
          'word' the word to be put in span tag
          'id' the id of the span tag
*/
function putWordInSpan(node, index, word, id) {
  var valBefore = node.nodeValue.substring(0, index) == "" ? " " : node.nodeValue.substring(0, index);
  var valAfter = node.nodeValue.slice(index+word.length) == "" ? " " : node.nodeValue.slice(index+word.length);
  node.nodeValue = valBefore;
  var spanNode = $('<span id="' + id + '">' + word + '</span>');
  spanNode.insertAfter(node);
  $(document.createTextNode(valAfter)).insertAfter(spanNode);
}

/**
  Get text and twext nodes.
*/
function cleanTextTwext(textEl, textLine, twextLine) {
  var textNode = textEl.childNodes[textLine].childNodes.length > 0 ? textEl.childNodes[textLine].childNodes[0] : textEl.childNodes[textLine];
  textNode.nodeValue = cleanText(textNode.nodeValue).replace(/\ +/g, ' '); // Return to unaligned text
  var twextNode = textEl.childNodes[twextLine].childNodes.length > 0 ? textEl.childNodes[twextLine].childNodes[0] : textEl.childNodes[twextLine];
  twextNode.nodeValue = cleanText(twextNode.nodeValue).replace(/\ +/g, ' '); // Return to unaligned twext
}

/**
  Get words in text.
*/
function getWords(text) {
  //var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
  //var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|((\w+)?([^\u0000-\u0080]+)(\w+)?)+|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words, any non space char
  return text.match(re);
}

/**
  Get indices of words in text.
*/
function getWordsIndices(text) {
  //var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=||\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
  //var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|((\w+)?([^\u0000-\u0080]+)(\w+)?)+|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words, any non space char
  return getMatchesIndices(text, re);
}

/**
  Get the indices of regular expression matches in the string.
*/
function getMatchesIndices(str, re) {
  var result, indices = [];
  while(result = re.exec(str)) {
    indices.push(result.index);
  }
  return indices;
}

/**
  Set cursor position.
*/
function setCaretPos(node, offset) {
  if(node.childNodes.length > 0) {
    node = node.childNodes[0];
  }
  var range = document.createRange();
  range.setStart(node, offset);
  range.setEnd(node, offset);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
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
  re = new RegExp(str.substring(0, str.length-1), 'g');
  html = html.replace(re, '');
  return trim(html);
}

/**
  Clean text from html characters
*/
function cleanText(text) {
  var re, str = "", i;
  var spaces = [String.fromCharCode(160), '&nbsp;'];
  for (i = 0; i < spaces.length; i++) {
    str += spaces[i] + "|";
  }
  re = new RegExp(str.substring(0, str.length-1), 'g');
  text = text.replace(re, ' ');
  return trim(text);
}

/**
  Trim string, remove spaces at the start/end of string.
*/
function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

/**
  Convert text into html.
*/
function convertTextToHtml(text) {
  var i, html = "";
  //text = text.replace(/\ /g, '&nbsp;')
  var lines = text.split('\n');
  for(i=0; i<lines.length; i++) {
    html += "<div class='text'>" + lines[i] + "</div>";
  }
  return html;
}