/**
* Toggle class handles all toggle features.
*/
Toggle = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.language = 0; // current language
    this.version = 0;  // current version
    this.toggle_data = null; // object to carry all languages information (languages, versions, translations, chunks)
    this.gTranslatedText = {}; // object carry each language translated text loaded from google; key=language code, value=transalated text
    this.firebaseTranslations = []; // object carry text line translation data loaded from firebase; index=line number, value=firebase entry contains language/versions/translated text and chunks
    // language translations data. To add/delete a language, go to languages.js
    this.selectedLanguages = this.getUserLanguages(); // Get user prefernces from the browser, if not found then set to the first 5 languages
    this.trans = new Twext.Translation(); // Create translator object for text translation
  },

  /**
  * Set the current selected languages object.
  * @param 'targets' languages' codes
           'names' languages' names
  */
  setSelectedLanguages: function(targets, names) {
    this.selectedLanguages.targets = targets;
    this.selectedLanguages.lang_names = names;
  },

  /**
  * Get the languages list saved in the browser.
  * If no list found, return the first 5 languages ("French", "Italian", "Spanish", "English", "Portuguese")
  * @return languages list
  */
  getUserLanguages: function() {
    var list = {};
    var codes = getCookie("twext_lang_codes"); // get lang codes
    var names = getCookie("twext_lang_names"); // get lang names
    if(codes != null && codes.length > 0 && names != null && names.length > 0) { // cookies are found
      // Set the selected languages to the user languages saved in the browser.
      list = {
        targets: codes.split(","), // languages codes array of user preferences
        lang_names: names.split(",") // languages names array of user preferences
      };
    } else {  // cookies not found, initialize list with the first 5 entries of the languages object
      // Set the selected languages to the first 5 languages.
      list = {
        targets: languages_codes.slice(0, 5), // the first 5 languages' codes(["fr", "it", "es", "en", "pt"])
        lang_names: languages_names.slice(0, 5) // the first 5 languages' names(["French", "Italian", "Spanish", "English", "Portuguese"])
      };
    }
    return list;  // return languages list
  },

  /**
  * Load text into textarea.
  * If there is a hash url, load the saved text from firebase, else load sample data.
  */
  loadText: function(loadUrlList) {
    var shortcut = window.location.hash;  // get text shortcut
    if(shortcut && shortcut.slice(1)) { // if there is a hash value in the url
      this.loadTextOfURL(shortcut.slice(1), loadUrlList); // load text and translations from firebase
    } else {  // no hash value in the url
      this.load_sample_data(); // load sample data
    }
  },

  /**
  * Load Text from firebase that is referenced by the given shortcut.
  * @param 'shortcut' the reference hash of the text
  */
  loadTextOfURL: function(shortcut) {
    var toggle = this;
    getFirebaseEntryValue(firebaseRef+"mapping/url-text/"+shortcut, null, function(data, value) {
      if(data) {  // if there is a mapped text with the given url
        // init selectedLanguages to "english", "spanish", "romanian", "catalan", "german", "french", "italian", "portuguese"
        var targets = ["es", "en", "ro", "ca", "de", "fr", "it", "pt"];
        var names = ["espa\u0148ol", "english", "limba rom\u00e2n\u0103", "catal\u00E0", "deutsch", "fran\u00E7ais", "italiano", "portugu\u00eas"];
        toggle.setSelectedLanguages(targets, names);
        langMenu.deselectAll();  // deselect all options
        langMenu.select(toggle.selectedLanguages.targets);  // select the options included in the selectedLanguages object
        toggle.get_translations(data.text); // get text translations
        // Load video if exists
        if(data.video) $("#youtubeLink").val(data.video);
        loadVideo(null, true);
        // Set current data to be saved after loading the lists
        url_list.setCurrentUrlData({url: shortcut, text: data.text});
        // load url list from firebase to the local object urlList or save the current url data
        url_list.loadLists();
      } else {  // no mapped text, invalid url
        alert("The requested URL does not exist.");
      }
    });
  },

  /**
  * Load some initial sample text into the input area.
  */
  load_sample_data: function() {
    // Initiate some sample data
    var data = "Twext is twin text,\n"+
               "aligned between the lines,\n"+
               "in any language you like.";
    this.get_translations(data);  // display text translations
  },

  /**
  * Switch to next language; this method is called on 'F8' key down event.
  * Check if text is translated to all selected languages in the menu before switch to next language(in case new language is included from the menu)
  * If one or more language is not yet translated, then get translations of these languages first befor displaying next language translations.
  */
  toggleLangUp: function() {
    this.switch_language(1); // Switch to next language, add 1 to the current language
  },

  /**
  * Fetch translations of new selected languages added in the menu.
  */
  translateAddedLanguages: function() {
    var langs = this.getAddedLanguages(); // get list of new languages that not yet used to translate text.
    if(langs) {  // one or more language translations not found, translate text to these languages and display next language
      this.pull_translations(this.toggle_data.source_text, langs, this.language);  // translate text to these languages
    }
  },

  /**
  * Check if all selected languages translations included in toggle_data.
  * @return object of languages codes and names that are not found in toggle_data object (text not translated to these languages), false if all languages already added to toggle_data
  */
  getAddedLanguages: function() {
    var i, lang_ix = -1, result = false;
    var codes = [], names = [];
    for(i=0; i<this.selectedLanguages.lang_names.length; i++) {  // loop over selected languages
      lang_ix = this.toggle_data.find_by_language_name(this.selectedLanguages.lang_names[i]); // get language from toggle_data object
      if(lang_ix == -1) { // language not found
        names.push(this.selectedLanguages.lang_names[i]);  // add language name to the list
        codes.push(this.selectedLanguages.targets[i]); // add language code to the list
      }
    }
    return names.length > 0 ? {targets: codes, lang_names: names} : false; // return languages object, false if all languages already in toggle_data
  },

  /**
  * Get and display twexts(translations) if twexts are not already displayed. If twexts already exist, toggle languages of the existing twexts.
  * If no twexts are displayed, get translations of the area text lines(from firebase or google), display them as twexts for each Text line.
  * If twexts are displayed, toggle languages.
  */
  check_translations: function(fetchAdded) {
    var playing = false;
    if(player.isPlaying()) playing = "fromPlay";
    else if(player.isTapTiming()) playing = "fromTap";
    if(playing) player.unhighlightSeg();

     var text = area.extractText();
    if(area.isTimingOn()) text = syllabifier.unsyllabifyText(text);
    text = trimStringLines(text); // trim string lines
    
    var isNewText = this.toggle_data == null || (this.toggle_data != null && this.toggle_data.source_text != text);
    if(isNewText) {
      //player.reset(); // reset playing data
      player.pauseText();
      this.get_translations(text); // get translations of text from firebase of google
    } else {
      if(fetchAdded) {  // do not toggle, translate added languages only
        //player.reset(); // reset playing data
        player.pauseText();
        this.translateAddedLanguages();  // fetch added languages translations @TODO auto save
      } else {  // toggle to next language
        if(area.isTwextOn()) {
          this.toggleLangUp(); // toggle languages
          resumePlaying("twext", playing);
        } else {  // timing displayed or textonly, display current language twexts
          var timingOn = area.isTimingOn();
          var oldText = $.trim(area.area.innerText);

          this.place_twext(this.language, this.version); // display twexts of current language/version

          resumePlaying("twext", playing);

          // Save timing data into firebase
          var saved = area.saveData(this.language, this.version, timingCreator.getTimingLines(), oldText, false, timingOn);
          timingCreator.setTimingLines(saved);  // update old timing lines with the saved ones
        }
      }
    }
    area.setCaretPos(0,0);  // set cursor position at the start of area text
  },

  /**
  * Get translations of text from either firebase or Bing translate api.
  * Retrieve all translations of all lines from firebase, then transfer the data into toggle_data object.
  * While data transfer to toggle_data object, if any entry is null(not found in firebase), then translate text using google translate.
  * @param 'text' text to be translated
  */
  get_translations: function(text) {
    var line = "", j;

    // Create toggle_data object to carry all languages information (languages, versions, translations, chunks)
    this.toggle_data = new Twext.ToggleData();
    this.toggle_data.source_text = text; // set source text
    //toggle_data.source_lang = "en"; // set default source language, default is english

    //detectTextLanguage(text, trans); // detect the source language of the text

    // Get firebase translations
    this.pull_translations(text, this.selectedLanguages, 0);
  },

  /**
  * Pull translations of text from either firebase or Bing translate api.
  * Retrieve all translations of all lines from firebase, then transfer the data into toggle_data object.
  * While data transfer to toggle_data object, if any entry is null(not found in firebase), then translate text using google translate.
  * @param 'text' text to be translated
           'langs' the languages object for the text to be translated to. The object contains two lists: codes and names
           'firstLanguage' number of first language to be displayed
  */
  pull_translations: function(text, langs, firstLanguage) {
    var toggle = this;
    // initialize objects
    this.firebaseTranslations = []; // initialize firebase translations
    this.gTranslatedText = []; // initialize google translations of text

    this.generateTextShortcut(text); // create shortcut for the text to be used in the url to retrieve text

    this.display_translating();  // display translating msg while get text translations

    // Get firebase translations
    var lines = text.split("\n"); // get text lines
    lines = lines.clean();  // remove empty lines
    for(j=0; j<lines.length; j++) { // loop over text lines
      line = getStrWords(lines[j]).join('-');  // construct Firebase entry (line words separated by -)
      console.log(firebaseRef+"foo/"+line);  // log firebase url
      // Send request to firebase to get data(translations and chunks of all languages/versions) of this line
      getFirebaseEntryValue(firebaseRef+"foo/"+line, j, function(data, lineNum) {  // callback
        toggle.firebaseTranslations[lineNum] = data; // save retrieved data into firebaseTranslations object
        if(Object.size(toggle.firebaseTranslations) == lines.length) { // All lines data are loaded (finished firebase loading)
          toggle.fillTranslations(text, langs, firstLanguage); // load translations data retrieved to toggle_data object
        }
      });
    }
  },

  /**
  * Fill toggle_data object with data retrieved from firebase.
  * If a language translation of a line is not retrieved from firebase(not found), then translate line using google translate(send request and return, continue loading(fill) operation after returning from google (request callback))
  * @param 'text' area text lines
           'langs' the languages object for the text to be translated to. The object contains two lists: codes and names
           'firstLanguage' number of first language to be displayed
           'lineIx' text line index; If set, start loading from this line index
           'langIx' language index; If set, start loading from this language index
  */
  fillTranslations: function(text, langs, firstLanguage, lineIx, langIx) {
    var targets = langs.targets;  // selected targets
    var lang_names = langs.lang_names;  // selected lang names
    var lang_ix;
    var i = lineIx ? lineIx : 0;  // lines counter
    var j = langIx?langIx:0; // languages counter
    var lines = text.split("\n"); // get text lines
    lines = lines.clean();  // remove empty lines
    for(; i<this.firebaseTranslations.length; i++) {  // Loop over lines (retrieved from firebase)
      for(; j<targets.length; j++) {  // loop over languages
        if(this.firebaseTranslations[i] && this.firebaseTranslations[i][targets[j]]) {  // Firebase entry has been loaded
          // add language to toggle_data object
          lang_ix = this.addLanguage(lang_names[j]);
          // Load this language data(versions, lines translations, chunks) to toggle_data object 
          this.addVersions(this.firebaseTranslations[i][targets[j]], i*2, lang_ix);
        } else {  // Firebase entry not found, load from google (translate all lines of text in one request, to save time)
          // Check if the text has been translated to this language before(request sent in another line through the lines loop)
          if(this.gTranslatedText[targets[j]]) {  // The text has been translated to this language with google before
            // add language to toggle_data object
            lang_ix = this.addLanguage(lang_names[j]);
            // Add translation of line to toggle_data object, with empty chunks and version 1-0(first version) 
            var translatedLine = $.trim(this.gTranslatedText[targets[j]].split("\n")[i]);
            var data = {value: translatedLine, nN: ""}; // translation data(translated line and chunks)
            // Add translation of line to toggle_data object, with empty chunks and version 1-0(first version)
            this.toggle_data.addLine(lang_ix, "1-0", i*2, data);  // add this translation to toggle_data object

            // Save data into firebase db
            var line = $.trim(getStrWords(lines[i]).join('-')); // construct Firebase entry (line words separated by -)
            new Firebase(firebaseRef+"foo/"+line+"/"+targets[j]+"/1-0").set(data); // save data request
          } else {  // text not translated before, send request to google translate api for text translation (all lines in one request)
            // translate the whole text to this language (translation will be saved in gTranslatedText object for later use in next text lines)
            this.translate_html(text, targets[j], lang_names[j], this.trans, langs, firstLanguage, i, j);
            return; // return, translate request callback will call this method(to continue load after text is translated)
          }
        }
      }
      j = 0; // reset languages counter for next line
    }
    // Display Text/Twext lines
    //var first_lang = toggle_data.source_lang=="en"?"español":"english"; // get initial language (first to display)
    //var lang = toggle_data.find_by_language_name(firstLanguage); // get language number to be displayed
    area.loadChunks(this.toggle_data.data.languages);  // load retrieved chunks into lang_chunks object in area
    this.display_language(firstLanguage, 0);
    this.hide_translating(); // hide translating msg after getting text translations
  },

  /**
  * Display Text/Twext lines (text/translation) and align each pair.
  * Get the language version, get Text/Twext lines, align and render lines, set langauge and version display names.
  * @param 'lang' the language to be dispalyed
           'ver' the language version to be displayed
  */
  place_twext: function(lang, ver) {
    this.language = lang;
    this.version = ver?ver:0;
    var doc = this.toggle_data.languageVersion(this.language, this.version);
    this.display_twext(doc.lines);
  },

  /**
  * Display Text/Twext lines (text/translation) and align each pair.
  * Get Text/Twext lines, align and render lines, set langauge and version display names.
  * @param 'lines' translations (twexts) to be displayed
  */
  display_twext: function(lines) {
    var lines = this.meld_twext_lines(this.toggle_data.source_text, lines); // Get Text/Twext lines
    $("#main").show();  // show the input area
    this.renderLines(lines); // render Text/Twext lines
    this.set_language_name();  // display language name
    $('#youtubeLinkContainer').hide();
    //videoPlayer.hideVideo();
    //videoPlayer.clear();
    //set_version_name(); // display version name
  },

  /**
  * Display current language name.
  */
  set_language_name: function() {
    var lang = this.toggle_data.languageName(this.language);  // get current language name
    if(lang) {  // valid language
      $('#data-bar-language').html(lang); // Display language name (French, English..)
    } else {  // not a valid language
      $('#data-bar-language').html('Unknown');  // Display "Unknown"
    }
  },

  /**
  * Get Text/Twext lines.
  * @param 'main' source text
           'lang' transalted lines
  * @return Text/Twext lines
  */
  meld_twext_lines: function(main, lang) {
    var i = 0, j = 0, text_lines = [];
    var nl = /\n/g; // new line regular expression, used for text split
    var main = main.split(nl);  // get source text lines
    var l = main.length;  // source text lines length
    for(; i<l ; i++, j=j+2) {  // loop over source text lines
      if(main[i].length > 0 || (lang[j] && lang[j].value.length > 0)) { // Text line has value and has been translated
        text_lines.push(main[i]); // add Text line
        text_lines.push(lang[j].value); // add Twext line
      } else {  // Text line has no value or not translated
        text_lines.push(null);  // add null
        j = j-2;  // return to current translated text to recompare with next Text line
      }
    }
    return text_lines;  // return Text/Twext lines
  },

  /**
  * Add all versions/data to toggle_data object.
  * @param 'versions' versions(contains translation lines and chunks) to be added
           'lineNum' the line number in which the data will be loaded
           'lang_ix' the language index in which the data will be loaded
  */
  addVersions: function(versions, lineNum, lang_ix) {
    for(var key in versions) {  // loop over versions
      // add line/data (translated text and chunks) to toggle_data object(add version too if not already exist)
      this.toggle_data.addLine(lang_ix, key, lineNum, versions[key]);
    }
  },

  /**
  * Translate text to the sepcified language.
  * @param 'text_source' the text to be transalted
           'target_lang' the target language code (en, fr, it, es...)
           'target_name' the target language name (english, french, italian, spanish...)
           'translator' translate object used for sending request to Bing translate api
           'lineIx' line index where translation request is sent(in fillTranslations), used to call fillTranslations() and continue from this line
           'langIx' language where translation request is sent(in fillTranslations),used to call fillTranslations() and continue from this language
  */
  translate_html: function(text_source, target_lang, target_name, translator, langs, firstLanguage, lineIx, langIx) {
    var toggle = this;
    // Get the access token for translation
    new Firebase(firebaseRef+"AccessToken").once('value', function(dataSnapshot) {  //callback
      translator.setAccessToken(dataSnapshot.val());  // set access token in translator
      // Use translator to send request to Bing translate api for text translation
      translator.translateWithFormat(text_source, target_lang, function(translated_text) { // success callback
        if(translated_text) { // If translation data retrieved
          // Add this language translation to gTranslatedText object for later use in rest of text lines(so that the text is retranslated)
          toggle.gTranslatedText[target_lang] = translated_text;
          // Continue translations data loading into toggle_data object, fillTranslations with start lineIx and langIx
          toggle.fillTranslations(text_source, langs, firstLanguage, lineIx, langIx);
        } // end if
      }, function(msg) {  // error callback
        console.log("Translate Error: " + msg + "\tlanguage: " + target_name);
      }); // end translate request
    }); // end firebase request
  },

  /**
  * Generate random string as a shortcut to represent the text. This is used to retrieve the text later if requested via URL.
  * Save this shortcut/text mapping into firebase.
  * @param 'text' the source text
  */
  generateTextShortcut: function(text) {
    var toggle = this;
    var textEntry = this.constructFbKeyFromText(text); // convert text to firebase key entry
    getFirebaseEntryValue(firebaseRef+"mapping/text-url/"+textEntry, null, function(data, index) {
      if(!data) { // if text not exist, generate and save shortcut
        var id = randomId();  // create random id
        var shortcut = id.charAt(0);  // get the first charcter
        toggle.saveShortcut(text, id, shortcut, 0);  // save text shortcut
      } else {
        window.history.pushState("", document.title, "#"+data); // display new url
      }
    });
  },

  /**
  * Save url-text mapping into firebase, only if text is not saved before.
  * The url-text mappings are saved into firebase under the path: "mapping/url-text"; key is the url shortcut, value is the text
  * The reverse mapping "text-url" is saved under the path: "mapping/text-url". This mapping is used to check duplicate text, so that same text not saved twice with different urls; text is saved as one line strings
  */
  saveShortcut: function(text, id, shortcut, index) {
    var toggle = this;
    getFirebaseEntryValue(firebaseRef+"mapping/url-text/"+shortcut, index, function(data, index) {
      if(!data) { // if this shortcut not used for other text
        window.history.pushState("", document.title, "#"+shortcut); // display new url
        var textEntry = toggle.constructFbKeyFromText(text); // convert text to firebase key entry
        new Firebase(firebaseRef+"mapping/url-text/"+shortcut+"/text").set(text); // save url-text mapping
        new Firebase(firebaseRef+"mapping/text-url/"+textEntry).set(shortcut);  // save text-url mapping

        var listEntry = {url: shortcut, text: text};
        url_list.saveToList(listEntry);  // add new url to list (All and Hot lists)
      } else {  // if shortcut is already in use
        if(index > 2) {  // all characters of the generated id is used, generate a new one
          toggle.generateTextShortcut(text);
        } else {  // some of id characters not used in the shortcut
          index++;
          shortcut += id.charAt(index); // append the next character of the id to the shortcut
          toggle.saveShortcut(text, id, shortcut, index);  // repeat
        }
      }
    });
  },

  /**
  * Convert text to one line string to be a key entry in firebase.
  * Replace new lines "\n" by two spaces, separate words by -
  * @param 'text' the text to be converted.
  */
  constructFbKeyFromText: function(text) {
    var i, line, result = [];
    var lines = text.split("\n");
    lines = lines.clean();
    for(i=0; i<lines.length; i++) {
      line = getStrWords(lines[i]).join('-');
      result.push(line);
    }
    return result.join('  ');
  },

  /**
  * Display "translating" msg to user while getting bing translations.
  */
  display_translating: function() {
    $('#translating').show();
  },

  /**
  * Hide "translating" msg to user after getting bing translations.
  */
  hide_translating: function() {
    $('#translating').hide();
  },

  /**
  * Add language to toggle_data object; If language is already added, then set it to the current language and return its index.
  * @param 'target_name' the langauge name to be added
  * @return index of added language
  */
  addLanguage: function(target_name) {
    // Add language to toggle_data object
    var lang_ix = this.toggle_data.find_by_language_name(target_name); // get language from toggle_data object
    // check if this language has been loaded to toggle_data before
    if(lang_ix != -1) { // language found, language already added
      this.toggle_data.language(lang_ix);  // Set current language to this language
    } else {  // language not found, add it to toggle_data object
      lang_ix = this.toggle_data.addLanguage(target_name); // add language
    }
    return lang_ix; // return index of added language
  },

  /**
  * Save updated twexts and chunks into firebase.
  * @param 'oldText' text data to save
           'twextsDisplayed' boolean detects if twexts displayed
           'timingsDisplayed' boolean detects if timings displayed
  */
  saveData: function(oldText, twextsDisplayed, timingsDisplayed) {
    if(twextsDisplayed) {
      // Save twexts data into firebase
      var saved = area.saveData(this.language, this.version, this.toggle_data.getLines(this.language, this.version), oldText, true, false); // Save data into firebase
      this.toggle_data.updateVersion(saved, this.version, this.language);  // update old language version with the saved data (chunks)
    } else if(timingsDisplayed) {
      // Save timing data into firebase
      var saved = area.saveData(this.language, this.version, timingCreator.getTimingLines(), oldText, false, true);
      timingCreator.setTimingLines(saved);  // update old timing lines with the saved ones
    }
  },

  /**
  * Display Text/Timing lines and align each word-timing pair.
  */
  place_timing: function(text) {
    var toggle = this;
    syllabifier.syllabifyText(text, function(hText) { // syllabify text to get segments
      var textLines = hText.split('\n');  // hyphenated text lines
      timingCreator.getSegTiming(text, hText, function(timingLines) {
        var lines = toggle.meld_timing_lines(textLines, timingLines);  // merge lines
        toggle.renderLines(lines, 'timing'); // display Text/Timing lines
        if($('#data-gif-view').is(':visible')) {
          updateGifArea();
        } else {
          $('#youtubeLinkContainer').show();
        }
        //timingCreator.saveTimings(text);
      }); // timing lines
    });
  },

  /**
  * Get Text/Timing lines.
  * @param 'textLines' source text lines
           'timingLines' timing of line segments
  * @return Text/Timing lines
  */
  meld_timing_lines: function(textLines, timingLines) {
    var i = 0, lines = [];
    for(i=0; i<textLines.length ; i++) {  // loop over source text lines
      lines.push(textLines[i]); // add Text line
      lines.push(timingLines[i]); // add Twext line
    }
    return lines;  // return Text/Timing lines
  },

  /**
  * Render Text/Twext lines (text/translation) and align each pair.
  * Align and render lines, set langauge and version display names.
  * @param 'lines' Text/Twext lines to be displayed
  */
  renderLines: function(lines, secondClass) {
    area.language = this.language; // set current language in the area
    area.version = this.version; // set current version in the area
    area.render_html(lines, secondClass);  // render the lines
    area.orgLines = this.toggle_data.getLines(this.language, this.version);  // set current displayed lines in the area
    area.realign(); // align Text/Twext lines
  },

  /**
  * Switch to previous language; this method is called on 'Alt+F8' key down event.
  */
  toggleLangDown: function() {
    //player.reset(); // reset playing data
    console.log("KEY: alt+f8"); // log pressed key/s
    this.switch_language(-1);  // Switch to previous language, subtract 1 from the current language
  },

  /**
  * Round Switch to previous/next language (move to first version of the previous/next language)
  * @param 'add' amount to subtract/add from/to current language
           'ver' version of language, set only when switching both language and version (F9, Alt+F9)
  */
  switch_language: function(add, ver) {
    // Data before language switch, save data later into firebase(save after render new language data,so that ui is not slowed by firebase requests)
    var oldLang = this.language, oldVer = this.version, oldText = $.trim(area.area.innerText), displayedLangName = $('#data-bar-language').text();
    var twextOn = area.isTwextOn(), timingOn = area.isTimingOn();

    var nl = this.language+add;  // new language
    var lcount = this.toggle_data.languageCount(); // number of existing languages
    if(nl < 0) {  // if current language is the first language, switch to last one
      nl = lcount-1;  // switch to last language
    } else if(nl >= lcount) { // if current language is the last language, switch to first one
      nl = 0; // switch to first language
    }
    this.display_language(nl, ver);
    if($('#data-gif-view').is(':visible')) {
      updateGifArea();
    }

    // Save data (text edits and chunks) before language switch into firebase
    var oldLangName = this.toggle_data.language(oldLang).language;
    if(displayedLangName == oldLangName) { // displayed language is the old language, then save its data
      var saved = area.saveData(oldLang, oldVer, this.toggle_data.getLines(oldLang, oldVer), oldText, twextOn, timingOn); // Save data into firebase
      this.toggle_data.updateVersion(saved, oldVer, oldLang);  // update old language version with the saved data (chunks)
    }
  },

  /**
  * Display twexts of the given language. If the language to display is not in the selected languages, the switch to the language after it.
  * @param 'lang' the language to display
           'ver' the language version to display
  */
  display_language: function(lang, ver) {
    // Check if the language to display is in the selected language list, if not then switch to the language after it.
    var lang_name = this.toggle_data.language(lang).language;  // get language name
    if($.inArray(lang_name, this.selectedLanguages.lang_names) == -1) {  // if language not included in selected language list, switch to the one after
      this.language = lang;
      this.switch_language(1, ver); // switch to next language
    } else {  // language included in selected languages, switch to this language
      this.place_twext(lang, ver); // display Text/Twext lines
    }
  },

  /**
  * Update text after undo hyphenation of word on cursor and all its occurences.
  */
  updateTextWithUndoHyphenation: function() {
    var txt = syllabifier.undoHyphenation(text, cursorCoord);
    if(txt) {
      area.updateText(txt);
      area.setCaretPos(cursorCoord.lines, cursorCoord.offset-1);
      syllabifier.setHyphenatedText(area.extractText());
    }
  }
});