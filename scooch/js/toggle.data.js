/**
 Demo to show toggle features
 */


!function(d){

    var sampleData = null;
    var document = null;
    var language = 0;
    var version = 0;
    var area = null;
    var toggle_data = null;
    var firebaseRef = "https://readfm.firebaseio.com/foo";
    var gTranslatedText = {};
    var firebaseTranslations = []; // index=line number, value=firebase entry contains language/versions/translated text and chunks

    function toggleLangDown(){
        console.log("KEYev: left");
        language_switch(-1);

    }

    function toggleLangUp(){
        console.log("KEYev: right");
        language_switch(1);
    }

    function toggleVerDown(){
        console.log("KEYev: up");
        if(!switch_versions(-1)) {
          display_error("No more versions");
        }
    }

    function toggleVerUp(){
        console.log("KEYev: down");
        if(!switch_versions(1)) {
          display_error("No more versions");
        }
    }

    function toggleLangVerUp() {
      language_version_switch(1);
    }
    
    function toggleLangVerDown() {
      language_version_switch(-1);
    }

    function register_keys(){
        console.log("register keys")
        $(d).bind("keydown","f2", check_translations);
        $(d).bind("keydown","alt+F8",toggleLangDown);
        $(d).bind("keydown","F8",toggleLangUp);
        $(d).bind("keydown","alt+F7",toggleVerDown);
        $(d).bind("keydown","F7",toggleVerUp);
        $(d).bind("keydown","F9",toggleLangVerUp);
        $(d).bind("keydown","alt+F9",toggleLangVerDown);
    }

    function load_data(){
      var data =  "We're connecting ourselves with everyone else on earth,\n"+
    "with all human knowledge, and in all kinds of languages.\n"+
    "How can we learn each others' words?";
        return data;
    }

    function display_document(doc){
        var lines = Twext.Utils.TextToLines(doc.data);
        //var html = Twext.Output.Html(t);
        area.render_html(lines);
    }

    function set_language_name(){
        var lang = toggle_data.languageName(language);//sampleData.languageName(language);
        if(lang){
            $('#data-bar-language').html(lang);
        }else{
            $('#data-bar-language').html('Unknown');
        }
    }

    function set_version_name(){
        var ver = toggle_data.languageVersion(language, version).version;
        if(ver){
            $('#data-bar-version').html(ver);
        }else{
            $('#data-bar-version').html("Unknown");
        }
    }

    function language_switch(add, ver){
        var oldLang = language, oldVer = version;
        var nl = language+add;
        var lcount = toggle_data.languageCount();
        if(nl<0){
            nl = lcount-1;
        }else if(nl>=lcount){
            nl=0;
        }
        version = ver?ver:0;
        language = nl;
        //area.initLanguagesChunks(lcount);
        var doc = toggle_data.languageVersion(language, version);
        display_twext(doc);
        set_language_name();
        set_version_name();
        // Save previous chunks into firebase
        area.saveChunks(oldLang, oldVer);
        
        //place_twext();
    }

    function switch_versions(add){
      var oldLang = language, oldVer = version;
        var nv = version+add;
        if(nv<0){
            //display_error("No more versions");
            return false;
        }
        var doc = toggle_data.languageVersion(language,nv);
        if(doc) {
          version = nv;
          var verLines = doc.data.lines;
          var sourceLines = toggle_data.source_text.split("\n").clean();
          if(Object.size(verLines) < Object.size(sourceLines)) { // Not all lines have this version
            var firstVerLines = toggle_data.first_version(language).data.lines;
            for(var i=0; i<sourceLines.length; i++) {
              if(!verLines[i]) {
                verLines[i] = {nN: "", value: firstVerLines[i].value};
              }
            }
            
          }
          var lines = meld_twext_lines(toggle_data.source_text, verLines);
          area.language = language;
          area.version = version;
          area.setCurrentChunks();
          area.render_html(lines);
          set_language_name();
          set_version_name();
          // Align twexts
          area.realign();
          // Save previous chunks into firebase
          area.saveChunks(oldLang, oldVer);
        } else {
          return false;//display_error("No more versions");
        }
        return true;
    }

    function language_version_switch(add) {
      if(!switch_versions(add)) {
        toggle_data.language(language+add);
        var latest = add<0?toggle_data.versionCount()-1:0;
        language_switch(add, latest);
      }
    }

    function display_error(msg){
        $error = $('#data-bar-error');
        $error.html(msg).show();
        setTimeout(function(){
            $error.fadeOut();
        },400);
    }

    var targets = ["fr", "it", "es", "en"];
    var lang_names = ["French", "Italian", "Spanish", "English"];
    //var lang_abrs = {"French": "fr", "Italian": "it", "Spanish": "es", "English": "en"};  // key/value array contains lang name/abreviation
    var trans = new Twext.Translation("AIzaSyC4S6uS_njG2lwWg004CC6ee4cKznqgxm8");

    function trim(str) {
      str = str.replace(/^\s+|\s+$/g, "");
      return str.replace(/^\n+|\n+$/g, "");
    }

    function check_translations() {
      //if(current_display_mode != SOURCE_MODE)
        //return;
      if($('.twext').length == 0){
        var text = trim(area.area.innerText);
        get_translations(text);
      }    
      area.setCaretPos(0,0);
    }

    /**
      Get firebase entry value.
      Params: 'ref' the firebase url
              'callback' the callback function
    */
    function getFirebaseEntryValue(ref, lineNum, callback) {
      new Firebase(ref).once('value', function(dataSnapshot) {
        callback(dataSnapshot.val(), lineNum);
      });
    }

    function get_translations(text) {
      gTranslatedText = {};
      firebaseTranslations = [];
      toggle_data = new Twext.ToggleData();
      toggle_data.source_text = text;
      toggle_data.source_lang = "en";
      var line="";
      var lines = text.split("\n");
      lines = lines.clean();
      var j;
      for(j=0; j<lines.length; j++) {
        line = getWords(lines[j]).join('-');  //  Firebase entry
        console.log(firebaseRef+"/"+line);
        getFirebaseEntryValue(firebaseRef+"/"+line, j, function(data, lineNum) {
          firebaseTranslations[lineNum] = data;
          if(Object.size(firebaseTranslations) == lines.length) { // All lines loaded
            fillTranslations(text);
          }
        });
      }
    }

    function addVersions(versions, lineNum, lang_ix) {
      for(var key in versions) {
        toggle_data.addLine(lang_ix, key, lineNum, versions[key]);
      }
    }

    function fillTranslations(text, lineIx, langIx) {
      var i = lineIx?lineIx:0, j = langIx?langIx:0, lang_ix;
      var lines = text.split("\n");
      lines = lines.clean();
      for(; i<firebaseTranslations.length; i++) {  // Loop over lines
        for(; j<targets.length; j++) {
          if(firebaseTranslations[i] && firebaseTranslations[i][targets[j]]) {  // Firebase entry loaded
            lang_ix = toggle_data.find_by_language_name(lang_names[j]);
            if(lang_ix != -1) { // language added before
              toggle_data.language(lang_ix);  // Set to current language
            } else {
              lang_ix = toggle_data.addLanguage(lang_names[j]);
            }
            addVersions(firebaseTranslations[i][targets[j]], i, lang_ix);
          } else {  // Entry not found in firebase, load from google
            if(gTranslatedText[targets[j]]) {  // The text is translated with google before
              lang_ix = toggle_data.find_by_language_name(lang_names[j]);
              if(lang_ix != -1) { // language added before
                toggle_data.language(lang_ix);  // Set to current language
              } else {
                lang_ix = toggle_data.addLanguage(lang_names[j]);
              }
              var translatedLine = $.trim(gTranslatedText[targets[j]].split("\n")[i]);
              toggle_data.addLine(lang_ix, "1-0", i, {value: translatedLine, nN: ""});

              // Save text/translation into firebase db
              var line = $.trim(getWords(lines[i]).join('-'));
              new Firebase(firebaseRef+"/"+line+"/"+targets[j]+"/1-0").set({"nN":"", "value":translatedLine});
            } else {  // First google translate request
              translate_html(text, targets[j], lang_names[j], targets.length, trans, i, j); // translate the whole text, faster than translate each line
              return;
            }
          }
        }
        j = 0;
      }
      var first_lang = toggle_data.source_lang=="en"?"Spanish":"English";
      var lang = toggle_data.find_by_language_name(first_lang);
      version = 0;
      language = lang;
      area.loadChunks(toggle_data.data.languages);
      place_twext();
    }

    function translate_html(text_source, target_lang, target_name, total_langs, translator, lineIx, langIx){ 
      translator.translateWithFormat(text_source, null, target_lang, function(data){
            if(data.data && data.data.translations){
                var translated_text = data.data.translations[0].translatedText;
                var source_lang = data.data.translations[0].detectedSourceLanguage;
                toggle_data.source_lang = source_lang;
                var lang_ix = toggle_data.find_by_language_name(target_name);
                if(lang_ix != -1) { // language added before
                  toggle_data.language(lang_ix);  // Set to current language
                } else {
                  lang_ix = toggle_data.addLanguage(target_name);
                }
                var translatedLine = $.trim(translated_text.split("\n")[lineIx]);
                toggle_data.addLine(lang_ix, "1-0", lineIx, {nN:"", value:translatedLine});
                gTranslatedText[target_lang] = translated_text;
                fillTranslations(text_source, lineIx, langIx);

                // Save text/translation into firebase db
                var lines = text_source.split("\n");
                lines = lines.clean();
                var line = $.trim(getWords(lines[lineIx]).join('-'));
                new Firebase(firebaseRef+"/"+line+"/"+target_lang+"/1-0").set({nN:"", value:translatedLine});
            }
        },function(){
            console.log("error: " + target_lang + " " + lang_name);
        });
    }

    function place_twext(){
      //if(new_lang != undefined){
        //save_current_lang();
        //language = new_lang;
      //}
      var doc = toggle_data.first_version(language);
      display_twext(doc);
      //current_display_mode = TWEXT_MODE;
      set_language_name();
      set_version_name();
    }

    function display_twext(doc) {
      var lines = meld_twext_lines(toggle_data.source_text, doc.data.lines);
      //area.enable_twext();
      //area.enable_scooching();
      $("#main").show();
      area.language = language;
      area.version = version;
      area.setCurrentChunks();
      area.render_html(lines);
      // Align twexts
      area.realign();
    }

    function meld_twext_lines(main, lang){
      var nl = /\n/g, main = main.split(nl);
      var l = main.length, i = 0, j=0, text_lines = [];
      for(; i<l ; i++,j++){
          if(main[i].length > 0 || (lang[j] && lang[j].value.length > 0)) {
            text_lines.push(main[i]);
            text_lines.push(lang[j].value);
          } else {
            text_lines.push(null);
            j--;
          }
      }
      return text_lines;
    }

    function init(){
        register_keys();
        area = new ScoochArea( this.getElementById('data-show') );

        var data = load_data();
        console.log(data);
        get_translations(data)
        //doc = data.languageVersion(language,version);
        //display_document(doc);
        //set_language_name();
        //setTimeout(set_version_name,200);
    }

    console.log("Init");
    $(init);

    /** OK EXTRA GOOGLE TRANSLATE STUFF HERE **/

    function trans_(targetname,target){
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
    }

    function trans_init(){
        var $tswedish = $('#tswedish');
        var $tczech = $('#tczech');
        var $tjapanese = $('#tjapanese');
        var $tkorean = $('#tkorean');
        $tswedish.click(function(){trans_("Swedish","sv");});
        $tczech.click(function(){trans_("Czech","cs");});
        $tjapanese.click(function(){trans_("Japanese","ja");});
        $tkorean.click(function(){trans_("Korean","ko");});
    }

    $(trans_init);

}(document);


