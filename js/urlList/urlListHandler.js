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

    this.allList = []; // list of All texts urls loaded from firebase, each element is object contains: url, text
    this.hotList = []; // list of latest updated urls-texts loaded from firebase, each element is object contains: url, text, domIx

    this.allListLimit = 1000; // maximum number of urls retrieved from firebase to be displayed as All list
    this.hotListLimit = 10; // maximum number of hot links to be displayed/saved from/into hot list

    this.loadLists(); // load All and Hot lists
    this.state = 0; // current state of displaying urls; 0=off, 1=show first 10 last updated urls, 2=show all
    //this.currentUrlData = null; // object contains the current displayed url and text
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
    var ref = new Firebase(firebaseHandler.firebaseRef+"dataHistory/allList");  // firebase ref
    var q = ref.endAt().limit(this.allListLimit);  // query to retrieve the last 1000 entries
    firebaseHandler.query(q, function(data) {  // query firebase for data
      //listHandler.allList = Object.toArray(data);  // cache the retrived list
      for(var key in data) {
        listHandler.allList.unshift({url: data[key].url, text: data[key].text});  // save data in reverse order(as will be displayed)
      }
      listHandler.fillAllListElement(); // create link for each entry of the list and append to the dom list element
    });
  },

  /**
  * Create links for all urls and append them to the DOM.
  * Append all urls to "url-all-list" element.
  */
  fillAllListElement: function() {
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
  },

  /**
  * Load url-text Hot list from firebase to hotList object.
  */
  loadHotList: function() {
    var listHandler = this; // copy of 'this' to be used in query callback
    var ref = new Firebase(firebaseHandler.firebaseRef+"dataHistory/hotList");  // firebase ref
    var q = ref.endAt().limit(this.hotListLimit);  // query to retrieve the last 10 entries
    firebaseHandler.query(q, function(data) {  // query firebase for data
      //listHandler.hotList = Object.toArray(data);  // cache the retrived list
      for(var key in data) {
        listHandler.hotList.unshift({url: data[key].url, text: data[key].text, name: key});  // save data in reverse order(as will be displayed)
      }
      listHandler.fillHotListElement(); // create link for each entry of the list and append to the dom list element
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
  fillHotListElement: function() {
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
  * Add the url-text to the top of the all list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToAllList: function(data) {
    if(!data) return;

    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url
    this.allListEl.prepend(aEl); // append to all list
    this.allList.unshift(data);  // Update urlAllList object
    firebaseHandler.push("dataHistory/allList", data);  // push generated url to history list
  },

  /**
  * Add the given url to the top of the hot list, and save to firebase.
  * @param 'data' key/value object contains the url and text
  */
  saveToHotList: function(data) {
    if(!data) return;

    // Update the list
    var urlIx = this.inHotList(data); // check if the url already in the list
    if(urlIx != -1) {  // url already included in the list
      this.deleteElFromHotList(urlIx, this.hotList[urlIx].name);  // delete old element
    } else {  // url not in the list
      var hotListLength = this.hotList.length;
      if(hotListLength >= this.hotListLimit) {  // check if the list length reaches the limit
        this.deleteElFromHotList(hotListLength-1, this.hotList[hotListLength-1].name);  // delete last element
      }
    }
    this.addElToHotList(data);
    // reset current data after it's saved
    //this.currentUrlData = null;
  },

  /**
  * Check if data already exists in the hot list.
  * @param 'data' data to be looked for
  * @return index of found data, -1 if data not found
  */
  inHotList: function(data) {
    for(var i=this.hotList.length-1; i>=0; i--) { //loop over hot list elements,reverse loop because higher probability of finding it in bottom data
      if(this.hotList[i].url == data.url && this.hotList[i].text == data.text) return i;  // data already in list, return index
    }
    return -1;  // data not in hot list
  },

  /**
  * Delete element with the given ix from hot list, dom and firebase.
  * @param 'ix' index of element in the list
           'name' firebase reference name of element
  */
  deleteElFromHotList: function(ix, name) {
    // delete url element from the dom
    var domIx = ix*2 + 1; // index in the dom
    var brEl = $(this.hotListEl[0].childNodes[domIx-1]); // empty line before the element
    var urlEl = $(this.hotListEl[0].childNodes[domIx]);  // element to be deleted
    brEl.remove();  // remove empty line
    urlEl.remove(); // remove element

    // delete element from firebase
    if(name) firebaseHandler.remove("dataHistory/hotList/"+name);

    // delete url data from the list
    this.hotList.splice(ix, 1);
  },

  /**
  * Add data to hot list, dom and firebase.
  * @param 'data' data to be added
  */
  addElToHotList: function(data) {
    // add to dom
    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url
    this.hotListEl.prepend(aEl); // append to sub list

    // add to firebase
    var addedRef = firebaseHandler.push("dataHistory/hotList", data);  // push generated url to history list

    // add to hot list
    var arr = addedRef.toString().split('/'); // get ref tokens
    var addedName = arr[arr.length-1];  // get last token
    this.hotList.unshift({url: data.url, text: data.text, name: addedName});
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
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  /**
  * Set the current url data (shortcut and text)
  * @param 'data' object contains url and text
  */
  /*setCurrentUrlData: function(data) {
    this.currentUrlData = data;
  },*/

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