// Global objects used through page life time.
var area = null, syllabifier = null, timingCreator = null, player = null, langMenu = null, toggle = null, url_list = null, twextRecorder = null, videoPlayer = null, game = null;
var firebaseRef = "https://readfm.firebaseio.com/";  // firebase url

// Keyboard keys' codes used
var keys = {
  'backspace': 8,
  'enter': 13,
  'esc': 27,
  'space': 32,
  'delete': 46,
  'a': 65,
  's': 83,
  'd': 68,
  'f': 70,
  'j': 74,
  'k': 75,
  'l': 76,
  'h': 72,
  'g': 71,
  'f7': 118,
  ';': 186,
  '+': 187,
  '-': 189,
  'alt': false,
  'ctrl': false
}

/**
* Initialize data on document load.
*/
$(document).ready(function() {
  console.log('Init data');

  // Initialize objects
  area = new ScoochArea(this.getElementById('data-show'));  // create ScoochArea object to represent the contenteditable element
  syllabifier = new Syllabifier();  // create Syllabifier object that handles text syllabifications.
  timingCreator = new TimingCreator(); // create Timing object that handles timing features
  player = new TextPlayer(area.area, syllabifier, timingCreator);
  langMenu = new LanguageMenu();  // Create language menu object to handle menu features
  toggle = new Toggle();
  url_list = new URL_List();
  twextRecorder = new TwextRecorder();  // Create twextRecorder object to handle audio recording features
  videoPlayer = new VideoPlayer();
  game = new Game();

  // Load all languages (in languages.js) into menu
  langMenu.loadLanguageList(toggle.selectedLanguages);

  // Attach events
  attachEvents();

  //updateTable();
});

/*function updateTable() {
  getFirebaseEntryValue(firebaseRef+"mapping/url-text", null, function(data, value) {
    var text = null;
    //new Firebase(firebaseRef+"mapping/backup").set(data); // save url-text mapping
    for(var k in data) {
      text = data[k];
      new Firebase(firebaseRef+"mapping/url-text/"+k+"/text").set(text); // save url-text mapping
    }
  });
}*/

function attachEvents() {
  // Attach window events
  $(window).bind("beforeunload", area.save); // window refresh/close event
  $(window).bind("resize", onResize); // window resize event
  $(window).bind("load", onLoad); // window load event
  $(window).bind("hashchange", onHashChange); // window hash change event

  // Attch document events
  $(document).bind("keydown", "f2", playPauseText);  // Animate text on F2 key press
  $(document).bind("keydown","f4", switchTimingState);  // F4 key down event, Turn twexts on/off
  $(document).bind("keydown","f8", fetch_translations);  // F2 key down event, Get translations of area text lines
  $(document).bind("keydown","alt+F8", toggleLangDown); // Alt+F8 keys down event, Switch to previous language
  $(document).bind("keydown", "f9", showHideUrlList); // F9 keydown event, Show/Hide url list
  $(document).bind("keydown", "alt+F2", normalOrGifView); // Alt+F2 keydown event, Play text
  $(document).bind("keydown", "alt+F7", switchFontType); // Alt+F2 keydown event, Play text
  $(document).bind("keydown", "space", fromPlayToPause); // Alt+F2 keydown event, pause text
  $(document).bind("keydown", "ctrl+space", playPauseText); // Alt+F2 keydown event, Play text
  $(document).bind("keydown", onDocumentKeydown); // On document keydown

  // Attach body events
  $('body').bind("keydown", onBodyKeydown);
  $('body').bind("click", onBodyClick);

  // Attach area events
  $(area.area).bind("keydown", onAreaKeydown);
  $(area.area).bind("keyup", onAreaKeyup);

  // Attach other elements events
  $('#language_menu_container').bind("click", onMenuClick); // Menu click "select" event
  $('#language_menu').bind("change", onMenuSelectChange); // When menu selection change
  $('#data-bar-f7, #data-bar-heart').bind("click", showHideLangMenu); // show/hide language menu
  $('#data-bar-f2, #data-bar-play').bind("click", playPauseText);
  $('#data-bar-f4, #data-bar-timing').bind("click", switchTimingState);
  $('#data-bar-f8, #data-bar-language').bind("click", fetch_translations);
  $('#url-list-f9, #url-list-label').bind("click", showHideUrlList);
  $('#youtubeLink').bind("change", loadVideo);
}

