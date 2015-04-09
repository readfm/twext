/**
* UrlListHandler class handles all url list features.
*/
UrlListHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.allListEl = $('#url-all-list');  // All list element
    this.partListEl = $('#url-part-list');  // Part list element
    this.hotListEl = $('#url-hot-list');  // Hot list element
    this.searchListEl = $('#url-search-list');  // search list element
    this.labelEl = $('#data-bar-urllist');  // list label that shows the current displayed list (all, hot or off)

    this.allList = {}; // object of All texts urls loaded from firebase, key is url, value is object contains: fb key, text
    this.partList = {}; // object of Part of texts urls loaded from firebase, key is url, value is object contains: fb key, text
    this.hotList = {}; // object of Hot texts urls loaded from firebase, key is url, value is object contains: fb key, text
    this.searchList = {}; // object of searched urls.

    this.partListLimit = 1000; // maximum number of urls retrieved from firebase to be displayed as All list
    this.hotListLimit = 10; // maximum number of hot links to be displayed/saved from/into hot list

    this.loadLists(); // load All, Part and Hot lists
    this.searchKey = null;  // current search string
    this.state = 0; // current state of displaying urls; 0=off, 1=show first 10 last updated urls, 2=show last 1000 created urls, 3=show all urls
  },

  /**
  * Load url-text lists (All, Part and Hot) from firebase.
  */
  loadLists: function() {
    this.loadHotList(); // load Hot list
    this.loadAllList(); // load All and Part lists
  },

  /**
  * Load url-text 'ALl' list from firebase to allList object.
  * Load 1000 urls to partList object.
  */
  loadAllList: function() {
    var listHandler = this; // copy of 'this' to be used in callback
    firebaseHandler.get(refs.history+"allList", function(data) {  // query firebase for data
      listHandler.loadPartList(data);
      var aEl = "", text = "", ref = "";
      var currentRef = window.location.href.split('#')[0];
      for(var key in data) {
        ref = currentRef + "#" + data[key].url;
        listHandler.allList[data[key].url] = {name: key, text: data[key].text};
        // fill list element
        text = TwextUtils.textToOneline(data[key].text);  // put the text in the form of oneline
        // create link element
        aEl = "<br><a href='" + ref + "' id='all-" + data[key].url + "' onclick='controller.onUrlClick(event);'>" + text + "</a>";
        listHandler.allListEl.append(aEl); // append to All list
      }
    });
  },

  /**
  * Load last 1000 urls from all list retrieved from firebase to partList object.
  */
  loadPartList: function(allList) {
    var keys = Object.keys(allList);
    var start = keys.length <= this.partListLimit?0:keys.length-this.partListLimit; // start index
    var aEl = "", text = "", ref = "", key;
    var currentRef = window.location.href.split('#')[0];
    for(var i=start; i<keys.length; i++) {
      key = keys[i];
      ref = currentRef + "#" + allList[key].url;
      this.partList[allList[key].url] = {name: key, text: allList[key].text};
      // fill list element
      text = TwextUtils.textToOneline(allList[key].text);  // put the text in the form of oneline
      // create link element
      aEl = "<br><a href='" + ref + "' id='part-" + allList[key].url + "' onclick='controller.onUrlClick(event);'>" + text + "</a>";
      this.partListEl.prepend(aEl); // append to part list
    }
  },

  /**
  * Load url-text Hot list from firebase to hotList object.
  */
  loadHotList: function() {
    var listHandler = this; // copy of 'this' to be used in query callback
    var ref = new Firebase(refs.history+"hotList");  // firebase ref
    var q = ref.endAt().limit(this.hotListLimit);  // query to retrieve the last 10 entries
    firebaseHandler.query(q, function(data) {  // query firebase for data
      var aEl = "", text = "", ref = "";
      var currentRef = window.location.href.split('#')[0];
      for(var key in data) {
        ref = currentRef + "#" + data[key].url;
        listHandler.hotList[data[key].url] = {name: key, text: data[key].text};
        // fill list element
        text = TwextUtils.textToOneline(data[key].text);
        aEl = "<br><a href='" + ref + "' id='hot-" + data[key].url+ "' onclick='controller.onUrlClick(event);'>" + text + "</a>";
        listHandler.hotListEl.prepend(aEl); // append to hot list
      }
      //listHandler.fillHotListElement(); // create link for each entry of the list and append to the dom list element
      /*url_list.fillHotListElement();
      if(url_list.currentUrlData) {
        url_list.saveToHotList();  // add url to hot list
      }*/
    });
  },

  /**
  * Add the given url-text to the top of the lists, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToLists: function(data) {
    this.saveToAllList(data);
    this.saveToHotList(data);
  },

  /**
  * Add the url-text to the bottom of the all list and top of part list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToAllList: function(data) {
    if(!data) return;

    var currentRef = window.location.href.split('#')[0];
    var ref = currentRef + "#" + data.url;
    var name = firebaseHandler.push(refs.history+"allList", data);  // push generated url to history list
    // append to all list
    var aEl = "<br><a href='" + ref + "' id='all-" + data.url + "' onclick='controller.onUrlClick(event);'>" + data.text + "</a>";
    this.allListEl.append(aEl); // append to all list
    this.allList[data.url] = {name: name, text: data.text};  // Update allList object
    // append to part list
    aEl = "<br><a href='" + ref + "' id='part-" + data.url + "' onclick='controller.onUrlClick(event);'>" + data.text + "</a>";
    this.partListEl.prepend(aEl); // append to part list
    this.partList[data.url] = {name: name, text: data.text};  // Update partList object
    if(Object.size(this.partList) > this.partListLimit) { // delete last url if over limit
      var len = this.partListEl[0].childNodes.length;
      var lastEl = this.partListEl[0].childNodes[len-1];
      var lastUrl = lastEl.id.split("-")[1];
      this.deleteFromPartList(lastUrl);
    }
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
    var aEl = "<br><a href='" + ref + "' id='hot-" + data.url+ "' onclick='controller.onUrlClick(event);'>" + data.text + "</a>";
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
  * Delete url from all and part lists.
  */
  deleteFromAllList: function(url) {
    // delete from all list
    var allEl = $('#all-'+url);
    if(allEl.length > 0) {
      var brEl = allEl[0].previousSibling;
      if(brEl) $(brEl).remove();
      allEl.remove();
      // delete from firebase
      firebaseHandler.remove(refs.history+"allList/"+this.allList[url].name);
      // delete from all list object
      delete this.allList[url];
    }
    // delete from part list
    this.deleteFromPartList(url);
    // delete from search list
    this.deleteFromSearchList(url);
  },

  /**
  * Delete url from part list
  */
  deleteFromPartList: function(url) {
    var partEl = $('#part-'+url);
    if(partEl.length > 0) {
      var brEl = partEl[0].previousSibling;
      if(brEl) $(brEl).remove();
      partEl.remove();
      // delete from part list object
      delete this.partList[url];
    }
  },

  /**
  * Delete url from search list
  */
  deleteFromSearchList: function(url) {
    var searchEl = $('#search-'+url);
    if(searchEl.length > 0) {
      var brEl = searchEl[0].previousSibling;
      if(brEl) $(brEl).remove();
      searchEl.remove();
    }
  },

  /**
  * Delete url <a> element from part and hot lists.
  */
  deleteUrlFromLists: function(url) {
    var brEl = null;
    // delete from all and part list
    this.deleteFromAllList(url);
    // delete from hot list
    this.deleteFromHotList(url);
  },

  /**
  * Get data object of the given url from list.
  */
  getUrlObj: function(url) {
    if(this.state == 1) return this.hotList[url]; // hot list is displayed
    if(this.state == 2) return this.partList[url]; // part list is displayed
    if(this.state == 3 || this.state == 0) return this.allList[url]; // all list is displayed
    return null;
  },

  /**
  * Search for urls contain the given word.
  */
  searchUrls: function(str) {
    if(this.state != 0 || this.searchKey == str) return; // if not off state or search for same text words, then return

    var text, found = false, aEl, ref, list;
    var words = strWords(str);
    if(Object.size(this.searchList) > 0 && this.searchKey == words.slice(0, words.length-1).join(" ")) list = this.searchList;
    else list = this.allList;

    this.deleteSearchUrls();
    this.searchKey = str;

    for(var key in list) {
      text = list[key].text;
      found = false;
      for(var i=0; i<words.length; i++) {
        if(text.indexOf(words[i]) != -1) found = true;
        else {
          found = false;
          break;
        }
      }
      if(found) { // text contain all words
        ref = "#" + key;
        aEl = "<br><a href='" + ref + "' id='search-" + key + "' onclick='controller.onUrlClick(event);'>" + text + "</a>";
        this.searchListEl.prepend(aEl); // add to top of search list
        this.searchList[key] = list[key];
      }
    }
  },

  /**
  * Delete search result.
  */
  deleteSearchUrls: function() {
    this.searchListEl.empty();
    this.searchKey = null;
    this.searchList = {};
  },

  /**
  * Show/Hide url list according to current state.
  * First key press shows first 10 urls.
  * Second key press shows 1000 urls.
  * Third key press shows all urls.
  * Fourth key press hide list, and then repeat process.
  */
  switchState: function() {
    if(this.state == 0) { // current state is off, move to state 1, show 10 last updated urls
      this.searchListEl.hide();  // hide search list
      this.hotListEl.show();  // show hot list
      this.state = 1;  // change state to new
      this.labelEl.html("recent"); // change label to new
    } else if(this.state == 1) {  // current state is first 10 urls, move to state 2, show 1000 urls
      this.hotListEl.hide();  // hide hot list
      this.partListEl.show();  // show part list
      this.state = 2;  // change state to part
      this.labelEl.html("1000"); // change label to part
    } else if(this.state == 2) { // current state is part urls, move to state 3, show all urls
      this.partListEl.hide();  // hide part list
      this.allListEl.show();  // show all list
      this.state = 3;  // change state to part
      this.labelEl.html("all"); // change label to part
    } else if(this.state == 3) {  // current state is part urls, move to state 0, hide list
      this.allListEl.hide();  // hide part list
      this.searchListEl.show();  // show search list
      this.state = 0;  // change state to off
      this.labelEl.html("list"); // change label to off
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