// Global objects used through page life time.
var area = null, syllabifier = null, timingCreator = null, player = null, langMenu = null, toggle = null, url_list = null;
var firebaseRef = "https://readfm.firebaseio.com/";  // firebase url

// Keyboard keys' codes used
var keys = {
  'backspace': 8,
  'enter': 13,
  'esc': 27,
  'space': 32,
  'delete': 46,
  'a': 65,
  'f': 70,
  'j': 74,
  'f7': 118,
  ';': 186
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

  // Load all languages (in languages.js) into menu
  langMenu.loadLanguageList(toggle.selectedLanguages);

  // Attach events
  attachEvents();
});

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
  if(playing) player.highlightSeg(clazz);  // rehighlight current seg
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
  url_list.loadList();
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
  // load text and translations into textarea
  toggle.loadText();
}

/**
* On document keydown.
*/
function onDocumentKeydown(e) {
  if(player.isPlaying()) {
    if(e.keyCode == keys['a']) startTimer(e);
  } else if(player.isTapTiming()) {
    if(e.keyCode == keys['f'] || e.keyCode == keys['j']) tap(e);
    else if(e.keyCode == keys['enter'] || e.keyCode == keys[';']) {
      e.preventDefault();
      player.playText();
    }
  }
}

/**
* On body keydown event.
*/
function onBodyKeydown(e) {
  if(e.keyCode == keys['f7']) { // If F7 is pressed
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
    if((player.isPlaying() && e.keyCode != keys['a']) || (player.isTapTiming() && e.keyCode != keys['f'] && e.keyCode != keys['j'] && e.keyCode != keys['enter'])) return false;
  }

  // Check keys for proper event
  if(e.keyCode == keys['backspace']) onBackspace(e);  // On backspace
  else if(e.keyCode == keys['space']) onSpace(e);  // On space
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
  area.onSpace(e);  // push chunk
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

/**
* Enter timer mode
*/
function startTimer(e) {
  e.preventDefault();
  player.startTimer(); // enter timer mode
}

/**
* Tap segment
*/
function tap(e) {
  e.preventDefault();
  player.tap(); // tap segments
  
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
function playPauseText() {
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
    isPlaying = false;
  }

  // play/pause text
  if(!player.isPlaying()) { // currently paused playing
    player.playText(); // resume text play
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

    toggle.saveData(oldText, true, false); // save twexts and chunks updated before switch
  } else if(area.isTimingOn()) {
    var oldText = $.trim(area.area.innerText);

    text = area.extractText();  // get Text
    text = trimStringLines(text);
    text = syllabifier.unsyllabifyText(text);
    displayText(text);  // display text only
    set_timing_state(false); // set state to timing off

    resumePlaying("text", playing);

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
  else if(playing == "fromTap") player.playText();  // resume from tap state, timout lost, replay
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