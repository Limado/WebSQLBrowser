objectExplorer = function(div) {
    this.container = $("#" + div);
    this.container.addClass("col-xs-3");
    this.container.css({
                        "overflow" : "scroll",
                        "height" : this.container.parent().css("height"),
                        "background-color" : "#FCFCF0",
                        "border" : "2px solid #A0CCEB",
                        "border-right" : "1px solid #A0CCEB",
                        "border-radius": "0",
                        "border-bottom-left-radius": "3px",
                        "border-right" : "none"
                        });

    this.canvas = $("<canvas>" , { id:"objectExplorerCanvas",  text:"Your browser does not support the HTML5 canvas tag."});
    this.container.append(this.canvas)
    
    this.canvas = document.getElementById("objectExplorerCanvas");
    this.canvas.height = parseInt(this.container.css("height"));
    this.canvas.width = parseInt(this.container.css("width"));
    
    
    this.context = this.canvas.getContext("2d");
    this.databases = [];
    this.containerOffsetY = 0;
	this.offsetY = 0; 
    var _objectExplorer = this;
    this.container.bind("click", function(event){ _objectExplorer.MouseEvent(event) });
    this.container.bind("mousemove", function(event){ _objectExplorer.MouseEvent(event) });

}

objectExplorer.prototype.MouseEvent = function(event){
    this.ReOffset();
    event.preventDefault();
    event.stopPropagation();
    
    var mouseX=parseInt(event.clientX-this.offsetX);
    var mouseY=parseInt(event.clientY-this.offsetY);

    const container = this.container;
    container.css("cursor","default");

    if(event.type == "mousemove" && mouseY < this.canvas.height) {
        container.css("cursor","pointer");
        return;
    }
    
    this.databases.some(function(_db){
        _db.mouseOver =  false;
        //Reviso si el mouse esta sobre alguna de las bases
        if(mouseY>(_db.y-rowHeight+5) && mouseY<_db.y) {
            if(event.type == "click") { _db.expanded =  (_db.expanded ? false : true); }
            if(event.type == "mousemove") { _db.mouseOver =  true; }
            container.css("cursor","pointer");
            if(!_db.expanded ) {
                _db.tables.forEach(function(_tbl){
                        _tbl.expanded =  false;
                        _tbl.mouseOver =  false;
                    },this);
            }
            return true;
        }
        //Si la base esta expandida, reviso si el mouse esta sobre alguna de las tablas
        if(_db.expanded){
            _db.tables.some(function(_tbl){
                _tbl.mouseOver =  false;
               if(mouseY>(_tbl.y-rowHeight+5) && mouseY<_tbl.y) {
                if(event.type == "click") { _tbl.expanded =  (_tbl.expanded ? false : true); }
                if(event.type == "mousemove") { _tbl.mouseOver =  true;}
                    container.css("cursor","pointer");
                   return true;
               }
               //Reviso si el mouse esta sobre alguna de las columnas
               if(_tbl.expanded){
                _tbl.columns.some(function(_col){
                    _col.mouseOver =  false;
                   if(mouseY>(_col.y-rowHeight+rowY+5) && mouseY<_col.y+rowY) {
                    if(event.type == "click") {  }
                    if(event.type == "mousemove") { _col.mouseOver =  true; }
                    container.css("cursor","pointer");
                   }
               });
            }
           });
        }
    });
    this.Draw();
}
objectExplorer.prototype.ReOffset = function() {
	this.offsetY = this.canvas.getBoundingClientRect().top;
	this.containerOffsetY = this.container[0].getBoundingClientRect().top;
    }

objectExplorer.prototype.Init = function(json){
        try{
            for (property in json) {
                if(property == "databases"){
                   let databases = json[property]
                   databases.forEach(function(_database) {
                       this.AddDatabase(new database(_database));
                   }, this);
                }
             }
        } catch(err){
            console.log(err);
        }
}
objectExplorer.prototype.AddDatabase = function(database){
    this.databases.push(database);
}
objectExplorer.prototype.CalculateCanvasHeigth = function(){
    this.canvas.height = 0;
    this.databases.forEach(function(_database) {
        this.canvas.height += rowHeight;
        if(_database.expanded){
            _database.tables.forEach(function(_table){
                this.canvas.height += rowHeight;
                if(_table.expanded){
                _table.columns.forEach(function(_column){
                this.canvas.height += rowHeight;
                },this);    
            }
            },this);
        }
    }, this);
    
    this.context.width = this.canvas.width;
    this.context.height = this.canvas.height;
}
objectExplorer.prototype.Draw = function(){
    this.Clear();
    this.CalculateCanvasHeigth();
    this.context.beginPath();
    this.context.fillStyle = fillStyle;
    let y = rowY;
    this.databases.forEach(function(_db){
       y = _db.Draw(this.context, y);
    },this);
}
objectExplorer.prototype.Clear = function(){
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
}
/** DATABASE */
database = function(_database) {
    this.y = 0;
    this.expanded = false;
    this.name = "";
    this.tables = [];
    this.mouseOver = false;

    for (property in _database) {
        if(property == "name") 
        { 
            this.name = _database.name; 
        } 
        else if(property == "tables")
        {
            let tables = _database[property];
            tables.forEach(function(_table){
                this.AddTable(new table(_table));
            },this);
        }
    }
    
}

