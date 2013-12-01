/**
* Class carry all translation stuff.
* Translation is done using Microsoft translator API(Bing).
* Access Token is the api key used for translation operation. The access token is obtained by running a PHP script that gets the token and save it into firebase. This script is scheduled on the server to run every six minutes(any period less than 10 mins) to renew the access token; that's because the access token is expired after 10 mins from its creation time.
* The token is valid for use within its 10 mins life period, even if a new token is generated before the old one is expired. So, if in any chance the user requested a translation while the token is generated and before saving it into firebase, the translate request will be sent with the old token which is still valid(because only 6 minutes passed from its creation, still has more 4 minutes).
*/
Translation = Class.$extend({
  /**
  * Initialize class variables.
  */
  __init__:function () {
    this.accessToken = ""; // set Bing api access token
    this.baseUrl = "http://api.microsofttranslator.com/";  // Bing api url
    this.apiVersion = 'V2'; // google api version
    this.apiInterface = 'Ajax.svc'; // The api interface
    this.translate_successCallback;  // callback method to be called when translate is done to return to toggle.data translate success callback
    this.translate_errorCallback; // callback method to be called when error occurs in translate to return to toggle.data translate error callback
    this.detect_successCallback;  // callback method to be called when detect language is done to return to toggle.data detect success callback
    this.detect_errorCallback;  // callback method to be called when error occurs in detect language to return to toggle.data detect error callback
  },

  /**
  * Put parameters in the form of string to be appended to the google url(eg: "param1=value1&param2=value2")
  * @param 'params' the parameters
  * @return string of url parameters
  */
  _obj2params:function (params) {
    var q = [], i= 0, len = params.length;
    $.each(params, function(k, v) { // loop over params
      q.push(k + "=" + v);  // add param=value into the array
    });
    return q.join('&'); // return string of params key=value form separated by &
  },

  /**
  * Create google api url.
  * @param 'fnc' google api function(eg: translate)
           'params' url parameters(if any)
  * @return created url
  */
  _makeUrl: function(fnc, params){
    if(typeof params == 'object') params = '?'+this._obj2params(params);  // get paramaters to append to url(if any)
    else params = ''; // no parameters
    return this.baseUrl + this.apiVersion + '/' + this.apiInterface + '/' + fnc + params; // return created url
  },

  /**
  * Set the access token. The access token is retrieved from firebase in toggle.data.js and set in this class when a translate request is needed.
  * @param 'accessToken' bing api access token
  */
  setAccessToken: function(accessToken) {
    this.accessToken = accessToken?accessToken:"";  // set access token
  },

  /**
  * Detect text language using Bing api.
  * Set detect callbacks and call detect method which send bing request.
  * @param 'text' text used to detect source language
           'callback' function where request return after success
           'errorback' function where request return on error
  */
  /*detectTextLanguage: function(text, callback, errorback) {
    this.detect_successCallback = callback; // set the success callback method to be called in detect success callback(to return to toggle)
    this.detect_errorCallback = errorback; // set the error callback method to be called in detect error callback(to return to toggle)
    this.detect(text); // translate text
  },*/

  /**
  * Detect text language using Bing api.
  * @param 'text' source text to be translated
  */
  /*detect: function(text) {
    TRANSLATOR = this;  // Global varibale represents this class, needed for the created script to detect the callback method in this class
    // Parameters needed for detect language request
    var params = {
      'appId': 'Bearer ' + encodeURIComponent(this.accessToken),  // The access token
      'text': encodeURIComponent(text), // text used to detect source language
      'contentType': encodeURIComponent('text/plain'), // content format
      'oncomplete': 'TRANSLATOR.detectSuccessCallback',  // on complete callback
      'onerror': 'TRANSLATOR.detectErrorCallback' // on error callback
    };
    var url = this._makeUrl('Detect', params); // create request url
    var s = document.createElement("script"); // create script
    s.src = url;  // set the src url
    document.body.appendChild(s); // add the script to the DOM, the script is execued and the request is sent
    document.body.removeChild(s); // remove the script
  },*/

  /**
  * Detect callback on success. Bing api calls this method with the response(text language) after request processing.
  * This method calls the success callback in the toggle class, which required the detect request
  * @param 'response' text language
  */
  /*detectSuccessCallback: function(response) {
    this.detect_successCallback(response);  // return to toggle.data success callback method
  },*/

  /**
  * Detect callback on error. Bing api calls this method with the error message if error occurs while detection.
  * This method calls the error callback in the toggle class, which required the detect request
  * @param 'msg' error message
  */
  /*detectErrorCallback: function(msg) {
    this.detect_errorCallback(msg); // return to toggle.data error callback method
  },*/

  /**
  * Translate html(text in html form) using Bing translate api.
  * Translator api cannot detect new lines (\n), so the text is converted to html(replace /n by <br> tag), translate, convert it back to text new lines in the callback.
  * @param 'text' source text to be translated
           'target' target language
           'callback' function where request return after success
           'errorback' function where request return on error
  */
  translateWithFormat: function(text, target, callback, errorback) {
    text = text.replace(/\n/g,"<br>"); // convert text into html
    this.translate_successCallback = callback; // set the success callback method to be called in translate success callback(to return to toggle)
    this.translate_errorCallback = errorback; // set the error callback method to be called in translate error callback(to return to toggle)
    this.translate(text, target); // translate text
  },

  /**
  * Translate text using Bing translate api
  * @param 'text' source text to be translated
           'target' target language code
  */
  translate: function(text, target) {
    TRANSLATOR = this;  // Global varibale represents this class, needed for the created script to detect the callback method in this class
    // Parameters needed for translate request
    var params = {
      'appId': 'Bearer ' + encodeURIComponent(this.accessToken),  // The access token
      'to': encodeURIComponent(target), // the target language
      'text': encodeURIComponent(text), // the text to be translated
      'contentType': encodeURIComponent('text/html'), // content format
      'oncomplete': 'TRANSLATOR.translateSuccessCallback',  // on complete callback
      'onerror': 'TRANSLATOR.translateErrorCallback'  // on error callback
    };
    var url = this._makeUrl('Translate', params); // create request url
    var s = document.createElement("script"); // create script
    s.src = url;  // set the src url
    document.body.appendChild(s); // add the script to the DOM, the script is execued and the request is sent
    document.body.removeChild(s); // remove the script
  },

  /**
  * Translate callback on success. Bing api calls this method with the response(translated text) after request processing.
  * This method calls the success callback in the toggle class, which required the translate request
  * @param 'response' translated text
  */
  translateSuccessCallback: function(response) {
    response = response.replace(/\<br\>/g, "\n");  // converts the response from html back to normal text
    this.translate_successCallback(response);  // return to toggle.data success callback method
  },

  /**
  * Translate callback on error. Bing api calls this method with the error message if error occurs while translation.
  * This method calls the error callback in the toggle class, which required the translate request
  * @param 'msg' error message
  */
  translateErrorCallback: function(msg) {
    this.translate_errorCallback(msg);  // return to toggle.data error callback method
  }
});