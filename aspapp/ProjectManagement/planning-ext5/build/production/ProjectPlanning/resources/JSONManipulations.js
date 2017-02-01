var ROOTURL="../../AppServices/PlanningUIService.svc/";function GetInitialDataForSPI(a){Ajax("Get",ROOTURL+"GetInitialDataForSPI","application/json; charset=utf-8",null,"json",a,"GetInitialDataForSPI")}function LoadUserAndTeamData(c,a){var b={Data:c};Ajax("Post",ROOTURL+"LoadUserAndTeamData","application/json; charset=utf-8",b,"json",a)}function LoadResourceData(c,a){var b={Data:c};Ajax("Post",ROOTURL+"LoadResourceData","application/json; charset=utf-8",b,"json",a)}function GetDivisionBaseCalendars(c,a){var b=encodeURIComponent(c);Ajax("Get",ROOTURL+"GetDivisionBaseCalendars?divisionId="+b,"application/json; charset=utf-8",null,"json",a)}function LoadCalendarData(f,a,e){var c={Data:f};var b=encodeURIComponent(f);var d=encodeURIComponent(a);Ajax("Get",ROOTURL+"LoadCalendarData?division="+b+"&calendarName="+d,"application/json; charset=utf-8",null,"json",function(g){stl.app.calendar=JSON.parse(g)[0];if(e){e.apply(this,arguments)}})}function LoadProjectPrivlegeData(b,a,d){var c=encodeURIComponent(a);Ajax("Get",ROOTURL+"GetModifyProjectPrivilgeForLoggedInUser?projId="+b+"&projName="+c,"application/json; charset=utf-8",null,"json",function(e){stl.app.projectPrivileges=JSON.parse(e.data);if(d){d.apply(this,arguments)}})}function LoadJsonBlobData(c,b,a,e){var d=encodeURIComponent(b);Ajax("Get",ROOTURL+"LoadJsonBlobData?projectId="+c+"&projectName="+d+"&checkOut="+a,"application/json; charset=utf-8",null,"json",e,LOAD_JSON_DATA,true)}function CheckOutSPIProject(a,b,d){var c=encodeURIComponent(b);Ajax("Get",ROOTURL+"CheckOutSPIProject?projectID="+a+"&projectName="+c,"application/json; charset=utf-8",null,"json",d,"",false)}function UndoCheckOut(b,a){var c=encodeURIComponent(a);Ajax("Get",ROOTURL+"UndoCheckOut?projectID="+b+"&projectName="+c,"application/json; charset=utf-8",null,"json",showErrorsAndWarnings,UNDO_CHECKOUT,true)}function RunIDCC(){clearAllHighlight();if(stl.app.ProjectDataFromServer){stl.app.toggleSaveTrigger(false);var a=ClientSideValidations();if(a==null){var b=GetJSONData(stl.app.ProcessTypeEnum.IDCC);Ajax("Post",ROOTURL+"RunIDCC","application/json; charset=utf-8",b,"json",showErrorsAndWarnings,IDCC,true)}else{showErrorsAndWarnings(a,IDCC)}}}function ReDoCC(){clearAllHighlight();if(stl.app.ProjectDataFromServer){stl.app.toggleSaveTrigger(false);var a=ClientSideValidations();if(a==null){var b=GetJSONData(stl.app.ProcessTypeEnum.REDOCCFB);Ajax("Post",ROOTURL+"ReDoCC","application/json; charset=utf-8",b,"json",showErrorsAndWarnings,REDO_CC,true)}else{showErrorsAndWarnings(a,REDO_CC)}}}function CheckInProject(){if(stl.app.ProjectDataFromServer){var a=GetJSONData(stl.app.ProcessTypeEnum.CHECKIN);Ajax("Post",ROOTURL+"CheckInProject","application/json; charset=utf-8",a,"json",showErrorsAndWarnings,CHECKIN_PROJECT,true)}}function CheckBufferImpact(){clearAllHighlight();if(stl.app.ProjectDataFromServer){stl.app.toggleSaveTrigger(false);var a=ClientSideValidations();if(a==null){var b=GetJSONData(stl.app.ProcessTypeEnum.CHECKBUFFERIMPACT);Ajax("Post",ROOTURL+"CheckBufferImpact","application/json; charset=utf-8",b,"json",showErrorsAndWarnings,CHECK_BUFFER_IMPACT,true)}else{showErrorsAndWarnings(a,"CheckBufferImpact")}}}function CheckOutProject(a){Ajax("Get",ROOTURL+"CheckOutProject?projectId="+a,"application/json; charset=utf-8",null,"json",showErrorsAndWarnings,CHECKOUT,true)}function ViewProject(a){Ajax("Get",ROOTURL+"ViewProject?projectId="+a,"application/json; charset=utf-8",null,"json",showErrorsAndWarnings,VIEW_PROJECT,true)}function LoadProjectRevisionList(a,b){Ajax("Get",ROOTURL+"LoadProjectRevisionList?projectID="+a,"application/json; charset=utf-8",null,"json",b,GET_REVISION_HISTORY,false)}function LoadProjectRevision(b,a,c){Ajax("Get",ROOTURL+"LoadProjectRevision?projectID="+b+"&revisionId="+a,"application/json; charset=utf-8",null,"json",c,GET_REVISION,true)}function Ajax(a,b,c,j,h,g,f,d){if(a=="Get"){if(b.indexOf("?")==-1){b=b+"?random="+Math.random()}else{b=b+"&random="+Math.random()}}if(b.indexOf("RunIDCC")>=0||b.indexOf("CheckInProject")>=0||b.indexOf("ReDoCC")>=0||b.indexOf("CheckBufferImpact")>=0){var e=j}else{var e=JSON.stringify(j)}$.ajax({type:a,dataType:h,url:b,data:e,contentType:c,beforeSend:function(l,k){showLoadingIcon(d)}}).success(function(k){if(k!=SESSION_TIMED_OUT){if(b.indexOf("CheckOutSPIProject")>=0){k=JSON.parse(k)}if(g){g.call(this,k,f)}}else{RedirectToLogInPage()}}).error(function(k){if(k!=SESSION_TIMED_OUT){if(b.indexOf("RunIDCC")>=0){alert("IDCC failed!"+k)}else{if(b.indexOf("CommitProject")>=0){alert("Commit failed!")}else{if(b.indexOf("CheckOutSPIProject")>=0){alert("Download failed!")}}}hideLoadingIcon()}else{RedirectToLogInPage()}})}function GetJSONData(a){var b=stl.app.getProjectSummaryInfo();return'{ "processType": '+a+',"projectData": '+JSON.stringify(b)+', "jsonBlob": '+stl.app.ProjectDataFromServer.getJSON()+', "CCSettings": '+JSON.stringify(CCSettingsStore.GetCCSettingsForIDCC())+', "CCSummary": '+JSON.stringify(GetUpdatedCCSummaryData())+" }"}function showLoadingIcon(a){if(a){document.getElementById("modal").style.display="block";document.getElementById("fade").style.display="block"}}function hideLoadingIcon(){document.getElementById("modal").style.display="none";document.getElementById("fade").style.display="none"}function showErrorsAndWarnings(d,f){try{if(d){var c=parseServerResponse(d);if(!checkServerErrorInResponse(c)){if(c.Errors&&c.Errors.length>0){toggleDockingGrids("CCSummarygrid","milestoneSheet",false);if(typeof(f)!="undefined"){PPI_Notifier.error(ERROR_FOUND_DURING+f+CHECK_ERROR_DIALOG,FAILURE_MESSAGE);hideLoadingIcon()}var j=[];var g=[];console.log(c);console.log("Error running IDCC:",d);for(i=0;i<c.Errors.length;i++){j.push({code:c.Errors[i].Code,desc:c.Errors[i].Description,type:c.Errors[i].Type,items:c.Errors[i].itemIds,isError:true})}if(c.Warnings!=null){for(i=0;i<c.Warnings.length;i++){g.push({code:c.Warnings[i].Code,desc:c.Warnings[i].Description,type:c.Warnings[i].Type,items:c.Warnings[i].itemIds,isError:false})}}errStore.loadData(j);warnStore.loadData(g);toggleDockingGrids("Error_Warning_Window","errorWarningSheet",true);if(multipleORs(f,GET_REVISION_HISTORY,GET_REVISION,LOAD_JSON_DATA)){return false}}else{if(Ext.getCmp("errorDisplayGrid")){errStore.clearData();warnStore.clearData();toggleDockingGrids("Error_Warning_Window","errorWarningSheet",false)}var k=false;var b;var a;if(!multipleORs(f,GET_REVISION_HISTORY,GET_REVISION,LOAD_JSON_DATA)){PPI_Notifier.success(f+SUCCESSFUL,SUCCESS_MESSAGE)}else{return true}if(f==IDCC){identifyCCClick();b=true;a=true}else{if(f==CHECK_BUFFER_IMPACT||f==REDO_CC){checkBufferImpactClick();b=true;a=true}else{if(f==CHECKIN_PROJECT){RefreshModifyProjectWindow();if(JSON.parse(d).projectData.ProjectFileType!==PROJECT_TYPE_PPI_TEMPLATE){stl.app.ProjectType=0}k=true;stl.app.handleCheckInChekOutButtons(stl.app.ActionType.CHECKIN);stl.app.ProjectCheckOutStatus=0;b=false;a=true}else{if(f==UNDO_CHECKOUT){RefreshModifyProjectWindow();stl.app.ProjectCheckOutStatus=0;stl.app.handleCheckInChekOutButtons(stl.app.ActionType.UNDOCHECKOUT);k=true;b=false;a=true}else{if(f==CHECKOUT){RefreshModifyProjectWindow();stl.app.handleCheckInChekOutButtons(stl.app.ActionType.CHECKEDOUT);stl.app.ProjectCheckOutStatus=1;k=false;b=true;a=true}else{if(f==VIEW_PROJECT){stl.app.handleCheckInChekOutButtons(stl.app.ActionType.VIEW);k=true;b=true;a=true}}}}}}SetRevisionHistoryReadOnly(k);$(document).trigger("projectjsonchange",[d,k,b,a])}}}else{PPI_Notifier.success(f+SUCCESSFUL,SUCCESS_MESSAGE)}if(stl.app.toggleSaveTrigger){stl.app.toggleSaveTrigger(true)}}catch(h){console.log(h);onProjectLoadFailed()}}function parseServerResponse(b){var a;if(typeof(b)=="string"){a=JSON.parse(b)}else{a=b}return a}function checkServerErrorInResponse(b){var a,c;c=false;a=parseServerResponse(b);if(a&&(a.Errors&&a.Errors.length>0)&&(a.Errors[0].Code===SERVER_ERROR_CODE)){c=true;isSaveOnBrowserClose=false;hideLoadingIcon();document.getElementById("fade").style.display="block";PPI_Notifier.alertModal(INTERNAL_ERROR_STRING,INTERNAL_ERROR_TITLE,function(){logoutUser()})}return c}function SetRevisionHistoryReadOnly(a){if(stl.app.revisionHistory){stl.app.revisionHistory.readOnly=a;stl.app.revisionHistory.OnReadOnly()}}function toggleDockingGrids(d,k,b){var f=["CCSummarygrid","resGrid","Error_Warning_Window"];var e=Ext.getCmp(d);e.setVisible(b);if(b){$("."+k).addClass("pressed")}else{$("."+k).removeClass("pressed")}var h=Ext.getCmp("dockingPanel");var j=false;var c=0;for(i=f.length-1;i>=0;i--){var a=Ext.getCmp(f[i]);if(a&&!a.isHidden()){c=c+1;if(!j){j=true;Ext.apply(a,{resizable:false,resizeHandles:""})}else{Ext.apply(a,{resizable:true,resizeHandles:"e"})}}}h.doLayout();var g=h.isVisible();if(c>0&&!g){h.setVisible(true)}else{if(c==0&&g){h.setVisible(false)}}}function ResourceAssignmentValidation(a){var b=stl.app.ProjectDataFromServer.ResourceAssignmentValidation(a);return b}function GetErrorsAndWarningsObject(){var a={};a.Errors=[];a.Warnings=[];return a}function TasksSuccessorValidation(a){var b=stl.app.ProjectDataFromServer.ValidateAllTasksHaveSuccessors(a);return b}function ClientSideValidations(){var b=GetErrorsAndWarningsObject();var c=false;var a=TasksSuccessorValidation(b);var d=ResourceAssignmentValidation(b);c=a||d;if(c){return b}else{return null}}function RefreshModifyProjectWindow(){try{var b=window.opener.frames;if(b){var d=$(window.opener.frames.parent.document);if(d){var a=$(d).find("#frmRptFilter");if(a){var e=$(a)[0].contentWindow.document;if(e){var f=$(e).find("#CreateReport");if(f){$(f).click()}}}}}}catch(c){console.log(c.message)}};