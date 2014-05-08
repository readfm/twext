/**
* Global objects.
*/
var controller, firebaseHandler;

var sampleText = "Play any text.\nTap Tap Tap.\nSync Vocaltext.";
var sampleTimings = "0.77 1.07 1.25\n2.14 2.39 2.70\n3.46 3.96 4.15 4.37";
var sampleAudioSrc = "http://xc.cx/draft/textime/audios/L2vPBn1MtP.wav";

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
      var text = e.clipboardData.getData("text/plain"); // get text to paste
      document.execCommand("insertHTML", false, text);  // append pasted text to element
      var area = controller.twextArea;
      var caret = area.getCaretPos();	// get current cursor pos
      text = area.value();  // text after paste
      // drop off characters more than the limit
      var mode = area.textMode();
      if(mode == "timing") area.renderPairedLines(text.split('\n'), mode);
      else if(mode == "textonly") {
        // cut out any text more than 5 lines
        var lines = text.split('\n');
        if(lines.length > 5) text = lines.slice(0, 5).join('\n');
        // adjust limit
        if(text.length > area.limit) text = text.substring(0, area.limit);
        area.renderLines(text.split('\n'));
      }
      area.setCaretPos(caret.lines, caret.offset);	// set cursor back to its position
    });

    // Attach window events
    $(window).bind("resize", $.proxy(controller.handleWindowResize, controller)); // window resize event
    $(window).bind("load", $.proxy(controller.handleWindowLoad, controller)); // window load event

    // Attch document events
    $(document).bind("keydown","f4", $.proxy(controller.textOnlyTimingToggle, controller));  // F4 key down event, Turn timings on/off
    $(document).bind("keydown", "f2", $.proxy(controller.playPauseText, controller));  // F2 keydown event, play/pause text with media
    $(document).bind("keydown", "ctrl+space", $.proxy(controller.playPauseText, controller)); //ctrl+space keydown event, Play/Pause text with media
    $(document).bind("keydown", "space", $.proxy(controller.pauseText, controller)); // Alt+F2 keydown event, pause text
    $(document).bind("keydown", "alt+F7", $.proxy(controller.switchFontType, controller)); //Alt+F7 keydown event,switch font monospace/proportional
    $(document).bind("keydown", $.proxy(controller.handleDocumentKeydown, controller)); // On document keydown
    $(document).bind("click", $.proxy(controller.handleDocumentClick, controller));

    // Attach twext area events
    $('#data-show').bind("keydown", "backspace", $.proxy(controller.handleBackspaceKeydown, controller)); // on area backspace keydown event
    $('#data-show').bind("keydown", $.proxy(controller.handleAreaKeydown, controller)); // on area keydown event
    $('#data-show').bind("keyup", $.proxy(controller.handleAreaKeyup, controller));  // on area keyup event

    $('#data-bar-f4, #data-bar-timing').bind("click", $.proxy(controller.textOnlyTimingToggle, controller));  // switch on/off timings
    $('#data-bar-f2, #data-bar-play').bind("click", $.proxy(controller.playPauseText, controller)); // play/pause text with media
  }

  // initialize data objects and bind events
  $(init);
});