/**
* On window resize event.
*/
function onResize() {
  console.log('window resize');

  // resize language menu
  langMenu.resize();

  // realign chunks, if text is in playing, unhighlight current seg before align so that the span doesn't mess with spanAligner
  var playing = player.isPlaying() || player.isTapTiming();
  var clazz = player.unhighlightSeg();  // unhighlight current seg
  area.realign(); // realign chunks
  if(playing) player.highlightSeg(null, clazz);  // rehighlight current seg
}

/**
* On window load event.
*/
function onLoad() {
  console.log('window load');

  // resize language menu
  langMenu.resize();
  // load text and translations into textarea
  toggle.loadText();
  // load url list from firebase to the local object urlList
  //url_list.loadList();
}

/**
* On window hashchange event. Hash change event is not a load event.
*/
function onHashChange() {
  console.log('window hashchange');

  // reset player
  player.reset();
  // resize language menu
  langMenu.resize();
  // clear video link
  $("#youtubeLink").val("");
  // reset url list
  url_list.reset();
  // load text and translations into textarea
  toggle.loadText();
}

/**
* On document keydown.
*/
function onDocumentKeydown(e) {
  if(e.altKey) keys['alt'] = true;
  else if(e.ctrlKey) keys['ctrl'] = true;

  if(e.keyCode == keys['a']) startTimer(e);
  else if(e.keyCode == keys['h']) playFast(e);
  else if(e.keyCode == keys['g']) playSlow(e);
  else if(e.keyCode == keys['s'] || e.keyCode == keys['d'] || e.keyCode == keys['f'] || e.keyCode == keys['j'] || e.keyCode == keys['k'] || e.keyCode == keys['l']) tap(e);
  else if($.inArray(e.keyCode, Object.toArray(game.keys)) != -1) playGame(e);
  else if((e.keyCode == keys['enter'] && e.target.id != "youtubeLink") || e.keyCode == keys[';']) fromTapToPlay(e);
  else if(keys['ctrl'] && keys['alt'] && e.keyCode == keys['+']) gifTextSizeUp();
  else if(keys['ctrl'] && keys['alt'] && e.keyCode == keys['-']) gifTextSizeDown();
}

function onDocumentKeyup(e) {
  if(e.altKey) keys['alt'] = false;
  else if(e.ctrlKey) keys['ctrl'] = false;
}

/**
* On body keydown event.
*/
function onBodyKeydown(e) {
  if(e.keyCode == keys['f7'] && !keys['alt']) { // If F7 is pressed
    showHideLangMenu();
  } else if(e.keyCode == keys['esc']) {  // If esc is pressed
    if(langMenu.visible()) langMenu.hide();  // hide menu
  }
}

/**
* On Body click event.
*/
function onBodyClick(e) {
  // hide menu when clicked outside, except clicking on F2 link because F2 will already hide the menu
  if(e.target.id != 'data-bar-f7' && e.target.id != 'data-bar-heart' && langMenu.visible()) langMenu.hide();
}

/**
* On area keyup event.
*/
function onAreaKeyup(e) {
  if(area.isTimingOn()) { // timing lines are displayed
    var cursorCoord = area.getCaretPos();
    var text = area.area.innerText;
    var line = text.split('\n')[cursorCoord.lines];
    if(line.charAt(cursorCoord.offset-1) == '-') {  // hyphenate word
      // Insert - in all instances of the word where - inserted
      var txt = syllabifier.replaceByHyphenatedWord(area.area.innerText, cursorCoord);
      if(txt) {
        area.updateText(txt);
        area.setCaretPos(cursorCoord.lines, cursorCoord.offset);
        syllabifier.setHyphenatedText(area.extractText());
        //area.realign();
      }
    }
  }
}

/**
* On area keydown event.
*/
function onAreaKeydown(e) {
  // Adjust area limit
  if(!area.adjustLimit(e)) return false;

  // Disable typing if text playing
  if(isTypingChar(e.keyCode) && !e.ctrlKey) {
    if((player.isPlaying() && e.keyCode != keys['a'] && e.keyCode != keys['space'] && e.keyCode != keys['h'] && e.keyCode != keys['g'] && $.inArray(e.keyCode, Object.toArray(game.keys)) == -1) || (player.isTapTiming() && e.keyCode != keys['s'] && e.keyCode != keys['d'] && e.keyCode != keys['f'] && e.keyCode != keys['j'] && e.keyCode != keys['k'] && e.keyCode != keys['l'] && e.keyCode != keys['enter'])) return false;
  }

  // Check keys for proper event
  if(e.keyCode == keys['backspace']) onBackspace(e);  // On backspace
  else if(!e.altKey && !e.ctrlKey && e.keyCode == keys['space']) onSpace(e);  // On space
  else if(e.keyCode == keys['delete']) onDelete(e);  // On delete
}

