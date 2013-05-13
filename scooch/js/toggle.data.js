/**
* Toggle features
*/
!function(d){
  var language = 0; // current language
  var version = 0;  // current version
  var area = null;  // ScoochArea object to represent input element
  var toggle_data = null; // object to carry all languages information (languages, versions, translations, chunks)
  var firebaseRef = "https://readfm.firebaseio.com/";  // firebase url
  var gTranslatedText = {}; // object carry each language translated text loaded from google; key=language code, value=transalated text
  var firebaseTranslations = []; // object carry text line translation data loaded from firebase; index=line number, value=firebase entry contains language/versions/translated text and chunks
  var urlList = []; // list of all texts urls, will be loaded from firebase
  var urlListLimit = 1000; // maximum number of urls retrieved from firebase
  var urlListState = 0; // current state of displaying urls; 0=off, 1=show first 10 urls, 2=show all
  var subListLength = 10; // maximum number of links to be displayed in the sub list

  // language translations data. To add/delete a language, go to languages.js
  var selectedLanguages = getUserLanguages(); // Get user prefernces from the browser, if not found then set to the first 5 languages
  var trans = new Twext.Translation(); // Create translator object for text translation
  //var targets = languages_codes; // languages' codes(eg: ["fr", "it", "es", "en"])
  //var lang_names = languages_names; // languages' names(eg: ["French", "Italian", "Spanish", "English"])
  //var trans = new Twext.Translation("AIzaSyC4S6uS_njG2lwWg004CC6ee4cKznqgxm8"); // Google translate API key

  /**
  * Attach key events.
  */
  function register_keys(){
    console.log("register keys");
    $(d).bind("keydown","f4", switchTwextState);  // F4 key down event, Turn twexts on/off
    $(d).bind("keydown","f8", check_translations);  // F2 key down event, Get translations of area text lines
    $(d).bind("keydown","alt+F8",toggleLangDown); // Alt+F8 keys down event, Switch to previous language
    $(d).bind("keydown", "f9", showHideUrlList);
    //$(d).bind("keydown","F8",toggleLangUp); // F8 key down event, Switch to next language
    //$(d).bind("keydown","alt+F7",toggleVerDown);  // Alt+F7 keys down event, Switch to previous version of current language
    //$(d).bind("keydown","F7",toggleVerUp);  // F7 key down event, Switch to next version of current language
    //$(d).bind("keydown","alt+F9",toggleLangVerDown);  // Alt+F9 keys down event, Switch to previous language/version
    //$(d).bind("keydown","F9",toggleLangVerUp);  // F9 key down event, Switch to next language/version
  }

  /**
  * Attach events to elements.
  */
  function attachEvents() {
    // hide menu when clicked outside
    $('body').click(function(e) {
      if($('#language_menu_container').is(":visible")) hideLangMenu();
    });
    $('#language_menu_container').click(function(e) {
      e.stopPropagation();
    });

    // Change event of the languages menu
    $('#language_menu').change(function() {
      var selected = updateSelectedLanguages();  // Update selected languages when list is changed
      saveLangToBrowser(selected); // Save the user languages selection to the browser
    });

    // show/hide menu when press f2 key, hide when press esc
    $('body').keydown(function(e) {
      if(e.keyCode == 113) { // If F2 is pressed
        languageMenu(); // show/hide menu
      } else if(e.keyCode == 27) {  // If esc is pressed
        if($('#language_menu_container').is(":visible")) hideLangMenu();  // hide menu
      }
    });

    // resize language menu on window resize
    $(window).resize(function(e) {
      resizeLanguageMenu();
    });

    // attach window load event
    $(window).bind('load', function() {
      resizeLanguageMenu();
      loadText(); // load text into textarea
      loadUrlList();  // load url list from firebase to the local object urlList
    });

    // retrieve text when url hash change "when user change hash and press enter, page not reloaded(load event not called)
    $(window).bind('hashchange', function() {
      resizeLanguageMenu();
      loadText(); // load text into textarea
    });
  }

  /**
  * Load text into textarea.
  * If there is a hash url, load the saved text from firebase, else load sample data.
  */
  function loadText() {
    var shortcut = window.location.hash;  // get text shortcut
    if(shortcut && shortcut.slice(1)) { // if there is a hash value in the url
      loadTextOfURL(shortcut.slice(1)); // load text and translations from firebase
    } else {  // no hash value in the url
      load_sample_data(); // load sample data
    }
  }

  /**
  * Load url-text list from firebase to urlList object.
  */
  function loadUrlList() {
    var ref = new Firebase(firebaseRef+"history");  // firebase ref
    var query = ref.endAt().limit(urlListLimit);  // query to retrieve the last limit entries
    query.once("value", function(data) {
      urlList = Object.toArray(data.val());
      fillListElements(urlList);
    });
  }

  /**
  * Add the new created url to the top of the list.
  * @param 'data' key/value object contains the url and text
  */
  function addToUrlList(data) {
    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url
    // append to sub list
    $('#url-sub-list').prepend(aEl); // append to sub list
    if($('#url-sub-list')[0].childNodes.length >= subListLength *2) { // if list elements reaches to its limit (*2 to count <br> tags)
      $('#url-sub-list')[0].childNodes[(subListLength*2)+1].remove(); // remove last <a> element from the list
      $('#url-sub-list')[0].childNodes[subListLength*2].remove(); // remove last <br> element from the list
    }
    $('#url-all-list').prepend(aEl); // append to all list
    urlList.push(data);  // Update urlList object
  }

  /**
  * Create elements for urls and append them to the DOM.
  * Append the latest 10 added urls to the "url-sub-list" element, and all urls to "url-all-list"
  * @param 'list' array of all urls
  */
  function fillListElements(list) {
    var i, aEl = "", ref = "", text = "";
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=list.length-1; i>=0; i--) {
      ref = currentRef + "#" + list[i].url;
      text = list[i].text.replace(/\n/g, '  ');
      aEl = "<br><a href='" + ref + "'>" + text + "</a>";
      if(i >= list.length - 10) { // latest 10 items
        $('#url-sub-list').append(aEl); // append to sub list
      }
      $('#url-all-list').append(aEl); // append to all list
    }
  }

  /**
  * Load Text from firebase that is referenced by the given shortcut.
  * @param 'shortcut' the reference hash of the text
  */
  function loadTextOfURL(shortcut) {
    getFirebaseEntryValue(firebaseRef+"mapping/url-text/"+shortcut, null, function(data, value) {
      if(data) {  // if there is a mapped text with the given url
        // init selectedLanguages to "english", "spanish", "romanian", "catalan", "german", "french", "italian", "portuguese"
        selectedLanguages.targets = ["es", "en", "ro", "ca", "de", "fr", "it", "pt"];
        selectedLanguages.lang_names = ["espa\u0148ol", "english", "limba rom\u00e2n\u0103", "catal\u00E0", "deutsch", "fran\u00E7ais", "italiano", "portugu\u00eas"];
        deselectAll($('#language_menu')[0]);  // deselect all options
        // select the options included in the selectedLanguages object
        select($('#language_menu')[0], selectedLanguages.targets);
        get_translations(data); // get text translations
      } else {  // no mapped text, invalid url
        alert("The requested URL does not exist.");
      }
    });
  }

  /**
  * Change the menu width/height to fit with window width/height
  */
  function resizeLanguageMenu() {
    var clientHeight = document.documentElement.clientHeight;
    if(clientHeight < 500) {  // if client height is less than 500(approximate value near to menu height which is 445), then reduce menu height
      $('#language_menu').height(clientHeight-40);
    } else {  // client height is greater than menu height, keep menu height to standard value(445)
      $('#language_menu').height(445);
    }
    $('#language_menu').width(120); // keep menu width fixed
  }

  /**
  * Show/Hide url list according to current state.
  * First key press shows first 10 urls.
  * Second key press shows all urls.
  * Third key press hide list, and then repeat process.
  */
  function showHideUrlList() {
    if(urlListState == 0) { // current state is off, move to state 1, show first 10 urls
      $('#url-sub-list').show();
      urlListState = 1;
      $('#url-list-label').html("list NEW");
    } else if(urlListState == 1) {  // current state is first 10 urls, move to state 2, show all urls
      $('#url-sub-list').hide();
      $('#url-all-list').show();
      urlListState = 2;
      $('#url-list-label').html("list off");
    } else if(urlListState == 2) {  // current state is all urls, move to state 0, hide list
      $('#url-all-list').hide();
      urlListState = 0;
      $('#url-list-label').html("list all");
    }
  }

  /**
  * Save languages codes and names into the browser.
  * The codes and names arrays are converted into strings and saved in two different cookies in the browser.
  * @param 'langObj' the languages object that carry codes and names
  */
  function saveLangToBrowser(langObj) {
    var codesStr = langObj.targets.toString();  // put codes array in a string
    var namesStr = langObj.lang_names.toString(); // put names array in a string
    setCookie("twext_lang_codes", codesStr, 365);  // save languages codes to the browser for a year
    setCookie("twext_lang_names", namesStr, 365);  // save languages names to the browser for a year
  }

  /**
  * Get the languages list saved in the browser.
  * If no list found, return the first 5 languages ("French", "Italian", "Spanish", "English", "Portuguese")
  * @return languages list
  */
  function getUserLanguages() {
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
  }

  /**
  * Update the selectedLanguages object value with the updated selected options in languages menu.
  * @return the selected languages object after the update
  */
  function updateSelectedLanguages() {
    var i, names = [], codes = [];
    var selectedOptions = $('#language_menu')[0].selectedOptions;
    for(i=0; i<selectedOptions.length; i++) {
      codes.push(selectedOptions[i].value); // add language code
      names.push(selectedOptions[i].text);  // add language name
    }
    selectedLanguages.targets = codes;  // update selected languages codes
    selectedLanguages.lang_names = names; // update selected languages names
    return selectedLanguages;
  }

  /**
  * Show/Hide language selection menu. The menu is used to select(include/exclude) languages to be displayed.
  */
  function languageMenu() {
    if($('#language_menu_container').is(":visible")) {  // If menu opened
      hideLangMenu(); // hide menu
    } else {  // menu closed
      showLangMenu(); // show menu
    }
  }

  /**
  * Hide language menu; get text translations on menu hide.
  */
  function hideLangMenu() {
    $('#language_menu_container').hide(0, function(e) {
      check_translations(null, true); // fetch translations as if F8 is pressed
    }); // hide language menu
  }

  /**
  * Show language menu.
  */
  function showLangMenu() {
    $('#language_menu_container').show(); // show language menu
  }

  /**
  * Show/Hide twexts(Turn on/off).
  */
  function switchTwextState() {
    if(area.isTwextOn()) { // Twexts are dispalyed, hide twexts
      removeTwexts();
      set_twext_state(false); // set state to twext off
    } else {  // Twexts not dispalyed, show twexts
      place_twext(language, version);
    }
  }

  /**
  * Remove twexts lines.
  */
  function removeTwexts() {
    $('.twext').remove();
  }

  /**
  * Switch to previous language; this method is called on 'Alt+F8' key down event.
  */
  function toggleLangDown() {
    console.log("KEY: alt+f8"); // log pressed key/s
    switch_language(-1);  // Switch to previous language, subtract 1 from the current language
  }

  /**
  * Switch to next language; this method is called on 'F8' key down event.
  * Check if text is translated to all selected languages in the menu before switch to next language(in case new language is included from the menu)
  * If one or more language is not yet translated, then get translations of these languages first befor displaying next language translations.
  */
  function toggleLangUp() {
    console.log("KEY: f8"); // log pressed key/s
    switch_language(1); // Switch to next language, add 1 to the current language
  }

  /**
  * Fetch translations of new selected languages added in the menu.
  */
  function translateAddedLanguages() {
    var languages = getAddedLanguages(); // get list of new languages that not yet used to translate text.
    if(languages) {  // one or more language translations not found, translate text to these languages and display next language
      pull_translations(toggle_data.source_text, languages, language);  // translate text to these languages
    }
  }

  /**
  * Check if all selected languages translations included in toggle_data.
  * @return object of languages codes and names that are not found in toggle_data object (text not translated to these languages), false if all languages already added to toggle_data
  */
  function getAddedLanguages() {
    var i, lang_ix = -1, result = false;
    var codes = [], names = [];
    for(i=0; i<selectedLanguages.lang_names.length; i++) {  // loop over selected languages
      lang_ix = toggle_data.find_by_language_name(selectedLanguages.lang_names[i]); // get language from toggle_data object
      if(lang_ix == -1) { // language not found
        names.push(selectedLanguages.lang_names[i]);  // add language name to the list
        codes.push(selectedLanguages.targets[i]); // add language code to the list
      }
    }
    return names.length > 0 ? {targets: codes, lang_names: names} : false; // return languages object, false if all languages already in toggle_data
  }

  /**
  * Switch to previous version of the current language; this method is called on 'Alt+F7' key down event.
  */
  function toggleVerDown() {
    console.log("KEY: alt+f7"); // log pressed key/s
    // Switch to previous version, subtract 1 from the current version
    if(!switch_version(-1)) { // no previous version found
      display_error("No more versions");  // Display error, no more versions
    }
  }

  /**
  * Switch to next version of the current language; this method is called on 'F7' key down event.
  */
  function toggleVerUp() {
    console.log("KEY: f7"); // log pressed key/s
    // Switch to next version, add 1 to the current version
    if(!switch_version(1)) {  // no next version found
      display_error("No more versions");  // Display error, no more versions
    }
  }

  /**
  * Switch to previous language/version of the current language/version; this method is called on 'Alt+F9' key down event.
  * Switch to previous version of the current language; If no more versions, then switch to previous language.
  */
  function toggleLangVerDown() {
    console.log("KEY: alt+f9"); // log pressed key/s
    switch_language_version(-1);  // Switch to previous language/version, subtract 1 from the current language/version
  }

  /**
  * Switch to next language/version of the current language/version; this method is called on 'F9' key down event.
  * Switch to next version of the current language; If no more versions, then switch to next language.
  */
  function toggleLangVerUp() {
    console.log("KEY: f9"); // log pressed key/s
    switch_language_version(1); // Switch to next language/version, add 1 to the current language/version
  }

  /**
  * Display current language name.
  */
  function set_language_name() {
    var lang = toggle_data.languageName(language);  // get current language name
    if(lang) {  // valid language
      $('#data-bar-language').html(lang); // Display language name (French, English..)
    } else {  // not a valid language
      $('#data-bar-language').html('Unknown');  // Display "Unknown"
    }
  }

  /**
  * Display current version name.
  */
  function set_version_name() {
    var ver = toggle_data.languageVersion(language, version).version; // get current version name
    if(ver) { // valid version
      $('#data-bar-version').html(ver); // Display version name
    } else {  // not a valid version
      $('#data-bar-version').html("Unknown"); // Display "Unknown"
    }
  }

  /**
  * Display twext current state(on/off).
  * @param 'state' the current twext state; true if twext on, false if twext off
  */
  function set_twext_state(state) {
    if(state) { // twext on
      $('#data-bar-Twext').html("twxt");
    } else {  // twext off
      $('#data-bar-Twext').html("text");
    }
  }

  /**
  * Round Switch to previous/next language (move to first version of the previous/next language)
  * @param 'add' amount to subtract/add from/to current language
           'ver' version of language, set only when switching both language and version (F9, Alt+F9)
  */
  function switch_language(add, ver) {
    // Data before language switch, save data later into firebase(save after render new language data,so that ui is not slowed by firebase requests)
    var oldLang = language, oldVer = version, oldText = trim(area.area.innerText), displayedLangName = $('#data-bar-language').text();;

    var nl = language+add;  // new language
    var lcount = toggle_data.languageCount(); // number of existing languages
    if(nl < 0) {  // if current language is the first language, switch to last one
      nl = lcount-1;  // switch to last language
    } else if(nl >= lcount) { // if current language is the last language, switch to first one
      nl = 0; // switch to first language
    }

    // Check if the language to switch is in the selected language list, if not then switch to the language after it.
    /*var lang_name = toggle_data.language(nl).language;  // get new language name
    if($.inArray(lang_name, selectedLanguages.lang_names) == -1) {  // if language not included in selected language list, switch to the one after
      language = nl;
      switch_language(1, ver); // switch to next language
    } else {  // language included in selected languages, switch to this language
      place_twext(nl, ver); // display Text/Twext lines
    }*/
    display_language(nl, ver);
    //language = nl;  // set current language to the new one
    //version = ver?ver:0;  // set version, default is the first version

    //area.initLanguagesChunks(lcount);
    // Render data of new language TODO
    //var doc = toggle_data.languageVersion(language, version);
    //display_twext(doc);
    //set_language_name();
    //set_version_name();

    // Save data (text edits and chunks) before language switch into firebase
    var oldLangName = toggle_data.language(oldLang).language;
    if(displayedLangName == oldLangName) { // displayed language is the old language, then save its data
      var saved = area.saveData(oldLang, oldVer, toggle_data.getLines(oldLang, oldVer), oldText); // Save data into firebase
      toggle_data.updateVersion(saved, oldVer, oldLang);  // update old language version with the saved data (chunks)
    }
    //area.saveChunks(oldLang, oldVer);
    //saveTwexts(oldText, oldLang, oldVer);
    //place_twext();
  }

  /**
  * Display twexts of the given language. If the language to display is not in the selected languages, the switch to the language after it.
  * @param 'lang' the language to display
           'ver' the language version to display
  */
  function display_language(lang, ver) {
    // Check if the language to display is in the selected language list, if not then switch to the language after it.
    var lang_name = toggle_data.language(lang).language;  // get language name
    if($.inArray(lang_name, selectedLanguages.lang_names) == -1) {  // if language not included in selected language list, switch to the one after
      language = lang;
      switch_language(1, ver); // switch to next language
    } else {  // language included in selected languages, switch to this language
      place_twext(lang, ver); // display Text/Twext lines
    }
  }

  /**
  * Switch to previous/next version of the current language; if no version found, display error to the user.
  * @param 'add' amount to subtract/add from/to current version
  * @return true if version switch completed, false if no version found (display error)
  */
  function switch_version(add){
    // Data before version switch, save data later into firebase(save after render new version data, so that ui is not slowed by firebase requests)
    var oldLang = language, oldVer = version, oldText = trim(area.area.innerText);

    var nv = version+add; // new version
    var doc = toggle_data.languageVersion(language, nv);  // get version with new version number
    if(doc) { // version found
      version = nv; // set current version to new version
      // version may not contain all lines, if line not found in this version, then load the first version of the line
      var verLines = doc.lines;  // lines in this version
      var sourceLines = toggle_data.source_text.split("\n").clean();  // get source text lines
      // Compare the sizes of version lines and source text lines, if less then version doesn't contain all lines
      if(Object.size(verLines) < Object.size(sourceLines)) { // version doesn't contain all lines
        var firstVerLines = toggle_data.first_version(language).lines; // get the first version lines
        for(var i=0; i<sourceLines.length; i++) { // loop over first version lines
          if(!verLines[i]) {  // If line not included in current version
            verLines[i] = {nN: "", value: firstVerLines[i].value};  // load the first version of the line, with empty chunks
          }
        }
        
      }
      display_twexts(verLines); // display Text/Twext lines

      // Save data (text edits and chunks) before version switch into firebase
      var saved = area.saveData(oldLang, oldVer, toggle_data.getLines(oldLang, oldVer), oldText); // save data into firebase
      toggle_data.updateVersion(saved, oldVer, oldLang);  // update old language version with the saved data (chunks)
      //area.saveChunks(oldLang, oldVer);
      //saveTwexts(oldText, oldLang, oldVer);
    } else {  // version not found, error will be displayed
      return false;
    }
    return true;  // version switch completed
  }

  /**
  * Switch to previous/next language/version of the current language/version.
  * Switch to previous/next version of the current language; If no more versions, then switch to previous/next language.
  * If switch to next language, move to first version of the language; if switch to previous language, move to last version of the language.
  * @param 'add' amount to subtract/add from/to current language/version
  */
  function switch_language_version(add) {
    // Switch version
    if(!switch_version(add)) {  // no version found to switch, then switch language
      toggle_data.language(language+add); // set to new language
      var latest = add<0?toggle_data.versionCount()-1:0;  // get language version number to move to
      switch_language(add, latest); // switch language
    }
  }

  /**
  * Display error to the user.
  * @param 'msg' message to be displayed
  */
  function display_error(msg){
    $error = $('#data-bar-error');  // error element
    $error.html(msg).show();  // render error message
    setTimeout(function() { // display the error message for an exact period then hide it
      $error.fadeOut();
    },400);
  }

  /**
  * Display "translating" msg to user while getting bing translations.
  */
  function display_translating() {
    $('#translating').show();
  }

  /**
  * Hide "translating" msg to user after getting bing translations.
  */
  function hide_translating() {
    $('#translating').hide();
  }

  /**
  * Remove spaces/new lines from the start and end of string
  * @param 'str' string to be trimmed
  * @return trimmed string
  */
  function trim(str) {
    str = str.replace(/^\s+|\s+$/g, "");  // remove spaces from start and end of the string
    return str.replace(/^\n+|\n+$/g, ""); // remove new lines from star and end of the string, return trimmed string
  }

  /**
  * Get and display twexts(translations) if twexts are not already displayed. If twexts already exist, toggle languages of the existing twexts.
  * If no twexts are displayed, get translations of the area text lines(from firebase or google), display them as twexts for each Text line.
  * If twexts are displayed, toggle languages.
  */
  function check_translations(e, noToggle) {
    var text = extractText(area.area.innerText);
    text = trimStringLines(text); // trim string lines
    var isNewText = toggle_data == null || (toggle_data != null && toggle_data.source_text != text);
    if(area.isTwextOn() && !isNewText) { // twexts are displayed, fetch added languages or toggle language
      if(noToggle) {  // do not toggle, translate added languages only
        translateAddedLanguages();  // fetch added languages translations
      } else {  // toggle to next language
        toggleLangUp(); // toggle languages
      }
    } else { // no twexts are displayed, translate text
      get_translations(text); // get translations of text from firebase of google
    }    
    area.setCaretPos(0,0);  // set cursor position at the start of area text
  }

  /**
  * Extract text lines from area input. Text = input if twext not displayed.
  * @param 'input' area inner text
  * @return Text lines string
  */
  function extractText(input) {
    var lines = [], i, text = "";
    var nodes = area.area.childNodes; // area child nodes
    if(area.isTwextOn()) { // if twext displayed
      for(i=0; i<nodes.length; i++) { // loop over area childnodes
        if(nodes[i].className == "text") lines.push(nodes[i].innerText);  // push text line
      }
      text = lines.join('\n');  // construct text string
    } else {  // twext not displayed
      text = input; // text is the input
    }
    return text;  // return text
  }

  /**
  * Get translations of text from either firebase or Bing translate api.
  * Retrieve all translations of all lines from firebase, then transfer the data into toggle_data object.
  * While data transfer to toggle_data object, if any entry is null(not found in firebase), then translate text using google translate.
  * @param 'text' text to be translated
  */
  function get_translations(text) {
    var line = "", j;

    // Create toggle_data object to carry all languages information (languages, versions, translations, chunks)
    toggle_data = new Twext.ToggleData();
    toggle_data.source_text = text; // set source text
    //toggle_data.source_lang = "en"; // set default source language, default is english

    //detectTextLanguage(text, trans); // detect the source language of the text

    // Get firebase translations
    pull_translations(text, selectedLanguages, 0);
  }

  /**
  * Pull translations of text from either firebase or Bing translate api.
  * Retrieve all translations of all lines from firebase, then transfer the data into toggle_data object.
  * While data transfer to toggle_data object, if any entry is null(not found in firebase), then translate text using google translate.
  * @param 'text' text to be translated
           'langs' the languages object for the text to be translated to. The object contains two lists: codes and names
           'firstLanguage' number of first language to be displayed
  */
  function pull_translations(text, langs, firstLanguage) {
    // initialize objects
    firebaseTranslations = []; // initialize firebase translations
    gTranslatedText = []; // initialize google translations of text

    generateTextShortcut(text); // create shortcut for the text to be used in the url to retrieve text

    display_translating();  // display translating msg while get text translations

    // Get firebase translations
    var lines = text.split("\n"); // get text lines
    lines = lines.clean();  // remove empty lines
    for(j=0; j<lines.length; j++) { // loop over text lines
      line = getStrWords(lines[j]).join('-');  // construct Firebase entry (line words separated by -)
      console.log(firebaseRef+"foo/"+line);  // log firebase url
      // Send request to firebase to get data(translations and chunks of all languages/versions) of this line
      getFirebaseEntryValue(firebaseRef+"foo/"+line, j, function(data, lineNum) {  // callback
        firebaseTranslations[lineNum] = data; // save retrieved data into firebaseTranslations object
        if(Object.size(firebaseTranslations) == lines.length) { // All lines data are loaded (finished firebase loading)
          fillTranslations(text, langs, firstLanguage); // load translations data retrieved to toggle_data object
        }
      });
    }
  }

  /**
  * Generate random string as a shortcut to represent the text. This is used to retrieve the text later if requested via URL.
  * Save this shortcut/text mapping into firebase.
  * @param 'text' the source text
  */
  function generateTextShortcut(text) {
    var textEntry = constructFbKeyFromText(text); // convert text to firebase key entry
    getFirebaseEntryValue(firebaseRef+"mapping/text-url/"+textEntry, null, function(data, index) {
      if(!data) { // if text not exist, generate and save shortcut
        var id = randomId();  // create random id
        var shortcut = id.charAt(0);  // get the first charcter
        saveShortcut(text, id, shortcut, 0);  // save text shortcut
      } else {
        window.history.pushState("", document.title, "#"+data); // display new url
      }
    });
  }

  /**
  * Save url-text mapping into firebase, only if text is not saved before.
  * The url-text mappings are saved into firebase under the path: "mapping/url-text"; key is the url shortcut, value is the text
  * The reverse mapping "text-url" is saved under the path: "mapping/text-url". This mapping is used to check duplicate text, so that same text not saved twice with different urls; text is saved as one line strings
  */
  function saveShortcut(text, id, shortcut, index) {
    getFirebaseEntryValue(firebaseRef+"mapping/url-text/"+shortcut, index, function(data, index) {
      if(!data) { // if this shortcut not used for other text
        window.history.pushState("", document.title, "#"+shortcut); // display new url
        var textEntry = constructFbKeyFromText(text); // convert text to firebase key entry
        new Firebase(firebaseRef+"mapping/url-text/"+shortcut).set(text); // save url-text mapping
        new Firebase(firebaseRef+"mapping/text-url/"+textEntry).set(shortcut);  // save text-url mapping

        var listEntry = {url: shortcut, text: text};
        addToUrlList(listEntry);  // add new url to list
        new Firebase(firebaseRef+"history").push(listEntry);  // push generated url to history list
      } else {  // if shortcut is already in use
        if(index == id.length-1) {  // all characters of the generated id is used, generate a new one
          generateTextShortcut(text);
        } else {  // some of id characters not used in the shortcut
          index++;
          shortcut += id.charAt(index); // append the next character of the id to the shortcut
          saveShortcut(text, id, shortcut, index);  // repeat
        }
      }
    });
  }

  /**
  * Convert text to one line string to be a key entry in firebase.
  * Replace new lines "\n" by two spaces, separate words by -
  * @param 'text' the text to be converted.
  */
  function constructFbKeyFromText(text) {
    var i, line, result = [];
    var lines = text.split("\n");
    lines = lines.clean();
    for(i=0; i<lines.length; i++) {
      line = getStrWords(lines[i]).join('-');
      result.push(line);
    }
    return result.join('  ');
  }

  /**
  * Send request to firebase and get required data value.
  * @param 'ref' the firebase url (request)
            'callbackValue' callback value needed in the calling method
            'callback' the callback function
  */
  function getFirebaseEntryValue(ref, callbackValue, callback) {
    // Send request to firebase
    new Firebase(ref).once('value', function(dataSnapshot) {  //callback
      callback(dataSnapshot.val(), callbackValue);  // callback with data retrieved
    });
  }

  /**
  * Fill toggle_data object with data retrieved from firebase.
  * If a language translation of a line is not retrieved from firebase(not found), then translate line using google translate(send request and return, continue loading(fill) operation after returning from google (request callback))
  * @param 'text' area text lines
           'langs' the languages object for the text to be translated to. The object contains two lists: codes and names
           'firstLanguage' number of first language to be displayed
           'lineIx' text line index; If set, start loading from this line index
           'langIx' language index; If set, start loading from this language index
  */
  function fillTranslations(text, langs, firstLanguage, lineIx, langIx) {
    var targets = langs.targets;  // selected targets
    var lang_names = langs.lang_names;  // selected lang names
    var lang_ix;
    var i = lineIx ? lineIx : 0;  // lines counter
    var j = langIx?langIx:0; // languages counter
    var lines = text.split("\n"); // get text lines
    lines = lines.clean();  // remove empty lines
    for(; i<firebaseTranslations.length; i++) {  // Loop over lines (retrieved from firebase)
      for(; j<targets.length; j++) {  // loop over languages
        if(firebaseTranslations[i] && firebaseTranslations[i][targets[j]]) {  // Firebase entry has been loaded
          // add language to toggle_data object
          lang_ix = addLanguage(lang_names[j]);
          // Load this language data(versions, lines translations, chunks) to toggle_data object 
          addVersions(firebaseTranslations[i][targets[j]], i*2, lang_ix);
        } else {  // Firebase entry not found, load from google (translate all lines of text in one request, to save time)
          // Check if the text has been translated to this language before(request sent in another line through the lines loop)
          if(gTranslatedText[targets[j]]) {  // The text has been translated to this language with google before
            // add language to toggle_data object
            lang_ix = addLanguage(lang_names[j]);
            // Add translation of line to toggle_data object, with empty chunks and version 1-0(first version) 
            var translatedLine = $.trim(gTranslatedText[targets[j]].split("\n")[i]);
            var data = {value: translatedLine, nN: ""}; // translation data(translated line and chunks)
            // Add translation of line to toggle_data object, with empty chunks and version 1-0(first version)
            toggle_data.addLine(lang_ix, "1-0", i*2, data);  // add this translation to toggle_data object

            // Save data into firebase db
            var line = $.trim(getStrWords(lines[i]).join('-')); // construct Firebase entry (line words separated by -)
            new Firebase(firebaseRef+"foo/"+line+"/"+targets[j]+"/1-0").set(data); // save data request
          } else {  // text not translated before, send request to google translate api for text translation (all lines in one request)
            // translate the whole text to this language (translation will be saved in gTranslatedText object for later use in next text lines)
            translate_html(text, targets[j], lang_names[j], trans, langs, firstLanguage, i, j);
            return; // return, translate request callback will call this method(to continue load after text is translated)
          }
        }
      }
      j = 0; // reset languages counter for next line
    }
    // Display Text/Twext lines
    //var first_lang = toggle_data.source_lang=="en"?"español":"english"; // get initial language (first to display)
    //var lang = toggle_data.find_by_language_name(firstLanguage); // get language number to be displayed
    area.loadChunks(toggle_data.data.languages);  // load retrieved chunks into lang_chunks object in area
    display_language(firstLanguage, 0);
    hide_translating(); // hide translating msg after getting text translations
    //place_twext(firstLanguage, 0); // Twexts display
  }

  /**
  * Add all versions/data to toggle_data object.
  * @param 'versions' versions(contains translation lines and chunks) to be added
           'lineNum' the line number in which the data will be loaded
           'lang_ix' the language index in which the data will be loaded
  */
  function addVersions(versions, lineNum, lang_ix) {
    for(var key in versions) {  // loop over versions
      // add line/data (translated text and chunks) to toggle_data object(add version too if not already exist)
      toggle_data.addLine(lang_ix, key, lineNum, versions[key]);
    }
  }

  /**
  * Translate text to the sepcified language.
  * @param 'text_source' the text to be transalted
           'target_lang' the target language code (en, fr, it, es...)
           'target_name' the target language name (english, french, italian, spanish...)
           'translator' translate object used for sending request to Bing translate api
           'lineIx' line index where translation request is sent(in fillTranslations), used to call fillTranslations() and continue from this line
           'langIx' language where translation request is sent(in fillTranslations),used to call fillTranslations() and continue from this language
  */
  function translate_html(text_source, target_lang, target_name, translator, langs, firstLanguage, lineIx, langIx) {
    // Get the access token for translation
    new Firebase("https://readfm.firebaseio.com/AccessToken").once('value', function(dataSnapshot) {  //callback
      translator.setAccessToken(dataSnapshot.val());  // set access token in translator
      // Use translator to send request to Bing translate api for text translation
      translator.translateWithFormat(text_source, target_lang, function(translated_text) { // success callback
        if(translated_text) { // If translation data retrieved
          //var translated_text = data; // translated text
          //var source_lang = data.data.translations[0].detectedSourceLanguage; // detected source language
          //toggle_data.source_lang = source_lang;   // set source language in toggle_data object to the detected one

          // Add this language to toggle_data object
          //var lang_ix = addLanguage(target_name);
          // Add translation of line to toggle_data object, with empty chunks and version 1-0(first version) 
          //var translatedLine = $.trim(translated_text.split("\n")[lineIx]);console.log("Line: "+translatedLine+" ,lang: "+target_lang);
          //var data = {nN:"", value:translatedLine}; // translation data(translated line and chunks)
          //toggle_data.addLine(lang_ix, "1-0", lineIx, data); // add translation data of line to toggle_data object

          // Add this language translation to gTranslatedText object for later use in rest of text lines(so that the text is retranslated)
          gTranslatedText[target_lang] = translated_text;
          // Continue translations data loading into toggle_data object, fillTranslations with start lineIx and langIx
          fillTranslations(text_source, langs, firstLanguage, lineIx, langIx);

          // Save text translation data into firebase db
          //var lines = text_source.split("\n");  // get text lines
          //lines = lines.clean();  // remove empty lines
          //var line = $.trim(getStrWords(lines[lineIx]).join('-'));  // construct Firebase entry (line words separated by -)
          //new Firebase(firebaseRef+"foo/"+line+"/"+target_lang+"/1-0").set(data);
        } // end if
      }, function(msg) {  // error callback
        console.log("Translate Error: " + msg + "\tlanguage: " + target_name);
      }); // end translate request
    }); // end firebase request
  }

  /**
  * Detect text language using Bing api.
  * @param 'text' the text used to detect its language
           'translator' translate object used for sending request to Bing api
  */
  /*function detectTextLanguage(text, translator) {
    // Get the access token for bing api detect request
    new Firebase(firebaseRef+"AccessToken").once('value', function(dataSnapshot) {  //callback
      translator.setAccessToken(dataSnapshot.val());  // set access token in translator
      // Use translator to send request to Bing api for text language detection
      translator.detectTextLanguage(text, function(response) {  // success callback
        toggle_data.source_lang = response; // set the text source language
      }, function(msg) {  // error callback
        toggle_data.source_lang = "en"; // set source language to English by default
        console.log("Detect Error: " + msg);  // log error message
      }); // end detect request
    }); // end firebase request
  }*/

  /**
  * Add language to toggle_data object; If language is already added, then set it to the current language and return its index.
  * @param 'target_name' the langauge name to be added
  * @return index of added language
  */
  function addLanguage(target_name) {
    // Add language to toggle_data object
    var lang_ix = toggle_data.find_by_language_name(target_name); // get language from toggle_data object
    // check if this language has been loaded to toggle_data before
    if(lang_ix != -1) { // language found, language already added
      toggle_data.language(lang_ix);  // Set current language to this language
    } else {  // language not found, add it to toggle_data object
      lang_ix = toggle_data.addLanguage(target_name); // add language
    }
    return lang_ix; // return index of added language
  }

  /**
  * Display Text/Twext lines (text/translation) and align each pair.
  * Get the language version, get Text/Twext lines, align and render lines, set langauge and version display names.
  * @param 'lang' the language to be dispalyed
           'ver' the language version to be displayed
  */
  function place_twext(lang, ver) {
    language = lang;
    version = ver?ver:0;
    var doc = toggle_data.languageVersion(language, version);
    display_twext(doc.lines);
  }

  /**
  * Display Text/Twext lines (text/translation) and align each pair.
  * Get Text/Twext lines, align and render lines, set langauge and version display names.
  * @param 'lines' translations (twexts) to be displayed
  */
  function display_twext(lines) {
    var lines = meld_twext_lines(toggle_data.source_text, lines); // Get Text/Twext lines
    $("#main").show();  // show the input area
    renderLines(lines); // render Text/Twext lines
    set_language_name();  // display language name
    set_version_name(); // display version name
    set_twext_state(true); // set state to twext on
    /*area.language = language;
    area.version = version;
    //area.setCurrentChunks();
    area.render_html(lines);
    area.orgLines = toggle_data.getLines(language, version);console.log("display twexts")
    // Align twexts
    area.realign();*/
  }

  /**
  * Get Text/Twext lines.
  * @param 'main' source text
           'lang' transalted lines
  * @return Text/Twext lines
  */
  function meld_twext_lines(main, lang) {
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
  }

  /**
  * Render Text/Twext lines (text/translation) and align each pair.
  * Align and render lines, set langauge and version display names.
  * @param 'lines' Text/Twext lines to be displayed
  */
  function renderLines(lines) {
    area.language = language; // set current language in the area
    area.version = version; // set current version in the area
    area.render_html(lines);  // render the lines
    area.orgLines = toggle_data.getLines(language, version);  // set current displayed lines in the area
    area.realign(); // align Text/Twext lines
  }

  /**
  * Load some initial sample text into the input area.
  */
  function load_sample_data() {
    // Initiate some sample data
    var data = "Twext is twin text,\n"+
               "aligned between the lines,\n"+
               "in any language you like.";
    get_translations(data);
    //return data;  // return data, for display on input area
  }

  /**
  * Init display; Register keys events, Load initial(sample) data and get its translations, render Text/Twext lines
  */
  function init(){
    register_keys();  // Attach keys events
    loadLanguageList(); // load languages to the menu
    attachEvents(); // attach elements events
    area = new ScoochArea( this.getElementById('data-show') );  // create ScoochArea object to represent the contenteditable element
    //var data = load_data(); // load sample text
    //get_translations(data); // get sample text translations and render Text/Twext lines
    //doc = data.languageVersion(language,version);
    //display_document(doc);
    //set_language_name();
    //setTimeout(set_version_name,200);
  }

  /**
  * Load all languages to the select menu.
  */
  function loadLanguageList() {
    var selectValues = Object.sortAssoc(languages); // get languages object(eg:{"english":"en", ....}) sorted by keys
    $.each(selectValues, function(key, value) {  // loop languages
      $('#language_menu')
         .append($("<option></option>")
         .attr("value",value) // set the value of the option to language code
         .text(key)); // set the text of the option to language name
    });
    select($('#language_menu')[0], selectedLanguages.targets);  // select the options included in the selectedLanguages object
  }

  /**
  * Select options in the select box that included in the given array.
  * @param 'selectBox' the select box element
           'arr' array contains values needed to be selected
  */
  function select(selectBox, arr) {
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      if($.inArray(selectBox.options[i].value, arr) != -1) {
        selectBox.options[i].selected = true; // select option
      }
    } 
  }

  /**
  * Deselect all options in the select box.
  * @param 'selectBox' the select box element
  */
  function deselectAll(selectBox) {
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      selectBox.options[i].selected = false; // unselect option
    }
  }

  // Init sample data display
  console.log("Init");  // log start init operation
  $(init);

}(document);

