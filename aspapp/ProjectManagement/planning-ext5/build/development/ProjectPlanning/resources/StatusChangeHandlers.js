/**********
	This file contains handlers for Task Status and Subtask Status changes made from Matrix View,
	Timeline View and Tabular View
*******/

/*
	When a task status is NS, all subtasks should be in NS
*/
function setTaskStatusToNS(task, subtasks){
	if(!subtasks){
		if(task.data)
			task.set('status', 'NS');
		else
			task.status = 'NS';
	}
	if(subtasks){
		for(var i = 0; i< subtasks.length; i++){
			//If this is called from matrixview/timelineview subatsk/task are jquery objects, else they are Ext.data.Model object if they are from tabular view
			this.setSubtasksStatusToNS(subtasks);
		}
	}
	return {'isSubtaskDisabled':false};
}
/*
	When a task status is IP, atleast one subtask should be in IP
*/
function setTaskStatusToIP(task, subtasks){
	if(task.data)
			task.set('status', 'IP');
		else
			task.status = 'IP';
}
/*
	When a task status is CO, all subtasks should be in CO and disabled
*/
function setTaskStatusToCO(task,subtasks){
	if(!subtasks){
		if(task.data)
			task.set('status', 'CO');
		else
			task.status = 'CO';
	}
	if(subtasks){
		for(var i=0; i< subtasks.length; i++){
			//If this is called from matrixview/timelineview subatsk/task are jquery objects, else they are Ext.data.Model object if they are from tabular view
			this.setSubtasksStatusToCO(subtasks);
		}
	}
	return {'isSubtaskDisabled':true};
}
function setSubtasksStatusToNS(subtasks,enableStatus){
	for(var i =0; i<subtasks.length; i++){
		if(subtasks[i].data){
			if(subtasks[i].get('status') != 'NS'){
				subtasks[i].set('status', 'NS');
			}
		}else{
			if(subtasks[i].status != 'NS' || subtasks[i].status != '0')
				subtasks[i].status = 'NS';
			subtasks[i].complete = false;
		}
	}
}
function setSubtasksStatusToIP(subtasks){
	for(var i=0; i<subtasks.length; i++){
		if(subtasks[i].data){
			if(subtasks[i].get('status') != 'IP'){
				subtasks[i].set('status', 'IP');
			}
		}else{
			if(subtasks[i].status != 'IP' || subtasks[i].status != '1')
				subtasks[i].status = 'IP';
			subtasks[i].complete = false;
		}
	}
}
function setSubtasksStatusToCO(subtasks,disableStatus){
	for(var i=0; i< subtasks.length; i++){
		if(subtasks[i].data){
			if(subtasks[i].get('status') != 'CO'){
				subtasks[i].set('status', 'CO');
			}
		}else{
			if(subtasks[i].status != 'CO' || subtasks[i].status != '2')
				subtasks[i].status = 'CO';
			subtasks[i].complete = true;
		}
	}
}
function enableStatusForCOSubtasks(subtasks,enableStatus){
	for(var i=0; i< subtasks.length; i++){
		if(subtasks[i].data){
			if(subtasks[i].get('status') == 'CO'){
				subtasks[i].set('status', 'CO');
			}
		}else{
			if(subtasks[i].status == 'CO' || subtasks[i].status == '2')
				subtasks[i].status = 'CO';
			subtasks[i].complete = true;
		}
	}
}
/*
	When a task is changed from NS to IP, no change to the subtasks status required.
*/
function ChangeTaskStatusFromNSToIP(){

}
/*
	When a task is changed from NS to CO, ask user if he wants to mark all subtasks as CO. If 'yes' mark all subtasks as complete
	and disable the subatask status. If 'no' revert the task status to NS
*/
function ChangeTaskStatusFromNSToCO(taskName,task, subtasks, subtasksEnabled,callbk){
	if(task.get)
		task = task.get('model');
	//checklist items should exist and they should be CO if flag is checked else percent complete should be 100 for task to be marked to CO
	if(task.taskType=="fullkit"){
	    if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length === 0) {
			PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_CO_EMPTY_CHECKLIST,'Task ' + task.name + TASK_STATUS_CHANGE_FROM_NS_TO_CO);
			callbk('no');
			return;
		}
		if(task.percentComplete != 100){
			this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_NS_TO_CO, TASK_ALERT_MSG_FOR_NS_TO_CO_CHECKLIST,
					function(){
						this.markChecklistItemsCO(task);
						task.percentComplete=100;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					})			
			return;
		}
		callbk('yes');
		return;
	}else{
		if(!this.checkIfAllSubtasksAreCO(subtasks)){
		    this.showAlertsForStatusChange('Task ' + taskName + TASK_STATUS_CHANGE_FROM_NS_TO_CO, TASK_ALERT_MSG_FOR_NS_TO_CO,
											function(){
													this.setSubtasksStatusToCO(subtasks,true);
													subtasksEnabled=false;
													if(callbk)
														callbk('yes');
												},
											function(){
													//this.setTaskStatusToNS(task);
													subtasksEnabled=true;
													if(callbk)
														callbk('no');
												});
		}
		else{
			if(callbk)
				callbk('yes');
		}
	}
}
/*
	When a task is changed from IP to CO, ask user if he wants to mark all subtasks as CO. If 'yes' mark all subtasks as complete
	and disable the subatask status. If 'no' revert the task status to IP
*/
function ChangeTaskStatusFromIPToCO(taskName,task, subtasks, subtasksEnabled,callbk){
	if(task.get)
		task = task.get('model');
	//There should be some checklist items for the task if config is checked and they should all be marked complete
	if(task.taskType === 'fullkit'){
	    if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length === 0) {
			PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_CO_EMPTY_CHECKLIST,'Task ' + task.name + TASK_STATUS_CHANGE_FROM_IP_TO_CO);
			callbk('no');
			return;
		}
		if(task.percentComplete != 100){
			this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_IP_TO_CO, TASK_ALERT_MSG_FOR_IP_TO_CO_CHECKLIST,
					function(){
						this.markChecklistItemsCO(task);
						task.percentComplete=100;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					})
			return;
		}
		callbk('yes');
		return;
	}else{
		if(!this.checkIfAllSubtasksAreCO(subtasks)){
		    this.showAlertsForStatusChange('Task ' + taskName + TASK_STATUS_CHANGE_FROM_IP_TO_CO, TASK_ALERT_MSG_FOR_IP_TO_CO,
											function(){
													this.setSubtasksStatusToCO(subtasks,true);
													subtasksEnabled=false;
													if(callbk)
														callbk('yes');
												},
											function(){
													//this.setTaskStatusToIP(task);
													subtasksEnabled=true;
													if(callbk)
														callbk('no');
												});
		}
		else{
			if(callbk)
				callbk('yes');
		}
	}
}
/*
	When a task is changed from IP to NS, ask user if he wants to mark all subtasks as NS. If 'yes' mark all subtasks as NS.
	If 'no' revert the task status to IP
*/
function ChangeTaskStatusFromIPToNS(taskName,task, subtasks, callbk){
	if(task.get)
		task = task.get('model');
	//For a fullkit task to be marked to NS, all checklist items should be marked as incomplete
	//Programatically update the model, set the complete flag to false  for all checklist items and percent complete to zero
	if(task.taskType === 'fullkit'){
		if(task.checklistItems.length > 0 && task.percentComplete != 0){
			this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_IP_TO_NS, TASK_ALERT_MSG_FOR_IP_TO_NS_CHECKLIST,
					function(){
						this.markChecklistItemsNS(task);
						task.percentComplete = 0;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					});
			return;
		}
		callbk('yes');
		return;
	}else{
		if(!this.checkIfAllSubtasksAreNS(subtasks)){
		    this.showAlertsForStatusChange('Task ' + taskName + TASK_STATUS_CHANGE_FROM_IP_TO_NS, TASK_ALERT_MSG_FOR_IP_TO_NS,
											function(){
													this.setSubtasksStatusToNS(subtasks);
													if(callbk)
														callbk('yes');
												},
											function(){
													//this.setTaskStatusToIP(task);
													if(callbk)
														callbk('no');
												});
		}
		else{
			if(callbk)
				callbk('yes');
		}
	}
}
/*
	When a task is changed from CO to NS, all subtasks will be in CO state. Depending on user input, we should either mark all 
	NS or leave all to CO.Subtask status should be enabled.
*/
function ChangeTaskStatusFromCOToNS(taskName, task, subtasks, isSubtaskDisabled,callbk){
	if(task.get)
		task = task.get('model');
	//For a fullkit task to be marked NS, there should be some checklist items present and all of them should be marked incomplete
	if(task.taskType === 'fullkit'){
	    if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length === 0) {
			PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_NS_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_CO_TO_NS);
			callbk('no');
			return;
		}
		if(task.percentComplete != 0){
			this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_CO_TO_NS, TASK_ALERT_MSG_FOR_CO_TO_NS_CHECKLIST,
					function(){
						this.markChecklistItemsNS(task);
						task.percentComplete = 0;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					});
			return;
		}
	}else{
		if(!this.checkIfAllSubtasksAreNS(subtasks)){
			//this.showAlertsForStatusChange('Task '+taskName+' Status Change: Completed(CO) to Not Started(NS)','Do you want to mark all subtasks for this task as Not Started(NS)? If "yes" all subtasks will be marked NS. if "no" Only task will be reverted to CO',
		    this.showAlertsForStatusChange('Task ' + taskName + TASK_STATUS_CHANGE_FROM_CO_TO_NS, TASK_ALERT_MSG_FOR_CO_TO_NS,
											function(){
													this.setSubtasksStatusToNS(subtasks,true);
													if(callbk)
													callbk('yes');
												},
											function(){
													//this.enableStatusForCOSubtasks(subtasks,true);
													if(callbk)
													callbk('no');
												});
		}
		else{
			if(callbk)
			callbk('yes');
		}
	}
}
/*
	When a task is changed from CO to IP, all subtasks will be in CO state. Depending on user input, we should either mark all IP
	or leave all to CO. Subtask status should be enabled.
*/
function ChangeTaskStatusFromCOToIP(taskName, task, subtasks, isSubtaskDisabled, callbk){
	if(task.get)
		task = task.get('model');
	if(task.taskType == 'fullkit'){
		//Check if percent complete is 100, if it is alert the user that he needs to add a checklist item or mark atleast one of the checklist item as incomplete
	    if (task.percentComplete == 100) {
	        if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1") {
	            PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_IP_NON_EMPTY_CHECKLIST, 'Task ' + taskName + TASK_STATUS_CHANGE_FROM_CO_TO_IP);
	            callbk('no');
	            return;
	        } else {
	            task.percentComplete = FALLBACK_TASKCOMPLETION_FROM_CO_TO_IP_RL;
	        }
		}
		callbk('yes');
		return;
	}else{
		if(!this.checkIfAllSubtasksAreIP(subtasks)){
		    this.showAlertsForStatusChange('Task ' + taskName + TASK_STATUS_CHANGE_FROM_CO_TO_IP, TASK_ALERT_MSG_FOR_CO_TO_IP,
											function(){
													this.setSubtasksStatusToIP(subtasks);
													if(callbk)
													callbk('yes');
												},
											function(){
													this.enableStatusForCOSubtasks(subtasks,true);
													if(callbk)
													callbk('yes',true);
												});
		}else{
			if(callbk)
			callbk('yes');
		}
		isSubtaskDisabled = false;
	}
}
/*
	When a fullkit task is changed from NS to RL, there should be some checklist items present if config is checked and atleast
	one of them should be marked complete
*/
function ChangeTaskStatusFromNSToRL(taskName,task, callbk){
	if(task.get){
		task = task.get('model');
	}
if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length == 0) {
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_NS_TO_RL);
		callbk('no');
		return;
	}
	if(task.percentComplete == 0){
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_NON_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_NS_TO_RL);
		callbk('no');
		return;
	}
	callbk('yes');
	return;
}
/*
	When a fullkit task is changed from IP to RL, there should be some checklist items present if config is checked and atleast
	one of them should be marked complete
*/
function ChangeTaskStatusFromIPToRL(taskName,task, callbk){
	if(task.get){
		task = task.get('model');
	}
if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length == 0) {
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_IP_TO_RL);
		callbk('no');
		return;
	}
	if(task.percentComplete == 0){
	    if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1") {
	        PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_NON_EMPTY_CHECKLIST, 'Task ' + taskName + TASK_STATUS_CHANGE_FROM_IP_TO_RL);
	        callbk('no');
	        return;
	    } else {
	        PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_NON_EMPTY_CHECKLIST_CONFIG_OFF, 'Task ' + taskName + TASK_STATUS_CHANGE_FROM_IP_TO_RL);
	        callbk('no');
	        return;
	    }
	}

	callbk('yes');
	return;
}
/*
	When a full kit task status is changed to RL, there should be some buffer Tasks if config checked and percentage 
	completed should be less than 100
*/
function ChangeTaskStatusFromCOToRL(taskName,task,callbk){
	if(task.get){
		task = task.get('model');
	}
if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length == 0) {
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_CO_TO_RL);
		callbk('no');
		return;
	}
	if(task.percentComplete == 100){
	    if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1") {
		    PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_NON_EMPTY_CHECKLIST, 'Task ' + taskName + TASK_STATUS_CHANGE_FROM_CO_TO_RL);
		    callbk('no');
		    return;
		} else {
		    task.percentComplete = FALLBACK_TASKCOMPLETION_FROM_CO_TO_IP_RL;
		}
	}
	callbk('yes');
	return;
}
/*
	When a full kit task status is changed to NS, there should be some buffer Tasks if config is checked and percentage 
	completed should be 0
*/
function ChangeTaskStatusFromRLToNS(taskName,task,callbk){
	if(task.get){
		task = task.get('model');
	}
if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length == 0) {
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_NS_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_RL_TO_NS);
		callbk('no');
		return;
	}
	if(task.percentComplete != 0){
		this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_RL_TO_NS, TASK_ALERT_MSG_FOR_RL_TO_NS_CHECKLIST,
					function(){
						this.markChecklistItemsNS(task);
						task.percentComplete = 0;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					});
			return;
	}
	callbk('yes');
	return;
}
/*
	When a full kit task status is changed to CO, there should be some buffer Tasks if config is checked and percentage 
	completed should be 100
*/
function ChangeTaskStatusFromRLToCO(taskName,task,callbk){
	if(task.get){
		task = task.get('model');
	}
if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1" && task.checklistItems.length == 0) {
		PPI_Notifier.alert(FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_CO_EMPTY_CHECKLIST,'Task '+taskName+ TASK_STATUS_CHANGE_FROM_RL_TO_CO);
		callbk('no');
		return;
	}
	if(task.percentComplete != 100){
		this.showAlertsForStatusChange('Task '+ taskName + TASK_STATUS_CHANGE_FROM_RL_TO_CO, TASK_ALERT_MSG_FOR_RL_TO_CO_CHECKLIST,
					function(){
						this.markChecklistItemsCO(task);
						task.percentComplete=100;
						if(callbk)
							callbk('yes');
					},
					function(){
						if(callbk)
							callbk('no');

					})
			return;
	}
	callbk('yes');
	return;
}
/*
	When a subtask status is changed from NS to IP, check if task status is IP, if it is, leave it else change task status to IP
*/
function ChangeSubtaskStatusFromNSToIP(subtask, task,callbk){
	var taskstatus = task.status;
	if(task.data){
		taskstatus = task.get('status');
	}
	if(taskstatus != 'IP'){
		if(task.data){
			task.set('status','IP');
		}else
			task.status = 'IP';
	}
	callbk("yes");
}
/*
	When a subtask status is changed from NS to CO, check if all subtasks for that task are CO. If "yes" ask the user if he wants to
	mark the task as CO, if 'yes' mark task as CO and disable subtask status else mark task as IP. If not all subtasks are CO, mark task as IP
*/
function ChangeSubtaskStatusFromNSToCO(subtask, task, isSubtaskDisabled, callbk){
	var subtasks = task.subtasks;
	var status = task.status;
	var taskName = task.name;
	if(task.data){
		subtasks = task.childNodes;
		status = task.get('status');
		taskName = task.get('name');
	}
	subtasks = subtasks.slice(0);
	subtasks.splice(subtasks.indexOf(subtask),1);
	var allSubtasksCO = checkIfAllSubtasksAreCO(subtasks);
	if(allSubtasksCO){
	    this.showAlertsForStatusChange('Task ' + taskName + ' Status Change: ' + status + ' to Complete(CO)', SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_CO,
									function(){
											this.setTaskStatusToCO(task);
											isSubtaskDisabled = true;
											callbk('yes');
										},
									function(){
											this.setTaskStatusToIP(task);
											isSubtaskDisabled=false;
											callbk('yes','no');
										});
	}
	else{
		this.setTaskStatusToIP(task);
		isSubtaskDisabled = false;
		callbk('yes','no');
	}
}
/*
	When a subtask status is changed from IP to CO, check if all subtasks for that task are CO. If "yes" ask the user if he wants to
	mark the task as CO, if 'yes' mark task as CO and disable subtask status else mark task as IP. If not all subtasks are CO, mark task as IP
*/
function ChangeSubtaskStatusFromIPToCO(subtask, task, isSubtaskDisabled, callbk){
	var subtasks = task.subtasks;
	var status = task.status;
	var taskName = task.name;
	if(task.data){
		subtasks = task.childNodes;
		status = task.get('status');
		taskName = task.get('name');
	}
	subtasks = subtasks.slice(0);
	subtasks.splice(subtasks.indexOf(subtask),1);
	var allSubtasksCO = checkIfAllSubtasksAreCO(subtasks);
	if(allSubtasksCO){
	    this.showAlertsForStatusChange('Task ' + taskName + ' Status Change: ' + status + ' to Complete(CO)', SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_CO,
									function(){
											this.setTaskStatusToCO(task);
											isSubtaskDisabled = true;
											callbk('yes','yes');
										},
									function(){
											this.setTaskStatusToIP(task);
											isSubtaskDisabled=false;
											callbk('yes','no');
										});
	}
	else{
		this.setTaskStatusToIP(task);
		isSubtaskDisabled = false;
		callbk('yes','no');
	}
}
/*
	When a subtask status is changed from IP to NS, check if all subtasks for that task are NS. If "yes" ask the user if he wants to
	mark the task as NS, if 'yes' mark task as NS and else mark task as IP. If not all subtasks are NS, mark task as IP
*/
function ChangeSubtaskStatusFromIPToNS(subtask, task, isSubtaskDisabled, callbk){
	var subtasks = task.subtasks;
	var status = task.status;
	var taskName = task.name;
	if(task.data){
		subtasks = task.childNodes;
		status = task.get('status');
		taskName = task.get('name');
	}
	subtasks = subtasks.slice(0);
	subtasks.splice(subtasks.indexOf(subtask),1);
	var allSubtasksNS = checkIfAllSubtasksAreNS(subtasks);
	if(allSubtasksNS){
	    this.showAlertsForStatusChange('Task ' + taskName + ' Status Change: ' + status + ' to Not Started(NS)', SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_NS,
									function(){
											this.setTaskStatusToNS(task);
											isSubtaskDisabled = false;
											callbk('yes','yes');
										},
									function(){
											this.setTaskStatusToIP(task);
											isSubtaskDisabled=false;
											callbk('yes','no');
										});
	}
	else{
		this.setTaskStatusToIP(task);
		isSubtaskDisabled = false;
		callbk('yes','no');
	}
}
/*
	When an user is allowed to make subtask status change from CO to NS, task status should be in IP. Check is all subtasks are in NS.
	If they are, ask user if he wants to mark task as also NS, if "yes" mark task NS else leave it to IP.
*/
function ChangeSubtaskStatusFromCOToNS(subtask, task, isSubtaskDisabled, callbk){
	var subtasks = task.subtasks;
	var status = task.status;
	var taskName = task.name;
	if(task.data){
		subtasks = task.childNodes;
		status = task.get('status');
		taskName = task.get('name');
	}
	subtasks = subtasks.slice(0);
	subtasks.splice(subtasks.indexOf(subtask),1);
	var allSubtasksNS = checkIfAllSubtasksAreNS(subtasks);
	if(allSubtasksNS){
	    this.showAlertsForStatusChange('Task ' + taskName + ' Status Change: ' + status + ' to Not Started(NS)', SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_NS,
									function(){
											this.setTaskStatusToNS(task);
											isSubtaskDisabled = false;
											callbk('yes', 'yes');
										},
									function(){
											this.setTaskStatusToIP(task);
											isSubtaskDisabled=false;
											callbk('yes', 'no');
										});
	}
	else{
		this.setTaskStatusToIP(task);
		isSubtaskDisabled = false;
		callbk('yes', 'no');
	}
}
/*
	When an user is allowed to make status change from CO to IP, task status should be IP, if by any chance, its not set it to IP.
*/
function ChangeSubtaskStatusFromCOToIP(subtask, task,callbk){
	var status = task.status;
	if(task.data){
		status = task.get('status');
	}
	if(status == '1')
	    status = STATUS_IP;
	if (status != STATUS_IP)
		this.setTaskStatusToIP(task);
	callbk('yes');
}
function checkIfAllSubtasksAreCO(subtasks){
	for(var i=0 ; i<subtasks.length; i++){
		var status = subtasks[i].status;
		if(subtasks[i].data)
			status = subtasks[i].get('status');
		if(status == '2')
		    status = STATUS_CO;
		if (status != STATUS_CO)
			return false;
	}
	return true;
}
function checkIfAllSubtasksAreNS(subtasks){
	for(var i=0 ; i<subtasks.length; i++){
		var status = subtasks[i].status;
		if(subtasks[i].data)
			status = subtasks[i].get('status');
		if(status == '0')
		    status = STATUS_NS;
		if (status != STATUS_NS)
			return false;
	}
	return true;
}
function checkIfAllSubtasksAreIP(subtasks){
	for(var i=0 ; i<subtasks.length; i++){
		var status = subtasks[i].status;
		if(subtasks[i].data)
			status = subtasks[i].get('status');
		if(status == '1')
		    status = STATUS_IP;
		if (status != STATUS_IP)
			return false;
	}
	return true;
}
function showAlertsForStatusChange(title, msg, onok,oncancel){
	PPI_Notifier.confirm(msg,title,onok,oncancel);
}
function markChecklistItemsCO(task){
    _.each(task.checklistItems, function (item, idx) {
        item.complete = true;
    });
    task.checklistStatus = 2;
    var tableView = Ext.getCmp('tableview');
    if (tableView) {
	    refreshChecklistIcon(task,2);
    }

}
function markChecklistItemsNS(task) {
    _.each(task.checklistItems, function (item, idx) {
        item.complete = false;
    });

    if (task.checklistItems.length > 0)
        task.checklistStatus = 1;
    else
        task.checklistStatus = 0;
    var tableView = Ext.getCmp('tableview');
    if (tableView) {
        refreshChecklistIcon(task, task.checklistStatus);
    }

}
