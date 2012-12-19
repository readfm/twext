/**
  Map to keyboard key codes.
*/
var keys = {
  'f2': 113,
  'f4': 115,
  'f9': 120
};

/**
  The states available.
*/
var states = {
  'home': 0,
  'text': 1,
  'twext': 2,
  'new': 3
};

/**
  Current state.
*/
var state = states['home'];

/**
  Oneline object.
*/
var onelineObj = new OneLine("");

/**
  On document load.
*/
$(document).ready(function() {
  displayOneLinesList($('#textInput'));
  $('#textInput').focus();
  $('#textInput').keydown(function(e) {
    handleInputKeyDownEvents(e);
  });
});

/**
  Handle key down events for the text input.
*/
function handleInputKeyDownEvents(e) {
  if(e.keyCode == keys['f2']) { //F2 key pressed
    displayOneLinesList($('#textInput'));
  } else if(e.keyCode == keys['f4']){  //F4 key pressed
    textTwextSwitch($('#textInput'));
  } else if(e.keyCode == keys['f9']) {  //F9 key is pressed
    createNew();
  }
}

/**
  Convert text into html.
*/
function convertTextToHtml(text) {
  var i, html = "";
  text = text.replace(/\ /g, '&nbsp;')
  var lines = text.split('\n');
  html = lines[0];
  for(i=1; i<lines.length; i++) {
    html += "<div>" + lines[i] + "</div>";
  }
  return html;
}

/**
  Convert html into text.
*/
function convertHtmlToText(html) {
  var i, text = "";
  var re = new RegExp(String.fromCharCode(160) + "|\\&nbsp;", 'g'); // nbsp
  html = html.replace(re, ' ');
  re = new RegExp(String.fromCharCode(10), 'g');  // line feed
  html = html.replace(re, '');
  var lines = html.split('<div>');
  text = lines[0];
  for(i=1; i<lines.length; i++) {
    text += "\n" + lines[i].substring(0, lines[i].indexOf('</div>'));
  }
  return text;
}

/**
  Display the onelines list saved in the local storage.
*/
function displayOneLinesList(textEl) {
  var oneLine = textEl.data("oneline");
  if(oneLine) {
    oneLine = updateOneLine(oneLine, textEl);
    saveOneLine(oneLine, textEl.data("lineNumber"));
  }
  reset(textEl);  
  var text = loadOneLinesList();
  if(text != null) {
    textEl.html(convertTextToHtml(text));
  } else {
    textEl.html(convertTextToHtml("No onelines to display! Use F9/F4 to add some text"));
  }
}

/**
  Apply text/twext edits on oneline.
*/
function updateOneLine(oneLine, textEl) {
  var text = convertHtmlToText(textEl.html());
  if(state == states['text'] && text != oneLine.getText()) {  // Text has been edited  
    oneLine.setText(text);
  } else if(state == states['twext'] && text.replace(/\ +/g, ' ') != oneLine.getTextTwext()) { // TextTwext has been edited (spaces replace to remove alignment)
    oneLine.setTextTwext(text.replace(/\ +/g, ' '));
  }
  textEl.data("oneline", oneLine);
  return oneLine;
}

/**
  Reset to home state.
*/
function reset(textEl) {
  state = states['home'];
  textEl.removeData();
}

/**
  Load the onelines list from the local storage.
*/
function loadOneLinesList() {
  var i, text = "";
  var list = $.jStorage.get("onelineslist");
  if(list) {
    for(i=0; i<list.length; i++) {
      text += list[i] + "\n";
    }
    text = text.substring(0, text.length-1);  // Remove the last \n
    return text;
  } else {
    return null;
  }
}

/**
  Save one line to the local storage.
*/
function saveOneLine(oneLine, lineNumber) {
  var list = $.jStorage.get("onelineslist");
  if(list) {
    if(oneLine.isNewLine()) {
      list.unshift(oneLine.getValue());    // Add oneline at the top of the list
    } else {
      list[lineNumber] = oneLine.getValue();
    }
  } else {
    list = new Array(oneLine.getValue());
  }
  $.jStorage.set("onelineslist", list);
}

/**
  Save onelines list to the local storage.
  Params: String of onelines list.
*/
function saveOnelinesList(text) {
  var i, list;
  $.jStorage.deleteKey("onelineslist");
  list = text.split('\n');
  $.jStorage.set("onelineslist", list);
}

/**
  Construct initial oneline from text/twext.
*/
function constructOneLine(textVal) {
  var i, text = "", twext = "";
  var lines = textVal.split('\n');
  for(i=0; i<lines.length; i=i+2) {
    text += lines[i] + onelineObj.LINE_MARK;
    twext += lines[i+1] + " " + "1:1" + onelineObj.LINE_MARK;
  }
  var oneLine = text.substring(0, text.length-2) + onelineObj.ROW_MARK + twext.substring(0, twext.length-2);
  return oneLine;
}

