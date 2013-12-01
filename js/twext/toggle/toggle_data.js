/**
* ToggleData class carry all text data and translations(languages, versions, translated text, chunks)
* Object data carry the translations information. data is key/value object conains one item: languages
* languages is an array; index is language number, value is a key/value object contains three elements: language code, versions array
* versions is an array; the index is the version number, value is a key/value item contains two elements: version name, data.
* data contains two elements: text, chunks.
* text is the translation of the Text (Twext), chunks key/value obj contains lines chunks. key is text line num(0,1,2..), value is chunks string
*/
ToggleData = Class.$extend({
  /**
  * Initialize class variables
  */
  __init__: function() {
    this.data = { // object contains data info
      languages: [] // languages array; index=language number, value= versions array
    };

    this.sourceText = null;  // source text
    this.timings = null; // timings of the text
    this.url = null; // the url represents the text
    //this.currentLanguage = false; // current language
    //this.currentVersion = false;  // current version
  },

  /**
  * Add new language to the data langauges array.
  * If language already added, return its index, else return the new added language index.
  * @param 'language' language code
  * @return integer represents language number
  */
  addLanguage: function(lang){
    var langIx = this.findByLanguageCode(lang); // check if language already exist
    if(langIx != -1) {  // language already exist
      //this.currentLanguage = langIx;  // set the current language to the existing one
      return langIx;  // return existing langauge number
    }

    // add the new language
    this.data.languages.push({language:lang, versions:[]});  // add language with specified language code and empty versions
    //this.currentLanguage = this.data.languages.length-1;  // set the current language to the added one
    return this.data.languages.length-1;  // return added langauge number
  },

  /**
  * Find langauge by language code
  * @param 'code' language code
  * @return language number with specified language code, -1 if language not found
  */
  findByLanguageCode: function(code) {
    var i;  // language counter
    for(i=0; i < this.data.languages.length; i++) {  // loop over languages
      if(this.data.languages[i].language == code)  // language with specified name is found
        return i; // return language number
    }
    return -1;  // language not found, return -1
  },

  /**
  * Add new version to language versions array
  * @param 'lang' language number
           'version' version name
           'data' translation data (text, chunks)
  */
  addVersion: function(lang, version, data) {
    //if(!lang) lang = this.currentLanguage;

    var langObj = this.getLanguage(lang); // get language object with specified language number
    if(!langObj) throw "Language does not exist: "+lang; // language not found

    this.data.languages[lang].versions.push({version:version, data:{value: data.value, chunks: data.nNs}});  // add version data
    return this.data.languages[lang].versions.length-1;  // return added version number
  },

  /**
  * Update version data.
  * @param 'lang' language number
           'version' version name
           'data' translation data (text, chunks)
  */
  updateVersion: function(lang, version, data) {
    var ver = this.getLanguageVersion(lang, version); // get language object with specified language number
    if(!ver) return;

    this.data.languages[lang].versions[version].data = {value: data.value, chunks: data.nNs};  // add version data
  },

  /**
  * Get the specified language object.
  * @param 'ident' the language number; if undefined return current language obj
  * @return language object with ident, false if language not found
  */
  getLanguage: function(ident) {
    // Get language
    if(!isNaN(ident)) { // ident must be a number
      if(this.data.languages[ident]) {  // ident is a valid language number(language with identity is found)
        //this.currentLanguage = ident; // set the current language
        return this.data.languages[ident];  // return current language object
      }
      return false; // ident is not a valid language number(language with this identity not found), return false
    }
  },

  /**
  * Get/Set the current version.
  * @param 'ident' version number
  * @return version object with specified number
  */
  getLanguageVersion: function(lang, ver) {
    var language = this.getLanguage(lang); // get the language with specified language number
    if(!language) return false; // return false if language not found

    // Set current version
    if(!isNaN(ver)) { // ver must be a number
      if(this.data.languages[lang].versions[ver]) { // ver is a valid version number(version with given number is found)
        //this.currentVersion = ident;  // set current version
        return this.data.languages[lang].versions[ver]; // return current version object
      } else {  // ver is not a valid version number(version with this identity not found), return false
        return false;
      }
    }
  },

  /**
  * Get language name with specified language number
  * @param 'ident' language number
  * @return language name, false if language not found
  */
  getLanguageName: function(ident) {
    var langObj = this.getLanguage(ident);
    if(langObj) {  // language found
      return languages[langObj.language]; // return language name
    }
    return false; // language not found, return false
  },

  /**
  * Get count of all languages.
  * @return count of all langauges
  */
  languageCount: function() {
    return this.data.languages.length;  // return languages count
  }
});