/**
* Extract words from string.
* @param 'str' the string
* @return array of words of the string
*/
function strWords(str) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words(including non english characters)
  return str.match(re);  // return array of all words of the text
}

/**
* Remove empty elements from the array.
* @return the array after removing empty entries
*/
Array.prototype.clean = function() {
  for (var i = 0; i < this.length; i++) { // loop over array elements
    if (this[i] == undefined || this[i] == "") {  // if empty entry
      this.splice(i, 1);  // remove entry
      i--;
    }
  }
  return this;  // return array after removing empty entries
};

/**
* Remove any html characters form text.
* @param 'text' text to be cleaned
* @return cleaned text
*/
function cleanText(text) {
  var re, str = "", i;
  var spaces = [String.fromCharCode(160), '&nbsp;'];  // html spaces
  // construct regular expression with html spaces
  for (i = 0; i < spaces.length; i++) { // loop over html spaces
    str += spaces[i] + "|";
  }
  re = new RegExp(str.substring(0, str.length-1), 'g'); // Create regular expression html spaces
  text = text.replace(re, ' '); // replace html spaces by text spaces
  return $.trim(text);  // return cleaned text
}
