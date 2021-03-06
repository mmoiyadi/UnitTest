// TODO document 3rd-party components used in matrix view

stl.view.MatrixView = function(cfg) {
    var defaults = {
        nextResourceId: 1,
        readOnly: false,
        saveTriggerEnabled: true
    };
    $.extend(this, defaults, cfg);
    this.$container = $(this.container);
};

$.extend(stl.view.MatrixView.prototype, (function () {

    var TASK_HEADER_HEIGHT = 32,
        CONDENSED_TASK_HEADER_HEIGHT = 24,
        FULLY_CONDENSED_CLASS = "fullyCondensed",
        NORMAL_CONDENSED_CLASS = "normalCondensed",
        NORMAL_ZOOM_TASKWIDTH = 660,
        FULL_ZOOM_TASKWIDTH = 1000, // TODO refine this level
        ZOOMLEVEL = {
            CONDENSED: 0,
            SHORT_TASK_BARS: 1,
            LONG_TASK_BARS: 2
            // ,
            // TASK_ZOOM_SMALL: 3,
            // TASK_ZOOM_FULL: 4
        },
        ZOOM_TASKWIDTHS = {
            0: 23,
            1: 150,
            2: 300,
            3: 400,
            4: NORMAL_ZOOM_TASKWIDTH
        },
        ZOOM_TASKHEIGHTS = {
            0: CONDENSED_TASK_HEADER_HEIGHT,
            1: TASK_HEADER_HEIGHT,
            2: TASK_HEADER_HEIGHT,
            3: "auto",
            4: "auto"
        },
        CONDENSATION_CLASSES = {
            0: FULLY_CONDENSED_CLASS,
            1: NORMAL_CONDENSED_CLASS,
            2: NORMAL_CONDENSED_CLASS,
            3: NORMAL_CONDENSED_CLASS,
            4: NORMAL_CONDENSED_CLASS
        },
        TASK_OUT_ENDPOINT_OFFSETS = {
            x: 0,
            y: 16
        },
        CONDENSED_TASK_OUT_ENDPOINT_OFFSETS = {
            x: -4,
            y: 12
        };

    var SERVER_ROOT_URL = "../../AppServices/PlanningUIService.svc/";

    var localStorageModelKey = 'streamlinerProjectModel';
    var LOCAL_STORAGE_LAST_PROJECT_UID_KEY = 'concertoPlanningLastProjectUid';
    var matrixViewId = 1;
    d3.selection.prototype.moveToFront = function () {
          return this.each(function () {
            if(this.parentNode.lastChild != this)
                this.parentNode.appendChild(this);
          });
        };
    return ({

        /**
        * Set up event handling for a row UI
        * NOTE this will be called at startup and work on the hidden subtask <li> template
        * in #templates; events will be cloned from that template when future subtasks are
        * rendered or added
        */
        wireRowEditEvents: function () {
            var me = this;

        },
        /*
        if scopeName  is not there in any other scope -scope is deletable form Model itself.
        */
        checkIfScopeDeletableFromModel: function (scopeId) {
            var isScopeDeletable = true;
            if (!this.project.getScopeItemByUid(scopeId)) {
                isScopeDeletable = false;
            }
            return isScopeDeletable;
        },

        isRowWithSameScopePresent: function (scopeId, rowUid) {
            var row = _.find(this.project.rows, function (item) {
                return (item.scopeItemUid == scopeId && item.uid != rowUid);
            });

            if (row) {
                return true;
            } else {
                return false;
            }

        },

        /*
        * Updates UI in response to new phase being added from matrix view or elsewhere.
        * Expects the phase already to have been added to the model's phases collection
        */
        insertPhaseColumnUI: function (newPhaseModel, position) {
            var me = this,
                phases = this.project.phases,
                isLast = (position === phases.length - 1),
            // get the column of cells to insert before, or if last, the last column and we'll insert after
            // (add 1 because nth-child is 1-based)
                $neighborCells = (isLast ?
                    this.$view.find(".matrix-view-row:not(.header-row) .phase-column:last-child") : this.$view.find(".matrix-view-row:not(.header-row) .phase-column:nth-child(" + (position + 1) + ")")),
                $contentRows = this.$view.find(".matrix-view-row"),
                $cellTemplate = $("#templates div[role=phase-column-cell]"),
                $newCell = $cellTemplate.clone(true),
                matrixViewEl = this.$view[0],
                $lastHeader = this.$view.find(".matrix-view-row.header-row .phase-column").last(),
                $newHeader = this.$phaseHeaderTemplate.clone(true);
            if (isLast) {
                $neighborCells.after($newCell);
                $lastHeader.after($newHeader);
            } else {
                $neighborCells.before($newCell);
                // add 1 for same reason as above
                this.$view.find(".matrix-view-row.header-row .phase-column:nth-child(" + (position + 1) + ")").before($newHeader);
            }


            $newHeader.data('model', newPhaseModel);
            // TODO may need to scroll left if inserting toward left edge of screen
            if (isLast) {
                matrixViewEl.scrollleft = matrixViewEl.scrollwidth;
            }
            this.bindPhaseColumn($newHeader, newPhaseModel);
            if (newPhaseModel.type !== "fullkit" && newPhaseModel.type !== "milestone") {
                $newHeader.find(".phase-name").text(newPhaseModel.name);
                var $phaseNameText = $newHeader.find(".phase-name");
                this.makeEditable($phaseNameText);
                $phaseNameText.on("sl.edit", this.onElementMoveCompleteDelegate); // refresh links because phase name can change width of column
            } else
                $newHeader.find(".phase-name").text("");
            this.addPhaseHeaderMenuListeners($newHeader);
            this.$view.find(".matrix-view-row:not(.header-row) .phase-column:nth-child(" + (position + 1) + ")").each(function (index, elt) {
                me.initDragEventsOnPhaseCell($(elt), newPhaseModel);
            });
            this.syncColumnWidths();
        },

        /*
        * Handle user "add phase" action within matrix view UI
        */
        insertPhaseColumn: function (position, props) {

            var project = this.project,
                phases = project.phases;
            this.checkAndSetNextDefaultPhaseIdx();
            var phaseName = DEFAULT_PHASE_NAME + SPACE_CONST + String(stl.app.getNextDefaultPhaseIdx());
            // For Fullkit and milestone phases, We don't require to check for config.As they are
            // considered to be part of Normal phases.
            var isRequestedForNormalPhaseCreation = _.isUndefined(props);
            if( isRequestedForNormalPhaseCreation && stl.app.honourConfigForGlobalPhases()){
                var avaiablePhases =_.difference(stl.app.divisionPhases,_.pluck(phases,"name"));
                if(avaiablePhases.length != 0){
                   phaseName = avaiablePhases[0];
                }
                else{
                    PPI_Notifier.error(CREATE_GLOBAL_PHASE_FROM_EDIT_GLOBAL_FILE);
                    return;
                }
            }

            var  phaseCount = $.grep(project.phases, function (item) { return item.type == STRING_NORMAL }).length,
                newPhaseID = project.getNextUID("phase");

            var newPhaseModel = {
                     name: phaseName, 
                     id: newPhaseID, 
                     uid: newPhaseID, 
                     type: STRING_NORMAL
                 },
                previousPhaseEndDate = (position === 0 ? ServerClientDateClass.getTodaysDate() 
                    : Sch.util.Date.add(new Date(phases[position - 1].endDate)));


            // FIXME remove dates from phases
            newPhaseModel.startDate = Sch.util.Date.add(previousPhaseEndDate, Sch.util.Date.DAY, 1);
            newPhaseModel.endDate = Sch.util.Date.add(newPhaseModel.startDate, Sch.util.Date.DAY, 30);

            $.extend(newPhaseModel, props);
            phases.splice(position, 0, newPhaseModel);
            this.insertPhaseColumnUI(newPhaseModel, position);
            this.refreshLinks();
            this.saveProject();
            this.project.createPhaseScopeAndTaskCountMap();
            $(document).trigger("phaseadd", [
                this,
                newPhaseModel,
                position
            ]);
            // start editing the phase header
            $(".matrix-view-row.header-row .phase-column").eq(position).find(".phase-name").click();
            stl.app.phaseHighlightMenuIsCurrent = false;
            return newPhaseModel;
        },

        checkAndSetNextDefaultPhaseIdx: function () {
            var currMaxDefPhaseId = 0;
            var project = stl.model.Project.getProject();
            _.each(project.getAvailableResources().concat(project.getAllPhaseNames()), function (res) {
                if (res.Name.indexOf(DEFAULT_PHASE_NAME) == 0) {
                    var defPhaseIdStr = res.Name.substr(DEFAULT_PHASE_NAME.length);
                    if (defPhaseIdStr.trim().length != 0 && !isNaN(defPhaseIdStr)) {
                        var id = parseInt(defPhaseIdStr);
                        currMaxDefPhaseId = Math.max(currMaxDefPhaseId, id);
                    }
                }
            });
            stl.app.setDefaultPhaseIdx(currMaxDefPhaseId + 1);
        },

        onPhaseChange: function (evt, sender, phase, index) {
            if (sender === this)
                return;
            var phases = this.project.phases;
            $(".matrix-view-row.header-row .phase-column:nth-child(" + (phases.indexOf(phase) + 2) + ")").children(".phase-name").text(phase.name);
            this.saveProject();
        },

        // handle phase being added from anywhere other than matrix view
        // note, matrix view expects to do the actual insertion of the phase into the main collection, so
        // callers should not do that
        onPhaseAdd: function (evt, sender, phase, index) {
            if (sender === this) return;
            var phases = this.project.phases;
            this.insertPhaseColumnUI(phase, index);
            phases.splice(index, 0, phase);
            this.refreshLinks();
            this.saveProject();
            stl.app.phaseHighlightMenuIsCurrent = false;
        },

        onPhaseRemove: function (evt, sender, phase, index) {
            if (sender == this)
                return;
            var phases = this.project.phases;
            var removed = phases.splice(index, 1);
            $(".matrix-view-row.header-row .phase-column:nth-child(" + (index + 2) + ")").remove();
            $(".matrix-view-row:not(.header-row) .phase-column:nth-child(" + (index + 2) + ")").remove();
            this.saveProject();
            stl.app.phaseHighlightMenuIsCurrent = false;
            this.refreshLinks();
        },

        savePhases: function () {
            var order = 0;
            var me = this;
            this.project.phases = this.$view.find(".header-row .phase-column").toArray().map(function (header, ind, currnetArray) {
                var $header = $(header),
                    model = $header.data("model");
                if (model.type === STRING_NORMAL) {
                    model.name = $header.find(".phase-name").text().trim();
                } else {
                    var index = (model.type === "fullkit") ? ind + 1 : ind - 1,
                        phaseModel = $(currnetArray[index]).data("model");
                    if (phaseModel)
                        model.name = $(currnetArray[index]).data("model").name.trim();
                    $(document).trigger("phasechange", [me, model])
                }

                model.order = order++;
                return model;
            });
        },

        makeEditable: function ($textEls, cfg) {
            var me = this;
            $textEls.not(".sl-editable-ready").on("click", function (evt) {
                if (me.readOnly) return;
                var $el = $(evt.target);
                var $newEditor = $('<input type="text" class="field-editor" />');
                $el.css({
                    "position": "relative"
                });
                $el.append($newEditor);
                $newEditor.data("oldText", $el.text().trim());
                $newEditor.data("owner", $el);
                $newEditor.data("origcolor", $el.css("color"));
                $el.css("color", "transparent");
                $newEditor.css({
                    "font-family": $el.css("font-family"),
                    "font-size": $el.css("font-size"),
                    "text-align": $el.css("text-align"),
                    "width": $el.width() + "px",
                    "height": $el.height() + "px",
                    "line-height": $el.css("line-height"),
                    "vertical-align": $el.css("vertical-align"),
                    "background": "#f0f0f0", //$el.css("background"),
                    "border": $el.css("border"),
                    "padding": $el.css("padding")
                });
                $newEditor.val($el.text());
                $newEditor.focus();
                $newEditor.select();
                $newEditor.on("click", function (evt) {
                    return false;
                });
                // todo this event forwarding may need to be generalized
                $newEditor.on("keypress", function (evt) {
                    if (evt.which === 13) {
                        evt.preventDefault();
                    }
                });
                $newEditor.on("keyup", function (evt) {
                    $el.trigger("", evt);
                    if (evt.which === 13) {
                        $newEditor.trigger("blur");
                    }
                });
                
                $newEditor.autocomplete({
                    source : stl.app.divisionPhases,
                    minLength: 0,
                    scroll: true
                    }              
                );
                // fixme for some reason, when you click a date in the datepicker,
                // about 120ms elapse between the blur event and the "changedate" event
                // fired by the picker.  we need to process changedate before destroying
                // during the blur cleanup.  either find out a way to prevent blur when
                // clicking datepicker and then do cleanup manually for that scenario,
                // or use a system of flags to defer the blur handling until after
                // changedate (ugh!).
                $newEditor.on("blur", function (evt) {
                    var $ed = $(evt.target),
                        $owner = $ed.data("owner"),
                        lastVal = $ed.data("oldText"),
                        color = $ed.data("origcolor"),
                        currText = $ed.val().trim();
                    setTimeout(function () {
                        $owner.text($ed.val().trim());
                        $owner.css("color", color);
                        $owner.data("lastVal", lastVal);
                        $ed.remove();
                        $owner.trigger("sl.edit");
                    }, ($el.hasClass("sl-editable-date") ? 500 : 0)); // hack see note above
                    var isResourceNameDuplicate = me.project.isResourceNameDuplicate($ed.val().trim());
                    var isPhaseNameDuplicate = me.project.isPhaseNameDuplicate($ed.val().trim(), lastVal);

                    var isGlobalPhase = _.find(stl.app.divisionPhases, function(phase){
                        return phase == currText;
                    });
                    if (!isResourceNameDuplicate && !isPhaseNameDuplicate) {
                        if ($ed.val().trim() === "" && 
                            $ed.parent().hasClass("phase-name")) {
                            $ed.val(lastVal);
                            PPI_Notifier.info(EMPTY_PHASE_NAMES_NOT_ALLOWED);
                        }else if (stl.app.honourConfigForGlobalPhases() && 
                            _.isUndefined(isGlobalPhase)){
                            $ed.val(lastVal);
                            PPI_Notifier.error(NOT_A_GLOBAL_RESOURCE);
                        }
                    } else if (isPhaseNameDuplicate) {
                        $ed.val(lastVal);
                        PPI_Notifier.error(PHASE_NAME_DUPLICATE);
                    } else if (isResourceNameDuplicate) {
                        $ed.val(lastVal);
                        PPI_Notifier.error(RESOURCE_NAME_DUPLICATE);
                    } 

                });
                if ($el.hasClass("sl-editable-date")) {
                    $newEditor.datepicker({
                        format: ServerTimeFormat.getBootstrapPickerDateFormat(),
                        autoclose: true
                    });
                    $newEditor.datepicker("show");
                }
            }).addClass("sl-editable-ready");
        },

        onEditableFieldBlur: function (evt) {
            var $ed = $(evt.target),
                $owner = $ed.data("owner"),
                color = $ed.data("origcolor");
            $owner.text($ed.val());
            $owner.css("color", color);
            $ed.remove();
        },


        /**
        * TaskViews raise a "change" event when they've changed internally; it's the containing view's
        * responsibility to promote this to a global 'taskchange' event
        */
        onTaskViewChange: function (evt) {
            var taskView = evt.target,
                task = taskView.task;
            $(document).trigger("taskchange", [this, task]);
            this.triggerSave();
        },

        onFullKitTaskClick: function (evt) {
            var isProjectReadOnly = stl.app.isProjectOpenInViewOnlyMode();
            if (isProjectReadOnly)
                return;
            $(".tool-popup").hide();
            $(evt.target)[0].$el.closest(".task").find(".tool-popup").show();
            evt.stopPropagation();
        },


        /**
        * Generates and returns the DOM element for a row *without adding it to the DOM*.
        */
        generateRow: function (rowModel, phases, level) {
            var me = this,
                $newRow = me.$matrixRowTemplate.clone(true);
           
            $newRow.find(".phase-column").remove();
            for (var i = 0; i < phases.length; i++) {
                var $newCell = me.$cellTemplate.clone(true),
                    phase = phases[i],
                    tasks = rowModel.tasks[phase.id];
                $newCell.addClass("phase-type-" + (phase.type || "normal"));
                if (tasks) {

                    for (var j = 0; j < tasks.length; j++) {
                        var task = tasks[j];
                        var taskView;
                        if (!task.isSummary) {
                            if (task.isMS) {
                                taskView = this.addEmptyMSUI(phase, $newCell);
                                taskView.load(task);
                                var $task = taskView.$el
                                this.renderMilestone($task, $newCell, phase);
                                if (task.taskType === PE_SHORT)
                                    $newRow.addClass("has-PE");
                            } else {
                                if (stl.app.loadByTemplating) {
                                    var templateCfg ={
                                        loadViaTemplate:true,
                                        task:task,
                                        row:rowModel
                                    }
                                    taskView = this.addEmptyTaskUI(phase, $newCell,null,templateCfg);
                                } else {
                                    taskView = this.addEmptyTaskUI(phase, $newCell);
                                    taskView.load(task);
                                }
                                this.tasksByUid[task.uid] = taskView;
                            }
                        }


                        if (!me.project.isBufferTasksExist || me.project.isBufferTasksExist == false) {
                            if (task.taskType == "buffer")
                                me.project.isBufferTasksExist = true;
                        }
                    }
                }
                $newRow.append($newCell);
            }
            $newRow.find(".phase-column").each(function (index, elt) {
                me.initDragEventsOnPhaseCell($(elt), phases[index]);
            });
            $newRow.find(".scope-item-label").on("change", this.onScopeItemChange.bind(this));
            this.makeEditable($newRow.find(".scope-item-label"), {
                observekeyup: true
            });
            if (rowModel.uid != "dummy") {
                var scopeItem = this.project.getScopeItemByUid(rowModel.scopeItemUid);
                if (scopeItem) {
                    var scopeName = scopeItem.name,
                    scopeItemId = scopeItem.id;
                }
                if (rowModel.name && rowModel.name != "") {
                    $newRow.find(".tree-column").addClass("has-scopename");
                    $newRow.find(".scope-item-label").text(scopeName);
                } else if (scopeName === EMPTY_STRING)
                    $newRow.find(".tree-column").addClass("blank-scope-name");
                $newRow.data("model", rowModel);
                $newRow.data("scopeItemUId", rowModel.scopeItemUid);
                $newRow.attr("scopeItemUId", rowModel.scopeItemUid);
                $newRow.attr("rowUid", rowModel.uid);
                this.rowsById[rowModel.uid] = $newRow;
            }

            return $newRow;
        },

       
        populateScopeTreeStore: function () {
            var me = this;
            var projectScope = this.project.getProjectRootScope();
            var allScopeItems = this.project.rows;
            var scopeItemTreeData = {
                expanded: true,
                children: [],
                text: this.project.name,
                leaf: false,
                data: this.getScopeItemRootNodeData(projectScope)

                //data:{}
            };

            var previousNode;
            _.each(allScopeItems, function (scopeItem, index) {
                var scopeItemNode = {};
                var IsComplex = stl.app.ProjectDataFromServer.isProjectComplex();
                scopeItemNode.expanded = typeof (scopeItem.isExpanded) != "undefined" ? scopeItem.isExpanded : false;
                scopeItemNode.data = me.getScopeItemNodeDataObject(scopeItem);
                scopeItemNode.text = scopeItem.name;
                scopeItemNode.rowUid = scopeItem.uid;
                scopeItemNode.leaf = true;
                scopeItemNode.children = [];
                if (IsComplex) {

                    if (scopeItem.outlineLevel) {
                        if (scopeItem.outlineLevel == 1) {
                            scopeItemTreeData.leaf = false;
                            scopeItemTreeData.children.push(scopeItemNode);

                        }
                        else if (scopeItem.outlineLevel > 1) {
                            var lastScopeItemNode = _.last(scopeItemTreeData.children);
                            while (lastScopeItemNode && lastScopeItemNode.data.outlineLevel != scopeItem.outlineLevel - 1) {
                                lastScopeItemNode = _.last(lastScopeItemNode.children);
                            }
                            if (lastScopeItemNode) {
                                lastScopeItemNode.leaf = false;
                                lastScopeItemNode.children.push(scopeItemNode);
                            }
                        }
                    } else {
                        scopeItemTreeData.children.push(scopeItemNode);
                    }
                } else {
                    scopeItemTreeData.leaf = false;
                    scopeItem.outlineLevel = -1;
                    scopeItemTreeData.children.push(scopeItemNode);
                }
            });

            return scopeItemTreeData;
        },

        getScopeItemNodeDataObject: function (scopeItem, rowElement) {
            var me = this;
            var scopeItemNodeObj = {};

            scopeItemNodeObj.id = scopeItem.id;
            scopeItemNodeObj.name = scopeItem.name;
            scopeItemNodeObj.order = scopeItem.order;
            if (stl.app.ProjectDataFromServer.isProjectComplex())
                scopeItemNodeObj.outlineLevel = scopeItem.outlineLevel;
            else
                scopeItemNodeObj.outlineLevel = -1;
            scopeItemNodeObj.scopeItemUid = scopeItem.scopeItemUid;
            scopeItemNodeObj.rowUid = scopeItem.uid;
            //tasks: Object
            scopeItemNodeObj.$el = me.rowsById[scopeItem.uid];
            scopeItemNodeObj.uid = scopeItem.uid;

            return scopeItemNodeObj;
        },

        getScopeItemRootNodeData: function (projectScope) {
            var scopeItemNodeObj = {};

            scopeItemNodeObj.id = projectScope.id;
            scopeItemNodeObj.name = this.project.name;
            scopeItemNodeObj.order = "0";
            scopeItemNodeObj.outlineLevel = 0;
            scopeItemNodeObj.scopeItemUid = projectScope.id;
            scopeItemNodeObj.uid = projectScope.uid;

            return scopeItemNodeObj;
        },

        createExtJSTree: function () {
            var scopeItemStoreData = this.populateScopeTreeStore();
            var insertAfter = this.$view.find(".matrix-view-end-marker").last();
            var renderToElement = Ext.get(this.$view.find(".matrix-view-end-marker")[0]); //.after( // Ext.get($('<div class="matrix-view-fixed-column-viewport" />')[0]);

            var scopeItemStore = Ext.create('Ext.data.TreeStore', {
                id: 'scopeItemTreeStore',
                root: scopeItemStoreData
            });

            var matrixView = this;

            var cellEditingPlugin = Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1
            }); //
            var scopeItemTree = Ext.getCmp("scopeItemTree");
            if (scopeItemTree) {
                scopeItemTree.destroy();
            }
            var WBS_Tree_Instance = Ext.create('ProjectPlanning.view.ScopeColumn.ScopeColumnView', { scopeItemStore: scopeItemStore, renderToProperty: renderToElement, matrixView: matrixView, cellEditingPlugin: cellEditingPlugin });
            WBS_Tree_Instance.show();

            this.$leftColContainer.prepend($("#scopeItemTree"));

            this.hideRowsForCollapsedNodes();

            this.syncRowHeights();
        },

        hideRowsForCollapsedNodes: function () {
            var pertview = this;
            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            _.each(this.project.rows, function (row, idx) {
                var Node = pertview.findChildRecursively(tree, "rowUid", row.uid);
                if (!row.isExpanded) {
                    pertview.hideAllChildRows(Node);
                }
            });
        },

        hideAllChildRows: function (Node) {
            if (Node.childNodes.length == 0) {

            } else {
                for (i = 0; i < Node.childNodes.length; i++) {
                    var node = Node.childNodes[i];
                    $(node.get("data").$el).css("display", "none");
                    this.hideAllChildRows(node)
                }
            }
        },

        renderMilestone: function ($ms, $cell, phase) {

            var ms = $ms.data("model");


            //SS-needs to be moved to milestone-view
            $ms.find(".milestone-name").text(ms.name);
            var $wrap = $ms.find(".ms-content-wrap"); //var $wrap = $ms.find(".milestone-icon-wrap");
            if (ms.taskType === PE_SHORT) {
                $wrap.find(".milestone-icon").text(PE_SHORT);
                $ms.addClass("projectEnd");
            } else if (ms.taskType === CMS_SHORT) {
                $wrap.find(".milestone-icon").text(CMS_SHORT);
            } else if (ms.taskType === IMS_SHORT) {
                $wrap.find(".milestone-icon").text(IMS_SHORT);
                $ms.addClass("internal-milestone");
            } else if (ms.taskType === "NONE") {
                $wrap.find(".milestone-icon").text("");
                $ms.addClass("internal-milestone");
                $ms.addClass("PP-milestone");
            } else {
                $wrap.addClass("PE-milestone");
            }
            $wrap.data('linkable-element-name', ms.name);
            $wrap.data('link-target-selector', '.milestone-icon-wrap');
            if (this.linksView){
                this.linksView.addLinkIds($wrap);
                this.linksView.addElements($wrap);
            }
            this.milestoneElementsById[ms.uid] = $ms;
            this.addIsCriticalClassForMilestone($ms, ms);
            Ext.getCmp('CCSummarygrid').updateMilestoneSheet(ms);
            return $ms;
        },

        addEmptyTaskMSUI:function (taskOrMS,insertPositionType,phase, $cell, $insertAfterthisTask,$insertBeforethisTask,templateCfg) {
            var taskMsView;
            var viewConfig = this.getTaskMSViewConfig(taskOrMS,insertPositionType,phase, $cell, $insertAfterthisTask,$insertBeforethisTask,templateCfg);
            if(taskOrMS === "task"){
                taskMsView = new stl.view.TaskView(viewConfig);
            }else{
                taskMsView = new stl.view.MilestoneView(viewConfig);
            }
            $cell.addClass("has-task");
            this.attachMatrixViewHandlersToTaskViewEvents(taskMsView, taskOrMS);
            return taskMsView;
        },

        getTaskMSViewConfig:function(taskOrMS,insertPositionType,phase, $cell, $insertAfterthisTask,$insertBeforethisTask,templateCfg){
            var insertOptions={};
            switch (insertPositionType) {
                case 0:
                    insertOptions.insertBefore = $cell.find(".task-placeholder");
                    break;
                case 1:
                    insertOptions.insertAfter = $insertAfterthisTask;
                    break;
                case 2:
                    insertOptions.insertBefore = $insertBeforethisTask;
                    break;
                default:
                    insertOptions.insertBefore = $cell.find(".task-placeholder");

            }

            return {
                insertBefore: insertOptions.insertBefore,
                insertAfter: insertOptions.insertAfter,
                project: this.project,
                availablePeopleAndTeams: stl.app.availablePeopleAndTeams,
                readOnly: this.readOnly,
                phase: phase,
                //Config Settings from conweb
                isSubtaskEnabled: ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled && this.project.isSubtaskEnabled,
                completeSubtaskOnChecklistComplete: ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled,
                //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
                includeCompletedSubtask: true , //ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled,
                templateCfg:templateCfg

            };
        },
        attachMatrixViewHandlersToTaskViewEvents:function(taskMSView, taskOrMS){
            $(taskMSView).on({
                "zoom": this.onTaskZoom.bind(this),
                "addTask": this.onNewTaskPlaceholderClick.bind(this),
                "delete": (taskOrMS === "task")? 
                            this.onTaskViewDelete.bind(this):
                            this.onMilestoneDeleteLocal.bind(this),
                "deletesubtask": this.onTaskViewSubtaskDelete.bind(this),
                "resourcechange": this.saveProject.bind(this),
                "enterquickedit":
                (taskOrMS === "task")? 
                            this.onTaskEnterQuickEdit.bind(this):
                            this.onMSEnterQuickEdit.bind(this),
                "exitquickedit": 
                (taskOrMS === "task")? 
                            this.onTaskExitQuickEdit.bind(this):
                            this.onMSExitQuickEdit.bind(this),
                "change": this.onTaskViewChange.bind(this),
                "autolinkallChange": this.onAutoLinkAllChange.bind(this)
            });
            if(taskOrMS === "task") {
                $(taskMSView).on({
                    "fullkittaskclick": this.onFullKitTaskClick.bind(this),
                });
            }
        },

        addEmptyTaskUI: function (phase, $cell, $insertAfterthisTask,templateCfg) {
            var taskView = new stl.view.TaskView({
                insertBefore: $cell.find(".task-placeholder"),
                insertAfter: $insertAfterthisTask,
                project: this.project,
                availablePeopleAndTeams: stl.app.availablePeopleAndTeams,
                readOnly: this.readOnly,
                phase: phase,
                //Config Settings from conweb
                isSubtaskEnabled: ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled && this.project.isSubtaskEnabled,
                completeSubtaskOnChecklistComplete: ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled,
                //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
                includeCompletedSubtask: true , //ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled,
                templateCfg:templateCfg

            });
            $cell.addClass("has-task");
            $(taskView).on({
                "zoom": this.onTaskZoom.bind(this),
                "addTask": this.onNewTaskPlaceholderClick.bind(this),
                "delete": this.onTaskViewDelete.bind(this),
                "deletesubtask": this.onTaskViewSubtaskDelete.bind(this),
                //  "resize": this.refreshLinks.bind(this),
                "resourcechange": this.saveProject.bind(this),
                "enterquickedit": this.onTaskEnterQuickEdit.bind(this),
                "exitquickedit": this.onTaskExitQuickEdit.bind(this),
                "fullkittaskclick": this.onFullKitTaskClick.bind(this),
                "change": this.onTaskViewChange.bind(this),
                "autolinkallChange": this.onAutoLinkAllChange.bind(this)
            });
            return taskView;
        },

        addEmptyMSUI: function (phase, $cell, $insertAfterthisTask) {
            var milestoneView = new stl.view.MilestoneView({
                insertBefore: $cell.find(".task-placeholder"),
                insertAfter: $insertAfterthisTask,
                project: this.project,
                availablePeopleAndTeams: stl.app.availablePeopleAndTeams,
                readOnly: this.readOnly,
                phase: phase,
                //Config Settings from conweb
                isSubtaskEnabled: ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled && this.project.isSubtaskEnabled,
                completeSubtaskOnChecklistComplete: ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled,
                //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
                includeCompletedSubtask: true//ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled

            });
            $cell.addClass("has-task");
            $(milestoneView).on({
                "zoom": this.onTaskZoom.bind(this),
                "addTask": this.onNewTaskPlaceholderClick.bind(this),
                "delete": this.onMilestoneDeleteLocal.bind(this),
                "deletesubtask": this.onTaskViewSubtaskDelete.bind(this),
                //"resize": this.refreshLinks.bind(this),
                "resourcechange": this.saveProject.bind(this),
                "enterquickedit": this.onMSEnterQuickEdit.bind(this),
                "exitquickedit": this.onMSExitQuickEdit.bind(this),
                "change": this.onTaskViewChange.bind(this),
                "autolinkallChange": this.onAutoLinkAllChange.bind(this)
            });
            return milestoneView;
        },

        getPreviousVisibleRow: function ($row) {
            return $row.prevAll(":visible:first");
        },

        updateDataForSubtasks: function(newTask){
            _.each(newTask.subtasks, function(subtask){
                subtask.uid = subtask.id = stl.app.ProjectDataFromServer.getNextUID("subtask");
            });
        },

        updateBasicTaskdata : function(task, oldTask, row, phase){
            task.uid = task.id = stl.app.ProjectDataFromServer.getNextUID("task");
            task.rowId = row.uid;
            task.phaseId = phase.id;
            if(stl.app.matrixView.TasksCopied){
               if (task.isMS){
                    task.name = COPY_OF_ + oldTask.name;
                } 
            }
            task.isCritical = false;
            task._successors = [];
            task._predecessors = [];
        },

        updateSuccessorPredecessorOfCopiedTask: function(task, taskMap){
            var me = this;
            _.each(task._predecessors, function(predTask){
                if (me.multipleSelectedTasks[predTask.uid] || (stl.app.matrixView.TasksCut)){
                    var copiedPredecessorTaskUid = taskMap[predTask.uid] || me.project._tasksAndMilestonesByUid[predTask.uid].uid;
                    var copiedtaskUid = taskMap[task.uid];
                    //var copiedTask = stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[copiedtaskUid];
                    if(!stl.app.ProjectDataFromServer.doesLinkExists(copiedtaskUid, copiedPredecessorTaskUid)){
                        stl.app.ProjectDataFromServer.addLink({ from: copiedPredecessorTaskUid, to: copiedtaskUid });
                    }
                    
                    //var predcessorTask = stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[copiedPredecessorTaskUid];
                    //copiedTask._predecessors.push(predcessorTask);
                }
            });

            _.each(task._successors, function(predTask){
                if (me.multipleSelectedTasks[predTask.uid] || (stl.app.matrixView.TasksCut)){
                    var copiedPredecessorTaskUid = taskMap[predTask.uid] || me.project._tasksAndMilestonesByUid[predTask.uid].uid;
                    var copiedtaskUid = taskMap[task.uid];
                    //var copiedTask = stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[copiedtaskUid];
                    //var predcessorTask = stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[copiedPredecessorTaskUid];
                    //copiedTask._successors.push(predcessorTask);
                    if(!stl.app.ProjectDataFromServer.doesLinkExists(copiedPredecessorTaskUid, copiedtaskUid)){
                        stl.app.ProjectDataFromServer.addLink({ from: copiedtaskUid, to: copiedPredecessorTaskUid });
                    }
                    
                }
            });
        },
        removePEFromCopiedTasks: function(){
           var isPECopied = false;
           var me = this;
           if (stl.app.matrixView.TasksCopied){
            var keys = Object.keys(me.multipleSelectedTasks);
                _.each(keys, function(key){
                    var task = me.multipleSelectedTasks[key];
                    if(task.isMS == true && task.taskType == PE_SHORT){
                        delete me.multipleSelectedTasks[task.uid];
                        isPECopied = true;
                    }
                });
            };

            return isPECopied; 
        },

        getCopiedTaskModel: function(task){
            var taskPred = task._predecessors;
            var taskSucc = task._successors;
            task._predecessors = [];
            task._successors = [];
            var newTask = $.extend(true, {}, task);//JSON.parse(JSON.stringify(task));
            task._predecessors = taskPred;
            task._successors = taskSucc;
            return newTask;
        },
        onNewTaskPlaceholderClickDelegate: function(evt) {
            var me = this;
            var taskToCopiedTaskMap = {};
            var arrTaskDataToBeAdded = [];
            var arrMSDataToBeAdded = [];
            var allCopiedTasksAndMilestones = [];
            var isPECopied = false;
            var isBufferCopied = false;

            if (stl.app.matrixView.TasksCopied || stl.app.matrixView.TasksCut) {

                var $row = $(evt.target).closest(".matrix-view-row");
                var $clickedCell = $(evt.target).closest(".phase-column");
                var clickedPhaseOrder = $.inArray($clickedCell[0], $row.find(".phase-column"));
                var isPhaseInfoRetained = true;
                var isRowInfoRetained = false;
                var phaseSelectedByOrder = [];
                var phases = this.project.phases;
                var tasksByRowId = {};
                var newRowObjectWithTasks = {};
                var isPECopied = this.removePEFromCopiedTasks();
                var newtasksUndoParamsA = [];

                /*in the below code the selected tasks stored in an object this.multipleSelectedTasks
                is first grouped by row(row uid) and then by phases(phase id) within each row.
                After both the grouping, the collection keys are sorted ascending based on its order.
                This ensures the relative position of the selected tasks are maintained.

                copying tasks means copying all data except for uid/id/prdecessors/successors. 
                In case of MS, name is also not copied. Internal links(links amongst the selected tasks) are 
                retained.

                PEMS/IPMS/Buffer Tasks are not allowed to cut/copy/paste. PE allowed for cut/paste only.
                PE is removed from the collection of selected tasks, before copying task models by method
                this.removePEFromCopiedTasks. 
                IPMS/PEMS/Buffer tasks are however removed after paste is complete. This difference is because we 
                wanted the code to reuse the code for remove buffers and IPMS/PEMS. These tasks after deletion leaves 
                broken links(dangling predecessors and successors). The broken links are reconnected to complete the network
                All these code resides in project-model.js   

                */


                //Tasks being broken down per row
                var keys = Object.keys(me.multipleSelectedTasks);
                _.each(keys, function(key) {
                    var task = me.multipleSelectedTasks[key];
                    if (tasksByRowId[task.rowId]) {
                        tasksByRowId[task.rowId].push(task);

                    } else {
                        tasksByRowId[task.rowId] = [];
                        tasksByRowId[task.rowId].push(task);
                    }
                });

                var rowKeys = Object.keys(tasksByRowId);
                //row are being sorted based on order as task may be selected in any order
                rowKeys.sort(function(t1, t2) {
                    var row1 = stl.app.ProjectDataFromServer.getRowById(t1);
                    var row2 = stl.app.ProjectDataFromServer.getRowById(t2);
                    return parseInt(row1.order) - parseInt(row2.order)
                });

                _.each(rowKeys, function(key) {
                    var tasksByPhaseId = {};
                    var tasksInRow = tasksByRowId[key];
                    //breaking down the tasks based on phase ID
                    _.each(phases, function(phase) {
                        var keys = Object.keys(me.multipleSelectedTasks);
                        var tasks = [];
                        _.each(tasksInRow, function(task) {
                            if (task.phaseId == phase.id) {
                                tasks.push(task);
                            }
                        });

                        if (tasks.length > 0) {
                            tasks.sort(function(t1, t2) {
                                return t1.order - t2.order
                            });
                            tasksByPhaseId[phase.id] = tasks;
                            phaseSelectedByOrder.push(phase.order);
                        }


                    });
                    newRowObjectWithTasks[key] = tasksByPhaseId;
                })


                var newObjKeys = Object.keys(newRowObjectWithTasks);
                _.each(rowKeys, function(newKey, idx) {
                    var tasksByPhaseId = newRowObjectWithTasks[newKey];

                    //sorting the phase ids based on order
                    keys = Object.keys(tasksByPhaseId);
                    keys.sort(function(t1, t2) {
                        var phase1 = stl.app.ProjectDataFromServer.getPhaseById(t1);
                        var phase2 = stl.app.ProjectDataFromServer.getPhaseById(t2);
                        return parseInt(phase1.order) - parseInt(phase2.order)
                    });
                    //deciding whether to retain phase info or not
                    if (phaseSelectedByOrder.indexOf(clickedPhaseOrder.toString()) < 0 && phaseSelectedByOrder.indexOf(clickedPhaseOrder) < 0) {
                        isPhaseInfoRetained = false;
                        //isRowInfoRetained = true;
                    }

                    if ($row.hasClass("row-placeholder")) {
                        $fixedCell = stl.app.matrixView.$view.find(".tree-column.row-placeholder");
                        var previousVisibleRow = stl.app.matrixView.getPreviousVisibleRow($row);
                        var siblingScopeItemUid = previousVisibleRow.attr("scopeitemuid");
                        var siblingRowUid = previousVisibleRow.attr("rowUid");
                        stl.app.matrixView.convertRowPlaceholderToRow(siblingScopeItemUid, siblingRowUid);
                    }
                    var $phaseCells = $row.find(".phase-column");
                    var row = $row.data("model");

                    for (i = 0; i < keys.length; i++) {

                        var scope = stl.app.matrixView.project._scopeItemsByUid[row.scopeItemUid];
                        var newTasks = tasksByPhaseId[keys[i]]; //clickedPhaseOrder
                        var phase = !isPhaseInfoRetained ? stl.app.matrixView.project.getPhaseByOrder(clickedPhaseOrder) : stl.app.matrixView.project.getPhaseById(keys[i]);
                        var $cell = !isPhaseInfoRetained ? $($phaseCells[clickedPhaseOrder]) : $($phaseCells[phase.order]);
                        var $lastAddedTask = $(evt.target).closest(".task,.milestone");
                        for (j = 0; j < newTasks.length; j++) {
                            var task = newTasks[j];
                            var newTask = stl.app.matrixView.getCopiedTaskModel(task);
                            stl.app.matrixView.updateBasicTaskdata(newTask, task, row, phase);
                            stl.app.matrixView.updateDataForSubtasks(newTask);
                            taskToCopiedTaskMap[task.uid] = newTask.uid;

                            var $insertTaskAfterThisTask = idx == 0 && i == 0 ? $lastAddedTask : $cell.find(".task,.milestone").last();
                            var taskView, $task;
                            if (newTask.isMS) {
                                taskView = stl.app.matrixView.addEmptyMSUI(phase, $cell, $insertTaskAfterThisTask);
                                taskView.load(newTask);
                                $task = taskView.$el;
                                // add elements for links is handled inside render milestone
                                //So no need to add it separately similar to task 
                                stl.app.matrixView.renderMilestone($task, $cell, phase);
                                stl.app.ProjectDataFromServer._milestones.push(newTask);
                                if (newTask.taskType === PE_SHORT) {
                                    stl.app.ProjectDataFromServer._projectEndMs = newTask;
                                    stl.app.CreateTaskToolBar.onPEAddDelete(true /*isAdd*/ );
                                }
                            } else {
                                taskView = stl.app.matrixView.addEmptyTaskUI(phase, $cell, $insertTaskAfterThisTask);

                                taskView.load(newTask);
                                $task = taskView.$el;
                                stl.app.matrixView.tasksByUid[newTask.uid] = taskView;
                                $task.find(".task-content-wrapper").css({
                                    height: ZOOM_TASKHEIGHTS[stl.app.matrixView.zoomLevel],
                                    width: ZOOM_TASKWIDTHS[stl.app.matrixView.zoomLevel]
                                });
                                //me.linksView.addElements($task);
                            }
                            $lastAddedTask = $task;
                            stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[newTask.uid] = newTask;
                            var scope = stl.app.ProjectDataFromServer.getScopeItemByUid(row.scopeItemUid);
                            stl.app.ProjectDataFromServer.incrementTaskCountInPhaseScopeMap(phase.uid + '.' + scope.uid);
                            $task.find(".task-content-wrapper").css({
                                height: ZOOM_TASKHEIGHTS[stl.app.matrixView.zoomLevel],
                                width: ZOOM_TASKWIDTHS[stl.app.matrixView.zoomLevel]
                            });
                            stl.app.matrixView.syncColumnWidths();
                            allCopiedTasksAndMilestones.push(newTask);
                            var $prevTask = $task.prev();
                            var prevTaskUid;
                            if ($prevTask && $prevTask.length > 0)
                                prevTaskUid = $task.prev().data('model').uid;
                            if (!newTask.isMS) {
                                //stl.app.matrixView.onTaskAdd(null, stl.app.matrixView, newTask, scope, row, phase, null);
                                $(document).trigger("taskadd", [stl.app.matrixView, newTask, scope, phase, row, prevTaskUid]);
                                //arrTaskDataToBeAdded.push(taskDataObj);
                            } else {
                                //stl.app.matrixView.onMilestoneAdd(null, stl.app.matrixView, newTask, scope, row, phase, null);
                                $(document).trigger("milestoneadd", [stl.app.matrixView, newTask, scope, phase, row, prevTaskUid]);
                                //arrMSDataToBeAdded.push(taskDataObj);
                            }

                            if (task.taskType === "PEMS" || task.taskType === "IPMS" || task.taskType === "buffer")
                                continue;
                            var immediateSiblingsUid = me.project.getImmediateSiblingsUids(newTask);
                            var taskDeleteUndoParams = {
                                task: newTask,
                                row: row,
                                scope: scope,
                                phase: phase,
                                prevTaskUid: immediateSiblingsUid.prevTaskUid,
                                nextTaskUid: immediateSiblingsUid.nextTaskUid
                            };
                            newtasksUndoParamsA.push(taskDeleteUndoParams);
                        }
                    }

                    stl.app.matrixView.saveRow($row);
                    if (idx < newObjKeys.length - 1) {
                        $row = $($row).next();
                    }
                });

                _.each(stl.app.matrixView.multipleSelectedTasks, function(task) {
                    stl.app.matrixView.updateSuccessorPredecessorOfCopiedTask(task, taskToCopiedTaskMap);
                });

                stl.app.ProjectDataFromServer.removeBufferTasks(allCopiedTasksAndMilestones);
                stl.app.ProjectDataFromServer.removeIPMS(allCopiedTasksAndMilestones);
                stl.app.ProjectDataFromServer.removePEMS(allCopiedTasksAndMilestones);

                if (stl.app.matrixView.TasksCut) {
                    var oldtasksUndoParamsA = [];
                    this.fillTasksUndoRedoParamsArray(stl.app.matrixView.multipleSelectedTasks, oldtasksUndoParamsA);
                    stl.app.undoStackMgr.pushToUndoStackForMultiTaskCut(stl.app.matrixView.project, {
                        newtasksUndoParamsA: newtasksUndoParamsA,
                        oldtasksUndoParamsA: oldtasksUndoParamsA
                    });
                } else
                    stl.app.undoStackMgr.pushToUndoStackForMultiTaskAdd(stl.app.matrixView.project, newtasksUndoParamsA);

                if (stl.app.matrixView.TasksCut) {
                    var keys = Object.keys(stl.app.matrixView.multipleSelectedTasks);
                    _.each(keys, function(key) {
                        var task = stl.app.matrixView.multipleSelectedTasks[key];
                        if (task.taskType == PEMS_SHORT ||
                            task.taskType == IPMS_SHORT ||
                            task.taskType === "buffer") return;
                        if (task.isMS) {
                            stl.app.matrixView.deleteMilestone(task.uid);
                        } else
                            $(document).trigger("taskremove", [stl.app.matrixView, task, task.rowId, task.phaseId, null])
                        delete stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[task.uid];

                    });
                }

                isBufferCopied = stl.app.matrixView.isBufferTaskRemovedWhileCopy;
                stl.app.matrixView.isBufferTaskRemovedWhileCopy = false;

                var infoStr = this.getInfoMsgForPaste(isPECopied, isBufferCopied);

                if (infoStr.trim() != "") {
                    PPI_Notifier.info(infoStr);
                }
                stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
                this.refreshLinks();
                $(document).trigger("taskMultiSelectEnd");

            } else {
                this.onNewTaskPlaceholderClick(evt);
            }

        },

        getInfoMsgForPaste: function(isPECopied, isBufferCopied){
            var infoStr = "";
            var taskStr = "";
            if (isPECopied){
                taskStr = PROJECT_END_STR;
            }

            if (isBufferCopied){
                if (taskStr.trim() != ""){
                    taskStr += AND_BUFFER_TASKS_STR;
                } else {
                    taskStr = BUFFER_TASKS_STR;
                }
            }

            if (this.isPEMSRemoved){
                if (taskStr.trim() != ""){
                    taskStr += AND_PEMS_TASKS_STR;
                } else {
                    taskStr = PEMS_TASKS_STR;
                }
                this.isPEMSRemoved = false;
            }

            if (this.isIPMSRemoved){
                if (taskStr.trim() != ""){
                    taskStr += AND_IPMS_TASKS_STR;
                } else {
                    taskStr = IPMS_TASKS_STR;
                }
                this.isIPMSRemoved = false;
            }


            if (taskStr.trim() != ""){
                if (stl.app.matrixView.TasksCopied){
                    infoStr = COPY_AND_PASTE_OF + taskStr + NOT_ALLOWED;
                }

                if (stl.app.matrixView.TasksCut){
                    infoStr = CUT_AND_PASTE_OF + taskStr + NOT_ALLOWED;
                }
            }
            
            return infoStr;
        },

        onNewTaskPlaceholderClick: function(evt, task) {

            var me = this,
                $insertTaskAfterThisTask, $taskPlaceholder, $cell;
            var createTaskTypeof = stl.app.CreateTaskToolBar.getCurrentSelectedTaskType();

            $insertTaskAfterThisTask = evt.target.$el;
            if ($insertTaskAfterThisTask)
                $cell = $($insertTaskAfterThisTask).closest(".phase-column");
            else {
                $taskPlaceholder = $(evt.target);
                $cell = $($taskPlaceholder).closest(".phase-column");
            }

            var $row = $cell.closest(".matrix-view-row"),
                phase = this.project.phases[$row.find(".phase-column").index($cell)];

            if ($row.hasClass("row-placeholder")) {
                $fixedCell = this.$view.find(".tree-column.row-placeholder");
                var previousVisibleRow = this.getPreviousVisibleRow($row);
                var siblingScopeItemUid = previousVisibleRow.attr("scopeitemuid");
                var siblingRowUid = previousVisibleRow.attr("rowUid");
                me.convertRowPlaceholderToRow(siblingScopeItemUid, siblingRowUid);
            }
            var row = $row.data("model"),
                scope = this.project._scopeItemsByUid[row.scopeItemUid];


            var newTask, taskView, $task;
            if (phase.type === STRING_MILESTONE_LOWER_CASE) {
                if (multipleORs(createTaskTypeof, CMS_SHORT, PE_SHORT, IMS_SHORT, STRING_NONE_UPPER_CASE))
                    newTask = me.project.createTaskModel(phase, row, createTaskTypeof);
                else
                    newTask = me.project.createTaskModel(phase, row, CMS_SHORT);
            } else if (phase.type === FULL_KIT)
                newTask = me.project.createTaskModel(phase, row, TASKTYPE_FULLKIT);
            else {
                newTask = me.project.createTaskModel(phase, row, createTaskTypeof);
                if (multipleORs(createTaskTypeof, CMS_SHORT, IMS_SHORT, TASKTYPE_FULLKIT))
                    stl.app.CreateTaskToolBar.selectDefaultTaskType();
            }
            if (newTask.isMS) {
                taskView = this.addEmptyMSUI(phase, $cell, $insertTaskAfterThisTask);
                taskView.load(newTask);
                $task = taskView.$el;
                // add elements for links is handled inside render milestone
                //So no need to add it separately similar to task 
                me.renderMilestone($task, $cell, phase);
            } else {
                taskView = this.addEmptyTaskUI(phase, $cell, $insertTaskAfterThisTask);
                taskView.load(newTask);
                $task = taskView.$el;
                this.tasksByUid[newTask.uid] = taskView;
                me.linksView.addLinkIds($task);
                me.linksView.addElements($task);
            }
            $task.find(".task-content-wrapper").css({
                height: ZOOM_TASKHEIGHTS[this.zoomLevel],
                width: ZOOM_TASKWIDTHS[this.zoomLevel]
            });

            // Save the row because we're adding to its tasks collection
            me.saveRow($row);
            // TODO: right now commenting out the autolink code since this is already broken but we need to reinstate this once autolink starts working
            me.generateAutoLinks($task, phase);

            if (phase.type !== STRING_NORMAL)
                me.configureAutoLinkAll($task);
            me.syncColumnWidths();

            me.scrollIntoView($task);

            var immediateSiblingsUid = this.project.getImmediateSiblingsUids(newTask);
            if (!newTask.isMS) {
                $(document).trigger("taskadd", [me, newTask, scope, phase, row, immediateSiblingsUid.prevTaskUid]);
            } else {
                $(document).trigger("milestoneadd", [me, newTask, scope, phase, row, immediateSiblingsUid.prevTaskUid]);
            }
            // MM: add the event "Add Task" to undo stack. Undo event: RemoveTask, Redo Event: Add Task
            stl.app.undoStackMgr.pushToUndoStackForTaskAdd(stl.app.matrixView.project, newTask, scope, row, phase,
                immediateSiblingsUid.prevTaskUid, immediateSiblingsUid.nextTaskUid);
            stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            me.refreshLinks();
        },

        generateAutoLinks: function ($task, phase) {
            var taskModel = $task.data('model');
            if (taskModel.isMS)
                this.generateAutoLinksForMilestone($task, phase);
            else
                this.generateAutoLinksForTask($task, phase);

        },

        configureAutoLinkAll: function ($task) {
            var taskModel, findClass;
            taskModel = $task.data('model');
            if (taskModel.isMS) {
                findClass = null;//".ms-autolink input";
            } else {
                if (taskModel.taskType === FULL_KIT) {
                    findClass = ".fk-autolink input";
                }
            }
            if (findClass && stl.app.generateAutoLinksAllowed) {
                $task.find(findClass).prop('checked', true);
                this.onAutoLinkAllChecked($task);
            }
        },


        initDragEventsOnPhaseCell: function ($cell, phase) {
            var me = this,
                cellDom = $cell[0];
            var phaseType = phase.type;
            if (!phaseType || phaseType === "normal") {
                $cell.sortable({
                    handle: ".task-name .drag-drop-handle",
                    itemSelector: ".task",
                    scroll: true,
                    distance: 5,
                    vertical:false,
                    // IMPORTANT: The sortable plugin maintains group state between disposals of matrix view.
                    // Must prefix the group ID with the matrix view ID to prevent cross-pollution with prior instances.
                    group: "matrix-view-" + this.matrixViewId + "-tasks",
                    placeholder: '<div class="placeholder task-reorder-placeholder"></div>',
                    pullPlaceholder: true,
                    onMousedown: function ($item, _super, event) {
                        return !me.readOnly && $item.length > 0 && !$item.hasClass("quick-task-edit") && !$item.hasClass("task-zoom-normal")
                        && !$item.hasClass("zero-duration-task");
                    },
                    onDragStart: function (item, group, _super) {
                        //me.linksView.setVisible(false);
                        me.$taskDragOrigRow = item.closest(".matrix-view-row");
                        me.$taskDragOrigColumn = item.closest(".phase-column");
                        item.css("position", "relative");
                        me.$view.addClass("dragging");
                        _super(item);
                    },
                    // Handle dropping a task
                    onDrop: function ($task, targetContainer, _super) {
                        me.$view.removeClass("dragging");
                        var $newRow = $task.closest(".matrix-view-row"),
                            $origRow = me.$taskDragOrigRow,
                            $newCell = $task.closest(".phase-column"),
                            $oldCell = me.$taskDragOrigColumn,
                            newPhase = me.project.phases[$newRow.find(".phase-column").index($newCell)],
                            task = $task.data("model");
                        _super($task);
                        $newCell.addClass("has-task");

                        var oldCellHasTasks = $oldCell.find('.task,.milestone');
                        if (oldCellHasTasks.length === 0)
                            $oldCell.removeClass("has-task");


                        var $taskAfterNewButton = $newCell.find(".task-placeholder").next(".task");
                        if ($taskAfterNewButton.length > 0) {
                            $newCell.find(".task-placeholder").before($taskAfterNewButton);
                        }
                        task.phaseId = newPhase.uid;
                        if ($newRow.hasClass("row-placeholder")) {
                            var previousVisibleRow = me.getPreviousVisibleRow($newRow);
                            var siblingScopeItemUid = previousVisibleRow.attr("scopeitemuid");
                            var siblingRowUid = previousVisibleRow.attr("rowUid");
                            me.convertRowPlaceholderToRow(siblingScopeItemUid,siblingRowUid);
                            me.saveRow($newRow);
                        }
                        task.rowId = $newRow.data('model').uid;
                        me.saveRow($origRow);
                        delete me.$taskDragOrigRow;
                        delete me.$taskDragOrigColumn;

                        // Remove any links that existed on the task we just moved
                        //me.removeAutoAndInvalidLinksForTask($task.data("model").uid);
                        // If we dropped the task between two other tasks, delete any link between those two
                        var $tasks = $newCell.find(".task"),
                            taskIndex = $tasks.index($task);
                        if (taskIndex > 0 && taskIndex < taskIndex - 1) {
                            //me.removeLink($tasks.eq(taskIndex - 1), $tasks.eq(taskIndex + 1));
                        }
                        // Now create auto links based on the task's new position
                        //me.generateAutoLinksForTask($task, newPhase);
                        // TODO if task was removed from between two other tasks in same cell, link those two
                        var taskView = me.tasksByUid[task.uid];
                        taskView.updateTaskPhaseColors($task, task);
                        if (!$newRow.is($origRow)) {
                            //task drag across row
                            me.saveRow($newRow);
                            $(document).trigger("rowchange", [
                                me,
                                $origRow.data("model"),
                                $newRow.data("model"),
                                newPhase
                            ]);
                        } else {
                            //task drag across phase
                            $(document).trigger("phasechange", [
                                me,
                                me.project.phases[$newRow.find(".phase-column").index($oldCell)],
                                newPhase
                            ]);
                        }
                        me.saveProject();
                        // TODO on task move between cells, may need to remove links that are no longer allowed
                        me.refreshLinks();
                        if ($(".toggle-links-button").hasClass("pressed")) {
                            //me.linksView.setVisible(true);
                        }
                        me.syncColumnWidths();
                        me.syncRowHeights();
                    }
                });
            }
        },

        /**
        * Handle zoom for individual task (not master zoom)
        */
        onTaskZoom: function (evt) {
            var taskView = evt.target,
                $task = taskView.$el,
                $parentphase = $task.closest(".phase-column.hidden-title"),
                newWidth = null,
                newHeight = null,
                zoomingIn = false,
                $taskProperties = $task.find(".task-properties"),
                taskPropertiesHorizPadding = ($taskProperties.outerWidth() - $taskProperties.width());

            if ($task.hasClass("task-zoom-normal")) {

                if (this.project.checkIfZeroDurationTask(taskView.task))
                    $task.addClass('zero-duration-task');

                // Already zoomed; zoom out
                $task.attr('data-qtip', taskView.task.name);
                this.removeOverlayModeCssChanges();
                newWidth = ZOOM_TASKWIDTHS[this.zoomLevel];
                newHeight = ZOOM_TASKHEIGHTS[this.zoomLevel];
                this.selectedTask = null;
                if (this.zoomLevel == 0) {
                    $task.find(".task-controls").css("display", '');
                }
                $(document).trigger("taskchange", [this, taskView.task]);
                $(document).trigger("taskselectionchange", [this.selectedTask]);
                stl.app.undoStackMgr.activateStack(UndoStackTypesEnum.ProjectStack);                
            } else {
                // Zoom in
                var newWidth = NORMAL_ZOOM_TASKWIDTH;
                newHeight = 'auto';
                zoomingIn = true;

                $task.attr('data-qtip', '');
                //Vrushali - CON-2426
                //If any other task (other than zoomed in task) is in quick edit mode then exit its quick edit mode
                var quickEditTask = $(".matrix-view-viewport").find(".quick-task-edit");
                if (quickEditTask.length > 0)
                    $(quickEditTask).data("view").exitQuickEditMode();


                if (taskView.isSubtaskEnabled && taskView.task.subtaskCount > 0) {
                    
                        
                } else {
                    $task.find(".rollUp-Btn-group.btn-group").hide();
                }
                $task.find(".subtask-type").show();
		//[CON 2995]Planning: Support of subtasks in PT
                if (taskView.task.taskType == "purchasing") {
                    /*if ($task.find(".subtasks").is(":visible"))
                        $task.find(".subtasks").hide();*/
                } else {
                    if (!$task.find(".subtasks").is(":visible"))
                        $task.find(".subtasks").show();
                }
                this.addOverlayModeCssChanges();

                $parentphase.css("min-width", $parentphase.outerWidth());
                $task.addClass("task-zoom-normal");
                $task.removeClass("task-zoom-small");

                //CON-2361 -Performance: overaly task over other tasks in quick edit mode
                //remove the place holder which was created while entering to quick edit
                $task.removeClass('quick-task-edit');
                $task.next('.task-spaceholder, .task-spaceholder-fk').remove();
                stl.app.undoStackMgr.activateStack(UndoStackTypesEnum.TaskStack);
            }

            if (newWidth && newHeight) {
                //this.linksView.setVisible(false);
                // Set the task properties width manually to prevent it reflowing contents during animation
                $taskProperties.width(zoomingIn ? (newWidth - taskPropertiesHorizPadding) : "auto");
                $task.find(".task-content-wrapper").transition({
                    height: newHeight,
                    width: newWidth
                }, 500, 'in-out', function () {
                    if (!zoomingIn) {
                        $parentphase.css("min-width", 0);
                        $task.removeClass("task-zoom-normal");
                        // Restore this class to match others in the current master zoom level
                        if (this.zoomLevel === ZOOMLEVEL.TASK_ZOOM_SMALL) {
                            $task.addClass("task-zoom-small");
                            $task.find(".subtasks").css("display", "");
                        }
                    }
                    // this.onElementMoveCompleteDelegate();
                    this.scrollIntoView($task, newWidth, (newHeight && newHeight !== "auto" ? newHeight : null));
                } .bind(this));
            } else {
                this.scrollIntoView($task, newWidth, (newHeight && newHeight !== "auto" ? newHeight : null));
            }
        },

        onElementMoveComplete: function () {
            var me = this;
            me.drawNewLinksDelegate();
            me.syncColumnWidths();
            me.syncRowHeights();
        },

        invalidateResourceCache: function () {
            delete this.cachedResourcesById;
            delete this.cachedAvailableResourceOptions;
            delete this.resourceHighlightMenuIsCurrent;
        },

        onCellClick: function () {
            if (this.$view.hasClass("tasks-collapsed")) {
                this.$view.find(".active-task").removeClass("active-task");
                // this.refreshLinks();
            }
        },

        getNewTaskName: function (row, phase) {
            var existingTasks = row.tasks[phase.id],
                existingTaskCount = (existingTasks ? existingTasks.length : 0);
            return phase.name + " " + row.name + (existingTaskCount === 0 ? '' : (' ' + String(existingTaskCount + 1)));
        },

        handleDragenter: function (evt) {
            evt.preventDefault();
            // todo outline target cell if dragging task or listitem
            if (this.draggingTask && $(evt.target).hasClass("phase-column")) {
                $(evt.target).addClass("drop-highlight");
            }
        },

        handleDragleave: function (evt) {
            evt.preventDefault();
            // todo outline target cell if dragging task or listitem
            if ($(evt.target).hasClass("drop-highlight")) {
                $(evt.target).removeClass("drop-highlight");
            }
        },

        handleDragover: function (evt) {
            evt.preventDefault();
        },

        /**
        * Handles dragging a subtask out of a task onto a cell to create a new task from it
        */
        handleDrop: function (evt) {
            var me = this,
                $targetCell = $(evt.target).closest(".phase-column"),
                $draggedLi = $(".sortable-dragging"),
                $draggedTask = $(".task-dragging");
            if ($draggedLi.length > 0 && !$targetCell.hasClass("has-task")) {
                setTimeout(function () {
                    var itemName = $draggedLi.find(".subtask-name textarea").val(),
                        $origTask = $draggedLi.closest(".task"),
                        $targetRow = $targetCell.closest(".matrix-view-row"),
                        targetPhase = me.project.phases[$targetRow.find(".phase-column").index($targetCell)],
                        newTaskModel = me.project.createTask(targetPhase, $targetRow.data("model"), STRING_NORMAL);
                    $draggedLi.remove();
                    newTaskModel.name = itemName;
                    var taskView = this.addEmptyTaskUI(targetPhase, $targetCell);
                    taskView.load(newTaskModel);
                    this.tasksByUid[task.uid] = taskView;
                    $(document).trigger("taskadd", [
                        me, // fixme this should be the matrix view, but we have no object for it yet
                        taskView.$el,
                        newTaskModel,
                        $targetRow.data("model"),
                        targetPhase,
                        $targetRow
                    ]);
                    $("li.sortable-placeholder").remove();
                    //$origTask.data("view").save();
                    //taskView.save();
                    me.saveRow($targetRow);
                    me.refreshLinks();
                }, 0);
            }
            this.draggingTask = false;
            evt.preventDefault();
        },

        setZoomLevel: function (newLevel, previousLevel, isExtraZoom) {
            var me = this,
            // Don't do animation on the initial load
                transitioning = !(previousLevel === null || typeof (previousLevel) === "undefined" || previousLevel === newLevel) || isExtraZoom,
                zoomingIn = (newLevel > previousLevel);
            //  various zoomlevels  ZOOMLEVEL = { CONDENSED: 0,SHORT_TASK_BARS: 1,LONG_TASK_BARS: 2,TASK_ZOOM_SMALL: 3,TASK_ZOOM_FULL: 4}
            this.$view.removeClass('zoom-level-' + previousLevel).addClass('zoom-level-' + newLevel);

            // Min zoom level
            if (newLevel === ZOOMLEVEL.CONDENSED) {
                $(".zoom-button.zoom-out").addClass("disabled");
                this.$view.addClass("tasks-condensed");
            } else {
                $(".zoom-button.zoom-out").removeClass("disabled");
                this.$view.removeClass("tasks-condensed");
            }
            // Max zoom level
            if (newLevel === Object.keys(ZOOMLEVEL).length - 1) {
                $(".zoom-button.zoom-in").addClass("disabled");
            } else {
                $(".zoom-button.zoom-in").removeClass("disabled");
            }
            this.$view.addClass("tasks-collapsed");
            var taskHeight = ZOOM_TASKHEIGHTS[newLevel];
            var condensationLevelClass = CONDENSATION_CLASSES[newLevel];
            var $tasks;
            if (transitioning && zoomingIn && newLevel == ZOOMLEVEL.TASK_ZOOM_FULL) {
                // Don't zoom buffer tasks except in TASK_ZOOM_SMALL
                $tasks = this.$view.find(".task:not(.buffer-task), .fk, .ms");
            } else {
                $tasks = this.$view.find(".task, .fk, .ms");
            }
            $tasks.removeClass("task-zoom-collapsed task-zoom-normal");
            $tasks.toggleClass("task-zoom-small", (newLevel === ZOOMLEVEL.TASK_ZOOM_SMALL));
            if (newLevel === Object.keys(ZOOMLEVEL).length - 1) {
                if (!$tasks.hasClass("task-properties-alignment"))
                    $tasks.addClass("task-properties-alignment");
            } else
                $tasks.removeClass("task-properties-alignment");
            this.$view.find(".fullkit, .fk")
                .toggleClass("fk", (newLevel === ZOOMLEVEL.TASK_ZOOM_SMALL))
                .toggleClass("fullkit", (newLevel !== ZOOMLEVEL.TASK_ZOOM_SMALL));
            // Throw out individual subtask section visibility in order to reset to the default for the zoomlevel
            $tasks.find(".subtasks").css("display", "");
            var taskWidth = ZOOM_TASKWIDTHS[newLevel];
            //This is limiting the text field width even if there is some real estate available to show complete name-VK
            /*$tasks.find(".task-name input").css({
            width: taskWidth - 50
            });*/
            if (transitioning) {
                //me.linksView.setVisible(false);
                if ($tasks.length > 0) {
                    var $firstProperties = $tasks.first().find(".task-properties"),
                    taskPropertiesHorizPadding = ($firstProperties.outerWidth() - $firstProperties.width());
                    $tasks.find(".task-content-wrapper").each(function (index, elt) {
                        var $wrapper = $(elt);
                        $wrapper.stop().transition({
                            height: taskHeight,
                            width: taskWidth
                        }, 500, 'in-out', me.onElementMoveCompleteDelegate);
                        if (newLevel === ZOOMLEVEL.TASK_ZOOM_FULL) {
                            var taskData = $wrapper.closest(".task").data("model");
                            if (taskData) {
                                $wrapper.find(".subtasks").toggle(taskData.taskType !== "purchasing");
                            }
                        }
                    });
                }
            } else {
                $tasks.find(".task-content-wrapper").css({
                    height: taskHeight,
                    width: taskWidth
                });
                this.syncColumnWidths();
                this.syncRowHeights();
            }
            this.setCondensationClass($tasks, condensationLevelClass);
            this.$view.data("zoom-level", newLevel);
            this.zoomLevel = newLevel;
            this.setExtraZoomOutEnabled(false);
            
            
        },
        setCondensationClass: function ($tasks, condensationLevelClass) {
            $tasks.removeClass(FULLY_CONDENSED_CLASS);
            $tasks.removeClass(NORMAL_CONDENSED_CLASS);
            $tasks.addClass(condensationLevelClass);
        },
        refreshLinks: function () {
            if (this.linksView ) {
                this.linksView.showRefreshLinksNotifier();
                this.drawNewLinksDelegate();
                //this.linksView.triggerRefresh();
            }
        },

        addAutoLink: function ($fromTask, $toTask) {
            var from = this.linksView.resolveLinkEndpointUID($fromTask);
            var to = this.linksView.resolveLinkEndpointUID($toTask);
            var fromModel = this.project._tasksAndMilestonesByUid[from];
            var toModel = this.project._tasksAndMilestonesByUid[to];

            if(!fromModel || !toModel)
                return;
            if (multipleORs(fromModel.taskType, PE_SHORT, CMS_SHORT))
                return;
            if (toModel._predecessors.indexOf(fromModel) != -1)
                return;
            if (fromModel._successors.indexOf(toModel) != -1)
                return;
            this.addLink({
                from: from,
                to: to,
                auto: true
            });
            // Link will be added to LinksView by onLinkAdd, responding to project event
        },

        // adds a link object to the project model; does not notify the link view
        addLink: function (link) {
            this.project.addLink(link);
            this.triggerSave();
        },

        /**
        * Remove a link from the project and update the links view
        */
        removeLink: function ($from, $to) {
            var uid = $to.attr("id");
            if (!uid) {
                if (!$to.data("model"))
                    uid = $to.parent().data("model").uid;
                else
                    uid = $to.data("model").uid;
            }
            this.project.removeLink($from.attr("id"), uid);
            this.linksView.removeConnection($from, $to);
        },
        /**
        * Validate a new potential link that has been drawn by the user.
        * linkCandidate has properties "from" and "to" that are the jQuery task elements for the link.
        * Set linkCandidate.valid to false to prevent the link.
        */
        onBeforeLinkAdd: function (evt, linkCandidate) {
            // TODO rename: linkCandidate properties should be $from and $to to indicate they're jquery elements
            linkCandidate.newlinkIds = [];
            linkCandidate.valid = this.isLinkAllowed(linkCandidate.from, linkCandidate.to, true, linkCandidate.errors, linkCandidate.newlinkIds);
            if (linkCandidate.valid == false) {
                if (linkCandidate.errors.length > 0) {
                    PPI_Notifier.alert(linkCandidate.errors[0], LINK_ERROR);
                }
                // MM: newLinkIds will usually contain just one element since a new link being drawn can only be redirected to only one other point
                // But since it is a collection, it is being iterated over
                var me = this;
                if(linkCandidate.newlinkIds && linkCandidate.newlinkIds.length > 0 && window.currentViewId != "table"){
                    _.forEach(linkCandidate.newlinkIds, function (newLinkId){
                        var linkWithId = {to : newLinkId, from : me.linksView.resolveLinkEndpointUID(linkCandidate.from)};
                        stl.app.undoStackMgr.pushToUndoStackForLinkAdd(this, stl.app.ProjectDataFromServer, linkWithId);
                    });
                }
            }
            else // MM: the link we are trying to draw is valid so push the event to undo stack
            {
                var linkWithId = {to : this.linksView.resolveLinkEndpointUID(linkCandidate.to), from : this.linksView.resolveLinkEndpointUID(linkCandidate.from)};
                stl.app.undoStackMgr.pushToUndoStackForLinkAdd(this, stl.app.ProjectDataFromServer, linkWithId); 
            }
        },
        /* This function returns the number of links that can be drawn in a phase across rows depending on the 
        config to support model flexibility*/
        numberOfInPhaseLinksAllowed: function (phaseId) {
            var precentDependencyAllowed = parseInt(stl.app.commonSettingValue('TECHNICAL_DEPENDENCIES_PERCENT')); //get it from config
            var allTasksInPhase = this.project.getAllTasksInPhaseBlock(phaseId);
            var total = allTasksInPhase.length;
            var numOfLinks = Math.ceil((precentDependencyAllowed * total) / 100);
            return numOfLinks;
        },
        /* This function updates the number of links that can be added within a phase when some tasks are added/deleted*/
        resetPhaseLinksAllowedWithAddDeleteTask: function (phase) {
            phase.maxFlexAllowed = this.numberOfInPhaseLinksAllowed(phase.uid);
            if (!phase.usedFlexibleLinks)
                phase.usedFlexibleLinks = 0;
        },
        /**
        * Determine whether a link is allowed between the given objects.
        * fixErrors: true to show error messages and dynamically replace invalid links
        *   with valid ones where possible.  Used when the user draws a potential link.
        *   By default, fixErrors is false and the link will be silently validated
        *   with no side effects.
        */
        isLinkAllowed: function ($from, $to, fixErrors, errors, redirectedLinkId) {
            var $fromCell = $from.closest(".phase-column"),
                $toCell = $to.closest(".phase-column"),
                fromTaskID = this.linksView.resolveLinkEndpointUID($from),
                toTaskID = this.linksView.resolveLinkEndpointUID($to),
                startPhase = $fromCell.index() - 1,
                endPhase = $toCell.index() - 1,
                $fromRow = $fromCell.closest(".matrix-view-row"),
                $toRow = $toCell.closest(".matrix-view-row"),
                $fromMilestoneIfAny = this.milestoneElementsById[fromTaskID],
                $toMilestoneIfAny = this.milestoneElementsById[toTaskID],
                $fromCellTasks = $fromCell.find(".task"),
                fromTaskIndex = $fromCellTasks.index($from),
                fromTaskIsLastInCell = $fromCellTasks.length > 0 && (fromTaskIndex === $fromCellTasks.length - 1),
                $toCellTasks = $toCell.find(".task"),
                toTaskIndex = $toCellTasks.index($to),
                toTaskIsFirstInCell = $toCellTasks.length > 0 && toTaskIndex === 0;
            if ($fromMilestoneIfAny)
                var fromModel = $fromMilestoneIfAny.data("model");
            else
                var fromModel = $from.data("model");
            if ($toMilestoneIfAny)
                var toModel = $toMilestoneIfAny.data("model");
            else
                var toModel = $to.data("model");
            if (this.project.isIDCCed) {
                var buffcountInCell = $fromCell.find(".ccfb-task").length;
                if (buffcountInCell > 0 && !fromTaskIsLastInCell) {
                    var allBufferTasksNextToSelTask = true;
                    var taskIdx = fromTaskIndex;
                    while (taskIdx < $fromCellTasks.length) {
                        if (!($fromCellTasks.eq(taskIdx + 1).hasClass('ccfb-task'))) {
                            allBufferTasksNextToSelTask = false;
                            break;
                        }
                        taskIdx = taskIdx + 1;
                    }
                }

            }
            // Default to true
            var valid = true;
            //Links are allowed for Phase Pinch Point; but without violating the below rules
            if ($fromCell.find(".ms").hasClass("PP-milestone")) {
                valid = true;
            }
            if ($from.is($to)) {
                valid = false;
                if (errors)
                    errors.push("A Task cannot be linked to its own.");
                return false
            }
            // Don't allow a link if a path from fromTask to toTask already exists via some other chain of tasks
            if (this.project.isRedundantLinkPresent(toTaskID, fromTaskID)) {
                valid = false;
                if (errors)
                    errors.push("Link from " + fromModel.id + " to " + toModel.id + " is invalid. " + REDUNDANT_LINK);
                return false;
            }
            // Don't allow a link if a path from toTask to fromTask already exists via some other chain of tasks, as it will cause a cycle
            if (this.project.isRedundantLinkPresent(fromTaskID, toTaskID)) {
                valid = false;
                if (errors)
                    errors.push("Link from " + fromModel.id + " to " + toModel.id + " is invalid. " + CYCLIC_LINK);
                return false;
            }
            //Link Validations from/To PE
            if (fromModel.taskType === PE_SHORT || toModel.taskType == PE_SHORT) {
                // Incoming Links: Normal,CCCB,CCFB,IMS,PEMS
                if (toModel.taskType == PE_SHORT) {
                    if (fromModel.bufferType == "CMSB" || fromModel.taskType == CMS_SHORT || fromModel.taskType == IPMS_SHORT || fromModel.taskType == "fullkit") {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_PE);
                        return false;
                    }
                }
                //Outgoing Links: None
                if (fromModel.taskType == PE_SHORT) {
                    valid = false;
                    if (errors)
                        errors.push(NO_SUCC_FOR_CMS_PE);
                    return false;
                }
                //Conditions: If there is a PEMS task, any link to PE should be redirected to PEMS. If there is a CCCB task but no PEMS
                //any link to PE should be redirected to CCCB.Links from PEMS and CCCB should be from same cell.
                if (toModel.taskType == PE_SHORT) {
                    /*if (!$fromCell.is($toCell)) {*/
                        if (fromModel.taskType == PEMS_SHORT ){
                            //check if there is any CCCB task, redirect the link to it
                            if ($toCell.find(".cccb-task").length > 0) {
                                this.addAutoLink($from, $toCell.find(".cccb-task"));
                                valid = false;
                                /*errors.push(REDIRECT_LINK_TO_PE_TO_CCCB);*/
                                if (redirectedLinkId)
                                    redirectedLinkId.push($toCell.find(".cccb-task").data("model").uid);
                                return false;
                            }
                            return true;
                        }
                        if(fromModel.bufferType == "CCCB") {
                            /*valid = false;
                            if (errors)
                                errors.push(PEMS_CCCB_LINK_LIMITATION);
                            return false;*/
                            return true;
                        }
                        var $PEMS = $toCell.find(".pems-milestone");
                        if ($PEMS.length > 0) {
                            this.addAutoLink($from, $PEMS.find(".PE-milestone"));
                            valid = false;
                            /*errors.push(REDIRECT_LINK_TO_PE_TO_PEMS);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($PEMS.data("model").uid);
                            return false;
                        } else if ($toCell.find(".cccb-task").length > 0) {
                            this.addAutoLink($from, $toCell.find(".cccb-task"));
                            valid = false;
                            /*errors.push(REDIRECT_LINK_TO_PE_TO_CCCB);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($toCell.find(".cccb-task").data("model").uid);
                            return false;
                        }
                    } else {
                        if (fromModel.taskType == PEMS_SHORT) {
                            if ($toCell.find(".cccb-task").length > 0) {
                                this.addAutoLink($from, $toCell.find(".cccb-task"));
                                valid = false;
                                /*errors.push(REDIRECT_LINK_FROM_PEMS_TO_PE_TO_CCCB);*/
                                if (redirectedLinkId)
                                    redirectedLinkId.push($toCell.find(".cccb-task").data("model").uid);
                                return false;
                            }
                        }
                   /* }*/

                }
            }
            //Link Validations from/To CMS Task
            if (fromModel.taskType === CMS_SHORT || toModel.taskType == CMS_SHORT) {
                // Incoming Links: Normal,CCFB,CMSB,IMS,IPMS
                if (toModel.taskType == CMS_SHORT) {
                    if (fromModel.bufferType == "CCCB" || fromModel.taskType == PE_SHORT || fromModel.taskType == PEMS_SHORT || fromModel.taskType == "fullkit") {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_CMS);
                        return false;
                    }
                }
                //Outgoing Links: None
                if (fromModel.taskType == CMS_SHORT) {
                    valid = false;
                    if (errors)
                        errors.push(NO_SUCC_FOR_CMS_PE);
                    return false;
                }
                //Conditions: If there is a IPMS task, any link to CMS should be redirected to IPMS. If there is a CMSB task but no IPMS
                //any link to CMS should be redirected to CMSB.Links from IPMS and CMSB should be from same cell.
                if (toModel.taskType == CMS_SHORT) {
                    /*if (!$fromCell.is($toCell)) {*/
                        if (fromModel.taskType == IPMS_SHORT){
                            if ($toCell.find(".cmsb-task").length > 0) {
                                this.addAutoLink($from, $toCell.find(".cmsb-task"));
                                valid = false;
                                /*errors.push(REDIRECT_LINK_TO_CMS_TO_CMSB);*/
                                if (redirectedLinkId)
                                    redirectedLinkId.push($toCell.find(".cmsb-task").data("model").uid);
                                return false;
                            }
                            return true;
                        }
                        if(fromModel.bufferType == "CMSB") {
                            /*valid = false;
                            if (errors)
                                errors.push(IPMS_CMSB_LINK_LIMITATION);
                            return false;*/
                            return true;
                        }
                        var $IPMS = $toCell.find(".ipms-milestone");
                        if ($IPMS.length > 0) {
                            this.addAutoLink($from, $IPMS.find(".PE-milestone"));
                            valid = false;
                            /* errors.push(REDIRECT_LINK_TO_CMS_TO_IPMS);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($IPMS.data("model").uid);
                            return false;
                        } else if ($toCell.find(".cmsb-task").length > 0) {
                            this.addAutoLink($from, $toCell.find(".cmsb-task"));
                            valid = false;
                            /*errors.push(REDIRECT_LINK_TO_CMS_TO_CMSB);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($toCell.find(".cmsb-task").data("model").uid);
                            return false;
                        }
                    } else {
                        if (fromModel.taskType == IPMS_SHORT) {
                            if ($toCell.find(".cmsb-task").length > 0) {
                                this.addAutoLink($from, $toCell.find(".cmsb-task"));
                                valid = false;
                                /*errors.push(REDIRECT_LINK_FROM_IPMS_TO_CMS_TO_CMSB);*/
                                if (redirectedLinkId)
                                    redirectedLinkId.push($toCell.find(".cmsb-task").data("model").uid);
                                return false;
                            }
                        }
                    /*}*/

                }
            }
            //Link Validations from/To PEMS Task
            if (fromModel.taskType == PEMS_SHORT || toModel.taskType == PEMS_SHORT) {
                //Incoming:Normal,CCFB,IMS
                if (toModel.taskType == PEMS_SHORT) {
                    if (!(multipleORs(fromModel.taskType, STRING_NORMAL, IMS_SHORT, "NONE") || fromModel.bufferType == "CCFB")) {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_PEMS_IPMS);
                        return false;
                    }
                }
                //Outgoing:CCCB,PE. Outgoing links should be in the same cell
                if (fromModel.taskType == PEMS_SHORT) {
                    if (!(toModel.bufferType == "CCCB" || toModel.taskType == PE_SHORT)) {
                        valid = false;
                        if (errors)
                            errors.push(OUTGOING_LINKS_FROM_PEMS);
                        return false;
                    } else {
                        if (!$fromCell.is($toCell)) {
                            valid = false;
                            if (errors)
                                errors.push(PEMS_CCCB_LINK_LIMITATION);
                            return false;
                        }
                    }
                }
            }
            //Link Validations from/To IPMS Task
            if (fromModel.taskType == IPMS_SHORT || toModel.taskType == IPMS_SHORT) {
                //Incoming:Normal,CCFB,IMS
                if (toModel.taskType == IPMS_SHORT) {
                    if (!(multipleORs(fromModel.taskType, STRING_NORMAL, IMS_SHORT, "NONE") || fromModel.bufferType == "CCFB")) {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_PEMS_IPMS);
                        return false;
                    }
                }
                //Outgoing:CMSB,CMS,IMS. Outgoing links should be in the same cell
                if (fromModel.taskType == IPMS_SHORT) {
                    if (!(toModel.bufferType == "CMSB" || toModel.taskType == CMS_SHORT || toModel.taskType == IMS_SHORT)) {
                        valid = false;
                        if (errors)
                            errors.push(IPMS_CMSB_LINK_LIMITATION);
                        return false;
                    } else {
                        if (!$fromCell.is($toCell)) {
                            valid = false;
                            if (errors)
                                errors.push(IPMS_CMSB_LINK_LIMITATION);
                            return false;
                        }
                    }
                }
            }
            //Link Validations from/To CCCB Task
            if (fromModel.bufferType == "CCCB" || toModel.bufferType == "CCCB") {
                //Incoming:PEMS,Normal,CCFB,IMS. All the invalid cases are handled above except from cmsb,cccb,fk
                if (toModel.bufferType == "CCCB") {
                    if (fromModel.bufferType == "CCCB" || fromModel.bufferType == "CMSB" || fromModel.taskType == "fullkit") {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_CCCB);
                        return false;
                    }
                }
                //Outgoing:PE.
                if (fromModel.bufferType == "CCCB") {
                    if (toModel.taskType != PE_SHORT) {
                        valid = false;
                        if (errors)
                            errors.push(OUTGOING_LINKS_FROM_CCCB);
                        return false;
                    }
                }
                //Condition: If there is a PEMS Task in that cell, link to cccb is redirected to PEMS
                if (toModel.bufferType == "CCCB") {
                    if (!$fromCell.is($toCell)) {
                        var $PEMS = $toCell.find(".pems-milestone");
                        if ($PEMS.length > 0) {
                            this.addAutoLink($from, $PEMS.find(".PE-milestone"));
                            valid = false;
                            /*errors.push(REDIRECT_LINK_TO_CCCB_TO_PEMS);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($PEMS.data("model").uid);
                            return false;
                        }
                    }
                }
            }
            //Link Validations from/To CMSB Task
            if (fromModel.bufferType == "CMSB" || toModel.bufferType == "CMSB") {
                //Incoming:IPMS,Normal,ccfb,ims
                if (toModel.bufferType == "CMSB") {
                    if (fromModel.bufferType == "CMSB" || fromModel.taskType == "fullkit") {
                        valid = false;
                        if (errors)
                            errors.push(INCOMING_LINKS_TO_CMSB);
                        return false;
                    }
                }
                //Outgoing:CMS,IMS
                if (fromModel.bufferType == "CMSB") {
                    if (!(toModel.taskType == CMS_SHORT || toModel.taskType == IMS_SHORT)) {
                        valid = false;
                        if (errors)
                            errors.push(OUTGOING_LINKS_FROM_CMSB);
                        return false;
                    }
                }
                //Condition: If there is a IPMS Task in that cell, link to cmsb is redirected to ipms
                if (toModel.bufferType == "CMSB") {
                    if (!$fromCell.is($toCell)) {
                        var $IPMS = $toCell.find(".ipms-milestone");
                        if ($IPMS .length > 0) {
                            this.addAutoLink($from, $IPMS.find(".PE-milestone"));
                            valid = false;
                            /*errors.push(REDIRECT_LINK_TO_CMSB_TO_IPMS);*/
                            if (redirectedLinkId)
                                redirectedLinkId.push($IPMS.data("model").uid);
                            return false;
                        }
                    }
                }

            }
            //Link Validations from/To CCFB Task
            if (fromModel.bufferType == "CCFB" || toModel.bufferType == "CCFB") {
                //Incoming:Normal,CCFB,IMS,Fullkit
                //Outgoing:Normal,CCFB,CCCB,CMSB,IMS,CMS,PE,PEMS,IPMS,FullKit
                //Avoid circular links which is handled above
            }
            //Link Validations from/To Normal Task
            if (fromModel.taskType == STRING_NORMAL || toModel.taskType == STRING_NORMAL) {
                //Incoming:Normal,CCFB,IMS,FUllkit
                //Outgoing:Normal,CCFB,CCCB,CMSB,CMS,PE,IPMS,PEMS,Fullkit
                //Avoid Circular links which is handled above
            }
            if (fromModel.taskType == "fullkit" || toModel.taskType == "fullkit") {
                //Incoming:Normal,CCFB,IMS,Fullkit
                //Outgoing:Normal,CCFB,IMS,CMSB,CMS,PE,PEMS,IPMS,Fullkit
            }
            /*Model Change - Allow links between normal tasks in a phase, the link can either go up or down. This is a percentage based
            where depending on the config value provided by the backend, calculate the number of in phase links allowed. once thats reached
            no more within phase links need to be allowed*/
            if (!($fromCell.is($toCell)) && !($fromRow.is($toRow)) && ((startPhase < endPhase && !toTaskIsFirstInCell) || startPhase == endPhase)) {
                if (fromModel && toModel) {
                    if (fromModel.taskType == STRING_NORMAL && toModel.taskType == STRING_NORMAL) {
                        var phase = this.project.phases[startPhase + 1];
                        if (!phase.maxFlexAllowed) {
                            phase.maxFlexAllowed = this.numberOfInPhaseLinksAllowed(phase.uid);
                            phase.usedFlexibleLinks = 0;
                        }
                        if (phase.maxFlexAllowed > 0 && phase.usedFlexibleLinks < phase.maxFlexAllowed) {
                            valid = true;
                            phase.usedFlexibleLinks++;
                        } else {
                            PPI_Notifier.alert("Allows only " + phase.maxFlexAllowed + " dependencies." + FLEXIBLE_LINKS_ALLOWANCE_CONFIG, LINK_ERROR);
                            valid = false;
                        }
                    }
                }
            }
            return valid;
        },

        linkHasCycle: function (link, visited, redundantLink) {
            if (visited[link.to]) {
                redundantLink.to = link.to;
                return true;
            }
            visited[link.to] = true;
            for (var i = 0; i < this.project.links.length; i++) {
                var existingLink = this.project.links[i];
                if (existingLink.from === link.to && this.linkHasCycle(existingLink, visited, redundantLink)) {
                    redundantLink.from = existingLink.from;
                    return true;
                }
            }
            return false;
        },

        onLinksViewLinkAdd: function (evt, link) {
            this.addLink({
                from: this.linksView.resolveLinkEndpointUID(link.from), //link.from.data("model").uid,
                to: this.linksView.resolveLinkEndpointUID(link.to)
            });
        },

        

        /**
        * Return the linkable element corresponding to the task or milestone with the given UID
        */
        getTaskOrMilestoneLinkTargetElementByUid: function (taskOrMilestoneUid) {
            var taskView = this.tasksByUid[taskOrMilestoneUid];
            if (taskView && (!taskView.task.isMS)) {
                return taskView.$el;
            }
            var $ms = this.milestoneElementsById[taskOrMilestoneUid];
            if ($ms) {
                return $ms.find(".ms-content-wrap");
            }
            return null;
        },

        /**
        * Handle the removal of a link internally, by the user via the links view
        */
        onLinksViewLinkRemove: function (evt, link) {
            // TODO handle milestones
            var toLinkId = link.to.attr('id');
            var fromLinkId = link.from.attr('id');
            if (link.to.hasClass("PE-milestone") || !toLinkId) {
                if (!(link.to.attr('id'))) {
                    toLinkId = link.to.closest(".milestone").data("model").uid;
                }
            }
            if (link.from.hasClass("PE-milestone") || !fromLinkId) {
                if (!(link.from.attr('id'))) {
                    fromLinkId = link.from.closest(".milestone").data("model").uid;
                }
            }
            this.project.removeLink(fromLinkId, toLinkId);
            this.triggerSave();
        },

        /**
        * Handle removal of the link from another view
        * Sender is the project model
        */
        onLinkRemove: function (evt, link) {
            var $from = this.getTaskOrMilestoneLinkTargetElementByUid(link.from),
                $to = this.getTaskOrMilestoneLinkTargetElementByUid(link.to);
            if ($from.length > 0 && $to.length > 0) {
                this.linksView.removeConnection($from, $to);
            }
            stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            this.refreshLinks();
        },

        /**
        * Handle addition of a link from another view
        * Sender is the project model
        */
        onLinkAdd: function (evt, link) {
            var $from = this.getTaskOrMilestoneLinkTargetElementByUid(link.from),
                $to = this.getTaskOrMilestoneLinkTargetElementByUid(link.to);
            if ($from && $to && $from.length > 0 && $to.length > 0) {
                var fromEltID = $from.data("linkable-element-id") ? $from.data("linkable-element-id") : $from.parent().data("linkable-element-id"),
                toEltID = $to.data("linkable-element-id") ? $to.data("linkable-element-id") : $to.parent().data("linkable-element-id");
                $fromElem = $from.data("linkable-element-id") ? $from :$from.parent();
                $toElem = $to.data("linkable-element-id") ? $to :$to.parent();
                if (!this.linksView.elementsByUniqueIndetifier[link.to]){
                    this.linksView.addLinkIds($toElem);
                    this.linksView.addElements($toElem);
                }
                if (!this.linksView.elementsByUniqueIndetifier[link.from]){
                    this.linksView.addLinkIds($fromElem);
                    this.linksView.addElements($fromElem);
                }
                this.linksView.addConnection($fromElem, $toElem);
                
            }

            stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            this.refreshLinks();
        },

        initializeLinks: function (elements) {

            this.linksView = new stl.view.Links({
                container: this.$view.find(".matrix-view-inner"),
                // linksContainer: $(".matrix-view-inner"),
                elements: elements ? elements : $(), //elements: this.$view.find(".task, .milestone .milestone-icon-wrap"),
                outEndpointYOffset: 16,
                topEdge: this.$view.find(".matrix-view-row.header-row").height(),
                readOnly: this.readOnly,
                visible: $(".toggle-links-button").hasClass("pressed")
            });
            
            $(this.linksView).on("beforelinkadd", this.onBeforeLinkAdd.bind(this));
            $(this.linksView).on("linkadd", this.onLinksViewLinkAdd.bind(this));
            $(this.linksView).on("linkremove", this.onLinksViewLinkRemove.bind(this));
        },

        renderRow: function (row, phases, $insertBefore, level) {
            var $row = this.generateRow(row, phases, level);
            $insertBefore.before($row);
            this.moveNewRowFirstCellIntoFixedColumn($row);
            $row.removeAttr("role");
            return $row;
            this.refreshLinks();
        },

        moveNewRowFirstCellIntoFixedColumn: function ($row) {
            // TODO optimize; this is not particularly efficient
            var index = this.$view.find(".matrix-view-row").index($row),
                $leftCell = $row.find(".tree-column");
            $leftCell.data("row-body", $row);
            $row.data("fixed-cell", $leftCell);
            //$leftCell.css("display", "none");
            if (index === 0) {
                this.$leftColContainer.prepend($leftCell);
            } else {
                this.$leftColContainer.children().eq(index - 1).after($leftCell);
            }
        },

        loadProject: function (model) {
            try {
                console.log('Method called matrix view - loadProject');
                var start = ServerClientDateClass.getTodaysDate();
                var me = this,
                    $parentEl = this.$view.parent();
                this.$view.detach();

                this.$view.data("model", model)
                    .addClass("connections-hidden");
                this.project = model;
                //stl.app.ProjectDataFromServer = this.project;
                $(this.project).on({
                    "resourceschanged": function () {
                        me.invalidateResourceCache();
                    },
                    "linkremove": this.onLinkRemove.bind(this),
                    "linkadd": this.onLinkAdd.bind(this),
                    "milestoneremove": this.onMilestoneRemove.bind(this)
                });

                this.project.createScheduler(stl.app.calendar);

                var singleTaskDisplay = false; // TODO remove, no longer used
                this.$view.find(".matrix-view-row:not(.header-row)").remove();
                this.renderPhaseHeaders(model.phases);

                var $beforeEl = this.$view.find(".matrix-view-end-marker").last();
               
               
                if(stl.app.loadByTemplating && !stl.app.taskTemplater){
                    stl.app.taskTemplater = new stl.view.TaskViewTemplater();
                }


                var numberOfRows = model.rows.length;
                var phases = model.phases;
                //var rowDom = ""; TODO 

                for (var i = 0; i < numberOfRows; i++) {
                    var $row = this.renderRow(model.rows[i], phases, $beforeEl, 0);
                    //rowDom = $row.html() + rowDom ;
                }
                //$beforeEl.before(rowDom);

                this.addPlaceholderRow();
                if (!stl.app.PredecessorMap && !stl.app.SuccessorMap){
                    stl.app.CreatePredSuccMap(this.project);
                }
                
                
                var matrix = this;
                setTimeout(function () {
                    matrix.initializeLinks();
                    matrix.setZoomLevel(1);
                    var elements = $(matrix.getTasksInViewPort());
                    matrix.linksView.clearCollections();
                    delete matrix.linksView;
                    matrix.initializeLinks();
                    matrix.linksView.addLinkIds(matrix.$view.find(".task, .milestone .ms-content-wrap"));
                    matrix.linksView.addElements(elements ? elements : $());
                    matrix.setZoomLevel(1);
                    if (stl.app.PredecessorMap && stl.app.SuccessorMap) {
                        // TODO prune redundant links
                        //var matrix = this;
                        //var model = matrix.$view.data("model");
                        var applicableLinks = [];
                        var tempObjLinks = {};
                        var linkableElem = matrix.linkableElementByUid;
                        _.each(Object.keys(linkableElem), function(uid){
                            var allPredecessorLinks = stl.app.PredecessorMap[uid];
                            var allSuccessorLinks = stl.app.SuccessorMap[uid];
                            if (allPredecessorLinks){
                                _.each(allPredecessorLinks, function(link){
                                    if (!tempObjLinks[link.uid]){
                                        applicableLinks.push(link);
                                        tempObjLinks[link.uid] = link;
                                    }
                                    
                                })
                                //applicableLinks = applicableLinks.concat(allPredecessorLinks);
                            }
                            
                            if (allSuccessorLinks){
                                //applicableLinks = applicableLinks.concat(allSuccessorLinks);
                                _.each(allSuccessorLinks, function(link){
                                    if (!tempObjLinks[link.uid]){
                                        applicableLinks.push(link);
                                        tempObjLinks[link.uid] = link;
                                    }
                                    
                                })
                            }
                            

                        });
                       var linkableElemByUid = matrix.linkableElementByUid
                       _.each(applicableLinks, function(link){
                            var    $fromEl = me.getTaskOrMilestoneLinkTargetElementByUid(link.from),
                                $toEl = me.getTaskOrMilestoneLinkTargetElementByUid(link.to);
                            //if ($fromEl && $toEl) {
                            if (linkableElemByUid[link.to] && linkableElemByUid[link.from]){
                                me.linksView.addConnection($fromEl, $toEl);
                                var fromTask = $fromEl.data("model");
                                var toTask = $toEl.data("model");
                                if (fromTask && toTask) {
                                    if (fromTask.phaseId == toTask.phaseId && fromTask.rowId != toTask.rowId) {
                                        var phase = $.grep(model.phases, function (phase) {
                                            return phase.uid == fromTask.phaseId;
                                        })[0];
                                        if (!phase.maxFlexAllowed) {
                                            phase.maxFlexAllowed = me.numberOfInPhaseLinksAllowed(phase.uid);
                                        }
                                        if (!phase.usedFlexibleLinks)
                                            phase.usedFlexibleLinks = 0;
                                        phase.usedFlexibleLinks++;
                                    }
                                }
                            }
                       });
                    }
                    hideLoadingIcon();
                    me.$view.removeClass("connections-hidden");
                    me.highlightLinksIfRequired();
                    me.linksView.triggerRefresh();



                }, 50); // FIXME find out how to redraw links as soon as possible
                $parentEl.append(this.$view);
                //me.enableRemoveBuffersOption();
                $(document).trigger("projectload", [this]);


                this.createExtJSTree();

                this.syncColumnWidths();
                this.syncRowHeights();
                $(".matrix-view-viewport").on("scroll", this.drawNewLinksDelegate.bind(this));
                stl.app.isMatrixViewLoaded = true;
            } catch (e) {
                console.log(e);
                onProjectLoadFailed();

            }

        },

        checkIfElementInViewingArea: function(bounds){
            var win = $(window);
            var viewport = {
                top : win.scrollTop() + 80,
                left : win.scrollLeft() + 180
            };
            viewport.right = win.width();
            viewport.bottom = win.height();
            var isVisible = false;
            if (((bounds.left > viewport.left && bounds.left < viewport.right) || (bounds.right > viewport.left && bounds.right < viewport.right))&&(( bounds.top > viewport.top && bounds.top < viewport.bottom) || (bounds.bottom > viewport.top && bounds.bottom < viewport.bottom))) {
            //if (((bounds.left > viewport.left && bounds.right < viewport.right) && (bounds.top > viewport.top && bounds.bottom < viewport.bottom))) {  
                isVisible = true;
            }

            return isVisible;


        },

        getTasksInViewPort: function(){

            //TODO: remove Date.now for production
            var start = Date.now();
            var allTaskElements;
            var applicableTaskElements = [];
            var tempObj ={};
            if (this.selectedTask){
                var selectedTaskModel = this.selectedTask.data("model");
                tempObj[selectedTaskModel.uid] = selectedTaskModel;
            }
            var matrix = this;
            var filteredTaskElements;
            
            allTaskElements = this.getAllTaskOrMilestoneElements();
            stl.app.linkableElementOffsetAndWidthById = {};
            filteredTaskElements = _.filter(allTaskElements, function(elem){
                var bounds = elem.getBoundingClientRect();
                var isVisible = false;
                if (matrix.checkIfElementInViewingArea(bounds)){
                    var taskData = matrix.getTaskDataModel(elem);
                    if (!tempObj[taskData.uid]){
                        tempObj[taskData.uid] = taskData;
                        stl.app.linkableElementOffsetAndWidthById[taskData.uid] = {"offset": $(elem).offset(), "width": $(elem).width(), "height": $(elem).height()};
                        isVisible = true;
                    }
                    
                }
                
                return isVisible;
            });

            applicableTaskElements = applicableTaskElements.concat(filteredTaskElements);
            var matrix = this;
            
            
            
            _.each(filteredTaskElements, function(elem){
                
                var immediateTasks = matrix.getImmediatePredecessorAndSuccessorOfTask(elem, tempObj);
                applicableTaskElements = applicableTaskElements.concat(immediateTasks);
            });

            if (this.selectedTask){
                
                delete tempObj[selectedTaskModel.uid];
            }

            this.linkableElementByUid = tempObj;

            tempObj = null;
            return $(applicableTaskElements);
        },

        getTaskDataModel: function(task){
            var taskData;
            var taskModel = $(task).data("model");
            if (taskModel){
                taskData = taskModel;
            } else {
                taskData = $(task).parent().data("model");
            }
            return taskData;
        },

        getImmediatePredecessorAndSuccessorOfTask: function(task, addedElementListObj){
            var taskData = this.getTaskDataModel(task); 
            var uids = [];
            var tasks = [];
            var matrix = this;
            _.each(taskData._predecessors, function(item){
                if (!addedElementListObj[item.uid]){
                    addedElementListObj[item.uid] = item;
                    uids.push(item.uid);
                }
                
            });
            _.each(taskData._successors, function(item){
                if (!addedElementListObj[item.uid]){
                    addedElementListObj[item.uid] = item;
                    uids.push(item.uid);
                }
            });

            _.each(uids, function(uid){
                
                var elem = matrix.getTaskOrMilestoneLinkTargetElementByUid(uid);
                
                if (elem){
                    tasks.push($(elem)[0]);
                    stl.app.linkableElementOffsetAndWidthById[uid] = {"offset": $(elem).offset(), "width": $(elem).width(), "height": $(elem).height()};
                }
            });

            return tasks;
        },

        drawNewLinksDelegate: function(){
            $(".tool-popup").hide();
            if (this.drawNewLinksTimeout) {
                clearTimeout(this.drawNewLinksTimeout);
            }
            if (!this.drawNewLinksDelegateFunc) {
                this.drawNewLinksDelegateFunc = this.drawNewLinks.bind(this);
            }
            this.drawNewLinksTimeout = setTimeout(this.drawNewLinksDelegateFunc, 100);

        },
        getLinkableElementUids: function(){

        },

        drawNewLinks: function(){
            
            if(!this.tasksByUid) return;
            var newScrollTop = $(".matrix-view-viewport").scrollTop();
            var newScrollLeft = $(".matrix-view-viewport").scrollLeft();
            this.scrollLeft = this.scrollLeft ? this.scrollLeft : newScrollLeft;
            this.scrollTop = this.scrollTop ? this.scrollTop : newScrollTop;
            var scrollLength = (this.scrollTop - newScrollTop) != 0 ? this.scrollTop - newScrollTop : this.scrollLeft - newScrollLeft;
            var scrollDirection;
            if ((this.scrollTop - newScrollTop) != 0){
                scrollDirection = "vertical";
                if ((this.scrollTop - newScrollTop) > 0){

                } else {

                }
            } else if ((this.scrollLeft - newScrollLeft) != 0) {
                scrollDirection = "horizontal";
                if ((this.scrollLeft - newScrollLeft) > 0){

                } else {

                }
            }
            this.scrollTop = newScrollTop;
            this.scrollLeft = newScrollLeft;
            //this.updateElementPositionMap(scrollLength, scrollDirection);
            var elements = $(this.getTasksInViewPort());

            if(elements.length > 0){
                if (this.linksView.draggingEndpoint) {
                    this.linksView.addLinkIds(elements);
                    this.linksView.addElements(elements);
                    return;
                }
                
                $(".link-endpoint").remove();
                if (this.linksView){
                    this.linksView.clearCollections();
                    delete this.linksView;
                }
                this.initializeLinks(elements);
                
                this.linksView.addLinkIds(this.$view.find(".task, .milestone .ms-content-wrap"));
                this.linksView.addElements(elements ? elements : $());
                var me = this;
                var model = this.$view.data("model");
                var applicableLinks = [];
                var tempObjLinks = {};
                var linkableElem = this.linkableElementByUid;
                _.each(Object.keys(linkableElem), function(uid){
                    var allPredecessorLinks = stl.app.PredecessorMap[uid];
                    var allSuccessorLinks = stl.app.SuccessorMap[uid];
                    if (allPredecessorLinks){
                        _.each(allPredecessorLinks, function(link){
                            if (!tempObjLinks[link.uid]){
                                applicableLinks.push(link);
                                tempObjLinks[link.uid] = link;
                            }
                            
                        })
                        //applicableLinks = applicableLinks.concat(allPredecessorLinks);
                    }
                    
                    if (allSuccessorLinks){
                        //applicableLinks = applicableLinks.concat(allSuccessorLinks);
                        _.each(allSuccessorLinks, function(link){
                            if (!tempObjLinks[link.uid]){
                                applicableLinks.push(link);
                                tempObjLinks[link.uid] = link;
                            }
                            
                        })
                    }
                    

                });
                var linkableElemByUid = this.linkableElementByUid;
                _.each(applicableLinks, function(link){
                    var    $fromEl = me.getTaskOrMilestoneLinkTargetElementByUid(link.from),
                            $toEl = me.getTaskOrMilestoneLinkTargetElementByUid(link.to);
                        if (stl.app.linkableElementOffsetAndWidthById[link.to] && stl.app.linkableElementOffsetAndWidthById[link.from]) {
                            me.linksView.addConnection($fromEl, $toEl);
                            var fromTask = $fromEl.data("model") ? $fromEl.data("model") : $fromEl.parent().data("model");
                            var toTask = $toEl.data("model") ? $toEl.data("model") : $toEl.parent().data("model");
                            if (fromTask && toTask) {
                                if (fromTask.phaseId == toTask.phaseId && fromTask.rowId != toTask.rowId) {
                                    var phase = $.grep(model.phases, function (phase) {
                                        return phase.uid == fromTask.phaseId;
                                    })[0];
                                    if (!phase.maxFlexAllowed) {
                                        phase.maxFlexAllowed = me.numberOfInPhaseLinksAllowed(phase.uid);
                                    }
                                    if (!phase.usedFlexibleLinks)
                                        phase.usedFlexibleLinks = 0;
                                    //phase.usedFlexibleLinks++;
                                }
                            }
                        }
                })
            }
            if (this.zoomLevel === ZOOMLEVEL.CONDENSED) {
                this.linksView.setOutEndpointOffsets(CONDENSED_TASK_OUT_ENDPOINT_OFFSETS);
            } else {
                this.linksView.setOutEndpointOffsets(TASK_OUT_ENDPOINT_OFFSETS);
            }

            this.highlightLinksIfRequired();
            this.linksView.triggerRefresh();
            //this.linksView.setVisible(true);
        },
        highlightLinksIfRequired: function(){
            var selection = stl.app.getCurrentHighLightOption();
            if (selection == CC_TASKS){
                this.onHighlightCCTasks();
            }
        },

        getApplicableLinks: function(elements){
            var allLinks = this.$view.data("model").links;
            var applicableLinks = _.filter(allLinks, function(item){
                if (elements[parseInt(item.to)] && elements[parseInt(item.from)]){
                    return true;
                } else {
                    return false;
                }

            });
            return applicableLinks;
        },

        doUIChangesafterIDCC: function () {
            //FIXME - There should be a good way to recognize if IDCC was run after loading the project
            var isRenderingAfterIDCC = !($("#ccSummary").hasClass("disabled") ? true : false);

            if (this.project.isIDCCed && isRenderingAfterIDCC) {

                $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + NONE);

                if (stl.app.isHighlightRequired) {
                    //Highlight requires nodes to be expanded to show all highlighted task
                    $(document).trigger('expandAllScopeNodes');

                    //After IDCC we need to highlight CC tasks and switch to timeline view
                    $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + CC_TASKS);
                    $(document).trigger('highlightcctasks');
                }

            }
        },

        doUIChangesafterReDoCCFB: function () {
            //FIXME - There should be a good way to recognize if ReDoCCFB was run after loading the project
            var isRenderingAfterReDoCCFB = !($("#bufferSummary").hasClass("disabled") ? true : false);

            if (isRenderingAfterReDoCCFB) {

                $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + NONE);
                //After ReDoCCFB switch to timeline view 

                if (stl.app.isHighlightRequired) {
                    //Highlight requires nodes to be expanded to show all highlighted task
                    $(document).trigger('expandAllScopeNodes');

                    //After ReDoCCFB highlight pen chain
                    $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + PEN_CHAIN);
                    $(document).trigger('highlightPenChain');
                }
            }
        },
        showCCSummaryDialog: function (projectName) {
            var isRenderingAfterIDCC = !($("#ccSummary").hasClass("disabled") ? true : false);
            var isRenderingAfterRedoCC = !($("#bufferSummary").hasClass("disabled") ? true : false);
            if (isRenderingAfterIDCC || isRenderingAfterRedoCC) {
                toggleDockingGrids('CCSummarygrid', 'milestoneSheet', true);
            }
        },
        showResourceSheet: function () { },
        DestroyMilestoneDialog: function (projectName) {
            Ext.getCmp('msGrid').store.clearData();
            toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);

        },

        enableRemoveBuffersOption: function () {
            if (this.project.isBufferTasksExist && !this.readOnly) {
                $("#undoCCAB").removeClass("disabled");
                $("#undoCCAB").removeAttr("disabled");
            }
        },

        // handle first-time rendering of phase header cells only
        // todo eliminate redundancy between this and insertPhaseColumnUI, 
        // which only works after table is rendered
        renderPhaseHeaders: function (phases) {
            this.$phaseHeaderTemplate = this.$view.find(".matrix-view-row.header-row .phase-column").last().clone(true);
            var $headerRow = this.$view.find(".matrix-view-row.header-row");
            // delete all but last
            this.$view.find(".matrix-view-row.header-row .phase-column").remove();
            for (var i = 0; i < phases.length; i++) {
                var $phaseHeaderCell = this.$phaseHeaderTemplate.clone(true);
                this.addPhaseHeaderMenuListeners($phaseHeaderCell);
                $headerRow.append($phaseHeaderCell);
                var $phaseNameText = $phaseHeaderCell.find(".phase-name");
                this.makeEditable($phaseNameText);
                $phaseNameText.on("sl.edit", this.onElementMoveCompleteDelegate); // refresh links because phase name can change width of column
                this.bindPhaseColumn($phaseHeaderCell, phases[i]);
                //$lastHeaderCell = $phaseHeaderCell;
            }
        },

        /**
        * Connect a rendered column with its phase model, and update any
        * elements that depend on the type of phase
        */
        bindPhaseColumn: function ($header, phaseModel) {
            var me = this,
                colIndex = $header.index();
            if (phaseModel.name) {
                if (phaseModel.type == "normal") {
                    $header.find(".phase-name").text(phaseModel.name);
                }
            } else
                $header.find(".phase-name").text('');
            $header.data("model", phaseModel);
            $header.addClass("phase-type-" + phaseModel.type);
            $header.find(".tool-popup .tool-item").removeClass("disabled");
            $header.find(".tool-popup .tool-hidden-for-" + (phaseModel.type || "normalphase")).addClass("disabled");
            var $cells = this.$view.find(".matrix-view-row .phase-column:nth-child(" + (colIndex + 1) + ")");
            $cells.removeClass("phase-type-normal phase-type-fullkit phase-type-milestone")
                .addClass("phase-type-" + (phaseModel.type || "normal"));
            if (phaseModel.type === "milestone") {
                $header.find(".tool-popup .tool-item-delete-phase").text(REMOVE_MS_PHASE);
                $header.find(".tool-popup .tool-item-phase-task-properties").addClass("disabled");
                // Don't allow deletion of "Project End" phase
                /* if (this.project.getProjectEndMilestone().phaseId === phaseModel.uid) {
                $header.find(".tool-popup .tool-item-delete-phase").addClass("disabled");
                }*/
            } else if (phaseModel.type === "fullkit") {
                $header.find(".tool-popup .tool-item-delete-phase").text(REMOVE_FULLKIT);
                $header.find(".tool-popup .tool-item-phase-task-properties").addClass("disabled");
            } else {
                if (phaseModel.hasFullkit) {
                    $header.find(".tool-popup .tool-item-insert-phase-before").addClass("disabled");
                    $header.find(".tool-popup .tool-item-insert-fullkit-before").addClass("disabled");
                }
            }
        },

        onInsertPhaseClick: function (evt) {
            var $phaseCol = $(evt.target).closest(".phase-column");
            var $rowCol = $(evt.target).closest(".matrix-view-row");
            insertPhaseColumn($phaseCol.index() - 1, $rowCol);
        },

        saveRow: function ($row, rowModel) {
            var me = this,
                rowModel = $row.data("model"),
                $phaseHeaders = this.$view.find(".matrix-view-row.header-row .phase-column"),
                $cells = $row.find(".phase-column"),
                tasksByPhaseId = {};

            $cells.each(function (index, cell) {
                var $cell = $(cell);
                if ($cell.hasClass("has-task")) {
                    var phaseId = me.project.phases[index].uid;
                    var tasksInThisCell = $cell.find(".task, .milestone");
                    // task model should already be up-to-date
                    var order = 0;
                    tasksByPhaseId[phaseId] = tasksInThisCell.map(function (index, elt) {
                        var taskModel = $(elt).data("model");
                        //SS:CON-2001
                        //AWAT: Placement of MS , IPMS/PEMS, buffer task after first IDCC is wrong.
                        //Need to bump the order to create space fo PEMS and CCCB or IPMS and CMSB
                        if (me.checkPrevTaskIsCMSorPE(index, tasksInThisCell))
                            order = order + 3;
                        taskModel.order = order++;
                        return taskModel;
                    }).get();
                }
            });

            if (this.project.isProjectComplex()) {
                tasksByPhaseId = this.retainSummaryTaskInRowModel(rowModel, tasksByPhaseId);
            }

            if (rowModel) {
                rowModel.tasks = tasksByPhaseId;
            }
            this.triggerSave();
            return rowModel;
        },
        checkPrevTaskIsCMSorPE: function (index, tasksInTheCell) {
            var orderBumpRequired = false;
            if (index > 0) {
                var taskType = $(tasksInTheCell[index - 1]).data('model').taskType;
                if (taskType === PE_SHORT || taskType === CMS_SHORT)
                    orderBumpRequired = true;
            }
            return orderBumpRequired;
        },

        onRowChange: function (evt, sender, rowModel, phaseModel) {
            if (sender === this)
                return;
            var $row = this.rowsById[rowModel.uid];
            $row.data("model", rowModel);
            $row.find(".scope-item-label").text(rowModel.name);
            this.saveRow($row, rowModel);
            this.saveProject();
        },

        //Event fired on deleting a row-VK
        onRowRemove: function (evt, sender, $row) {
            if (sender === this) return;
            if (sender.xtype != "ptableview") {
                if ($row.data("model")) {
                    var rowModel = $row.data("model");
                }
            } else {
                var rowModel = this.rowsById[$row.data.Id].data("model");
                $row = this.rowsById[$row.data.Id];
            }
            delete rowModel.tasks;
            delete this.rowsById[rowModel.uid];
            delete rowModel;
            // Remove the cell in the fixed leftmost column for this row
            $row.data("fixed-cell").remove();
            $row.remove();
            this.refreshLinks();
            this.saveProject();


        },

        callDeleteRow: function (rowModel) {
            this.deleteRow(rowModel);
            $(document).trigger("rowremove", [
                    this,
                    rowModel
                ]);

        },

        deleteRow: function (rowModel) {
            var rows = this.project.rows;
            var $row = rowModel.data.data.$el;

            var rowUid = rowModel.data.data.uid;
            //Remove any milestones from project
            for (var i = this.project._milestones.length - 1; i >= 0; i--) {
                var ms = this.project._milestones[i];
                if (ms.rowId === rowUid) {
                    this.deleteMilestone(ms.uid);
                }
            }
            // Remove tasks
            Object.keys(this.tasksByUid).forEach(function (taskUid) {
                var taskView = this.tasksByUid[taskUid];
                if (taskView.task.rowId === rowUid) {
                    this.deleteTask(taskView.$el);
                }
            } .bind(this));

            // Remove the row model
            var index = rows.map(function (e) {
                return e.uid;
            }).indexOf(rowUid);
            var removed = rows.splice(index, 1);
            delete this.rowsById[rowUid];
            //delete rowModel;
            //rowModel.remove();
            $($row).remove();
            this.refreshLinks();
            this.saveProject();
            this.syncRowHeights();
        },

        onRowAdd: function (evt, sender, rowModel, phases, insertType, selectedNode) {
            if (sender === this) return;
            var me = this;
            var $lastRow = this.$view.find(".matrix-view-row").last(),
                matrixViewEl = this.$view[0],
                projectCount = $(matrixViewEl).data("model").rows.length,
                name = "new project" + (projectCount > 0 ? (" " + String(projectCount + 1)) : ""),
                rowModel = this.project.createRow(null, name);
            if (sender.xtype == "ptableview" && rowModel) {
                rowModel.id = rowModel.Id;
            }

            var $newRow = me.generateRow(rowModel, this.project.phases);
            $lastRow.after($newRow);
            $newRow.addClass("level-0");
            $newRow.find(".tree-column .scope-item-label").text(rowModel.name);
            $newRow.addClass("project-row");
            this.moveNewRowFirstCellIntoFixedColumn($row);
            me.saveRow($newRow);
            me.saveProject();
            matrixViewEl.scrolltop = matrixViewEl.scrollheight;
            me.refreshLinks();
        },
        onScopeNameChange: function (e, sender, row_model, oldvalue, newvalue) {
            if(sender === this) return;
            var me = this;
            var mvNode = Ext.getCmp("scopeItemTree").getRootNode().findChild('rowUid', row_model.uid, true);
            mvNode.set("text", newvalue);
            this.onScopeItemChange(e, mvNode, oldvalue, newvalue);
        },
        onScopeItemChange: function (e, selectedNode, oldvalue, newvalue, isBlankRowToScopeConversion) {
            var me = this;
            var $row = selectedNode.get("data").$el;
            var scopeItemUid = selectedNode.get("data").scopeItemUid;
            var rowUid = selectedNode.get("data").uid;
            var hasChild = selectedNode.childNodes.length == 0 ? false : true;
            var rowModel = $(selectedNode.get("data").$el).data("model");
            var isAlreadyScope = this.project.getSummaryTaskFromRow(rowModel);
            var me = this,
                lastVal = oldvalue ? oldvalue : e.originalValue,
                newVal = newvalue ? newvalue : e.value;
            if (newVal !== lastVal || isBlankRowToScopeConversion) {
                //var $thisfixedCell = $(evt.target).closest(".tree-column"),
                var oldScopeDeletable = me.checkIfScopeDeletableFromModel(scopeItemUid),
                    scopeItemVal = me.project.getScopeItemByUid(scopeItemUid),
                    isMoreRowsWithScopeUidPresent = me.isRowWithSameScopePresent(scopeItemUid, rowUid);
                var isScopeRenamed = false,
                isScopeCreated = false,
                isScopeDeleted = false;
                if (isBlankRowToScopeConversion) {
                    scopeItemNewVal = me.project.createScope(newVal);
                    isScopeCreated = true;
                } else {

                    if ((newVal.trim() == EMPTY_STRING) && oldScopeDeletable && !hasChild) {
                        me.project.deleteScopeItemByUid(scopeItemUid);
                        isScopeDeleted = true;
                    }
                    else if ((newVal.trim() != EMPTY_STRING) && lastVal.trim() == EMPTY_STRING && !isAlreadyScope) {
                        scopeItemNewVal = me.project.createScope(newVal);
                        isScopeCreated = true;
                    }
                    else {
                        scopeItemNewVal = me.project.renameScopeItem(scopeItemUid, newVal);
                        isScopeRenamed = true;
                    }
                }
                var $rowBody = selectedNode.get("data").$el, //$(element).data("row-body"),
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");

                if (isScopeDeleted) {
                    var parentScopeObj=null;
                    if (!this.project.isProjectComplex()) {
                        rowModel.scopeItemUid = this.getScopeUidOfSeletedNodeForSimpleProject(selectedNode);
                        rowModel.name = "";
                        treeRowModel.scopeItemUid = rowModel.scopeItemUid;
                        treeRowModel.name = "";
                        this.setScopeItemUidOfAllRows(selectedNode);
                        parentScopeObj = me.project.getProjectRootScope();
                    } else {
                        rowModel.scopeItemUid = selectedNode.parentNode.get("data").scopeItemUid;
                        rowModel.name = "";
                        treeRowModel.scopeItemUid = selectedNode.parentNode.get("data").scopeItemUid;
                        treeRowModel.name = "";
                        parentScopeObj =  me.project.getScopeItemByUid(rowModel.scopeItemUid);
                    }

                } else if (isScopeCreated) {
                    rowModel.scopeItemUid = scopeItemNewVal.uid;
                    rowModel.name = scopeItemNewVal.name;
                    treeRowModel.scopeItemUid = scopeItemNewVal.uid;
                    treeRowModel.name = scopeItemNewVal.name;

                    if (!this.project.isProjectComplex()) {
                        this.setScopeItemUidOfAllRows(selectedNode);
                    }
                } else if (isScopeRenamed) {
                    rowModel.scopeItemUid = scopeItemNewVal.uid;
                    rowModel.name = scopeItemNewVal.name;
                    treeRowModel.scopeItemUid = scopeItemNewVal.uid;
                    treeRowModel.name = scopeItemNewVal.name;
                    if (this.project.isProjectComplex()) {
                        this.updateNameOfSummaryTask(rowModel, scopeItemNewVal.name);
                    }
                }

                if (me.project.isProjectComplex()) {
                    if (isScopeCreated) {
                        rowModel = me.addSummaryTaskToRow(rowModel, scopeItemNewVal, $rowBody, selectedNode);
                    }
                    if (isScopeDeleted) {
                        rowModel = me.deleteSummaryTaskFromRow(rowModel, selectedNode);
                    }
                }

                $rowBody.attr("scopeitemuid", rowModel.scopeItemUid);
                $rowBody.attr("rowUid", rowModel.uid);
                $rowBody.data("model", rowModel);
                if (window.currentViewId != "table") {
                    $(document).trigger("scopenamechange", [
                        me,
                        rowModel,
                        parentScopeObj?parentScopeObj:scopeItemNewVal
                    ]);
                }

                //});
                if (isScopeDeleted)
                    me.project.createPhaseScopeAndTaskCountMap();

                if (newVal == "")
                //$thisfixedCell.removeClass("has-scopename");
                    me.saveProject();
            }
        },

        updateNameOfSummaryTask: function (row, name) {            
            var summaryTask = this.project.getSummaryTaskFromRow(row);            
            if(summaryTask)
                summaryTask.name = name;     
        },

        setScopeItemUidOfAllRows: function (Node) {
            var allRows = this.getAllRowsOfScope(Node);
            var newScopeItemUid = Node.get("data").scopeItemUid;
            var me = this;
            var scopeItemVal = this.project.getScopeItemByUid(newScopeItemUid);
            _.each(allRows, function (rowNode, idx) {
                var $rowBody = rowNode.get("data").$el,
                    treeRowModel = rowNode.get("data"),
                    rowModel = $rowBody.data("model");

                rowModel.scopeItemUid = newScopeItemUid;
                treeRowModel.scopeItemUid = newScopeItemUid;

                $rowBody.attr("scopeitemuid", rowModel.scopeItemUid);
                $rowBody.data("model", rowModel)
                if (window.currentViewId != "table") {
                    $(document).trigger("rowchange", [
                        me,
                        rowModel,
                        scopeItemVal
                    ]);
                }


            });

        },

        getAllRowsOfScope: function (Node) {
            var allRowsOfScope = [];
            var parentNode = Node.parentNode;
            for (i = parentNode.indexOf(Node) + 1; i < parentNode.childNodes.length; i++) {
                if (parentNode.childNodes[i].get("text").trim() != "") {
                    break;
                } else {
                    allRowsOfScope.push(parentNode.childNodes[i]);
                }
            }
            return allRowsOfScope;
        },

        getScopeUidOfSeletedNodeForSimpleProject: function (Node, isSelfExcluded) {
            var treeRootNode = Ext.getCmp("scopeItemTree").getRootNode();
            var indexOfNode = Node.parentNode.indexOf(Node);
            if (isSelfExcluded) {
                indexOfNode = indexOfNode - 1;
            }

            for (i = indexOfNode; i >= 0; i--) {
                if (treeRootNode.childNodes[i].get("text").trim() != "") {
                    return treeRootNode.childNodes[i].get("data").scopeItemUid
                }
            }

            return treeRootNode.get("data").scopeItemUid;
        },

        /*
        * Updates the project model and requests a save to the server
        */
        saveProject: function () {
            var $rootRows = this.$view.find(".matrix-view-row:not(.header-row, .row-placeholder)"),
                $phasecols = this.$view.find(".matrix-view-row.header-row .phase-column"),
                model = this.$view.data("model");
            this.savePhases();
            var rowOrder = 0;
            model.rows = $rootRows.toArray().map(function (row) {
                // root models should already have their "children" collections up-to-date
                var rowModel = $(row).data("model");
                rowModel.order = rowOrder++;
                return rowModel;
            });
            this.triggerSave();
        },

        /*
        * Triggers a save to the server after a short idle period
        * saveTriggerEnabled is used to skip setting any more timers till its set to true.
        * Use toggleSaveTrigger(true/false) to enable or disable save triggers
        */
        triggerSave: function () {
            if (this.saveTriggerEnabled == true) {
                if (this.saveTimeout) {
                    clearTimeout(this.saveTimeout);
                }
                if (!this.saveDelegate) {
                    this.saveDelegate = stl.app.save.bind(this, stl.app.ProcessTypeEnum.AUTOSAVE);
                }
                var autoSaveDuration = (parseInt(ConfigData.commonSettingsMap.DURATION_AUTO_SAVE.Value) * DURATION_MILISEC_MULTIPLIER) || AUTOSAVE_DURATION_MILISEC;
                this.saveTimeout = window.setTimeout(this.saveDelegate, autoSaveDuration);
            }
        },

        toggleSaveTrigger: function (enable) {
            if (enable) {
                this.saveTriggerEnabled = true;
            } else {
                this.saveTriggerEnabled = false;
                if (this.saveTimeout) {
                    clearTimeout(this.saveTimeout);
                }
            }
        },


        /**
        * Save the project, immediately
        * TODO this belongs in the application class
        */
        save: function (saveType, callbk) {
            // Note the call to getJSON below is not the same as .toJSON()
            var me = this,
                modelJson = this.project;
            if (modelJson) {
                // localStorage.setItem(localStorageModelKey, modelJson);
                this.saveProjectToServer(saveType, callbk);
            }
        },

        /**
        * Show the checklist popup for a full-kit task or a subtask
        */
        showChecklistPopup: function (checklistItems, title, saveCallback) {
            this.checklistPopupStore = this.checklistPopupStore || Ext.create("ProjectPlanning.store.ChecklistDataStore");
            this.checklistPopupStore.loadData(checklistItems);
            this.checklistPopupWindow = Ext.create('ProjectPlanning.view.checkList.Checklist', {
                title: title,
                store: this.checklistPopupStore
            });
            var grid = Ext.getCmp('checklistGrid');
            // grid.disabled = this.readOnly;
            if (this.readOnly) {
                grid.disable();
            }
            this.checklistPopupWindow.on("save", saveCallback);
            this.checklistPopupWindow.show();
            this.checklistPopupOpen = true;
        },

        onChecklistSave: function (task, taskData, triggerTaskChange, win, eOpts) {
            if (!this.readOnly) {
                var me = this,
                    newItemsByUid = {},
                    checklistItems = task.checklistItems,
                    overAllChecklistStatus = 0; //can be 0-no checklist, 1 -few checklists complete, 2-all checklist complete
                this.checklistPopupStore.each(function (rec, index) {
                    if(!rec.get('dummy')) {
                        var uid = rec.get("uid") || me.project.getNextUID("checklistItem");
                        newItemsByUid[uid] = {
                            uid: uid,
                            name: rec.get("name"),
                            complete: rec.get("complete"),
                            text1: rec.get("text1"),
                            text2: rec.get("text2"),
                            text3: rec.get("text3"),
                            text4: rec.get("text4"),
                            date1: rec.get("date1"),
                            date2: rec.get("date2"),
                            order: index
                        };
                    }
                });
                var oldItemUids = {};
                for (var i = checklistItems.length - 1; i >= 0; i--) {
                    var oldItem = checklistItems[i],
                        newItem = newItemsByUid[oldItem.uid];
                    if (newItem) {
                        // Update
                        oldItem.name = newItem.name;
                        oldItem.complete = newItem.complete;
                        oldItem.text1 = newItem.text1;
                        oldItem.text2 = newItem.text2;
                        oldItem.text3 = newItem.text3;
                        oldItem.text4 = newItem.text4;
                        oldItem.date1 = newItem.date1;
                        oldItem.date2 = newItem.date2;
                        oldItemUids[oldItem.uid] = oldItem;
                        oldItem.order = newItem.order;
                    } else {
                        // Delete
                        checklistItems.splice(i, 1);
                    }
                }
                Object.keys(newItemsByUid).forEach(function (newItemUid) {
                    if (!oldItemUids[newItemUid]) {
                        // Add
                        checklistItems.push(newItemsByUid[newItemUid]);
                    }
                });
                var completedItems = 0;
                var allComplete = true;
                checklistItems = checklistItems.map(function (checklist, index) {
                    overAllChecklistStatus = 1;
                    if (!checklist.complete)
                        allComplete = false;
                    else
                        completedItems++;
                    //checklist.order = index;
                    return checklist;
                });
                task.checklistItems = _.sortBy(checklistItems, function(ck){ return ck.order; });
                if ((overAllChecklistStatus == 1 & allComplete == true))
                    overAllChecklistStatus = 2;
                task.checklistStatus = overAllChecklistStatus;

                if (task.taskType === "fullkit") {
                    task.completedItems = completedItems;
                    this.updateFKStatus(task);
                }

                if (win)
                    win.call(me);
                // MM: This condition was put because for Milestone task, onTaskChange event was giving some error. And so it was disabled for MS task
                // When MS task will have checklist icon then we will need to fix the code as well
                // MM: refresh checklist icon immediately since ontaskchange event returns w/o doing anything across matrix/timeline view
                // using separate collection to lookup task and milestones
                var $task = (this.tasksByUid[task.uid]) ? this.tasksByUid[task.uid].$el : this.milestoneElementsById[task.uid];
                if ($task)		// MM : refresh checklist icon only if task/milestone is found. Not applicable for subtask
                {
                    this.refreshChecklistIcon($task, task);
                }
                $(document).trigger("taskchange", [this, taskData]);
                this.triggerSave();
                this.checklistPopupOpen = false;
            }
        },

        reloadTaskView: function (task) {
            this.tasksByUid[task.uid].$el.find(".task-status select").select2("val", task.status);
            this.tasksByUid[task.uid].load(task);
        },

        updateFKStatus: function (task) {
            var percentCompletion = 0;

            var oldStatus = task.status;

            if (task.checklistItems.length > 0) {
                percentCompletion = Math.round((task.completedItems / task.checklistItems.length) * 100);
            }
            var checklistData = {
                completedItems: task.completedItems,
                percentCompletion: percentCompletion
            };
            stl.app.FKStatusUpdateBasedOnCheckListStatus(task, checklistData); //completedItems should be replaced, task.checkliststatus should serve the purpose
            //var configValue = stl.app.commonSettingValue('77AUTO_UPDATE_FK_PERCENT');
            if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1") {
                task.percentComplete = percentCompletion;
                //update FK status 
                stl.app.FKStatusUpdateBasedOnPercentComplete(task);
            }
            if (oldStatus != task.status) {
                var taskView = this.tasksByUid[task.uid],
                $taskEl = taskView.$el;
                taskView.setTaskStatus(task.status,$taskEl);
                //taskView.setTaskStateBasedOnTaskStatus(task);
                //taskView.enableOrDisableExpectedFinishDate($taskEl);
                //taskView.enableOrDisablePullInDuration($taskEl);
                //taskView.refreshStatusIndicator();
            }

        },

        showChecklistPopupForSubtask: function ($subtask) {
            var subtask = $subtask.data("model"),
                title = CHECKLIST_TITLE_SUBTASK + subtask.name;
            if (!subtask.checklistItems) {
                subtask.checklistItems = [];
            }
            this.showChecklistPopup(subtask.checklistItems, title, this.onChecklistSave.bind(this, subtask, $subtask.closest(".task").data("model"), true, function () {
                $subtask.find(".subtask-checklist-icon").removeClass("none incomplete complete")
                    .addClass(this.project.getChecklistStatus(subtask.checklistStatus));
                $subtask.data("model").checklistStatus = subtask.checklistStatus;
            }));
        },

        showChecklistPopupForFullKitTask: function ($fullkitTask) {
            var fullkitTask = $fullkitTask.data("model"),
                title = CHECKLIST_TITLE + fullkitTask.name;
            if (!fullkitTask.checklistItems) {
                fullkitTask.checklistItems = [];
            }
            this.showChecklistPopup(fullkitTask.checklistItems, title, this.onChecklistSave.bind(this, fullkitTask, fullkitTask, true));
        },
        showChecklistPopupForTask: function ($task) {
            var task = $task.data("model"), title;
            if (!task.checklistItems) {
                task.checklistItems = [];
            }
            if (task.taskType === FULL_KIT) {
                title = FULLKIT_CHECKLIST_TITLE + task.name;
            } else {
                title = CHECKLIST_TITLE + task.name;
            }
            this.showChecklistPopup(task.checklistItems, title, this.onChecklistSave.bind(this, task, task, true, function () {
                $task.find(".task-checklist-icon").removeClass(" none incomplete complete")
                    .addClass(this.project.getChecklistStatus(task.checklistStatus));
                $task.data("model").checklistStatus = task.checklistStatus;
            }));
        },
        showChecklistPopupForMilestone: function (task) {
            var title = CHECKLIST_TITLE + task.name;
            if (!task.checklistItems) {
                task.checklistItems = [];
            }
            this.showChecklistPopup(task.checklistItems, title, this.onChecklistSave.bind(this, task, task, false));
        },
        hideChecklistPopup: function () {
            if (!this.checklistPopupWindow) return;
            this.checklistPopupWindow.close();
            this.checklistPopupOpen = false;
        },

        /**
        * Initializes the menu item handlers for a popup menu, or all menus in the 
        * document if $root is not specified
        */
        addPopupMenuHandlers: function ($root) {
            if (!$root) {
                $root = $("body");
            }
            var me = this;
            $root.find(".tool-item").off("click").on("click", function (evt) {
                var $toolitem = $(evt.target).closest(".tool-item"),
                    $phaseCol = $toolitem.closest(".tool-popup").data("phase-column"),
                    cmd = $toolitem.data("cmd"),
                    keepPopupOpen = false;
                if ($toolitem.hasClass("disabled")) {
                    return;
                };
                switch (cmd) {
                    case "insert-phase-before":
                        me.insertPhaseColumn($phaseCol.index());
                        me.syncColumnWidths();
                        break;
                    case "insert-phase-after":
                        me.insertPhaseColumn($phaseCol.index() + 1);
                        me.syncColumnWidths();
                        break;
                    case "insert-milestone-after":
                        var newPhaseModel = me.insertPhaseColumn($phaseCol.index() + 1, {
                            type: "milestone",
                            name: $phaseCol.data('model').name
                        });
                        var $firstRow = me.$view.find(".matrix-view-row:first"),
                            $cell = $firstRow.find(".phase-column:nth-child(" + ($phaseCol.index() + 2) + ")"),
                            phaseId = newPhaseModel.uid;
                        //SS:TO Do -Do we need to add milestone after adding phase
                        //me.insertMilestone($cell, newPhaseModel);
                        me.syncColumnWidths();
                        break;
                    case "delete-phase":
                        var phases = me.project.phases,
                            index = $phaseCol.index(),
                            phaseName = phases[index].name,
                            phaseData = phases[index],
                            nextPhaseHeader = $phaseCol.parent().children().eq(index + 1),
                            taskCount = me.$view.find(".matrix-view-row:not(.header-row) .phase-column:nth-child(" + (index + 1) + ") .task").length;
                        var text = DEFAULT_PHASE_NAME.toLowerCase();
                        if (phaseData.type === 'milestone')
                            text = "milestone phase for ";
                        var msg = "Are you sure you want to remove the " + text + " \"" + phaseName + (taskCount > 0 ?
                            ("\" with " + taskCount + " task" + (taskCount === 1 ? "" : "s") + "?") : "?\"");
                        msg += MESSAGE_ACTION_CANNOT_UNDONE;
                        if (me.project.phases.length == 1) {
                            msg = msg + ". Since this is the last phase you are deleting, a dummy phase will be added to the network.";
                        }
                        PPI_Notifier.confirm(msg, DELETE_PHASE, function () {
                            me.deletePhase(index);
                            if (phaseData.type == "fullkit") {
                                me.bindPhaseColumn(nextPhaseHeader, phases[index]);
                            }
                            me.refreshLinks();
                        }, function () { });
                        break;

                    case "phase-level-task-properties":
                    case "phase-level-task-properties":
                        var phases = me.project.phases,
                            index = $phaseCol.index(),
                            phaseId = phases[index].id,
                            matrixView = me.$view;
                        var tasksOfSelectedPhase = _.toArray(matrixView.find(".task.has-phase-" + stringToHex(phaseId)));
                        var milestonesInPhase = ".milestone.has-phase-" + stringToHex(phaseId);
                        var milestonesOfSelectedPhase = _.toArray(matrixView.find(milestonesInPhase));
                        var tasksOrMilestonesOfSelectedPhase = tasksOfSelectedPhase.concat(milestonesOfSelectedPhase);

                        var similarPropertiesObject = new Object();

                        similarPropertiesObject.remainingDuration = "NOT_SAME";
                        similarPropertiesObject.status = "NOT_SAME";
                        similarPropertiesObject.manager = "NOT_SAME";
                        similarPropertiesObject.participants = "NOT_SAME";
                        similarPropertiesObject.taskType = "NOT_SAME";
                        similarPropertiesObject.resources = "NOT_SAME";
                        //similarPropertiesObject.startNoEarlierThan = "NOT_SAME";

                        var tempPropertiesArray = new Object();

                        for (var i = 0; i < tasksOrMilestonesOfSelectedPhase.length; i++) {
                            var taskModel = $(tasksOrMilestonesOfSelectedPhase[i]).data("model");

                            if (i == 0) {
                                tempPropertiesArray.remainingDuration = taskModel.remainingDuration;
                                tempPropertiesArray.status = taskModel.status;
                                tempPropertiesArray.manager = taskModel.manager;
                                tempPropertiesArray.participants = taskModel.participants;
                                tempPropertiesArray.taskType = taskModel.taskType;
                                tempPropertiesArray.resources = taskModel.resources;
                                //tempPropertiesArray.startNoEarlierThan = taskModel.startNoEarlierThan;
                            }

                            if (tempPropertiesArray.remainingDuration == "NOT_SAME" && tempPropertiesArray.status == "NOT_SAME" &&
                                tempPropertiesArray.manager == "NOT_SAME" && tempPropertiesArray.participants == "NOT_SAME" &&
                                tempPropertiesArray.taskType == "NOT_SAME" && tempPropertiesArray.resources == "NOT_SAME")// &&
                            //tempPropertiesArray.startNoEarlierThan == "NOT_SAME")
                                break;

                            if (tempPropertiesArray.remainingDuration != taskModel.remainingDuration)
                                tempPropertiesArray.remainingDuration = "NOT_SAME";
                            if (tempPropertiesArray.status != taskModel.status)
                                tempPropertiesArray.status = "NOT_SAME";
                            if (tempPropertiesArray.manager != taskModel.manager)
                                tempPropertiesArray.manager = "NOT_SAME";
                            if (tempPropertiesArray.taskType != taskModel.taskType)
                                tempPropertiesArray.taskType = "NOT_SAME";
                            if (tempPropertiesArray.participants != taskModel.participants)
                                tempPropertiesArray.participants = "NOT_SAME";
                            if (!CompareArrayOfObjects(tempPropertiesArray.resources, taskModel.resources))
                                tempPropertiesArray.resources = "NOT_SAME";
                            //                            if (tempPropertiesArray.startNoEarlierThan != taskModel.startNoEarlierThan)
                            //                                tempPropertiesArray.startNoEarlierThan = "NOT_SAME";
                        }

                        similarPropertiesObject = tempPropertiesArray;

                        var managerStore = Ext.create('Ext.data.Store', {
                            id: 'ManagerStore',
                            fields: ['Name', 'FullName'],
                            data: stl.app.availablePeopleAndTeams
                        });

                        Ext.create('ProjectPlanning.view.TaskProperties', {
                            PhaseId: phaseId,
                            Managerstore: managerStore,
                            PropertiesObject: similarPropertiesObject,
                            Project: me.project
                        }).show();
                        break;
                    case "insert-fullkit-before":
                        var phases = me.project.phases,
                            index = $phaseCol.index(),
                            origPhase = phases[index];
                        var newPhaseModel = me.insertPhaseColumn(index, {
                            name: $phaseCol.data('model').name,
                            type: "fullkit",
                            fullkitForPhaseId: phases[index].id
                        });
                        origPhase.hasFullkit = true;
                        me.bindPhaseColumn($phaseCol, origPhase);
                        me.syncColumnWidths();
                        break;
                    case "delete-task":
                        // TODO remove
                        break;
                    case "delete-row":
                        var $fixedCell = $(evt.target).closest(".tree-column");
                        msg = REMOVE_ROW_CONFIRM_MESSAGE,
                            anyRowHasPE = false,
                            isScope = $fixedCell.hasClass("has-scopename"),
                            isBlankScopeRow = $fixedCell.hasClass("blank-scope-name"),
                            scopeName = $fixedCell.find(".scope-item-label").text(),
                            isScopeDeletable = me.checkIfScopeDeletableFromModel($fixedCell, scopeName);
                        if (isScope) {
                            msg = getStringWithArgs(REMOVE_SCOPE_CONFIRM_MESSAGE, scopeName)
                            PPI_Notifier.confirm(msg, DELETE_SCOPE, function () {
                                $fixedCell.nextUntil('.has-scopename').andSelf().not('.row-placeholder').each(function (index, element) {
                                    var $rowBody = $(element).data("row-body");
                                    if ($rowBody.hasClass("has-PE"))
                                        anyRowHasPE = true;
                                    me.callDeleteRow($rowBody);
                                });
                                if (isScopeDeletable & !anyRowHasPE) {
                                    me.project.deleteScopeItemByName(scopeName);
                                    me.project.createPhaseScopeAndTaskCountMap();
                                }
                            }, null);
                        } else {
                            var $rowBody = $fixedCell.data("row-body"),
                                anyRowHasPE = $rowBody.hasClass("has-PE");
                            PPI_Notifier.confirm(msg, DELETE_ROW, function () {
                                me.callDeleteRow($rowBody);
                            }, null);
                            if (isBlankScopeRow && isScopeDeletable && !anyRowHasPE) {
                                me.project.deleteScopeItemByName(scopeName);
                                me.project.createPhaseScopeAndTaskCountMap();
                            }
                        }
                        me.syncColumnWidths();
                        break;
                    case "insert-row-above":
                        var insertPos = $(evt.target).closest(".tree-column").index();
                        var $parentScope = $(evt.target).closest(".tree-column").prevAll(".has-scopename").first();
                        me.insertBlankRowAtPosition(insertPos, $parentScope);
                        break;
                    case "insert-row-below":
                        var insertPos = $(evt.target).closest(".tree-column").index() + 1;
                        var $parentScope = $(evt.target).closest(".tree-column").hasClass("has-scopename") ? $(evt.target).closest(".tree-column") : $(evt.target).closest(".tree-column").prevAll(".has-scopename").first();
                        me.insertBlankRowAtPosition(insertPos, $parentScope);
                        break;
                    case "toggle-all-resource-highlight":
                        HighlightAllResources($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-resource-highlight":
                        $("div[data-cmd='toggle-all-resource-highlight']").find("input").removeAttr('checked');
                        HighlightResources($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-all-phase-highlight":
                        HighlightAllPhases($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-phase-highlight":
                        $("div[data-cmd='toggle-all-phase-highlight']").find("input").removeAttr('checked');
                        HighlightPhases($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-all-task-manager-highlight":
                        HighlightAllTaskManagers($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-task-manager-highlight":
                        $("div[data-cmd='toggle-all-task-manager-highlight']").find("input").removeAttr('checked');
                        HighlightTaskManagers($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-all-chains-highlight":
                        stl.app.HighlightAllProjectChains($toolitem);
                        keepPopupOpen = true;
                        break;
                    case "toggle-chain-highlight":
                        $("div[data-cmd='toggle-all-chains-highlight']").find("input").removeAttr('checked');
                        stl.app.HighlightProjectChain($toolitem);
                        keepPopupOpen = true;
                        break;

                    case "highlight-immediate-predecessors":
                        clearAllHighlight();
                        var ms = $(evt.target).closest(".tool-popup").data("ms");
                        highlightImmediatePredecessors(ms.uid);
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + IMMEDIATE_PREDECESSORS);
                        break;

                    case "highlight-all-predecessors":
                        clearAllHighlight();
                        var ms = $(evt.target).closest(".tool-popup").data("ms");
                        highlightAllPredecessors(ms.uid);
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + ALL_PREDECESSORS);
                        break;

                    case "highlight-successors":
                        break;

                    case "highlight-constraining-successors":
                        clearAllHighlight();
                        var ms = $(evt.target).closest(".tool-popup").data("ms"),
                            milestoneElement = me.milestoneElementsById[ms.uid];
                        me.highlightConstrainingTasks(milestoneElement);
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + SHOW_CONSTRANING_SUCCESSOR_CHAIN);
                        $(document).trigger("highlightchange");
                        break;

                    case "highlight-longest-predecessor-chain":
                        clearAllHighlight();
                        var ms = $(evt.target).closest(".tool-popup").data("ms");
                        highlightLongestPredecessorChainByUid(ms.uid);// scope of refactor to make sure that this highlights tasks of Matrix view only
                        break;

                    case "delete-fullkitTask":
                        me.onDeleteFullkitTaskClick(evt);
                        break;

                    case "edit-fullkit-checklist":
                        me.showChecklistPopupForFullKitTask($(evt.target).closest(".task"));
                        break;

                    case "highlight-immediate-predecessors-for-fullkit":
                        clearAllHighlight();
                        var fullkitTaskUid = $(evt.target).closest(".task").data("model").uid;
                        var fullKitTaskElement = me.tasksByUid[$(evt.target).closest(".task").data("model").uid].$el;
                        me.linksView.highlightImmediatePredecessors(fullkitTaskUid);
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + IMMEDIATE_PREDECESSORS);
                        break;

                    case "highlight-all-predecessors-for-fullkit":
                        clearAllHighlight();
                        var fullkitTaskUid = $(evt.target).closest(".task").data("model").uid;
                        var fullKitTaskElement = me.tasksByUid[$(evt.target).closest(".task").data("model").uid].$el;
                        me.linksView.highlightAllPredecessors(fullkitTaskUid);
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + ALL_PREDECESSORS);
                        break;

                    case "highlight-longest-predecessor-chain-for-fullkit":
                        clearAllHighlight();

                        var fullkitTaskElement = $(evt.target).closest(".task");
                        var tasksInPredecessorChain = [];

                        tasksInPredecessorChain = me.highlightLongestPredecessorChain(fullkitTaskElement);

                        if (tasksInPredecessorChain.length > 0) {
                            me.highlightChain(tasksInPredecessorChain, false, "constrainingSuccessorTask");
                            $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + SHOW_LONGEST_PREDECESSOR_CHAIN);
                        }
                        break;
                }
                if (keepPopupOpen) {
                    evt.stopPropagation();
                } else {
                    $toolitem.closest(".tool-popup").fadeOut(250);
                }
            });
        },

        openTaskPropertiesDialog : function(phaseId){
            var objTempProperties = new Object();
            var me = this;
            var multipleSelectedTasks = [];
            var keys = Object.keys(me.multipleSelectedTasks);
            for (var i = 0; i < keys.length; i++) {
                var taskModel = me.multipleSelectedTasks[keys[i]];
                multipleSelectedTasks.push(taskModel);
                if (i == 0) {
                    objTempProperties.remainingDuration = taskModel.remainingDuration;
                    objTempProperties.status = taskModel.status;
                    objTempProperties.manager = taskModel.manager;
                    objTempProperties.participants = taskModel.participants;
                    objTempProperties.taskType = taskModel.taskType;
                    objTempProperties.resources = taskModel.resources;
                    //objTempProperties.startNoEarlierThan = taskModel.startNoEarlierThan;
                }

                if (objTempProperties.remainingDuration == NOT_SAME && objTempProperties.status == NOT_SAME &&
                    objTempProperties.manager == NOT_SAME && objTempProperties.participants == NOT_SAME &&
                    objTempProperties.taskType == NOT_SAME && objTempProperties.resources == NOT_SAME)// &&
                //objTempProperties.startNoEarlierThan == NOT_SAME)
                    break;

                if (objTempProperties.remainingDuration != taskModel.remainingDuration)
                    objTempProperties.remainingDuration = NOT_SAME;
                if (objTempProperties.status != taskModel.status)
                    objTempProperties.status = NOT_SAME;
                if (objTempProperties.manager != taskModel.manager)
                    objTempProperties.manager = NOT_SAME;
                if (objTempProperties.taskType != taskModel.taskType)
                    objTempProperties.taskType = NOT_SAME;
                if (objTempProperties.participants != taskModel.participants)
                    objTempProperties.participants = NOT_SAME;
                if (!CompareArrayOfObjects(objTempProperties.resources, taskModel.resources))
                    objTempProperties.resources = NOT_SAME;
                //                            if (objTempProperties.startNoEarlierThan != taskModel.startNoEarlierThan)
                //                                objTempProperties.startNoEarlierThan = "NOT_SAME";
            }

            var managerStore = Ext.create('Ext.data.Store', {
                id: 'ManagerStore',
                fields: ['Name', 'FullName'],
                data: stl.app.availablePeopleAndTeams
            });

            var phaseLevelTaskPropertiesWindow = Ext.create('ProjectPlanning.view.TaskProperties', {
                PhaseId: phaseId,
                Managerstore: managerStore,
                PropertiesObject: objTempProperties,
                multiselectedTasksForSettingProperties: multipleSelectedTasks,
                Project: me.project
            });
            phaseLevelTaskPropertiesWindow.show();
        },

        scrollToSelected: function (presentScrollPosition) {
            this.$viewport.animate({
                scrollTop: presentScrollPosition
            });
        },

        indentRow: function (treeView, selectedNodes) {
            var presentScrollPosition = this.$viewport.scrollTop();
            var alreadyIndented = [];
            var pertview = this;
            var sortedNodesBasedOnOutlineLevel = selectedNodes.sort(function (a, b) {
                return a.get("data").outlineLevel - b.get("data").outlineLevel;
            });
            _.each(sortedNodesBasedOnOutlineLevel, function (selectedNode, idx) {
                if ($.inArray(selectedNode.get("data").uid, alreadyIndented) == -1) {
                    pertview.changeScopeData(treeView, selectedNode, INDENT_ROW, alreadyIndented);
                }
            });
            this.saveProject();
            this.createExtJSTree();
            var scopeitems = this.project.rows;
            var tree = Ext.getCmp("scopeItemTree").getRootNode();

            _.each(sortedNodesBasedOnOutlineLevel, function (selectedNode, idx) {
                var Node = pertview.findChildRecursively(tree, "rowUid", selectedNode.get("data").uid);
                pertview.convertRowToScope(Node, INDENT_ROW);
            });

            _.each(scopeitems, function (scopeItem, index) {
                var Node = pertview.findChildRecursively(tree, "rowUid", scopeItem.uid);
                if (Node.get("text").trim() == "") {
                    pertview.changeScopeItemUid(Node);
                }
            });

            this.selectNodes(sortedNodesBasedOnOutlineLevel);

            this.scrollToSelected(presentScrollPosition);

            $(document).trigger("rowIndentationChanged", [
                    this,
                    scopeitems
                ]);

        },

        outdentRow: function (treeView, selectedNodes) {
            var presentScrollPosition = this.$viewport.scrollTop();
            var alreadyOutdented = [];
            var pertview = this;
            var sortedNodesBasedOnOutlineLevel = selectedNodes.sort(function (a, b) {
                return a.get("data").outlineLevel - b.get("data").outlineLevel;
            });
            _.each(sortedNodesBasedOnOutlineLevel, function (selectedNode, idx) {
                if ($.inArray(selectedNode.get("data").uid, alreadyOutdented) == -1) {
                    pertview.changeScopeData(treeView, selectedNode, OUTDENT_ROW, alreadyOutdented);
                }

            });

            this.saveProject();
            this.createExtJSTree();
            var scopeitems = this.project.rows;
            var tree = Ext.getCmp("scopeItemTree").getRootNode();

            _.each(sortedNodesBasedOnOutlineLevel, function (selectedNode, idx) {
                var Node = pertview.findChildRecursively(tree, "rowUid", selectedNode.get("data").uid);
                pertview.convertRowToScope(Node, OUTDENT_ROW);
            });

            _.each(scopeitems, function (scopeItem, index) {
                var Node = pertview.findChildRecursively(tree, "rowUid", scopeItem.uid);
                if (Node.get("text").trim() == "") {
                    pertview.changeScopeItemUid(Node);
                }
            });

            this.selectNodes(sortedNodesBasedOnOutlineLevel);

            this.scrollToSelected(presentScrollPosition);
            $(document).trigger("rowIndentationChanged", [
                    this,
                    scopeitems
                ]);
        },

        selectNodes: function (selectedNodes) {
            var pertView = this;
            var tree = Ext.getCmp("scopeItemTree");
            var treeRoot = tree.getRootNode();
            _.each(selectedNodes, function (selectedNode, index) {
                var Node = pertView.findChildRecursively(treeRoot, "rowUid", selectedNode.get("data").uid);
                tree.getSelectionModel().select(Node, true);
            });
        },


        convertRowToScope: function (selectedNode, indentation) {
            var parent = selectedNode.parentNode;
            //var hasSiblingsBelow = (parent.childNodes.length - 1) > parent.indexOf(selectedNode) ? true : false;
            var hasChildBelow = selectedNode.childNodes.length > 0 ? true : false;

            if (indentation == 1 && selectedNode.parentNode.get("text").trim() == "") {
                this.changeRowToScope(selectedNode.parentNode);
            } else if (indentation == 2 && hasChildBelow && selectedNode.get("text").trim() == "") {
                this.changeRowToScope(selectedNode);
            }
        },

        changeScopeData: function (treeView, selectedNode, indentation, arrAlreadyChanged) {
            var pertview = this;
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");

            this.changeOutlineLevel(selectedNode, indentation, arrAlreadyChanged);
            //this.convertRowToScope(selectedNode, indentation);
        },


        changeScopeItemUid: function (selectedNode) {
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            var itemIdx = this.getIndexOfItem(selectedNode.get("data").uid);
            treeRowModel.scopeItemUid = this.getScopeItemUidForRow(selectedNode.get("data").outlineLevel, itemIdx);
            rowModel.scopeItemUid = treeRowModel.scopeItemUid;
            $rowBody.attr("scopeitemuid", rowModel.scopeItemUid);
            $rowBody.data("model", rowModel);
            this.saveRow($rowBody);
        },

        getIndexOfItem: function (uid) {
            var scopeitems = this.project.rows;
            for (i = 0; i < scopeitems.length; i++) {
                if (scopeitems[i].uid == uid) {
                    return i;
                    break;
                }
            }
        },

        getScopeItemUidForRow: function (outlineLevel, rowIdx) {
            var scopeitems = this.project.rows;
            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            for (i = rowIdx; i >= 0; i--) {
                if (outlineLevel == 1) {
                    if (scopeitems[i].name.trim() == "") {
                        return "1";
                    } else {
                        return scopeitems[i].scopeItemUid;
                    }
                } else {
                    if (scopeitems[i].outlineLevel == outlineLevel - 1) {

                        var Node = this.findChildRecursively(tree, "rowUid", scopeitems[i].uid);
                        return Node.get("data").scopeItemUid;
                        break;
                    }
                }
            }
        },

        changeOutlineLevel: function (selectedNode, indentation, arrAlreadyChanged) {
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            var hasChildren = selectedNode.childNodes.length == 0 ? false : true;

            switch (indentation) {
                case INDENT_ROW:
                    //indent row
                    this.indentNode(selectedNode, arrAlreadyChanged);

                    break;
                case OUTDENT_ROW:
                    //outdent row
                    this.outdentNode(selectedNode, arrAlreadyChanged);
                    break;
            }
        },

        getParentForRow: function (outlineLevel, rowIdx) {
            var scopeitems = this.project.rows;
            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            for (i = rowIdx; i >= 0; i--) {
                if (outlineLevel == 1) {
                    return tree;
                } else {
                    if (scopeitems[i].outlineLevel == outlineLevel - 1) {

                        var Node = this.findChildRecursively(tree, "rowUid", scopeitems[i].uid);
                        return Node;
                        break;
                    }
                }
            }
        },

        updateExpandedStateOfParentNode: function (row) {
            var updatedParent = this.getParentForRow(row.outlineLevel, this.getIndexOfItem(row.uid));
            updatedParent.expand(false);
        },

        indentNode: function (selectedNode, arrAlreadyChanged) {
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            var hasChildren = selectedNode.childNodes.length == 0 ? false : true;
            treeRowModel.outlineLevel = treeRowModel.outlineLevel + 1;
            rowModel.outlineLevel = treeRowModel.outlineLevel;

            this.updateExpandedStateOfParentNode(rowModel);

            arrAlreadyChanged.push(treeRowModel.uid);
            if (hasChildren) {
                this.indentAllChildren(selectedNode, arrAlreadyChanged);
            }
        },

        indentAllChildren: function (selectedNode, arrAlreadyChanged) {
            var pertView = this;
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            if (selectedNode.hasChildNodes() == false) {
                treeRowModel.outlineLevel = treeRowModel.outlineLevel + 1;
                rowModel.outlineLevel = treeRowModel.outlineLevel;

            } else if (selectedNode.hasChildNodes()) {
                for (var i = 0; i < selectedNode.childNodes.length; i++) {
                    pertView.indentNode(selectedNode.childNodes[i], arrAlreadyChanged);

                }

            }
        },

        outdentNode: function (selectedNode, arrAlreadyChanged) {
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            var hasChildren = selectedNode.childNodes.length == 0 ? false : true;
            treeRowModel.outlineLevel = treeRowModel.outlineLevel - 1;
            arrAlreadyChanged.push(treeRowModel.uid);
            rowModel.outlineLevel = treeRowModel.outlineLevel;
            if (hasChildren) {
                this.outdentAllChildren(selectedNode, arrAlreadyChanged);
            }
        },

        outdentAllChildren: function (selectedNode, arrAlreadyChanged) {
            var pertView = this;
            var $rowBody = selectedNode.get("data").$el,
                    treeRowModel = selectedNode.get("data"),
                    rowModel = $rowBody.data("model");
            if (selectedNode.hasChildNodes() == false) {
                treeRowModel.outlineLevel = treeRowModel.outlineLevel - 1;
                rowModel.outlineLevel = treeRowModel.outlineLevel;

            } else if (selectedNode.hasChildNodes()) {
                for (var i = 0; i < selectedNode.childNodes.length; i++) {
                    pertView.outdentNode(selectedNode.childNodes[i], arrAlreadyChanged);

                }
            }
        },

        deleteScope: function (selectedNodes) {
            //var $fixedCell = $(evt.target).closest(".tree-column");
            var msg = REMOVE_ROW_CONFIRM_MESSAGE,
            anyRowHasPE = false,
            //$existingRow = this.$view.find(".matrix-view-inner .matrix-view-row:nth-child(" + (selectedPos + 1) + ")"),
            //isScope = $fixedCell.hasClass("has-scopename"),
            //isBlankScopeRow = $fixedCell.hasClass("blank-scope-name"),
            scopeName = selectedNodes[0].get("text");
            pertView = this;

            if (selectedNodes.length == 1) {
                msg = getStringWithArgs(REMOVE_SCOPE_CONFIRM_MESSAGE, scopeName);
            } else {
                msg = REMOVE_SCOPES_CONFIRM_MESSAGE;
            }
            msg += MESSAGE_ACTION_CANNOT_UNDONE;

            PPI_Notifier.confirm(msg, DELETE_SCOPE, function () {
                _.each(selectedNodes, function (selectedNode, idx) {
                    var scopeId = selectedNode.get("data").scopeItemUid;
                    var scopeName = selectedNode.get("text");
                    var isRow = selectedNode.get("text").trim() == "" ? true : false;
                    //pertView = this,
                    var isMoreRowsWithScopeUidPresent = pertView.isRowWithSameScopePresent(scopeId, selectedNode.get("data").uid);
                    var isScopeDeletable = pertView.checkIfScopeDeletableFromModel(scopeId);
                    //delete all child and self rows and tree
                    pertView.deleteNodeFromScopeItemTree(selectedNode);
                    //delete all child and self scope
                    if (!isRow && isScopeDeletable && !isMoreRowsWithScopeUidPresent && !anyRowHasPE) {
                        pertView.project.deleteScopeItemByUid(scopeId);
                        pertView.project.createPhaseScopeAndTaskCountMap();
                    }

                    if (!pertView.project.isProjectComplex()) {
                        if (!isRow) {
                            //add name to next row of same scope if available
                            pertView.addNameToNextRowOfSameScope(scopeId, scopeName);
                        }
                    }
                });
                var treeView = Ext.getCmp('scopeItemTree');
                if (treeView.getRootNode().childNodes.length == 0) {
                    var isDefaultRow = true;
                    pertView.insertBlankRowAtPosition(1, treeView.getRootNode(), ADD_CHILD, isDefaultRow);
                }
                pertView.syncColumnWidths();

            }, null);



        },

        addNameToNextRowOfSameScope: function (scopeId, scopeName) {

            var row = _.find(this.project.rows, function (item) {
                return item.scopeItemUid == scopeId;
            });

            if (row) {
                row.name = scopeName;
                var tree = Ext.getCmp("scopeItemTree").getRootNode();
                var node = this.findChildRecursively(tree, "rowUid", row.uid);
                node.set("text", scopeName);
            }
        },



        deleteNodeFromScopeItemTree: function (selectedNode) {
            var selectedNode = selectedNode; //treeView.getSelectionModel().getSelection()[0];
            var parentNode = selectedNode.parentNode;
            this.deleteRowItem(selectedNode);
            //this.callDeleteRow(selectedNode);
            selectedNode.remove();
            this.updateParentAsLeafNode(parentNode);
        },

        updateParentAsLeafNode: function (node) {
            if (node && node.childNodes.length == 0) {
                node.set("leaf", true);
            }
        },

        deleteRowItem: function (selectedNode) {
            var pertView = this;
            this.callDeleteRow(selectedNode);
            if (selectedNode.hasChildNodes()) {
                pertView.deleteAllChildRowItems(selectedNode);
            }
        },

        deleteAllChildRowItems: function (Mynode) {
            var pertView = this;
            if (Mynode.hasChildNodes()) {
                _.each(Mynode.childNodes, function (child, idx) {
                    if (typeof (child) != "undefined") {
                        pertView.deleteRowItem(child);
                    }
                });
            }

        },

        addNodeToScopeItemTree: function (selectedNode, rowModel, rowElement, addType) {

            var selectedNode; //= selectedNode;
            var selectedIdx;
            var refNode;
            var isDefaultRow = false;
            if (selectedNode != Ext.getCmp('scopeItemTree').getRootNode()) {
                selectedNode = selectedNode;
                selectedIdx = selectedNode.parentNode.indexOf(selectedNode);
                refNode = selectedNode.parentNode;
            } else {
                isDefaultRow = true;
            }

            var rowModelForScopeTree = {};
            rowModelForScopeTree.uid = rowModel.uid;
            rowModelForScopeTree.name = rowModel.name;
            rowModelForScopeTree.outlineLevel = rowModel.outlineLevel;
            rowModelForScopeTree.$el = rowElement;
            rowModelForScopeTree.scopeItemUid = rowModel.scopeItemUid;
            rowModelForScopeTree.order = rowModel.order;
            rowModelForScopeTree.tasks = rowModel.tasks;

            var scopeItemNode = {};
            scopeItemNode.expanded = true;
            scopeItemNode.leaf = true;
            scopeItemNode.data = rowModelForScopeTree;
            scopeItemNode.rowUid = rowModel.uid;
            scopeItemNode.text = rowModel.name;
            scopeItemNode.children = [];
            switch (addType) {
                case INSERT_ROW_ABOVE:
                    //add row above
                    refNode.insertChild(selectedIdx, scopeItemNode);

                    break;
                case INSERT_ROW_BELOW:
                    //add row below
                    refNode.insertChild(selectedIdx + 1, scopeItemNode);
                    break;
                case ADD_CHILD:
                    //add child
                    //Parent task is expanded when child is added.
                    selectedNode.appendChild(scopeItemNode);
                    if (!isDefaultRow) {
                        selectedNode.expand(false);
                    }
                    break;
            }

        },

        changeRowToScope: function (Node) {
            var scopeName = DEFAULT_SCOPE_NAME; //+ Node.get("data").scopeItemUid + "." + Node.get("data").uid;
            Node.set("text", scopeName);
            var isBlankRowToScopeConversion = true;
            var rec = {};
            rec.originalValue = "";
            rec.value = scopeName;
            this.onScopeItemChange(rec, Node, rec.originalValue, rec.value, isBlankRowToScopeConversion);
        },

        getLastAvailableChildren: function (Node) {
            var pertView = this;

            if (Node.hasChildNodes() == false) {
                return Node;

            } else if (Node.hasChildNodes()) {
                return pertView.getLastAvailableChildren(Node.childNodes[Node.childNodes.length - 1]);

            }
        },

        // TODO have the logic that inserts a row on ENTER in row name call this (redundant)
        insertBlankRowAtPosition: function (outlineLevel, selectedNode, insertType, isDefaultRow) {
            var me = this;
            var presentScrollPosition = this.$viewport.scrollTop();
            //var parentScopeName = ($parentScope.find(".scope-item-label")).text() || "",
            //var parentScope = this.project.getScopeItemByName(referenceName);
            var parentScopeUid = null;
            var selectedNode = selectedNode;
            var isNewScopeCreated = false;
            var hasBlankName = selectedNode.get("text").trim() === "" ? true : false;
            var hasChildAlready = selectedNode.childNodes.length == 0 ? false : true;
            var referenceElementForBefore = selectedNode.get("data").$el;
            if (!referenceElementForBefore) {
                referenceElementForBefore = this.$view.find(".matrix-view-inner .matrix-view-row").first();
            }

            var referenceElementForChild;
            var referenceElementForAfter;
            if (selectedNode.childNodes.length > 0) {
                referenceElementForChild = this.getLastAvailableChildren(selectedNode.childNodes[selectedNode.childNodes.length - 1]).get("data").$el;
            } else {
                referenceElementForChild = referenceElementForBefore;
            }

            referenceElementForAfter = this.getLastAvailableChildren(selectedNode).get("data").$el;

            var scopeName; //= this.getDefaultScopeName(outlineLevel, insertType, referenceName, selectedNode); //"New Scope";
            if (insertType == ADD_CHILD && !isDefaultRow) {//add child
                scopeName = "";
                if (hasBlankName && !hasChildAlready) {
                    this.changeRowToScope(selectedNode);
                    isNewScopeCreated = true;
                }
                parentScopeUid = selectedNode.get("data").scopeItemUid;

            } else {
                if (!me.project.isProjectComplex()) {
                    scopeName = "";
                    if (insertType == INSERT_ROW_ABOVE) {
                        parentScopeUid = this.getScopeUidOfSeletedNodeForSimpleProject(selectedNode, true /*isSelfExluded*/);
                        if (typeof (parentScopeUid) == "undefined") {
                            scopeName = DEFAULT_SCOPE_NAME;
                        }
                    } else if (isDefaultRow) {
                        parentScopeUid = null;
                        scopeName = DEFAULT_SCOPE_NAME;

                    } else {
                        parentScopeUid = selectedNode.get("data").scopeItemUid;
                    }



                } else {
                    scopeName = DEFAULT_SCOPE_NAME;
                }

            }


            var newRowModel = this.project.createRow(parentScopeUid, scopeName, outlineLevel),
                $newRow = this.generateRow(newRowModel, this.project.phases),
            //$existingRow = this.$view.find(".matrix-view-inner .matrix-view-row:nth-child(" + (index + 1) + ")"),
                matrixViewEl = this.$view[0];

            //newRowModel.$el = $newRow;

            //this.project.rows.splice(index, 0, newRowModel);
            this.addNodeToScopeItemTree(selectedNode, newRowModel, $newRow, insertType);
            switch (insertType) {
                case INSERT_ROW_ABOVE:
                    $(referenceElementForBefore).before($newRow);
                    break;
                case INSERT_ROW_BELOW:
                    $(referenceElementForAfter).after($newRow);
                    break;
                case ADD_CHILD:
                    if (isDefaultRow) {
                        var rowPlaceholder = this.$view.find(".matrix-view-inner .matrix-view-row.row-placeholder");
                        $(rowPlaceholder).before($newRow);
                    } else {
                        $(referenceElementForChild).after($newRow);
                    }
                    break;
            }

            this.moveNewRowFirstCellIntoFixedColumn($newRow);
            this.saveRow($newRow);
            this.saveProject();

            //TODO - There is dependency on saveRow method  thats why it has been put here
            //We should try to remove this dependency
            if (me.project.isProjectComplex()) {
                //Vrushali - Summary task is created in following scenarios
                //case 1 - Insert Row Above/Below - node/scope with a name is created.
                //Case 2 - Special Case of Add Child - 
                //         parent node is empty(without name) and new child is added.
                //         In such scenario, parent row is converted to scope
                if (insertType != ADD_CHILD) {
                    newRowModel = me.addSummaryTaskToRow(newRowModel, newRowModel.scopeItem, $newRow, selectedNode);
                }
                /*else if (isNewScopeCreated) {
                var $row = selectedNode.get("data").$el;
                var rowModel = $row.data("model");
                rowModel = me.addSummaryTaskToRow(rowModel, rowModel.scopeItem, $newRow, selectedNode);
                }*/
            }
            this.createExtJSTree();

            if (!isDefaultRow) {
                var selectedNodes = [selectedNode];
                this.selectNodes(selectedNodes);
            }

            this.scrollToSelected(presentScrollPosition);

            $(document).trigger("rowadd", [
                this,
                newRowModel,
                this.project.phases,
                insertType,
                selectedNode,
                null
            ]);
            this.refreshLinks();
            this.syncRowHeights();
        },

        getDefaultScopeName: function (outlineLevel, insertType, referenceName, selectedNode) {
            var refNode = selectedNode;
            if (insertType == 1 || insertType == 2) {
                if (outlineLevel == 1) {
                    referenceName = "WBS " + Number(refNode.parentNode.childNodes.length + 1);
                } else {
                    var baseName = referenceName.trim().substring(0, referenceName.trim().length - 1);
                    referenceName = baseName + Number(refNode.parentNode.childNodes.length + 1);
                }

            } else if (insertType == 3) {
                referenceName = referenceName + "." + Number(refNode.childNodes.length + 1);
            }
            return referenceName;
        },

        onTaskViewDelete: function (evt) {
            this.deleteTask(evt.target.$el);            
            //When a task is expanded in matrix view, a mask is applied and the scroll bars are kept hidden. This is in function onTaskZoom
            //When task is collapsed, mask is removed and scrollbars are made visible. Similarly if a task is deleted the mask has to be removed and scrollbars should be made visible
            this.removeOverlayModeCssChanges();            
            evt.stopPropagation();
            this.syncRowHeights();
        },
        addOverlayModeCssChanges:function(){
            // Add temporary padding and lock scroll position while in overlay mode,
            // to provide room to scroll to tasks at bottom and right edges
            this.$viewport.css("overflow", "hidden");
            this.$viewport.find(".matrix-view-inner").css({
                "padding-right": "1000px",
                "padding-bottom": "1000px"
            });
            this.$leftColContainer.css("padding-bottom", "1000px");
            this.$headerContainer.css("padding-right", "1000px");
            $(".mask-view").show();
        },
        removeOverlayModeCssChanges:function(){
            $(".mask-view").hide();
            // Remove temporary padding and overflow settings
            this.$viewport.find(".matrix-view-inner").css({
               "padding-right": "0",
               "padding-bottom": "0"
            });
            this.$leftColContainer.css("padding-bottom", "0");
            this.$headerContainer.css("padding-right", "0");           
            this.$viewport.css("overflow", "auto");
        }, 
        onDeleteFullkitTaskClick: function (evt) {
            this.deleteTask($(evt.target).closest(".task"), false);
        },

        onTaskViewSubtaskDelete: function (evt, subtask, task) {

            $(document).trigger("subtaskremove", [
                this,
                subtask,
                task

            ]);

            evt.stopPropagation();
        },
        getPrevTaskUid: function($task){
            var $prevTask = $task.prev();
            var prevTaskUid;
            if ($prevTask && $prevTask.length > 0)
                prevTaskUid = $task.prev().data('model').uid;
            return prevTaskUid;
        },
        deleteTask: function($task, removeHasTask) {
            var $cell = $task.closest(".phase-column"),
                $row = $cell.closest(".matrix-view-row"),
                phase = this.project.phases[$row.find(".phase-column").index($cell)],
                phaseId = phase.uid;
            if (removeHasTask) {
                $cell.removeClass("has-task");
            }
            var rowId = $row.data("model").uid,
                task = $task.data("model"),
                $allTasksInCell = $cell.find(".task"),
                taskCount = $allTasksInCell.length,
                taskIndex = $allTasksInCell.index($task);

            var immediateSiblingsUid = this.project.getImmediateSiblingsUids(task);
            var row = $row.data("model");
            var scope = this.project.getScopeItemByUid(row.scopeItemUid);
            stl.app.undoStackMgr.pushToUndoStackForTaskDelete(stl.app.matrixView.project, task, scope, row, phase,
                immediateSiblingsUid.prevTaskUid, immediateSiblingsUid.nextTaskUid);
            // Most bookkeeping and updating of matrix view will be done in the taskremove handler
            $(document).trigger("taskremove", [
                this,
                task,
                rowId,
                phaseId
            ]);
            // TODO move this to project model
            delete this.project._tasksAndMilestonesByUid[task.uid];
            this.selectedTask = null;
            $(document).trigger("taskselectionchange", [this.selectedTask]);
            $(document).trigger("taskMultiSelectEnd");
            this.syncColumnWidths();
            this.syncRowHeights();
            this.refreshLinks();
            if ((task.bufferType === "CCCB") ||
                (task.bufferType === "CMSB") ||
                (task.bufferType === "CCFB")) {
                this.project.isIDCCed = false;
            }
        },

        removeLinksForTask: function (taskUID) {
            var links = this.project.links,
                $task = this.tasksByUid[taskUID].$el;
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === taskUID || link.to === taskUID) {
                    this.project.removeLink(link.from, link.to);
                }
            }
            this.triggerSave();
            stl.app.CreatePredSuccMap(this.project);
        },

        removeLinksForMS: function (msUID) {
            var links = this.project.links,
                $task = this.milestoneElementsById[msUID].$el;
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === msUID || link.to === msUID) {
                    this.project.removeLink(link.from, link.to);
                }
            }
            this.triggerSave();
            stl.app.CreatePredSuccMap(this.project);
        },

        removeAutoAndInvalidLinksForTask: function (taskUID) {
            var links = this.project.links,
                $task = this.tasksByUid[taskUID].$el;
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === taskUID || link.to === taskUID) {
                    var $from = (link.from === taskUID ? $task : this.getTaskOrMilestoneLinkTargetElementByUid(link.from)),
                        $to = (link.to === taskUID ? $task : this.getTaskOrMilestoneLinkTargetElementByUid(link.to));
                    if (link.auto || !this.isLinkAllowed($from, $to)) {
                        // Project will fire an event on link removal and we'll remove locally in onLinkRemove
                        this.project.removeLink(link.from, link.to);
                        // this.linksView.removeConnection($from, $to);
                    }
                }
            }
            stl.app.CreatePredSuccMap(this.project);
            this.triggerSave();
        },

        // TODO this could go in the project model
        removeForwardLinksForTask: function (taskUID) {
            var links = this.project.links,
            //Get task/MS element from    either task collection or milestone collection
            $taskFrom = (this.tasksByUid[taskUID]) ? this.tasksByUid[taskUID].$el : this.milestoneElementsById[taskUID];
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === taskUID) {
                    var $taskTo = this.getTaskOrMilestoneLinkTargetElementByUid(link.to);
                    // this.linksView.removeConnection($taskFrom, $taskTo);
                    // Project will fire an event on link removal and we'll remove locally in onLinkRemove
                    this.project.removeLink(link.from, link.to);
                }
            }
            stl.app.CreatePredSuccMap(this.project);
        },

        /*
        Remove from and to links for a buffer task and create link from buffer's fromEl to buffer's toEl
        */
        removeBufferTaskLinks: function (bufferTaskId) {
            var links = this.project.links,
                $targetEl = this.getTaskOrMilestoneLinkTargetElementByUid(bufferTaskId),
                $fromEl,
                $toEl;
            // this.linksView.removeConnectionsForElement($targetEl);
            for (var i = links.length - 1; i >= 0; i--) {
                var link = links[i];
                if (link.from === bufferTaskId || link.to === bufferTaskId) {
                    // Project will fire an event on link removal and we'll remove locally in onLinkRemove
                    //this.project.removeLink(link.from, link.to);
                    if (link.to === bufferTaskId)
                        $fromEl = this.getTaskOrMilestoneLinkTargetElementByUid(link.from);
                    if (link.from === bufferTaskId)
                        $toEl = this.getTaskOrMilestoneLinkTargetElementByUid(link.to);
                    if ($fromEl && $toEl) {
                        this.addAutoLink($fromEl, $toEl);
                        $fromEl = null;
                        $toEl = null;
                    }
                }
            }
            stl.app.CreatePredSuccMap(this.project);
            this.refreshLinks();
        },

        onAcceptPlan: function (evt, sender, milestones) {
            var me = this;
            $.each(milestones, function (idx, value) {
                //project.updateMilestone(value);
                var $ms = me.milestoneElementsById[value.uid];
                $ms.data("view").load(value);

            });

        },

        addPhaseHeaderMenuListeners: function ($phaseHeaderCell) {
            $phaseHeaderCell.find(".dropdown-menu-caret").on("click", this.onPhaseHeaderMenuButtonClick.bind(this));
        },

        onPhaseHeaderMenuButtonClick: function (evt) {
            var $phaseHeader = $(evt.target).closest(".phase-column-header"),
                $button = $phaseHeader.find(".dropdown-menu-caret"),
                $buttonOffset = $button.offset(),
                $menu = $phaseHeader.find(".tool-popup").clone(true),
                showing = $menu.is(":visible");
            $(document.body).find(".phase-header-popup-menu-active").remove();
            $(".tool-popup").hide();
            $menu.css({
                position: "absolute",
                right: "auto"
            })
                .data("phase-column", $phaseHeader);
            $menu = this.getToolPopUpMenuForNormalPhase($phaseHeader, $menu);

            $(document.body).append($menu);
            if (!showing) {
                $menu.show()
                    .offset({
                        top: $buttonOffset.top + $button.height(),
                        left: $buttonOffset.left + $button.width() - $menu.width()
                    })
                    .addClass("phase-header-popup-menu-active");
                evt.stopPropagation();
            }
        },

        getToolPopUpMenuForNormalPhase: function ($phaseHeader, $menu) {

            if ($phaseHeader.hasClass("phase-type-normal")) {
                var thisPhaseHeaderIndex = $(".phase-column-header").index($phaseHeader),
                    $nextPhaseHeader = $($(".phase-column-header")[thisPhaseHeaderIndex + 1]),
                    $prevPhaseHeader = $($(".phase-column-header")[thisPhaseHeaderIndex - 1]);
                isNextPhaseHeaderLastDummyHeader = $nextPhaseHeader.is($(".phase-column-header").last());
                //Normal Phase->Milestone Phase - disable insert-milestone-after
                if ($nextPhaseHeader && $nextPhaseHeader.hasClass("phase-type-milestone")) {
                    $menu.find(".tool-item-insert-milestone-after").addClass("disabled");

                }
                //Normal Phase->Fullkit Phase - disable insert-fullkit-before
                if ($prevPhaseHeader && $prevPhaseHeader.hasClass("phase-type-fullkit")) {
                    $menu.find(".tool-item-insert-fullkit-before").addClass("disabled");

                }


                $menu.find(".tool-item-delete-phase").addClass("disabled"); //diasble  delete for all noraml phases
                //allow deletion in following cases
                //Prev or successor phase is normal phase
                //prev is Fk and succ is MS
                if ((isNextPhaseHeaderLastDummyHeader)
                    || ($nextPhaseHeader && $nextPhaseHeader.hasClass("phase-type-normal"))
                    || ($prevPhaseHeader && $prevPhaseHeader.hasClass("phase-type-normal"))
                    || (($prevPhaseHeader && $prevPhaseHeader.hasClass("phase-type-milestone")) && ($nextPhaseHeader && $nextPhaseHeader.hasClass("phase-type-fullkit")))
                    ) {
                    $menu.find(".tool-item-delete-phase").removeClass("disabled");
                }



            }
            return $menu;

        },

        onHighlightCCTasks: function () {
            var me = this;
            var tasks = this.tasksByUid;
            var milestones = this.milestoneElementsById;

            $.each(tasks, function (index, taskView) {
                if (taskView.$el && taskView.$el.hasClass("isCCTask")) {
                    taskView.$el.addClass("highlightedCCTask");
                }
            });

            $.each(milestones, function (index, milestone) {
                if (milestone.data("model")) {
                    if (milestone.data("model").isCritical == true) {
                        $(milestone).addClass("highlightedCCTask");
                    }
                }
            });
            if (this.linksView){
                var links = this.linksView.linksByID;
                $.each(links, function (index, link) {
                    var toTask = link.to;
                    var fromTask = link.from;

                    var isLinkInCC = false;

                    isLinkInCC = me.linksView.isLinkInCriticalChain(toTask, fromTask);

                    if (isLinkInCC) {
                        this.linksView.setLinkColor(fromTask, toTask, "red");
                        this.linksView.setLinkZIndex(fromTask, toTask, 100);
                    }
                } .bind(this));
            }
            
        },

        onHighlightPenChain: function () {
            // stl.app.HighlightProjectPenChain(this.project);
            if (!stl.app.milestoneUIDForChainToBeHighlighted) {
                stl.app.HighlightProjectPenChain(this.project);
            } else {
                var penChainIDs = this.project.getPenChainID(stl.app.milestoneUIDForChainToBeHighlighted);
                var isChecked = true;
                if(stl.app.isChainViewLoaded){
                    var msRec = Ext.getCmp('msGrid').getStore().findRecord('uid', stl.app.milestoneUIDForChainToBeHighlighted, 0 ,false, true, true);
                    if(msRec)
                        isChecked = msRec.get('longestPaths2')
                }
				if (penChainIDs && penChainIDs != -1){
                for(var i=0; i<penChainIDs.length; i++)
                    stl.app.HighlightPenChain(penChainIDs[i], isChecked);
				}
            }
        },

        onHighlightResourceContention: function () {
            var matrixView = $(".matrix-view").data("view");
            var tasksByUidMap = matrixView.tasksByUid;
            var resourceContentionData = CCSummaryStore.ResourceContentionData;

            for (index = 0; index < resourceContentionData.length; index++) {

                var startTaskView = tasksByUidMap[resourceContentionData[index].StartActivityUID];
                var endTaskView = tasksByUidMap[resourceContentionData[index].EndActivityUID];

                startTaskView.$el.addClass("resourceContentionTask");
                endTaskView.$el.addClass("resourceContentionTask");

            }
            $(".highlight").find(".button-text").text("Highlight: " + RESOURCE_CONTENTION);
            setResourceGridRowClass(Ext.getCmp('resGrid').resourceContentionInGrid);
        },

        onHighlightSlack: function () {
            var matrixView = $(".matrix-view").data("view");
            var tasksByUidMap = matrixView.tasksByUid;
            var milestonesByUidMap = matrixView.milestoneElementsById;

            var SlackData = CCSummaryStore.SlackData;

            for (index = 0; index < SlackData.length; index++) {
                var startTaskView = tasksByUidMap[SlackData[index].FromActivityUID];
                if (startTaskView && startTaskView.$el) {
                    startTaskView.$el.addClass("slack");
                }
                else {
                    var startMilestoneView = milestonesByUidMap[SlackData[index].FromActivityUID];
                    if (startMilestoneView) {
                        $(startMilestoneView).addClass("slack");
                    }
                }

                var endTaskView = tasksByUidMap[SlackData[index].ToActivityUID];
                if (endTaskView && endTaskView.$el) {
                    endTaskView.$el.addClass("slack");
                }
                else {
                    var endMilestoneView = milestonesByUidMap[SlackData[index].ToActivityUID];
                    if (endMilestoneView) {
                        $(endMilestoneView).addClass("slack");
                    }
                }
            }
            $(".highlight").find(".button-text").text("Highlight: " + SLACK);
        },

        onAllHighlightsCleared: function () {
            if (this.linksView) {
                this.linksView.setAllLinkProperties(null, null);
            }
        },

        getResourceHighlightMenu: function (view) {
            var $menu = view.$highlightResourcesMenu;
            if (!$menu) {
                $(document.body).children(".highlight-resources-popup").remove();
                $menu = view.$highlightResourcesMenu = $(".highlight-resources").find(".tool-popup").clone(true);
                $(document.body).append($menu);
            }
            if (!view.resourceHighlightMenuIsCurrent) {
                view.updateResourceHighlightMenu($menu, view);
            }
            return $menu;
        },
        getPhaseHighlightMenu: function (view) {
            var $menu = view.$highlightPhasesMenu;
            if (!$menu) {
                $(document.body).children(".highlight-phases-popup").remove();
                $menu = view.$highlightPhasesMenu = $(".highlight-phases").find(".tool-popup").clone(true);
                $(document.body).append($menu);
            }
            if (!stl.app.phaseHighlightMenuIsCurrent) {
                view.updatePhaseHighlightMenu($menu, view);
            }
            return $menu;
        },
        getTaskManagerHighlightMenu: function (view) {
            var $menu = view.$highlightTaskManagersMenu;
            if (!$menu) {
                $(document.body).children(".highlight-task-managers-popup").remove();
                $menu = view.$highlightTaskManagersMenu = $(".highlight-task-managers").find(".tool-popup").clone(true);
                $(document.body).append($menu);
            }
            if (!view.taskManagerHighlightMenuIsCurrent) {
                view.updateTaskManagerHighlightMenu($menu, view);
            }
            return $menu;
        },

        highlightConstrainingTasks: function (task) {
            var me = this;
            if ($(task).closest(this.$view).length === 0) return;

            var taskdata = task.data("model");
            constrainingTaskIds = this.project.getConstrainingTasks(taskdata.uid);
            if (constrainingTaskIds.length > 0) {
                me.highlightChain(constrainingTaskIds, true, "constrainingSuccessorTask");
            }
        },

        highlightLongestPredecessorChainOnViewChange: function (sender, matrixViewTask) {

            // FIXME should not be using matrix view directly here

            var me = this;
            var matrixView = $(".matrix-view").data("view");

            var tasksInPredecessorChain = matrixView.highlightLongestPredecessorChain(matrixViewTask);
            if (tasksInPredecessorChain.length > 0) {
                me.highlightLongestPredecessorChainTasks(tasksInPredecessorChain);
            }
        },

        onhighlightLongestPredecessorChain: function (sender, task) {

            if ($(task).closest(this.$view).length === 0) return;
            var me = this;
            var tasksInPredecessorChain = [];
            tasksInPredecessorChain = me.highlightLongestPredecessorChain(task);
            if (tasksInPredecessorChain.length > 0) {
                me.highlightChain(tasksInPredecessorChain, false, "constrainingSuccessorTask");
            }
        },

        getTaskElementByUid: function (taskUID) {
            var taskView = this.tasksByUid[taskUID];
            if (taskView) {
                return taskView.$el;
            }
            return null;
        },

        getMilestoneElementByUid: function (taskUID) {
            var milestoneView = this.milestoneElementsById[taskUID];
            if (milestoneView) {
                return milestoneView;
            }
            return null;
        },

        getAllTaskOrMilestoneElements: function(){
            var elements = [];
            var me = this;
            _.each(Object.keys(me.tasksByUid), function(key){
                elements.push(me.tasksByUid[key].$el[0]);
            });
            _.each(Object.keys(me.milestoneElementsById), function(key){
                elements.push(me.milestoneElementsById[key].find(".ms-content-wrap")[0]);
            });
            return $(elements);
        },

        highlightPenChain: function (milestoneUId) {

            var penChainIDs = this.project.getPenChainID(milestoneUId);

            if (penChainIDs && penChainIDs != -1)
                for(var i=0; i<penChainIDs.length; i++)
                    stl.app.HighlightPenChain(penChainIDs[i]);
        },

        highlightLongestPredecessorChain: function (task) {
            //clearAllHighlight();
            if ($(task).closest(this.$view).length === 0) return;
            var me = this;
            var CurSelectedTask = $(task).data("model");
            var TaskPredecessors = {};
            var TaskPredMap = {};
            var AllTasksInfo = this.tasksByUid; //ActiveProject.Tasks
            var AllMilestonesInfo = this.milestoneElementsById;
            me.AllTasksInProject = [];

            ///FIXME - me.project.getAllTasks().concat(me.project._milestones) gives same result
            $.each(AllTasksInfo, function (index, taskView) {
                me.AllTasksInProject.push(taskView.task);
            });

            $.each(AllMilestonesInfo, function (index, CurMilestone) {
                me.AllTasksInProject.push($(CurMilestone).data("model"));
            });

            $.each(me.AllTasksInProject, function (index, CurTask) {

                var TaskPredecessors = {};
                if (CurTask.uid != undefined)
                    TaskPredMap[CurTask.uid] = TaskPredecessors;

            });
            $.each(me.AllTasksInProject, function (index, CurTask) {
                //if(!CurTask.data.isSummaryTask) - //TBD - Currently we cannot create summary task and also we dont have this property 
                me.S2M_AddTaskAsPredecessor(CurTask, TaskPredMap);
            });


            var SelTask = CurSelectedTask; //TBD - There is no multiselection in PPI currently
            me.ParentCounterMap = {};
            var TaskType = CurSelectedTask.text9;
            me.S2M_MarkNumberOfParents(SelTask, me.ParentCounterMap, TaskType, TaskPredMap)

            me.MaxPathLeaves = [];
            me.MaximumWeights = {};
            me.tasksToBeHighlighted = [];

            me.S2M_MarkMaximumWeights(SelTask, me.ParentCounterMap, me.MaxPathLeaves, me.MaximumWeights, TaskType, TaskPredMap);

            me.S2M_FlagLongestFeedingPaths(me.MaxPathLeaves, me.ParentCounterMap, me.MaximumWeights);

            return me.tasksToBeHighlighted;
            //me.highlightChain(me.tasksToBeHighlighted);
            //TBD - There is no multiselection in PPI currently
            //MaxPathLeaves = null;
            //MaximumWeights = null;

            //g_AppInstance.FilterApply(g_oStringValueContainer.GetFlag17isTrueStr())
            //S2M_UtilityFunctions.HighlightTask(CurSelectedTask)
        },

        highlightChain: function (tasksToBeHighlighted, onlyUIdArray, className) {
            var tasksByUidMap = this.tasksByUid;
            var milestonesByUidMap = this.milestoneElementsById;

            if (!onlyUIdArray) {

                $.each(tasksToBeHighlighted, function (index, task) {
                    var taskView = tasksByUidMap[task.uid];

                    if (taskView && taskView.$el) {
                        taskView.$el.addClass(className);
                    }

                    var cMilestone = milestonesByUidMap[task.uid];
                    if (cMilestone) {
                        $(cMilestone).addClass(className);
                    }

                });
            } else {
                $.each(tasksToBeHighlighted, function (index, taskUid) {
                    var taskView = tasksByUidMap[taskUid];

                    if (taskView && taskView.$el) {
                        taskView.$el.addClass(className);
                    }

                    var cMilestone = milestonesByUidMap[taskUid];
                    if (cMilestone) {
                        $(cMilestone).addClass(className);
                    }

                });
            }
        },

        S2M_AddTaskAsPredecessor: function (PredTask, TaskPredMap) { //ByRef TaskPredMap

            var me = this;
            //Add the successors
            var CurTask;
            if (PredTask._successors) {
                $.each(PredTask._successors, function (index, CurTask) {
                    me.S2M_AddToPredecessorCollection(PredTask, CurTask, TaskPredMap);
                });
            }

            //Add the next critical task
            var ConstraintUniqueId = PredTask.text7;
            if (ConstraintUniqueId && ConstraintUniqueId > 0)
                this.S2M_AddToPredecessorCollection_ErrCheckText7(PredTask, me.AllTasksInProject, ConstraintUniqueId, TaskPredMap);

            //Add the constraing task (either a resource dependency or an activity dependency
            ConstraintUniqueId = PredTask.text5;
            if (ConstraintUniqueId && ConstraintUniqueId > 0 && ConstraintUniqueId != PredTask.uid)
                this.S2M_AddToPredecessorCollection_ErrCheckText5(PredTask, me.AllTasksInProject, ConstraintUniqueId, TaskPredMap)
        },

        S2M_MarkNumberOfParents: function (RootTask, ParentCounterMap, TaskType, TaskPredMap) { //ByRef ParentCounterMap
            var me = this;
            var TasksTraversed = {};
            me.ParentCounterMap[RootTask.uid] = 0;
            this.S2M_MarkNumberOfParentsRecursive(RootTask, me.ParentCounterMap, TasksTraversed, TaskType, TaskPredMap);

        },

        S2M_MarkMaximumWeights: function (RootTask, ParentCounterMap, MaxPathLeaves, MaximumWeights, TaskType, TaskPredMap) { //ByRef MaxPathLeaves, MaximumWeights
            var me = this;
            var Queue = [];
            var CurTask, CurChildTask;
            var CurrentCounterMap = {};
            //var MaxPathLeavesArrRef = MaxPathLeaves;

            me.MaximumWeights[RootTask.uid] = 0;
            CurrentCounterMap[RootTask.uid] = 0;
            Queue.push(RootTask);


            while (Queue.length > 0) {
                CurTask = Queue[0];
                Queue.splice(0, 1);
                var TaskPredecessors = {};
                TaskPredecessors = TaskPredMap[CurTask.uid];

                $.each(TaskPredecessors, function (index, CurChildTask) {
                    me.S2M_ComputeWeight(CurChildTask, CurTask, me.MaximumWeights);
                    me.S2M_IncrementCounter(CurChildTask, CurrentCounterMap);
                    var retVal = me.S2M_AreAllParentsWeighted(CurChildTask, CurrentCounterMap, me.ParentCounterMap);
                    if (retVal)
                        Queue.push(CurChildTask);
                });


                me.S2M_UpdateMaxPathLeaves(CurTask, me.MaximumWeights, me.MaxPathLeaves);
            }
            // MaxPathLeaves = MaxPathLeavesArrRef;
        },

        S2M_ComputeWeight: function (ChildTask, ParentTask, MaximumWeights) { //ByRef MaximumWeights
            var me = this;
            var nParentWeight = 0;
            var nCurrentWeight = 0;
            var nRemainingDuration = 0;
            var sText22;
            nRemainingDuration = me.GetRemDuration(ChildTask);

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
        },

        S2M_UpdateMaxPathLeaves: function (CurTask, MaximumWeights, MaxPathLeaves) { //ByRef MaxPathLeaves
            var me = this;
            var nCurrentMaxDepth = 0;
            var nCurrentTaskDepth = 0;
            if (me.MaxPathLeaves.length > 0)
                nCurrentMaxDepth = me.MaximumWeights[me.MaxPathLeaves[0].uid];

            if (MaxPathLeaves.length > 0 && me.MaximumWeights[me.MaxPathLeaves[0].uid] != undefined) { //nCurrentMaxDepth != undefined
                nCurrentTaskDepth = me.MaximumWeights[CurTask.uid];

                if (nCurrentTaskDepth > nCurrentMaxDepth) {
                    me.MaxPathLeaves = [];
                    me.MaxPathLeaves.push(CurTask);
                } else if (nCurrentTaskDepth == nCurrentMaxDepth) {
                    me.MaxPathLeaves.push(CurTask);
                }
            } else {
                me.MaxPathLeaves.push(CurTask);
            }
            //return MaxPathLeaves;
        },

        S2M_AreAllParentsWeighted: function (ChildTask, CurrentCounterMap, ParentCounterMap) {
            var me = this;
            var areAllParentsWeighted = false;
            if (CurrentCounterMap[ChildTask.uid] == me.ParentCounterMap[ChildTask.uid])
                areAllParentsWeighted = true;
            return areAllParentsWeighted;

        },


        S2M_FlagLongestFeedingPaths: function (MaxPathLeaves, ParentCounterMap, MaximumWeights) { //ByRef MaxPathLeaves, MaximumWeights
            var me = this;
            var LeafTask;
            var VisitedNodes = [];
            var CompletedTask = false;

            $.each(me.MaxPathLeaves, function (index, LeafTask) {
                if (LeafTask.percentComplete == 100)
                    CompletedTask = true;
                else
                    CompletedTask = false;

                me.S2M_FlagLongestFeedingPath(LeafTask, me.ParentCounterMap, me.MaximumWeights, VisitedNodes, CompletedTask);
            });
        },

        S2M_FlagLongestFeedingPath: function (CurTask, ParentCounterMap, MaximumWeights, VisitedNodes, CompletedTask) { //ByRef VisitedNodes
            var me = this;
            var CurParentTask;
            var nNextMaxDepth = 0;
            var nRemainingDuration = 0;
            var ConstraintUniqueId = 0;

            if (VisitedNodes[CurTask.uid])
                return;

            if (!VisitedNodes[CurTask.uid]) {

                VisitedNodes[CurTask.uid] = true;

                nRemainingDuration = me.GetRemDuration(CurTask);
                if (CompletedTask == false)
                    me.S2M_MarkTask(CurTask);

                nNextMaxDepth = me.MaximumWeights[CurTask.uid] - nRemainingDuration;

                $.each(CurTask._successors, function (index, CurParentTask) {
                    if (me.ParentCounterMap[CurParentTask.uid] != undefined) {
                        if (nNextMaxDepth == me.MaximumWeights[CurParentTask.uid]) {
                            CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100); //CHECK
                            me.S2M_FlagLongestFeedingPath(CurParentTask, me.ParentCounterMap, me.MaximumWeights, VisitedNodes, CompletedTask);
                        }
                    }

                });

                ConstraintUniqueId = CurTask.text7;

                if (ConstraintUniqueId > 0) {
                    var matchingTask;
                    $.each(me.AllTasksInProject, function (index, curTask) {
                        if (curTask.uid == ConstraintUniqueId) {
                            matchingTask = curTask;
                            return false;
                        }
                    });
                    CurParentTask = matchingTask; /// FIXME - ActiveProject.Tasks.uniqueId(ConstraintUniqueId)                    
                    if (CurParentTask && me.ParentCounterMap[CurParentTask.uid] != undefined) {
                        if (nNextMaxDepth == me.MaximumWeights[CurParentTask.uid]) {
                            CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100);
                            me.S2M_FlagLongestFeedingPath(CurParentTask, me.ParentCounterMap, me.MaximumWeights, VisitedNodes, CompletedTask);
                        }
                    }
                }

                ConstraintUniqueId = CurTask.text5;

                if (ConstraintUniqueId > 0) {
                    var matchingTask;
                    $.each(me.AllTasksInProject, function (index, curTask) {
                        if (curTask.uid == ConstraintUniqueId) {
                            matchingTask = curTask;
                            return false;
                        }
                    });
                    CurParentTask = matchingTask; /// FIXME - ActiveProject.Tasks.uniqueId(ConstraintUniqueId)

                    if (CurParentTask && me.ParentCounterMap[CurParentTask.uid] != undefined) {
                        if (nNextMaxDepth == me.MaximumWeights[CurParentTask.uid]) {
                            CompletedTask = CompletedTask && (CurParentTask.percentComplete == 100);
                            me.S2M_FlagLongestFeedingPath(CurParentTask, me.ParentCounterMap, me.MaximumWeights, VisitedNodes, CompletedTask);
                        }
                    }
                }

            }

        },

        S2M_AddToPredecessorCollection: function (PredTask, ParentTask, TaskPredMap) { //ByRef TaskPredMap
            var me = this;
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

        },

        S2M_AddToPredecessorCollection_ErrCheckText7: function (PredTask, oTasks, ConstraintUniqueId, TaskPredMap) { //ByRef TaskPredMap
            var me = this;
            try {
                // FIXME oTasks.uniqueId(ConstraintUniqueId) ????
                var matchingTask;
                $.each(oTasks, function (index, curTask) {
                    if (curTask.uid == ConstraintUniqueId) {
                        matchingTask = curTask;
                        return false;
                    }
                });
                me.S2M_AddToPredecessorCollection(PredTask, matchingTask, TaskPredMap);
            } catch (error) {
                //MsgBox(FormatParamString(MSG_INVALID_NEXTCR_TASK, CStr(PredTask.Id)), vbOKOnly, CONCERTO)
            }

        },

        S2M_AddToPredecessorCollection_ErrCheckText5: function (PredTask, oTasks, ConstraintUniqueId, TaskPredMap) { //ByRef TaskPredMap
            var me = this;
            try {
                // FIXME oTasks.uniqueId(ConstraintUniqueId) ????
                var matchingTask;
                $.each(oTasks, function (index, curTask) {
                    if (curTask.uid == ConstraintUniqueId) {
                        matchingTask = curTask;
                        return false;
                    }
                });
                me.S2M_AddToPredecessorCollection(PredTask, matchingTask, TaskPredMap);
            } catch (error) {
                //MsgBox(FormatParamString(MSG_INVALID_NEXTCR_TASK, CStr(PredTask.Id)), vbOKOnly, CONCERTO)
            }

        },

        S2M_MarkNumberOfParentsRecursive: function (ProjTask, ParentCounterMap, TasksTraversed, TaskType, TaskPredMap) { //ByRef TaskPredMap
            var me = this;
            var TaskPredecessors = {};
            TaskPredecessors = TaskPredMap[ProjTask.uid];

            if (TasksTraversed[ProjTask.uid] == undefined) //!TasksTraversed[ProjTask.uid] ||
            {
                var CurChildTask;
                $.each(TaskPredecessors, function (index, CurChildTask) {
                    me.S2M_IncrementCounter(CurChildTask, me.ParentCounterMap);
                    me.S2M_MarkNumberOfParentsRecursive(CurChildTask, me.ParentCounterMap, TasksTraversed, TaskType, TaskPredMap);
                });
                TasksTraversed[ProjTask.uid] = 1;
            }

        },

        S2M_IncrementCounter: function (ChildTask, CounterMap) {

            var nCounter = 0;
            nCounter = CounterMap[ChildTask.uid];

            if (nCounter != undefined) {
                delete CounterMap[ChildTask.uid];
                CounterMap[ChildTask.uid] = nCounter + 1;
            } else {
                CounterMap[ChildTask.uid] = 1;
            }

        },

        S2M_MarkTask: function (ProjTask) {
            var me = this;
            ProjTask.Flag17 = true;
            ProjTask.Flag18 = true;

            me.tasksToBeHighlighted.push(ProjTask);
        },

        GetRemDuration: function (selTask) {
            var me = this;
            var FKDUR = "FKCD";
            var remDuration = 0;
            var i = 0;
            var nDurInSecs = 0;
            var aText22Components = null;
            var aDurationFk = [];
            var str = null;
            var sText22;
            var bFound = false;

            if (me.S2M_IsFullKitTask(selTask)) {
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
            } else if (me.S2M_IsBuffer(selTask)) {
                remDuration = 0;
            } else {
                if (selTask.remainingDuration != undefined)
                    remDuration = selTask.remainingDuration;
            }
            return parseInt(remDuration);
        },

        S2M_IsFullKitTask: function (task) {
            var FULLKIT_TASK_VAL = 2;
            var isFullKit = false;
            if (task.text1 == 2)
                isFullKit = true;
            return isFullKit;
        },

        S2M_IsBuffer: function (CurChildTask) {
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
        },

        getAvailableResourceOptions: function () {
            // TODO maybe cache this transformed result; project is already caching its results
            this.cachedAvailableResourceOptions = this.project.getAvailableResources().map(function (res) {
                return {
                    id: res.uid,
                    text: res.Name
                };
            });
            this.cachedResourcesById = this.project.getAvailableResourcesByUid();
            return this.cachedAvailableResourceOptions;
        },

        updateResourceHighlightMenu: function ($menu, view) {
            var resources = view.getAvailableResourceOptions(),
                i = 1;
            $menu.empty();
            $menu.append($([
                '<div class="tool-item" data-cmd="toggle-all-resource-highlight">',
                '<label>',
                '<input type="checkbox" /> <span class="resource-name">All</span>',
                '</label>',
                '</div>'
            ].join("")));
            resources.forEach(function (resource) {
                var $menuItem = $([
                    '<div class="tool-item" data-cmd="toggle-resource-highlight">',
                    '<label>',
                    '<div class="resource-swatch resource-highlight-background-',
                    String(i++), '"></div>',
                    '<input type="checkbox" /> <span class="resource-name"></span>',
                    '</label>',
                    '</div>'
                ].join(""));
                if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_RESOURCES + 1))
                    i = 1;
                $menuItem.find(".resource-name").text(resource.text);
                $menuItem.data("resource-id", resource.id);
                $menu.append($menuItem);
            });
            view.addPopupMenuHandlers($menu);
            view.resourceHighlightMenuIsCurrent = true;
        },
        updatePhaseHighlightMenu: function ($menu, view) {
            var phases = view.project.phases,
                i = 1;
            $menu.empty();
            $menu.append($([
                '<div class="tool-item" data-cmd="toggle-all-phase-highlight">',
                '<label>',
                '<input type="checkbox" /> <span class="phase-name">All</span>',
                '</label>',
                '</div>'
            ].join("")));
            phases.forEach(function (phase) {
                if (phase.type == "normal") {
                    var $menuItem = $([
                        '<div class="tool-item" data-cmd="toggle-phase-highlight">',
                        '<label>',
                        '<div class="phase-swatch phase-highlight-background-',
                        String(i++), '"></div>',
                        '<input type="checkbox" /> <span class="phase-name"></span>',
                        '</label>',
                        '</div>'
                    ].join(""));
                    if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_PHASES + 1))
                        i = 1;
                    $menuItem.find(".phase-name").text(phase.name);
                    $menuItem.data("phase-id", phase.uid);
                    $menu.append($menuItem);
                }
            });
            view.addPopupMenuHandlers($menu);
            stl.app.phaseHighlightMenuIsCurrent = true;
        },
        updatePhaseNameInHighlightMenu: function (phase) {
            var colorMap = this.project.getPhaseColorMap();
            var phaseColorId = colorMap[phase.uid];
            var toolItem = $(".highlight-phases-popup .tool-item:eq(" + (phaseColorId - 1) + ")").find('.phase-name').text(phase.name);
        },
        updateTaskManagerHighlightMenu: function ($menu, view) {
            var taskManagers = stl.app.availablePeopleAndTeams,
                i = 1;
            $menu.empty();
            $menu.append($([
                '<div class="tool-item" data-cmd="toggle-all-task-manager-highlight">',
                '<label>',
                '<input type="checkbox" /> <span class="task-manager-name">All</span>',
                '</label>',
                '</div>'
            ].join("")));
            taskManagers.forEach(function (manager) {
                var $menuItem = $([
                    '<div class="tool-item" data-cmd="toggle-task-manager-highlight">',
                    '<label>',
                    '<div class="task-manager-swatch task-manager-highlight-background-',
                    String(i++), '"></div>',
                    '<input type="checkbox" /> <span class="task-manager-name"></span>',
                    '</label>',
                    '</div>'
                ].join(""));
                if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_TASK_MANAGERS + 1))
                    i = 1;
                $menuItem.find(".task-manager-name").text(manager.FullName);
                $menuItem.data("task-manager-id", manager.Name);
                $menu.append($menuItem);
            });
            view.addPopupMenuHandlers($menu);
            view.taskManagerHighlightMenuIsCurrent = true;
        },
        updateChainsHighlightMenu: function ($menu, view) {
            var allChainIdsSorted = this.project.getAllChainIds().sort(function (a, b) {
                return a - b
            });
            var chainsColorMap = stl.app.ProjectDataFromServer.getChainsColorMap();
            $menu.empty();
            $menu.append($([
                '<div class="tool-item" data-cmd="toggle-all-chains-highlight">',
                '<label>',
                '<input type="checkbox" /> <span class="chain-number">All</span>',
                '</label>',
                '</div>'
            ].join("")));
            allChainIdsSorted.forEach(function (chainId) {
                var $menuItem = $([
                    '<div class="tool-item" data-cmd="toggle-chain-highlight">',
                    '<label>',
                    '<div class="chain-swatch chain-highlight-background-',
                    String(chainsColorMap[chainId].colorId), '"></div>',
                    '<input type="checkbox" /> <span class="chain-number"></span>',
                    '</label>',
                    '</div>'
                ].join(""));
                $menuItem.find(".chain-number").text(chainId);
                $menuItem.find("input[type=checkbox]").attr('checked', chainsColorMap[chainId].isChecked);
                $menuItem.data("chain-id", chainId);
                $menu.append($menuItem);
            });
            view.addPopupMenuHandlers($menu);
            view.chainsHighlightMenuIsCurrent = true;
        },
        addRowHeaderMenuListeners: function () {
            $(".tree-column .dropdown-menu-caret").on("click", function (evt) {
                var $cell = $(evt.target).closest(".tree-column"),
                    $menu = $cell.find(".tool-popup"),
                    showing = $menu.is(":visible");
                $(".tool-popup").hide();
                if (!showing) {
                    $menu.show();
                    evt.stopPropagation();
                }
            });
        },

        getTaskById: function (id) {
            var taskView = this.tasksByUid[id];
            if (taskView) {
                return taskView.task;
            }
            return null;
        },
        getMSById: function (id) {
            var taskView = this.milestoneElementsById[id];
            if (taskView) {
                return $(taskView).data("model");
            }
            return null;
        },
        refreshChecklistIcon: function ($task, task) {
            $task.find(".task-checklist-icon").removeClass("none incomplete complete")
                .addClass(this.project.getChecklistStatus(task.checklistStatus));
            $task.data("model").checklistStatus = task.checklistStatus;
        },
        onTaskChange: function (evt, sender, task, indexToDeleteSubtask) {
            var $task;
            if (this.tasksByUid[task.uid])
                $task = this.tasksByUid[task.uid].$el;
            else
                $task = this.milestoneElementsById[task.uid];
            var taskView = $task.data('view');
            if (sender === this) return;

            taskView.load(task, null, sender);
            this.refreshChecklistIcon($task, task);
            //unused variables, so commenting out - VK
            /* var $row = $task.closest(".matrix-view-row"),
            uiRowId = $row.data("model").uid,
            uiPhaseIndex = $row.find(".phase-column").index($task.closest(".phase-column"));*/

            if (indexToDeleteSubtask != undefined) {
                //delete subtask
                var $li = $task.find(".subtask").eq(indexToDeleteSubtask).remove();
                taskView.saveSubtasks($task);
            }

            this.refreshLinks();
            // TODO originator of the change should update the project model, not matrix view
            stl.app.triggerSave();
        },

        onTaskChangeAtPhaseLevel: function (evt, sender, tasks) {
            var me = this;
            _.each(tasks, function (task, idx) {
                if (task.isSummary) return;
                if (me.tasksByUid[task.uid])
                    $task = me.tasksByUid[task.uid].$el;
                else
                    $task = me.milestoneElementsById[task.uid];
                var taskView = $task.data('view');

                taskView.load(task, null, sender);


            });
            //this.refreshLinks();
            stl.app.triggerSave();
        },

        onUpdateResourcesDeleted: function (evt, sender, tasks) {
            var me = this;
            _.each(tasks, function (task, idx) {
                if (task.isSummary) return;
                if (me.tasksByUid[task.uid])
                    $task = me.tasksByUid[task.uid].$el;
                else
                    $task = me.milestoneElementsById[task.uid];
                var taskView = $task.data('view');

                taskView.load(task, null, sender);


            });
            //this.refreshLinks();
            stl.app.triggerSave();
        },



        onTaskAdd: function(evt, sender, task, parentRow, phase, row, prevTaskId, nextTaskId) {
            this.resetPhaseLinksAllowedWithAddDeleteTask(phase);
            if (sender === this) return;
            var $row = this.rowsById[row.uid];
            var $prevTask, $nextTask, $cell;
            if (prevTaskId) {
                if (this.tasksByUid[prevTaskId])
                    $prevTask = this.tasksByUid[prevTaskId].$el;
                else
                    $prevTask = this.milestoneElementsById[prevTaskId];
                if ($prevTask) {
                    $cell = $($prevTask).closest(".phase-column");
                } 
            }
            if(!$cell && nextTaskId) {
                    if (this.tasksByUid[nextTaskId])
                        $nextTask = this.tasksByUid[nextTaskId].$el;
                    else
                        $nextTask = this.milestoneElementsById[nextTaskId];
                    if ($nextTask) {
                        $cell = $($nextTask).closest(".phase-column");
                }
            } 

            if(!$cell ){
                $cell = $($row.find(".phase-column")[phase.order]);
            }
            if ($prevTask)
                var taskView = this.addEmptyTaskMSUI("task", 1, phase, $cell,
                    $prevTask, null, null);
            else if ($nextTask)
                var taskView = this.addEmptyTaskMSUI("task", 2, phase, $cell,
                    null, $nextTask, null);
            else
                var taskView = this.addEmptyTaskMSUI("task", 0, phase, $cell,
                    null, null, null);
            var $task = taskView.$el;
            taskView.load(task);
            this.tasksByUid[task.uid] = taskView;
            this.saveRow($row);
            this.linksView.addLinkIds($task);
            this.linksView.addElements($task);
            if (sender.xtype != "undoStackManager") {
                this.generateAutoLinksForTask($task, phase);
            } else {
                this.project.deleteInvalidLinksForTaskAdd(task);
                this.project.generateLinksFromPredSuccIds(task);
            }

            //When a task is added from the tabular view, programatically added task in the matrix view remains open. To close it automatically, added following steps.
            $task.hide().fadeIn();
            this.setZoomLevel(this.zoomLevel);
            this.refreshLinks();
            this.scrollIntoView($task);
        },

        onMilestoneAdd: function(evt, sender, ms, scope, phase, row, prevTaskId, nextTaskId) {
            if (sender === this) return;
            var $row = this.rowsById[row.uid];
            var $prevTask, $nextTask, $cell;
            if (prevTaskId) {
                if (this.tasksByUid[prevTaskId])
                    $prevTask = this.tasksByUid[prevTaskId].$el;
                else
                    $prevTask = this.milestoneElementsById[prevTaskId];
                if ($prevTask) {
                    $cell = $($prevTask).closest(".phase-column");
                }
            } 
            if (!$cell && nextTaskId) {
                if (this.tasksByUid[nextTaskId])
                    $nextTask = this.tasksByUid[nextTaskId].$el;
                else
                    $nextTask = this.milestoneElementsById[nextTaskId];
                if ($nextTask) {
                    $cell = $($nextTask).closest(".phase-column");
                }
            } 
            if(!$cell) {
                $cell = $($row.find(".phase-column")[phase.order]);
            }

            if ($prevTask)
                var taskView = this.addEmptyTaskMSUI("ms", 1, phase, $cell,
                $prevTask, null, null);
            else if ($nextTask)
                var taskView = this.addEmptyTaskMSUI("ms", 2, phase, $cell,
                    null, $nextTask, null);
            else
                var taskView = this.addEmptyTaskMSUI("ms", 0, phase, $cell,
                    null, null, null);
            var $task = taskView.$el;
            taskView.load(ms);
            this.renderMilestone($task, $cell, phase);
            if (ms.taskType === PE_SHORT)
                $row.addClass("has-PE");
            this.saveRow($row);

            if (sender.xtype != "undoStackManager") {
                this.generateAutoLinksForMilestone($task, phase);
            } else {
                this.project.generateLinksFromPredSuccIds(ms);
            }
            //When a task is added from the tabular view, programatically added task in the matrix view remains open. To close it automatically, added following steps.
            this.setZoomLevel(this.zoomLevel);
            this.refreshLinks();
            this.scrollIntoView($task);
            if (ms.taskType === PE_SHORT) {
                stl.app.ProjectDataFromServer._projectEndMs = ms;
            }

        },


        onExpandAllScopeNodes: function () {
            var panel = Ext.getCmp("scopeItemTree");
            panel.expandAll();
        },

        onExpandScopeNode: function (evt, sender, rowUid) {
            if (sender === this) return;

            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            var node = this.findChildRecursively(tree, "rowUid", rowUid);
            if (node) {
                if (!node.get("expanded")) {
                    node.expand(false);
                }
            }

        },

        onTaskMultiSelect: function (evt, sender, task) {
            this.multipleSelectedTasks = this.multipleSelectedTasks ? this.multipleSelectedTasks : {};
            if (!this.multipleSelectedTasks[task.uid]){
                this.multipleSelectedTasks[task.uid] = task;
                this.onSelectionHighlight(sender, task.id);
            } else {
                this.removeSelectionHighlight(sender, task.id);
                delete this.multipleSelectedTasks[task.uid];   
            }
            var keys = Object.keys(this.multipleSelectedTasks);
            var selectedTaskTypeMap = {
                "FK": 0,
                "NORMAL":0,
                "MS":0
            };
            _.each(keys, function(key){
                var task = stl.app.matrixView.multipleSelectedTasks[key];
                if (task.taskType == STRING_NORMAL){
                    selectedTaskTypeMap["NORMAL"]++;
                } else if (task.taskType == TASKTYPE_FULLKIT){
                    selectedTaskTypeMap["FK"]++;
                } else if (task.taskType == IMS_SHORT || task.taskType == CMS_SHORT){
                    selectedTaskTypeMap["MS"]++;
                }

            });

            $(".matrix-view-viewport").removeClass("FKSELECTED");
            $(".matrix-view-viewport").removeClass("NORMALSELECTED");
            $(".matrix-view-viewport").removeClass("MSSELECTED");

            if (selectedTaskTypeMap["FK"] > 0){
                $(".matrix-view-viewport").addClass("FKSELECTED");

            } 
            if (selectedTaskTypeMap["NORMAL"]>0){
                $(".matrix-view-viewport").addClass("NORMALSELECTED");
            }
            if (selectedTaskTypeMap["MS"] > 0){
                $(".matrix-view-viewport").addClass("MSSELECTED");
            }
            var taskElement = this.getTaskOrMilestoneLinkTargetElementByUid(task.uid);

            $(document).trigger("taskselection",[this, taskElement]);
            

        },

        onTaskMultiSelectEnd: function () {
            this.multipleSelectedTasks = null;
             
            if (stl.app.matrixView.TasksCut){
                $(document).trigger("taskCutEnd");
            }
            if (stl.app.matrixView.TasksCopied){
                $(document).trigger("taskCopyEnd");
            }
            stl.app.matrixView.TasksCut = false;
            stl.app.matrixView.TasksCopied = false;
            this.onRemoveSelectionHighlight();
            if (this.selectedTask){
                this.selectedTask.data("view").exitQuickEditMode();
                this.selectedTask = null;
                $(document).trigger("taskselectionchange", [this.selectedTask]);
            }
            
            stl.app.CreateTaskToolBar.selectDefaultTaskType();
            $(document).trigger("taskselection",[this, null]);

        },

        onTaskCutEnd: function (evt, sender, task) {
            this.onRemoveCutHighlight();
            $(".matrix-view-viewport").removeClass("readyToPaste");
        },

        onTaskCutStart: function (evt, sender, task) {
            if (!stl.app.matrixView.multipleSelectedTasks || Object.keys(stl.app.matrixView.multipleSelectedTasks).length == 0){
                PPI_Notifier.info(SELECT_TASKS_MSG, SELECT_TASKS_MSG);
                stl.app.CreateTaskToolBar.selectDefaultTaskType();
            } else {
                stl.app.matrixView.TasksCut = true;
                stl.app.matrixView.TasksCopied = false;
                this.onAddCutHighlight();
                $(".matrix-view-viewport").addClass("readyToPaste");
            }


        },

        onTaskCopyStart: function (evt, sender, task) {
            if (!stl.app.matrixView.multipleSelectedTasks || Object.keys(stl.app.matrixView.multipleSelectedTasks).length == 0){
                PPI_Notifier.info(SELECT_TASKS_MSG, SELECT_TASKS_MSG);
                stl.app.CreateTaskToolBar.selectDefaultTaskType();
            } else {
                stl.app.matrixView.TasksCopied = true;
                if (stl.app.matrixView.TasksCut){
                    stl.app.matrixView.TasksCut = false;
                    stl.app.matrixView.onRemoveCutHighlight();
                }
                $(".matrix-view-viewport").addClass("readyToPaste");
                
            }

        },

        onTaskCopyEnd: function (evt, sender, task) {
            $(".matrix-view-viewport").removeClass("readyToPaste");
        },

        onMultipleTaskDelete: function (evt, sender, task) {
            if (!stl.app.matrixView.multipleSelectedTasks || Object.keys(stl.app.matrixView.multipleSelectedTasks).length == 0){
                PPI_Notifier.info(SELECT_TASKS_MSG, SELECT_TASKS_MSG);
                stl.app.CreateTaskToolBar.selectDefaultTaskType();
                return;
            } 
            var keys = Object.keys(stl.app.matrixView.multipleSelectedTasks);
            if (this.selectedTask){
                this.selectedTask.data("view").exitQuickEditMode();
                this.selectedTask = null;
                $(document).trigger("taskselectionchange", [this.selectedTask]);
            }

            var tasksUndoRedoParamsArray = [];
            this.fillTasksUndoRedoParamsArray(stl.app.matrixView.multipleSelectedTasks, tasksUndoRedoParamsArray);
            stl.app.undoStackMgr.pushToUndoStackForMultiTaskDelete(stl.app.matrixView.project, tasksUndoRedoParamsArray);

            _.each(keys, function(key){
                var task = stl.app.matrixView.multipleSelectedTasks[key];
                if (task.isMS){
                    stl.app.ProjectDataFromServer.deleteMilestone(stl.app.matrixView, task.uid);
                } else 
                    $(document).trigger("taskremove",[stl.app.matrixView, task, task.rowId, task.phaseId, null])
                delete stl.app.ProjectDataFromServer._tasksAndMilestonesByUid[task.uid]; 
            });
            
            $(document).trigger("taskMultiSelectEnd");
            stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            this.refreshLinks();
            
        },

        fillTasksUndoRedoParamsArray: function(selectedTask, tasksUndoParamsArray){
            var matrixView = this;
            var keys = Object.keys(selectedTask);
            _.each(keys, function(key){
                var task = selectedTask[key];
                var $row = matrixView.rowsById[task.rowId];
                var row = $row.data("model");
                var scope = matrixView.project.getScopeItemByUid(row.scopeItemUid);
                var phase = matrixView.project.getPhaseById(task.phaseId);
                var immediateSiblingsUid   = matrixView.project.getImmediateSiblingsUids(task); 
                var taskDeleteUndoParams = { task : task, row : row, scope : scope, 
                    phase : phase, prevTaskUid : immediateSiblingsUid.prevTaskUid,
                    nextTaskUid:immediateSiblingsUid.nextTaskUid};

                     if (task.taskType === "PEMS" || task.taskType === "IPMS" || task.taskType === "buffer")
                        return;
                    tasksUndoParamsArray.push(taskDeleteUndoParams); 
                });
        },

        onPaste: function (e, sender, task) {
            e.stopPropagation();
            e.preventDefault();
                
            var cd = e.originalEvent.clipboardData;

            var data = cd.getData("text/plain");

            var rows = data.split("\n");

            var table = {};

            for (i = 0; i<rows.length; i++){
                var rowObj = {};
                var cells = rows[i].split("\t");
                for (j=0; j<cells.length; j++){
                    rowObj["PROPERTY" + j] = cells[j];
                }
                table["ROW" + i] = rowObj;
            }

            console.log(table);

        },

        onCollapseScopeNode: function (evt, sender, rowUid) {
            if (sender === this) return;

            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            var node = this.findChildRecursively(tree, "rowUid", rowUid);
            if (node.childNodes.length > 0 && node.get("expanded")) {
                node.collapse(false);
            }


        },



        onTaskRemove: function (evt, sender, task, parentRow_id, phase_id, popup) {
            var me = this;
            var colIndex = -1,
                $row = this.$view.find(".matrix-view-row").filter(function (index, row) {
                    var rowModel = $(row).data("model");
                    return rowModel && rowModel.uid === parentRow_id;
                }).first();
            this.$view.find(".matrix-view-row.header-row .phase-column").each(function (index, col) {
                var phaseModel = $(col).data("model");
                if (phaseModel && phaseModel.uid === phase_id) {
                    colIndex = index;
                    return;
                }
            });
            var $task = me.tasksByUid[task.uid].$el,
                $cell = $task.closest(".phase-column"),
                $allTasksInCell = $cell.find(".task, .milestone, .fk, .fullkit"),
                taskCount = $allTasksInCell.length,
                taskIndex = $allTasksInCell.index($task);

            // If tasks existed on both left and right of this task in same cell, auto-link them (they're now adjacent)
            if (taskIndex > 0 && taskIndex < taskCount - 1) {
                this.addAutoLink($allTasksInCell.eq(taskIndex - 1), $allTasksInCell.eq(taskIndex + 1));
            }
            // TODO if task was formerly first/last task in cell, the new first/last task may need to be auto-linked to other cells
            if ($cell.find(".task , .milestone, .fk, .fullkit").length === 1 && $cell.hasClass("has-task")) {
                $cell.removeClass("has-task");
            }

            // NOTE: This removes links for the task from the project model.  Matrix view is currently doing this work
            // on behalf of other views that delete tasks (table, timeline).  Ideally, removal of links should be done
            // automatically by the project model in response to a task deletion, possibly by the deleting view instructing
            // the project model to remove a task.
            this.removeLinksForTask(task.uid);
            me.tasksByUid[task.uid].modifyTaskColor(phase_id, taskCount);
            delete me.tasksByUid[task.uid];
            this.linksView.removeElement($task);
            $task.next('.task-spaceholder, .task-spaceholder-fk').remove();
            $task.remove();
            me.saveRow($row);
            me.refreshLinks();
            this.selectedTask = null;
            this.resetPhaseLinksAllowedWithAddDeleteTask($.grep(this.project.phases, function (phase) {
                return phase.uid == phase_id;
            })[0]);
        },

        /**
        * Removes a phase, including any tasks and milestones in the phase, and removes its column from the view.
        */
        deletePhase: function (index) {
            var phases = this.project.phases,
                phase = phases[index],
                phaseUid = phase.uid;

            // Remove any milestones from project
            for (var i = this.project._milestones.length - 1; i >= 0; i--) {
                var ms = this.project._milestones[i];
                if (ms.phaseId === phaseUid) {
                    this.deleteMilestone(ms.uid);
                }
            }

            var summaryTasksToBeMoved = this.getSummaryTasksFromPhase(phaseUid);

            // Remove tasks
            Object.keys(this.tasksByUid).forEach(function (taskUid) {
                var taskView = this.tasksByUid[taskUid];
                if (taskView.task.phaseId === phaseUid) {
                    var $task = taskView.$el;
                    this.deleteTask($task);
                }
            } .bind(this));
            // Deleting a fullkit phase, next phase no longer marked as "has fullkit"
            if (phase.type === "fullkit") {
                //If the next phase is deleted first and then if we try to delete fullkit phase, there is an exception thrown from the
                //following line, so checking if a phase exists, then mark hasFullkit of it as false - VK
                if (phases[index + 1])
                    phases[index + 1].hasFullkit = false;
                // delete phases[index + 1].hasFullkit;
            }
            // Remove the phase model
            var removed = phases.splice(index, 1);

            // Remove column from view
            if (phases.length != 0)
                this.$view.find(".matrix-view-row .phase-column:nth-child(" + (index + 1) + ")").remove();
            this.saveProject();

            this.moveSummaryTasksToDifferentPhase(summaryTasksToBeMoved);

            this.project.createPhaseScopeAndTaskCountMap();
            $(document).trigger("phaseremove", [
                this,
                removed,
                index
            ]);
            stl.app.phaseHighlightMenuIsCurrent = false;
            this.refreshLinks();
        },

        onBackgroundClick: function (evt) {
            $(".tool-popup").hide();
            var $clickedElem = [];
            if ($(evt.target).closest('.task').length != 0) {
                $clickedElem = $(evt.target).closest('.task');
            } else if ($(evt.target).closest('.ms').length != 0) {
                $clickedElem = $(evt.target).closest('.ms');
            } else if ($(evt.target).closest('.fk').length != 0) {
                $clickedElem = $(evt.target).closest('.fk');
            }


            // Close the open edit-task if they clicked outside any task or on a different task to edit it
            if (!this.checklistPopupOpen && this.isAnyTaskOpenForEdit($clickedElem)) {
                this.selectedTask.data("view").exitQuickEditMode();
            }
            
        },

        isAnyTaskOpenForEdit: function ($clickedElem) {
            var isDatePickerDisplayed = ($(".datepicker").css("display") == "block"); //if date picker is visible            
            if (this.selectedTask && ($clickedElem.length === 0 || !$clickedElem.is(this.selectedTask)) && !isDatePickerDisplayed) {
                if (this.selectedTask.hasClass("quick-task-edit")) {
                    return true;
                }
            }
        },

        onTaskEnterQuickEdit: function (evt) {
            var taskView = evt.target;
            if (this.selectedTask && this.selectedTask.hasClass("quick-task-edit")) {
                this.selectedTask.data("view").exitQuickEditMode();
            }
            this.selectedTask = taskView.$el;
            var eltID;
            if (taskView.task.isMS)
                eltID = this.selectedTask.find(".ms-content-wrap").data("linkable-element-id");
            else
                eltID = this.selectedTask.data("linkable-element-id");
            var $endPoint = this.linksView.endpointsByID[eltID + "-out"];
            if ($endPoint)
                $endPoint.hide();
            this.scrollIntoView(this.selectedTask);
            $(document).trigger("taskselectionchange", [this.selectedTask]);
            /* $(".mask-view").show();*/
            //this.onElementMoveComplete();
            // setTimeout(function () {
            //     this.scrollIntoView(taskView.$el);
            // } .bind(this), 50);
        },

        onTaskExitQuickEdit: function (evt) {
            this.selectedTask = null;
            $(document).trigger("taskselectionchange", [null]);
            evt.target.$el.find(".task-content-wrapper")
                .width(ZOOM_TASKWIDTHS[this.zoomLevel])
                .scrollTop(0);
            if (this.zoomLevel === ZOOMLEVEL.TASK_ZOOM_SMALL) {
                evt.target.$el.addClass("task-zoom-small");
            }
            /*$(".mask-view").hide();*/
            //this.linksView.refreshLinksForOneTask(evt.target.$el);
        },

        onMSExitQuickEdit: function (evt) {
            var msView = evt.target;
            msView.$el.closest(".ms").find(".task-content-wrapper").hide();
            msView.$el.closest(".milestone").find(".ms-icon").show();
            this.onTaskExitQuickEdit(evt);
        },

        onMSEnterQuickEdit: function (evt) {
            var msView = evt.target;
            msView.$el.closest(".ms").find(".task-content-wrapper").show();
            msView.$el.closest(".milestone").find(".ms-icon").hide();
            this.onTaskEnterQuickEdit(evt);
        },

        onMaskViewClick: function (evt) {
            //asuumes only one task will be zoomed in at one point
            this.$view.find(".task-zoom-normal .task-magnify-button").trigger("click");
            this.triggerSave();
        },

        onTaskAlignOptionClick: function (evt) {
            var $btn = $(evt.target);
            if ($btn.hasClass("pressed")) return;
            $(".matrix-view-task-alignment .task-align-option").removeClass("pressed");
            $btn.addClass("pressed");
            this.$view.removeClass("task-align-left task-align-right");
            this.$view.addClass("task-align-" + $btn.data("alignment"));
            this.refreshLinks();
        },

        addPlaceholderRow: function () {
            if (this.readOnly) return;
            var $beforeEl = this.$view.find(".matrix-view-end-marker").last(),
                dummyRow = {
                    id: "dummy",
                    uid: "dummy",
                    tasks: {}
                };
            var $row = this.renderRow(dummyRow, this.project.phases, $beforeEl, 0),
                $nameInput = $('<input placeholder="New WBS item..." type="text" />'),
                $leftCell = this.$leftColContainer.find(".tree-column").eq(this.$view.find(".matrix-view-row").index($row));
            $leftCell.addClass("row-placeholder")
                .append($nameInput);
            $row.addClass("row-placeholder");
            $nameInput.on("blur", this.onRowPlaceholderNameEdit.bind(this));
            $nameInput.on("keypress", function (evt) {
                if (evt.which === 13) {
                    evt.preventDefault();
                    var $input = $(evt.target),
                        $row = $input.closest(".tree-column");
                    $input.blur();
                    $row.next().find("input").focus();
                }
            });
        },

        onRowPlaceholderNameEdit: function (evt) {
            var val = $(evt.target).val();
            if (val !== '') {
                this.convertRowPlaceholderToRow();
            }
        },

        /**
        * When an action is taken that adds data into the placeholder row, turn it into
        * a real row, save it, and generate a new placeholder row below.  Example
        * actions: editing the row label to a non-empty value, adding a task into
        * a phase cell.
        *
        */
        convertRowPlaceholderToRow: function (siblingScopeUid, siblingRowUid) {
            var $row = this.$view.find(".matrix-view-row.row-placeholder");
            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            var siblingNode = this.findChildRecursively(tree, "rowUid", siblingRowUid);
            var parentScope;
            var rowModel = this.rowsById[siblingRowUid].data("model");
            if (!this.project.isProjectComplex()) {
                parentScope = siblingNode;
            } else {
                if (!this.project.getSummaryTaskFromRow(rowModel)) {
                    parentScope = siblingNode;
                } else {
                    parentScope = siblingNode.parentNode;
                }
            }
            var parentScopeUid;
            if (parentScope.get("data")) {
                parentScopeUid = parentScope.get("data").scopeItemUid;
            } else {
                parentScopeUid = "";
            }

            var name = "",
                row = this.project.createRow(parentScopeUid, name, siblingNode.get("data").outlineLevel);

            row.name = name;
            this.addNodeToScopeItemTree(siblingNode, row, $row, 2);
            $row.attr("scopeItemUid", parentScopeUid);
            $row.attr("rowUid", row.uid);
            $row.data("model", row);
            //            $fixedCell.find(".scope-item-label")
            //                .text(name)
            //                .css("color", "rgb(85, 85, 85)"); // Not sure why we have to do this, but color is getting left as transparent otherwise - something to do with sl.editable
            //            if (name && name != "")
            //                $fixedCell.addClass("has-scopename");
            $row.removeClass("row-placeholder");
            //$fixedCell.removeClass("row-placeholder");
            this.rowsById[row.uid] = $row;
            this.saveRow($row);
            this.saveProject();
            this.addPlaceholderRow();

            /*$(document).trigger("rowadd", [
            this,
            row,
            this.$view.find(".matrix-view-row:not(.header-row)").index($row),
            this.project.phases,
            3,
            "root"
            //summaryTask
            ]);*/
            $(document).trigger("rowadd", [
                this,
                row,
                this.project.phases,
                INSERT_ROW_BELOW,
                siblingNode,
                null
            ]);
            this.syncRowHeights();
        },


        findChildRecursively: function (tree, attribute, value) {
            var cs = tree.childNodes;
            for (var i = 0, len = cs.length; i < len; i++) {
                if (cs[i].getData()[attribute] == value) {
                    return cs[i];
                }
                else {
                    // Find it in this tree 
                    if (found = this.findChildRecursively(cs[i], attribute, value)) {
                        return found;
                    }
                }
            }
            return null;
        },





        // TODO remove projectName & divisionId params
        init: function (newProject, projectName, divisionId, projectAttributes) {

            console.log('Method called matrix view - init');
            var me = this;
            me.$matrixRowTemplate = $("#templates div[role=row-template]");
            me.$cellTemplate = $("#templates div[role=phase-column-cell]");
            me.$matrixViewTemplate = $("#templates div[role=matrix-view-template]");
            this.matrixViewId = String(matrixViewId++);
            this.$view = me.$matrixViewTemplate.clone(true).removeAttr("role");
            this.tasksByUid = {};
            this.milestones = {}; //SS : Remove-collection is not being populated anywhere-its unused 
            this.taskById = {};
            this.rowsById = {};
            this.milestoneElementsById = {};
            this.onElementMoveCompleteDelegate = Ext.Function.createBuffered(this.onElementMoveComplete, 50, this);
            this.setReadOnly(this.readOnly, true);

            // TODO document this
            $("#templates *").off().removeData();
            this.$view.empty().off().append('<div class="matrix-view-viewport" />');
            this.$view.find(".matrix-view-viewport").append($("#templates div[role=matrix-view-inner-template]").clone(true));
            // It's important to append to the DOM early here so initFixedRegions() can measure properly
            this.$container.append(this.$view);

            //synchronize scrolls of left and right panel
            $(".matrix-view-viewport").off("scroll").on("scroll", function () {
                var self = $(this);
                var fixedColumnViewport = $('.matrix-view-fixed-column-viewport');
                if (!this.isHeightAdjusted && (self.prop("scrollWidth") > self.width())) {
                    var adjustedHeight = parseInt(fixedColumnViewport.css("padding-bottom")) + 17; // 17 is to compensate for height mismatch caused by horizontal scrollbar.
                    this.isHeightAdjusted = true;
                    fixedColumnViewport.css("padding-bottom", adjustedHeight);
                }
                fixedColumnViewport.scrollTop(self.scrollTop());
            });
            // TODO resize on container's Ext resize event
            var extContainer = Ext.getCmp(this.$container[0].id);
            if (extContainer) {
                extContainer.on("resize", this.onContainerResize.bind(this));
            }
            if(stl.app.loadByTemplating) this.wireTaskEvents();
            this.wireRowEditEvents();
            this.addPopupMenuHandlers();
            this.addRowHeaderMenuListeners();
            this.initFixedRegions();

            this.backgroundClickDelegate = this.onBackgroundClick.bind(this);
            $(document.body).on("click", this.backgroundClickDelegate);
            $(".mask-view").off('click').on("click", this.onMaskViewClick.bind(this));
            $(".matrix-view-row:not(.header-row) .phase-column").on("click", this.onCellClick.bind(this));
            $(".matrix-view-row.header-row .phase-column .phase-name").on("sl.edit", function (evt) {
                var phase = $(evt.target).closest(".phase-column").data("model"),
                    phases = this.$view.data("model").phases,
                    index = phases.indexOf(phase);
                me.savePhases();
                me.project.resetTaskCountInPhaseScopeMap(true /*isPhase*/, phase.uid);
                // Update names of any tasks in this phase that are using default naming
                var $tasksWithDefaultNames = this.$view.find(".matrix-view-row .phase-column:nth-child(" + (index + 1) + ") .task.has-default-name");
                $tasksWithDefaultNames.each(function (index, taskEl) {
                    var $task = $(taskEl),
                        task = $task.data("model"),
                        rowModel = $task.closest(".matrix-view-row").data("model"),
                        scope = me.project.getScopeItemByUid(rowModel.scopeItemUid);
                    // TODO TaskView should expose a setName method
                    task.name = me.project.getDefaultTaskName(phase, scope, task.taskType);
                    me.project.incrementTaskCountInPhaseScopeMap(phase.uid + '.' + scope.uid);
                    $task.find(".task-name input").val(task.name);
                    $task.data("linkable-element-name", task.name);
                    $task.data("view").setTooltip(task);
                    //$task.data("view").save();
                });
                me.saveProject();
                me.updatePhaseNameInHighlightMenu(phase);
                $(document).trigger("phasechange", [
                    me,
                    phase,
                    index
                ]);
            } .bind(this));

            /*$(".subtasks li .subtask-checklist-icon").on("click", function (evt) {
                me.showChecklistPopupForSubtask($(evt.target).closest("li"));
                evt.stopPropagation();
            });*/
            //moved task checklist icon handler to task-view.js as they need to binded irrespective of whether the matrix view is loaded
            $(".milestone .task-properties .task-checklist-icon").on("click", function (evt) {
                var taskElem;
                if ($(evt.target).closest(".fk").length > 0) {
                    taskElem = $(evt.target).closest(".fk");
                } else {
                    taskElem = $(evt.target).closest(".task").length == 0 ? $(evt.target).closest(".ms") : $(evt.target).closest(".task");
                }
                me.showChecklistPopupForTask($(taskElem));
                evt.stopPropagation();
            });

            $(".task-placeholder").on("click", this.onNewTaskPlaceholderClickDelegate.bind(this));

            $(".phase-column:not(.has-task)").each(function (index, elt) {
                elt.addEventListener('dragover', me.handleDragover.bind(me), false);
                elt.addEventListener('dragenter', me.handleDragenter.bind(me), false);
                elt.addEventListener('dragleave', me.handleDragleave.bind(me), false);
                elt.addEventListener('drop', me.handleDrop.bind(me), false);
            });

            $(".matrix-view-task-alignment .task-align-option").off().on("click", this.onTaskAlignOptionClick.bind(this));

            // ---------------------------
            // TODO move zoom controls out to header view
            $(".zoom-button.zoom-in").off().on("click", function (evt) {
                $(document).trigger("zoomin");
            });
            $(".zoom-button.zoom-out").off().on("click", function (evt) {
                $(document).trigger("zoomout");
            });
            $(".zoom-button.zoom-in").addClass("disabled");
            // FIXME belongs at global level (application level)
            this.addGlobalListener("viewchange", function (evt, newViewId) {
                // todo stop using global vars after encapsulating matrix view
                var oldViewId = window.currentViewId;
                window.currentViewId = newViewId;
                if (newViewId === "table") {
                    $(".zoom-controls").hide();
                } else {
                    $(".zoom-controls").show();
                }
                if (newViewId === "matrix") {
                    this.refreshLinks();
                    this.syncColumnWidths();
                }
                if (newViewId === "timeline" || newViewId === "chainview"){
                    if(stl.app.isChainViewLoaded && newViewId === "chainview"){
                        //Ext.getCmp("chainview").requestReschedule();
                    }
                    else{
                        //Ext.getCmp("timelineview").requestReschedule();
                    }
                }
                //toggle the grid twice to show arrow icon for longest path instead of checkbox
                if(!Ext.getCmp('CCSummarygrid').isHidden()){
                    Ext.getCmp('CCSummarygrid').setVisible(false);
                    Ext.getCmp('CCSummarygrid').setVisible(true);
                }
            } .bind(this));
            window.currentViewId = "matrix";
            // -- /end app header code

            this.addGlobalListener("zoomin", function (evt) {
                if (window.currentViewId !== "matrix") return;
                var currentLevel = Number(me.$view.data("zoom-level"));
                if (currentLevel < Object.keys(ZOOMLEVEL).length - 1) {
                    me.setZoomLevel(currentLevel + 1, currentLevel);
                }
            });

            this.addGlobalListener("zoomout", function (evt) {
                if (window.currentViewId !== "matrix") return;
                var currentLevel = Number(me.$view.data("zoom-level"));
                if (currentLevel > 0) {
                    me.setZoomLevel(currentLevel - 1, currentLevel);
                } else if (currentLevel === 0 && me.extraZoomOutEnabled) {
                    me.setZoomLevel(0, currentLevel, true);
                }
            });
            // ---------------------------
            this.addGlobalListener("taskChangeAtPhaseLevel", this.onTaskChangeAtPhaseLevel.bind(this)); //updateResourcesDeleted
            this.addGlobalListener("updateResourcesDeleted", this.onUpdateResourcesDeleted.bind(this));
            this.addGlobalListener("taskchange", this.onTaskChange.bind(this));
            this.addGlobalListener("taskadd", this.onTaskAdd.bind(this));
            this.addGlobalListener("summaryTaskAdd", this.onSummaryTaskAdd.bind(this));
            this.addGlobalListener("summaryTaskRemove", this.onSummaryTaskRemove.bind(this));
            this.addGlobalListener("summaryTaskDateChanged", this.onSummaryTaskDatesChanged.bind(this));
            this.addGlobalListener("taskremove", this.onTaskRemove.bind(this));
            this.addGlobalListener("phaseadd", this.onPhaseAdd.bind(this));
            this.addGlobalListener("phaseremove", this.onPhaseRemove.bind(this));
            this.addGlobalListener("phasechange", this.onPhaseChange.bind(this));
            this.addGlobalListener("rowremove", this.onRowRemove.bind(this));
            this.addGlobalListener("rowadd", this.onRowAdd.bind(this));
            this.addGlobalListener("rowchange", this.onRowChange.bind(this));
            this.addGlobalListener("scopenamechange", this.onScopeNameChange.bind(this));
            this.addGlobalListener("milestoneupdate", this.onMilestoneInfoChange.bind(this));
            this.addGlobalListener("projectload", this.onProjectLoaded.bind(this));
            this.addGlobalListener("highlightcctasks", this.onHighlightCCTasks.bind(this));
            this.addGlobalListener("highlightPenChain", this.onHighlightPenChain.bind(this));
            this.addGlobalListener("allhighlightscleared", this.onAllHighlightsCleared.bind(this));
            this.addGlobalListener("errorHighlight", this.onErrorHighlight.bind(this));
            this.addGlobalListener("errorHighlightWithUID", this.onErrorHighlightUsingUID.bind(this));
            this.addGlobalListener("highlightResourceContention", this.onHighlightResourceContention.bind(this));
            this.addGlobalListener("highlightSlack", this.onHighlightSlack.bind(this));
            this.addGlobalListener("highlight-milestone", this.onHighlightMilestone.bind(this));
            this.addGlobalListener("togglelinks", this.onToggleLinks.bind(this));
            this.addGlobalListener("milestoneadd", this.onMilestoneAdd.bind(this));
            this.addGlobalListener("removeBufferTaskAndPEMS", this.removeBufferTaskAndPEMS.bind(this));
            this.addGlobalListener("removeBufferTaskAndIPMS", this.removeBufferTaskAndIPMS.bind(this));

            this.addGlobalListener("removeBufferTaskLinks", this.removeBufferTaskLinks.bind(this));
            this.addGlobalListener("acceptPlanClicked", this.onAcceptPlan.bind(this));
            this.addGlobalListener("expandAllScopeNodes", this.onExpandAllScopeNodes.bind(this));
            this.addGlobalListener("expandScopeNode", this.onExpandScopeNode.bind(this));
            this.addGlobalListener("collapseScopeNode", this.onCollapseScopeNode.bind(this));
            this.addGlobalListener("taskMultiSelect", this.onTaskMultiSelect.bind(this));
            this.addGlobalListener("taskMultiSelectEnd", this.onTaskMultiSelectEnd.bind(this));
            this.addGlobalListener("taskCutEnd", this.onTaskCutEnd.bind(this));
            this.addGlobalListener("taskCutStart", this.onTaskCutStart.bind(this));
            this.addGlobalListener("taskCopyStart", this.onTaskCopyStart.bind(this));
            this.addGlobalListener("taskCopyEnd", this.onTaskCopyEnd.bind(this));
            this.addGlobalListener("multipleTaskDelete", this.onMultipleTaskDelete.bind(this));
            this.addGlobalListener("milestoneremove", this.onMilestoneRemove.bind(this));

            

            // TODO this determination of new/load project should happen outside this view
            if (newProject && newProject === true) {
                stl.app.wireSpecialKeyBoardEvents();
                var model = stl.model.Project.createProject(projectName);
                model.name = projectName;
                model.division = divisionId;
                $(".page-header-top .page-header-center .title")[0].innerHTML = projectName;
                if (projectAttributes) {
                    model.dueDate = projectAttributes.duedate;
                    model.author = projectAttributes.portfolio;
                    model.category = projectAttributes.businessUnit;
                    model.subject = projectAttributes.customer;
                    model.manager = projectAttributes.manager;

                    model.attribute1 = projectAttributes.attribute1;
                    model.attribute2 = projectAttributes.attribute2;
                    model.attribute3 = projectAttributes.attribute3;
                    model.attribute4 = projectAttributes.attribute4;
                    model.attribute5 = projectAttributes.attribute5;
                    model.projectFileType = projectAttributes.projectFileType;
                    model.participants = projectAttributes.participants;
                }

                stl.app.setActiveView("matrix-view-btn");
                stl.app.populateDivisionPhases(divisionId);

                var CC_Settings = model.CC_Settings;
                CCSettingsStore.PopulateStore(CC_Settings);
                stl.app.setProjectDataFromServer(model);

                stl.app.loadResources(divisionId, function () {
                    stl.app.loadPeopleAndTeams(divisionId, function () {
                        stl.app.loadAvailableCalendars(divisionId, function () {
                            stl.app.ProjectDataFromServer.projectCalendarName = stl.app.defaultCalendarName;
                            // TODO LoadCalendarData should be encapsulated as an app method
                            LoadCalendarData(divisionId, stl.app.ProjectDataFromServer.projectCalendarName, function () {
                                stl.app.ProjectDataFromServer.initializeCalendarData();
                                CalendarStore.PopulateStore(stl.app.getCalendarSettingsData());
                                stl.model.Project.InitializeNewProject(model);
                                stl.app.ProjectDataFromServer.updateGlobalMaxUnitsOfGlobalResourcesAssignedToProject();
                                stl.app.ProjectDataFromServer.updateResourceSheet();
                                //SS fix this : Should be intialized in different way
                                model._milestones[0].date1 = projectAttributes.duedate;
                                me.loadProject(model);
                                stl.app.updateMilestoneSheet();
                                if (!model.viewOnlyMode) //dont want ot save projects in Read only mode
                                    stl.app.save(stl.app.ProcessTypeEnum.AUTOSAVE);
                            });
                        });
                    });
                });
            } else {
                // this.loadMostRecentProject();
            }
            $('.drag-drop-handle').mousedown(function(event) {
              event.preventDefault();
            });
            /*$(".matrix-view-viewport").on({
                'mousemove': function(e) {
                    if(me.$view.hasClass("dragging"))
                        me.updateScrollPos(e);
                    return
                },
                'mousedown': function(e) {
                    me.clickX = e.pageX;
                }
            });*/
            $(".matrix-view-viewport").contextmenu(function(event) {
                stl.app.matrixView.getContextMenuForMultiSelectOperations(event);
                return false;
            });


        },

        getContextMenuForMultiSelectOperations: function(evt){
            if (!stl.app.matrixView.multipleSelectedTasks || Object.keys(stl.app.matrixView.multipleSelectedTasks).length == 0) return;
            var $clickTarget = $(evt.target);
            //buttonOffset = $downloadButton.offset(),
            var $contextMenu = this.getContextMenu(evt);
            if ($contextMenu){
                var showing = $contextMenu.is(":visible");
                var posX = $(".matrix-view-viewport").offset().left,
                posY = $(".matrix-view-viewport").offset().top;
                $(".tool-popup").hide();
                if (!showing) {
                    $contextMenu.show();
                    $contextMenu.css({
                        top: evt.pageY,
                        left: evt.pageX
                    });
                }
            }
            
        },

        isContextMenuApplicable: function(){
            var isScreenMasked = $(".mask-view").css("display") != "none";
            var isApplicable = true;
            if (isScreenMasked){
                isApplicable = false;
            } else {
                isApplicable = true;
            } 
            return isApplicable;
        },

        getContextMenu: function(evt){
            var me = this;
            if (stl.app.readOnlyFlag || !this.isContextMenuApplicable()) {
                return;
            }
            var $menu = this.$checkinMenu;
            if (!$menu) {
                $(document.body).children(".contextMenu-popup").remove();
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

            var $menuItem1 = createMenuItem(CUT_BUTTON_TEXT);
            $menuItem1.off("click")
            if(!$menuItem1.hasClass('disabled'))
                $menuItem1.on("click", function (evt) {
                    CutTasksClicked();
                    $menu.hide();
                    });

            $menu.append($menuItem1);
            var $menuItem2 = createMenuItem(COPY_BUTTON_TEXT);
            $menuItem2.off("click")
            if(!$menuItem2.hasClass('disabled'))
                $menuItem2.on("click", function (evt) {
                    CopyTasksClicked();
                    $menu.hide();
                    });

            $menu.append($menuItem2);
            var $menuItem3 = createMenuItem(DELETE_BUTTON_TEXT);
            $menuItem3.off("click")
            if(!$menuItem3.hasClass('disabled'))
                $menuItem3.on("click", function (evt) {
                    DeleteTasksClicked();
                    $menu.hide();
                    });

            $menu.append($menuItem3);

            if (this.isAllSelectedTaskOfSamePhase()){
                var $menuItem4 = createMenuItem(SET_TASK_PROPERTIES);
                $menuItem4.off("click")
                if(!$menuItem4.hasClass('disabled'))
                    $menuItem4.on("click", function (evt) {
                        me.setTaskPropertiesOfMultiSelectedTasks();
                        $menu.hide();
                        });

                $menu.append($menuItem4);
            }
            
            return $menu;    
        },

        isAllSelectedTaskOfSamePhase: function(){
            var firstTask = this.multipleSelectedTasks[Object.keys(this.multipleSelectedTasks)[0]];
            var taskOfAnotherPhase = _.find(this.multipleSelectedTasks, function(task){
                return task.phaseId != firstTask.phaseId;
            });
            if (taskOfAnotherPhase){
                return false;
            } else {
                return true;
            }
            
        },

        setTaskPropertiesOfMultiSelectedTasks: function(){
            var phaseId = this.multipleSelectedTasks[Object.keys(this.multipleSelectedTasks)[0]].phaseId;
            this.openTaskPropertiesDialog(phaseId);
        },

        updateScrollPos: function (e) {
            var newScrollVal = $(".matrix-view-viewport").scrollLeft() + Math.abs(e.pageX - this.clickX);
            if (e.pageX > ($(window).width() - 200) && e.pageX < ($(".phase-type-milestone").last().position().left + $(".phase-type-milestone").last().width()) - 200) {
                $(".matrix-view-viewport").scrollLeft(newScrollVal);
                this.onViewportScroll(e); //$(".matrix-view-header-viewport").scrollLeft(newScrollVal);
            }
            else
                $(".task-reorder-placeholder").offset({ top: e.pageY - 10, left: e.pageX - 10 });
        },
        onToggleLinks: function (evt, showLinks) {
            this.linksView.setVisible(showLinks);
        },

        onContainerResize: function () { },

        handleHighlightDropdownSelection: function () {
            var me = this;
            var selection = stl.app.getCurrentHighLightOption(); //[DH]: to obtain proper highlight option
            removeLegend();
            switch (selection) {
                case RESOURCES:
                    var resourceToolItems = $($(".highlight-resources-popup").find(".tool-item"));
                    $.each(resourceToolItems, function (index, $toolItem) {
                        if (index != 0)
                            HighlightResources($($toolItem));
                    });
                    break;

                case PHASES:
                    var phaseToolItems = $($(".highlight-phases-popup").find(".tool-item"));
                    $.each(phaseToolItems, function (index, $toolItem) {
                        if (index != 0)
                            HighlightPhases($($toolItem));
                    });
                    break;
                case TASK_MANAGERS:
                    var taskManagerToolItems = $($(".highlight-task-managers-popup").find(".tool-item"));
                    $.each(taskManagerToolItems, function (index, $toolItem) {
                        if (index != 0)
                            HighlightTaskManagers($($toolItem));
                    });
                    break;
                case PROJECT_CMS_CHAINS:
                    chainToolItems = stl.app.ProjectDataFromServer.getChainsColorMap();
                    $.each(chainToolItems, function (index, $toolItem) {
                        if (index != 0)
                            stl.app.HighlightProjectChain($($toolItem));
                    });
                    break;
                case CC_TASKS:
                    this.onHighlightCCTasks();
                    break;

                case ERROR:
                    me.highlightOnViewChange("highlightedErrorTask");
                    break;

                case IMMEDIATE_PREDECESSORS:
                case IMMEDIATE_SUCCESSORS:
                case ALL_PREDECESSORS:
                case ALL_SUCCESSORS:
                case SHOW_CONSTRANING_SUCCESSOR_CHAIN:
                case SHOW_LONGEST_PREDECESSOR_CHAIN:
                case LONGEST_PATH:
                    if (!stl.app.matrixView.isFirstSwitch) {
                        me.highlightOnViewChange("constrainingSuccessorTask");
                    }
                    break;
                case PEN_CHAIN:
                    me.onHighlightPenChain();
                    break;
                case SLACK:
                    me.onHighlightSlack();
                    break;
                case RESOURCE_CONTENTION:
                    me.onHighlightResourceContention();
                    break;

            }
        },

        highlightOnViewChange: function (className) {

            // Dependency on timeline view  
            // Case - on editcheckout/checkout if project is IDCCed then user is redirected to timeline view. 
            // In this case matrix view is not intialised unless user navigates to that view            
            // Consider a scenario when user highlights longest predecessor chain from timeline view
            // then to retain the highlighting the same highlight in matrix view this code is used.

            // TODO - Need to find a better way to do it. 
            // Instead of searching DOM for highlighted elements, we can store the last selected task for highlighting 
            // and then call respective functions of highlighting. 

            var me = this;
            if(stl.app.isChainViewLoaded && !stl.app.isTimelineViewLoaded)
                var timelineView = Ext.getCmp("chainview");
            else
                var timelineView = Ext.getCmp("timelineview");

            var highlightedTasksElements = $(".sch-timelineview table .sch-event").find("." + className);
            var highlightedMilestoneEvents = $(".milestone-event." + className, timelineView.getEl().dom);
            var highlightedIMSEvents = $(".sch-event-milestone.milestone." + className).find(".IMS-Milestone" );
            var highlightedMilestoneElements =highlightedMilestoneEvents.add(highlightedIMSEvents);
            var tasksUIDsToBeHighlighted = [];

            $.each(highlightedTasksElements, function (index, taskElement) {
                var taskUID = taskElement.getAttribute("data-task-uid");
                tasksUIDsToBeHighlighted.push(taskUID);
            });

            $.each(highlightedMilestoneElements, function (index, milestoneElement) {
                var milestoneUID = milestoneElement.getAttribute("data-ms-uid");
                tasksUIDsToBeHighlighted.push(milestoneUID);
            });


            me.highlightChain(tasksUIDsToBeHighlighted, true /*onlyUIdArray*/, className);

        },

        /**
        * Do one-time setup necessary for fixed header row and leftmost column
        */
        initFixedRegions: function () {
            // Move header in DOM
            var $header = this.$view.find(".matrix-view-row.header-row"),
            $headerContainer = $('<div class="matrix-view-header-viewport" />'),
            $leftColContainer = $('<div class="matrix-view-fixed-column-viewport" />'),
            $viewport = this.$view.find(".matrix-view-viewport"),
            headerHeight = 31,// $header.height(),  // FIXME make dynamic
            leftColWidth = 200; // FIXME make dynamic
            this.$viewport = $viewport;

            // Move header into its own viewport
            $headerContainer.append($header);
            this.$view.append($headerContainer);
            $headerContainer.height(headerHeight);
            $viewport.css("top", headerHeight - 1);
            $viewport.on("scroll", this.onViewportScroll.bind(this));
            this.$header = $header;
            this.$headerContainer = $headerContainer;

            // Move left column into its own viewport
            var $leftColCells = $viewport.find(".matrix-view-row .tree-column");
            $leftColContainer.append($leftColCells);
            $leftColContainer.width(leftColWidth);
            this.$view.append($leftColContainer);
            $leftColContainer.css("top", headerHeight - 1);
            $viewport.css("left", leftColWidth);
            this.$leftColContainer = $leftColContainer;
            $leftColContainer.on("scroll", this.onFixedColumnScroll.bind(this));

            // Corner mask
            this.$viewportCornerMask = $('<div class="viewport-corner-mask" />');
            this.$view.append(this.$viewportCornerMask);
            this.$viewportCornerMask.width(leftColWidth - 1).height(headerHeight - 1);

            this.syncColumnWidths();
            this.syncRowHeights();
            this.lastScrollTop = 0;
            this.lastScrollLeft = 0;
        },

        onViewportScroll: function (evt) {
            var $viewport = $(evt.target),
                scrollLeft = $viewport.scrollLeft(),
                scrollTop = $viewport.scrollTop();
            this.$headerContainer.scrollLeft(scrollLeft);
            this.$leftColContainer.scrollTop(scrollTop);
            if (scrollTop > 0 && this.lastScrollTop === 0) {
                this.$view.addClass("scrolled-vertically");
            } else if (scrollTop === 0 && this.lastScrollTop > 0) {
                this.$view.removeClass("scrolled-vertically");
            }
            if (scrollLeft > 0 && this.lastScrollLeft === 0) {
                this.$view.addClass("scrolled-horizontally");
            } else if (scrollLeft === 0 && this.lastScrollLeft > 0) {
                this.$view.removeClass("scrolled-horizontally");
            }
            this.lastScrollTop = scrollTop;
            this.lastScrollLeft = scrollLeft;
        },

        onFixedColumnScroll: function (evt) {
            var $leftColContainer = $(evt.target),
                scrollTop = $leftColContainer.scrollTop();
            this.$viewport.scrollTop(scrollTop);
            if (scrollTop > 0 && this.lastScrollTop === 0) {
                this.$view.addClass("scrolled-vertically");
            } else if (scrollTop === 0 && this.lastScrollTop > 0) {
                this.$view.removeClass("scrolled-vertically");
            }
            this.lastScrollTop = scrollTop;
        },

        /**
        * Make the widths of the floating header cells match the corresponding column widths in the table
        */
        syncColumnWidths: function (evt) {
            var $headerCells = this.$header.find(".phase-column"),
                $firstRowCells = this.$view.find(".matrix-view-inner .matrix-view-row:first .phase-column");
            $firstRowCells.css("min-width", 0);
            $headerCells.css("min-width", 0);
            var widthList = [];
            for (var i = 0; i < $headerCells.length; i++) {
                var $headerCell = $headerCells.eq(i),
                    $firstRowCell = $firstRowCells.eq(i),
                    phaseNameWidthMax = Math.max(100, $headerCell.outerWidth()),
                    newWidth = Math.max(phaseNameWidthMax, $firstRowCell.outerWidth());
                widthList.push({
                    header: $headerCell,
                    cell: $firstRowCell,
                    width: newWidth
                });
            }
            for (var i = 0; i < widthList.length; i++) {
                var item = widthList[i];
                item.header.css("min-width", item.width);
                item.cell.css("min-width", item.width);
            }
            this.$headerContainer.scrollLeft(this.$viewport.scrollLeft());
        },

        syncRowHeights: function (evt) {
            var me = this;
            var $fixedColCells = this.$leftColContainer.find(".tree-column"),
                $rowBodies = this.$view.find(".matrix-view-inner .matrix-view-row");
            $fixedColCells.css("min-height", 0);
            $rowBodies.css("height", "auto");
            var treePanel = Ext.getCmp("scopeItemTree");
            var tree = (treePanel) ? treePanel.getRootNode() : null;
            var siblingNode; //this.findChildRecursively(tree, "rowUid", siblingRowUid);
            var heightList = [];
            var treeHeight = 0;
            if (this.project) {
                for (var i = 0; i <= this.project.rows.length; i++) {
                    //                var $fixedCell = $fixedColCells.eq(i),
                    var $rowBody = $rowBodies.eq(i);

                    var scopeitemNode = (tree) ? this.findChildRecursively(tree, "rowUid", $rowBody.attr("rowUid")) : null,
                    newHeight = $rowBody.outerHeight(); //Math.max($fixedCell.outerHeight(), $rowBody.outerHeight());
                    heightList.push({
                        //fixed: $fixedCell,
                        scopeItem: scopeitemNode,
                        scroll: $rowBody,
                        height: newHeight
                    });
                    treeHeight = treeHeight + newHeight;
                }
            }
            for (var i = 0; i < heightList.length; i++) {
                var item = heightList[i];
                //item.fixed.css("min-height", item.height);
                if (item.scopeItem) {
                    //item.scopeItem.setHeight(item.height);
                    $(treePanel.getView().getNode(item.scopeItem)).css("height", item.height);
                }
                item.scroll.css("height", item.height);
            }
            if (treePanel)
                treePanel.setHeight(treeHeight);
        },

        onProjectLoaded: function (evt, sender) {
            if (sender === this) {
                console.log('Method called matrix view - onProjectLoaded');
                //this.setZoomLevel(1);
                this.$view.data("view", this);
                stl.app.handleCheckoutButtonAsPerProjectPrivilege(this.project.CheckedOutStatus, this.project.CheckedOutUser);
                stl.app.UpdateDownloadButtonBasedOnProjectStatus(this.project.ProjectStatus, this.project.projectFileType);
            }
        },

        // loadMostRecentProject: function() {
        //     var lastServerProjectUid = localStorage.getItem(LOCAL_STORAGE_LAST_PROJECT_UID_KEY);
        //     // console.log("loadMostRecentProject, saved server uid is", lastServerProjectUid);
        //     if (lastServerProjectUid) {
        //         this.loadProjectFromServer(lastServerProjectUid);
        //         return;
        //     }
        //     var model = null,
        //         savedModelJson = localStorage.getItem(localStorageModelKey);
        //     if (savedModelJson && window.location.href.indexOf('?blank') === -1) {
        //         this.loadProjectJson(savedModelJson);
        //     } else {
        //         console.warn("No recent project found.");
        //     }
        // },

        loadProjectJson: function (project) {

            console.log('Method called stl.app.matrixView.loadProjectJson');
            var me = this;

            me.loadProject(project);
        },

        updateMilestoneDueDate: function (project, projectDueDate) {
            _.each(project._milestones, function (ms, idx) {
                ms.date1 = projectDueDate;
            });

        },
        addIsCriticalClassForMilestone: function ($ms, ms) {
            if (ms.isCritical) {
                $ms.addClass("isCCTask");
            }
        },

        // Matrix-view-specific listener for "delete milestone" menu option
        onMilestoneDeleteLocal: function(evt, msUid, $ms) {
            //Remove CCCB buffer and PEMS if they exist
            var msType = $ms.data("model").taskType
            if (msType === PE_SHORT) {
                this.removeBufferTaskAndPEMS("", msUid);
            }
            //Remove CMSB buffer and IPMS if they exist
            //no need to remove buffer task and IPMS for IPMS
            if (msType === CMS_SHORT) {
                this.removeBufferTaskAndIPMS("", msUid);
            }
            var ms = $ms.data("model");
            var $row = stl.app.matrixView.rowsById[ms.rowId];
            var row = $row.data("model");
            var scope = stl.app.matrixView.project.getScopeItemByUid(row.scopeItemUid);
            var phase = $.grep(stl.app.matrixView.project.phases, function(phase) {
                return phase.uid == ms.phaseId;
            })[0];

            var immediateSiblingsUid = this.project.getImmediateSiblingsUids(ms);
            stl.app.undoStackMgr.pushToUndoStackForTaskDelete(stl.app.matrixView.project, ms, scope, row, phase,
                immediateSiblingsUid.prevTaskUid, immediateSiblingsUid.nextTaskUid);

            this.deleteMilestone(msUid);

        },

        // Save project upon milestone deletion from any view
        onMilestoneRemove: function (evt, sender, ms) {
            var $ms = this.milestoneElementsById[ms.uid];
            var $row = this.rowsById[ms.rowId];
            if ($ms) {
                var cellHasTask = $ms.closest(".phase-column").find('.milestone , .task');
                if (cellHasTask.length <= 1)
                    $ms.closest(".phase-column").removeClass("has-task");
                

            }
            this.removeLinksForMS(ms.uid);
            var msLinkElem = $ms.find(".ms-content-wrap");
            this.linksView.removeElement(msLinkElem);
            $ms.next('.task-spaceholder-ms').remove();
            $ms.remove();
            delete this.milestoneElementsById[ms.uid];
            this.selectedTask = null;
            $(document).trigger("taskselectionchange", [this.selectedTask]);
            this.syncColumnWidths();
            this.syncRowHeights();
            this.refreshLinks();
            this.saveRow($row);
            this.saveProject();
        },

        deleteMilestone: function (milestoneUid) {
            this.project.deleteMilestone(this, milestoneUid);
            //$(document).trigger("milestoneremove", [this, milestoneUid]);

        },

        removeBufferTaskAndPEMS: function (evt, msUid) {
            var $milestone = this.milestoneElementsById[msUid];
            var $bufferTask = $milestone.prev();
            var PEMS = stl.app.ProjectDataFromServer.getPEMS();
            if ($bufferTask.length > 0 && $bufferTask.hasClass('cccb-task')){
                var bufferTask = $bufferTask.data("model");
                stl.app.undoStackMgr.setMilestonePredTasksInfo(bufferTask, PEMS, msUid, this.project);
            }
            if ($bufferTask.length > 0 && $bufferTask.hasClass('cccb-task')) {
                this.deleteTask($bufferTask);
            }
            
            if (PEMS) {
                this.deleteMilestone(PEMS.uid);
            }
            
        },

        
        removeBufferTaskAndIPMS: function (evt, msUid) {
            var $milestone = this.milestoneElementsById[msUid];
            var CMS = $milestone.data("model");
            var $bufferTask = $milestone.prev();
            var IPMSTask = stl.app.ProjectDataFromServer.getIPMSForCMS(CMS);
            if ($bufferTask.length > 0 && $bufferTask.hasClass('cmsb-task')) {
                var bufferTask = $bufferTask.data("model");
                stl.app.undoStackMgr.setMilestonePredTasksInfo(bufferTask, IPMSTask, msUid, this.project);
            }
            
            if ($bufferTask.length > 0 && $bufferTask.hasClass('cmsb-task')) {
                this.deleteTask($bufferTask);
            }
            if (IPMSTask) {
                this.deleteMilestone(IPMSTask.uid);
            }
            
        },

        onMilestoneInfoChange: function (evt, milestone, editedField, oldVal) {
            //var $ms = this.milestoneElementsById[parseInt(milestone.get('uid'))];
            var $ms = this.milestoneElementsById[milestone.uid];
            var msView = $ms.data("view");
            var msModel = $ms.data("model");
            var $wrap = $ms.find(".ms-content-wrap");
            var selectedTask = this.selectedTask;
            if (milestone.checklistStatus)
                this.refreshChecklistIcon($ms, milestone);
            if (editedField && editedField === "type") {
                //var $wrap = $ms.find(".milestone-icon-wrap");
                var msType = milestone.type;
                if (msType == CMS_SHORT) {
                    //Change this milestone to CMS
                    //if non zero ims task is changed to cms/pe duration is made 0
                    msModel.duration = "0";
                    milestone.duration = "0";
                    msModel.remainingDuration = "0";
                    milestone.remainingDuration = "0";
                    if (milestone.status == STATUS_IP) {
                        msModel.status = STATUS_NS;
                        milestone.status = STATUS_NS;
                        msModel.percentComplete = 0;
                    }
                    $wrap.find(".milestone-icon").text(CMS_SHORT);
                    if ($ms.hasClass("internal-milestone"))
                        $ms.removeClass("internal-milestone");
                    if ($ms.hasClass("PP-milestone"))
                        $ms.removeClass("PP-milestone");
                    if (oldVal == PE_SHORT)
                        this.removeBufferTaskAndPEMS("", msModel.uid);
                    else
                        this.removeBufferTaskAndIPMS("", msModel.uid);
                    var isRemoved = this.removeSuccessorLinks(msModel.uid);
                    this.selectedTask = selectedTask;
                } else if (msType === IMS_SHORT) {
                    //Change this milestone to IMS
                    $wrap.find(".milestone-icon").text(IMS_SHORT);
                    if (!$ms.hasClass("internal-milestone"))
                        $ms.addClass("internal-milestone");
                    if ($ms.hasClass("PP-milestone"))
                        $ms.removeClass("PP-milestone");
                    if (oldVal == PE_SHORT)
                        this.removeBufferTaskAndPEMS("", msModel.uid);
                    else
                        this.removeBufferTaskAndIPMS("", msModel.uid);
                    this.selectedTask = selectedTask;
                    //PPI_Notifier.alert(IMS_SHOULD_HAVE_SUCC, IMS_TITLE);
                    //If autolink is checked automatically connect the successor tasks
                } else if (msType === "NONE") {
                    //Change this milestone to IMS
                    /*msModel.duration = "0";
                    msModel.remainingDuration ="0";
                    if(milestone.status == STATUS_IP){
                    msModel.status =STATUS_NS;
                    msModel.percentComplete = 0;
                    }*/
                    $wrap.find(".milestone-icon").text("");
                    if (!$ms.hasClass("internal-milestone"))
                        $ms.addClass("internal-milestone");
                    $ms.addClass("PP-milestone");
                    if (oldVal == PE_SHORT)
                        this.removeBufferTaskAndPEMS("", msModel.uid);
                    else if (oldVal == CMS_SHORT || oldVal == IMS_SHORT)
                        this.removeBufferTaskAndIPMS("", msModel.uid);
                    else {

                    }
                    this.selectedTask = selectedTask;
                } else if (msType === PE_SHORT) {
                    msModel.duration = "0";
                    milestone.duration = "0";
                    msModel.remainingDuration = "0";
                    milestone.remainingDuration = "0";
                    if (milestone.status == STATUS_IP) {
                        msModel.status = STATUS_NS;
                        milestone.status = STATUS_NS;
                        msModel.percentComplete = 0;
                    }
                    $wrap.find(".milestone-icon").text(PE_SHORT);
                    if ($ms.hasClass("internal-milestone"))
                        $ms.removeClass("internal-milestone");
                    if ($ms.hasClass("PP-milestone"))
                        $ms.removeClass("PP-milestone");
                    if (oldVal == CMS_SHORT || oldVal == IMS_SHORT)
                        this.removeBufferTaskAndIPMS("", msModel.uid);
                    var isRemoved = this.removeSuccessorLinks(msModel.uid);
                    this.selectedTask = selectedTask;
                }
            }
            if (msType == CMS_SHORT) {
                //remove the resources if any exist in the model
                if (msModel.resources.length != 0)
                    msModel.resources = [];
            }
            this.project.updateMilestone(milestone, oldVal);
            msView.load(msModel);
            if(multipleORs(msType,PE_SHORT, CMS_SHORT)) {
             // we need save row on milestone type change if it is PE or CMS as we need to bump the orders of the task which are ahead of PE or CMS in same cell
                var $row = this.rowsById[msModel.rowId];
                this.saveRow($row);
            }

            
        },

        removeSuccessorLinks: function (msUid) {
            var links = this.project.links
            var link = _.filter(links, function (lnk) {
                return lnk.from === msUid
            });
            for (var i = 0; i < link.length; i++) {
                this.project.removeLink(link[i].from, link[i].to);

            }
        },
        /*movePEMilestone:function(ms){
        var $ms = this.milestoneElementsById[ms.uid];
        var pred = ms._predecessors.slice(0);
        var succ = ms._successors.slice(0);
        this.removeAllLinksForTaskOrMilestone(ms.uid);        
        $ms.remove();
        this.renderMilestone(ms);            
        for(var i=0 ;i< pred.length; i++){
        var $fromEl = this.getTaskOrMilestoneLinkTargetElementByUid(pred[i].uid), 
        $toEl = this.getTaskOrMilestoneLinkTargetElementByUid(ms.uid);
        if ($fromEl && $toEl) {
        this.addAutoLink($fromEl, $toEl);
        }
        }
        for(var i=0 ;i< succ.length; i++){
        var $fromEl = this.getTaskOrMilestoneLinkTargetElementByUid(succ[i].uid), 
        $toEl = this.getTaskOrMilestoneLinkTargetElementByUid(ms.uid);
        if ($fromEl && $toEl) {
        this.addAutoLink($fromEl, $toEl);
        }
        }
                            
                        
        },*/
        onErrorHighlight: function (sender, id) {
            var found = false;
            var allTasks = this.tasksByUid;
            var allMilestonesByUidMap = this.milestoneElementsById;

            var taskUid = this.project.getTaskOrMilestoneUidById(id);

            var taskInfo = allTasks[taskUid];
            if (taskInfo) {
                taskInfo.$el.addClass("highlightedErrorTask");
                found = true;
            }

            if (!found) {
                var milestone = allMilestonesByUidMap[taskUid];
                if (milestone) {
                    $(milestone).addClass("highlightedErrorTask");
                }
            }
        },

        onSelectionHighlight: function (sender, id) {
            var found = false;
            var allTasks = this.tasksByUid;
            var allMilestonesByUidMap = this.milestoneElementsById;

            var taskUid = this.project.getTaskOrMilestoneUidById(id);

            var taskInfo = allTasks[taskUid];
            if (taskInfo) {
                taskInfo.$el.addClass("highlightSelectedTask");
                found = true;
            }

            if (!found) {
                var milestone = allMilestonesByUidMap[taskUid];
                if (milestone) {
                    $(milestone).addClass("highlightSelectedTask");
                }
            }
        },

        onRemoveSelectionHighlight: function () {
            $(".highlightSelectedTask").removeClass("highlightSelectedTask");
        },

        onRemoveCutHighlight: function () {
            $(".highlightSelectedTask").removeClass("highlightCutTask");
        },

        onAddCutHighlight: function () {
            $(".highlightSelectedTask").addClass("highlightCutTask");
        },

        removeSelectionHighlight: function (sender, id) {
            var found = false;
            var allTasks = this.tasksByUid;
            var allMilestonesByUidMap = this.milestoneElementsById;

            var taskUid = this.project.getTaskOrMilestoneUidById(id);

            var taskInfo = allTasks[taskUid];
            if (taskInfo) {
                taskInfo.$el.removeClass("highlightSelectedTask");
                found = true;
            }

            if (!found) {
                var milestone = allMilestonesByUidMap[taskUid];
                if (milestone) {
                    $(milestone).removeClass("highlightSelectedTask");
                }
            }
        },
        onErrorHighlightUsingUID: function (sender, uid) {
            var found = false;
            var allTasks = this.tasksByUid;
            var allMilestonesByUidMap = this.milestoneElementsById;
            var taskInfo = allTasks[uid];
            if (taskInfo) {
                taskInfo.$el.addClass("highlightedErrorTask");
                found = true;
            }

            if (!found) {
                var milestone = allMilestonesByUidMap[uid];
                if (milestone) {
                    $(milestone).addClass("highlightedErrorTask");
                }
            }
        },

        /*
        * Render any existing milestones when loading a project.
        */
        // renderMilestones: function () {
        //     this.project._milestones.sort(function (msA, msB) {
        //         return msA.order - msB.order;
        //     });
        //     for (var i = 0; i < this.project._milestones.length; i++) {
        //         var milestone = this.project._milestones[i];
        //         // if (milestone.taskType !== "PEMS") {
        //         this.renderMilestone(this.project._milestones[i]);
        //         // }
        //     }
        // },



        // TODO based on how link logic has developed, it may be cleaner to have a method "ensureAutoLinksForCell,"
        // which would check existence of all expected auto-links and regenerate any missing ones; we could call that
        // same logic every time any event happened to the cell involving tasks moving/appearing/disappearing.
        // However, that may not be possible if we want to allow users to remove auto-links (I don't think we do).
        generateAutoLinksForTask: function ($task, phase) {
            if(!stl.app.generateAutoLinksAllowed) return;
            var me = this;
            if (phase.type === STRING_NORMAL) {
                var $PrevElement = DOMManipulatorWrapperInstance.getPrevElement($task, '.task , .milestone'),
                $NextElement = DOMManipulatorWrapperInstance.getNextElement($task, '.task , .milestone');
                if ($PrevElement.length > 0 && $NextElement.length > 0) {
                    me.removeLink($PrevElement, $NextElement);
                    me.addAutoLink($PrevElement, $task);
                    me.addAutoLink($task, $NextElement);
                    return;
                }
                if ($NextElement.length > 0) {
                    if (!me.project.isThisTaskBuffer($NextElement.data("model")))
                        me.addAutoLink($task, $NextElement);
                }
                if ($PrevElement.length > 0) {
                    if (!me.project.isThisTaskBuffer($PrevElement.data("model")))
                        me.addAutoLink($PrevElement, $task);
                }
            }
            var $cell = $task.closest(".phase-column"),
                thisColIndex = $cell.index(),
                $row = $cell.closest(".matrix-view-row"),
                $allTasksInCell = $cell.find(".task, .milestone"),
                taskCount = $allTasksInCell.length,
                taskIndex = $allTasksInCell.index($task),
                isLastInCell = (taskIndex === taskCount - 1);
            var $prevCell = $cell.prev();
            var phaseIndex = $cell.closest(".matrix-view-row").find(".phase-column").index($prevCell);
            if (phase.type === "fullkit") {
                /*
                When adding a fullkit task, create auto-links to all first tasks in cells in the next phase,
                on all rows from this row (inclusive) down to but not including the next row containing another
                FK task in this column:

                +---------------+------------+
                | (NEW FK)---+--+-->(TASK)   |   <-- These two links should be added
                +------------|--+------------+     |
                |            +--+-->(TASK)   |   <-+
                +---------------+------------+
                | (OTHER FK)    |   (TASK)   |   <-- No link to this task, because of (OTHER FK)
                +---------------+------------+

                While doing this, also *delete* any existing links between the target tasks and any other FK
                higher up in the FK column.
                */
                var $previousRow = $row.prev(),
                    $previousFK = $(),
                    rowMeetsCriteria = true;
                // Find closest higher FK task in this column, if any
                while ($previousRow.length > 0) {
                    $previousFK = $previousRow.children().eq(thisColIndex).find(".task").first();
                    if ($previousFK.length > 0) {
                        break;
                    }
                    $previousRow = $previousRow.prev();
                }
                while (rowMeetsCriteria) {
                    // If task exists in next column, link to it
                    var $nextColumnTask = $row.children().eq(thisColIndex + 1).find(".task").first();
                    if ($nextColumnTask.length > 0) {
                        if ($previousFK.length > 0) {
                            me.removeLink($previousFK, $nextColumnTask);
                        }
                        me.addAutoLink($task, $nextColumnTask)
                    }
                    $row = $row.next();
                    rowMeetsCriteria = ($row.length > 0) // Row exists
                        && !($row.hasClass("row-placeholder")) // Is not empty last row
                        && ($row.children().eq(thisColIndex).find(".task").length === 0); // Row has no FK task in FK column
                }
            } else {
                // Not first (leftmost) task in cell?  Add link from previous task
                if (taskIndex > 0) {
                    var $precedingTask = $allTasksInCell.eq(taskIndex - 1);
                    me.removeForwardLinksForTask($precedingTask.data('model').uid);
                    me.addAutoLink($precedingTask, $task);
                } else if ($allTasksInCell.length === 1) {
                    // If this is the only task in this cell, add link from last task in previous cell, if any

                    // If previous phase is fullkit, add an auto link to the nearest FK task on this row or above, if any
                    if (phaseIndex >= 0 && this.project.phases[phaseIndex].type === "fullkit") {
                        var $nearestRow = $row;
                        while ($nearestRow.length > 0) {
                            $previousFK = $nearestRow.children().eq(thisColIndex - 1).find(".task").first();
                            if ($previousFK.length > 0) {
                                me.addAutoLink($previousFK, $task);
                                break;
                            }
                            $nearestRow = $nearestRow.prev();
                        }
                    } else {


                        //Get tasks in prior phase collection to be autolinked to next task
                        do {
                            if ($prevCell && $prevCell.length > 0) {
                                if ($prevCell.hasClass('phase-type-milestone') && $prevCell.hasClass('has-task')) {
                                    var $prevCellMilestone = $prevCell.find(".milestone").last();
                                    if ($prevCellMilestone && $prevCellMilestone.length > 0 &&
                                        multipleORs($prevCellMilestone.data("model").taskType, IMS_SHORT, NONE_UPPER_CASE))
                                        var $prevCellTasks = $prevCellMilestone;
                                    else
                                        break;
                                } else {
                                    var $prevCellTasks = $prevCell.find(".task");
                                    $prevCell = $prevCell.prev();
                                }

                            } else
                                break;
                        }
                        while ($prevCellTasks.length === 0)

                        if ($prevCellTasks && $prevCellTasks.length > 0) {
                            if ($prevCellTasks.last().hasClass('ccfb-task')) {
                                var taskCount = $prevCellTasks.length - 1;
                                while (taskCount >= 0) {
                                    if (!($prevCellTasks.eq(taskCount).hasClass('ccfb-task'))) {
                                        me.addAutoLink($prevCellTasks.eq(taskCount), $task);
                                        break;
                                    }
                                    taskCount = taskCount - 1;
                                }
                            } else {
                                var successorsForPrevCellLastTask = $prevCellTasks.last().data("model")._successors;

                                if (successorsForPrevCellLastTask.length > 0) {
                                    for (var i = 0; i < successorsForPrevCellLastTask.length; i++) {
                                        var $nextEl = this.getTaskOrMilestoneLinkTargetElementByUid(successorsForPrevCellLastTask[i].uid);
                                        //Here check if the successor is in the phases after the current task as we dont allow backward links.
                                        if ($nextEl.length > 0) {
                                            if ($nextEl.closest(".phase-column").index() > thisColIndex)
                                                me.addAutoLink($task, $nextEl);
                                        }
                                    }
                                }
                                me.addAutoLink($prevCellTasks.last(), $task);
                            }
                        }

                    }
                }
                var $nextCell = $cell.next();
                if (isLastInCell) {
                    if ($nextCell && $nextCell.length > 0) {
                        var $nextCellTasks = $nextCell.find(".linkable-element");
                        var $milestones = $nextCell.find(".ms-content-wrap");
                        if ($nextCellTasks.length <= 0 && $milestones.length <= 0) {
                            //Find next available task or milestone in the row if there is none in the immediate next cell
                            while ($nextCell.length > 0 && $nextCellTasks.length <= 0 && $milestones.length <= 0) {
                                $nextCellTasks = $nextCell.next().find(".linkable-element");
                                $milestones = $nextCell.next().find(".ms-content-wrap");
                                $nextCell = $nextCell.next();
                            }
                        }
                        //task should be autolinked to the next available linkable element                        
                        if ($nextCellTasks.length > 0) {
                            if ($.grep(this.project.links, function (e) {
                                return e.from == me.linksView.resolveLinkEndpointUID($task) && e.to == me.linksView.resolveLinkEndpointUID($nextCellTasks.first())
                            }).length == 0)
                                me.addAutoLink($task, $nextCellTasks.first());
                        } else {
                            if ($milestones.length > 0) {
                                if ($.grep(this.project.links, function (e) {
                                    return e.from == me.linksView.resolveLinkEndpointUID($task) && e.to == me.linksView.resolveLinkEndpointUID($milestones.first())
                                }).length == 0)
                                    me.addAutoLink($task, $milestones.first());
                            }
                        }
                    }
                } else if (taskCount > 1) {
                    // There's a succeeding task in this cell; link to it
                    if ($.grep(this.project.links, function (e) {
                        return e.from == me.linksView.resolveLinkEndpointUID($task) && e.to == me.linksView.resolveLinkEndpointUID($allTasksInCell.eq(taskIndex + 1))
                    }).length == 0)
                        me.addAutoLink($task, $allTasksInCell.eq(taskIndex + 1));
                }

                // TODO delete link from formerly last task to next cell, if any?
                if ($prevCellTasks && $nextCellTasks) {
                    if ($prevCellTasks.last().length > 0) {
                        var successorsForPrevCellLastTask = $prevCellTasks.last().data("model")._successors;
                        if ($nextCellTasks.first().hasClass('milestone-icon-wrap'))
                            var nextCellFirstTask = $nextCellTasks.first().parent().data("model");
                        else
                            var nextCellFirstTask = $nextCellTasks.first().data("model");
                        if (successorsForPrevCellLastTask.length > 0 && successorsForPrevCellLastTask.indexOf(nextCellFirstTask) != -1) {
                            //remove this redundant link
                            me.removeLink($prevCellTasks.last(), $nextCellTasks.first());
                        }
                        //If the prevCellLast task is linked to PE,PEMS, CMS, remove that link. and connect this new task to PE
                        for (var i = 0; i < successorsForPrevCellLastTask.length; i++) {
                            if (multipleORs(successorsForPrevCellLastTask[i].taskType, PE_SHORT, PEMS_SHORT, CMS_SHORT, IPMS_SHORT, IMS_SHORT, NONE_UPPER_CASE)) {
                                var prevCellTaskRowId = $prevCellTasks.last().data("model").rowId,
                                    succMSRowId = successorsForPrevCellLastTask[i].rowId;
                                if (prevCellTaskRowId === succMSRowId) {
                                    var prevCellLastTask = $prevCellTasks.last(),
                                        succMS = this.getTaskOrMilestoneLinkTargetElementByUid(successorsForPrevCellLastTask[i].uid);

                                    me.removeLink(prevCellLastTask, succMS);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        },


        /*Auto link all logic strts here*/

        onAutoLinkAllChange: function (evt, $task, checked) {
            var me = this;

            PPI_Notifier.confirm(LINKS_WILL_BE_REMOVED_AFTER_AUTO_LINK,
                AUTO_LINK,
                function () {
                    if(stl.app.matrixView.selectedTask){
                        var task = stl.app.matrixView.selectedTask.data("model");
                        var view = stl.app.matrixView.selectedTask.data("view");
                        view.setAutolinkButonText($task, task);
                    }
                    if (checked) {
                        me.onAutoLinkAllChecked($task);
                    } else {
                        me.onAutoLinkAllUnchecked($task);

                    }
                },
                function () {
                    //$(evt.target)[0].$el.find("input:checkbox").prop('checked', !checked);
                    if(stl.app.matrixView.selectedTask){
                        var task = stl.app.matrixView.selectedTask.data("model");
                        task.isAutolinked = !task.isAutolinked;
                        var view = stl.app.matrixView.selectedTask.data("view");
                        view.setAutolinkButonText($task, task);
                    }
                    me.generateAutoLinksForMilestone($task);
                }
            );


        },


        onAutoLinkAllChecked: function ($ms) {
            //link all predecessing tasks
            var me = this;
            $cell = $ms.closest(".phase-column"),
                thisColIndex = $cell.index(),
                $row = $cell.closest(".matrix-view-row");
            if (thisColIndex !== 0) //this is the first phase - no predecessors exist
                me.connectAllValidPredecessors($row, $ms, thisColIndex); //link all predecessor task

            if ($ms.data("model").taskType != CMS_SHORT && $ms.data("model").taskType != PE_SHORT) {
                me.connectAllValidSuccessors($row, $ms, thisColIndex); //link all successing tasks            
            }
        },
        onAutoLinkAllUnchecked: function ($taskOrMilestone) {
            var me = this,
                taskType = $taskOrMilestone.data('model').taskType;
            //If pe/cms replace with IPMS/PEMS task 
            if (taskType === PE_SHORT)
                $taskOrMilestone = me.getPEMSorCCCBForPEAutoLink($taskOrMilestone);
            else if (taskType === CMS_SHORT)
                $taskOrMilestone = me.getIPMSorCMSBForCMSAutoLink($taskOrMilestone);
            taskClass = (taskType === FULL_KIT) ? ".task" : ".milestone";


            me.removeAdjecentLinksForAutoLink($taskOrMilestone, taskClass, true);
            me.removeAdjecentLinksForAutoLink($taskOrMilestone, taskClass, false);
        },


        removeAdjecentLinksForAutoLink: function ($taskOrMilestone, taskClass, predecessors) {
            var me = this,
                $cell = $taskOrMilestone.closest(".phase-column"),
                thisColIndex = $cell.index(),
                adjecentColumnIndex = predecessors ? thisColIndex - 1 : thisColIndex + 1;
            $row = $cell.closest(".matrix-view-row"),
                rowMeetsCriteria = true;

            if (adjecentColumnIndex >= 0) {
                while (rowMeetsCriteria) {
                    //me.removeInvalidAutoLinks($taskOrMilestone.data("model").uid, $row.data("model"));

                    $row = $row.next();
                    var idx = thisColIndex;
                    var yetToFindTaskInRow = true;
                    var phaseIdLimit = $row.children().length;
                    if (predecessors){
                        while (yetToFindTaskInRow && idx > 0){
                           var $tasksInAdjecentColumn = $row.children().eq(idx).find(".task");
                            var $adjecentColumnTask = predecessors ? $tasksInAdjecentColumn.last() : $tasksInAdjecentColumn.first();
                            if ($adjecentColumnTask.length > 0) {
                                if (predecessors)
                                    me.removeLink($adjecentColumnTask, $taskOrMilestone);
                                else
                                    me.removeLink($taskOrMilestone, $adjecentColumnTask);

                                yetToFindTaskInRow = false;
                            } else {
                                idx = idx - 1;
                            }
                        }
                    } else {
                        while (yetToFindTaskInRow && idx < phaseIdLimit){
                           var $tasksInAdjecentColumn = $row.children().eq(idx).find(".task");
                            var $adjecentColumnTask = predecessors ? $tasksInAdjecentColumn.last() : $tasksInAdjecentColumn.first();
                            if ($adjecentColumnTask.length > 0) {
                                if (predecessors)
                                    me.removeLink($adjecentColumnTask, $taskOrMilestone);
                                else
                                    me.removeLink($taskOrMilestone, $adjecentColumnTask);

                                yetToFindTaskInRow = false;
                            } else {
                                idx = idx + 1;
                            }
                             
                        }
                    }

                    rowMeetsCriteria = ($row.length > 0) // Row exists
                                && !($row.hasClass("row-placeholder")) // Is not empty last row
                                && ($row.children().eq(thisColIndex).find(taskClass).length === 0);
                    
                     // Row has no FK/milestone task in FK/ms column
                }
            }
        },

        removeOutgoingConnectionsOfPreviousTaskForPP: function (taskOrMilestoneUid, isPP, thisColIndex) {
            var me = this;
            if (isPP) {
                //_.each should be used but it is failing ,(i guess) because of  some object refrence  while itreating through me.projects.links
                for (var i = me.project.links.length - 1; i >= 0; i--) {
                    var link = me.project.links[i];
                    if (link.from === taskOrMilestoneUid) {
                        var toPhaseModel = me.project.getPhaseById(me.project._tasksAndMilestonesByUid[link.to].phaseId);
                        if (toPhaseModel.order > thisColIndex) // if any task has links in next phase, remove those links
                            me.project.removeLink(link.from, link.to);
                    }
                }
            }
        },
        //remove outgoing links for PP/IMS/FK
        // if it links to a task in row range (all rows this MS to next ms in this phase)
        //and if it links to a task not in same phase as MS phase
        removeInvalidAutoLinks: function (taskOrMilestoneUid, rowModel) {
            var me = this;
            var taskOrMilestonePhaseId = me.project._tasksAndMilestonesByUid[taskOrMilestoneUid].phaseId;
            for (var i = me.project.links.length - 1; i >= 0; i--) {
                var link = me.project.links[i];
                if (link.from === taskOrMilestoneUid) {

                    if (rowModel.uid == me.project._tasksAndMilestonesByUid[link.to].rowId && taskOrMilestonePhaseId != me.project._tasksAndMilestonesByUid[link.to].phaseId)
                        me.project.removeLink(link.from, link.to);
                }
            }
        },



        connectAllValidSuccessors: function ($row, $task, thisColIndex) {
            var me = this,
                $previousMS = me.getPreviousMilestoneInPhase($row, thisColIndex),
                taskType = $task.data('model').taskType,
                taskClass = taskType === FULL_KIT ? ".task" : ".milestone";
            rowMeetsCriteria = true;
            while (rowMeetsCriteria) {
                var idx = thisColIndex;
                var yetToFindDanglingTaskInRow = true;
                var phaseIdLimit = $row.children().length;
                while(yetToFindDanglingTaskInRow && idx < phaseIdLimit){
                   // If task exists in next column, link to it
                    var $nextColumnTask = $row.children().eq(idx + 1).find(".task").first(),
                        nextColumnTaskUid;
                    if ($nextColumnTask.length > 0) {
                        // nextColumnTaskUid = $nextColumnTask.data("model").uid;
                        if ($previousMS.length > 0) {
                            me.removeLink($previousMS, $nextColumnTask);
                        }
                        if (me.isLinkAllowed($task, $nextColumnTask, false, [], null))
                            me.addAutoLink($task, $nextColumnTask)
                            
                        yetToFindDanglingTaskInRow = false;
                    } else {
                        idx = idx + 1;
                    }
                }

                
                $row = $row.next();
                rowMeetsCriteria = ($row.length > 0) // Row exists
                    && !($row.hasClass("row-placeholder")) // Is not empty last row
                    && ($row.children().eq(thisColIndex).find(taskClass).length === 0); // Row has no FK/MS task in FK/MS column
            }
        },

        isTaskDangling: function($task){
            var taskModel = $task.data("model");
            if (taskModel._successors.length > 0){
                return false;
            }
            return true;
        },

        connectAllValidPredecessors: function ($row, $task, thisColIndex) {
            var me = this
            $previousMS = me.getPreviousMilestoneInPhase($row, thisColIndex),
                taskType = $task.data('model').taskType,
                isPP = (taskType === NONE_UPPER_CASE) ? true : false;
            rowMeetsCriteria = true;
            
            while (rowMeetsCriteria) {
                // If task exists in next column, link to it
                var idx = thisColIndex;
                var yetToFindDanglingTaskInRow = true;
                while(yetToFindDanglingTaskInRow && idx > 0){
                    var $prevColumnTask = $row.children().eq(idx - 1).find(".task").last(),
                        prevColumnTaskUid;
                    if ($prevColumnTask.length > 0) {
                        prevColumnTaskUid = $prevColumnTask.data("model").uid;
                        if ($previousMS.length > 0) {
                            me.removeLink($prevColumnTask, $previousMS);
                        }
                        if (taskType === PE_SHORT)
                            $task = me.getPEMSorCCCBForPEAutoLink($task);
                        else if (taskType === CMS_SHORT)
                            $task = me.getIPMSorCMSBForCMSAutoLink($task);
                        me.removeOutgoingConnectionsOfPreviousTaskForPP(prevColumnTaskUid, isPP, idx);
                        if (me.isLinkAllowed($prevColumnTask, $task, false, [], null) && me.isTaskDangling($prevColumnTask))
                            me.addAutoLink($prevColumnTask, $task)
                        yetToFindDanglingTaskInRow = false;

                    } else {
                        if (idx > 0){
                            idx = idx - 1;
                        }
                    }
                }
                
                //for Fk only one predecessor is allowed via autolink  
                if (taskType !== FULL_KIT) {
                    $row = $row.next();
                    rowMeetsCriteria = ($row.length > 0) // Row exists
                        && !($row.hasClass("row-placeholder")) // Is not empty last row
                        && ($row.children().eq(thisColIndex).find(".milestone").length === 0); // Row has no FK task in FK column
                } else
                    rowMeetsCriteria = false;
            }
        },


        getPreviousMilestoneInPhase: function ($row, thisColIndex) {
            var $previousRow = $row.prev(),
                $previousMS = $(),
                rowMeetsCriteria = true;
            // Find closest higher MS/FK task in this column, if any
            while ($previousRow.length > 0) {
                //finds ms /fk in this row for this column
                $previousMS = $previousRow.children().eq(thisColIndex).find(".milestone").first();
                if ($previousMS.length > 0) {
                    break; //if found break out
                }
                $previousRow = $previousRow.prev(); //move to prev row
            }
            return $previousMS;
        },

        getPEMSorCCCBForPEAutoLink: function ($task) {
            var $toCell = $task.closest(".phase-column");
            var $PEMS = $toCell.find(".pems-milestone");
            if ($PEMS.length > 0) {
                return $PEMS;
            } else if ($toCell.find(".cccb-task").length > 0) {
                return $toCell.find(".cccb-task").closest('.task');
            } else
                return $task;

        },

        getIPMSorCMSBForCMSAutoLink: function ($task) {
            var $toCell = $task.closest(".phase-column");
            var $IPMS = $toCell.find(".ipms-milestone");
            if ($IPMS.length > 0) {
                return $IPMS ;
            } else if ($toCell.find(".cmsb-task").length > 0) {
                return $toCell.find(".cmsb-task").closest('.task');
            } else
                return $task;
        },


        /*auto link all logic ends here*/



        //When a Milestone is created link it to the task before that milestone in that row
        generateAutoLinksForMilestone: function ($ms) {
            if(!stl.app.generateAutoLinksAllowed) return;
            var me = this,
            $PrevElement = DOMManipulatorWrapperInstance.getPrevElement($ms, '.task , .milestone'),
            $NextElement = DOMManipulatorWrapperInstance.getNextElement($ms, '.task , .milestone');
            if ($PrevElement.length > 0 && $NextElement.length > 0) {
                me.removeLink($PrevElement, $NextElement);
                me.addAutoLink($PrevElement, $ms);
                me.addAutoLink($ms, $NextElement);
                return;
            }
            if ($NextElement.length > 0) {
                if (!me.project.isThisTaskBuffer($NextElement.data("model")))
                    me.addAutoLink($ms, $NextElement);
            } else {
                var $cell = $ms.closest(".phase-column"),
                    thisColIndex = $cell.index(),
                    $row = $cell.closest(".matrix-view-row"),
                    $allTasksInCell = $cell.find(".task, .milestone"),
                    taskCount = $allTasksInCell.length,
                    taskIndex = $allTasksInCell.index($ms),
                    isLastInCell = (taskIndex === taskCount - 1);
                var $prevCell = $cell.prev();
                var $nextCell = $cell.next();
                var $nextCellTasks = $nextCell.find(".linkable-element");
                    var $milestones = $nextCell.find(".ms-content-wrap");
                    if ($nextCellTasks.length <= 0 && $milestones.length <= 0) {
                        //Find next available task or milestone in the row if there is none in the immediate next cell
                        while ($nextCell.length > 0 && $nextCellTasks.length <= 0 && $milestones.length <= 0) {
                            $nextCellTasks = $nextCell.next().find(".linkable-element");
                            $milestones = $nextCell.next().find(".ms-content-wrap");
                            $nextCell = $nextCell.next();
                        }
                    }
                    if ($nextCellTasks.length > 0) {
                        if ($.grep(this.project.links, function (e) {
                            return e.from == me.linksView.resolveLinkEndpointUID($ms) && e.to == me.linksView.resolveLinkEndpointUID($nextCellTasks.first())
                        }).length == 0)
                            me.addAutoLink($ms, $nextCellTasks.first());
                    } else {
                        if ($milestones.length > 0) {
                            if ($.grep(this.project.links, function (e) {
                                return e.from == me.linksView.resolveLinkEndpointUID($ms) && e.to == me.linksView.resolveLinkEndpointUID($milestones.first())
                            }).length == 0)
                                me.addAutoLink($ms, $milestones.first());
                        }
                    }
            }
            if ($PrevElement.length > 0) {
                if (!me.project.isThisTaskBuffer($PrevElement.data("model")))
                    me.addAutoLink($PrevElement, $ms);
            }
            else {
                var $cell = $ms.closest(".phase-column"),
                    $row = $cell.closest(".matrix-view-row");
                var $prevCell = $cell.prev();
                var phaseIndex = $cell.closest(".matrix-view-row").find(".phase-column").index($prevCell);

                //If there are tasks in the prev cell, add link from last task in that cell to this milestone
                var $prevCellTasks = $prevCell.find(".task ,.milestone");
                while ($prevCell.length > 0 && $prevCellTasks.length == 0) {
                    $prevCell = $prevCell.prev();
                    var prevCellphaseIndex = $cell.closest(".matrix-view-row").find(".phase-column").index($prevCell);
                    if (prevCellphaseIndex != -1 && this.project.phases[prevCellphaseIndex].type === "milestone") {
                        //If the previous column/phase is a Project End column, dont add the automatic link
                        return;
                    }
                    $prevCellTasks = $prevCell.find(".task ,.milestone");
                }
                if ($prevCellTasks.length > 0) {
                    var $lastTaskInPrevCell = $prevCellTasks.eq($prevCellTasks.length - 1);
                    if ($lastTaskInPrevCell.length > 0) {
                        //This last task in prev cell should not be a buffer task
                        // if ($lastTaskInPrevCell.data("model").taskType != 'buffer' || $lastTaskInPrevCell.data("model").taskType)
                        if (!multipleORs($lastTaskInPrevCell.data("model").taskType, TASKTYPE_BUFFER, PE_SHORT, CMS_SHORT))
                            me.addAutoLink($lastTaskInPrevCell, $ms);
                    }
                    return;
                }
            }
        },


        // TODO listeners should be on "app" object
        addGlobalListener: function (eventName, fn) {
            if (!this.globalListeners) {
                this.globalListeners = [];
            }
            $(document).on(eventName, fn);
            this.globalListeners.push({
                name: eventName,
                fn: fn
            });
        },

        removeGlobalListeners: function () {
            for (var i = 0; i < this.globalListeners.length; i++) {
                var listener = this.globalListeners[i];
                // console.log("remove listener");
                $(document).off(listener.name, listener.fn);
            }
            this.globalListeners = [];
        },

        destroy: function () {
            this.removeGlobalListeners();
            this.$view.find(".phase-column").sortable("destroy");
            $(document.body).off("click", this.backgroundClickDelegate);
            this.destroyed = true;

            var tasks = stl.app.matrixView.tasksByUid;
            stl.app.deletePropertiesOfObjectCollection(tasks);
            delete stl.app.matrixView.tasksByUid;

            var milestones = stl.app.matrixView.milestones;
            stl.app.deletePropertiesOfObjectCollection(milestones);
            delete stl.app.matrixView.milestones;

            var rows = stl.app.matrixView.rowsById;
            stl.app.deletePropertiesOfObjectCollection(rows);
            stl.app.matrixView.rowsById;

            for (var property in this) {
                if (this.hasOwnProperty(property)) {
                    delete this[property];
                }
            }
        },

        // getProjectSummaryInfo: function () {
        //     return {
        //         ProjectUid: this.project.uid || "",
        //         //name: unescape(encodeURIComponent(this.project.name)),
        //         name: stl.app.ProjectDataFromServer.name,
        //         //startDate: this.project.startDate.getDate() + "/" + (this.project.startDate.getMonth() + 1) + "/" + this.project.startDate.getFullYear(),
        //         duedate: this.project.dueDate,
        //         Division: this.project.division,
        //         Author: this.project.author,
        //         Subject: this.project.subject,
        //         Category: this.project.category,
        //         LastSaved: this.project.lastSaved,
        //         Manager: this.project.manager,
        //         isIDCCed: this.project.isIDCCed,
        //         Attribute1: this.project.attribute1,
        //         Attribute2: this.project.attribute2,
        //         Attribute3: this.project.attribute3,
        //         Attribute4: this.project.attribute4,
        //         Attribute5: this.project.attribute5,
        //         ProjectFileType: this.project.projectFileType,
        //         IsSubtaskEnabled: this.project.isSubtaskEnabled,
        //         ProjectParticipants: this.project.participants,
        //         ProjectPlanningMode: this.project.ProjectPlanningMode,
        //         ProjectCalendarName: this.project.projectCalendarName,
        //         DefaultStartTime: this.project.defaultStartTime,
        //         DefaultFinishTime: this.project.defaultFinishTime,
        //         DefaultHrsPerDay: this.project.defaultHrsPerDay,
        //         DefaultDaysPerWeek: this.project.defaultDaysPerWeek,
        //         CheckedOutUser: this.project.CheckedOutUser,
        //         CheckedOutStatus: this.project.CheckedOutStatus,
        //         ProjectStatus: this.project.ProjectStatus

        //     };
        // },

        saveProjectToServer: function (saveType, callbk) {
            // console.log("about to save project to server", this.project.uid, this.project);
            var me = this,
                projectSummaryInfo = stl.app.getProjectSummaryInfo();
            // {
            // ProjectUid: this.project.uid || "",
            // name: unescape(encodeURIComponent(this.project.name)),
            // // startDate: this.project.startDate.getDate() + "/" + (this.project.startDate.getMonth() + 1) + "/" + this.project.startDate.getFullYear(),
            // duedate: this.project.dueDate,
            // Division: this.project.division,
            // Author: this.project.author,
            // Subject: this.project.subject,
            // Category: this.project.category,
            // LastSaved: this.project.lastSaved,
            // Manager: this.project.manager,
            // isIDCCed: this.project.isIDCCed,
            // Attribute1: this.project.attribute1,
            // Attribute2: this.project.attribute2,
            // Attribute3: this.project.attribute3,
            // Attribute4: this.project.attribute4,
            // Attribute5: this.project.attribute5,
            // ProjectFileType: this.project.projectFileType,
            // IsSubtaskEnabled: this.project.isSubtaskEnabled,
            // ProjectParticipants: this.project.participants,
            // ProjectPlanningMode: this.project.ProjectPlanningMode,
            // ProjectCalendarName: this.project.projectCalendarName,
            // DefaultStartTime: this.project.defaultStartTime,
            // DefaultFinishTime: this.project.defaultFinishTime,
            // DefaultHrsPerDay: this.project.defaultHrsPerDay,
            // DefaultDaysPerWeek: this.project.defaultDaysPerWeek
            // };
            if (!this.project.uid) {

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    url: SERVER_ROOT_URL + "SaveProjectTableData",
                    data: JSON.stringify(projectSummaryInfo),
                    contentType: "application/json; charset=utf-8"
                })
                    .success(function (response) {
                        if (response != SESSION_TIMED_OUT) {
                            this.onProjectSummarySaved(saveType, projectSummaryInfo, response, callbk);
                        } else {
                            RedirectToLogInPage();
                        }
                    } .bind(this));

            } else {
                this.saveProjectJsonToServer(saveType, projectSummaryInfo, callbk);
            }
        },

        // saveTemplateToServer: function (saveType, callbk, TemplateData) {
        //     // console.log("about to save project to server", this.project.uid, this.project);
        //     var isTemplate = true;
        //     var me = this,
        //         projectSummaryInfo = {
        //             ProjectUid: "",
        //             Description: TemplateData.description,
        //             name: unescape(encodeURIComponent(TemplateData.name)),
        //             // startDate: this.project.startDate.getDate() + "/" + (this.project.startDate.getMonth() + 1) + "/" + this.project.startDate.getFullYear(),
        //             duedate: this.project.dueDate,
        //             Division: this.project.division,
        //             Author: this.project.author,
        //             Subject: this.project.subject,
        //             Category: this.project.category,
        //             LastSaved: this.project.lastSaved,
        //             Manager: this.project.manager,
        //             isIDCCed: this.project.isIDCCed,
        //             Attribute1: this.project.attribute1,
        //             Attribute2: this.project.attribute2,
        //             Attribute3: this.project.attribute3,
        //             Attribute4: this.project.attribute4,
        //             Attribute5: this.project.attribute5,
        //             ProjectFileType: PROJECT_TYPE_PPI_TEMPLATE,
        //             IsSubtaskEnabled: this.project.isSubtaskEnabled,
        //             ProjectParticipants: this.project.participants,
        //             ProjectCalendarName: this.project.projectCalendarName,
        //             DefaultStartTime: this.project.defaultStartTime,
        //             DefaultFinishTime: this.project.defaultFinishTime,
        //             DefaultHrsPerDay: this.project.defaultHrsPerDay,
        //             DefaultDaysPerWeek: this.project.defaultDaysPerWeek,
        //             CheckedOutUser: this.project.CheckedOutUser,
        //             CheckedOutStatus: this.project.CheckedOutStatus,
        //             ProjectStatus: this.project.ProjectStatus
        //         };


        //     $.ajax({
        //         type: "POST",
        //         dataType: "json",
        //         url: SERVER_ROOT_URL + "SaveProjectTableData",
        //         data: JSON.stringify(projectSummaryInfo),
        //         contentType: "application/json; charset=utf-8"
        //     })
        //         .success(function (response) {
        //             if (response != SESSION_TIMED_OUT) {
        //                 stl.app.matrixView.onProjectSummarySaved(saveType, projectSummaryInfo, response, callbk, isTemplate);
        //             } else {
        //                 RedirectToLogInPage();
        //             }
        //         });

        // },

        onProjectSummarySaved: function (saveType, projectSummary, serverResponse, callbk, isTemplate) {
            if (parseInt(serverResponse) !== 0) {
                projectSummary.ProjectUid = serverResponse;

                // Do not update the Project UID of existing Project while saving as template
                // Update only for PPI type not for  PPI_TEMPLATE
                if (projectSummary.ProjectFileType === PROJECT_TYPE_PPI)
                    this.project.uid = serverResponse;

                if (callbk) {
                    this.saveProjectJsonToServer(saveType, projectSummary, callbk, isTemplate);
                } else {
                    this.saveProjectJsonToServer(saveType, projectSummary, null, isTemplate);
                }
            } else {
                PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);
                if (callbk)
                    callbk(serverResponse);
            }
        },

        saveProjectJsonToServer: function (saveType, projectSummary, callbk, isTemplate) {
            // Manually constructing JSON here because we can't call stringify on project directly
            var serverJson = "{ \"processType\": " + saveType + ",\"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + this.project.getJSON(isTemplate, projectSummary.name) + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + ", \"CCSummary\": " + JSON.stringify(GetUpdatedCCSummaryData()) + " }";
            $.ajax({
                type: "POST",
                dataType: "json",
                url: SERVER_ROOT_URL + "SaveJsonBlobData",
                data: serverJson,
                contentType: "application/json; charset=utf-8"
            })
                .success(function (response) {
                    if (response != SESSION_TIMED_OUT) {
                        //localStorage.setItem(LOCAL_STORAGE_LAST_PROJECT_UID_KEY, projectSummary.ProjectUid);
                        if (response !== FALSE_CONSTANT) {
                            if (callbk) {
                                callbk(response);
                            }
                            if (!stl.app.revisionHistory) {
                                stl.app.revisionHistory = new stl.view.RevisionHistory({
                                    projectUid: projectSummary.ProjectUid
                                });
                                stl.app.revisionHistory.init();
                            } else
                                stl.app.revisionHistory.callBackAfterSave();
                        } else {
                            PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);
                        }
                    } else {
                        RedirectToLogInPage();
                    }
                })
        },

        setReadOnly: function (readOnly, force) {
            if (readOnly === this.readOnly && !force) return;
            this.readOnly = readOnly;
            this.$view.find(":input").prop("disabled", readOnly);
            $("#templates :input").prop("disabled", readOnly);
            if (readOnly) {
                this.$view.addClass("read-only");
            } else {
                this.$view.removeClass("read-only");
            }
        },

        setExtraZoomOutEnabled: function (enabled) {
            this.extraZoomOutEnabled = enabled;
            if (enabled) {
                $(".zoom-button.zoom-out").addClass("pseudo-enabled");
            } else {
                $(".zoom-button.zoom-out").removeClass("pseudo-enabled");
            }
        },

        getTaskOrMilestoneInfoById: function (taskId) {
            var taskInfo;
            var taskfound = false;
            var taskbyUidMap = this.tasksByUid;
            var milestoneByUidMap = this.milestoneElementsById;

            $.each(taskbyUidMap, function (index, currentTask) {
                if (currentTask.task.id == taskId) {
                    taskInfo = currentTask;
                    taskfound = true;
                    return false;
                }
            });
            if (!taskfound) {
                $.each(milestoneByUidMap, function (index, currentMilestone) {
                    var milestoneData = currentMilestone.data('model');
                    if (currentMilestone.id == taskId) {
                        taskInfo = currentMilestone;
                        taskfound = true;
                        return false;
                    }
                });
            }
            return taskInfo;
        },

        scrollIntoView: function ($task, forceWidth, forceHeight) {
            var scrollLeft = this.$viewport.scrollLeft(),
                scrollTop = this.$viewport.scrollTop(),
                viewportOffset = this.$viewport.offset(),
                taskOffset = $task.offset(),
                taskWidth = forceWidth || $task.width(),
                taskHeight = forceHeight || $task.height(),
                desiredMarginPx = 20,
                scrollBarSize = 20,
                desiredLeft = scrollLeft,
                desiredTop = scrollTop;
            if (taskOffset.left < viewportOffset.left + desiredMarginPx) {
                // Scroll left to bring task into view
                // NOTE, there is an issue in Chrome where entering quick-task-select jumps too far left and
                // the task is centered on screen.  This is happening when TaskView focuses on the overflow text field,
                // it's not due to this code.
                desiredLeft -= (viewportOffset.left + desiredMarginPx - taskOffset.left);
            } else if (taskOffset.left + taskWidth > viewportOffset.left + this.$viewport.width() - desiredMarginPx - scrollBarSize) {
                // Scroll right to fit task entirely in view
                desiredLeft += (taskOffset.left + taskWidth - (viewportOffset.left + this.$viewport.width() - desiredMarginPx - scrollBarSize));
            }
            if (taskOffset.top < viewportOffset.top + desiredMarginPx) {
                // Scroll up to bring task into view
                desiredTop -= (viewportOffset.top + desiredMarginPx - taskOffset.top);
            } else if (taskOffset.top + taskHeight > viewportOffset.top + this.$viewport.height() - desiredMarginPx - scrollBarSize) {
                // Scroll down to fit task entirely in view
                desiredTop += (taskOffset.top + taskHeight - (viewportOffset.top + this.$viewport.height() - desiredMarginPx - scrollBarSize));
            }
            this.$viewport
                .scrollLeft(desiredLeft)
                .scrollTop(desiredTop);
        },

        onHighlightAdjacent: function (evt, $task, highlightPredecessors) {
            // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
            if ($task.closest(this.$view).length === 0) return;
            this.linksView.highlightImmediateTasks($task, highlightPredecessors);
        },

        onHighlightPredecessors: function (evt, $task) {
            // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
            if ($task.closest(this.$view).length === 0) return;
            this.linksView.highlightAllPredecessors($task);
        },

        onHighlightSuccessors: function (evt, $task) {
            // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
            if ($task.closest(this.$view).length === 0) return;
            this.linksView.highlightSuccessorTasks($task);
        },

        onHighlightConstraining: function (evt, $task) {
            // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
            if ($task.closest(this.$view).length === 0) return;
            this.highlightConstrainingTasks($task);
        },
        onHighlightMilestone: function (sender, id) {

            var found = false;
            var allTasks = this.tasksByUid;
            var allMilestonesByUidMap = this.milestoneElementsById;


            var taskInfo = allTasks[id];
            if (taskInfo) {
                taskInfo.$el.addClass("highlightedMilestoneTask");
                found = true;
            }

            if (!found) {
                var milestone = allMilestonesByUidMap[id];
                if (milestone) {
                    $(milestone).addClass("highlightedMilestoneTask");
                }
            }

        },

        /*----------------------Region - Summary related functions ---------------*/

        retainSummaryTaskInRowModel: function (rowModel, tasksByPhaseId) {
            var me = this;
                      
            var summaryTask = me.project.getSummaryTaskFromRow(rowModel);

            //TBD - need to remove this hardcoding of phase UID = 1
            //always adding summary task in phase having uid 1
            if (summaryTask) {
                var summaryPhaseUID = summaryTask.phaseId; //Revisit

                if (tasksByPhaseId[summaryPhaseUID]) {
                    tasksByPhaseId[summaryPhaseUID].splice(0, 0, summaryTask);
                }
                else {
                    var tasksArray = [];
                    tasksArray[0] = summaryTask;
                    tasksByPhaseId[summaryPhaseUID] = tasksArray;
                }
            }

            return tasksByPhaseId;
        },

        saveSummaryTaskInRowModel: function ($row, summaryTaskModel) {

            var rowModel = $row.data("model");
            var phaseId = summaryTaskModel.phaseId; //Revisit
            var existingTasksInRow = rowModel.tasks;
            //summaryTaskModel.order = 0;
            var tasksByPhaseId = rowModel.tasks; // {};


            //TBD - need to remove this hardcoding of phase ID - 1
            //always adding summary task in phase having uid 1
            if (summaryTaskModel) {//&& tasksByPhaseId[1]
                if (tasksByPhaseId[phaseId]) {
                    tasksByPhaseId[phaseId].splice(0, 0, summaryTaskModel);
                }
                else {
                    var tasksArray = [];
                    //tasksByPhaseId = [];
                    tasksArray[0] = summaryTaskModel;
                    tasksByPhaseId[phaseId] = tasksArray;
                }
            }

            if (rowModel) {
                rowModel.tasks = tasksByPhaseId;
            }

            this.triggerSave();

            return rowModel;
        },

        onSummaryTaskAdd: function (evt, sender, $task, task, parentRow, phase, $row) {
            if (sender === this) {
                return;
            }
            this.saveRow($row);
        },

        onSummaryTaskRemove: function (evt, sender, summaryTask) {
            if (sender === this) {
                //this.saveSummaryTaskInRowModel($row, task);
                return;
            }

        },

        addSummaryTaskToRow: function (rowModel, scopeItemNewVal, $newRow, selectedNode) {
            //Vrushali - MultiLevelWBS We might have make changes related to Summary Task here
            var me = this;
            var phase = this.project.phases[0]; //it can be set to null as well                                
            var $task;
            var summaryTask = me.project.createTaskModel(phase, rowModel, STRING_NORMAL, true);
            rowModel = me.saveSummaryTaskInRowModel($newRow, summaryTask);
            //me.tasksByUid[summaryTask.uid] = null;             

            $(document).trigger("summaryTaskAdd", [
                        me,
                        $task,
                        summaryTask,
                        scopeItemNewVal,
                        phase,
                        $newRow
            ]);
            return rowModel;
        },

        deleteSummaryTaskFromRow: function (rowModel, selectedNode) {
            //Vrushali - MultiLevelWBS We might have make changes related to Summary Task here
            var me = this;
            var phase = me.project.phases[0]; //it can be set to null as well                                
            var $task;
            var dataObj = me.project.deleteSummaryTaskFromRowModel(rowModel);

            if (dataObj.summaryTask) {
                //delete me.tasksByUid[dataObj.summaryTask.uid];
                $(document).trigger("summaryTaskRemove", [me, dataObj.summaryTask]);
            }

            return dataObj.rowModel;
        },

        getScopeTreeNode: function (rowUid) {
            var tree = Ext.getCmp("scopeItemTree").getRootNode();
            var node = this.findChildRecursively(tree, "rowUid", rowUid);
            return node;
        },

        onSummaryTaskDatesChanged: function () {

        },

        getSummaryTasksFromPhase: function (phaseUId) {
            var me = this;
            var arrayOfSummaryTasksToBeMoved = [];
            var allSummaryTasksInProject = me.project.getAllSummaryTasks();

            for (var i = 0; i < allSummaryTasksInProject.length; i++) {
                var summaryTask = allSummaryTasksInProject[i];
                if (summaryTask.phaseId == phaseUId) {
                    arrayOfSummaryTasksToBeMoved.push(summaryTask);
                }
            }

            return arrayOfSummaryTasksToBeMoved;
        },

        moveSummaryTasksToDifferentPhase: function (arrayOfSummaryTasksToBeMoved) {
            var me = this;
            var phases = me.project.phases;
            if (phases.length > 0) {
                var firstPhase = phases[0];
                var firstPhaseUID = firstPhase.uid;
                _.each(arrayOfSummaryTasksToBeMoved, function (summaryTask, index, list) {
                    var rowUID = summaryTask.rowId;
                    var $row = me.rowsById[rowUID],
                        rowModel = $row.data("model");
                    var oldPhaseID = summaryTask.phaseId;

                    summaryTask.phaseId = firstPhaseUID; //Important - Change phase uid to first phase in sequence
                    me.saveSummaryTaskInRowModel($row, summaryTask);

                    //need to delete summary tasks belonging to previous phase which was deleted 
                    //normal tasks must have been deleted in deletePhase method, 
                    //only summary tasks will remain in rowModel for that phase id
                    delete rowModel.tasks[oldPhaseID];

                });
            }
        },


        /*------------End of region of summary related functions ------------------*/
        wireTaskEvents: function() {
            $(".matrix-view-viewport").click(function(evt) {
                var $task = $(evt.target).closest(".task");
                if ($task && $task.length > 0) {
                    var taskView = $task.data("view");
                    if (taskView && taskView.templateCfg && taskView.templateCfg.loadViaTemplate && 
                        stl.app.loadByTemplating && !taskView.completeTemplateLoaded) {
                      
                        switch (evt.target.className.trim()) {
                            case "add-task-plus-icon":
                                taskView.onTaskAddButtonClick(evt);
                                break;
                            case "task-name":
                            case "fullkit-name":
                            case "task-name-input":
                            case "drag-drop-handle":
                                if (taskView.onClickForMultiSelect(evt)){
                                    taskView.loadPartialViewViaTemplate();
                                    taskView.load(taskView.task);
                                    taskView.enterQuickEditMode();
                                }
                                break;
                            case "task-magnify-button":
                                taskView.loadPartialViewViaTemplate();
                                taskView.load(taskView.task);
                                taskView.onTaskZoomClick(evt);
                                break;

                         
                        }
                    }
                }

            });
        }
    });
} ()));