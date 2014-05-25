/**
* UrlListHandler class handles all url list features.
*/
UrlListHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.allListEl = $('#url-all-list');  // All list element
    this.hotListEl = $('#url-hot-list');  // Hot list element
    this.labelEl = $('#url-list-label');  // list label that shows the current displayed list (all, hot or off)

    this.allList = {}; // object of All texts urls loaded from firebase, key is url, value is object contains: fb key, text
    this.hotList = {}; // object of Hot texts urls loaded from firebase, key is url, value is object contains: fb key, text

    this.allListLimit = 1000; // maximum number of urls retrieved from firebase to be displayed as All list
    this.hotListLimit = 10; // maximum number of hot links to be displayed/saved from/into hot list

    this.loadLists(); // load All and Hot lists
    this.state = 0; // current state of displaying urls; 0=off, 1=show first 10 last updated urls, 2=show all
  },

  /**
  * Load url-text lists (All and Hot) from firebase.
  */
  loadLists: function() {
    this.loadAllList(); // load All list
    this.loadHotList(); // load Hot list
  },

  /**
  * Load url-text 'All' list from firebase to urlAllList object.
  */
  loadAllList: function() {
    var listHandler = this; // copy of 'this' to be used in query callback
    var ref = new Firebase(refs.history+"allList");  // firebase ref
    var q = ref.endAt().limit(this.allListLimit);  // query to retrieve the last 1000 entries
    firebaseHandler.query(q, function(data) {  // query firebase for data
      //listHandler.allList = Object.toArray(data);  // cache the retrived list
      var aEl = "", text = "", ref = "";
      var currentRef = window.location.href.split('#')[0];
      for(var key in data) {
        ref = currentRef + "#" + data[key].url;
        listHandler.allList[data[key].url] = {name: key, text: data[key].text};
        // fill list element
        text = TwextUtils.textToOneline(data[key].text);  // put the text in the form of oneline
        // create link element
        aEl = "<br><a href='" + ref + "' id='all-" + data[key].url + "' onclick='controller.checkDeleteUrl(event);'>" + text + "</a>";
        listHandler.allListEl.prepend(aEl); // append to All list
      }
      //listHandler.fillAllListElement(); // create link for each entry of the list and append to the dom list element
    });
  },

  /**
  * Create links for all urls and append them to the DOM.
  * Append all urls to "url-all-list" element.
  */
  /*fillAllListElement: function() {
    var i, aEl = "", ref = "", text = "";
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=0;i<this.allList.length; i++) {
      ref = currentRef + "#" + this.allList[i].url;
      text = TwextUtils.textToOneline(this.allList[i].text);  // put the text in the form of oneline
      aEl = "<br><a href='" + ref + "'>" + text + "</a>"; // create link element
      this.allListEl.append(aEl); // append to All list
    } // end for
  },*/

  /**
  * Load url-text Hot list from firebase to hotList object.
  */
  loadHotList: function() {
    var listHandler = this; // copy of 'this' to be used in query callback
    var ref = new Firebase(refs.history+"hotList");  // firebase ref
    var q = ref.endAt().limit(this.hotListLimit);  // query to retrieve the last 10 entries
    firebaseHandler.query(q, function(data) {  // query firebase for data
      //listHandler.hotList = Object.toArray(data);  // cache the retrived list
      var aEl = "", text = "", ref = "";
      var currentRef = window.location.href.split('#')[0];
      for(var key in data) {
        ref = currentRef + "#" + data[key].url;
        listHandler.hotList[data[key].url] = {name: key, text: data[key].text};
        // fill list element
        text = TwextUtils.textToOneline(data[key].text);
        aEl = "<br><a href='" + ref + "' id='hot-" + data[key].url+ "' onclick='controller.checkDeleteUrl(event);'>" + text + "</a>";
        listHandler.hotListEl.prepend(aEl); // append to all list
      }
      //listHandler.fillHotListElement(); // create link for each entry of the list and append to the dom list element
      /*url_list.fillHotListElement();
      if(url_list.currentUrlData) {
        url_list.saveToHotList();  // add url to hot list
      }*/
    });
  },

  /**
  * Create elements for the last 10 updated urls and append them to the DOM.
  * Append the latest 10 updated urls to the "url-hot-list"
  */
  /*fillHotListElement: function() {
    var i, aEl = "", ref = "", text = "", domIx = -1;
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=0; i<this.hotList.length; i++) {
      ref = currentRef + "#" + this.hotList[i].url;
      text = TwextUtils.textToOneline(this.hotList[i].text);
      aEl = "<br><a href='" + ref + "'>" + text + "</a>";
      this.hotListEl.append(aEl); // append to all list
      //this.hotList[i].domIx = domIx+2;
    } // end for
  },*/

  /**
  * Add the given url-text to the top of the lists, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToLists: function(data) {
    this.saveToAllList(data);
    this.saveToHotList(data);
  },

  /**
  * Add the url-text to the top of the all list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToAllList: function(data) {
    if(!data) return;

    var currentRef = window.location.href.split('#')[0];
    var ref = currentRef + "#" + data.url;
    var name = firebaseHandler.push(refs.history+"allList", data);  // push generated url to history list
    // create link element
    var aEl = "<br><a href='" + ref + "' id='all-" + data.url + "' onclick='controller.checkDeleteUrl(event);'>" + data.text + "</a>";
    this.allListEl.prepend(aEl); // append to all list
    this.allList[data.url] = {name: name, text: data.text};  // Update allList object
  },

  /**
  * Add the given url to the top of the hot list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToHotList: function(data) {
    if(!data) return;

    var inHotList = this.hotList[data.url];
    if(inHotList) { // delete url if already in the hot list
      this.deleteFromHotList(data.url);
    } else if(Object.size(this.hotList) >= this.hotListLimit) { // delete last url to add the new one
      var len = this.hotListEl[0].childNodes.length;
      var lastEl = this.hotListEl[0].childNodes[len-1];
      var lastUrl = lastEl.id.split("-")[1];
      this.deleteFromHotList(lastUrl);
    }
    // add url to hot list
    var currentRef = window.location.href.split('#')[0];
    var ref = currentRef + "#" + data.url;
    var name = firebaseHandler.push(refs.history+"hotList", data);  // push generated url to history list
    var aEl = "<br><a href='" + ref + "' id='hot-" + data.url+ "' onclick='controller.checkDeleteUrl(event);'>" + data.text + "</a>";
    this.hotListEl.prepend(aEl); // add to top of hot list
    this.hotList[data.url] = {name: name, text: data.text}; // add to hotList object

    /*var urlIx = this.inHotList(data); // check if the url already in the list
    if(urlIx != -1) {  // url already included in the list
      this.deleteElFromHotList(urlIx, this.hotList[urlIx].name);  // delete old element
    } else {  // url not in the list
      var hotListLength = this.hotList.length;
      if(hotListLength >= this.hotListLimit) {  // check if the list length reaches the limit
        this.deleteElFromHotList(hotListLength-1, this.hotList[hotListLength-1].name);  // delete last element
      }
    }
    this.addElToHotList(data);*/
    // reset current data after it's saved
    //this.currentUrlData = null;
  },

  /**
  * Delete url from hot list.
  */
  deleteFromHotList: function(url) {
    // delete from hot list
    var hotEl = $('#hot-'+url);
    if(hotEl.length > 0) {
      brEl = hotEl[0].previousSibling;
      if(brEl) $(brEl).remove();
      hotEl.remove();
      // delete from firebase
      firebaseHandler.remove(refs.history+"hotList/"+this.hotList[url].name);
      // delete from hot list object
      delete this.hotList[url];
    }
  },

  /**
  * Delete url from all list.
  */
  deleteFromAllList: function(url) {
    // delete from all list
    var allEl = $('#all-'+url);
    if(allEl.length > 0) {
      brEl = allEl[0].previousSibling;
      if(brEl) $(brEl).remove();
      allEl.remove();
      // delete from firebase
      firebaseHandler.remove(refs.history+"allList/"+this.allList[url].name);
      // delete from all list object
      delete this.allList[url];
    }
  },

  /**
  * Delete url <a> element from all and hot lists.
  */
  deleteUrlFromLists: function(url) {
    var brEl = null;
    // delete from all list
    this.deleteFromAllList(url);
    // delete from hot list
    this.deleteFromHotList(url);
  },

  /**
  * Get data object of the given url from all list.
  */
  getAllUrlObj: function(url) {
    return this.allList[url];
  },

  /**
  * Get data object of the given url from hot list.
  */
  getHotUrlObj: function(url) {
    return this.hotList[url];
  },

  /**
  * Show/Hide url list according to current state.
  * First key press shows first 10 urls.
  * Second key press shows all urls.
  * Third key press hide list, and then repeat process.
  */
  switchState: function() {
    if(this.state == 0) { // current state is off, move to state 1, show 10 last updated urls
      this.hotListEl.show();  // show hot list
      this.state = 1;  // change state to new
      this.labelEl.html("new"); // change label to new
    } else if(this.state == 1) {  // current state is first 10 urls, move to state 2, show all urls
      this.hotListEl.hide();  // hide hot list
      this.allListEl.show();  // show all list
      this.state = 2;  // change state to all
      this.labelEl.html("all"); // change label to all
    } else if(this.state == 2) {  // current state is all urls, move to state 0, hide list
      this.allListEl.hide();  // hide all list
      this.state = 0;  // change state to off
      this.labelEl.html("off"); // change label to off
    }
  }

  /**
  * Reset lists.
  */
  /*reset: function() {
    this.allListEl.empty();
    this.hotListEl.empty();
    this.allListEl.hide();
    this.hotListEl.hide();
    this.labelEl.html('off');
    this.urlAllList = []; // list of all texts urls, will be loaded from firebase
    this.urlHotList = []; // list of latest updated texts urls, will be loaded from firebase
    this.urlListState = 0; // current state of displaying urls; 0=off, 1=show first 10 urls, 2=show all
    this.currentUrlData = null; // object contains the current displayed url and text
  }*/
});