var queryResult = function() {
    this.container = $("<div>", { id : "queryWriterResult", css : { "height" : "100%", "display" : "none", padding:"0" }});
    this.container.addClass("queryWriterResult");
    this.json = {};
    this.thead = "";
    this.tfoot = "";
    this.tbody = "";
    this.pageSize = 50;
    this.pages = 0;
    this.showingPage = 0;
    Me = this;
    
   $(window).resize(function(){
        Me.Draw()
    });
}

queryResult.prototype.Init = function(json){
    this.json = json;
    this.showingPage = 0;
    this.container.html("");
 try {
    json = JSON.parse(json);
    } catch(err) {
        console.log(err);
        try{
            this.pages = Math.ceil(json.rows.length / this.pageSize);
        } catch(err) {
            console.log(err);
        }
    }
}

queryResult.prototype.Draw = function(page) {
    
    this.showingPage = (page == undefined ? this.showingPage : page);
    $("#prevPage").css("visibility","visible");
    $("#nextPage").css("visibility","visible");

    if(this.showingPage >= this.pages) {
        $("#nextPage").css("visibility","hidden");
        if(this.showingPage > this.pages) {
            this.showingPage = this.pages;
            return this.showingPage;
        }
    } else if(this.showingPage <= 1) {
        $("#prevPage").css("visibility","hidden");
        if(this.showingPage < 1) {
            this.showingPage = 1;
            return this.showingPage;
        }
    }

    $to = (this.showingPage * this.pageSize);
    $from = $to - this.pageSize;
        try{

            Me = this;
            $table = $("<table>");

            $thead = $("<thead>");
            $tr = $("<tr>");
            $th = $("<th>",{id:"All"}).html(" ");
            $tr.append($th);
            this.json.columns.forEach(function(column, index) {
                $th = $("<th>", {id: index, class: "th"}).html(column);
                $tr.append($th);
            }, this);
            $thead.append($tr);

            $tbody = $("<tbody>");
            this.json.rows.forEach(function(item, index) {
                if((index < $from) || (index >= $to)) {
                    return;
                }
                /** fila de ID autonumericos */
                let id = "queryResultRow_" + index;
                $tr = $("<tr>",{ id: id });
                $td = $("<td>")
                            .html(index)
                            .click( function() {
                                Me.SelectRow(id);
                            });
                $tr.append($td);

                item.forEach(function(data, index){
                    $div = $("<div>", { id: index, class: "col_" + index } ).html(data)
                    
                     // Mientras se mueve cambio el ancho de la celda junto con el div 
                    $div.bind("mousemove", function() {
                        $myW = parseInt($(this).css("width"));
                        $parentW = parseInt($(this).parent().css("width"))-4;
                            $(".col_" + index).parent().css("width",$myW + "px");
                            $(".col_" + index).css("width",$myW + "px");
                        });
                    // Cuando termina el movimiento, si el div es mas chico que el td, lo igual en tamaño  
                    $div.bind("mouseup", function() {
                            $myW = parseInt($(this).css("width"));
                            $parentW = parseInt($(this).parent().css("width"))-4;
                            
                            if(($parentW-$myW) >= 1) {
                                $(".col_" + index).css("width",$parentW + "px");
                            }
                            });
                            
                    $td = $("<td>",{ title:data }).append($div);
                    $td.click( function() {
                        Me.SelectCell(this);
                    });
                    $tr.append($td);
                },this);
                $tbody.append($tr);
            }, this);
            
            $tfoot = $("<tfoot>");
            $tr = $("<tr>");
            $td = $("<td>",{id:"footTd"}).html(this.json.message);
            $td.attr("colspan",this.json.columns.length+1);
            $tr.append($td);
            $tfoot.append($tr);

            $table.append($thead);
            $table.append($tfoot);
            $table.append($tbody);
            this.container.empty();
            this.container.append($table);
                
                $('#queryWriterResult table').fixedHeaderTable({ footer: true, cloneHeadToFoot: false, fixedColumn: true });
                $(".fht-fixed-column > .fht-tbody table tr td").click(function() {
                    let id = "queryResultRow_" + this.firstChild.data;
                    Me.SelectRow(id);
                });
                
                $("table tr th > div.fht-cell")
                .each(function() {
                    $class = "col_" + $(this).parent().attr("id");
                    $(this).addClass($class);
                    $(this).css("min-width",$(this).css("width"));
                    $(this).parent().css("cursor","pointer");
                    $(this).parent().click(function(){
                        $class = "col_" + $(this).attr("id");
                        Me.SelectColumn($class);
                    })
                });
                /* Esta es la celda superior izquierda */
                $("#All").click(function(){
                    Me.SelectAll();
                });
                $("#footTd").css({"color":"transparent"});
            
        } catch(err){
            console.log("Aca esta el error--> " + err);
        }
        return this.showingPage;
}
queryResult.prototype.CopyToClipboard = function(text){
        $aux = document.createElement("textarea");
        $aux.textContent = text;
        // Evita scroll al elemento en Edge
        $aux.style.position = "fixed";
        document.body.appendChild($aux);
        $aux.select();
        document.execCommand("copy");
        document.body.removeChild($aux);
}

queryResult.prototype.SelectCell = function(cell){
        this.UnSelectCells();
        $(cell).addClass("Selected");
        Me.CopyToClipboard($(cell).children().html());
}

queryResult.prototype.UnSelectCells = function(){
    $("#queryWriterResult table tbody tr td.Selected").each(function(){
        $(this).removeClass("Selected");
    });
}

queryResult.prototype.SelectRow = function(rowId){
        this.UnSelectCells();
        $copyText = "";
        $("#" + rowId + " td").each(function(){
            $(this).addClass("Selected");
            $copyText += $(this).text() + " |";
        });
        Me.CopyToClipboard( $copyText );
}

queryResult.prototype.UnSelectRows = function(){
    $("#queryWriterResult table tbody tr td .Selected").each(function(){
        $(this).removeClass("Selected");
    });
}

queryResult.prototype.SelectColumn = function(column){
        this.UnSelectCells();
        $("#queryWriterResult table tbody tr td ." + column).parent().addClass("Selected");
        $copyText = "";
        $("#queryWriterResult table tbody tr td ." + column).each(function(){
            $copyText += $(this).text() + "\r\n";
        });
        Me.CopyToClipboard( $copyText );
}

queryResult.prototype.SelectAll = function(){
    $copyText = "";
    $("#queryWriterResult table.fht-table-init tbody tr").each(function(){
        $(this).children().each(function(){
            if(!$(this).hasClass("Selected")){
                $(this).addClass("Selected");
            }
            if($(this).children().length > 0 ){
                $copyText += $(this).children().text() + " |";
            }
            
        });
        $copyText += "\r\n";
    });
    this.CopyToClipboard($copyText);
}