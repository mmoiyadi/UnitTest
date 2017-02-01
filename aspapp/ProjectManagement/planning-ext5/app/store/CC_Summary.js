/**
 * Created by ajetnewera on 09-06-2015.
 * Email : ravi.teja@navyuginfo.com
 */

var CCSummaryStore = new Object();

function PopulateCCSummaryStore(CC_Summary_Data) {
    CCSummaryStore.CCDuration = CC_Summary_Data.CCDuration;
    CCSummaryStore.CCPath = CC_Summary_Data.CCPath;
    CCSummaryStore.ProjectLength = CC_Summary_Data.ProjectLength;
    CCSummaryStore.ProjectBuffer = CC_Summary_Data.ProjectBuffer;
    CCSummaryStore.ProjectStart = CC_Summary_Data.ProjectStart;
    CCSummaryStore.ProjectEnd = CC_Summary_Data.ProjectEnd;
    CCSummaryStore.ProjectLength = CC_Summary_Data.ProjectLength;
    CCSummaryStore.ResourceContentionData = CC_Summary_Data.ResourceContentionData;
    CCSummaryStore.TotalResourceContention = CC_Summary_Data.TotalResourceContention;
    CCSummaryStore.SlackData = CC_Summary_Data.SlackData;
    CCSummaryStore.TotalSlackDuration = CC_Summary_Data.TotalSlackDuration;
    CCSummaryStore.FullKitData = CC_Summary_Data.FullKitData;

    Ext.getStore('FullKitStore').loadData(CCSummaryStore.FullKitData);
};

//VM -TODO: This shouldnt be a global function 
function isSlackPresentInProject(){
    var isSlackDataAvailable = false;

    if (CCSummaryStore.SlackData){
        if (CCSummaryStore.SlackData.length != 0){
            isSlackDataAvailable =true;
        }
    }
    return isSlackDataAvailable;
}

function isEnableSlackInHighlightDropdown(project)
{
    var isEnableMenuOption = false;
    if(project.isIDCCed && project.ProjectPlanningMode == 1 && isSlackPresentInProject()){
        isEnableMenuOption = true;
    }

    return isEnableMenuOption;
}

function isResourceContentionPresentInProject(){
    var isResourceContentionDataAvailable = false;

            if (CCSummaryStore.ResourceContentionData){
                if (CCSummaryStore.ResourceContentionData.length != 0){
                    isResourceContentionDataAvailable =true;
                }
            }
    return isResourceContentionDataAvailable;
}

function isEnableResourceContentionOptionInHighlight(project)
{
    var isEnableMenuOption = false;
    if(project.isIDCCed && project.ProjectPlanningMode == 1 && isResourceContentionPresentInProject()){
        isEnableMenuOption = true;
    }

    return isEnableMenuOption;
}

function GetUpdatedCCSummaryData(){
    var CC_Summary = {};   
    CC_Summary.CCDuration = CCSummaryStore.CCDuration;
    CC_Summary.CCPath = CCSummaryStore.CCPath;
    CC_Summary.ProjectLength = CCSummaryStore.ProjectLength;
    CC_Summary.ProjectBuffer = CCSummaryStore.ProjectBuffer;
    CC_Summary.ProjectStart = CCSummaryStore.ProjectStart;
    CC_Summary.ProjectEnd = CCSummaryStore.ProjectEnd;
    CC_Summary.ProjectLength = CCSummaryStore.ProjectLength;
    CC_Summary.ResourceContentionData = CCSummaryStore.ResourceContentionData;
    CC_Summary.TotalResourceContention = CCSummaryStore.TotalResourceContention;
    CC_Summary.SlackData = CCSummaryStore.SlackData;
    CC_Summary.TotalSlackDuration =  CCSummaryStore.TotalSlackDuration;
    CC_Summary.FullKitData = Ext.pluck(Ext.getStore('FullKitStore').data.items, 'data');
    return CC_Summary;
}