/**
* On backspace keydown event.
*/
function onBackspace(e) {
  var cursorCoord = area.getCaretPos();
  var text = area.area.innerText;
  var line = text.split('\n')[cursorCoord.lines];
  if(line.charAt(cursorCoord.offset-1) == '-') {  // undo hyphenation
    // Delete - from all instances of the word where - deleted
    var txt = syllabifier.undoHyphenation(text, cursorCoord);
    if(txt) {
      e.preventDefault();
      area.updateText(txt);
      area.setCaretPos(cursorCoord.lines, cursorCoord.offset-1);
      syllabifier.setHyphenatedText(area.extractText());
    }
  } else {
    area.onBackspace(e); // pull chunk
  }
}

/**
* On space keydown event.
*/
function onSpace(e) {
  if(!player.isPlaying() && !player.isTapTiming()) area.onSpace(e);  // push chunk
}

/**
* On delete keydown event.
*/
function onDelete(e) {
  area.onDelete(e);
}

/**
* On Menu click "select" event.
* Body click event hide the menu so that the menu is closed when the user click outside the menu. Stop this click event to prevent hiding the menu when click on the menu itself.
*/
function onMenuClick(e) {
  e.stopPropagation();
}

/**
* On menu selection change event.
*/
function onMenuSelectChange() {
  var selected = langMenu.getSelectedLanguages();  // get selected languages when list is changed
  toggle.setSelectedLanguages(selected.targets, selected.lang_names); // update selected languages object in toggle
  langMenu.saveLangToBrowser(selected); // Save the user languages selection to the browser
}

function switchFontType(e) {
  var currentFont, inputArea = null;
  if($('#data-show').is(':visible')) {
    currentFont = $('#data-show')[0].className;
    if(currentFont == "" || currentFont == "monospaceFont") {
      $('#data-show')[0].className = "proportionalFont";
    } else {
      $('#data-show')[0].className = "monospaceFont";
    }
    area.realign();
  } else if($('#data-gif-view').is(':visible')){
    currentFont = $('#data-gif-view')[0].className;
    if(currentFont == "" || currentFont == "monospaceFont") {
      $('#data-gif-view')[0].className = "proportionalFont";
      $('#data-show')[0].className = "proportionalFont";
    } else {
      $('#data-gif-view')[0].className = "monospaceFont";
      $('#data-show')[0].className = "monospaceFont";
    }
    realignGifText();
  }
  
}

function gifTextSizeUp() {
  if($('#data-gif-view').is(':visible')) {
    var currentSize = parseFloat($($('#data-gif-content')[0].childNodes[1]).css('font-size'));
    var newSize = currentSize + 2;
    $($('#data-gif-content')[0].childNodes[1]).css('font-size', newSize+"px");
    realignGifText();
  }
}

function gifTextSizeDown() {
  if($('#data-gif-view').is(':visible')) {
    var currentSize = parseFloat($($('#data-gif-content')[0].childNodes[1]).css('font-size'));
    var newSize = currentSize-1 < 1 ? 1 : currentSize-2;
    $($('#data-gif-content')[0].childNodes[1]).css('font-size', newSize+"px");
    realignGifText();
  }
}

function updateGifArea() {
  var textLine = player.currentSeg?player.currentSeg.line:0;
  var twextLine = player.currentSeg?player.currentSeg.line*2 + 1:1
  var htmlTextLine = area.isTwextOn()||area.isTimingOn()?area.area.childNodes[textLine*2].outerHTML:area.area.childNodes[textLine].outerHTML;
  var htmlTwextLine = area.isTwextOn()||area.isTimingOn()?area.area.childNodes[twextLine].outerHTML:"<div>=</div>";
  $('#data-gif-content').html(htmlTwextLine+htmlTextLine);
  $('#data-gif-content')[0].childNodes[0].className = "gifTwext";
  $('#data-gif-content')[0].childNodes[1].className = "gifText";
  var spanNode = $($('#data-gif-content')[0].childNodes[1]).find("span");
  if(spanNode.length != 0) spanNode[0].className = "gifPlayHighlighted";
  realignGifText();
}

