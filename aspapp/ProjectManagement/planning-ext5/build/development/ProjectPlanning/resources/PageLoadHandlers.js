stl.app.extractProjectDetailsFromURL = function (Url) {
    var projectId = /projectId=[0-9]*/i.exec(decodeURIComponent(escape(Url)))[0].split('=')[1],
        encodedProjectName = /projectname=\w*[^?<>,;".|:^*#&]*/.exec(Url)[0].split('=')[1],
        projectName = decodeURIComponent(encodedProjectName),
        readonly = /[?&]readonly($|=true)/i.test(Url),
        projectType = parseInt(/prjType=\w*[^?<>,;".|:^*#&]*/.exec(decodeURIComponent(escape(Url)))[0].split('=')[1]);
        stl.app.ProjectType =projectType;
        if(/checkoutStatus=\w*[^?<>,;".|:^*#&]*/.exec(Url))
        stl.app.ProjectCheckOutStatus = parseInt(/checkoutStatus=\w*[^?<>,;".|:^*#&]*/.exec(decodeURIComponent(escape(Url)))[0].split('=')[1]);
    return {
        projectId: projectId,
        projectName : projectName,
        readonly : readonly,
        projectType : projectType 
    }
};


stl.app.readInvokeloadTypeFromURL = function () {
    if(/[?&]createnew($|=true)/i.test(location.href)) {
            InvokeCreateNewProject();
            stl.app.handleCheckInChekOutButtons(stl.app.ActionType.CREATENEW);
        }
    else {
       stl.app.ProjectDetailsFromURL=stl.app.extractProjectDetailsFromURL(location.href);
       var projectDetails = stl.app.ProjectDetailsFromURL;
        if (/[?&]checkout($|=true)/i.test(location.href)) {
            InvokeCheckOut(projectDetails.projectId, projectDetails.projectName,  projectDetails.projectType, 0, false, true);

        }
        else if (/[?&]editcheckout($|=true)/i.test(location.href)) {
             var actionType = (projectDetails.projectType === PROJECT_STATUS_IN_PLAN_INTEGER) ? 
                            stl.app.ActionType.INPLANEDITCHECKOUT : stl.app.ActionType.EDITCHECKEDOUT;
            InvokeEditCheckOut(projectDetails.projectId,projectDetails.projectName,false,actionType,false, false)
        }
        else if (/[?&]viewproject($|=true)/i.test(location.href) && /[?&]isViewDebuf($|=true)/i.test(location.href)) {
            InvokeViewProject(projectDetails.projectId, projectDetails.projectName,  projectDetails.projectType,stl.app.ActionType.VIEW, true, true, true);

        }
        else if (/[?&]viewproject($|=true)/i.test(location.href)) {
            InvokeViewProject(projectDetails.projectId, projectDetails.projectName, projectDetails.projectType, stl.app.ActionType.VIEW, true, true);

        }  
    }
};



function InvokeCheckIn() {

    if (stl.app.ProjectDataFromServer.isIDCCed) {
             CheckInProject();
        } 
        else {
            PPI_Notifier.error(ERR_MSG_IDCC_NOT_DONE, FAILURE_MESSAGE);
    }
}

function InvokeCheckOut(projectId, projectName, projectType, checkoutStatus, isViewChangeRequired, isHighlightRequired) {
    if( projectType === PROJECT_STATUS_IN_PLAN_INTEGER ) {
        InvokeEditCheckOut(projectId, projectName, true, stl.app.ActionType.INPLANCHECKEDOUT, false/*readonly*/, isViewChangeRequired, isHighlightRequired);  
    }
    else if (checkoutStatus === 1){
        InvokeEditCheckOut(projectId, projectName, true, stl.app.ActionType.CHECKEDOUT, false/*readonly*/, isViewChangeRequired, isHighlightRequired);  
    }
    else {
        CheckOutProject(projectId);
    }
}
function InvokeUndoCheckOut(projectId,projectName) {
    UndoCheckOut(projectId,projectName);
    
    
}
function InvokeViewProject(projectId, projectName, projectType, actionType, isViewChangeRequired, isHighlightRequired, isDebuffered) {
    //set this flag so that we handle checkout button as per privilege
    stl.app.IsViewproject = true;
	if( projectType === PROJECT_STATUS_IN_PLAN_INTEGER ) {
	    InvokeEditCheckOut(projectId, projectName, false, actionType, true/*readonly*/, isViewChangeRequired, isHighlightRequired); 
    }
    else {
        ViewProject(projectId, isDebuffered);
    }
}

// checkout is true if this function call is from Checkout action.
// checkout is false for EditCheckedOut/ViewProject function call.
function InvokeEditCheckOut(projectId, projectName, checkOut, actionType, readOnlyFlag, isViewChangeRequired, isHighlightRequired) {
        LoadJsonBlobData(projectId,projectName,checkOut,function (response) {
            
                var loadSuccessful = showErrorsAndWarnings(response,LOAD_JSON_DATA);
                if(loadSuccessful ) {
                //stl.app.loadProjectJson(response,readOnlyFlag);
                $(document).trigger("projectjsonchange", [response, readOnlyFlag /*readonly*/, isViewChangeRequired, isHighlightRequired]);
                RefreshModifyProjectWindow();
                stl.app.handleCheckInChekOutButtons(actionType);
                stl.app.ProjectCheckOutStatus =1;
            }
    });
}




function InvokeCreateNewProject() {
    Ext.create('ProjectPlanning.view.newProject.NewProject',{}).show();
}

var onProjectLoadFailed = function(){
    hideLoadingIcon();
    PPI_Notifier.error(ERROR_OCCURRED_PROJECT_LOAD);
}