/**
  Switch between text and twext.
*/
function textTwextSwitch(textEl) {
  var displayedText = "", i, oneLine;
  var text = convertHtmlToText(textEl.html());
  if(state == states['home']) { // From home to text.
    saveOnelinesList(text);
    var line = convertHtmlToText(window.getSelection().focusNode.textContent);
    oneLine = new OneLine(line);
    displayedText = oneLine.getText();
    textEl.data("oneline", oneLine);
    textEl.data("lineNumber", getLineNumber(text, line));
    state = states['text'];
  } else if(state == states['text']) { // From text to twext
    oneLine = updateOneLine(textEl.data("oneline"), textEl);
    displayedText = alignText(oneLine);
    state = states['twext'];
  } else if(state == states['twext']) { // From twext to text
    oneLine = updateOneLine(textEl.data("oneline"), textEl)
    displayedText = oneLine.getText();
    state = states['text'];
  } else if(state == states['new']) { // From new to twext.
    var lines = text.split('\n');
    for(i=0; i<lines.length; i++) {
      displayedText += lines[i] + "\n" + "=" + "\n";
    }
    displayedText = displayedText.substring(0, displayedText.length-1);  // Remove the last \n
    var onelineStr = constructOneLine(displayedText);
    oneLine = new OneLine(onelineStr);
    oneLine.setNewLine(true);
    textEl.data("oneline", oneLine);
    state = states['twext'];
  }
  textEl.html(convertTextToHtml(displayedText));
}

/**
  Get the line number where the cursor points.
*/
function getLineNumber(text, line) {
  var i;
  var lines = text.split('\n');
  for(i=0; i<lines.length; i++) {
    if(lines[i] == line) {
      return i;
    }
  }
  return -1;
}

/**
  Align text/twext according to n:N notation.
*/
function alignText(oneline) {
  var alignedText = "", matchIndex = -1, textLine = "", twextLine = "", nN, i, j;
  var lines = oneline.getTextTwext().split('\n'); 
  nN = oneline.getnN();
  for(i=0, j=0; i<lines.length, j<nN.length; i=i+2, j++) {
    textLine = lines[i];
    twextLine = lines[i+1];
    alignedText += alignRows(textLine, twextLine, nN[j]) + "\n";
  }
  return alignedText.substring(0, alignedText.length-1);  // Remove the last \n
}

/**
  Align two rows of text/twext according to n:N notation
*/
function alignRows(textLine, twextLine, nN) {
  var diff = 0, count = 0, spaces = "", wordNumbers, textSpacesCount = 0, twextSpacesCount = 0, index = 0, nNList;
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
  var theTextIndices = getMatchesIndices(textLine, re);
  var theTwextIndices = getMatchesIndices(twextLine, re);
  nNList = nN.split(' ');
  for(i=0; i<nNList.length; i++) {
    wordNumbers = nNList[i].split(':');
    spaces = "";
    diff = (theTextIndices[parseInt(wordNumbers[0])-1]+textSpacesCount) - (theTwextIndices[parseInt(wordNumbers[1])-1]+twextSpacesCount); // -1 to map word number 1 to word index 0
    count = diff;
    if(diff > 0) {  // Align twext word to text word
      while(count != 0) {
        spaces += " ";
        count--;
      }
      index = theTwextIndices[parseInt(wordNumbers[1])-1]+twextSpacesCount < 0 ? 0 : theTwextIndices[parseInt(wordNumbers[1])-1]+twextSpacesCount;
      twextLine = twextLine.substring(0, index) + spaces + twextLine.slice(index);
      twextSpacesCount += diff;
    } else if(diff < 0) { // Align text word to twext word
      while(count != 0) {
        spaces += " ";
        count++;
      }
      index = theTextIndices[parseInt(wordNumbers[0])-1]-1+textSpacesCount < 0 ? 0 : theTextIndices[parseInt(wordNumbers[0])-1]-1+textSpacesCount;
      textLine = textLine.substring(0, index) + spaces + textLine.slice(index);  // -1 solves punctuation when it comes at the start of the word
      textSpacesCount -= diff;
    }
  }
  return textLine + "\n" + twextLine;
}

/**
  Empty the text area for the user to input new text.
*/
function createNew() {
  if(state == states['home']) {
    var text = convertHtmlToText($('#textInput').html());
    saveOnelinesList(text);
  }
  $('#textInput').html("");
  $('#textInput').removeData();
  state = states['new'];
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