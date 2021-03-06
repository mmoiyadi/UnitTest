stl.model.Project = function (cfg, projectName) {

    var today = ServerClientDateClass.getTodaysDate();
    today.setHours(0, 0, 0, 0);


    var defaults = {
        startDate: today,
        uid: "",
        name: projectName ? projectName: "",
        viewOnlyMode: false, //Used to know if project is opened in read only mode. - ReadOnly property passed through query string.
        isIDCCed: false,
        ProjectPlanningMode: PLAN,
        ProjectStatus: IN_PLAN_TYPE,
        dueDate: ServerClientDateClass.getTodaysDate(),  // FIXME
        division: "DEFAULT",
        author: "Author1",  // FIXME
        subject: "Cust1",  // FIXME
        category: "BU1",  // FIXME
        lastSaved: ServerClientDateClass.getTodaysDate(),  // FIXME
        manager: "Shashank",
        projectFileType: PROJECT_TYPE_PPI,
        projectCalendarName : "",
        isSubtaskEnabled: true,
        defaultStartTime:null,
        defaultFinishTime:null,
        defaultHrsPerDay: 0,
        defaultDaysPerWeek:0,
        attribute1: "",
        attribute2: "",
        attribute3: "",
        attribute4: "",
        attribute5: "",
        Description:"",
        CustomDate1:"",
        CustomDate2:"",
        PlannedDate:"",
        phases: [],
        rows: [],
        scopeItems: [],
        _milestones: [],
        links: [],
        subtaskLinks: [],
        resources: [],
        _nextUID: {
            task: 1,
            phase: 1,
            row: 1,
            scopeItem: 1,
            link: 1,
            checklistItem: 1,
            subtask: 10000,
            calendar: 2,
            resource: 1
        },
        _taskCount: 0,
        _resourcesByUid: {},
        _tasksAndMilestonesByUid: {},
        _phaseScopeAndTaskCountMap :{},
        _scopeItemsByUid: {},
        CC_Summary: {},
        CC_Settings: {},
        _scheduler: null,
        bufferSummary: {},
        CheckedOutUser : "",
        CheckedOutStatus : 0,
        IsComplexMode : true,
        jsonVersion : null,
        PhaseLevelTaskProperties : []
    };

    // If no config provided, blank project starts with some default structure
    if (!cfg) {
        cfg = {
            phases: [{
                id: "1",
                uid: "1",
                order: 0,
                type: "normal",
                name: DEFAULT_PHASE_NAME + SPACE_CONST + "1"
            }, {
                id: "2",
                uid: "2",
                order: 1,
                type: "milestone",
                name: DEFAULT_PHASE_NAME + SPACE_CONST + "1"
            }],
            rows: [{
                id: "1",
                uid: "1",
                order: "0",
                outlineLevel: 1,
                scopeItemUid: "1",
                name: DEFAULT_SCOPE_NAME,
                tasks: { /* filled in stl.model.Project.InitializeNewProject */
                },
                isExpanded: true
        }],
        scopeItems: [{
            id: "1",
            uid: "1",
            name: DEFAULT_SCOPE_NAME
        }
        ],
        CC_Settings: {
            PercentageCCCB: stl.app.commonSettingValue('DEFAULT_CCCB_BUFFER_PERCENT_SIZE'),
            PercentageCCFB: stl.app.commonSettingValue('DEFAULT_CCFB_BUFFER_PERCENT_SIZE'),
            PercentageCMSB: stl.app.commonSettingValue('DEFAULT_CMSB_BUFFER_PERCENT_SIZE'),
            FixedCCCB: stl.app.commonSettingValue('DEFAULT_CCCB_BUFFER_FIXED_SIZE'),
            FixedCCFB: stl.app.commonSettingValue('DEFAULT_CCFB_BUFFER_FIXED_SIZE'),
            FixedCMSB: stl.app.commonSettingValue('DEFAULT_CMSB_BUFFER_FIXED_SIZE'),
            RoundOffDuration: stl.app.defaultDurationReductionRoundingValue(),
            ReduceTaskDuration: stl.app.commonSettingValue('DURATION_REDUCTION_PERCENT'),
            HorizonDate: "",
            FeedingBuffersPolicyVal: stl.app.defaultFeedingBufferPolicyValue(),
            LastIDCCedHorizonDate: new Date(ServerClientDateClass.getTodaysDate().toUTCString())
        }
    };
}
$.extend(this, defaults, cfg);
this.computeMaxUIDs();
this.processMilestones();
var projectScope;
if (this.name.trim() != "" && this.getScopeItemByName(this.name) == null) {
    projectScope = this.createScope(this.name);
}
$(stl.app).on("globalresourceschanged", this.invalidateResources.bind(this));
this.scopeItems.map(function (scopeItem) {
    this._scopeItemsByUid[scopeItem.uid] = scopeItem;
} .bind(this));

};

