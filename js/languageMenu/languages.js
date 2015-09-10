// Unicode escape characters used
// "http://en.wikipedia.org/wiki/List_of_Unicode_characters"
// "http://www.mobilefish.com/services/unicode_escape_sequence_converter/unicode_escape_sequence_converter.php"
/**
* Key/Value bbject contains languages info(names and codes).
* To add a new language, you have to add its code and its name to the object ("english":"en")
* To delete a langauge, you have to delete its code and its name from the object ("english":"en")
*/
var languages = {
  "fr": "fran\u00E7ais",  // FRENCH
  "it": "italiano", // ITALIAN
  "es": "espa\u0148ol", // SPANISH
  "en": "english",  // ENGLISH
  "pt": "portugu\u00eas", // PORTUGUESE
  "ro": "limba rom\u00e2n\u0103", // ROMANIAN
  "ca": "catal\u00E0",  // CATALAN
  "de": "deutsch",  // GERMAN
  "cs": "\u010de\u0161tina", // CZECH
  "lv": "latvie\u0161u valoda", // LATVIAN
  "lt": "lietuvi\u0173 kalba",  // LITHUANIAN
  "da": "dansk",  // DANISH
  "nl": "nederlands", // DUTCH
  "pl": "polszczyzna",  // POLISH
  "et": "eesti",  // ESTONIAN
  "fi": "suomi",  // FINNISH
  "sk": "sloven\u010dina",  // SLOVAK
  "sl": "sloven\u0161\u010Dina",  // SLOVINIAN
  "hu": "magyar", // HUNGARIAN
  "sv": "svenska",  // SWEDISH
  "tr": "t\u00FCrk\u00E7e", // TURKISH
  "bg": "\u0411\u044a\u043b\u0491apc\u043a\u0438 e\u0437\u0438\u043a",  // BULGARIAN
  "el": "\u03b5\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", // GREEK
  "ru": "pycc\u043A\u0438\u0439 \u044F\u0437\u044B\u043A", // RUSSIAN
  "zh-CN": "\u4e2d\u6587",  // CHINESE
  "th": "\u0e44\u0e17\u0e22",  // THAI
  //"img": "Image",  // to add an image resource
  "link": "LINK"  // to add link in twext
};

/**
* Languages that are not supported in Bing
*/
var nonBingLanguages = {
  "myn": "Mayan",
  "ipa": "IPA"
};

var languages_codes = codes(languages); // languages codes array
var languages_names = names(languages); // languages names array

var nonBing_languages_codes = codes(nonBingLanguages);  // non Bing languages codes array
var nonBing_languages_names = names(nonBingLanguages);  // non Bing languages codes array

/**
* Construct array contains languages codes.
* @param 'langs' languages object
* @return languages codes array
*/
function codes(langs) {
  var obj = [];
  for(var key in langs) {  // loop over languages
    obj.push(key); // add the language code to the object
  }
  return obj; // return array of languages codes
}

/**
* Construct array contains languages names.
* @param 'langs' languages object
* @return languages names array
*/
function names(langs) {
  var obj = [];
  for(var key in langs) {  // loop over languages
    obj.push(langs[key]); // add the language name to the object
  }
  return obj; // return array of languages names
}