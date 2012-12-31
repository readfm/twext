/**
 Demo to show toggle features
 */


!function(d){

    var sampleData = null;
    var document = null;
    var language = 0;
    var version = 0;
    var area = null;

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
        $(d).bind("keydown","alt+left",onLeft);
        $(d).bind("keydown","alt+right",onRight);
        $(d).bind("keydown","alt+up",onUp);
        $(d).bind("keydown","alt+down",onDown);
    }

    function load_data(){
        if($useThisData){
            sampleData = $useThisData;
        }else{
            sampleData = new Twext.ToggleData(SampleTwextData1);
        }
        return sampleData;
    }

    function display_document(doc){
        var lines = Twext.Utils.TextToLines(doc.data);
        //var html = Twext.Output.Html(t);
        area.render_html(lines);
    }

    function set_language_name(){
        var lang = sampleData.languageName(language);
        if(lang){
            $('#data-bar-language').html(lang);
        }else{
            $('#data-bar-language').html('Unknown');
        }
    }

    function set_version_name(){
        var ver = sampleData.versionName(version,language);
        if(ver){
            $('#data-bar-version').html(ver);
        }else{
            $('#data-bar-version').html("Unknown");
        }
    }

    function language_switch(add){
        var nl = language+add;
        var lcount = sampleData.languageCount();
        if(nl<0){
            nl = lcount-1;
        }else if(nl>=lcount){
            nl=0;
        }

        if(sampleData.language(nl)){
            version = 0
            language = nl;
            var doc = sampleData.languageVersion(language,version);
            console.log(doc);
            display_document(doc);
            set_language_name();
            set_version_name();
        }
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

    function init(){
        register_keys();
        area = new ScoochArea( this.getElementById('data-show') );

        var data = load_data();
        console.log(data);
        doc = data.languageVersion(language,version);
        display_document(doc);
        set_language_name();
        setTimeout(set_version_name,200);
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


