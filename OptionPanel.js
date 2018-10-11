var optionPanel = function(div,browser)
{
    this.sqlBrowser = browser;
    this.container = $("#" + div);
    this.container.addClass("col-xs-12");
    this.container.css( {
                            "overflow":"hidden",
                            "background-color" : "#F0FCFC",
                            "border" : "2px solid #A0CCEB",
                            "border-top-right-radius": "3px",
                            "border-top-left-radius": "3px",
                            "border-bottom" : "none",
                            "margin" : "auto",
                            "height" : "30px",
                            "padding-top" : "4px"
                        });
}
optionPanel.prototype.Init = function(jsonData)
{
    this.databases = [];
    for (property in jsonData) {
        if(property == "databases"){
           let databases = jsonData[property]
           databases.forEach(function(_database) {
               this.databases.push(_database.name);
           }, this);
        }
     }
}

optionPanel.prototype.Draw = function()
{
    var Me = this;
    let showOE = $("<span>",{ id: "expandObjectExplorerIcon" ,title:"Show Object Explorer"})
    .addClass("optionPanelButton optionPanelButtonActive")
    .click(function(){
        if($(this).hasClass("optionPanelButtonActive")) { return;}
        $( "#hideObjectExplorer" ).removeClass( "optionPanelButtonActive" )
        $( this ).addClass( "optionPanelButtonActive" )
        $( "#divQueryWriter" ).css({width: ''});
        $("#divObjectExplorer").animate({width:'toggle'},120);
        $( "#divQueryWriter" ).removeClass("col-xs-12");       
        $( "#divQueryWriter" ).addClass("col-xs-9");
        setTimeout(
            function(){
                Me.sqlBrowser.queryWriter.queryResult.Draw();
            },200
        );
    });

    showOE.append(expandObjectExplorerIcon);
    this.container.append(showOE);

    let hideOE = $("<span>",{ id: "hideObjectExplorer" ,title:"Hide Object Explorer"})
                .addClass("optionPanelButton")
                .click(function(){
                    if($(this).hasClass("optionPanelButtonActive")) { return;}
                    $( "#expandObjectExplorerIcon" ).removeClass( "optionPanelButtonActive" )
                    $( this ).addClass( "optionPanelButtonActive" )
                    $("#divObjectExplorer").animate({width:'toggle'},10);
                    $( "#divQueryWriter" ).animate({width: '100%'}, 150);
                    $( "#divQueryWriter" ).removeClass("col-xs-9");       
                    $( "#divQueryWriter" ).addClass("col-xs-12");
                    setTimeout(
                        function(){
                            Me.sqlBrowser.queryWriter.queryResult.Draw();
                        },200
                    );
                });
                hideOE.append(hideObjectExplorerIcon);
    this.container.append(hideOE);
   
    this.dbList = $("<select>", {id: "OptionPanelDbList", class:"optionList", css: { marginLeft: "20px"}});
    this.databases.forEach(function(db){
        $listItem = $("<option>", {
            value: db,
            title: db,
            css: {
                background: "url(" + dbIcon.src + ")",
                backgroundPosition: "center left",
                backgroundRepeat: "no-repeat",
                backgroundSize: dbIcon.width + "px " + dbIcon.height + "px",
                paddingLeft: "20px"
                }
            }).html(db);
            this.dbList.append($listItem);
    },this);
    this.container.append(this.dbList);

    let runQuery = $("<span>",{ id: "runQuery" ,title:"Run query", css: { marginLeft: "20px"}})
    .addClass("optionPanelButton")
    .click(function(){ Me.RunQuery(); });

    runQuery.append(runQueryIcon);
    this.container.append(runQuery);
    
    let queryView = $("<span>",{ id: "queryView" ,title:"View/Edit query"})
    .addClass("optionPanelButton optionPanelButtonActive")
    .click(function(){ 
        if($(this).hasClass("optionPanelButtonActive")) {return;} 
        Me.ChangeView();
    });

    queryView.append(queryViewIcon);
    this.container.append(queryView);

    let queryResultView = $("<span>",{ id: "queryResultView" ,title:"View query result"})
                .addClass("optionPanelButton")
                .click(function(){
                    if($(this).hasClass("optionPanelButtonActive")) {return;} 
                    Me.ChangeView(); 
                });
    queryResultView.append(queryResultViewIcon);
    this.container.append(queryResultView);    

    $pagerContainer = $("<div>",{id:"pagerContainer",css : {float:"right",pointerEvents:"none"}});
    $pager = $("<select>", {id: "optionPanelPage", 
                                class:"optionList", 
                                css : { 
                                    maxWidth : "45px",
                                    minWidth : "45px"
                                }
                            });
    $listItem = $("<option>",{ value: 0}).html(0);
    $pager.append($listItem);
    $pager.change(function(){  
        $pager = $("#optionPanelPage");
        $id = $pager.val();
        $pager.val(Me.sqlBrowser.queryWriter.queryResult.Draw($id));
      });

    let prevPage = $("<span>",{ id: "prevPage" ,title:"Previous page"})
    .css("cursor","pointer")
    .click(function(){  
        $pager = $("#optionPanelPage");
        $id = parseInt($pager.val())-1;
        $pager.val(Me.sqlBrowser.queryWriter.queryResult.Draw($id));
      });
    prevPage.append(prevPageIcon);

    let nextPage = $("<span>",{ id: "nextPage" ,title:"Next page"})
    .css("cursor","pointer")
    .click(function(){  
        $pager = $("#optionPanelPage");
        $id = parseInt($pager.val())+1;
        $pager.val(Me.sqlBrowser.queryWriter.queryResult.Draw($id));
      });
    nextPage.append(nextPageIcon);

    let semaphore = $("<span>",{ id: "querySemaphore" ,title:"Ready to run"});
    semaphore.append(greenLightIcon);

    $pagerContainer.append(prevPage); 
    $pagerContainer.append($pager);
    $pagerContainer.append(nextPage); 
    $pagerContainer.append(semaphore);    
    this.container.append($pagerContainer);
}

