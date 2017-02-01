stl.app.undoStackManager = function(cfg) {
    this.undoStack = new stl.app.undoStack(null);
    this.undoTaskStack = new stl.app.undoStack(null);
    this.activeStack = this.undoStack;
    this.xtype = 'undoStackManager';
    this.msPredTasksByMsUid = {};
}

$.extend(stl.app.undoStackManager.prototype, (function() {
    var removeTask = function(undoStackMgr, project, task, scope, row, phase, prevTaskUid) {

        if (project._tasksAndMilestonesByUid[task.uid]) {
            if (task.isMS) {
                var msPredTasks = undoStackMgr.msPredTasksByMsUid[task.uid];
                if(msPredTasks){
                    var MSTaskInfo = msPredTasks.MSTask;
                    var bufferTaskInfo = msPredTasks.bufferTask;
                    $(document).trigger(UndoStackEventName.MilestoneDelete, [undoStackMgr, MSTaskInfo.task]);//, scope, phase, row, IPMSTaskInfo.prevTaskUid]);
                    delete project._tasksAndMilestonesByUid[MSTaskInfo.task.uid];
                    $(document).trigger(UndoStackEventName.TaskDelete, [undoStackMgr, bufferTaskInfo.task, row.uid, phase.uid]);//, scope.uid, phase.uid]);
                    delete project._tasksAndMilestonesByUid[bufferTaskInfo.task.uid];
                }

                var msIndex = _.findIndex(project._milestones, function(ms){
                        return ms.uid === task.uid;
                    });
                project._milestones.splice(msIndex, 1);
                $(document).trigger(UndoStackEventName.MilestoneDelete, [undoStackMgr, task]);
            } else {
                $(document).trigger(UndoStackEventName.TaskDelete, [undoStackMgr, task, row.uid, phase.uid]);
            }            
            delete project._tasksAndMilestonesByUid[task.uid];
            return true;
        } else
            return false;

    };

    var addTask = function(undoStackMgr, project, task, scope, row, phase, prevTaskUid, nextTaskUid) {

        if (!project._tasksAndMilestonesByUid[task.uid]) {
            project._tasksAndMilestonesByUid[task.uid] = task;
            if (task.isMS) {
                project._milestones.push(task);
                var msPredTasks = undoStackMgr.msPredTasksByMsUid[task.uid];
                if(msPredTasks){
                    var MSTaskInfo = msPredTasks.MSTask;
                    var bufferTaskInfo = msPredTasks.bufferTask;
                    project._tasksAndMilestonesByUid[MSTaskInfo.task.uid] = MSTaskInfo.task;
                    $(document).trigger(UndoStackEventName.MilestoneAdd, [undoStackMgr, MSTaskInfo.task, scope, phase, row, MSTaskInfo.prevTaskUid]);
                    project._tasksAndMilestonesByUid[bufferTaskInfo.task.uid] = bufferTaskInfo.task;
                    $(document).trigger(UndoStackEventName.TaskAdd, [undoStackMgr, bufferTaskInfo.task, scope, phase, row, bufferTaskInfo.prevTaskUid]);
                }
                $(document).trigger(UndoStackEventName.MilestoneAdd, [undoStackMgr, task, scope, phase, row, prevTaskUid,nextTaskUid]);
            } else {
                $(document).trigger(UndoStackEventName.TaskAdd, [undoStackMgr, task, scope, phase, row, prevTaskUid,nextTaskUid]);
            }
            return true;
        } else
            return false;

    };

    var pushToUndoStackForTaskAdd = function(project, task, scope, row, phase, prevTaskUid, nextTaskUid) {
        var undoStackMgr = this;
        stl.app.setPredSuccIdsArray(task);
        var action = new stl.app.ActionItem(
            function(task) {
                return removeTask(undoStackMgr, project, task, scope, row, phase, prevTaskUid);
            },
            function(task) {
                return addTask(undoStackMgr, project, task, scope, row, phase, prevTaskUid, nextTaskUid);
            }
        );

        this.activeStack.push(action, task);
    };

    var pushToUndoStackForTaskDelete = function(project, task, scope, row, phase, prevTaskUid, nextTaskUid) {
        var undoStackMgr = this;
        if (task.taskType === "PEMS" || task.taskType === "IPMS" || task.taskType === "buffer")
            return;
        stl.app.setPredSuccIdsArray(task);
        var action = new stl.app.ActionItem(
            function(task) {
                return addTask(undoStackMgr, project, task, scope, row, phase, prevTaskUid, nextTaskUid);
            },
            function(task) {
                return removeTask(undoStackMgr, project, task, scope, row, phase, prevTaskUid);
            }
        );
        this.activeStack.push(action, task);

    };

    var pushToUndoStackForMultiTaskCut = function(project, cutTasksUndoParamsA ) {
        var me = this;
        _.each(cutTasksUndoParamsA.oldtasksUndoParamsA, function (taskUndoParams){
                stl.app.setPredSuccIdsArray(taskUndoParams.task);
        });
        _.each(cutTasksUndoParamsA.newtasksUndoParamsA, function (taskUndoParams){
                stl.app.setPredSuccIdsArray(taskUndoParams.task);
        });

        cutTasksUndoParamsA.oldtasksUndoParamsA = cutTasksUndoParamsA.oldtasksUndoParamsA.sort(function (a, b) {
                return   b.task.order - a.task.order ;
            });

        var action = new stl.app.ActionItem(

            function(cutTasksUndoParamsA) {
                _.each(cutTasksUndoParamsA.newtasksUndoParamsA, function (taskUndoParams){
                    removeTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                }); 
                _.each(cutTasksUndoParamsA.oldtasksUndoParamsA, function (taskUndoParams){
                    addTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                });                        
                return true;
                },
            function(cutTasksUndoParamsA) {
                _.each(cutTasksUndoParamsA.newtasksUndoParamsA, function (taskUndoParams){
                    addTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                }); 
                _.each(cutTasksUndoParamsA.oldtasksUndoParamsA, function (taskUndoParams){
                    removeTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                }); 
                return true;
            }
                
            
        );
        this.activeStack.push(action, cutTasksUndoParamsA);

    };

    var pushToUndoStackForMultiTaskAdd = function(project, taskUndoParamsA) {
        var me = this;
        _.each(taskUndoParamsA, function (taskUndoParams){
                stl.app.setPredSuccIdsArray(taskUndoParams.task);
        });

        var action = new stl.app.ActionItem(

            function(taskUndoParamsA) {
                _.each(taskUndoParamsA, function (taskUndoParams){
                    removeTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                });                    
                return true;
                },
            function(taskUndoParamsA) {
                _.each(taskUndoParamsA, function (taskUndoParams){
                    addTask(me,project, taskUndoParams.task,taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                });
                return true;
            }
                
            
        );
        this.activeStack.push(action, taskUndoParamsA);

    };

    var pushToUndoStackForMultiTaskDelete = function(project, taskUndoParamsA) {
        var me = this;
        _.each(taskUndoParamsA, function (taskDeleteUndoParams){
                stl.app.setPredSuccIdsArray(taskDeleteUndoParams.task);
        });

        taskUndoParamsA = taskUndoParamsA.sort(function (a, b) {
                return b.task.order - a.task.order;
            });

        var action = new stl.app.ActionItem(

            function(taskUndoParamsA) {
                _.each(taskUndoParamsA, function (taskUndoParams){
                    addTask(me,project, taskUndoParams.task, taskUndoParams.scope,
                    taskUndoParams.row, taskUndoParams.phase, 
                    taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                });                    
                return true;
                },
            function(taskUndoParamsA) {
                _.each(taskUndoParamsA, function (taskUndoParams){
                    removeTask(me,project, taskUndoParams.task,taskUndoParams.scope,
                        taskUndoParams.row, taskUndoParams.phase, 
                        taskUndoParams.prevTaskUid,taskUndoParams.nextTaskUid);
                });
                return true;
            }
                
            
        );
        this.activeStack.push(action, taskUndoParamsA);

    };

    var removeLink = function(linksView, project, link) {
        if (project.doesLinkExists(link.to, link.from)) {
                project.removeLink(link.from, link.to);
            return true;
        } else
            return false;
    };

    var addLink = function(linksView, project, link) {
        if (!project.doesLinkExists(link.to, link.from)) {
                project.addLink(link);
            return true;
        } else
            return false;
    };

    var pushToUndoStackForLinkAdd = function(linksView, project, link) {
        var action = new stl.app.ActionItem(
            function(link) {
                return removeLink(linksView, project, link);
            },
            function(link) {
                return addLink(linksView, project, link);
            }
        );
        this.activeStack.push(action, link);
    };

    var pushToUndoStackForLinkDelete = function(linksView, project, link) {
        var action = new stl.app.ActionItem(
            function(link) {
                return addLink(linksView, project, link);
            },
            function(link) {
                return removeLink(linksView, project, link);
            }
        );
        this.activeStack.push(action, link);
    };

    var activateStack = function(stackType) {
        switch (stackType) {
            case UndoStackTypesEnum.TaskStack:
                {
                    this.undoTaskStack.invalidateAll();
                    this.activeStack = this.undoTaskStack;
                    break;
                }
            case UndoStackTypesEnum.ProjectStack:
                {
                    this.activeStack = this.undoStack;
                    break;
                }
            default:
                {
                    this.activeStack = this.undoStack;
                    break;
                }
        }
    };

    var undo = function() {
        this.activeStack.undo();
    };

    var redo = function() {
        this.activeStack.redo();
    };
    var invalidateAll = function() {
        this.undoStack.invalidateAll();
        this.undoTaskStack.invalidateAll();
    };

    var deleteSubtask = function(taskView, task, subtasks) {
        for (var i = subtasks.length - 1; i >= 0; i--) {
            var subtaskInfo = subtasks[i];
            var subtask = subtaskInfo.subtask;
            var index = task.subtasks.indexOf(subtask);
            if (index >= 0) {
                task.subtasks.splice(index, 1);
                taskView.load(task);
            }
        }
        return true;
    };

    var addSubtask = function(taskView, task, subtasks) {
        subtasks.forEach(function(subtaskInfo){
            var subtask = subtaskInfo.subtask;
            var index = subtaskInfo.index;
            if (index >= 0) {
                task.subtasks.splice(index, 0, subtask);
                taskView.load(task);
            }
        });
        return true;
    };
    var addSubtaskInReverse = function(taskView, task, subtasks) {
        for (var i = subtasks.length - 1; i >= 0; i--) {
            var subtaskInfo = subtasks[i];
            var subtask = subtaskInfo.subtask;
            var index = subtaskInfo.index;
            if (index >= 0) {
                task.subtasks.splice(index, 0, subtask);
                taskView.load(task);
            }
        }
        return true;
    };
    var addSubtaskAtIndex = function(taskView, task, subtask, deletedIndex) {
        var index = task.subtasks.indexOf(subtask);
        if (index < 0) {
            if (deletedIndex >= 0) {
                task.subtasks.splice(deletedIndex, 0, subtask);
                taskView.load(task);
                
            }
        }
        return true;
    };

    var setMilestonePredTasksInfo = function(bufferTask, IPMSOrPEMSTask, msUid, project){
        if (bufferTask && IPMSOrPEMSTask) {
            var prevTask = project.getPrevTask(bufferTask);
            var prevTaskUid = prevTask ? prevTask.Uid : null;
            
            this.msPredTasksByMsUid[msUid] = {
                "bufferTask": {
                    "task" : bufferTask,
                    "prevTaskUid" : prevTaskUid
                },
                "MSTask": {
                    "task" : IPMSOrPEMSTask,
                    "prevTaskUid" : null
                }
            };
            stl.app.setPredSuccIdsArray(bufferTask);
            stl.app.setPredSuccIdsArray(IPMSOrPEMSTask);
        }
    };


    //------ Subtask related ------//
    var pushToUndoStackForSubtaskAdd = function(taskView, task, subtasks) {
        var action = new stl.app.ActionItem(
            function(task) {
                return deleteSubtask(taskView, task, subtasks);
            },
            function() {
                return addSubtask(taskView, task, subtasks);
            }
        );
        this.activeStack.push(action, task);
    };
    var pushToUndoStackForSubtaskDelete = function(taskView, task, subtasks) {
            var action = new stl.app.ActionItem(
                function(task) {
                    return addSubtaskInReverse(taskView, task, subtasks);
                },
                function() {
                    return deleteSubtask(taskView, task, subtasks);
                }
            );
            this.activeStack.push(action, task);
        };

    return {
        //------ task related ------//
        pushToUndoStackForTaskAdd: pushToUndoStackForTaskAdd,
        pushToUndoStackForTaskDelete: pushToUndoStackForTaskDelete,
        pushToUndoStackForMultiTaskAdd: pushToUndoStackForMultiTaskAdd,
        pushToUndoStackForMultiTaskCut:pushToUndoStackForMultiTaskCut,
        pushToUndoStackForMultiTaskDelete: pushToUndoStackForMultiTaskDelete,
        setMilestonePredTasksInfo: setMilestonePredTasksInfo,
        //------ link related ------//
        pushToUndoStackForLinkAdd: pushToUndoStackForLinkAdd,
        pushToUndoStackForLinkDelete: pushToUndoStackForLinkDelete,
        //------ Stack related ------//
        activateStack: activateStack,
        undo: undo,
        redo: redo,
        invalidateAll: invalidateAll,
        //------ Subtask related ------//
        pushToUndoStackForSubtaskAdd: pushToUndoStackForSubtaskAdd,
        pushToUndoStackForSubtaskDelete: pushToUndoStackForSubtaskDelete

    };
}()));