var Intellisense = function(pattern,caretPos,context,type,DBContext){
    this.type = type;
    if(this.type.toUpperCase() == "DB") {
        this.InitDB(pattern,caretPos,context,DBContext);
    } else {
        this.InitDefault(pattern,caretPos,context);
    }
}
Intellisense.prototype.InitDB = function(pattern,caretPos,context,DBContext){ 
    // EJ. Web_Callcenter.dbo.Chart_Det.Cli
    //patternTree = { db : "Web_Callcenter", tbl:"Chart_Det", col: "Cli" }
    //db -> si es vacio listo todas las bases, sino las tablas de esa base
    //tbl -> si es vacio listo todas las tablas de la base, sino las columnas de esa tabla
    //col -> si es vacio listo todas las tablas, sino busco las coincidencias por Intellisense default
    console.log(DBContext)
    this.context = context;
    this.intelliDiv =  $("<div>", { id:"intellisense"});
    this.IntelliList = $("<select>", {id: "intellisenseList"});
    this.itemList = [];
    
    const Me = this;
    let inteliword = "";
    for (property in Me.context.DBIntelliwords) {
        //Bases
        if(property == "databases"){
           let databases = Me.context.DBIntelliwords[property];
           
           databases.forEach(function(_database) {
               if(_database.name.toUpperCase() == pattern.db.toUpperCase()) { 
                   //Tablas
                    for(dbProperty in _database ) {
                        if(dbProperty == "tables") {
                            let tables = _database[dbProperty]
                            tables.forEach(function(_table){
                                if(_table.name.toUpperCase() == pattern.tbl.toUpperCase()) { 
                                //Columnas 
                                    for(tblProperty in _table ) {
                                        if(tblProperty == "columns") {
                                            let columns = _table[tblProperty]
                                            columns.forEach(function(_column){
                                                if(_column.name.toUpperCase().startsWith(pattern.col.toUpperCase().replace("*",""))) {
                                                    let title = (_column.maxLength == ''
                                                                ?  _column.name + " [" + _column.dataType + "]" 
                                                                : _column.name + " [" + _column.dataType + ", " + _column.maxLength + "]")

                                                    $listItem = $("<option>", {
                                                        value: _column.name,
                                                        title: title,
                                                        css: {
                                                            background: "url(" + columnIcon.src + ")",
                                                            backgroundPosition: "center left",
                                                            backgroundRepeat: "no-repeat",
                                                            backgroundSize: columnIcon.width + "px " + columnIcon.height + "px",
                                                            paddingLeft: "20px"
                                                            }
                                                        }).html(_column.name);
                                                        let colName = ( pattern.col == "*" ? "." + _column.name : _column.name);
                                                        colName += " ";
                                                        let moveCaret = ( pattern.col == "*" ? 1 : 0);
                                                        $listItem.click(function(){ Me.Click(colName,pattern.col,caretPos+moveCaret); });
                                                        Me.IntelliList.append($listItem);
                                                        Me.itemList.push($listItem);
                                                }
                                            },this);
                                        }
                                    }
                                } else if(_table.name.toUpperCase().startsWith(pattern.tbl.toUpperCase())) {
                                    $listItem = $("<option>", {
                                        value: _table.name,
                                        title: _table.name,
                                        css: {
                                            background: "url(" + tableIcon.src + ")",
                                            backgroundPosition: "center left",
                                            backgroundRepeat: "no-repeat",
                                            backgroundSize: tableIcon.width + "px " + tableIcon.height + "px",
                                            paddingLeft: "20px"
                                            }
                                        }).html(_table.name);
                                        
                                        $listItem.click(function(){ Me.Click(_table.name,pattern.tbl,caretPos); });
                                        Me.IntelliList.append($listItem);
                                        Me.itemList.push($listItem);
                                } 
                                
                            },this);
                        }
                    }
               } else if(_database.name.toUpperCase().startsWith(pattern.db.toUpperCase())) { 
                    //DATABASE
                    $listItem = $("<option>", {
                        value: _database.name,
                        title: _database.name,
                        css: {
                            background: "url(" + dbIcon.src + ")",
                            backgroundPosition: "center left",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: dbIcon.width + "px " + dbIcon.height + "px",
                            paddingLeft: "20px"
                            }
                        }).html(_database.name);
                        $listItem.click(function(){ Me.Click(_database.name +".dbo.",pattern.db,caretPos); });
                        Me.IntelliList.append($listItem);
                        Me.itemList.push($listItem);
                    }
                if(Me.itemList.length>0) {return true;}
           }, this);
        }
     }

    let size = (this.itemList.length > 5 ? 5 : this.itemList.length);
    this.IntelliList.prop("size", (size == 1 ? 2 : size));
}
    