$.extend(stl.model.Project.prototype, (function () {
    return ({

        createScheduler: function (calendar) {
            if (!this._scheduler) {
                this._scheduler = new stl.service.SimpleScheduler({
                    calendar: calendar
                });
            }

        },

        cloneObj: function (json) {
            return JSON.parse(json)
        },

        // Should be called toJSON, but JS reserves that name
        getJSON: function (isTemplate, templateName) {
            var project;
            this.generateSubtaskAutolinks();
            this.flattenForServer();
            this.nextTaskUID = this._nextUID.task;
            this.nextLinkUID = this._nextUID.link;
            var json = JSON.stringify(this, stl.model.Project.JSONFilter);
            this.unflattenFromServer();
            if (isTemplate) {
                project = this.cloneObj(json);

                var rootScope = this.getProjectRootScopeNodeForTemplate(project);
                rootScope.name = templateName;
                project.name = templateName;
                json = JSON.stringify(project, stl.model.Project.JSONFilter);
            }

            return json;
        },

        getProjectRootScopeNodeForTemplate: function (project) {
            var scope = _.find(project.scopeItems, function (item) {
                return item.name == project.name;

            });
            return scope;
        },

        getPrevTask: function(task){
            var prevTask = this.getImmediateSiblingTask(task,"prev");
            return prevTask;
        },
        getNextTask: function(task){
            var nextTask = this.getImmediateSiblingTask(task,"next");
            return nextTask;
        },
        getImmediateSiblingTask:function(task,prevOrNextSibling){
            var prevTask,
                row,
                phase,
                taskIndex,
                siblingTaskIndex,
                siblingTask;
            row = this.getRowById(task.rowId); 
            phase = this.getPhaseById(task.phaseId);
            order = parseInt(task.order);
            taskIndex = _.findIndex(row.tasks[phase.uid], function(task){
                return parseInt(task.order) === order;
            });
            if(taskIndex > -1) {
                switch(prevOrNextSibling){
                    case ("next"):
                        siblingTaskIndex = taskIndex+1;
                    break;
                    default:
                        siblingTaskIndex = taskIndex-1;
                }
                siblingTask = row.tasks[phase.uid][siblingTaskIndex];
            }
            return siblingTask;
        },
        getImmediateSiblingsUids: function(task){
            var immediateSiblingsUid ={
                nextTaskUid:undefined,
                prevTaskUid:undefined
            }

            var nextTask = this.getNextTask(task);
            if(nextTask) immediateSiblingsUid.nextTaskUid = nextTask.uid
            var prevTask = this.getPrevTask(task);
            if(prevTask) immediateSiblingsUid.prevTaskUid = prevTask.uid
            return immediateSiblingsUid;
        },

        getAllTaskIds: function () {
            var allTasksIds = [];
            var allTasks = this.getAllTasks();
            for (var i = 0; i < allTasks.length; i++) {
                allTasksIds = allTasksIds.concat(allTasks[i].id);
            }
            return allTasksIds;
        },
        getAllTasks: function () {
            var allTasks = [];
            for (var i = 0; i < this.rows.length; i++) {
                allTasks = allTasks.concat(this.flattenTasksForRow(this.rows[i]));
            }
            return allTasks;
        },

        getAllSummaryTasks: function () {
            var allSummaryTasks = [];
            var allTasksInProject = this.getAllTasks();
            _.each(allTasksInProject, function (element, index, list) {
                if (element.isSummary) {
                    allSummaryTasks.push(element);
                }
            });
            return allSummaryTasks;
        },

        /* This function returns all the task models in a phase with phaseId as key*/
        getAllTasksInPhaseBlock: function (phaseId) {
            var rows = this.rows;
            var allTasksInPhase = [];
            for (var i = 0; i < rows.length; i++) {
                var tasks = rows[i].tasks;
                if (tasks[phaseId])
                    allTasksInPhase = _.union(allTasksInPhase, _.filter(tasks[phaseId], function (task) { return task.taskType != "buffer" }));
            }
            return allTasksInPhase;
        },

        setProjectSummaryInfo: function (projectData) {
            me = this;
            me.uid = projectData.ProjectUid;
            me.name = projectData.name;
            // me.startDate=projectData.startDate;
            me.dueDate = projectData.duedate;
            me.division = projectData.Division;
            me.author = projectData.Author;
            me.subject = projectData.Subject;
            me.category = projectData.Category;
            me.lastSaved = projectData.LastSaved;
            me.manager = projectData.Manager;
            me.isIDCCed = projectData.isIDCCed;
            me.attribute1 = projectData.Attribute1;
            me.attribute2 = projectData.Attribute2;
            me.attribute3 = projectData.Attribute3;
            me.attribute4 = projectData.Attribute4;
            me.attribute5 = projectData.Attribute5;
            me.projectFileType = projectData.ProjectFileType;
            me.projectCalendarName = projectData.ProjectCalendarName;
            me.isSubtaskEnabled = projectData.IsSubtaskEnabled;
            me.participants = projectData.ProjectParticipants;
            me.defaultStartTime = projectData.DefaultStartTime;
            me.defaultFinishTime = projectData.DefaultFinishTime;
            me.defaultHrsPerDay = projectData.DefaultHrsPerDay;
            me.defaultDaysPerWeek = projectData.DefaultDaysPerWeek;
            me.CheckedOutUser = projectData.CheckedOutUser;
            me.CheckedOutStatus = projectData.CheckedOutStatus;
            me.ProjectStatus = projectData.ProjectStatus;
            me.InheritProjCalForResFlag = projectData.InheritProjCalForResFlag;
        },

        reassignTaskIds: function () {
            var newMspId = 1;
            var me = this;
            _.each(me.rows, function (rowItem, index, list) {
                var summaryTask = me.getSummaryTaskFromRow(rowItem);
                if (summaryTask) {
                    summaryTask.id = newMspId++;
                }
                _.each(me.phases, function (phaseItem, index, list) {
                    var tasks = rowItem.tasks[phaseItem.id];
                    _.each(tasks, function (task, index, list) {
                        if (!task.isSummary) {
                            task.id = newMspId++;
                        }
                    });
                });
            });
        },

        flattenTasksForRow: function (row) {
            var flatTasks = [];
            var me = this;
            if (row.tasks) {
                Object.keys(row.tasks).map(function (phaseID) {
                    var tasks = row.tasks[phaseID];
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        task = me.convertDateStringsToDateTimeStampStrings(task);
                        task.phaseId = phaseID;
                        flatTasks.push(task);
                    }
                });
            }
            return flatTasks;
        },
        convertDateStringsToDateTimeStampStrings:function(task){
            if(task.actualStartDate && task.actualStartDate != "")
                task.actualStartDate = new Date(task.actualStartDate);
            if(task.actualFinishDate && task.actualFinishDate != "")
                task.actualFinishDate = new Date(task.actualFinishDate);
            if(task.date1 && task.date1 != ""){
                task.date1 = new Date(task.date1);
            }
            if(task.date7 && task.date7 != ""){
                task.date7 = new Date(task.date7);
            }
            if(task.projectedDate && task.projectedDate != ""){
                task.projectedDate = new Date(task.projectedDate);
            }
            if(task.startNoEarlierThan && task.startNoEarlierThan != ""){
                task.startNoEarlierThan = new Date(task.startNoEarlierThan);
            }
            if(task.suggestedStartDate && task.suggestedStartDate != ""){
                task.suggestedStartDate = new Date(task.suggestedStartDate);
            }
            return task;
        },
        // Flattens the tasks for each row into an array
        flattenForServer: function () {
            var me = this;
            for (var i = 0; i < this.rows.length; i++) {
                var row = this.rows[i],
                    flatTasks = this.flattenTasksForRow(row);
                flatTasks.map(function (task) {
                    me.wrapParticipants(task);
                    task.subtasks.forEach(function (subtask) {
                        me.wrapParticipants(subtask);
                        subtask = me.convertDateStringsToDateTimeStampStrings(subtask);
                    });
                });
                row["_unflattenedTasks"] = row.tasks;
                row.tasks = flatTasks;
            }
        },

        // Sorts the tasks by phase ID and unwraps the resource IDs for tasks
        unflattenFromServer: function () {
            var me = this;
            var projectSpan = {
                end:0,
                start:new Date()
            };
            this.rows.map(function (row) {
                var cachedTasks = row["_unflattenedTasks"];
                delete row["_unflattenedTasks"];
                if (cachedTasks) {
                    var alltasks = _.flatten(_.values(cachedTasks));
                    var allTasksAndMilestones = alltasks.concat(me._milestones);
                    var lastTask = _.max(allTasksAndMilestones, function (task){
                        return task.endDate;
                    });
                    var firstTask = _.min(allTasksAndMilestones, function (task){
                        return task.startDate;
                    });
                    projectSpan.start = Math.min(firstTask.startDate,projectSpan.start);
                    projectSpan.end = Math.max(lastTask.endDate, projectSpan.end);
                    row.tasks = cachedTasks;
                } else {
                    var tasksByPhaseID = {};
                    for (var i = 0; i < row.tasks.length; i++) {
                        var task = row.tasks[i],
                            tasksForPhase = tasksByPhaseID[task.phaseId];
                        if (!tasksForPhase) {
                            tasksForPhase = [];
                            tasksByPhaseID[task.phaseId] = tasksForPhase;
                        }
                        tasksForPhase.push(task);
                        if (task.isMS)
                            me._milestones.push(task);

                        projectSpan.end = Math.max(projectSpan.end, task.endDate);
                        projectSpan.start = Math.min(projectSpan.start, task.startDate);
                    }
                    row.tasks = tasksByPhaseID;
                }
                // Need to unwrap tasks regardless of whether this came from the server or was cached
                Object.keys(row.tasks).forEach(function (phaseId) {
                    row.tasks[phaseId] = row.tasks[phaseId].sort(function (a, b) {
                        return a.order - b.order;
                    });
                    row.tasks[phaseId].forEach(function (task) {
                        me.unwrapParticipants(task);
                        task.subtasks.forEach(me.unwrapParticipants);
                        task.subtasks = task.subtasks.sort(function (a, b) {
                            return a.order - b.order;
                        });
                    });
                });
            });

            this.projectSpan = projectSpan;
            this.resources.forEach(function (resource) {
                me._resourcesByUid[resource.uid] = resource;
            });
        },

        // Wrap "participants" ids in objects, which is required due to a quirk of server JSON decoding
        wrapParticipants: function (taskOrSubtask) {
            if (taskOrSubtask.participants) {
                taskOrSubtask.participants = taskOrSubtask.participants.map(function (participantId) {
                    return { id: participantId };
                });
            }
        },

        // Unwrap "participants" objects which are that way due to a quirk of server JSON decoding
        unwrapParticipants: function (taskOrSubtask) {
            if (taskOrSubtask.participants) {
                taskOrSubtask.participants = taskOrSubtask.participants.map(function (participantObj) {
                    return participantObj.id;
                });
            }
        },

        // When loading a project, this finds the max UIDs already in use.
        // Also silently fills in any missing UIDs.
        computeMaxUIDs: function () {
            var me = this;
            me._taskCount = me._taskCount || 0;
            me._nextUID.phase = stl.model.Project.getMaxUIDInArray(me._nextUID.phase, this.phases);
            me._nextUID.scopeItem = stl.model.Project.getMaxUIDInArray(me._nextUID.scopeItem, this.scopeItems);
            me._nextUID.row = stl.model.Project.getMaxUIDInArray(me._nextUID.row, this.rows);
            me._nextUID.task = stl.model.Project.getMaxUIDInArray(me._nextUID.task, this._milestones);
            me._nextUID.link = stl.model.Project.getMaxUIDInArray(me._nextUID.link, this.links);
            me._nextUID.calendar = stl.model.Project.getCalMaxUIDInArray(me._nextUID.calendar, this.resources, "calendarUid");
            this.rows.map(function (row) {
                Object.keys(row.tasks).map(function (key) {
                    var tasks = row.tasks[key];
                    me._nextUID.task = stl.model.Project.getMaxUIDInArray(me._nextUID.task, tasks);
                    me._taskCount += tasks.length;
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        me._nextUID.subtask = stl.model.Project.getMaxUIDInArray(me._nextUID.subtask, task.subtasks);
                        for (var j = 0; j < task.subtasks.length; j++) {
                            var subtask = task.subtasks[j];
                            if (subtask.checklistItems) {
                                me._nextUID.checklistItem = stl.model.Project.getMaxUIDInArray(me._nextUID.checklistItem, subtask.checklistItems);
                            }
                        }
                    }
                });
            });
        },

        getNextUID: function (entityType) {
            var nextUID = this._nextUID[entityType];
            if (typeof (nextUID) === "undefined") {
                console.error("Unrecognized UID entity type:", entityType);
                return;
            }
            this._nextUID[entityType]++;
            return String(nextUID);
        },

        createMilestone: function (phase, row, msType) {

            var newMSUID = this.getNextUID("task"),
                ms = $.extend({}, stl.model.Task, {
                    id: newMSUID,
                    uid: newMSUID,
                    startDate: ServerClientDateClass.getTodaysDate(),   // FIXME
                    endDate: ServerClientDateClass.getTodaysDate(),
                    date1: ServerClientDateClass.getTodaysDate(),
                    name: this.getMilestoneName(msType),
                    duration: 0,
                    remainingDuration: 0,
                    phaseId: phase.id,
                    rowId: row.uid,
                    taskType: msType,
                    resources: [],
                    _predecessors: [],
                    _successors: [],
                    status: "NS",
                    percentBufferConsumption: '0',
                    percentChainComplete: '0',
                    milestoneColor: '',
                    taskColor: '',
                    bufferType: "None",
                    isMS: true,
                    isAutolinked: false,
                    checklistItems: [],
                    checklistStatus: 0,
                    subtaskType: stl.app.getDefaultSubtaskType(),
                    subtasksWIPLimit: stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT')
                });
            this.updateTaskDataWithPhaseLevelTaskProperties(ms);
            this._milestones.push(ms);
            if (msType === PE_SHORT) {
                this._projectEndMs = ms;
                stl.app.CreateTaskToolBar.onPEAddDelete(true/*isAdd*/);
            }
            this._tasksAndMilestonesByUid[ms.uid] = ms;
            //this event is fired from renderMilestone, so the following call seems redundant
            //$(this).trigger("milestoneadd", [ms]);
            return ms;
        },

        //count all milestones with names matching "CMS-Milestone" or "CMS-Milestone [0-9]*" and add 1 to get new name
        //Use it for CMS/IMS/PP but NOT for PE
        //Input Prefix name and list of milestones
        getNextDefaultMSName: function (msPrefix, allMilestones) {
            var countDefMSNames = 0, msPrefix_with_space = msPrefix + " ";
            _.each(allMilestones, function (milestone) {
                if (milestone.name.trim() == msPrefix) { //First default created MS ie. "CMS-Milestone"
                    countDefMSNames = Math.max(countDefMSNames, 1);
                }
                else if (milestone.name.indexOf(msPrefix_with_space) == 0) {
                    var defMSNameStr = milestone.name.substr(msPrefix_with_space.length);
                    if (defMSNameStr.trim().length != 0 && !isNaN(defMSNameStr)) {
                        var id = parseInt(defMSNameStr);
                        countDefMSNames = Math.max(countDefMSNames, id);
                    }
                }
            });
            return msPrefix + (countDefMSNames > 0 ? (" " + String(++countDefMSNames)) : "");
        },

        //msType can be PE/""Project End/CMS/IMS/"Pinch Point"
        changeMilestone: function (msType, msRec, callbk) {
            var MS_PREFIX, newMsName;
            switch (msType) {
                case PE_SHORT:
                case PROJECT_END:
                    newMsName = PROJECT_END;
                    break;
                case STRING_NONE_UPPER_CASE:
                    newMsName = this.getNextDefaultMSName(PINCH_POINT_TITLE, this._milestones);
                    break;
                default:
                    MS_PREFIX = msType + HYPHEN_SEPARATOR + MILESTONE_NAME_PREFIX;
                    newMsName = this.getNextDefaultMSName(MS_PREFIX, this._milestones);
                    break;
            }
            msRec.set ? msRec.set('name', newMsName) : msRec.name = newMsName;

            callbk();
        },

        getMilestoneName: function (msType) {
            var msName, MS_PREFIX = msType + HYPHEN_SEPARATOR + MILESTONE_NAME_PREFIX;
            switch (msType) {
                case PE_SHORT:
                    msName = PROJECT_END;
                    break;
                case STRING_NONE_UPPER_CASE:
                    msName = this.getNextDefaultMSName(PINCH_POINT_TITLE, this._milestones);
                    break;
                default:
                    msName = this.getNextDefaultMSName(MS_PREFIX, this._milestones);
                    break;
            }
            return msName;
        },

        checkIfNameAlreadyExists: function (name) {
            var msWithSameName = _.find(this._milestones, function (ms) {
                return ms.name === name;
            });
            return msWithSameName;
        },

        createTaskModel: function (phase, row, taskType, isSummaryTask /* fullkit or normal */) {
            if (isSummaryTask) {
                return this.createSummaryTask(phase, row, taskType);
            }
            if (multipleORs(taskType, TASKTYPE_FULLKIT, STRING_NORMAL)) {
                return this.createTask(phase, row, taskType);

            }
            else {
                return this.createMilestone(phase, row, taskType);

            }


        },

        updateTaskDataWithPhaseLevelTaskProperties: function(task){
            var me = this;
            var PhaseLevelTaskProperty = _.find(me.PhaseLevelTaskProperties, function(obj){
                return obj.PhaseId == task.phaseId;
            });



            if (PhaseLevelTaskProperty){
                var phaseLevelTaskPropertyObj = {};
                phaseLevelTaskPropertyObj.selectedDuration = PhaseLevelTaskProperty.Duration;
                phaseLevelTaskPropertyObj.durationToBeSet = PhaseLevelTaskProperty.Duration;
                phaseLevelTaskPropertyObj.selectedManager = PhaseLevelTaskProperty.Manager;
                phaseLevelTaskPropertyObj.selectedStatus = PhaseLevelTaskProperty.Status;
                phaseLevelTaskPropertyObj.selectedParticipants = PhaseLevelTaskProperty.Participants;
                phaseLevelTaskPropertyObj.selectedResources = PhaseLevelTaskProperty.Resources;
                var similarPropertiesObject = new Object();

                similarPropertiesObject.remainingDuration = "NOT_SAME";
                similarPropertiesObject.status = "NOT_SAME";
                similarPropertiesObject.manager = "NOT_SAME";
                similarPropertiesObject.participants = "NOT_SAME";
                similarPropertiesObject.taskType = "NOT_SAME";
                similarPropertiesObject.resources = "NOT_SAME";

                var managerStore = Ext.create('Ext.data.Store', {
                    id: 'ManagerStore',
                    fields: ['Name', 'FullName'],
                    data: stl.app.availablePeopleAndTeams
                });

                var phaseLevelTaskPropertiesWindow = Ext.create('ProjectPlanning.view.TaskProperties', {
                    PhaseId: PhaseLevelTaskProperty.PhaseId,
                    Managerstore: managerStore,
                    PropertiesObject: similarPropertiesObject,
                    Project: me
                });

                phaseLevelTaskPropertiesWindow.updateTaskModelWithPhaseLevelTaskPropertiesAfterValidation(task, phaseLevelTaskPropertyObj);

                phaseLevelTaskPropertiesWindow.close();
            }
        },

        createTask: function (phase, row, taskType /* fullkit or normal */) {
            var newTaskUID = this.getNextUID("task");
            var task = $.extend({}, stl.model.Task, {
                id: newTaskUID,
                uid: newTaskUID,
                startDate: ServerClientDateClass.getTodaysDate(), // phase.startDate, // TODO remove
                endDate: Sch.util.Date.add(ServerClientDateClass.getTodaysDate(), Sch.util.Date.DAY, TASK_DURATION_DEFAULT), //phase.endDate, // TODO remove
                duration: (taskType === TASKTYPE_FULLKIT ? 0 : TASK_DURATION_DEFAULT_SEC),
                remainingDuration: (taskType === TASKTYPE_FULLKIT ? 0 : TASK_DURATION_DEFAULT_SEC),
                taskType: taskType,
                subtaskType: stl.app.getDefaultSubtaskType(),
                subtasksWIPLimit: stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT'),
                status: "NS",
                rowId: row.uid,
                phaseId: phase.id,
                emptyText: this.getNextDefaultTaskName(phase, row, taskType),
                name: this.getNextDefaultTaskName(phase, row, taskType),
                resources: [],
                participants: [],
                subtasks: [],
                subtaskCount: 0,
                checklistItems: [],
                _successors: [],
                _predecessors: [],
                subtaskStreams:[],
                taskColor: '',
                date1: ServerClientDateClass.getTodaysDate(),
                date7: ServerClientDateClass.getTodaysDate(),
                isReadyToStart: false,
                fullkitPercentCompleteAtRL: 0,
                isSummary: false,
                subtaskStreamRate: stl.app.commonSettingValue('SUBTASKS_DEFAULT_STREAM_RATE'),
                subtaskStreamOffset: ValidationClassInstance.getValidDuration(stl.app.commonSettingValue('SUBTASKS_DEFAULT_STREAM_FREQ'),TASK_DURATION_DEFAULT_SEC,false)
            });
            this.updateTaskDataWithPhaseLevelTaskProperties(task);
            this._tasksAndMilestonesByUid[newTaskUID] = task;
            var scope = this.getScopeItemByUid(row.scopeItemUid);
            this.incrementTaskCountInPhaseScopeMap(phase.uid + '.' + scope.uid);
            return task;
        },

        createSummaryTask: function (phase, row, taskType) {
            var newTaskUID = this.getNextUID("task");
            var task = $.extend({}, stl.model.Task, {
                id: newTaskUID,
                uid: newTaskUID,
                startDate: ServerClientDateClass.getTodaysDate(),
                endDate: Sch.util.Date.add(ServerClientDateClass.getTodaysDate(), Sch.util.Date.DAY, TASK_DURATION_DEFAULT),
                duration: 0, //TASK_DURATION_DEFAULT_SEC,
                remainingDuration: 0, //TASK_DURATION_DEFAULT_SEC,
                taskType: taskType,
                subtaskType: stl.app.getDefaultSubtaskType(),
                subtasksWIPLimit: stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT'),
                status: "NS",
                rowId: row.uid,
                phaseId: phase.uid, //it should be phase.uid,
                emptyText: row.name != "" ? this.getScopeName(row) : "" + " Summary Task",
                name: row.name != "" ? this.getScopeName(row) : "" + " Summary Task",
                resources: [],
                participants: [],
                subtasks: [],
                subtaskCount: 0,
                checklistItems: [],
                _successors: [],
                _predecessors: [],
                taskColor: '',
                date1: ServerClientDateClass.getTodaysDate(),
                date7: ServerClientDateClass.getTodaysDate(),
                isReadyToStart: false,
                fullkitPercentCompleteAtRL: 0,
                isSummary: true
            });
            //this._tasksAndMilestonesByUid[newTaskUID] = task;
            return task;
        },

        createSubtask: function (subtaskCfg, taskModel) {           
            var subtask = $.extend({}, stl.model.Subtask, {
                checklistItems: []
            }, subtaskCfg);
            if (!subtask.uid) {
                subtask.uid = this.getNextUID("subtask");
                subtask.id = subtask.uid;
                subtask.startDate = taskModel.startDate;
                subtask.startDate = this.getSubTaskStartDate(subtask, taskModel);
                subtask.endDate = null;
                subtask.checklistStatus = 0;
                subtask.order = taskModel.subtasks.length;
                subtask.participants = [];
                duration: SUBTASK_DURATION_DEFAULT;
                remainingDuration: SUBTASK_DURATION_DEFAULT
            }
            return subtask;
        },

        increaseSelectedStreamPriorities: function(startPriority, selectedStreamIds, task){
            var selectedStreamsSortedByPriority = this.getSelectedStreamsByPriority(selectedStreamIds, task);
            var me = this;
            _.each(selectedStreamsSortedByPriority, function(selectedStream){
                if (selectedStream.streamPriority == 1){
                    return;
                }
                me.swapPriorityWithPriorStream(selectedStream, task);
            });

        },
        swapPriorityWithPriorStream: function(stream, task){
            var priorStream = _.find(task.subtaskStreams, function(strm){
                return strm.streamPriority == stream.streamPriority - 1;
            });
            var temp = priorStream.streamPriority;
            priorStream.streamPriority = stream.streamPriority;
            stream.streamPriority = temp;
        },

        decreaseSelectedStreamPriorities: function(startPriority, selectedStreamIds, task){
            var selectedStreamsSortedByPriority = this.getSelectedStreamsByPriority(selectedStreamIds, task);
            var me = this;
            _.each(selectedStreamsSortedByPriority, function(selectedStream){
                if (selectedStream.streamPriority == task.subtaskStreams.length){
                    return;
                }
                me.swapPriorityWithNextStreamInPriorty(selectedStream, task);
            });
        },

        swapPriorityWithNextStreamInPriorty: function(stream, task){
            var nextStream = _.find(task.subtaskStreams, function(strm){
                return strm.streamPriority == stream.streamPriority + 1;
            });
            var temp = nextStream.streamPriority;
            nextStream.streamPriority = stream.streamPriority;
            stream.streamPriority = temp;
        },

        moveStreamsToTop: function(selectedStreamIds, task){
            var topAvailablePriority = 1;
            var selectedStreamsSortedByPriority = this.getSelectedStreamsByPriority(selectedStreamIds, task);
            _.each(selectedStreamsSortedByPriority, function(stream){
                stream.streamPriority = topAvailablePriority++; 
            });

            var streamsSortedByPriority = _.sortBy(task.subtaskStreams, "streamPriority");
            _.each(streamsSortedByPriority, function(stream){
                if (selectedStreamIds.indexOf(stream.streamId.toString()) < 0){
                    stream.streamPriority = topAvailablePriority ++;
                }
            })
        },

        moveStreamsToBottom: function(selectedStreamIds, task){
            var lastAvailablePriority = task.subtaskStreams.length;
            var availableTopPriority = 1;
            var selectedStreamsSortedByPriority = this.getSelectedStreamsByPriority(selectedStreamIds, task);
            var selectedStreamsSortedByReversePriority = selectedStreamsSortedByPriority.reverse();
            _.each(selectedStreamsSortedByReversePriority, function(stream){
                stream.streamPriority = lastAvailablePriority--;
            });

            var streamsSortedByPriority = _.sortBy(task.subtaskStreams, "streamPriority");
            _.each(streamsSortedByPriority, function(stream){
                if (selectedStreamIds.indexOf(stream.streamId.toString()) < 0){
                    stream.streamPriority = availableTopPriority ++;
                }
            })
        },

        getStreams: function(streamIds, task){
            var selectedStreams = [];
            _.each(task.subtaskStreams, function(stream){
                if(streamIds.indexOf(stream.streamId.toString()) > -1){
                    selectedStreams.push(stream);
                }
            })
            return selectedStreams;
        },

        getSelectedStreamsByPriority: function(selectedStreamIds, task){
            var selectedStreams = this.getStreams(selectedStreamIds, task);
            var selectedStreamsSortedByPriority = _.sortBy(selectedStreams, function(stream){
                return stream.streamPriority;
            });
            return selectedStreamsSortedByPriority;
        },

        createStream: function(SubtaskStreamConfig){
            
            
            var task = this.getTaskOrMilestoneByUid(SubtaskStreamConfig.taskId);
            var arrOfExistingStreams=[],
            addToStream;

            
                 for(var i=0;i<task.subtaskStreams.length;i++){
                        if(task.subtaskStreams[i].hasOwnProperty('name')){
                            var streamName= task.subtaskStreams[i].name;
                            if((task.subtaskStreams[i].name).indexOf(DEFAULT_STREAM_NAME)!=-1){
                                streamIndex= streamName.indexOf(DEFAULT_STREAM_NAME);
                                var lastDigits= streamName.substr(streamIndex+DEFAULT_STREAM_NAME.length);

                                 if(!(isNaN(lastDigits))){
                                    arrOfExistingStreams.push(lastDigits);
                                }
                            }
                        }
                   }
                    addToStream= Math.max.apply(null, arrOfExistingStreams);

                    if(arrOfExistingStreams.length===0 || addToStream===undefined){
                        addToStream=0;
                    }
                    if(task.subtaskCount>0){
                        SubtaskStreamConfig.name = SubtaskStreamConfig.name ? SubtaskStreamConfig.name : DEFAULT_STREAM_NAME + (addToStream+1);
                     }
                     else{
                        SubtaskStreamConfig.name = SubtaskStreamConfig.name ? SubtaskStreamConfig.name : DEFAULT_STREAM_NAME + 1;
                     }
                    var newStream  =  $.extend({}, stl.model.SubtaskStream, SubtaskStreamConfig);

                    if (!task.subtaskStreams){
                        task.subtaskStreams = [];
                    }

          
            //task.subtaskStreams.push(newStream);
            return newStream;
         
        },

        deleteStreams: function(streamIds, task){
            var me =this;
            task.subtaskStreams = _.reject(task.subtaskStreams, function(stream){
                return streamIds.indexOf(stream.streamId) > -1;
            });
        },

        getSubTaskStartDate: function (subtask, parentTask) {
            var subtaskCount = parentTask.subtasks.length;
            if (parentTask.subtaskType === SEQUENTIAL /* Sequential*/ && subtaskCount > 0) {
                // return Sch.util.Date.add(parentTask.subtasks[subtaskCount-1].startDate , Sch.util.Date.DAY, 1);
                this.createScheduler(stl.app.calendar);
                return this._scheduler.adjustDatesForDuration(parentTask.subtasks[subtaskCount - 1].startDate, parentTask.subtasks[subtaskCount - 1].remainingDuration, true/*add or substract duration flag- true for add/ false for Substract*/)

            }
            else if(parentTask.subtaskType == SubtaskTypesEnum.PARALLEL){
                return parentTask.startDate;
            }
            
            return subtask.startDate;
        },

        reCalculateSubTaskStartDate: function (parentTask) {
            me = this;
            var parentTaskStartDate = parentTask.suggestedStartDate ? new Date(parentTask.suggestedStartDate) : parentTask.startDate;
            if (parentTask.subtaskType == SubtaskTypesEnum.SEQUENTIAL) {
                var subtaskCount = parentTask.subtasks.length;
                me.createScheduler(stl.app.calendar);
                parentTask.subtasks = parentTask.subtasks.map(function (subtaskItem, index, subtasksArr) {
                    if (index == 0)
                        subtaskItem.startDate = me._scheduler.adjustDatesForDuration(parentTaskStartDate, 0, true/*add or substract duration flag- true for add/ false for Substract*/);
                    else
                        subtaskItem.startDate = me._scheduler.adjustDatesForDuration(subtasksArr[index - 1].startDate, subtasksArr[index - 1].remainingDuration, true/*add or substract duration flag- true for add/ false for Substract*/);

                    return subtaskItem;
                });
            }
            else if(parentTask.subtaskType == SubtaskTypesEnum.PARALLEL){
                parentTask.subtasks = parentTask.subtasks.map(function (subtaskItem) {
                    subtaskItem.startDate = parentTaskStartDate;
                    return subtaskItem;
                });
            }
            //Do nothing in case of VOLUME/WIP
            //else{}
        },

        updateTaskDurationRollupViolationData: function (taskModel) {
            var projectModel = this;
            var subtaskDuration = projectModel.calculateRollupDuration(taskModel);
            taskModel.durationViolationData = taskModel.durationViolationData || {
                oldVal: taskModel.remainingDuration
            };
            
            taskModel.durationViolationData.data = subtaskDuration;
            taskModel.durationViolationData.isViolated = subtaskDuration>taskModel.remainingDuration;
        },
        updateTaskResourceRollupViolationData: function (taskModel) {
            var projectModel = this;
            var resourceViolationData = projectModel.calculateRollupResource(taskModel);
            taskModel.resourceViolationData = taskModel.resourceViolationData || {};
            
            taskModel.resourceViolationData.data = resourceViolationData;
            taskModel.resourceViolationData.isViolated = resourceViolationData.length > 0;
        },
        updateTaskResourceRollupInfoData: function (taskModel) {
            var projectModel = this;
            var resourceInfoData = projectModel.calculateRollupResource(taskModel);
            taskModel.resourceInfoData = taskModel.resourceInfoData || {
                data:[]
            };
            var resourceInfoDataToBeAppendedInTaskModel = [];
            _.each(resourceInfoData, function (resourceData) {
                var resourceInfoDataInTask = _.find(taskModel.resourceInfoData.data, function (resourceDataInTask) {
                    return resourceDataInTask.resourceId === resourceData.resourceId;
                });

                if(resourceInfoDataInTask) {
                    resourceInfoDataInTask.units = resourceData.units;
                } else {
                    resourceInfoDataToBeAppendedInTaskModel.push(resourceData);
                }
            });
            
            taskModel.resourceInfoData.data = taskModel.resourceInfoData.data.concat(resourceInfoDataToBeAppendedInTaskModel);
            taskModel.resourceInfoData.isInfoToBeShown = resourceInfoData.length > 0;
        },
        
        updateTaskResourcesFromRollupData: function(updatedResources, taskModel) {
            var newResourcesToBeAdded = [];
            _.each(updatedResources, function (updatedResource) {
                var taskResourceToBeUpdated = _.find(taskModel.resources, function (taskResource) {
                    return taskResource.resourceId == updatedResource.resourceId;
                });

                if (taskResourceToBeUpdated) {
                    taskResourceToBeUpdated.units = updatedResource.units;
                } else {
                    newResourcesToBeAdded.push(updatedResource);
                }
            });
            taskModel.resources = taskModel.resources.concat(newResourcesToBeAdded);
        },

        calculateRollupDuration: function(parentTask) {
            var rollupDuration = 0;

            if(parentTask.subtasks) {
                var subtaskType = parentTask.subtaskType;
                var WIP_Limit = parentTask.subtasksWIPLimit;
                //var totalDuration = 0;
                var maxDuration = 0;
                if (subtaskType == SubtaskTypesEnum.SEQUENTIAL || subtaskType == SubtaskTypesEnum.PARALLEL) {
                    for(var i=0, subtasks = parentTask.subtasks; i < subtasks.length; i++)
                    {
                        var subtask = subtasks[i];
                        if (subtaskType == SubtaskTypesEnum.SEQUENTIAL) {
                            maxDuration += parseInt(subtask.remainingDuration);
                        }
                        else if (subtaskType == SubtaskTypesEnum.PARALLEL) {
                            if (parseInt(subtask.remainingDuration) > maxDuration)
                                maxDuration = parseInt(subtask.remainingDuration);
                        }
                    }
                }
                if (subtaskType == SubtaskTypesEnum.WIP && WIP_Limit) {

                    var NSorIPSubtasks = _.filter(parentTask.subtasks, function (subtask) { return subtask.status != STATUS_CO; });
                    var NStasksArray = _.filter(NSorIPSubtasks, function (subtask) { return subtask.status == STATUS_NS; });
                    var IPTasksArray = _.filter(NSorIPSubtasks, function (subtask) { return subtask.status == STATUS_IP; });
                    var subtasksArr = IPTasksArray.concat(NStasksArray);
                    var tempSubtaskArr = [];
                    _.each(subtasksArr, function (subtask, idx) {
                        var tempObj = {};
                        tempObj.id = subtask.id;
                        tempObj.uid = subtask.uid;
                        tempObj.name = subtask.name;
                        tempObj.status = STATUS_NS;
                        tempObj.totalDuration = parseInt(subtask.remainingDuration);
                        tempObj.remainingDuration = parseInt(subtask.remainingDuration);
                        tempSubtaskArr.push(tempObj);
                    });
                    var noOfSubtasks = subtasksArr.length;
                    var noOfCompletedTasks = 0;
                    var taskCounter = 0;
                    while (noOfCompletedTasks < noOfSubtasks) {
                        var noOfTasksMarkedIP = 0;
                        var durationIncreased = false;

                        var subtasks = this.getAvailableSubtasksForExecution(tempSubtaskArr, WIP_Limit);
                        var minimumExecutionTimeOfAllSubtasks = this.getMinimalExecutionTimeOfAllSubtasksInExecution(subtasks);
                        noOfCompletedTasks = this.updateRemainingDurationOfSubtasksInExecution(subtasks, minimumExecutionTimeOfAllSubtasks, noOfCompletedTasks);
                        maxDuration = maxDuration + minimumExecutionTimeOfAllSubtasks;


                    }
                }
                rollupDuration = maxDuration;
            }
            return rollupDuration;
        },

        calculateRollupResource: function (parentTask) {
            var rollUpResourceUnitsForTask = [];
            var project = this;
            if(parentTask.subtasks) {
                var subtaskType = parentTask.subtaskType;
                var resourceIdUnitDaysMap = {};
                for(var i=0, subtasks = parentTask.subtasks; i < subtasks.length; i++) {
                    var subtask = subtasks[i];
                    if(subtask.status === STATUS_NS || subtask.status === STATUS_IP) {
                        _.each(subtask.resources, function (resource) {
                            var unitDaysForThisRes = (parseInt(subtask.remainingDuration))*(stl.app.Validator.parseDecimalValue(resource.units, stl.app.NumberDecimalSeparator));
                            var cumulativeUnitDaysForRes = resourceIdUnitDaysMap[resource.resourceId];
                            if (cumulativeUnitDaysForRes) {
                                resourceIdUnitDaysMap[resource.resourceId] = cumulativeUnitDaysForRes + unitDaysForThisRes;
                            } else {
                                resourceIdUnitDaysMap[resource.resourceId] = unitDaysForThisRes;
                            }
                        });
                    }
                }
                for (var resourceId in resourceIdUnitDaysMap) {
                    if (resourceIdUnitDaysMap.hasOwnProperty(resourceId)) {
                        var resourceInParentTask = _.find(parentTask.resources, function (resource) {
                            return resource.resourceId == resourceId;
                        });
                        var newUnits = (resourceIdUnitDaysMap[resourceId]/parentTask.remainingDuration).toFixed(1);
                        var resource = _.find(this.resources, function(res){
                            return res.uid == resourceId;
                        });
                        if (parseInt(newUnits) > parseInt(resource.MaxUnits)){
                            newUnits = resource.MaxUnits.toString();
                            PPI_Notifier.info(RESOURCE_ROLL_UP_CAPPED_TO_MAX_UNITS);
                        }
                        if(!resourceInParentTask || stl.app.Validator.parseDecimalValue(newUnits,stl.app.NumberDecimalSeparator) > stl.app.Validator.parseDecimalValue(resourceInParentTask.units,stl.app.NumberDecimalSeparator)) {
                            var resource = {
                                resourceId: resourceId,
                                name: project.getResourceByUid(resourceId).Name,
                                oldUnits: resourceInParentTask?resourceInParentTask.units:0,
                                units: newUnits
                            };
                            rollUpResourceUnitsForTask.push(resource);
                        }
                    }
                }                
            }
            return rollUpResourceUnitsForTask;
        },
        isSubtaskTypeOptionHidden : function(selectedSubtaskType, optionVal){
            var me = this;
            var bHideOption = false;
            var hiddenSubtaskTypesArr = me.getHiddenSubtaskTypeConfigValue();
            var subtaskKeyForOptionValue = me.getSubtaskKeyForOptionValue(optionVal);
            if(hiddenSubtaskTypesArr && hiddenSubtaskTypesArr.length > 0){                
                var result = _.find(hiddenSubtaskTypesArr, function(item){ return item == subtaskKeyForOptionValue; });
                if( result && selectedSubtaskType != optionVal){
                    bHideOption = true;
                }
            }
            return bHideOption;
        },

        getSubtaskKeyForOptionValue : function(optionVal){
            var subtaskKey = WIPSubtasktypesConfigKey;

            switch(parseInt(optionVal)) {
                case SubtaskTypesEnum.SEQUENTIAL:                    
                    subtaskKey = SeqentialSubtasktypesConfigKey;
                    break;
                case SubtaskTypesEnum.VOLUME:
                   subtaskKey = "volume";
                    break;
                case SubtaskTypesEnum.WIP:
                    subtaskKey = WIPSubtasktypesConfigKey;
                    break;
                case SubtaskTypesEnum.PARALLEL:
                   subtaskKey =  ParallelSubtasktypesConfigKey;
                    break;
                case SubtaskTypesEnum.STREAMS:
                    subtaskKey = StreamsSubtasktypesConfigKey;
                    break;
            }

            return subtaskKey;
        },

        getHiddenSubtaskTypeConfigValue : function(){
            var arrOfHiddenTypes = stl.app.hiddenSubtaskTypes.split(STRING_SEPARATOR);
            return arrOfHiddenTypes;//initialized in Application.js in initializeApplicationData method
        },

        getAvailableSubtasksForExecution: function (subtasksArr, WIPLimit) {
            var subTasksForExecution = _.filter(subtasksArr, function (subtask) {
                return subtask.status != STATUS_CO;
            });

            return subTasksForExecution.slice(0, WIPLimit);
        },

        getMinimalExecutionTimeOfAllSubtasksInExecution: function (subtasks) {
            var arrRemainDurationOfSubtasks = _.map(subtasks, function (subtask) {
                return subtask.remainingDuration;
            });

            return _.min(arrRemainDurationOfSubtasks);
        },

        updateRemainingDurationOfSubtasksInExecution: function (subtasks, executionDuration, noOfCompletedTasks) {
            _.each(subtasks, function (subtask) {
                subtask.remainingDuration = subtask.remainingDuration - executionDuration;
                if (subtask.remainingDuration == 0) {
                    subtask.status = STATUS_CO;
                    noOfCompletedTasks = noOfCompletedTasks + 1;
                }
            });

            return noOfCompletedTasks;
        },

        isWIPLimitExceeded: function (taskModel, newSubtaskStatus) {
            var subtasks = taskModel.subtasks;
            var taskWIPLimit = taskModel.subtasksWIPLimit;
            var noOfIPSubtasks = 0;

            noOfIPSubtasks = _.filter(subtasks, function (subtask, index) {
                return subtask.status == STATUS_IP;
            }).length;

            if (newSubtaskStatus == STATUS_IP) {
                if (noOfIPSubtasks >= taskWIPLimit)
                    return true;
            }
            else {
                if (noOfIPSubtasks > taskWIPLimit) {
                    return true;
                }
                else
                    return false;
            }
        },

        /*task naming/renaming logic starts here*/

        getNextDefaultTaskName: function (phase, row, taskType) {
            var scope = this.getScopeItemByUid(row.scopeItemUid);
            //CON-2262: Task Name should not contain Project Name for tasks in blank rows at outline level 1
            //Changes by Nilesh
            if (this.isProjectComplex() && row.outlineLevel == 1 && !this.getSummaryTaskFromRow(row)) {
                var currentIndex = this._phaseScopeAndTaskCountMap[phase.uid + '.' + scope.uid];
                var index = (currentIndex === 0) ? EMPTY_STRING : ++currentIndex;
                if (taskType === FULL_KIT) {
                    return FK_SHORT + PERIOD_CONSTANT + phase.name + ((index) ? PERIOD_CONSTANT + index : EMPTY_STRING);
                }
                else {
                    return phase.name + ((index) ? PERIOD_CONSTANT + index : EMPTY_STRING);
                }
            } else {
                return this.getDefaultTaskName(phase, scope, taskType);
            }

        },

        getScopeName: function (row) {
            var scope = this.getScopeItemByUid(row.scopeItemUid);
            return scope.name;

        },

        getDefaultTaskNameCompareString: function (phaseName, scopeName) {
            if (phaseName != EMPTY_STRING && scopeName != EMPTY_STRING)
                return phaseName + PERIOD_CONSTANT + scopeName;
            else if (phaseName)
                return phaseName;
            else if (scopeName)
                return scopeName;
            else
                return EMPTY_STRING;

        },
        getDefaultTaskName: function (phase, scope, taskType) {
            var defaultTaskNameWithIndex = this.getDefaultTaskNameWithIndex(phase, scope);
            if (taskType === FULL_KIT) {
                return FK_SHORT + ((defaultTaskNameWithIndex) ?
                                    PERIOD_CONSTANT + defaultTaskNameWithIndex :
                                    EMPTY_STRING);
            }
            else {
                return defaultTaskNameWithIndex;
            }

        },

        getDefaultTaskNameWithIndex: function (phase, scope) {
            var currentIndex = this._phaseScopeAndTaskCountMap[phase.uid + '.' + scope.uid];
            var index = (currentIndex === 0) ? EMPTY_STRING : ++currentIndex;
            var phaseName = phase.name,
                scopeName = scope.name;

            if (phaseName != EMPTY_STRING && scopeName != EMPTY_STRING)
                return phaseName + PERIOD_CONSTANT + scopeName + ((index) ? PERIOD_CONSTANT + index : EMPTY_STRING);
            else if (phaseName)
                return phaseName + ((index) ? PERIOD_CONSTANT + index : EMPTY_STRING);
            else if (scopeName)
                return scopeName + ((index) ? PERIOD_CONSTANT + index : EMPTY_STRING);
            else
                return index;

        },

        //Create Phase scope task number map on:
        //load and create new
        //phase/scope add/delete
        createPhaseScopeAndTaskCountMap: function () {
            var me = this;
            me._phaseScopeAndTaskCountMap = {};

            _.each(me.phases, function (phase) {
                if (multipleORs(phase.type, STRING_NORMAL, FULL_KIT)) {
                    _.each(_.keys(me._scopeItemsByUid), function (scopeItemUid) {
                        me._phaseScopeAndTaskCountMap[phase.uid + "." + scopeItemUid] = 0;
                    });
                }
            });

            var allTasks = _.filter(this._tasksAndMilestonesByUid,
                 function (task) {
                     if (multipleORs(task.taskType, STRING_NORMAL, FULL_KIT)) {  //filter out Milestones
                         var phase = _.findWhere(me.phases, { uid: task.phaseId });
                         var row = _.findWhere(me.rows, { uid: task.rowId });
                         if (row && phase) {
                             var scope = _.findWhere(me.scopeItems, { uid: row.scopeItemUid });
                             if (task && phase && scope) {
                                 if (task.name.indexOf(phase.name + "." + scope.name) !== -1) {//filter out tasks which does not have default task name
                                     task.phase = phase;
                                     task.scope = scope;
                                     return task;
                                 }
                             }
                         }
                     }

                 });
            _.each(allTasks, function (task) {
                var indexFromtask = parseInt(task.name.split('.')[2]) || //if both phase nad scope names are not ""
                                   parseInt(task.name.split('.')[1]) || //if any one phase nad scope names are ""
                                   parseInt(task.name.split('.')[0]) || //if both phase and scope names are ""
                                   1;
                //Set max of the task no or the earlier value               
                me._phaseScopeAndTaskCountMap[task.phase.uid + "." + task.scope.uid] = Math.max(indexFromtask, me._phaseScopeAndTaskCountMap[task.phase.uid + "." + task.scope.uid]);
            });
        },

        //resets the keys of the map to zero on:
        //Phase scope name edit
        resetTaskCountInPhaseScopeMap: function (isPhase, phaseOrScopeUid) {
            var me = this;
            var thisPhaseORScopeUID = phaseOrScopeUid;
            if (isPhase) {
                _.each(_.keys(me._scopeItemsByUid), function (scopeItemUid) {//Reset all the keys where phase id = phaseOrScopeUid 
                    me._phaseScopeAndTaskCountMap[thisPhaseORScopeUID + "." + scopeItemUid] = 0;
                });
            }
            else { //its a scope
                _.each(me.phases, function (phase) {
                    if (multipleORs(phase.type, STRING_NORMAL, FULL_KIT)) { //exclude milestone phases
                        me._phaseScopeAndTaskCountMap[phase.uid + "." + thisPhaseORScopeUID] = 0;
                    }
                });

            }

        },

        incrementTaskCountInPhaseScopeMap: function (key) {
            this._phaseScopeAndTaskCountMap[key] = ++this._phaseScopeAndTaskCountMap[key];
        },

        /*task naming/renaming logic ends here*/

        generateSequentialSubtaskAutoLinksForTask: function (task, subtaskLinksByKey) {
            var subtasks = task.subtasks;
            this.generateSequentialSubtaskAutoLinks(subtasks);
        },

        generateSequentialSubtaskAutoLinks: function(subtasks){
            for (var i = 0; i < subtasks.length - 1; i++) {
                var subtaskA = subtasks[i],
                        subtaskB = subtasks[i + 1];
                //  candidateLinkKey = subtaskA.uid + '->' + subtaskB.uid;
                // if (!subtaskLinksByKey[candidateLinkKey]) {
                var newLink = {
                    from: subtaskA.uid,
                    to: subtaskB.uid,
                    uid: this.getNextUID("link")
                };
                //subtaskLinksByKey[candidateLinkKey] = newLink;
                this.subtaskLinks.push(newLink);
                //}
            }
        },

        generateSubtaskLinksForStreams: function(task){
            var subtasksGroupedByStreams = _.groupBy(task.subtasks, function(subtask){
                return subtask.streamId;
            });
            var me = this;

            _.each(Object.keys(subtasksGroupedByStreams), function(key){
                me.generateSequentialSubtaskAutoLinks(subtasksGroupedByStreams[key]);
            })
        },

        removeSequentialSubtaskAutoLinks: function (task, subtaskLinksByKey, linksBySubtask) {
            for (var i = 0, subtasks = task.subtasks; i < subtasks.length; i++) {
                if (subtasks[i].deleted !== true) {
                    var subtask = subtasks[i],
                        links = linksBySubtask[subtask.uid];
                    if (links) {
                        for (var j = 0; j < links.length; j++) {
                            var linkIndex = this.subtaskLinks.indexOf(links[j]);
                            if (linkIndex >= 0) {
                                this.subtaskLinks.splice(this.subtaskLinks.indexOf(links[j]), 1);
                            }
                        }
                    }
                }
            }
        },

        /** 
        * Create any missing links between subtasks when the task is set to "sequential" subtasks
        */
        generateSubtaskAutolinks: function () {
            var me = this;
            this.subtaskLinks = [];
            this.rows.map(function (row) {
                Object.keys(row.tasks).map(function (phaseId) {
                    var tasks = row.tasks[phaseId];
                    for (var i = 0; i < tasks.length; i++) {
                        var task = tasks[i];
                        if(task.subtaskType){
                            if (task.subtaskType === SEQUENTIAL) {
                                me.generateSequentialSubtaskAutoLinksForTask(tasks[i]/*, subtaskLinksByKey*/);
                            } else if (task.subtaskType.toString() === SubtaskTypesEnum.STREAMS.toString()){
                                me.generateSubtaskLinksForStreams(task);
                            }
                        }
                    }
                })
            });
        },

        doesLinkExists: function(toUid, fromUid){
            var link = _.find(this.links, function(link){
                return link.to == toUid && link.from == fromUid;
            })

            if (link){
                return true;
            } else {
                return false;
            }
        },

        addLink: function (link) {
            if (!this.links) {
                this.links = [];
            }
            if (this.links.indexOf(link) != -1)
                return;
            link.uid = this.getNextUID("link");
            link.id = link.uid;
            this.links.push(link);
            var fromTask = this._tasksAndMilestonesByUid[link.from],
                toTask = this._tasksAndMilestonesByUid[link.to];
            fromTask._successors.push(toTask);
            toTask._predecessors.push(fromTask);
            $(document).trigger("predSuccChangeFromOtherView", [fromTask, toTask]);
            $(this).trigger("linkadd", [link]);
            return link;
        },

        generateLinksFromPredSuccIds: function(task){
            var me = this;
            _.each(task._predecessorsIds, function(predTaskid){
                        if (me._tasksAndMilestonesByUid[predTaskid] && !me.doesLinkExists( task.uid, predTaskid)){                          
                        me.addLink({ from: predTaskid, to: task.uid });
                    };
                });

                     _.each(task._successorsIds, function(succTaskId){
                        if (me._tasksAndMilestonesByUid[succTaskId] && !me.doesLinkExists( succTaskId, task.uid )){                        
                        me.addLink({ from: task.uid, to:  succTaskId});
                    };
                });
        },

        deleteInvalidLinksForTaskAdd: function(task) {
            var me = this;
            //Remove already existing links b/w 
            _.each(task._predecessorsIds, function(predTaskid) {
                _.each(task._successorsIds, function(succTaskId) {
                    if (me._tasksAndMilestonesByUid[predTaskid] &&
                        me._tasksAndMilestonesByUid[succTaskId] && 
                        me.doesLinkExists(succTaskId, predTaskid)) {
                        me.removeLink(predTaskid, succTaskId);
                    }
                });
            });
            var immediateSiblingsUid = this.getImmediateSiblingsUids(task);
            var prevTaskUid = immediateSiblingsUid.prevTaskUid;
            var nextTaskUid = immediateSiblingsUid.nextTaskUid;
            if ((prevTaskUid && nextTaskUid) &&
                me._tasksAndMilestonesByUid[immediateSiblingsUid.prevTaskUid] &&
                me._tasksAndMilestonesByUid[immediateSiblingsUid.nextTaskUid] &&
                me.doesLinkExists(nextTaskUid, prevTaskUid)) {
                me.removeLink(prevTaskUid, nextTaskUid);
            }
        },
        
    

        deleteMilestone: function (sender, milestoneUid) {
            this.removeAllLinksForTaskOrMilestone(milestoneUid);
            var ms = this._tasksAndMilestonesByUid[milestoneUid];
            this._milestones.splice(this._milestones.indexOf(ms), 1);
            delete this._tasksAndMilestonesByUid[milestoneUid];
            Ext.getCmp('CCSummarygrid').updateMilestoneSheet(ms, true);
            $(this).trigger("milestoneremove", [sender, ms]);
            if (ms.taskType == PE_SHORT) {
                this._projectEndMs = null;
                stl.app.CreateTaskToolBar.onPEAddDelete(false /*isAdd*/);
            }
            this.isIDCCed = false;
            stl.app.CreatePredSuccMap(this);
            sender.linksView.triggerRefresh();
        },

        updateMilestone: function (milestone, oldVal) {
            var uid = milestone.uid;
            var msModel;
            for (var i = this._milestones.length - 1; i >= 0; i--) {
                var ms = this._milestones[i];
                if (ms.uid === uid) {
                    if (oldVal == PE_SHORT && milestone.taskType != PE_SHORT)
                        this._projectEndMs = null;
                    ms.name = milestone.name;
                    ms.startDate = milestone.startDate;
                    ms.endDate = milestone.endDate;
                    ms.date1 = milestone.date1;
                    ms.bufferSize = milestone.bufferSize;
                    ms.taskType = !milestone.type ? milestone.taskType : milestone.type;
                    ms.status = milestone.status;
                    ms.percentBufferConsumption = milestone.percentBufferConsumption;
                    ms.percentChainComplete = milestone.percentChainComplete;
                    ms.milestoneColor = milestone.milestoneColor;
                    msModel = ms;
                    break;
                }
            }
            if (ms.taskType === PE_SHORT) {
                this._projectEndMs = this._tasksAndMilestonesByUid[uid];


            }
            if (this._projectEndMs)
                stl.app.CreateTaskToolBar.onPEAddDelete(true /*isAdd*/);
            else
                stl.app.CreateTaskToolBar.onPEAddDelete(false /*isAdd*/);

            var msRec = {
                'uid': msModel.uid,
                'name': msModel.name,
                'type': msModel.taskType,
                'taskType': msModel.taskType,
                'startDate': msModel.startDate,
                'endDate': msModel.endDate,
                'date1': msModel.date1,
                'bufferSize': msModel.bufferSize != null ? msModel.bufferSize : '',
                'isAutolinked': msModel.isAutolinked,
                'status': msModel.status,
                'percentBufferConsumption': msModel.percentBufferConsumption,
                'percentChainComplete': msModel.percentChainComplete,
                'milestoneColor': msModel.milestoneColor
            };
            Ext.getCmp('CCSummarygrid').updateMilestoneSheet(msRec);
            stl.app.CreatePredSuccMap(this);
            stl.app.triggerSave();

        },

        processMilestones: function () {
            this._projectEndMsUid = null;
            this._projectEndHiddenMsUid = null;
            for (var i = 0; i < this._milestones.length; i++) {
                var ms = this._milestones[i];
                this._tasksAndMilestonesByUid[ms.uid] = ms;
                if (ms.taskType === "PE") {
                    this._projectEndMsUid = ms.uid;
                    this._projectEndMs = ms;
                } else if (ms.taskType === "PEMS") {
                    this._projectEndHiddenMsUid = ms.uid;
                }
                if (!ms._successors) {
                    ms._successors = [];
                }
                if (!ms._predecessors) {
                    ms._predecessors = [];
                }
            }
        },

        getProjectRootScope: function () {
            return this.getScopeItemByName(this.name);
        },

        updateProjectRootScopeName: function (newName) {
            var rootScope = this.getScopeItemByName(this.name);
            rootScope.name = newName;

        },

        addNameToRows: function () {
            var me = this;
            me.rows = this.rows.sort(function (a, b) {
                return a.order - b.order;
            });

            var scopeItemNamed = [this.getProjectRootScope().uid];
            if (this.isProjectComplex()) {
                scopeItemNamed = [this.getProjectRootScope().uid]; //any row belonging to the project scope need not be named
            }
            me.rows = me.rows.map(function (row, index, rowArray) {
                if (($.inArray(row.scopeItemUid, scopeItemNamed) == -1)) {
                    if (me._scopeItemsByUid[row.scopeItemUid]) {
                        row.name = me._scopeItemsByUid[row.scopeItemUid].name;
                        scopeItemNamed.push(row.scopeItemUid);
                    }
                } else {
                    row.name = "";
                }
                return row;
            });
        },

        sortPhases: function () {
            var me = this;
            me.phases = this.phases.sort(function (a, b) {
                return a.order - b.order;
            });
        },

        getProjectEndMilestone: function () {
            return this._projectEndMs;
        },

        /**
        * Adds an already-registered resource to the project-specific resources collection.
        * If the resource is already present, will overwrite with the new resource data.
        */
        addProjectSpecificResource: function (resource) {
            if (!resource.calendarUid) {
                resource.calendarUid = this.getNextUID("calendar");
            }
            var localReference = this._resourcesByUid[resource.uid];
            if (localReference) {
                this.resources.splice(this.resources.indexOf(localReference), 1, resource);
            } else {
                this.resources.push(resource);
            }
            this._resourcesByUid[resource.uid] = resource;
            this.invalidateResources();
            return resource;
        },

        updateResourceBaseCalendars: function (calendarName) {
            var me = this;
            $.each(stl.app.ProjectDataFromServer.resources, function (idx, res) {
                res.BaseCalendarName = calendarName;
                Ext.getCmp('resGrid').updateResourceBaseCalendarsInResourceSheet(res, calendarName);
            });
        },

        /**
        * Used by the resource picker, resource sheet to allow insertion of a new resource
        */
        createResource: function (name, uid, maxUnits, isGlobal, calendarUid) {
            if (uid === null || typeof (uid) == "undefined") {
                isGlobal = false
            }
            else {
                isGlobal = true;
            }
            var newUid = this.ComputeNextNewResourceUniqueID(uid);
            var resource = {
                Name: name,
                id: newUid,
                uid: newUid,
                MaxUnits: maxUnits,
                isGlobal: isGlobal,
                calendarUid: calendarUid,
                BaseCalendarName: stl.app.ProjectDataFromServer.projectCalendarName
            };
            this.addProjectSpecificResource(resource);
            stl.app.resourceHighlightMenuIsCurrent = false;
            return resource;
        },
        /*
        * the first project specific resource will have a offset of 10000.
        */
        ComputeNextNewResourceUniqueID: function (uid) {
            var newUid = uid || stl.app.getNextResourceUid();
            if (this.IsProjectSpecificResourceExist() == false)
                newUid = parseInt(newUid) + 10000;
            stl.app.setNextAvailableResourceUid(parseInt(newUid) + 1);
            return newUid;
        },

        IsProjectSpecificResourceExist: function () {
            //Time_buffer is also a project specific resource
            var projectSpecficResource = _.find(this.getAvailableResources(),
                                             function (projectSpecficResource) {
                                                 return projectSpecficResource.Name.toLowerCase() != TIME_BUFFER_LOWERCASE && projectSpecficResource.isGlobal == false;
                                             })
            return !_.isUndefined(projectSpecficResource);
        },
        /**
        * Used by Resource Sheet to delete a project specific resource
        */
        deleteResource: function (name, uid, maxUnits, isGlobal, calendarUid, taskModel, taskElem) {
            var resource = {
                Name: name,
                id: uid,
                uid: uid,
                MaxUnits: maxUnits,
                isGlobal: isGlobal,
                calendarUid: calendarUid,
                TaskModel: taskModel,
                taskElem: taskElem
            };
            // FIXME
            if ($(".matrix-view").data("view")) {

                $(".matrix-view").data("view").invalidateResourceCache();
            }

            //deleting from project resources
            for (var i = 0; i < this.resources.length; i++) {
                var obj = this.resources[i];
                if (obj.uid == resource.uid) {
                    this.resources.splice(i, 1);
                    i--;
                }
            }
            //deleting from _resourcesByUid collection
            delete this._resourcesByUid[resource.uid.toString()];

            //deleting the resources from tasks
            var isResourceDeleted = false;
            var allTasks = stl.model.Project.getProject().getAllTasks();
            var updatedTasks = [];
            $.each(allTasks, function (index, taskModel) {
                var resources = taskModel.resources;
                for (var i = 0; i < resources.length; i++) {
                    var obj = resources[i];
                    if (obj.resourceId == resource.uid) {
                        resources.splice(i, 1);
                        i--;
                        isResourceDeleted = true;
                    }
                }

                if (stl.model.Project.getProject().isResourceDeletedFromSubtasks(taskModel.subtasks, resource.uid)) {
                    isResourceDeleted = true;
                }

                if (isResourceDeleted) {
                    isResourceDeleted = false;
                    updatedTasks.push(taskModel);
                }
            });

            $(document).trigger("updateResourcesDeleted", [this, updatedTasks]);
            this.invalidateResources();
            stl.app.resourceHighlightMenuIsCurrent = false;
        },

        isResourceDeletedFromSubtasks: function (subtasks, uid) {
            var isResDeletedFromSubtask = false;
            $.each(subtasks, function (index, taskModel) {

                var resources = taskModel.resources;
                for (var i = 0; i < resources.length; i++) {
                    var obj = resources[i];
                    if (obj.resourceId == uid) {
                        resources.splice(i, 1);
                        i--;
                        isResDeletedFromSubtask = true;
                    }

                }
            });

            return isResDeletedFromSubtask;
        },

        getAllPhaseNames: function () {
            var allPhaseNames = [];
            _.each(this.phases, function (phase, idx) {
                var virtualResource = { Name: phase.name };
                allPhaseNames.push(virtualResource);
            });

            return allPhaseNames;
        },

        isPhaseNameDuplicate: function (name, lastVal) {
            var allPhases = this.phases;
            var isDuplicate = false;
            $.each(allPhases, function (idx, value) {
                if (value.name.toLowerCase() != lastVal.toLowerCase()) {
                    if (value.name.toLowerCase() == name.toLowerCase()) {
                        isDuplicate = true;
                    }
                }
            });
            return isDuplicate;

        },

        isResourceNameDuplicate: function (name, uid) {
            var allAvailableResources = this.getAvailableResources();
            var isDuplicate = false;
            var isExistingResource = (uid != '' && uid != null);
            $.each(allAvailableResources, function (idx, value) {
                if (isExistingResource) {
                    if (value.Name.toLowerCase().trim() == name.toLowerCase().trim() && value.uid.toString() != uid.toString()) {
                        isDuplicate = true;
                    }
                } else {
                    if (value.Name.toLowerCase().trim() == name.toLowerCase().trim()) {
                        isDuplicate = true;
                    }
                }
            });
            return isDuplicate;

        },

        /*
        getPhaseWithSameNameIfExists:
        
            PhasesFromAllDivisions : contains all the phases that are in database. It contains global resources 
            from all divisions as well as the project specific phases presents in all projects.This collection 
            is populated from back-end during initial load and contains Name,IsGlobal,Divisions Information. 

            stl.model.Project.getProject().getAllPhaseNames() : this contains all project phases defined in the currently
            loaded project. It may contain global resources as well. 

        */
        getPhaseWithSameNameIfExists: function (resourceName) {

            var oPhaseWithSameName = null;

            oPhaseWithSameName = _.find(stl.app.PhasesFromAllDivisions, function(phase){ 
                        return phase.Name.toLowerCase().trim() == resourceName.toLowerCase().trim();
                    }
                );
            if(_.isUndefined(oPhaseWithSameName)){
                var divisionList = [];
                divisionList.push(stl.model.Project.getProject().division);

                var projectPhaseWithSame = _.find(stl.model.Project.getProject().getAllPhaseNames(), function(phase){
                    return phase.Name.toLowerCase().trim() == resourceName.toLowerCase().trim();
                });
                
                //If phase with same name is not present in PhasesFromAllDivisions and found in stl.model.Project.getProject().getAllPhaseNames()
                // that means the phase has to be a project phase. Hence setting IsGlobal to false.
                oPhaseWithSameName = _.isUndefined(projectPhaseWithSame) == false ? {
                                                                                        Name : projectPhaseWithSame.Name,
                                                                                        IsGlobal : false,
                                                                                        Divisions : divisionList
                                                                                     } 
                                                                                    :
                                                                                    null;             
            }
            return oPhaseWithSameName;
        },


        setDeletedCalendarNames: function (calName) {
            if (stl.app.ProjectDataFromServer.deletedCalendarNames) {
                if (stl.app.ProjectDataFromServer.deletedCalendarNames.indexOf(calName) == -1) {
                    stl.app.ProjectDataFromServer.deletedCalendarNames.push(calName);
                }
            } else {
                stl.app.ProjectDataFromServer.deletedCalendarNames = [];
                stl.app.ProjectDataFromServer.deletedCalendarNames.push(calName);
            }
        },

        getDeletedCalendarNames: function () {
            return stl.app.ProjectDataFromServer.deletedCalendarNames;
        },

        getInfoMsgForUpdateCalendarNamesForResources: function () {
            var deletedCalNames = this.getDeletedCalendarNames();
            if (deletedCalNames && deletedCalNames.length != 0) {
                var strDeletedCalNames = "";
                _.each(deletedCalNames, function (calName, idx, list) {
                    if (idx != list.length - 1) {
                        strDeletedCalNames = strDeletedCalNames + calName + ", ";
                    } else {
                        strDeletedCalNames = strDeletedCalNames + calName;
                    }
                });
                PPI_Notifier.info(getStringWithArgs(SELECTED_CALENDAR_DELETED, strDeletedCalNames, stl.app.ProjectDataFromServer.projectCalendarName));
            }
        },

        updateResourceSheet: function () {
            _.each(this.resources, function (value, idx, list) {
                Ext.getCmp('resGrid').updateResourceSheet(value, "0", null);
                if (Number(value.uid) >= Number(stl.app.getNextAvailableResourceUid())) {
                    stl.app.setNextAvailableResourceUid(Number(value.uid) + 1)
                }
            });
        },

        updateGlobalMaxUnitsOfGlobalResourcesAssignedToProject: function () {
            _.each(this.resources, function (res, idx) {
                if (res.isGlobal) {
                    var globalResource = _.find(stl.app.getGlobalResources(), function (globalRes) { return globalRes.uid == res.uid });
                    if (globalResource) {
                        res.GlobalMaxUnits = globalResource.MaxUnits;
                    }
                }

            })
        },
        /**
        * Return the combined list of global and project-specific resources available
        * for this project.  Returned list is alphabetical by resource name.
        */
        getAvailableResources: function () {
            if (!this._combinedResourceList || this._resourcesInvalidated) {
                var byUid = {},
                    combined = [];
                this._combinedResourceList = stl.app.getGlobalResources()
                    .concat(this.resources)
                // Reduction is necessary because local resource list has duplicates of the global resources
                // that are used in the project (not sure why--seems cleaner to only have local resources, but
                // that's the requirement from the server side)
                    .reduce(function (accum, resource) {
                        if (!byUid[resource.uid]) {
                            accum.push(resource);
                            byUid[resource.uid] = resource;
                        }
                        return accum;
                    }, []);
                this.renameProjectResourcesIfDuplicate();
                this.updateProjectSpecificGlobalResources();

                this._combinedResourceList.sort(function (a, b) {
                    return a.Name.localeCompare(b.Name);
                });
                this._combinedResourcesByUid = byUid;
                this._resourcesInvalidated = false;
            }
            return this._combinedResourceList;
        },
        /*
        * A global resource can get modiffied/deleted/re-created outside(Edit Global). These scenarios sometimes ends up 
        * creating resources with duplicate names while they are different in actual and one of them is always
        * global and the other is project specific. User may/will get  confused. To help user to identify the resources,
        * project specific resources will have _local appended.This method does that.
        */
        renameProjectResourcesIfDuplicate: function () {
            var resources = this._combinedResourceList;
            if (resources) {
                var processedResourcedArr = [];
                for (var index = 0; index < resources.length; index++) {
                    var duplicate = _.find(processedResourcedArr, function (currResource) {
                        return currResource.Name == resources[index].Name;
                    });
                    if (_.isUndefined(duplicate) == false) {
                        if (this.IsGlobalResource(resources[index]) == false)
                            resources[index].Name += '_local';

                        if (this.IsGlobalResource(duplicate) == false)
                            duplicate.Name += '_local';
                    }
                    processedResourcedArr.push(resources[index]);
                }
            }
        },

        IsGlobalResource: function (resource) {
            var globalList = stl.app.getGlobalResources();
            var refGlobal = _.find(globalList, function (gResource) {
                return gResource.uid == resource.uid;
            });
            var isGlobal = true;
            if (_.isUndefined(refGlobal))
                isGlobal = false;
            resource.isGlobal = isGlobal;
            return isGlobal;
        },
        /*
        * Global resource's name can get modified through edit global link.This method will
        * propagate such changes to project's resoure collection.
        */
        updateProjectSpecificGlobalResources: function () {
            var globalList = stl.app.getGlobalResources();
            for (var index = 0; index < this.resources.length; index++) {
                var resource = this.resources[index];
                var refGlobal = _.find(globalList, function (gResource) {
                    return gResource.uid == resource.uid;
                });
                if (!_.isUndefined(refGlobal)) {
                    resource.Name = refGlobal.Name;
                    resource.isGlobal = true;
                }
                else
                    resource.isGlobal = false;
            }
        },

        updateBaseCalendarForGlobalResources: function () {
            var globalList = stl.app.getGlobalResources();
            _.each(globalList, function (res, idx) {
                res.BaseCalendarName = stl.app.ProjectDataFromServer.projectCalendarName;
            });
        },

        updateBaseCalendarForTimeBufferResource: function () {
            var timeBuffer = _.find(this.resources, function (res) {//.toLowerCase() == TIME_BUFFER_LOWERCASE
                return res.Name.toLowerCase() == TIME_BUFFER_LOWERCASE;
            });

            if (timeBuffer) {
                timeBuffer.BaseCalendarName = stl.app.ProjectDataFromServer.projectCalendarName;
                Ext.getCmp('resGrid').updateResourceBaseCalendarForTimeBufferInResourceSheet(timeBuffer);
            }
        },

        getAvailableResourcesByUid: function () {
            if (!this._combinedResourcesByUid || this._resourcesInvalidated) {
                this.getAvailableResources();
            }
            return this._combinedResourcesByUid;
        },

        getResourceByUid: function (resourceUid) {
            return this.getAvailableResourcesByUid()[resourceUid];
        },

        getTaskOrMilestoneUidById: function (Id) {

            var taskOrMilestoneUid;
            var tasksAndMilestone = this.getAllTasks();

            $.each(tasksAndMilestone, function (index, currentTaskOrMilestone) {

                if (Id == currentTaskOrMilestone.id) {
                    taskOrMilestoneUid = currentTaskOrMilestone.uid;
                    return false;
                }
            });

            return taskOrMilestoneUid;
        },

        getTaskOrMilestoneByUid: function (uid) {

            var taskOrMilestone;
            var tasksAndMilestone = this.getAllTasks();

            $.each(tasksAndMilestone, function (index, currentTaskOrMilestone) {

                if (uid == currentTaskOrMilestone.uid) {
                    taskOrMilestone = currentTaskOrMilestone;
                    return false;
                }
            });

            return taskOrMilestone;
        },
        getTaskOrMilestoneIdByUid: function (uid) {
            var taskOrMilestoneId;
            var tasksAndMilestone = this.getAllTasks();

            $.each(tasksAndMilestone, function (index, currentTaskOrMilestone) {

                if (uid == currentTaskOrMilestone.uid) {
                    taskOrMilestoneId = currentTaskOrMilestone.id;
                    return false;
                }
            });

            return taskOrMilestoneId;
        },
        /**
        * Handles an assignment change of resources to task or subtask.  Expects the
        * resources parameter to be an array of resource objects, each coming either
        * from the global resource list or the project-specific list.
        */
        onResourcesAssigned: function (resources) {
            // If the resource isn't already in the local collection, copy it in
            var me = this;
            resources.forEach(function (assignedResource) {
                var localReference = me._resourcesByUid[assignedResource.uid];
                if (!localReference) {
                    localReference = me.addProjectSpecificResource(assignedResource);
                }
                // MaxUnits should be at least the total units assigned in this project
                // MM: removed the code to set max unit equal to sum of assigned units since that is not correct.
                // Max unit s/ only change from edit global resource/resource panel
            });
        },

        invalidateResources: function () {
            this._resourcesInvalidated = true;
            $(this).trigger("resourceschanged");
        },

        getTotalUnitsAssignedForResource: function (resourceId) {
            var me = this,
                sum = 0,
                sumResourceUnits = function (taskOrSubtask) {
                    taskOrSubtask.resources.forEach(function (assignment) {
                        if (assignment.resourceId === resourceId) {
                            sum += Number(assignment.units);
                        }
                    });
                };
            this.rows.forEach(function (row) {
                Object.keys(row.tasks).forEach(function (phaseId) {
                    row.tasks[phaseId].forEach(function (task) {
                        sumResourceUnits(task);
                        task.subtasks.forEach(sumResourceUnits);
                    });
                });
            });
            return sum;
        },

        /**
        * Create a new row for the given scope item.  If no scope item UID is provided,
        * a new scope item is created and added to the project's scopeItems collection.
        * In that case, the newScopeItemName parameter should be provided.
        */
        createRow: function (scopeItemUid, newScopeItemName, outlineLevel) {
            var rowUid = this.getNextUID("row");

            var scopeItem; //
            if (!scopeItemUid) {
                scopeItem = this.createScope(newScopeItemName);
                scopeItemUid = scopeItem.uid;
            }
            else
                scopeItem = {
                    id: scopeItemUid,
                    uid: scopeItemUid,
                    name: newScopeItemName || ""
                }

            return $.extend({}, stl.model.Project.defaultRowModel, {
                id: rowUid,
                uid: rowUid,
                scopeItemUid: scopeItemUid,
                name: newScopeItemName,
                outlineLevel: stl.app.ProjectDataFromServer.isProjectComplex() ? outlineLevel : -1,
                scopeItemName: newScopeItemName,
                scopeItem: scopeItem,
                isExpanded: true
            });
        },

        createScope: function (newScopeItemName) {
            scopeItemUid = this.getNextUID("scopeItem");
            var newScopeItem = {
                id: this.scopeItems.length + 1,
                uid: scopeItemUid,
                name: newScopeItemName || ""
            };
            this.scopeItems.push(newScopeItem);
            this._scopeItemsByUid[scopeItemUid] = newScopeItem;
            this.createPhaseScopeAndTaskCountMap();
            return newScopeItem;
        },

        getScopeItemByUid: function (scopeItemUid) {
            return this._scopeItemsByUid[scopeItemUid];
        },

        getScopeUidForRowId: function (rowId) {
            return _.findWhere(this.rows, { uid: rowId }).scopeItemUid;
        },

        getScopeItemByName: function (scopeItemName) {
            var scopeItem = null;
            if (scopeItemName || scopeItemName == "") {
                this.scopeItems.forEach(function (scope) {
                    if (scope.name === scopeItemName)
                        scopeItem = scope;
                });
            }
            return scopeItem;
        },

        deleteScopeItemByName: function (scopeItemName) {
            var removedScope = null;
            for (var i = 0; i < this.scopeItems.length; i++) {
                if (this.scopeItems[i].name === scopeItemName) {
                    removedScope = this.scopeItems.splice(i, 1);
                    delete this._scopeItemsByUid[removedScope[0].uid];
                    break;
                }
            }
            return removedScope;
        },

        deleteScopeItemByUid: function (scopeItemUid) {
            var removedScope = null;
            for (var i = 0; i < this.scopeItems.length; i++) {
                if (this.scopeItems[i].uid === scopeItemUid) {
                    removedScope = this.scopeItems.splice(i, 1);
                    delete this._scopeItemsByUid[removedScope[0].uid];
                    break;
                }
            }
            return removedScope;
        },

        deleteSummaryTaskFromRowModel: function (rowModel) {
            var dataObj = {};
            var rowUid = rowModel.uid;
            var tasksByPhase = {};
            var summaryTask = [];
            var isSummaryTaskFound = false;

            _.each(rowModel.tasks, function (tasksInPhase, index, list) {

                var phaseID = index;

                if (!isSummaryTaskFound) {
                    summaryTask = _.filter(tasksInPhase, function (task) { return task.isSummary == true; });
                    if (summaryTask)
                        isSummaryTaskFound = true;
                }

                tasksByPhase[phaseID] = _.filter(tasksInPhase, function (task) {
                    if (!task.isSummary)
                        return true;
                    /*return task.isSummary == false;*/
                });

            });
            rowModel.tasks = tasksByPhase;

            dataObj.rowModel = rowModel;

            //there will be only one summary task in each row.
            if (summaryTask.length > 0) {
                //var matrixView = $(".matrix-view").data("view");
                delete me._tasksAndMilestonesByUid[summaryTask[0].uid];
                dataObj.summaryTask = summaryTask[0];
            }

            return dataObj;
        },

        getSummaryTaskFromRow: function (rowmodel) {
            var tasksInRow = this.flattenTasksForRow(rowmodel);

            var summaryTask = _.find(tasksInRow, function (task) {
                return task.isSummary;
            });

            return summaryTask;
        },

        renameScopeItem: function (scopeItemUid, newScopeItemName) {
            var renamedScopeUid = 0;
            this.scopeItems = this.scopeItems.map(function (item) {
                if (item.uid === scopeItemUid) {
                    item.name == newScopeItemName;
                    renamedScopeUid = item.uid;
                }
                return item;
            });
            this._scopeItemsByUid[renamedScopeUid].name = newScopeItemName;
            this.resetTaskCountInPhaseScopeMap(false/*isPhase*/, renamedScopeUid);
            return this._scopeItemsByUid[renamedScopeUid];
        },

        /**
        * Returns a map that assigns color numbers (1..n) to resource IDs, in alphabetical order by resource name
        * Used to get color codes for resource highlighting
        */
        getResourceColorMap: function () {
            if (!this._resourceColorMap || !stl.app.resourceHighlightMenuIsCurrent ) {
                var i = 1;
                this._resourceColorMap = {};
                this.getAvailableResources().forEach(function (resource) {
                    this._resourceColorMap[resource.uid] = i++;
                    if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_RESOURCES + 1))
                        i = 1;
                } .bind(this));
            }
            return this._resourceColorMap;
        },
        /**
        * Returns a map that assigns color numbers (1..n) to phase IDs, in alphabetical order by phase name
        * Used to get color codes for phase highlighting
        */
        getPhaseColorMap: function () {
            if (!this._phaseColorMap || !stl.app.phaseHighlightMenuIsCurrent) {
                var i = 1;
                this._phaseColorMap = {};
                this.phases.forEach(function (phase) {
                    if (phase.type == 'normal') {
                        if (!this._phaseColorMap[phase.name]) {
                            this._phaseColorMap[phase.name] = i++;
                            if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_PHASES + 1))
                                i = 1;
                        }
                    }
                } .bind(this));
            }
            return this._phaseColorMap;
        },
        /**
        * Returns a map that assigns color numbers (1..n) to task Manager IDs, in alphabetical order by task manager name
        * Used to get color codes for task manager highlighting
        */
        getTaskManagerColorMap: function () {
            if (!this._taskManagerColorMap) {
                var i = 1;
                this._taskManagerColorMap = {};
                DataStore.availablePeopleAndTeams.forEach(function (manager) {
                    this._taskManagerColorMap[manager.Name] = i++;
                    if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_TASK_MANAGERS + 1))
                        i = 1;
                } .bind(this));
            }
            return this._taskManagerColorMap;
        },
        resetChainsColorMap:function(){
            if(this._isMapModified)
                this._chainsColorMap = null;
        },

        getChainsColorMap: function () {
            if (!this._chainsColorMap) {
                var colorId = 0;
                this._chainsColorMap = {};
                this.getAllChainIds().forEach(function (chainId) {
                    colorId = chainId;
                    if (chainId > MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_CHAINS)
                        colorId = chainId - MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_CHAINS;
                    this._chainsColorMap[chainId] = {
                        colorId:colorId,
                        isChecked:false
                    };
                } .bind(this));
            }
            return this._chainsColorMap;
        },
        updateChainsColorMap:function(chainId, isChecked){
            var map = this.getChainsColorMap();
            if(map[chainId].isChecked != isChecked){
                map[chainId].isChecked = isChecked;
                this._isMapModified = true;
            }
        },
        removeIPMS: function(tasks){
            var IPMStasks = $.grep(tasks, function (task) {
                if(task.taskType === IPMS_SHORT)  {
                    return task;
                }
                
            });

            for (i=0; i< IPMStasks.length; i++){
                stl.app.matrixView.isIPMSRemoved = true;
                this.autoLinkMissingLinks(IPMStasks[i]);
                this.removeBufferLinksFromModel(IPMStasks[i].uid);
                $(this).trigger("milestoneremove",[null, IPMStasks[i]]);
            }

            
        },

        removePEMS: function(tasks){
            var PEMStasks = $.grep(tasks, function (task) {
                if(task.taskType === PEMS_SHORT)  {
                    return task;
                }
                
            });

            for (i=0; i< PEMStasks.length; i++){
                stl.app.matrixView.isPEMSRemoved = true;
                this.autoLinkMissingLinks(PEMStasks[i]);
                this.removeBufferLinksFromModel(PEMStasks[i].uid);
                
                $(this).trigger("milestoneremove",[null, PEMStasks[i]]);
            }

            
        },

        removeBufferTasks: function (allCopiedTasksAndMilestones, isCallFromDebufferedPlan) {
            //getAllTasks in the project
            var isRemoveBuffersForPaste = allCopiedTasksAndMilestones ? true : false;
            var tasks = isRemoveBuffersForPaste ? allCopiedTasksAndMilestones : this.getAllTasks();
            var me = this;
            // On removing buffers, set the projected dates for milestone to null.
            // It will be caluculated again on IDCC/RedoCC.
            for (var i = 0; i < tasks.length; i++) {
                var taskOrMs = tasks[i];
                if (taskOrMs.taskType == CMS_SHORT || taskOrMs.taskType == IMS_SHORT || taskOrMs.taskType == PE_SHORT) {
                    if (!isCallFromDebufferedPlan){
                        taskOrMs.projectedDate = null;
                    }
                    
                }
            }
            var buffTasks = $.grep(tasks, function (task) {
                //CON-3072
                //CMG Issue: Replan mode should remove only FB on remove buffers
                if(task.taskType === "buffer")  {
                    if (isRemoveBuffersForPaste){
                        return task;
                    }
                    if(me.isIDCCed && (stl.app.isViewDebuffered)) {
                        return task;
                    }
                    if(me.isIDCCed && me.ProjectPlanningMode === PLAN ) {
                        return task;
                    }
                    else if ( me.ProjectPlanningMode === REPLAN  && task.bufferType ==="CCFB"){
                        return task; 
                    }
                }
                
            });
            if (buffTasks.length > 0) {
                if (stl.app.matrixView){
                    stl.app.matrixView.isBufferTaskRemovedWhileCopy = true;
                }
                
                for (var j = 0; j < buffTasks.length; j++) {
                    var scope = $.grep(this.rows, function (e) { if (e.uid == buffTasks[j].rowId) return e; });
                    if (scope.length > 0) {
                        tasks = scope[0].tasks[parseInt(buffTasks[j].phaseId)];
                        tasks.splice(tasks.indexOf(buffTasks[j]), 1);
                        this.autoLinkMissingLinks(buffTasks[j]);
                        this.removeBufferLinksFromModel(buffTasks[j].uid);
                        var task = buffTasks[j];
                        $(document).trigger("removeBufferTaskLinks", [buffTasks[j].uid]);
                        if (isRemoveBuffersForPaste){

                            $(document).trigger("taskremove",[null, task, task.rowId, task.phaseId, null]);
                        }
                    }
                }
            }
            if (!allCopiedTasksAndMilestones){
                stl.app.ProjectDataFromServer.isBufferTasksExist = false;
                this.isIDCCed = false;
            }
            
        },

        removeBufferLinksFromModel: function (bufferTaskUid) {
            var links = this.links;
            // this.linksView.removeConnectionsForElement($targetEl);
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === bufferTaskUid || link.to === bufferTaskUid) {
                    // Project will fire an event on link removal and we'll remove locally in onLinkRemove
                    this.removeLink(link.from, link.to);
                }
            }
        },

        autoLinkMissingLinks: function (bufferTask) {
            if (bufferTask._predecessors.length > 0 && bufferTask._successors.length > 0) {
                for(var i = 0; i < bufferTask._predecessors.length; i ++){
                    stl.app.addLink(bufferTask._predecessors[i].uid, bufferTask._successors[0].uid);
                }
            }
        },



        /**
        * Update the _predecessors and _successors collections on each task/milestone to reflect link structure
        */
        updateLinkDAG: function () {
            var tasksAndMilestones = this.getAllTasks();
            for (var i = 0; i < tasksAndMilestones.length; i++) {
                var taskOrMs = tasksAndMilestones[i];
                this._tasksAndMilestonesByUid[taskOrMs.uid] = taskOrMs;
                taskOrMs._predecessors = [];
                taskOrMs._successors = [];
            }
            for (var i = 0; i < this.links.length; i++) {
                var link = this.links[i],
                    fromTask = this._tasksAndMilestonesByUid[link.from],
                    toTask = this._tasksAndMilestonesByUid[link.to];
                toTask._predecessors.push(fromTask);
                fromTask._successors.push(toTask);
            }
        },

        ValidateAllTasksHaveSuccessors: function (responseObj) {
            var tasks = this.getAllTasks();
            var invalidTasks = [];
            var isError = false;
            var error = {};
            error.Code = ERR_CODE;
            error.Description = ERR_TASKS_WITH_NO_SUCCESSORS;
            error.Type = ERR_GEN;
            error.itemIds = [];
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                if (!task.isSummary) {
                    if (multipleORs(task.taskType, TASKTYPE_FULLKIT, TASKTYPE_BUFFER, TASKTYPE_SNET, TASKTYPE_PT, STRING_NORMAL)) {
                        if (task._successors.length <= 0) {
                            error.Description = error.Description + " " + task.id.toString() + ", ";
                            var itemId = {};
                            itemId.Id = task.id.toString();
                            error.itemIds.push(itemId);
                        }
                    }
                }
            }
            if (error.itemIds.length > 0) {
                isError = true;
                responseObj.Errors.push(error);
            }

            return isError;
        },

        ResourceAssignmentValidation: function (responseObj) {
            var me = this;
            var rows = this.rows;
            var isError = false;
            var error = {};
            error.Code = ERR_CODE;
            error.Description = ERR_MSG_RESOURCE_ASSIGNMENT_VALIDATION;
            error.Type = ERR_GEN;
            error.itemIds = [];
            var allTasks = this.getAllTasks();

            $.each(allTasks, function (index, taskModel) {

                if (me.IsResourceValidationRequired(taskModel)) {
                    var resources = taskModel.resources;
                    if (resources.length == 0) {
                        error.Description = error.Description + " " + taskModel.id.toString() + ", ";
                        var itemId = {};
                        itemId.Id = taskModel.id.toString();
                        error.itemIds.push(itemId);
                        isError = true;
                    }
                }
            });

            if (error.Description) {
                var replacement = '.';
                error.Description = error.Description.replace(REMOVE_TRAILING_COMMASPACE, replacement);
            }

            if (error.itemIds.length > 0) {
                isError = true;
                responseObj.Errors.push(error);
            }
            return isError;

        },

        IsResourceValidationRequired: function (taskModel) {
            var isValidationRequired = false;
            if (!taskModel.isSummary && taskModel.taskType != FULL_KIT && (!taskModel.isMS) && taskModel.duration > 0) {
                isValidationRequired = true;
            }
            return isValidationRequired;
        },

        /**
        * Determine whether a given "object" (task, milestone) with objectUid
        * has a predecessor (via any chain of links) with the given predecessorUid
        */
        objectHasPredecessor: function (objectUid, predecessorUid) {

            var found = false,
                targetObjects = [this._tasksAndMilestonesByUid[objectUid]];
            while (!found && targetObjects.length > 0) {
                // Merge all predecessors of the current set of targetObjects
                // (they will become the targetObjects for the next iteration)
                targetObjects = [].concat.apply([], targetObjects.map(function (targetObject) {
                    return targetObject._predecessors;
                }));
                found = targetObjects.some(function (obj) {
                    return obj.uid === predecessorUid;
                });
            }
            return found;
        },

        isRedundantLinkPresent: function (toTaskID, fromTaskID) {

            var found = false,
                targetObjects = [this._tasksAndMilestonesByUid[fromTaskID]];
            while (!found && targetObjects.length > 0) {
                // Merge all predecessors of the current set of targetObjects
                // (they will become the targetObjects for the next iteration)
                targetObjects = [].concat.apply([], targetObjects.map(function (targetObject) {
                    return targetObject._successors;
                }));
                found = targetObjects.some(function (obj) {
                    return obj.uid === toTaskID;
                });
            }
            return found;
        },

        removeLink: function (fromUid, toUid) {
            for (var i = this.links.length - 1; i >= 0; i--) {
                var link = this.links[i];
                if (link.from === fromUid && link.to === toUid) {
                    this.links.splice(i, 1);
                    var fromTask = this._tasksAndMilestonesByUid[link.from],
                        toTask = this._tasksAndMilestonesByUid[link.to];
                        fromTask._successors.splice(fromTask._successors.indexOf(toTask), 1);
                        toTask._predecessors.splice(toTask._predecessors.indexOf(fromTask), 1);
                        $(document).trigger("predSuccChangeFromOtherView", [fromTask, toTask]);
                    
                    //update the flexible links allowed based on % model flexibility allowed from the config
                    if (fromTask.rowId != toTask.rowId) {
                        var phase = $.grep(this.phases, function (phase) { return phase.uid == fromTask.phaseId; })[0];
                        if (phase.maxFlexAllowed) {
                            if (phase.usedFlexibleLinks > 0)
                                phase.usedFlexibleLinks--;
                        }
                    }
                    $(this).trigger("linkremove", [link]);
                }
            }
        },

        removeAllLinksForTaskOrMilestone: function (taskOrMilestoneUid) {
            for (var i = this.links.length - 1; i >= 0; i--) {
                var link = this.links[i];
                if (link.from === taskOrMilestoneUid || link.to === taskOrMilestoneUid) {
                    this.removeLink(link.from, link.to);
                }
            }
        },

        /**
        * Get the list of constraining successor chain UIds string list by using
        * text5
        * INPUT : selected task UID
        */
        getConstrainingTasks: function (selTaskUid) {
            var selTask = this._tasksAndMilestonesByUid[selTaskUid];
            //create taskUId array
            var constrainingTaskIds = [];
            constrainingTaskIds.push(selTaskUid);
            var constraintUId = parseInt(selTask.text5);
            if (constraintUId > 0) {
                this.getConstrainingTaskRecursive(constraintUId, constrainingTaskIds);
            }

            return constrainingTaskIds;
        },


        getConstrainingTaskRecursive: function (taskUId, constrainingTaskIds) {
            var task = this._tasksAndMilestonesByUid[taskUId];
            //add to the taskUId array
            constrainingTaskIds.push(taskUId);
            if (task.isCritical == false) {
                var constraintUId = parseInt(task.text5);
                if (constraintUId > 0 && task.uid != constraintUId) {
                    this.getConstrainingTaskRecursive(task.text5, constrainingTaskIds);
                }
            }
        },

        getAllChainIds: function () {
            var chainIds = [];
            for (var i = 0; i <= BufferSummaryStore.length - 1; i++) {
                var buffer = BufferSummaryStore[i];
                for (var idx = 0; idx <= buffer.Chains.length - 1; idx++) {
                    chainIds.push(buffer.Chains[idx].ChainNumber);
                }
            }
            return chainIds;
        },
        getChainIdsForMilestone:function(msuid){
            var chainIds = [];
            for (var i = 0; i <= BufferSummaryStore.length - 1; i++) {
                var buffer = BufferSummaryStore[i];
                if(buffer.MilestoneUID == msuid){
                    for (var idx = 0; idx <= buffer.Chains.length - 1; idx++) {
                        chainIds.push(buffer.Chains[idx].ChainNumber);
                    }
                }
            }
            return chainIds;
        },        getPenChainID: function (milestoneUId) {
            if(!milestoneUId){
                milestoneUId = this.getProjectEndMilestone().uid;
            }
            var buffer = _.find(BufferSummaryStore, function (buffer) { return buffer.MilestoneUID == milestoneUId; });
            if (buffer){
                if(buffer.PenetratingChains != null && buffer.PenetratingChains.length > 0){
                    return buffer.PenetratingChains.split(",");
                }
                else{
                    var sortedChainsByID = _.sortBy(buffer.Chains, 'ChainNumber');
                    if (sortedChainsByID && sortedChainsByID.length > 0)
                        return [sortedChainsByID[0].ChainNumber];
                    else
                        return -1;
                }
            }
        },

        getTaskIdsAndMilestoneUIdForChainNumber: function (ChainNo) {
            var taskIds = [];
            var chainNotFound = true;
            var milestoneUid = -1;
            for (var i = 0; i <= BufferSummaryStore.length - 1 && chainNotFound; i++) {
                var buffer = BufferSummaryStore[i];
                for (var idx = 0; idx <= buffer.Chains.length - 1; idx++) {
                    if (buffer.Chains[idx].ChainNumber == ChainNo) {
                        taskIds = buffer.Chains[idx].Tasks.split(",");
                        chainNotFound = false;
                        milestoneUid = buffer.MilestoneUID;
                        break;
                    }
                }
            }
            return {
                taskIds: taskIds,
                milestoneUID: milestoneUid
            };
        },
        getTaskObjectsFromTaskIds:function(taskIds){
            var taskObj=[];
            for(var i=0; i<taskIds.length; i++){
                taskObj.push(this.getTaskOrMilestoneByUid(taskIds[i]));
            }
            return taskObj;
        },

        getChecklistStatus: function (statusCode) {
            try {
                switch (statusCode) {
                    case 0:
                        return "none";
                    case 1:
                        return "incomplete";
                    case 2:
                        return "complete";
                }
            }

            catch (e) {
                throw "Checklist status code not recognized: " + statusCode;
            }
        },

        getRowById: function (rowId) {
            // TODO optimize
            for (var i = 0; i < this.rows.length; i++) {
                var row = this.rows[i];
                if (row.uid == rowId) {
                    return row;
                }
            }
            return null;
        },

        getPhaseById: function (phaseId) {
            // TODO optimize
            for (var i = 0; i < this.phases.length; i++) {
                var phase = this.phases[i];
                if (phase.uid == phaseId) {
                    return phase;
                }
            }
            return null;
        },

        getPhaseByOrder: function (phaseOrder) {
            // TODO optimize
            for (var i = 0; i < this.phases.length; i++) {
                var phase = this.phases[i];
                if (phase.order == phaseOrder) {
                    return phase;
                }
            }
            return null;
        },

        extractCalendarInfoFromCalendarData: function (calendar) {
            var calendarExtract = {
                projectCalendarName: "",
                defaultStartTime: null,
                defaultFinishTime: null,
                defaultHrsPerDay: HOURS_PER_DAY,
                defaultDaysPerWeek: 0
            }
            calendarExtract.projectCalendarName = calendar.CalendarName;
            var weekDaysArray = calendar.WeekDays;
            var dates = [];
            for (var i = 0; i < weekDaysArray.length; i++) {
                var weekDay = weekDaysArray[i];
                if (weekDay.IsWorking) {
                    if (weekDay.Shifts.length >= 1)
                    {
                        calendarExtract.defaultStartTime = weekDay.Shifts[0].FromTime;
                        calendarExtract.defaultFinishTime = weekDay.Shifts[0].ToTime; 
                    }
                    for (var j=1; j<weekDay.Shifts.length; j++)
                    {
                        // Assign max time value(last shift end time) to default finish time.
                        calendarExtract.defaultFinishTime = new Date(calendarExtract.defaultFinishTime) > new Date(weekDay.Shifts[j].ToTime) ? calendarExtract.defaultFinishTime : weekDay.Shifts[j].ToTime;
                    }
                    break;
                }
            }

            calendarExtract.defaultHrsPerDay = Math.ceil(calendar.DefaultWorkingSecsPerDay / SECS_PER_HR);
            calendarExtract.defaultDaysPerWeek = this.getNumWorkingWeekDays(weekDaysArray);

            return calendarExtract;
        },

        getNumWorkingWeekDays: function (weekDaysArray) {
            var numWorkingDays = 0,
            workingWeekDaysArray = _.filter(weekDaysArray, function (weekDay) {
                return weekDay.IsWorking == true;
            });
            if (false == _.isUndefined(workingWeekDaysArray)) {
                numWorkingDays = _.size(workingWeekDaysArray);
            }
            return numWorkingDays;
        },

        /* init project default finsih time, start time and hrs per day*/
        initializeCalendarData: function () {
            var calendarData = this.extractCalendarInfoFromCalendarData(stl.app.calendar);

            this.projectCalendarName = calendarData.projectCalendarName;
            this.defaultStartTime = calendarData.defaultStartTime;
            this.defaultFinishTime = calendarData.defaultFinishTime;
            this.defaultHrsPerDay = calendarData.defaultHrsPerDay;
            this.defaultDaysPerWeek = calendarData.defaultDaysPerWeek;

            HOURS_PER_DAY = this.defaultHrsPerDay;
            TASK_DURATION_DEFAULT_SEC = 10 * HOURS_PER_DAY * 60 * 60;
            SUBTASK_DURATION_DEFAULT_SEC = 1 * HOURS_PER_DAY * 60 * 60;
            ONE_DAY_DURATION_DEFAULT_SEC = 1 * HOURS_PER_DAY * 60 * 60;

            //set task/subtask default duration
            stl.model.Task.setTaskDefaultDuration(TASK_DURATION_DEFAULT_SEC);
            stl.model.Subtask.setTaskDefaultDuration(SUBTASK_DURATION_DEFAULT_SEC);


            //change hrs per day in juration
            juration.setHoursPerDay(this.defaultHrsPerDay);
        },

        getTaskStatusColorFromHexValue: function (hexColor) {
            if (!hexColor)
                return "";
            switch (hexColor.replace("#", "").trim().toUpperCase()) {
                case "008000":
                case "GREEN":
                    return "task-status-dark-green";
                case "FFFF00":
                case "YELLOW":
                    return "task-status-dark-yellow";
                case "FF0000":
                case "RED":
                    return "task-status-dark-red";
                case "80FF80":
                case "00FF00":
                    return "task-status-light-green";
                case "FFFF80":
                case "FFFF7F":
                    return "task-status-light-yellow";
                case "FF8080":
                    return "task-status-light-red";
                case "FFFFFF":
                case "WHITE":
                    return "task-status-white";
                default:
                    return "";
            }
        },

        destroy: function () {
            var tasks = this._tasksAndMilestonesByUid;
            stl.app.deletePropertiesOfObjectCollection(tasks);
            delete this._tasksAndMilestonesByUid;

            var scopeItems = this._scopeItemsByUid;
            stl.app.deletePropertiesOfObjectCollection(scopeItems);
            delete this._scopeItemsByUid;

            var links = this.links;
            stl.app.deletePropertiesOfObjectCollection(links);
            delete this.links;

            var subtaskLinks = this.subtaskLinks;
            stl.app.deletePropertiesOfObjectCollection(subtaskLinks);
            delete this.subtaskLinks;

            for (var property in stl.model.Project.project) {
                if (stl.model.Project.project.hasOwnProperty(property)) {
                    delete stl.model.Project.project[property];
                }
            }
        },

        isThisTaskBuffer: function (taskModel) {
            var isBuffer = true;
            if (taskModel.taskType !== TASKTYPE_BUFFER)
                isBuffer = false;
            return isBuffer;

        },

        validatePEandPPTypeConversion: function (ms, conversionType) {
            var canBeConverted = true;
            if (conversionType === PE_SHORT) {
                //check if a PE already exists, if it is alert error message
                if (this.getProjectEndMilestone()) {
                    PPI_Notifier.info(PE_ALREADY_EXISTS);
                    canBeConverted = false;
                }
            } else if (conversionType === PP_SHORT || conversionType === STRING_NONE_UPPER_CASE) {
                var phaseModel = this.getPhaseById(ms.phaseId);
                if (phaseModel.type === STRING_NORMAL) {
                    PPI_Notifier.info(PINCH_POINT_CREATE_INFO);
                    canBeConverted = false;
                }
            }

            return canBeConverted;


        },

        isProjectComplex: function () {
            this.IsComplexMode = false;
            if (stl.app.isComplexProjectEnabled == "1") {
                this.IsComplexMode = true;
            } else {
                this.IsComplexMode = false;
            }

            return this.IsComplexMode;
        },
        changeStatusForIPMSOrPEMS: function (milestone) {
            var pemsOrIpmsTask;
            switch (milestone.taskType) {
                case PE_SHORT:
                    pemsOrIpmsTask = this.getPEMS();
                    break;
                case CMS_SHORT:
                    pemsOrIpmsTask = this.getIPMSForCMS(milestone);
                    break;

            }
            if (pemsOrIpmsTask) {
                this.updateFieldsForCOStatus(pemsOrIpmsTask, milestone)
            }
        },
        updateFieldsForCOStatus: function (ms, milestone) {

            ms.status = milestone.status;
            ms.actualStartDate = ServerClientDateClass.getTodaysDate();
            ms.startDate = ServerClientDateClass.getTodaysDate();
            ms.actualFinishDate = ServerClientDateClass.getTodaysDate();
            ms.endDate = ServerClientDateClass.getTodaysDate();
            ms.percentComplete = 100;
            ms.remainingDuration = 0;
            this.updateMilestone(ms);

        },
        getIPMSForCMS: function (cms) {

            var ipmsTask;
            var predTask = _.find(cms._predecessors, function (predecessorItem) {
                return (predecessorItem.taskType === IPMS_SHORT || predecessorItem.taskType === TASKTYPE_BUFFER);
            });
            if (predTask && predTask.taskType === IPMS_SHORT)
                ipmsTask = predTask;
            else if (predTask && predTask.bufferType === BUFFER_TYPE_CMSB) {
                ipmsTask = _.find(predTask._predecessors, function (predecessorItem) {
                    return (predecessorItem.taskType === IPMS_SHORT);
                });
            }

            return ipmsTask;

        },

        getBufferTaskForMS: function (ms) {

            var bufferTask;
            var predTask = _.find(ms._predecessors, function (predecessorItem) {
                return (predecessorItem.taskType === TASKTYPE_BUFFER);
            });
            if (predTask && (predTask.bufferType === BUFFER_TYPE_CMSB || predTask.bufferType === BUFFER_TYPE_CCCB)) {
                bufferTask = predTask;
            }

            return bufferTask;

        },

        getPEMS: function () {
            var pemsTask = _.find(this._milestones, function (milestone) {
                return (milestone.taskType === PEMS_SHORT);
            });
            return pemsTask;
        },

        checkIfZeroDurationTask: function (taskModel) {
            var isZeroDurationTask = false;
            if ((taskModel.taskType === STRING_NORMAL || taskModel.taskType === IMS_SHORT)&& parseInt(taskModel.duration) === 0)
                isZeroDurationTask = true;
            return isZeroDurationTask;
        },
        //when status is IP or CO, duration change is saved to remaining duration field.So, that needs to be checked if the user types in zero
        checkIfZeroDurationMilestoneTask:function(taskModel){
             var isZeroDurationTask = false;
            if (taskModel.taskType === IMS_SHORT&& 
                (((taskModel.status== STATUS_IP||taskModel.status ==STATUS_CO) && 
                    parseInt(taskModel.remainingDuration)===0) || parseInt(taskModel.duration) === 0))
                isZeroDurationTask = true;
            if(taskModel.taskType == CMS_SHORT || taskModel.taskType == PE_SHORT)
                isZeroDurationTask = true;
            return isZeroDurationTask;
        },

        checkIfLinkInCriticalChain: function(linkId){
            var linkIdInfo = linkId.split("to");
            var fromId = linkIdInfo[0];
            if (fromId.indexOf("TM") > -1){
                fromId = fromId.split("TM")[1];
            } else if (fromId.indexOf("ChainView") > -1){
                fromId = fromId.split("ChainView")[1];
            } 
            
            var toId = linkIdInfo[1];
            var fromTask = this.getTaskOrMilestoneByUid(fromId);
            var toTask = this.getTaskOrMilestoneByUid(toId);
            if (fromTask.isCritical && toTask.isCritical){
                return true;
            } else {
                return false;
            }

        },

        getExistingPhaseLevelTaskProperty : function(phaseId){
            var me = this;
            var existingObj = _.find(me.PhaseLevelTaskProperties,function(obj){
                return obj.PhaseId == phaseId; 
            });
            if (existingObj) return existingObj;
            else return null;
        },

        addOrUpdatePhaseLevelPropertiesCollection: function(PhaseLevelTaskProperty){
            var existingPhaseLevelTaskPropertyObj = this.getExistingPhaseLevelTaskProperty(PhaseLevelTaskProperty.PhaseId);
            if (existingPhaseLevelTaskPropertyObj){
                existingPhaseLevelTaskPropertyObj.Duration = PhaseLevelTaskProperty.Duration;
                existingPhaseLevelTaskPropertyObj.Status = PhaseLevelTaskProperty.Status;
                existingPhaseLevelTaskPropertyObj.Manager = PhaseLevelTaskProperty.Manager;
                existingPhaseLevelTaskPropertyObj.Participants = PhaseLevelTaskProperty.Participants;
                existingPhaseLevelTaskPropertyObj.Resources = PhaseLevelTaskProperty.Resources;

            } else {
                this.PhaseLevelTaskProperties.push(PhaseLevelTaskProperty);
            }
        }

    });
} ()));

