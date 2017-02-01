window.stl = window.stl || {};
stl.app = stl.app || {};


//Modify projects Load Actions
stl.app.ActionType = {
        CREATENEW:1,
        EDITCHECKEDOUT : 2, 
        CHECKEDOUT : 3,
        VIEW : 4,
        //VIEWCHECKEDOUT : 5,
        CHECKIN:5,
        UNDOCHECKOUT:6,
        INPLANEDITCHECKOUT:7,
        INPLANCHECKEDOUT : 8,
        VIEWDEBUFFEREDPLAN : 9
    };

stl.app.ProjectDetailsFromURL = null;
stl.app.ProjectCheckOutStatus = 1;
stl.app.ProjectType = PROJECT_STATUS_IN_PLAN_INTEGER;
stl.app.actionTypeValue = -1;

stl.app.handleCheckInChekOutButtons = function (action) {
    
    var fnDisableButton = stl.app.disableButton ;
    var fnChangeButtonText = stl.app.changeButtonText;
    var fnhideButton = stl.app.hideButton;
    stl.app.actionTypeValue = action;
    switch (action) {
     case 1:
     case 7:
     case 8:
        //fnDisableButton($("#checkin"), false);
        //fnDisableButton($("#checkout"), true);
        fnhideButton($("#checkin"), false);
        fnhideButton($("#checkindropdown"),false);
        fnhideButton($("#checkout"), true);
        //fnChangeButtonText($("#checkout"),UNDO_CHECK_OUT);
        break;
     case 2:
     case 3:
        /*fnDisableButton($("#checkin"), false);
        fnDisableButton($("#checkout"), false);
        fnChangeButtonText($("#checkout"),UNDO_CHECK_OUT);*/
        fnhideButton($("#checkin"), false);
        fnhideButton($("#checkindropdown"),false);
        fnhideButton($("#checkout"), true);
        break;
     case 9:
        fnhideButton($("#checkin"), true);
        fnhideButton($("#checkout"), true);
        fnhideButton($("#checkindropdown"),true);
        break;  
     case 4:
     case 5:
     case 6:
        //fnDisableButton($("#checkin"), true);
        fnhideButton($("#checkin"), true);
        fnhideButton($("#checkindropdown"),true);
        //fnDisableButton($("#checkout"), false);
        fnhideButton($("#checkout"), false);
        //fnChangeButtonText($("#checkout"),CHECK_OUT);
        break;

     // case 5:
     //    fnDisableButton($("#checkin"), false);
     //    fnDisableButton($("#checkout"), false);
     //    fnChangeButtonText($("#checkout"),"Check Out");
     //    break;
     // case 5 :
     //    fnDisableButton($("#checkin"), true);
     //    fnDisableButton($("#checkout"), false);
     //    fnChangeButtonText($("#checkout"),CHECK_OUT);
     //    break;
     // case 6 :
     //    fnDisableButton($("#checkin"), true);
     //    fnDisableButton($("#checkout"), false);
     //    fnChangeButtonText($("#checkout"),CHECK_OUT);
     //    break;
    // case 7:
 //        fnDisableButton($("#checkin"), false);
 //        fnDisableButton($("#checkout"), true);
 //        fnChangeButtonText($("#checkout"),UNDO_CHECK_OUT);
 //    case 8 :
 //        fnDisableButton($("#checkin"), false);
 //        fnDisableButton($("#checkout"), true);
 //        fnChangeButtonText($("#checkout"),UNDO_CHECK_OUT);
    //    break;
     default:
        break; 
    }
};

stl.app.handleCheckoutButtonAsPerProjectPrivilege = function(CheckedOutStatus, CheckedOutUser) {

    //1. project is checked-out, only same user can edit checkout project else disable checkout button
    //2. project is checked-in and user do not have privilege to checkout project,  disable checkout button
	if(stl.app.IsViewproject){
		if(stl.app.projectPrivileges) {
    		if (CheckedOutStatus == 1) {
    			if (CheckedOutUser != stl.app.loggedInUserName) {
    				stl.app.disableButton($("#checkout"), true);
    			}
    		} else if (CheckedOutStatus == 0) {
    			if (stl.app.projectPrivileges.CHECK_OUT == false) {
    				stl.app.disableButton($("#checkout"), true);
    			}
			}
		}
	}
    if(stl.app.projectPrivileges) {
        if (stl.app.projectPrivileges.UNDO_CHECK_OUT == false) {
            $("#checkindropdown").addClass("disabled");
        }
        else{
            $("#checkindropdown").removeClass("disabled");
        }
    }
    //set this flag to false so that we do not load privilege data multiple times
    stl.app.IsViewproject = false;
}

//disable the download button if project not checked in even once ie. in IN_PLAN state or if its a template.
stl.app.UpdateDownloadButtonBasedOnProjectStatus = function(ProjectStatus, ProjectFileType) {
    //var shouldDisableDownloadButton = (ProjectFileType === PROJECT_TYPE_PPI_TEMPLATE || ProjectStatus === IN_PLAN_TYPE);
    //stl.app.disableButton($("#download"), shouldDisableDownloadButton);
    $("#downloaddropdown").removeAttr("disabled");
    $("#downloaddropdown").removeClass("disabled");

}


