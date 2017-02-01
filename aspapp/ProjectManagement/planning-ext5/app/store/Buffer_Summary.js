var BufferSummaryStore = [];

function PopulateBufferSummaryStore(Buffer_Summary_Array) {
        //clear old array before adding new ones
        BufferSummaryStore = [];
        Buffer_Summary_Array.forEach(function(Buffer_Summary_Data){
        var BufferSummaryItem = {};
        BufferSummaryItem.MilestoneName = Buffer_Summary_Data.MilestoneName;
        BufferSummaryItem.MilestoneUID = Buffer_Summary_Data.MilestoneUID;
        BufferSummaryItem.BufferName = Buffer_Summary_Data.BufferName;
        BufferSummaryItem.BufferId = Buffer_Summary_Data.BufferId;
        BufferSummaryItem.Percent_Buffer_Consumption = Buffer_Summary_Data.Percent_Buffer_Consumption;
        BufferSummaryItem.Percent_Chain_Complete = Buffer_Summary_Data.Percent_Chain_Complete;
        BufferSummaryItem.DueDate = Buffer_Summary_Data.DueDate;
        BufferSummaryItem.ProjectedDate = Buffer_Summary_Data.ProjectedDate;
        BufferSummaryItem.Color = Buffer_Summary_Data.Color;
        BufferSummaryItem.Chains = Buffer_Summary_Data.Chains;
        BufferSummaryItem.PenetratingChains = Buffer_Summary_Data.PenetratingChains;
        BufferSummaryStore.push(BufferSummaryItem);
    });
};