/**
* LanguageMenu class handles all language menu features.
*/
LanguageMenu = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.element = $('#language_menu');
    this.containerEl = $('#language_menu_container');
  },

  /**
  * Check if language menu is visible.
  */
  visible: function() {
    return this.containerEl.is(":visible");
  },

  /**
  * Show language menu.
  */
  show: function() {
    this.containerEl.show();
  },

  /**
  * Hide language menu; get text translations on menu hide.
  */
  hide: function() {
    this.containerEl.hide(0, function(e) {
      toggle.check_translations(true); // fetch translations as if F8 is pressed
    }); // hide language menu
  },

  /**
  * Change the menu width/height to fit with window width/height
  */
  resize: function() {
    var clientHeight = document.documentElement.clientHeight;
    if(clientHeight < 500) {  // if client height is less than 500(approximate value near to menu height which is 445), then reduce menu height
      this.element.height(clientHeight-40);
    } else {  // client height is greater than menu height, keep menu height to standard value(445)
      this.element.height(445);
    }
    this.element.width(120); // keep menu width fixed
  },

  /**
  * Deselect all options in the select box.
  */
  deselectAll: function() {
    var selectBox = this.element[0];
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      selectBox.options[i].selected = false; // unselect option
    }
  },

  /**
  * Select options in the select box that included in the given array.
  * @param 'arr' array contains values needed to be selected
  */
  select: function(arr) {
    var selectBox = this.element[0];
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      if($.inArray(selectBox.options[i].value, arr) != -1) {
        selectBox.options[i].selected = true; // select option
      }
    } 
  },

  /**
  * Get the selected languages in languages menu.
  * @return the selected languages codes and names
  */
  getSelectedLanguages: function() {
    var i, names = [], codes = [];
    var selectedOptions = this.element[0].selectedOptions;
    for(i=0; i<selectedOptions.length; i++) {
      codes.push(selectedOptions[i].value); // add language code
      names.push(selectedOptions[i].text);  // add language name
    }
    return {targets: codes, lang_names: names};
  },

  /**
  * Save languages codes and names into the browser.
  * The codes and names arrays are converted into strings and saved in two different cookies in the browser.
  * @param 'langObj' the languages object that carry codes and names
  */
  saveLangToBrowser: function(langObj) {
    var codesStr = langObj.targets.toString();  // put codes array in a string
    var namesStr = langObj.lang_names.toString(); // put names array in a string
    setCookie("twext_lang_codes", codesStr, 365);  // save languages codes to the browser for a year
    setCookie("twext_lang_names", namesStr, 365);  // save languages names to the browser for a year
  },

  /**
  * Load all languages to the select menu.
  * @param 'langs' the languages to be initially selected
  */
  loadLanguageList: function(langs) {
    var selectValues = Object.sortAssoc(languages); // get languages object(eg:{"english":"en", ....}) sorted by keys
    $.each(selectValues, function(key, value) {  // loop languages
      langMenu.element
         .append($("<option></option>")
         .attr("value",value) // set the value of the option to language code
         .text(key)); // set the text of the option to language name
    });
    this.select(this.element[0], langs.targets);  // select the options included in the langs object
  },

  /**
  * Select options in the select box that included in the given array.
  * @param 'arr' array contains values needed to be selected
  */
  select: function(arr) {
    var selectBox = this.element[0];
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      if($.inArray(selectBox.options[i].value, arr) != -1) {
        selectBox.options[i].selected = true; // select option
      } // end if
    } // end for
  },

  /**
  * Deselect all options in the select box.
  */
  deselectAll: function() {
    var selectBox = this.element[0];
    for(var i=0; i<selectBox.options.length; i++) { // loop over options
      selectBox.options[i].selected = false; // unselect option
    }
  }
});