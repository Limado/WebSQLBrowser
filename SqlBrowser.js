document.write("<script type='text/javascript' src='ConstData.js'></script>")
document.write("<script type='text/javascript' src='ObjectExplorer.js'></script>")
document.write("<link rel='stylesheet' type='text/css' href='./fixedHeaderTable/jquery.fixedHeaderTable.css'>");
document.write("<script type='text/javascript' src='Intellisense.js'></script>")
document.write("<script type='text/javascript' src='./fixedHeaderTable/jquery.fixedheadertable.min.js'><"+"/script>")
document.write("<script type='text/javascript' src='QueryResult.js'></script>")
document.write("<script type='text/javascript' src='QueryWriter.js'></script>")
document.write("<script type='text/javascript' src='OptionPanel.js'></script>")


SqlBrowser = function(div){
    div = $("#" + div);
    div.css({ "height" : "100%",
              "min-height" : "300px"
            });
    //div.addClass("container-fluid row");
    div.addClass("my-1");
    
    divOptionPanel = $("<div>",{ id: "divOptionPanel"});
    divObjectExplorer = $("<div>",{ id: "divObjectExplorer"});
    divQueryWriter = $("<div>",{ id: "divQueryWriter"});
    div.append(divOptionPanel);
    div.append(divObjectExplorer);
    div.append(divQueryWriter);
    
}

SqlBrowser.prototype.Init = function(jsonData,jsonWriterKeywords){
    try {
        jsonData = JSON.parse(jsonData);
    }
    catch(err) {
        console.log(err);
            this.optionPanel = new optionPanel("divOptionPanel",this);
            this.optionPanel.Init(jsonData);
            this.optionPanel.Draw();
            this.objectExplorer = new objectExplorer("divObjectExplorer");
            this.objectExplorer.Init(jsonData);
            this.objectExplorer.Draw();
            this.queryWriter = new queryWriter("divQueryWriter");
            this.queryWriter.Init(jsonWriterKeywords);
            this.queryWriter.DBDataIntellisense(jsonData);     
    }
}


