queryWriter = function(div){
    
    this.supContainer = $("#" + div);
    this.supContainer.addClass("col-xs-9");
    this.supContainer.css( {
                            "overflow":"hidden",
                            "height" : this.supContainer.parent().css("height"),
                            "background-color" : "transparent",
                            "padding" : "0",
                            "border-bottom-right-radius": "3px",
                            "border-left" : "none",
                            "float": "right"
                        });
    
    this.container = $("<div>", { id : "queryWriterContainer"});
    //this.container.css( "height", this.supContainer.css("height"));
    this.container.css( "height", "100%");
    this.container.addClass("queryWriterContainer");
    this.supContainer.append(this.container);

    this.backdrop = $("<div>", { id : "queryWriterBackdrop"});
    this.backdrop.addClass("queryWriterBackdrop");
    this.container.append(this.backdrop);

    this.highlights  = $("<div>", { id : "queryWriterHighlights"});
    this.highlights.css( "height",this.container.css("height"));
    this.highlights.addClass("queryWriterHighlights");
    this.backdrop.append(this.highlights);

    this.textarea = $("<textArea>", { id:"queryWriterTextarea", spellcheck:"false" }) 
    this.textarea.addClass("queryWriterTextarea");
    this.textarea.css( "height", this.highlights.css("height"));
    this.container.append(this.textarea);

    this.queryResult = new queryResult();
    this.supContainer.append(this.queryResult.container);

    this.Intellisense = null;
  
    if (isIOS) {
        this.highlights.css({
            'padding-left': '+=3px',
            'padding-right': '+=3px'
          });
    }
}

queryWriter.prototype.Init = function(newKeywords){
    this.sqlKeyWords = (newKeywords.keywords != undefined ? sqlKeyWords.concat(newKeywords.keywords) : sqlKeyWords); 
    this.sqlDataTypes = (newKeywords.dataTypes != undefined ? sqlDataTypes.concat(newKeywords.dataTypes) : sqlDataTypes); 
    this.sqlStoreProcedures = (newKeywords.storeProcedures != undefined ? sqlStoreProcedures.concat(newKeywords.storeProcedures) : sqlStoreProcedures); 
    this.sqlFunctions = (newKeywords.functions != undefined ? sqlFunctions.concat(newKeywords.functions) : sqlFunctions); 
    this.FormatIntellisense();

    this.sqlKeyWordsRegExp = this.FormatKeyWords(this.sqlKeyWords.concat(this.sqlDataTypes));
    this.sqlFunctionsRegExp = this.FormatKeyWords(this.sqlFunctions);
    this.sqlStoreProceduresRegExp = this.FormatKeyWords(this.sqlStoreProcedures);
    this.sqlSpecialFunctionsRegExp = this.FormatKeyWords(sqlSpecialFunctions);
    
    this.Intellisense = new Intellisense("", 0, this,"");
    
    var _queryWriter = this
    this.supContainer.bind("click", function(event){
        _queryWriter.Intellisense.Kill();
        _queryWriter.textarea.focus(); 
        _queryWriter.Input(event);
       });

   this.textarea.bind("input", function(event){ _queryWriter.Input(event) }); 
   this.textarea.bind("keyup", function(event){ _queryWriter.KeyUp(event) }); 
   this.textarea.bind("keydown", function(event){ _queryWriter.KeyDown(event) });
   this.textarea.bind("scroll", function(event){ _queryWriter.Scroll(event) }); 

   setInterval(function(){
       if( $(".v-caret").css("visibility") == "hidden" ? $(".v-caret").css("visibility","visible") :  $(".v-caret").css("visibility","hidden") );
   },750);
   this.textarea.focus();
}

queryWriter.prototype.FormatIntellisense = function(){
    
    this.intelliWords = [];
    this.sqlKeyWords.forEach(function(keyword){
        const inteliword = [keyword, keyWordIcon];
        this.intelliWords.push(inteliword);
    },this);
    this.sqlDataTypes.forEach(function(keyword){
        const inteliword = [keyword, dataTypeIcon];
        this.intelliWords.push(inteliword);
    },this);
    this.sqlStoreProcedures.forEach(function(keyword){
        const inteliword = [keyword, storeProcedureIcon];
        this.intelliWords.push(inteliword);
    },this);
    this.sqlFunctions.concat(sqlSpecialFunctions).forEach(function(keyword){
        const inteliword = [keyword, functionIcon];
        this.intelliWords.push(inteliword);
    },this);
   
}

