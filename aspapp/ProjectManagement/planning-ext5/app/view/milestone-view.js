/**
 * stl.view.MilestoneView
 *
 * UI for a task bar with expandable details section, representing a single task.
 * Contains a list of subtasks along with various task properties.
 *
 * A MilestoneView has a one-to-one correspondence with a task model.
 * The task model is bound via a data attribute on the .task element.
 *
 * Primary methods: load, save (update view and model respectively)
 *
 *   +---------------+  <-- $task.data("model") --> ( task model )
 *   | Task name      >
 *   +---------------+
 *   | Properties   |
 *   +---------------+
 */

stl.view.MilestoneView = function(cfg) {
    var defaults = {
        // TODO
    };
    $.extend(this, defaults, cfg);
     if(cfg.insertAfter ||  cfg.insertBefore) {
        this.render($(cfg.insertBefore) , $(cfg.insertAfter));
    }
    if (cfg.task) {
        this.load(cfg.task);
    }
};

$.extend(stl.view.MilestoneView.prototype, (function() {

    // Private static variables
    var QUICK_ENTRY_TASK_WIDTH = 250;

    // Public API
    return ({

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
            var me = this,
                $task = me.$el;
            this.task = task;
            $task.data("model", task);
            $task.data("view", this);
            $task.attr("id", task.uid);
            if (typeof(task.name) !== "undefined" && task.name !== null) { //task-name-overflow-edit
                $task.find(".task-name input").val(task.name);
                $task.find(".task-name-overflow-edit").text(task.name);
            } else {
                $task.find(".task-name input").val('');
                $task.find(".task-name-overflow-edit").text('');
            }

          
            $task.data("linkable-element-name", task.name); // used for link deletion
            $task.find('#task-id-value').text( task.id);
            this.updateChecklistStatus(task);
            $task.find(".task-checklist-icon").addClass(this.project.getChecklistStatus(task.checklistStatus));

            //this.refreshStatusIndicator();
            this.setQuickEditStatusBox($task);

            var date1 = task.date1 || ServerClientDateClass.getTodaysDate();
            $task.find(".duedate input").val(ServerTimeFormat.getDateInLocaleFormat(date1));
			if(task.taskType ===IPMS_SHORT)
    			$task.addClass("ipms-milestone");
			else if(task.taskType === PEMS_SHORT)
    			$task.addClass("pems-milestone");

//Remove this code  its a duplicate cod ein render milestone
            if (task.taskType != "PE")
                $task.addClass("cms-ims-milestone");
            $task.attr('class').split(/\s+/).forEach(function(className) {
                if (className.indexOf("has-phase-") === 0) {
                    $task.removeClass(className);
                }
                if (className.indexOf("has-task-manager-") === 0) {
                    $task.removeClass(className);
                }
                if (className.indexOf("has-resource-") === 0) {
                    $task.removeClass(className);
                }
                if (className.indexOf("highlight-phase-") === 0) {
                    $task.removeClass(className);
                }
                if (className.indexOf("highlight-task-manager-") === 0) {
                    $task.removeClass(className);
                }
                if (className.indexOf("highlight-resource-") === 0) {
                    $task.removeClass(className);
                }
            });
            var colorMap = this.project.getPhaseColorMap();
            var managerColorMap = this.project.getTaskManagerColorMap();
            var resourceColorMap = this.project.getResourceColorMap();
            var phaseColorId = colorMap[this.project.getPhaseById(task.phaseId).name];
            if (phaseColorId) {
                $task.addClass("has-phase-" + stringToHex(this.project.getPhaseById(task.phaseId).name.replace(/ /g, '')));
                $task.addClass("has-phase-" + stringToHex(this.task.phaseId));
            }
            if (phaseColorId && $(".highlight-phases-popup .tool-item:eq(" + (phaseColorId - 1) + ")").find('input').is(":checked")) {
                $task.addClass("highlight-phase-" + phaseColorId);
                updateLegend(true, phaseColorId, $(".highlight-phases-popup .tool-item:eq(" + (phaseColorId - 1) + ")").find(".phase-name").text());
            }
            var managerColorId = managerColorMap[task.manager];
            if (managerColorId) {
                $task.addClass("has-task-manager-" + stringToHex(task.manager.replace(/ /g, '')));
            }
            if (managerColorId && $(".highlight-task-managers-popup .tool-item:eq(" + (managerColorId - 1) + ")").find('input').is(":checked")) {
                $task.addClass("highlight-task-manager-" + managerColorId);
                updateLegend(true, managerColorId, $(".highlight-task-managers-popup .tool-item:eq(" + (managerColorId - 1) + ")").find(".task-manager-name").text());
            }
            if (task.resources) {
                task.resources.forEach(function(assignedResource) {
                    var resourceColorId = resourceColorMap[assignedResource.resourceId];
                    if (resourceColorId) {
                        // $task.addClass("has-resource-" + resourceColorId);
                        $task.addClass("has-resource-" + assignedResource.resourceId);
                        if (resourceColorId && $(".highlight-resources-popup .tool-item:eq(" + (resourceColorId - 1) + ")").find('input').is(":checked")) {
                            $task.addClass("highlight-resource-" + resourceColorId);
                            updateLegend(true, resourceColorId, $(".highlight-resources-popup .tool-item:eq(" + (resourceColorId - 1) + ")").find(".resource-name").text());
                        }
                    }
                });
            }

            $task.find(".task-type select")
                .select2("val", task.taskType);
               
            $task.data("last-height", $task.height());
            this.updateCCTaskColor($task, task);
            if (this.readOnly) {
                $task.addClass("readonly");
            } else {
                $task.removeClass("readonly");
            }

             if (sender) {
                // Re-initialize resource picker
                this.invalidateResourceCache();
                this.onTaskResourceChangeFromTableView($task,task);
            }
            
            //Same line of code is in Task-view.js for fullkit.Should be made a method in diffrent file
            if(this.phase.type !== STRING_NORMAL) {
            if (!task.isAutolinked)
                task.isAutolinked = false;

            this.setAutolinkButonText($task, task);
            /*if (task.isAutolinked) {
                $task.find(".ms-autolink input").prop('checked', true);

            } else {
                $task.find(".ms-autolink input").prop('checked', false);
            }*/
            }
            $task.find(".milestone-color").css("background-color", task.taskColor);
            $task.find(".milestone-quick-edit-color").css("background-color", task.taskColor);
            if(this.isSubtaskEnabled) {
                task.remainingSubtasks = 0;                    
                for (var i = 0; i < task.subtasks.length; i++) {
                    var item = task.subtasks[i];
                    if (item.status != "CO") {
                        task.remainingSubtasks++;
                    }
                }
                task.subtaskCount = task.subtasks.length;
            }
            this.processZeroDurationTask();
            if (task.status === STATUS_CO) {
               this.disableMilestoneProperties($task,true);
            }else {
                 this.disableMilestoneProperties($task,false);
            }
            this.setTooltip(this, task);
        },

        setAutolinkButonText: function($task, task){
            var str = task.isAutolinked ? DISABLE_AUTOLINK : ENABLE_AUTOLINK;
            
            $task.find(".ms-autolink div").text(str);
        },

        processZeroDurationTask: function() {
            var $task =this.$el,
            taskmodel =this.task;
            if(this.project.checkIfZeroDurationMilestoneTask(taskmodel)){
                if(!this.removeAppendIPOptionAlreadyDone)
                    this.removeIPOptionFromTaskStatus($task);
                if(taskmodel.status==STATUS_IP){
                    taskmodel.status==STATUS_NS;
                    this.setTaskStatus(STATUS_NS,$task);
                }
            }
              else{
                  if(!this.removeAppendIPOptionAlreadyDone)
                    this.appendIPOptionForTaskStatus($task);
             }
        },

        setTooltip: function (taskView, task) {
            taskView.$el.attr('data-qtip',task.name);
        },
        showSubtasksRegion: function($task) {
            var subtasksRegion = $task.find(".subtasks");
            if (!subtasksRegion.is(":visible"))
                subtasksRegion.show();
        },

        hideSubtasksRegion: function($task) {
            var subtasksRegion = $task.find(".subtasks");
            if (subtasksRegion.is(":visible"))
                subtasksRegion.hide();
        },

        onTaskZoomClick: function(evt) {
            if (this.task.bufferType !== "None") return;
            if (this.$el.hasClass("quick-task-edit")) {
                this.$el.removeClass("quick-task-edit");
            }
            $(this).trigger("zoom", [evt]);
            evt.stopPropagation();
        },

        onTaskIconMousedown: function(evt) {
            // Only handling this event because zoom icon overlays task name which is a drag handle; must
            // cancel mousedown on zoom/trash icons so drag doesn't start
            evt.stopPropagation();
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

        /**
         * Update the associated model to match everything currently displayed in the task view UI
         * (view -> model)
         */
        save: function() {
            var me = this,
                $task = this.$el,
                taskdata = $task.data("model");
            if (!taskdata) {
                console.warn("Attempt to save task without data model", $task);
                return;
            }
            taskdata.name = $task.find(".task-name input").val();
            taskdata.manager = $task.find(".task-manager input").select2("val");
            // taskdata.date1 = $task.find(".duedate input").val();

            //this.refreshStatusIndicator();
            this.setQuickEditStatusBox($task);

            var msRec = {
                'uid': taskdata.uid,
                'name': taskdata.name,
                'type': taskdata.taskType,
                'taskType': taskdata.taskType,
                'startDate': taskdata.startDate,
                'endDate': taskdata.endDate,
                'date1': taskdata.date1,
                'bufferSize': '',
                'status':taskdata.status
            };
            Ext.getCmp('CCSummarygrid').updateMilestoneSheet(msRec);

            $(this).trigger("change");
            this.setTooltip(this,taskdata);
        },

        /**
         * Renders an empty task UI and inserts it into the DOM before $insertBeforeEl
         */
        render: function($insertBeforeEl , $insertAfterEl) {
            var me = this,
                $taskTemplate = $("#templates div[role=ms-template]"),
                $task = $taskTemplate.clone(true);
            this.$el = $task;
            if ($insertAfterEl && $insertAfterEl.length > 0)
                $insertAfterEl.after($task)
            else
            $insertBeforeEl.before($task);

            this.$el.find(".task-name input").on({
                "focus": function(evt) {
                    // Don't do quick-duration mode unless we're zoomed out
                    if (me.$el.hasClass("task-zoom-normal")) {
                        evt.stopPropagation();
                        return;
                    }
                    me.enterQuickEditMode();
                },
                "change": function(evt, val) {
                    me.$el.data("linkable-element-name", val);
                    //if (me.$el.hasClass("has-default-name")) {
                    // FIXME

                    //}
                    me.save();
                }
            });
            this.$el.find(".task-name-overflow-edit").on("keyup", function(evt) {
                // When ENTER pressed in task name overlay editor, commit changes (otherwise browser will insert linebreak and keep editing)
                if (evt.which === 13) {
                    me.exitQuickEditMode();
                }
            });
            // this.$el.find(".task-duration").on("change", function(evt) {
            //     me.save();
            // });

            $task.on("click", this.onClick.bind(this));

            $task.find(".status-indicator").on("click", this.onStatusIndicatorClick.bind(this));

            $task.find(".task-type select")
                .select2({
                    dropdownAutoWidth: true,
                    minimumResultsForSearch: -1
                })
                .on("change", this.onTaskTypeChange.bind(this));

            $task.find(".duedate input")
                .datepicker({
                    format:ServerTimeFormat.getBootstrapPickerDateFormat(),
                    assumeNearByYear:true,
                    autoclose: true
                })
                .on("keypress", function(evt) {
                    if (evt.which == 13) {
                        evt.preventDefault();
                    }
                })
                .on("changeDate", this.changeDueDate.bind(this))
                .on('hide', function(e){
	    	    //This is to prevent the date value getting wiped out on selection of current selected date
                    if ( !e.date ) {
                        this.$el.find(".duedate input").datepicker('setDate', ServerTimeFormat.getDateInLocaleFormat(this.task.date1));
                    }
                }.bind(this));

            if (this.phase.type === STRING_NORMAL) {
                DOMManipulatorWrapperInstance.findElementsByClsNames($task, 'ms-autolink').hide();
            } else {
            $task.find(".ms-autolink div").on({
                "click": this.onAutoLinkAllChange.bind(this)
            });
            }



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



            $(this.project).on("resourceschanged", this.invalidateResourceCache.bind(this));
        },

        onAutoLinkAllChange: function(evt) {
            var me = this;

            this.task.isAutolinked = !this.task.isAutolinked;
            //$(this).trigger("autolinkallChange", [$(this.$el), this.task.isAutolinked]);

            //this.task.isAutolinked = evt.currentTarget.checked;
            setTimeout(function() {
                $(me).trigger("autolinkallChange", [$(evt.target).closest(".ms"), me.task.isAutolinked])
            }, 20);
        },

        changeDueDate: function(evt) {
            var $ms = $(evt.target).closest(".ms"),
                ms = $ms.data("model");
            var date = null;
            var project = stl.model.Project.project;

            try {
                var selectedDate = $ms.find(".duedate input").datepicker("getDate");
                if (!isNaN(selectedDate))
                    date = selectedDate;
                else {
                    //Sometimes just clicking in date field removes the set value and resets it to today's date
                    if (ms.date1)
                        date = new Date(ms.date1);
                    else
                        date = ServerClientDateClass.getTodaysDate();
                }
            } catch (e) {}
            if (!isNaN(date)) {
                ms.date1 = date;
            }
            if(!isNaN(selectedDate))
                $ms.find(".duedate input").val(date);

            if (ms.taskType === "PE") {
                project.dueDate = selectedDate;
            }

            this.save();

            Ext.getCmp('CCSummarygrid').changeMilestoneDueDate(ms, function() {
                //Hack: Model has a property taskType but, rec uses it as type
                ms.type = ms.taskType;
                $(document).trigger("milestoneupdate", [ms, 'date1']);
                //Ext.getCmp('CCSummarygrid').updateMilestoneSheet(ms);
            });
        },

        onStatusIndicatorClick: function(evt) {
            if (this.readOnly) return;
            var status = this.task.status || "NS"; // for some reason task status is not populated
            switch (status) {
                case STATUS_NS:
                    if(this.task.taskType === IMS_SHORT && parseInt(this.task.duration) > 0)
                        this.task.status = STATUS_IP;
                    else
                        this.task.status = STATUS_CO;
                    break;
                case STATUS_IP:
                    this.task.status = STATUS_CO;
                    break;

                case STATUS_CO:
                 
                    break;
            }
            this.onStatusChange(status, true);
        },

        onStatusChange: function(evt, oldval, ignoreValidations) {
            if (this.readOnly) return;
            var me = this;
            var $ms =this.$el;
            if (!oldval)
                oldval = this.task.status;
            this.task.status=  this.$el.find(".task-status select")
                .select2("val");
            var status = this.task.status || STATUS_NS; // for some reason task status is not populated
            //function callbackAfterValidation(status, milestoneview) {
                switch (status) {
                    case STATUS_NS:
                        this.task.status  =STATUS_NS;
                        me.task.actualStartDate = null;
                        me.task.actualFinishDate = null;
                        me.task.percentComplete = 0;
                        break;

                    case STATUS_IP:
                        this.task.status  =STATUS_IP;
                        me.task.actualStartDate = ServerClientDateClass.getTodaysDate();
                        me.task.actualFinishDate = null;
                      
                        break;

                    case STATUS_CO:
                        this.task.status  =STATUS_CO;
                        me.task.actualStartDate = me.task.actualStartDate ? me.task.actualStartDate : ServerClientDateClass.getTodaysDate();
                        me.task.actualFinishDate = ServerClientDateClass.getTodaysDate();
                        me.task.actualFinishDate.setHours(17, 0, 0);
                        me.task.percentComplete = 100;
                        me.task.remainingDuration =0;
                        me.disableMilestoneProperties($ms,true);
                        break;
                }
           // }
            // if (!ignoreValidations)
            //     this.taskStatusChangeValidations(oldval, status, function(reply) {
            //         if (reply == 'yes') {
            //             callbackAfterValidation(status, me);
            //         }
            //         me.refreshStatusIndicator();
            //         me.save();
            //     });
            // else {
                $ms.data('model').status =this.task.status;
                this.project.changeStatusForIPMSOrPEMS(this.task);
                //me.refreshStatusIndicator();
                me.setQuickEditStatusBox($ms);
                me.save();
            //}
        },
        disableMilestoneProperties: function($ms ,disable){
            $ms.find(":input").prop("disabled", disable);
            $ms.find(".task-type select").select2("enable", !disable);

        },

        /*
        These are the validations being called upon task status change
        */
        taskStatusChangeValidations: function(oldval, status, callbk) {
            var me = this;
            if (oldval == 'NS' && status == 'IP') {
                ChangeTaskStatusFromNSToIP();
                callbk('yes');
            } else if (oldval == 'NS' && status == 'CO') {
                ChangeTaskStatusFromNSToCO(this.task.name, this.task, this.task.subtasks, null, function(reply) {
                    if (reply == 'no') {
                        me.task.status = 'NS';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        callbk('no');
                        //$(me.$el.find(".task-status select")).trigger("change",['NS',true]);
                    } else {
                        me.setSubtaskStatus();
                        callbk('yes');
                    }
                });

            } else if (oldval == 'IP' && status == 'CO') {
                ChangeTaskStatusFromIPToCO(this.task.name, this.task, this.task.subtasks, null, function(reply) {
                    if (reply == 'no') {
                        me.task.status = 'IP';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        //$(me.$el.find(".task-status select")).trigger("change",['IP',true]);
                        callbk('no');
                    } else {
                        me.setSubtaskStatus();
                        callbk('yes');
                    }
                });
            } else if (oldval == 'IP' && status == 'NS') {
                ChangeTaskStatusFromIPToNS(this.task.name, this.task, this.task.subtasks, function(reply) {
                    if (reply == 'no') {
                        me.task.status = 'IP';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        callbk('no');
                        //$(me.$el.find(".task-status select")).trigger("change",['IP',true]);
                    } else {
                        me.setSubtaskStatus();
                        callbk('yes');
                    }
                });
            } else if (oldval == 'CO' && status == 'IP') {
                ChangeTaskStatusFromCOToIP(this.task.name, this.task.subtasks, null, function() {
                    me.setSubtaskStatus();
                    callbk('yes');
                });
            } else if (oldval == 'CO' && status == 'NS') {
                ChangeTaskStatusFromCOToNS(this.task.name, this.task.subtasks, null, function(reply) {
                    if (reply == 'no') {
                        me.task.status = 'CO';
                        me.$el.find(".task-status select")
                            .select2("val", me.task.status);
                        callbk('no');
                    } else {
                        me.setSubtaskStatus();
                        callbk('yes');
                    }
                });
            } else {
                callbk('yes');
            }
        },
        /*
        This function sets the subtask status based on task status programatically
        */
        setSubtaskStatus: function() {
            var me = this;
            if (me.isSubtaskEnabled) {
                me.$el.find(".subtasks li.subtask:not(.proto-subtask)").remove();
                me.task.remainingSubtasks = 0;
                var $listItemTemplate = $("#templates li[data-role=subtask-template]"),
                    $newItemPlaceholder = me.$el.find("li.proto-subtask");
                for (var i = 0; i < me.task.subtasks.length; i++) {
                    var item = me.task.subtasks[i],
                        showSubtask = (me.includeCompletedSubtask) ? true : !item.complete;
                    if (showSubtask) {
                        var $newLi = $listItemTemplate.clone(true).removeClass("proto-subtask").removeAttr("data-role");
                        me.bindSubtask($newLi, item);
                        $newItemPlaceholder.before($newLi);
                        this.setDurationAndDatesForSubtask(item, $newLi);
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
        subtaskStatusChangeValidations: function(oldval, newval, subtask, task, $ele, callbk) {
            var me = this;
            if (oldval === 'NS' && newval === 'IP') {
                ChangeSubtaskStatusFromNSToIP(subtask, task, function(reply) {
                    if (reply == 'no') {
                        //subtask.status = 'NS';                        
                    } else {
                        me.setTaskStatus("IP", me.$el);
                    }
                    callbk();
                });
            } else if (oldval === 'NS' && newval === "CO") {
                ChangeSubtaskStatusFromNSToCO(subtask, task, null, function(reply, setToIP) {
                    if (reply == 'no' || setToIP == 'no') {
                        me.setTaskStatus("IP", me.$el);
                    } else {
                        me.setTaskStatus("CO", me.$el);
                    }
                    callbk();
                });
            } else if (oldval === 'IP' && newval === 'CO') {
                ChangeSubtaskStatusFromIPToCO(subtask, task, null, function(reply, setToIP) {
                    if (reply == 'no' || setToIP == 'no') {
                        me.setTaskStatus("IP", me.$el);
                    } else {
                        me.setTaskStatus("CO", me.$el);
                    }
                    callbk();
                });
            } else if (oldval === 'IP' && newval === 'NS') {
                ChangeSubtaskStatusFromIPToNS(subtask, task, null, function(reply, setToIP) {
                    if (reply == 'no' || setToIP == 'no') {
                        me.setTaskStatus("IP", me.$el);;
                    } else {
                        me.setTaskStatus("NS", me.$el);
                    }
                    callbk();
                });
            } else if (oldval === 'CO' && newval === 'NS') {
                ChangeSubtaskStatusFromCOToNS(subtask, task, null, function(reply, setToIP) {
                    if (reply == 'no' || setToIP == 'no') {
                        me.setTaskStatus("IP", me.$el);
                    } else {
                        me.setTaskStatus("NS", me.$el);
                    }
                    callbk();
                });
            } else if (oldval === 'CO' && newval === 'IP') {
                ChangeSubtaskStatusFromCOToIP(subtask, task, function(reply) {
                    if (reply == 'no') {
                        me.setTaskStatus("IP", me.$el);
                    } else {
                        me.setTaskStatus("IP", me.$el);
                    }
                    callbk();
                });
            } else {

            }
        },
        /*
        This function sets the task status based on task status programatically
        */
        setTaskStatus: function(status, $task) {
            $task.find(".task-status select")
                .select2("val", status);
            $task.find(".task-status select").trigger('change', [status, false]);
        },
        /**
         * Connect an <li> element with a subtask data model and update the UI
         * to show the correct data
         */
        bindSubtask: function($li, subtask) {
            $li.data('model', subtask);
            $li.find(".subtask-name textarea").val(subtask.name).change();
            // $li.find(".subtask-name input").on("blur",function(evt){
            //     if($(this).val()=="") {
            //         var subtaskOldName = $(this).closest('li').data("model").name;
            //         $(this).val(subtaskOldName);
            //     }

            // });

            $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration, SUBTASK_DURATION_DEFAULT_STR, false));
            $li.find(".subtask-duration input").on("change", this.onSubtaskDurationChange.bind(this));
            $li.find(".subtask-duration input").on("keypress", this.onSubtaskDurationChange.bind(this));
            $li.find(".subtask-checklist-icon").addClass(this.project.getChecklistStatus(subtask.checklistStatus));
            var resourcesPicker = new stl.view.ResourcePicker({
                el: $li.find(".subtask-resources"),
                val: subtask.resources,
                project: this.project,
                readOnly: this.readOnly
            });
            $li.find(".subtask-resources").on("change", this.onSubtaskResourcesChange.bind(this));

            // $li.find(".subtask-owner input")
            //     .select2({
            //         placeholder: "(none)",
            //         allowClear: true,
            //         dropdownAutoWidth: true,
            //         query: this.managerDropDownQuery.bind(this),
            //         initSelection: this.managerDropDownInitSelection.bind(this)

            //     })
            //     .on("change", this.onGenericTaskPropertyInputChange.bind(this));


            $li.find(".delete-subtask").on(
                "click", this.onDeleteSubTaskButtonClick.bind(this)
            );

            this.refreshSubtaskStatus($li);
            this.refreshChecklistIcon($li, subtask);


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
        },

        refreshSubtaskStatus: function($li) {
            $li.removeClass("subtask-status-NS subtask-status-IP subtask-status-CO")
                .addClass("subtask-status-" + this.getSubtaskStatus($li.data("model").status));
        },
        refreshChecklistIcon: function($li, subtask) {
            $li.find(".subtask-checklist-icon").removeClass("none incomplete complete")
                .addClass(this.project.getChecklistStatus(subtask.checklistStatus));
            $li.data("model").checklistStatus = subtask.checklistStatus;
        },
        getSubtaskStatus: function(statusCode) {
            try {
                switch (statusCode) {
                    case "NS":
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
            } catch (e) {
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
                remainingDuration: durationStr == "" ? 0 : Math.round(juration.parse($li.find(".subtask-duration input").val())),
                // startDate: durationStr == '' ? "": ServerClientDateClass.getTodaysDate(),
                // endDate: durationStr == '' ? "" : Sch.util.Date.add(ServerClientDateClass.getTodaysDate(), Sch.util.Date.SECOND, (juration.parse(durationStr)) * 3),
                startDate: $li.data("model").startDate,
                endDate: $li.data("model").endDate,
                status: $li.data("model").status,
                resources: $li.find(".subtask-resources").data("resourcePicker").getValue()
            });
        },

        onTaskTypeChange: function(evt) {
            var $task = $(evt.target).closest(".ms"),
                ms = $task.data("model"),
                msView = $task.data("view"),
                oldVal = ms.taskType;
            if (!this.project.validatePEandPPTypeConversion(ms, evt.val)) {
                $task.find(".task-type select")
                    .select2("val", ms.taskType);
                return;
            }

            ms.taskType = evt.val;

            var msRec = {
                'uid': ms.uid,
                'name': ms.name,
                'type': ms.taskType,
                'taskType': ms.taskType,
                'startDate': ms.startDate,
                'status':ms.status,
                'endDate': ms.endDate,
                'date1': ms.date1,
                'bufferSize': '',
                'isAutolinked': ms.isAutolinked
            };

            if (msRec.date1 == null)
                msRec.date1 = ServerClientDateClass.getTodaysDate();

            Ext.getCmp('CCSummarygrid').changeMilestoneNameByChangingType(msRec.type, msRec, msRec.name, oldVal, function() {
                $(document).trigger("milestoneupdate", [msRec, 'type',oldVal]);
                //Ext.getCmp('CCSummarygrid').updateMilestoneSheet(msRec);
            });
            //autolink all property should bre fired only in milestone phase
            if(this.project.getPhaseById(ms.phaseId).type === STRING_MILESTONE_LOWER_CASE)
                $(this).trigger("autolinkallChange", [$task, $task.find(".ms-autolink input").is(":checked")])
            this.save();
        },

        onTaskSubtaskTypeChange: function(evt) {
            var $task = $(evt.target).closest(".task"),
                taskmodel = $task.data("model");
            taskmodel.subtaskType = evt.val;
            this.bindSubtaskTypeSpecificProperties();
            this.project.reCalculateSubTaskStartDate(taskmodel);
            this.save();
        },

        onTaskDurationChange: function(evt) {
            if (evt.type == KEYPRESS) {
                if (evt.which == 13) {
                    evt.preventDefault();
                } else {
                    return;
                }
            }
            var $dur = $(evt.target),
                $task = $dur.closest(".task"),
                task = $task.data("model"),
                val = $dur.val();
            if (task.status == "CO")
                val = 0;
            // else{
            //     if($dur.val() == 0 || $dur.val() == ZERO_DURATION_STR) {
            //         PPI_Notifier.info(getStringWithArgs(ZERO_DURATION_NOT_ALLOWED,TASKS))
            //         val = TASK_DURATION_DEFAULT;
            //     }
            // }


            var parsedVal = ValidationClassInstance.getValidDuration(val, TASK_DURATION_DEFAULT, true);
            $dur.val(ValidationClassInstance.getValidDurationString(parsedVal, TASK_DURATION_DEFAULT_STR, true));

            var status = this.task.status || "NS"; // for some reason task status is not populated
            this.setDurationField(status, task, parsedVal);
            if(this.project.checkIfZeroDurationMilestoneTask(task))
                this.removeIPOptionFromTaskStatus($task);
            else
                this.appendIPOptionForTaskStatus($task);
            this.removeAppendIPOptionAlreadyDone = true;
            this.save();

        },
        //remove IP option for zero dration task
        removeIPOptionFromTaskStatus: function ($task) {
            $task.find(".task-status select option[value = 'IP']").remove();
        },
        appendIPOptionForTaskStatus: function ($task) {
            if($task.find(".task-status select option[value = 'IP']").length===0)
            $task.find(".task-status select option[value = 'CO']").before('<option  data-resx-key = "IN_PROGRESS_Key"  value="IP">In progress</option>');
        },
        onTaskDurationClick: function(evt) {
            if ($(evt.target).closest(".task").hasClass("quick-task-edit")) {
                evt.stopPropagation();
            }

        },

        onSubtaskDurationChange: function(evt) {
            if (evt.type == KEYPRESS) {
                if (evt.which == 13) {
                    evt.preventDefault();
                } else {
                    return;
                }
            }

            var $dur = $(evt.target),
                subtask = $dur.closest(".subtask").data("model"),
                $task = $dur.closest(".subtask").closest(".task");
            val = $dur.val();
            if (subtask.status === "CO")
                val = 0;
            else {
                //if($dur.val() == 0 || $dur.val() == ZERO_DURATION_STR ) {
                if (ZERO_DURATION_REGEX.test($dur.val())) {
                    PPI_Notifier.info(getStringWithArgs(ZERO_DURATION_NOT_ALLOWED, SUBTASKS));
                    val = SUBTASK_DURATION_DEFAULT;
                }
            }
            var parsedVal = ValidationClassInstance.getValidDuration(val, SUBTASK_DURATION_DEFAULT, true);
            $dur.val(ValidationClassInstance.getValidDurationString(parsedVal, SUBTASK_DURATION_DEFAULT_STR, true));

            var status = subtask.status || "NS"; // for some reason task status is not populated
            this.setDurationField(status, subtask, parsedVal);

            this.project.reCalculateSubTaskStartDate($task.data("model"));
            this.save();
        },

        setDurationField: function(status, taskorSubtask, parsedVal) {
            // Duration field in Project and Table view always shows Remaining Duration.
            switch (status) {
                case "NS":
                    // For NS tasks/subtasks, duration & remainingDuration are same.  
                    taskorSubtask.duration = Math.round(parsedVal);
                    taskorSubtask.remainingDuration = Math.round(parsedVal);
                    break;
                case "IP":
                    taskorSubtask.remainingDuration = Math.round(parsedVal);
                    break;
                case "CO":
                    taskorSubtask.remainingDuration = 0;
                    break;
            }
        },


        onSubtaskResourcesChange: function(evt) {
            var me = this,
                $subtask = $(evt.target).closest(".subtask"),
                subtask = $subtask.data("model"),
                $task = $subtask.closest(".task");
            this.save();
            // Notify the project that some previously unassigned resources may have been assigned
            var resourceEntities = subtask.resources.map(function(resourceAndUnits) {
                return me.getResourceById(resourceAndUnits.resourceId);
            });
            this.project.onResourcesAssigned(resourceEntities);
        },

        onGenericSubtaskPropertyChange: function(evt) {
            this.save();
        },

        refreshRemainingSubtasksIndicator: function() {
            var $remainingSubtasksIndicator = this.$el.find('.remaining-subtasks-indicator'),
                $rollupType = this.$el.find(".subtask-type");
            if (this.isSubtaskEnabled) {
                $remainingSubtasksIndicator
                    .text(this.task.remainingSubtasks)
                    .toggle(!!this.task.remainingSubtasks);
                if (this.task.subtasks.length > 0) {
                    if (!this.$el.hasClass("quick-task-edit"))
                        $rollupType.show();
                } else {
                    $rollupType.hide();
                }
            } else {
                $remainingSubtasksIndicator.hide();
                $rollupType.hide();
            }
        },

        refreshStatusIndicator: function() {
            if (!multipleORs(this.task.taskType, IPMS_SHORT, PEMS_SHORT)) {
                this.$el.find(".status-indicator").hide();
                this.$el.find(".status-indicator-" + (this.task.status || "NS")).show();
            }
        },
         setQuickEditStatusBox:function($task){
            var $statusSelect = $task.find(".task-status select");
            var task = this.task;
            if (!this.initializedQuickEdit) {
                $statusSelect.select2({
                        dropdownAutoWidth: true,
                        minimumResultsForSearch: -1
                    })
                    .on("change", this.onStatusChange.bind(this));
            }           
            //load values
            $statusSelect.select2('val', task.status);
            this.initializedQuickEdit = true;
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
                /*Ext.date.parse('1/6/2015', 'm/d/y') return undefined
                Ext.date.parse('01/06/2015', 'm/d/y') returns Tue Jan 06 2015 00:00:00 GMT-0800 (Pacific Standard Time)*/
                date = Ext.Date.parse($(evt.target).val(), 'm/d/y');
            } catch (e) {}
            if (date) {
                task.startNoEarlierThan = date;
            }
            /*This hack is required to show date in 1/2/15 format. The date picker format is set to 
            m/d/y as to prevent Ext.Date.parse() in the above from returning undefined*/
            $task.find(".snet input").val(
                Ext.Date.format(new Date(task.startNoEarlierThan || ''), ServerTimeFormat.getExtDateformat()))
            this.save();
        },

        onGenericTaskPropertyInputChange: function(evt) {
            var $task = $(evt.target).closest(".task");
            this.save();
        },

        onTaskResourceChange: function(evt, sender) {
            var me = this,
                $task = $(evt.target).closest(".task"),
                task = $task.data("model");
            this.save();
            if (task.resources.length > 0) {
                //task add and task update
                for (var i = 0; i < task.resources.length; i++) {
                    var firstResource = task.resources[i],
                        firstResourceDetails = this.getResourceById(firstResource.resourceId);
                    Ext.getCmp('resGrid').updateResourceSheet(
                        firstResourceDetails,
                        firstResource.units,
                        task
                    );
                }
            } else {
                //task deleted
                // Ext.getCmp('resGrid').updateResourceSheet($task.data('model'));
            }
            this.updateTaskResourceColors($task, task);

            // Notify the project that some previously unassigned resources may have been assigned
            var resourceEntities = task.resources.map(function(resourceAndUnits) {
                return me.getResourceById(resourceAndUnits.resourceId);
            });
            this.project.onResourcesAssigned(resourceEntities);

            // Need to notify matrix view to save project here because a new resource may have been added
            $(this).trigger("resourcechange");
        },
        onTaskResourceChangeFromTableView: function($task, task) {
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

        managerDropDownQuery: function(query) {
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
                data = {
                    id: val,
                    text: resourceName
                };
            }
            callback(data);
        },

        participantsDropDownQuery: function(query) {
            query.callback({
                results: this.getAvailableManagerOptions()
            });
        },

        participantsDropDownInitSelection: function(element, callback) {
            var me = this;
            if (!this.cachedManagersById) {
                this.getAvailableManagerOptions();
            }
            var data = element.select2("val").map(function(personId) {
                var person = me.cachedManagersById[personId],
                    name = (person ? person.FullName : personId);
                return {
                    id: personId,
                    text: name
                };
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
            this.exitQuickEditMode();
            evt.stopPropagation();
        },

        onDeleteTaskButtonClick: function(evt) {
            var $ms = $(evt.target).closest(".ms");
            var msUid = $(evt.target).closest(".ms").data("model").uid;
            $(this).trigger("delete", [msUid, $ms]);
            //$(evt.target).closest(".ms-content-wrap").trigger("deletemilestone", [ msUid ]);
        },

        onTaskAddButtonClick: function(evt) {
            if (this.$el.hasClass("quick-task-edit")) {
                this.$el.removeClass("quick-task-edit");
            }
            if (stl.app.matrixView.multipleSelectedTasks){
                stl.app.matrixView.onNewTaskPlaceholderClickDelegate(evt);
            } else {
                $(this).trigger("addTask", [evt]);
            }
            evt.stopPropagation();
        },
        onDeleteSubTaskButtonClick: function(evt) {
            if (this.readOnly) return;
            var me = this,
                $deleteElement = $(evt.target),
                $li = $deleteElement.closest("li"),
                subtask = $li.data("model"),
                task = this.$el.data("model");

            $li.remove();
            me.save();
            this.project.reCalculateSubTaskStartDate(task);
            $(this).trigger("deletesubtask", [subtask, task]);

        },

        onSubtaskStatusClick: function(evt) {
            if (this.readOnly) return;
            var me = this,
                $li = $(evt.target).closest("li"),
                subtask = $li.data("model");

            var isSubtaskCompletable = this.completeSubtaskOnChecklistComplete ? (subtask.checklistStatus == 2 || subtask.checklistStatus == 0) : true;

            var currentStatus = "NS";
            var oldStatus = subtask.status;
            if (oldStatus == '0')
                oldStatus = "NS";
            else if (oldStatus == '1')
                oldStatus = "IP";
            else if (oldStatus == '2')
                oldStatus = "CO";
            switch (subtask.status) {
                case "0":
                case "NS":
                    if (this.task.subtaskType == '2') {
                        // "Rate"-based tasks have their subtasks go directly from NS->CO, skipping IP
                        if (isSubtaskCompletable)
                            subtask.status = "CO";
                        else
                            PPI_Notifier.info(SUBTASK_CANNOT_MARKED_COMPLETE);
                    } else
                        subtask.status = "IP";
                    break;
                case "1":
                case "IP":
                    if (isSubtaskCompletable)
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
            this.subtaskStatusChangeValidations(oldStatus, subtask.status, subtask, this.task, $li, function() {
                me.refreshSubtaskStatus($li);
                me.save();
            });
        },
        setDurationAndDatesForSubtask: function(subtask, $li) {

            switch (subtask.status) {
                case "2":
                case "CO":
                    subtask.endDate = Ext.Date.format(ServerClientDateClass.getTodaysDate(), ServerTimeFormat.getExtDateformat());
                    subtask.duration = SUBTASK_DURATION_DEFAULT;
                    subtask.remainingDuration = 0;
                    subtask.actualStartDate = subtask.actualStartDate ? subtask.actualStartDate : ServerClientDateClass.getTodaysDate();
                    subtask.actualFinishDate = ServerClientDateClass.getTodaysDate();
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration, SUBTASK_DURATION_DEFAULT_STR, false));
                    break;

                case "1":
                case "IP":
                    subtask.actualStartDate = ServerClientDateClass.getTodaysDate();
                    subtask.actualFinishDate = null;
                    subtask.remainingDuration = subtask.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtask.remainingDuration;
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration, SUBTASK_DURATION_DEFAULT_STR, false));
                    break;

                case "0":
                case "NS":
                    // For NS subtasks - Duration/Remaining duration is always same
                    subtask.actualStartDate = null;
                    subtask.actualFinishDate = null;
                    subtask.remainingDuration = subtask.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtask.remainingDuration;
                    subtask.duration = subtask.remainingDuration;
                    $li.find(".subtask-duration input").val(ValidationClassInstance.getValidDurationString(subtask.remainingDuration, SUBTASK_DURATION_DEFAULT_STR, false));
            }
        },
        bindTaskTypeSpecificProperties: function() {
            var $task = this.$el,
                taskmodel = this.task;
            $task.find(".task-specific-properties").hide();
            $task.find(".task-specific-properties-" + taskmodel.taskType).css("display", "inline-block");
            switch (taskmodel.taskType) {
                case "normal":
                    this.showSubtasksRegion($task);
                    break;
                case "fullkit":
                    var $fullkitName = $task.find(".fullkit-name");
                    if ($fullkitName.length === 0) {
                        $fullkitName = $('<div class="fullkit-name"></div>');
                        $task.find(".task-name").append($fullkitName);
                    }
                    // Look for succeeding task
                    // TODO stop using placeholder; save default name as actual task name
                    var name = "FK", //"Full-kit",
                        nextPhaseIndex = this.project.phases.indexOf(this.project.getPhaseById(taskmodel.phaseId)) + 1,
                        nextTasks = this.project.getRowById(taskmodel.rowId).tasks[this.project.phases[nextPhaseIndex].uid];
                    if (nextTasks && nextTasks.length > 0) {
                        var nextTaskName = nextTasks[0].name;
                        if (nextTaskName === null || nextTaskName === "") {
                            var $nextTask = $task.closest(".phase-column").next(".phase-column").find(".task").first();
                            nextTaskName = $nextTask.find(".task-name input").attr("placeholder");
                        }
                        //name = "Full-kit: " + nextTaskName;
                        name = "FK";
                    }
                    $fullkitName.text(name);
                    $task.on("click", this.onFullkitTaskClick.bind(this));
                    break;
                case "purchasing":
                    this.hideSubtasksRegion($task);
                    break;
                case "snet":
                    this.showSubtasksRegion($task);
                    break;
            }
        },

        onFullkitTaskClick: function(evt) {
            var isProjectReadOnly = stl.app.isProjectOpenInViewOnlyMode();
            if (isProjectReadOnly)
                return;
            $(".tool-popup").hide();
            $(evt.target).closest(".task").find(".tool-popup").show();
            evt.stopPropagation();
        },

        bindSubtaskTypeSpecificProperties: function() {
            var $task = this.$el,
                taskmodel = this.task;
            $task.find(".subtask-specific-property").hide();
            var $specificProperties = $task.find(".subtask-specific-property-" + this.getSubtaskTypeString(taskmodel.subtaskType));
            this.showHideSubtaskColumnsBySubtaskType($task, taskmodel);
            // This class is used to show a different "not started" icon when subtask rollup type is rate-based
            if (+this.task.subtaskType === 2) {
                $task.addClass("subtask-type-rate");
            } else {
                $task.removeClass("subtask-type-rate");
            }
        },

        getSubtaskTypeString: function(subtaskType) {

            switch (subtaskType) {
                case "1":
                    // no data at task level
                    return "sequential";
                    break;
                case "2":
                    return "volume";
                    break;
                case "3":
                    return "wip";
                    break;
                case "4":
                    return "resource";
                    break;
            }
        },

        showHideSubtaskColumnsBySubtaskType: function() {
            var $task = this.$el,
                taskmodel = this.task;
            $task.find(".subtask-header-duration," + " .subtask-header-resources").addClass("hidden");
            $task.find(".subtask .subtask-duration," + " .subtask .subtask-resources").addClass("hidden");
            switch (taskmodel.subtaskType) {
                case "1":
                    $task.find(".subtask-header-duration, .subtask-header-resources").removeClass("hidden");
                    $task.find(".subtask-duration, .subtask-resources").removeClass("hidden");
                    break;
                case "2":
                    // TODO - not sure what we show for this one (if anything)
                    break;
                case "3":
                    $task.find(".subtask-header-duration").removeClass("hidden");
                    $task.find(".subtask-duration").removeClass("hidden");
                    break;
                case "4":
                    $task.find(".subtask-header-duration, .subtask-header-resources").removeClass("hidden");
                    $task.find(".subtask-duration, .subtask-resources").removeClass("hidden");
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
                if (resourceColorId) {
                    // $task.addClass("has-resource-" + resourceColorId);
                    $task.addClass("has-resource-" + assignedResource.resourceId);
                }
            });
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
                return {
                    id: res.uid,
                    text: res.Name
                };
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

        getGlobalResourceObjWithUpdateBaseCalendar: function (res) {
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
                res = this.getGlobalResourceObjWithUpdateBaseCalendar(this.cachedResourcesById[resourceUid]);
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
                        var id = manager.Name; // FIXME, need UID here but server doesn't provide it
                        byId[id] = manager;
                        return {
                            id: id,
                            text: manager.FullName
                        };
                    });
                this.cachedManagersById = byId;
            }
            return this.cachedAvailableManagerOptions;
        },

        enterQuickEditMode: function() {
            if(  stl.app.matrixView && stl.app.matrixView.zoomLevel > 2)
                return;
            var $task = this.$el;
            $task.after('<div class="task-spaceholder-ms"></div>');
            $task.find(":input").prop("disabled", this.readOnly);
            this.wasAlreadyZoomSmall = $task.hasClass("task-zoom-small");
            $task.addClass("quick-task-edit task-zoom-small");
            $task.attr('data-qtip', '');
            $task.find(".task-content-wrapper").width(QUICK_ENTRY_TASK_WIDTH);
            $task.find(".subtask-type").hide();
            var $overflowNameField = $task.find(".task-name-overflow-edit");
            $overflowNameField.text($task.find(".task-name input").val())
                // Match overflow text background to task name background (for when it overflows out of task bar)
                .css("background", $task.find(".task-name").css("background"));
			if (!this.readOnly)
                $overflowNameField.focus();
            this.hideSubtasksRegion($task);
            this.initializeTaskManagerField();
            $(this).trigger("enterquickedit");
            // this.onElementMoveComplete();
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
                  $taskMangerInput.select2("val", $task.data("model").manager);    
                    this.initializedTaskManagerField = true;
        },
        exitQuickEditMode: function() {
            var me = this;
            var $task = this.$el;
            $task.next('.task-spaceholder-ms').remove();//remove the place holder which was created while entering to quick edit
            $task.removeClass("quick-task-edit");
            $task.attr('data-qtip', $task.find('.task-name input').val());
            if (!this.wasAlreadyZoomSmall) {
                $task.removeClass("task-zoom-small");
            }
            $task.find(".task-name-overflow-edit")
                .css("background", "transparent");
            if (!me.readOnly) {
                this.$el.find(".task-name input").val(this.$el.find(".task-name-overflow-edit").text());
                var taskName = this.$el.find(".task-name input").val();
                $task.data("linkable-element-name", taskName);
                //me.checkTaskForDefaultName($task);    
                this.save();
            }
            if (stl.app.matrixView.zoomLevel == 0)
                $task.find(".task-controls").css("display", '');
            $(this).trigger("exitquickedit");
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
            var me = this,
                $task = this.$el,
                task = this.task;
            if (!event.ctrlKey 
                && (!(stl.app.matrixView.multipleSelectedTasks && stl.app.matrixView.multipleSelectedTasks[task.uid]))){
                $(document).trigger("taskMultiSelectEnd");
            }

            
            if ((!stl.app.matrixView.multipleSelectedTasks || !stl.app.matrixView.multipleSelectedTasks[task.uid]) ||
                event.ctrlKey){
                $(document).trigger("taskMultiSelect", [null, task]);
                return false;
            }
            if (this.readOnly) {
                // Additional entry point for quick-edit mode here because text field focus
                // doesn't happen in readonly mode
                if ($task.hasClass("task-zoom-normal") || $task.hasClass("quick-task-edit")) {
                    return;
                }
                me.enterQuickEditMode($task);
            }
            if (!this.readOnly && !$task.hasClass("quick-task-edit") && !$task.hasClass("task-zoom-normal")) {
                me.enterQuickEditMode($task);
                $task.find(".task-controls").css("display", 'inline');
            }

        },

        wireSubTaskEvents: function() {
            //Placeholders.enable();
            var me = this;
            this.$el.find(".subtasks li .subtask-name textarea").on("focus", function(evt) {
                var $input = $(evt.target),
                    $li = $input.closest("li");
                if ($li.hasClass("proto-subtask")) {
                    $input.val("");
                    $input.removeClass("placeholdersjs");
                }
                evt.stopPropagation();
            });


            this.$el.find(".subtasks li .subtask-name textarea").on("keypress", function(evt) {
                if (evt.which == 13) {
                    evt.preventDefault();
                    var $input = $(evt.target),
                        $li = $input.closest("li");
                    if ($li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                        me.renderNewSubtask($li, $input, true);
                    }
                }
                evt.stopPropagation();
            });
            this.$el.find(".subtasks li .subtask-name textarea").on("blur", function(evt) {

                var $input = $(evt.target),
                    $li = $input.closest("li");
                if ($li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                    me.renderNewSubtask($li, $input, false);
                } else {
                    if (!$li.hasClass("proto-subtask") && $input.val() != EMPTY_STRING) {
                        $(this).closest('li').data("model").name = $input.val();
                    } else if (!$li.hasClass("proto-subtask") && $input.val() === EMPTY_STRING) {
                        var subtaskOldName = $(this).closest('li').data("model").name;
                        $(this).val(subtaskOldName);
                    }
                }
                Placeholders.enable();
                evt.stopPropagation();
            });



            // update model on any text field change in a list item
            // this.$el.find(".subtasks li input").on("change", function(evt) {
            //     me.save();
            // });

        },

        renderNewSubtask: function($li, $input, focusNewList) {
            // todo add next row w/ proto class
            var me = this,
                $newLi = $li.clone(true);
            $li.parent().append($newLi);
            $newLi.find("textarea").val("");
            // $newLi.find("input[type=checkbox]").prop("checked", false);
            me.bindSubtask($li, me.project.createSubtask({
                name: $input.val()
            }, me.$el.data("model")));

            $li.removeClass("proto-subtask");

            $li.closest(".subtasks ul").sortable("refresh");
            me.save();
            // enter key moves down to next row
            if (focusNewList)
                $li.next("li").find(".subtask-name textarea").focus();
        }
    });

})());