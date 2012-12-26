var nN = ["3:2", "6:3", "7:5"];

var textStr = "align chunks in any font face";

var twextStr = "emp tmpty line to measure empties to insert";

/**
  On document load.
*/
$(document).ready(function() {
  var textEl = $('#textInput');
  textEl.focus();
  initHtml(textEl);
  alignChunks(textEl);
});

/**
  Sample html.
*/
function initHtml(textEl) {
  var html = "", textLine = "", twextLine = "";
  textLine = textStr.replace(/\ /g, '&nbsp;');
  twextLine = '<div class="twext">' + twextStr.replace(/\ /g, '&nbsp;') + "</div>";
  html = textLine + twextLine;
  textEl.html(html);
}

/**
  Align chuncks using tmpty line algorithm.
*/
function alignChunks(textEl) {
  var i;
  textEl.html(cleanHtml(textEl.html()));
  for(i=0; i<textEl[0].childNodes.length; i=i+2) {
    spanAlign(textEl, i, i+1);
  }
}

/**
  Put N,n words in <span> and compare their left position to align chunks.
*/
function spanAlign(textEl, textLine, twextLine) {
  var i, n=0, N=0, textWordsIndices, twextWordsIndices, textWords, twextWords, tmp, Npos, npos, textSpacesCount = 0, twextSpacesCount = 0, parentEl, textNode, twextNode, data;
  textNode = textEl[0].childNodes[textLine].childNodes.length > 0 ? textEl[0].childNodes[textLine].childNodes[0] : textEl[0].childNodes[textLine];
  twextNode = textEl[0].childNodes[twextLine].childNodes.length > 0 ? textEl[0].childNodes[twextLine].childNodes[0] : textEl[0].childNodes[twextLine];
  textWords = getWords(textNode.nodeValue);
  twextWords = getWords(twextNode.nodeValue);
  textWordsIndices = getWordsIndices(textNode.nodeValue);
  twextWordsIndices = getWordsIndices(twextNode.nodeValue);
  for(i=0; i<nN.length; i++) {
    tmp = nN[i].split(":");
    n = parseInt(tmp[0]) - 1; // Twext word number
    N = parseInt(tmp[1]) - 1; // Text word number
    // Put text word in span
    textNode.nodeValue = textNode.nodeValue.substring(0, textWordsIndices[N]+textSpacesCount) + textNode.nodeValue.slice(textWordsIndices[N]+textSpacesCount+textWords[N].length);
    spanNode = $('<span id="textWord">' + textWords[N] + '</span>');
    setCaretPos(textNode, textWordsIndices[N]+textSpacesCount);
    insertNode(spanNode);
    // Put twext word in span
    twextNode.nodeValue = twextNode.nodeValue.substring(0, twextWordsIndices[n]+twextSpacesCount) + twextNode.nodeValue.slice(twextWordsIndices[n]+twextSpacesCount+twextWords[n].length);
    spanNode = $('<span id="twextWord">' + twextWords[n] + '</span>');
    setCaretPos(twextNode, twextWordsIndices[n]+twextSpacesCount);
    insertNode(spanNode);
    // Get words left position
    NPos = parseInt($('#textWord').position().left);
    nPos = parseInt($('#twextWord').position().left);
    if(NPos < nPos) { // Move text word
      parentEl = textNode.parentElement;
      while(NPos < nPos) {
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
        textSpacesCount++;
      }
      // Take span value of text word before removing span tag
      data = $('#textWord')[0].previousSibling.nodeValue + $('#textWord')[0].childNodes[0].nodeValue + $('#textWord')[0].nextSibling.nodeValue;
      parentEl.childNodes[0].nodeValue = data;
      $(parentEl.childNodes[2]).remove();
      $('#textWord').remove();
      // Take span value of twext word before removing span tag
      data = $('#twextWord')[0].previousSibling.nodeValue + $('#twextWord')[0].childNodes[0].nodeValue + $('#twextWord')[0].nextSibling.nodeValue;
      textEl[0].childNodes[twextLine].childNodes[0].nodeValue = data;
      $(textEl[0].childNodes[twextLine].childNodes[2]).remove();
      $('#twextWord').remove();
    } else if(NPos > nPos) {  // Move twext word
      parentEl = twextNode.parentElement;
      while(NPos > nPos) {
        parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
        NPos = parseInt($('#textWord').position().left);
        nPos = parseInt($('#twextWord').position().left);
        twextSpacesCount++;
      }
      // Take span value of text word before removing span tag
      var data = $('#textWord')[0].previousSibling.nodeValue + $('#textWord')[0].childNodes[0].nodeValue + $('#textWord')[0].nextSibling.nodeValue;
      if(textLine == 0) { // First node
        textEl[0].childNodes[0].nodeValue = data;
        $(textEl[0].childNodes[2]).remove();
      } else {
        textEl[0].childNodes[textLine].childNodes[0].nodeValue = data;
        $(textEl[0].childNodes[textLine].childNodes[2]).remove();
      }
      $('#textWord').remove();
      // Take span value of twext word before removing span tag
      data = $('#twextWord')[0].previousSibling.nodeValue + $('#twextWord')[0].childNodes[0].nodeValue + $('#twextWord')[0].nextSibling.nodeValue;
      parentEl.childNodes[0].nodeValue = data;
      $(parentEl.childNodes[2]).remove();
      $('#twextWord').remove();
    } else {  // =
      parentEl = twextNode.parentElement;
      parentEl.innerHTML = parentEl.innerHTML.substring(0, parentEl.innerHTML.indexOf('<span')) + "&nbsp;" + parentEl.innerHTML.slice(parentEl.innerHTML.indexOf('<span'));
      twextSpacesCount++;
      // Take span value of text word before removing span tag
      var data = $('#textWord')[0].previousSibling.nodeValue + $('#textWord')[0].childNodes[0].nodeValue + $('#textWord')[0].nextSibling.nodeValue;
      if(textLine == 0) { // First node
        textEl[0].childNodes[0].nodeValue = data;
        $(textEl[0].childNodes[2]).remove();
      } else {
        textEl[0].childNodes[textLine].childNodes[0].nodeValue = data;
        $(textEl[0].childNodes[textLine].childNodes[2]).remove();
      }
      $('#textWord').remove();
      // Take span value of twext word before removing span tag
      data = $('#twextWord')[0].previousSibling.nodeValue + $('#twextWord')[0].childNodes[0].nodeValue + $('#twextWord')[0].nextSibling.nodeValue;
      parentEl.childNodes[0].nodeValue = data;
      $(parentEl.childNodes[2]).remove();
      $('#twextWord').remove();
    }
    textNode = textEl[0].childNodes[textLine].childNodes.length > 0 ? textEl[0].childNodes[textLine].childNodes[0] : textEl[0].childNodes[textLine];
    twextNode = textEl[0].childNodes[twextLine].childNodes.length > 0 ? textEl[0].childNodes[twextLine].childNodes[0] : textEl[0].childNodes[twextLine];
  }
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
  var whitespacesList = ['\\n', '<br>'];
  for (i = 0; i < whitespacesList.length; i++) {
    str += whitespacesList[i] + "|";
  }
  re = new RegExp(str.substring(0, str.length-1), 'g');
  html = html.replace(re, '');
  return html;
}