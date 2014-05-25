/**
* Controller class control all twext classes and communication among them.
*/
Controller = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    var langs = this.getUserLanguages(); // get user preference languages from browser
    // Initialize objects
    this.video = new Video(); // video object
    this.audio = new Audio(); // audio object
    this.image = new Image(); // image object
    this.languageMenu = new LanguageMenu(langs);  // create language menu object to handle menu features
    this.syllabifier = new Syllabifier();  // create Syllabifier object that handles text syllabifications.
    this.twextArea = new TwextArea();  // create TwextArea object to represent the contenteditable element
    this.tapTimer = new TapTimer(this.twextArea, this.audio); // create TapTimer object
    this.gifArea = new GifArea(this.twextArea); // create GifArea object to represent the gif area element
    this.toggleHandler = new ToggleHandler(langs, this.twextArea, this.syllabifier, this.tapTimer); // create ToggleHandler object that handles toggle features
    this.urlListHandler = new UrlListHandler(); // create UrlListController object that handles list features
    this.audioListHandler = new AudioListHandler(); // create AudiosListHandler object that handles audio list feature
    this.player = new Player(this.twextArea, this.syllabifier, this.tapTimer); // create Player object that handles playing features
  },

  /**
  * Return media object.
  * If there is a video, return video object; else if there is an audio, then return audio object; return null otherwise.
  */
  getMedia: function() {
    if(this.video.isOn()) return this.video;  // video is on
    else if(this.audio.isOn())  return this.audio;  // audio is on
    return null;
  },

  /**
  * Return player object.
  */
  getPlayer: function() {
    return this.player;
  },

  /**
  * Return urlListHandler object.
  */
  getUrlListHandler: function() {
    return this.urlListHandler;
  },

  /**
  * Get the languages list saved in the browser.
  * If no list found, return the first 5 languages ("French", "Italian", "Spanish", "English", "Portuguese")
  * @return languages list
  */
  getUserLanguages: function() {
    var langs = {};
    var lang_codes = getCookie("twext_lang_codes"); // get lang codes
    var lang_names = getCookie("twext_lang_names"); // get lang names
    if(lang_codes != null && lang_codes.length > 0 && lang_names != null && lang_names.length > 0) { // cookies are found
      langs = {codes: lang_codes.split(","), names: lang_names.split(",")}; // languages codes and names arrays of user preferences
    } else {  // cookies not found, initialize langs with the first 8 entries of the languages object
      langs = {codes: languages_codes.slice(0, 8), names: languages_names.slice(0, 8)}; // first 8 languages("fr","it","es","en","pt","ro", "de","ca")
    }
    return langs;  // return languages list
  },

  /**
  * Load text data.
  * If there is a hash url, get the saved text from firebase, else return sample data.
  */
  loadData: function() {
    var shortcut = window.location.hash;  // get text shortcut
    if(shortcut && shortcut.slice(1)) { // if there is a hash value in the url
      this.loadURLData(shortcut.slice(1)); // load text and translations from firebase
    } else {  // no hash value in the url
      this.loadSampleData(); // load sample data
    }
  },

  /**
  * Load Text from firebase that is referenced by the given shortcut.
  * @param 'url' the reference hash url of the text
  */
  loadURLData: function(url) {
    firebaseHandler.get(refs.mapping+url, function(data) {
      if(data) {  // if there is a mapped text with the given url
        controller.toggleHandler.getTranslations(data.text); // get text translations

        if(data.timings) {
          controller.tapTimer.sourceText = data.text;
          controller.tapTimer.timings = data.timings;
        }

        // Load video if exists
        if(data.video) {
          $("#mediaInputLink").val(data.video);  // write video link into the text input
          controller.loadVideo(); // load video
        } else if(data.audios) {
          var lastAudioKey = controller.audioListHandler.loadList(data.audios);  // load audios to list
          controller.loadAudio(lastAudioKey); // load recorded audio
        }

        // Add this url/text to the hot list
        //controller.urlListHandler.saveToHotList({url: url, text: data.text});
        // Set current data to be saved after loading the lists
        //url_list.setCurrentUrlData({url: url, text: data.text});
      } else {  // no mapped text, invalid url
        alert("The requested URL does not exist.");
      }
    });
  },
    
  /**
  * Load some initial sample text into the input area.
  */
  loadSampleData: function() {
    // Initiate some sample data
    var data = "Twext is twin text,\n"+
               "aligned between the lines,\n"+
               "in any language you like.";
    this.toggleHandler.getTranslations(data);  // display text translations
  },

  /**
  * Save languages codes and names into the browser.
  * The codes and names arrays are converted into strings and saved in two different cookies in the browser.
  * @param 'langObj' the languages object that carry codes and names
  */
  saveLanguagesToBrowser: function(langObj) {
    var codesStr = langObj.codes.toString();  // put codes array in a string
    var namesStr = langObj.names.toString(); // put names array in a string
    setCookie("twext_lang_codes", codesStr, 365);  // save languages codes to the browser for a year
    setCookie("twext_lang_names", namesStr, 365);  // save languages names to the browser for a year
  },

  /**
  * Display timing current state(on/off).
  * @param 'state' the current timing state; true if timing on, false if timing off
  */
  setTimingState: function(state) {
    if(state) { // timing on
      $('#data-bar-timing').html("timing");
    } else {  // timing off
      $('#data-bar-timing').html("text");
    }
  },

  /**
  * Get and display twexts(translations) if twexts are not already displayed. If twexts already exist, toggle languages of the existing twexts.
  */
  fetchTranslations: function(e) {
    this.hideLangMenu();  // hide F7 language menu if opened
    this.audioListHandler.hide();
    this.saveData();
    this.player.setDisplayMode("twext");  // change display mode in twext
    this.toggleHandler.checkTranslations();
  },

  /**
  * Switch to previous language.
  */
  toggleLangDown: function(e) {
    this.saveData();
    this.toggleHandler.toggleLangDown();
  },

  /**
  * Toggle between textonly mode and timing mode (on/off timing switch).
  * If current mode is twext, switch to textonly
  * If current mode is textonly, switch to timing
  * If current mode is timing, switch to textonly
  */
  textOnlyTimingToggle: function(e) {
    var text = this.twextArea.text();
    text = this.twextArea.clearText(text);
    var mode = this.twextArea.textMode();
    if(mode == "twext" || mode == "timing") { // Twexts are dispalyed, show text only
      this.saveData();

      this.twextArea.renderLines(text.split('\n'));  // display text only
      this.setTimingState(false); // set state to timing off

      // update player
      this.player.setDisplayMode("textonly");
      this.player.updateSegsPos();  // mode change, update segs positions

      $('#mediaInputLinkContainer').hide(); // hide video input
      this.audioListHandler.hide();  // hide audio list
      if(this.gifArea.isVisible()) this.updateGifAreaContent();
    } else {  // timings not dispalyed, show timings
      this.toggleHandler.placeTimings(text, function() {
        controller.setTimingState(true); // set state to timing on
        if(controller.twextArea.isVisible()) {
          $('#mediaInputLinkContainer').show(); // show video input
          controller.audioListHandler.show();  // show audio list
        }
        // update player
        controller.player.setDisplayMode("timing");
        controller.player.updateSegsPos();  // mode change, update segs positions
      }); // display timing slots
    }
  },

  /**
  * Show/Hide url list according to current state, default state is off(hide list).
  * First key press shows last updated 10 urls(hot list).
  * Second key press shows all urls.
  * Third key press hide list, and then repeat process.
  */
  switchStateUrlList: function(e) {
    this.urlListHandler.switchState();
  },

  /**
  * Show/Hide language menu.
  */
  showHideLangMenu: function(e) {
    if(this.languageMenu.visible()) { // language menu is visible, hide menu
      this.hideLangMenu(e); // hide language menu, translate selected languages on menu hide
    } else {  // language menu is hidden, show menu
      this.languageMenu.show(); // show menu
    }
  },

  /**
  * Hide language menu.
  */
  hideLangMenu: function(e) {
    // Hide language menu, translate selected languages
    if(this.languageMenu.visible()) {
      this.languageMenu.hide(function() { // hide menu
        var selected = controller.languageMenu.getSelected(); // get selected languages from menu
        controller.toggleHandler.setSelectedLanguages(selected); // load selected to toggleHandler

        // if only one selected and it's a non bing language, do not fetch translations, return
        if(selected.names.length == 1 && $.inArray(selected.names[0], nonBing_languages_names) != -1) {
          controller.toggleHandler.displayLanguageName(selected.names[0]);
          return;
        }

        controller.toggleHandler.fillTranslations(); // translate selected languages
        controller.saveLanguagesToBrowser(selected);  // save user selection choice to browser
      });
    }
  },

  /**
  * Load Image with given url.
  * @param 'url' image url
  */
  loadImage: function(url) {
    var media = this.getMedia();
    if(media && media instanceof Video) return; // do not show image if there is a video
    var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/; // url pattern
    if(!url || !re.test(url)) return;

    this.image.load(url); // load image url to image object
    this.image.show();  // show image

    // save image to fb
    //var text = TwextUtils.textToFbKey(this.toggleHandler.toggle_data.sourceText);
    //this.image.save(text);
    // update image version in toggle_data
    //var lang = this.toggleHandler.toggle_data.findByLanguageCode("img");
    //var data = {value: url, nN: ""};
    //this.toggleHandler.toggle_data.updateVersion(lang, 0, data);
  },

  /**
  * Load video with the url typed in the text input.
  * Save the video/text mapping into firebase
  */
  loadVideo: function(e) {
    var textUrl = window.location.hash?window.location.hash.slice(1):null;  // get text url representation
    var link = $("#mediaInputLink").val();
    //this.video.clear(); // clear old video data
    if(link) {
      this.showMsg("Loading video...");  // display Loading message for video
      var params = this.videoParams(link); // get video parameters from input link
      this.video.load(params['id'], params['loopFrom'], params['loopTo'], function(loaded) {  // callback after loading video
        if(loaded) {  // video loaded
          controller.hideMsg();  // hide video message
          controller.image.clear();
          controller.video.show();  // show video
          controller.saveVideo(link); // save video to firebase
          controller.audioListHandler.hide(); // hide audio list if exist
          //if(!loadOnly) player.restartPlay();
        } else {
          controller.showMsg("Video not found"); // display not found message
          controller.video.clear(); // clear video data
          controller.saveVideo(null); // save empty video in firebase
        }
      });
    } else {  // delete video url from firebase
      this.video.clear(); // clear video data
      this.saveVideo(null);  // save empty video in fireabse
      controller.audioListHandler.show(); // show audio list if video cleared
      // load image if exist
      var langIx = controller.toggleHandler.toggle_data.findByLanguageCode("img");
      var img = controller.toggleHandler.toggle_data.getLanguageVersion(langIx, 0);
      if(img) controller.loadImage(img.data.value.split('\n')[0]);
    }
    //player.resetSegments();
  },

  /**
  * Load/Delete audio.
  */
  loadDeleteAudio: function(e, key) {
    if(e.shiftKey && e.ctrlKey) {
      this.deleteAudio(key, e.target);
    } else {
      this.loadAudio(key);
    }
  },

  /**
  * Load audio with the url typed in the text input.
  */
  loadAudio: function(key) {
    var audio = this.audioListHandler.getAudio(key);
    if(audio) {
      this.showMsg("Loading vocals...");  // display Loading message for audio
      this.audio.load(audio.id, function(loaded) {
        if(loaded) {
          $("#mediaInputLink").val(audio.id);  // write audio link into the text input
          controller.tapTimer.timings = audio.timings;  // set audio timings
          controller.hideMsg();
          controller.audio.key = key;
          var playing = controller.player.isPlaying();  // current play status
          controller.player.reset();  // reset player
          // update displayed timings if current mode is timings
          if(controller.twextArea.textMode() == 'timing') {
            var text = controller.twextArea.text();
            text = controller.twextArea.clearText(text);
            controller.toggleHandler.placeTimings(text, function() {
              if(playing) controller.player.play(text);
            });
          }
        } else {
          controller.showMsg("Audio not found");
        }
      });  // load audio
    }
  },

  /**
  * Delete audio from list and firebase.
  */
  deleteAudio: function(key, target) {
    var audio = this.audioListHandler.getAudio(key);
    var audioId = audio.id;
    // check if required to delete audio is the one loaded
    if(key == this.audio.key) { // current loaded audio is the one to delete, clear data
      this.audio.clear();
      $("#mediaInputLink").val("");
    }
    // delete audio from list
    this.audioListHandler.deleteAudio(key, target);
    // delete audio from firebase
    var url = window.location.hash?window.location.hash.slice(1):null;
    if(url) firebaseHandler.set(refs.mapping+url+"/audios/"+key, null);
    // delete audio from server
    audioId = audioId + ".wav";  // audio name on server
    $.post(
      'php/deleteFile.php',
      {filename: "audios/"+audioId},
      function(deleted) {
        if(deleted) console.log("Audio file deleted from server");
      }
    );
  },

  /**
  * Delete url if shift+ctrl+click.
  * Either the event is fired from hot or all list, url element must be deleted from them both.
  */
  checkDeleteUrl: function(e) {
    var url = e.target.id.split("-")[1];
    if(e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      this.deleteUrl(url);
    }
  },

  /**
  * Delete url data.
  */
  deleteUrl: function(url) {
    var allUrlObj = this.urlListHandler.getAllUrlObj(url);
    var hotUrlObj = this.urlListHandler.getHotUrlObj(url);

    // Delete url from all and hot lists (history)
    this.urlListHandler.deleteUrlFromLists(url);

    // delete url mapping
    firebaseHandler.remove(refs.mapping+url);

    // delete url text data
    var text = TwextUtils.textToFbKey(allUrlObj.text);  // all and hot urls have same text
    firebaseHandler.remove(refs.data+text);
  },

  /**
  * Save video/text mapping into firebase.
  * @param 'url' video link to be saved
  */
  saveVideo: function(url) {
    var shortcut = window.location.hash;  // get text shortcut
    if(shortcut && shortcut.slice(1)) { // if there is a hash value in the url
      shortcut = shortcut.slice(1);
      firebaseHandler.set(refs.mapping+shortcut+"/video", url);
    }
  },

  /**
  * Save audio data(id and timings) to firebase and add saved audio to audio list.
  */
  saveAudio: function(id) {
    // save audio data to firebase
    var hash = window.location.hash
    var url = hash?hash.slice(1):null;
    this.audio.id = id;
    var data = {id:this.audio.id, timings: this.tapTimer.timings};
    if(url) {
      var name = firebaseHandler.push(refs.mapping+url+"/audios", data);
      this.audio.key = name;
      // add audio link to list
      this.audioListHandler.addToList(name, data);
      $('#mediaInputLink').val(id);
    }
    this.hideMsg();
  },

  /**
  * Show message for media loading.
  * @param 'msg' message to be displayed
  */
  showMsg: function(msg) {
    $('#media-msg').html(msg);
    $('#media-msg').show();
  },

  /**
  * Hide video message.
  */
  hideMsg: function() {
    $('#media-msg').hide();
  },

  /**
  * Get video url parameters. Url in the form of "http://youtu.be/i6uVVcqPLk&loop=74.4;85.3"
  * @param 'url' video url
  * @return key/value object contains parameters
  */
  videoParams: function(url) {
    var params = {};
    var tmp = url.split('/');
    var paramArr = tmp[tmp.length-1].split('&');
    var loopParams = paramArr[1].split('=')[1].split(';');
    params['id'] = paramArr[0]; // video id
    params['loopFrom'] = loopParams[0]; // loop from
    params['loopTo'] = loopParams[1]; // loop to
    return params;
  },

  /**
  * Animate text segments according to timings.
  */
  playPauseText: function(e) {
    e.preventDefault();
    //var mode = this.twextArea.textMode(); // current mode
    //if(!this.player.displayMode || this.player.displayMode != mode) {
      //this.player.setDisplayMode(mode); // set current display mode in player
      //this.player.updateSegsPos();  // mode change, update segs positions
    //}
    // render Text lines in <div class="text"> format, needed if user enters new Text
    //if(mode == "textonly" && !player.isPlaying()) displayText(area.area.innerText);

    // play/pause text
    if(this.player.isPlaying()) { // currently playing
      this.player.pause(); // pause playing
      //this.player.game.reset(); // reset game
    } else { // currently paused playing
      var text = this.twextArea.clearText(this.twextArea.text());
      this.player.play(text); // play/resume playing
    }
  },

  /**
  * Pause text play with media.
  */
  pauseText: function(e) {
    if(this.player.isPlaying()) { // text is playing
      e.preventDefault();
      this.player.pause();
    }
  },

  /**
  * Change playbackrate to normal "fast".
  */
  playFast: function(e) {
    if(this.player.isPlaying() && this.video.isOn() && this.video.playbackRate != 1) {  // if video exists and is playing
      e.preventDefault();
      this.player.pause();  // pause player
      this.video.setPlaybackRate(1);
      this.player.play(this.player.sourceText); // replay after changing the rate
    }
  },

  /**
  * Change playbackrate to slow.
  */
  playSlow: function(e) {
    if(this.player.isPlaying() && this.video.isOn() && this.video.playbackRate != 0.5) {  // if video exists and is playing
      e.preventDefault();
      this.player.pause();  // pause player
      this.video.setPlaybackRate(0.5);
      this.player.play(this.player.sourceText); // replay after changing the rate
    }
  },

  /**
  * Switch from/to normal/gif view.
  * Gif area is an area shows current Text/Twext lines played with zoomed video.
  */
  normalOrGifView: function(e) {
    var media = this.getMedia();
    if(!(media && media instanceof Video) && !this.image.isOn()) return;

    if(this.twextArea.isVisible()) {  // in normal view, switch to gif
      $('#control-data-bar').hide();  // hide control data bar
      $('#url-list-controls').hide();  // hide url list control
      $('#mediaInputLinkContainer').hide();  // hide videoUrl input
      this.twextArea.hide();  // hide twextArea
      this.gifArea.show();  // show gif area

      // Update gif area content
      this.updateGifAreaContent();
    } else {  // in gif view switch to normal
      $('#control-data-bar').show();  // show control data bara
      $('#url-list-controls').show();  // show url list control
      if(this.twextArea.textMode() == "timing") $('#mediaInputLinkContainer').show();
      this.twextArea.show();  // show twext area
      this.gifArea.hide();  // hide gif area
      this.twextArea.realign(); // realign chunks
    }
  },

  /**
  * Update gif area content.
  */
  updateGifAreaContent: function() {
    var textLine = null, twextLine = null;
    var mode = this.twextArea.textMode(); // current display mode
    if(mode == "textonly") {  // no twext/timing
      textLine = this.player.currentSeg?this.player.currentSeg.line:0;  // current playing text line
    } else {  // twext/timing lines displayed
      textLine = this.player.currentSeg?this.player.currentSeg.line*2:0;  // current playing text line, consider counting twext/timing lines
      twextLine = textLine+1; // twext line
    }
    this.gifArea.renderLines(textLine, twextLine);  // display current Text/Twext lines
  },

  /**
  * Update gif area text line.
  */
  updateGifAreaTextLine: function() {
    var textLine = null, twextLine = null;
    var mode = this.twextArea.textMode(); // current display mode
    if(mode == "textonly") {  // no twext/timing
      textLine = this.player.currentSeg?this.player.currentSeg.line:0;  // current playing text line
    } else {  // twext/timing lines displayed
      textLine = this.player.currentSeg?this.player.currentSeg.line*2:0;  // current playing text line, consider counting twext/timing lines
    }
    this.gifArea.renderTextLine(textLine);  // display current Text line
  },

  /**
  * Increase font size in gif view.
  */
  gifTextSizeUp: function(e) {
    if(this.gifArea.isVisible()) {
      e.preventDefault();
      this.gifArea.increaseTextSize(2); // increase text size

      // Realign text/twext lines
      if(this.twextArea.textMode() != "textonly") {  // twext/timing displayed
        var textLine = this.player.currentSeg?this.player.currentSeg.line*2:0;  // current playing text line
        this.gifArea.realign(textLine); // realign text/twext lines
      }
    }
  },

  /**
  * Decrease font size in gif view.
  */
  gifTextSizeDown: function(e) {
    if(this.gifArea.isVisible()) {
      e.preventDefault();
      this.gifArea.decreaseTextSize(2); // decrease text size

      // Realign text/twext lines
      if(this.twextArea.textMode() != "textonly") {  // twext/timing displayed
        var textLine = this.player.currentSeg?this.player.currentSeg.line*2:0;  // current playing text line
        this.gifArea.realign(textLine); // realign text/twext lines
      }
    }
  },

  /**
  * Switch font type from/to monospace/proportional.
  */
  switchFontType: function(e) {
    var area = null, textLine = null;
    if(this.twextArea.isVisible()) {
      area = this.twextArea; // twext area
    } else {
      area = this.gifArea;  // gif area
      // get text line
      if(this.twextArea.textMode() != "textonly") textLine = this.player.currentSeg?this.player.currentSeg.line*2:0;  // current playing text line
    }

    var currentFont = area.area.className;  // current font
    if(currentFont == "" || currentFont == "monospaceFont") area.area.className = "proportionalFont";  // switch to monospaceFont
    else area.area.className = "monospaceFont";  // switch to proportionalFont

    area.realign(textLine); // realign lines
  },

  /**
  * Save current twext/timing data
  */
  saveData: function() {
    var mode = this.twextArea.textMode();
    var text = this.twextArea.clearText(this.twextArea.text()); // get text
    
    if(mode == "twext") {
      var twext = this.twextArea.clearText(this.twextArea.smallText("twext")); // get timings
      this.toggleHandler.saveTwextData(text, twext);
    }
    else if(mode == "timing") {
      var timings = this.twextArea.clearText(this.twextArea.smallText("timing")); // get timings
      this.tapTimer.saveTimings(text, timings);
      if(this.toggleHandler.toggle_data) this.toggleHandler.toggle_data.timings = timings;
    }
  },

  /**
  * On window resize event.
  */
  handleWindowResize: function(e) {
    console.log('window resize');

    // resize language menu
    this.languageMenu.resize();

    // realign chunks on resize
    this.twextArea.realign();

    if(this.gifArea.isVisible()) this.gifArea.resize();
    // realign chunks, if text is in playing, unhighlight current seg before align so that the span doesn't mess with spanAligner
    /*var playing = player.isPlaying() || player.isTapTiming();
    var clazz = player.unhighlightSeg();  // unhighlight current seg
    area.realign(); // realign chunks
    if(playing) player.highlightSeg(null, clazz);  // rehighlight current seg*/
  },

  /**
  * On window load event.
  */
  handleWindowLoad: function(e) {
    console.log('window load');

    // check browser type
    if(navigator.userAgent.search("Chrome") >= 0) {  // chrome
      // resize language menu
      this.languageMenu.resize();
      // load text and translations into textarea
      this.loadData();
    } else {
      alert("TEST IN CHROME ONLY FOR NOW");
    }
  },

  /**
  * On window beforeunload (refresh/close) event.
  */
  handleWindowBeforeUnload: function(e) {
    console.log('window beforeunload');

    this.saveData();  // save twext/timing data
  },

  /**
  * On window hashchange event. Hash change event is not a load event.
  */
  handleWindowHashChange: function(e) {
    console.log('window hashchange');

    // resize language menu
    this.languageMenu.resize();

    this.saveData();  // save twext/timing data

    // reset player
    this.player.reset();
    // clear video link input
    $("#mediaInputLink").val("");
    $("#mediaInputLinkContainer").hide();

    // reset data bar labels
    $('#data-bar-timing').html("text");
    // clear media data
    var media = this.getMedia();
    if(media) media.clear();

    // clear image
    this.image.clear();

    // clear and hide audio list
    this.audioListHandler.empty();
    this.audioListHandler.hide();

    // reset url list
    //url_list.reset();

    // load text and translations into textarea
    this.loadData();
  },

  /**
  * Handle space keydown on data-show input area.
  */
  handleSpaceKeydown: function(e) {
    if(this.twextArea.isVisible()) {  // if area is visible
      this.twextArea.pushChunk(e);  // push chunk on space
    }
  },

  /**
  * Handle backspace keydown on data-show input area.
  */
  handleBackspaceKeydown: function(e) {
    // check if it's undo hyphenation trial in timing mode
    if(this.twextArea.textMode() == "timing") {  // timing mode
      var cursorCoord = this.twextArea.getCaretPos(); // get cursor position
      var text = this.twextArea.value();  // get area input data
      var line = text.split('\n')[cursorCoord.lines]; // current line on focus
      if(line.charAt(cursorCoord.offset-1) == '-') {  // undo hyphenation
        // Delete - from all occurrences of the word where - deleted
        var txt = this.syllabifier.undoWordHyphenation(text, cursorCoord);
        if(txt) {
          e.preventDefault();
          this.twextArea.renderPairedLines(txt.split('\n'), 'timing');  // render updated lines
          this.twextArea.setCaretPos(cursorCoord.lines, cursorCoord.offset-1);  // set cursor position after deleting the -
          this.syllabifier.setHyphenatedText(this.twextArea.text());  // set new hyphenated text
        }
      }
    } else {  // pull chunk
      this.twextArea.pullChunk(e); // pull chunk
    }
  },

  /**
  * On data-show input area keyup event.
  */
  handleAreaKeyup: function(e) {
    if(this.twextArea.textMode() == "timing") { // timing lines are displayed
      var cursorCoord = this.twextArea.getCaretPos(); // cursor position
      var text = this.twextArea.value(); //get area input data
      var line = text.split('\n')[cursorCoord.lines]; // current line on focus
      if(line.charAt(cursorCoord.offset-1) == '-') {  // hyphenate word
        // Insert - in all occurrences of the word where - inserted
        var txt = this.syllabifier.hyphenateWord(text, cursorCoord);
        if(txt) {
          this.twextArea.renderPairedLines(txt.split('\n'), 'timing');  // render updated lines
          this.twextArea.setCaretPos(cursorCoord.lines, cursorCoord.offset);  // set cursor position after inserting the -
          this.syllabifier.setHyphenatedText(this.twextArea.text()); // set new hyphenated text
        }
      }
    }
  },

  /**
  * On data-show input area keydown event.
  */
  handleAreaKeydown: function(e) {
    // Adjust area limit, if user type a character without ctrlKey and is over limit then stop the event and return.
    if(!e.ctrlKey && !this.twextArea.adjustLimit(e.keyCode)) return false;
  },

  /**
  * On document keydown.
  */
  handleDocumentKeydown: function(e) {
    if(e.keyCode == keys['f8'] && !e.ctrlKey && !e.altKey && !e.shiftKey) this.fetchTranslations(e);  // F8 press, translate
    else if(e.keyCode == keys['f8'] && !e.ctrlKey && e.altKey && !e.shiftKey) this.toggleLangDown(e); // alt+F8, toggle down
    else if(e.keyCode == keys['f4'] && !e.ctrlKey && !e.altKey && !e.shiftKey) this.textOnlyTimingToggle(); // F4 press, timing switch
    else if(((!e.ctrlKey && e.keyCode == keys['f2']) || (e.ctrlKey && e.keyCode == keys['space'])) && !e.altKey && !e.shiftKey) this.playPauseText(e);  // F2 press or ctrl+space, play/pause text
    else if(e.keyCode == keys['f2'] && !e.ctrlKey && e.altKey && !e.shiftKey) this.normalOrGifView(e);  // alt+F2 press, big/small view switch
    else if(e.keyCode == keys['f7'] && !e.ctrlKey && !e.altKey && !e.shiftKey) this.showHideLangMenu(e);  // F7 press, language menu
    else if(e.keyCode == keys['f7'] && !e.ctrlKey && e.altKey && !e.shiftKey) this.switchFontType(e); // alt+F7 press, font switch
    else if(e.keyCode == keys['f9'] && !e.ctrlKey && !e.altKey && !e.shiftKey) this.switchStateUrlList(e);  // f9 press, url list
    else if($.inArray(e.keyCode, Object.toArray(this.player.tapTimer.keys)) != -1 && !e.ctrlKey && !e.altKey && !e.shiftKey) {  // tap key press
      if(!this.tapTimer.isTapping) this.tapTimer.start(e);  // start tapping
      else this.tapTimer.tap(e);  // tap
    }
    else if($.inArray(e.keyCode, Object.toArray(this.player.game.keys)) != -1 && !e.ctrlKey && !e.altKey && !e.shiftKey) this.player.game.play(); // play game
    else if(e.ctrlKey && e.altKey && e.keyCode == keys['+']) this.gifTextSizeUp(e); // increase font size
    else if(e.ctrlKey && e.altKey && e.keyCode == keys['-']) this.gifTextSizeDown(e); // decrease font size
  },

  /**
  * On document click.
  */
  handleDocumentClick: function(e) {
    // no hide if clicked on f7 data bar control(there is another separate click action for it) or on the language menu and its options
    if(e.target.id == 'data-bar-f7' || e.target.id == 'data-bar-heart' || e.target.id == 'language_menu_container' || e.target.nodeName == 'OPTION') return;
    this.hideLangMenu();
  }
});