var nN = ["2:2", "4:3", "6:5"];

var textStr1 = "wafaa is the boss of span align";

var textStr2 = "Text str to test multiple lines";

var twextStr1 = "resize me to see if I behave nice";

var twextStr2 = "Twext str to align second line";

/**
  On document load.
*/
$(document).ready(function() {
  var textEl = $('#textInput');
  textEl.focus();
  initHtml(textEl);
  showTwextsOnZoom(textEl);
  $(window).resize(function() {
    showTwextsOnZoom(textEl);
  });
});

/**
  Sample html.
*/
function initHtml(textEl) {
  var html = "", textLine1 = "", textLine2 = "", emptyLine = "";
  textLine1 = textStr1.replace(/\ /g, '&nbsp;');
  textLine2 = '<div>' + textStr2.replace(/\ /g, '&nbsp;') + "</div>";
  emptyLine = '<div><br></div>'
  html = textLine1 + emptyLine + textLine2;
  textEl.html(html);
}

/**
  Show twexts when zooming to more than 120%
*/
function showTwextsOnZoom(textEl) {
  if(document.documentElement.clientWidth/screen.width < 0.8 && $('.twext').length == 0) {  // zoom level > 120%
    addTwexts(textEl);
  } else if(document.documentElement.clientWidth/screen.width > 0.8 && $('.twext').length > 0) {  // zoom level < 120%
    removeTwexts();
  }
  if($('.twext').length > 0) {
    var aligner = new SpanAligner();
    aligner.align(textEl);
  }
}

/**
  Create twext lines.
*/
function addTwexts(textEl) {
  var twextLines = ['<div class="twext">' + twextStr1.replace(/\ /g, '&nbsp;') + "</div>", '<div class="twext">' + twextStr2.replace(/\ /g, '&nbsp;') + "</div>"]; // twext line example, should be replaced by real twexts.
  var i, j=0;
  textEl.html(cleanHtml(textEl.html()));
  for(i=0; i<textEl[0].childNodes.length; i=i+2) {
    if(textEl[0].childNodes[i].innerHTML == '<br>') {
      i--;
      continue;
    }
    $(twextLines[j]).insertAfter(textEl[0].childNodes[i]);
    j++;
  }
}

/**
  Remove twexts
*/
function removeTwexts() {
  $('.twext').remove();
}

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
    $('#'+id)[0].previousSibling.nodeValue = $('#'+id)[0].previousSibling.nodeValue == " " ? "" : $('#'+id)[0].previousSibling.nodeValue.slice(1);
    $('#'+id)[0].nextSibling.nodeValue = " " + $('#'+id)[0].nextSibling.nodeValue;
  } else if(lastWord) { // Last word
    $('#'+id)[0].previousSibling.nodeValue = " " + $('#'+id)[0].previousSibling.nodeValue;
    $('#'+id)[0].nextSibling.nodeValue = $('#'+id)[0].nextSibling.nodeValue == " " ? "" : $('#'+id)[0].nextSibling.nodeValue.slice(1);
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
  node.nodeValue = node.nodeValue.substring(0, index) + node.nodeValue.slice(index+word.length);
  var spanNode = $('<span id="' + id + '">' + word + '</span>');
  setCaretPos(node, index);
  insertNode(spanNode);
}

/**
  Get text and twext nodes.
*/
function getTextTwext(textEl, textLine, twextLine) {
  var textNode = textEl[0].childNodes[textLine].childNodes.length > 0 ? textEl[0].childNodes[textLine].childNodes[0] : textEl[0].childNodes[textLine];
  textNode.nodeValue = cleanText(textNode.nodeValue).replace(/\ +/g, ' '); // Return to unaligned text
  var twextNode = textEl[0].childNodes[twextLine].childNodes.length > 0 ? textEl[0].childNodes[twextLine].childNodes[0] : textEl[0].childNodes[twextLine];
  twextNode.nodeValue = cleanText(twextNode.nodeValue).replace(/\ +/g, ' '); // Return to unaligned twext
  return [textNode, twextNode];
}

/**
  Insert node at caret.
*/
function insertNode(node) {
  window.getSelection().getRangeAt(0).insertNode(node[0]);
}

/**
  Get words in text.
*/
function getWords(text) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
  return text.match(re);
}

/**
  Get indices of words in text.
*/
function getWordsIndices(text) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
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
  return html;
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
  return text;
}