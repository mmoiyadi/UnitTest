Ext.define("ProjectPlanning.model.ProjectTreeNode",{extend:"Ext.data.Model",fields:[{name:"id",type:"string"},{name:"Id",type:"string"},{name:"taskId",type:"int",defaultValue:-1},{name:"name",type:"string"},{name:"emptyText",type:"string"},{name:"type",type:"string"},{name:"scopeItemId",type:"string"},{name:"scopeItemName",type:"string"},{name:"phaseId",type:"string"},{name:"phaseName",type:"string"},{name:"duration",type:"int",defaultValue:-1},{name:"startDate"},{name:"endDate"},{name:"snet"},{name:"status",type:"string"},{name:"manager",type:"string"},{name:"resources"},{name:"participants"},{name:"participantsFullNames"},{name:"order",type:"int"},{name:"outlineLevel",type:"int"},{name:"subtasks"},{name:"subtaskType",type:"string"},{name:"subtasksWIPLimit",type:"int"},{name:"complete",type:"boolean"},{name:"checklistItems"},{name:"text22",type:"string"},{name:"type-internal",type:"string"},{name:"model"},{name:"row_model"},{name:"phase_model"},{name:"scope_model"},{name:"taskColor"},{name:"predecessors"},{name:"successors"},{name:"taskOrderNum",type:"string"}],createTaskNode:function(d,e,h,b){this.set("taskColor",d.taskColor);this.set("Id",d.uid);this.set("id",d.uid);this.set("taskId",parseInt(d.id));this.set("order",d.order);this.set("taskOrderNum",d.id);this.set("name",d.name);this.set("emptyText",d.emptyText);if(d.taskType=="buffer"){this.set("type",d.bufferType)}else{this.set("type",d.taskType)}if(e){this.set("scopeItemId",e.uid);this.set("scopeItemName",e.name);this.set("scope_model",e)}this.set("phaseId",b.uid);this.set("phaseName",b.name);this.set("duration",d.remainingDuration);if(d.status==STATUS_NS){if(d.startDate&&(d.startDate==EMPTY_STRING||isNaN(d.startDate.valueOf()))){this.set("startDate",null)}else{this.set("startDate",d.startDate)}}else{if(d.status==STATUS_IP||d.status==STATUS_CO||d.status==STATUS_RL){if(d.actualStartDate&&d.actualStartDate!=INVALID_DATE){this.set("startDate",d.actualStartDate)}else{this.set("startDate",null)}}}if(d.status==STATUS_CO){if(d.actualFinishDate&&d.actualFinishDate==EMPTY_STRING){this.set("endDate",null)}else{this.set("endDate",d.actualFinishDate)}}else{if(d.taskType===TASKTYPE_FULLKIT||(d.taskType===TASKTYPE_PT&&d.isReadyToStart)){if(d.date7&&d.date7==EMPTY_STRING){this.set("endDate",null)}else{this.set("endDate",new Date(d.date7))}}else{if(d.endDate&&(d.endDate==""||isNaN(d.endDate.valueOf()))){this.set("endDate",null)}else{this.set("endDate",d.endDate)}}}this.set("snet",d.startNoEarlierThan);this.set("status",d.status);this.set("manager",d.manager);this.set("resources",d.resources);this.set("participants",d.participants);this.setParticipantsFullNames(d.participants);this.set("checklistItems",d.checklistItems);this.set("checklistStatus",d.checklistStatus);var a=d._successors;var g=[];for(var f=0;f<a.length;f++){g.push(a[f].id)}g.sort(function(j,i){return j-i});this.set("successors",g.join(","));var c=d._predecessors;g=[];for(var f=0;f<c.length;f++){g.push(c[f].id)}g.sort(function(j,i){return j-i});this.set("predecessors",g.join(","));this.set("text22",d.text22);this.set("subtaskType",d.subtaskType);if(d.subtasksWIPLimit<=0){d.subtasksWIPLimit=stl.app.commonSettingValue("SUBTASKS_DEFAULT_WIP_LIMIT")}this.set("subtasksWIPLimit",d.subtasksWIPLimit);this.set("volume",d.volume);this.set("wipLimit",d.wipLimit);this.set("type-internal","BLOCK");this.set("model",d);this.set("phase_model",b);this.set("row_model",h);this.set("outlineLevel",h.outlineLevel);return this},createSubtaskNode:function(a,b){this.set("Id",b.uid);this.set("id",b.uid);this.set("name",b.name);this.set("type",a.subtaskType);this.set("duration",b.remainingDuration);if(b.startDate&&(b.startDate==""||isNaN(b.startDate.valueOf()))){this.set("startDate",null)}else{this.set("startDate",b.startDate)}if(b.endDate&&(b.endDate==""||isNaN(b.endDate.valueOf()))){this.set("endDate",null)}else{this.set("endDate",b.endDate)}this.set("complete",b.complete);this.set("status",b.status);this.set("order",b.order);this.set("manager",b.manager);this.set("resources",b.resources);this.set("participants",b.participants);this.setParticipantsFullNames(b.participants);this.set("checklistItems",b.checklistItems);this.set("checklistStatus",b.checklistStatus);this.set("model",b);this.set("type-internal","LIST_ITEM");return this},createMilestoneNode:function(h,d,g,b){this.set("taskColor",h.milestoneColor);this.set("Id",h.uid);this.set("id",h.uid);this.set("taskId",parseInt(h.id));this.set("taskOrderNum",h.id);this.set("name",h.name);this.set("type",h.taskType);if(d){this.set("scopeItemId",d.uid);this.set("scopeItemName",d.name);this.set("scope_model",d)}this.set("phaseId",b.uid);this.set("phaseName",b.name);this.set("duration",h.remainingDuration);if(!h.startDate){this.set("startDate",null)}else{this.set("startDate",h.startDate)}if(h.status===STATUS_CO){if(!h.actualFinishDate){this.set("endDate",null)}else{this.set("endDate",h.actualFinishDate)}}else{if(!h.endDate){this.set("endDate",null)}else{this.set("endDate",h.endDate)}}this.set("status",h.status);this.set("manager",h.manager);this.set("resources",h.resources);this.set("participants",h.participants);this.setParticipantsFullNames(h.participants);this.set("checklistItems",h.checklistItems);this.set("checklistStatus",h.checklistStatus);var a=h._successors;var f=[];for(var e=0;e<a.length;e++){f.push(a[e].id)}f.sort(function(j,i){return j-i});this.set("successors",f.join());var c=h._predecessors;f=[];for(var e=0;e<c.length;e++){f.push(c[e].id)}f.sort(function(j,i){return j-i});this.set("predecessors",f.join());this.set("text22",h.text22);this.set("subtaskType",h.subtaskType);if(h.subtasksWIPLimit<=0){h.subtasksWIPLimit=stl.app.commonSettingValue("SUBTASKS_DEFAULT_WIP_LIMIT")}this.set("subtasksWIPLimit",h.subtasksWIPLimit);this.set("type-internal","MILESTONE");this.set("model",h);this.set("phase_model",b);this.set("row_model",g);this.set("outlineLevel",g.outlineLevel);return this},createSummaryTaskNode:function(c,d,a,b){this.set("Id",b?b.uid:"scope"+d.uid);if(b){this.set("taskId",parseInt(b.id));this.set("order",b.order);this.set("name",d.name)}this.set("scopeItemId",c.uid);this.set("scopeItemName",d.name);this.set("type",SUMMARY_TASK_TYPE);if(b){this.set("duration",b.remainingDuration);if(b.startDate&&(b.startDate==""||isNaN(b.startDate.valueOf()))){this.set("startDate",null)}else{this.set("startDate",b.startDate)}if(b.status=="CO"){if(b.actualFinishDate&&b.actualFinishDate==""){this.set("endDate",null)}else{this.set("endDate",b.actualFinishDate)}}else{if(b.endDate&&(b.endDate==""||isNaN(b.endDate.valueOf()))){this.set("endDate",null)}else{this.set("endDate",b.endDate)}}this.set("status",b.status)}this.set("type-internal","SUMMARY_TASK");if(b){this.set("model",b)}this.set("row_model",d);this.set("phase_model",a);this.set("scope_model",c);this.set("outlineLevel",d.outlineLevel);return this},setParticipantsFullNames:function(a){var d=[];for(var b=0;b<a.length;b++){var c=_.find(stl.app.availablePeopleAndTeams,function(e){if(e.Name==a[b]){return true}});if(c){d.push(c.FullName)}}this.set("participantsFullNames",d)}});Ext.define("stl.model.AssignmentOption",{extend:"Ext.data.Model",fields:[{name:"id",type:"string"},{name:"name",type:"string"}]});