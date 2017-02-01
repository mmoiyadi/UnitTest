function HighlightAllResources($toolitem){
    var $toolItems = $toolitem.parent().find(".tool-item"),
        isOn = $toolitem.find("input").is(":checked");
    for(var i=1; i< $toolItems.length; i++){
        if(isOn)
            $($toolItems[i]).find("input").prop("checked","checked");
        else
            $($toolItems[i]).find("input").removeAttr("checked");
        HighlightResources($($toolItems[i]));
    }
}
function HighlightResources($toolitem) {
    var resourceId = $toolitem.data("resource-id"),
        resourceColorId = stl.app.ProjectDataFromServer.getResourceColorMap()[resourceId],
        isOn = $toolitem.find("input").is(":checked");

    var tasksArray = [];
    var tasksInMatrixViewWithAssignedResource = $(".matrix-view").find(".task.has-resource-" + resourceId);
    var tasksInTimelineViewWithAssignedResource = $(".timeline-view").find(".sch-event.has-resource-" + resourceId);
    tasksArray.push(tasksInMatrixViewWithAssignedResource);
    tasksArray.push(tasksInTimelineViewWithAssignedResource);

    if (isOn) {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).addClass("highlight-resource-" + resourceColorId);
            });
        }
    }
    else {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).removeClass("highlight-resource-" + resourceColorId);
            });
        }
    }
    if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
        Ext.getCmp('chainview').updateHighlightsOnEvents(tasksArray,"highlight-resource-" + resourceColorId,isOn);
     //tabular view
   /* $(document).trigger("highlightTasks",[
        'resource',
        resourceId,
        resourceColorId,
        isOn
    ]);*/
    if (tasksInMatrixViewWithAssignedResource.length > 0 || tasksInTimelineViewWithAssignedResource.length > 0){
        updateLegend(isOn,resourceColorId, $toolitem.find(".resource-name").text());
        stl.app.isHighlightPresent = true;
    }
    else
        stl.app.isHighlightPresent = false;
}
function HighlightAllPhases($toolitem){
    var $toolItems = $toolitem.parent().find(".tool-item"),
        isOn = $toolitem.find("input").is(":checked");
    for(var i=1; i< $toolItems.length; i++){
        if(isOn)
            $($toolItems[i]).find("input").prop("checked","checked");
        else
            $($toolItems[i]).find("input").removeAttr("checked");
        HighlightPhases($($toolItems[i]));
    }
}
function HighlightPhases($toolitem){
    var phaseId = $toolitem.data("phase-id"),
        phaseColorId = stl.app.ProjectDataFromServer.getPhaseColorMap()[$toolitem.find(".phase-name").text()],
        isOn = $toolitem.find("input").is(":checked");

    var tasksArray = [];
    var hexPhaseName = stringToHex(stl.app.ProjectDataFromServer.getPhaseById(phaseId).name.replace(/ /g, ''));
    var tasksInMatrixViewWithAssignedPhase = $(".matrix-view").find(".has-phase-" + hexPhaseName);
    var tasksInTimelineViewWithAssignedPhase = $(".timeline-view").find(".sch-event.has-phase-" + hexPhaseName); 
    var milestonesInTimelineViewWithAssignedPhase = $(".timeline-view").find(".timeline-milestone-header .milestone-event.has-phase-"+ hexPhaseName);
    tasksArray.push(tasksInMatrixViewWithAssignedPhase);
    tasksArray.push(tasksInTimelineViewWithAssignedPhase);
    tasksArray.push(milestonesInTimelineViewWithAssignedPhase);

    if (isOn) {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).addClass("highlight-phase-" + phaseColorId);
            });
            stl.app.isHighlightPresent = true;
        }
    }
    else {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).removeClass("highlight-phase-" + phaseColorId);
            });
            stl.app.isHighlightPresent = false;
        }
    }
    if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
        Ext.getCmp('chainview').updateHighlightsOnEvents(tasksArray,"highlight-phase-" + phaseColorId,isOn);
    //tabular view
    /*$(document).trigger("highlightTasks",[
        'phase',
        phaseId,
        phaseColorId,
        isOn
    ]);*/
    if (tasksInMatrixViewWithAssignedPhase.length > 0 || tasksInTimelineViewWithAssignedPhase.length > 0 || milestonesInTimelineViewWithAssignedPhase.length > 0){
    	updateLegend(isOn, phaseColorId, $toolitem.find(".phase-name").text());
        
    }
    else
        stl.app.isHighlightPresent = false;
}
function HighlightAllTaskManagers($toolitem){
    var $toolItems = $toolitem.parent().find(".tool-item"),
        isOn = $toolitem.find("input").is(":checked");
    for(var i=1; i< $toolItems.length; i++){
        if(isOn)
            $($toolItems[i]).find("input").prop("checked","checked");
        else
            $($toolItems[i]).find("input").removeAttr("checked");
        HighlightTaskManagers($($toolItems[i]));
    }
}
function HighlightTaskManagers($toolitem){
    var taskManagerId = $toolitem.data("task-manager-id"),
                            taskManagerColorId = stl.app.ProjectDataFromServer.getTaskManagerColorMap()[taskManagerId],
                            isOn = $toolitem.find("input").is(":checked");

    var tasksArray = [];
	var matrixViewTaskClass = ".task.has-task-manager-" + stringToHex(taskManagerId.replace(/ /g,''));
	var matrixViewMilestoneClass = ".milestone.has-task-manager-" + stringToHex(taskManagerId.replace(/ /g,''));
	var timelineViewTaskClass = ".sch-event.has-task-manager-" + stringToHex(taskManagerId.replace(/ /g,''));
	var timelineViewMilestoneClass = ".timeline-milestone-header .milestone-event.has-task-manager-" + stringToHex(taskManagerId.replace(/ /g,''));
    var tasksInMatrixViewWithAssignedTaskManager = $(".matrix-view").find(matrixViewTaskClass + ',' + matrixViewMilestoneClass);
	var tasksInTimelineViewWithAssignedTaskManager = $(".timeline-view").find(timelineViewTaskClass + ',' + timelineViewMilestoneClass);
    tasksArray.push(tasksInMatrixViewWithAssignedTaskManager);
    tasksArray.push(tasksInTimelineViewWithAssignedTaskManager);

    if (isOn) {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).addClass("highlight-task-manager-" + taskManagerColorId);
            });
             stl.app.isHighlightPresent = true;
        }
    }
    else {
        if (tasksArray) {
            $.each(tasksArray, function (index, task) {
                $(task).removeClass("highlight-task-manager-" + taskManagerColorId);
            });
             stl.app.isHighlightPresent = false;
        }
    }
    if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
        Ext.getCmp('chainview').updateHighlightsOnEvents(tasksArray,"highlight-task-manager-" + taskManagerColorId);
    //tabular view
    /*$(document).trigger("highlightTasks",[
        'taskManager',
        taskManagerId,
        taskManagerColorId,
        isOn
    ]);*/
    if (tasksInMatrixViewWithAssignedTaskManager.length > 0 || tasksInTimelineViewWithAssignedTaskManager.length > 0){
    	updateLegend(isOn, taskManagerColorId, $toolitem.find(".task-manager-name").text())
    }
    else
        stl.app.isHighlightPresent = false;
}

