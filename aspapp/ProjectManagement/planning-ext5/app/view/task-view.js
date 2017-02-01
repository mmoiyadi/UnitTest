/**
 * stl.view.TaskView
 *
 * UI for a task bar with expandable details section, representing a single task.
 * Contains a list of subtasks along with various task properties.
 *
 * A TaskView has a one-to-one correspondence with a task model.
 * The task model is bound via a data attribute on the .task element.
 *
 * Primary methods: load, save (update view and model respectively)
 *
 *   +---------------+  <-- $task.data("model") --> ( task model )
 *   | Task name      >
 *   +---------------+
 *   | Properties,   |
 *   | Subtasks      |
 *   +---------------+
 */

stl.view.TaskView = function(cfg) {
    var defaults = {
    	// TODO
    };
    $.extend(this, defaults, cfg);
    //TODO this check is not required once we 
    //render and  load tasks via template at all places like timeline view and othe places where 
    //addEmptyTaskUI method is called
   if (cfg.templateCfg && cfg.templateCfg.loadViaTemplate) {
    this.loadByTemplate();
    } else {
        if (cfg.insertAfter || cfg.insertBefore) {
            this.render($(cfg.insertBefore), $(cfg.insertAfter));
            // }
            // else if (cfg.insertBefore ) {
            //  this.render($(cfg.insertBefore), $(cfg.insertAfter));
        }
        if (cfg.task) {
            this.load(cfg.task);
        }
    }
};

