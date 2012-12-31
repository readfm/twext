describe('scooch line tests', function(){

  it("gets index for words", function(){
			var line = "Ja- son is go- ing to the store.";
			//starts:   0       8  11      19 22  26
			var sc = new ScoochEditorLine(line);
			var idx = sc.words();

			expect(idx).toBeDefined();
			expect(idx).not.toBeFalsy();
			expect(idx.length).toBe(6);
			expect(idx[0]).toBe(0);
			expect(idx[1]).toBe(8);
			expect(idx[2]).toBe(11);
			expect(idx[3]).toBe(19);
			expect(idx[4]).toBe(22);
			expect(idx[5]).toBe(26);
  });


  it("index for words separated by more than a space", function(){
			var line = "Ja- son is  go-  ing to  the    store ";
			//starts:   0       8   12   17  21  25     32
			var sc = new ScoochEditorLine(line);
			var idx = sc.words();

			expect(idx).toBeDefined();
			expect(idx.length).toBe(7);
			expect(idx[0]).toBe(0);
			expect(idx[1]).toBe(8);
			expect(idx[2]).toBe(12);
			expect(idx[3]).toBe(17);
			expect(idx[4]).toBe(21);
			expect(idx[5]).toBe(25);
			expect(idx[6]).toBe(32);
  });

});

describe('scooch lines operations', function(){

  it("detects chunks", function(){
    var lines = new ScoochEditorLines();
    lines.setLine(0,new ScoochEditorLine("this is a line that can go  thru every thing"));
    lines.setLine(1,new ScoochEditorLine("and  this one is a standart text with short word"));
    //                                    0    5                      28
    var chunks = lines.chunks();
    expect(chunks).toBeDefined();
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toBe(0);
    expect(chunks[1]).toBe(5);
    expect(chunks[2]).toBe(28);
  });
  
  it("supports starting line with space", function(){
    var lines = new ScoochEditorLines();
    lines.setLine(0,new ScoochEditorLine("this is a  line ok x"));
    lines.setLine(1,new ScoochEditorLine(" and this  one  is y"));
    //                                               11   16
    var chunks = lines.chunks();
    expect(chunks).toBeDefined();
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(11);
    expect(chunks[1]).toBe(16);
  });
  
  it("finds chunks after index min", function(){
    var lines = new ScoochEditorLines();
    lines.setLine(0,new ScoochEditorLine("my  understanding of scooch is that we realign after every scooch"));
    lines.setLine(1,new ScoochEditorLine("so  we never end up with big                   spaces      between"));
    //                                    0   4                                          47          59
    var chunks = lines.chunks();
    expect(chunks).toBeDefined();
    expect(chunks.length).toBe(4);
    expect(chunks[0]).toBe(0);
    expect(chunks[1]).toBe(4);
    expect(chunks[2]).toBe(47);
    expect(chunks[3]).toBe(59);
  });

  it("finds chunks on ratio size", function(){
    var lines = new ScoochEditorLines(2);
    lines.setLine(0,new ScoochEditorLine("my  understanding after every scooch"));
    lines.setLine(1,new ScoochEditorLine("so      we never end                spaces                  between"));
    //                                    0   4             18          30
    var chunks = lines.chunks();
    expect(chunks).toBeDefined();
    expect(chunks.length).toBe(4);
    expect(chunks[0]).toBe(0);
    expect(chunks[1]).toBe(4);
    expect(chunks[2]).toBe(18);
    expect(chunks[3]).toBe(30);
  });


});

describe('scooch pull chunk on ratio', function(){

  it('merges from chunk into previous on second line', function(){
        var lines = new ScoochEditorLines(2);
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a       bee cdefghijk       d", 2));
        var response = lines.pullChunk(false,8);//at 'bee...' at second line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one two three four");
        expect( response[1]).toBe("a bee cdefghijk             d       ");
        expect( lines.cursor_offset ).toBe(2);
  });


  it('makes new chunk from first line', function(){
        var lines = new ScoochEditorLines(2);
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a       bee cdefghijk d", 2));
        var response = lines.pullChunk(true,8);//at 'bee...' at second line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one two three four");
        expect( response[1]).toBe("a       bee     cdefghijk d         ");
        expect( lines.cursor_offset ).toBe(8);
  });

  it('pull into new chunk on second line', function(){
        var lines = new ScoochEditorLines(2);
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a       bee cdefghijk       d", 2));
        var response = lines.pullChunk(false,28);//at 'd' at second line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one two     three four");
        expect( response[1]).toBe("a       bee cdefghijk   d                   ");
        expect( lines.cursor_offset ).toBe(24);
  });

});


