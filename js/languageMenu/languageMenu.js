/**
* LanguageMenu class handles all language menu features.
*/
LanguageMenu = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  * @param 'langs' list of languages codes to be initially selected.
  */
  __init__: function(langs) {
    this.element = $('#language_menu'); // DOM element represents the language menu
    this.containerEl = $('#language_menu_container'); // DOM element that contain the menu element

    this.height = 445;  // menu initial height
    this.width = 120; // menu initial width

    this.loadLanguageList(langs.codes); // load all languages from languages.js file into the menu
  },

  /**
  * Load all languages to the select menu.
  * @param 'langs' the languages codes to be initially selected
  */
  loadLanguageList: function(langs) {
    var langMenu = this;
    // load languages
    var selectValues = Object.sortAssoc(languages); // get languages object(eg:{"en":"english", ....}) sorted by keys
    $.each(selectValues, function(key, value) {  // loop languages
      langMenu.element
         .append($("<option></option>")
         .attr("value",key) // set the value of the option to language code
         .text(value)); // set the text of the option to language name
    });

    // load non bing languages
    var nonBingSelectValues = Object.sortAssoc(nonBingLanguages); // get non bing languages object sorted by keys
    $.each(nonBingSelectValues, function(key, value) {  // loop non bing languages
      langMenu.element
         .append($("<option></option>")
         .attr("value",key) // set the value of the option to language code
         .text(value)); // set the text of the option to language name
    });

    // select langs
    this.select(langs);  // select the options included in the langs object
  },

  /**
  * Select options in the select box that are included in the given array.
  * @param 'arr' array of languages codes needed to be selected
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
  * Change the menu width/height to fit with client window width/height
  */
  resize: function() {
    var clientHeight = document.documentElement.clientHeight;
    if(clientHeight < this.height + 5) {  // if client height is less than menu height( plus 5 for error), then reduce menu height
      this.element.height(clientHeight-40); //set menu height to client height(subtract 40 px to leave some space between menu and bottom of window)
    } else {  // client height is greater than menu height, keep menu height
      this.element.height(this.height);
    }
    this.element.width(this.width); // keep menu width fixed
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
  * Hide language menu.
  */
  hide: function(callback) {
    this.containerEl.hide(0, callback); // hide language menu, callback on hide event
  },

  /**
  * Get the selected languages in languages menu.
  * @return the selected languages codes and names
  */
  getSelected: function() {
    var i, langNames = [], langCodes = [];
    var selectedOptions = this.element[0].selectedOptions;
    for(i=0; i<selectedOptions.length; i++) {
      langCodes.push(selectedOptions[i].value); // add language code
      langNames.push(selectedOptions[i].text);  // add language name
    }
    return {codes: langCodes, names: langNames};
  }
});