stl.model.Project.datePropertyNames = ['startDate', 'endDate', 'dueDate', 'lastSaved'];
stl.model.Project.defaultRowModel = {
    id: "",
    uid: "",
    scopeItemUid: "",
    name:"",
    tasks: {},
    outlineLevel: 1,
    scopeItemName: "",
    scopeItem:null
};

stl.model.Project.reconstituteDates = function (key, value) {
    if (typeof value === 'string' && stl.model.Project.datePropertyNames.indexOf(key) >= 0) {
        if(stl.app.checkIfValidDate(value))
            var parsedDate = new Date(value);
        else
            var parsedDate = null;
        return parsedDate;
    }
    return value;
}

stl.model.Project.fromJSON = function(parsedJson) {
    var cfg = parsedJson.jsonBlob;// JSON.parse(wrapperObj.jsonBlob, stl.model.Project.reconstituteDates);
    //var isProjectIDCCed = stl.model.Project.isIDCCed;
    var project = new stl.model.Project(cfg);
    project.setProjectSummaryInfo(parsedJson.projectData);
    project.addNameToRows();
    project.sortPhases();
    
    project.unflattenFromServer();
    project.processMilestones();

    project.computeMaxUIDs();
    stl.model.Project.project = project;    // FIXME remove this - no global reference to current project
    //project.isIDCCed = isProjectIDCCed;
    project.updateLinkDAG();
    project.createPhaseScopeAndTaskCountMap();
    if(project._projectEndMs) {
        stl.app.CreateTaskToolBar.PEExists =true;
        stl.app.CreateTaskToolBar.onPEAddDelete(true);
    }
    return project;
};



