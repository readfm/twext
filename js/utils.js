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
* Fill array with given value.
* @return the result array
*/
Array.prototype.fill = function(val) {
  for(var i = 0; i < this.length; i++) { // loop over array elements
    this[i] = val;
  }
  return this;  // return result array
};

// Can't prototype Object, all objects in JavaScript are descended from Object.
/**
* Sort key/value object elements by values.
* @param 'obj' the object
* @return the sorted object
*/
Object.sortAssoc = function(obj) {
  var i, key, values = new Array(), sortedObj = {};
  // separate the keys into an array
  for(i in obj) {
    values.push(obj[i]);
  }
  // sort the keys
  values.sort();

  //build the sorted object
  for(i=0; i < values.length; i++) {
    key = Object.find(obj, values[i]); // find key of the value
    sortedObj[key] = values[i];
  }
  return sortedObj;
}

/**
* Get the size of a key/value object.
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
* Search for a value in the object.
* @param 'obj' the object
         'value' value to be searched
* @return key of the given value, -1 if not found
*/
Object.find = function(obj, value) {
  for(var key in obj) {  // Loop over chunks array
    if(obj[key] == value) return key; // value found, return key
  }
  return -1;  // value not found
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
};

/**
* Check if the given character code represents a typing character key.
* @param 'code' keyboard key code
*/
function isTypingChar(code) {
  if(code == 13 ||                    // enter
    code == 32 ||                    // space
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
* Replace any text spaces by html spaces (nbsp)
* @param 'string' value where replace is performed
* @return string with nbsp instead of text spaces
*/
function spaces_to_nbsp(string) {
  return string.replace(/\s/g, '&nbsp;');
}

/**
* Replace any html spaces(nbsp) by text spaces
* @param 'string' value where replace is performed
* @return string with text spaces instead of nbsp
*/
function nbsp_to_spaces(string) {
  var str = String.fromCharCode(160) + "|&nbsp;"; // html spaces 
  var re = new RegExp(str, 'g'); // Create regular expression html spaces
  return string.replace(re, ' '); // replace html spaces by text spaces
}

/**
* Extract words from string.
* @param 'str' the string
* @return array of words of the string
*/
function strWords(str) {
  str = nbsp_to_spaces(str);  // replace html characters if found by text characters
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words(including non english characters)
  return str.match(re);  // return array of all words of the text
}

/**
* Get indices of words in text.
* @param 'str' the string
* @return array of words' start indices of the string
*/
function strWordsIndices(str) {
  str = nbsp_to_spaces(str);  // replace html characters if found by text characters
  var re = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?|((([^\x00-\x80]+|\w+)+)?(-|')(([^\x00-\x80]+|\w+)+)?)+|([^\x00-\x80]+|\w+)+/gi; // Match url | words(including non english characters)
  return matchIndices(str, re); // return words indices
}

/**
* Get indices of regular expression matches in the string.
* @param 'str' the string
* @return array of words' start indices of the string
*/
function matchIndices(str, re) {
  var result, indices = [];
  while(result = re.exec(str)) {
    indices.push(result.index); // Match found, push its index in the array
  }
  return indices; // return matches indices
}

/**
* Create random string of characters and digits.
* @return random string
*/
function randomStr() {
  return (((1+Math.random())*0x1000000)|0).toString(36);
}

/**
* Round number to nearest float num with two floating digits.
* @param 'num' the float num to be rounded
* @return the nearest float number with two floating digits
*/
function round(num) {
  return Math.round(num*100)/100;
}

/**
* Put the floating number into a string in the form of decimal and 2 digits fraction (e.g: 1.00, 10.02)
* @param 'num' floating number to be converted
* @return string of the number
*/
function floatToStr(num) {
  var decParts = num.toString().split('.');
  var decimal = decParts[0];
  var fraction = decParts[1];
  if(fraction) {  // float number, one or two floating digits
    if(fraction.length == 1) str = num + "0";
    else str = num;
  } else {  // integer "1, 2, 3, ...."
    str = num + ".00";
  }
  return str;
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
* Twext based Utils.
*/
TwextUtils = {
  /**
  * Put text in the form of oneline.
  * Replace newline by two spaces.
  * @param 'text' the text to be onelined
  * @return oneline text
  */
  textToOneline: function(text) {
    return text.replace(/\ +/g, ' ').replace(/\n/g, '  ');  // remove extra spaces from text, replace newline by two spaces
  },

  /**
  * Convert text to fb text key, were new lines are replaced by two spaces and spaces replaced by -
  * @param 'text' the text to be converted to fb key
  * @return oneline text in the form of fb text key
  */
  textToFbKey: function(text) {
    var i, arr = [];
    var lines = text.split("\n").clean(); // get text lines
    for(i=0; i<lines.length; i++) {
      arr.push(strWords(lines[i]).join('-'));
    }
    return arr.join('  ');  // two spaces instead of \n
  },

  /**
  * Get the word number where the cursor points at its start or any character of it.
  * @param 'text' text string
           'cursor_pos' the position of the cursor
  * @return the word index, start index is 0
  */
  wordAtCaret: function(text, cursor_pos) {
    var startPos, endPos, i;
    var words = strWords(text);
    var wordsPos = strWordsIndices(text);
    for(i=0; i<wordsPos.length; i++){  // loop over the words positions
      startPos = wordsPos[i];  // start position of word
      endPos = wordsPos[i] + words[i].length; // end position of word(index of space after word)
      // if the cursor is at the start of the word, or points to any character of it
      if(cursor_pos < endPos && cursor_pos >= startPos) {
        return i; // return word index
      }
    }
    return -1;  // return -1 if no word found
  },

  /**
  * Reformat chunks from the form key/value array to the form of n:N string array; the reformatted array will be sent to spanAligner to align chunks
  * @param 'chunks' the chunks of the current Text/Twext lines pair.
  */
  chunksTonN: function(chunks) {
    var nN = [];
    for(var key in chunks) {  // Loop over chunks key/value array
      nN.push(key+":"+chunks[key]); // Put n,N in the form of n:N string and push it to the array
    }
    return nN;  // return array of n:N strings
  }
};

/**
* All span related operations.
*/
SpanUtils = {
  /**
  * Put word in span tag and append it to the dom.
  * Loop on node childNodes to find the childNode contains the word(this is needed in the case of having another span tags).
  * Create span node of the word, put value before word in Text node and insert before span, put value after word in Text node and insert after span
  * If word already in a span, create empty span with given id and insert it before word. This is a save way to avoid ids conflict.
  * @param: 'node' is the node contains the word.
            'wordIx' is the index of the word.
            'word' the word to be put in span tag
            'id' the id of the span tag
  */
  putWordInSpan: function(node, wordIx, word, id) {
    var i, index = 0, childNode;
    for(i=0; i<node.childNodes.length; i++) {
      childNode = node.childNodes[i];
      len = childNode.textContent.length;
      index += len;  // find the node where seg exists
      // check if word inside this node or cursor(empty word)at the end of the line
      if(wordIx < index || (wordIx == index && i == node.childNodes.length-1 && word.length == 0)) {  // word in this childNode
        wordIx = wordIx - (index - len);  // word index within the childNode not the whole node text
        if(childNode.nodeName == "SPAN") {  // if word already in span, highlighted with different id
          // if word start position is already included in a span (the word or first seg of the word is highlighted), return span id
          if(childNode.textContent == word || wordIx == 0) {
            var spanNode = $('<span id="' + id + '"></span>');  // Create empty span node before current one with the given id
            spanNode.insertBefore(childNode); // insert span before word
            return id;
          }
        }

        //if part of the word only included in the childNode,use this part as the whole word; this occur when there is a highlighted seg of the word
        word = wordIx+word.length > childNode.textContent.length?childNode.textContent.slice(wordIx):word;
        // Get the text string parts before/after the word.
        var valBefore = childNode.textContent.substring(0, wordIx);
        var valAfter = childNode.textContent.slice(wordIx+word.length);
        var previousSibling = childNode.previousSibling;  // node before this childNode
        var nextSibling = childNode.nextSibling;  // node after this childNode

        // Append the span node to the DOM
        var spanNode = $('<span id="' + id + '">' + word + '</span>');  // Create a span node contains the word
        spanNode.insertAfter(childNode); // Append the span node to the dom; inserted after the text before the word
        if(previousSibling && previousSibling.nodeType == 3) {  // previous sibling is text node
          previousSibling.textContent += valBefore; // append valBefore to previous text node
          $(childNode).remove(); // remove childNode
        } else {
          childNode.textContent = valBefore; // Set the original node value to the text string before the word.
        }
        if(nextSibling && nextSibling.nodeType == 3) {
          nextSibling.textContent = valAfter + nextSibling.textContent; // append valAfter to next text node
        } else {
          $(document.createTextNode(valAfter)).insertAfter(spanNode); //Create text node to contain text string after the word; insert after span
        }
        return id;  // done, return id of span
      }
    } // end for
  },

  /**
  * Remove span node with the given id.
  * Loop on node childNodes to find the span childNode with the given id(this is needed in the case of having another span tags).
  * Append the value of span to node before or after.
  * @param: 'id' the id of the span node
  */
  removeSpanNode: function(id) {
    var spanNode = $('#'+id); // span node to be removed
    if(spanNode.length == 0) return;
    var preSibling = spanNode[0].previousSibling; // previous sibling(value before span)
    var nextSibling = spanNode[0].nextSibling;  // next sibling(value after span)

    if(preSibling && preSibling.nodeType == 3 && nextSibling && nextSibling.nodeType == 3) {  // if previous and next siblings are Text nodes
      var data = preSibling.textContent + spanNode[0].textContent + nextSibling.textContent; // all node value
      preSibling.textContent = data;  // set data to previous node and remove the rest
      $(spanNode).remove(); // remove span node
      $(nextSibling).remove();  // remove next sibling
    } else if(preSibling && preSibling.nodeType == 3) { // if previousSibling is Text node
      preSibling.textContent += spanNode[0].textContent; // append span value to previous node
      $(spanNode).remove(); // remove span node
    } else if(nextSibling && nextSibling.nodeType == 3) { // if nextSibling is Text node
      nextSibling.textContent = spanNode[0].textContent + nextSibling.textContent; // append span value to next node
      $(spanNode).remove(); // remove span node
    } else {  // previous and next nodes are not Text
      $(document.createTextNode(spanNode[0].textContent)).insertAfter(spanNode); //Create text node to contain span value; insert after span
      $(spanNode).remove(); // remove span node
    }
  }
};