describe('scooch pull chunk', function(){

  it('pull into previous chunk on second line', function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("one two three     four"));
        lines.setLine(1, new ScoochEditorLine("a   bee cdefghijk d"));
        var response = lines.pullChunk(false,4);//at 'bee...' at second line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one two three   four");
        expect( response[1]).toBe("a bee cdefghijk d   ");
        expect( lines.cursor_offset ).toBe(2);
  });

  it('pull into no chunk on first line', function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("one two three      four"));
        lines.setLine(1, new ScoochEditorLine("a   bee cdefg hijk d"));
        var response = lines.pullChunk(true,19);//at 'four..' at first line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one two three  four  ");
        expect( response[1]).toBe("a   bee cdefg  hijk d");
        expect( lines.cursor_offset ).toBe(15);
  });

  it('pull into merge', function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("amigos la  pequena cabana hoy quiero       "));
        lines.setLine(1, new ScoochEditorLine("darles de  lante con mi nueva super cancion"));
        var response = lines.pullChunk(false,11);//at 'four..' at first line
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("amigos    la pequena cabana hoy quiero    ");
        expect( response[1]).toBe("darles de lante con mi nueva super cancion");
        expect( lines.cursor_offset ).toBe(10);
  });

   it('pull some more word',function(){
       var a = "hola ami guis del alma",
           b = "que hoy quere     mos di amo";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(true,18);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("hola ami guis del alma            ");
        expect( response[1]).toBe("que hoy           quere mos di amo");
        expect( lines.cursor_offset ).toBe(18);
   });

    it('pulls for next word if cursor in empty', function(){
      var a = "a one  and a two",
          b = "and a  three";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,5);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a     one and a two");
        expect( response[1]).toBe("and a three        ");
        expect( lines.cursor_offset ).toBe(6);
    });

    it('pulls for first word', function(){
      var a = "a first word",
          b = "  second after";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,2);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a first word");
        expect( response[1]).toBe("second after");
        expect( lines.cursor_offset ).toBe(0);
    });


    it('pulls from last word no chunk', function(){
      var a = "a breaking word",
          b = "second after";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,7);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a      breaking word");
        expect( response[1]).toBe("second after        ");
        expect( lines.cursor_offset ).toBe(7);
    });

    it('pulls last word into new chunk', function(){
      var a = "a breaking word",
          b = "second balblabla after";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,17);//^after
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a breaking       word ");
        expect( response[1]).toBe("second balblabla after");
        expect( lines.cursor_offset ).toBe(17);
    });

    it('pulls last word from no chunk', function(){
      var a = "after  every scooch",
          b = "spaces and   a between";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,15);//^between
        expect( response.length ).toBe(2);
        expect( response[0]).toBe( "after  every  scooch " );
        expect( response[1]).toBe( "spaces and a  between" );
        expect( lines.cursor_offset ).toBe(14);
    });

    it('pulls last word from no chunk', function(){
      var a = "after  every scooch",
          b = "spaces and   a between";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pullChunk(false,15);//^between
        expect( response.length ).toBe(2);
        expect( response[0]).toBe( "after  every  scooch " );
        expect( response[1]).toBe( "spaces and a  between" );
        expect( lines.cursor_offset ).toBe(14);
    });


});

describe('scooch push chunk on ratio', function(){

   it('push for new last chunk',function(){
       var a = "one ha 2 four",
           b = "a       b cdefgh d";
        var lines = new ScoochEditorLines(2);
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b, 2));
        var response = lines.pushChunk(true,7);//^2 to chunk ^d
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one ha   2 four");
        expect( response[1]).toBe("a       b cdefgh  d           ");
        expect( lines.cursor_offset ).toBe(9);
   });

    it('push last chunk for second line',function(){
        var lines = new ScoochEditorLines(2);
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a       bee     cdefgh d", 2));
        var response = lines.pushChunk(false,16);//^cdefgh
        expect(response).not.toBe(-1);
        expect( response.length).toBe(2);
        expect( response[0]).toBe("one two three four");
        expect( response[1]).toBe("a       bee                 cdefgh d");
        expect( lines.cursor_offset ).toBe(28);
    });

});


