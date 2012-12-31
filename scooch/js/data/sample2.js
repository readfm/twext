

var blank = {
    title: "Demo 2",
    languages: []
};

var sample2main = "We're connecting ourselves with everyone else on earth,\n"+
    "with all human knowledge, and in all kinds of languages.\n"+
    "How can we learn each others' words?\n";
var sample2sp = "Nos estamos conectando con todos los demás en la tierra,\n"+
    "con todo el conocimiento humano, y en todas las clases de idiomas.\n"+
    "¿Cómo podemos aprender las palabras de los demás?";
var sample2fr = "Nous nous connecter avec tout le monde sur la terre,\n" +
    "avec toutes les connaissances humaines, et dans toutes sortes de langues.\n" +
    "Comment pouvons-nous apprendre des mots les uns des autres?";
var sample2Portuguese = "Estamos conectando-nos com toda a gente na terra,\n" +
    "com todo o conhecimento humano, e em todos os tipos de linguagens.\n" +
    "Como podemos aprender palavras uns dos outros?";

function meldLines(main,lang){
    var nl = /\n/g, main = main.split(nl),lang = lang.split(nl);
    var l = main.length, i, newdata = [];;
    for( i=0; i<l ; i++){
        newdata.push(main[i],lang[i]);
    }
    return newdata.join("\n");
}

sample2 = new Twext.ToggleData(blank);



sample2.addLanguage("spanish");
sample2.addVersion('1.0',meldLines(sample2main,sample2sp));

sample2.addLanguage("french");
sample2.addVersion('1.0',meldLines(sample2main,sample2fr));

sample2.addLanguage("Portuguese");
sample2.addVersion('1.0',meldLines(sample2main,sample2Portuguese));

//sample2.addLanguage("Portuguese");
//sample2.addVersion('1.0',meldLines(sample2main,sample2Portuguese));

var $useThisData = sample2;
var $useForTrans = sample2main;