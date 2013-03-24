/**
* Class carry all translation stuff.
*/
Twext.Translation = Class.$extend({
  /**
  * Initialize class variables.
  * @param 'google_api_key' google translate api key used for translation request
  */
  __init__:function (google_api_key) {
    this.apiKey = google_api_key; // set google api key
    this.baseUrl = "https://www.googleapis.com/language/";  // google api url
    this.apiVersion = 'v2'; // google api version
  },

  /**
  * Put parameters in the form of string to be appended to the google url(eg: "param1=value1&param2=value2")
  * @param 'params' the parameters
  * @return string of url parameters
  */
  _obj2params:function (params) {
    params.key = this.apiKey; // add google key to the params array
    var q = [], i= 0, len = params.length;
    $.each(params, function(k, v) { // loop over params
      q.push(k + "=" + v);  // add param=value into the array
    });
    return q.join('&'); // return string of params key=value form separated by &
  },

  /**
  * Add google api key to data.
  * @param 'data' data to be sent to google translate api
  * @return data after adding api key
  */
  _addKey: function(data){
    data.key = this.apiKey; // add api key to data
    return data;  // return data
  },

  /**
  * Create google api url.
  * @param 'fnc' google api function(eg: translate)
           'params' url parameters(if any)
  * @return created url
  */
  _makeUrl: function(fnc,params){
    if(typeof params == 'object') params = '?'+this._obj2params(params);  // get paramaters to append to url(if any)
    else params = ''; // no parameters
    return this.baseUrl + fnc + '/' + this.apiVersion + params; // return created url
  },

  /**
  * Check if text is empty.
  * @param 'val' text value
  * @return true if text is empty, false otherwise
  */
  _empty: function(val) {
    return val==null || val==undefined || val=='';
  },

  /**
  * Translate text with specific format using google translate api
  * @param 'text' source text to be translated
           'target' target language code
           'callback' function where request return after success
           'errorback' function where request return after fail
           'format' text format
  */
  translate: function(text, target, callback, errorback, format) {
    if(this._empty(text) || this._empty(target)) return errorback ? errorback() : false;  // if text is empty or target not specified, return error

    // Prepare request parameters
    var data = {q:text,target:target};  // text to be translated and target language
    if(format) data.format = format;  // text format(if specified)
    var url = this._makeUrl('translate'); // create request url
    console.log(url); // log request url
    // Send request to google translate api
    $.jsonp({
      url:url,
      data:this._addKey(data),
      callbackParameter: "callback",
      success: callback || null,
      error: errorback || null
    });
  },

  /**
  * Translate html(text in html form) using google translate api
  * @param 'text' source text to be translated
           'target' target language code
           'callback' function where request return after success
           'errorback' function where request return after fail
  */
  translateWithFormat: function(text, target, callback, errorback) {
    var text2 = text.replace(/\n/g,"<br>"); // convert text into html
    var newcallback = function(r) { // new callback to convert html back to text after translation and before going to callback method
      if(r && r.data && r.data.translations) { // text translated
        var d = r.data.translations[0].translatedText;  // translated text
        r.data.translations[0].translatedText = d.replace(/\<br\>/g,"\n");  // convert html into text
      }
      callback(r);  // go callback
    };
    this.translate(text2, target, newcallback, errorback, 'html'); // translate text
  }
});
/*languages:function (callback,errorback) {
        var url = this._makeUrl('languages',{});
        $.jsonp({
            url: url,
            cache: true,
            pageCache: true,
            success: callback || null,
            error: errorback || null
        });
    },*/
/*detect: function(text,callback,errorback){
        if(this._empty(text)) return errorback ? errorback() : false;
        var url = this._makeUrl('detect',{q:text});
        $.jsonp({
            url:url,
            cache: true,
            pageCache:true,
            success: callback || null,
            error: errorback || null
        });
    },*/