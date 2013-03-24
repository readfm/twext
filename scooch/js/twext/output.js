//if(typeof Twext.Output != "object") Twext.Output = {};

//window.str_replace = Twext.String.Replace;

/*Twext.Output.Html = function(s){
    var tpl_box="{paras}";
    var tpl_line= "{chunks}<div class=\"line-break\"></div><div id=\"line_num{linenum}\"></div>";
    var tpl_paras= "{lines}<div class=\"para-break\"></div>";
    var tpl_chunk= "<div id=\"ch_l{chunknum}\" class=\"chunk x-unselectable\">{text}{twext}</div>";
    var tpl_chunk_el= "<div class= \"{class}\">{text}</div>";
    var text_class= "text";
    var twext_class= "twext";

    if(!s){ return ''; }

    var html = [];
    var chunks = [];
    var lines = [];
    var paras = [];

    var linenum = 1;
    var chunknum = 0;


    for(var i = 0 ; i < s.length ; i++){
        chunknum++;

        var chunk = s[i];


        if(typeof chunk == 'object'){
            var t = (!empty(chunk[0])) ? chunk[0] : '&nbsp;';
            var w = (!empty(chunk[1])) ? chunk[1] : '&nbsp;';
            var text = str_replace(['{class}','{text}'],[text_class,t],tpl_chunk_el);
            var twext = str_replace(['{class}','{text}'],[twext_class,w],tpl_chunk_el);

            html.push(str_replace(['{chunknum}','{text}','{twext}'],[chunknum,text,twext],tpl_chunk));
        }else{
            if(chunk==0){
                linenum++;
                html.push(str_replace(['{chunks}','{linenum}'],['',linenum],tpl_line));
            }else{
                chunknum++;
                linenum=linenum+2;
                html.push(str_replace(['{lines}','{linenum}'],['',linenum],tpl_paras));
            }
        }

    }

    return str_replace('{paras}',html.join(' '),tpl_box);
}*/