/*function display_document(doc){
    var lines = Twext.Utils.TextToLines(doc.data);
    //var html = Twext.Output.Html(t);
    area.render_html(lines);
  }*/

  /** OK EXTRA GOOGLE TRANSLATE STUFF HERE **/
  /*function trans_(targetname,target){
      var data = $useForTrans;
      var source = 'en';
      var trans = new Twext.Translation("AIzaSyBJS-lM8aiUARre-cZwUXyVHdCJ_TXv4Gs");
      trans.translateWithFormat(data,source,target,function(data){
          if(data.data && data.data.translations){
              data = data.data;
              var l = sampleData.addLanguage(targetname);
              var v = sampleData.addVersion('1.0',meldLines($useForTrans,data.translations[0].translatedText));
              version = 0;
              language = l;
              var doc = sampleData.languageVersion(language,version);
              console.log(doc);
              display_document(doc);
              set_language_name();
              set_version_name();
          }
      },function(){
          alert("error");
      })
  }*/

  /*function trans_init(){
      var $tswedish = $('#tswedish');
      var $tczech = $('#tczech');
      var $tjapanese = $('#tjapanese');
      var $tkorean = $('#tkorean');
      $tswedish.click(function(){trans_("Swedish","sv");});
      $tczech.click(function(){trans_("Czech","cs");});
      $tjapanese.click(function(){trans_("Japanese","ja");});
      $tkorean.click(function(){trans_("Korean","ko");});
  }*/

  //$(trans_init);
/**
  Save twexts into firebase if edited by the user.
*/
/*function saveTwexts(text, lang, ver) {
  var currentTwext = "", savedTwext = "", line = "", words = null, i, j;
  var textLines = text.split('\n');
  var savedLines = toggle_data.getLines(lang, ver);
  var theLanguage = lang_abrs[toggle_data.languageName(lang)];
  var theVersion = toggle_data.versionName(ver, lang);
  for(i=0,j=0; i<textLines.length; i=i+2,j++) {
    currentTwext = cleanText(textLines[i+1]).replace(/\ +/g, ' '); // get the current twext, remove any extra spaces that may be put to align
    savedTwext = savedLines[j].value;
    if(currentTwext != savedTwext) {
      console.log("Save twext into firebase....");
      words = textLines[i]?getWords(textLines[i]):null;
      line = words?$.trim(words.join('-')):null;
      if(line) {
        savedLines[j].value = currentTwext;
        toggle_data.updateVersion({lines:savedLines}, ver, lang);
        new Firebase(firebaseRef+"/"+line+"/"+theLanguage+"/"+theVersion+"/value").set(currentTwext);
      }
    }
  }
}*/
