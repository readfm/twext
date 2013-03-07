/**
  This file manipulate a demo for span align. Text/twext are hardcoded examples, not real text.
  The twexts are not shown on zoom level less than 120%
*/
var nN = {0: ["1:2", "4:3", "6:5"],
          3: ["2:2", "4:3", "6:5"]};

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
    aligner.align(textEl, nN);
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