$.extend(stl.view.TaskView.prototype, (function () {

	// Private static variables
    // getInternetExplorerVersion() returns -1 for browsers other than IE
	var QUICK_ENTRY_TASK_WIDTH = (getInternetExplorerVersion() === -1) ? 275 :290;

	// Public API
	return ({
        
       addDataToTaskElement: function($task,task){
            $task.data("model", task);
            $task.data("view", this);
        },
        
       /**
		 * Load the UI with data from the model
		 * (model -> view)
		 * TODO remove popup and sender args
		 */
        load: function(task, popup, sender) {
            // FIXME this popup flag is a temporary fix.  we need to extract the task ui into its own
            // class, and have matrix view bindTask call out to a ui-only bindTask.  matrix view will
            // then do the tracking of tasksByUid and timeline view will call into the ui-only binding method.
            // this flag is an artifact of the way timeline view needs to do task ui without
            // registering in the matrix view's list of tasksByUid (and overwriting the original task).
            this.loadPartialViewViaTemplate();

            var me = this,
            	$task = me.$el;
            this.task = task;
            $task.data("model", task);
            $task.data("view", this);
            $task.attr("id", task.uid);
            if (typeof(task.name) !== "undefined" && task.name !== null) {
                $task.find(".task-name input").val(task.name);
            } else {
                $task.find(".task-name input").val('');
            }
           if(task.taskType === FULL_KIT)
                $task.addClass('fullkit');
           

            if (!popup) {
                // Flag tasks that are using default naming, so we can keep names in sync
                // Need to delay because on first-time load the task may not be attached to the DOM yet

                // FIXME make this matrix view's responsibility for now
                // setTimeout(this.checkTaskForDefaultName.bind(this, $task), 0);
            }
            $task.data("linkable-element-name", task.name);   // used for link deletion
            $task.find('#task-id-value').text( task.id);

            this.updateChecklistStatus(task);                       
            $task.find(".task-checklist-icon").addClass(this.project.getChecklistStatus(task.checklistStatus));

            //this.refreshStatusIndicator();
            this.setQuickEditStatusBox($task);

            this.initializeTaskManagerField();

            $task.find(".task-duration")
                .val(ValidationClassInstance.getValidDurationString(task.remainingDuration,TASK_DURATION_DEFAULT_STR,false));
            
            // if (task.startNoEarlierThan) {
            //     $task.find(".snet input").val(Ext.Date.format(new Date(task.startNoEarlierThan),ServerTimeFormat.getExtDateformat()))
            // }
            // else{
            //     $task.find(".snet input").val(Ext.Date.format(ServerClientDateClass.getTodaysDate(),ServerTimeFormat.getExtDateformat()));
            // }

            if (task.taskType ===TASKTYPE_FULLKIT && task.date1) {            
                $task.find(".needDate input").val(ServerTimeFormat.getDateInLocaleFormat(task.date1));
                $task.find(".needDate input").prop('disabled', true);
            }

            $task.find(".pullInFullKitDateBy input")
                .val(ValidationClassInstance.getValidDurationString(task.fullkitPullInDuration,ZERO_DURATION_STR,false));

            // if (task.date7) {
            //      $task.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(task.date7));
            // } 
            // else 
            // {    
            //     $task.find(".expectedFinishDate input").val(ServerTimeFormat.getTodaysDateInLocaleFormat());
            // }

            if (task.isReadyToStart){
                $task.addClass("readyToStart");
            } else {
                $task.addClass("notReadyToStart");
            }

            if (sender) {
                // Re-initialize resource picker
                this.invalidateResourceCache();
                this.onTaskResourceChangeFromTableView($task,task);
            }
            this.taskResourcePicker.setValue(task.resources || []);
            this.taskResourcePicker.setReadOnly(this.readOnly || task.bufferType !== "None");
            if (!sender) {
                for (var i = 0; i < task.resources.length; i++) {
                    var res = this.getResourceById(task.resources[i].resourceId);
                    if (res) {
                        Ext.getCmp('resGrid').updateResourceSheet(res, task.resources[i].units, res.taskdata);
                    }
                }
            }
            if(task.taskType === FULL_KIT && this.phase.type !==STRING_NORMAL){
                if(!task.isAutolinked )
                    task.isAutolinked = false;

                this.setAutolinkButonText($task, task);

                /*if (task.isAutolinked) {
                    $task.find(".fk-autolink input").prop('checked', true);
                } else {
                    $task.find(".fk-autolink input").prop('checked', false);
                }*/
            }
            // $task.find(".task-manager input").val(task.manager);
            //    // .select2("val", task.manager);

            // $task.find(".task-participants input")
            //     .select2("val", task.participants || []);

            // $task.find(".task-type select").val(task.taskType);
            //     //.select2("val", task.taskType);

            // $task.find(".task-status select").val(task.status);
               // .select2("val", task.status);
            //Subtask Block not valid for purchasing tasks [CON 2995]-Planning: Support of subtasks in PT
           
            this.handleSubtaskBlock();
            this.addClassForTaskStatus($task); 
            this.bindTaskTypeSpecificProperties(task.taskType);
            this.updateWIPLimitNotification(task, $task);

            $task.data("last-height", $task.height());
            this.updateCCTaskColor($task, task);
            this.updateTaskResourceColors($task, task);
            this.updateTaskPhaseColors($task,task);
            this.updateTaskManagerColors($task,task);
            this.processZeroDurationTask();

            if (task.bufferType === "CCCB" || task.bufferType === "CCFB" || task.bufferType === "CMSB") {
                $task.addClass("buffer-task " + task.bufferType.toLowerCase() + "-task");
            }
            this.wireSubTaskEvents();
            if (this.readOnly) {
                $task.addClass("readonly");
                $task.find(":input").prop("disabled", true);
            } else {
                $task.removeClass("readonly");
            }
                this.checkTaskForDefaultName($task);
            $task.find(".task-color").css("background-color", task.taskColor);//addClass(this.getTaskStatusColorFromHexValue(task.taskColor));
            $task.find(".fullkit-color").css("background-color", task.taskColor);
            this.setTooltip(task);
            this.setToolTipOfWIPLimitImage($task);
        },

        setAutolinkButonText: function($task, task){
            var str = task.isAutolinked ? DISABLE_AUTOLINK : ENABLE_AUTOLINK;
            
            $task.find(".fk-autolink div").text(str);
        },
        subtaskGroupedByStreamAndOrderedBySequence : function(task){
            task.subtasks = _.sortBy(task.subtasks, function(subtask){
                return parseInt(subtask.order);
            });
            var subtasksGroupedByStreams = _.groupBy(task.subtasks, function(subtask){
                return subtask.streamId;
            });

            var sortedStreams = _.sortBy(task.subtaskStreams, "streamPriority");

            var orderedSubtasks = [];
            _.each(sortedStreams, function(stream){
                var subtasksSortedByOrderInsideStream = _.sortBy(subtasksGroupedByStreams[stream.streamId], function(subtask){
                    return parseInt(subtask.order);
                });
                orderedSubtasks = orderedSubtasks.concat(subtasksSortedByOrderInsideStream);
            });
            return orderedSubtasks;
        },

        handleSubtaskBlock: function() {
            var $task = this.$el;
            var task = this.task;
            var subtaskType = task.subtaskType;
            var isSubTaskTypeStream = (subtaskType == SubtaskTypesEnum.STREAMS);
            if (this.isSubtaskEnabled) {
                $task.find(".subtasks li.subtask:not(.proto-subtask)").remove();
                $task.find(".subtasks li.subtask-separator").remove();
                //Set WIP Limit Value
                if (task.subtasksWIPLimit <= 0) {
                    task.subtasksWIPLimit = stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT');
                }
                $task.find(".subtask-type .WIP_Limit_textbox").val(task.subtasksWIPLimit);
                $task.find(".subtask-type .STREAM_RATE_textbox").val(task.subtaskStreamRate);
                $task.find(".subtask-type .STREAM_OFFSET_textbox").val(ValidationClassInstance.getValidDurationString(task.subtaskStreamOffset,TASK_DURATION_DEFAULT_STR,false));
                
                task.remainingSubtasks = 0;
                var $listItemTemplate = $("#templates li[data-role=subtask-template]"),
                    $newItemPlaceholder = $task.find("li.proto-subtask");
                //var $listItemSeparator = $("#templates li.subtask-separator-line");
                var subtasks;
                if (isSubTaskTypeStream){
                    subtasks = this.subtaskGroupedByStreamAndOrderedBySequence(task);
                    var counter = 1;
                    _.each(subtasks, function(subtask){
                        subtask.order = counter++;
                    });
                } else {
                    subtasks = _.sortBy(task.subtasks, function(subtask){
                        return subtask.order;
                    });
                }

                for (var i = 0; i < subtasks.length; i++) {
                    var item = subtasks[i],
                        showSubtask = (this.includeCompletedSubtask) ? true : !item.complete;
                    var isSeparatorAlreadyPresent = $task.find(".subtask-separator");
                    var isSeparatorReqd = isSubTaskTypeStream && ((isSeparatorAlreadyPresent.length == 0 && i == 0) || (i > 0 && item.streamId != subtasks[i-1].streamId))
                    if (isSeparatorReqd){
                        var foundStream = _.find(task.subtaskStreams, function(stream){
                                                return stream.streamId == item.streamId;
                                            })
                        var $listItemSeparator = this.getStreamSeparatorElement(foundStream);

                        $newItemPlaceholder.before($listItemSeparator);

                    }
                    if (isSubTaskTypeStream){
                        var showSubtasksOfStream = this.isStreamExpanded(item);
                    }
                    if (showSubtask) {
                        var $newLi = $listItemTemplate.clone(true).removeClass("proto-subtask").removeAttr("data-role");
                        $newLi.find(".subtask-name textarea").removeClass("placeholdersjs");
                        this.bindSubtask($newLi, item);
                        $newItemPlaceholder.before($newLi);

                        function subtaskNameTextAreaHeight($newLi) {
                            window.setTimeout(function() {
                                var height = $newLi.find(".subtask-name textarea")[0].scrollHeight;
                                if (height != 0)
                                    $newLi.find(".subtask-name textarea").height(height);
                            }.bind($newLi), 1);
                        }
                        subtaskNameTextAreaHeight($newLi);
                        if (isSubTaskTypeStream && !showSubtasksOfStream){
                            $newLi.hide();
                        }
                    }
                    if (item.status != "CO") {
                        task.remainingSubtasks++;
                    }
                }
                var topPriorityStream = _.find(this.task.subtaskStreams, function(subtaskStream){
                    return subtaskStream.streamPriority == 1;
                });
                if (topPriorityStream){
                    if (typeof(topPriorityStream.isExpandedState) == "undefined"){
                        var $firstSeparator = this.$el.find(".subtask-separator");
                        if ($firstSeparator.length > 0){
                            $($firstSeparator[0]).find(".stream-header-expand").trigger("click");
                        }
                        
                    }
                }
                
                task.subtaskCount = subtasks.length;
                this.refreshRemainingSubtasksIndicator();
                //$task.find(".subtasks ul").sortable("update");
                
                
                if(!task.subtaskType && task.subtaskCount == 0){
                    //this.setDefaultSubtaskTypeAndWIPLimit();
                }
                this.bindSubtaskHeaderButtons($task);
                this.bindSubtaskTypeSpecificProperties();
                this.$el.find(".subtasks li .subtask-checklist-icon").off().on("click", function (evt) {
                    if(window.currentViewId == "timeline" || window.currentViewId == "chainview"){
                        if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                            Ext.getCmp('chainview').showChecklistPopupForSubtask($(evt.target).closest("li"));
                        else
                            Ext.getCmp('timelineview').showChecklistPopupForSubtask($(evt.target).closest("li"));
                    }else
                        $(".matrix-view").data("view").showChecklistPopupForSubtask($(evt.target).closest("li"));
                    evt.stopPropagation();
                });
            } else {
                this.refreshRemainingSubtasksIndicator();
                $task.find(".subtasks").hide();
                //$task.find(".subtask-type select").hide();
            }
        },
        isStreamExpanded: function(subtask){
            var stream = _.find(this.task.subtaskStreams, function(subtaskStream){
                return subtaskStream.streamId == subtask.streamId;
            });
            return stream.isExpandedState;
        },
        selectAllSubtasks:function(ckbox){
            var $task = this.$el;
            if(ckbox[0].checked){
                $task.find(".subtasks li").find("[name=subtask-checkbox]").prop('checked', true);
            }else{
                $task.find(".subtasks li").find("[name=subtask-checkbox]").prop('checked', false);
            }
        },
        selectSubtasksOfStream: function(evt, $liElement){
            var $li = evt ? $(evt.target).closest("li") : $liElement;
            var isChecked = evt.target.checked;
            while(!$li.next("li").hasClass("subtask-separator")){
                var $elem = $li.next("li");
                if ($elem.hasClass("subtask") && !$elem.hasClass("proto-subtask")){
                    if (isChecked){
                        $elem.find("[name=subtask-checkbox]").prop('checked', true);
                        if(!$elem.hasClass("selected")){
                            $elem.addClass("selected");
                        }
                        
                    } else {
                        $elem.find("[name=subtask-checkbox]").prop('checked', false);
                        if($elem.hasClass("selected")){
                            $elem.removeClass("selected");
                        }
                    }
                    
                }
                $li = $elem;
                if ($elem.hasClass("proto-subtask")){
                    break;
                }
            }
        },
        selectAllSubtasksOfTheStream: function(evt, movementType){
            var $li = $(evt.target).is("li") ? $(evt.target) : $(evt.target).closest("li");
            var $taskElement = $(this).closest(".task");
            var task = $taskElement.data("model");
            var taskView = $taskElement.data("view");
            if ($li.hasClass("subtask-separator")){
                this.selectSubtasksOfStream(null, $li);
            } 
            if (!$(evt.target).is("li")){
                if ($(evt.target).hasClass("stream-header-singlemoveup")){
                    while(!$li.next("li").hasClass("subtask-separator")){
                        var $elem = $li.next("li");
                        if ($elem.hasClass("subtask") && !$elem.hasClass("proto-subtask")){
                            
                            if (!$elem.find("[name=subtask-checkbox]").prop('checked')){
                                $elem.find("[name=subtask-checkbox]").prop('checked', true);
                                $elem.addClass("selected");
                            } 
                            
                        }
                        $li = $elem;
                        if ($elem.hasClass("proto-subtask")){
                            break;
                        }
                    }


                    stl.app.ProjectDataFromServer.increaseSelectedStreamPriorities(null, taskView.getStreamIdsofSelectedSubtasks($taskElement.find(".subtasks .selected")), task);
                } else {
                    while(!$li.next("li").hasClass("subtask-separator")){
                        var $elem = $li.next("li");
                        if ($elem.hasClass("subtask") && !$elem.hasClass("proto-subtask")){
                            
                            if (!$elem.find("[name=subtask-checkbox]").prop('checked')){
                                $elem.find("[name=subtask-checkbox]").prop('checked', true);
                                $elem.addClass("selected");
                            } 
                            
                        }
                        $li = $elem;
                        if ($elem.hasClass("proto-subtask")){
                            break;
                        }
                    }


                    stl.app.ProjectDataFromServer.decreaseSelectedStreamPriorities(null, taskView.getStreamIdsofSelectedSubtasks($taskElement.find(".subtasks .selected")), task);
                }
                taskView.handleSubtaskBlock();
            }
            

        },
        reorderSubtasks: function(){
            var task = this.task;
            var subtasks = this.subtaskGroupedByStreamAndOrderedBySequence(task);
            var counter = 1;
            _.each(subtasks, function(subtask){
                subtask.order = counter++;
            });

        },
        moveStreamsToTopOrBottom: function($liElement, movementDirection){
            var $taskElement =  this.$el;
            var taskView = this;
            var task = this.task;
            if ($taskElement.find(".subtask-stream-checkbox:checkbox:checked").length == 0){
                this.selectSubtasksOfStream(null, $liElement);
            }
            if (movementDirection == "TOP"){
                stl.app.ProjectDataFromServer.moveStreamsToTop(taskView.getStreamIdsofSelectedSubtasks($taskElement.find(".subtasks .selected")), task);
            } else {
                stl.app.ProjectDataFromServer.moveStreamsToBottom(taskView.getStreamIdsofSelectedSubtasks($taskElement.find(".subtasks .selected")), task);
            }

            this.handleSubtaskBlock();
            
        },

        moveHandlerOfStreams: function(evt){
            var taskView = $(evt.target).closest(".task").data("view");
            if ($(evt.target).hasClass("stream-header-singlemoveup")){
                taskView.selectSubtasksAndMove(evt, $(evt.target).closest("li"), "UP");
            } else {
                taskView.selectSubtasksAndMove(evt, $(evt.target).closest("li"), "DOWN");
            }
            if (typeof evt.stopPropagation == "function") {
                evt.stopPropagation();
            } else {
                evt.cancelBubble = true;
            }
        },

        selectSubtasksAndMove: function(evt, $liElement, movementDirection){
            var $li = $liElement;
            if (this.$el.find(".subtask-stream-checkbox:checkbox:checked").length == 0){
                while(!$li.next("li").hasClass("subtask-separator")){
                    var $elem = $li.next("li");
                    if ($elem.hasClass("subtask") && !$elem.hasClass("proto-subtask")){
                        
                        if (!$elem.find("[name=subtask-checkbox]").prop('checked')){
                            $elem.find("[name=subtask-checkbox]").prop('checked', true);
                            $elem.addClass("selected");
                        } 
                        
                    }
                    $li = $elem;
                    if ($elem.hasClass("proto-subtask")){
                        break;
                    }
                }
            }
            
            if (movementDirection == "UP"){
                stl.app.ProjectDataFromServer.increaseSelectedStreamPriorities(null, this.getStreamIdsofSelectedSubtasks(this.$el.find(".subtasks .selected")), this.task);
            } else if (movementDirection == "DOWN"){
                stl.app.ProjectDataFromServer.decreaseSelectedStreamPriorities(null, this.getStreamIdsofSelectedSubtasks(this.$el.find(".subtasks .selected")), this.task);
            }
            this.handleSubtaskBlock();
        },

        getExtensionMenuForStreams: function(evt){
            var me = this;
            var $li = $(evt.target).closest("li");
            if (stl.app.readOnlyFlag) {
                return;
            }
            var $menu = this.$checkinMenu;
            if (!$menu) {
                $(document.body).children(".extensionMenu-popup").remove();
                $menu = this.$checkinMenu = $(".page-header-top .input-group").find(".tool-popup").clone(true);
                $(document.body).append($menu);
            }
            $menu.empty();

            function createMenuItem(text, cssClasses) {
                var $item = $([
                    '<div class="tool-item">',
                        '<label>',
                            text,
                        '</label>',
                    '</div>'].join(""));
                if (cssClasses) {
                    $item.addClass(cssClasses);
                }
                return $item;
            }

            var $menuItem1 = createMenuItem("Move Up");
            $menuItem1.off("click")
            if(!$menuItem1.hasClass('disabled'))
                $menuItem1.on("click", function (evt) {
                    //CutTasksClicked();
                    me.selectSubtasksAndMove(evt, $li, "UP");
                    $menu.hide();
                    });

            $menu.append($menuItem1);
            var $menuItem2 = createMenuItem("Move Down");
            $menuItem2.off("click")
            if(!$menuItem2.hasClass('disabled'))
                $menuItem2.on("click", function (evt) {
                    //CopyTasksClicked();
                    me.selectSubtasksAndMove(evt, $li, "DOWN");
                    $menu.hide();
                    });

            $menu.append($menuItem2);
            var $menuItem3 = createMenuItem("Move To Top");
            $menuItem3.off("click")
            if(!$menuItem3.hasClass('disabled'))
                $menuItem3.on("click", function (evt) {
                    //DeleteTasksClicked();
                    me.moveStreamsToTopOrBottom($li, "TOP");
                    $menu.hide();
                    });

            $menu.append($menuItem3);

            var $menuItem4 = createMenuItem("Move To Bottom");
            $menuItem4.off("click")
            if(!$menuItem4.hasClass('disabled'))
                $menuItem4.on("click", function (evt) {
                    //DeleteTasksClicked();
                    me.moveStreamsToTopOrBottom($li, "BOTTOM")
                    $menu.hide();
                    });

            $menu.append($menuItem4);
            
            return $menu;    
        },
        populateSubtasksInfoForUndo: function(subtask, index, subtasks){
            subtasks.push({
                "subtask" : subtask,
                "index" : index
            });
        },
        getMaxPriorityForStreams: function(){
            var me = this;
            var $task = me.$el;
            var task = $task.data("model");
            var highestPriority = 0;
            if (task.subtaskStreams && task.subtaskStreams.length > 0){
                var listSortedByPriority = _.sortBy(task.subtaskStreams, function(stream){ return stream.streamPriority;});
                highestPriority = listSortedByPriority[listSortedByPriority.length - 1].streamPriority;
            }
            return highestPriority;

        },
        getMaxUidForStreams: function(){
            var me = this;
            var $task = me.$el;
            var task = $task.data("model");
            var highestId = 0;
            if (task.subtaskStreams && task.subtaskStreams.length > 0){
                var listSortedById = _.sortBy(task.subtaskStreams, function(stream){ return stream.streamId;});
                highestId = listSortedById[listSortedById.length - 1].streamId;
            }
            return highestId;

        },
        createStreamClick: function(){
            if (this.readonly) return;
            var me = this;
            var sel = this.$el.find(".subtasks li.selected");
            var isSubtaskSelected = sel && sel.length > 0;
            var stream = this.createNewStream();
            if (isSubtaskSelected){
                var subtaskModels = [];
                me.cutSubtasksClick();
                subtaskModels = stl.app.pasteFromInternalClipboard();
                _.each(subtaskModels, function(model){
                    me.updateStreamIdWithNewStreamId(model, stream.streamId);
                })
                me.pasteSubtasksClick(null, subtaskModels);
            } else {
                var $li = me.$el.find(".proto-subtask");
                $(this.getStreamSeparatorElement(stream)).insertBefore($li);
                me.renderNewSubtask($li,stream.name + "." + DEFAULT_STREAM_SUBTASK_NAME,false,true,null, stream.streamId, true);
            }
            

        },
        createNewStream: function(){
            var me = this;
            var $task = me.$el;
            var task = this.task;
            var projectUID = stl.app.ProjectDataFromServer.uid;
            var streamConfig = {
                projectId: projectUID,
                taskId: task.uid,
                streamId: me.getMaxUidForStreams() + 1,
                streamPriority: me.getMaxPriorityForStreams() + 1
            }
            var stream = stl.app.ProjectDataFromServer.createStream(streamConfig);
            if (!task.subtaskStreams){
                task.subtaskStreams = [];
            }
            task.subtaskStreams.push(stream);
            return stream;
        },
        deleteStreamClick: function(){
            if (this.readonly) return;
            var $task = this.$el;
            var sel = $task.find(".subtasks li.selected");
            var task = $task.data("model");
            if (sel.length > 0){
                var selectedStreamIds = this.getSelectedStreamIds(sel);
                stl.app.ProjectDataFromServer.deleteStreams(selectedStreamIds, task);
                this.deleteSubtasksClick(null, selectedStreamIds);
            } else {
                return;
            }
            $task.data("view").handleSubtaskBlock();
        },
        getSelectedStreamIds: function(sel){
            var selectedItemsGroupedByStreamId = _.groupBy(sel, function(item){
                return $(item).data("model").streamId;
            })
            return Object.keys(selectedItemsGroupedByStreamId);
        },

        getSubtaskIndex: function($subtask){
            var $parentElement = $subtask.closest("ul");
            var subtaskId = $subtask.data("model").id;
            var index = 0;
            var found = false;
            _.each($parentElement.children(), function(child){
                if (found) return;
                if ($(child).data("model")){
                    if($(child).data("model").id == subtaskId){
                        found = true;
                    } else {
                        index++;
                    }
                }
            });
            return index;
        },

        getCutStreamNamesById: function(obj){
            var models = obj.subtask_models;
            var CutStreamIds = Object.keys(_.groupBy(models, function(model){
                return model.streamId;
            }));
            var returnObj = {},
            me = this;
            _.each(CutStreamIds, function(streamId){
                returnObj[streamId] = _.find(me.task.subtaskStreams, function(stream){
                    return stream.streamId == streamId;
                });
            });
            return returnObj;
        },

        cutSubtasksClick:function(){
            var me = this;
            var $task = me.$el;
            var task = $task.data("model");
            var obj = this.getSelectedSubtaskElsAndModels();

            var isStreamSelectorSelected = $task.find(".subtasks li.subtask-separator").find("input:checked");
            this.isStreamCopy = false;
            this.isStreamCut = false;
            if (isStreamSelectorSelected.length > 0){

                this.isStreamCut = true;
                this.cutStreamById = this.getCutStreamNamesById(obj);
            }

            if(obj.subtaskEls.length == 0)
                return;
            var subtasks = [];
            $(obj.subtaskEls).each(function() {
                //me.populateSubtasksInfoForUndo($(this).data("model"),$(this).index(), subtasks);
                me.populateSubtasksInfoForUndo($(this).data("model"),$(this).data("model").order, subtasks);
                me.deleteSubtaskFromModel($(this));
            });

            stl.app.undoStackMgr.pushToUndoStackForSubtaskDelete(me, task, subtasks);
            me.saveSubtasks($task);
            this.project.reCalculateSubTaskStartDate(task);        
            this.updateWIPLimitNotification(task, $task);
            $(this).trigger("deletesubtask", [ obj.subtaskModels, task ]);
            this.$el.trigger("rollupDurationChange");
            stl.app.copyToInternalClipboard(obj.subtaskModels,'subtask',false);
            if (this.isStreamCut){
                this.deleteStreamIfRequired();
            }
            
            this.handleSubtaskBlock();
        },
        copySubtasksClick:function(){
            var $task = this.$el;
            var subtask_models = this.getSelectedSubtaskElsAndModels().subtaskModels;
            var isStreamSelectorSelected = $task.find(".subtasks li.subtask-separator").find("input:checked");
            this.isStreamCopy = false;
            this.isStreamCut = false;
            if (isStreamSelectorSelected.length > 0){
                this.isStreamCopy = true;
            }
            if(subtask_models.length > 0)
                stl.app.copyToInternalClipboard(subtask_models,'subtask',true);
        },
        updateStreamIdWithNewStreamId: function(newRec, newStreamId){
            newRec.streamId = newStreamId;
        },
        getLastSubtaskElement: function(){
            var $liElements = this.$el.find(".subtask:not(.proto-subtask)");
            return $($liElements[$liElements.length - 1]);
        },
        createNewStreamsForRecs: function(recs, sel){
            var recsGroupedByStreamId = _.groupBy(recs, function(rec){
                return rec.streamId;
            });

            var lastSelectedItem = sel[sel.length -1];
            this.updatePriorityOfRestAffectedStreams($(lastSelectedItem), recsGroupedByStreamId);
            var startPriorityForPaste = _.find(this.task.subtaskStreams, function(stream){
                return stream.streamId == $(lastSelectedItem).data("model").streamId;
            }).streamPriority + 1;
            var me = this;
            var task = this.task;
            var returnObj = {};
            _.each(Object.keys(recsGroupedByStreamId), function(streamId){
                var projectUID = stl.app.ProjectDataFromServer.uid;
                var stream = _.find(me.task.subtaskStreams, function(stream){
                    return stream.streamId == streamId;
                });
                var streamName;
                if (stream){
                    streamName = stream.name;
                } else {
                    streamName = me.cutStreamById[streamId];
                }
                
                var streamConfig = {
                    projectId: projectUID,
                    taskId: task.uid,
                    name: streamName,
                    streamId: me.getMaxUidForStreams() + 1,
                    streamPriority: startPriorityForPaste++
                }
                var stream = stl.app.ProjectDataFromServer.createStream(streamConfig);
                if (!task.subtaskStreams){
                    task.subtaskStreams = [];
                }
                task.subtaskStreams.push(stream);
                returnObj[streamId] = stream.streamId;
            });
            me.cutStreamById = {};
            return returnObj;

        },
        updatePriorityOfRestAffectedStreams: function($item, recsGroupedByStreamId){
            var prevStreamPriority = _.find(this.task.subtaskStreams, function(stream){
                return stream.streamId == $item.data("model").streamId;
            }).streamPriority;
            var allPreviousStreams = _.filter(this.task.subtaskStreams, function(stream){
                return stream.streamPriority <= prevStreamPriority;
            });
            allPreviousStreams = _.sortBy(allPreviousStreams, "streamPriority");
            var allNextStreams = _.filter(this.task.subtaskStreams, function(stream){
                return stream.streamPriority > prevStreamPriority;
            });
            allNextStreams = _.sortBy(allNextStreams, "streamPriority");
            var startPriority = 1;
            _.each(allPreviousStreams, function(stream){
                stream.streamPriority = startPriority++;
            })

            startPriority = startPriority + Object.keys(recsGroupedByStreamId).length;
            _.each(allNextStreams, function(stream){
                stream.streamPriority = startPriority++;
            });

        },
        isStreamCutOrCopied: function(recs){
            var recsGroupedByStreamId = _.groupBy(recs, function(rec){
                return rec.streamId;
            });
            var task = this.task;
            var allSubTasksGroupedByStreamId = _.groupBy(task.subtasks, function(rec){
                return rec.streamId;
            });
            var res = false;
            _.each(Object.keys(recsGroupedByStreamId), function(streamId){
                if (!allSubTasksGroupedByStreamId[streamId] || allSubTasksGroupedByStreamId[streamId].length == 0 || allSubTasksGroupedByStreamId[streamId].length==recsGroupedByStreamId[streamId].length){
                    res = true;
                }
            });
            if (this.isStreamCut || this.isStreamCopy){
                return (this.isStreamCut) || (this.isStreamCopy); 
            } else {
               return false; 
            }
            
        },
        pasteSubtasksClick:function(evt, records){
            var me = this;
            var $task = this.$el;
            var recs = records ? records : stl.app.pasteFromInternalClipboard();
            var newRecs=[];
            var sel = records ? me.getLastSubtaskElement() : $task.find(".subtasks li.selected");
            var isSubtasktypeStream = this.task.subtaskType == SubtaskTypesEnum.STREAMS;
            var isStreamCutOrCopied = isSubtasktypeStream ? this.isStreamCutOrCopied(recs) : false;
            var newStreamIds = {};
            if (isStreamCutOrCopied){
                newStreamIds = this.createNewStreamsForRecs(recs, sel);
            }
            if(recs && recs.length > 0){
                for(var i=0; i<recs.length; i++){
                    var $li = me.$el.find(".proto-subtask");
                    
                    var newRec = {};
                    $.extend(true, newRec, recs[i]);
                    if (isSubtasktypeStream){
                        if (!records){
                            if (isStreamCutOrCopied){
                                me.updateStreamIdWithNewStreamId(newRec, newStreamIds[recs[i].streamId]);
                            } else {
                                me.updateStreamIdWithNewStreamId(newRec, $(sel[sel.length-1]).data("model").streamId);
                            }
                            
                        }
                        
                    }
                    if (isSubtasktypeStream && records){
                        me.renderNewSubtask($li,newRec,false,false,sel[sel.length-1], newRec.streamId, true);
                    } else if (isSubtasktypeStream){
                        me.renderNewSubtask($li,newRec,false,false,sel[sel.length-1], newRec.streamId, true);
                    } else {
                        me.renderNewSubtask($li,newRec,false,false,sel[sel.length-1], null, true);
                    }
                    
                    sel=[$li];
                    newRecs.push(newRec);
                }
                me.saveSubtasks($task);
                var subtaskInfo = [];
                var task = $task.data("model");
                newRecs.forEach(function(newRec){
                    var index = task.subtasks.indexOf(newRec);
                    me.populateSubtasksInfoForUndo(newRec, index, subtaskInfo);
                });
                stl.app.undoStackMgr.pushToUndoStackForSubtaskAdd(this, task, subtaskInfo);
                $task.trigger("rollupDurationChange");
                if (isStreamCutOrCopied){
                    this.handleSubtaskBlock();
                }
            }
        },
        deleteSubtasksClick:function(evt, arrStreamIds){
            var me = this;
            var $task = this.$el;
            var task = $task.data("model");
            var obj = this.getSelectedSubtaskElsAndModels(arrStreamIds);
            var subtaskType = this.task.subtaskType;
            var isSubTaskTypeStream = (subtaskType == SubtaskTypesEnum.STREAMS);
            var subtasks = [];
            $(obj.subtaskEls).each(function(){
                me.populateSubtasksInfoForUndo($(this).data("model"),$(this).data("model").order, subtasks);
                if (isSubTaskTypeStream){
                    if (me.getNextSeparator($(this)).hasClass("subtask-separator") && me.getPreviousSeparator($(this)).hasClass("subtask-separator")){
                        me.getNextSeparator($(this)).remove();
                    }
                }
                me.deleteSubtaskFromModel($(this));
            });
            
            stl.app.undoStackMgr.pushToUndoStackForSubtaskDelete(me, task, subtasks);
            me.saveSubtasks($task);
            this.project.reCalculateSubTaskStartDate(task);           
            this.updateWIPLimitNotification(task, $task);
            if (isSubTaskTypeStream){
                if (!arrStreamIds){
                    this.deleteStreamIfRequired();
                }
                
                this.handleSubtaskBlock();
            }
            
            $(this).trigger("deletesubtask", [ obj.subtaskModels, task ]);
            this.$el.trigger("rollupDurationChange");
        },
        removeExtraStreamSeparators: function(){
            if (this.task.subtaskType == SubtaskTypesEnum.STREAMS){
                if (this.task.subtasks.length == 0){
                    this.$el.find(".subtask-separator").remove();
                }
            } else {
                return;
            }
        },
        deleteStreamIfRequired: function(){
            var subtasksByStreamId = _.groupBy(this.task.subtasks, function(st){
                return st.streamId;
            });
            var toBeDeletedStreamIds = [];
            var finalListOfStreamIds = Object.keys(subtasksByStreamId);
            _.each(this.task.subtaskStreams, function(stream){
                if (finalListOfStreamIds.length == 0 || finalListOfStreamIds.indexOf(stream.streamId.toString()) < 0 ){
                    toBeDeletedStreamIds.push(stream.streamId);
                }
            });
            if (toBeDeletedStreamIds.length > 0){
                stl.app.ProjectDataFromServer.deleteStreams(toBeDeletedStreamIds, this.task);
                //this.handleSubtaskBlock();
            }
            
        },
        getPreviousSeparator: function($li){
            var noElem = false;
            if ($li.prev("li").hasClass("proto-separator")){
                return $li.prev("li").prev("li");
            } else {
                return $li.prev("li");
            }
        },
        getNextSeparator: function($li){
            if ($li.next("li").hasClass("proto-separator")){
                return $li.next("li").next("li");
            } else {
                return $li.next("li");
            }
        },
        getSelectedSubtaskElsAndModels:function(arrStreamIds){
            var $task = this.$el;
            var $sb=[];
            var subtask_models=[];
            var sb = arrStreamIds ? $task.find(".subtasks li:not(.proto-subtask)") : $task.find(".subtasks li:not(.proto-subtask)").find("[name=subtask-checkbox]:checked");
            sb.each(function(){
                
                var $li = arrStreamIds ? $(this) : $(this).parent().parent();
                if ($li.hasClass("proto-separator") || $li.hasClass("subtask-separator")) return;
                var sm = $li.data("model");
                if (arrStreamIds){
                    if (arrStreamIds.indexOf(sm.streamId.toString()) > -1){
                        subtask_models.push(sm);
                        $sb.push($li);
                    }
                } else {
                    subtask_models.push(sm);
                    $sb.push($li);
                }
                
            });
            return {
                "subtaskEls":$sb,
                "subtaskModels":subtask_models
            }
        },
        bindSubtaskHeaderButtons:function($task){
            var header = $task.find(".subtasks-header");
            var ckbox = header.find("[name=subtask-header-checkbox]");
            var me = this;
            ckbox.off().on('click', this.selectAllSubtasks.bind(this,ckbox));

            var cut = header.find(".subtask-header-cut");
            cut.off().on('click', this.cutSubtasksClick.bind(me));

            var copy = header.find(".subtask-header-copy");
            copy.off().on('click',this.copySubtasksClick.bind(me));

            var paste = header.find(".subtask-header-paste");
            paste.off().on('click', this.pasteSubtasksClick.bind(me));

            var del = header.find(".subtask-header-delete");
            del.off().on('click', this.deleteSubtasksClick.bind(me));

            var createStream = header.find(".subtask-header-createStream-icon");
            createStream.off().on('click', this.createStreamClick.bind(me));

            var deleteStream = header.find(".subtask-header-deleteStream-icon");
            deleteStream.off().on('click', this.deleteStreamClick.bind(me));
        },
	    setTooltip: function (task) {
            this.$el.attr('data-qtip',task.name);
        },

        setToolTipOfWIPLimitImage: function($task){
            $task.find(".imgWIP").attr('title',NUMBER_OF_IP_TASKS_EXCEED_WIP_LIMIT);            
        },

	    updateChecklistStatus: function(task){
            task.checklistStatus = 0;
            var checklistItems = task.checklistItems;
            if(checklistItems.length > 0 ){
                var overAllChecklistStatus = 0; //can be 0-no checklist, 1 -few checklists complete, 2-all checklist complete
                var completedItems = 0;
                var allComplete = true;
                checklistItems = checklistItems.map(function(checklist, index) {
                    overAllChecklistStatus = 1;
                    if (!checklist.complete)
                        allComplete = false;
                    else
                        completedItems++;
                    checklist.order = index;
                    return checklist;
                });
                if ((overAllChecklistStatus == 1 & allComplete == true))
                    overAllChecklistStatus = 2;
                task.checklistStatus = overAllChecklistStatus;
            }
        },

        /*getTaskStatusColorFromHexValue:function(hexColor){
            switch(hexColor.replace("#","").trim().toUpperCase()){
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
        },*/
        

        addClassForTaskStatus: function ($task) {
            switch(this.task.status){
                case "NS":
                    $task.removeClass("RL");
                    $task.removeClass("IP");
                    $task.removeClass("CO");
                    $task.addClass("NS");
                    break;
                case "IP": 
                    $task.removeClass("RL");
                    $task.removeClass("NS");
                    $task.removeClass("CO");
                    $task.addClass("IP");
                    break;
                case "RL": 
                    $task.removeClass("IP");
                    $task.removeClass("NS");
                    $task.removeClass("CO");
                    $task.addClass("RL");
                    break;
                case "CO": 
                    $task.removeClass("RL");
                    $task.removeClass("IP");
                    $task.removeClass("NS");
                    $task.addClass("CO");
                    break;
                }
        },

        disableOrEnableTaskField: function  ($task, findClass, disable) {
            $task.find(findClass).prop('disabled', disable);
        },
        enableOrDisableExpectedFinishDate: function ($task) {
            
            if (this.readOnly) {
               return; 
            }
            
            var findClass = ".expectedFinishDate input";
            switch(this.task.status){
                case STATUS_NS: 
                case STATUS_CO: 
                    this.disableOrEnableTaskField($task,findClass,true);
                    break;
                case STATUS_IP: 
                case STATUS_RL: 
                    this.disableOrEnableTaskField($task,findClass,false);
                    break;
                }
        },
        enableOrDisablePullInDuration: function ($task) {
            if (this.readOnly) {
               return; 
            }
            var findClass = ".pullInFullKitDateBy input";
            switch(this.task.status){
                case STATUS_NS: 
                    this.disableOrEnableTaskField($task,findClass,false);
                    break;
                case STATUS_IP: 
                case STATUS_RL: 
                case STATUS_CO: 
                    this.disableOrEnableTaskField($task,findClass,true);
                    break;
                }

        },

        showSubtasksRegion: function($task){
            var subtasksRegion = $task.find(".subtasks");
            if(!subtasksRegion.is(":visible") && this.insertBefore !== INSERT_TASK_BEFORE_TIMELINE_VIEW)
                subtasksRegion.show();
        },

        hideSubtasksRegion: function($task){
            var subtasksRegion = $task.find(".subtasks");
            if( subtasksRegion.is(":visible"))
                 subtasksRegion.hide();
        },

        onTaskZoomClick: function(evt) {
            ConwebPopOverInstance.destroyPopOver();
            if (this.task.bufferType !== "None") return;
            
            this.initializeTaskQuickEditMode(this.$el);
            this.initializeTaskZoomMode(this.$el);
            if (this.$el.hasClass("quick-task-edit")) {
                this.$el.removeClass("quick-task-edit");
            }
            if(!this.$el.hasClass("task-zoom-normal")) {
                this.rollUpDurationUpdate();
            } else {
                this.hideHelpIcons();
            }
            
            $(this).trigger("zoom", [ evt ]);
            
            
            //$(this).trigger("change");
            evt.stopPropagation();
        },
        pasteSubtasksCallbk:function(pasteItems){
            var me = this;
            var newRecs = [];
            var sel = this.$el.find(".subtasks li.selected");
            for (var i = 0; i < pasteItems.length; i++) {
	           //Dont Paste subtasks with no name
                if (pasteItems[i].trim() != "") {
                    var $li = this.$el.find(".proto-subtask");
                    
                    if (sel.length > 0){
                        if (this.task.subtaskType == SubtaskTypesEnum.STREAMS){
                            var streamId = $(sel[sel.length - 1]).data("model").streamId;
                            var subtask = this.renderNewSubtask($li, pasteItems[i],false,true, sel, streamId, true);
                        } else {
                            var subtask = this.renderNewSubtask($li, pasteItems[i],false,true, sel, null, true);
                        }
                    } else {
                        var subtask = this.renderNewSubtask($li, pasteItems[i],false,true);
                    }
                    

                    
                    newRecs.push(subtask);
                }
            }
            var subtaskInfo = [];
            var task = this.task;
            newRecs.forEach(function(newRec){
                var index = task.subtasks.indexOf(newRec);
                me.populateSubtasksInfoForUndo(newRec, index, subtaskInfo);
            });
            stl.app.undoStackMgr.pushToUndoStackForSubtaskAdd(this, task, subtaskInfo);

        },
        initializeTaskZoomMode: function($task) {
            var task = this.task;
            var $taskMangerInput = $task.find(".task-manager input");
            var $taskParticipantInput = $task.find(".task-participants input");
            var $taskTypeSelect = $task.find(".task-type select");
            var $subtaskTypeSelect = $task.find(".subtask-type select");
            if (!this.initializedTaskZoomMode) {
                $taskMangerInput.select2({
                        placeholder: TBD_PLACEHOLDER,
                        allowClear: true,
                        dropdownAutoWidth: true,
                        query: this.managerDropDownQuery.bind(this),
                        initSelection: this.managerDropDownInitSelection.bind(this)
                    })
                    .on("change", this.onGenericTaskPropertyInputChange.bind(this, "manager"));
                $taskParticipantInput.select2({
                        multiple: true,
                        placeholder: TBD_PLACEHOLDER,
                        dropdownAutoWidth: true,
                        query: this.participantsDropDownQuery.bind(this),
                        initSelection: this.participantsDropDownInitSelection.bind(this)
                    })
                    .on("change", this.onGenericTaskPropertyInputChange.bind(this, 'participants'));
                $taskTypeSelect.select2({
                        dropdownAutoWidth: true,
                        minimumResultsForSearch: -1
                    })
                    .on("change", this.onTaskTypeChange.bind(this));

                $subtaskTypeSelect.select2({
                        dropdownAutoWidth: true,
                        minimumResultsForSearch: -1
                    })
                    .on("change", this.onTaskSubtaskTypeChange.bind(this));

            }
            //load values
            $taskMangerInput.select2("val", task.manager);
            if(task.participants.length > 0)
                $taskParticipantInput.select2("val", task.participants || []);

            $taskTypeSelect.select2("val", task.taskType);

            $subtaskTypeSelect.select2("val", task.subtaskType);

            this.initializedTaskZoomMode = true;
        },

        onTaskAddButtonClick: function(evt) {
            if (this.$el.hasClass("quick-task-edit")) {
                this.$el.removeClass("quick-task-edit");
                this.exitQuickEditMode();
            }

            if (stl.app.matrixView.multipleSelectedTasks && (stl.app.matrixView.TasksCut || stl.app.matrixView.TasksCopied)){
                stl.app.matrixView.onNewTaskPlaceholderClickDelegate(evt);
            } else {
                $(this).trigger("addTask", [evt]);
            }
        },
        onTaskIconMousedown: function(evt) {
            // Only handling this event because zoom icon overlays task name which is a drag handle; must
            // cancel mousedown on zoom/trash icons so drag doesn't start
            evt.stopPropagation();
        },

        getResourceRollupMsgString: function (message, rolledUpResources) {
            var noOfResourceRolledUp = rolledUpResources.length;
            var updatedResource;
            for (var i = 0; i < noOfResourceRolledUp - 1; i++) {
                updatedResource = rolledUpResources[i];
                message = message + updatedResource.name + "(" + updatedResource.oldUnits +" - " + updatedResource.units + "), ";
            };

            updatedResource = rolledUpResources[noOfResourceRolledUp - 1];
            message = message + updatedResource.name + "(" + updatedResource.oldUnits +" - " + updatedResource.units + ")";
            return message;
        },
        getResourceRollupMsgArray: function (rolledUpResources, addResourceMsg, updateResourceMsg) {
            var messages = [];
            _.each(rolledUpResources, function (rolledUpResource) {
                var resourceMsgStr;
                if(rolledUpResource.oldUnits == 0) {
                    resourceMsgStr = getStringWithArgs(addResourceMsg, rolledUpResource.name, rolledUpResource.units);
                } else {
                    resourceMsgStr = getStringWithArgs(updateResourceMsg, rolledUpResource.name, rolledUpResource.oldUnits, rolledUpResource.units);
                }
                messages.push(resourceMsgStr);
            });
            return messages;
        },
        onResourceWarningIconClick: function(evt){
            //console.log(evt);
            var taskModel = this.task;
            var options = this.getPopOverOptions();

            var resourceWarningMessage = ROLLUP_RESOURCE_WARNING_MSG;

            // resourceWarningMessage = this.getResourceRollupMsgString(taskModel.resourceViolationData.data);
            options.confirmationMessage = ROLLUP_RESOURCE_WARNING_CONFIRMATION_MSG;
            options.isHeaderInfoPresent = true;
            options.popoverInnerContentHeader = ROLLUP_RESOURCE_WARNING_HEADER_MSG;
            options.messages = this.getResourceRollupMsgArray(taskModel.resourceViolationData.data, ROLLUP_RESOURCE_ADDED_WARNING_MSG, ROLLUP_RESOURCE_UPDATED_WARNING_MSG);
            options.showByEl= evt.target;
            options.oKClbk = this.changeRollUpResourcesClbk.bind(this);
            ConwebPopOverInstance.setAndShowWarningPopOver(options);
        },
        changeRollUpResourcesClbk: function(){
            var me = this,
            $task = this.$el,
            task = this.task;

            me.project.updateTaskResourcesFromRollupData(task.resourceViolationData.data, task);
            me.taskResourcePicker.setValue(task.resources);
            task.resourceViolationData = undefined;
            me.resourceWarningIconEle.hide();
            me.handleTaskResourceChange(task, $task);
        },
        onResourceInfoIconClick: function(evt){
            //console.log(evt);
            var taskModel = this.task;

            var options = this.getPopOverOptions();
            
            var resourceInfoMessage = ROLLUP_RESOURCE_INFO_MSG;

            // resourceInfoMessage = this.getResourceRollupMsgString(taskModel.resourceInfoData.data);
            options.isHeaderInfoPresent = true;
            options.popoverInnerContentHeader = ROLLUP_RESOURCE_INFO_HEADER_MSG;
            options.messages = this.getResourceRollupMsgArray(taskModel.resourceInfoData.data, ROLLUP_RESOURCE_ADDED_INFO_MSG, ROLLUP_RESOURCE_UPDATED_INFO_MSG);
            options.showByEl= evt.target;
            options.cancelClbk = this.clearResourceInfoData.bind(this);
            ConwebPopOverInstance.setAndShowInfoPopOver(options);
        },

        clearResourceInfoData: function () {
            var taskModel = this.task;

            taskModel.resourceInfoData = undefined;
            this.hideResourceInfoIcon();
        },
        rollUpBtnHandler: function () {
            var me = this,
                $task = me.$el,
                taskModel = me.task;
            if (taskModel.subtasks.length == 0) return;
            if(taskModel.durationViolationData && taskModel.remainingDuration != taskModel.durationViolationData.data) {
                if(taskModel.remainingDuration > taskModel.durationViolationData.data) {
                    me.showDurationInfoIcon();
                }
                me.hideDurationWarningIcon();
                me.handleTaskDurationChange(taskModel, taskModel.durationViolationData.data);
            }
            me.showhideResourceInfoIcon(taskModel);

            
        },
		onDurationWarningIconClick: function(evt){
            //console.log(evt);
            var taskModel = this.task;

            var options = this.getPopOverOptions();

            var currentRemainingDuration = ValidationClassInstance.getValidDurationString(taskModel.remainingDuration,TASK_DURATION_DEFAULT_STR,false);
            var suggestedRemainingDuration = ValidationClassInstance.getValidDurationString(taskModel.durationViolationData.data,TASK_DURATION_DEFAULT_STR,false);

            var durationWarningMsg = getStringWithArgs(ROLLUP_DURATION_WARNING_MSG, currentRemainingDuration, suggestedRemainingDuration); 
            
            // options.messages = [durationWarningMsg];
            options.confirmationMessage = durationWarningMsg + getStringWithArgs(ROLLUP_DURATION_WARNING_CONFIRMATION_MSG, suggestedRemainingDuration);
            options.showByEl= evt.target;
            options.oKClbk = this.updateTaskDurationOnWarningOk.bind(this);

            ConwebPopOverInstance.setAndShowWarningPopOver(options);
        },
        updateTaskDurationOnWarningOk: function(){
                var me = this,
                $task = me.$el,
                taskModel = me.task;

                me.durationWarningIconEle.hide();
                me.handleTaskDurationChange(taskModel, taskModel.durationViolationData.data);
                taskModel.durationViolationData = undefined;
        },
        onDurationInfoIconClick: function(evt){
            //console.log(evt);
            var taskModel = this.task;
            var options = this.getPopOverOptions();

            var currentRemainingDuration = ValidationClassInstance.getValidDurationString(taskModel.remainingDuration,TASK_DURATION_DEFAULT_STR,false);
            var durationInfoMsg = getStringWithArgs(ROLLUP_DURATION_INFO_MSG, currentRemainingDuration); 
            
            options.isHeaderInfoPresent = true;
            options.popoverInnerContentHeader = durationInfoMsg;
            options.showByEl= evt.target;
            options.cancelClbk = this.hideDurationInfoIcon.bind(this);
            ConwebPopOverInstance.setAndShowInfoPopOver(options);
        },

        getPopOverOptions: function(){
          return  {
            title:"Conweb Pop over",
            placement:"right",
            okButtonText:POPOVER_OK_BUTTON_TEXT,
            cancelButtonText:POPOVER_CANCEL_BUTTON_TEXT}
        },
        
        saveNameField: function(val) {

            var oldTaskName = this.task.name;
            this.task.name = val;
            if (oldTaskName !== val && multipleORs(this.task.taskType, TASKTYPE_FULLKIT, TASKTYPE_PT)  && this.project.isIDCCed) {
                Ext.getCmp('CCSummarygrid').UpdateFullKitNameInCCSummary(this.task);
            }
            this.setTooltip(this.task);

        },

         
         saveStatusField: function($task) {
            if (this.task.taskType != "fullkit"){
                this.task.status = $task.find(".task-status select").select2("val");
            }
             this.setQuickEditStatusBox($task);

         },

         saveResourceField: function($task) {
            this.task.resources = $task.find(".task-resources .input-field").data("resourcePicker").getValue();

         },
         saveManagerField:function($task) {
            this.task.manager = $task.find(".task-manager input").select2("val");
         },
         saveParticipantField: function($task) {
            this.task.participants = $task.find(".task-participants input").select2("val");
         },
        
        

         saveSubtasks: function($task) {
            var me= this;
            this.task.subtasks = [];
            this.task.remainingSubtasks = 0;
            var indexOfSubtasks = 0;
            $task.find(".subtasks > ul > li:not(.proto-subtask)").each(function(index, li) {
                var $li = $(li);
                if(!$li.hasClass("subtask-separator") && !$li.hasClass("proto-separator")){

                    var subtask = $li.data('model');
                    if (subtask){
                        me.saveSubtask($li);
                        if (subtask.status !== "CO") {
                            me.task.remainingSubtasks++;
                        }
                        subtask.order = indexOfSubtasks++;
                        me.task.subtasks.push(subtask);
                    }
                    
                }
                

            });
            this.task.subtaskCount = this.task.subtasks.length;
            this.refreshRemainingSubtasksIndicator();

         },

         saveWIPLimitField:function($task){
            var me = this;
            me.task.subtasksWIPLimit = $task.find(".subtask-type .WIP_Limit_textbox").val();
         },

         saveStreamRateField: function($task){
            var me = this;
            me.task.subtaskStreamRate = $task.find(".subtask-type .STREAM_RATE_textbox").val();
         },

         saveStreamOffsetField: function($task, parsedVal){
            var me = this;
            me.task.subtaskStreamOffset = parsedVal;
         },


         wireEvents:function(){
             var me = this;
             var $task = this.$el;
             var task =$task.data("model");  
            if(!this.isSubtaskEnabled)
                $task.find(".subtask").hide(); 
             this.$el.find(".task-name input").on({
                "change": function(evt, val) {
                    var $task = me.$el, 
                        $taskNameInput = $task.find(".task-name input"),
                        trimmedVal =$taskNameInput.val().trim(),
                         taskdata = $task.data("model");
                    if(trimmedVal){
                        $task.data("linkable-element-name", trimmedVal);
                        //me.save();
                        me.saveNameField(trimmedVal);
                    }
                    else{
                        //var taskdata = $task.data("model");
                        $taskNameInput.val(taskdata.name);
                        PPI_Notifier.info(EMPTY_TASK_NAME_NOT_ALLOWED);
                    }
                }
            });
            this.$el.find(".task-name-overflow-edit").on("keyup", function(evt) {
                // When ENTER pressed in task name overlay editor, commit changes (otherwise browser will insert linebreak and keep editing)
                if (evt.which === 13) {
                    me.exitQuickEditMode();
            //This is required to remove the cursor, in IE on Enter keypress there is a cursor key blinking below FK task
            setTimeout(function(){
                this.blur();
            }.bind(this),0);
                }
            });
            this.$el.find(".task-name-overflow-edit").on("blur", function(evt,val) { 
                    var currentVal =evt.currentTarget.textContent;
                if (currentVal && me.$el.data("model").name != currentVal) {
                    me.$el.find(".task-name input").val(evt.currentTarget.textContent);
                    //me.save();
                    me.saveNameField(currentVal);
                }
            });

            $task.on("click", this.onClick.bind(this));
            $task.on("rollupDurationChange",this.onRollupDurationChange.bind(this));
            $task.find(".task-duration")
                .on("change", this.onTaskDurationChange.bind(this))
                .on("click", this.onTaskDurationClick.bind(this))
                .on("keypress", this.onTaskDurationChange.bind(this));


            $task.find(".WIP_Limit_textbox")
                .on("blur", this.onWIPLimitChange.bind(this))
                .on("keypress", this.onkeyPressInWIPLimit.bind(this)); 
            $task.find(".STREAM_RATE_textbox")
                .on("blur", this.onStreamRateChange.bind(this))
                .on("keypress", this.onkeyPressInWIPLimit.bind(this));
            $task.find(".STREAM_OFFSET_textbox")
                .on("change", this.onStreamOffsetChange.bind(this))
                .on("blur", this.onStreamOffsetChange.bind(this))
                .on("keypress", this.onStreamOffsetChange.bind(this));   
            $task.find(".pullInFullKitDateBy input")
                .on("change", this.onPullInDurationChange.bind(this))
                .on("click", this.onPullInDurationClick.bind(this))
                .on("keypress", this.onPullInDurationChange.bind(this));
            if (this.phase.type === STRING_NORMAL) {
                DOMManipulatorWrapperInstance.findElementsByClsNames($task ,'fk-autolink').hide();
            } else {
            $task.find(".fk-autolink div").on({
                "click": this.onAutoLinkAllChange.bind(this)
            });
            }
            var $resourcesInput = $task.find(".task-resources .input-field"),
                resourcesPicker = new stl.view.ResourcePicker({
                    el: $resourcesInput,
                    val: [],
                    project: this.project,
                    readOnly: (this.readOnly || (this.task && this.task.bufferType !== "None"))
                });
            $resourcesInput.on({
                "resize": this.onTaskResourcePickerResize.bind(this),
                "change": this.onTaskResourceChange.bind(this)
            });
            this.taskResourcePicker = resourcesPicker;
            

            $task.find(".task-magnify-button").on({
                "click": this.onTaskZoomClick.bind(this),
                "mousedown": this.onTaskIconMousedown.bind(this)
            });
            $task.find(".delete-task-button").on({
                "click": this.onDeleteTaskButtonClick.bind(this),
                "mousedown": this.onTaskIconMousedown.bind(this)
            });
            $task.find(".ok-task-button").on({
                "click": this.onOkTaskButtonClick.bind(this)
            });
            $task.find(".add-task-plus-icon").on({
                "click": this.onTaskAddButtonClick.bind(this),
                "mousedown": this.onTaskIconMousedown.bind(this)
            });

            me.durationWarningIconEle = $task.find(".duration-field.warning-help-icon");
            me.durationInfoIconEle = $task.find(".duration-field.info-help-icon");
            me.resourceWarningIconEle = $task.find(".resource-field.warning-help-icon");
            me.resourceInfoIconEle = $task.find(".resource-field.info-help-icon");
            me.rollUpBtnEle = $task.find(".roll-up-task-button");

            me.rollUpBtnEle.on({
                "click": me.rollUpBtnHandler.bind(me)
            });
            me.durationWarningIconEle.on({
                "click": me.onDurationWarningIconClick.bind(me),
            });

            me.durationInfoIconEle.on({
                "click": me.onDurationInfoIconClick.bind(me),
            });

            me.resourceWarningIconEle.on({
                "click": me.onResourceWarningIconClick.bind(me),
            });

            me.resourceInfoIconEle.on({
                "click": me.onResourceInfoIconClick.bind(me),
            });

            $task.find(".task-properties .task-checklist-icon").off().on("click", function (evt) {
                var taskElem;
                if ($(evt.target).closest(".fk").length > 0) {
                    taskElem = $(evt.target).closest(".fk");
                } else {
                    taskElem = $(evt.target).closest(".task").length == 0 ? $(evt.target).closest(".ms") : $(evt.target).closest(".task");
                }
                if(window.currentViewId == "timeline" || window.currentViewId == "chainview"){
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                        Ext.getCmp('chainview').showChecklistPopupForTask($(taskElem));
                    else
                        Ext.getCmp('timelineview').showChecklistPopupForTask($(taskElem));
                }
                else
                    $(".matrix-view").data("view").showChecklistPopupForTask($(taskElem));
                evt.stopPropagation();
            });
            $task.find(".status-indicator").on("click", this.onStatusIndicatorClick.bind(this));
            var taskView = this;
            if(this.isSubtaskEnabled) {
                // Initialize subtask drag-and-drop
                /*$task.find(".subtasks ul").sortable("destroy");
                $task.find(".subtasks ul").sortable({
                    //handle: '.drag-handle',
                    delay:200,
                    isCallFromSPI: true,
                    group: 'subtasks',
                    distance: 3,
                    itemSelector: 'li:not(.proto-subtask)',
                    placeholder: '<li class="placeholder placeholder-highlight"><div style="height:20px" class=""></div></li>',
                    onMousedown: function($item, _super, event) {
                        return !me.readOnly;
                    },
                    onDragStart: function(item, group, _super) {
                        _super(item);
                    },
                    onDrop: function  (item, targetContainer, _super) {
                        me.$el.removeClass("dragging-subtask");
                        $(".placeholder-highlight").remove();
                        if (this.prevDrop || this.afterDrop){
                            if (this.prevDrop){
                                var prevModel = $(this.prevDrop).data("model");
                            }
                            if (this.afterDrop){
                                var afterModel = $(this.afterDrop).data("model");
                            }
                            var streamId;
                            if (prevModel){
                                streamId = prevModel.streamId;
                            }
                            if (afterModel){
                                streamId = afterModel.streamId;
                            }
                            if (taskView.isStreamSelected(item)){
                                
                                var startPriority = 0;
                                if (this.prevDrop.length == 0 && !prevModel){
                                    startPriority = 1;
                                } else {
                                    startPriority = prevModel.streamId + 1;
                                } 

                                stl.app.ProjectDataFromServer.updatePriorityOfSelectedStreams(startPriority,taskView.getModelFromElements(item), taskView.task);
                                stl.app.ProjectDataFromServer.updatePriorityOfRestAffectedStreams(startPriority,taskView.getModelFromElements(item), taskView.task);

                            } else {
                                if (this.prevDrop.length == 0 && !prevModel){
                                    var newStream = taskView.createStreamOnTop();
                                    streamId = newStream.streamId;
                                    $(item[0]).before(taskView.getStreamSeparatorElement());
                                } 
                                item.each(function(idx, val){
                                    taskView.updateStreamIdWithNewStreamId($(val).data("model"), streamId);
                                })
                            }
                            
                            
                            
                        }
                        var clonedItem = $('<li/>').css({height: 0});
                        item.before(clonedItem);
                        clonedItem.animate({'height': item.height()});
                        item.animate(clonedItem.position(), function  () {
                            clonedItem.detach();
                            _super(item);
                            taskView.saveSubtasks(taskView.$el);
                        });
                    },
                    onDropComplete: function(){
                        //taskView.saveSubtasks(taskView.$el);
                    }
                });*/
                

                this.wireSubTaskEvents();
                $task.find(".subtask-specific-properties input").on("change", this.onGenericTaskPropertyInputChange.bind(this,'subtask'));
                
                
            }

            $(this.project).on("resourceschanged", this.invalidateResourceCache.bind(this));

         },

         getStreamIdsofSelectedSubtasks: function($items){
            var me = this;
            var subtasksGroupedByStreams = _.groupBy($items, function(item){
                return $(item).data("model").streamId;
            });
            var idsOrderedByPriority = _.sortBy(Object.keys(subtasksGroupedByStreams), function(id){
                var stream = _.find(me.task.subtaskStreams, function(subtaskStream){
                    return subtaskStream.streamId == id;
                })
                return stream.streamPriority;
            })
            return idsOrderedByPriority;
         },

         getSeparatorElementsOfStreamsSelected: function($items){
            return $items.prev(".subtask-separator");
         },

        /**
         * Renders an empty task UI and inserts it into the DOM before $insertBeforeEl
         */
        render: function($insertBeforeEl , $insertAfterEl) {
            var me = this,
                $taskTemplate = $("#templates div[role=task-template]"),
                $task = $taskTemplate.clone(true);
            this.$el = $task;
            if($insertAfterEl &&  $insertAfterEl.length > 0 ) 
                $insertAfterEl.after($task)
            else if($insertBeforeEl &&  $insertBeforeEl.length > 0 )
                $insertBeforeEl.before($task);
            this.wireEvents();

            var dragDropIcon = $($task).find(".drag-drop-handle");
            //$(dragDropIcon).off('mouseup').on('mouseup', me.taskMultiSelectionHandler);
        },

        taskMultiSelectionHandler: function(evt){
            var $task = $(this).closest(".task");
            var task = $task.data("model");
            $(document).trigger("taskMultiSelect", [null, task]);
            return;
        },

        onAutoLinkAllChange: function (evt) {
            this.task.isAutolinked = !this.task.isAutolinked;
            $(this).trigger("autolinkallChange", [$(this.$el), this.task.isAutolinked]);
        },
        onStatusIndicatorClick: function(evt) {
            if(this.readOnly) return;
            var status = this.task.status || STATUS_NS;   // for some reason task status is not populated
            switch (status) {
                case STATUS_NS:
                    //for zero duration tasks , ther should not be IP status
                    if (this.project.checkIfZeroDurationTask(this.task)){
                        this.task.status = STATUS_CO;
                    }
                    else
                        this.task.status = STATUS_IP;
                    break;
                case STATUS_IP:
                    if (this.task.taskType === TASKTYPE_FULLKIT){
                        this.task.status = STATUS_RL;
                    } else {
                        this.task.status = STATUS_CO;
                    }

                    
                    break;
                case STATUS_RL:
                    this.task.status = STATUS_CO;
                    break;
                case STATUS_CO:
                    // do nothing
                    break;
            }
            this.$el.find(".task-status select")
                .select2("val", this.task.status);
            $(this.$el.find(".task-status select")).trigger("change",[status,false]);
        },

        setTaskStateBasedOnTaskStatus: function(task) {
            switch (task.status) {
                    case "NS":
                        task.actualStartDate = null;
                        task.actualFinishDate = null;
                        task.fullkitPercentCompleteAtRL = 0;
                        if (task.taskType == "fullkit") {
                            task.remainingDuration = 0;
                            task.duration = 0;
                            task.date7 = task.date1;
                            this.$el.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(task.date7));
                        } else {
                            task.remainingDuration = task.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : task.remainingDuration;
                            task.duration =task.remainingDuration;
                        }
                        task.percentComplete = 0;
                        task.fullkitReleaseDate = null; 
                        break;
                    case "IP":
                        task.actualStartDate=ServerClientDateClass.getTodaysDate();
                        var defStartTime = new Date(this.project.defaultStartTime);
                        task.actualStartDate.setHours(defStartTime.getHours());
                        task.actualStartDate.setMinutes(defStartTime.getMinutes());
                        task.actualStartDate.setSeconds(defStartTime.getSeconds());
                        task.actualFinishDate = null;
                        task.fullkitPercentCompleteAtRL = 0;
                        if (task.taskType == "fullkit") {
                            task.remainingDuration = 0;
                            task.duration = 0;
                            if (new Date(task.date7) < new Date()) {
                                task.date7 = ServerClientDateClass.getTodaysDate();
                                this.$el.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(task.date7));
                            }

                        } else {
                            task.remainingDuration = task.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : task.remainingDuration;
                            task.percentComplete = 0;
                        }
                        task.fullkitReleaseDate = null; 
                        break;
                    case "RL":
                        task.fullkitReleaseDate = ServerClientDateClass.getTodaysDate(); 
                        task.fullkitPercentCompleteAtRL = task.percentComplete;
                        break;
                    case "CO":
                        task.actualStartDate=   task.actualStartDate ? task.actualStartDate : ServerClientDateClass.getTodaysDate();
                        task.actualFinishDate = ServerClientDateClass.getTodaysDate();
                        task.actualFinishDate.setHours(17,0,0);
                        task.fullkitPercentCompleteAtRL = 100;
                        task.fullkitReleaseDate =  task.fullkitReleaseDate ? task.fullkitReleaseDate : ServerClientDateClass.getTodaysDate();
                        task.remainingDuration = 0;
                        task.percentComplete = 100;
                        break;
                }
        }, 

        onStatusDropdownChange: function(evt,oldval,ignoreValidations) {
            if(this.readOnly) return;
            var me = this;
            if(!oldval)
                oldval = this.task.status;
            this.task.status=  this.$el.find(".task-status select")
                .select2("val");
            var status = this.task.status || "NS";   // for some reason task status is not populated
            function callbackAfterValidation(status, taskview){
                switch (status) {
                    case "NS":
                        taskview.$el.find(".task-duration")
                                .val(ValidationClassInstance.getValidDurationString(taskview.task.remainingDuration,TASK_DURATION_DEFAULT_STR,false));
                        break;
                    case "IP":
                        taskview.$el.find(".task-duration")
                                    .val(ValidationClassInstance.getValidDurationString(taskview.task.remainingDuration,TASK_DURATION_DEFAULT_STR,false));
                        break;
                    case "RL":
                        break;
                    case "CO":
                        taskview.$el.find(".task-duration")
                             .val(ValidationClassInstance.getValidDurationString(taskview.task.remainingDuration,TASK_DURATION_DEFAULT_STR,false));
                        break;

                me.saveDurationField(status,me.task,ValidationClassInstance.getValidDuration(taskview.task.remainingDuration,TASK_DURATION_DEFAULT_SEC,false));
                }
            }
            if(!ignoreValidations)
                this.taskStatusChangeValidations(oldval, status, function(reply){
                    if(reply == 'yes'){
                        me.setTaskStateBasedOnTaskStatus(me.task);
                        callbackAfterValidation(status,me);
                        me.addClassForTaskStatus(me.$el);
                        me.enableOrDisableExpectedFinishDate(me.$el);
                        me.enableOrDisablePullInDuration(me.$el);
                    }
                    // me.refreshStatusIndicator();
                    // me.save();
                    me.saveStatusField(me.$el);   
                    
                  
                });
            else{
                me.saveStatusField(me.$el);
                 
                
                // me.refreshStatusIndicator();
                // me.save();
            }
        },
        
        /*
            These are the validations being called upon task status change
        */
        taskStatusChangeValidations:function(oldval, status, callbk){
            var me = this;
            if(oldval == 'NS' && status == 'IP'){
                ChangeTaskStatusFromNSToIP();
                callbk('yes');             
            }else if(oldval == 'NS' && status == 'CO'){
                ChangeTaskStatusFromNSToCO(this.task.name, this.task, this.task.subtasks, null, function(reply){
                    if(reply == 'no'){
                        me.task.status = 'NS';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                        //$(me.$el.find(".task-status select")).trigger("change",['NS',true]);
                    }else{
                        if(me.task.taskType != 'fullkit')
                            me.setSubtaskStatus();
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                    }
                });

            }else if(oldval == 'IP' && status == 'CO'){
                ChangeTaskStatusFromIPToCO(this.task.name, this.task, this.task.subtasks, null, function(reply){
                    if(reply == 'no'){
                        me.task.status = 'IP';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        //$(me.$el.find(".task-status select")).trigger("change",['IP',true]);
                        callbk('no');
                    }
                    else{
                        if(me.task.taskType != 'fullkit')
                            me.setSubtaskStatus();
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                    }
                });
            }else if(oldval == 'IP' && status == 'NS'){                
                ChangeTaskStatusFromIPToNS(this.task.name, this.task, this.task.subtasks, function(reply){
                    if(reply == 'no'){
                        me.task.status = 'IP';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                        //$(me.$el.find(".task-status select")).trigger("change",['IP',true]);
                    }else{
                        if(me.task.taskType != 'fullkit')
                            me.setSubtaskStatus();
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                    }
                });
            }else if(oldval == 'CO' && status == 'IP'){
                ChangeTaskStatusFromCOToIP(this.task.name, this.task, this.task.subtasks, null, function(){
                    if(me.task.taskType != 'fullkit')
                        me.setSubtaskStatus();
                    me.refreshChecklistIconForTask(me.$el, me.task);
                    callbk('yes');
                });
            }else if(oldval == 'CO' && status == 'NS'){
                ChangeTaskStatusFromCOToNS(this.task.name, this.task, this.task.subtasks, null, function(reply){
                    if(reply == 'no'){
                        me.task.status = 'CO';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }else{
                        me.setSubtaskStatus();
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                    }
                });
            }else if(oldval == 'NS' && status == 'RL'){
                ChangeTaskStatusFromNSToRL(this.task.name, this.task, function(reply){
                    if(reply=='no'){
                        me.task.status = 'NS';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }
                    else
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                });
            }else if(oldval == 'IP' && status == 'RL'){
                ChangeTaskStatusFromIPToRL(this.task.name, this.task, function(reply){
                    if(reply=='no'){
                        me.task.status = 'IP';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }
                    else
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                });
            }else if(oldval == 'CO' && status == 'RL'){
                ChangeTaskStatusFromCOToRL(this.task.name, this.task, function(reply){
                    if(reply=='no'){
                        me.task.status = 'CO';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }
                    else
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                });
            }else if(oldval == 'RL' && status == 'NS'){
                ChangeTaskStatusFromRLToNS(this.task.name, this.task, function(reply){
                    if(reply=='no'){
                        me.task.status = 'RL';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }
                    else
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                });
            }else if(oldval == 'RL' && status == 'IP'){
                //No validations required
                callbk('yes');
            }else if(oldval == 'RL' && status == 'CO'){
                ChangeTaskStatusFromRLToCO(this.task.name, this.task, function(reply){
                    if(reply=='no'){
                        me.task.status = 'RL';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('no');
                    }
                    else
                        me.refreshChecklistIconForTask(me.$el, me.task);
                        callbk('yes');
                });
            }else{

                callbk('yes');
            }

             
        },

        refreshChecklistIconForTask: function ($task, task) {
            $task.find(".task-checklist-icon").removeClass("none incomplete complete")
                .addClass(this.project.getChecklistStatus(task.checklistStatus));
            $task.data("model").checklistStatus = task.checklistStatus;
        },
        /*
            This function sets the subtask status based on task status programatically
        */
        setSubtaskStatus:function(){
            var me = this;
            if(me.isSubtaskEnabled) {
                me.$el.find(".subtasks li.subtask:not(.proto-subtask)").remove();
                me.task.remainingSubtasks = 0;
                var $listItemTemplate = $("#templates li[data-role=subtask-template]"),
                    $newItemPlaceholder = me.$el.find("li.proto-subtask");
                for (var i = 0; i < me.task.subtasks.length; i++) {
                    var item = me.task.subtasks[i],
                        showSubtask = (me.includeCompletedSubtask) ? true : !item.complete ;
                    if(showSubtask){
                        var $newLi = $listItemTemplate.clone(true).removeClass("proto-subtask").removeAttr("data-role");
                        me.bindSubtask($newLi, item);                        
                        $newItemPlaceholder.before($newLi);
                        this.setDurationAndDatesForSubtask(item,$newLi);
                    }
                    if (!item.complete) {
                        me.task.remainingSubtasks++;
                    }
                }
                me.task.subtaskCount = me.task.subtasks.length;
                me.refreshRemainingSubtasksIndicator();
            }
        },
        /*
            These are the validations being called upon task status change
        */
        subtaskStatusChangeValidations:function(oldval, newval, subtask, task, $ele, callbk){
            var me= this;
            if(oldval === 'NS' && newval === 'IP'){
                ChangeSubtaskStatusFromNSToIP(subtask, task, function(reply){
                    if(reply == 'no'){
                        //subtask.status = 'NS';                        
                    }else{
                        me.setTaskStatus("IP",me.$el);
                    }
                    callbk();
                });
            }else if(oldval === 'NS' && newval === "CO"){
                ChangeSubtaskStatusFromNSToCO(subtask, task, null, function(reply,setToIP){
                    if(reply == 'no' || setToIP=='no'){
                        me.setTaskStatus("IP",me.$el);                        
                    }else{
                        me.setTaskStatus("CO",me.$el);
                    }
                    callbk();
                });
            }else if(oldval === 'IP' && newval === 'CO'){
                ChangeSubtaskStatusFromIPToCO(subtask, task, null, function(reply,setToIP){
                    if(reply == 'no' || setToIP == 'no'){
                        me.setTaskStatus("IP",me.$el);                        
                    }else{
                        me.setTaskStatus("CO",me.$el);
                    }
                    callbk();
                });
            }else if(oldval === 'IP' && newval === 'NS'){
                ChangeSubtaskStatusFromIPToNS(subtask, task, null, function(reply, setToIP){
                    if(reply == 'no' || setToIP=='no'){
                        me.setTaskStatus("IP",me.$el);;                        
                    }else{
                        me.setTaskStatus("NS",me.$el);
                    }
                    callbk();
                });
            }else if(oldval === 'CO' && newval === 'NS'){
                ChangeSubtaskStatusFromCOToNS(subtask, task, null, function(reply, setToIP){
                    if(reply == 'no' || setToIP=='no'){
                        me.setTaskStatus("IP",me.$el);                        
                    }else{
                        me.setTaskStatus("NS",me.$el);
                    }
                    callbk();
                });
            }else if(oldval === 'CO' && newval === 'IP'){
                ChangeSubtaskStatusFromCOToIP(subtask, task, function(reply){
                    if(reply == 'no'){
                        me.setTaskStatus("IP",me.$el);                      
                    }else{
                        me.setTaskStatus("IP",me.$el);
                    }
                    callbk();
                });
            }else{

            }       
        },
        /*
            This function sets the task status based on task status programatically
        */
        setTaskStatus:function(status, $task){
            $task.find(".task-status select")
                .select2("val", status);
            $task.find(".task-status select").trigger('change',[status, false]);
        },
        /**
         * Connect an <li> element with a subtask data model and update the UI
         * to show the correct data
         */
        bindSubtask: function($li, subtask) {
            var me = this;
            $li.data('model', subtask);
            $li.find(".subtask-name textarea").val(subtask.name);
            $li.find(".subtask-name textarea").attr('title',subtask.name);
            // $li.find(".subtask-name input").on("blur",function(evt){
            //     if($(this).val()=="") {
            //         var subtaskOldName = $(this).closest('li').data("model").name;
            //         $(this).val(subtaskOldName);
            //     }

            // });
           
            $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration,SUBTASK_DURATION_DEFAULT_STR, false ));
            $li.find(".subtask-duration input").on("change", this.onSubtaskDurationChange.bind(this));
            $li.find(".subtask-duration input").on("keypress", this.onSubtaskDurationChange.bind(this));
            $li.find(".subtask-checklist-icon").addClass(this.project.getChecklistStatus(subtask.checklistStatus));
            var resourcesPicker = new stl.view.ResourcePicker({
                el: $li.find(".subtask-resources"),
                val: subtask.resources,
                project: this.project,
                readOnly: this.readOnly
            });
            $li.find(".subtask-resources").off("change").on("change", this.onSubtaskResourcesChange.bind(this));
           
            $li.find(".delete-subtask").on(
                "click", this.onDeleteSubTaskButtonClick.bind(this)
            );

            $li.find(".subtask-add").on(
                "click", this.onAddSubtaskButtonClick.bind(this)
            );

            this.refreshSubtaskStatus($li);
            this.refreshChecklistIcon($li,subtask);

            $li.find(".subtask-status")
                .on("click", this.onSubtaskStatusClick.bind(this));

            var $managerDiv = $li.find(".subtask-owner");
            $managerDiv.select2({
                    placeholder: TBD_PLACEHOLDER,
                    allowClear: true,
                    query: this.managerDropDownQuery.bind(this),
                    initSelection: this.managerDropDownInitSelection.bind(this)
                })
                .on("change", this.onGenericSubtaskPropertyChange.bind(this));
            $managerDiv.select2("val", subtask.manager || "");
            $managerDiv.select2("enable", !this.readOnly);
            $li.find("[name=subtask-checkbox]").on('click',function(evt){
                if(!this.checked){
                    var header = me.$el.find(".subtasks-header");
                    var ckbox = header.find("[name=subtask-header-checkbox]");
                    if(ckbox[0].checked)
                        ckbox.prop('checked',false);
                     $(this).parent().parent().removeClass("selected");
                }
                else{
                    $(this).parent().parent().addClass("selected");
                }
                var $input = $(evt.target),
                    $li = $input.closest("li");
                if (!stl.app.isPasteExternalInitiated())
                        stl.app.initPasteExternalEvent(me.pasteSubtasksCallbk.bind(me));

            })
        },

        refreshSubtaskStatus: function($li) {
            $li.removeClass("subtask-status-NS subtask-status-IP subtask-status-CO")
                .addClass("subtask-status-" + this.getSubtaskStatus($li.data("model").status));
        },
        refreshChecklistIcon: function($li,subtask) {
            $li.find(".subtask-checklist-icon").removeClass("none incomplete complete")
                    .addClass(this.project.getChecklistStatus(subtask.checklistStatus));
                    $li.data("model").checklistStatus = subtask.checklistStatus;
        },
        getSubtaskStatus: function(statusCode) {
            try{
                    switch (statusCode) {
                    case "NS" :
                    case "0":
                        return "NS";
                        break;
                    case "IP":
                    case "1":
                        return "IP";
                        break;
                    case "CO":
                    case "2":
                        return "CO";
                        break;
                }
            }  
            
            catch(e){
            	throw "Subtask status code not recognized: " + statusCode;
            }
        },

        
        /**
         * Capture values from the subtask UI and save them to the subtask data model
         */
        saveSubtask: function($li) {
            var subtask = $li.data("model"),
                durationStr = $li.find(".subtask-duration input").val();


            $.extend(subtask, {
                name: $li.find(".subtask-name textarea").val(),
                manager: $li.find(".subtask-owner").select2("val"),
                remainingDuration: durationStr==""? 0: ValidationClassInstance.getValidDuration($li.find(".subtask-duration input").val(),SUBTASK_DURATION_DEFAULT,false),
                // startDate: durationStr == '' ? "": ServerClientDateClass.getTodaysDate(),
                // endDate: durationStr == '' ? "" : Sch.util.Date.add(ServerClientDateClass.getTodaysDate(), Sch.util.Date.SECOND, (juration.parse(durationStr)) * 3),
                startDate: $li.data("model").startDate,
                endDate:  $li.data("model").endDate,
                status:$li.data("model").status,
                resources: $li.find(".subtask-resources").data("resourcePicker").getValue()                
            });
        },

        onTaskTypeChange: function(evt) {
            var $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            var oldTaskType = task.taskType;
            task.taskType = evt.val;
            this.bindTaskTypeSpecificProperties(oldTaskType);
            //this.save();
        },

        onTaskSubtaskTypeChange: function(evt) {
            var $task = $(evt.target).closest(".task"),
                taskmodel = $task.data("model");
            var newValue = evt.val;
            var oldValue = taskmodel.subtaskType;
            
            taskmodel.subtaskType = evt.val;           
            this.bindSubtaskTypeSpecificProperties();
            this.project.reCalculateSubTaskStartDate(taskmodel);
			
            if (newValue == SubtaskTypesEnum.STREAMS && oldValue != SubtaskTypesEnum.STREAMS){
                this.convertExistingSubtasksToStream();

            }
            this.handleSubtaskBlock();
            $task.trigger("rollupDurationChange");
            //this.save();
        },
		handleRollupResourceUpdate:function () {
            var me = this,
                $task = this.$el,
                task = this.task;
            if(task.status === STATUS_NS){
                this.showhideResourceInfoIcon(task);
            } else if(task.status === STATUS_IP) {
                this.showhideResourceViolationIcon(task);
            }
        },
        showhideDurationViolationIconAfterAjax: function(response){
            var taskmodel = this.task;
            taskmodel.durationViolationData = taskmodel.durationViolationData || {
                oldVal: taskmodel.remainingDuration
            };
            
            taskmodel.durationViolationData.data = parseInt(response.data);
            taskmodel.durationViolationData.isViolated = parseInt(response.data) > parseInt(taskmodel.remainingDuration);
            this.showhideDurationViolationIcon(taskmodel);
        },
        rollUpDurationUpdate: function () {
            var me = this,
                $task = this.$el,
                task = this.task;
            if (this.task.subtaskType == SubtaskTypesEnum.STREAMS){
                GetUpdatedRollUpDuration(task, this.showhideDurationViolationIconAfterAjax.bind(this));
            } else {
                this.showhideDurationViolationIcon(task);
            }
            
        },
        onRollupDurationChange: function(evtForConfirmationCallback) {
            var me = this,
                $task = this.$el,
                task = this.task;
                me.rollUpDurationUpdate();
                me.handleRollupResourceUpdate();
		},
        hideDurationWarningIcon: function () {
            this.durationWarningIconEle.hide();
        },
        hideDurationInfoIcon: function () {
            this.durationInfoIconEle.hide();
        },
        hideResourceWarningIcon: function () {
            this.resourceWarningIconEle.hide();
        },
        hideResourceInfoIcon: function () {
            this.resourceInfoIconEle.hide();
        },
        showDurationWarningIcon: function () {
            this.durationWarningIconEle.show();
        },
        showDurationInfoIcon: function () {
            this.durationInfoIconEle.show();
        },
        showResourceWarningIcon: function () {
            this.resourceWarningIconEle.show();
        },
        showResourceInfoIcon: function () {
            this.resourceInfoIconEle.show();
        },
        hideHelpIcons: function () {
            this.hideDurationWarningIcon();
            this.hideDurationInfoIcon();
            this.hideResourceWarningIcon();
            this.hideResourceInfoIcon();
        },
        showhideDurationViolationIcon: function (taskModel) {
            var me = this,
                $task = this.$el;
            if (taskModel.subtaskType != SubtaskTypesEnum.STREAMS){
                me.project.updateTaskDurationRollupViolationData(taskModel);
            }
            
            me.hideDurationInfoIcon();
            if(taskModel.durationViolationData.isViolated) {
                me.showDurationWarningIcon();
            } else {
                me.hideDurationWarningIcon();
            }
        },

        showhideResourceViolationIcon: function (taskModel) {
            var me = this,
                $task = this.$el;
            this.project.updateTaskResourceRollupViolationData(taskModel);
            if(taskModel.resourceViolationData.isViolated) {
                me.showResourceWarningIcon();
            } else {
                me.hideResourceWarningIcon();
            }
        },

		showhideResourceInfoIcon: function (taskModel) {
            var me = this,
                $task = this.$el;
            me.project.updateTaskResourceRollupInfoData(taskModel);
            me.hideResourceWarningIcon();

            if(taskModel.resourceInfoData.isInfoToBeShown) {
                me.project.updateTaskResourcesFromRollupData(taskModel.resourceInfoData.data, taskModel);
                me.taskResourcePicker.setValue(taskModel.resources);
                me.showResourceInfoIcon();
                me.handleTaskResourceChange(taskModel, $task);
            }
        },
        
        changeTaskDuration: function($task,duration,taskmodel)
		{
            if(taskmodel.status === STATUS_NS)
                taskmodel.duration = duration;
            taskmodel.remainingDuration =duration;
			$task.find(".task-duration").val(ValidationClassInstance.getValidDurationString(duration,TASK_DURATION_DEFAULT_STR,false));
			//this.save();
		},		

        onTaskDurationChange: function(evt) {
            if (evt.type == KEYPRESS){
                if (evt.which == 13){
                    evt.preventDefault();
                }
                else{
                    return;
                }
            }
            var $dur = $(evt.target),
                $task = $dur.closest(".task"),
                task = $task.data("model"),
                val = $dur.val();
            if(task.status == "CO")
                 val = 0;

            var parsedVal =ValidationClassInstance.getValidDuration(val,TASK_DURATION_DEFAULT,true);
            this.handleTaskDurationChange(task, parsedVal);
            if (task.subtaskType == SubtaskTypesEnum.STREAMS){
                this.rollUpDurationUpdate();
            } else {
                this.showhideDurationViolationIcon(task);
            }
            
            this.hideDurationInfoIcon();
        },

        handleTaskDurationChange: function (task, parsedVal) {
            var $task = this.$el,
                $dur = $task.find(".task-duration");

            $dur.val(ValidationClassInstance.getValidDurationString(parsedVal,TASK_DURATION_DEFAULT_STR,true));

            var status = this.task.status || "NS";   // for some reason task status is not populated
            if((task.remainingDuration== 0 && parsedVal !=0) || (parsedVal == 0 && task.remainingDuration !=0))
                this.refreshLinkForZeroDurationTask = true;
            this.saveDurationField(status,task,parsedVal);
            //status option IP need to be removed right away when a non zero duration task is converted to zero duration task
            //status option IP need to be added right away when a zero duration task is converted to non-zero duration task
            if(this.project.checkIfZeroDurationTask(task))
                this.removeIPOptionFromTaskStatus($task);
            else
                this.appendIPOptionForTaskStatus($task);
            this.removeAppendIPOptionAlreadyDone = true;
        },

        onkeyPressInWIPLimit:function(evt){
            evt = (evt) ? evt : window.event;
            var charCode = (evt.which) ? evt.which : evt.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                return false;
            }
            return true;
        },

        onkeyPressInStreamOffset: function(evt){
            if (evt.type == KEYPRESS){
                if (evt.which == 13){
                    evt.preventDefault();
                }
                else{
                    return;
                }
            }
            var $offset = $(evt.target),
                val = $offset.val();

            var parsedVal =ValidationClassInstance.getValidDuration(val,TASK_DURATION_DEFAULT,true);
        },

        onWIPLimitChange:function(evt){
            var $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            var WIPLimitTextBox = $task.find(".subtask-type .WIP_Limit_textbox");
            var origWIPLimit = task.subtasksWIPLimit;
            var newWIPLimit = WIPLimitTextBox.val();

            if(newWIPLimit && isValidNumber(newWIPLimit) && newWIPLimit != 0){
                this.saveWIPLimitField($task); 
                this.updateWIPLimitNotification(task, $task);

                if(stl.app.isValueChanged(origWIPLimit,newWIPLimit))
                    $task.trigger("rollupDurationChange");
            }
            else{
                WIPLimitTextBox.val(origWIPLimit);
                PPI_Notifier.error(INVALID_WIP_LIMIT);
            }            
        },

        onStreamOffsetChange:function(evt){
            if (evt.type == KEYPRESS){
                if (evt.which == 13){
                    evt.preventDefault();
                }
                else{
                    return;
                }
            }
            var $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            var streamOffsetTextbox = $task.find(".subtask-type .STREAM_OFFSET_textbox");
            var origStreamOffset = task.subtaskStreamOffset;
            var newStreamOffset = streamOffsetTextbox.val();
            var parsedVal =ValidationClassInstance.getValidDuration(newStreamOffset,TASK_DURATION_DEFAULT,true);
            streamOffsetTextbox.val(ValidationClassInstance.getValidDurationString(parsedVal,TASK_DURATION_DEFAULT_STR,false));

            this.saveStreamOffsetField($task, parsedVal);          
        },

        onStreamRateChange:function(evt){
            var $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            var streamRateTextBox = $task.find(".subtask-type .STREAM_RATE_textbox");
            var origStreamRate = task.subtaskStreamRate;
            var newStreamRate = streamRateTextBox.val();

            if(newStreamRate && isValidNumber(newStreamRate) && newStreamRate != 0){
                this.saveStreamRateField($task); 
                //this.updateWIPLimitNotification(task, $task);

                if(stl.app.isValueChanged(origStreamRate,newStreamRate))
                    $task.trigger("rollupDurationChange");
            }
            else{
                streamRateTextBox.val(origStreamRate);
                PPI_Notifier.error(INVALID_STREAM_RATE);
            }            
        },

        onPullInDurationChange: function(evt) {
            var parsedVal;
            var $task = $(evt.target).closest(".fk").length == 0 ? $(evt.target).closest(".task") : $(evt.target).closest(".fk") ,
            task = $task.data("model");
            try {                 
                if (evt.type == KEYPRESS){
                    if (evt.which == 13){
                        evt.preventDefault();
                    }
                    else{
                        return;
                    }
                }
                var $dur = $(evt.target),
                val = $dur.val();
                parsedVal = ValidationClassInstance.getValidDuration(val,0,true);
                $dur.val(ValidationClassInstance.getValidDurationString(parsedVal,ZERO_DURATION_STR,true));
            } catch(e) {
                parsedVal = task.fullkitPullInDuration;
            }
            if(parsedVal !== undefined){
                this.UpdateFKDates(task, $task, parsedVal)
                var status = this.task.status || STATUS_NS ;   // for some reason task status is not populated
                this.setPullInDurationField(status,task,parsedVal);
                //this.save(); 
                //this.saveDurationField()
                if(this.project.isIDCCed){
                     Ext.getCmp('CCSummarygrid').UpdateFullKitDataInCCSummary(task);   
                }
            }
        },
        UpdateFKDates: function(fkTask, $fkTask, parsedVal) {
            var oldPullInDuration = fkTask.fullkitPullInDuration;
            // get the floored duration value. if the modified duration is in the same date(within ONE_DAY_DURATION_DEFAULT_SEC), no need to update the need date and exprected finish date.
            oldPullInDuration = (Math.floor(oldPullInDuration/ ONE_DAY_DURATION_DEFAULT_SEC))*ONE_DAY_DURATION_DEFAULT_SEC;
            var newPullInDuration = (Math.floor(parsedVal/ ONE_DAY_DURATION_DEFAULT_SEC))*ONE_DAY_DURATION_DEFAULT_SEC;
            if(newPullInDuration != oldPullInDuration){
                if(oldPullInDuration < newPullInDuration){
                    var durationDifference = newPullInDuration - oldPullInDuration;
                     fkTask.date1 = fkTask.date7 =  this.project._scheduler.adjustDatesForDuration(new Date(fkTask.date7),durationDifference,false); 
                }
                else if (oldPullInDuration > newPullInDuration){
                    var durationDifference = oldPullInDuration - newPullInDuration;
                     fkTask.date1 = fkTask.date7 =  this.project._scheduler.adjustDatesForDuration(new Date(fkTask.date7),durationDifference,true);
                }
                // Set Expected Finish date value.
                if (fkTask.date7){
                    $fkTask.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(fkTask.date7));
                }
                // Set Need Date value.
                if (fkTask.date1){
                    $fkTask.find(".needDate input").val(ServerTimeFormat.getDateInLocaleFormat(fkTask.date1));
                }
            }
        },
        onTaskDurationClick: function(evt) {
            if ($(evt.target).closest(".task").hasClass("quick-task-edit")) {
                evt.stopPropagation();
            }
        },
        onPullInDurationClick: function(evt) {
            if ($(evt.target).closest(".task").hasClass("quick-task-edit")) {
                evt.stopPropagation();
            }
           
        },

        onSubtaskDurationChange: function(evt) {
            if(evt.type == KEYPRESS){
                if (evt.which == 13) {
                        evt.preventDefault();
                    } else {
                         return;
                    }
            }
            
            var $dur = $(evt.target),
                subtask = $dur.closest(".subtask").data("model"),
                $task = $dur.closest(".subtask").closest(".task");
                val =$dur.val();
                if(subtask.status === "CO")
                    val = 0;
                else{
                    //if($dur.val() == 0 || $dur.val() == ZERO_DURATION_STR ) {
                    if(ZERO_DURATION_REGEX.test($dur.val())) {
                        PPI_Notifier.info(getStringWithArgs(ZERO_DURATION_NOT_ALLOWED,SUBTASKS));
                        val = SUBTASK_DURATION_DEFAULT;
                    }
                }
			var origVal = subtask.remainingDuration;
            var parsedVal = ValidationClassInstance.getValidDuration(val,SUBTASK_DURATION_DEFAULT,true);
            $dur.val(ValidationClassInstance.getValidDurationString(parsedVal,SUBTASK_DURATION_DEFAULT_STR,true));

            var status = subtask.status || "NS";   // for some reason task status is not populated
            this.saveDurationField(status,subtask,parsedVal);

            this.project.reCalculateSubTaskStartDate($task.data("model"));
			if(stl.app.isValueChanged(origVal,parsedVal))
				$task.trigger("rollupDurationChange");
            //this.save();
        },

        saveDurationField: function(status,taskorSubtask ,parsedVal) {
            // Duration field in Project and Table view always shows Remaining Duration.
            switch (status) {
                case "NS":
                    // For NS tasks/subtasks, duration & remainingDuration are same.  
                    taskorSubtask.duration = parsedVal;
                    taskorSubtask.remainingDuration = parsedVal;
                    break;
                case "IP":
                    taskorSubtask.remainingDuration = parsedVal;
                    break;
                case "CO":
                    taskorSubtask.remainingDuration = 0;
                    break;
            }
        },
        setPullInDurationField: function(status,fkTask ,parsedVal) {
            if (status === STATUS_NS) {
                  fkTask.fullkitPullInDuration = parsedVal;
            }
        },


        onSubtaskResourcesChange: function(evt) {
            var me = this,
                $subtask = $(evt.target).closest(".subtask"),
                subtask = $subtask.data("model"),
                $task = $subtask.closest(".task");
            //this.save();
            this.saveSubtasks($task);
            // Notify the project that some previously unassigned resources may have been assigned
            var resourceEntities = subtask.resources.map(function(resourceAndUnits) {
                return me.getResourceById(resourceAndUnits.resourceId);
            });
            this.project.onResourcesAssigned(resourceEntities);
            this.handleRollupResourceUpdate();
        },

        onGenericSubtaskPropertyChange: function(evt) {
            this.saveSubtasks(this.$el);
        },

        refreshRemainingSubtasksIndicator: function() {
            var $remainingSubtasksIndicator = this.$el.find('.remaining-subtasks-indicator'),
                $rollupType = this.$el.find(".subtask-type");
            if (this.isSubtaskEnabled) {
                $remainingSubtasksIndicator
                    .text(this.task.remainingSubtasks)
                    .toggle(!!this.task.remainingSubtasks);
                if (this.task.subtasks.length > 0) {
                    if(!this.$el.hasClass("quick-task-edit"))
                        $rollupType.show();
                    else 
                        $rollupType.hide();
                } else {
                    //$rollupType.hide();
                }
            } else {
                $remainingSubtasksIndicator.hide();
                $rollupType.hide();
            }
        },

        refreshStatusIndicator: function() {
            if (this.task.bufferType !== "None") return; // No status indicator for buffer tasks
            this.$el.find(".status-indicator").hide();
            this.$el.find(".status-indicator-" + (this.task.status || "NS")).show();
        },
        setQuickEditStatusBox:function($task){
            var $statusSelect = $task.find(".task-status select");
            var task = this.task;
            if (!this.initializedQuickEdit) {
                $statusSelect.select2({
                        dropdownAutoWidth: true,
                        minimumResultsForSearch: -1
                    })
                    .on("change", this.onStatusDropdownChange.bind(this));
            }           
            //load values
            $statusSelect.select2('val', task.status);
            this.initializedQuickEdit = true;
        },


        processZeroDurationTask: function() {
            var $task =this.$el,
            taskmodel =this.task;
            if(this.project.checkIfZeroDurationTask(taskmodel)){
                var taskHasQuickEdit =$task.hasClass('quick-task-edit');
                
                if(taskHasQuickEdit )
                    $task.removeClass("zero-duration-task");
                else
                    $task.addClass("zero-duration-task");
                // $task.addClass("hiddenSubtasks");
                if(!this.removeAppendIPOptionAlreadyDone)
                    this.removeIPOptionFromTaskStatus($task);
            }
              else{
                  this.$el.removeClass("zero-duration-task");
                  // this.$el.removeClass("hiddenSubtasks");
                  if(!this.removeAppendIPOptionAlreadyDone)
                    this.appendIPOptionForTaskStatus($task);
             }
             this.removeAppendIPOptionAlreadyDone = true;
        },

        saveSubtaskTypeSpecificProperties: function($task, taskmodel) {
            var $props = $task.find(".subtask-specific-properties");
            taskmodel.volume = $props.find(".volume").val();
            taskmodel.wipLimit = $props.find(".wip-limit").val();
            taskmodel.units = $props.find(".units").val();
        },

        onSNETChange: function(evt) {
            var $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            var date = null;
            try {           
                
                var selectedDateVal = $task.find(".snet input").val();
                var selectedDate = $task.find(".snet input").datepicker("getDate");   
                if(!isNaN(selectedDate))
                    date=selectedDate;
                else
                {
                   //Sometimes just clicking in date field removes the set value and resets it to today's date
                    if(task.startNoEarlierThan)
                        date = new Date(task.startNoEarlierThan);
                    else
                        date = ServerClientDateClass.getTodaysDate();
                }
            } 
            catch(e) {
            }

            if (!isNaN(date)){
                task.startNoEarlierThan = selectedDate;
            }
            if(selectedDateVal === "")
                $task.find(".snet input").val(ServerTimeFormat.getDateInLocaleFormat(date));
            //this.save();
        },

        onExpectedFinishDateChange: function(evt) {
            var $task = $(evt.target).closest(".fk").length == 0 ? $(evt.target).closest(".task") : $(evt.target).closest(".fk") ,
                task = $task.data("model");
            var date = null;
            try {
	    
                var selectedDateVal = $task.find(".expectedFinishDate input").val();
                var selectedDate = $task.find(".expectedFinishDate input").datepicker("getDate");   
                if(!isNaN(selectedDate)){
                    date = selectedDate;
                }
                else
                {
                    //Sometimes just clicking in date field removes the set value and resets it to today's date
                    if(task.date7)
                        date = new Date(task.date7);
                    else
                        date = ServerClientDateClass.getTodaysDate();
                }

            } catch(e) {}
            if (!isNaN(date)){
                task.date7 = date;
            }
            if(selectedDateVal === "")
                $task.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(date));
            //this.save();
        },

        onGenericTaskPropertyInputChange: function(changedField,evt) {
            //this.save();
            switch(changedField){
                case 'manager':
                this.saveManagerField(this.$el);
                this.updateTaskManagerColors();
                break;
                case 'participants':
                this.saveParticipantField(this.$el);
                break;
                case 'subtask':
                this.saveSubtasks(this.$el);
                break;
            }
            
                
        },

        onTaskResourceChange: function(evt,sender) {
            var me = this,
                $task = $(evt.target).closest(".task"),
                task = $task.data("model");

            me.handleTaskResourceChange(task, $task);
            me.resourceInfoIconEle.hide();
        },
        handleTaskResourceChange: function (task, $task) {
            var me = this;
            me.saveResourceField($task);
            if (task.resources.length > 0) {
                //task add and task update
                for (var i = 0; i < task.resources.length; i++) {
                    var firstResource = task.resources[i],
                        firstResourceDetails = me.getResourceById(firstResource.resourceId);
                    Ext.getCmp('resGrid').updateResourceSheet(
                        firstResourceDetails,
                        firstResource.units,
                        task
                    );
                }
            }
            else{
                //task deleted
                // Ext.getCmp('resGrid').updateResourceSheet($task.data('model'));
            }
            me.updateTaskResourceColors($task, task);
            // Notify the project that some previously unassigned resources may have been assigned
            var resourceEntities = task.resources.map(function(resourceAndUnits) {
                return me.getResourceById(resourceAndUnits.resourceId);
            });
            me.project.onResourcesAssigned(resourceEntities);

            // Need to notify matrix view to save project here because a new resource may have been added
            $(me).trigger("resourcechange");
        },
        onTaskResourceChangeFromTableView:function($task, task){
            var me = this;
            this.updateTaskResourceColors($task, task);
            var resourceEntities = task.resources.map(function(resourceAndUnits) {
                return me.getResourceById(resourceAndUnits.resourceId);
            });            
            this.project.onResourcesAssigned(resourceEntities);
	    // Need to notify matrix view to save project here because a new resource may have been added
            $(this).trigger("resourcechange");
        },
        onTaskResourcePickerResize: function(evt) {
            var $task = $(evt.target).closest(".task");
            this.checkForTaskHeightChange($task);
        },

        checkForTaskHeightChange: function($task) {
            var lastHeight = $task.data("last-height"),
                height = $task.height();
            if (height !== lastHeight) {
                $task.data("last-height", height);
                $(this).trigger("resize");
            }
        },

        managerDropDownQuery: function (query) {
            var filteredData = this.filterManagers(query.term);
            query.callback({ results: filteredData });
        },

        managerDropDownInitSelection: function(element, callback) {
            if (!this.cachedManagersById) {
                this.getAvailableManagerOptions();
            }
            this.dropDownInitSelection(element, callback, this.cachedManagersById, "FullName");
        },

        /*
         * Common logic that completes the Select2 control's initSelection action
         * on various types of cached data.
         */
        dropDownInitSelection: function(element, callback, cachedData, displayFieldName) {
            var val = element.select2("val"),
                data = null;
            if (val) {
                var resource = cachedData[val],
                    resourceName = (resource ? resource[displayFieldName] : val);
                data = { id: val, text: resourceName };
            }
            callback(data);
        },

        participantsDropDownQuery: function(query) {
            var filteredData = this.filterManagers(query.term);
            query.callback({ results: filteredData });
        },
       

        participantsDropDownInitSelection: function(element, callback) {
            var me = this;
            if (!this.cachedManagersById) {
                this.getAvailableManagerOptions();
            }
            var data = element.select2("val").map(function (personId) {
                var person = me.cachedManagersById[personId],
                    name = (person ? person.FullName : personId);
                return { id: personId, text: name };
            });
            callback(data);
        },
        filterManagers: function(searchTerm){
            var filteredData = this.getAvailableManagerOptions();
            if (searchTerm) {
               filteredData = _.filter(filteredData, function(manager) {
                    return (manager.text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
                });
            }
            return filteredData;
        },

        getManagerName: function(manager_id) {
            var allResources = this.project.getAvailableResources();
            for (var i = 0; i < allResources.length; i++) {
                if (allResources[i].id === manager_id) {
                    return allResources[i].Name;
                }
            }
        },
        onOkTaskButtonClick:function(evt){
            if(window.currentViewId == "matrix" && this.$el.hasClass('task-zoom-normal')){
                this.onTaskZoomClick(evt);

            }
            else{
                this.exitQuickEditMode();
                evt.stopPropagation();
                if(window.currentViewId == "timeline" || window.currentViewId=="chainview"){
                    this.$el.hide();
                    var view;
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){
                        view = Ext.getCmp('chainview');
                        view.stopEditingTask();
                    }
                    else{
                        view = Ext.getCmp('timelineview')
                        view.stopEditingTask();
                    }
                    if(Ext.getBody().isMasked()){
                        Ext.getBody().unmask();
                    }
                        
                    if(this.$el.hasClass("task-zoom-normal")){
                        if (stl.app.handlerPtr != null) {
                            window.removeEventListener("paste", stl.app.handlerPtr);
                            stl.app.handlerPtr = null;
                        }
                    }
                }
            }
            if(window.currentViewId == "matrix"){
                this.saveSubtasks(this.$el);
            }
            
            $(this).trigger("change", [this, this.task]);
            
        },
        onDeleteTaskButtonClick: function(evt) {
            $(evt.target).closest(".phase-type-fullkit").removeClass('has-task');
            $(this).trigger("delete", [ evt ]);
        },

        onAddSubtaskButtonClick: function(evt){
            if (this.readOnly) return;
            evt.stopPropagation();
            var me = this,
                $deleteElement = $(evt.target),
                $afterEl = $deleteElement.closest("li"),
                subtask =$afterEl.data("model"),
                task = this.$el.data("model"),
                $task = this.$el;
            var $li = me.$el.find(".proto-subtask");
            if (this.$el.data("model").subtaskType == SubtaskTypesEnum.STREAMS){
                var foundStream = _.find(task.subtaskStreams, function(stream){
                    return stream.streamId == subtask.streamId;
                })
                me.renderNewSubtask($li,foundStream.name + "." + DEFAULT_STREAM_SUBTASK_NAME,false,true,$afterEl, subtask.streamId, true);
            } else {
                me.renderNewSubtask($li,DEFAULT_STREAM_SUBTASK_NAME,false,true,$afterEl, null, true);
            }
            

        },

        onDeleteSubTaskButtonClick: function(evt) {
            if (this.readOnly) return;
            evt.stopPropagation();
            var me = this,
                $deleteElement = $(evt.target);
            this.deleteSubtaskByElement($deleteElement);
                
        },
        deleteSubtaskByElement: function($elem){
            var $li = $elem.closest("li"),
                subtask =$li.data("model"),
                task = this.$el.data("model"),
                $task = this.$el;
            this.deleteSubtaskFromModel($li);
            me.saveSubtasks(this.$el);
            this.project.reCalculateSubTaskStartDate(task);           
            this.updateWIPLimitNotification(task, $task);
            $(this).trigger("deletesubtask", [ subtask, task ]);
            this.$el.trigger("rollupDurationChange");
        },
        deleteSubtaskFromModel:function($li){
            var me = this;
            var subtask =$li.data("model"),
                task = this.$el.data("model");
            $li.remove();
            var indexDeleted = task.subtasks.indexOf(subtask);
        },
        onSubtaskStatusClick: function(evt) {
            if (this.readOnly) return;
            var me = this,
                $li = $(evt.target).closest("li"),
                subtask = $li.data("model");

            var $task =this.$el;
            var subtaskType = this.task.subtaskType;   
            
            if(subtaskType == SubtaskTypesEnum.WIP){
                this.showPromptIfWIPLimitExceeded($task,$li, subtask, this.task);
            }            
            else{
                me.saveSubtaskStatusAndShowValidation($li, subtask);
            }
        },

        saveSubtaskStatusAndShowValidation :function($li, subtask){
            var me = this;
            var subtaskType = this.task.subtaskType;
            var isSubtaskCompletable = this.completeSubtaskOnChecklistComplete ? (subtask.checklistStatus ==2 ||subtask.checklistStatus ==0) : true; 
               
                var currentStatus = "NS";
                var oldStatus = subtask.status;
                if(oldStatus == '0')
                    oldStatus="NS";
                else if(oldStatus == '1')
                    oldStatus="IP";
                else if(oldStatus == '2')
                    oldStatus="CO";   
                switch (subtask.status) {
                    case "0":
                    case "NS":
                        if (subtaskType == SubtaskTypesEnum.VOLUME) {
                            // "Rate"-based tasks have their subtasks go directly from NS->CO, skipping IP
                            if(isSubtaskCompletable)
                                subtask.status = "CO";
                            else 
                                PPI_Notifier.info(SUBTASK_CANNOT_MARKED_COMPLETE);
                        }
                        else 
                            subtask.status = "IP";
                        break;
                    case "1":
                    case "IP":
                        if(isSubtaskCompletable)
                            subtask.status = "CO";
                        else 
                            PPI_Notifier.info(SUBTASK_CANNOT_MARKED_COMPLETE);
                        break;
                    case "2":
                    case "CO":
                        subtask.status = "NS";                        
                        break;
                }          
                this.setDurationAndDatesForSubtask(subtask, $li);
                this.subtaskStatusChangeValidations(oldStatus, subtask.status, subtask, this.task, $li, function(){
                    me.$el.trigger("rollupDurationChange");
                    me.refreshSubtaskStatus($li);
                    me.saveSubtask($li);
                });
        },

        showPromptIfWIPLimitExceeded: function($task,$subtask, subtaskModel, taskModel){

            var me = this;
            
            if(subtaskModel.status == 'NS' && me.project.isWIPLimitExceeded(taskModel, STATUS_IP)){
                //subtaskModel.status == 'NS' - It is old subtask status
                if(!me.isWIPExceededImageVisible($task)){
                    //Vrushali - Show prompt only if notifiying image is not visible
                    PPI_Notifier.confirm(WIP_LIMIT_EXCEEDED_ALERT_MESG, WIP_LIMIT_EXCEEDED_TITLE, 
                                         function(){                                            
                                         me.showWIPExceededImg($task);
                                         me.saveSubtaskStatusAndShowValidation($subtask, subtaskModel);
                                     }, function(){
                                        
                                        me.refreshSubtaskStatus($subtask);
                                        
                                     });
                }
                else{
                    me.saveSubtaskStatusAndShowValidation($subtask, subtaskModel);
                }
            }
            else{
                me.saveSubtaskStatusAndShowValidation($subtask, subtaskModel);
                if(!me.project.isWIPLimitExceeded(taskModel, subtaskModel.status)){
                    me.hideWIPExceededImg($task);
                }
                
            }
            
        },

        showWIPExceededImg:function($task){
            var imgWIP = $($task).find(".imgWIP");
            if(imgWIP)
            {
                imgWIP.show();
            }
        },

        hideWIPExceededImg:function($task){
            var imgWIP = $($task).find(".imgWIP");
            if(imgWIP)
            {
                imgWIP.hide();
            }
        },

        isWIPExceededImageVisible:function($task){
            var isImageVisible = false;
            var imgWIP = $($task).find(".imgWIP");
            if(imgWIP){
                isImageVisible = imgWIP.is(':visible');
            }
            return isImageVisible;
        },
        
        updateWIPLimitNotification:function(taskModel, $task){
            var me = this;            
            if (taskModel.subtaskType == SubtaskTypesEnum.STREAMS) {
                me.hideWIPExceededImg($task);
                return;
            };
            if(me.hasWIPLimitExceeded(taskModel)){
                me.showWIPExceededImg($task);
            }
            else
                me.hideWIPExceededImg($task);
            
        },

        hasWIPLimitExceeded: function(taskModel){              
            var me = this;
            var hasWIPExceeded = false;
            var subtasks = taskModel.subtasks;
            var taskWIPLimit = taskModel.subtasksWIPLimit;
            var noOfIPSubtasks = 0;
            
            noOfIPSubtasks = _.filter(subtasks, function(subtask, index){
                return subtask.status == STATUS_IP;                
            }).length;

            if(noOfIPSubtasks > taskWIPLimit){
                hasWIPExceeded = true;
            }

            return hasWIPExceeded;
        },

        setDurationAndDatesForSubtask:function(subtask,$li){

            switch(subtask.status)
            {
                case "2":
                case "CO":
                    subtask.endDate =ServerClientDateClass.getTodaysDate();
                    subtask.duration = SUBTASK_DURATION_DEFAULT;
                    subtask.remainingDuration = 0;
                    subtask.actualStartDate=   subtask.actualStartDate ? subtask.actualStartDate : ServerClientDateClass.getTodaysDate();
                    subtask.actualFinishDate = ServerClientDateClass.getTodaysDate();
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration,SUBTASK_DURATION_DEFAULT_STR, false ));
                    break;

                case "1":
                case "IP":
                    subtask.actualStartDate = ServerClientDateClass.getTodaysDate();
                    subtask.actualFinishDate = null;
                    subtask.remainingDuration = subtask.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtask.remainingDuration;
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration,SUBTASK_DURATION_DEFAULT_STR, false ));
                    break;

                case "0":
                case "NS":
                    // For NS subtasks - Duration/Remaining duration is always same
                    subtask.actualStartDate = null;
                    subtask.actualFinishDate = null;
                    subtask.remainingDuration = subtask.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtask.remainingDuration;
                    subtask.duration = subtask.remainingDuration;
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration,SUBTASK_DURATION_DEFAULT_STR, false ));
            }          
        },
        //remove RL option from task status dropdown for all tasks except FK
        removeReleasedOptionFromTaskStatus: function ($task) {
            $task.find(".task-status select option[value = 'RL']").remove();
        },

        //remove hidden subtask type option from roll up dropdown
        removeHiddenSubtaskTypeOption: function ($task, taskModel) {
            var me = this;
            var selectedSubtaskType = taskModel.subtaskType;
            var $subtaskTypeDropdown = $task.find(".subtask-type select");

            _.each(SubtaskTypesEnum, function(value, key, list){
                if(me.project.isSubtaskTypeOptionHidden(selectedSubtaskType,value )){
                    var $option = $subtaskTypeDropdown.find("option[value = '" + value +"']");
                    if($option)
                       $option.remove();
                }   
            });
            
        },

        //remove IP option for zero dration task
        removeIPOptionFromTaskStatus: function ($task) {
            $task.find(".task-status select option[value = 'IP']").remove();
        },
        appendIPOptionForTaskStatus: function ($task) {
            if($task.find(".task-status select option[value = 'IP']").length===0)
            $task.find(".task-status select option[value = 'CO']").before('<option  data-resx-key = "IN_PROGRESS_Key"  value="IP">In progress</option>');
        },

        bindTaskTypeSpecificProperties: function(oldTaskType) {
        	var $task = this.$el,
        		taskmodel = this.task;
                $task.find(".task-specific-properties").hide();
                $task.find(".task-specific-properties-" + taskmodel.taskType).css("display", "inline-block");
            switch (taskmodel.taskType) {
                case "normal":
                    this.showSubtasksRegion($task);
                    if ($task.hasClass("purchasingTask")) {
                        $task.removeClass("purchasingTask");
                    }
                    this.removeReleasedOptionFromTaskStatus($task);
                    break;
                case "fullkit":
                    this.initializeExpectedFinishDateField($task)
                    var $fullkitName = $task.find(".fullkit-name");
                    if ($fullkitName.length === 0) {
                        $fullkitName = $('<div class="fullkit-name"></div>');
                        $task.find(".task-name").append($fullkitName);
                    }

                    var $fullKitColor =$task.find(".fullkit-color");
                    if ($fullKitColor.length === 0) {
                        $fullkitColor =$('<div class="fullkit-color"></div>');
                        $task.append($fullkitColor);
                    }
                    // Look for succeeding task
                    // TODO stop using placeholder; save default name as actual task name
                    var name = "FK";//"Full-kit"
                    $fullkitName.text(name);
                    if ($task.hasClass("purchasingTask")) {
                        $task.removeClass("purchasingTask");
                    }
                    this.enableOrDisableExpectedFinishDate($task);
                    this.enableOrDisablePullInDuration($task);
                    break;
                case "purchasing":
                //[CON 2995]-Planning: Support of subtasks in PT
                    //if(taskmodel.subtaskCount === 0) {
                        this.initializeExpectedFinishDateField($task)
                        if (!$task.hasClass("purchasingTask")) {
                            $task.addClass("purchasingTask");
                        }
                        this.enableOrDisableExpectedFinishDate($task);
			//[CON 2995]-Planning: Support of subtasks in PT
                        //this.hideSubtasksRegion($task);
                        this.removeReleasedOptionFromTaskStatus($task);
                    //}
		    //[CON 2995]-Planning: Support of subtasks in PT
                    /*else {
                        PPI_Notifier.info(getStringWithArgs(INFO_TASK_TYPE_CHANGE,PURCHASING_TASK));
                        $task.find(".task-type select")
                            .select2("val",oldTaskType);
                        taskmodel.taskType = oldTaskType;
                    }*/
                    break;
                case "snet":
                    this.initializeSnetDateField($task);
                    this.showSubtasksRegion($task);
                    if ($task.hasClass("purchasingTask")) {
                        $task.removeClass("purchasingTask");
                    }
                    if(!taskmodel.startNoEarlierThan)
                        taskmodel.startNoEarlierThan = ServerClientDateClass.getTodaysDate();
                    this.removeReleasedOptionFromTaskStatus($task);
                    break;
            }
        },

        initializeSnetDateField: function($task) {
            var $taskSnetInput = $task.find(".snet input");
            var task = this.task;
            if (!this.initializedSnetDateField) {
                $taskSnetInput.datepicker({
                        format:ServerTimeFormat.getBootstrapPickerDateFormat(),
                        assumeNearByYear:true,
                        autoclose: true,
                        startDate: '-0d'
                    })
                    .on("keypress", function(evt) {
                        if (evt.which == 13) {
                            evt.preventDefault();
                        }
                    })
                    .on("changeDate", this.onSNETChange.bind(this))
                    .on('hide', function(e){
		        //This is to prevent the date value getting wiped out on selection of current selected date
                        if ( !e.date ) {
                            this.$el.find(".snet input").val(ServerTimeFormat.getDateInLocaleFormat(this.task.startNoEarlierThan));
                        }
                    }.bind(this));
                this.initializedSnetDateField = true;

            }
            if (task.startNoEarlierThan) {
                $taskSnetInput.val(ServerTimeFormat.getDateInLocaleFormat(task.startNoEarlierThan));
            } else {
                $taskSnetInput.val(ServerTimeFormat.getTodaysDateInLocaleFormat());
            }
        },
        initializeExpectedFinishDateField: function($task) {
            var $taskExpFinDateInput = $task.find(".expectedFinishDate input");
            var task = this.task;
            if (!this.initializedExpectedFinishDateField) {
                $taskExpFinDateInput
                    .datepicker({
                        format:ServerTimeFormat.getBootstrapPickerDateFormat(),
                        assumeNearByYear:true,
                        autoclose: true,
                        startDate: '-0d' //  Dates earliar than today will be disabled
                    })
                    .on("keypress", function(evt) {
                        if (evt.which == 13) {
                            evt.preventDefault();
                        }
                    })
                    .on("changeDate", this.onExpectedFinishDateChange.bind(this))
                    .on('hide', function(e){
		        //This is to prevent the date value getting wiped out on selection of current selected date
                        if ( !e.date ) {
                            this.$el.find(".expectedFinishDate input").val(ServerTimeFormat.getDateInLocaleFormat(this.task.date7));
                        }
                    }.bind(this));
                this.initializedExpectedFinishDateField = true;
            }

            if (task.date7) {
                $taskExpFinDateInput.val(ServerTimeFormat.getDateInLocaleFormat(task.date7));
            } else {
                $taskExpFinDateInput.val(ServerTimeFormat.getTodaysDateInLocaleFormat());
            }
        },
        initializeTaskManagerField: function() {
        var $task = this.$el,
            $taskMangerInput = $task.find(".task-manager input");
            if (!this.initializedTaskManagerField) {
                $taskMangerInput.select2({
                        placeholder: TBD_PLACEHOLDER,
                        allowClear: true,
                        dropdownParent: $taskMangerInput,
                        dropdownAutoWidth: true,
                        query: this.managerDropDownQuery.bind(this),
                        initSelection: this.managerDropDownInitSelection.bind(this)
                    })
                    .on("change", this.onGenericTaskPropertyInputChange.bind(this, "manager"));
                }
                $taskMangerInput.select2("val", $task.data('model').manager);
                this.initializedTaskManagerField = true;
        },
        onFullkitTaskClick :function(evt){
            var isProjectReadOnly = stl.app.isProjectOpenInViewOnlyMode();
            if (isProjectReadOnly) 
                return;
            $(".tool-popup").hide();
            $(evt.target).closest(".task").find(".tool-popup").show();
            evt.stopPropagation();
        },
        hideToolbarButtonsForStreams: function(){
            this.$el.find(".subtask-header-createStream-icon").css("visibility","hidden");//hide();
            this.$el.find(".subtask-header-deleteStream-icon").css("visibility","hidden");
        },
        showToolbarButtonsForStreams: function(){
            this.$el.find(".subtask-header-createStream-icon").css("visibility","visible");
            this.$el.find(".subtask-header-deleteStream-icon").css("visibility","visible");
        },
        convertExistingSubtasksToStream: function(){
            var me = this;
            var newStream = this.createNewStream();
            _.each(this.task.subtasks, function(subtask){
                subtask.streamId = newStream.streamId;
            });

        },
        addSelectionHandlerToSeparators: function(){
            var separators = this.$el.find(".subtask-separator");
            $(separators).off("click").on("click", this.selectAllSubtasksOfTheStream);
        },

        bindSubtaskTypeSpecificProperties: function() {
        	var $task = this.$el,
        		taskmodel = this.task;
            $task.find(".subtask-specific-property").hide();
            var $specificProperties = $task.find(".subtask-specific-property-" + this.getSubtaskTypeString(taskmodel.subtaskType));
            this.showHideSubtaskColumnsBySubtaskType($task, taskmodel);
            this.removeHiddenSubtaskTypeOption($task, taskmodel);
            this.hideToolbarButtonsForStreams();
            $task.find(".STREAM_RATE_textbox").hide();
            $task.find(".STREAM_OFFSET_textbox").hide();
            $task.find(".Stream-rate-label").hide();
            $task.find(".Stream-offset-label").hide();
            // This class is used to show a different "not started" icon when subtask rollup type is rate-based
            if (this.task.subtaskType == SubtaskTypesEnum.VOLUME) {
                $task.addClass("subtask-type-rate");
                if ($task.hasClass("subtask-type-stream")){
                    $task.removeClass("subtask-type-stream")
                }
            } 
            else if(this.task.subtaskType == SubtaskTypesEnum.WIP){
                $task.find(".WIP_Limit_textbox").show();
                if ($task.hasClass("subtask-type-stream")){
                    $task.removeClass("subtask-type-stream")
                }
            }
            else if(this.task.subtaskType == SubtaskTypesEnum.STREAMS){
                $task.find(".WIP_Limit_textbox").hide();
                $task.removeClass("subtask-type-rate");
                this.showToolbarButtonsForStreams();
                //this.addSelectionHandlerToSeparators();
                $task.find(".STREAM_RATE_textbox").show();
                $task.find(".STREAM_OFFSET_textbox").show();
                $task.find(".Stream-rate-label").show();
                $task.find(".Stream-offset-label").show();
                if (!$task.hasClass("subtask-type-stream")){
                    $task.addClass("subtask-type-stream")
                }
                //this.convertExistingSubtasksToStream();
            }
            else {
                $task.find(".WIP_Limit_textbox").hide();
                $task.removeClass("subtask-type-rate");
                if ($task.hasClass("subtask-type-stream")){
                    $task.removeClass("subtask-type-stream")
                }
            }
        },

        getSubtaskTypeString: function(subtaskType) {

            switch(subtaskType) {
                case SubtaskTypesEnum.SEQUENTIAL:
                    // no data at task level
                    return "sequential";
                    break;
                case SubtaskTypesEnum.VOLUME:
                   return "volume";
                    break;
                case SubtaskTypesEnum.WIP:
                    return "wip";
                    break;
                case SubtaskTypesEnum.PARALLEL:
                   return "resource";
                    break;
            }
        },

        showHideSubtaskColumnsBySubtaskType: function() {
            //Vrushali - Commenting this function since so separate handling of column headers is required currently.
        	/*var $task = this.$el,
        		taskmodel = this.task;
            $task.find(".subtask-header-duration,"
                + " .subtask-header-resources").addClass("hidden");
            $task.find(".subtask .subtask-duration,"
                + " .subtask .subtask-resources").addClass("hidden");
            switch(taskmodel.subtaskType) {
                case "1":
                    $task.find(".subtask-header-duration, .subtask-header-resources").removeClass("hidden");
                    $task.find(".subtask-duration, .subtask-resources").removeClass("hidden");
                    break;
                case "2":
                    // TODO - not sure what we show for this one (if anything)
                    break;
                case "3":
                    $task.find(".subtask-header-duration, .subtask-header-resources").removeClass("hidden");
                    $task.find(".subtask-duration, .subtask-resources").removeClass("hidden");
                    break;
                case "4":
                    $task.find(".subtask-header-duration, .subtask-header-resources").removeClass("hidden");
                    $task.find(".subtask-duration, .subtask-resources").removeClass("hidden");
                    break;
            }*/
        },

        modifyTaskColor:function(phase_id,taskcount){
            var $task = this.$el;
            var selection = stl.app.getCurrentHighLightOption();//[DH]: to obtain proper highlight option
            switch (selection) {
                case RESOURCES:
                    this.updateTaskResourceColors();
                    break;
                case PHASES:
                    if(taskcount==1){
                        var phaseColorId = this.project.getPhaseColorMap()[this.project.getPhaseById(phase_id).name];
                        updateLegend(false,phaseColorId,this.project.getPhaseById(phase_id).name);
                    }
                    break;
                case TASK_MANAGERS:
                    this.updateTaskManagerColors();
                    break;
            }
        },
        /**
         * Set the relevant resource coloring CSS class tags on this task to enable
         * highlighting when selected from the resource highlighting menu
         */
        updateTaskResourceColors: function() {
            var me = this,
                allResources = this.getAvailableResourceOptions(),
                colorMap = this.project.getResourceColorMap(),
                $task = this.$el;
            $task.attr('class').split(/\s+/).forEach(function(className) {
                if (className.indexOf("has-resource-") === 0) {
                    $task.removeClass(className);

                }
                if (className.indexOf("highlight-resource-") === 0) {
                    $task.removeClass(className);

                }
            });
            this.task.resources.forEach(function(assignedResource) {
                var resourceColorId = colorMap[assignedResource.resourceId];
                var currentHighLightOption = stl.app.getCurrentHighLightOption();
                $task.addClass("has-resource-" + assignedResource.resourceId);
                if ((currentHighLightOption === RESOURCES) && resourceColorId) {
                   
                    if(resourceColorId && $(".highlight-resources-popup .tool-item:eq("+(resourceColorId)+")").find('input').is(":checked")){
                        $task.addClass("highlight-resource-"+resourceColorId);
                        //[DH] CON-1716: removed -1 since it was adding inappropriate option in legends.
                        updateLegend(true,resourceColorId,$(".highlight-resources-popup .tool-item:eq("+(resourceColorId)+")").find(".resource-name").text());
                    }
                }
            });
        },
        updateTaskPhaseColors:function(){
            delete this.project._phaseColorMap;
            var me = this,
                allPhases = this.project.phases,
                colorMap = this.project.getPhaseColorMap(),
                $task = this.$el;
            $task.attr('class').split(/\s+/).forEach(function(className) {
                if (className.indexOf("has-phase-") === 0) {
                    $task.removeClass(className);

                }
                if (className.indexOf("highlight-phase-") === 0) {
                    $task.removeClass(className);

                }
            });            
            var phaseColorId = colorMap[this.project.getPhaseById(this.task.phaseId).name];
            if (phaseColorId) {
                $task.addClass("has-phase-" + stringToHex(this.project.getPhaseById(this.task.phaseId).name.replace(/ /g,'')));
                $task.addClass("has-phase-" + stringToHex(this.task.phaseId));
            }
            var currentHighLightOption = stl.app.getCurrentHighLightOption();
            if ((currentHighLightOption === PHASES) && phaseColorId && $(".highlight-phases-popup .tool-item:eq("+(phaseColorId)+")").find('input').is(":checked")) {
                $task.addClass("highlight-phase-"+phaseColorId);
				
                var $matrixParent = $task.closest(".phase-column").parent().parent(),//gives matrix parent which contains all phases
                $allTasksInCell = $matrixParent.find(".task.has-phase-"+stringToHex(this.task.phaseId)),
                taskCount = $allTasksInCell.length;

                if(taskCount === 1) {
                    //[DH] CON-1716: removed -1 since it was adding inappropriate option in legends.
                    updateLegend(true,phaseColorId,this.project.getPhaseById(this.task.phaseId).name);
                }
            }
        },
        updateTaskManagerColors:function(){
            var me = this,
                allTaskManagers = DataStore.ProjectManagerList,
                colorMap = this.project.getTaskManagerColorMap(),
                $task = this.$el;
            $task.attr('class').split(/\s+/).forEach(function(className) {
                if (className.indexOf("has-task-manager-") === 0) {
                    $task.removeClass(className);

                }
                if (className.indexOf("highlight-task-manager-") === 0) {
                    $task.removeClass(className);

                }
            });            
            var taskManagerColorId = colorMap[this.task.manager];
            if (taskManagerColorId) {
                $task.addClass("has-task-manager-" + stringToHex(this.task.manager.replace(/ /g,'')));
            }
            var currentHighLightOption = stl.app.getCurrentHighLightOption();
            
            if((currentHighLightOption === TASK_MANAGERS) && taskManagerColorId && $(".highlight-task-managers-popup .tool-item:eq("+(taskManagerColorId)+")").find('input').is(":checked")){
                $task.addClass("highlight-task-manager-"+taskManagerColorId);
                updateLegend(true,taskManagerColorId,$(".highlight-task-managers-popup .tool-item:eq("+(taskManagerColorId)+")").find(".task-manager-name").text());
            }
        },
        updateCCTaskColor: function($task, task) {
        	var $task = this.$el,
        		taskmodel = this.task;
            if (task.isCritical) {
                $task.addClass("isCCTask");
            }
        },

        getAvailableResourceOptions: function() {
            // TODO maybe cache this transformed result; project is already caching its results
            this.cachedAvailableResourceOptions = this.project.getAvailableResources().map(function(res) {
                return { id: res.uid, text: res.Name };
            });
            this.cachedResourcesById = this.project.getAvailableResourcesByUid();
            return this.cachedAvailableResourceOptions;
        },

        // Invalidate the local caching that the task view does for resource options
        invalidateResourceCache: function() {
            delete this.cachedResourcesById;
            delete this.cachedAvailableResourceOptions;
            delete this.resourceHighlightMenuIsCurrent;
        },

        getGlobalResourceObjWithUpdatedBaseCalendar: function (res) {
            var resource = jQuery.extend(true, {}, res);
            resource.BaseCalendarName = stl.app.ProjectDataFromServer.projectCalendarName;
            return resource;
        },

        getResourceObj: function (res) {
            var resource = jQuery.extend(true, {}, res);
            return resource;
        },

        getResourceById: function (resourceUid) {
            if (!this.cachedResourcesById) {
                this.getAvailableResourceOptions();
            }
            var res;
            if (CalendarStore.GetInheritProjCalForResFlag()) {
                res = this.getGlobalResourceObjWithUpdatedBaseCalendar(this.cachedResourcesById[resourceUid]);
            } else {
                res = this.getResourceObj(this.cachedResourcesById[resourceUid]);
            }
            return res;
        },

        getAvailableManagerOptions: function() {
            if (!this.cachedAvailableManagerOptions) {
                var byId = {};
                this.cachedAvailableManagerOptions = this.availablePeopleAndTeams
                    .sort(function(a, b) {
                        return a.FullName.localeCompare(b.FullName);
                    })
                    .map(function(manager) {
                        var id = manager.Name;  // FIXME, need UID here but server doesn't provide it
                        byId[id] = manager;
                        return { id: id, text: manager.FullName };
                    });
                this.cachedManagersById = byId;
            }
            return this.cachedAvailableManagerOptions;
        },

        checkConstrainingTask: function (eventData) {
            var isConstrainingTask = false;
            if (eventData && $(eventData.currentTarget).find(".task").hasClass("constrainingSuccessorTask")) {
                isConstrainingTask = true;
            }
            return isConstrainingTask;
        },

        checkResourceContentionTask: function (eventData) {
            var isResourceContentionTask = false;
            if (eventData && $(eventData.currentTarget).find(".task").hasClass("resourceContentionTask")) {
                isResourceContentionTask = true;
            }
            return isResourceContentionTask;
        },

        checkSlackTask: function (eventData) {
            var isSlackTask = false;
            if (eventData && $(eventData.currentTarget).find(".task").hasClass("slack")) {
                isSlackTask = true;
            }
            return isSlackTask;
        },

        checkChainHighlightedTask: function (eventData) {
            var isTaskChainHighlighted = false;
            var highlightChainArr = [];
            var classList = [];
            if (eventData){
                if (eventData.currentTarget){
                    classList = eventData.currentTarget.classList;
                }
            }

            _.each(classList,function(classVal,index) {
                if (classVal.indexOf("highlight-chain-")>-1) {
                    highlightChainArr.push(classVal);
                }
            });
            return highlightChainArr;
        },
        enterQuickEditMode: function(eventData) {
            if( this.insertBefore !== INSERT_TASK_BEFORE_TIMELINE_VIEW && stl.app.matrixView && stl.app.matrixView.zoomLevel > 2)
                return;
            var $task = this.$el;
           
            /*CON-2361 -Performance: overaly task over other tasks in quick edit mode
            In Quick edit we make the task position as 'absolute', due to which the tasks next to it colapses
            to left below the task which has been opened in quick edit.
            So we needed a div space holder for quick edit mode */
            if(this.task.taskType === "fullkit" || this.project.checkIfZeroDurationTask(this.task))
                $task.after('<div class="task-spaceholder-fk"></div>');
            else
                $task.after('<div class="task-spaceholder"></div>');
            if(!this.initializedQuickEdit)
                this.initializeTaskQuickEditMode($task);

            this.wasAlreadyFK = $task.hasClass("fk");
            this.wasAlreadyZoomSmall = $task.hasClass("task-zoom-small");
            if (this.task.taskType === "fullkit") {
                $task.removeClass("fullkit");
                // $task.removeClass("task")
                $task.addClass("fk");
            }
             $task.addClass("quick-task-edit task-zoom-small");
             $task.attr('data-qtip', '');
             if ($task.find(".task-content-wrapper").width() < QUICK_ENTRY_TASK_WIDTH) {
                $task.find(".task-content-wrapper").width(QUICK_ENTRY_TASK_WIDTH );
            }
            var highlightOptionSelected = stl.app.getCurrentHighLightOption(); 
            //this snippet is written to add the constrainingSuccessorTask class to the task in quick edit mode
            // if the task in normal view has the same class. This is to keep the tasks highlighted in quick edit mode
            // this is done only for constrainingSuccessorTask since we don't have the class applied to that task div at start
            var highlightChainArr;
            if (this.checkConstrainingTask(eventData)) {
                $task.addClass("constrainingSuccessorTask");
            } else if (this.checkResourceContentionTask(eventData)) {
                $task.addClass("resourceContentionTask");
            } else if (this.checkSlackTask(eventData)) {
                $task.addClass("slack");
            } else if ((highlightChainArr = this.checkChainHighlightedTask(eventData)) && highlightChainArr.length>0) {
                $task.addClass(highlightChainArr.join(" "));
            }
           
            $task.find(".subtask-type").hide();
            var $overflowNameField = $task.find(".task-name-overflow-edit");
            $overflowNameField.text($task.find(".task-name input").val());
                // Match overflow text background to task name background (for when it overflows out of task bar)
               // .css("background", $task.find(".task-name").css("background"));
            if (!this.readOnly) {
                $overflowNameField.focus();
                setTimeout(function() {
                    // Select all text in the overflow name field
                    range = document.createRange();
                    range.selectNodeContents($overflowNameField[0]);
                    sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }, 0);
                // NOTE here we simulate a click event because a mouse click gets lost somehow during
                // the focus event.  The line that causes the mouse click not to fire when clicking in 
                // [.task-name input] is the line [$task.addClass("quick-task-edit")] above.
                //$task.find(".task-name input").trigger("click");
            }
            this.hideSubtasksRegion($task);
            this.processZeroDurationTask();
            $(this).trigger("enterquickedit");
        },

        initializeTaskQuickEditMode: function($task) {
            var $statusSelect = $task.find(".task-status select");
            var task = this.task;
            if (!this.initializedQuickEdit) {
                $statusSelect.select2({
                        dropdownAutoWidth: true,
                        minimumResultsForSearch: -1
                    })
                    .on("change", this.onStatusDropdownChange.bind(this));
            }
            //load values
            $statusSelect.select2('val', task.status);
            switch(task.taskType){
                case ( TASKTYPE_FULLKIT ):
                this.initializeExpectedFinishDateField($task)
                this.initializeTaskManagerField();
                break;
                case ( TASKTYPE_PT ):
                 this.initializeExpectedFinishDateField($task)
                 break;
                case ( TASKTYPE_SNET ):
                  this.initializeSnetDateField($task);
                break;
                default:
            }
            this.initializedQuickEdit = true;
        },

        exitQuickEditMode: function() {
            var me = this;
            var $task = this.$el;
            //CON-2361 -Performance: overaly task over other tasks in quick edit mode
            //remove the place holder which was created while entering to quick edit
            $task.next('.task-spaceholder, .task-spaceholder-fk').remove();
            $task.removeClass("quick-task-edit");
            $task.attr('data-qtip', $task.find('.task-name input').val());
            if (!this.wasAlreadyZoomSmall) {
                $task.removeClass("task-zoom-small");
            }

            if (this.task.taskType === "fullkit" && !this.wasAlreadyFK) {
                $task.removeClass("fk");
                $task.addClass("fullkit");
                $task.addClass("task");
            }
            $task.find(".task-name-overflow-edit")
                .css("background", "transparent");
            if (!me.readOnly) {
                var overflowName = $task.find(".task-name-overflow-edit").text();
                if(overflowName.trim()){
                    $task.find(".task-name input").val(overflowName);
                 	$task.data("linkable-element-name", overflowName);
		    me.saveNameField(overflowName);
                }
                else{
                    var taskdata = $task.data("model");
                    $task.find(".task-name-overflow-edit").text(taskdata.name);
                    PPI_Notifier.info(EMPTY_TASK_NAME_NOT_ALLOWED);
                }
                 
                me.checkTaskForDefaultName($task);    
                //this.saveOnQuickEdit();

            }
            if(stl.app.matrixView && stl.app.matrixView.zoomLevel == 0)
                $task.find(".task-controls").css("display",'');

            
            this.processZeroDurationTask();
            $(this).trigger("exitquickedit");
            $(this).trigger("change");
            //refresh links for all tasks after quick edit
            if(stl.app.matrixView){
                stl.app.matrixView.refreshLinks();
            }
        },

        onClickForMultiSelect: function(evt, isClickFromZoom){
            var me = this,
            $task = this.$el,
            task = this.task;
            if (window.currentViewId !="matrix") return;
            if (!$(evt.target).hasClass("drag-drop-handle") && !event.ctrlKey 
                && (!(stl.app.matrixView.multipleSelectedTasks && stl.app.matrixView.multipleSelectedTasks[task.uid]))){
                $(document).trigger("taskMultiSelectEnd");
            }

            
            if ($(evt.target).hasClass("drag-drop-handle") || 
                (!stl.app.matrixView.multipleSelectedTasks || !stl.app.matrixView.multipleSelectedTasks[task.uid]) ||
                event.ctrlKey || isClickFromZoom){
                $(document).trigger("taskMultiSelect", [null, task]);
                return false;
            }

            
            return true;
        },

        isNameInEditMode: function(evt){
            var $task = this.$el;
            var displayedTaskName = $task.find(".task-name-overflow-edit").text();
            var taskName = this.task.name;
            if (displayedTaskName == taskName){
                return false;
            } else {
                return true;
            }
        },

        revertTasName: function(evt){
            var $task = this.$el;
            $task.find(".task-name-overflow-edit").text(this.task.name);
        },

        onClick: function(evt) {
            if(!$(evt.target).hasClass('add-task-plus-icon')){
                var me = this,
                    $task = this.$el,
                    task = this.task;
                
                if (!this.onClickForMultiSelect(evt)){
                    return;
                }

                
                  if (this.readOnly) {
                    // Additional entry point for quick-edit mode here because text field focus
                    // doesn't happen in readonly mode
                    if ($task.hasClass("task-zoom-normal")
                        || $task.hasClass("quick-task-edit")) 
                    {
                        return;
                    }
                    me.enterQuickEditMode();
                }
                if(!this.readOnly && !$task.hasClass("quick-task-edit") && !$task.hasClass("task-zoom-normal")){
                    
                    if(stl.app.matrixView && (stl.app.matrixView.zoomLevel != 3 || task.taskType == "fullkit"))
                        me.enterQuickEditMode();
                    $task.find(".task-controls").css("display",'inline');
                    
                    
                }
            }
        },

        wireSubTaskEvents: function() {
            //Placeholders.enable();
            var me = this;
            this.$el.find(".subtasks li .subtask-name textarea").on('change', function(evt){
                var el = this;
                  setTimeout(function(){
                    el.style.cssText = 'height:auto; padding:0';
                    // for box-sizing other than "content-box" use:
                    // el.style.cssText = '-moz-box-sizing:content-box';
                    el.style.cssText = 'height:' + el.scrollHeight + 'px';
                  },0);
            });
            this.$el.find(".subtasks li .subtask-name textarea").on("focus", function(evt) {
                var $input = $(evt.target),
                     $li = $input.closest("li");
                     if ($li.hasClass("proto-subtask")) {
                        $input.val(""); 
                        $input.removeClass("placeholdersjs");
                        if (!stl.app.isPasteExternalInitiated())
                            stl.app.initPasteExternalEvent(me.pasteSubtasksCallbk.bind(me));
                    }   
               evt.stopPropagation();
            });


            this.$el.find(".subtasks li .subtask-name textarea").on("keypress", function(evt) {
                if (evt.which == 13) {
                    evt.preventDefault();
                    var $input = $(evt.target),
                     $li = $input.closest("li");
                     if ($li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                        if (me.task.subtaskType == SubtaskTypesEnum.STREAMS){
                            var streamId = me.getStreamId($li);
                            var subtask = me.renderNewSubtask($li,$input.val(),false,true, null, streamId);
                        } else {
                            var subtask = me.renderNewSubtask($li,$input.val(),false,true);
                        }
                        var subtasks = [];
                        me.populateSubtasksInfoForUndo(subtask, me.getSubtaskIndex($li), subtasks);
                        stl.app.undoStackMgr.pushToUndoStackForSubtaskAdd(me, me.task, subtasks);
                    }   
                }
               evt.stopPropagation();
            });
            this.$el.find(".subtasks li .subtask-name textarea").on("blur", function(evt) {
               
                    var $input = $(evt.target),
                    $li = $input.closest("li");
                    if ($li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                        if (me.task.subtaskType == SubtaskTypesEnum.STREAMS){
                            var streamId = me.getStreamId($li);
                            var subtask = me.renderNewSubtask($li,$input.val(),false,true, null, streamId);
                        } else {
                            var subtask = me.renderNewSubtask($li,$input.val(),false,true);
                        }
                        
                        var subtasks = [];
                        me.populateSubtasksInfoForUndo(subtask, me.getSubtaskIndex($li), subtasks);
                        stl.app.undoStackMgr.pushToUndoStackForSubtaskAdd(me, me.task, subtasks);
                    }
                    else {
                        if(!$li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                            $(this).closest('li').data("model").name = $input.val();
                    }
                    else if(!$li.hasClass("proto-subtask") && $input.val() === EMPTY_STRING) {
                        var subtaskOldName = $(this).closest('li').data("model").name;
                        $(this).val(subtaskOldName);
                    }
                }
                stl.app.removePasteEventListener();
                Placeholders.enable();
                evt.stopPropagation();
            });

            this.$el.find(".subtasks li .subtask-checklist-icon").off().on("click", function (evt) {
                if(window.currentViewId == "timeline" || window.currentViewId == "chainview"){
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                        Ext.getCmp('chainview').showChecklistPopupForSubtask($(evt.target).closest("li"));
                    else
                        Ext.getCmp('timelineview').showChecklistPopupForSubtask($(evt.target).closest("li"));
                }else
                    $(".matrix-view").data("view").showChecklistPopupForSubtask($(evt.target).closest("li"));
                evt.stopPropagation();
            });             
           
            // update model on any text field change in a list item
            // this.$el.find(".subtasks li input").on("change", function(evt) {
            //     me.save();
            // });
           
        },

        setDefaultSubtaskTypeAndWIPLimit : function() {       
                 //this.task.subtaskType = stl.app.getDefaultSubtaskType();
                 //this.task.subtasksWIPLimit = stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT');
                 this.$el.find('#task-subtask-type-select').select2("val",this.task.subtaskType) ;
                 this.$el.find('#task-wip-limt-txt').val(this.task.subtasksWIPLimit) ;
                 this.$el.find('#task-stream-offset-txt').val(ValidationClassInstance.getValidDurationString(this.task.subtaskStreamOffset, TASK_DURATION_DEFAULT, false)) ;
                 this.$el.find('#task-stream-rate-txt').val(this.task.subtaskStreamRate) ;

            
        },
        addNewSubtask:function(val,$li, streamId){
            var me = this;
            var task = me.$el.data("model");
            var newSubtask;
            if (streamId){
                if(typeof val == "string")
                    newSubtask = me.project.createSubtask({
                        name: val,
                        streamId: streamId
                    },task);
                else{
                    newSubtask = val;
                    newSubtask.uid = me.project.getNextUID("subtask");
                    newSubtask.id = newSubtask.uid;
                    newSubtask.streamId = streamId;
                }
            } else {
                if(typeof val == "string")
                    newSubtask = me.project.createSubtask({
                        name: val
                    },task);
                else{
                    newSubtask = val;
                    newSubtask.uid = me.project.getNextUID("subtask");
                    newSubtask.id = newSubtask.uid;
                }
            }
            
            me.bindSubtask($li, newSubtask);
            return newSubtask;
        },
        getStreamId: function($li){
            var $prev = this.getPreviousSubtaskElement($li)
            if ($prev){
                return $prev.data("model").streamId;
            } else {
                var stream = this.createNewStream();
                $(this.getStreamSeparatorElement(stream)).insertBefore($li);
                return stream.streamId;
            }
        },
        getStreamIdOfTheChangedName: function(evt){
            var subtask = $(evt.target).closest("li").next("li:not(.proto-separator)");
            var subtaskModel = subtask.data("model");
            return subtaskModel.streamId;
        },
        updateStreamName: function(evt){
            var newStreamName = $(evt.target).val();
            var streamId = this.getStreamIdOfTheChangedName(evt);
            var savedStream = _.find(this.task.subtaskStreams, function(stream){
                return stream.streamId == streamId;
            });
            var oldStreamName = savedStream.name;
            savedStream.name = newStreamName;
            this.updateSubtaskNamesOfStream(oldStreamName, savedStream);
            this.handleSubtaskBlock();
        },
        updateSubtaskNamesOfStream: function(oldVal, stream){
            var subtasks = _.filter(this.task.subtasks, function(subtask){
                return subtask.streamId == stream.streamId;
            });
            _.each(subtasks, function(subtask){
                if (subtask.name.indexOf(oldVal.trim()) == 0){
                    subtask.name = subtask.name.replace(oldVal.trim(), stream.name);
                }
            })
        },
        showHideSubtasksOfStreams: function(evt){
            var $separator = $(evt.target).closest("li");
            var $firstSubtaskOfStream = $separator.next("li").hasClass("proto-separator") ? $separator.next("li").next("li") : $separator.next("li");
            var firstSubtaskOfStream = $firstSubtaskOfStream.data("model");
            var stream = _.find(this.task.subtaskStreams, function(subtaskStream){
                return subtaskStream.streamId == firstSubtaskOfStream.streamId;
            });
            var isStreamExpanded = stream.isExpandedState;
            if (stream.isExpandedState){
                if (stream.streamPriority == this.task.subtaskStreams.length){
                    $separator.nextUntil(".proto-subtask:not(.proto-separator)").hide();
                } else {
                    $separator.nextUntil(".subtask-separator:not(.proto-subtask)").hide();
                }
                
                stream.isExpandedState = false;
                $(evt.target).removeClass("stream-header-collapse").addClass("stream-header-expand");
            } else {
                if (stream.streamPriority == this.task.subtaskStreams.length){
                    var $elems = $separator.nextUntil(".proto-subtask:not(.proto-separator)");

                } else {
                    var $elems = $separator.nextUntil(".subtask-separator:not(.proto-separator)");
                }
                $elems = _.reject($elems, function(elem){
                    return $(elem).hasClass("proto-separator");
                });
                $elems = $($elems).show();
                
                stream.isExpandedState = true;
                $(evt.target).removeClass("stream-header-expand").addClass("stream-header-collapse");
            }

        },
        getStreamSeparatorElement: function(streamData){
            var $streamSeparatorTemplate = this.$el.find(".proto-separator");
            var $streamSeparatorElement = $streamSeparatorTemplate.clone(true).removeClass("proto-separator").addClass("subtask-separator");
            var $extensionMenuIcon = $streamSeparatorElement.find(".stream-header-extension-menu");
            var $moveUpIcon = $streamSeparatorElement.find(".stream-header-singlemoveup");
            var $moveDownIcon = $streamSeparatorElement.find(".stream-header-singlemovedown");
            var $selectStreamIcon = $streamSeparatorElement.find(".subtask-stream-checkbox");
            var $streamExpandCollapseIcon = $streamSeparatorElement.find(".stream-header-expand");
            var $streamNameTextarea = $streamSeparatorElement.find(".streamName");
            $streamNameTextarea.val(streamData.name);
            $streamNameTextarea.attr('title',streamData.name);
            
            $extensionMenuIcon.off("click").on("click", this.showExtensionMenuForStreams);
            $selectStreamIcon.off("change").on("change", this.selectSubtasksOfStream);
            $moveUpIcon.off("click").on("click", this.moveHandlerOfStreams);
            $moveDownIcon.off("click").on("click", this.moveHandlerOfStreams);
            $streamNameTextarea.off("change").on("change", this.updateStreamName.bind(this));
            if(streamData.isExpandedState){
                $streamExpandCollapseIcon.removeClass("stream-header-expand").addClass("stream-header-collapse");
            }
            $streamExpandCollapseIcon.off("click").on("click", this.showHideSubtasksOfStreams.bind(this));
            $streamNameTextarea.keydown(function(e){
                if (e.keyCode == 13)
                {
                    e.preventDefault();
                    $streamNameTextarea.trigger("blur");
                }
            });
            return $streamSeparatorElement;

        },
        showExtensionMenuForStreams: function(evt){
            var $clickTarget = $(evt.target);
            //buttonOffset = $downloadButton.offset(),
            var $extensionMenu = $(evt.target).closest(".task").data("view").getExtensionMenuForStreams(evt);
            if ($extensionMenu){
                var showing = $extensionMenu.is(":visible");
                var posX = $(".matrix-view-viewport").offset().left,
                posY = $(".matrix-view-viewport").offset().top;
                $(".tool-popup").hide();
                if (!showing) {
                    $extensionMenu.show();
                    $extensionMenu.css({
                        top: evt.pageY,
                        left: evt.pageX
                    });
                }
            }
            if (typeof evt.stopPropagation == "function") {
                evt.stopPropagation();
            } else {
                evt.cancelBubble = true;
            }
        },
        renderNewSubtask: function($li,val,focusNewList,loadTask,addAfterSel,streamId, focusOnAddedSubtask) {
            // todo add next row w/ proto class
            var  me=this,
            addTosubtask,
            arrOfExistingSubtasks=[],

            $newLi = $li.clone(true);

            if(streamId!=null)
             for(var i=0;i<(me.task.subtasks).length;i++){
                if(me.task.subtasks[i].streamId===streamId){

                    var subTaskName= me.task.subtasks[i].name;
                    var subtaskIndex= subTaskName.indexOf(DEFAULT_STREAM_SUBTASK_NAME);
                    if(subtaskIndex!==-1){
                        var lastdigits= subTaskName.substr(subtaskIndex+DEFAULT_STREAM_SUBTASK_NAME.length);
                        if(!(isNaN(lastdigits))){
                             arrOfExistingSubtasks.push(lastdigits);
                        }
                       
                    }
                    if(arrOfExistingSubtasks.length!==0){
                       addTosubtask= Math.max.apply(null, arrOfExistingSubtasks);
                    }
                }
            }
            else{
                addTosubtask= (me.task.subtasks).length;
            }

            //In case of new stream crteated, append 1 to the default new subtask created

            if (typeof(val)== "string" &&  val.indexOf(DEFAULT_STREAM_NAME)!==-1){
                if(addTosubtask!=undefined){
                    val= val+ (addTosubtask+1);
                }
                else{
                    val= val+1;
                }
            }
            
            
            if(me.task.subtaskCount === 0){
                 this.setDefaultSubtaskTypeAndWIPLimit();
                 this.bindSubtaskTypeSpecificProperties();
            }
            var isSubTaskTypeStream = (this.$el.data("model").subtaskType == SubtaskTypesEnum.STREAMS);
            
            if(addAfterSel){
                $li.insertAfter(addAfterSel);
            }
            $li.parent().append($newLi);
            $newLi.find("textarea").val("");
           // $newLi.find("input[type=checkbox]").prop("checked", false);
            var task = me.$el.data("model");
            if (isSubTaskTypeStream){
                 streamId = streamId ? streamId : this.getStreamId($li); 
            }
            var newSubtask = streamId ? this.addNewSubtask(val,$li, streamId) : this.addNewSubtask(val,$li);
           
            $li.removeClass("proto-subtask");
            
            

            //$li.closest(".subtasks ul").sortable("refresh");
            if(loadTask){
                me.saveSubtasks(me.$el);
    			me.$el.trigger("rollupDurationChange");
            }
            // enter key moves down to next row
            if(focusNewList)
            $li.next("li").find(".subtask-name textarea").focus();

            if (focusOnAddedSubtask){
                $li.find(".subtask-name textarea").focus();
                //me.$el.find("#OK_BUTTON_Key").focus();
                if (window.currentViewId == "matrix"){
                    $(".matrix-view").data("view").scrollIntoView(this.$el);
                }
            }

            if (!this.$el.find(".rollUp-Btn-group.btn-group").is(":visible"))
                this.$el.find(".rollUp-Btn-group.btn-group").show();

            return newSubtask;
        },

        getPreviousSubtaskElement: function($li){
            var noElement = false;
            while(!($li.prev() && $li.prev().length>0 && $li.prev().data("model"))){
                if (!$li.prev() || $li.prev().length == 0){
                    noElement = true;
                    break;
                }
                $li = $li.prev();
            }
            return noElement ? null : $li.prev();
        },

        getNextSubtaskElement: function($li){
            var noElement = false;
            while(!($li.next() && $li.next().length>0 && $li.next().data("model"))){
                if (!$li.next() || $li.next().length == 0 || $li.next().hasClass("proto-subtask")){
                    noElement = true;
                    break;
                }
                $li = $li.next();
            }
            return noElement ? null : $li.next();
        },


        checkTaskForDefaultName: function ($task) {
            var taskModel = $task.data("model"),
                taskUid = taskModel.uid,
                //phaseIndex = $task.closest(".phase-column").index(),
                //phase = this.project.phases[phaseIndex],
                //$.grep(this.project.phases, function (item) { return item.uid == $task.data("model").phaseId })
                phase = $.grep(this.project.phases, function (item) { return item.uid == taskModel.phaseId })[0],
                row = $.grep(this.project.rows, function (item) { return item.uid == taskModel.rowId })[0],
                scope = this.project.getScopeItemByUid(row.scopeItemUid);
                if(scope)
                    var scopeName = scope.name;
                var nameInField = $task.find(".task-name input").val();

            if (nameInField !== "" && nameInField.indexOf(this.project.getDefaultTaskNameCompareString(phase.name, scopeName)) !== -1) {
                $task.addClass("has-default-name");
            } else {
                $task.removeClass("has-default-name");
            }
        },

        /***************************load by template***********************************/
        loadByTemplate: function() {
            var templateCfg = this.templateCfg;
            var taskTemplater = stl.app.taskTemplater;
            var taskTemplateModel = templateCfg.task;

            taskTemplateModel.templateProperties = taskTemplater.getTemplateProperties(
                templateCfg.task, this.phase, templateCfg.row, this.project, this.isSubtaskEnabled);
            taskTemplateModel.staticValues = taskTemplater.taskTemplateLabelsAndStrings;
            taskTemplateModel.toolTips = taskTemplater.toolTips;
            var $task = $(taskTemplater.taskBarCompiledTemplate(taskTemplateModel));
            this.$el = $task;
            var $insertBeforeEl = $(this.insertBefore);
            $insertBeforeEl.before($task);
            this.task = taskTemplateModel;
            this.addDataToTaskElement($task, taskTemplateModel);
        },
        loadPartialViewViaTemplate: function(){
            var me = this;
            var $task = this.$el;
            var task =this.task;
            if (this.templateCfg && this.templateCfg.loadViaTemplate && this.insertBefore !== INSERT_TASK_BEFORE_TIMELINE_VIEW && stl.app.loadByTemplating && !me.completeTemplateLoaded) {
                $task.find('.task-content-wrapper').append(stl.app.taskTemplater.taskPropertiesSubtasksCompiledTemplate(task));
                me.wireEvents();
                me.completeTemplateLoaded = true;
            }

        },
	});

})());