stl.app.WireToolBarlisteners = function() {
    $("#savedropdown").on('click', function(evt) {
        var $btn = $(evt.target);
        // Have to check "disabled" manually because it's a div not a button
        if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
            return;
        }
        if ($btn.parent().length > 0) {
            if ($btn.parent().hasClass("disabled"))
                return;
        }
        var $saveButton = $(evt.target),
            buttonOffset = $saveButton.offset(),
            $saveMenu = getSaveMenu(evt);
        var showing = $saveMenu.is(":visible");
        $(".tool-popup").hide();
        if (!showing) {
            $saveMenu.show();
            $saveMenu.css({
                top: buttonOffset.top + $saveButton.outerHeight(),
                left: buttonOffset.left + $saveButton.outerWidth() - $saveMenu.outerWidth()
            });
            evt.stopPropagation();
        }
    });
    $("#checkindropdown").on('click', function(evt) {
        var $btn = $(evt.target);
        // Have to check "disabled" manually because it's a div not a button
        if ($("#checkindropdown").hasClass("disabled")) {
            return;
        }

        var $checkinButton = $(evt.target),
            buttonOffset = $checkinButton.offset(),
            $checkinMenu = getCheckinMenu(evt);
        var showing = $checkinMenu.is(":visible");
        $(".tool-popup").hide();
        if (!showing) {
            $checkinMenu.show();
            $checkinMenu.css({
                top: buttonOffset.top + $checkinButton.outerHeight(),
                left: buttonOffset.left + $checkinButton.outerWidth() - $checkinMenu.outerWidth()
            });
            evt.stopPropagation();
        }
    });
    $("#calendar-button").on('click', function(evt) {
        var $btn = $(evt.target);
        if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
            return;
        }
        showCalendarDialog();
        
    });
    $("#settings-button").on('click', function(evt) {
        var $btn = $(evt.target);
        if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
            return;
        }
        showCCSettingDialog();
        /*var $btn = $(evt.target);
            if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
                return;
            }
            var $settinButton = $(evt.target),
                buttonOffset = $settinButton.offset(),
                $settingMenu = getSettingMenu(evt);
           var showing = $settingMenu.is(":visible");
            $(".tool-popup").hide();
            if (!showing) {
                $settingMenu.show();
                $settingMenu.css({
                    top: buttonOffset.top + $settinButton.outerHeight(),
                    left: buttonOffset.left + $settinButton.outerWidth() - $settingMenu.outerWidth()
                });
                evt.stopPropagation();
            }*/
    });

    $("#save").on('click', function(evt) {
        var $btn = $(evt.target);
        // Have to check "disabled" manually because it's a div not a button
        if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
            return;
        }
        SaveProject();
    });

    $("#checkin").on('click', function(evt) {
        InvokeCheckIn();
        toggleDockingGrids('resGrid', 'resourceSheet', false);
        toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', false);
    });
    $(".checkout-btn").on('click', function(evt) {
        InvokeCheckOut(stl.app.ProjectDataFromServer.uid, stl.app.ProjectDataFromServer.name, stl.app.ProjectType, stl.app.ProjectCheckOutStatus);
        toggleDockingGrids('resGrid', 'resourceSheet', false);
        toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', false);

    });

    $(".download-btn").on('click', function(evt) {
        var isDownloadDebuffered = false;

        if (/[?&]viewproject($|=true)/i.test(location.href) && /[?&]isViewDebuf($|=true)/i.test(location.href)) {
            isDownloadDebuffered = true; 
        }
        if (isDownloadDebuffered){
            stl.app.DownloadDebufferedProject();
        } else {
            stl.app.CheckOutAndDownloadSPIProject(DOWNLOAD_TYPE_SPI);
        }
        


    });
    $("#downloaddropdown").on('click', function(evt) {
        var $btn = $(evt.target);
        // Have to check "disabled" manually because it's a div not a button
        if ($btn.hasClass("disabled") || $btn.attr("disabled")) {
            return;
        }
        if ($btn.parent().length > 0) {
            if ($btn.parent().hasClass("disabled"))
                return;
        }
        var $downloadButton = $(evt.target),
            buttonOffset = $downloadButton.offset(),
            $downloadMenu = getDownloadMenu(evt);
        var showing = $downloadMenu.is(":visible");
        $(".tool-popup").hide();
        if (!showing) {
            $downloadMenu.show();
            $downloadMenu.css({
                top: buttonOffset.top + $downloadButton.outerHeight(),
                left: buttonOffset.left + $downloadButton.outerWidth() - $downloadMenu.outerWidth()
            });
            evt.stopPropagation();
        }
    });

    $(".matrix-view-btn").on('click', function(evt) {
        stl.app.removeLinksDeleteDialog();
        stl.app.redirectToMatrixView();
    });

    $(".timeline-view-btn").on('click', function(evt) {        
        $(document).trigger("taskMultiSelectEnd");
        stl.app.removeLinksDeleteDialog();
        if($(".timeline-chain-switch .switch .switch-input").is(":checked"))
            stl.app.redirectToChainView();
        else
            stl.app.redirectToTimelineView();
    });

    $(".table-view-btn").on('click', function(evt) {
        $(document).trigger("taskMultiSelectEnd");
        stl.app.removeLinksDeleteDialog();
        stl.app.redirectToTableView();
    });

    $(".plan-mode-btn").on('click', function(evt) {
        stl.app.switchToPlanMode();
    });

    $(".replan-mode-btn").on('click', function(evt) {
        stl.app.switchToReplanMode();
    });

    $(".logo").on('click', function(evt) {

    });
    $(".timeline-chain-switch .switch .switch-input").on("change",function(evt){
        if(this.checked){
            //chain view
            stl.app.redirectToChainView();
        }
        else{
            //timeline view -default
            stl.app.redirectToTimelineView();
        }
        if(!Ext.getCmp('CCSummarygrid').isHidden()){
            Ext.getCmp('CCSummarygrid').setVisible(false);
            Ext.getCmp('CCSummarygrid').setVisible(true);
        }
    });
    $(".resourceSheet").on('click', function(evt) {
        if ($(".resourceSheet").hasClass("pressed")) {
            toggleDockingGrids('resGrid', 'resourceSheet', false);
        } else {
            toggleDockingGrids('resGrid', 'resourceSheet', true);
        }
    });
    $(".milestoneSheet").on('click', function(evt) {
        if ($(".milestoneSheet").hasClass("pressed")) {
            toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
        } else {
            toggleDockingGrids('CCSummarygrid', 'milestoneSheet', true);
        }
    });
    $(".errorWarningSheet").on('click', function(evt) {
        toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', !$(this).hasClass("pressed"));
    });
    $(".toggle-links-button").on('click', function(evt) {
        $(this).toggleClass("pressed");
        $(document).trigger("togglelinks", [$(this).hasClass("pressed")]);
    });

    // TODO move zoom controls out to header view
    $(".zoom-button.zoom-in").off().on("click", function(evt) {
        $(document).trigger("zoomin");
    });
    $(".zoom-button.zoom-out").off().on("click", function(evt) {
        $(document).trigger("zoomout");
    });
    $(".zoom-button.zoom-in").addClass("disabled");

    $(".revisionHistoryImg").on('click', function(evt) {
        $(this).toggleClass("pressed");
        if (!stl.app.revisionHistory) {
            stl.app.revisionHistory = new stl.view.RevisionHistory({
                projectUid: stl.model.Project.project.uid
            });
            stl.app.revisionHistory.init();
        } else {
            stl.app.revisionHistory.readOnly = stl.app.isProjectOpenInViewOnlyMode();
            stl.app.revisionHistory.toggleRefreshRevsionHistoryPanel();
        }

    });

    $("#undo").on('click', function(evt) {

    });

    $("#identifyCC").on('click', function(evt) {
        if (stl.model.Project.validateProject(stl.app.ProjectDataFromServer)) {
            //setting the Highlight menu header text
            $(".page-header .highlight").find(".button-text").text(HIGHLIGHT);
            RunIDCC();
        }

    });

    $("#redoCCFB").on('click', function(evt) {
        if (stl.model.Project.validateProject(stl.app.ProjectDataFromServer)) {
            ReDoCC();
        }
    });

    $("#ccSummary").on('click', function(evt) {
        $(".milestoneSheet").trigger('click');
    });

    $("#acceptPlan").on('click', function(evt) {
        AcceptPlanClicked();
    });

    
    //CON 1416
    /*$("#checkBufferImpact").on('click', function (evt) {
        if(stl.model.Project.validateProject(stl.app.matrixView.project)){               
           CheckBufferImpact();
        }            
    });*/

    $("#bufferSummary").on('click', function(evt) {
        $(".milestoneSheet").trigger('click');
    });
    $("#undoCCAB").on('click', function(evt) {

        stl.app.ProjectDataFromServer.removeBufferTasks();
        // stl.app.matrixView.refreshLinks();
        var projectSummary = stl.app.getProjectSummaryInfo();
        projectSummary.isIDCCed = false;
        var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.ProjectDataFromServer.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + " }";
        $(document).trigger("projectjsonchange", [JsonData, false /*readonly*/ , false /*isViewChangeReqd*/ ]);
        toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
        Ext.getCmp('msGrid').store.clearData();
        undoCCABClick();
    });
    $(".highlight").off().on("click", function(evt) {
        var $button = $(evt.target).closest(".highlight"),
            buttonOffset = $button.offset(),
            $menu = getHighlightMenu(evt);
        var showing = $menu.is(":visible");
        $(".tool-popup").hide();
        if (!showing) {
            $menu.show();
            //To show highlight popup in tabular view with only error option
            if (window.currentViewId != "table") {
                $menu.css({
                    top: buttonOffset.top + $button.outerHeight(),
                    left: buttonOffset.left
                });
            } else {
                $menu.css({
                    top: buttonOffset.top + $button.outerHeight(),
                    left: buttonOffset.left
                });
            }
            evt.stopPropagation();
        }
    });
    $(".filter").off().on("click",function(evt){
        if(stl.app.getCurrentViewId() == TABLE_VIEW_ID)
            Ext.getCmp('tableview').clearFilter();
        else
            stl.app.setProjectModel(stl.app.ProjectDataFromServer, CHAIN_VIEW);
        evt.stopPropagation();
    });
    $(".toggle-auto-links-button").on('click', function(evt) {
        if ($(this).hasClass("pressed")) {
            stl.app.generateAutoLinksAllowed = true;
            $(this).removeClass("pressed");
            $(".toggle-auto-links-button").prop("title",AUTO_LINKS_ENABLED_TOOLTIP);
        } else {
            stl.app.generateAutoLinksAllowed = false;
            $(this).addClass("pressed");
            $(".toggle-auto-links-button").prop("title",AUTO_LINKS_DISABLED_TOOLTIP);

        }

    });

};
stl.app.disableButton = function( $button , disable) {
    $button.attr("disabled",disable);
};
stl.app.changeButtonText = function( $button , text) {
    $button.text(text);
};
stl.app.hideButton = function( $button , hide) {
    if(hide)
        $button.hide();
    else
        $button.show();
};


