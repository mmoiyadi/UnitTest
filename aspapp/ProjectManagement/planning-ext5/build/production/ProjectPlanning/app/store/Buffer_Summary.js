var BufferSummaryStore=[];function PopulateBufferSummaryStore(a){BufferSummaryStore=[];a.forEach(function(b){var c={};c.MilestoneName=b.MilestoneName;c.MilestoneUID=b.MilestoneUID;c.BufferName=b.BufferName;c.BufferId=b.BufferId;c.Percent_Buffer_Consumption=b.Percent_Buffer_Consumption;c.Percent_Chain_Complete=b.Percent_Chain_Complete;c.DueDate=b.DueDate;c.ProjectedDate=b.ProjectedDate;c.Color=b.Color;c.Chains=b.Chains;BufferSummaryStore.push(c)})};