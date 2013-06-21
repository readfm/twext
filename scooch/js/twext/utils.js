/**
* Sort key/value object elements by keys.
* @return the sorted object
*/
Object.sortAssoc = function(obj) {
  var i, keys = new Array(), sortedObj = {};
  // separate the keys into an array
  for(i in obj) {
    keys.push(i);
  }
  // sort the keys
  keys.sort();

  //build the sorted object
  for(i=0; i < keys.length; i++) {
    sortedObj[keys[i]] = obj[keys[i]];
  }
  return sortedObj;
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
* Get the size of an object
* @param 'obj' the object
* @return object size
*/
Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {  // loop over object elements
    if (obj.hasOwnProperty(key)) size++;  // count object elements
  }
  return size;  // return object size
};

/**
* Get array of values from a key/value object.
* @param 'obj' the object
* @return array of object values
*/
Object.toArray = function(obj) {
  var arr = $.map(obj, function(k, v) {
    return [k];
  });
  return arr;
}

/**
* Convert string to array; split array with the specified separator
* @param 'sep' string separator
* @return array of substrings that were separated by sep in the string
*/
String.prototype.toArray = function(sep) {
  if(this == "") return new Array();  // return empty array if the string is empty
  return this.split(sep); // return array of substrings that were separated by sep in the string
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

/**
* Extract words from string.
* @param 'str' the string
* @return array of words of the string
*/
function getStrWords(str) {
  str = cleanText(str);
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words(including non english characters)
  return str.match(re);  // return array of all words of the text
}

/**
* Get indices of words in text.
* @param 'str' the string
* @return array of words' start indices of the string
*/
function strWordsIndices(str) {
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words(including non english characters)
  return matchIndices(str, re); // return words indices
}

/**
* Get indices of regular expression matches in the string.
* @param 'str' the string
* @return array of words' start indices of the string
*/
function matchIndices(str, re) {
  str = cleanText(str);
  var result, indices = [];
  while(result = re.exec(str)) {
    indices.push(result.index); // Match found, push its index in the array
  }
  return indices; // return matches indices
}

/**
* Count the number of spaces between the specified position and the nonspace previous caharacter.
* @param 'str' the str
         'pos' position where previous spaces counted
* @return number of spaces before the pos until reach to non space character
*/
function countPreviousSpaces(str, pos) {
  var spaces = 0;
  // check the characters before the pos one at a time, break when a nonspace char is found
  while(pos > spaces && /\s/.test(str.charAt(pos-1-spaces) ) ){
    spaces++; // if space, increment spaces count
  }
  return spaces;  // return spaces
}

/**
* Retrieve cookie from the browser.
* @param 'c_name' the cookie name to be retrieved
* @return the cookie value
*/
function getCookie(c_name) {
  var c_value = document.cookie;  // get the document cookie
  var c_start = c_value.indexOf(" " + c_name + "=");  //find cookie with sepcified name "with a space before,if there are other cookies before it"
  if (c_start == -1) {  // cookie not found
    c_start = c_value.indexOf(c_name + "=");  // find cookie with sepcified name "without a space before,if it's the first cookie"
  }
  if (c_start == -1) {  // cookie not found
    c_value = null; // value is null
  } else {  // cookie found
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1) {
      c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}

/**
* Set/Add cookie value in the browser.
* @param 'c_name' the cookie name to be set
         'value' cookie value needed to set
         'exdays' number of days before cookie expire
*/
function setCookie(c_name, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
  document.cookie = c_name + "=" + c_value;
}

/**
* Create random identifier.
*/
function randomId() {
  return (((1+Math.random())*0x100000)|0).toString(36);
}

/**
* Check if the given character code represents a typing character key.
* @param 'code' keyboard key code
*/
function isTypingChar(code) {
  if(code == 13 ||                    // enter
     (code >= 48 && code <= 57) ||    // 0 -> 9
     code == 59 ||                    // ;:
     code == 61 ||                    // =+
     (code >= 65 && code <=90) ||     // a -> z
     (code >= 96 && code <= 107) ||   // (Num Lock) keys
     (code >= 109 && code <= 111) ||  // (Num Lock) keys
     code == 188 ||                   // ,<
     (code >= 190 && code <= 192) ||  // .> /? `~
     (code >= 219 && code <= 222))    // [{ \| ]} '"
     return true; // is a typing character
  return false; // not a typing character
}

/**
* Remove spaces from begining and end of each line in a string.
* Remove extra spaces between words.
* @param 'str' string to be cleaned
*/
function trimStringLines(str) {
  var lines = str.split('\n');  // string lines
  var trimmedLines = [];
  $.each(lines, function() {  // loop over lines
    if(this != "") trimmedLines.push($.trim(this.replace(/\s+/g, ' '))); // trim line and remove extra spaces
  });
  return trimmedLines.join('\n'); // return trimmed string
}

/**
* Get the word where the cursor points
* @param 'str' the input string
         'pos' cursor position
* @return array contains word where the cursor points and the cursor index at the word, null if not found
*/
function wordAtCaret(str, pos) {
  var i;
  str = cleanText(str);
  var words = getStrWords(str);
  var indices = strWordsIndices(str);
  for(i=0; i<indices.length; i++) {
    start = indices[i]; // start position of the word(the first char)
    end = start + words[i].length;  // end position of the word(the char after word)
    if(pos >= start && pos < end) {  // cursor between word characters
      return [words[i], pos-start];
    }
  }
  return null;
}
//Twext.Utils = {};

// This is a quick fix until I rename those functions.
//trim = Twext.String.Trim;
//str_pad = Twext.String.Pad;

/*function empty (v) {
    var key;
    if (v === "" || v === 0 || v === "0" || v === null || v === false || typeof v === 'undefined') {
        return true;
    }
    if (v.length === 0) {
        return true;
    }
    if (typeof v === 'object') {
        for (key in v) {
            return false;
        }
        return true;
    }
    return false;
}*/
/*Twext.Utils.TextToLines = function(t){
    var sp = /\s\s+/i;
    t = trim(t);

    //var text = str_replace(["\r\n", "\n\r", "\r"], "\n", t);
    var text = t.replace(/\r\n/g,"\n");

    var tl = text.split("\n");

    var ml = tl.length;
    var mx = ml-1;

    var struct = [];

    for(var i = 0 ; i < ml ; i=i+2){
        var nxt = i+1;
        //If both lines are empty add a break. 2 breaks = a paragraph.

        ts = (typeof tl[i] == 'string') ? trim(tl[i]) : '';
        if(empty(ts)){
            struct.push(1);
            i--;
            continue;
        }

        var ll = (i < ml && typeof tl[i] == 'string') ? trim(tl[i]) : '';
        var lr = (i+1 < ml && typeof tl[nxt] == 'string') ? trim(tl[nxt]) : '';

        var cla = ll.split(sp);
        var cra = lr.split(sp);
        var cm = Math.max(cla.length, cra.length);

        for(var ii = 0; ii < cm; ii++){
            var cl = (empty(cla[ii]) || cla[ii]==undefined) ? '' : cla[ii];
            var cr = (empty(cra[ii]) || cra[ii]==undefined) ? '' : cra[ii];
            struct.push(cl,cr);
        }

        if(i<mx && !empty(tl[nxt+1])){
            struct.push(0);
        }

    }

    //console.log(struct);
    return struct;
}

Twext.Utils.ArrayToSpaceChunk = function(s){
    if(!(s instanceof Array)) {
        throw "Struct not an array";
    }
    var l = s.length;
    var x=l-1;
    var nt = [],nl=[],nr=[];
    var cl,cr,m,clc,crc;


    for(var i=0; i<l; i++){
        if(!(s[i] instanceof Array)){
            nt.push(trim(nl.join('')), "\n", trim(nr.join('')));
            nl = [];
            nr = [];

            if(s[i]==0){
                nt.push("\n");
            }else{
                nt.push("\n\n");
            }
        }else{
            cl = (!empty(s[i][0]) && typeof s[i][0] != 'undefined') ? trim(s[i][0]) : '--';
            cr = (!empty(s[i][1]) && typeof s[i][1] != 'undefined') ? trim(s[i][1]) : '--';
            m = Math.max(cl.length, cr.length);
            m=m+2;
            cl = str_pad(cl, m, " ", 'R');
            cr = str_pad(cr, m, " ", 'R');
            nl.push(cl);
            nr.push(cr);
        }
    }

    if(nl.length > 0 || nr.length > 0){
        nt.push(trim(nl.join('')), "\n", trim(nr.join('')));
    }

    return nt.join('');
}

Twext.Utils.ArrayToText = function(s, text){

    text = (text===false) ?  false : true;
    idx = text ? 0 : 1;

    if(!(s instanceof Array)){
        throw "Arg1 in not an array";
    }

    var l = s.length;
    var x = l-1;
    var nt = [];

    for(var i = 0; i<l ; i++){
        if(typeof s[i] != 'object'){
            if(s[i]==0){
                nt.push("\n");
            }else{
                nt.push("\n\n");
            }
        }else{
            nt.push(s[i][idx]);

            if(i != x){
                nt.push(" ");
            }
        }
    }

    return nt.join('');
};*/

/**
 * Taking from http://www.strictly-software.com/htmlencode and used with google translation
 */
/*Twext.Utils.Encoder = {

    // When encoding do we convert characters into html or numerical entities
    EncodeType : "entity",  // entity OR numerical

    isEmpty : function(val){
        if(val){
            return ((val===null) || val.length==0 || /^\s+$/.test(val));
        }else{
            return true;
        }
    },
    // Convert HTML entities into numerical entities
    HTML2Numerical : function(s){
        var arr1 = new Array('&nbsp;','&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&shy;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&agrave;','&aacute;','&acirc;','&atilde;','&Auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&Ouml;','&times;','&oslash;','&ugrave;','&uacute;','&ucirc;','&Uuml;','&yacute;','&thorn;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&Oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&quot;','&amp;','&lt;','&gt;','&oelig;','&oelig;','&scaron;','&scaron;','&yuml;','&circ;','&tilde;','&ensp;','&emsp;','&thinsp;','&zwnj;','&zwj;','&lrm;','&rlm;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&fnof;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&thetasym;','&upsih;','&piv;','&bull;','&hellip;','&prime;','&prime;','&oline;','&frasl;','&weierp;','&image;','&real;','&trade;','&alefsym;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&crarr;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&forall;','&part;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&sum;','&minus;','&lowast;','&radic;','&prop;','&infin;','&ang;','&and;','&or;','&cap;','&cup;','&int;','&there4;','&sim;','&cong;','&asymp;','&ne;','&equiv;','&le;','&ge;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&loz;','&spades;','&clubs;','&hearts;','&diams;');
        var arr2 = new Array('&#160;','&#161;','&#162;','&#163;','&#164;','&#165;','&#166;','&#167;','&#168;','&#169;','&#170;','&#171;','&#172;','&#173;','&#174;','&#175;','&#176;','&#177;','&#178;','&#179;','&#180;','&#181;','&#182;','&#183;','&#184;','&#185;','&#186;','&#187;','&#188;','&#189;','&#190;','&#191;','&#192;','&#193;','&#194;','&#195;','&#196;','&#197;','&#198;','&#199;','&#200;','&#201;','&#202;','&#203;','&#204;','&#205;','&#206;','&#207;','&#208;','&#209;','&#210;','&#211;','&#212;','&#213;','&#214;','&#215;','&#216;','&#217;','&#218;','&#219;','&#220;','&#221;','&#222;','&#223;','&#224;','&#225;','&#226;','&#227;','&#228;','&#229;','&#230;','&#231;','&#232;','&#233;','&#234;','&#235;','&#236;','&#237;','&#238;','&#239;','&#240;','&#241;','&#242;','&#243;','&#244;','&#245;','&#246;','&#247;','&#248;','&#249;','&#250;','&#251;','&#252;','&#253;','&#254;','&#255;','&#34;','&#38;','&#60;','&#62;','&#338;','&#339;','&#352;','&#353;','&#376;','&#710;','&#732;','&#8194;','&#8195;','&#8201;','&#8204;','&#8205;','&#8206;','&#8207;','&#8211;','&#8212;','&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;','&#8224;','&#8225;','&#8240;','&#8249;','&#8250;','&#8364;','&#402;','&#913;','&#914;','&#915;','&#916;','&#917;','&#918;','&#919;','&#920;','&#921;','&#922;','&#923;','&#924;','&#925;','&#926;','&#927;','&#928;','&#929;','&#931;','&#932;','&#933;','&#934;','&#935;','&#936;','&#937;','&#945;','&#946;','&#947;','&#948;','&#949;','&#950;','&#951;','&#952;','&#953;','&#954;','&#955;','&#956;','&#957;','&#958;','&#959;','&#960;','&#961;','&#962;','&#963;','&#964;','&#965;','&#966;','&#967;','&#968;','&#969;','&#977;','&#978;','&#982;','&#8226;','&#8230;','&#8242;','&#8243;','&#8254;','&#8260;','&#8472;','&#8465;','&#8476;','&#8482;','&#8501;','&#8592;','&#8593;','&#8594;','&#8595;','&#8596;','&#8629;','&#8656;','&#8657;','&#8658;','&#8659;','&#8660;','&#8704;','&#8706;','&#8707;','&#8709;','&#8711;','&#8712;','&#8713;','&#8715;','&#8719;','&#8721;','&#8722;','&#8727;','&#8730;','&#8733;','&#8734;','&#8736;','&#8743;','&#8744;','&#8745;','&#8746;','&#8747;','&#8756;','&#8764;','&#8773;','&#8776;','&#8800;','&#8801;','&#8804;','&#8805;','&#8834;','&#8835;','&#8836;','&#8838;','&#8839;','&#8853;','&#8855;','&#8869;','&#8901;','&#8968;','&#8969;','&#8970;','&#8971;','&#9001;','&#9002;','&#9674;','&#9824;','&#9827;','&#9829;','&#9830;');
        return this.swapArrayVals(s,arr1,arr2);
    },

    // Convert Numerical entities into HTML entities
    NumericalToHTML : function(s){
        var arr1 = new Array('&#160;','&#161;','&#162;','&#163;','&#164;','&#165;','&#166;','&#167;','&#168;','&#169;','&#170;','&#171;','&#172;','&#173;','&#174;','&#175;','&#176;','&#177;','&#178;','&#179;','&#180;','&#181;','&#182;','&#183;','&#184;','&#185;','&#186;','&#187;','&#188;','&#189;','&#190;','&#191;','&#192;','&#193;','&#194;','&#195;','&#196;','&#197;','&#198;','&#199;','&#200;','&#201;','&#202;','&#203;','&#204;','&#205;','&#206;','&#207;','&#208;','&#209;','&#210;','&#211;','&#212;','&#213;','&#214;','&#215;','&#216;','&#217;','&#218;','&#219;','&#220;','&#221;','&#222;','&#223;','&#224;','&#225;','&#226;','&#227;','&#228;','&#229;','&#230;','&#231;','&#232;','&#233;','&#234;','&#235;','&#236;','&#237;','&#238;','&#239;','&#240;','&#241;','&#242;','&#243;','&#244;','&#245;','&#246;','&#247;','&#248;','&#249;','&#250;','&#251;','&#252;','&#253;','&#254;','&#255;','&#34;','&#38;','&#60;','&#62;','&#338;','&#339;','&#352;','&#353;','&#376;','&#710;','&#732;','&#8194;','&#8195;','&#8201;','&#8204;','&#8205;','&#8206;','&#8207;','&#8211;','&#8212;','&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;','&#8224;','&#8225;','&#8240;','&#8249;','&#8250;','&#8364;','&#402;','&#913;','&#914;','&#915;','&#916;','&#917;','&#918;','&#919;','&#920;','&#921;','&#922;','&#923;','&#924;','&#925;','&#926;','&#927;','&#928;','&#929;','&#931;','&#932;','&#933;','&#934;','&#935;','&#936;','&#937;','&#945;','&#946;','&#947;','&#948;','&#949;','&#950;','&#951;','&#952;','&#953;','&#954;','&#955;','&#956;','&#957;','&#958;','&#959;','&#960;','&#961;','&#962;','&#963;','&#964;','&#965;','&#966;','&#967;','&#968;','&#969;','&#977;','&#978;','&#982;','&#8226;','&#8230;','&#8242;','&#8243;','&#8254;','&#8260;','&#8472;','&#8465;','&#8476;','&#8482;','&#8501;','&#8592;','&#8593;','&#8594;','&#8595;','&#8596;','&#8629;','&#8656;','&#8657;','&#8658;','&#8659;','&#8660;','&#8704;','&#8706;','&#8707;','&#8709;','&#8711;','&#8712;','&#8713;','&#8715;','&#8719;','&#8721;','&#8722;','&#8727;','&#8730;','&#8733;','&#8734;','&#8736;','&#8743;','&#8744;','&#8745;','&#8746;','&#8747;','&#8756;','&#8764;','&#8773;','&#8776;','&#8800;','&#8801;','&#8804;','&#8805;','&#8834;','&#8835;','&#8836;','&#8838;','&#8839;','&#8853;','&#8855;','&#8869;','&#8901;','&#8968;','&#8969;','&#8970;','&#8971;','&#9001;','&#9002;','&#9674;','&#9824;','&#9827;','&#9829;','&#9830;');
        var arr2 = new Array('&nbsp;','&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&shy;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&agrave;','&aacute;','&acirc;','&atilde;','&Auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&Ouml;','&times;','&oslash;','&ugrave;','&uacute;','&ucirc;','&Uuml;','&yacute;','&thorn;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&Oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&quot;','&amp;','&lt;','&gt;','&oelig;','&oelig;','&scaron;','&scaron;','&yuml;','&circ;','&tilde;','&ensp;','&emsp;','&thinsp;','&zwnj;','&zwj;','&lrm;','&rlm;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&fnof;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&thetasym;','&upsih;','&piv;','&bull;','&hellip;','&prime;','&prime;','&oline;','&frasl;','&weierp;','&image;','&real;','&trade;','&alefsym;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&crarr;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&forall;','&part;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&sum;','&minus;','&lowast;','&radic;','&prop;','&infin;','&ang;','&and;','&or;','&cap;','&cup;','&int;','&there4;','&sim;','&cong;','&asymp;','&ne;','&equiv;','&le;','&ge;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&loz;','&spades;','&clubs;','&hearts;','&diams;');
        return this.swapArrayVals(s,arr1,arr2);
    },


    // Numerically encodes all unicode characters
    numEncode : function(s){

        if(this.isEmpty(s)) return "";

        var e = "";
        for (var i = 0; i < s.length; i++)
        {
            var c = s.charAt(i);
            if (c < " " || c > "~")
            {
                c = "&#" + c.charCodeAt() + ";";
            }
            e += c;
        }
        return e;
    },

    // HTML Decode numerical and HTML entities back to original values
    htmlDecode : function(s){

        var c,m,d = s;

        if(this.isEmpty(d)) return "";

        // convert HTML entites back to numerical entites first
        d = this.HTML2Numerical(d);

        // look for numerical entities &#34;
        arr=d.match(/&#[0-9]{1,5};/g);

        // if no matches found in string then skip
        if(arr!=null){
            for(var x=0;x<arr.length;x++){
                m = arr[x];
                c = m.substring(2,m.length-1); //get numeric part which is refernce to unicode character
                // if its a valid number we can decode
                if(c >= -32768 && c <= 65535){
                    // decode every single match within string
                    d = d.replace(m, String.fromCharCode(c));
                }else{
                    d = d.replace(m, ""); //invalid so replace with nada
                }
            }
        }

        return d;
    },

    // encode an input string into either numerical or HTML entities
    htmlEncode : function(s,dbl){

        if(this.isEmpty(s)) return "";

        // do we allow double encoding? E.g will &amp; be turned into &amp;amp;
        dbl = dbl || false; //default to prevent double encoding

        // if allowing double encoding we do ampersands first
        if(dbl){
            if(this.EncodeType=="numerical"){
                s = s.replace(/&/g, "&#38;");
            }else{
                s = s.replace(/&/g, "&amp;");
            }
        }

        // convert the xss chars to numerical entities ' " < >
        s = this.XSSEncode(s,false);

        if(this.EncodeType=="numerical" || !dbl){
            // Now call function that will convert any HTML entities to numerical codes
            s = this.HTML2Numerical(s);
        }

        // Now encode all chars above 127 e.g unicode
        s = this.numEncode(s);

        // now we know anything that needs to be encoded has been converted to numerical entities we
        // can encode any ampersands & that are not part of encoded entities
        // to handle the fact that I need to do a negative check and handle multiple ampersands &&&
        // I am going to use a placeholder

        // if we don't want double encoded entities we ignore the & in existing entities
        if(!dbl){
            s = s.replace(/&#/g,"##AMPHASH##");

            if(this.EncodeType=="numerical"){
                s = s.replace(/&/g, "&#38;");
            }else{
                s = s.replace(/&/g, "&amp;");
            }

            s = s.replace(/##AMPHASH##/g,"&#");
        }

        // replace any malformed entities
        s = s.replace(/&#\d*([^\d;]|$)/g, "$1");

        if(!dbl){
            // safety check to correct any double encoded &amp;
            s = this.correctEncoding(s);
        }

        // now do we need to convert our numerical encoded string into entities
        if(this.EncodeType=="entity"){
            s = this.NumericalToHTML(s);
        }

        return s;
    },

    // Encodes the basic 4 characters used to malform HTML in XSS hacks
    XSSEncode : function(s,en){
        if(!this.isEmpty(s)){
            en = en || true;
            // do we convert to numerical or html entity?
            if(en){
                s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
                s = s.replace(/\"/g,"&quot;");
                s = s.replace(/</g,"&lt;");
                s = s.replace(/>/g,"&gt;");
            }else{
                s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
                s = s.replace(/\"/g,"&#34;");
                s = s.replace(/</g,"&#60;");
                s = s.replace(/>/g,"&#62;");
            }
            return s;
        }else{
            return "";
        }
    },

    // returns true if a string contains html or numerical encoded entities
    hasEncoded : function(s){
        if(/&#[0-9]{1,5};/g.test(s)){
            return true;
        }else if(/&[A-Z]{2,6};/gi.test(s)){
            return true;
        }else{
            return false;
        }
    },

    // will remove any unicode characters
    stripUnicode : function(s){
        return s.replace(/[^\x20-\x7E]/g,"");

    },

    // corrects any double encoded &amp; entities e.g &amp;amp;
    correctEncoding : function(s){
        return s.replace(/(&amp;)(amp;)+/,"$1");
    },


    // Function to loop through an array swaping each item with the value from another array e.g swap HTML entities with Numericals
    swapArrayVals : function(s,arr1,arr2){
        if(this.isEmpty(s)) return "";
        var re;
        if(arr1 && arr2){
            //ShowDebug("in swapArrayVals arr1.length = " + arr1.length + " arr2.length = " + arr2.length)
            // array lengths must match
            if(arr1.length == arr2.length){
                for(var x=0,i=arr1.length;x<i;x++){
                    re = new RegExp(arr1[x], 'g');
                    s = s.replace(re,arr2[x]); //swap arr1 item with matching item from arr2
                }
            }
        }
        return s;
    },

    inArray : function( item, arr ) {
        for ( var i = 0, x = arr.length; i < x; i++ ){
            if ( arr[i] === item ){
                return i;
            }
        }
        return -1;
    }

}*/

