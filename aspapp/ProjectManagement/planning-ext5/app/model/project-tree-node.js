Ext.define('ProjectPlanning.model.ProjectTreeNode', {
    extend: 'Ext.data.Model',
    fields: [
	    {name:'id', type:'string'},
        {name:'Id', type:'string'},
        {name:'taskId',type:'int', defaultValue: -1},//This is the task id thats displayed in matrix view on each task
        {name: 'name', type: 'string'},
        {name:'emptyText', type:'string'},
        {name: 'type', type: 'string'},
        {name:'scopeItemId', type:'string'},
        {name:'scopeItemName',type:'string'},
        {name:'phaseId', type:'string'},
        {name:'phaseName',type:'string'},
        {name: 'duration', type: 'int', defaultValue: -1 },
        {name: 'startDate'},
        {name: 'endDate'},
        {name: 'snet'},
        {name: 'status', type: 'string'},
        {name: 'manager', type: 'string' },
        {name: 'resources' },
        {name: 'participants'},
        {name: 'participantsFullNames'},
        {name:'order', type:'int'},
        {name:'outlineLevel', type:'int'},
        {name: 'subtasks'},
        {name: 'subtaskType', type:'string'},
        {name: 'subtasksWIPLimit', type:'int'},        
        {name: 'complete', type: 'boolean'},
        {name: 'checklistItems'},
        {name: 'text22', type:'string'},
        {name: 'text26', type:'string'},
        {name: 'text27', type:'string'},
        {name: 'text28', type:'string'},
        {name: 'text29', type:'string'},
        {name: 'text30', type:'string'},
        {name: 'text3', type:'string'},
        {name: 'text11', type:'string'},
        {name: 'text12', type:'string'},
        {name: 'text13', type:'string'},
        {name: 'text15', type:'string'},
        {name: 'type-internal', type: 'string'},
        {name:'model'},
        {name:'row_model'},
        {name:'phase_model'},
        {name:'scope_model'},
        {name: 'taskColor' },
        {name: 'predecessors'},
        {name: 'successors'},
        {name: 'taskOrderNum', type:'string'}
    ],
    createTaskNode:function(task,scopeItem,row,phase){
        //task
        this.set('taskColor',task.taskColor);
        this.set('Id',task.uid);
        this.set('id',task.uid);
        this.set('taskId',parseInt(task.id));
        this.set('order',task.order);
        this.set('taskOrderNum',task.id);
        this.set('name', task.name);
        this.set('emptyText',task.emptyText);
        if(task.taskType == 'buffer')
            this.set('type',task.bufferType);
        else
            this.set('type',task.taskType);
        if(scopeItem){
            this.set('scopeItemId',scopeItem.uid);
            this.set('scopeItemName',scopeItem.name);
            this.set('scope_model',scopeItem);  
        }
        
        this.set('phaseId',phase.uid);
        this.set('phaseName',phase.name);
        this.set('duration',task.remainingDuration);

	    //These If checks are to prevent showing NA/NA/NA for the date in the UI
        // Set Start Date
        if (task.status == STATUS_NS){
            if(task.startDate && (task.startDate == EMPTY_STRING || isNaN(task.startDate.valueOf())))
                this.set('startDate',null);
            else
                this.set('startDate',task.startDate);
        }
        else if (task.status == STATUS_IP || task.status == STATUS_CO || task.status == STATUS_RL) {
            if(task.actualStartDate && task.actualStartDate != INVALID_DATE)
                this.set('startDate',task.actualStartDate);
            else
                this.set('startDate',null);
        }


        if(task.status == STATUS_CO){
            if(task.actualFinishDate && task.actualFinishDate == EMPTY_STRING){
                this.set('endDate', null);
            }
            else{
                this.set('endDate', task.actualFinishDate);
            }
        }else if(task.taskType === TASKTYPE_FULLKIT ||
                (task.taskType === TASKTYPE_PT && task.isReadyToStart)){// For date driven PT task, Show expected finish date as End Date
                    if(task.date7 && task.date7 == EMPTY_STRING){
                        this.set('endDate', null);
                    }
                    else{
                        this.set('endDate', new Date(task.date7));
                    }
        }else{
            if(task.endDate && (task.endDate == "" || isNaN(task.endDate.valueOf())))
                this.set('endDate',null);
            else
                this.set('endDate',task.endDate);
        }
        this.set('snet',task.startNoEarlierThan);
        this.set('status',task.status);
        this.set('manager',task.manager);
        this.set('resources',task.resources);
        this.set('participants',task.participants);
        this.setParticipantsFullNames(task.participants);
        this.set('checklistItems', task.checklistItems);
        this.set('checklistStatus', task.checklistStatus);
        var succ = task._successors;
        var arrIds=[];
        for(var i=0; i<succ.length; i++){
            arrIds.push(succ[i].id);
        }
        arrIds.sort(function(a, b){return a-b});
        this.set('successors',arrIds.join(","));
        var pred = task._predecessors;
        arrIds=[];
        for(var i=0; i<pred.length; i++){
            arrIds.push(pred[i].id);
        }
        arrIds.sort(function(a, b){return a-b});
        this.set('predecessors',arrIds.join(","));
        this.set('text22',task.text22);
        //subtask
        this.set('subtaskType', task.subtaskType);
        if (task.subtasksWIPLimit <= 0) {
            task.subtasksWIPLimit = stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT');
        }
        this.set('subtasksWIPLimit',task.subtasksWIPLimit);
        this.set('volume', task.volume);
        this.set('wipLimit', task.wipLimit);
        //table-view specific
        this.set("type-internal", "BLOCK");
        this.set('model',task);
        this.set('phase_model',phase);
        this.set('row_model',row);
        this.set('outlineLevel',row.outlineLevel);
        //custom text fields
        this.set('text3',task.text3);
        this.set('text11',task.text11);
        this.set('text12',task.text12);
        this.set('text13',task.text13);
        this.set('text15',task.text15);
        this.set('text26',task.text26);
        this.set('text27',task.text27);
        this.set('text28',task.text28);
        this.set('text29',task.text29);
        this.set('text30',task.text30);
        return this;
    },
    createSubtaskNode:function(task,subtask){
        this.set('Id', subtask.uid);
        this.set('id', subtask.uid);
        this.set('name', subtask.name);
        this.set('type',task.subtaskType);
        this.set('duration', subtask.remainingDuration);
	//These If checks are to prevent showing NA/NA/NA for the date in the UI
        if(subtask.startDate && (subtask.startDate == "" || isNaN(subtask.startDate.valueOf())))
            this.set('startDate',null);
        else
            this.set('startDate',subtask.startDate);
        if(subtask.endDate && (subtask.endDate == "" || isNaN(subtask.endDate.valueOf())))
            this.set('endDate',null);
        else
            this.set('endDate',subtask.endDate);        
        this.set('complete', subtask.complete);
        this.set('status', subtask.status);
        this.set('order', subtask.order);
        this.set('manager', subtask.manager);
        this.set('resources', subtask.resources);
        this.set('participants',subtask.participants);        
        this.setParticipantsFullNames(subtask.participants);
        this.set('checklistItems', subtask.checklistItems);
        this.set('checklistStatus', subtask.checklistStatus);
        this.set('model',subtask);
        this.set('type-internal', "LIST_ITEM");
        //custom text fields
        this.set('text3',subtask.text3);
        this.set('text11',subtask.text11);
        this.set('text12',subtask.text12);
        this.set('text13',subtask.text13);
        this.set('text15',subtask.text15);
        this.set('text26',subtask.text26);
        this.set('text27',subtask.text27);
        this.set('text28',subtask.text28);
        this.set('text29',subtask.text29);
        this.set('text30',subtask.text30);
        return this;                  
    },
    createMilestoneNode:function(milestone,scopeItem,row,phase){
        this.set('taskColor',milestone.milestoneColor);
        this.set('Id',milestone.uid);
        this.set('id',milestone.uid);
        this.set('taskId',parseInt(milestone.id));
        this.set('taskOrderNum',milestone.id);
        this.set('name', milestone.name);
        this.set('type',milestone.taskType);
        if(scopeItem){
            this.set('scopeItemId',scopeItem.uid);
            this.set('scopeItemName',scopeItem.name);
            this.set('scope_model',scopeItem);
        }        
        this.set('phaseId',phase.uid);
        this.set('phaseName',phase.name);
        this.set('duration',milestone.remainingDuration);
    //These If checks are to prevent showing NA/NA/NA for the date in the UI        
        if(!milestone.startDate )
            this.set('startDate',null);
        else
            this.set('startDate',milestone.startDate);
        if(milestone.status === STATUS_CO){
            if(!milestone.actualFinishDate){
                this.set('endDate', null);
            }
            else{
                this.set('endDate', milestone.actualFinishDate);
            }
        }else{
                if(!milestone.endDate)
                    this.set('endDate',null);
                else
                    this.set('endDate',milestone.endDate);
        }
        this.set('status',milestone.status);
        this.set('manager',milestone.manager);
        this.set('resources',milestone.resources);
        this.set('participants',milestone.participants);
        this.setParticipantsFullNames(milestone.participants);

        this.set('checklistItems', milestone.checklistItems);
        this.set('checklistStatus', milestone.checklistStatus);
        var succ = milestone._successors;
        var arrIds=[];
        for(var i=0; i<succ.length; i++){
            arrIds.push(succ[i].id);
        }
        arrIds.sort(function(a, b){return a-b});
        this.set('successors',arrIds.join());
        var pred = milestone._predecessors;
        arrIds=[];
        for(var i=0; i<pred.length; i++){
            arrIds.push(pred[i].id);
        }
        arrIds.sort(function(a, b){return a-b});
        this.set('predecessors',arrIds.join());
        this.set('text22',milestone.text22);
        //subtask nonzero IMS task
        this.set('subtaskType',milestone.subtaskType);//VM changed task.subtaskType to milestone.subtaskType
        if (milestone.subtasksWIPLimit <= 0) {
            milestone.subtasksWIPLimit = stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT');
        }
        this.set('subtasksWIPLimit',milestone.subtasksWIPLimit);
        //table-view specific
        this.set("type-internal", "MILESTONE");
        this.set('model',milestone);
        this.set('phase_model',phase);
        this.set('row_model',row);
        this.set('outlineLevel',row.outlineLevel);
        return this;
    },
    createSummaryTaskNode:function(scope,row,phase, task){
         //task
        this.set('Id',task?task.uid:"scope"+row.uid); //adding string scope to avoid conflict between task and scope ids
        if(task){
            this.set('taskId',parseInt(task.id));
            this.set('order',task.order);
            //dont show names for summary tasks
            this.set('name', row.name);
        }
        //this.set('taskOrderNum',scope.id);        
        this.set('scopeItemId',scope.uid);
        this.set('scopeItemName',row.name);
        this.set('type',SUMMARY_TASK_TYPE);
        if(task){
            this.set('duration',task.remainingDuration);
        
        //These If checks are to prevent showing NA/NA/NA for the date in the UI
            if(task.startDate && (task.startDate == "" || isNaN(task.startDate.valueOf())))
                this.set('startDate',null);
            else
                this.set('startDate',task.startDate);
            if(task.status == "CO"){
                if(task.actualFinishDate && task.actualFinishDate == ""){
                    this.set('endDate', null);
                }
                else{
                    this.set('endDate', task.actualFinishDate);
                }
            }else{
                if(task.endDate && (task.endDate == "" || isNaN(task.endDate.valueOf())))
                    this.set('endDate',null);
                else
                    this.set('endDate',task.endDate);
            }
            this.set('status',task.status);
        }
        //table-view specific
        this.set("type-internal", "SUMMARY_TASK");
        if(task)
            this.set('model',task);
        this.set('row_model',row);
        this.set('phase_model',phase);
        this.set('scope_model',scope);
        this.set('outlineLevel',row.outlineLevel);
        return this;
    },
    setParticipantsFullNames:function(participants){
        if(participants){
            var participantsFullNames1=[]
            for(var i=0; i< participants.length;i++){            
    	    var personObj = _.find(stl.app.availablePeopleAndTeams,function(person){
                    if(person.Name == participants[i])
                        return true;
                });
    	    if(personObj)
    	    	participantsFullNames1.push(personObj.FullName);
            }
            this.set('participantsFullNames',participantsFullNames1);
        }
    }
});

Ext.define('stl.model.AssignmentOption', {
   extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'string'},
        {name: 'name', type: 'string'}
    ]
});