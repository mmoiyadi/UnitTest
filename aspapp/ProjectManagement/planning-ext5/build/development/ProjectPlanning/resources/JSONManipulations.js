

var ROOTURL = "../../AppServices/PlanningUIService.svc/";

function GetInitialDataForSPI(callbackFunction){
   Ajax("Get", ROOTURL + "GetInitialDataForSPI", "application/json; charset=utf-8", null, "json", callbackFunction, "GetInitialDataForSPI");
}

function LoadUserAndTeamData(divisionId, callbackFunction) {
    var obj = { Data: divisionId };
    Ajax("Post", ROOTURL + "LoadUserAndTeamData", "application/json; charset=utf-8", obj, "json", callbackFunction);
}

function LoadResourceData(divisionId, callbackFunction) {
    var obj = { Data: divisionId };
    Ajax("Post", ROOTURL + "LoadResourceData", "application/json; charset=utf-8", obj, "json", callbackFunction);
}

function GetDivisionBaseCalendars(divisionId, callbackFunction) {
    //var obj = { Data: divisionId };
    var encodedDivisionId = encodeURIComponent(divisionId);
    Ajax("Get", ROOTURL + "GetDivisionBaseCalendars?divisionId=" + encodedDivisionId, "application/json; charset=utf-8", null, "json", callbackFunction);
    //Ajax("Get", ROOTURL + "UndoCheckOut?projectID=" + projectId + "&projectName=" + encodedProjectName, "application/json; charset=utf-8", null, "json", showErrorsAndWarnings, UNDO_CHECKOUT, true);

}

function LoadCalendarData(division, calendarName, callback) {
    var obj = { Data: division };
    var encodedDivName = encodeURIComponent(division);
    var encodedCalendarName = encodeURIComponent(calendarName);
    Ajax("Get", ROOTURL + "LoadCalendarData?division=" + encodedDivName + "&calendarName=" + encodedCalendarName, "application/json; charset=utf-8", null, "json", function (response) {
        stl.app.calendar = JSON.parse(response)[0];
        if (callback) {
            callback.apply(this, arguments);
        }
    });
}

function LoadProjectPrivlegeData(projectId, projectName, callback) {
     var encodedProjectName =encodeURIComponent(projectName);
    Ajax("Get", ROOTURL + "GetModifyProjectPrivilgeForLoggedInUser?projId=" + projectId + "&projName=" + encodedProjectName, "application/json; charset=utf-8", null, "json", function(response) {
        stl.app.projectPrivileges = JSON.parse(response.data);
        if (callback) {
            callback.apply(this, arguments);
        }
    });
}
   

function LoadJsonBlobData(projectId, projectName, checkOut, callback) {
    var encodedProjectName =encodeURIComponent(projectName);
    Ajax("Get", ROOTURL + "LoadJsonBlobData?projectId=" + projectId + "&projectName=" + encodedProjectName + "&checkOut=" + checkOut, "application/json; charset=utf-8", null, "json", callback,LOAD_JSON_DATA,true);
}



function CheckOutSPIProject(projectID, projectName, callback, projectDownloadFormat) {
    var encodedProjectName = encodeURIComponent(projectName); //DownloadAsSPIProject
    var loadType = $("#checkin").is(":visible") ? "LoadProject":"ViewProject";
    switch(projectDownloadFormat){
        case "SPI": stl.app.save(stl.app.ProcessTypeEnum.AUTOSAVE);
            Ajax("Get", ROOTURL + "DownloadAsSPIProject?projectID=" + projectID + "&projectName=" + encodedProjectName + "&loadType=" +loadType , "application/json; charset=utf-8", null, "json", callback, "", false);
            break;
        case "CCX": Ajax("Get", ROOTURL + "CheckOutSPIProject?projectID=" + projectID + "&projectName=" + encodedProjectName, "application/json; charset=utf-8", null, "json", callback, "", false);
            break;


   }
}

