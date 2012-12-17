/**
  Map to keyboard key codes.
*/
var keys = {
  'f2': 113,
  'f4': 115,
  'f9': 120
};

/**
  Text/Twext state.
*/
var state = 0;  // 0 = home, 1 = text, 2 = twext, 3 = new

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
    newText();
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
  if(state == 2 && textEl.data("newLine")) {
    var text = convertHtmlToText(textEl.html());
    saveOneLine(text);
  }
  state = 0;
  textEl.removeData();
  var text = loadOneLinesList();
  if(text != null) {
    textEl.html(convertTextToHtml(text));
  } else {
    textEl.html(convertTextToHtml("No onelines to display! Use F9/F4 to add some text"));
  }
}

/**
  Save one line to the local storage.
*/
function saveOneLine(text) {
  var oneLine = getOneLine(text);
  var list = $.jStorage.get("onelineslist");
  if(list) {
    list.unshift(oneLine);
  } else {
    list = new Array(oneLine);
  }
  $.jStorage.set("onelineslist", list);
}

function getOneLine(textVal) {
  var i, text = "", twext = "";
  var lines = textVal.split('\n');
  for(i=0; i<lines.length; i=i+2) {
    text += lines[i] + "  ";
    twext += lines[i+1] + " " + "1:1" + "  ";
  }
  var oneLine = text.substring(0, text.length-2) + "        " + twext.substring(0, twext.length-2);
  return oneLine;
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
  Switch between text and twext.
*/
function textTwextSwitch(textEl) {
  var text = "", i;
  if(state == 0) { // From home to text.
    var line = convertHtmlToText(window.getSelection().focusNode.textContent);
    text = line.split('        ')[0];  // 8 spaces row marker.
    text = text.replace(/\  /g, "\n");  // 2 spaces line marker.
    textEl.data("oneline", line);
    state = 1;
  } else if(state == 1) { // From text to twext
    var tmp = textEl.data("oneline").split('        ');
    var textLines = tmp[0].split('  ');
    var twextLines = tmp[1].split('  ');
    for(i=0; i<textLines.length; i++) {
      text += textLines[i] + "\n";
      text += twextLines[i] + "\n";
    }
    text = text.substring(0, text.length-1);
    text = alignText(text);
    state = 2;
  } else if(state == 2) { // From twext to text
    var textValue = convertHtmlToText(textEl.html());
    textEl.data("oneline", getOneLine(textValue));
    var lines = textValue.split('\n');
    for(i=0; i<lines.length; i=i+2) {
      text += lines[i] + "\n";
    }
    text = text.substring(0, text.length-1);  // Remove the last \n
    state = 1;
  } else if(state == 3) { // From new to twext.
    var lines = convertHtmlToText(textEl.html()).split('\n');
    for(i=0; i<lines.length; i++) {
      text += lines[i] + "\n" + "=" + "\n";
    }
    text = text.substring(0, text.length-1);  // Remove the last \n
    state = 2;
    textEl.data("newLine", true);
  }
  textEl.html(convertTextToHtml(text));
}

function alignText(text) {
  var alignedText = "", matchIndex = -1, textLine = "", twextLine = "", nN, i;
  var re = /\d+\:\d+/;
  var lines = text.split('\n');
  //theTwext = theTwext.substring(0, theTwext.search(re)-1);  
  for(i=0; i<lines.length; i=i+2) {
    matchIndex = lines[i+1].search(re);
    textLine = lines[i];
    twextLine = lines[i+1].substring(0, matchIndex-1);  // -1 to remove the last space.
    nN = lines[i+1].slice(matchIndex).split(' ');
    alignedText += alignRows(textLine, twextLine, nN) + "\n";
  }
  return alignedText.substring(0, alignedText.length-1);  // Remove the last \n
}

function alignRows(textLine, twextLine, nN) {
  var diff = 0, count = 0, spaces = "", wordNumbers, textSpacesCount = 0, twextSpacesCount = 0, index = 0;
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|\=|\b((\w+)?('|\.)(\w+)?)+\b|\b\w+\b/gi;  // Match url | words
  var theTextIndices = getMatchesIndices(textLine, re);
  var theTwextIndices = getMatchesIndices(twextLine, re);
  for(i=0; i<nN.length; i++) {
    wordNumbers = nN[i].split(':');
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
function newText() {
  $('#textInput').html("");
  $('#textInput').removeData();
  state = 3;
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