stl.app.switchToPlanMode = function(evt) {
    $(".planningmode-selector-buttons .btn").removeClass("active btn-primary");
    $(".plan-mode-btn").addClass("active btn-primary");
    showPlanningButtons();
    clearAllHighlight();
    $(".highlight").find(".button-text").text(HIGHLIGHT + NONE);
        
};

stl.app.switchToReplanMode = function(evt) {
    $(".planningmode-selector-buttons .btn").removeClass("active btn-primary");
    $(".replan-mode-btn").addClass("active btn-primary");
    showReplanningButtons();
    clearAllHighlight();
    $(".highlight").find(".button-text").text(HIGHLIGHT + NONE);        
};
/*
Global variables are checked if already the projectModel is set else view is initiated and model is loaded
*/
stl.app.isMatrixViewLoaded = false;
stl.app.isTimelineViewLoaded = false;
stl.app.isTableViewLoaded = false;
stl.app.isChainViewLoaded = false;
stl.app.milestoneUIDForChainToBeHighlighted;    
stl.app.isLoadPending = function (){
    return (!(stl.app.isMatrixViewLoaded && stl.app.isTimelineViewLoaded && stl.app.isTableViewLoaded));
};
stl.app.loadOtherViews = function (){
    if (!stl.app.isMatrixViewLoaded) {
            stl.app.addView(PERT_VIEW, true/*isSwitch*/);
            //showLoadingIcon(true);
            stl.app.setProjectModel(stl.app.ProjectDataFromServer, PERT_VIEW);
            stl.app.matrixView.isFirstSwitch = false;//has to be global since we need to use it in switch case in matrix view
    } 
    if (!stl.app.isTimelineViewLoaded) {
        stl.app.addView(TIMELINE_VIEW);
        //showLoadingIcon(true);
        stl.app.setProjectModel(stl.app.ProjectDataFromServer, TIMELINE_VIEW);
    } 
    if (!stl.app.isTableViewLoaded) {
        stl.app.addView(TABLE_VIEW);
        //showLoadingIcon(true);
        stl.app.setProjectModel(stl.app.ProjectDataFromServer, TABLE_VIEW);
    }
};