function UndoCheckOut(projectId,projectName) {
    var encodedProjectName =encodeURIComponent(projectName);
    Ajax("Get", ROOTURL + "UndoCheckOut?projectID=" + projectId + "&projectName=" + encodedProjectName , "application/json; charset=utf-8", null, "json", showErrorsAndWarnings,UNDO_CHECKOUT, true);
}

function RunIDCC() {
        clearAllHighlight();
        if (stl.app.ProjectDataFromServer) {
            stl.app.toggleSaveTrigger(false);

            var response = ClientSideValidations();
            if (response == null) {
                
                //var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.matrixView.project.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettingsForIDCC()) + " }";
                var JsonData = GetJSONData(stl.app.ProcessTypeEnum.IDCC);
                Ajax("Post", ROOTURL + "RunIDCC", "application/json; charset=utf-8", JsonData, "json", showErrorsAndWarnings, IDCC,true);
            } else {
                showErrorsAndWarnings(response, IDCC)
            }
        }
    }

function ReDoCC() {
    clearAllHighlight();
    if (stl.app.ProjectDataFromServer) {
        stl.app.toggleSaveTrigger(false);

        var response = ClientSideValidations();
        if (response == null) {
            //var projectSummary = stl.app.matrixView.getProjectSummaryInfo();
            //var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.matrixView.project.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettingsForIDCC()) + " }";
            var JsonData = GetJSONData(stl.app.ProcessTypeEnum.REDOCCFB);
            Ajax("Post", ROOTURL + "ReDoCC", "application/json; charset=utf-8", JsonData, "json", showErrorsAndWarnings, REDO_CC,true);
        } else {
            showErrorsAndWarnings(response, REDO_CC)
        }
    }
}
function CheckInSaveAsProject(projectSummary, json, callbk){
    var JsonData = GetJSONData(stl.app.ProcessTypeEnum.CHECKIN, projectSummary, json);
    Ajax("Post", ROOTURL + "CheckInProject", "application/json; charset=utf-8", JsonData, "json", callbk, CHECKIN_PROJECT,true);
}
function CheckInProject() {
    if (stl.app.ProjectDataFromServer) {
        //var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.matrixView.project.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + " }"; 
        var JsonData = GetJSONData(stl.app.ProcessTypeEnum.CHECKIN);
        Ajax("Post", ROOTURL + "CheckInProject", "application/json; charset=utf-8", JsonData, "json", showErrorsAndWarnings, CHECKIN_PROJECT,true);
    }
}


function CheckBufferImpact() {
    clearAllHighlight();
    if (stl.app.ProjectDataFromServer) {
        stl.app.toggleSaveTrigger(false);

        var response = ClientSideValidations();
        if (response == null) {
            //var projectSummary = stl.app.matrixView.getProjectSummaryInfo();
            //var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.matrixView.project.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettingsForIDCC()) + " }";
            var JsonData = GetJSONData(stl.app.ProcessTypeEnum.CHECKBUFFERIMPACT);
            Ajax("Post", ROOTURL + "CheckBufferImpact", "application/json; charset=utf-8", JsonData, "json", showErrorsAndWarnings, CHECK_BUFFER_IMPACT,true);
        } else {
            showErrorsAndWarnings(response, "CheckBufferImpact")
        }
    }
}

function CheckOutProject(projectId) {
  //var obj = { Data: projectId };
   Ajax("Get", ROOTURL + "CheckOutProject?projectId=" + projectId, "application/json; charset=utf-8", null, "json", showErrorsAndWarnings, CHECKOUT,true);
}
function ViewProject(projectId, isDebuffered) {
   //var obj = { Data: projectId };
   if (isDebuffered) {
       Ajax("Get", ROOTURL + "ViewProject?projectId=" + projectId + "&isDebuffered=True", "application/json; charset=utf-8", null, "json", showErrorsAndWarnings, VIEW_DEBUFFERED_PROJECT, true);
   } else {
       Ajax("Get", ROOTURL + "ViewProject?projectId=" + projectId, "application/json; charset=utf-8", null, "json", showErrorsAndWarnings, VIEW_PROJECT, true);
   }
   
}
function LoadProjectRevisionList(projectId,callback) {
    Ajax("Get", ROOTURL + "LoadProjectRevisionList?projectID="+ projectId, "application/json; charset=utf-8", null, "json",callback, GET_REVISION_HISTORY,false);

}
function LoadProjectRevision(projectId,revisionId,callback)  {
    Ajax("Get", ROOTURL + "LoadProjectRevision?projectID="+ projectId +"&revisionId="+ revisionId, "application/json; charset=utf-8", null, "json", callback, GET_REVISION,true);

}

