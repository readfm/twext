/*** Syllabifier class handles text syllabifications.*/Syllabifier = Class.$extend({  /**  * Initilize class variables (classy.js is used for class creation)  */  __init__: function() {    // configure Hyphenator    Hyphenator.config({      'minwordlength': 3,      'hyphenchar': '-'    });    this.firebaseRef = "syllableLookup/";  // firebase url    this.fbWordsSybs = {};  // text words sybs that are saved in firebase; key is the word index, value is the hyphenated word    this.sourceText = null; // source text    this.hyphenatedText = null; // cached hyphenated text  },  /**  * Divide words into syllables separated by '-'  * Retrieve sybs of text words from firebase then hyphenate text.  * @param 'text' text to be syllabified           'callback' callback function to return to toggle.data  */  syllabifyText: function(text, callback) {    var i, word = "";    var syllabifier = this; // instance from the syllabifier, used in callbacks    // check if the text is new    var isNewText = this.sourceText == null || this.sourceText != text;    if(isNewText) { // text is new      this.fbWordsSybs = {};      this.sourceText = text; // set source text      text = text.replace(/\-/g, '@');  // replace existing - by @ for not conflicting with hyphen character      var words = strWords(text); // get text words      for(i=0; i<words.length; i++) { // loop over text words        word = words[i].toLowerCase();  // to lowercase cos firebase words are in lowercase        // Send request to firebase        firebaseHandler.get(this.firebaseRef+word, function(data, wordIx) {  //callback          syllabifier.fbWordsSybs[wordIx] = data;          if(Object.size(syllabifier.fbWordsSybs) == words.length) syllabifier.hyphenateText(text, callback); // all sybs retrived, hyphenate text        }, i);      }    } else {  // text already syllabified, return cached hyphenated text      callback(this.hyphenatedText);    }  },  /**  * Hyphenate text using Hyphenator.js and firebase lookup table.  * Hyphenate text using Hyphenator.js api, loop on hyphenated text words.  * If word has sybs on fb, then replace the hyphenated word got from hyphenator by the one got from fb.  * If word has no saved sybs on fb, then use the already hyphenated word and save it into fb.  * @param 'text' text to be hyphenated           'callback' callback function  * @return hyphenated text  */  hyphenateText: function(text, callback) {    var i, j, word, hword, fbhword, syllables, diff = 0;    text = Hyphenator.hyphenate(text, 'en');  // hyphenate text using the api    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');  // remove zero width spaces that may inserted from the Hyphenator.js    var hwords = strWords(text);  // get words of hyphenated text    var hwordsIx = strWordsIndices(text); // get words indices of hyphenated text    for(i=0; i<hwords.length; i++) {  // loop on hyphenated words      hword = hwords[i];  // hyphenated word      word = hword.replace(/\-/g, '');  // unhyphenated word      if(this.fbWordsSybs[i]) { // there is a saved sybs of this word, replace hyphenated word by the one from firebase        // insert hyphen in the word at the same place where existing in firebase hypenated word; doing it that way instead of string replace protects the upper case characters from being lost.        j = 0;        fbhword = "";        syllables = this.fbWordsSybs[i].split('-'); // sybs of the word        $.each(syllables, function() {          fbhword = fbhword + word.substr(j, this.length) + '-';          j += this.length;        });        fbhword = fbhword.substring(0, fbhword.length-1); // Remove the last -        text = text.substring(0, hwordsIx[i]+diff) + fbhword + text.slice(hwordsIx[i]+diff+hwords[i].length);        diff += fbhword.length - hwords[i].length;  // difference between api and firebase hyphenated words, this updates the words indecies      }    }    text = text.replace(/\@/g, '--'); // replace @ back to - and add hyphen to the - separated words    this.hyphenatedText = text; // cache of hyphenated text    callback(text);  },  /**  * Remove hyphens from text.  * @param 'hText' the hyphenated text  * @return orginal text  */  unsyllabifyText: function(hText) {    return hText.replace(/\--/g, '@').replace(/\-/g, '').replace(/\@/g, '-');  },  /**  * Get the pair of the word to hyphenate and its hyphenation using the position of hyphen.  * @param 'str' the input string contains hyphenated word           'pos' cursor position  * @return array of word before and after adding/deleting the hyphen, null if word not found  */  wordHyphenationPair: function(str, pos) {    var index = TwextUtils.wordAtCaret(str, pos); // number of word with hyphen    if(index != -1) { // word found      var words = strWords(str); // words      var wordsIx = strWordsIndices(str); // words positions      var hWord = words[index]; // word with the extra hyphen      var word = hWord.substring(0, pos-1) + hWord.slice(pos);  // word without hyphen at the cursor      return new Array(word, hWord);  // return pair    }    return null;  },  /**  * Undo manually hyphenation made to a word, and update all its occurrences.  * @param 'text' area input text, including timing lines           'caretCoord' cursor coordinates (line number and offset)  * @return updated text after undo hyphenation  */  undoWordHyphenation: function(text, caretCoord) {    text = text.replace(/\--/g, '@@'); // to differentiate dash separated words from hyphenated words    var cursorPos = caretCoord.offset;  // cursor position    var currentLine = text.split('\n')[caretCoord.lines]; // line where cursor    var pair = this.wordHyphenationPair(currentLine, cursorPos);  // orgWord/newWord pair    if(pair) {  // if pair exists      // pair[0] is word after deleting -, pair[1] is word before deleting -      var newText = this.updateTextWithUnhyphenatedWord(text, pair[1], pair[0]);  // text after unhyphenate word and its occurrences      return newText.replace(/\@@/g, '--'); // return updated text    }    return null;  },  /**  * Undo hyphenation from all occurrences of a word.  * Get all matches of the orgWord that need to be replaced by the newWord, loop on the matches, if it's not a part of a word, then put hyphens in the same places of the newWord hyphens. Using this way over the normal replace to keep word case sensitivity.  * @param 'text' input text           'orgWord' the word before deleting -           'newWord' the word after deleting -  */  updateTextWithUnhyphenatedWord: function(text, orgWord, newWord) {    var i, x, diff = 0, tmp = "", charBefore, charAfter;    var re = new RegExp(orgWord, 'gi');    var matches = text.match(re); // all word occurrences    var matchesPos = matchIndices(text, re); // all word occurrences positions    if(matches) {  // If match is found.      var syllables = newWord.split('-'); // new word syllables      for(x=0; x<matches.length; x++) {        // check if it's a whole word or a part of a word        charBefore = text.charAt(matchesPos[x]-diff-1); // char before match        charAfter = text.charAt(matchesPos[x]-diff+matches[x].length); // char after match        if((charBefore && strWords(charBefore)) || (charAfter && strWords(charAfter))) continue;  // part of a word,char before/after is a word char        i = 0;        entry = "";        tmp = matches[x].replace(/\-/g, '');  // get word without hyphens        $.each(syllables, function() {          entry = entry + tmp.substr(i, this.length) + '-';          i += this.length;        });        entry = entry.substring(0, entry.length-1);  // Remove the last -        text = text.substring(0, matchesPos[x]-diff) + entry + text.slice(matchesPos[x]-diff+matches[x].length);        diff++; // one hyphen removed, difference to subtract is incremented by 1      }    }    return $.trim(text);  },  /**  * Insert '-' where the cursor points, and all other occurrences of the word.  * @param 'text' area input text, including timing lines           'caretCoord' cursor coordinates (line number and offset)  * @return updated text after undo hyphenation  */  hyphenateWord: function(text, caretCoord) {    text = text.replace(/\--/g, '@@'); // to differentiate dash separated words from hyphenated words    var cursorPos = caretCoord.offset;  // cursor position    var currentLine = text.split('\n')[caretCoord.lines]; // line where cursor    var pair = this.wordHyphenationPair(currentLine, cursorPos);  // orgWord/newWord pair    if(pair) {  // if pair exists      // pair[0] is word before adding -, pair[1] is word after adding -      var newText = this.updateTextWithHyphenatedWord(text, pair[0], pair[1]); // text after hyphenate word and its occurrences      return newText.replace(/\@@/g, '--'); // return updated text    }    return null;  },  /**  * Update all occurrences of a word to its hyphenation.  * Get all matches of the orgWord that need to be replaced by the newWord, loop on the matches, if it's not a part of a word, then put hyphens in the same places of the newWord hyphens. Using this way over the normal replace to keep word case sensitivity.  * @param 'text' area input text, including timing lines           'orgWord' word before adding -           'newWord' word after adding -  */  updateTextWithHyphenatedWord: function(text, orgWord, newWord) {    var i, x, diff = 0, tmp = "", charBefore, charAfter;    var re = new RegExp(orgWord, 'gi');    var matches = text.match(re); // all word occurrences    var matchesPos = matchIndices(text, re);  // all word occurrences positions    if(matches) {  // If match is found.      var syllables = newWord.split('-'); // new word syllables      for(x=0; x<matches.length; x++) {        // check if it's a whole word or a part of a word        charBefore = text.charAt(matchesPos[x]+diff-1);  // char before match        charAfter = text.charAt(matchesPos[x]+diff+matches[x].length); // char after match        if((charBefore && strWords(charBefore)) || (charAfter && strWords(charAfter))) continue; // part of a word,char before/after is a word char        i = 0;        entry = "";        tmp = matches[x].replace(/\-/g, '');  // word without hyphens        $.each(syllables, function() {          entry = entry + tmp.substr(i, this.length) + '-';          i += this.length;        });        entry = entry.substring(0, entry.length-1);  // Remove the last -        //if(text.charAt(matches[x]+diff-1) != "'" && text.charAt(matches[x]+diff-1) != "-") {        text = text.substring(0, matchesPos[x]+diff) + entry + text.slice(matchesPos[x]+diff+matches[x].length);        diff++; // one hyphen added, difference to add is incremented by 1        //}           }    }    return $.trim(text);  },  /**  * Set hyphenated text.  * @param 'text' hyphenated text  */  setHyphenatedText: function(text) {    this.hyphenatedText = text;  }});