stl.app.restoreHighlightBtnText = function () {
    //resotres the highlight text when we redirect from one view to other so as to retain the highlighting
    var highlightDropDownBtn = $(".highlight").find(".button-text");
    if(highlightDropDownBtn.text() == HIGHLIGHT && stl.app.oldHighlightText){
        highlightDropDownBtn.text(stl.app.oldHighlightText);
        delete stl.app.oldHighlightText;
    }
};

stl.app.saveHighlightText = function() {
    //to save current highlight text when we navigate to TB view from either TM view or matrix view
    // this is to retain higglight when we come again to either of these views.
    var highlightDropDownBtn = $(".highlight").find(".button-text");
    if(highlightDropDownBtn.text() != HIGHLIGHT + ERROR){
        stl.app.oldHighlightText = highlightDropDownBtn.text();
        highlightDropDownBtn.text(HIGHLIGHT);
    }
};
stl.app.redirectToMatrixView = function() {
    if (!stl.app.isMatrixViewLoaded) {
        stl.app.addView(PERT_VIEW, true/*isSwitch*/);
        showLoadingIcon(true);
        setTimeout(function(){
            stl.app.setProjectModel(stl.app.ProjectDataFromServer, PERT_VIEW);
            stl.app.matrixView.isFirstSwitch = false;//has to be global since we need to use it in switch case in matrix view
            stl.app.postProcessMatrixViewLoad();
        },50);
    } 
    else
    {
        stl.app.postProcessMatrixViewLoad();
    }
    
};

stl.app.postProcessMatrixViewLoad = function(){
    $(".view-selector .btn").removeClass("selected-btn");
    $(".matrix-view-btn").addClass("selected-btn");
    if(!(Ext.getCmp("content").getLayout().getActiveItem().getId() == "matrix-view-container")){
        Ext.getCmp("content").getLayout().setActiveItem("matrix-view-container");
    }
    $(".view-selector .btn").removeClass("active btn-primary");
    $(".matrix-view-task-alignment").show();
    $(".zoom-controls").css('display', 'inline-block');
    $(".highlight.btn").css('display', '');
    stl.app.restoreHighlightBtnText();
    $(".matrix-view-btn").addClass("active btn-primary");
    stl.app.CreateTaskToolBar.onViewChange("matrixview");
    $(document).trigger("viewchange", "matrix");
    stl.app.matrixView.handleHighlightDropdownSelection();    
    if(stl.app.matrixView.isFirstSwitch) {
        stl.app.matrixView.isFirstSwitch = false;
    }
};

