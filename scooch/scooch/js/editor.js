/**
 * Created by JetBrains PhpStorm.
 * User: Jason Tudisco
 * Date: 1/13/12
 * Time: 6:43 AM
 * To change this template use File | Settings | File Templates.
 */

$(function(){

    var editor = $('#editor');

    var spaceEditor = new ScoochEdit(document.getElementById("editor"));




    //TODO: remove everything below.. only for testing/playing. Leaving as an example. but soon will be gone.

    $("body, #editor").bind('keydown','f2',function(){
        alert("caret pos: "+spaceEditor.getCaretPos());
    });

    $("body, #editor").bind('keydown','f3',function(){
        alert("line pos: "+spaceEditor.getLinePos());
    });

    /*$("body, #editor").bind('keydown','f4',function(){
        var line = spaceEditor.getLinePos();
        if(line < 2) alert("Can't get previous line");
        alert("line pos: "+spaceEditor.getPreviousLine(line));
    });*/

    $("body, #editor").bind('keydown','f4',function(){
            /*var line = spaceEditor.getLinePos();
            if(line < 2) alert("Can't get previous line");
            alert("line pos: "+spaceEditor.getPreviousLine(line));
            console.log(spaceEditor.getWordPositionsForPreviousLine(line));*/

            //console.log(spaceEditor.getLineWordPositions("Jason is so cool"));

            if(console && console.log) console.log(spaceEditor.getLineCaretPos());
    });

});
