/**
* FirebaseHandler class handles all firebase operations
*/
FirebaseHandler = Class.$extend({
  /**
  * Initilize class variables (classy.js is used for class creation)
  */
  __init__: function() {
    this.firebaseRef = "https://readfm.firebaseio.com/";  // firebase reference url
  },

  /**
  * Load data from firebase according to the given query.
  * @param 'query' the query for data retrieval
           'callback' callback function
  */
  query: function(query, callback) {
    query.once("value", function(data) {  // query firebase for data
      callback(data.val());
    });
  },

  /**
  * Load data of the given firebase ref.
  * @param 'ref' firebase reference for data retrieval
           'callback' callback function
           'callbackValue' callback value needed to be returned with the callback function
  */
  get: function(ref, callback, callbackValue) {
    new Firebase(this.firebaseRef+ref).once('value', function(dataSnapshot) {  //callback
      callback(dataSnapshot.val(), callbackValue);  // callback with data retrieved
    });
  },

  /**
  * Remove referenced data from firebase
  * @param 'ref' firebase reference for data to be removed
  */
  remove: function(ref) {
    new Firebase(this.firebaseRef+ref).remove();
  },

  /**
  * Push data to the given reference.
  * @param 'ref' firebase reference for data save
           'data' data to be saved
  * @return name of saved data
  */
  push: function(ref, data) {
    var addedRef = new Firebase(this.firebaseRef+ref).push(data);
    return addedRef.name();
  },

  /**
  * Set data to the given reference.
  * @param 'ref' firebase reference for data save
           'data' data to be saved
  * @return name of saved data
  */
  set: function(ref, data) {
    new Firebase(this.firebaseRef+ref).set(data);
  }
});