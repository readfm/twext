/*

TwextToggle Data Format

{
    title:'The Lost FLower'  //Required
    description: 'A Somthing About a Lost Flower' //Optional
    data_source: '' // *optional* If the source line is frozen maybe useful. Not being used in demo.
    youtube: '' // *optional* Could have a youtube link.
    languages: [
        {
            language:'' //Name of Language is *Optional*
            versions: [
                {
                    version: '' //Could be anyting. Preferably a number.
                    data: '' //Here is where the version is stored.
                }
            ]
        },
        {
            language:''
             versions: [
                 {
                     version: '' //Version 1
                     data: ''
                 },
                 {
                    version: '' //Version 2
                    data: ''
                 }
             ]
        }
    ]
}

 */
//if(!Twext || typeof Twext != "object") Twext = {};

Twext.ToggleData = Class.$extend({

    __init__: function(data){
        this.data = data;
        this.currentLang = false;
        this.currentVersion = false;

        if(!this.data.languages){
            throw "Invalid Document";
        }
    },

    info: function(name){
        return this.data[name] || false;
    },

    language: function(ident){

        if(ident==undefined) return this.currentLang;

        if(!isNaN(ident)){
            if(this.data.languages[ident]){
                this.currentLang = ident;
                return this.data.languages[ident];
            }
            return false;
        }
    },

    languageName: function(ident){
      if(this.language(ident)){
          return this.data.languages[ident].language;
      }
      return false;
    },

    version: function(ident,search_version){

        if(this.currentLang===false){
            throw "Language not selected";
        }

        if(ident==undefined) return this.currentVersion;
        if(search_version == undefined) search_version = false;

        if(!isNaN(ident) && !search_version){
            if(this.data.languages[this.currentLang].versions[ident]){
                this.currentVersion = ident;
                return this.data.languages[this.currentLang].versions[ident];
            }else{
                return false;
            }
        }
    },

    versionName: function(ident,language){
        if(this.data.languages[language] && this.data.languages[language].versions[ident]){
            return this.data.languages[language].versions[ident].version;
        }
        return false;
    },

    languageCount: function(){
        return this.data.languages.length;
    },

    versionCount: function(){
        if(this.currentLang===false){
            throw "Language not selected";
        }

        if(!this.data.languages[this.currentLang].versions){
            throw "Language has no versions"
        }

        return this.data.languages[this.currentLang].versions.length;
    },

    languageVersion: function(lang,version){
        var lang = this.language(lang);
        if(!lang) return false;
        var ver = this.version(version);
        if(!ver) return false;
        return ver;
    },

    addLanguage: function(language){
      this.data.languages.push({language:language,versions:[]});
      this.currentLang = this.data.languages.length-1;
      return this.currentLang;
    },

    addVersion: function(version,data,language){
        if(language == undefined && this.currentLang===false){
            throw "No Language Set";
        }else{
            var lang = (language==undefined && typeof language != "object") ? this.currentLang : language;
        }
        var isLang = this.language(lang);
        if(!isLang) throw "Language does not exist: "+lang;

        this.data.languages[this.currentLang].versions.push({version:version,data:data});
    },

    updateVersion: function(data,version,language){
        if(language == undefined && this.currentLang===false){
            throw "No Language Set";
        }else{
            var lang = (language==undefined && typeof language != "object") ? language : this.currentLang;
        }

        if(version == undefined && this.currentVersion===false){
            throw "No Version Set";
        }else{
            var ver = (version==undefined && typeof version != "object") ? version : this.currentVersion;
        }

        var isLang = this.language(lang);
        if(!isLang) throw "Language Not Set";

        var isVer = this.version(ver);
        if(!isVer) throw "version not set";

        this.data.languages[this.currentLang].versions[this.currentVersion].data = data;
    }


});