stl.app.redirectToTimelineView = function() {
    if (!stl.app.isTimelineViewLoaded) {
        stl.app.addView(TIMELINE_VIEW);
        showLoadingIcon(true);
        stl.app.setProjectModel(stl.app.ProjectDataFromServer, TIMELINE_VIEW);
    } 
    $(".view-selector .btn").removeClass("selected-btn");
    $(".timeline-view-btn").addClass("selected-btn");
    if(!(Ext.getCmp("content").getLayout().getActiveItem().getId() == "timelineview")){
       Ext.getCmp("content").getLayout().setActiveItem("timelineview");
    }
    $(".view-selector .btn").removeClass("active btn-primary");
    $(".matrix-view-task-alignment").hide();
    $(".zoom-controls").css('display', 'inline-block');
    $(".highlight.btn").css('display', '');
    stl.app.restoreHighlightBtnText();
    $(".timeline-view-btn").addClass("active btn-primary");
    stl.app.CreateTaskToolBar.onViewChange("timelineview");
    $(".timeline-chain-switch .switch .switch-input").prop('checked',false);
    $(document).trigger("viewchange", "timeline");
    Ext.getCmp('timelineview').linksViewRendered = false;
    Ext.getCmp('timelineview').handleHighlightDropdownSelection();
    this.setCurrentViewId(TIMELINE_VIEW_ID);
};
stl.app.redirectToChainView = function(){
    if (!stl.app.isChainViewLoaded) {
        stl.app.addView(CHAIN_VIEW);
        showLoadingIcon(true);
        stl.app.setProjectModel(stl.app.ProjectDataFromServer, CHAIN_VIEW);
    }
    $(".view-selector .btn").removeClass("selected-btn");
    $(".timeline-view-btn").addClass("selected-btn");
    if(!(Ext.getCmp("content").getLayout().getActiveItem().getId() == "chainview")){
       Ext.getCmp("content").getLayout().setActiveItem("chainview");
    }
    $(".view-selector .btn").removeClass("active btn-primary");
    $(".matrix-view-task-alignment").hide();
    $(".zoom-controls").css('display', 'inline-block');
    $(".highlight.btn").css('display', '');
    stl.app.restoreHighlightBtnText();
    $(".timeline-view-btn").addClass("active btn-primary");
    stl.app.CreateTaskToolBar.onViewChange("chainview");
    $(".timeline-chain-switch .switch .switch-input").prop('checked',true);
    $(document).trigger("viewchange", "chainview");
    Ext.getCmp('chainview').handleHighlightDropdownSelection();
    this.setCurrentViewId(CHAIN_VIEW_ID);
}
stl.app.redirectToTableView = function() {
    if (stl.app.isLoadPending()){
        showLoadingIcon(true);
        setTimeout(function(){
            stl.app.loadOtherViews();
            stl.app.postProcessTableViewLoad();
            hideLoadingIcon();
        },50);
    }
    else
    {
        stl.app.postProcessTableViewLoad();
    }
};

stl.app.postProcessTableViewLoad = function(){
    $(".view-selector .btn").removeClass("selected-btn");
    $(".table-view-btn").addClass("selected-btn");
    Ext.getCmp("content").getLayout().setActiveItem("tableview");
    $(".view-selector .btn").removeClass("active btn-primary");
    $(".matrix-view-task-alignment").hide();
    $(".zoom-controls").css('display', 'none');
    //$(".timeline-chain-switch").css('display', 'none');
    //$(".filter").css('display', 'none');
    stl.app.saveHighlightText();
    $(".table-view-btn").addClass("active btn-primary");
    window.currentViewId = "table";
    stl.app.CreateTaskToolBar.onViewChange("tableview");
    $(document).trigger("viewchange", "table");
}


stl.app.setActiveView = function (buttonClass) {
    //Set buttons
    $(".view-selector .btn").removeClass("active btn-primary");
    $(".view-selector .btn").removeClass("selected-btn");
    $("." + buttonClass).addClass("active btn-primary");
    //set View
    switch ( buttonClass ){
        case  "matrix-view-btn" :
            Ext.getCmp("content").getLayout().setActiveItem("matrix-view-container");
            stl.app.CreateTaskToolBar.onViewChange("matrixview");
            stl.app.setCurrentViewId(MATRIX_VIEW_ID)
            $(".matrix-view-btn").addClass("selected-btn");
        break;
        case "timeline-view-btn":
            Ext.getCmp("content").getLayout().setActiveItem("timelineview");
            stl.app.CreateTaskToolBar.onViewChange("timelineview");
            stl.app.setCurrentViewId(TIMELINE_VIEW_ID);
            $(".timeline-view-btn").addClass("selected-btn");
        break;
        case "table-view-btn":
            Ext.getCmp("content").getLayout().setActiveItem("tableview");
            stl.app.CreateTaskToolBar.onViewChange("tableview");
            stl.app.setCurrentViewId(TABLE_VIEW_ID);
            $(".table-view-btn").addClass("selected-btn");
        break;
        case "chain-view-btn":
            Ext.getCmp("content").getLayout().setActiveItem("chainview");
            stl.app.CreateTaskToolBar.onViewChange("timelineview");
            stl.app.setCurrentViewId(CHAIN_VIEW_ID);
            $(".timeline-view-btn").addClass("selected-btn");
        break;
        default:
            Ext.getCmp("content").getLayout().setActiveItem("matrix-view-container");
            stl.app.CreateTaskToolBar.onViewChange("matrixview");
            stl.app.setCurrentViewId(MATRIX_VIEW_ID)
            $(".matrix-view-btn").addClass("selected-btn");
        break;

    }

};