Intellisense.prototype.InitDefault = function(pattern,caretPos,context){
    this.context = context;
    this.intelliDiv =  $("<div>", { id:"intellisense"});
    this.IntelliList = $("<select>", {id: "intellisenseList"});
    this.itemList = [];
    
    Me = this;
    this.context.intelliWords.forEach(function(intelliword){
        let keyword = intelliword[0].toUpperCase();
        if(keyword.startsWith(pattern.toUpperCase())){
            let img = intelliword[1];
            $listItem = $("<option>", {
                value: keyword,
                title: keyword,
                css: {
                    background: "url(" + img.src + ")",
                    backgroundPosition: "center left",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: img.width + "px " + img.height + "px",
                    paddingLeft: "20px"
                    }
                }).html(keyword);
            $listItem.click(function(){ Me.Click(keyword,pattern,caretPos); });
            this.IntelliList.append($listItem);
            this.itemList.push($listItem);
        }
    },this);
    let size = (this.itemList.length > 5 ? 5 : this.itemList.length);
    this.IntelliList.prop("size", (size == 1 ? 2 : size));
}

Intellisense.prototype.Draw = function(){
    if(this.itemList.length>0){
        $vcaret = $(".v-caret");
        this.intelliDiv.append(this.IntelliList);
        const mLeft = parseFloat($vcaret[0].getBoundingClientRect().left) - parseFloat(this.context.highlights[0].getBoundingClientRect().left);
        this.intelliDiv.css("margin-left", mLeft );
        $vcaret.after(this.intelliDiv);
        this.context.textarea.css("z-index","-2");
    } else {
        this.Kill();
    }
}

Intellisense.prototype.Focus = function(){
    this.IntelliList.focus();
    this.IntelliList.prop("selectedIndex", 0);
    Me = this;
    this.IntelliList.bind("keydown", function(event){ Me.KeyDown(event); });
}

Intellisense.prototype.KeyDown = function(e){
    if(["ArrowUp","ArrowDown"].indexOf(e.key)!=-1) {
        return;
    }
    switch(e.key){
        case "Enter":
            this.IntelliList.find(":selected").click();
            e.preventDefault();
             break;
        case "Tab":
            this.IntelliList.find(":selected").click();
            e.preventDefault();
            break;
        case "Escape": 
            this.Kill();
            break;
        default:
            this.Kill();
            break;
    }
   // this.Kill();
}

Intellisense.prototype.Click = function(newText,textToReplace,caretPos){
    let text = this.context.textarea.val()
    const end = text.length;
    text = text.substring(0,caretPos - textToReplace.length) 
            + newText 
            + text.substring(caretPos,end).slice(0,text.substring(caretPos,end).length) 
            + (this.type.toUpperCase() == "DB" ? "" : " ");
    this.context.textarea.val(text);
    let newCaretPos = caretPos + (newText.length - textToReplace.length) + 1 ;
    this.context.textarea.get(0).setSelectionRange(newCaretPos, newCaretPos);
    this.Kill();
}

Intellisense.prototype.Kill = function(){
    this.context.textarea.css("z-index","4");
    this.itemList = [];
    $("#intellisense").remove();
    this.context.textarea.focus();
    
}