stl.model.Project.JSONFilter = function(key, val) {
    if (key.charAt(0) === "_") {
        return undefined;
    }
    return val;
};

stl.model.Project.getMaxUIDInArray = function(origMaxUID, arr, propertyName) {
    var max = origMaxUID;
    if (!propertyName) {
        propertyName = "uid";
    }
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!item.uid) {
            console.warn("Filled in missing UID on object", item);
            item.uid = String(max);
            max++;
        } else if (item.uid >= max || (item.id && item.id >= max)) {
            //this condition has been added to handle remove buffer case
            // we need to assign max UID from max of tsk uid and id
            if(item.id)
                max = Math.max(Number(item.uid),Number(item.id)) + 1;
            else
                max = Number(item.uid)+ 1;
        }
    }
    return max;
};

stl.model.Project.getCalMaxUIDInArray = function (origMaxUID, arr, propertyName) {
    var max = origMaxUID;
    if (!propertyName) {
        propertyName = "uid";
    }
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!item[propertyName]) {
            console.warn("missing CalendarUID on object", item);
            //item.uid = String(max);
            //max++;
        } else if (item[propertyName] >= max) {
            max = Number(item[propertyName]) + 1;
        }
    }
    return max;
};

stl.model.Project.createProject = function (projectName) {
    var project = new stl.model.Project(null, projectName);
    return project;
};