describe('scooch push chunk', function(){

   it('push for new last chunk',function(){
       var a = "one ha 2 four",
           b = "a   b cdefgh d";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(true,7);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one ha       2 four");
        expect( response[1]).toBe("a   b cdefgh d     ");
        expect( lines.cursor_offset ).toBe(13);
   });

   it('breaks new last chunk after really long word',function(){
       var a = "onereallylongword 2 four",
           b = "a                 cdefgh d";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(true,18);//^2
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("onereallylongword 2 four");
        expect( response[1]).toBe("a cdefgh          d     ");
        expect( lines.cursor_offset ).toBe(18);
   });

    it('push for last chunk on common word index',function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a   bee cdefgh d"));
        var response = lines.pushChunk(true,8);
        expect(response).not.toBe(-1);
        expect( response.length).toBe(2);
        expect( response[0]).toBe("one two        three four");
        expect( response[1]).toBe("a   bee cdefgh d         ");
        expect( lines.cursor_offset ).toBe(15);
    });

    it('push last chunk for second line',function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("one two  three four"));
        lines.setLine(1, new ScoochEditorLine("a   bee  cdefgh d"));
        var response = lines.pushChunk(false,9);
        expect(response).not.toBe(-1);
        expect( response.length).toBe(2);
        expect( response[0]).toBe("one two three four    ");
        expect( response[1]).toBe("a   bee       cdefgh d");
        expect( lines.cursor_offset ).toBe(14);
    });

    it('push chunk on last chunk',function(){
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine("one two three four"));
        lines.setLine(1, new ScoochEditorLine("a   b   cdefgh d"));
        var response = lines.pushChunk(true,8);
        expect(response).not.toBe(-1);
        expect( response.length).toBe(2);
        expect( response[0]).toBe("one two      three four");
        expect( response[1]).toBe("a   b cdefgh d         ");
        expect( lines.cursor_offset ).toBe(13);
    });

   it('push into last chunk',function(){
       var a = "one hoo        2axy four",
           b = "a   bee cdefgh d";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,8);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one hoo  2axy four");
        expect( response[1]).toBe("a   bee  cdefgh d ");
        expect( lines.cursor_offset ).toBe(9);
   });

   it('push from no chunk into new one',function(){
       var a = "one hoo      2axy four",
           b = "a bee cdefgh d e  i";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,2);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one hoo        2axy four");
        expect( response[1]).toBe("a   bee cdefgh d e  i   ");
        expect( lines.cursor_offset ).toBe(4);
   });

   it('push from one chunk into another',function(){
       var a = "one  hoo  2axy   four",
           b = "alo  bee  cdefgh d";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,5);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("one hoo 2axy       four");
        expect( response[1]).toBe("alo     bee cdefgh d   ");
        expect( lines.cursor_offset ).toBe(8);
   });

    it('pushes next word if cursor is in empty', function(){
      var a = "a one  and a two",
          b = "and a  three";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,6);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a one and a two");
        expect( response[1]).toBe("and a     three");
        expect( lines.cursor_offset ).toBe(10);
    });

   it('push not allowed after last word',function(){
       var a = "one two three",
           b = "a bout  to";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,8);
        expect( response ).toBe(false);
   });

   it('push not allowed after last word in middle string',function(){
       var a = "one two three",
           b = "a bout  to";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,7);
        expect( response ).toBe(false);
   });

    it('pushes first word', function(){
        var a = "a one and a two",
            b = "and a three";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,0);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("a one and a two");
        expect( response[1]).toBe("  and a three  ");
        expect( lines.cursor_offset ).toBe(2);
    });

   it('realigns last chunks',function(){
       var a = "my  under    of scooch is that we real after ev scoo   ",
           b = "so  we never end up with big   spaces           between";
        var lines = new ScoochEditorLines();
        lines.setLine(0, new ScoochEditorLine(a));
        lines.setLine(1, new ScoochEditorLine(b));
        var response = lines.pushChunk(false,31);
        expect( response.length ).toBe(2);
        expect( response[0]).toBe("my  under    of scooch is that we real after ev scoo   ");
        expect( response[1]).toBe("so  we never end up with big      spaces        between");
        expect( lines.cursor_offset ).toBe(34);
   });

});