stl.app.setCurrentViewId = function (currentViewId) {
    window.currentViewId = currentViewId;
};
stl.app.getCurrentViewId = function () {
    return window.currentViewId ;
};

stl.app.initToolTips = function(){
    $(".matrix-view-btn").prop("title",MATRIX_VIEW_TOOLTIP);
    $(".timeline-view-btn").prop("title",TIMELINE_VIEW_TOOLTIP);
    $(".table-view-btn").prop("title",TABLE_VIEW_TOOLTIP);
    $("#settings-button").prop("title",SETTINGS_TOOLTIP);
    $("#help-button").prop("title",HELP_TOOLTIP);
    $(".milestoneSheet").prop("title",MILESTONE_PANEL_TOOLTIP);
    $(".errorWarningSheet").prop("title",ERROR_PANEL_TOOLTIP);
    $(".resourceSheet").prop("title",RESOURCE_PANEL_TOOLTIP);
    $(".toggle-links-button").prop("title",LINKS_TOOLTIP);
    $(".revisionHistoryImg").prop("title",REVISION_HISTORY_TOOLTIP);
    $(".zoom-out").prop("title",ZOOM_OUT_TOOLTIP);
    $(".zoom-in").prop("title",ZOOM_IN_TOOLTIP);
    $(".task-align-left").prop("title",LEFT_INDENT_TOOLTIP);
    $(".task-align-right").prop("title",RIGHT_INDENT_TOOLTIP);
    $("#calendar-button").prop("title",CALENDAR_SETTING_TOOLTIP);
    /*tool tips 2nd row toolbar buttons*/
    $(".PEIcon-btn").prop("title",CREATE_PE_TOOLTIP);
    $(".CMSIcon-btn").prop("title",CREATE_CMS_TOOLTIP);
    $(".IMSIcon-btn").prop("title",CREATE_IMS_TOOLTIP);
    $(".FKIcon-btn").prop("title",CREATE_FK_TOOLTIP);
    $(".PPIcon-btn").prop("title",CREATE_PP_TOOLTIP);
    $(".normalTaskIcon-btn").prop("title",CREATE_TASK_TOOLTIP);
    $("#undoCCAB").prop("title",REMOVE_BUFFERS_TOOLTIP);
    $(".filter-options-btn").prop("title",REMOVE_FILTER_TOOLTIP);
    $(".DeleteIcon-btn").prop("title",DELETE_TASK_TOOLTIP);
    $(".CutIcon-btn").prop("title",CUT_TASK_TOOLTIP);
    $(".CopyIcon-btn").prop("title",COPY_TASK_TOOLTIP);
    $(".undoicon-btn").prop("title",UNDO_TOOLTIP);
    $(".redoicon-btn").prop("title",REDO_TOOLTIP);
    $(".toggle-auto-links-button").prop("title",AUTO_LINKS_ENABLED_TOOLTIP);
    /*subtask header tooltips in timeline view as its not templatized*/
    $(".subtask-header-cut").prop("title",CUT_SUBTASK_TOOLTIP);
    $(".subtask-header-copy").prop("title",COPY_SUBTASK_TOOLTIP);
    $(".subtask-header-paste").prop("title",PASTE_SUBTASK_TOOLTIP);
    $(".subtask-header-delete").prop("title",DELETE_SUBTASK_TOOLTIP);

    
    
};

stl.app.resetHighlightButton = function(){
    $(".page-header .highlight").find(".button-text").text("Highlight: " + NONE);
    if(stl.app.isHighlightPresent){
        clearAllHighlight();
        stl.app.isHighlightPresent = false;
    }
};
//Unclassed methods
function CutTasksClicked(){
    $(document).trigger("taskCutStart");
}

function CopyTasksClicked(){
    $(document).trigger("taskCopyStart");
}

function DeleteTasksClicked(){
    $(document).trigger("multipleTaskDelete");
}

function AcceptPlanClicked()
{
    PPI_Notifier.confirm(ACCEPT_PLAN_CONFIRM_MESSAGE,ACCEPT_PLAN_TITLE,AcceptPlan,null);
};

function AcceptPlan(){
    var project = stl.model.Project.project;
    var milestones = project._milestones;
    $.each(milestones, function(idx, value){
        if (value.date1 != null){
            value.date1 = new Date(value.projectedDate);
            if (value.taskType === PE_SHORT){
                project.dueDate = value.date1;
            }
            
            Ext.getCmp('CCSummarygrid').updateMilestoneSheetForAcceptPlan(value,false);
        }
    
    });
    stl.app.save(stl.app.ProcessTypeEnum.AUTOSAVE);
    $(document).trigger("acceptPlanClicked", [
                    this,
                    milestones
                ]);
};


