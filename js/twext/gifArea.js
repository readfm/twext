/**
* This class is used to do handle gif area.
*/
GifArea = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
	__init__: function(twextArea) {
    this.area = $('#gif-data-show')[0]; // gif element
    this.content = $('#gif-data-content');  // gif area text content
    this.header = $('#gif-header'); // gif header
    this.container = $('#playerContainer'); // container element
    this.twextArea = twextArea; // twextArea object
    this.video = null; // video object
    this.aligner = new SpanAligner(); // spanAigner object
  },

  /**
  * Check if gif area is visible.
  */
  isVisible: function() {
    return $(this.area).is(':visible');
  },

  /**
  * Show gif area.
  */
  show: function() {
    var media = controller.getMedia();  // get current media object
    if(!media || !media instanceof Video) return; // if no video, no gif

    this.video = media; // set video
    this.container.height(400); // set gif container height
    this.video.height(390);  // set video height
    this.video.videoContainer[0].className = "gif-view";  // change class of video container
    this.area.className = this.twextArea.area.className;  // transfer current font from twext area to gif area
    $(this.area).show();  // show gif area
    this.header.show();  // show gif header
  },

  /**
  * Hide gif area.
  */
  hide: function() {
    this.container.height(80);  // set container height back to normal
    this.video.height(80); // set video height back to normal
    this.video.videoContainer[0].className = "normal-view"; // change class of video container back to normal
    this.twextArea.area.className = this.area.className;  // transfer current font from gif area to twext area
    $(this.area).hide(); // hide gif area
    this.header.hide(); // hide header
  },

  /**
  * Render Text/Twext lines.
  */
  renderLines: function(textLine, twextLine) {
    var currentFontSize = $(this.content[0].childNodes[1]).css('font-size');
    var htmlTextLine = this.twextArea.area.childNodes[textLine].outerHTML;  // text line html
    var htmlTwextLine = twextLine?this.twextArea.area.childNodes[twextLine].outerHTML:"<div>=</div>"; // twext line html
    this.content.html(htmlTwextLine+htmlTextLine);  // show lines
    this.content[0].childNodes[0].className = "gifTwext"; // change class of twextLine
    this.content[0].childNodes[1].className = "gifText";  // change class of text line
    $(this.content[0].childNodes[1]).css('font-size', currentFontSize);

    // if there is a played seg, change its class to be gif
    var spanNode = $(this.content[0].childNodes[1]).find("span"); // find span node
    if(spanNode.length > 0) spanNode[0].className = "gifPlayHighlighted";
    this.realign(textLine); // align chunks
  },

  /**
  * Render Text line.
  */
  renderTextLine: function(textLine) {
    var currentFontSize = $(this.content[0].childNodes[1]).css('font-size');
    var htmlTextLine = this.twextArea.area.childNodes[textLine].outerHTML;  // text line html
    this.content[0].childNodes[1].outerHTML = htmlTextLine;
    this.content[0].childNodes[1].className = "gifText";  // change class of text line
    $(this.content[0].childNodes[1]).css('font-size', currentFontSize);

    // if there is a played seg, change its class to be gif
    var spanNode = $(this.content[0].childNodes[1]).find("span"); // find span node
    if(spanNode.length > 0) spanNode[0].className = "gifPlayHighlighted";
  },

  /**
  * Align Text/Twext lines
  * @param 'textLine' Text line index, used to get line chunks
  */
  realign: function(textLine) {
    var mode = this.twextArea.textMode(); // current display mode
    if(mode == "twext") {
      var lang = this.twextArea.language;
      var ver = this.twextArea.version;
      if(this.twextArea.chunks[lang] && this.twextArea.chunks[lang][ver] && this.twextArea.chunks[lang][ver][textLine])
        this.aligner.alignChunks(this.content[0], 1, 0, TwextUtils.chunksTonN(this.twextArea.chunks[lang][ver][textLine])); // align chunks
    }
    else if(mode == "timing") this.aligner.alignTimings(this.content[0], 1, 0); // align timings
  },

  /**
  * Increase text size by the 'add' value.
  * @param 'add' amount added to text size
  */
  increaseTextSize: function(add) {
    var currentSize = parseFloat($(this.content[0].childNodes[1]).css('font-size'));  // current size
    var newSize = currentSize + add;  // increased size
    $(this.content[0].childNodes[1]).css('font-size', newSize+"px");
  },

  /**
  * Decrease text size by the 'add' value.
  * @param 'add' amount subtracted from text size
  */
  decreaseTextSize: function(add) {
    var currentSize = parseFloat($(this.content[0].childNodes[1]).css('font-size'));  // current size
    var newSize = currentSize-add < 0 ? currentSize : currentSize-2;  // decreased size
    $(this.content[0].childNodes[1]).css('font-size', newSize+"px");
  }
});