database.prototype.Draw = function(context, y) {
    this.y = y;
    context.beginPath();
    if(this.mouseOver){
        context.fillStyle = overFillStyle
        context.fillRect((tab*2),this.y-15,(context.width-(tab*2)),rowY-1);
    }
    context.fillStyle = fillStyle;
    context.drawImage(dbIcon,tab,(this.y-12),dbIcon.width,dbIcon.height);
    context.strokeRect((tab/2)-4,this.y,8,-8);
    if(!this.expanded){
        context.moveTo(tab/2,this.y-7);
        context.lineTo(tab/2,this.y-1);
    }
    context.moveTo((tab/2)-4,this.y-4);
    context.lineTo((tab/2)+4,this.y-4);
    context.stroke();
    context.font = "bold 12px Avenir";
    context.fillText(this.name,tab*2,this.y);

    if(this.expanded) {
        this.tables.forEach(function(_tbl){
            y = _tbl.Draw(context, y);
         },this);
    }
    return y+rowY;
}
database.prototype.AddTable = function(table){
    this.tables.push(table);
}
/** TABLE */
table = function(_table) {
    this.expanded = false;
    this.name = '';
    this.columns = [];
    this.mouseOver = false;

    for (property in _table) {
        if(property == "name") 
        { 
            this.name = _table.name; 
        } 
        else if(property == "columns")
        {
            let columns = _table[property];
            columns.forEach(function(_column){
                this.AddColumn(new column(_column));
            },this);
        }
    }
}

table.prototype.Draw = function(context, y) {
    this.y = y+rowY;
    context.beginPath();
    if(this.mouseOver){
        context.fillStyle = overFillStyle
        context.fillRect((tab*2),this.y-15,(context.width-(tab*2)),rowY-1);
    }
    context.fillStyle = fillStyle
    context.drawImage(tableIcon,(tab*2),(this.y-12),tableIcon.width,tableIcon.height);
    context.strokeRect(tab+3,this.y-1,8,-8);
    context.beginPath();
    if(!this.expanded){
        context.moveTo(tab+7,this.y-9);
        context.lineTo(tab+7,this.y-1);
    }
    context.moveTo(tab+3,this.y-5);
    context.lineTo(tab+11,this.y-5);
    context.stroke();
    context.font = "bold 12px Avenir";
    context.fillText(this.name,(tab*3),this.y);
    if(this.expanded) {
        this.columns.forEach(function(_col){
            y = _col.Draw(context, y);
         },this);
    }
     return y+rowY;
}
table.prototype.AddColumn = function(column){
    this.columns.push(column);
}
/** COLUMN */
column = function(_column) {
    this.y = 0;
    this.name = '';
    this.dataType = '';
    this.maxLength = '';
    this.mouseOver = false;
    for (property in _column) 
    {
        if(property == "name"){ this.name = _column.name; }
        else if(property == "dataType"){ this.dataType = _column.dataType; }
        else if(property == "maxLength"){ this.maxLength = _column.maxLength; }
    }
}

column.prototype.Draw = function(context, y) {
    this.y = y+rowY;
    context.beginPath();
    if(this.mouseOver){
        context.fillStyle = overFillStyle
        context.fillRect((tab*2.7),this.y+rowY-15,(context.width-(tab*2.7)),rowY);
    }
    context.fillStyle = fillStyle
    context.moveTo((tab*2.2)+2,this.y+rowY-5);
    context.lineTo((tab*2.4)+2,this.y+rowY-5);
    context.stroke();

    context.drawImage(columnIcon,(tab*2.7)+2,this.y+rowY-10,columnIcon.width,columnIcon.height);
    context.font = "bold 12px Avenir";
    if(this.maxLength == ''){
        var text = this.name + " [" + this.dataType + "]";
    } else {
        var text = this.name + " [" + this.dataType + ", " + this.maxLength + "]";
    }
    context.fillText(text,(tab*3.5)+2,this.y+rowY);
    return this.y;
}