function getSaveMenu(evt) {
    var $menu = this.$saveMenu;
    if (!$menu) {
        $(document.body).children(".save-popup").remove();
        $menu = this.$saveMenu = $(".page-header-top .input-group").find(".tool-popup").clone(true);
        $(document.body).append($menu);
    }
    $menu.empty();

    function createMenuItem(text, cssClasses) {
        var $item = $([
            '<div class="tool-item">',
                '<label>',
                    text,
                '</label>',
            '</div>'].join(""));
        if (cssClasses) {
            $item.addClass(cssClasses);
        }
        return $item;
    }

    var $menuItem1 = createMenuItem(SAVE_PROJECT_TEXT);
    $menuItem1.off("click").on("click", function(){
        SaveProject();
        $menu.hide();
    });

    var $menuItem2 = createMenuItem(SAVE_TEMPLATE_TEXT);
        $menuItem2.off("click").on("click",function(){
        showSaveTemplateDialog();
        $menu.hide();
    });

    var $menuItem3 = createMenuItem(SAVE_AS_PROJECT_TEXT);
        $menuItem3.off("click").on("click",function(){
         showSaveProjectDialog();
         $menu.hide();
    });

    $menu.append($menuItem1);
    $menu.append($menuItem2);
    $menu.append($menuItem3);

    return $menu;
};
function getDownloadMenu(evt) {//stl.app.DownloadDebufferedProject
    var $menu = this.$downloadMenu;
    if (!$menu) {
        $(document.body).children(".download-popup").remove();
        $menu = this.$downloadMenu = $(".page-header-top .input-group").find(".tool-popup").clone(true);
        $(document.body).append($menu);
    }
    $menu.empty();

    var isDownloadDebuffered = false;

    if (/[?&]viewproject($|=true)/i.test(location.href) && /[?&]isViewDebuf($|=true)/i.test(location.href)) {
        isDownloadDebuffered = true; 
    }

    function createMenuItem(text, cssClasses) {
        var $item = $([
            '<div class="tool-item">',
                '<label>',
                    text,
                '</label>',
            '</div>'].join(""));
        if (cssClasses) {
            $item.addClass(cssClasses);
        }
        return $item;
    }

        var $menuItem1 = createMenuItem(SPI_FORMAT);
        if (isDownloadDebuffered){
            $menuItem1.off("click").on("click", function(){
                stl.app.DownloadDebufferedProject();
                $menu.hide();
            });
        } else {
            $menuItem1.off("click").on("click", function(){
                stl.app.CheckOutAndDownloadSPIProject(DOWNLOAD_TYPE_SPI);
                $menu.hide();
            });
        }
        

        var $menuItem2 = createMenuItem(CCX_FORMAT);
        $menuItem2.off("click").on("click",function(){
         stl.app.CheckOutAndDownloadSPIProject(DOWNLOAD_TYPE_CCX);
         $menu.hide();

     });

    

    $menu.append($menuItem1);


    var ProjectFileType = stl.app.ProjectDataFromServer.projectFileType;
    var ProjectStatus = stl.app.ProjectDataFromServer.ProjectStatus;
    //Download in .ccx format allowed only if it is a project(not template) and has been checked in atleast once
    var shouldHideCCXDownloadOption = (ProjectFileType === PROJECT_TYPE_PPI_TEMPLATE || ProjectStatus === IN_PLAN_TYPE || isDownloadDebuffered);
    if (!shouldHideCCXDownloadOption){
        $menu.append($menuItem2);
    }
    

    
    //stl.app.disableButton($("#download"), shouldDisableDownloadButton);
    

    return $menu;
};
function getCheckinMenu(){
    var $menu = this.$checkinMenu;
    if (!$menu) {
        $(document.body).children(".checkin-popup").remove();
        $menu = this.$checkinMenu = $(".page-header-top .input-group").find(".tool-popup").clone(true);
        $(document.body).append($menu);
    }
    $menu.empty();

    function createMenuItem(text, cssClasses) {
        var $item = $([
            '<div class="tool-item">',
                '<label>',
                    text,
                '</label>',
            '</div>'].join(""));
        if (cssClasses) {
            $item.addClass(cssClasses);
        }
        if(multipleORs(stl.app.actionTypeValue,1,7,8)){
            $item.addClass("disabled");
        }
        return $item;
    }

    var $menuItem1 = createMenuItem(UNDO_CHECK_OUT);
    $menuItem1.off("click")
    if(!$menuItem1.hasClass('disabled'))
        $menuItem1.on("click", function (evt) {
            InvokeUndoCheckOut(stl.app.ProjectDataFromServer.uid, stl.app.ProjectDataFromServer.name,stl.app.ProjectType);
            toggleDockingGrids('resGrid','resourceSheet',false);
            toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', false);
            $menu.hide();
            });

    $menu.append($menuItem1);
    return $menu;    
}
function getSettingMenu(evt) {
    var $menu = this.$settingMenu;
    if (!$menu) {
        $(document.body).children(".setting-popup").remove();
        $menu = this.$settingMenu = $(".page-header-top .page-header-right .setting-group").find(".tool-popup").clone(true);
        $(document.body).append($menu);
    }
    $menu.empty();

    function createMenuItem(text, cssClasses) {
        var $item = $([
            '<div class="tool-item">',
                '<label>',
                    text,
                '</label>',
            '</div>'].join(""));
        if (cssClasses) {
            $item.addClass(cssClasses);
        }
        return $item;
    }

    var $menuItem1 = createMenuItem(SETTINGS_TEXT);
    $menuItem1.off("click").on("click", showCCSettingDialog.bind(this,$menuItem1));
    $menu.append($menuItem1);

    return $menu;
};