///////////////////////Project/CMS chains highlighting//////////////////

stl.app.HighlightChainWith = function (taskUidsToBeHighlighted, onlyUIdArray, isChecked, cssClass) {
    if (taskUidsToBeHighlighted == undefined || taskUidsToBeHighlighted == null || taskUidsToBeHighlighted.length == 0) {
        return;
    }

    if (stl.app.matrixView) {
        var tasksByUidMap = stl.app.matrixView.tasksByUid;
        var milestonesByUidMap = stl.app.matrixView.milestoneElementsById;

        $.each(taskUidsToBeHighlighted, function (index, taskUid) {
            var taskView = tasksByUidMap[taskUid];
            var taskOrMilestone;
            if (taskView && taskView.$el) {
                taskOrMilestone = taskView.$el;
            }
            else {
                var cMilestone = milestonesByUidMap[taskUid];
                if (cMilestone) {
                    taskOrMilestone = cMilestone;
                }
            }

            if (taskOrMilestone) {
                if (isChecked) {
                    taskOrMilestone.addClass(cssClass);
                }
                else {
                    taskOrMilestone.removeClass(cssClass);
                }
            }
        });
    }
}

stl.app.highlightChainInternal =  function(chainId, isChecked,msUid,index){

    var chainColorId = stl.app.ProjectDataFromServer.getChainsColorMap()[chainId].colorId;
    var tasksAndMilestoneForChainId = stl.app.ProjectDataFromServer.getTaskIdsAndMilestoneUIdForChainNumber(chainId);
    var tasksForChainId = tasksAndMilestoneForChainId.taskIds;
    if(!msUid && tasksAndMilestoneForChainId.milestoneUID != -1)
        msUid = tasksAndMilestoneForChainId.milestoneUID;
    
    if(tasksForChainId && tasksForChainId.length >0){
        stl.app.HighlightChainWith(tasksForChainId, true, isChecked, "highlight-chain-" + chainColorId);
        if(stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
            var timelineView = Ext.getCmp("chainview");
        else
            var timelineView = Ext.getCmp("timelineview");
        var taskObjArray=[];
        tasksForChainId.forEach(function(taskId){
            taskObjArray.push({uid:taskId});
        });
        if(timelineView){
            timelineView.toggleHighlightChain(taskObjArray, "highlight-chain-" + chainColorId, isChecked, msUid,index,chainId);
        }
        stl.app.highlightedChainId=[];
        stl.app.highlightedChainId.push(chainId);
        if(isChecked)
            stl.app.isHighlightPresent = true;
        else
            stl.app.isHighlightPresent = false;

        updateLegend(isChecked,chainColorId, chainId);
        
        return true;
    }
    else{
        return false;
        stl.app.isHighlightPresent = false;
    }
}

stl.app.HighlightProjectChain = function($toolitem) {
    //To differentiate HTML Objects with JS Objects. nodeType works in IE9 and above, Chrome, FF, Opera, Safari. http://help.dottoro.com/ljkadgoo.php 
    var map = stl.app.ProjectDataFromServer.getChainsColorMap();
    if($toolitem[0].nodeType == 1){
        var chainId = $toolitem.data("chain-id");
        var isChecked = $toolitem.find("input").is(":checked");
        stl.app.ProjectDataFromServer.updateChainsColorMap(chainId,isChecked);
    }
    else{
        var chainId = $toolitem[0].colorId;
        var isChecked = $toolitem[0].isChecked;
    }
    stl.app.highlightChainInternal(chainId, isChecked);
}

stl.app.HighlightPenChain = function (chainId, isChecked) {
    if(isChecked == undefined)
        stl.app.highlightChainInternal(chainId, true);
    else
        stl.app.highlightChainInternal(chainId, isChecked);
}

stl.app.HighlightProjectPenChain = function (project) {
    /*var allChains = project.getAllChainIds();
    if (allChains)
        var sortedChainsByID = _.sortBy(allChains);*/
    var penChainIds = project.getPenChainID();
    if(penChainIds && penChainIds!= -1)
        for(var i=0; i<penChainIds.length; i++)
            stl.app.HighlightPenChain(penChainIds[i]);
}

stl.app.HighlightAllProjectChains = function($toolitem){
    var $toolItems = $toolitem.parent().find(".tool-item"),
        isChecked = $toolitem.find("input").is(":checked");
    for(var i=1; i< $toolItems.length; i++){
        if(isChecked){
            $($toolItems[i]).find("input").prop("checked","checked");
        }
        else{
            $($toolItems[i]).find("input").removeAttr("checked");
        }
        stl.app.HighlightProjectChain($($toolItems[i]));
    }
}
stl.app.HighlightChainsForMilestone = function(msUid){
    var chainIds = stl.app.ProjectDataFromServer.getChainIdsForMilestone(msUid);
    //If all chains are highlighted then we have to remove all those highlights before highlighlighting chains for this MS
    stl.app.ProjectDataFromServer.resetChainsColorMap();
    var map = stl.app.ProjectDataFromServer.getChainsColorMap();

    for(var i=0; i<chainIds.length; i++){
        
        if (stl.app.highlightChainInternal(chainIds[i], true, msUid,i) == true)
        {
            stl.app.ProjectDataFromServer.updateChainsColorMap(chainIds[i], true);
            var chainColorId = map[chainIds[i]].colorId;
            updateLegend(true,chainColorId, chainIds[i],"Chains");
            stl.app.chainsHighlightMenuIsCurrent = false;

        }
    }
    Ext.getCmp('chainview').onTimelineViewChange();
    $(".page-header .highlight").find(".button-text").text("Highlight: " + PROJECT_CMS_CHAINS);
}
/*********************------------------Chain Highlight Functions -----------*************/
var chainHighlightInstance = (function(){
        
        var projectModel = stl.app.ProjectDataFromServer;
        var tasksToBeHighlighted  = [];
        var AllTasksInProject = [];   

        //Variable modified by S2M functions     
        var MaxPathLeaves = [];
        var MaximumWeights = {};
        var tasksToBeHighlighted = [];
        var ParentCounterMap = {};        
        
        function S2M_AddTaskAsPredecessor(PredTask, TaskPredMap) { //ByRef TaskPredMap

            //var me = this;
            //Add the successors
            var CurTask;
            if (PredTask._successors) {
                $.each(PredTask._successors, function (index, CurTask) {
                    S2M_AddToPredecessorCollection(PredTask, CurTask, TaskPredMap);
                });
            }

            //Add the next critical task
            var ConstraintUniqueId = PredTask.text7;
            if (ConstraintUniqueId && ConstraintUniqueId > 0)
                S2M_AddToPredecessorCollection_ErrCheckText7(PredTask, AllTasksInProject, ConstraintUniqueId, TaskPredMap);

            //Add the constraing task (either a resource dependency or an activity dependency
            ConstraintUniqueId = PredTask.text5;
            if (ConstraintUniqueId && ConstraintUniqueId > 0 && ConstraintUniqueId != PredTask.uid)
                S2M_AddToPredecessorCollection_ErrCheckText5(PredTask, AllTasksInProject, ConstraintUniqueId, TaskPredMap)
        }

        function S2M_MarkNumberOfParents(RootTask, ParentCounterMap, TaskType, TaskPredMap) { //ByRef ParentCounterMap
            //var me = this;
            var TasksTraversed = {};
            ParentCounterMap[RootTask.uid] = 0;//TBD
            S2M_MarkNumberOfParentsRecursive(RootTask, ParentCounterMap, TasksTraversed, TaskType, TaskPredMap);

        }

        function S2M_MarkMaximumWeights(RootTask, ParentCounterMap, MaximumWeights, TaskType, TaskPredMap) { //ByRef MaxPathLeaves, MaximumWeights
            //var me = this;
            var Queue = [];
            var CurTask, CurChildTask;
            var CurrentCounterMap = {};
            //var MaxPathLeavesArrRef = MaxPathLeaves;

            MaximumWeights[RootTask.uid] = 0;
            CurrentCounterMap[RootTask.uid] = 0;
            Queue.push(RootTask);


            while (Queue.length > 0) {
                CurTask = Queue[0];
                Queue.splice(0, 1);
                var TaskPredecessors = {};
                TaskPredecessors = TaskPredMap[CurTask.uid];

                $.each(TaskPredecessors, function (index, CurChildTask) {
                    S2M_ComputeWeight(CurChildTask, CurTask, MaximumWeights);//TBD MaximumWeights
                    S2M_IncrementCounter(CurChildTask, CurrentCounterMap);
                    var retVal = S2M_AreAllParentsWeighted(CurChildTask, CurrentCounterMap, ParentCounterMap);
                    if (retVal)
                        Queue.push(CurChildTask);
                });

                S2M_UpdateMaxPathLeaves(CurTask, MaximumWeights);
                //S2M_UpdateMaxPathLeaves(CurTask, MaximumWeights, MaxPathLeaves);
            }
            // MaxPathLeaves = MaxPathLeavesArrRef;
        }

        function S2M_ComputeWeight(ChildTask, ParentTask, MaximumWeights) { //ByRef MaximumWeights
            //var me = this;
            var nParentWeight = 0;
            var nCurrentWeight = 0;
            var nRemainingDuration = 0;
            var sText22;
            nRemainingDuration = GetRemDuration(ChildTask);

            nParentWeight = MaximumWeights[ParentTask.uid];

            nCurrentWeight = MaximumWeights[ChildTask.uid];

            if (nCurrentWeight) {
                if ((nParentWeight + parseInt(nRemainingDuration)) > nCurrentWeight) {
                    delete MaximumWeights[ChildTask.uid];
                    MaximumWeights[ChildTask.uid] = nParentWeight + parseInt(nRemainingDuration);
                }
            } else {
                MaximumWeights[ChildTask.uid] = nParentWeight + parseInt(nRemainingDuration);
            }
        }

        function S2M_UpdateMaxPathLeaves(CurTask, MaximumWeights) { //ByRef MaxPathLeaves   //MaxPathLeaves
            //var me = this;
            var nCurrentMaxDepth = 0;
            var nCurrentTaskDepth = 0;
            if (MaxPathLeaves.length > 0)
                nCurrentMaxDepth = MaximumWeights[MaxPathLeaves[0].uid];

            if (MaxPathLeaves.length > 0 && MaximumWeights[MaxPathLeaves[0].uid] != undefined) { //nCurrentMaxDepth != undefined
                nCurrentTaskDepth = MaximumWeights[CurTask.uid];

                if (nCurrentTaskDepth > nCurrentMaxDepth) {
                    MaxPathLeaves = [];
                    MaxPathLeaves.push(CurTask);
                } else if (nCurrentTaskDepth == nCurrentMaxDepth) {
                    MaxPathLeaves.push(CurTask);
                }
            } else {
                MaxPathLeaves.push(CurTask);
            }
            //return MaxPathLeaves;
        }

        function S2M_AreAllParentsWeighted(ChildTask, CurrentCounterMap, ParentCounterMap) {
            //var me = this;
            var areAllParentsWeighted = false;
            if (CurrentCounterMap[ChildTask.uid] == ParentCounterMap[ChildTask.uid])
                areAllParentsWeighted = true;
            return areAllParentsWeighted;

        }


        function S2M_FlagLongestFeedingPaths(MaxPathLeaves, ParentCounterMap, MaximumWeights) { //ByRef MaxPathLeaves, MaximumWeights
            //var me = this;
            var LeafTask;
            var VisitedNodes = [];
            var CompletedTask = false;

            $.each(MaxPathLeaves, function (index, LeafTask) {
                if (LeafTask.percentComplete == 100)
                    CompletedTask = true;
                else
                    CompletedTask = false;

                S2M_FlagLongestFeedingPath(LeafTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask);
            });
        }

        function S2M_FlagLongestFeedingPath(CurTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask) { //ByRef VisitedNodes
            //var me = this;
            var CurParentTask;
            var nNextMaxDepth = 0;
            var nRemainingDuration = 0;
            var ConstraintUniqueId = 0;

            if (VisitedNodes[CurTask.uid])
                return;

            if (!VisitedNodes[CurTask.uid]) {

                VisitedNodes[CurTask.uid] = true;

                nRemainingDuration = GetRemDuration(CurTask);
                if (CompletedTask == false)
                    S2M_MarkTask(CurTask);

                nNextMaxDepth = MaximumWeights[CurTask.uid] - nRemainingDuration;
                if(CurTask._successors){
                    $.each(CurTask._successors, function (index, CurParentTask) {
                        if (ParentCounterMap[CurParentTask.uid] != undefined) {
                            if (nNextMaxDepth == MaximumWeights[CurParentTask.uid]) {
                                CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100); //CHECK
                                S2M_FlagLongestFeedingPath(CurParentTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask);
                            }
                        }

                    });
                }

                ConstraintUniqueId = CurTask.text7;

                if (ConstraintUniqueId > 0) {
                    var matchingTask;
                    $.each(AllTasksInProject, function (index, curTask) {
                        if (curTask.uid == ConstraintUniqueId) {
                            matchingTask = curTask;
                            return false;
                        }
                    });
                    CurParentTask = matchingTask; /// FIXME - ActiveProject.Tasks.uniqueId(ConstraintUniqueId)                    
                    if (CurParentTask && ParentCounterMap[CurParentTask.uid] != undefined) {
                        if (nNextMaxDepth == MaximumWeights[CurParentTask.uid]) {
                            CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100);
                            S2M_FlagLongestFeedingPath(CurParentTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask);
                        }
                    }
                }

                ConstraintUniqueId = CurTask.text5;

                if (ConstraintUniqueId > 0) {
                    var matchingTask;
                    $.each(AllTasksInProject, function (index, curTask) {
                        if (curTask.uid == ConstraintUniqueId) {
                            matchingTask = curTask;
                            return false;
                        }
                    });
                    CurParentTask = matchingTask; /// FIXME - ActiveProject.Tasks.uniqueId(ConstraintUniqueId)

                    if (CurParentTask && ParentCounterMap[CurParentTask.uid] != undefined) {
                        if (nNextMaxDepth == MaximumWeights[CurParentTask.uid]) {
                            CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100);
                            S2M_FlagLongestFeedingPath(CurParentTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask);
                        }
                    }
                }

            }

        }

        function S2M_AddToPredecessorCollection(PredTask, ParentTask, TaskPredMap) { //ByRef TaskPredMap
            //var me = this;
            var PredecessorsForParent = {};
            PredecessorsForParent = TaskPredMap[ParentTask.uid];

            if (PredecessorsForParent) {
                if (!PredecessorsForParent[PredTask.uid])
                    PredecessorsForParent[PredTask.uid] = PredTask;
            } else {
                PredecessorsForParent = {};
                PredecessorsForParent[PredTask.uid] = PredTask;
                TaskPredMap[ParentTask.uid] = PredecessorsForParent;
            }

        }

        function S2M_AddToPredecessorCollection_ErrCheckText7(PredTask, oTasks, ConstraintUniqueId, TaskPredMap) { //ByRef TaskPredMap
            //var me = this;
            try {
                // FIXME oTasks.uniqueId(ConstraintUniqueId) ????
                var matchingTask;
                $.each(oTasks, function (index, curTask) {
                    if (curTask.uid == ConstraintUniqueId) {
                        matchingTask = curTask;
                        return false;
                    }
                });
                S2M_AddToPredecessorCollection(PredTask, matchingTask, TaskPredMap);
            } catch (error) {
                //MsgBox(FormatParamString(MSG_INVALID_NEXTCR_TASK, CStr(PredTask.Id)), vbOKOnly, CONCERTO)
            }

        }

        function S2M_AddToPredecessorCollection_ErrCheckText5(PredTask, oTasks, ConstraintUniqueId, TaskPredMap) { //ByRef TaskPredMap
            //var me = this;
            try {
                // FIXME oTasks.uniqueId(ConstraintUniqueId) ????
                var matchingTask;
                $.each(oTasks, function (index, curTask) {
                    if (curTask.uid == ConstraintUniqueId) {
                        matchingTask = curTask;
                        return false;
                    }
                });
                S2M_AddToPredecessorCollection(PredTask, matchingTask, TaskPredMap);
            } catch (error) {
                //MsgBox(FormatParamString(MSG_INVALID_NEXTCR_TASK, CStr(PredTask.Id)), vbOKOnly, CONCERTO)
            }

        }

        function S2M_MarkNumberOfParentsRecursive(ProjTask, ParentCounterMap, TasksTraversed, TaskType, TaskPredMap) { //ByRef TaskPredMap
            //var me = this;
            var TaskPredecessors = {};
            TaskPredecessors = TaskPredMap[ProjTask.uid];

            if (TasksTraversed[ProjTask.uid] == undefined) //!TasksTraversed[ProjTask.uid] ||
            {
                var CurChildTask;
                $.each(TaskPredecessors, function (index, CurChildTask) {
                    S2M_IncrementCounter(CurChildTask, ParentCounterMap);
                    S2M_MarkNumberOfParentsRecursive(CurChildTask, ParentCounterMap, TasksTraversed, TaskType, TaskPredMap);
                });
                TasksTraversed[ProjTask.uid] = 1;
            }

        }

        function S2M_IncrementCounter(ChildTask, CounterMap) {

            var nCounter = 0;
            nCounter = CounterMap[ChildTask.uid];

            if (nCounter != undefined) {
                delete CounterMap[ChildTask.uid];
                CounterMap[ChildTask.uid] = nCounter + 1;
            } else {
                CounterMap[ChildTask.uid] = 1;
            }

        }

        function S2M_MarkTask(ProjTask) {
            //var me = this;
            ProjTask.Flag17 = true;
            ProjTask.Flag18 = true;

            tasksToBeHighlighted.push(ProjTask);
        }

        function GetRemDuration(selTask) {
            //var me = this;
            var FKDUR = "FKCD";
            var remDuration = 0;
            var i = 0;
            var nDurInSecs = 0;
            var aText22Components = null;
            var aDurationFk = [];
            var str = null;
            var sText22;
            var bFound = false;

            if (S2M_IsFullKitTask(selTask)) {
                sText22 = selTask.text22;
                if (sText22 != undefined) {
                    aText22Components = sText22.split(";");
                    for (i = 0; i < aText22Components.length; i++) {
                        str = aText22Components[i];
                        str = str.trim();
                        bFound = str.indexOf(FKDUR); // InStr(1, str, FKDUR, vbTextCompare);
                        if (bFound != -1) {
                            aDurationFk = str.split("=");

                            if (aDurationFk[0] == FKDUR) {
                                nDurInSecs = aDurationFk[1];
                                remDuration = nDurInSecs; //nDurInSecs / 60;
                            }
                        }
                    }
                }
            } else if (S2M_IsBuffer(selTask)) {
                remDuration = 0;
            } else {
                if (selTask.remainingDuration != undefined)
                    remDuration = selTask.remainingDuration;
            }
            return parseInt(remDuration);
        }

        function S2M_IsFullKitTask(task) {
            var FULLKIT_TASK_VAL = 2;
            var isFullKit = false;
            if (task.text1 == 2)
                isFullKit = true;
            return isFullKit;
        }

        function S2M_IsBuffer(CurChildTask) {
            var isBufferTask = false;
            var TaskType = 0;
            TaskType = parseInt(CurChildTask.text9);
            if (TaskType == 1 || TaskType == 2 || TaskType == 6) {
                isBufferTask = true;
            }
            //            if (TaskType == "buffer") {
            //                isBufferTask = true;
            //            }
            return isBufferTask;
        }

        function highlightLongestPredecessorChain (taskModel) {
            var CurSelectedTask = taskModel;
            var TaskPredecessors = {};
            var TaskPredMap = {};
            AllTasksInProject = [];            
            
            var projectModelInstance = stl.app.ProjectDataFromServer;
            AllTasksInProject  = projectModelInstance.getAllTasks().concat(projectModelInstance._milestones);

            $.each(AllTasksInProject, function (index, CurTask) {

                var TaskPredecessors = {};
                if (CurTask.uid != undefined)
                    TaskPredMap[CurTask.uid] = TaskPredecessors;

            });
            $.each(AllTasksInProject, function (index, CurTask) {
                //if(!CurTask.data.isSummaryTask) - //TBD - Currently we cannot create summary task and also we dont have this property 
                S2M_AddTaskAsPredecessor(CurTask, TaskPredMap);
            });


            var SelTask = CurSelectedTask; //TBD - There is no multiselection in PPI currently
            ParentCounterMap = {};
            var TaskType = CurSelectedTask.text9;
            S2M_MarkNumberOfParents(SelTask, ParentCounterMap, TaskType, TaskPredMap)

            MaxPathLeaves = [];
            MaximumWeights = {};
            tasksToBeHighlighted = [];

            S2M_MarkMaximumWeights(SelTask, ParentCounterMap, MaximumWeights, TaskType, TaskPredMap);
            //(SelTask, ParentCounterMap, MaxPathLeaves, MaximumWeights, TaskType, TaskPredMap);

            S2M_FlagLongestFeedingPaths(MaxPathLeaves, ParentCounterMap, MaximumWeights);

            return tasksToBeHighlighted;            
        }        

        return{            
            highlightLongestPredecessorChain: highlightLongestPredecessorChain                     
        };
    })();
/*********************------------------End of Chain Highlight Functions -----------*************/