var BrowserSupportedMimeTypes = {
    "image/jpeg": true,
    "image/png": true,
    "image/gif": true,
    "image/svg+xml": true,
    "image/bmp": true,
    "image/x-windows-bmp": true,
    "image/webp": true,
    "audio/wav": true,
    "audio/mpeg": true,
    "audio/webm": true,
    "audio/ogg": true,
    "video/mpeg": true,
    "video/webm": true,
    "video/ogg": true,
    "text/plain": true,
    "text/html": true,
    "text/xml": true,
    "application/xhtml+xml": true,
    "application/json": true
};

function createCustomBlobForIE9(response, projectName) {
    var URI = 'data:text/plain;charset=utf-8,';
    var fileName = projectName +".spi";

    var testlink = window.open("about:blank", "_blank");

    testlink.document.write(response); //fileData has contents for the file

    testlink.document.close();

    testlink.document.execCommand('SaveAs', false, fileName);

    testlink.close();
}

var showSave = function (data, name, mimetype) {
    if (!mimetype) mimetype = "application/octet-stream";
    // Again I need to filter the mime type so a download is forced.
    if (BrowserSupportedMimeTypes[mimetype.split(";")[0]] === true) {
        mimetype = "application/octet-stream";
    }
    window.open("data:" + mimetype + "," + data, '_blank', '');
};

function Ajax(Type, Url, ContentType, Data, DataType, callbk, callingMethod,showLoadIcon) {
    if (Type == "Get") {
        // To stop IE from caching Get requests
        if (Url.indexOf("?") == -1)
            Url = Url + "?random=" + Math.random();
        else
            Url = Url + "&random=" + Math.random();
    }

    if (Url.indexOf("RunIDCC") >= 0 || Url.indexOf("CheckInProject") >= 0 || Url.indexOf("ReDoCC") >= 0 || Url.indexOf("CheckBufferImpact") >= 0) {
       
      var JsonData=Data; 
    }
    else{
       var JsonData = JSON.stringify(Data); 
    }
    $.ajax({
        type: Type,
        dataType: DataType,
        url: Url,
        data: JsonData,
        contentType: ContentType,
        beforeSend: function (xhr, opts) {
            showLoadingIcon(showLoadIcon);
        }
    })
   .success(function (response) {
       if (response != SESSION_TIMED_OUT) {//DownloadAsSPIProject

           if (Url.indexOf("CheckOutSPIProject") >= 0) {
               response = JSON.parse(response);
           }

           if (Url.indexOf("DownloadAsSPIProject") >= 0) {
               response = JSON.parse(response);

           }

           if (callbk) {
               callbk.call(this, response, callingMethod);
           }
       }
       else {
           RedirectToLogInPage();
       }
   })
   .error(function (response) {
       if (response != SESSION_TIMED_OUT) {
           if (Url.indexOf("RunIDCC") >= 0) {
               alert("IDCC failed!" + response);
           }
           else if (Url.indexOf("CommitProject") >= 0) {
               alert("Commit failed!");
           } else if (Url.indexOf("CheckOutSPIProject") >= 0) {
               alert("Download failed!");
           }
        hideLoadingIcon();
       }
       else {
           RedirectToLogInPage();
       }
   });
}
function GetJSONData(processType,projectSummary, json){
    if(!projectSummary)
        projectSummary = stl.app.getProjectSummaryInfo();
    if(!json)
        json = stl.app.ProjectDataFromServer.getJSON();
    return "{ \"processType\": " + processType + ",\"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + json + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettingsForIDCC()) + ", \"CCSummary\": " + JSON.stringify(GetUpdatedCCSummaryData()) + " }";
}
function showLoadingIcon(showLoadIcon) {
    if(showLoadIcon)
    {
        document.getElementById('modal').style.display = 'block';
        document.getElementById('fade').style.display = 'block'; 
        $('#modal').css('z-index',200000);
        $('#fade').css('z-index',100000);
    }
}

