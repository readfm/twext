/**
* URL_List class handles all url list features.
*/
URL_List = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.listEl = $('#url-all-list');
    this.subListEl = $('#url-sub-list');
    this.labelEl = $('#url-list-label');
    this.urlList = []; // list of all texts urls, will be loaded from firebase
    this.urlListLimit = 1000; // maximum number of urls retrieved from firebase
    this.urlListState = 0; // current state of displaying urls; 0=off, 1=show first 10 urls, 2=show all
    this.subListLength = 10; // maximum number of links to be displayed in the sub list
  },

  /**
  * Load url-text list from firebase to urlList object.
  */
  loadList: function() {
    var ref = new Firebase(firebaseRef+"history");  // firebase ref
    var query = ref.endAt().limit(this.urlListLimit);  // query to retrieve the last limit entries
    query.once("value", function(data) {
      url_list.urlList = Object.toArray(data.val());
      url_list.fillListElements();
    });
  },

  /**
  * Create elements for urls and append them to the DOM.
  * Append the latest 10 added urls to the "url-sub-list" element, and all urls to "url-all-list"
  */
  fillListElements: function() {
    var i, aEl = "", ref = "", text = "";
    var currentRef = window.location.href;
    var hashIndex = currentRef.indexOf('#');
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef;
    for(i=this.urlList.length-1; i>=0; i--) {
      ref = currentRef + "#" + this.urlList[i].url;
      text = this.urlList[i].text.replace(/\n/g, '  ');
      aEl = "<br><a href='" + ref + "'>" + text + "</a>";
      if(i >= this.urlList.length - 10) { // latest 10 items
        this.subListEl.append(aEl); // append to sub list
      }
      this.listEl.append(aEl); // append to all list
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
      this.subListEl.show();
      this.urlListState = 1;
      this.labelEl.html("new");
    } else if(this.urlListState == 1) {  // current state is first 10 urls, move to state 2, show all urls
      this.subListEl.hide();
      this.listEl.show();
      this.urlListState = 2;
      this.labelEl.html("all");
    } else if(this.urlListState == 2) {  // current state is all urls, move to state 0, hide list
      this.listEl.hide();
      this.urlListState = 0;
      this.labelEl.html("off");
    }
  },

  /**
  * Add the new created url to the top of the list.
  * @param 'data' key/value object contains the url and text
  */
  addToUrlList: function(data) {
    var currentRef = window.location.href;  // current url
    var hashIndex = currentRef.indexOf('#');  // index of '#' if exist
    currentRef = hashIndex != -1?currentRef.substring(0, hashIndex):currentRef; // current url without # part
    var ref = currentRef + "#" + data.url;  // new url
    var aEl = "<br><a href='" + ref + "'>" + data.text + "</a>";  // construct <a> element represents the new url
    // append to sub list
    this.subListEl.prepend(aEl); // append to sub list
    if(this.subListEl[0].childNodes.length >= this.subListLength *2) { // if list elements reache to limit(*2 to count <br> tags)
      this.subListEl[0].childNodes[(this.subListLength*2)+1].remove(); // remove last <a> element from the list
      this.subListEl[0].childNodes[this.subListLength*2].remove(); // remove last <br> element from the list
    }
    this.listEl.prepend(aEl); // append to all list
    this.urlList.push(data);  // Update urlList object
  }
});