stl.model.Project.InitializeNewProject = function  (project) {
    var firstMilestone = project.createMilestone(project.phases[1], project.rows[0],PE_SHORT);
    var firstSummaryTask = project.createSummaryTask(project.phases[0], project.rows[0], STRING_NORMAL);
    //Vrushali - Changes done to Implement Multilevel WBS 
    var defaultTasksArray = [];  
    if (project.isProjectComplex()) {
        defaultTasksArray.push(firstSummaryTask);
    }
    project.rows[0].tasks[project.phases[0].uid] = defaultTasksArray;
    var firstTask = project.createTask(project.phases[0], project.rows[0],STRING_NORMAL);
    
    defaultTasksArray.push(firstTask);
    
    project.updateLinkDAG();
    project.createPhaseScopeAndTaskCountMap();
    project.rows[0].tasks[project.phases[0].uid] = defaultTasksArray;
    project.rows[0].tasks[project.phases[1].uid] = [ firstMilestone ];
    project.addLink({ from: firstTask.uid, to: project._milestones[0].uid });
    // TODO no global var here
    stl.model.Project.project = project;
}

stl.model.Project.getProject = function() {
    // FIXME there should be no global project var - if anything, a collection of open projects managed at the application level
    return stl.model.Project.project;
};

stl.model.Project.validateProject = function(project){
    //Check if PE is dangling, If PE has no predecessors, return false
    var pe = project._projectEndMs;
    if(!pe){
        PPI_Notifier.alert(PE_MISSING,PROJECT_END);
        return false;
    }
    if(pe._predecessors.length > 0){        
        return true;
    }
    PPI_Notifier.alert(PE_SHOULD_HAVE_PRED,PROJECT_END);
    return false;
};


