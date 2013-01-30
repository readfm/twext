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

    function onLeft(){
        console.log("KEYev: left");
        language_switch(-1);

    }

    function onRight(){
        console.log("KEYev: right");
        language_switch(1);
    }

    function onUp(){
        console.log("KEYev: up");
        switch_versions(-1);
    }

    function onDown(){
        console.log("KEYev: down");
        switch_versions(1);
    }

    function register_keys(){
        console.log("register keys")
        $(d).bind("keydown","f2", check_translations);
        $(d).bind("keydown","alt+left",onLeft);
        $(d).bind("keydown","alt+right",onRight);
        $(d).bind("keydown","alt+up",onUp);
        $(d).bind("keydown","alt+down",onDown);
    }

    function load_data(){
        /*if($useThisData){
            sampleData = $useThisData;
        }else{
            sampleData = new Twext.ToggleData(SampleTwextData1);
        }*/
        var data =  "We're connecting ourselves with everyone else on earth,\n"+
    "with all human knowledge, and in all kinds of languages.\n"+
    "How can we learn each others' words?\n";
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
        var ver = toggle_data.latest_version(language).version;//sampleData.versionName(version,language);
        if(ver){
            $('#data-bar-version').html(ver);
        }else{
            $('#data-bar-version').html("Unknown");
        }
    }

    function language_switch(add){
        var nl = language+add;
        var lcount = toggle_data.languageCount();
        if(nl<0){
            nl = lcount-1;
        }else if(nl>=lcount){
            nl=0;
        }
        version = 0
        language = nl;
        area.initLanguagesChunks(lcount);
        place_twext(nl);
    }

    function switch_versions(add){
        var nv = version+add;
        if(nv<0){
            display_error("No more versions");
        }
        if(sampleData.version(nv)){
            version = nv;
            var doc = sampleData.languageVersion(language,version);
            console.log(doc);
            display_document(doc);
            set_language_name();
            set_version_name();
        }else{
            display_error("No more versions");
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

    function get_translations(text) {
      toggle_data = new Twext.ToggleData();
      toggle_data.source_text = text;
      var i = 0;
      for(; i < targets.length; i++){
        translate_html(text, targets[i], lang_names[i], targets.length, trans);
      }
    }

    function translate_html(text_source, target_lang, target_name, total_langs, translator){ 
      translator.translateWithFormat(text_source, null, target_lang, function(data){
            if(data.data && data.data.translations){
                var translated_text = data.data.translations[0].translatedText;
                var source_lang = data.data.translations[0].detectedSourceLanguage;
                var lang_ix = toggle_data.addLanguage( target_name );
                toggle_data.set_version( "1.0", [translated_text] );
                
                if(lang_ix == total_langs - 1){
                  toggle_data.source_lang = source_lang;
                  var first_lang = source_lang=="en"?"Spanish":"English";
                  var lang = toggle_data.find_by_language_name(first_lang);
                  version = 0;
                  language = lang;
                  place_twext(lang);
                }
            }
        },function(){
            console.log("error: " + target_lang + " " + lang_name);
        });
    }

    function place_twext(new_lang){
      if(new_lang != undefined){
        //save_current_lang();
        language = new_lang;
      }
      var doc = toggle_data.latest_version(language);
      display_twext(doc);
      //current_display_mode = TWEXT_MODE;
      set_language_name();
      set_version_name();
    }

    function display_twext(doc) {
      var lines = meld_twext_lines(toggle_data.source_text, doc.data, doc.chunks);
      //area.enable_twext();
      //area.enable_scooching();
      area.language = language;
      area.setCurrentChunks();
      area.render_html(lines);
      // Align twexts
      area.realign();
    }

    function meld_twext_lines(main, lang){
      var nl = /\n/g, main = main.split(nl),lang = lang.split(nl);
      var l = main.length, i = 0, text_lines = [];
      for(; i<l ; i++){
          if(main[i].length > 0 || lang[i].length > 0) {
            text_lines.push(main[i]);
            text_lines.push(lang[i]);
          } else {
            text_lines.push(null);
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


