/**
* Global objects.
*/
var controller, firebaseHandler;
var twextArea, player, syllabifier; // accessed by other modules
var keys = {
  'space': 32,
  "f1": 112,
  "f2": 113,
  "f4": 115,
  "f7": 118,
  "f8": 119,
  "f9": 120,
  "f10": 121,
  '+': 187,
  '-': 189
};

/**
* Initialize data on document load.
*/
$(document).ready(function() {
  /**
  * Initialize objects of twext classes.
  */
  function init() {
    console.log('Init data');

    firebaseHandler = new FirebaseHandler();  // initialize backend comunicator object
    controller = new Controller();  // initialize controller object, all data objects initialized with controller
    attachEvents(); // attach events of elements    
  }

  /**
  * Attach events of elements.
  */
  function attachEvents() {
    // Attach 'paste' event to document, reformat pasted text.
    document.querySelector("div[contenteditable]").addEventListener("paste", function (e) {
      e.preventDefault();
      var pastedText = e.clipboardData.getData("text/plain"); // get text to paste
      document.execCommand("insertHTML", false, pastedText);  // append pasted text to element
      var area = controller.twextArea;
      var caret = area.getCaretPos();	// get current cursor pos
      var text = area.value();  // text after paste
      // drop off characters more than the limit
      var mode = area.textMode();
      if(mode == "twext" || mode == "timing") area.renderPairedLines(text.split('\n'), mode);
      else if(mode == "textonly") {
      if(text.length > area.limit) text = text.substring(0, area.limit);
        area.renderLines(text.split('\n'));
      }
      area.setCaretPos(caret.lines, caret.offset);	// set cursor back to its position

      // load image if url is pasted in first twext line
      /*if(mode == "twext") {
        pastedText = $.trim(pastedText);
        var twextLines = area.smallText("twext").split('\n');
        var currentLang = controller.toggleHandler.language;  // current displayed language
        var currentLangCode = controller.toggleHandler.toggle_data.getLanguage(currentLang).language;
        if(twextLines.length > 0 && $.trim(twextLines[0]) == pastedText && currentLangCode == "img") {
          controller.loadImage(pastedText);
          controller.saveData();
        }
      }*/
    });

    // Attach window events
    $(window).bind("resize", $.proxy(controller.handleWindowResize, controller)); // window resize event
    $(window).bind("load", $.proxy(controller.handleWindowLoad, controller)); // window load event
    $(window).bind("beforeunload", $.proxy(controller.handleWindowBeforeUnload, controller)); // window refresh/close event
    $(window).bind("hashchange", $.proxy(controller.handleWindowHashChange, controller)); // window hash change event

    // Attch document events
    //$(document).bind("keydown","f8", $.proxy(controller.fetchTranslations, controller));  // F8 key down event, Get translations of area text
    //$(document).bind("keydown","alt+F8", $.proxy(controller.toggleLangDown, controller)); // Alt+F8 keys down event, Switch to previous language
    //$(document).bind("keydown","f4", $.proxy(controller.textOnlyTimingToggle, controller));  // F4 key down event, Turn timings on/off
    //$(document).bind("keydown", "f9", $.proxy(controller.switchStateUrlList, controller)); // F9 keydown event, Show/Hide url list
    //$(document).bind("keydown", "f7", $.proxy(controller.showHideLangMenu, controller)); // F7 keydown event, Show/Hide language menu
    //$(document).bind("keydown", "f2", $.proxy(controller.playPauseText, controller));  // F2 keydown event, play/pause text with media
    //$(document).bind("keydown", "ctrl+space", $.proxy(controller.playPauseText, controller)); //ctrl+space keydown event, Play/Pause text with media
    $(document).bind("keydown", "space", $.proxy(controller.pauseText, controller)); // Alt+F2 keydown event, pause text
    $(document).bind("keydown", "h", $.proxy(controller.playFast, controller)); // h keydown event, play in fast rate
    $(document).bind("keydown", "g", $.proxy(controller.playSlow, controller)); // g keydown event, play in slow rate
    //$(document).bind("keydown", "alt+F2", $.proxy(controller.normalOrGifView, controller)); // Alt+F2 keydown event, switch to/from gif/normal view
    //$(document).bind("keydown", "alt+F7", $.proxy(controller.switchFontType, controller)); //Alt+F7 keydown event,switch font monospace/proportional
    $(document).bind("keydown", $.proxy(controller.handleDocumentKeydown, controller)); // On document keydown

    // Bind hide language menu event
    $(document).bind("keydown", "esc", $.proxy(controller.hideLangMenu, controller)); // esc keydown event, Hide language menu
    $(document).bind("click", $.proxy(controller.handleDocumentClick, controller)); // hide language menu when click ouside

    // Attach twext area events
    //$('#data-show').bind("paste", $.proxy(controller.handlePaste, controller)); // on area paste event
    $('#data-show').bind("keydown", "space", $.proxy(controller.handleSpaceKeydown, controller)); // on area space keydown event
    $('#data-show').bind("keydown", "backspace", $.proxy(controller.handleBackspaceKeydown, controller)); // on area backspace keydown event
    $('#data-show').bind("keydown", $.proxy(controller.handleAreaKeydown, controller)); // on area keydown event
    $('#data-show').bind("keyup", $.proxy(controller.handleAreaKeyup, controller));  // on area keyup event

    $('#data-bar-f8, #data-bar-language').bind("click", $.proxy(controller.fetchTranslations, controller));  // Get translations of area text
    $('#data-bar-f7, #data-bar-heart').bind("click", $.proxy(controller.showHideLangMenu, controller)); // show/hide language menu
    $('#data-bar-f4, #data-bar-timing').bind("click", $.proxy(controller.textOnlyTimingToggle, controller));  // switch on/off timings
    $('#data-bar-f1, #data-bar-urllist').bind("click", $.proxy(controller.switchStateUrlList, controller));  // show/hide url list
    $('#data-bar-f2, #data-bar-play').bind("click", $.proxy(controller.playPauseText, controller)); // play/pause text with media
    $('#data-bar-f10, #data-bar-pic').bind("click", $.proxy(controller.toggleThumbs, controller)); // toggle thumbs
    $('#data-bar-f9, #data-bar-bigview').bind("click", $.proxy(controller.normalOrGifView, controller)); // normal/big view switch

    // Load video on typing the url
    $('#mediaInputLink').bind("change", $.proxy(controller.loadMedia, controller));
  }

  // initialize data objects and bind events
  $(init);
});