queryWriter.prototype.DBDataIntellisense = function(json){
     this.DBIntelliwords = json;
}
queryWriter.prototype.Input = function(e){
    const caretPos = this.textarea.get(0).selectionStart;
    const end = this.textarea.get(0).selectionEnd;
    
    if(caretPos != end){
        return; // Ante la seleccion de texto, no formateo nada
    }
    let text = this.textarea.val(); 
    let textToFindWord = text.substring(0,caretPos);

    let word = textToFindWord.substring(textToFindWord.lastIndexOf(" "),caretPos);
    word = word.substring(word.lastIndexOf("\n"),word.length).trim();

    const wordLimitChar = ["\r","\n",""," ",",","(",")","@","-","+","*","<",">","'","=","%"];
    const charAfterWord = text.substr(caretPos,1);
    let charBeforeWord = "";

    word.split("").forEach(function(char){
        if(wordLimitChar.indexOf(char) > -1) {
            charBeforeWord = char;
        }
    },this);
    
    if(charBeforeWord!= ""){
        word = word.substring(word.lastIndexOf(charBeforeWord)+1,word.length);
    }
    text = text.substring(0,caretPos) + "~" + text.substring(end);
    const highlightedText = this.Format(text);
    this.highlights.html(highlightedText);
    
     if((wordLimitChar.indexOf(charAfterWord) >= 0 & wordLimitChar.indexOf(charBeforeWord) >= 0)) {
        //if( e.key == "Tab" ){
     if(e.ctrlKey && (e.keyCode == 32 || e.key == " " )){
            this.InputForIntellisenseDB(word,caretPos);
        } else if(word.length >= 3){
            this.Intellisense = new Intellisense(word,caretPos,this,"default");
            this.Intellisense.Draw();
            this.Intellisense.Focus();
        }
    }
}

queryWriter.prototype.InputForIntellisenseDB = function(word,caretPos){

    let text = this.textarea.val();
    let textfindSelect = text.substr(0,caretPos);
    
    let selectPos = textfindSelect.toUpperCase().lastIndexOf("SELECT");
    let selectFromPos = textfindSelect.toUpperCase().lastIndexOf("FROM");
    
    let textfindFrom = text.substr(selectPos,text.length);
    let fromPos = textfindFrom.toUpperCase().indexOf("FROM");
    // arranco en 6 xq el texto siempre empieza por "SELECT"
    let fromSelectPos = textfindFrom.toUpperCase().indexOf("SELECT",6);
    //Si desde donde esta el cursor hacia el principio encuentro un FROM antes que un SELECT, no hay contexto.
    //Si desde donde esta el cursor hacia el final encuentro un SELECT antes que un FROM, no hay contexto.
    /*console.log("Select -> pos: " + selectPos);
    console.log("selectFrom -> pos: " + selectFromPos);
    console.log("From -> pos: " + fromPos);
    console.log("fromSelect -> pos: " + fromSelectPos);*/
    fromPos = ((fromSelectPos < fromPos & fromSelectPos != -1) ? -1 : fromPos);
    selectPos = ((selectFromPos > selectPos & selectFromPos != -1) ? -1 : selectPos);
    //Para que haya contexto el cursor debe estar posicionado entre "SELECT" y "FROM" y una Base.dbo.Tabla
    /*
    console.log("Select -> pos: " + selectPos);
    console.log("From -> pos: " + fromPos);
    */
    let wordArr = word.split(".");
    let patternTree = { db : "", tbl:"", col: "" }
    
    let contextExists = false;
    if(selectPos > -1 && fromPos > -1) {
        let selectFromText = text.substr(selectPos,fromPos+4);
        let dbContext =  text.substr(text.indexOf(selectFromText)+selectFromText.length+1);
        let dbContextTo = (dbContext.indexOf(" ") == -1 ? dbContext.length : dbContext.indexOf(" "));

        dbContext =  dbContext.substr(0,dbContextTo);
        console.log(dbContext);
        //dbContext = dbContext.substr(0,dbContext.lastIndexOf(".")+1);
        let dbContextArr = dbContext.split(".");

        contextExists = (dbContextArr[0] != undefined ? true : false);
        patternTree.db  = ((dbContextArr[0] != undefined & dbContextArr[0] != "" ) ? dbContextArr[0] : "");
        patternTree.tbl =  (dbContextArr[2] != undefined ? dbContextArr[2] : wordArr[0]);
        patternTree.col = (patternTree.tbl != "" ? wordArr[0] : "");
        
    //     console.log(dbContext);
    //     console.log(dbContextArr);
    //     console.log(patternTree);
    //     console.log(wordArr);
    //     console.log("fin")
        
    } 
    if(!contextExists)
    {
        console.log("sin context");
        patternTree.db = (wordArr[0] == undefined ? "" : wordArr[0]);
        patternTree.tbl = (wordArr[2] == undefined ? "" : wordArr[2]);
        patternTree.col = (wordArr[3] == undefined ? "*" : wordArr[3]);
    }
    console.log(patternTree);
       this.Intellisense = new Intellisense(patternTree,caretPos,this,"db",contextExists);
       this.Intellisense.Draw();
       this.Intellisense.Focus();
}
queryWriter.prototype.KeyDown = function(e){ 
    const preventKeys = ["F5","Tab"];
    //if( e.key == "Tab" ){
    if(e.ctrlKey && (e.keyCode == 32 || e.key == " " )){
     //capturo ctrl + space y fuerzo el input para buscar la palabra y abrir el intellisense DB
        this.Input(e);
    }
    if(preventKeys.indexOf(e.key) > -1 ) {
        e.preventDefault();
        if(e.key == "F5") {
            $("#runQuery").click();
        }
    } else if(e.key == "Escape") {
        this.Intellisense.Kill();
    }
}

