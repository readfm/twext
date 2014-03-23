/**
* AudiosListHandler class handles all audios list features.
*/
AudioListHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.listEl = $('#audio-list');  // audios list element
    this.audios = {}; // list of all audios retrieved from firebase; key is fb name, value is object contains audio id and timings
  },

  /**
  * Load audio list retrieved from firebase to the list element. Each entry contains id and timings.
  * @param 'audios' object of audios data(ids and timings)
  */
  loadList: function(audios) {
    var lastKey = null;
    this.audios = audios;
    if(Object.size(this.audios) > 0) {
      var aEl, ref;
      var url = window.location.hash?window.location.hash.slice(1):null;
      for(var key in this.audios) {
        if(!this.audios[key].id && url) {
          delete this.audios[key];
          firebaseHandler.remove("urlMapping/"+url+"/audios/"+key);
          continue;
        }
        ref = "controller.loadDeleteAudio(event,'" + key + "');";
        aEl = '<a onclick="'+ ref + '">' + this.audios[key].id + "</a>";  // create link element
        if(this.listEl[0].childNodes.length != 0) aEl = aEl + "<br>";
        this.listEl.prepend(aEl);
        lastKey = key;
      }
    }
    return lastKey;
  },

  /**
  * Add audio to top of the list.
  */
  addToList: function(key, data) {
    // add to audio list
    var ref = "controller.loadDeleteAudio(event,'" + key + "');";
    var aEl = '<a onclick="'+ ref + '">' + data.id + "</a>";  // create link element
    if(this.listEl[0].childNodes.length != 0) aEl = aEl + "<br>";
    this.listEl.prepend(aEl);
    this.audios[key] = data;
  },

  /**
  * Get audio object with the given key.
  */
  getAudio: function(key) {
    return this.audios[key];
  },

  /**
  * Delete audio from list
  */
  deleteAudio: function(key, target) {
    delete this.audios[key];
    if(target.nextSibling && target.nextSibling.nodeName == "BR") $(target.nextSibling).remove();
    else if(target.previousSibling && target.previousSibling.nodeName == "BR") $(target.previousSibling).remove();
    $(target).remove();
  },

  /**
  * Show list.
  */
  show: function() {
    this.listEl.show();
  },

  /**
  * Hide list.
  */
  hide: function() {
    this.listEl.hide();
  },

  /**
  * Empty list.
  */
  empty: function() {
    this.listEl.empty();
  }
});