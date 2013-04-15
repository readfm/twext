/**
* Object contains languages info(codes and names).
* To add a new language, you have to add its code to 'codes' array, and its name to 'names' array in the same order.
* To delete a langauge, you have to delete its code from 'codes' array, and its name from 'names' array.
*/
var languages = {
  codes: ["fr", "it", "es", "en", "pt"],  // languages codes(abbreviations)
  names: ["French", "Italian", "Spanish", "English", "Portugues"]  // languages names
};

/**
* Create a key/value object contains language name/code; key=language name, value=language code(eg: {"French": "fr", "Italian": "it",...})
*/
var lang_names_codes = function() {
  var obj = {}, i;
  var lang_codes = languages.codes; // get languages codes
  var lang_names = languages.names; // get languages names
  for(i=0; i<lang_codes.length; i++) {  // loop over languages
    obj[lang_names[i]] = lang_codes[i]; // add the pair (language name, language code) to the object
  }
  return obj; // return key/value object of languages names/codes
};