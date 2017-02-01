/**
 * The main application class. An instance of this class is created by app.js when it calls
 * Ext.application(). This is the ideal place to handle application launch and initialization
 * details.
 */

window.stl = window.stl || {};
stl.app = stl.app || {};

Ext.define('ProjectPlanning.Application', {
    extend: 'Ext.app.Application',

    name: 'ProjectPlanning',

    stores: [
        // TODO: add global / shared stores here
    ],

    launch: function () {
        //window.app = this;
        // TODO - Launch the application
    }
});

function getIntialDataFromServer() {
    GetInitialDataForSPI(initializeApplicationData);
};

var initializeApplicationData = function (response) {
    var initialLoadData = JSON.parse(response.data);
    DataStore = initialLoadData.SPIFilterData;
    ConfigData = initialLoadData.SPIConfigSettings;
    stl.app.SPILocalizedStrings = initialLoadData.SPILocalizedStrings;
    LoadStoresWithData();
    SetIndexPageLabelsFromFilterNames();
    SetIndexPageLabelsFromResx(initialLoadData.SPILocalizedStrings);
    SetPlaceHolderTextsFromResx(initialLoadData.SPILocalizedStrings);

    /*storing culture specific separators*/
    stl.app.saveCultureSpecificSeparators(initialLoadData.SPICultureSpecificSeparators.cultureSeparators);

    stl.app.updatePercentCompleteFKBasedOnChecklistItems = stl.app.commonSettingValue('77AUTO_UPDATE_FK_PERCENT');
    stl.app.isComplexProjectEnabled = stl.app.commonSettingValue('ENABLE_COMPLEX_PROJECT_MODE');
    stl.app.loggedInUserName = ConfigData.LoggedInUser;
    stl.app.hiddenSubtaskTypes = stl.app.commonSettingValue('REPORTFILTER_TASKLISTHIDDEN_SUBTASK_TYPES');
    stl.app.isExternalMappingEnabled = stl.app.commonSettingValue('ENABLE_COMPLEX_PROJECT_MODE');
    stl.app.useGlobalPhasesOnly = stl.app.commonSettingValue('USEGLOBALPHASES');
    stl.app.useGlobalResourcesOnly = stl.app.commonSettingValue('USEGLBOALRESOURCES');
    SetIndexPageLabelsFromColumnNames();

    stl.app.PhasesFromAllDivisions = initialLoadData.VirtualResourcesList;
    stl.app.allProjectList = initialLoadData.ProjectList;
    stl.app.readInvokeloadTypeFromURL();
    stl.app.initToolTips();
    //tool bar listeners
    stl.app.WireToolBarlisteners();
    $(document).on("projectjsonchange", stl.app.onProjectJsonChange);
    $(document).on("taskselectionchange", stl.app.onTaskSelectionChange.bind(stl.app));
    $(document).on("taskselection", stl.app.onTaskSelection.bind(stl.app));

};





Ext.onReady(function () {
    stl.app.setServerDateTimeFormat();
    stl.app.manageTimeOutSettings();
    ValidationClassInstance = new stl.view.Validation();
    
    NE_SessionAlive();
    showIncompatibleBrowserWarning();
   //FIXME: instead of using JQuery "type" attribute must be added for all button tags
    $(":button").prop("type","button");
    window.onbeforeunload = function(){
       if(! stl.app.isProjectOpenInViewOnlyMode() && isSaveOnBrowserClose)//Dont want to save if read only view is opened
           stl.app.save(stl.app.ProcessTypeEnum.AUTOSAVE);
       if( getInternetExplorerVersion()!== -1)
      		return '';
    };
    getIntialDataFromServer();
});