function updateGifTextLine() {
  var textLine = player.currentSeg?player.currentSeg.line:0;
  var htmlTextLine = area.isTwextOn()||area.isTimingOn()?area.area.childNodes[textLine*2].outerHTML:area.area.childNodes[textLine].outerHTML;
  $('#data-gif-content')[0].childNodes[1].outerHTML = htmlTextLine;
  $('#data-gif-content')[0].childNodes[1].className = "gifText";
  var spanNode = $($('#data-gif-content')[0].childNodes[1]).find("span");
  if(spanNode.length != 0) spanNode[0].className = "gifPlayHighlighted";
}

function realignGifText() {
  var line = player.currentSeg?player.currentSeg.line:0;
  var aligner = new SpanAligner();
  var playing = false;
  var textLine = area.isTwextOn()||area.isTimingOn()?line*2:line;
  var oldSize = parseFloat($(area.area.childNodes[textLine]).css('font-size'));
  var spanNode = $($('#data-gif-content')[0].childNodes[1]).find("span");
  if(spanNode.length != 0) {
    var currentSize = parseFloat($($('#data-gif-content')[0].childNodes[1]).css('font-size'));
    $(area.area.childNodes[textLine]).css('font-size', currentSize+"px");
    player.unhighlightSeg();
    updateGifTextLine();
    playing = true;
  }
  if(area.isTwextOn()) aligner.alignChunks($('#data-gif-content'), 1, 0, area.getnNs()[textLine]);
  else if(area.isTimingOn()) aligner.alignTimings($('#data-gif-content'), 1, 0);
  if(playing) {
    player.highlightSeg();
    updateGifTextLine();
    $(area.area.childNodes[textLine]).css('font-size', oldSize+"px");
  }
}

function normalOrGifView(e) {
  var playing = false;
  if(player.isPlaying()) {
    player.unhighlightSeg();
    playing = true;
  }
  if($('#data-show').is(':visible')) {  // in normal view, switch to gif
    // @adjust content while playing
    $('#control-data-bar').hide();
    $('#data-show').hide();
    $('#youtubeLinkContainer').hide();
    $('#playerContainer').height(400);
    $('#htmlVideo').height(390);
    $('#videoPlayerContainer')[0].className = "gif-view";
    $('#data-gif-view')[0].className = $('#data-show')[0].className;
    $('#data-gif-view').show();
    $('#gif-header').show();
    updateGifArea();
  } else {  // in gif view switch to normal
    $('#control-data-bar').show();
    $('#data-show')[0].className = $('#data-gif-view')[0].className;
    $('#data-show').show();
    if(area.isTimingOn()) $('#youtubeLinkContainer').show();
    $('#playerContainer').height(80);
    $('#htmlVideo').height(80);
    $('#videoPlayerContainer')[0].className = "normal-view";
    $('#data-gif-content').html("");
    // @adjust content while playing
    $('#data-gif-view').hide();
    $('#gif-header').hide();
    area.realign();
  }
  //if(playing) player.play();
}

/**
* Enter timer mode
*/
function startTimer(e) {
  if(player.isPlaying()) {
    e.preventDefault();
    twextRecorder.startRecording();
    player.startTimer(); // enter timer mode
  }
}

/**
* Tap segment
*/
function tap(e) {
  if(player.isTapTiming()) {
    e.preventDefault();
    player.tap(); // tap segments
  }
}

/**
* Move from timer mode to play mode.
*/
function fromTapToPlay(e) {
  if(player.isTapTiming()) {
    e.preventDefault();
    twextRecorder.stopRecording(function(){
      //player.resetSegments();
      //player.play();
      player.restartPlay();
    });
  } else if(player.isPlaying()) { // restart play
    e.preventDefault();
    //player.resetSegments();
    player.restartPlay();
  }
}

/**
* Pause text if playing.
*/
function fromPlayToPause(e) {
  if(player.isPlaying()) {
    e.preventDefault();
    player.pauseText();
  }
}

/**
* Show/Hide language menu.
*/
function showHideLangMenu() {
  if(!langMenu.visible())  langMenu.show(); // show/hide menu
  else  langMenu.hide();
}
/**
* Animate text segments according to timings.
*/
function playPauseText(e) {
  e.preventDefault();
  var mode; // current mode
  if(area.isTwextOn()) {
    mode = "twext";
  } else if(area.isTimingOn()) {
    mode = "timing";
  } else {
    mode = "text";
    // render Text lines in <div class="text"> format, needed if user enters new Text
    if(!player.isPlaying()) displayText(area.area.innerText);
  }

  // Set display mode in player
  if(!player.displayMode || player.displayMode != mode) {
    player.setDisplayMode(mode); //set mode at the start of play or if changed
    //isPlaying = false;
  }

  // play/pause text
  if(!player.isPlaying()) { // currently paused playing
    player.play(); // resume text play
  } else { // currently playing
    player.pauseText(); // pause text play
  }
}

