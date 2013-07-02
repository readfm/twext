// Unicode escape characters used
// "http://en.wikipedia.org/wiki/List_of_Unicode_characters"
// "http://www.mobilefish.com/services/unicode_escape_sequence_converter/unicode_escape_sequence_converter.php"
/**
* Key/Value bbject contains languages info(names and codes).
* To add a new language, you have to add its code and its name to the object ("english":"en")
* To delete a langauge, you have to delete its code and its name from the object ("english":"en")
*/
var languages = {
  "fran\u00E7ais": "fr",  // FRENCH
  "italiano": "it", // ITALIAN
  "espa\u0148ol": "es", // SPANISH
  "english": "en",  // ENGLISH
  "portugu\u00eas": "pt", // PORTUGUESE
  "\u010de\u0161tina": "cs", // CZECH
  "latvie\u0161u valoda": "lv", // LATVIAN
  "lietuvi\u0173 kalba": "lt",  // LITHUANIAN
  "dansk": "da",  // DANISH
  "nederlands": "nl", // DUTCH
  "polszczyzna": "pl",  // POLISH
  "eesti": "et",  // ESTONIAN
  "suomi": "fi",  // FINNISH
  "limba rom\u00e2n\u0103": "ro", // ROMANIAN
  "sloven\u010dina": "sk",  // SLOVAK
  "sloven\u0161\u010Dina": "sl",  // SLOVINIAN
  "magyar": "hu", // HUNGARIAN
  "svenska": "sv",  // SWEDISH
  "deutsch": "de",  // GERMAN
  "catal\u00E0": "ca",  // CATALAN
  "t\u00FCrk\u00E7e": "tr", // TURKISH
  "\u0411\u044a\u043b\u0491apc\u043a\u0438 e\u0437\u0438\u043a": "bg",  // BULGARIAN
  "\u03b5\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac": "el", // GREEK
  "pycc\u043A\u0438\u0439 \u044F\u0437\u044B\u043A": "ru", // RUSSIAN
  "\u4e2d\u6587": "zh-CN",  // CHINESE
  "\u0e44\u0e17\u0e22": "th"  // THAI
};

var languages_codes = languagesCodes(); // languages codes array
var languages_names = languagesNames(); // languages names array

/**
* Construct array contains languages codes.
* @return languages codes array
*/
function languagesCodes() {
  var obj = [];
  for(var key in languages) {  // loop over languages
    obj.push(languages[key]); // add the language code to the object
  }
  return obj; // return array of languages codes
}

/**
* Construct array contains languages names.
* @return languages names array
*/
function languagesNames() {
  var obj = [];
  for(var key in languages) {  // loop over languages
    obj.push(key); // add the language name to the object
  }
  return obj; // return array of languages names
}