function hideLoadingIcon() {
        document.getElementById('modal').style.display = 'none';
        document.getElementById('fade').style.display = 'none';
}

function showErrorsAndWarnings(response, callingMethod) {
    try {
        if (response) {
            var responseObj = parseServerResponse(response);
            if (!checkServerErrorInResponse(responseObj)) {
                if (responseObj.Errors && responseObj.Errors.length > 0) {
                    toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
                    if (typeof(callingMethod) != "undefined") {
                        PPI_Notifier.error(ERROR_FOUND_DURING + callingMethod + CHECK_ERROR_DIALOG, FAILURE_MESSAGE);
                        hideLoadingIcon();
                    }
                    var errData = [];
                    var warnData = [];
                    console.log(responseObj);
                    console.log("Error running IDCC:", response);
                    for (i = 0; i < responseObj.Errors.length; i++) {
                        errData.push({
                            code: responseObj.Errors[i].Code,
                            desc: responseObj.Errors[i].Description,
                            type: responseObj.Errors[i].Type,
                            items: responseObj.Errors[i].itemIds,
                            isError: true
                        });
                    }
                    if (responseObj.Warnings != null) {
                        for (i = 0; i < responseObj.Warnings.length; i++) {
                            warnData.push({
                                code: responseObj.Warnings[i].Code,
                                desc: responseObj.Warnings[i].Description,
                                type: responseObj.Warnings[i].Type,
                                items: responseObj.Warnings[i].itemIds,
                                isError: false
                            });
                        }
                    }

                    errStore.loadData(errData);
                    warnStore.loadData(warnData);
                    toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', true);
                    //SS:2192 if load is successfull for below methods, we dont show the success notifier
                    //also return the call to calling method and execute further statements  in calling method 
                    if (multipleORs(callingMethod ,GET_REVISION_HISTORY,GET_REVISION,LOAD_JSON_DATA))
                        return false;
                } else {
                    if (Ext.getCmp('errorDisplayGrid')) {
                        errStore.clearData();
                        warnStore.clearData();
                        toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', false);
                    }
                    var readOnly = false;
                    var isViewChangeRequired;
                    var isHighlightRequired;
                    var isDebuffered = false;
                    //SS:2192 if load is successfull for below methods, we dont show the success notifier
                    //also return the call to calling method and execute further statements  in calling method 
                    if (!multipleORs(callingMethod ,GET_REVISION_HISTORY,GET_REVISION,LOAD_JSON_DATA))
                        PPI_Notifier.success(callingMethod + SUCCESSFUL, SUCCESS_MESSAGE);
                    else
                        return true;
                        
                    
                    if (callingMethod == IDCC) {
                        identifyCCClick();
                        isViewChangeRequired = true;
                        isHighlightRequired = true;
                    } else if (callingMethod == CHECK_BUFFER_IMPACT || callingMethod == REDO_CC) {
                        checkBufferImpactClick();
                        isViewChangeRequired = true;
                        isHighlightRequired = true;
                    } else if (callingMethod == CHECKIN_PROJECT) {
                        RefreshModifyProjectWindow();
                        if (JSON.parse(response).projectData.ProjectFileType !== PROJECT_TYPE_PPI_TEMPLATE)
                            stl.app.ProjectType = 0;
                        readOnly = true;
                        stl.app.handleCheckInChekOutButtons(stl.app.ActionType.CHECKIN);
                        stl.app.ProjectCheckOutStatus = 0;
                        isViewChangeRequired = false;
                        isHighlightRequired = true;
                    } else if (callingMethod == UNDO_CHECKOUT) {
                        RefreshModifyProjectWindow();
                        stl.app.ProjectCheckOutStatus = 0;
                        stl.app.handleCheckInChekOutButtons(stl.app.ActionType.UNDOCHECKOUT);
                        readOnly = true;
                        isViewChangeRequired = false;
                        isHighlightRequired = true;
                    } else if (callingMethod == CHECKOUT) {
                        RefreshModifyProjectWindow();
                        stl.app.handleCheckInChekOutButtons(stl.app.ActionType.CHECKEDOUT);
                        stl.app.ProjectCheckOutStatus = 1;
                        readOnly = false;
                        isViewChangeRequired = false;
                        isHighlightRequired = true;
                    } else if (callingMethod == VIEW_PROJECT) {
                        stl.app.handleCheckInChekOutButtons(stl.app.ActionType.VIEW);
                        readOnly = true;
                        isViewChangeRequired = true;
                        isHighlightRequired = true;
                    } else if (callingMethod == VIEW_DEBUFFERED_PROJECT) {
                        stl.app.handleCheckInChekOutButtons(stl.app.ActionType.VIEWDEBUFFEREDPLAN);
                        readOnly = true;
                        isViewChangeRequired = true;
                        isHighlightRequired = true;
                        isDebuffered = true;
                    }
                   
                   
                    SetRevisionHistoryReadOnly(readOnly);
                    $(document).trigger("projectjsonchange", [response, readOnly /*readonly*/ , isViewChangeRequired, isHighlightRequired, isDebuffered]);

                }
            }
        } else {
            PPI_Notifier.success(callingMethod + SUCCESSFUL, SUCCESS_MESSAGE);

        }
        if (stl.app.toggleSaveTrigger) {
            stl.app.toggleSaveTrigger(true);
        }
    } catch (e) {
        console.log(e);
        onProjectLoadFailed();

    }
}
function parseServerResponse(response) {
    var responseObj;
    if (typeof (response) == "string") {
            responseObj = JSON.parse(response);
        } else {
            responseObj = response;
        }
    return  responseObj;
}