/**
* Show/Hide timings(Turn on/off).
*/
function switchTimingState() {
  var text;
  var playing = false;
  if(player.isPlaying()) playing = "fromPlay";
  else if(player.isTapTiming()) playing = "fromTap";
  player.unhighlightSeg();

  if(area.isTwextOn()) { // Twexts are dispalyed, show text only
    var oldText = $.trim(area.area.innerText);  // text before switch

    text = area.extractText();  // get Text
    text = trimStringLines(text);
    displayText(text);  // display text only
    set_timing_state(false); // set state to timing off

    resumePlaying("text", playing);
    updateGifArea();

    toggle.saveData(oldText, true, false); // save twexts and chunks updated before switch
  } else if(area.isTimingOn()) {
    var oldText = $.trim(area.area.innerText);

    text = area.extractText();  // get Text
    text = trimStringLines(text);
    text = syllabifier.unsyllabifyText(text);
    displayText(text);  // display text only
    set_timing_state(false); // set state to timing off

    resumePlaying("text", playing);
    updateGifArea();

    toggle.saveData(oldText, false, true); // save twexts and chunks updated before switch
  } else {  // timings not dispalyed, show timings
    text = area.extractText();  // get Text
    text = trimStringLines(text);
    toggle.place_timing(text); // display timing slots
    set_timing_state(true); // set state to timing on

    resumePlaying("timing", playing);
  }
}

/**
* Display text in area.
* @param 'text' text to be displayed
*/
function displayText(text) {
  area.render_text_lines(text.split('\n'));
  $('#youtubeLinkContainer').hide();
  //videoPlayer.hideVideo();
  //videoPlayer.clear();
}

/**
* Display timing current state(on/off).
* @param 'state' the current timing state; true if timing on, false if timing off
*/
function set_timing_state(state) {
  if(state) { // timing on
    $('#data-bar-timing').html("timing");
  } else {  // timing off
    $('#data-bar-timing').html("text");
  }
}

/**
* Resume playing segments when toggle or mode change.
* @param 'mode' the current mode
*/
function resumePlaying(mode, playing) {
  player.setDisplayMode(mode);
  player.getSegIndices(); // get new indices of the segments
  if(playing == "fromPlay") player.highlightSeg();  // resume from play state, timeout persist, highlight current seg
  else if(playing == "fromTap") player.play();  // resume from tap state, timout lost, replay
}

/**
  * Get and display twexts(translations) if twexts are not already displayed. If twexts already exist, toggle languages of the existing twexts.
  */
function fetch_translations() {
  toggle.check_translations();
}

/**
* Switch to previous language.
*/
function toggleLangDown() {
  toggle.toggleLangDown();
}

/**
* Show/Hide url list according to current state.
*/
function showHideUrlList() {
  url_list.switchUrlListState();
}

/**
* Get video url parameters. Url in the form of "http://youtu.be/i6uVVcqPLk&loop=74.4;85.3"
* @param 'url' youtube url
* @return key/value object contains parameters
*/
function videoUrlParams(url) {
  var params = {};
  var tmp = url.split('/');
  var paramArr = tmp[tmp.length-1].split('&');
  var loopParams = paramArr[1].split('=')[1].split(';');
  params['videoName'] = paramArr[0];
  params['loopFrom'] = loopParams[0];
  params['loopTo'] = loopParams[1];
  return params;
}

function loadVideo(e, loadOnly) {
  var link = $("#youtubeLink").val();
  videoPlayer.clear();
  if(link) {
    var params = videoUrlParams(link);
    videoPlayer.setParams(params);
    videoPlayer.loadVideo(loadOnly);
  } else {  // delete video url from firebase
    videoPlayer.saveVideoUrl(null);
  }
  player.resetSegments();
}

function playFast(e) {
  if(player.isPlaying() && videoPlayer.videoSet()) {
    e.preventDefault();
    player.pauseText();
    videoPlayer.playFast();
  }
}

function playSlow(e) {
  if(player.isPlaying() && videoPlayer.videoSet()) {
    e.preventDefault();
    player.pauseText();
    videoPlayer.playSlow();
  }
}

function playGame(e) {
  if(player.isPlaying()) {
    game.play();
  }
}