optionPanel.prototype.RunQuery = function(){
    $( "#queryWriterResult" ).empty();
    $( "#queryWriterResult" ).show();
    $( "#queryWriterContainer" ).hide();
    $( "#queryView" ).removeClass( "optionPanelButtonActive" );
    $( "#queryResultView" ).addClass( "optionPanelButtonActive" );
    $("#querySemaphore").empty().append(redLightIcon);
    $("#querySemaphore").attr("title","Running query");
    $("#runQuery").css("pointer-events","none");

    var query = $("#queryWriterTextarea").val();
    Me = this;
    $.getJSON("./queryResult.json",function(data){
        Me.sqlBrowser.queryWriter.queryResult.Init(data);
        $pages = Me.sqlBrowser.queryWriter.queryResult.pages;
        Me.sqlBrowser.queryWriter.queryResult.Draw(1);
        $pager = $("#optionPanelPage");
        $pager.empty();
        for (let i = 1; i<=$pages ; i++){
            $listItem = $("<option>",{ value: i}).html(i);
            $pager.append($listItem);
        }
    })
        .done(function( data ) {})
        .fail( function( jqXHR, textStatus, errorThrown ){
            console.log("Error ->" );
            console.log(jqXHR);
            console.log("jqXhrr" );
            console.log(textStatus);
            console.log("textStatus" );
            console.log(errorThrown);
            console.log("errorThrown" );
            console.log("<- Fin Error" );
            // por ahora para que siempre de un resultado
            Me.sqlBrowser.queryWriter.queryResult.Init(jsonResult);
            $pages = Me.sqlBrowser.queryWriter.queryResult.pages;
            Me.sqlBrowser.queryWriter.queryResult.Draw(1);
            $pager = $("#optionPanelPage");
            $pager.empty();
            for (let i = 1; i<=$pages ; i++){
                $listItem = $("<option>",{ value: i}).html(i);
                $pager.append($listItem);
            }
            /*** SOLO TEMPORALMENTE */
        })
        .always(function(){
            $("#querySemaphore").empty().append(greenLightIcon);
            $("#querySemaphore").attr("title","Ready to run");
            $("#runQuery").css("pointer-events","auto");
            $("#pagerContainer").css("pointer-events","auto");
        });
}

optionPanel.prototype.ChangeView = function(){
    if($("#queryView").hasClass("optionPanelButtonActive")) 
        {
            $( "#queryView" ).removeClass( "optionPanelButtonActive" );
            $( "#queryResultView" ).addClass( "optionPanelButtonActive" );
           
            $( "#queryWriterResult" ).slideDown("slow",function(){
                $( "#queryWriterResult" ).show();
            });
            $( "#queryWriterContainer" ).slideUp("slow",function(){
                $( "#queryWriterContainer" ).hide();
                $("#pagerContainer").css("pointer-events","auto");
            });
        } else if ($("#queryResultView").hasClass("optionPanelButtonActive")){
            $( "#queryResultView" ).removeClass( "optionPanelButtonActive" );
            $( "#queryView" ).addClass( "optionPanelButtonActive" );
           
            $( "#queryWriterResult" ).slideUp("slow",function(){
                $( "#queryWriterResult" ).hide();
            });
            $( "#queryWriterContainer" ).slideDown("fast",function(){
                $( "#queryWriterContainer" ).show();
                $("#pagerContainer").css("pointer-events","none");
            });
        }
}