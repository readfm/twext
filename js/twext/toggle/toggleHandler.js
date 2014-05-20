/**
* ToggleHandler class handles all text/twext toggle features.
*/
ToggleHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function(langs, area, syllabifier, tapTimer) {
    this.language = 0; // current language
    this.version = 0;  // current version
    this.toggle_data = null; // object to carry all languages information (languages, versions, translations, chunks)
    this.twextArea = area;  // twext working area
    this.syllabifier = syllabifier; // syllabifier object, handles text hyphenation
    this.tapTimer = tapTimer; // tapTimer object, used to get Timings
    // language translations data. To add/delete a language, go to languages.js
    this.selectedLanguages = langs; // Get user prefernces from the browser, if not found then set to the first 5 languages
    this.translator = new Translation(); // Create translator object for text translation
  },

  /**
  * Set the current selected languages object.
  * @param 'langs' languages' codes and names
  */
  setSelectedLanguages: function(langs) {
    this.selectedLanguages = langs;
  },

  /**
  * Switch to next language.
  */
  toggleLangUp: function() {
    this.switchLanguage(1); // Switch to next language, add 1 to the current language
  },

  /**
  * Switch to previous language.
  */
  toggleLangDown: function() {
    this.switchLanguage(-1);  // Switch to previous language, subtract 1 from the current language
  },

  /**
  * Round Switch to previous/next language (move to first version of the previous/next language)
  * @param 'add' amount to subtract/add from/to current language
  */
  switchLanguage: function(add) {
    // Data before language switch, save data later into firebase(save after render new language data,so that ui is not slowed by firebase requests)
    //var oldLang = this.language, oldVer = this.version, oldText = $.trim(area.area.innerText), displayedLangName = $('#data-bar-language').text();
    //var twextOn = area.isTwextOn(), timingOn = area.isTimingOn();
    //var oldLang = this.language;

    var nl = this.language+add;  // new language
    var lcount = this.toggle_data.languageCount(); // number of existing languages
    if(nl < 0) {  // if current language was the first and need to toggle down
      nl = lcount-1;  // switch to last language
    } else if(nl >= lcount) { // if current language was the last language and need to toggle up, switch to first one
      nl = 0; // switch to first language
    }
    this.displayLanguage(nl, 0, add);

    //this.saveTwextData(oldLang);
    /*if($('#data-gif-view').is(':visible')) {
      updateGifArea();
    }*/
    // Save data (text edits and chunks) before language switch into firebase
    //var oldLangName = this.toggle_data.language(oldLang).language;
    //if(displayedLangName == oldLangName) { // displayed language is the old language, then save its data
      //var saved = area.saveData(oldLang, oldVer, this.toggle_data.getLines(oldLang, oldVer), oldText, twextOn, timingOn); // Save data into firebase
      //this.toggle_data.updateVersion(saved, oldVer, oldLang);  // update old language version with the saved data (chunks)
    //}
  },

  /**
  * Get and display twexts(translations) if twexts are not already displayed. If twexts already exist, toggle languages of the existing twexts.
  * If no twexts are displayed, get translations of the area input text(from firebase or google), display them as twexts for each Text line.
  * If twexts are displayed, toggle languages.
  */
  checkTranslations: function() {
    // check if new text is displayed in divs
    if($('.text').length == 0) {  // in case of typing new text
      this.twextArea.renderLines(this.twextArea.value().split('\n'));
    }

    var text = this.twextArea.text(); // text to be translated
    text = this.twextArea.clearText(text); // clear text from syllabification, align or higlight

    // check if it's a new text
    var isNewText = this.toggle_data == null || (this.toggle_data != null && this.toggle_data.sourceText != text);
    if(isNewText) { // text is new
      // @TODO reset player
      this.twextArea.chunks = []; // reset chunks
      controller.audioListHandler.empty();
      $("#mediaInputLink").val("");
      this.getTranslations(text); // get translations of text from firebase of google
    } else {  // same text
      if(this.twextArea.textMode() == "twext") {  // some language displayed, toggle to next language
        this.toggleLangUp(); // toggle to next language
        //resumePlaying("twext", playing);
      } else {  // timing or textonly, display current language
        //var timingOn = area.isTimingOn();
        //var oldText = $.trim(area.area.innerText);
        this.displayLanguage(this.language, this.version); // display twexts of current language/version

        //resumePlaying("twext", playing);

        // Save timing data into firebase
        //var saved = area.saveData(this.language, this.version, timingCreator.getTimingLines(), oldText, false, timingOn);
        //timingCreator.setTimingLines(saved);  // update old timing lines with the saved ones
      }
    }
    this.twextArea.setCaretPos(0,0);  // set cursor position at the start of area text
  },

  /**
  * Get translations of text from either firebase or Bing translate api.
  * Retrieve all translations of text from firebase, then transfer the data into toggle_data object.
  * if any of the selected languages is not loaded from firebase, translate from Bing.
  * @param 'text' text to be translated
  */
  getTranslations: function(text) {
    var toggle = this;

    // Create toggle_data object to carry all languages information (languages, versions, translations, chunks)
    this.toggle_data = new ToggleData();
    this.toggle_data.sourceText = text; // set source text
    this.language = 0;  // reset current language
    this.version = 0; // reset current version

    this.displayTranslating();  // display translating msg while get text translations

    // Get all firebase saved data(translations, timings, url); getting all languages in one request is faster than getting each language separately
    var fbText = TwextUtils.textToFbKey(text);
    firebaseHandler.get("data/"+fbText, function(data) {
      var translations = null;
      if(data) {
        /*if(data.timings) {  // if timing lines retrieved from firebase
          toggle.tapTimer.sourceText = text; // set source text of tapTimer object
          toggle.tapTimer.timings = data.timings; // load saved timings into tapTimer object
        }*/
        if(data.url) toggle.toggle_data.url = data.url;
        if(data.sourceLanguage) toggle.toggle_data.sourceLanguage = data.sourceLanguage;
        translations = data.translations;
      }
      toggle.fillTranslations(translations); // load translations into toggle_data object, and translate languages not found in fb
      toggle.generateTextUrl(text); // create shortcut for the text to be used in the url to retrieve text
    });
  },

  /**
  * Load all retrieved fb translations into toggle_data object and display text/twext.
  * Check if all selected language are loaded from firebase. If any of the selected languages is not loaded, translate from bing.
  * @param 'translations' translations loaded from fb, null if only selected languages required to be translated
  */
  fillTranslations: function(translations) {
    var langIx = null, verIx = null;
    var codes = this.selectedLanguages.codes;

    this.displayTranslating(); //display translating msg.This is necessary for conditions where fillTranslations called without its parent methods

    // detect source language if not retrived from fb
    if(!this.toggle_data.sourceLanguage) this.detectTextLanguage(this.toggle_data.sourceText); // get language of the text

    // load fb translations into toggle_data object
    if(translations) {  // if there are firebase trasnlations
      for(lang in translations) { // loop on translations retrieved from firebase
        langIx = this.toggle_data.addLanguage(lang);  // add language
        // add versions
        if(translations[lang]) {
          for(ver in translations[lang]) {
            verIx = this.toggle_data.addVersion(langIx, ver, translations[lang][ver]);
            if(translations[lang][ver].nNs) this.twextArea.loadToAllChunks(langIx, verIx, translations[lang][ver].nNs);//load lang chunks to twextArea
            // load image if exists
            if(lang == "img") controller.loadImage(translations[lang][ver].value.split('\n')[0]);
          } // end for
        } // end if
      } // end for
    } // end if

    // pick unloaded languages from bing if text source language is supported by bing
    if($.inArray(this.toggle_data.sourceLanguage, nonBing_languages_codes) == -1) this.translateLanguages(codes);
    else {  // text source language is not supported by bing, add "-" translations lines
      this.addNonBingLanguages(codes);  // add non bing languages

      this.displayLanguage(this.language, this.version); // display current language (current is the first when text first translated)
      this.hideTranslating(); // hide translating msg after getting text translations
    }
  },

  /**
  * Translate text to sepcified languages using Bing translator api.
  * Loop on lang codes, if language has been already loaded to toggle_data, then skip, else translate from bing.
  * Because Bing transaltor js request can only be done through a script element, multiple requests cannot be sent at the same time cos language code will be lost, so the algorithm is to send one request at a time. the callback of the translator recall this method with new start index.
  * Display the first language when all languages are loaded.
  * @param 'codes' languages codes
           'index' start index of the loop, this is specified when called from the callback of translator
  */
  translateLanguages: function(codes, index) {
    var langIx;
    var i = index?index:0;
    for(; i<codes.length; i++) {
      langIx = this.toggle_data.findByLanguageCode(codes[i]); // check if language exist
      if(langIx == -1) {  // language not found, translate from bing if supported
        if($.inArray(codes[i], nonBing_languages_codes) == -1 && codes[i] != "img" && codes[i] != "link") {
          this.translate(this.toggle_data.sourceText, codes[i], codes, i);
          return;
        }
        else this.addNonBingLanguages([codes[i]]);  // add this non bing language to toggle_data
      }
    } // end for

    this.displayLanguage(this.language, this.version); // display current language (current is the first when text first translated)
    this.hideTranslating(); // hide translating msg after getting text translations
  },

  /**
  * Add non bing languages into toggle_data with empty twexts(- in each line) to prepare user to enter them manually
  * @param 'codes' languages codes
  */
  addNonBingLanguages: function(codes) {
    var i, twexts, langIx, textKey;
    var len = this.toggle_data.sourceText.split('\n').length;
    for(i=0; i<codes.length; i++) {
      twexts = new Array(len).fill('-').join('\n');
      langIx = this.toggle_data.addLanguage(codes[i]);  // add language
      this.toggle_data.addVersion(langIx, "1-0", {value: twexts, nNs: ""});  // add new clean version with empty chunks

      // Save text translation into firebase
      //textKey = TwextUtils.textToFbKey(this.toggle_data.sourceText);
      //firebaseHandler.set("data/"+textKey+"/translations/"+codes[i]+"/1-0", {value: twexts, nNs: ""});
    }
  },

  /**
  * Display twexts of the given language. If the language to display is not in the selected languages, the switch to the language after it.
  * @param 'lang' the language number to be displayed
           'ver' the language version number to be displayed
		       'add' used in case of "language to display" is not selected, 1 switch to next language, -1 switch to previous language
  */
  displayLanguage: function(lang, ver, add) {
    this.language = lang; // set the current language
    this.version = ver?ver:0;
    // Check if the language to display is in the selected language list, if not then switch to the language after it.
    var langCode = this.toggle_data.getLanguage(lang).language;  // get language code
    if($.inArray(langCode, this.selectedLanguages.codes) == -1) {  // if language not included in selected language list, switch to the one after
      add = add?add:1;
      this.switchLanguage(add, ver); // switch to next language
    } else {  // language included in selected languages, switch to this language
      this.placeTwext(lang, ver); // display Text/Twext lines
    }
  },

  /**
  * Display Text/Twext lines (text/translation) and align each pair.
  * Get the language version, get Text/Twext, align and render lines, set langauge and version display names.
  * @param 'lang' the language number to be dispalyed
           'ver' the language version to be displayed
  */
  placeTwext: function(lang, ver) {
    var doc = this.toggle_data.getLanguageVersion(this.language, this.version);
    if(doc) {
      var twext = doc.data.value;
      var lines = this.meldPairedLines(this.toggle_data.sourceText, twext); // Get Text/Twext lines
      $("#main").show();  // show page content
      this.renderLines(lines); // render Text/Twext lines
      this.displayLanguageName();  // display language name

      // update player data
      var player = controller.getPlayer();
      if(player.displayMode != "twext") {
        player.updateSegsPos();  // mode change, update segs positions
        player.setDisplayMode("twext");
      }

      $('#mediaInputLinkContainer').hide(); // hide video input
    }
  },

  /**
  * Get paired lines.
  * @param 'big' big sized string source text
           'small' small sized string (twext or timing)
  * @return Text/Twext lines
  */
  meldPairedLines: function(big, small) {
    var i = 0, j = 0, lines = [];
    var bigLines = big.split("\n"); // TEXT lines
    var smallLines = small.split("\n"); // small lines (twext or timing)
    for(i=0; i<bigLines.length ; i++) {  // loop over source text lines
      lines.push(bigLines[i]); // add Text line
      lines.push(smallLines[i]); // add Twext line
    }
    return lines;  // return Text/Twext lines
  },

  /**
  * Render Text/Twext lines (text/translation) and align each pair.
  * Align and render lines, set langauge and version display names.
  * @param 'lines' Text/Twext lines to be displayed
  */
  renderLines: function(lines, secondClass) {
    this.twextArea.language = this.language; // set current language in the area
    this.twextArea.version = this.version; // set current version in the area
    this.twextArea.renderPairedLines(lines, secondClass);  // render the lines

    if(this.twextArea.isVisible()) {
      this.twextArea.realign(); // align Text/Twext lines
    } else {  // gif area is visible
      controller.updateGifAreaContent(true);  // update gif area
    }
  },

  /**
  * Get timing lines and display paired text/timing lines.
  * @param 'text' text to be rendered with timings
  */
  placeTimings: function(text, callback) {
    var toggle = this; // instance of this, used in callbacks
    this.syllabifier.syllabifyText(text, function(hText) { // syllabify text to get segments
      toggle.tapTimer.getTimings(text, hText, function(timings) {
        var lines = toggle.meldPairedLines(hText, timings);  // merge lines
        toggle.renderLines(lines, 'timing'); // display Text/Timing lines
        callback();
        /*if($('#data-gif-view').is(':visible')) {
          updateGifArea();
        } else {
          $('#youtubeLinkContainer').show();
        }*/
      }); // timing lines
    });
  },

  /**
  * Display current language name.
  * @param 'l' language name to be displayed, if not specified then display current language name
  */
  displayLanguageName: function(l) {
    var lang = l?l:this.toggle_data.getLanguageName(this.language);  // get current language name
    if(lang) {  // valid language
      $('#data-bar-language').html(lang); // Display language name (French, English..)
    } else {  // not a valid language
      $('#data-bar-language').html('Unknown');  // Display "Unknown"
    }
  },

  /**
  * Translate text to the sepcified language.
  * @param 'textSource' the text to be transalted
           'targetLang' the target language code (en, fr, it, es...)
           'langs' languages to be translated
           'index' current translated language number
  */
  translate: function(textSource, targetLang, langs, index) {
    var toggle = this;
    // Get the access token for translation
    firebaseHandler.get("AccessToken", function(accessToken) {  //callback
      console.log("To translate to "+targetLang);
      toggle.translator.setAccessToken(accessToken);  // set access token in translator
      // Use translator to send request to Bing translate api for text translation
      toggle.translator.translateWithFormat(textSource, targetLang, function(translatedText) { // success callback
        console.log("Translated to "+targetLang);
        if(translatedText) { // If translation data retrieved
          console.log("Text translated to " + targetLang);
          var langIx = toggle.toggle_data.addLanguage(targetLang);  // add language
          toggle.toggle_data.addVersion(langIx, "1-0", {value: translatedText, nNs: ""});  // add new clean version with empty chunks

          // Save text translation into firebase
          var textKey = TwextUtils.textToFbKey(textSource);
          firebaseHandler.set("data/"+textKey+"/translations/"+targetLang+"/1-0", {value: translatedText, nNs: ""});

          toggle.fillTranslations(langs, index);
        } // end if
      }, function(msg) {  // error callback
        console.log("Translate Error: " + msg + "\tlanguage: " + languages[targetLang]);
      }); // end translate request
    }, targetLang); // end firebase request
  },

  /**
  * Detect text language using Bing api.
  * @param 'text' source text
  */
  detectTextLanguage: function(text) {
    // if only one selected and it's a non bing language, do not detect language from bing
    if(this.selectedLanguages.names.length == 1 && $.inArray(this.selectedLanguages.names[0], nonBing_languages_names) != -1) {
      this.toggle_data.sourceLanguage = this.selectedLanguages.codes[0]; // set the text source language
      // Save into firebase
      var key = TwextUtils.textToFbKey(text);
      firebaseHandler.set("data/"+key+"/sourceLanguage", this.selectedLanguages.codes[0]);
      return;
    }

    var toggle = this;
    // Get the access token for bing api detect request
    firebaseHandler.get("AccessToken", function(accessToken) {  //callback
      toggle.translator.setAccessToken(accessToken);  // set access token in translator
      // Use translator to send request to Bing api for text language detection
      toggle.translator.detectTextLanguage(text, function(response) {  // success callback
        toggle.toggle_data.sourceLanguage = response; // set the text source language
        // Save into firebase
        var key = TwextUtils.textToFbKey(text);
        firebaseHandler.set("data/"+key+"/sourceLanguage", response);
      }, function(msg) {  // error callback
        console.log("Detect Error: " + msg);  // log error message
      }); // end detect request
    }); // end firebase request
  },

  /**
  * Generate random string as a shortcut to represent the text. This is used to retrieve the text later if requested via URL.
  * Save this shortcut/text mapping into firebase.
  * @param 'text' the source text
  */
  generateTextUrl: function(text) {
    var toggle = this, index = 0;
    var length = $.inArray(this.toggle_data.sourceLanguage, nonBing_languages_codes) != -1 ? 5 : 3;
    if(!this.toggle_data.url) { // text has no saved url
      // create new url to represent the text
      var str = randomStr();  // create random string
      var shortcut = str.substring(index, length);  // try the first 3 characters
      //var shortcut = this.getShortcut(null, index, length);
      this.saveTextUrl(text, str, shortcut, index, length);  // save text shortcut
    } else { // text already has a url
      firebaseHandler.get("urlMapping/"+this.toggle_data.url, function(data) {
        if(data) {  // url mapping found
          window.history.pushState("", document.title, "#" + toggle.toggle_data.url); // display url

          // add viewed url to hot list
          var urlListHandler = controller.getUrlListHandler();
          urlListHandler.saveToHotList({url: toggle.toggle_data.url, text: data.text});
        } else {
          // reset the url cos mapping no more exist
          toggle.toggle_data.url = null;
          toggle.generateTextUrl(text); // generate new url
          var textKey = TwextUtils.textToFbKey(text); // convert text to firebase key entry
          firebaseHandler.remove("data/"+textKey+"/url"); // remove old url
        }
      });
    }
  },

  /**
  * Save url-text mapping into firebase, only if text is not saved before.
  * The url-text mappings are saved into firebase under the path: "urlMapping"; key is the url shortcut, value is the text
  * Check if the generated url is not in use, if not then save it; if it's in use, move the index forward to get the next substring of the given length and recheck. If the index can't move forward(no more substrings of the given length available) then decrement the length of the url and repeat the algorithm. If the length reaches 0 then regenerate a new random str and repeat.
  */
  saveTextUrl: function(text, str, shortcut, index, length) {
    var toggle = this;
    // check if the generated url is not already in use
    firebaseHandler.get("urlMapping/"+shortcut, function(data) {
      if(!data) { // url not in use
        window.history.pushState("", document.title, "#"+shortcut); // display new url

        // update url of the text in toggle_data object
        toggle.toggle_data.url = shortcut;

        // Save generated url to firebase
        var textKey = TwextUtils.textToFbKey(text); // convert text to firebase key entry
        firebaseHandler.set("urlMapping/"+shortcut+"/text", text); // save url-text mapping
        firebaseHandler.set("data/"+textKey+"/url", shortcut);  // save text-url mapping

        // add new url to lists (All and Hot)
        var urlListHandler = controller.getUrlListHandler();
        urlListHandler.saveToLists({url: shortcut, text: text});
      } else {  // url is used before
        if(index+1 <= str.length-length) {
          index++;
          shortcut = str.substring(index, length);
          toggle.saveTextUrl(text, str, shortcut, index, length);
        } else if(length-1 != 0){
          index = 0;
          length--;
          shortcut = str.substring(index, length);
          toggle.saveTextUrl(text, str, shortcut, index, length);
        } else { // 3, 2, 1 shortcut lengths have been tried and already in use, generate new one
          toggle.generateTextUrl(text);
        }
      }
    });
  },

  /**
  * Save twext/chunks of current lang/ver.
  */
  saveTwextData: function(text, twext) {
    var nNsObj = [], chunksStr = null;
    if(!this.twextArea.chunks[this.language] || !this.twextArea.chunks[this.language][this.version]) {
      nNsObj = "";
    } else {
      var chunks = this.twextArea.chunks[this.language][this.version];
      for(i=0; i<chunks.length; i=i+2) {
        if(chunks[i]) {
          chunksStr = TwextUtils.chunksTonN(chunks[i]).join(' ');
          if(chunksStr && chunksStr.length > 0) nNsObj[parseInt(i/2)] = chunksStr; // set line chunks to nNs str
          else nNsObj[parseInt(i/2)] = "";
        }
      }
    }

    // Save timings into firebase
    var fbTextKey = TwextUtils.textToFbKey(text);
    var lang = this.toggle_data.getLanguage(this.language).language;
    var ver = this.toggle_data.getLanguageVersion(this.language, this.version).version;
    var data = {nNs: nNsObj, value: twext};
    firebaseHandler.set("data/"+fbTextKey+"/translations/"+lang+"/"+ver, data);

    this.toggle_data.updateVersion(this.language, this.version, data);
  },

  /**
  * Display "translating" msg to user while getting bing translations.
  */
  displayTranslating: function() {
    if(!$('#translating').is(':visible')) $('#translating').show();
  },

  /**
  * Hide "translating" msg to user after getting bing translations.
  */
  hideTranslating: function() {
    if($('#translating').is(':visible')) $('#translating').hide();
  },
});