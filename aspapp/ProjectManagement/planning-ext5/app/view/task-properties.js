/**
 * stl.view.TaskProperties
 * The popup menu that appears when 'Set Task Properties' is clicked in  from phase menu options in matrix view.
 */

var originalDurationOnLoad;
var originalStatusOnLoad;
var originalManagerOnLoad;
var originalParticipantsOnLoad;
var originalTaskTypeOnLoad;
var originalResourcesOnLoad;
var originalSNETDate;

Ext.define('ProjectPlanning.view.TaskProperties', {
    title: TASK_PROPERTIES_TITLE,
    extend: 'Ext.window.Window',
    xtype: 'taskPropertiesWindow',
    id: 'taskPropertiesWindowInstance',
    cls: 'x-window new-project',
    modal: true,
    initComponent: function() {
        var me = this;
        var notificationString, statusImpactingSubtasksString;

        originalDurationOnLoad = me.setDurationValueOnLoad(me);
        originalStatusOnLoad = me.PropertiesObject.status;
        originalManagerOnLoad = me.PropertiesObject.manager;
        originalParticipantsOnLoad = me.setParticipantsValueOnLoad(me);
        originalTaskTypeOnLoad = me.PropertiesObject.taskType;
        originalResourcesOnLoad = me.setResourcesValueOnLoad(me);
        originalSNETDate = me.PropertiesObject.startNoEarlierThan;

        me.statusStore = Ext.create('Ext.data.Store', {
            fields: ['status', 'name'],
            data: statusTypes,
            filters: [function(item) {
                return item.get('status') != 'RL';
            }]
        });

        me.taskTypeStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: taskTypes
        });

        Ext.apply(me, {
            items: [{
                xtype: 'form',
                frame: false,
                width: 360,
                bodyPadding: 5,
                defaults: {
                    anchor: '100%',
                    margin: '5 5 2 5'
                },
                layout: 'anchor',
                fieldDefaults: {
                    labelAlign: 'left',
                    labelWidth: 150
                },
                items: [{
                        xtype: 'textfield',
                        itemId: 'TaskRemDurationField',
                        fieldLabel: DURATION,
                        allowBlank: false,
                        allowOnlyWhitespace: false,
                        value: me.setDurationValueOnLoad(me),
                        listeners: {
                            blur: function(textfield, event, eOpts) {
                                var currentVal = textfield.getValue();
                                var selectedStatus = Ext.ComponentQuery.query('#Status')[0].getValue();
                                if (currentVal != "NOT_SAME" && currentVal != "") {
                                    if (selectedStatus == "CO") {
                                        // if status is CO then always set duration to 0 days
                                        var durationString = ValidationClassInstance.getValidDurationString(0, TASK_DURATION_DEFAULT_STR, false);
                                        textfield.setValue(durationString);
                                    } else {
                                        var durationInSec = ValidationClassInstance.getValidDuration(currentVal, TASK_DURATION_DEFAULT, true),
                                            convertedDurationStr = ValidationClassInstance.getValidDurationString(durationInSec, TASK_DURATION_DEFAULT_STR, false);
                                        textfield.setValue(convertedDurationStr);
                                    }
                                }
                            }
                        }
                    },

                    {
                        xtype: 'combobox',
                        itemId: 'Status',
                        fieldLabel: STATUS,
                        store: me.statusStore,
                        displayField: 'name',
                        valueField: 'status',
                        selectOnFocus: true,
                        editable: true,
                        value: me.PropertiesObject.status != "NOT_SAME" ? me.PropertiesObject.status : "",
                        listeners: {
                            change: function(dropdown, newValue, oldValue, eOpts) {
                                var durationField = me.down("#TaskRemDurationField");
                                if (newValue == "CO") {
                                    //If task status is changed to CO then set duration to 0 days
                                    var durationString = ValidationClassInstance.getValidDurationString(0, TASK_DURATION_DEFAULT_STR, false);
                                    durationField.setValue(durationString);
                                } else if (oldValue == "CO" && (newValue == "NS" || newValue == "IP")) {
                                    //If task status is changed to NS/IP from CO then set duration to 1 day
                                    var durationString = ValidationClassInstance.getValidDurationString(ONE_DAY_DURATION_DEFAULT_SEC, ONE_DAY_DURATION_DEFAULT_SEC, false);
                                    durationField.setValue(durationString);
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        itemId: 'Manager',
                        fieldLabel: MANAGER,
                        store: me.Managerstore,
                        displayField: 'FullName',
                        valueField: 'Name',
                        editable: true,
                        selectOnFocus: true,
                        value: me.PropertiesObject.manager != "NOT_SAME" ? me.PropertiesObject.manager : "",
                        listeners: {}
                    }, {
                        xtype: 'combobox',
                        itemId: 'ParticipantsField',
                        fieldLabel: PARTICIPANTS,
                        store: me.Managerstore,
                        editable: true,
                        displayField: 'FullName',
                        valueField: 'Name',
                        value: me.setParticipantsValueOnLoad(me),
                        selectOnFocus: true,
                        multiSelect: true,
                        listConfig: {
                            getInnerTpl: function() {
                                return '<div class="x-combo-list-item"><div class="chkCombo-default-icon chkCombo"></div> {FullName}</div>';
                            }
                        },
                        listeners: {
                            focus: function(dropdown, e, eOpts) {

                            }
                        }
                    },
                    //                            {
                    //                                xtype: 'combobox',
                    //                                itemId: 'SpecialTaskTypeField',
                    //                                fieldLabel: SPECIAL_TASK_TYPE,
                    //                                store: me.taskTypeStore,
                    //                                displayField: 'name',
                    //                                valueField: 'id',
                    //                                selectOnFocus: false,
                    //                                hidden: true,
                    //                                editable: false,
                    //                                value: me.PropertiesObject.taskType != "NOT_SAME" ? me.PropertiesObject.taskType : "",
                    //                                listeners: {
                    //                                    change: function (dropdown, newValue, oldValue, eOpts) {
                    //                                        if (newValue == "snet") {
                    //                                            me.down("#SNET_Date_Field").setVisible(true);
                    //                                            if (originalSNETDate != "NOT_SAME") {
                    //                                                me.down("#SNET_Date_Field").setValue(ServerClientDateClass.getTodaysDate());
                    //                                            }
                    //                                        }
                    //                                        else {
                    //                                            me.down("#SNET_Date_Field").setVisible(false);
                    //                                        }
                    //                                    }
                    //                                }
                    //                            },
                    //                            {
                    //                                xtype: 'datefield',
                    //                                itemId: 'SNET_Date_Field',
                    //                                fieldLabel: SNET_DATE,
                    //                                format: ServerTimeFormat.getExtDateformat(),
                    //                                hidden: true,
                    //                                value: me.PropertiesObject.startNoEarlierThan != "NOT_SAME" ? me.PropertiesObject.startNoEarlierThan : "",
                    //                                listeners: {

                    //                                }
                    //                            },
                    {
                        xtype: "resourcepickerfield",
                        project: me.Project,
                        inputModeOnly: false,
                        itemId: 'ResoucePickerWidgetField',
                        fieldLabel: RESOURCES,
                        value: me.setResourcesValueOnLoad(me),
                        readOnly: true,
                        listeners: {
                            onBlur: function(evt) {
                                evt.stopEvent();
                            }
                        }
                    }
                ],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        text: OK_BUTTON,
                        tooltip: OK_BUTTON,
                        itemId: 'okButton',
                        //formBind: true, //only enabled once the form is valid
                        handler: function(btn, e, eOpts) {
                            me.setTaskProperties(me);
                            //me.setMilestoneProperties(me);
                            me.close();
                        }
                    }, {
                        xtype: 'button',
                        text: CANCEL_BUTTON,
                        tooltip: CANCEL_BUTTON,
                        itemId: 'cancelButton',
                        listeners: {
                            click: function(btn, e, Opts) {
                                me.close();
                            }
                        }
                    }]
                }]
            }],
            listeners: {
                beforeshow: function(window, eOpts) {
                    if (originalTaskTypeOnLoad == "snet") {
                        me.down("#SNET_Date_Field").setVisible(true);
                    }
                }

            }
        });
        this.callParent(arguments);
    },

    setTaskProperties: function(taskPropertiesInstance) {
        var notificationString = "";
        var idsOfTasksWithSubtasks = [];
        var selectedDuration = Ext.ComponentQuery.query('#TaskRemDurationField')[0].getValue();
        var durationToBeSet = ValidationClassInstance.getValidDuration(selectedDuration, TASK_DURATION_DEFAULT, false);
        var selectedStatus = Ext.ComponentQuery.query('#Status')[0].getValue();
        var selectedManager = Ext.ComponentQuery.query('#Manager')[0].getValue();
        var selectedParticipants = Ext.ComponentQuery.query('#ParticipantsField')[0].getValue();
        // var selectedSpecialTaskType = Ext.ComponentQuery.query('#SpecialTaskTypeField')[0].getValue();
        var selectedResources = Ext.ComponentQuery.query('#ResoucePickerWidgetField')[0].getValue();
        // var SNET_Date = Ext.ComponentQuery.query('#SNET_Date_Field')[0].getValue();
        var projectModel = taskPropertiesInstance.Project;
        var phaseId = taskPropertiesInstance.PhaseId;
        var tasksOfSelectedPhase = [];
        if (!taskPropertiesInstance.multiselectedTasksForSettingProperties) {
            var PhaseLevelTaskProperty = $.extend({}, stl.model.PhaseLevelTaskPrperty, {
                PhaseId: phaseId,
                Duration: durationToBeSet,
                Status: selectedStatus,
                Manager: selectedManager,
                Participants: selectedParticipants,
                Resources: selectedResources
            });
            projectModel.addOrUpdatePhaseLevelPropertiesCollection(PhaseLevelTaskProperty, phaseId);

            //= matrixView.find(tasksInPhase);

            _.each(stl.app.ProjectDataFromServer.rows, function(row, idx) {
                if (row.tasks[phaseId] && row.tasks[phaseId].length > 0) {
                    tasksOfSelectedPhase.push.apply(tasksOfSelectedPhase, row.tasks[phaseId]);
                }
            });
        } else {
            tasksOfSelectedPhase = taskPropertiesInstance.multiselectedTasksForSettingProperties;
        }



        var me = this;
        var matrixView = $(".matrix-view");
        //var tasksInPhase = ".task.has-phase-" + stringToHex(taskPropertiesInstance.PhaseId);


        //for (var i = 0; i < tasksOfSelectedPhase.length; i++) {
        _.each(tasksOfSelectedPhase, function(taskModel, idx) {
            //var taskModel = $(task).data("model"); //tasksOfSelectedPhase[i]; //$(tasksOfSelectedPhase[i]).data("model");
            var phaseLevelTaskPropertyObj = {};
            phaseLevelTaskPropertyObj.selectedDuration = selectedDuration;
            phaseLevelTaskPropertyObj.durationToBeSet = durationToBeSet;
            phaseLevelTaskPropertyObj.selectedManager = selectedManager;
            phaseLevelTaskPropertyObj.selectedStatus = selectedStatus;
            phaseLevelTaskPropertyObj.selectedParticipants = selectedParticipants;
            phaseLevelTaskPropertyObj.selectedResources = selectedResources;
            me.updateTaskModelWithPhaseLevelTaskPropertiesAfterValidation(taskModel, phaseLevelTaskPropertyObj, idsOfTasksWithSubtasks);
        });
        $(document).trigger("taskChangeAtPhaseLevel", [me, tasksOfSelectedPhase]);
        stl.app.triggerSave();
        this.showTaskPropertiesUpdateInfo(idsOfTasksWithSubtasks);

    },

    updateTaskModelWithPhaseLevelTaskPropertiesAfterValidation: function(taskModel, phaseLevelTaskPropertyObj, idsOfTasksWithSubtasks) {
        var me = this;
        var projectModel = this.Project;
        var selectedDuration = phaseLevelTaskPropertyObj.selectedDuration;
        var durationToBeSet = phaseLevelTaskPropertyObj.durationToBeSet;
        var selectedManager = phaseLevelTaskPropertyObj.selectedManager;
        var selectedStatus = phaseLevelTaskPropertyObj.selectedStatus;
        var selectedParticipants = phaseLevelTaskPropertyObj.selectedParticipants;
        var selectedResources = phaseLevelTaskPropertyObj.selectedResources;
        if (taskModel.isSummary) return;
        var originalTaskStatus = taskModel.status;
        var taskId = taskModel.id;
        var taskView = stl.app.matrixView.tasksByUid[taskModel.uid];
        var originalStatus = taskModel.status;
        if (taskModel.isMS) {
            if (selectedDuration != "NOT_SAME" && selectedDuration != "" && selectedDuration != null &&
                //duration is valid only for IMS
                taskModel.taskType === IMS_SHORT &&
                //Below method prevents duration to be set to zero if original status of task or  current selectedStatus is IP
                me.checkIfValidDuration(durationToBeSet, selectedStatus, taskModel)) {
                //Do not  modify duration if original task status is CO and new task status is also not NS or IP.
                if (originalStatus != STATUS_CO && selectedStatus !== STATUS_CO) {

                    taskModel.remainingDuration = durationToBeSet;

                    if (selectedStatus == "NS") {
                        taskModel.duration = durationToBeSet;
                    }
                }
            }
            if (selectedStatus && originalStatus !== selectedStatus && selectedStatus != "NOT_SAME" && selectedStatus != null) {

                // ip status is only  valid for  non-zero IMS, so skipping the status update steps in this case.
                if (me.checkIfStatusValidForMilestone(selectedStatus, taskModel)) {
                    // TODO - Validation - 1. Task can not be marked as CO if all checklists are not complete      
                    taskModel.status = selectedStatus;
                    me.updateTaskModelAsPerStatus(taskModel, selectedStatus);

                }
            }
            //IMS tasks with/without non zero duration can have resources assigned - VK
            if (taskModel.taskType === IMS_SHORT /*&& parseInt(taskModel.duration) > 0*/ ) {
                //1. there are no resources on load in task proprty window either no resources or different resources assigned in tasks 
                //2. there are some resources on load in task proprty windowif same resources assigned in tasks
                if ((originalResourcesOnLoad.length == 0 && selectedResources.length > 0) ||
                    (originalResourcesOnLoad.length > 0 && _.difference(selectedResources, originalResourcesOnLoad))) {
                    taskModel.resources = selectedResources;
                    me.updateResourceSheet(taskModel, projectModel);
                }


            }
            if (taskModel.taskType !== IPMS_SHORT && taskModel.taskType !== PEMS_SHORT){
                if (selectedManager && selectedManager != "NOT_SAME" && selectedManager != null)
                    taskModel.manager = selectedManager;
            }

            //1. there are no Participants on load in task proprty windoweither no resources or different resources assigned in tasks 
            //2. there are some Participants on load in task proprty windowif same resources assigned in tasks
            if ((originalParticipantsOnLoad.length == 0 && selectedParticipants.length > 0) ||
                (originalParticipantsOnLoad.length > 0 && _.difference(selectedParticipants, originalParticipantsOnLoad)))
                taskModel.participants = selectedParticipants;


        } else {
            if (taskModel.taskType != FULL_KIT) {
                if (selectedDuration != "NOT_SAME" && selectedDuration != "" && selectedDuration != null &&
                    //Below method prevents duration to be set to zero if original status of task or  current selectedStatus is IP 
                    me.checkIfValidDuration(durationToBeSet, selectedStatus, taskModel)) {
                    //Do not set modified duration if original task status is CO and newly task status is also not NS or IP.
                    if ((selectedStatus == "NS" || selectedStatus == "IP") || originalTaskStatus != "CO") {

                        taskModel.remainingDuration = durationToBeSet;

                        if (selectedStatus == "NS") {
                            taskModel.duration = durationToBeSet;
                        }
                    }
                }

                if (taskModel.taskType != TASKTYPE_BUFFER) { //For buffer tasks other properties should not be changed.Only Duration can be changed.

                    if (selectedStatus != "NOT_SAME" && selectedStatus != "" && selectedStatus != null) {
                        var oldStatus = taskModel.status;
                        //For zero duration tasks , ip status is not vald so skipping the status update steps
                        if (!(projectModel.checkIfZeroDurationTask(taskModel) && selectedStatus === STATUS_IP)) {
                            // TODO - Validation - 1. Task can not be marked as CO if all checklists are not complete      
                            taskModel.status = selectedStatus;

                            if (stl.app.isTaskHasSubtasks(taskModel, projectModel)) {
                                if (me.updateSubtaskStatus(taskModel, originalTaskStatus, selectedStatus)) {
                                    taskView.setSubtaskStatus();
                                    idsOfTasksWithSubtasks.push(taskId);
                                }
                            }
                            if (oldStatus !== selectedStatus)
                                me.updateTaskModelAsPerStatus(taskModel, selectedStatus);

                        }
                    }
                    

                    //1. there are no Participants on load in task proprty windoweither no resources or different resources assigned in tasks 
                    //2. there are some Participants on load in task proprty windowif same resources assigned in tasks
                    if ((originalParticipantsOnLoad.length == 0 && selectedParticipants.length > 0) ||
                        (originalParticipantsOnLoad.length > 0 && _.difference(selectedParticipants, originalParticipantsOnLoad)))
                        taskModel.participants = selectedParticipants;


                    //                    if (selectedSpecialTaskType != "NOT_SAME" && selectedSpecialTaskType != "" && selectedSpecialTaskType != null) {
                    //                        taskModel.taskType = selectedSpecialTaskType;
                    //                        if (selectedSpecialTaskType == "snet") {
                    //                            taskModel.startNoEarlierThan = SNET_Date;
                    //                        }
                    //                    }

                    //1. there are no resources on load in task proprty window either no resources or different resources assigned in tasks 
                    //2. there are some resources on load in task proprty windowif same resources assigned in tasks
                    if ((originalResourcesOnLoad.length == 0 && selectedResources.length > 0) ||
                        (originalResourcesOnLoad.length > 0 && _.difference(selectedResources, originalResourcesOnLoad))) {
                        taskModel.resources = selectedResources;
                        me.updateResourceSheet(taskModel, projectModel);
                    }
                }

            }
            if (taskModel.taskType != TASKTYPE_BUFFER && selectedManager != "NOT_SAME" && selectedManager != "" && selectedManager != null)
                        taskModel.manager = selectedManager;
        }
    },

    setMilestoneProperties: function(taskPropertiesInstance) {
        var notificationString = "";
        var idsOfTasksWithSubtasks = [];
        var selectedDuration = Ext.ComponentQuery.query('#TaskRemDurationField')[0].getValue();
        var durationToBeSet = ValidationClassInstance.getValidDuration(selectedDuration, TASK_DURATION_DEFAULT, false);
        var selectedStatus = Ext.ComponentQuery.query('#Status')[0].getValue();
        var selectedManager = Ext.ComponentQuery.query('#Manager')[0].getValue();
        var selectedParticipants = Ext.ComponentQuery.query('#ParticipantsField')[0].getValue();
        //var selectedSpecialTaskType = Ext.ComponentQuery.query('#SpecialTaskTypeField')[0].getValue();
        var selectedResources = Ext.ComponentQuery.query('#ResoucePickerWidgetField')[0].getValue();
        var projectModel = taskPropertiesInstance.Project;
        //var SNET_Date = Ext.ComponentQuery.query('#SNET_Date_Field')[0].getValue();
        var matrixView = $(".matrix-view");
        var milestonesInPhase = ".milestone.has-phase-" + stringToHex(taskPropertiesInstance.PhaseId);
        var milestonesOfSelectedPhase = matrixView.find(milestonesInPhase);
        var milestoneslength = milestonesOfSelectedPhase.length;
        for (var i = 0; i < milestoneslength; i++) {
            var msModel = $(milestonesOfSelectedPhase[i]).data("model");
            var originalMilestoneStatus = msModel.status;
            var originalMilestoneDuration = msModel.remainingDuration;
            var originalMilestoneManager = msModel.manager;

            var msId = msModel.id;
            if (selectedDuration && selectedDuration != "NOT_SAME" &&
                //duration is valid only for IMS
                msModel.taskType === IMS_SHORT &&
                //Below method prevents duration to be set to zero if original status of task or  current selectedStatus is IP
                this.checkIfValidDuration(durationToBeSet, selectedStatus, msModel)) {
                //Do not  modify duration if original task status is CO and new task status is also not NS or IP.
                if (originalMilestoneStatus != STATUS_CO && selectedStatus !== STATUS_CO) {

                    msModel.remainingDuration = durationToBeSet;

                    if (selectedStatus == "NS") {
                        msModel.duration = durationToBeSet;
                    }
                }
            }
            if (selectedStatus && originalMilestoneStatus !== selectedStatus && selectedStatus != "NOT_SAME") {

                // ip status is only  valid for  non-zero IMS, so skipping the status update steps in this case.
                if (this.checkIfStatusValidForMilestone(selectedStatus, msModel)) {
                    // TODO - Validation - 1. Task can not be marked as CO if all checklists are not complete      
                    msModel.status = selectedStatus;
                    this.updateTaskModelAsPerStatus(msModel, selectedStatus);

                }
            }
            if (selectedManager && selectedManager != "NOT_SAME")
                msModel.manager = selectedManager;

            //1. there are no Participants on load in task proprty windoweither no resources or different resources assigned in tasks 
            //2. there are some Participants on load in task proprty windowif same resources assigned in tasks
            if ((originalParticipantsOnLoad.length == 0 && selectedParticipants.length > 0) ||
                (originalParticipantsOnLoad.length > 0 && _.difference(selectedParticipants, originalParticipantsOnLoad)))
                msModel.participants = selectedParticipants;


            // resources are valid only for  non-zero duration ims
            //resources exist for IMS zero duration tasks too - VK
            if (msModel.taskType === IMS_SHORT /*&& parseInt(msModel.duration) > 0*/ ) {
                //1. there are no resources on load in task proprty window either no resources or different resources assigned in tasks 
                //2. there are some resources on load in task proprty windowif same resources assigned in tasks
                if ((originalResourcesOnLoad.length == 0 && selectedResources.length > 0) ||
                    (originalResourcesOnLoad.length > 0 && _.difference(selectedResources, originalResourcesOnLoad))) {
                    msModel.resources = selectedResources;
                    this.updateResourceSheet(msModel, projectModel);
                }


            }
            //$(document).trigger("milestoneupdate", [msModel, 'resources']);//For matrix view
            $(document).trigger("taskchange", [this, msModel, msModel.scopeItemId]); //For Table view and timeline view

        }



        stl.app.matrixView.triggerSave();


    },

    setDurationValueOnLoad: function(taskPropertiesInstance) {
        var durationStr;
        var remDuration = taskPropertiesInstance.PropertiesObject.remainingDuration;
        if (remDuration != "NOT_SAME") {
            durationStr = ValidationClassInstance.getValidDurationString(remDuration, TASK_DURATION_DEFAULT_STR, false);
        } else {
            durationStr = ""; // remDuration;
        }
        return durationStr;
    },

    setParticipantsValueOnLoad: function(taskPropertiesInstance) {
        var previousValues = taskPropertiesInstance.PropertiesObject.participants;
        return (previousValues === "NOT_SAME" ? [] : previousValues);
    },

    setResourcesValueOnLoad: function(taskPropertiesInstance) {
        var previousValues = taskPropertiesInstance.PropertiesObject.resources;
        return (previousValues === "NOT_SAME" ? [] : previousValues);
    },

    updateSubtaskStatus: function(taskModel, oldTaskStatus, newTaskStatus) {
        var me = this,
            subtasks = taskModel.subtasks;
        var isSubtasksUpdated = false;

        if (oldTaskStatus == 'NS' && newTaskStatus == 'IP') {

        } else if (oldTaskStatus == 'NS' && newTaskStatus == 'CO') {
            if (!checkIfAllSubtasksAreCO(subtasks)) {
                setSubtasksStatusToCO(subtasks, true);
                isSubtasksUpdated = true;
            }
        } else if (oldTaskStatus == 'IP' && newTaskStatus == 'CO') {
            if (!checkIfAllSubtasksAreCO(subtasks)) {
                setSubtasksStatusToCO(subtasks, true);
                isSubtasksUpdated = true;
            }
        } else if (oldTaskStatus == 'IP' && newTaskStatus == 'NS') {
            if (!checkIfAllSubtasksAreNS(subtasks)) {
                setSubtasksStatusToNS(subtasks);
                isSubtasksUpdated = true;
            }
        } else if (oldTaskStatus == 'CO' && newTaskStatus == 'IP') {
            if (!checkIfAllSubtasksAreIP(subtasks)) {
                setSubtasksStatusToIP(subtasks);
                isSubtasksUpdated = true;
            }
        } else if (oldTaskStatus == 'CO' && newTaskStatus == 'NS') {
            if (!checkIfAllSubtasksAreNS(subtasks)) {
                setSubtasksStatusToNS(subtasks, true);
                isSubtasksUpdated = true;
            }
        }

        return isSubtasksUpdated;
    },

    updateResourceSheet: function(taskModel, projectModel) {
        var resources = taskModel.resources;

        _.each(resources, function(res, index) {
            var res = projectModel.getResourceByUid(resources[index].resourceId);
            if (res) {
                Ext.getCmp('resGrid').updateResourceSheet(res, res.units, res.taskdata);
            }
        });

    },

    showTaskPropertiesUpdateInfo: function(idsOfTasksWithSubtasks) {
        var updatedSubtasksIdString = idsOfTasksWithSubtasks.join(" , ");

        if (idsOfTasksWithSubtasks.length > 0) {
            var title = TASK_PROPERTIES_UPDATED;
            var message = SUBTASKS_UPDATED_MSG + updatedSubtasksIdString;
            PPI_Notifier.warning(message, title);
        }
    },

    updateTaskModelAsPerStatus: function(taskModel, newTaskStatus) {
        //Similar code exists in task-view as well, with some tweaks we should re-use that code
        switch (newTaskStatus) {
            case "NS":
                taskModel.actualStartDate = null;
                taskModel.actualFinishDate = null;
                //Remiaining duration  and duration for milestones should not be changed based on status
                if (!taskModel.isMS) {
                    taskModel.remainingDuration = taskModel.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : taskModel.remainingDuration;
                    taskModel.duration = taskModel.remainingDuration;
                }
                taskModel.percentComplete = 0;
                break;
            case "IP":
                taskModel.actualStartDate = ServerClientDateClass.getTodaysDate();
                taskModel.actualFinishDate = null;
                taskModel.percentComplete = 0;
                taskModel.remainingDuration = taskModel.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : taskModel.remainingDuration;
                break;
            case "CO":
                taskModel.actualStartDate = taskModel.actualStartDate ? taskModel.actualStartDate : ServerClientDateClass.getTodaysDate();
                taskModel.actualFinishDate = ServerClientDateClass.getTodaysDate();
                taskModel.actualFinishDate.setHours(17, 0, 0);
                taskModel.remainingDuration = 0;
                taskModel.percentComplete = 100;
                break;
        }
    },

    checkIfStatusValidForMilestone: function(selectedStatus, msModel) {
        var isValidStatus = true;
        if (selectedStatus === STATUS_IP && (msModel.taskType !== IMS_SHORT || parseInt(msModel.duration) === 0))
            isValidStatus = false;

        return isValidStatus;


    },
    checkIfValidDuration: function(duration, selectedStatus, model) {
        var isValidDuration = true;
        if ((selectedStatus === STATUS_IP || model.status === STATUS_IP) && parseInt(duration) === 0)
            isValidDuration = false;

        return isValidDuration;


    }
});