/**
* ToggleData class carry all text lines translations(languages, versions, translated text lines, chunks)
* Object data carry the translations information. data is key value object conains one item: languages
* languages is an array; the index is the language number, the value is a key/value item contains two elements: language name, versions array
* versions is an array; the index is the version number, the value is a key/value item contains two elements: version name, lines array
* lines is an array; the index is the Text line number, the value is key/value item contains two elements: value, chunks
* value is the translation of the Text line(Twext), chunks is a string contains n:N pairs separated by space.
*/
Twext.ToggleData = Class.$extend({
  /**
  * Initialize class variables
  */
  __init__: function() {
    this.data = { // object contains data info
      //title: "",
      languages: [] // languages array; index=language number, value= versions array
    };
    //this.source_language = null;  // text source language
    this.source_text = null;  // source text
    this.currentLang = false; // current language
    this.currentVersion = false;  // current version

    if(!this.data.languages) {
      throw "Invalid Document";
    }
  },

  /**
  * Get/Set the current language.
  * @param 'ident' the language number; if undefined return current language
  * @return language object with ident, false if language not found
  */
  language: function(ident) {
    // Get current language
    if(ident==undefined) return this.currentLang; // return current language

    // Set current language
    if(!isNaN(ident)) { // ident must be a number
      if(this.data.languages[ident]) {  // ident is a valid language number(language with identity is found)
        this.currentLang = ident; // set the current language
        return this.data.languages[ident];  // return current language object
      }
      return false; // ident is not a valid language number(language with this identity not found), return false
    }
  },

  /**
  * Find langauge by language name
  * @param 'name_string' language name
  * @return language number with specified language name, -1 if language not found
  */
  find_by_language_name: function(name_string) {
    var i = 0;  // language counter
    for(; i < this.data.languages.length; i++) {  // loop over languages
      if(this.data.languages[i].language == name_string)  // language with specified name is found
        return i; // return language number
    }
    return -1;  // language not found, return -1
  },

  /**
  * Get language name with specified language number
  * @param 'ident' language number
  * @return language name, false if language not found
  */
  languageName: function(ident) {
    if(this.language(ident)) {  // language found
      return this.data.languages[ident].language; // return language name
    }
    return false; // language not found, return false
  },

  /**
  * Get/Set the current version.
  * @param 'ident' version number
  * @return version object with ident
  */
  version: function(ident) {
    if(this.currentLang === false) {  // if language not found, can't get version with null language
      throw "Language not selected";
    }

    // Get current version
    if(ident==undefined) return this.currentVersion;  // ident is not specified, return current version

    // Set current version
    if(!isNaN(ident)) { // ident must be a number
      if(this.data.languages[this.currentLang].versions[ident]) { // ident is a valid version number(version with identity is found)
        this.currentVersion = ident;  // set current version
        return this.data.languages[this.currentLang].versions[ident]; // return current version object
      } else {  // ident is not a valid version number(version with this identity not found), return false
        return false;
      }
    }
  },

  /**
  * Get the translated lines of the specified language and version.
  * @param 'lang' language number
           'ver' version number
  * @return lines array contains translated text lines and chunks
  */
  getLines: function(lang, ver) {
    if(lang == undefined) lang = this.currentLang;  // if lang is not specified, use current language
    if(ver == undefined)  ver = this.currentVersion;  // if ver is not specified, use current version

    if(this.data.languages[lang].versions[ver]) { // ver is a valid version number(version with ver is found) 
      return this.data.languages[lang].versions[ver].lines; // return lines array
    } else {  // ver is not a valid version number(version with this ver not found), return false
      return false;
    }
  },

  /**
  * Get version name with specified version number
  * @param 'ident' version number
           'language' language number, use current language if not specified
  * @return language name, false if language not found
  */
  versionName: function(ident,language) {
    if(language == undefined) language = this.currentLang;  // if lang is not specified, use current language
    if(this.data.languages[language] && this.data.languages[language].versions[ident]) {  // version found
      return this.data.languages[language].versions[ident].version; // return version name
    }
    return false; // version not found, return false
  },

  /**
  * Get the number of all languages.
  * @return number of all langauges
  */
  languageCount: function() {
    return this.data.languages.length;  // return languages count
  },

  /**
  * Get the number of all versions of the current language.
  * @return number of versions of the current language
  */
  versionCount: function(){
    if(this.currentLang === false) {  // if current language is not set
      throw "Language not selected";
    }

    if(!this.data.languages[this.currentLang].versions) { // if current language versions don't exist
      throw "Language has no versions"
    }

    return this.data.languages[this.currentLang].versions.length; // return versions count
  },

  /**
  * Get the version of the specified language.
  * @param 'lang' language number
           'version' version number
  * @return version with the specified version number
  */
  languageVersion: function(lang,version){
    var lang = this.language(lang); // get the language with specified language number
    if(!lang) return false; // return false if language not found
    var ver = this.version(version);  // get the version with specified version number
    if(!ver) return false;  // return false if version not fouund
    return ver; // return version
  },

  /**
  * Get the first version of the specified language.
  * @param 'lang' language number
  * @return first version object of the specified language
  */
  first_version: function(lang) {
    var versions = this.data.languages[lang].versions;  // get versions of the specified language
    return versions[0]; // return first version
  },

  /**
  * Add new language to the data langauges array.
  * @param 'language' language name
  * @return added language number
  */
  addLanguage: function(language){
    this.data.languages.push({language:language,versions:[]});  // add language with specified language name and empty versions
    this.currentLang = this.data.languages.length-1;  // set the current language to the added one
    return this.currentLang;  // return added langauge number
  },

  /**
  * Add new line data (translation, chunks) to lines array
  * @param 'language' language number, use current language if not specified
           'version' version name
           'lineNum' the Text line number
           'data' line data to be added
  */
  addLine: function(language, version_id, lineNum, data){
    /*if(language == undefined && this.currentLang === false) { // no language to use
      throw "No Language Set";
    } else {
      var lang = (language==undefined && typeof language != "object") ? this.currentLang : language;  // use current language if not specified
    }*/

    //var isLang = this.language(lang); // get language object with specified language number
    //if(!isLang) throw "Language does not exist: "+lang; // language not found

    var lineData = {value: data.value, chunks: data.nN};  // line data
    var version = this.get_version_by_id(version_id); // Get version with specified version name
    if(version == null) { // version not found
      var lines = []; // create empty lines array
      lines[lineNum] = lineData;  // add line data to lines array
      this.addVersion(version_id, lines, language);  // add the new version with the specified version name and lines data
      //version = {version:version_id, data:{lines:lines}};//console.log("addline null 4");
      //this.data.languages[this.currentLang].versions.push(version);//console.log("addline null 5");
    } else {  // version found, add line
      version.lines[lineNum] = lineData;  // add line data
    }
  },

  /**
  * Add new version to language versions array
  * @param 'version' version name
           'lines' lines data to be added to the created version
           'language' language number
  */
  addVersion: function(version,lines,language) {
    if(language == undefined && this.currentLang === false) { // no language to use
      throw "No Language Set";
    } else {
      var lang = (language==undefined && typeof language != "object") ? this.currentLang : language;  // use current language if not specified
    }

    var isLang = this.language(lang); // get language object with specified language number
    if(!isLang) throw "Language does not exist: "+lang; // language not found

    this.data.languages[this.currentLang].versions.push({version:version, lines:lines});  // add version data
  },

  /**
  * Update version data.
  * @param 'lines' new version lines
           'version' version number
           'language' language number
  */
  updateVersion: function(lines, version, language){
    if(language == undefined && this.currentLang===false) { // no language to use
      throw "No Language Set";
    } else {
      var lang = (language!=undefined && typeof language != "object") ? language : this.currentLang;  // use current language if not specified
    }

    if(version == undefined && this.currentVersion===false) { // no version to use
      throw "No Version Set";
    } else {
      var ver = (version!=undefined && typeof version != "object") ? version : this.currentVersion; // / use current version if not specified
    }

    var isLang = this.language(lang); // get language object with specified language number
    if(!isLang) throw "Language Not Set"; // language not found

    var isVer = this.version(ver);  // get version object with specified version number
    if(!isVer) throw "version not set"; // version not found

    this.data.languages[this.currentLang].versions[this.currentVersion].lines = lines;  // update version lines to the new lines
  },

  /**
  * Get version object with the specified id(version name)
  * @param 'id' version name
  * @return version object with the specified id
  */
  get_version_by_id: function(id) {
    var i = 0;  // versions counter
    var versions = this.data.languages[this.currentLang].versions;  // get current language versions
    for(; i<versions.length; i++) { // loop over versions
      if(versions[i].version == id) { // version found
        return versions[i]; // return version object
      }
    }
    return null;  // return null if version not found
  }
});
/*set_version: function(version_id,data,language){
    var lang = (language==undefined) ? this.currentLang : language;
    var isLang = this.language(lang);
    if(!isLang) throw "Language does not exist: "+lang;
    var version = this.get_version_by_id(version_id);
    if(version == null){
      version = {version:version_id, data:data[0]};
      this.data.languages[this.currentLang].versions.push(version);
    }
    else{
      version.data = data[0];
    }
    //if(data.length > 0)
      //version.chunks = data[1];
  },*/
/*latest_version: function(lang){
      var versions = this.data.languages[lang].versions;
      return versions[versions.length - 1];
    },*/
/*info: function(name){
        return this.data[name] || false;
    },*/
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