//Twext.String = {};

/**
 *Trim white spaces from front and back of string
 */
//Twext.String.Trim = function (aString){
  //  if(typeof aString == 'string' && aString.length > 0){
    //    var	str = aString.replace(/^\s\s*/, ''),ws = /\s/,i = str.length;
      //  while (ws.test(str.charAt(--i))){}
      //  return str.slice(0, i + 1);
    //}else{
      //  return aString;
    //}
//};

/**
 * Custom string replace function the works like PHP str_replace.
 * @param {mixed} search
 * @param {mixed} replace
 * @param {string} subject
 * @param {integer} count
 * @return {string}
 */
/*Twext.String.Replace = function (search, replace, subject) {
    var s = subject;
    var f = [].concat(search);
    var r = [].concat(replace);
    var l = f.length;
    var i = 0;

    for (i=0; i<l; ++i)
    {
        s = s.split(f[i]).join((r[i]!=undefined)?r[i]:'');
    }

    return s;
};*/

/**
 * Pads a string
 * @param {string} input
 * @param {integer} pad_length
 * @param {string} pad_string
 * @param {string} pad_type
 * @return {string}
 */
/*Twext.String.Pad = function( input, pad_length, pad_string, pad_type ) {
    var half = '', pad_to_go;
    var str_pad_repeater = function(s, len) {
        var collect = '', i;
        while(collect.length < len){ collect += s; }
        collect = collect.substr(0,len);
        return collect;
    };
    input += '';
    if (pad_type != 'L' && pad_type != 'R' && pad_type != 'B') { pad_type = 'R'; }
    if ((pad_to_go = pad_length - input.length) > 0) {
        if (pad_type == 'L') { input = str_pad_repeater(pad_string, pad_to_go) + input; }
        else if (pad_type == 'R') { input = input + str_pad_repeater(pad_string, pad_to_go); }
        else if (pad_type == 'B') {
            half = str_pad_repeater(pad_string, Math.ceil(pad_to_go/2));
            input = half + input + half;
            input = input.substr(0, pad_length);
        }
    }
    return input;
};*/

/*Twext.String.ConvertUrlsToLinks = function(text){
    if( !text || typeof text != 'string') return text;
    text = result=text.replace(/(http\:\/\/[\w\.\#\-\?\!\&\=]+)/g,'<a href="$1" target="_blank" >$1</a>');
    return text;
};*/

/*Twext.String.NewLines2BR = function(str, is_xhtml) {
    // *     example 1: nl2br('Kevin\nvan\nZonneveld');
    // *     returns 1: 'Kevin<br />\nvan<br />\nZonneveld'
    // *     example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
    // *     returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
    // *     example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
    // *     returns 3: '<br />\nOne<br />\nTwo<br />\n<br />\nThree<br />\n'
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}*/

/*Twext.String.BR2NewLines = function(str) {
    return str.replace(/<br\s*\/?>/mg,"\n");
};*/