function checkServerErrorInResponse (response) {
     var responseObj,serverErrorOccurred;
     serverErrorOccurred =false;
        responseObj = parseServerResponse(response);
        if (responseObj && 
                (responseObj.Errors && responseObj.Errors.length > 0)  &&
                (responseObj.Errors[0].Code === SERVER_ERROR_CODE) ) {
                    serverErrorOccurred =true;
                    isSaveOnBrowserClose = false;
                    hideLoadingIcon();
                    document.getElementById('fade').style.display = 'block'; 
                    PPI_Notifier.alertModal(INTERNAL_ERROR_STRING,INTERNAL_ERROR_TITLE,function(){
                        logoutUser();
                    });
                }
        return serverErrorOccurred;

}
validateResponseFromServer = function(response) {
    var parsedServerResponse = JSON.parse(response);

    switch (parsedServerResponse.ReturnTypeCode) {
        case SERVER_RESPONSE_RETURN_TYPE_CODES.FAILURE:
            if (parsedServerResponse.Errors && parsedServerResponse.Errors.length > 0) {
                parsedServerResponse.errorReturned = true;
            }
            if (parsedServerResponse.Warnings && parsedServerResponse.Warnings.length > 0) {
                parsedServerResponse.warningReturned = true;
            }
            if (parsedServerResponse.Data) {
                parsedServerResponse.dataReturned = true;
            }
            return parsedServerResponse
            break;
        case SERVER_RESPONSE_RETURN_TYPE_CODES.SYSTEM_ADMINISTRATOR_ERROR:
            var errString = parsedServerResponse.Errors[0].Description + INTERNAL_ERROR_STRING;
            PPI_Notifier.alertModal(errString, INTERNAL_ERROR_TITLE, function() {
                logoutUser();
            });
            break;
        case SERVER_RESPONSE_RETURN_TYPE_CODES.SESSION_TIMED_OUT:
            RedirectToLogInPage();
            break;
        default:
            parsedServerResponse.dataReturned = true;
            return parsedServerResponse;
    }
};

