
describe("scooch area with divs", function(){
  var scooch_div;
  var area;
  
  var set_content = function(area_html){
    var area_content = $(area_html);
    scooch_div = new ScoochArea( area_content );
    area = scooch_div.area[0];
  }

  it("parses div span br for text lines", function(){
    var line_1 = "standard line to test from html";
    var line_2 = "line with more   consecutive   spaces";
    var content_cases = [
      "<div><div>" + line_1 + "</div><div>" + line_2 + "</div></div>",
      "<div><span>" + line_1 + "</span><br><span>" + line_2 + "</span></div>",
      "<div>" + line_1 + "<br>" + line_2 + "</div>",
      "<div><div>" + line_1 + "</div><br><div>" + line_2 + "</div></div>",
      "<div><div>" + line_1 + "</div><br><span>" + line_2 + "</span></div>"
    ];
    for(var i = 0; i < content_cases.length; i++){
      set_content( content_cases[i] );
      expect( area ).not.toBeNull();
      var lines = new Array();
      scooch_div.parse_text_lines( area.childNodes, lines);
      expect( lines.length ).toBe( 2 );
      expect( lines[0] ).toBe( line_1 );
      expect( lines[1] ).toBe( line_2 );
    }
  });

  it("cursor handling", function(){
  
  });

});
  
