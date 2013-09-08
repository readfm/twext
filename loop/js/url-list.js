/**
* URL_List class handles all url list features.
*/
URL_List = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.allListEl = $('#url-all-list');
    this.hotListEl = $('#url-hot-list');
    this.labelEl = $('#url-list-label');
    this.urlAllList = []; // list of all texts urls, will be loaded from firebase
    this.urlHotList = []; // list of latest updated texts urls, will be loaded from firebase
    this.urlListLimit = 1000; // maximum number of urls retrieved from firebase
    this.urlListState = 0; // current state of displaying urls; 0=off, 1=show first 10 urls, 2=show all
    this.hotListLength = 10; // maximum number of links to be displayed in the sub list
    this.currentUrlData = null; // object contains the current displayed url and text
  },

  /**
  * Set the current url data (shortcut and text)
  * @param 'data' object contains url and text
  */
  setCurrentUrlData: function(data) {
    this.currentUrlData = data;
  },

  /**
  * Load url-text lists (All and Hot) from firebase.
  */
  loadLists: function() {
    this.loadAllList();
    this.loadHotList();
  },

  /**
  * Load url-text all list from firebase to urlAllList object.
  */
  loadAllList: function() {
    var ref = new Firebase(firebaseRef+"history/list");  // firebase ref
    var query = ref.endAt().limit(this.urlListLimit);  // query to retrieve the last limit entries
    query.once("value", function(data) {
      url_list.urlAllList = Object.toArray(data.val());
      url_list.fillAllListElement();
    });
  },

  /**
  * Load url-text hot list from firebase to urlList object.
  */
  loadHotList: function() {
    var ref = new Firebase(firebaseRef+"history/hotList");  // firebase ref
    var query = ref.endAt().limit(this.hotListLength);  // query to retrieve the last limit entries
    query.once("value", function(snapshot) {
      var data = snapshot.val();
      for(var key in data) {
        url_list.urlHotList.push({name: key, url: data[key].url, text: data[key].text});
      }
      url_list.fillHotListElement();
      if(url_list.currentUrlData) {
        url_list.saveToHotList();  // add url to hot list
      }
    });
  },

  /**
  * Create elements for all urls and append them to the DOM.
  * Append all urls to "url-all-list"
  */
  fillAllListElement: function() {
    var i, aEl = "", ref = "", text = "";
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=this.urlAllList.length-1; i>=0; i--) {
      ref = currentRef + "#" + this.urlAllList[i].url;
      text = this.urlAllList[i].text.replace(/\n/g, '  ');
      aEl = "<br><a href='" + ref + "'>" + text + "</a>";
      this.allListEl.append(aEl); // append to all list
    } // end for
  },

  /**
  * Create elements for the last 10 updated urls and append them to the DOM.
  * Append the latest 10 updated urls to the "url-sub-list"
  */
  fillHotListElement: function() {
    var i, aEl = "", ref = "", text = "";
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=this.urlHotList.length-1; i>=0; i--) {
      ref = currentRef + "#" + this.urlHotList[i].url;
      text = this.urlHotList[i].text.replace(/\n/g, '  ');
      aEl = "<br><a href='" + ref + "'>" + text + "</a>";
      this.hotListEl.append(aEl); // append to all list
    } // end for
  },

  /**
  * Show/Hide url list according to current state.
  * First key press shows first 10 urls.
  * Second key press shows all urls.
  * Third key press hide list, and then repeat process.
  */
  switchUrlListState: function() {
    if(this.urlListState == 0) { // current state is off, move to state 1, show first 10 urls
      this.hotListEl.show();
      this.urlListState = 1;
      this.labelEl.html("new");
    } else if(this.urlListState == 1) {  // current state is first 10 urls, move to state 2, show all urls
      this.hotListEl.hide();
      this.allListEl.show();
      this.urlListState = 2;
      this.labelEl.html("all");
    } else if(this.urlListState == 2) {  // current state is all urls, move to state 0, hide list
      this.allListEl.hide();
      this.urlListState = 0;
      this.labelEl.html("off");
    }
  },

  /**
  * Add the new created url to the top of the list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToList: function(data) {
    this.saveToAllList(data);
    this.saveToHotList(data);
  },

  /**
  * Add the new created url to the top of the all list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToAllList: function(data) {
    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url
    this.allListEl.prepend(aEl); // append to all list
    this.urlAllList.push(data);  // Update urlAllList object
    new Firebase(firebaseRef+"history/list").push(data);  // push generated url to history list
  },

  /**
  * Add the new created url to the top of the hot list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToHotList: function(urlData) {
    var data = urlData?urlData:this.currentUrlData;
    if(!data) return;

    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url

    // Update the list
    var domUrlIx;
    var urlIx = this.inHotList(data); // check if the url already in the list
    if(urlIx != -1) {  // url already included in the list
      domUrlIx = this.urlHotList.length - 1 - urlIx; // get the reverse index to update the dom
      
      // remove function is undefined on safari
      // use jquery remove instead  for cross platform support
      $(this.hotListEl[0].childNodes[domUrlIx*2+1]).remove();  // Delete element from the dom (*2 to count <br> tags)
      $(this.hotListEl[0].childNodes[domUrlIx*2]).remove();  // Delete <br> element from the dom (*2 to count <br> tags)
      
      var name = this.urlHotList[urlIx].name;
      new Firebase(firebaseRef+"history/hotList/"+name).remove();
      this.urlHotList.splice(urlIx, 1); // delete the old url from list
    } else {  // url not in the list
      if(this.urlHotList.length >= this.hotListLength) {  // check if the list length reaches the limit
        domUrlIx = this.urlHotList.length - 1;
        this.hotListEl[0].childNodes[domUrlIx*2+1].remove();  // Delete element from the dom (*2 to count <br> tags)
        this.hotListEl[0].childNodes[domUrlIx*2].remove();  // Delete <br> element from the dom (*2 to count <br> tags)
        var name = this.urlHotList[0].name;
        new Firebase(firebaseRef+"history/hotList/"+name).remove();
        this.urlHotList.splice(0, 1); // delete the first url from list
      }
    }

    // append to hot list
    this.hotListEl.prepend(aEl); // append to sub list
    var addedRef = new Firebase(firebaseRef+"history/hotList").push(data);  // push generated url to history list
    var arr = addedRef.toString().split('/');
    var addedName = arr[arr.length-1];
    this.urlHotList.push({name: addedName, url: data.url, text: data.text});
    // reset current data after it's saved
    this.currentUrlData = null;
  },

  /**
  * Check if data already exists in the hot list
  */
  inHotList: function(data) {
    for(var i=this.urlHotList.length-1; i>=0; i--) {
      if(this.urlHotList[i].url == data.url && this.urlHotList[i].text == data.text) return i;
    }
    return -1;
  },

  /**
  * Reset lists.
  */
  reset: function() {
    this.allListEl.empty();
    this.hotListEl.empty();
    this.allListEl.hide();
    this.hotListEl.hide();
    this.labelEl.html('off');
    this.urlAllList = []; // list of all texts urls, will be loaded from firebase
    this.urlHotList = []; // list of latest updated texts urls, will be loaded from firebase
    this.urlListState = 0; // current state of displaying urls; 0=off, 1=show first 10 urls, 2=show all
    this.currentUrlData = null; // object contains the current displayed url and text
  }
});