queryWriter.prototype.KeyUp = function(e){
    /* Capturo solo las teclas que no entran por el evento Input y fuerzo el formateo del texto */ 
    //Arrows - End - Home(inicio) - PageDown(?) - PageUp(?)
        const validInputs = ["Home","End","PageDown","PageUp"];
        if(e.key.startsWith("Arrow") || validInputs.indexOf(e.key) >= 0) {
            this.Input(e);
        } 
}

queryWriter.prototype.Format = function(text) {
    const string = /'([^']*)'/gi;
    const inlineComment = /^--.*$/gm;
    const openComment = /(\/\*)/g;
    const closeComment = /(\*\/)/g;
    const caret = /[~]/;
    text = text
        .replace(/\n$/gi, '\n\n')
        .replace(/[<]/gi, "&lt")
        .replace(/[>]/gi, "&gt")
        .replace(string, '<span class="string">$&</span>')
        .replace(inlineComment, '<span class="comment">$&</span>')
        .replace(openComment, '<span class="comment">$&')
        .replace(closeComment, '$&</span>')
        .replace(this.sqlKeyWordsRegExp, '<span class="keyword">$&</span>')
        .replace(this.sqlFunctionsRegExp, '<span class="functions">$&</span>')
        .replace(this.sqlStoreProceduresRegExp, '<span class="storeProcedures">$&</span>')
        .replace(this.sqlSpecialFunctionsRegExp, '<span class="functions">$&</span>')
        .replace(caret,'<span class="v-caret"></span>');

    if (isIE) {
        // IE wraps whitespace differently in a div vs textarea, this fixes it//
        // Si es IE funciona como el orto ovbiamente, no podia ser de otra manera.
        // text = text.replace(/ /g, ' <wbr>');
        }
    return text;
}

queryWriter.prototype.FormatKeyWords = function(arrayKeyword){
    let arrayRet = [];
    arrayKeyword.forEach(function(element) {
       let newElement = "";
        element.split('').forEach(function(character){
            newElement += character + '([~]{0,1})';
        },this);
        newElement = newElement.substring(0,newElement.lastIndexOf("([~]{0,1})"));
        arrayRet.push(newElement);
    }, this);
    var regexStart = "([^@])\\b(";
    if(arrayKeyword[0].startsWith("@")) {
        regexStart = "(";
    } 
    var regex = new RegExp(regexStart + arrayRet.join("|") + ")\\b" ,"gi");
   return regex;
}

/* Refleja en el Div los movimientos del textarea */
queryWriter.prototype.Scroll = function(){
    const scrollTop = this.textarea.scrollTop();
    const scrollLeft = this.textarea.scrollLeft();
    this.backdrop.scrollTop(scrollTop);
    this.backdrop.scrollLeft(scrollLeft);  
    
}