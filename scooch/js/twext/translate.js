//jquery & jquery.jsonp.js is required.

Twext.Translation = Class.$extend({

    __init__:function (google_api_key) {
        this.apiKey = google_api_key;
        this.baseUrl = "https://www.googleapis.com/language/";
        this.apiVersion = 'v2';
    },

    _obj2params:function (params) {
        params.key = this.apiKey;
        var q = [], i= 0, len = params.length;
        $.each(params, function(k, v){
            q.push(k + "=" + v);
        });
        return q.join('&');
    },

    _addKey: function(data){
        data.key = this.apiKey;
        return data;
    },

    _makeUrl: function(fnc,params){
        if(typeof params == 'object') params = '?'+this._obj2params(params);
        else params = '';
        return this.baseUrl+fnc+'/'+this.apiVersion+params;
    },

    _empty: function(val){
        return val==null || val==undefined || val=='';
    },

    languages:function (callback,errorback) {
        var url = this._makeUrl('languages',{});
        $.jsonp({
            url: url,
            cache: true,
            pageCache: true,
            success: callback || null,
            error: errorback || null
        });
    },

    detect: function(text,callback,errorback){
        if(this._empty(text)) return errorback ? errorback() : false;
        var url = this._makeUrl('detect',{q:text});
        $.jsonp({
            url:url,
            cache: true,
            pageCache:true,
            success: callback || null,
            error: errorback || null
        });
    },

    translate: function(text,source,target,callback,errorback,format){
        if(this._empty(text) || this._empty(source) || this._empty(target)) return errorback ? errorback() : false;
        var data = {q:text,source:source,target:target};
        if(format) data.format=format;
        var url = this._makeUrl('translate');
        console.log(url);
        $.jsonp({
            url:url,
            data:this._addKey(data),
            callbackParameter: "callback",
            success: callback || null,
            error: errorback || null
        });
    },

    translateWithFormat: function(text,source,target,callback,errorback){
        //Todo: Normalize new lines
        var text2 = text.replace(/\n/g,"<br>");
        var newcallback = function(r){
            if(r && r.data && r.data.translations){
                var d = r.data.translations[0].translatedText;
                r.data.translations[0].translatedText = d.replace(/\<br\>/g,"\n");
            }
            callback(r);
        };
        this.translate(text2,source,target,newcallback,errorback,'html');

    }

});