function SaveProject(){
     $(".page-header .logo").removeClass("selected");
    if (stl.app.save) {
            stl.app.save(stl.app.ProcessTypeEnum.SAVE,function(response){
                if(response === TRUE_CONSTANT)
                    PPI_Notifier.success(PROJECT_SAVED_SUCCESS, SUCCESS_MESSAGE);
                else
                    PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);

            });
    }

};




function identifyCCClick(){
    /*$("#identifyCC").addClass("disabled");
    $("#identifyCC").attr('disabled',"disabled");*/
    if(stl.app.isProjectOpenInViewOnlyMode())
        return;
    $("#ccSummary").removeClass("disabled");
    $("#ccSummary").removeAttr("disabled");
    $("#acceptPlan").removeClass("disabled");
    $("#acceptPlan").removeAttr("disabled");
    //$("#checkBufferImpact").removeClass("disabled");
    //$("#checkBufferImpact").removeAttr("disabled");
    $("#redoCCFB").removeClass("disabled");
    $("#redoCCFB").removeAttr("disabled");
    $("#bufferSummary").addClass("disabled");
    $("#bufferSummary").attr("disabled");
    $("#undoCCAB").removeClass("disabled");
    $("#undoCCAB").removeAttr("disabled");
}

function checkBufferImpactClick(){    
    $("#ccSummary").addClass("disabled");
    $("#ccSummary").attr("disabled");
    $("#bufferSummary").removeClass("disabled");
    $("#bufferSummary").removeAttr("disabled");

}

function enableBufferSummaryButton()
{
    $("#bufferSummary").removeClass("disabled");
    $("#bufferSummary").removeAttr("disabled");
}

function enableCCSummarybutton(){
    
    $("#ccSummary").removeClass("disabled");
    $("#ccSummary").removeAttr("disabled");
}

function disableBufferSummaryButton()
{
    $("#bufferSummary").addClass("disabled");
    $("#bufferSummary").prop("disabled", true);
}

function disableCCSummarybutton(){
    
    $("#ccSummary").addClass("disabled");
    $("#ccSummary").prop("disabled", true);
}

function showPlanningButtons(){
    $(".page-header-toolbar-top .plan-buttons").show();
    $(".page-header-toolbar-top .replan-buttons").hide();
}

function showReplanningButtons(){
    $(".page-header-toolbar-top .plan-buttons").hide();
    $(".page-header-toolbar-top .replan-buttons").show();
}


function undoCCABClick(){
    /*$("#identifyCC").removeClass("disabled");
    $("#identifyCC").removeAttr("disabled");*/
    $("#ccSummary").addClass("disabled");
    $("#ccSummary").attr('disabled', "disabled");
    $("#acceptPlan").addClass("disabled");
    $("#acceptPlan").attr('disabled', "disabled");
    //con 1416
    /*$("#checkBufferImpact").addClass("disabled");
    $("#checkBufferImpact").attr('disabled', "disabled");*/
    $("#bufferSummary").addClass("disabled");
    $("#bufferSummary").attr('disabled', "disabled");
    $("#undoCCAB").addClass("disabled");
    $("#undoCCAB").attr('disabled', "disabled");
}

function showCCSettingDialog() {
    var CC_Settings_Obj =  CCSettingsStore.GetCCSettings();
    Ext.create('ProjectPlanning.view.cCSettings.CCSettings', CC_Settings_Obj).show();
}

function showCalendarDialog() {
    
    var CalendarSettings_Obj =  CalendarStore.GetCalendarSettings();
    Ext.create('ProjectPlanning.view.CalendarSettings.CalendarSettings', CalendarSettings_Obj).show();
}

function showSaveTemplateDialog() {
    
    Ext.create('ProjectPlanning.view.saveTemplate.SaveTemplate',{
        title:SAVE_TEMPLATE_TITLE
    }).show();
}
function showSaveProjectDialog() {
    
    Ext.create('ProjectPlanning.view.saveTemplate.SaveTemplate',{
        title:SAVE_AS_PROJECT_TITLE
    }).show();
}


function OnTemplateSelect (template, projectUid, projectName, projectAttributes) {
    
    var uid = projectUid;
    LoadJsonBlobData(template.id, template.name, false, function(response) {
        var loadSuccessfull = showErrorsAndWarnings(response, LOAD_JSON_DATA);
        if (loadSuccessfull) {
            stl.app.loadProjectJson(response, false /*readonly*/ , projectUid, projectName, true, projectAttributes);
        }
    });

}

function showToolbarNotifier (textMsg) {
        $('#page-header-notifier').removeClass('displayNone').addClass('displayBlock');
        $('#page-header-notifier span').text(textMsg);
}
function hideToolbarNotifier () {
    $('#page-header-notifier').removeClass('displayBlock').addClass('displayNone');
}