function SetRevisionHistoryReadOnly(isReadOnly) {
    if (stl.app.revisionHistory) {
        stl.app.revisionHistory.readOnly = isReadOnly;
        stl.app.revisionHistory.OnReadOnly();
    }

}

function toggleDockingGrids(gridId, gridIconCls, state) {
    var dockedGrids = ['CCSummarygrid', 'resGrid', 'Error_Warning_Window'];
    //var dockedGridIconIdsMap = { 'CCSummarygrid': 'milestoneSheet', 'resGrid': 'resourceSheet', 'Error_Warning_Window': 'errorWarningSheet' };

    var gridCmp = Ext.getCmp(gridId);
    gridCmp.setVisible(state);

    if (state) {
        $("." + gridIconCls).addClass('pressed');       
    }
    else {
        $("." + gridIconCls).removeClass('pressed');
    }

    // Change style of last open window to take up available space and turn off resize handles 
    var dockingPanel = Ext.getCmp('dockingPanel');
    
    var foundFlexible = false;

    var visibleGridsCount = 0;

    for (i = dockedGrids.length - 1; i >= 0; i--) {
        var grid = Ext.getCmp(dockedGrids[i]);
        if (grid && !grid.isHidden()) {
            visibleGridsCount = visibleGridsCount + 1;
            if (!foundFlexible) {
                foundFlexible = true;
                Ext.apply(grid, {
                    //flex: 1,
                    resizable: false,
                    resizeHandles: ''
                });
            }
            else {
                Ext.apply(grid, {
                    //flex: 0,
                    resizable: true,
                    resizeHandles: 'e'
                });
            }
        }
    }
    dockingPanel.doLayout();

    var isDockingPanelVisible = dockingPanel.isVisible();
    if (visibleGridsCount > 0 && !isDockingPanelVisible) {
        dockingPanel.setVisible(true);
    }
    else if(visibleGridsCount == 0 && isDockingPanelVisible) {
        dockingPanel.setVisible(false);
    }
}


function ResourceAssignmentValidation(responseObj) {
    var resourceAssignmentError = stl.app.ProjectDataFromServer.ResourceAssignmentValidation(responseObj);
    return resourceAssignmentError;
}

function GetErrorsAndWarningsObject() {
    var responseObj = {};
    responseObj.Errors = [];
    responseObj.Warnings = [];
    return responseObj;
}
//Validate before IDCC if all the tasks including FK/PT/SNET/Buffer have a valid successor.
function TasksSuccessorValidation(responseObj) {
    var validNetworkError = stl.app.ProjectDataFromServer.ValidateAllTasksHaveSuccessors(responseObj);
    return validNetworkError;
}

function ClientSideValidations() {
    var responseObj = GetErrorsAndWarningsObject();
    var isError = false;
    var taskSuccessorError = TasksSuccessorValidation(responseObj);
    var resourceAssignmentError = ResourceAssignmentValidation(responseObj);
    isError = taskSuccessorError || resourceAssignmentError;
    if (isError) {
        return responseObj;
    } else {
        return null;
    }
}

function RefreshModifyProjectWindow() {
    //$($(window.opener.frames.parent.document).find('#frmRptFilter')[0].contentWindow.document).find('#CreateReport').click();
    try {
        var modifyProjectWindow = window.opener.frames;
        if (modifyProjectWindow) {
            
            var frameDocument = $(window.opener.frames.parent.document);
            if (frameDocument) {
                
                var filterFrame = $(frameDocument).find('#frmRptFilter');
                if (filterFrame) {
                    
                    var filterFrameDocument = $(filterFrame)[0].contentWindow.document;
                    if(filterFrameDocument){
                        
                        var createReportButton = $(filterFrameDocument).find('#CreateReport');
                        if (createReportButton)
                            $(createReportButton).click();
                    }
                }
            }
        }
   }
   catch(ex) {
    console.log(ex.message);
   }
}


