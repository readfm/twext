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
  * Load data of the given firebase ref.
  * @param 'ref' firebase reference for data retrieval
           'callback' callback function
           'callbackValue' callback value needed to be returned with the callback function
  */
  get: function(ref, callback, callbackValue) {
    new Firebase(this.firebaseRef+ref).once('value', function(dataSnapshot) {  //callback
      callback(dataSnapshot.val(), callbackValue);  // callback with data retrieved
    });
  }
});