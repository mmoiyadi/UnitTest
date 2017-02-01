Ext.define('ProjectPlanning.view.tableView.TableView', {
    extend: 'Ext.tree.Panel',
    requires: [
        "ProjectPlanning.view.tableView.TableViewController",
        "ProjectPlanning.view.tableView.TableViewModel",
        'Ext.data.*',
        'Ext.grid.*',
        'Ext.tree.*',
        'Ext.XTemplate',
        'ProjectPlanning.model.ProjectTreeNode',
        'ProjectPlanning.view.tableView.ContextMenu'
    ],
    controller: "tableview-tableview",
    viewModel: {
        type: "tableview-tableview"
    },
    xtype: 'ptableview',
    alias: "widget.ptableview",
    useArrows: false,
    rootVisible: false,
    multiSelect: false,
    cls: "table-view",
    selModel: 'rowmodel',
    //border: 5,
    readOnly: false,
    editingColumn: null,
    rowLines: true,
    trackMouseOver: false,
    isCheckListIconClicked: false,
    viewConfig: {
        toggleOnDblClick: false,
        getRowClass: function (record, index) {

            if (this.ownerCt.project.isProjectComplex()) {
                if (record.get('type-internal') == "SUMMARY_TASK") {
                    return 'row-summary-task';
                }
            } else {
                return 'simpleProject';
            }
            //return 'row-task';
        }
    },
    plugins: [{
        ptype: 'cellediting',
        clicksToEdit: 1,
        listeners: {
            beforeedit: function (editor, evt, opts) {
                var tableView = Ext.getCmp('tableview');
                if (tableView.isCheckListIconClicked) {
                    tableView.isCheckListIconClicked = false;
                    return false;
                }
                if (this.cmp.readOnly)
                    return false;
                var nodetype = evt.record.get('type-internal');
                if (evt.field == 'taskId')
                    return false;
                if ((nodetype == "BLOCK" || nodetype == "MILESTONE") && 1 && evt.field == "scopeItemName")
                    return false;
                if ((nodetype == "SUMMARY_TASK" && !(evt.field == "scopeItemName")) || ((nodetype == "PHASE" || nodetype == "SCOPE_ITEM") && !(evt.field === "name")))
                    return false;
                if (((nodetype === "PHASE" || nodetype === "SCOPE_ITEM") && evt.field === "type"))
                    return false;
                if (nodetype === "BLOCK") {
                    if (evt.record.get('type') === 'fullkit') {
                        if (evt.field === 'type' || evt.field === 'volume' || evt.field === 'subtasksWIPLimit' || evt.field === 'snet' || evt.field === 'subtaskType' ||
                            evt.field === 'startDate' || evt.field == 'duration')
                            return false;
                        if ((evt.record.get('status') === "NS" || evt.record.get('status') === "CO") && evt.field === 'endDate')
                            return false;
                    }

                    if (evt.record.get('type') === "purchasing") {

                        var isReady = evt.record.get('model').isReadyToStart;
                        var stat = evt.record.get('status');

                        if (evt.field === 'duration' && isReady) {
                            return false;
                        }

                        if (evt.field === 'endDate' && !this.cmp.isReadyAndIP(isReady, stat)) {
                            return false;
                        }
                    }

                    if (evt.record.get('type') != 'snet' && evt.field == 'snet')
                        return false;
                    var subtasktype = evt.record.get('subtaskType');
                    if ((subtasktype == SubtaskTypesEnum.SEQUENTIAL && (evt.field == "volume" || evt.field == 'subtasksWIPLimit')) || (subtasktype == '2' && evt.field == 'subtasksWIPLimit') || (subtasktype == '3' && evt.field == 'volume') || (subtasktype == '4' && (evt.field == 'volume' || evt.field == 'subtasksWIPLimit')))
                        return false;
                    if (isBufferTask(evt.record)) {
                        if (evt.field == 'manager' || evt.field == "status" || evt.field == "type" || evt.field == "subtaskType" ||
                            evt.field == 'snet' || evt.field == 'volume' || evt.field == 'subtasksWIPLimit' || evt.field == "participants" ||
                            evt.field == 'resources')
                            return false;
                    }
                } else if (nodetype === "LIST_ITEM") {
                    if (multipleORs(evt.field, "type", "scopeItemName", "phaseName", "subtaskType", "snet", 'volume', 'subtasksWIPLimit', "startDate", 'endDate', "successors", "predecessors"))
                        return false;
                    if (evt.field === "status" && evt.record.parentNode.get('subtaskType') == '2')
                        return false;
                    if (evt.record.parentNode.get('type') === IMS_SHORT)
                        return false;

                } else if (nodetype === "MILESTONE") {
                    var type = evt.record.get('type');
                    if (type == "PEMS" || type == "IPMS") {
                        if (!multipleORs(evt.field, "manager", "resources", "participants", "name", "text22"))
                            return false;
                    }
                    if (evt.field == "duration") {
                        if (evt.record.get('type') !== "IMS" /* or if config Allow IMS tasks with non zero duration == false*/)
                            return false;
                    }
                    if (evt.field == "resources") {
                        if (evt.record.get('type') == "CMS") {
                            PPI_Notifier.info(CMS_RESOURCES_NOT_ALLOWED);
                            return false;
                        }
                    }
                    if (evt.field == "snet" || evt.field == "subtaskType" || evt.field == "subtasksWIPLimit")
                        return false;
                    if (evt.field === 'type' && evt.record.get('status') === STATUS_CO)
                        return false;

                }
                if (evt.field === "duration") {
                    var defDuration = (evt.record.get("type-internal") == "BLOCK") ? TASK_DURATION_DEFAULT_STR : SUBTASK_DURATION_DEFAULT_STR;
                    evt.value = ValidationClassInstance.getValidDurationString(evt.value, defDuration, false);
                } else if (evt.field === "name" && nodetype === "NEW_ROW")
                    $(".x-grid-row-placeholder .new-task-placeholder").hide();
                return true;
            },
            /**
            * Not using this event to validate the edit, but because it's the only available hook that has the
            * right timing to revert the scroll position to work around a possible Sencha bug where the grid
            * scrolls left after an edit, see: http://www.sencha.com/forum/showthread.php?279701
            */
            validateedit: function (editor, evt, opts) {
                // Grab scroll position and set up an event listener to change it back after the grid scrolls
                var treeViewEl = this.cmp.getEl().down(".x-tree-view");
                this.cmp.on("edit", function () {
                    setTimeout(function () {
                        treeViewEl.scrollTo('left', scrollPos.left);
                        treeViewEl.scrollTo('top', scrollPos.top);
                    } .bind(this), 0);
                }, this, {
                    single: true
                });
                var scrollPos = treeViewEl.getScroll();
            },
            edit: function (editor, evt, opts) {
                var tableView = Ext.getCmp('tableview');
                if (editor.lastKeyCode === 13) {
                    var rec = evt.record;
                    if (evt.record.get("type-internal") == "BLOCK") {
                        if (rec.childNodes.length > 0) {
                            if (rec.isExpanded())
                                editor.startEdit(rec.childNodes[0], evt.colIdx);
                            else
                                editor.startEdit(rec.nextSibling, evt.colIdx);
                        } else
                            editor.startEdit(rec.nextSibling, evt.colIdx);
                    } else {
                        if (rec.nextSibling)
                            editor.startEdit(rec.nextSibling, evt.colIdx);
                        else
                            editor.startEdit(rec.parentNode.nextSibling, evt.colIdx);
                    }
                }
                if (evt.field === "duration") {
                    var defDuration, defDurationStr;
                    var taskModel;

                    if (evt.record.get("type-internal") == "BLOCK") {
                        defDuration = TASK_DURATION_DEFAULT,
                            defDurationStr = TASK_DURATION_DEFAULT_STR;
                        evt.value = ((evt.record.get("status") == "CO") ? 0 : evt.value);
                    } else if (evt.record.get("type-internal") == "LIST_ITEM") {
                        defDuration = SUBTASK_DURATION_DEFAULT,
                            defDurationStr = SUBTASK_DURATION_DEFAULT_STR;
                        if (evt.record.get("status") == "CO")
                            evt.value = 0;
                        else {
                            if (ZERO_DURATION_REGEX.test(evt.value)) {
                                PPI_Notifier.info(getStringWithArgs(ZERO_DURATION_NOT_ALLOWED, SUBTASKS));
                                evt.value = SUBTASK_DURATION_DEFAULT;
                            }
                        }
                    }
                    var parsedVal = ValidationClassInstance.getValidDuration(evt.value, defDuration, true);
                    evt.value = ValidationClassInstance.getValidDurationString(parsedVal, defDurationStr, true);
                    evt.record.set(evt.field, parsedVal);
                }
                switch (evt.record.get("type-internal")) {
                    case "NEW_ROW":
                        if ((evt.field === "name" && evt.value == '') || (evt.field !== "name" && evt.record.get("name") == ''))
                            return false;
                        evt.record.set("type-internal", "LIST_ITEM");
                        // TODO don't assign a phase, leave it blank and have cardview display "no-phase" cards somewhere else
                        evt.record.set("phase", '1');
                        var store = evt.record.store.treeStore;
                        store.getRootNode().appendChild({
                            'type-internal': "NEW_ROW",
                            'leaf': true,
                            'Id': "NEW_NODE_" + String(Math.round(Math.random() * 1000000).toFixed(0))
                        });
                        // TODO notify dataprovider of new record
                        break;
                    case "SCOPE_ITEM":
                        var thisView = this.cmp,
                            recModel = evt.record.data.model;
                        recModel.name = evt.record.get('name');
                        $(document).trigger("scopeitemchange", [thisView, evt.record.data.model]);
                        break;
                    case "LIST_ITEM":
                        var thisView = this.cmp,
                            id = evt.record.get("Id");
                        var currentRec = evt.record;
                        var taskdata = currentRec.parentNode.get('model');
                        var subtask = $.grep(taskdata.subtasks, function (e) {
                            if (e.uid === currentRec.get('Id'))
                                return e;
                        })[0];
                        switch (evt.field) {
                            case "duration":
                                var origDuration = subtask.remainingDuration;
                                var newDuration = currentRec.get('duration');
                                subtask.remainingDuration = currentRec.get('duration');
                                if (evt.record.get("type-internal") == "LIST_ITEM") {
                                    this.cmp.project.reCalculateSubTaskStartDate(taskdata);
                                    this.cmp.setSubtaskStartDates(taskdata, currentRec.parentNode);
                                    if (stl.app.isValueChanged(origDuration, newDuration))
                                        this.cmp.rollupDurationChange(thisView, taskdata, currentRec.parentNode);
                                }
                                break;
                            case "manager":
                                subtask.manager = currentRec.get('manager');
                                break;
                            case "name":
                                subtask.name = currentRec.get('name');
                                break;
                            case "resources":
                                subtask.resources = currentRec.get('resources');
                                for (var i = 0; i < subtask.resources.length; i++) {
                                    var res = thisView.project.getResourceByUid(subtask.resources[i].resourceId);
                                    Ext.getCmp('resGrid').updateResourceSheet(res, subtask.resources[i].units, subtask);
                                }
                                break;
                            case "status":
                                var oldStatus = subtask.status;
                                var newStatus = currentRec.get('status');    
                                if(oldStatus != newStatus){                            
                                    var parentTaskNode = currentRec.parentNode;
                                    var subtaskType = parentTaskNode.get('subtaskType');

                                    if (subtaskType == SubtaskTypesEnum.WIP) {
                                        var taskModel = parentTaskNode.get('model');

                                        if (currentRec.get('status') == STATUS_IP && tableView.project.isWIPLimitExceeded(taskModel, STATUS_IP)) { 
                                            
                                                PPI_Notifier.confirm(WIP_LIMIT_EXCEEDED_ALERT_MESG, WIP_LIMIT_EXCEEDED_TITLE,
                                                 function () {
                                                     tableView.updateSubtaskStatus(evt, tableView, currentRec, taskdata, subtask);
                                                     $(document).trigger("taskchange", [tableView, taskdata /* ,phaseId */]);
                                                 }, function () {
                                                     currentRec.set('status', evt.originalValue);
                                                 });
                                            
                                        }
                                        else
                                        {
                                            tableView.updateSubtaskStatus(evt, tableView, currentRec, taskdata, subtask);
                                        }
                                    }
                                    else {
                                        tableView.updateSubtaskStatus(evt, tableView, currentRec, taskdata, subtask);
                                    }
                                 }   
                                break;
                            case "participants":
                                subtask.participants = currentRec.get('participants');
                                break;
                        }
                        if (currentRec.parentNode.get('type-internal') == "BLOCK")
                            $(document).trigger("taskchange", [thisView, taskdata /* ,phaseId */]);
                        else
                            $(document).trigger("milestoneupdate", [currentRec.parentNode.get('model'), '', null]);
                        break;
                    case "BLOCK":
                    case "SUMMARY_TASK":
                        var thisView = this.cmp;
                        var currentRec = evt.record;
                        var taskdata = currentRec.get('model');
                        thisView.editingColumn = null;
                        if (thisView.onTaskPropertyChange(thisView, currentRec, taskdata, evt.field)) {
                            $(document).trigger("taskchange", [thisView, taskdata/* ,phaseId */]);
                        }
                        thisView.editingColumn = null;
                        break;
                    case "PHASE":
                        var thisView = this.cmp;
                        var currentRec = evt.record;
                        var phase_model = currentRec.get('model');
                        phase_model.name = currentRec.get('name');
                        $(document).trigger("phasechange", [thisView, phase_model, phase_model.order]);
                        break;
                    case "MILESTONE":
                        var thisView = this.cmp,
                            id = evt.record.get("Id");
                        var currentRec = evt.record;
                        var taskdata = currentRec.get('model');
                        if (evt.field == "resources" || evt.field=="duration") {
                            if (thisView.onTaskPropertyChange(thisView, currentRec, taskdata, evt.field))
                                $(document).trigger("taskchange", [thisView, taskdata/* ,phaseId */]);
                        } else {
                            if (currentRec.get(evt.field) != taskdata[evt.field === "type" ? "taskType" : evt.field])
                                thisView.onTaskPropertyChange(thisView, currentRec, taskdata, evt.field);
                        }

                        thisView.editingColumn = null;
                        break;
                    case "SUMMARY_TASK":
                        switch (evt.field) {

                        }
                        break;
                }
            }
        }
    }, {
        ptype: 'treefilter',
        allowParentFolders: true,
        collapseOnClear: false
    }, {
        ptype: 'dragfill',
        validateFill: function (rec, fieldName) {
            if (rec.get('type-internal') == "SUMMARY_TASK")
                return false;
            if (rec.get("type-internal") == "BLOCK") {
                if (!multipleORs(rec.get('type'), STRING_NORMAL, TASKTYPE_PT, TASKTYPE_SNET, IMS_TITLE, TASKTYPE_FULLKIT))
                    return false;
                return true;
            }
            if (rec.get("type-internal") === "MILESTONE") {
                if (fieldName === "resources" && multipleORs(rec.get('type'), CMS_SHORT))
                    return false;
            }
            return true;
        },
        listeners: {
            edit: function (rec, fieldName) {
                // TODO really, the "record changed" processing done in the cellediting "edit" event above needs
                // to be factored out and run when the store raises a "record changed" event, instead of being
                // wired directly to the grid.  Then the store would do the same logic every time a record is
                // changed whether it's by this plugin or the cellediting plugin.
                // For now, just broadcasting changes to task models.
                var thisView = this.cmp;
                if (rec.get("type-internal") === "BLOCK") {
                    var taskModel = rec.get('model');
                    // TODO create a generic function to update a task model from a store record
                    ['status', 'manager', 'resources', 'participants'].forEach(function (prop) {
                        taskModel[prop] = rec.get(prop);
                    });
                    $(document).trigger("taskchange", [thisView, taskModel /* ,phaseId */]);
                }
                else if( rec.get("type-internal") === "LIST_ITEM"){
                    var taskModel = rec.parentNode.get('model');
                    var subtaskModel = _.find(taskModel.subtasks,function(subtask){
                        return subtask.uid == rec.get('Id');
                    });
                    // TODO create a generic function to update a task model from a store record
                    ['status', 'manager', 'resources', 'participants'].forEach(function (prop) {
                        subtaskModel[prop] = rec.get(prop);
                    });
                    $(document).trigger("taskchange", [thisView, taskModel /* ,phaseId */]);
                }
                else if (rec.get("type-internal") === "MILESTONE") {
                    thisView.onTaskPropertyChange(thisView, rec, rec.get('model'), fieldName);
                }
            }
        }
    }],

    initComponent: function () {
        var tableView = this;
        var me = this;
        this.compact = !!this.initialConfig.compact;
        var subtaskTypeStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: subtaskTypes
        });
        var taskTypeStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: taskTypes
        });
        var statusStore = Ext.create('Ext.data.Store', {
            fields: ['status', 'name'],
            data: statusTypes
        });

        Ext.apply(this, {
            store: this.store || new Ext.data.TreeStore({
                model: ProjectPlanning.model.ProjectTreeNode,
                root: {
                    id: 'proj-container',
                    Id: 'proj-container',
                    name: 'Projects',
                    expanded: true,
                    children: []
                }
            }),
        columns: [{
            xtype: 'treecolumn',
            tdCls: 'scopeColumn',
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SCOPE'),
            width: 180,
            sortable: true,
            dataIndex: 'scopeItemName',
            itemId: 'scope',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SCOPE'),
            hideable: false,
            editor: {
                xtype: 'textfield',
                allowBlank: false,
                allowOnlyWhitespace: false
            },
            renderer: function (val, metadata, record) {
                recType = record.get('type-internal');
                /*if(record.get('row_model').name != "" && multipleORs(recType,"BLOCK","LIST_ITEM","MILESTONE"))
                metadata.css = 'no-leaf-icon';*/
                if (record.get('scopeItemName')) {
                    //Show scope name for all rows irrespective of whether it is same as the previous one
                    if ((record.get('type-internal') == "BLOCK" || record.get('type-internal') == "MILESTONE") &&
                        this.project.isProjectComplex() && (this.summaryStructureVisible || this.summaryStructureVisible == undefined))

                        return "";
                    else {
                        if (record.get('scopeItemId') == this.project.getProjectRootScope().uid) {
                            return "";
                        } else {
                            if (this.project.isProjectComplex())
                                return record.get('scopeItemName');
                            else
                                return record.get('row_model').name;
                        }
                    }
                }
                return "";
            } .bind(this)

        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_PHASE'),
            width: 120,
            sortable: true,
            dataIndex: 'phaseName',
            itemId: 'phase',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_PHASE'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_PHASE'),
            renderer: function (val, metadata, record) {
                if (record.get("phaseName")) {
                    //Show phase name for all rows irrespective of whether it is same as the previous one
                    return record.get("phaseName");
                }
                return "";
            } .bind(this)
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_MSP_TASK_ID'),
            width: 60,
            sortable: true,
            dataIndex: 'taskId',
            itemId: 'taskId',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_MSP_TASK_ID'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_MSP_TASK_ID'),
            renderer: function (val, metadata, record) {
                recType = record.get('type-internal');
                if (record.get('taskId') != -1)
                    return record.get("taskId");
                return "";
            } .bind(this)
        }, {
            xtype:stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SCOPE')?'treecolumn':'gridcolumn',
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASKNAME'),
            width: 200,
            sortable: true,
            align: 'left',
            dataIndex: 'name',
            itemId: 'name',
            //hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASKNAME'),
            //hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASKNAME'),
            hideable:stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SCOPE')?false:true,
            editor: {
                xtype: 'textfield',
                allowBlank: false,
                allowOnlyWhitespace: false,
                selectOnFocus: true
            },
            renderer: function (val, metadata, record, rowIndex, colIndex, store, view) {
                // TODO might insert the left-margin graphic here instead of using pure CSS
                if (record.get('type-internal') == "SUMMARY_TASK")
                    return "";
                if (record.get("type-internal") === "NEW_ROW") {
                    return '<span class="new-task-placeholder">New task...</span>';
                } else {
                    if ((record.get("type-internal") == "LIST_ITEM" || (record.get("type-internal") == "BLOCK" || record.get("type-internal") == "MILESTONE") && !isBufferTask(record) && !isInternalMS(record))) {

                        var id = CHECKLIST_IMG + record.get('Id'),
                                img = "./resources/images/checklistnone.gif";
                        if (record.get('checklistStatus') === 2) {
                            img = "./resources/images/chklistcomplete.gif";
                        } else if (record.get('checklistStatus') === 1) {
                            img = "./resources/images/checklist.GIF";
                        } else if (record.get('checklistStatus') === 0) {
                            img = "./resources/images/checklistnone.GIF";
                        }
                        if (record.get('type-internal') == "LIST_ITEM") {
                            metadata.css = "subtask-alignment";
                        }
                        return '<img id= ' + id + ' class="image-button" src="' + img + '" onclick="showChecklistItems(event)"></img>' + val;
                    } else {
                        if (val)
                            return val;
                        else
                            return record.get('emptyText');
                    }
                }
            },
            /** Must provide alternate Excel renderer because the <img> tag in the renderer will break Excel */
            getExcelExportValue: function (val, record) {
                if (record.get('type-internal') == "SUMMARY_TASK")
                    return "";
                return val || record.get('emptyText');
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_REMAINING_DURATION'),
            width: 100,
            sortable: true,
            dataIndex: 'duration',
            itemId: 'duration',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_REMAINING_DURATION'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_REMAINING_DURATION'),
            renderer: function (val, metadata, record) {
                if (record.get('duration') != -1) {
                    if (record.get("type-internal") === "LIST_ITEM") {
                        return ValidationClassInstance.getValidDurationString(record.get('duration'), SUBTASK_DURATION_DEFAULT_STR, false);

                    } else if (record.get("type-internal") === "BLOCK") {
                        return ValidationClassInstance.getValidDurationString(record.get('duration'), TASK_DURATION_DEFAULT_STR, false);
                    } else {
                        return ValidationClassInstance.getValidDurationString(record.get('duration'), ZERO_DURATION_STR, false);
                    }
                }
                return "";
            },
            editor: {
                xtype: 'textfield',
                allowBlank: false,
                allowOnlyWhitespace: false
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_P2PADD_PREDECESSORTASK'),
            Width: 100,
            dataIndex: 'predecessors',
            itemId: 'predecessors',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_P2PADD_PREDECESSORTASK'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_P2PADD_PREDECESSORTASK'),
            renderer: function (val, metadata, record, rowIndex, colIndex, store, view) {
                return record.get('predecessors');
            },
            editor: {
                xtype: 'textfield',
                allowBlank: true,
                allowOnlyWhitespace: true
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_P2PADD_SUCCESSORTASK'),
            Width: 100,
            dataIndex: 'successors',
            itemId: 'successors',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_P2PADD_SUCCESSORTASK'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_P2PADD_SUCCESSORTASK'),
            renderer: function (val, metadata, record, rowIndex, colIndex, store, view) {
                return record.get('successors');
            },
            editor: {
                xtype: 'textfield',
                allowBlank: true,
                allowOnlyWhitespace: true
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST'),
            width: 160,
            dataIndex: 'resources',
            itemId: 'resources',
            align: 'left',
            draggable: true,
            allowDragFill: true,
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST'),
            renderer: function (val, metadata, record, rowIndex, colIndex, store, view) {
                if (!view.tableView) {
                    view.tableView = view.up("ptableview");
                }
                if (val && val.length != 0) {
                    var str = stl.view.ResourcePicker.getReadOnlyText(val, view.tableView.project);
                    // str = str + '<div class="conweb-icon duration-field info-help-icon"></div>';
                    return str;
                }
                return "";
            },
            getEditor: function (record) {
                return Ext.create('Ext.grid.CellEditor', {
                    field: {
                        xtype: "resourcepickerfield",
                        project: this.up("ptableview").project,
                        listeners: {
                            blur: function () {
                                //CON-1408: Table View: Resource created from table view, gives error in console and resource is not assigned in other views
                                //(Nilesh): me.up("ptableview").editingPlugin.completeEdit() doesnot work in chrome, hence, the code is conditional
                                var me = this;
                                var ptableview = me.up("ptableview");
                                if (getInternetExplorerVersion() != -1) {
                                    ptableview.editingPlugin.completeEdit();
                                } else {
                                    var selectedResources = this.getValue();
                                    var taskModel = record.get('model');
                                    taskModel.resources = selectedResources;
                                    record.set('resources', selectedResources);
                                    _.each(selectedResources, function (res, index) {
                                        var res = stl.app.ProjectDataFromServer.getResourceByUid(selectedResources[index].resourceId);
                                        if (res) {
                                            Ext.getCmp('resGrid').updateResourceSheet(res, res.units, res.taskdata);
                                        }
                                    });

                                    //For subtasks, parent task model needs to be sent as "taskModel" for task change event
                                    if (record.get('type-internal') == "LIST_ITEM") {
                                        taskModel = record.parentNode.get("model");
                                        ptableview.handleRollupResourceUpdate(taskModel, record.parentNode);
                                    }

                                    $(document).trigger("taskchange", [ptableview, taskModel]);
                                }

                            }
                        }
                    }
                });
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID'),
                width: 150,
                sortable: true,
                dataIndex: 'manager',
                itemId: 'manager',
                align: 'left',
                allowDragFill: true,
                hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID'),
                hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID'),
                hideMode: 'display',
                renderer: function(val, metadata, record) {
                    if (record.get("type-internal") == "BLOCK" && isBufferTask(record))
                        return "";
                    var storeItem = this.down('[dataIndex=manager]').getEditor().getStore().findRecord('Name', record.get('manager'), 0, false, true, true);
                    if (storeItem)
                        return storeItem.get('FullName');
                    else
                        return record.get('manager');
                    return "";
                },
                editor: {
                    xtype: 'combobox',
                    displayField: 'FullName',
                    valueField: 'Name',
                    forceSelection: false,
                    collapseOnSelect: true,
                    queryMode: 'local',
                    anyMatch: true,
                    listeners: {
                        focus: function(cmp, e) {
                            cmp.expand();
                        },
                        select: function(combo, records) {
                            combo.ownerCt.editingPlugin.completeEdit();
                        },
                        blur: function(cmp, e, eOpts) {
                            var value = cmp.getValue();
                            if (value && value.trim()) {
                                var storeItem = cmp.getStore().findRecord('Name', value.trim(), 0, false, false, true);
                                if (!storeItem) {
                                    
                                    cmp.setValue(cmp.originalValue);
                                    cmp.ownerCt.editingPlugin.cancelEdit();
                                    
                                }else{
                                     cmp.setValue(storeItem.get("Name"));
                                    cmp.ownerCt.editingPlugin.completeEdit();
                                } 
                            }
                            else{
                                cmp.setValue("");
                                 cmp.ownerCt.editingPlugin.completeEdit();
                            }
                        }
                    }
                }
            }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES'),
            width: 160,
            sortable: true,
            dataIndex: 'participants',
            itemId: 'participants',
            align: 'left',
            allowDragFill: true,
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES'),
            hideMode: 'display',
            renderer: function (val, metadata, record) {
                if (!isBufferTask(record)) {
                    if (record.get('participants') && record.get('participants').length > 0) {
                        var participantNames = [];
                        for (var i = 0; i < record.get('participants').length; i++) {
                            if (record.get('participants')[i] != "") {
                                var rec = this.down('[dataIndex=participants]').getEditor().getStore().findRecord('Name', record.get('participants')[i], 0, false, true, true);
                                if (rec) {
                                    participantNames.push(rec.get('FullName'));
                                } else {
                                    participantNames.push(record.get('participants')[i]);
                                    this.down('[dataIndex=participants]').getEditor().getStore().add({
                                        "FullName": record.get('participants')[i],
                                        "Name": record.get('participants')[i],
                                        "toShow": false
                                    });
                                }
                            }
                        }
                        if (participantNames.length > 0)
                            return participantNames.join(",");
                        return "";
                    }
                }
                return "";
            },
            editor: {
                xtype: 'combobox',
                displayField: 'FullName',
                valueField: 'Name',
                multiSelect: true,
                 queryMode: 'local',
                 anyMatch: true,
                listConfig: {
                    getInnerTpl: function () {
                        return '<div class="x-combo-list-item"><div class="chkCombo-default-icon chkCombo"></div> {FullName}</div>';
                    }
                },
                listeners: {
                    focus: function (cmp, e) {
                        cmp.expand();
                        cmp.getPicker().getEl().on("mouseleave", function (evt, e, o) {
                            this.fireEvent('blur');
                            this.ownerCt.editingPlugin.completeEdit();
                        } .bind(cmp));
                    }
                }
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_STATUS'),
            width: 100,
            sortable: false,
            dataIndex: 'status',
            itemId: 'status',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_STATUS'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_STATUS'),
            renderer: function (val, metadata, record, rowidx, colidx, store, view) {
                switch (record.get("type-internal")) {
                    case "LIST_ITEM":
                        this.down('[dataIndex=status]').getEditor().bindStore(statusStore);
                        if (record.parentNode.get('subtaskType') == '2') {
                            if (val === "CO" || val === "2") {
                                if (document.getElementById(record.get('Id'))) {
                                    document.getElementById(record.get('Id')).checked = true;
                                    return document.getElementById(record.get('Id')).outerHTML;
                                } else
                                    return '<input type="checkbox" id="' + record.get("Id") + '" checked="checked" onchange="statusChecked(this.checked,this)"/>';
                            } else {
                                if (document.getElementById(record.get('Id'))) {
                                    document.getElementById(record.get('Id')).checked = false;
                                    return document.getElementById(record.get('Id')).outerHTML;
                                } else
                                    return '<input type="checkbox" id="' + record.get("Id") + '" onchange="statusChecked(this.checked,this)"/>';
                            }
                        }
                        return getTaskStatusShort(record);
                    case "SCOPE_ITEM":
                    case "SUMMARY_TASK":
                        return "";
                    case "BLOCK":
                    case "MILESTONE":
                        this.down('[dataIndex=status]').getEditor().bindStore(statusStore);
                        if (isBufferTask(record) || multipleORs(record.get('type'), IPMS_SHORT, PEMS_SHORT))
                            return "";
                        if (record.get('status') === STATUS_IP && Ext.getCmp('tableview').project.checkIfZeroDurationMilestoneTask(record.get('model')))
                            return "";
                        return getTaskStatusShort(record); // return record.get('status');
                    default:
                        return "";
                }
            },
            editor: {
                xtype: 'combobox',
                displayField: 'name',
                valueField: 'status',
                triggerAction: 'all',
                enableKeyEvents: true,
                forceSelection: true,
                editable: false,
                listeners: {
                    focus: function (cmp, e) {
                        cmp.getStore().clearFilter(true);
                        var selectedRec = Ext.getCmp('tableview').getSelection()[0];
                        var type = selectedRec.get("type-internal");
                        var taskType = selectedRec.get("type");
                        var taskModel = selectedRec.get("model");
                        switch (type) {
                            case "MILESTONE":
                                cmp.getStore().filterBy(function (rec) {
                                    var status = rec.data.status;

                                    if (status === STATUS_RL)//RL status not vslid for milestones
                                        return false;
                                    //if the milestone is non-zero duration ims, IP option should be shown 
                                    else if (status === STATUS_IP && Ext.getCmp('tableview').project.checkIfZeroDurationMilestoneTask(taskModel))
                                        return false;
                                    else
                                        return true;

                                });
                                break;
                            case "BLOCK":
                                cmp.getStore().filterBy(function (rec) {
                                    var status = rec.data.status;
                                    //For zero duration tasks , IP option should not be visible
                                    if (status === STATUS_IP && (taskType === STRING_NORMAL && parseInt(taskModel.duration) === 0))
                                        return false;
                                    else
                                        return true;

                                });
                                break;
                            default:
                                return;
                        }
                        cmp.expand();
                        //cmp.select(selectedRec.get('status'));


                    },
                    select: function (combo, record) {
                        var editingRec = combo.ownerCt.editingPlugin.activeRecord;
                        combo.suspendEvent('blur');
                        var oldvalue = editingRec.get('status');
                        var newvalue = record.get('status');
                        if (editingRec.get('type-internal') == 'BLOCK') {
                            //for a fullkit task if there are no checklist items and config is unchecked automatically update percentComplete when no checklist items are present
                            var taskModel = editingRec.get('model');
                            if (editingRec.get('type') == "purchasing") {
                                setPurchasingTaskProperties(editingRec, newvalue, oldvalue);
                                combo.ownerCt.editingPlugin.completeEdit();
                            } else {
                                taskStatusChangeValidator(editingRec, newvalue, oldvalue, function (btn) {
                                    if (btn && btn == 'yes') {
                                        combo.ownerCt.editingPlugin.completeEdit()
                                    } else if (btn && btn == 'no') {
                                        if (combo.ownerCt.editingPlugin.activeRecord) {
                                            combo.ownerCt.editingPlugin.cancelEdit();
                                        } else {
                                            var tableview = combo.ownerCt.ownerCmp;
                                            tableView.revertTaskStatus(combo.originalValue);
                                        }
                                    } else {
                                        combo.ownerCt.editingPlugin.completeEdit();
                                    }
                                });
                            }
                        } else if (editingRec.get('type-internal') == 'LIST_ITEM') {
                            subtaskStatusChangeValidator(editingRec, editingRec.parentNode, newvalue, oldvalue, function (btn) {
                                if (btn && btn == 'yes') {
                                    combo.ownerCt.editingPlugin.completeEdit()
                                } else if (btn && btn == 'no') {
                                    combo.setValue(editingRec.get('status'));
                                    combo.ownerCt.editingPlugin.cancelEdit();
                                } else {
                                    combo.ownerCt.editingPlugin.completeEdit();
                                }
                            });
                        } else {
                            combo.ownerCt.editingPlugin.completeEdit();
                        }
                    }
                }
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_TYPE'),
            width: 120,
            sortable: true,
            dataIndex: 'type',
            itemId: 'type',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_TYPE'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TASK_TYPE'),
            renderer: function (val, metadata, record) {
                recType = record.get("type-internal");
                switch (record.get("type-internal")) {
                    case "LIST_ITEM":
                        return "";
                    case "BLOCK":
                        //var taskStore = this.down('[dataIndex=type]').getEditor().getStore();
                        this.down('[dataIndex=type]').getEditor().bindStore(taskTypeStore);
                        var storeItem = taskTypeStore.findRecord('id', record.get('type'), 0, false, true, true);
                        if (storeItem) {
                            return storeItem.get('name');
                        } else {
                            if (record.get('type') === "fullkit")
                                return FULLKIT_TEXT;
                            return record.get('type');
                        }
                        break;
                    case "MILESTONE":
                        this.down('[dataIndex=type]').getEditor().bindStore(taskTypeStore);
                        //SS CON-2171:This condition is there for existing projects which has PP.
                        //User will be able to convert the existing PPs to some other milestone.
                        if (record.get('type') == "NONE")
                            return "";
                        return record.get('type');
                    case "SUMMARY_TASK":
                        return record.get('type');
                    default:
                        return "";
                }
            } .bind(this),
            editor: {
                xtype: 'combobox',
                displayField: 'name',
                valueField: 'id',
                editable: false,
                queryMode: 'local',
                lastQuery: '',
                triggerAction: 'all',
                forceSelection: true,
                listeners: {
                    focus: function (cmp, e) {
                        cmp.getStore().clearFilter(true);
                        var selectedRec = Ext.getCmp('tableview').getSelection()[0];
                        var type = selectedRec.get("type-internal");
                        switch (type) {
                            case "BLOCK":
                                cmp.getStore().filterBy(function (rec) {
                                    var id = rec.id;
                                    if (multipleORs(id, CMS_SHORT, PP_SHORT, PE_SHORT, IMS_SHORT))
                                        return false;
                                    return true;
                                });
                                break;
                            case "MILESTONE":

                                cmp.getStore().filterBy(function (rec) {
                                    var id = rec.id;
                                    if (multipleORs(id, TASKTYPE_SNET, TASKTYPE_PT, STRING_NORMAL))
                                        return false;
                                    return true;
                                });
                                break;
                            default:
                                return;
                        }
                        cmp.expand();
                        cmp.select(selectedRec.get('type'));
                    },
                    select: function (combo, records) {
                        combo.fireEvent('blur');
                        combo.ownerCt.editingPlugin.completeEdit();
                    }
                }
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SNET_DATE'),
            width: 120,
            sortable: true,
            dataIndex: 'snet',
            itemId: 'snet',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SNET_DATE'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SNET_DATE'),
            renderer: function (val, metadata, record) {
                if (record.get('type') === "snet") {
                    if (record.get('snet') != null)
                        return Ext.Date.format(new Date(record.get('snet')), ServerTimeFormat.getExtDateformat());
                    else {
                        return Ext.Date.format(ServerClientDateClass.getTodaysDate(), ServerTimeFormat.getExtDateformat());
                    }
                }
                return "";
            },
            editor: {
                xtype: 'datefield',
                allowBlank: false,
                autoShow: true,
                editable: false,
                format: ServerTimeFormat.getExtDateformat(),
                listeners: {
                    focus: function (cmp, e) {
                        cmp.expand();
                    },
                    select: function (cmp, e) {
                        cmp.fireEvent('blur');
                        cmp.ownerCt.editingPlugin.completeEdit();
                    }
                }
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION'),
            width: 120,
            sortable: true,
            dataIndex: 'subtaskType',
            itemId: 'subtaskType',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION'),
            renderer: function (val, metadata, record) {
                recType = record.get("type-internal");
                if (record.get("type-internal") == "BLOCK") {//task
                    if (record.get("model").subtasks.length === 0)
                        return "";
                    if (isBufferTask(record) || record.get('type') == "fullkit" || record.get('type') === TASKTYPE_PT)
                        return "";
                    this.down('[dataIndex=subtaskType]').getEditor().bindStore(subtaskTypeStore);
                    var subtaskTypeRec = subtaskTypeStore.findRecord('id', record.get('subtaskType'), 0, false, true, true);
                    if (subtaskTypeRec) {
                        return subtaskTypeRec.get('name');
                    } else {
                        console.warn("Couldn't find subtask type [" + record.get('subtaskType') + ']');
                    }

                } else if (record.get('type-internal') == "MILESTONE") {
                    var storeItem = subtaskTypeStore.findRecord('id', record.get('subtaskType'), 0, false, true, true);
                    if (storeItem && record.get('type') === IMS_SHORT) {
                        if (record.get("model").subtasks.length === 0)
                            return "";
                        return storeItem.get('name');
                    }
                    return "";
                }
                return "";
            },
            editor: {
                xtype: 'combobox',
                displayField: 'name',
                valueField: 'id',
                editable: false,
                forceSelection: true,
                listeners: {
                    focus: function (cmp, e) {
                        var selectedRec = Ext.getCmp('tableview').getSelection()[0];
                        if(selectedRec){
                            var selectedSubtaskType = selectedRec.get('subtaskType');
                            
                            
                            subtaskTypeStore.filter(function(storeRecord){
                                var typeVal = storeRecord.get('id');
                                return !stl.app.ProjectDataFromServer.isSubtaskTypeOptionHidden(selectedSubtaskType, typeVal);
                            });
                        }
                        cmp.expand();
                    },
                    select: function (combo, records) {
                        combo.fireEvent('blur');
                        combo.ownerCt.editingPlugin.completeEdit();
                        
                    },
                    blur: function( cmp, event, eOpts ){
                        subtaskTypeStore.clearFilter();
                    }
                }
            }
        }, {
            //RATE and WIP limit columns are disabled, as they are not in use
            text: 'SPI_COLUMNS_AND_LABELS_RATE',
            width: 120,
            sortable: true,
            dataIndex: 'volume',
            itemId: 'volume',
            align: 'left',
            hidden: true,
            hideable: false,
            renderer: function (val, metadata, record) {
                if (record.get('type-internal') == "BLOCK") {
                    if (isBufferTask(record))
                        return "";
                    if (record.get('volume'))
                        return record.get('volume');
                }
                return "";
            } .bind(this),
            editor: {
                xtype: 'textfield',
                allowBlank: false,
                autoShow: true
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASKS_WIP_LIMIT'),
            width: 120,
            sortable: true,
            dataIndex: 'subtasksWIPLimit',
            itemId: 'subtasksWIPLimit',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SUBTASKS_WIP_LIMIT'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SUBTASKS_WIP_LIMIT'),
            renderer: function (val, metadata, record) {
                if (record.get('type-internal') == "BLOCK") {
                    if (record.get("model").subtasks.length === 0)
                        return "";
                    if (isBufferTask(record) || record.get('type') === FULL_KIT || record.get('type') === TASKTYPE_PT || record.get('subtaskType') != SubtaskTypesEnum.WIP)
                        return "";
                    if (record.get('subtasksWIPLimit'))
                        return record.get('subtasksWIPLimit');
                }
                else if (record.get('type-internal') === "MILESTONE") {
                    if (record.get('type') === IMS_SHORT && record.get('subtaskType') == SubtaskTypesEnum.WIP) {
                        if (record.get("model").subtasks.length === 0)
                            return "";
                        return record.get('subtasksWIPLimit');
                    }
                }
                return "";
            } .bind(this),
            editor: {
                xtype: 'numberfield',
                allowBlank: false,
                allowDecimals: false,
                allowExponential: false,
                maxLength: 5,
                enforceMaxLength: true,
                autoShow: true,
                value: 1,
                maxValue: 99999,
                minValue: 1,
                hideTrigger: true,
                invalidText: INVALID_WIP_LIMIT
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_START_DATE'),
            width: 120,
            sortable: true,
            dataIndex: 'startDate',
            itemId: 'startDate',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_START_DATE'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_START_DATE'),
            renderer: function (val, metadata, record) {
                if (record.get('startDate') && record.get('startDate') != '')
                    return Ext.Date.format(new Date(record.get('startDate')), ServerTimeFormat.getExtDateformat());
                return "";
            },
            editor: {
                xtype: 'datefield',
                allowBlank: false,
                autoShow: true,
                editable: false,
                format: ServerTimeFormat.getExtDateformat(),
                listeners: {
                    focus: function (cmp, e) {
                        cmp.expand();
                    },
                    select: function (cmp, e) {
                        cmp.fireEvent('blur');
                        cmp.ownerCt.editingPlugin.completeEdit();
                    }
                }
            }
        }, {
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_END_DATE'),
            width: 120,
            sortable: true,
            dataIndex: 'endDate',
            itemId: 'endDate',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_END_DATE'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_END_DATE'),
            renderer: function (val, metadata, record) {
                if (record.get('endDate') && record.get('endDate') != '')
                    return Ext.Date.format(new Date(record.get('endDate')), ServerTimeFormat.getExtDateformat());
                return "";
            },
            editor: {
                xtype: 'datefield',
                allowBlank: false,
                autoShow: true,
                editable: false,
                format: ServerTimeFormat.getExtDateformat(),
                listeners: {
                    focus: function (cmp, e) {
                        cmp.expand();
                    },
                    select: function (cmp, e) {
                        cmp.fireEvent('blur');
                        cmp.ownerCt.editingPlugin.completeEdit();
                    }
                }
            }
        },{
            text: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TEXT22'),
            sortable: true,
            width:200,
            dataIndex: 'text22',
            itemId: 'text22',
            align: 'left',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TEXT22'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_TEXT22'),
            editor: {
                xtype: 'textarea',
                grow:true,
                growMin:1,
                growMax:1000000
            },
            renderer: function (val, metadata, record) {
                if (record.get("text22")) {
                    return record.get("text22");
                }
                return "";
            } .bind(this)
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT1'),
            dataIndex:'text26',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT1'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT1'),
            getEditor:function(record){
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text1','text26',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT2'),
            dataIndex:'text27',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT2'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT2'),
            getEditor:function(record){
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text2','text27',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT3'),
            dataIndex:'text28',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT3'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT3'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text3','text28',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT4'),
            dataIndex:'text29',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT4'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT4'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text4','text29',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT5'),
            dataIndex:'text30',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT5'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT5'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text5','text30',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT6'),
            dataIndex:'text3',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT6'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT6'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text6','text3',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT7'),
            dataIndex:'text11',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT7'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT7'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text7','text11',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT8'),
            dataIndex:'text12',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT8'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT8'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text8','text12',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT9'),
            dataIndex:'text13',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT9'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT9'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text9','text13',record);
            }
        },{
            header:stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT10'),
            dataIndex:'text15',
            hidden: stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT10'),
            hideable: !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_CUSTOM_TASK_TEXT10'),
            getEditor:function(record){                
                return Ext.create('Ext.grid.CellEditor', {
                    field: stl.app.getCustomTextFieldEditor(this,record),
                    listeners:{
                        afterrender:function(ed){
                            ed.field.on("blur",function(field){
                                stl.app.updateCustomTextField(field,record);
                            });
                        }
                    }
                });
            },
            renderer:function(val, metadata, record){
                return stl.app.renderCustomTextField('Text10','text15',record);
            }
        }]
    });

    if (!this.initialConfig.store) { }
    this.callParent();
    this.addEventListener("itemcontextmenu", function (ele, record, item, index, e, eOpts) {
        e.preventDefault();
    });

    this.addEventListener("cellmousedown", function (ele, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        if (e.target.tagName.toLocaleLowerCase() == "img") {
            this.plugins[0].cancelEdit();
            this.getSelectionModel().select(record);
        }

    });
    this.addEventListener("itemexpand", function (item) {
        if (this.getSelectionModel().getSelection().length == 0)
            this.getSelectionModel().select(item);
        if (item.get('type-internal') == "SUMMARY_TASK" || !item.get('row_model').isExpanded)
            $(document).trigger("expandScopeNode", [this, item.get("row_model").uid]);

    });
    this.addEventListener("itemcollapse", function (item) {
        if (this.getSelectionModel().getSelection().length == 0)
            this.getSelectionModel().select(item);
        if (item.get('type-internal') == "SUMMARY_TASK" || item.get('row_model').isExpanded)
        //if(item.findChild('type-internal', "SUMMARY_TASK", true))
            $(document).trigger("collapseScopeNode", [this, item.get("row_model").uid]);
    });
    this.addEventListener("beforeShow", function (cmp) {
        if (cmp.getSelectionModel().getSelection().length == 0) {
            var toolbar = Ext.ComponentQuery.query('tableviewtoolbar')[0];
            toolbar.disableAll();
        }
    });
    this.on("columnresize", function (ct, column, width, eOpts) {
        var dragfillP = this.findPlugin("dragfill");
        if (dragfillP)
            dragfillP.clearSelection.bind(dragfillP);
        dragfillP.clearSelection();
    });
    /*this.getView().on("itemadd",function(records, index, node, eOpts){
    if(event && window.currentViewId == "table" && !$(event.srcElement).hasClass("x-tree-expander")){
    this.getSelectionModel().select(node);
    this.panel.plugins[0].startEdit(records[0],this.panel.down('[dataIndex=name]'));
    }
    });*/
    this.addEventListener("itemremove", function (currNode, node, isMove, eOpts) {
        this.getSelectionModel().select(currNode);
    });
    this.addEventListener("columnshow", function (ct, column, eOpts) {

        Ext.getCmp('searchCombo').fireEvent('refresh', column, true);
    });
    this.addEventListener("columnhide", function (ct, column, eOpts) {

        Ext.getCmp('searchCombo').fireEvent('refresh', column, false);
    });
    this.addGlobalListener("taskChangeAtPhaseLevel", this.onTaskChangeAtPhaseLevel.bind(this));
    this.addGlobalListener("taskchange", this.onTaskChange.bind(this));
    this.addGlobalListener("taskadd", this.onTaskAdd.bind(this));
    this.addGlobalListener("summaryTaskAdd", this.onSummaryTaskAdd.bind(this));
    this.addGlobalListener("summaryTaskRemove", this.onSummaryTaskRemove.bind(this));
    this.addGlobalListener("summaryTaskDateChanged", this.onSummaryTaskDatesChanged.bind(this));
    this.addGlobalListener("taskremove", this.onTaskRemove.bind(this));
    this.addGlobalListener("subtaskremove", this.onSubTaskRemove.bind(this));
    this.addGlobalListener("scopenamechange", this.onScopeNameChange.bind(this));
    this.addGlobalListener("rowchange", this.onRowChange.bind(this));
    this.addGlobalListener("scopeitemadd", this.onScopeItemAdd.bind(this));
    this.addGlobalListener("scopeitemremove", this.onScopeItemRemove.bind(this));
    this.addGlobalListener("phasechange", this.onPhaseChange.bind(this));
    this.addGlobalListener("phaseadd", this.onPhaseAdd.bind(this));
    this.addGlobalListener("errorHighlight", this.onErrorHighlightClick.bind(this));
    this.addGlobalListener("linkRemove", this.onLinkRemove.bind(this));
    this.addGlobalListener("linkAdd", this.onLinkAdd.bind(this));
    this.addGlobalListener("taskorderchange", this.onTaskOrderChange.bind(this));
    this.addGlobalListener("refreshTaskIds", this.onRefreshTaskIdColumn.bind(this));
    this.addGlobalListener("specialTaskTypeChange", this.onSpecialTaskTypeChange.bind(this));
    this.addGlobalListener("predSuccChangeFromOtherView", this.onPredecessorSuccessorChange.bind(this));
    this.addGlobalListener("milestoneupdate", this.onMilestoneInfoChange.bind(this));
    this.addGlobalListener("milestoneadd", this.onMilestoneAdd.bind(this));
    this.addGlobalListener("rowIndentationChanged", this.onRowIndentationChange.bind(this));
    this.addGlobalListener("rowadd", this.onRowAdd.bind(this));
    this.addGlobalListener("rowremove", this.onRowRemove.bind(this));
    this.addGlobalListener("expandAllScopeNodes", this.onExpandAllScopeNodes.bind(this));
    this.addGlobalListener("expandScopeNode", this.onExpandScopeNode.bind(this));
    this.addGlobalListener("collapseScopeNode", this.onCollapseScopeNode.bind(this));
    this.addGlobalListener("projectload", this.onProjectLoaded.bind(this));
    this.addGlobalListener("updateResourcesDeleted", this.onUpdateResourcesDeleted.bind(this));
    this.addGlobalListener("highlightSlack", this.onHighlightSlack.bind(this));
    this.addGlobalListener("highlightResourceContention", this.onHighlightResourceContention.bind(this));
}, ///end of initcomponent

listeners: {
    itemcontextmenu: function (view, record, item, index, event, eOpts) {
        if (!this.readOnly)
            this.onItemContextMenu(view, record, item, index, event, eOpts);
    }
}, //combo.ownerCt.ownerCmp

revertTaskStatus: function(toBeRevertedValue){
    var tableview = this;
    var selectedRecordId = tableview.selection.data.Id;
    var store = tableview.store;
    var rec = store.findRecord("Id", selectedRecordId);
    rec.set("status", toBeRevertedValue);
    rec.get("model").status = toBeRevertedValue;
    tableview.onTaskStatusChange(rec.get("model"), rec, rec.get('status'));
    $(document).trigger("taskchange", [tableview, rec.get("model")]);
},

addEventListener: function (eventName, fn) {
    this.on(eventName, fn, this, {
        destroyable: true
    });
},

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
        $(document).off(listener.name, listener.fn);
    }
    this.globalListeners = [];
},

onDestroy: function () {
    this.removeGlobalListeners();
    $(this).off();
    this.clearListeners();
    this.store.clearListeners();
    this.store.destroy();
    this.callParent(arguments);
},

rollupDurationChange: function (thisView, task, eventRec) {
    var me = this;
    var rollupDuration = me.project.calculateRollupDuration(task);
    // if (rollupDuration > task.remainingDuration && task.taskType != "purchasing"){
    //         PPI_Notifier.confirm(getStringWithArgs(ROLLUP_DURATION_ALERT_MESG,ValidationClassInstance.getValidDurationString(rollupDuration,TASK_DURATION_DEFAULT_STR,false),ValidationClassInstance.getValidDurationString(task.remainingDuration,TASK_DURATION_DEFAULT_STR,false)),
    //                          ROLLUP_DURATION_ALERT_TITLE,
    //                          function () {
    //                              me.changeTaskDuration(thisView, task, rollupDuration, eventRec);
    //                          },
    //                          null);
    // }
    me.handleRollupResourceUpdate(task, eventRec);
},
handleRollupResourceUpdate: function (taskModel, eventRec) {
    var me = this;
    if(taskModel.status === STATUS_NS){
        me.showhideResourceInfoIcon(taskModel, eventRec);
    } else if(taskModel.status === STATUS_IP) {
        me.showhideResourceViolationIcon(taskModel);
    }

},
showhideResourceViolationIcon: function (taskModel) {
    var me = this;
    me.project.updateTaskResourceRollupViolationData(taskModel);
},

showhideResourceInfoIcon: function (taskModel, eventRec) {
    var me = this;
    me.project.updateTaskResourceRollupInfoData(taskModel);
    if(taskModel.resourceInfoData.isInfoToBeShown) {
        me.project.updateTaskResourcesFromRollupData(taskModel.resourceInfoData.data, taskModel);
        eventRec.set("resources", taskModel.resources);
    }
},

changeTaskDuration: function (thisView, task, duration, eventRec) {
    if (task.status === STATUS_NS)
        task.duration = duration;
    task.remainingDuration = duration;
    eventRec.set("duration", duration);
    $(document).trigger("taskchange", [thisView, task/* ,phaseId */]);
},

onLinkAdd: function (sender, from, to) {
    var me = this;
    var currentFromNode = this.store.getRoot().findChild('taskId', from.id, true);
    var currentToNode = this.store.getRoot().findChild('taskId', to.id, true);
    var timeOut = 0;
    if (!currentToNode || !currentFromNode)
        timeOut = 1000;
    var updateFunction = function () {
        currentFromNode = me.store.getRoot().findChild('taskId', from.id, true);
        currentToNode = me.store.getRoot().findChild('taskId', to.id, true);
        if (currentFromNode) {
            var succIds = [];
            for (var i = 0; i < from._successors.length; i++) {
                succIds.push(from._successors[i].id);
            }
            currentFromNode.set('successors', succIds.join(","));
        }
        if (currentToNode) {
            var predIds = [];
            for (var i = 0; i < to._predecessors.length; i++) {
                predIds.push(to._predecessors[i].id);
            }
            currentToNode.set('predecessors', predIds.join(","));
        }
    }
    setTimeout(updateFunction, timeOut);

},
onLinkRemove: function (sender, from, to) {
    var me = this;
    var currentFromNode = this.store.getRoot().findChild('taskId', from.id, true);
    var currentToNode = this.store.getRoot().findChild('taskId', to.id, true);
    var timeOut = 0;
    if (!currentToNode || !currentFromNode)
        timeOut = 1000;
    var updateFunction = function () {
        currentFromNode = me.store.getRoot().findChild('taskId', from.id, true);
        currentToNode = me.store.getRoot().findChild('taskId', to.id, true);
        if (currentFromNode) {
            var succIds = [];
            for (var i = 0; i < from._successors.length; i++) {
                succIds.push(from._successors[i].id);
            }
            currentFromNode.set('successors', succIds.join(","));
        }
        if (currentToNode) {
            var predIds = [];
            for (var i = 0; i < to._predecessors.length; i++) {
                predIds.push(to._predecessors[i].id);
            }
            currentToNode.set('predecessors', predIds.join(","));
        }
    }
    setTimeout(updateFunction, timeOut);
},
getCompletionForScopeItem: function (rec) {
    var me = this;
    if (rec.get("type-internal") == "BLOCK") {
        // average of child list items; complete = 1, incomplete = 0
        if (rec.childNodes.length === 0) return "NS";
        var completedItems = rec.childNodes.reduce(function (prev, item) {
            return prev + (item.get('complete') ? 1 : 0);
        }, 0);
        if (completedItems == 0) {
            rec.set('status', "NS");
            return "NS";
        } else if (completedItems == rec.childNodes.length) {
            rec.set('status', "CO");
            return "CO";
        } else {
            rec.set('status', "IP");
            return "IP";
        }
    }
},
disableSubtaskStatus: function (rec) {
    for (var i = 0; i < rec.childNodes.length; i++) {
        if (rec.get('status') == "CO")
            $("#subtask" + rec.childNodes[i].get('Id')).attr("disabled", true);
        else {
            if ($("#subtask" + rec.childNodes[i].get('Id')).is('[disabled=disabled]'))
                $("#subtask" + rec.childNodes[i].get('Id')).removeAttr("disabled");
        }
    }
},
onTaskStatusChange: function (taskdata, currentRec, status) {
    switch (status) {
        //case "0":                 
        case "NS":
            taskdata.actualStartDate = null;
            taskdata.actualFinishDate = null;
            taskdata.percentComplete = 0;
            taskdata.fullkitPercentCompleteAtRL = 0;
            if (taskdata.taskType == "fullkit") {
                taskdata.remainingDuration = 0;
                taskdata.duration = 0;
                taskdata.date7 = taskdata.date1;
                currentRec.set('endDate', taskdata.date7);
            } else {
                taskdata.remainingDuration = taskdata.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : taskdata.remainingDuration;
                taskdata.duration = taskdata.remainingDuration;
            }
            taskdata.fullkitReleaseDate = null;
            currentRec.set('duration', taskdata.remainingDuration);
            break;
        //case "1":                 
        case "IP":
            taskdata.actualStartDate = ServerClientDateClass.getTodaysDate();
            taskdata.actualFinishDate = null;
            taskdata.fullkitPercentCompleteAtRL = 0;
            if (taskdata.taskType == "fullkit") {
                taskdata.remainingDuration = 0;
                taskdata.duration = 0;
                var completedItems = 0;
                _.each(currentRec.get('checklistItems'), function (item, idx) {
                    if (item.complete)
                        completedItems++;
                });
                if (currentRec.get('checklistItems').length > 0) {
                    percentCompletion = Math.round((completedItems / currentRec.get('checklistItems').length) * 100);
                }
                taskdata.percentComplete = percentCompletion;
                if (new Date(taskdata.date7) < new Date()) {
                    taskdata.date7 = ServerClientDateClass.getTodaysDate();
                    currentRec.set('endDate', taskdata.date7);
                }
            } else {
                taskdata.remainingDuration = taskdata.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : taskdata.remainingDuration;
                taskdata.percentComplete = 0;
            }
            taskdata.fullkitReleaseDate = null;
            currentRec.set('duration', taskdata.remainingDuration);
            currentRec.set('startDate', taskdata.actualStartDate);
            break;
        case "RL":
            taskdata.fullkitReleaseDate = ServerClientDateClass.getTodaysDate();
            taskdata.actualFinishDate = null;
            taskdata.fullkitPercentCompleteAtRL = task.percentComplete;
            /* we dont set any duration for Fullkit task if status is set to RL. Checked with the code in task-view.js*/
            //taskdata.remainingDuration = taskdata.remainingDuration == 0 ? ONE_DAY_DURATION_DEFAULT_SEC : taskdata.remainingDuration;
            //currentRec.set('duration', taskdata.remainingDuration);
            currentRec.set('startDate', taskdata.actualStartDate);
            break;
        //case "2":                 
        case "CO":
            taskdata.actualFinishDate = ServerClientDateClass.getTodaysDate();
            taskdata.actualFinishDate.setHours(17, 0, 0); //setting finish time to 5:00PM
            taskdata.actualStartDate = taskdata.actualStartDate ? taskdata.actualStartDate : ServerClientDateClass.getTodaysDate();
            taskdata.remainingDuration = 0;
            taskdata.percentComplete = 100;
            taskdata.fullkitPercentCompleteAtRL = 100;
            taskdata.fullkitReleaseDate = taskdata.fullkitReleaseDate ? taskdata.fullkitReleaseDate : ServerClientDateClass.getTodaysDate();
            currentRec.set('duration', taskdata.remainingDuration);
            currentRec.set('startDate', taskdata.actualStartDate);
            currentRec.set('endDate', taskdata.actualFinishDate);
            break;
    }
},
onMileStoneStatusChange: function (msdata, currentRec, status) {
    switch (status) {
        case STATUS_NS:

            msdata.actualStartDate = null;
            msdata.actualFinishDate = null;
            msdata.percentComplete = 0;
            break;

        case STATUS_IP:
            msdata.actualStartDate = ServerClientDateClass.getTodaysDate(); ;
            msdata.actualFinishDate = null;
            break;
        case STATUS_CO:
            msdata.actualStartDate = msdata.actualStartDate ? msdata.actualStartDate : ServerClientDateClass.getTodaysDate();
            msdata.actualFinishDate = ServerClientDateClass.getTodaysDate();
            msdata.actualFinishDate.setHours(17, 0, 0);
            msdata.percentComplete = 100;
            msdata.remainingDuration = 0;
            currentRec.set('startDate', msdata.actualStartDate);
            currentRec.set('endDate', msdata.actualFinishDate);
            currentRec.set('duration', msdata.remainingDuration);


            break;
    }

    $(document).trigger("milestoneupdate", [msdata, 'status']);

},

updateSubtaskStatus: function (evt, thisView, currentRec, taskdata, subtask) {
    var isSubtaskCompletable = ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled ? (currentRec.get('checklistStatus') == 2 || currentRec.get('checklistStatus') == 0) : true;
    if (currentRec.get('status') != "CO" || (isSubtaskCompletable && currentRec.get('status') == "CO")) {
        subtask.status = currentRec.get('status');
        thisView.onSubTaskStatusChange(subtask, currentRec, currentRec.get('status'));
        if (taskdata.status != currentRec.parentNode.get('status')) {
            taskdata.status = currentRec.parentNode.get('status');
            thisView.onTaskStatusChange(taskdata, currentRec.parentNode, currentRec.parentNode.get('status'));
        }
        //    thisView.rollupDurationChange(thisView, taskdata, currentRec.parentNode);
    } else {
        if (!isSubtaskCompletable && currentRec.get('status') == "CO")
            PPI_Notifier.info(SUBTASK_CANNOT_MARKED_COMPLETE);
        currentRec.set('status', evt.originalValue);
    }
},

onSubTaskStatusChange: function (subtaskdata, currentRec, status) {
    switch (status) {
        case "0":
        case "NS":
            subtaskdata.startDate = subtaskdata.startDate ? subtaskdata.startDate : ServerClientDateClass.getTodaysDate();
            subtaskdata.endDate = null;
            subtaskdata.actualStartDate = null;
            subtaskdata.actualFinishDate = null;
            subtaskdata.remainingDuration = subtaskdata.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtaskdata.remainingDuration;
            subtaskdata.duration = subtaskdata.remainingDuration;
            currentRec.set('duration', subtaskdata.remainingDuration);
            break;

        case "1":
        case "IP":
            subtaskdata.endDate = null;
            subtaskdata.actualStartDate = ServerClientDateClass.getTodaysDate();
            subtaskdata.actualFinishDate = null;
            subtaskdata.remainingDuration = subtaskdata.remainingDuration == 0 ? SUBTASK_DURATION_DEFAULT_SEC : subtaskdata.remainingDuration;
            currentRec.set('startDate', subtaskdata.startDate);
            currentRec.set('duration', subtaskdata.remainingDuration);
            break;

        case "2":
        case "CO":
            subtaskdata.endDate = ServerClientDateClass.getTodaysDate();
            subtaskdata.startDate = subtaskdata.startDate ? subtaskdata.startDate : ServerClientDateClass.getTodaysDate();
            subtaskdata.actualStartDate = subtaskdata.actualStartDate ? subtaskdata.actualStartDate : ServerClientDateClass.getTodaysDate();
            subtaskdata.actualFinishDate = ServerClientDateClass.getTodaysDate();
            subtaskdata.remainingDuration = 0;
            subtaskdata.duration = SUBTASK_DURATION_DEFAULT;
            currentRec.set('duration', subtaskdata.duration);
            currentRec.set('endDate', subtaskdata.endDate);
            currentRec.set('startDate', subtaskdata.startDate);
            break;
    }
},
onTaskChangeAtPhaseLevel: function (evt, sender, tasks) {
    var me = this;
    _.each(tasks, function (taskdata, idx) {
        // // update task immediately ... TODO think about deferring till view becomes active
        // // not doing that right now because it adds complexity
        if (taskdata.isSummary) return;
        var eventRec = me.store.getRoot().findChild('Id', taskdata.uid, true);
        if (eventRec) {
            eventRec.set('name', taskdata.name);
            eventRec.set('duration', taskdata.remainingDuration);

            // Set Start Date
            if (taskdata.status == 'NS' && taskdata.startDate != "Invalid Date")
                eventRec.set('startDate', taskdata.startDate);
            else if (taskdata.status == 'IP' || taskdata.status == 'CO') {
                if (taskdata.actualStartDate && taskdata.actualStartDate != "Invalid Date")
                    eventRec.set('startDate', taskdata.actualStartDate);
            }

            // Set End Date
            if (taskdata.status == 'CO') {
                if (taskdata.actualFinishDate && taskdata.actualFinishDate != "Invalid Date")
                    eventRec.set('endDate', taskdata.actualFinishDate);
            } else {
                if (taskdata.endDate && taskdata.endDate != "Invalid Date")
                    eventRec.set('endDate', taskdata.endDate);
            }

            if (taskdata.taskType === "fullkit" || taskdata.taskType === "purchasing") {
                if (taskdata.date7 && taskdata.date7 != "Invalid Date")
                    eventRec.set('endDate', taskdata.date7);
            }





            if (taskdata.status)
                eventRec.set('status', taskdata.status);
            //if (taskdata.manager != null)
            eventRec.set('manager', taskdata.manager);
            if (taskdata.taskType)
                eventRec.set('type', taskdata.taskType);

            if (taskdata.resources)
                eventRec.set('resources', taskdata.resources);
            if (taskdata.participants && taskdata.participants.length > 0)
                eventRec.set('participants', taskdata.participants);
            if (taskdata.checklistItems)
                eventRec.set('checklistItems', taskdata.checklistItems);
            if (taskdata.checklistStatus || taskdata.checklistStatus == 0) {
                eventRec.set('checklistStatus', taskdata.checklistStatus);
            }
            me.store.load({ node: eventRec });
        }
    });
},
onTaskChange: function (evt, sender, taskdata) {
    var me = this;
    if (sender.xtype === "ptableview") return;
    // // update task immediately ... TODO think about deferring till view becomes active
    // // not doing that right now because it adds complexity
    var eventRec = this.store.getRoot().findChild('Id', taskdata.uid, true);
    if (eventRec) {
        eventRec.set('name', taskdata.name);
        eventRec.set('duration', taskdata.remainingDuration);

        // Set Start Date
        if (taskdata.status == 'NS' && taskdata.startDate != "Invalid Date")
            eventRec.set('startDate', taskdata.startDate);
        else if (taskdata.status == 'IP' || taskdata.status == 'CO') {
            if (taskdata.actualStartDate && taskdata.actualStartDate != "Invalid Date")
                eventRec.set('startDate', taskdata.actualStartDate);
        }

        // Set End Date
        if (taskdata.status == 'CO') {
            if (taskdata.actualFinishDate && taskdata.actualFinishDate != "Invalid Date")
                eventRec.set('endDate', taskdata.actualFinishDate);
        } else {
            if (taskdata.endDate && taskdata.endDate != "Invalid Date")
                eventRec.set('endDate', taskdata.endDate);
        }

        if (taskdata.taskType === "fullkit" || taskdata.taskType === "purchasing") {
            if (taskdata.date7 && taskdata.date7 != "Invalid Date")
                eventRec.set('endDate', taskdata.date7);
        }


        if (taskdata.subtasks && taskdata.subtasks.length > 0) {
            this.project.reCalculateSubTaskStartDate(taskdata);
            this.setSubtaskStartDates(taskdata, eventRec);
        }


        if (taskdata.startNoEarlierThan && taskdata.startNoEarlierThan != "Invalid Date")
            eventRec.set('snet', taskdata.startNoEarlierThan);
        if (taskdata.status)
            eventRec.set('status', taskdata.status);
        //if (taskdata.manager != null)
        eventRec.set('manager', taskdata.manager);
        if (taskdata.taskType)
            eventRec.set('type', taskdata.taskType);
        if (taskdata.subtaskType)
            eventRec.set('subtaskType', taskdata.subtaskType);
        if (taskdata.subtasksWIPLimit)
            eventRec.set('subtasksWIPLimit', taskdata.subtasksWIPLimit);
        if (taskdata.resources)
            eventRec.set('resources', taskdata.resources);
        if (taskdata.participants && taskdata.participants.length > 0)
            eventRec.set('participants', taskdata.participants);
        if (taskdata.checklistItems)
            eventRec.set('checklistItems', taskdata.checklistItems);
        if (taskdata.checklistStatus || taskdata.checklistStatus == 0) {
            eventRec.set('checklistStatus', taskdata.checklistStatus);
        }
    }
    if (taskdata.subtasks && taskdata.subtasks.length > 0 & ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled & this.project.isSubtaskEnabled) {
        if (taskdata.subtaskType == SubtaskTypesEnum.STREAMS){
            taskdata.subtasks = _.sortBy(taskdata.subtasks, function(subtask){
                return subtask.order;
            })
        }
        
        for (var i = 0; i < taskdata.subtasks.length; i++) {
            if (eventRec) {
                var myRec = eventRec.childNodes[i];
                if (myRec) {
                    // FIXME create central method to merge records, ALSO fix fieldnames for consistency
                    if (myRec.get('Id') === taskdata.subtasks[i].uid) {
                        myRec.set({
                            "name": taskdata.subtasks[i].name,
                            "duration": taskdata.subtasks[i].remainingDuration,
                            "startDate": taskdata.subtasks[i].startDate,
                            "endDate": taskdata.subtasks[i].endDate,
                            "manager": taskdata.subtasks[i].manager,
                            "resources": taskdata.subtasks[i].resources,
                            'complete': taskdata.subtasks[i].complete,
                            "status": taskdata.subtasks[i].status,
                            "checklistStatus": taskdata.subtasks[i].checklistStatus,
                            'type': taskdata.subtaskType,
                            'checklistItems': taskdata.subtasks[i].checklistItems
                        });

                    } else {
                        var newsubtaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(taskdata, taskdata.subtasks[i]);
                        if (newsubtaskNode.get('order') == null)
                            newsubtaskNode.set('order', i);
                        /*To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
                        The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
                        or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
                        tree only on client side, we set the loaded property to true saying it doesn't have children*/
                        newsubtaskNode.set('loaded', true);
                        newsubtaskNode.set('leaf', true);
                        eventRec.insertChild(i, newsubtaskNode);
                    }
                    // TODO handle "moved to new parent" (maybe just move the record and then re-render all)
                } else { //add the new subtask
                    //add completed subtasks if config syas to do so 
                    //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
                    //if (!(ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled & taskdata.subtasks[i].complete)) {
                        var newsubtaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(taskdata, taskdata.subtasks[i]);
                        if (newsubtaskNode.get('order') == null)
                            newsubtaskNode.set('order', i);
                        /*To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
                        The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
                        or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
                        tree only on client side, we set the loaded property to true saying it doesn't have children*/
                        newsubtaskNode.set('loaded', true);
                        newsubtaskNode.set('leaf', true);
                        eventRec.insertChild(i, newsubtaskNode);
                    //}
                }


            }
        }
    }
},
setSubtaskStartDates: function (parentTask, eventRec) {
    for (var i = 0; i < parentTask.subtasks.length; i++) {
        if (eventRec) {
            var myRec = eventRec.childNodes[i];
            if (myRec) {
                if (myRec.get('Id') === parentTask.subtasks[i].uid) {
                    myRec.set("startDate", parentTask.subtasks[i].startDate);
                }
            }
        }
    }
},
//finds the scope Id and phase Id of a cell where there is a task, so that the new task can be added after that
findCellWithTaskInRow: function (scope, $htmlRow) {
    var cellsWithTask = $htmlRow.find(".has-task");
    if (cellsWithTask.length > 0) {
        var lastCellWithTask = cellsWithTask.last();
        if (lastCellWithTask) {
            //Yes, there a cell with task in the selected Row
            var phase = this.project.phases[$htmlRow.find(".phase-column").index(lastCellWithTask)]
            return {
                "scopeId": scope.uid,
                "phaseId": phase.uid
            };
        }
    } else {
        // recursively find last row with a cell that has a task
        scope = this.project.scopeItems[$htmlRow.parent().find(".matrix-view-row").index($htmlRow) - 1];
        return this.findCellWithTaskInRow(scope, $htmlRow.prev());
    }
},
getLastTaskInPrevRow: function ($htmlRow) {
    if ($htmlRow.length == 0)
        return null;
    if ($htmlRow.length > 0) {
        var $lastTask = $htmlRow.find(".task, .milestone").last();
        if ($lastTask.length > 0)
            return $lastTask.data("model");
    }
    return this.getLastTaskInPrevRow($htmlRow.prev());
},
getLastTaskInGivenRow: function ($htmlRow, task, $task) {
    var $lastTask = $htmlRow.find(".task, .milestone")[$htmlRow.find(".task, .milestone").index($task) - 1];
    if ($lastTask && parseInt($($lastTask).data("model").phaseId) < parseInt(task.phaseId))
        return $($lastTask).data("model");
    return null;
},
onTaskAdd: function (evt, sender, task, scopeItem, phase, row, prevTaskId, nextTaskId) {
    if (sender.xtype === 'ptableview') return;
    var parentNode = this.store.getRoot();
    var siblingNode;
    if (this.project.isProjectComplex() && this.summaryStructureVisible) {
        var parentNode = null;
        this.store.getRoot().cascadeBy(function (node) {
            if (node.get('type-internal') == "SUMMARY_TASK") {
                if (row.name === "") {
                    if (node.get('row_model').scopeItemUid == row.scopeItemUid)
                        parentNode = node;
                }
                else {
                    if (node.get('row_model').uid == row.uid || node.get('Id') == "scope" + row.id)
                        parentNode = node;
                }
            }
        });
        var newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createTaskNode(task, scopeItem, row, phase);
        newTaskNode.set('loaded', true);
        newTaskNode.set('leaf', true);
        if (!parentNode)
            parentNode = this.store.getRoot();
        if (parentNode) {
            if (row.name == "")
                parentNode.appendChild(newTaskNode);
            else {
                var prevNode, nextNode, nextNodeIndex;
                if (prevTaskId) {
                    prevNode = parentNode.findChild('id', prevTaskId, true);
                    if (prevNode)
                        parentNode.insertChild(parentNode.indexOf(prevNode) + 1, newTaskNode);                    
                }
                if(!prevNode && nextTaskId){
                     nextNode = parentNode.findChild('id', nextTaskId, true);
                    if (nextNode){
                        nextNodeIndex = parentNode.indexOf(nextNode);
                        if(nextNodeIndex > 0)
                            parentNode.insertChild(parentNode.indexOf(nextNode) - 1, newTaskNode);                       
                    }
                }
                if( (!prevNode && !nextNode) || (nextNode && nextNodeIndex === 0) ) {
                    parentNode.insertChild(0, newTaskNode);
                }
            }
        }
    } else {
        var newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createTaskNode(task, scopeItem, row, phase);
        newTaskNode.set('loaded', true);
        newTaskNode.set('leaf', true);
        var indexNewTaskNode = this.getNewTaskOrMSNodeIndex(parentNode.childNodes, prevTaskId, nextTaskId, scopeItem.uid, phase.uid);
        parentNode.insertChild(indexNewTaskNode, newTaskNode);
    }
    if (task.subtasks && task.subtasks.length > 0 & ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled & this.project.isSubtaskEnabled) {
        for (var i = 0; i < task.subtasks.length; i++) {
            var eventRec = this.store.getRoot().findChild('Id', task.uid, true);
            if (eventRec) {
                var myRec = eventRec.childNodes[i];
                if (myRec) {
                    // FIXME create central method to merge records, ALSO fix fieldnames for consistency
                    if (myRec.get('Id') === task.subtasks[i].uid) {
                        myRec.set({
                            "name": task.subtasks[i].name,
                            "duration": task.subtasks[i].remainingDuration,
                            "startDate": task.subtasks[i].startDate,
                            "endDate": task.subtasks[i].endDate,
                            "manager": task.subtasks[i].manager,
                            "resources": task.subtasks[i].resources,
                            'complete': task.subtasks[i].complete,
                            "status": task.subtasks[i].status,
                            "checklistStatus": task.subtasks[i].checklistStatus,
                            'type': task.subtaskType,
                            'checklistItems': task.subtasks[i].checklistItems
                        });

                    }
                    // TODO handle "moved to new parent" (maybe just move the record and then re-render all)
                } else { //add the new subtask
                    //add completed subtasks if config syas to do so 
                    //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
                    //if (!(ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled & task.subtasks[i].complete)) {
                        var newsubtaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(task, task.subtasks[i]);
                        if (newsubtaskNode.get('order') == null)
                            newsubtaskNode.set('order', i);
                        /*To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
                        The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
                        or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
                        tree only on client side, we set the loaded property to true saying it doesn't have children*/
                        newsubtaskNode.set('loaded', true);
                        newsubtaskNode.set('leaf', true);
                        eventRec.insertChild(i, newsubtaskNode);
                    //}
                }


            }
        }
    }
},

getNewTaskOrMSNodeIndex: function (childNodes, prevTaskId, nextTaskId, scopeItemUid, phaseUid){
    var indexTaskOrMSNode = 0;
    var siblingNode;
    if(childNodes.length>0){
        if (prevTaskId) {
            siblingNode = _.find(childNodes, function (record) {
                return (record.id == prevTaskId);
            });
            if(siblingNode){
                indexTaskOrMSNode = siblingNode.get('index')+1;
            }            
        }

        if(!siblingNode && nextTaskId){
            siblingNode = _.find(childNodes, function (record) {
                return (record.id == nextTaskId);
            });

            if(siblingNode){
                var siblingTaskIndex = siblingNode.get('index');
                if(siblingTaskIndex && siblingTaskIndex > 0)
                    indexTaskOrMSNode = siblingTaskIndex-1;
                else
                    indexTaskOrMSNode = 0;
            }
            
        } 

        if(!siblingNode) {
            siblingNode = _.last(_.filter(childNodes, function (record) {
                return (record.get('scope_model').uid == scopeItemUid && record.get('phaseId') == phaseUid);
            }));
            if (!siblingNode)
                siblingNode = _.last(childNodes);
            indexTaskOrMSNode = siblingNode.get('index')+1;
        }
        
    }
    else{
        indexTaskOrMSNode = 0; // for case where all tasks are deleted and no sibling is found
    }

    return indexTaskOrMSNode;
},

onSummaryTaskAdd: function (evt, sender, $task, task, scope_item, phase, htmlRow) {
    this.store.getRoot().removeAll();
    this.setProjectModel(this.project, stl.app.availablePeopleAndTeams);
},

onSummaryTaskRemove: function (evt, sender, $task, task, scope_item, phase, htmlRow) {
    this.store.getRoot().removeAll();
    this.setProjectModel(this.project, stl.app.availablePeopleAndTeams);
},

onSummaryTaskDatesChanged: function (evt, sender, summaryTask) {
    var summaryTaskNode = this.store.getRoot().findChild('Id', summaryTask.uid, true);
    if (summaryTaskNode) {
        summaryTaskNode.set('startDate', summaryTask.startDate);
        summaryTaskNode.set('endDate', summaryTask.endDate);
        summaryTaskNode.set('duration', summaryTask.duration);
    }
},

onTaskRemove: function (evt, sender, task, parent_scope_item_id, phase_id) {
    // delete the node from the tree - VK
    if (sender.xtype === 'ptableview') return;
    var taskdata = task;
    var eventRec = this.store.getRoot().findChild('Id', taskdata.uid, true);
    if (eventRec) {
        var parentRec = eventRec.parentNode;
        eventRec.parentNode.removeChild(eventRec);
        if (parentRec.childNodes.length == 0)
            parentRec.set('leaf', true);
    }

},
onMilestoneAdd: function (evt, sender, ms, scopeItem,  phase, row, prevTaskId, nextTaskId) {
    if (sender.xtype === 'ptableview') return;
    var parentNode = this.store.getRoot();
    var siblingNode;
    if (this.project.isProjectComplex()) {
        var parentNode = null;
        this.store.getRoot().cascadeBy(function (node) {
            if (node.get('type-internal') == "SUMMARY_TASK") {
                if (row.name === "") {
                    if (node.get('row_model').scopeItemUid == row.scopeItemUid)
                        parentNode = node;
                }
                else {
                    if (node.get('row_model').uid == row.uid || node.get('Id') == "scope" + row.id)
                        parentNode = node;
                }
            }
        });
        var newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createMilestoneNode(ms, scopeItem, row, phase);
        newTaskNode.set('loaded', true);
        newTaskNode.set('leaf', true);
        if (!parentNode)
            parentNode = this.store.getRoot();
        if (parentNode) {
            if (row.name == "")
                parentNode.appendChild(newTaskNode);
            else {
                var prevNode, nextNode;
                if (prevTaskId) {
                    var prevNode = parentNode.findChild('id', prevTaskId, true);
                    if (prevNode)
                        parentNode.insertChild(parentNode.indexOf(prevNode) + 1, newTaskNode);
                    else
                        parentNode.insertChild(0, newTaskNode);
                }
                if(!prevNode && nextTaskId){
                     nextNode = parentNode.findChild('id', nextTaskId, true);
                    if (nextNode){
                        nextNodeIndex = parentNode.indexOf(nextNode);
                        if(nextNodeIndex > 0)
                            parentNode.insertChild(parentNode.indexOf(nextNode) - 1, newTaskNode);                       
                    }
                }
                if( (!prevNode && !nextNode) || (nextNode && nextNodeIndex === 0) ) {
                    parentNode.insertChild(0, newTaskNode);
                }
            }
        }
    } else {
        var dataNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createMilestoneNode(ms, scopeItem, row, phase);
        dataNode.set('loaded', true);
        dataNode.set('leaf', true);
        var indexNewMSNode = this.getNewTaskOrMSNodeIndex(parentNode.childNodes, prevTaskId, nextTaskId, scopeItem.uid, phase.uid);
        parentNode.insertChild(indexNewMSNode, dataNode);
    }
},
onMilestoneRemove: function (evt, sender, ms) {
    if (sender.xtype === 'ptableview') return;
    var eventRec = this.store.getRoot().findChild('Id', ms.uid, true);
    if (eventRec) {
        var parentRec = eventRec.parentNode;
        parentRec.removeChild(eventRec);
        if (parentRec.childNodes.length === 0)
            parentRec.set('leaf', true);
    }
},
onMilestoneInfoChange: function (evt, ms, editingColumn) {

},
onSubTaskRemove: function (evt, sender, subtask, task) {
    // delete the node from the tree - VK
    if (sender.xtype === 'ptableview') return;
    var subtaskdata = subtask;
    var parentNode = this.store.getRoot();
    var parentTaskNode = parentNode.findChild('Id', task.uid, true);
    if(Ext.isArray(subtaskdata)){
        subtaskdata.forEach(function(sb){
            var eventRec = parentTaskNode.findChild('Id', sb.uid, false);
            if (eventRec) {
                parentTaskNode.removeChild(eventRec);
            }
        });
    }
    else{
        var eventRec = parentTaskNode.findChild('Id', subtaskdata.uid, false)
        if (eventRec) {
            parentTaskNode.removeChild(eventRec);
        }
    }
    this.setSubtaskStartDates(task, parentTaskNode);
},
onTaskOrderChange: function (evt, sender, taskModel, nextTaskModel) {
    if (sender == this)
        return;
    var parentNode = this.store.getRoot();
    var orderChangedNode = parentNode.findChild('id', taskModel.uid, true);
    var newOrder = taskModel.order;
    var oldOrder = parseInt(orderChangedNode.get('order'));
    var oldIndex = parseInt(orderChangedNode.get('index'));
    var newIndex
    if (newOrder < oldOrder) {
        //move up
        newIndex = oldIndex - (oldOrder - newOrder);
    } else if (newOrder > oldOrder) {
        //move down
        newIndex = oldIndex + (newOrder - oldOrder);
    } else {
        //no change
    }
    if (newIndex) {
        parentNode.insertChild(newIndex, orderChangedNode);
        orderChangedNode.set('order', taskModel.order);
        orderChangedNode.set('model', taskModel);
    }
    var siblingNodes = $.grep(parentNode.childNodes, function (record) {
        return record.get('scopeItemId') == taskModel.rowId && record.get('phaseId') == taskModel.phaseId;
    });
    for (var i = 0; i < siblingNodes.length; i++) {
        var startIndexForOrderUpdate;
        if (siblingNodes[i].get('id') != taskModel.uid) {
            if (siblingNodes[i].get('order') == taskModel.order) {
                siblingNodes[i].set('oder', taskModel.order + 1);
                var newModel = siblingNodes[i].get('model').order = taskModel.order + 1;
                siblingNodes[i].set('model', newModel);
                startIndexForOrderUpdate = i;
            } else {
                if (startIndexForOrderUpdate && startIndexForOrderUpdate < i) {
                    var prevOrder = parseInt(siblingNodes[i].get('order'));
                    siblingNodes[i].set('order', prevOrder + 1);
                    var newModel = siblingNodes[i].get('model').order = prevOrder + 1;
                    siblingNodes[i].set('model', newModel);
                }
            }
        }
    }
},
onRowChange: function (evt, sender, rowModel, scope_model) {
    if (sender == this) {
        return;
    }
    this.project.scopeItems = sender.project.scopeItems;
    this.project._scopeItemsByUid = sender.project._scopeItemsByUid;
    var parentNode = this.store.getRoot(),
            newScopeItemModel = sender.project.getScopeItemByUid(rowModel.scopeItemUid);

    if (this.project.isProjectComplex() && this.summaryStructureVisible) {
        var treeNode = this.store.getRoot().findChildBy(function (node) {
            if (node.get('type-internal') != "LIST_ITEM") {
                if (node.get('row_model').uid == rowModel.uid)
                    return true;
            }
        }, this, true);
        if (treeNode) {
            treeNode.set('scopeItemName', rowModel.name);
            if (scope_model) {
                treeNode.set('scopeItemId', rowModel.scopeItemUid);
                treeNode.set('scope_model', rowModel.scopeItem);
            }
            treeNode.set('row_model', rowModel);
        }
    } else {
        Object.keys(rowModel.tasks).forEach(function (phaseId) {
            rowModel.tasks[phaseId].forEach(function (task) {
                var eventRec = parentNode.findChild('Id', task.uid, false);
                if (eventRec) {
                    eventRec.set('scopeItemId', newScopeItemModel.uid);
                    eventRec.set('scopeItemName', newScopeItemModel.name);
                    eventRec.set('scope_model', newScopeItemModel);
                }
            });
        });
    }
},

onScopeNameChange: function (evt, sender, node, scope_model) {
    if (sender.xtype == 'ptableview') {
        return;
    }
    // FIXME there should be no phase model passed on a scopeitem change event
    if (this.project.isProjectComplex()) {
        this.store.getRoot().cascadeBy(function (taskNode) {
            if (taskNode.get('scopeItemId') == node.scopeItemUid) {
                taskNode.set('scopeItemId', scope_model.uid);
                taskNode.set('scopeItemName', scope_model.name);
                taskNode.set('scope_model', scope_model);
            }
        });
    } else {
        var parentNode = this.store.getRoot();
        Object.keys(node.tasks).forEach(function (phaseId) {
            node.tasks[phaseId].forEach(function (task) {
                var eventRec = parentNode.findChild('Id', task.uid, false);
                if (eventRec) {
                    eventRec.set('scopeItemId', scope_model.uid);
                    eventRec.set('scopeItemName', scope_model.name);
                    eventRec.set('scope_model', scope_model);
                }
            });
        });
    }

},
onRowAdd: function (evt, sender, newRowModel, phases, insertType, selectedNode, summaryTask) {
    if (sender.xtype === 'ptableview') return;
    /*this.store.getRoot().cascadeBy(function(node){
    if(node.get('type-internal')=="SUMMARY_TASK"){
    if(node.get('row_model').scopeItemUid == newRowModel.scopeItemUid);
    parentNode = node.parentNode;
    }
    });
    var selectedIdx;
    var selectedRowId;
    var parentNode;
    var referenceNode;
    if (selectedNode == "root") {
    referenceNode = this.store.getRoot();
    } else {
    selectedIdx = selectedNode.parentNode.indexOf(selectedNode);
    selectedRowId = Number(selectedNode.data.data.uid);
    parentNode = this.store.getRoot(); //Project
    referenceNode = this.store.getRoot().findChildBy(function(node){
    if(node.get("row_model").uid == selectedRowId)
    return true;
    },this, true);
    }
    var newSummaryTaskAdded = this.loadSummaryTaskItem(this.project._scopeItemsByUid[newRowModel.scopeItemUid], newRowModel, summaryTask);
    newSummaryTaskAdded.set('leaf',true);
    switch (insertType) {
    case 1:
    referenceNode.parentNode.insertChild(selectedIdx - 1, newSummaryTaskAdded);
    break;
    case 2:
    referenceNode.parentNode.insertChild(selectedIdx + 1, newSummaryTaskAdded);
    break;
    case 3:
    referenceNode.appendChild(newSummaryTaskAdded);
    break;
    }*/

},
onRowRemove: function (evt, sender, row) {
    if (sender.xtype === 'ptableview') return;
    var summaryNode = this.store.getRoot().findChildBy(function (node) {
        if (node.get('row_model')) {
            if (node.get('row_model').uid == row.get("rowUid"))
                return true;
        }
    }, this, true);

    if (summaryNode) {
        var parentNode = summaryNode.parentNode;
        this.store.remove(summaryNode);
    }
    if (parentNode)
        this.updateExpandCollapseIcon(parentNode);
},

updateExpandCollapseIcon: function (parent) {
    if (parent.childNodes.length == 0) {
        parent.set("leaf", true);
    }
},
onExpandAllScopeNodes: function () {
    //this.suspendLayouts();
    this.expandAll();
    //this.resumeLayouts(true);
},
onExpandScopeNode: function (evt, sender, rowUid) {
    if (sender.xtype === 'ptableview' || window.currentViewId == "table")
        return;
    var tvNode = this.store.getRoot().findChildBy(function (node) {
        if (node.get('row_model')) {
            if (node.get('row_model').uid == rowUid)
                return true;
        }
    }, this, true);
    if (tvNode)
        tvNode.expand();

},
onCollapseScopeNode: function (evt, sender, rowUid) {
    if (sender.xtype === 'ptableview' || window.currentViewId == "table")
        return;
    var tvNode = this.store.getRoot().findChildBy(function (node) {
        if (node.get('row_model')) {
            if (node.get('row_model').uid == rowUid)
                return true;
        }
    }, this, true);
    if (tvNode)
        tvNode.collapse();
},

onProjectLoaded: function (evt, sender) {
    if (sender === this) {
        hideLoadingIcon();
        stl.app.handleCheckoutButtonAsPerProjectPrivilege(this.project.CheckedOutStatus, this.project.CheckedOutUser);
        stl.app.UpdateDownloadButtonBasedOnProjectStatus(this.project.ProjectStatus, this.project.projectFileType);
    }
},

onUpdateResourcesDeleted: function (evt, sender, updatedTasks) {
    var tv = this;
    _.each(updatedTasks, function (taskdata, idx) {
        var eventRec = tv.store.getRoot().findChild('Id', taskdata.uid, true);
        if (eventRec) {
            if (taskdata.resources)
                eventRec.set('resources', taskdata.resources);

            tv.store.load({ node: eventRec });
        }

    });
},

onScopeItemAdd: function (evt, sender, scope_item_model, index, phases) {
    if (sender.xtype === 'ptableview') return;
},

onScopeItemRemove: function (evt, sender, scope_item_model) {
    //Remove the node from tree - VK
    if (sender.xtype == 'ptableview') return;
    if (sender.xtype != "ptableview")
        var rowmodel = scope_item_model.data("model");
    else
        var rowmodel = scope_item_model;
    var eventRec = this.store.getRoot().findChild('Id', parseInt(rowmodel.uid), false);
    if (eventRec) {
        this.store.getRoot().removeChild(eventRec);
    }
},

onRowIndentationChange: function (evt, sender, rows) {
    this.store.getRoot().removeAll();
    this.setProjectModel(this.project, stl.app.availablePeopleAndTeams);
},

onPhaseChange: function (evt, sender, phase_model, index) {
    // TODO (not sure what we might need to do here, if anything - not currently showing phases)
    this.store.getRoot().cascadeBy(function (taskNode) {
        if (taskNode.get('phaseId') == phase_model.uid) {
            taskNode.set('phaseId', phase_model.uid);
            taskNode.set('phaseName', phase_model.name);
            taskNode.set('phase_model', phase_model);
            return;
        }
    });
},
onSpecialTaskTypeChange: function (evt, sender) {
    if (!stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SNET_DATE')) {
        if (!sender.down('[dataIndex=snet]').isVisible())
            sender.down('[dataIndex=snet]').setVisible(true);
    }
},

onPhaseAdd: function (evt, sender, phase_model, phase_index) {
    // TODO
    if (sender.xtype == 'ptableview')
        return;
},

//Removed the onPhaseRemove as the tableview model does not contain phase object anymore and child nodes are just tasks.
onErrorHighlightClick: function (evt, taskId) {
    var rn = this.store.getRoot();
    var html = this.getView().getNode(rn.findChild('taskId', taskId, true));
    if (html) {
        var htmlChildrenTd = $(html).find("td");
    }
    if (htmlChildrenTd) {
        for (var i = 0; i < htmlChildrenTd.length; i++) {
            // MM: classList property does not work in IE9 or below. Using className property instead
            // http://stackoverflow.com/questions/8098406/code-with-classlist-does-not-work-in-ie
            //htmlChildrenTd.className += " errorhighlightclass";
            if ($(htmlChildrenTd[i]).hasClass("x-grid-cell-name")) {
                $(htmlChildrenTd[i]).addClass("errorhighlightclass");
                break;
            }
        }
        htmlChildrenTd[0].scrollIntoView();
    }
},
onDataReady: function () {
    // TODO handle multiple sub-projects
    var root = this.convertDataForTable();
    console.log("reconfiguring with", root);
    this.store.setRootNode(root);
},
setProjectModel: function (project, availableTeams, loadFlatStructure) {
    this.project = project;


    var newRoot = this.store.getRoot();
    newRoot.set('model', project);
    var rows = project.rows;
    var phases = project.phases;
    var scopeStore = Ext.create('Ext.data.Store', {
        fields: ['uid', 'name'],
        data: project.scopeItems
    });
    var phasesWithoutMs = project.phases.filter(function (phase) {
        if (phase.type != "milestone")
            return phase;
    });
    var phaseStore = Ext.create('Ext.data.Store', {
        fields: ['uid', 'name'],
        data: phasesWithoutMs
    });
    var personsStore = Ext.create('Ext.data.Store', {
        fields: ['Name', 'FullName'],
        data: availableTeams
    });

    this.bindMangersToPersonStore(personsStore);
    this.bindParticipantsToPersonStore(personsStore);


    if (!loadFlatStructure && this.project.isProjectComplex()) {//repalce this with summary structure flag 
        this.summaryStructureVisible = true;
        this.loadSummaryStructure(rows, phases);

    }
    else {
        this.summaryStructureVisible = false;
        this.loadFlatStructure(rows, phases);

    }
    Ext.getCmp('searchCombo').fireEvent('refresh', Ext.getCmp('searchCombo'));
    $("#search-inputCell").find("input").on("keypress", function (evt) {
        if (evt.which == 13) {
            evt.preventDefault();
        }
        evt.stopPropagation();
    });
    $(project).on({
        "milestoneremove": this.onMilestoneRemove.bind(this)
    });
    $(document).trigger("projectload", [this]);
    stl.app.isTableViewLoaded = true;
},
loadSummaryStructure: function (rows, phases) {
    var is_SNET_Task_Exists = false;
    var scopeTree = Ext.getCmp('scopeItemTree').getRootNode();
    for (var i = 0; i < rows.length; i++) {
        var scopeTreeNode = scopeTree.findChild('rowUid', rows[i].uid, true);
        var scopeItemForThisRow = this.project._scopeItemsByUid[rows[i].scopeItemUid];
        var childRecordsArray = [];
        var parentNode = null;
        for (var k = 0; k < phases.length; k++) {
            var tasks = rows[i].tasks[phases[k].id];
            if (tasks && tasks.length > 0) {
                for (var j = 0; j < tasks.length; j++) {
                    if (tasks[j].isSummary) {
                        parentNode = this.loadSummaryTaskItem(scopeItemForThisRow, rows[i], tasks[j]);
                        if (scopeTreeNode.isExpanded())
                            parentNode.set('expanded', true);
                        else {
                            if (scopeTreeNode.childNodes.length == 0)
                                parentNode.set('expanded', true);
                            else
                                parentNode.set('expanded', false);
                        }
                    }
                    else {
                        if (tasks[j].isMS) {
                            recentlyAddedNode = this.loadMilestoneItems(childRecordsArray, tasks[j], scopeItemForThisRow, rows[i], phases[k]);
                        } else {
                            this.project.reCalculateSubTaskStartDate(tasks[j]);
                            //if (tasks[j].bufferType != "CCCB" && tasks[j].bufferType != "CMSB") {
                            recentlyAddedNode = this.loadTaskItems(childRecordsArray, tasks[j], scopeItemForThisRow, rows[i], phases[k]);
                            if (tasks[j].taskType == 'snet') {
                                //Check if SNET task exists in data so that SNET column can be made visible
                                is_SNET_Task_Exists = true;
                            }
                            //}
                        }
                    }
                }

            }
        }
        if (!parentNode) {
            parentNode = this.getLastSummaryTask(scopeItemForThisRow, rows[i]); //loadSummaryTaskItem(scopeItemForThisRow,rows[i]);
        }
        if (childRecordsArray.length == 0 && parentNode.childNodes.length == 0)
            parentNode.set('leaf', true);
        else {
            parentNode.set('leaf', false);
        }
        if (childRecordsArray.length > 0) {
            parentNode.appendChild(childRecordsArray);
        }

        if (!parentNode.data.root) {
            if (rows[i].outlineLevel <= 1)
                this.store.getRoot().appendChild(parentNode);
            else if (rows[i].name != "") {
                var lastSummaryNode = this.getParentNode(rows[i]);
                if (lastSummaryNode && lastSummaryNode.get('Id') != parentNode.get('Id')) {
                    if (lastSummaryNode.isLeaf())
                        lastSummaryNode.set('leaf', false);
                    lastSummaryNode.appendChild(parentNode);
                }
            }
            else {
            }
        }
    }
    var isSNETDateVisible = !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SNET_DATE');
    if (is_SNET_Task_Exists && isSNETDateVisible) {
        this.down('[dataIndex=snet]').setVisible(true);
    }
},
getLastSummaryTask: function (scope, row) {
    var parent = null;
    if (scope)
        parent = this.store.getRoot().findChild('scopeItemId', scope.uid, true);
    var lastScopeItemNode = parent;
    while (lastScopeItemNode && lastScopeItemNode.data.outlineLevel != row.outlineLevel - 1) {
        lastScopeItemNode = _.last(lastScopeItemNode.childNodes);
    }
    if (!lastScopeItemNode || row.outlineLevel <= 1)
        return this.store.getRoot();
    return lastScopeItemNode;
},
getParentNode: function (scopeItem) {
    var lastScopeItemNode = _.last(this.store.getRoot().childNodes);
    while (lastScopeItemNode && lastScopeItemNode.data.outlineLevel != scopeItem.outlineLevel - 1) {
        lastScopeItemNode = _.last(lastScopeItemNode.childNodes);
    }
    return lastScopeItemNode;
},
loadFlatStructure: function (rows, phases) {

    var is_SNET_Task_Exists = false;
    for (var i = 0; i < rows.length; i++) {
        var scopeItemForThisRow = this.project._scopeItemsByUid[rows[i].scopeItemUid];
        for (var k = 0; k < phases.length; k++) {
            var tasks = rows[i].tasks[phases[k].id];
            if (tasks && tasks.length > 0) {
                for (var j = 0; j < tasks.length; j++) {
                    if (!tasks[j].isSummary) {
                        if (tasks[j].isMS) {
                            this.loadMilestoneItems(this.store.getRoot(), tasks[j], scopeItemForThisRow, rows[i], phases[k]);
                        } else {
                            this.project.reCalculateSubTaskStartDate(tasks[j]);
                            this.loadTaskItems(this.store.getRoot(), tasks[j], scopeItemForThisRow, rows[i], phases[k]);
                            if (tasks[j].taskType == 'snet') {
                                //Check if SNET task exists in data so that SNET column can be made visible
                                is_SNET_Task_Exists = true;
                            }
                        }
                    }
                }
            }
        }
    }
    var isSNETDateVisible = !stl.app.isColumnHidden('SPI_COLUMNS_AND_LABELS_SNET_DATE');
    if (is_SNET_Task_Exists && isSNETDateVisible) {
        this.down('[dataIndex=snet]').setVisible(true);
    }
},
loadSummaryTaskItem: function (scopeItem, row, summaryTask) {
    var me = this,
            DATE = Sch.util.Date,
            dataNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSummaryTaskNode(scopeItem, row, this.project.phases[0], summaryTask);
    return dataNode;
},

bindMangersToPersonStore: function (personsStore) {
    if (this.down('[dataIndex=manager]').isVisible()) {
        this.down('[dataIndex=manager]').getEditor().bindStore(personsStore);
    }
},

bindParticipantsToPersonStore: function (personsStore) {
    if (this.down('[dataIndex=participants]').isVisible()) {
        this.down('[dataIndex=participants]').getEditor().bindStore(personsStore);
    }
},

getManagerName: function (manager_id) {
    var resources = this.project.getAvailableResources();
    for (var i = 0; i < resources.length; i++) {
        if (resources[i].uid === manager_id) {
            return resources[i].name;
        }
    }
},
loadTaskItems: function (newRoot, task, scopeItem, row, phase) {
    var me = this,
            DATE = Sch.util.Date,
            dataNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createTaskNode(task, scopeItem, row, phase);

    this.loadSubtaskItems(task, dataNode);
    if (newRoot instanceof Array) {
        dataNode.set('loaded', true);
        if (dataNode.childNodes.length == 0)
            dataNode.set('leaf', true);
        newRoot.push(dataNode);
    } else {
        /*  To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
        The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
        or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
        tree only on client side, we set the loaded property to true saying it doesn't have children */
        dataNode.set('loaded', true);
        if (task.subtasks.length === 0)
            dataNode.set('leaf', true);
        newRoot.appendChild(dataNode); //newRoot.insertChild(dataNode.get('taskOrderNum'), dataNode);
    }
},
loadMilestoneItems: function (newRoot, milestone, scopeItem, row, phase) {
    var me = this,
            DATE = Sch.util.Date,
            dataNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createMilestoneNode(milestone, scopeItem, row, phase);
    this.loadSubtaskItems(milestone, dataNode);
    if (newRoot instanceof Array) {
        dataNode.set('loaded', true);
        if (dataNode.childNodes.length == 0)
            dataNode.set('leaf', true);
        newRoot.push(dataNode);
    } else {
        /*  To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
        The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
        or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
        tree only on client side, we set the loaded property to true saying it doesn't have children */
        dataNode.set('loaded', true);
        if (milestone.subtasks.length === 0)
            dataNode.set('leaf', true);
        newRoot.appendChild(dataNode); //newRoot.insertChild(dataNode.get('taskOrderNum'), dataNode);
    }
},
loadSubtaskItems: function (task, dataNode) {
    if (task.subtasks && task.subtasks.length > 0 & ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled & this.project.isSubtaskEnabled) {
        var subtaskAppendableArr = []
        for (var i = 0; i < task.subtasks.length; i++) {
            //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
            var loadSubtask = true;//(ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled) ? true : !task.subtasks[i].complete;
            if (loadSubtask) {
                var subtaskItem = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(task, task.subtasks[i]);
                subtaskItem.set('loaded', true);
                subtaskItem.set('leaf', true);
                subtaskAppendableArr.push(subtaskItem)
            }
        };
        if (subtaskAppendableArr.length > 0)
            dataNode.appendChild(subtaskAppendableArr);
    }
},
onRender: function (ct, position) {
    this.callParent(arguments);
    this.getView().on('nodedragover', function (targetNode, position, dragData, e, eOpts) {
        if (targetNode.isLeaf()) {
            return true;
        }
    }, this);
    this.getView().on("drop", this.onTreeNodeDrop.bind(this));
},

onTreeNodeDrop: function (node, data, targetNode, dropPosition, eOpts) {
    if (data.records.length > 0) {
        this.getView().store.treeStore.sort();
    }
    if (dropPosition === "append") {
        targetNode.set("type-internal", "SCOPE_ITEM");
    }

},
onRefreshTaskIdColumn: function (evt, sender, startIndex, tasksAndMilestones, toupdate) {
    var parentNode = this.store.getRoot();
    if (parentNode.childNodes.length > 0) {
        for (var i = startIndex; i < tasksAndMilestones.length; i++) {
            var node = parentNode.findChild('Id', tasksAndMilestones[i].uid, true);
            if (toupdate) {
                if (node) {
                    node.set('taskId', tasksAndMilestones[i].id);
                    node.set('taskOrderNum', tasksAndMilestones[i].id);
                }
            } else {
                if (node && tasksAndMilestones[i + 1]) {
                    node.set('taskId', tasksAndMilestones[i + 1].id);
                    node.set('taskOrderNum', tasksAndMilestones[i].id);
                }
            }
        }
    }
},
onPredecessorSuccessorChange: function (evt, fromTask, toTask) {
    var selectedRec = this.getSelectionModel().getSelection()[0];
    if (window.currentViewId != "table" || this.editingColumn == null || (window.currentViewId == "table" && (this.editingColumn == "predecessors" || selectedRec.get('id') != toTask.uid))) {
        var fromTaskRec = this.store.getRoot().findChild('Id', fromTask.uid, true);
        if (fromTaskRec) {
            var succ = fromTask._successors;
            var arrIds = [];
            for (var i = 0; i < succ.length; i++) {
                arrIds.push(succ[i].id);
            }
            arrIds.sort(function (a, b) {
                return a - b
            });
            fromTaskRec.set('successors', arrIds.join(","));
        }
    }
    if (window.currentViewId != "table" || this.editingColumn == null || (window.currentViewId == "table" && (this.editingColumn == "successors" || selectedRec.get('id') != toTask.uid))) {
        var toTaskRec = this.store.getRoot().findChild('Id', toTask.uid, true);
        if (toTaskRec) {
            var pred = toTask._predecessors;
            var arrIds = [];
            for (var i = 0; i < pred.length; i++) {
                arrIds.push(pred[i].id);
            }
            arrIds.sort(function (a, b) {
                return a - b
            });
            toTaskRec.set('predecessors', arrIds.join(","));
        }
    }
},
isReadyAndIP: function (isReady, stat) {
    if (isReady && stat == "IP")
        return true;
    else
        return false;
},
onSubtaskDurationChange: function (subtask, currentRec, evt, taskdata) {
    var origDuration = subtask.remainingDuration;
    var newDuration = currentRec.get('duration');
    subtask.remainingDuration = currentRec.get('duration');
    if (evt.record.get("type-internal") == "LIST_ITEM") {
        this.cmp.project.reCalculateSubTaskStartDate(taskdata);
        this.cmp.setSubtaskStartDates(taskdata, currentRec.parentNode);
        if (stl.app.isValueChanged(origDuration, newDuration))
            this.cmp.rollupDurationChange(thisView, taskdata, currentRec.parentNode);
    }
},

onTaskPropertyChange: function (thisView, currentRec, taskdata, field) {
    switch (field) {
        case "duration":
            if (taskdata.status === STATUS_NS)
                taskdata.duration = currentRec.get('duration');
            taskdata.remainingDuration = currentRec.get('duration');
            //If task status is IP and task is made zero-duration task from non-zero duration task, we have to revert the status back to NS
            if(currentRec.get('status')==STATUS_IP && thisView.project.checkIfZeroDurationMilestoneTask(taskdata)){
                currentRec.set('status',STATUS_NS);
                //taskdata.duration = currentRec.get('duration');
            }
            break;
        case "manager":
            taskdata.manager = currentRec.get('manager');
            break;
        case "name":
            var oldTaskName = taskdata.name;
            taskdata.name = currentRec.get('name');
            // Update fullkit name in Milestone panel Fullkit tab.
            if (oldTaskName !== taskdata.name && multipleORs(taskdata.taskType, TASKTYPE_FULLKIT, TASKTYPE_PT) && thisView.project.isIDCCed) {
                Ext.getCmp('CCSummarygrid').UpdateFullKitNameInCCSummary(taskdata);
            }
            if (currentRec.get('type-internal') == "MILESTONE") {
                $(document).trigger("milestoneupdate", [taskdata, 'name']);
                //Ext.getCmp('CCSummarygrid').updateMilestoneSheet(taskdata);
            }
            break;
        case "scopeItemName":
            var oldvalue = currentRec.get('scope_model').name;
            currentRec.get('scope_model').name = currentRec.get('scopeItemName');
            currentRec.get('row_model').name = currentRec.get('scopeItemName');
            $(document).trigger("scopenamechange", [thisView, currentRec.get('row_model'), oldvalue, currentRec.get('scopeItemName')]);
            return false;
            break;
        case "type":
            if (currentRec.get('type-internal') === "MILESTONE") {
                this.onMilestoneTypeChange(currentRec, taskdata);
                return false;

            } else {
                //[CON 2995]-Planning: Support of subtasks in PT
                /*if (currentRec.get('type') === 'purchasing' && taskdata.subtaskCount !== 0) {
                    currentRec.set('type', taskdata.taskType);
                    PPI_Notifier.info(getStringWithArgs(INFO_TASK_TYPE_CHANGE, PURCHASING_TASK));
                    return false;
                } else {*/
                    if (currentRec.get('type') === 'snet')
                        $(document).trigger("specialTaskTypeChange", [thisView]);
                    taskdata.taskType = currentRec.get('type');
                //}
            }
            break;
        case "resources":
            taskdata.resources = currentRec.get('resources');
            for (var i = 0; i < taskdata.resources.length; i++) {
                var res = thisView.project.getResourceByUid(taskdata.resources[i].resourceId);
                Ext.getCmp('resGrid').updateResourceSheet(res, taskdata.resources[i].units, taskdata);
            }
            break;
        case "snet":
            taskdata.startNoEarlierThan = currentRec.get('snet');
            break;
        case "subtaskType":
            if (currentRec.get('subtaskType') == '2')
                thisView.down('[dataIndex=volume]').setVisible(true);
            //this is commented as this column may be hidden by config
            //else if (currentRec.get('subtaskType') == '3')
            //thisView.down('[dataIndex=subtasksWIPLimit]').setVisible(true);
            //else { }
            taskdata.subtaskType = currentRec.get('subtaskType');
            thisView.project.reCalculateSubTaskStartDate(taskdata);
            thisView.setSubtaskStartDates(taskdata, currentRec);
            for (var i = 0; i < currentRec.childNodes.length; i++) {
                currentRec.childNodes[i].set('type', currentRec.get('subtaskType'));
            }
            thisView.rollupDurationChange(thisView, taskdata, currentRec);
            break;
        case "volume":
            taskdata.volume = currentRec.get('volume');
            break;
        case "subtasksWIPLimit":
            var origWIPLimit = taskdata.subtasksWIPLimit;
            var newWIPLimit = currentRec.get('subtasksWIPLimit');
            taskdata.subtasksWIPLimit = newWIPLimit;
            if (stl.app.isValueChanged(origWIPLimit, newWIPLimit))
                thisView.rollupDurationChange(thisView, taskdata, currentRec);
            break;
        case "status":
            if (taskdata.status !== currentRec.get('status')) {
                taskdata.status = currentRec.get('status');
                if (currentRec.get('type-internal') === "MILESTONE") {
                    thisView.onMileStoneStatusChange(taskdata, currentRec, currentRec.get('status'));
                    this.project.changeStatusForIPMSOrPEMS(taskdata);
                } else {
                    //subtasks should be updated for all tasks irrespective of their type -VK 4/14/2016
                    //if (currentRec.get('type') == 'normal') {
                        for (var i = 0; i < taskdata.subtasks.length; i++) {
                            taskdata.subtasks[i].status = currentRec.childNodes[i].get('status');
                            thisView.onSubTaskStatusChange(taskdata.subtasks[i], currentRec.childNodes[i], currentRec.childNodes[i].get('status'));
                        }
                    //}
                    thisView.onTaskStatusChange(taskdata, currentRec, currentRec.get('status'));
                }
            }
            break;
        case "participants":
            taskdata.participants = currentRec.get('participants');
            break;
        case "startDate":
            taskdata.startDate = currentRec.get('startDate');
            thisView.project.reCalculateSubTaskStartDate(taskdata);
            thisView.setSubtaskStartDates(taskdata, currentRec);
            return false;
            break;
        case "endDate":
            if (currentRec.get('type') === 'fullkit' || currentRec.get('type') === "purchasing") {
                taskdata.date7 = new Date(currentRec.get('endDate'));
            }
            break;
        case "predecessors":
            thisView.editingColumn = "predecessors";
            this.onPredecessorColumnChange(thisView, currentRec, taskdata, field);
            return false;
            break;
        case "successors":
            thisView.editingColumn = "successors";
            this.onSuccessorColumnChange(thisView, currentRec, taskdata, field);
            return false;
            break;
        case "text22":
            taskdata.text22 = currentRec.get('text22');
            break;
    }
    return true;
},
onPredecessorColumnChange: function (thisView, currentRec, taskdata, field) {
    var currentPred = currentRec.get('predecessors').split(",");
    var pred = taskdata._predecessors,
            arrIds = [];
    if (_.difference(currentPred, pred).length == 0)
        return;
    for (var i = 0; i < pred.length; i++) {
        arrIds.push(pred[i].id);
    }
    arrIds.sort(function (a, b) {
        return a - b
    });
    if (currentPred.length == 1 && isNaN(currentPred[0])) {
        PPI_Notifier.alert(ENTER_ONLY_NUMERIC_VALUE_STR + currentPred[0] + IS_NOT_NUMBER, LINK_ERROR);
        currentRec.set('predecessors', arrIds.join(","));
        return;
    }
    if (currentPred.length > 1 && !(/^[0-9]+([,][0-9]+)+$/.test(currentRec.get('predecessors')))) {
        PPI_Notifier.alert("Invalid Entry Format. Enter numbers separated with comma( , )", LINK_ERROR);
        currentRec.set('predecessors', arrIds.join(","));
        return;
    }
    var fromNode;
    var errors = [];
    var newLinkIds = {};
    if (currentPred.length == 1 && currentPred[0] == "")
        currentPred = [];
    var prevPred = taskdata._predecessors;
    var prevPredIds = [];
    for (var i = 0; i < prevPred.length; i++) {
        prevPredIds.push(prevPred[i].id)
    }
    var hasDup = hasDuplicates(currentPred);
    if (hasDup != false) {
        errors.push("Link from TaskId:" + currentPred[hasDup] + " to TaskId:" + currentRec.get('taskId') + " already exists");
        var pred = currentRec.get('predecessors').split(",");
        pred.splice(hasDup, 1);
        currentRec.set('predecessors', pred.join(","));
    }
    currentPred = currentRec.get('predecessors').split(",");
    if (currentPred.length == 1 && currentPred[0] == "")
        currentPred = [];
    var indicesToRemove = [];
    var noTaskIds = [];
    var mv = $(".matrix-view").data("view");
    if(stl.app.ProjectDataFromServer.isIDCCed)
        var lv = Ext.getCmp('timelineview').linksView;
    else
        var lv = mv.linksView;
    //first remove the links and add new ones, without which redundant link error is thrown
    for (var j = 0; j < prevPredIds.length; j++) {
        if (currentPred.indexOf(prevPredIds[j]) == -1) {
            fromNode = mv.getTaskElementByUid(thisView.project.getTaskOrMilestoneUidById(prevPredIds[j]));
            if (!fromNode) {
                fromNode = mv.getMilestoneElementByUid(thisView.project.getTaskOrMilestoneUidById(prevPredIds[j]));
            }
            thisView.project.removeLink(fromNode.data("model").uid, currentRec.get('Id'));
        }
    }
    for (var i = 0; i < currentPred.length; i++) {
        if (prevPredIds.indexOf(currentPred[i]) == -1) {

            fromNode = mv.getTaskElementByUid(thisView.project.getTaskOrMilestoneUidById(currentPred[i]));
            var linkFrom = fromNode;
            if (!fromNode) {
                fromNode = mv.getMilestoneElementByUid(thisView.project.getTaskOrMilestoneUidById(currentPred[i]));
                if (fromNode)
                    linkFrom = fromNode.find(".linkable-element");
            }
            if (!fromNode) {
                noTaskIds.push(currentPred[i])
                indicesToRemove.push(i);
            } else {
                var link = {
                    from: fromNode,
                    to: currentRec.get('type-internal') === "MILESTONE" ? mv.milestoneElementsById[currentRec.get("Id")] : mv.tasksByUid[currentRec.get("Id")].$el,
                    valid: true,
                    errors: [],
                    newlinkIds: []
                };

                // listeners can abort the link by setting .valid = false
                $(mv.linksView).trigger("beforelinkadd", link);
                if (!link.valid) {
                    errors = _.union(errors, link.errors);
                    //remove the link if its redrawn to a different task
                    // if (link.newlinkIds.length > 0)
                    //     newLinkIds[i] = link.newlinkIds[0];
                    // else
                    indicesToRemove.push(i);
                } else {
                    // Re-draw the path and this time, commit its position (for future collision detection)
                    if (currentRec.get('type-internal') === "MILESTONE") {
                        if (!linkFrom.data("linkable-element-id"))
                            linkFrom = linkFrom.find(".linkable-element");
                        if (!link.to.data("linkable-element-id"))
                            link.to = link.to.find(".linkable-element");
                    }
                    lv.addConnection(linkFrom, link.to);
                    lv.findAndDrawRoute(linkFrom, link.to, true);
                    $(mv.linksView).trigger("linkadd", link);
                }
                delete link.valid;
            }
        }
    }
    if (noTaskIds.length > 0) {
        errors.push("There exists no task with Id's " + noTaskIds.join(", "));
    }
    if (errors.length > 0) {
        var msg = "";
        for (var i = 0; i < errors.length; i++) {
            msg = msg + "<li>" + errors[i] + "</li>";
            if (i + 1 < errors.length)
                msg = msg + "<br><br>";
        }
        PPI_Notifier.alert(msg, LINK_ERROR);
    }
    var pred = currentRec.get('predecessors').split(",");
    //update existing linksIds with new linkIds obtained by redirection
    //redirection is not required in case of predecessor change as any redirected link will not effect this task predecessor
    /*_.each(newLinkIds, function (num, key) {
    if (pred.indexOf(num) == -1)
    pred[key] = num;
    else
    pred[key] = undefined;
    });*/
    //now remove the undrawn link ids as they may alter the positions

    if (indicesToRemove.length > 0) {
        for (var i = indicesToRemove.length - 1; i >= 0; i--) {
            pred.splice(indicesToRemove[i], 1);
        }
    }
    pred = _.reject(pred, function (ele) {
        return ele == undefined;
    });
    currentRec.set('predecessors', pred.join(","));
},
onSuccessorColumnChange: function (thisView, currentRec, taskdata, field) {
    var currentSucc = currentRec.get('successors').split(",");
    var succ = taskdata._successors,
            arrIds = [];
    if (_.difference(currentSucc, succ).length == 0)
        return;
    for (var i = 0; i < succ.length; i++) {
        arrIds.push(succ[i].id);
    }
    arrIds.sort(function (a, b) {
        return a - b
    });
    if (currentSucc.length == 1 && isNaN(currentSucc[0])) {
        PPI_Notifier.alert("Enter only numeric values. " + currentSucc[0] + " is not a number", LINK_ERROR);
        currentRec.set('successors', arrIds.join(","));
        return;
    }
    if (currentSucc.length > 1 && !(/^[0-9]+([,][0-9]+)+$/.test(currentRec.get('successors')))) {
        PPI_Notifier.alert("Invalid Entry Format. Enter numbers separated with comma( , )", LINK_ERROR);
        currentRec.set('successors', arrIds.join(","));
        return;
    }
    if (currentSucc.length == 1 && currentSucc[0] == "")
        currentSucc = [];
    var prevSucc = taskdata._successors;
    var prevSuccIds = [];
    var errors = [];
    var newLinkIds = {};
    var toNode;
    for (var i = 0; i < taskdata._successors.length; i++) {
        prevSuccIds.push(taskdata._successors[i].id)
    }
    var hasDup = hasDuplicates(currentSucc);
    if (hasDup != false) {
        errors.push("Link from TaskId:" + currentRec.get('taskId') + " to TaskId:" + currentSucc[hasDup] + " already exists.");
        var succ = currentRec.get('successors').split(",")
        succ.splice(hasDup, 1);
        currentRec.set('successors', succ.join(","));
    }
    currentSucc = currentRec.get('successors').split(",");
    if (currentSucc.length == 1 && currentSucc[0] == "")
        currentSucc = [];
    var indicesToRemove = [];
    var mv = $(".matrix-view").data("view");
    if(stl.app.ProjectDataFromServer.isIDCCed)
        var lv = Ext.getCmp('timelineview').linksView;
    else
        var lv = mv.linksView;
    var noTaskIds = [];
    //first remove the links and add new ones, without which redundant link error is thrown
    for (var j = 0; j < prevSuccIds.length; j++) {
        if (currentSucc.indexOf(prevSuccIds[j]) == -1) {
            toNode = mv.getTaskElementByUid(thisView.project.getTaskOrMilestoneUidById(prevSuccIds[j]));
            if (!toNode) {
                toNode = mv.getMilestoneElementByUid(thisView.project.getTaskOrMilestoneUidById(prevSuccIds[j]));
            }
            thisView.project.removeLink(currentRec.get('Id'), toNode.data("model").uid);
        }
    }
    for (var i = 0; i < currentSucc.length; i++) {
        if (prevSuccIds.indexOf(currentSucc[i]) == -1) {
            toNode = mv.getTaskElementByUid(thisView.project.getTaskOrMilestoneUidById(currentSucc[i]));
            var linkTo = toNode;
            if (!toNode) {
                toNode = mv.getMilestoneElementByUid(thisView.project.getTaskOrMilestoneUidById(currentSucc[i]));
                if (toNode)
                    linkTo = toNode.find(".linkable-element");
            }
            if (!toNode) {
                noTaskIds.push(currentSucc[i]);
                indicesToRemove.push(i);
            } else {
                var link = {
                    from: currentRec.get('type-internal') === "MILESTONE" ? mv.milestoneElementsById[currentRec.get("Id")] : mv.tasksByUid[currentRec.get("Id")].$el,
                    to: toNode,
                    valid: true,
                    errors: [],
                    newlinkIds: []
                };
                // listeners can abort the link by setting .valid = false
                $(mv.linksView).trigger("beforelinkadd", link);
                if (!link.valid) {
                    errors = _.union(errors, link.errors);
                    if (link.newlinkIds.length > 0)
                        newLinkIds[i] = link.newlinkIds[0];
                    else
                        indicesToRemove.push(i);
                } else {
                    // Re-draw the path and this time, commit its position (for future collision detection)
                    if (currentRec.get('type-internal') === "MILESTONE") {
                        if (!link.from.data("linkable-element-id"))
                            link.from = link.from.find(".linkable-element");
                        if (!linkTo.data("linkable-element-id"))
                            linkTo = linkTo.find(".linkable-element");
                    }
                    lv.addConnection(link.from, linkTo);
                    lv.findAndDrawRoute(link.from, linkTo, true);
                    $(mv.linksView).trigger("linkadd", link);
                }
                delete link.valid;
            }
        }
    }

    if (noTaskIds.length > 0) {
        errors.push("There exists no task with Id's " + noTaskIds.join(", "));
    }
    if (errors.length > 0) {
        var msg = "";
        for (var i = 0; i < errors.length; i++) {
            msg = msg + "<li>" + errors[i] + "</li>";
            if (i + 1 < errors.length)
                msg = msg + "<br><br>";
        }
        PPI_Notifier.alert(msg, LINK_ERROR);
    }

    var succ = currentRec.get('successors').split(",");
    //update existing linksIds with new linkIds obtained by redirection
    _.each(newLinkIds, function (num, key) {
        succ[key] = num;
    });
    //now remove the undrawn link ids as they may alter the positions
    if (indicesToRemove.length > 0) {
        for (var i = indicesToRemove.length - 1; i >= 0; i--) {
            succ.splice(indicesToRemove[i], 1);
        }
    }

    succ = _.reject(succ, function (ele) {
        return ele == undefined;
    });
    currentRec.set('successors', succ.join(","));
},
onMilestoneTypeChange: function (currentRec, taskdata) {
    var newval = currentRec.get('type'),
            oldval = taskdata.taskType;
    if (!this.project.validatePEandPPTypeConversion(taskdata, newval)) {
        currentRec.set('type', taskdata.taskType);
        return;
    }

    var msRec = {
        'uid': currentRec.get('id'),
        'name': currentRec.get('name'),
        'type': currentRec.get('type') === "PP" ? 'NONE' : currentRec.get('type'),
        'taskType': currentRec.get('type') === "PP" ? 'NONE' : currentRec.get('type'),
        'startDate': currentRec.get('startDate'),
        'endDate': currentRec.get('endDate'),
        'date1': taskdata.date1,
        'bufferSize': taskdata.bufferSize != null ? taskdata.bufferSize : '',
        'isAutolinked': taskdata.isAutolinked,
        'status': currentRec.get('status'),
        'percentBufferConsumption': taskdata.percentBufferConsumption,
        'percentChainComplete': taskdata.percentChainComplete,
        'milestoneColor': taskdata.milestoneColor
    };

    if (msRec.date1 == null)
        msRec.date1 = ServerClientDateClass.getTodaysDate();

    Ext.getCmp('CCSummarygrid').changeMilestoneNameByChangingType(msRec.type, msRec, msRec.name, oldval, function () {
        $(document).trigger("milestoneupdate", [msRec, 'type', oldval]);
    });
    var $ms = $(".matrix-view").data("view").milestoneElementsById[msRec.uid];
    //autolink all property should bre fired only in milestone phase
    if (this.project.getPhaseById(taskdata.phaseId).type === STRING_MILESTONE_LOWER_CASE)
        $($ms.data("view")).trigger("autolinkallChange", [$ms, $ms.find(".ms-autolink input").is(":checked")])
    $ms.data("view").save();
},
onItemContextMenu: function (grid, record, item, index, event, eOpts) {
    this.getContextMenu(index, record, grid).showAt(event.getXY());
},
getContextMenu: function (index, record, grid) {
    var menuCmp = Ext.getCmp('tableViewContextMenuId');
    if (menuCmp)
        menuCmp.destroy();
    var configObjectForContextMenu = this.getConfigObjectForContextMenu(index, record, grid);
    return Ext.create('ProjectPlanning.view.tableView.ContextMenu', configObjectForContextMenu);

},
getConfigObjectForContextMenu: function (index, record, grid) {
    var contextMenuConfig = {
        grid: grid,
        rec: record,
        recIndex: index,
        tableview: this,
        taskMenuDisabled: false,
        FKMenuDisabled: false,
        MSMenuDisabled: false,
        IMSMenuDisabled: false,
        PEMenuDisabled: false,
        CMSMenuDisabled: false,
        subTaskMenuDisabled: false,
        removeTaskMenuDisabled: false
    }
    var typeInternal, phaseModel, recordDataModel, isCCCBorCMSB, isPEMSorIPMS, parentRecordDataModel, isParentMS;

    recordDataModel = record.getData().model;

    typeInternal = record.get('type-internal');
    if (typeInternal === 'LIST_ITEM') {
        phaseModel = record.parentNode.get('phase_model');
        parentRecordDataModel = record.parentNode.get('model');
    }
    else
        phaseModel = record.get('phase_model');
    //Is the task cccb or CMSB
    isCCCBorCMSB = false;
    if (recordDataModel.taskType === TASKTYPE_BUFFER && multipleORs(recordDataModel.bufferType, BUFFER_TYPE_CCCB, BUFFER_TYPE_CMSB))
        isCCCBorCMSB = true;
    //Is the task PEMS or IPMS
    isPEMSorIPMS = false;
    if ((recordDataModel.isMS) && multipleORs(recordDataModel.taskType, PEMS_SHORT, IPMS_SHORT))
        isPEMSorIPMS = true;

    isParentMS = (parentRecordDataModel && parentRecordDataModel.isMS) ? true : false;


    // task Menu should be disabled if:
    //     pahse of selected row = milestone phase/FK Phase
    //     row = subtask/summary task
    //      task != CCCB/CMSB/IPMS/PEMS
    contextMenuConfig.taskMenuDisabled = (typeInternal === 'LIST_ITEM' || phaseModel.type !== STRING_NORMAL || isCCCBorCMSB || isPEMSorIPMS);
    // FK Menu should be disabled in:
    //     pahse of selected row = milestone phase
    //     row = subtask/summary task
    //      task != CCCB/CMSB/IPMS/PEMS
    contextMenuConfig.FKMenuDisabled = (typeInternal === 'LIST_ITEM' || phaseModel.type !== STRING_NORMAL || isCCCBorCMSB || isPEMSorIPMS);
    // Milestone Menu Should be disabled in:
    //     pahse of selected row = FK phase/milestone phase
    //     row = subtask/summary task
    //      task != CCCB/CMSB/IPMS/PEMS
    contextMenuConfig.MSMenuDisabled = (typeInternal === 'LIST_ITEM' || phaseModel.type !== STRING_NORMAL || isCCCBorCMSB || isPEMSorIPMS);
    // PE Menu should be disable if:
    //  PE exists
    //  row =summary task
    //      task != CCCB/CMSB/IPMS/PEMS
    contextMenuConfig.PEMenuDisabled = (this.projectEndExists() || phaseModel.type !== STRING_NORMAL || isCCCBorCMSB || isPEMSorIPMS);
    // Subtask Menu shoud be disabled in: 
    // pahse of selected row = FK phase/milestone phase
    //  row =summary task
    //      task != CCCB/CMSB/IPMS/PEMS
    //User should not be able to add subtask if the parent task is a milestone
    contextMenuConfig.subTaskMenuDisabled = (phaseModel.type !== STRING_NORMAL || recordDataModel.isMS || recordDataModel.taskType === TASKTYPE_FULLKIT || recordDataModel.taskType === TASKTYPE_PT || typeInternal === 'SUMMARY_TASK' || isCCCBorCMSB || isPEMSorIPMS || isParentMS);


    //User should not be able to remove subtask if the parent task is a milestone
    contextMenuConfig.removeTaskMenuDisabled = isParentMS;


    return contextMenuConfig;
},
projectEndExists: function () {
    var PEExists = false;
    if (this.project._projectEndMs)
        PEExists = true;
    return PEExists;

},
createTaskAndMilestone: function (view, record, index, taskType) {
    var me = this;
    var taskModel, phase, scope, row, rootNode, newTaskNode, evntName;

    phase = record.get('phase_model');
    row = record.get('row_model');
    scope = record.get('scope_model');
    taskModel = view.project.createTaskModel(record.get('phase_model'), record.get('row_model'), taskType);
    newTaskNode = this.getTaskOrMilestoneNode(taskModel, phase, scope, row);
    newTaskNode.set('loaded', true);
    newTaskNode.set('leaf', true);
    if (record.get('type-internal') == "SUMMARY_TASK") {
        var phaseUID = phase.uid;
        var tasks = record.get('row_model').tasks[phaseUID];
        if (tasks) {
            if (tasks[0].isSummary)
                index = tasks.length - 1;
            else
                index = tasks.length;
        }
        else
            index = 0;
        record.insertChild(index, newTaskNode);
        record.expand();
    }
    else {
        rootNode = record.parentNode;
        index = rootNode.indexOf(record); //view.getRootNode();
        rootNode.insertChild(index + 1, newTaskNode);
        rootNode.expand();
    }
    if (multipleORs(taskModel.taskType, TASKTYPE_FULLKIT, STRING_NORMAL))
        evntName = "taskadd";
    else
        evntName = "milestoneadd";
    if (record.get('type-internal') == "SUMMARY_TASK")
        view.triggerTaskAndMilestoneEvent(evntName, view, taskModel, scope, phase, row, tasks[index]);
    else
        view.triggerTaskAndMilestoneEvent(evntName, view, taskModel, scope, phase, row, record);
    this.selectNewTask(newTaskNode, this.getView().getNode(newTaskNode),true);
},
triggerTaskAndMilestoneEvent: function (evntName, view, taskModel, scope, phase, row, record) {
    $(document).trigger(evntName, [
            view,
            taskModel,
            scope,
            phase,
            row,
            record.id
        ]);
},
getTaskOrMilestoneNode: function (taskModel, phase, scope, row) {
    var newTaskNode;
    if (multipleORs(taskModel.taskType, TASKTYPE_FULLKIT, STRING_NORMAL))
        newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createTaskNode(taskModel, scope, row, phase);
    else
        newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createMilestoneNode(taskModel, scope, row, phase);
    return newTaskNode;

},

setDefaultSubtaskTypeAndWIPLimt: function (taskNode) {
    var blockdata = taskNode.getData().model;
    if (blockdata.subtasks.length === 0) {
        taskNode.set('subtaskType', stl.app.getDefaultSubtaskType());
        taskNode.set('subtasksWIPLimit', stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT'));
        blockdata.subtaskType = stl.app.getDefaultSubtaskType();
        blockdata.subtasksWIPLimit = stl.app.commonSettingValue('SUBTASKS_DEFAULT_WIP_LIMIT');
    }
},
getStreamId: function(record){
    if (record.get('type-internal') === 'LIST_ITEM') {
        return record.getData().model.streamId;
    } else {
        var taskNode = record;
        var taskModel = taskNode.getData().model;
        if (taskModel.subtaskStreams && taskModel.subtaskStreams.length > 0){
            var streamsSortedByPriority = _.sortBy(taskModel.subtaskStreams, function(stream){
                return stream.streamPriority;
            });
            return streamsSortedByPriority[streamsSortedByPriority.length -1].streamId;
        } else {
            var stream  = this.createNewStream(taskModel);
            return stream.streamId;
        }
    }
},

createNewStream: function(taskModel){
    var me = this;
    var task = taskModel;
    var projectUID = stl.app.ProjectDataFromServer.uid;
    var streamConfig = {
        projectId: projectUID,
        taskId: task.uid,
        streamId: 1,
        streamPriority: 1
    }
    var stream = stl.app.ProjectDataFromServer.createStream(streamConfig);
    if (!task.subtaskStreams){
        task.subtaskStreams = [];
    }
    task.subtaskStreams.push(stream);
    return stream;
},

updateSubtaskOrder: function(subtask_model, clickedRecord){
    var taskNode;
    var clickedSubtaskOrder;
    if (clickedRecord.get('type-internal') === 'LIST_ITEM') {
        taskNode = clickedRecord.parentNode;
        clickedSubtaskOrder = clickedRecord.getData().model.order;
        _.each(taskNode.getData().model.subtasks, function(subtask){
            if (subtask.order > clickedSubtaskOrder){
                subtask.order = parseInt(subtask.order) + 1;
            }
        });
        subtask_model.order = parseInt(clickedSubtaskOrder) + 1;
    } else {
        subtask_model.order = clickedRecord.getData().model.subtasks.length;
    }

},

createSubtask: function (view, record, index, indexOfSubtaskClicked) {
    var rootNode, blockdata, nameIndex, scopeModel, taskNode;
    rootNode = view.store.getRoot();
    if (record.get('type-internal') === 'LIST_ITEM') {
        taskNode = record.parentNode;
    } else {
        taskNode = record;
    }
    blockdata = taskNode.getData().model;
    scopeModel = taskNode.getData().scope_model;
    nameIndex = taskNode.childNodes.length;
    if (blockdata.subtaskType == SubtaskTypesEnum.STREAMS){
        var streamId = this.getStreamId(record);
        var subtask_model = view.project.createSubtask({
            name: "Stream " + streamId + NEW_SUBTASK_STR + SPACE_CONST + (nameIndex + 1),
            streamId : streamId
        }, blockdata);
        //this.updateSubtaskOrder(subtask_model, record);
    } else {
        var subtask_model = view.project.createSubtask({
            name: NEW_SUBTASK_STR + SPACE_CONST + (nameIndex + 1)
        }, blockdata);
    }
    this.updateSubtaskOrder(subtask_model, record);
    

    if (blockdata.subtasks.length === 0) {
        this.setDefaultSubtaskTypeAndWIPLimt(taskNode);
    }
    blockdata.subtasks.push(subtask_model);
    var newSubtaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(blockdata, subtask_model);
    if (blockdata.subtaskType != SubtaskTypesEnum.STREAMS){
        //newSubtaskNode.order = blockdata.subtasks.length;
    }
    
    newSubtaskNode.set('loaded', true);
    newSubtaskNode.set('leaf', true);
    if (record.get('type-internal') === 'LIST_ITEM') {
        taskNode.insertChild(indexOfSubtaskClicked + 1, newSubtaskNode);
    } else {
        taskNode.insertChild(nameIndex, newSubtaskNode);
    }

    

    taskNode.set("leaf", false);

    view.rollupDurationChange(view, blockdata, taskNode);
    //     $(document).trigger("taskchange", [
    //         view,
    //         blockdata,
    //         scopeModel.id,
    //         null,
    //         true
    //     ]);

    view.expandNode(taskNode);
    this.selectNewTask(newSubtaskNode, this.getView().getNode(newSubtaskNode),true);

},
removeTaskSubtask: function (view, record, index) {
    if (record.get('type-internal') === "LIST_ITEM") {
        var parentRec = record.parentNode;
        var index = record.parentNode.indexOf(record);
        var blockdata = record.parentNode.get('model');
        $(document).trigger("taskchange", [
                view,
                blockdata,
                index
            ]);
        record.parentNode.removeChild(record);
        view.project.reCalculateSubTaskStartDate(blockdata);
        view.setSubtaskStartDates(blockdata, parentRec);
        this.selectNewTask(parentRec,this.getView().getNode(parentRec),false);
    } else {
        var MV = $(".matrix-view").data("view");
        var rootNode = record.parentNode;
        var siblingRec = record.previousSibling?record.previousSibling:record.nextSibling;
        var removedBlock = rootNode.removeChild(record);
        if (rootNode.childNodes.length == 0)
            rootNode.set('leaf', true);
        if (record.get('type-internal') === "MILESTONE") {
            var milestone = MV.getMilestoneElementByUid(record.get('id'));
            MV.onMilestoneDeleteLocal(null, record.get('id'), milestone);
        } else if (record.get('type-internal') === "BLOCK") {
            var task = MV.getTaskById(record.get('id'));
            MV.deleteTask(MV.tasksByUid[task.uid].$el, false);
        }        
        if(siblingRec)
            this.selectNewTask(siblingRec,this.getView().getNode(siblingRec),false);
    }
},
removeSummaryTask: function (view, record, index) {
    var MV = $(".matrix-view").data("view");
    var scopeTreeNode = MV.getScopeTreeNode(record.get('row_model').uid);
    if (scopeTreeNode)
        MV.deleteScope([scopeTreeNode]);
},
elementInViewport:function (el) {
  var top = el.offsetTop;
  var height = el.offsetHeight;
  return (
    top >= window.pageYOffset && (top + height) <= (window.pageYOffset + window.innerHeight)
  );
},
selectNewTask: function (record, node, iseditable) {
    if(!this.elementInViewport(node))
        node.scrollIntoView(this.getView().getEl(),true,true,true);
    else
        this.getSelectionModel().select(node);
    if(iseditable)
        this.plugins[0].startEdit(record, this.down('[dataIndex=name]'));
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
getAvailableResourceOptions: function () {
    // TODO maybe cache this transformed result; project is already caching its results
    this.cachedAvailableResourceOptions = this.project.getAvailableResources().map(function (res) {
        return { id: res.uid, text: res.Name };
    });
    this.cachedResourcesById = this.project.getAvailableResourcesByUid();
    return this.cachedAvailableResourceOptions;
},
updateResourceNameInTableView: function (taskdata) {
    var tv = this;
    var eventRec = tv.store.getRoot().findChild('Id', taskdata.uid, true);
    if (eventRec) {
        if (taskdata.resources)
            eventRec.set('resources', taskdata.resources);
        tv.store.load({ node: eventRec });
    }
},
highlightChain:function(taskArray,className){
    var uid=[];
    for(var i=0; i<taskArray.length; i++){
        uid.push(taskArray[i].uid);
    }
    this.filter(uid,"Id");
},
highlightPenChain:function(msuid){
    var penChainIDs = this.project.getPenChainID(msuid);
    var uid=[];
	if (penChainIDs && penChainIDs != -1){
	    for(var i=0; i<penChainIDs.length;i++){
	        var tasksForChainId = stl.app.ProjectDataFromServer.getTaskIdsAndMilestoneUIdForChainNumber(penChainIDs[i]).taskIds;        
	        tasksForChainId.forEach(function(taskId){
	            uid.push(taskId);
	        });
	    }
	}
    this.filter(uid,"Id");
},
onHighlightSlack:function(){
    var slackData = CCSummaryStore.SlackData;
    var uid=[];
    for (index = 0; index < slackData.length; index++) {
        var fromTaskUID = slackData[index].FromActivityUID;
        var toTaskUID = slackData[index].ToActivityUID;
        if(slackData[index].FromActivity != "N/A")
           uid.push(fromTaskUID);
        if(slackData[index].ToActivity != "N/A")
            uid.push(toTaskUID);        
    }
    this.filter(uid,"Id");
},
onHighlightResourceContention:function(){
    var resourceContentionData = CCSummaryStore.ResourceContentionData;
    var uid=[];
    for (index = 0; index < resourceContentionData.length; index++) {
        var startTaskUID = resourceContentionData[index].StartActivityUID;
        var endTaskUID = resourceContentionData[index].EndActivityUID;
        uid.push(startTaskUID);
        uid.push(endTaskUID);
    }
    this.filter(uid,"Id");
}
});
Ext.override(Ext.grid.plugin.CellEditing, {
    // Fix http://www.sencha.com/forum/showthread.php?242059
    onSpecialKey: function(ed, field, e) {
        var me = this,
            grid = field.up('tablepanel'),
            sm;        
        me.lastKeyCode = e.getKey();        
        if (e.getKey() === e.TAB) {
            e.stopEvent();            
            if (ed) {
                // Allow the field to act on tabs before onEditorTab, which ends
                // up calling completeEdit. This is useful for picker type fields.
                ed.onEditorTab(e);
            }            
            sm = grid.getSelectionModel();
            if (sm.onEditorTab) {
//                console.log("calling oneditortab of selnmodel");
                return sm.onEditorTab(grid === me.grid ? me : me.lockingPartner, e);
            }
        }
    },    
    // Fix http://www.sencha.com/forum/showthread.php?275075
    startEdit: function(record, columnHeader, /* private */ context) {
        var me = this,
            ed;
        if (!context) {
            me.preventBeforeCheck = true;
            //context = me.callParent(arguments);
            // Wow, Ext thinks the parent is the original overridden class, not its parent -- that's a bug, guys!
            // See http://www.sencha.com/forum/showthread.php?153078-overriding-callParent-behavior-change-(bug-)/page3
            context = Ext.grid.plugin.CellEditing.superclass.startEdit.apply(me, arguments);    // EDS
            delete me.preventBeforeCheck;
            if (context === false) {
                return false;
            }
        }
        // Cancel editing if EditingContext could not be found (possibly because record has been deleted by an intervening listener),
        // or if the grid view is not currently visible
        if (context && me.grid.view.isVisible(true)) {
            record = context.record;
            columnHeader = context.column;
            // Complete the edit now, before getting the editor's target cell DOM element.
            // Completing the edit hides the editor, causes a row update and sets up a delayed focus on the row.
            // Also allows any post-edit events to take effect before continuing
            me.completeEdit();
            // See if the field is editable for the requested record
            if(columnHeader && columnHeader.getEditor){
                if (columnHeader && !columnHeader.getEditor(record)) {
                    return false;
                }
            }
            // Switch to new context *after* completing the current edit
            me.context = context;
            if(columnHeader.dataIndex == 'snet')
                if(record.get(columnHeader.dataIndex) && record.get(columnHeader.dataIndex) != '')
                    context.originalValue = context.value = new Date(record.get(columnHeader.dataIndex));
                else
                    context.originalValue = context.value = record.get(columnHeader.dataIndex);
            else
                context.originalValue = context.value = record.get(columnHeader.dataIndex);

            if (me.beforeEdit(context) === false || me.fireEvent('beforeedit', me, context) === false || context.cancel) {
                return false;
            }
            value = context.value;  // EDS added
            ed = me.getEditor(record, columnHeader);
            me.lastKeyCode = null;  // EDS added
            // Whether we are going to edit or not, ensure the edit cell is scrolled into view
            me.grid.view.cancelFocus();
            me.view.scrollCellIntoView(me.getCell(record, columnHeader));
            
            if (ed) {
                me.showEditor(ed, context, context.value);

                if(columnHeader.getEditor(record) && columnHeader.dataIndex ==='status') {
                    if(record.get('type')!="fullkit"){
                        columnHeader.getEditor(record).getStore().filter(function(r){
                            return r.get('status')!== 'RL';
                        });
                    } else {
                        columnHeader.getEditor(record).getStore().clearFilter();
                    }
                }                
                return true;
            }
            return false;
        }
    }
});
Ext.override(Sch.plugin.TreeCellEditing, {
    // Override to position editor correctly without tree lines shown
    showEditor: function (ed, context, value) {
        var me = this,
            record = context.record,
            columnHeader = context.column,
            sm = me.grid.getSelectionModel(),
            selection = sm.getCurrentPosition && sm.getCurrentPosition();
        me.context = context;
        me.setActiveEditor(ed);
        me.setActiveRecord(record);
        me.setActiveColumn(columnHeader);
        // Select cell on edit only if it's not the currently selected cell
        if (sm.selectByPosition && (!selection || selection.column !== context.colIdx || selection.row !== context.rowIdx)) {
            sm.selectByPosition({
                row: context.rowIdx,
                column: context.colIdx
            });
        }
        // EDIT (Streamliner) - show editor with correct indentation and width
        var isTreeColumn = (columnHeader.xtype === "treecolumn"),
            xOffset = (isTreeColumn ? (20 * record.get("depth") + 1) : 0);
        ed.offsets = [ xOffset, 0 ];
        // MODIFICATION (Bryntum) - passing `context` as 3rd arguments
        ed.startEdit(me.getCell(record, columnHeader), value, context);
        // EOF MODIFICATION
        // EDIT (Streamliner) - show editor with correct indentation and width
        if (isTreeColumn) {
            ed.setWidth(columnHeader.width - xOffset - 2);
        }
        me.editing = true;
        me.scroll = me.view.el.getScroll();
    }
});
// FIXME this is a proof-of-concept only.  We need to re-implement the "drag between left tree and timeline view"
// in a clean, Ext-friendly way (ddgroups?).  Unfortunately that was a huge time sink for me and never worked.
// TODO in the interim, at least extend a new pointdragzone subclass rather than override everything
Ext.override(Sch.feature.SchedulerDragZone, {
    onDragOver: function() {
//        console.log("ondragover", this.dragData);
        var dragData = this.dragData,
            schedulerView = this.schedulerView,
            eventStore = schedulerView.getEventStore(),
            DATE = Sch.util.Date,
            resourceId = (this.dragData.newResource || this.dragData.resourceRecord).get("id"),
            start = dragData.startDate,
            end = dragData.endDate;
        // Find events in this location
        var overEvents = eventStore.queryBy(function (event) {
            var eventStart = event.getStartDate(),
                eventEnd = event.getEndDate();
//            console.log("looking at event", event.getResourceId(), resourceId);
            return (event.getResourceId() === resourceId) && eventStart && eventEnd && DATE.intersectSpans(eventStart, eventEnd, start, end);
        });
        var overEventId = null;
        if (overEvents.getCount() > 0) {
            var overEvent = overEvents.first();
            overEventId = overEvent.get("id");
        }
        if (overEventId !== dragData.lastOverEventId) {
            if (dragData.lastOverEventId) {
                dragData.lastOverEventEl.removeCls("event-drag-over");
            }
            dragData.lastOverEventId = overEventId;
            if (overEventId) {
                dragData.lastOverEventId = overEventId;
                dragData.lastOverEventEl = schedulerView.getElementFromEventRecord(overEvent);
                dragData.lastOverEventEl.addCls("event-drag-over");
            } else {
                dragData.lastOverEventEl = null;
            }
        }
        this.callParent(arguments);
    },


    onDragDrop: function(e, id) {
        this.callParent(arguments);
        var dragData = this.dragData;
        if (dragData.lastOverEventEl) {
            dragData.lastOverEventEl.removeCls("event-drag-over");
        }
    }
});

    function allSubtasksNS(subtasks){
        for(var i=0; i<subtasks.length; i++){
            if(subtasks[i].get('status') != "NS" || subtasks[i].get('status') != "0")
                return false;
        }
        return true;

    }

    function allSubtasksCO(subtasks){
        for(var i=0; i<subtasks.length; i++){
            if(subtasks[i].get('status') != "CO" || subtasks[i].get('status') != "2")
                return false;
        }
        return true;
    }

    function setSubtasksStatus(task, status){
        for(var i=0 ; i< task.childNodes.length; i++){
            task.childNodes[i].set('status',status);
        }
    }

    function taskStatusChangeValidator(task, newval, oldval, callbk){
        if(oldval === 'NS' && newval === 'IP'){
            ChangeTaskStatusFromNSToIP();
            callbk('yes');
        }else if(oldval === 'NS' && newval === 'CO'){
            ChangeTaskStatusFromNSToCO(task.get('name'),task, task.childNodes, null,function(reply){
                if(task.get('type')!='fullkit'){
                    if(reply == 'yes')
                        task.set('disableStatus',true);
                    else
                        task.set('disableStatus',false);
                }
                callbk(reply);
            });
        }else if(oldval === 'IP' && newval === 'CO'){
            ChangeTaskStatusFromIPToCO(task.get('name'),task, task.childNodes, null,function(reply){
                if(task.get('type') != 'fullkit'){
                    if(reply == 'yes')
                        task.set('disableStatus',true);
                    else
                        task.set('disableStatus',false);
                }
                callbk(reply);
            });
        }else if(oldval === 'IP' && newval === 'NS'){
            ChangeTaskStatusFromIPToNS(task.get('name'),task, task.childNodes, function(reply){
                if(task.get('type') != 'fullkit'){
                   task.set('disableStatus',false);
                }
                callbk(reply);
            });
        }else if(oldval === 'CO' && newval === 'NS'){
            ChangeTaskStatusFromCOToNS(task.get('name'),task, task.childNodes, null,function(reply){
                if(task.get('type') != 'fullkit')
                    task.set('disableStatus',false);
                callbk(reply);
            });
        }else if(oldval === 'CO' && newval === 'IP'){
            ChangeTaskStatusFromCOToIP(task.get('name'), task, task.childNodes, null, function(reply, enableSubtaskStatus){
                if(task.get('type') != 'fullkit')
                    task.set('disableStatus',false);
                callbk(reply);
            });
        }else if(oldval === 'NS' && newval === 'RL'){
            ChangeTaskStatusFromNSToRL(task.get('name'), task, function (reply) {
                callbk(reply);
            });
        }else if(oldval == 'IP' && newval == 'RL'){
            ChangeTaskStatusFromIPToRL(task.get('name'), task, function (reply) {
                callbk(reply);
            });
        }else if(oldval == 'CO' && newval == 'RL'){
            ChangeTaskStatusFromCOToRL(task.get('name'), task, function (reply) {
                callbk(reply);
            });
        }else if(oldval == 'RL' && newval == 'NS'){
            ChangeTaskStatusFromRLToNS(task.get('name'), task, function (reply) {
                callbk('reply');
            });
        }else if(oldval == 'RL' && newval == 'IP'){
                //No validations required
                callbk('yes');
        }else if(oldval == 'RL' && newval == 'CO'){
                ChangeTaskStatusFromRLToCO(task.get('name'), task, function (reply) {
                callbk(reply);
            });
        }else{
            callbk('yes');
        }
    }   

    function getTaskStatusShort(record) {
        if (record.get('status') == STATUS_NS)
            return DataStore.FilterNames.StatusNSFilterName;
        else if (record.get('status') == STATUS_IP)
            return DataStore.FilterNames.StatusIPFilterName;
        else if (record.get('status') == STATUS_CO)
            return DataStore.FilterNames.StatusCOFilterName;
        else if (record.get('status') == STATUS_RL)
            return DataStore.FilterNames.StatusRLFilterName;
        else
            return record.get('status');
    }

    function subtaskStatusChangeValidator(subtask, task, newval, oldval, callbk){
        if(oldval === 'NS' && newval === 'IP'){
            ChangeSubtaskStatusFromNSToIP(subtask, task, function(reply){
                callbk(reply);
            });
        }else if(oldval === 'NS' && newval === "CO"){
            ChangeSubtaskStatusFromNSToCO(subtask, task, null, function(reply){
                callbk(reply);
            });
        }else if(oldval === 'IP' && newval === 'CO'){
            ChangeSubtaskStatusFromIPToCO(subtask, task, null, function(reply){
                callbk(reply);
            });
        }else if(oldval === 'IP' && newval === 'NS'){
            ChangeSubtaskStatusFromIPToNS(subtask, task, null, function(reply){
                callbk(reply);
            });
        }else if(oldval === 'CO' && newval === 'NS'){
            ChangeSubtaskStatusFromCOToNS(subtask, task, null, function(reply){
                callbk(reply);
            });
        }else if(oldval === 'CO' && newval === 'IP'){
            ChangeSubtaskStatusFromCOToIP(subtask, task, function(reply){
                callbk(reply);
            });
        }else{

        }       
    }

    function showAlertMessage(title, msg, callbk){
        Ext.Msg.show({
            title:title,
            msg: msg,
            buttons: Ext.Msg.YESNO,
            icon: Ext.Msg.QUESTION,
            fn: function(btn){
                callbk(btn);                    
            }
        });
    }

    function statusChecked(checked,el){
        var record = Ext.getCmp('tableview').getSelectionModel().getSelection()[0];
        var oldval = record.get('status');
            var taskdata = record.parentNode.get('model');
    var subtask = $.grep(taskdata.subtasks, function(e) {
        if (e.uid === record.get("Id")) return e;
    })[0];
            var isSubtaskCompletable =  ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled ? (subtask.checklistStatus ==2 ||subtask.checklistStatus ==0) : true;
            subtask.complete =isSubtaskCompletable && checked;
            subtask.status = checked?"CO":"NS";
            if(isSubtaskCompletable & checked ){
                record.set('complete', true);
                record.set('endDate',Ext.Date.format(ServerClientDateClass.getTodaysDate(), ServerTimeFormat.getExtDateformat())); 
                record.set('duration',0);
                record.set('status',"CO");
            }else{
                record.set('complete',false);
                record.set('status',"NS");
            }
            Ext.getCmp('tableview').getView().refreshNode(record.parentNode.get('index'));
            el.checked =record.get('complete');
             if(!isSubtaskCompletable & checked )
                    PPI_Notifier.info(SUBTASK_CANNOT_MARKED_COMPLETE)
            Ext.getCmp('tableview').onSubTaskStatusChange(subtask, record, record.get('status'));
            this.subtaskStatusChangeValidator(record, record.parentNode, record.get('status'), oldval, function(reply){
                if(reply=='yes')
                    Ext.getCmp('tableview').onTaskStatusChange(taskdata, record.parentNode, record.parentNode.get('status'));
            
                    $(document).trigger("taskchange", [ Ext.getCmp('tableview'), taskdata /* ,phaseId */ ]);
            });
    }

    function refreshChecklistIcon( origRecord, FKstatus) {
        var chkstatus,id;
        if(! origRecord.get){
            chkstatus = origRecord.checklistStatus;
            id = origRecord.uid;
        }else{
            chkstatus = origRecord.get('checklistStatus');
            id= origRecord.get('Id');
        }
        if(FKstatus != undefined){
            chkstatus = FKstatus;
        }
        if(!origRecord.set){
            origRecord = Ext.getCmp('tableview').store.getRoot().findChild('Id',id,true);
            origRecord.set('checklistStatus',chkstatus);
        }
        if (chkstatus === 2) {
            var img = document.getElementById(CHECKLIST_IMG + id);
            img.src = "./resources/images/chklistcomplete.gif";
    } else if (chkstatus === 1) {
            var img = document.getElementById(CHECKLIST_IMG + id);
            img.src = "./resources/images/checklist.GIF";
    } else if (chkstatus === 0) {
            var img = document.getElementById(CHECKLIST_IMG + id);
            img.src = "./resources/images/checklistnone.GIF";
        }

        var matrixView = $(".matrix-view").data("view");
        //check added for availding the update for subtasks
        if (origRecord.get("taskId") > -1) {
            $task = matrixView.tasksByUid[origRecord.get("model").uid] ? matrixView.tasksByUid[origRecord.get("model").uid].$el : matrixView.milestoneElementsById[origRecord.get("model").uid];
            matrixView.refreshChecklistIcon($task, origRecord.get("model"));
        }
    } 

    function showChecklistItems(event){        
        if(!event.stopPropagation)
            event.cancelBubble = true;
        else
            event.stopImmediatePropagation();
        var tableview = Ext.getCmp('tableview');
        var tableViewStore = tableview.getStore();
        var eventRecordId = event.target.id;
        var searchId = eventRecordId.substring(CHECKLIST_IMG.length);
        var record = tableViewStore.findRecord("id", searchId);
        tableview.isCheckListIconClicked = true;
        var data=[];
        var checklist = record.get('checklistItems');
        var title;
        if (isSubtask(record)) {
            title = CHECKLIST_TITLE_SUBTASK + record.data.name;
        } else {
            if (record.data.type === FULL_KIT) {
                title = FULLKIT_CHECKLIST_TITLE + record.data.name;
            } else {
                title = CHECKLIST_TITLE + record.data.name;
            }
        }
        if(checklist && checklist.length > 0){
            for(var i =0 ;i<checklist.length; i++){
                data.push({
                    complete:checklist[i].complete,
                    name: checklist[i].name,
                    uid:checklist[i].uid,
                    dummy:false,
                    order:checklist[i].order
                });
            }
        }
        var store =  Ext.create('Ext.data.Store',{
            fields:['complete', 'name', 'uid'],
            data:data
        })
        var checklistWin = Ext.create('ProjectPlanning.view.checkList.Checklist', {
            selectedRecord: record,
            store: store,
            title: title
        });
        var grid = Ext.getCmp('checklistGrid');
        // grid.disabled = Ext.getCmp('tableview').readOnly;
        if (Ext.getCmp('tableview').readOnly) {
            grid.disable();
        }
        checklistWin.show();
    $(".x-mask").on("click", function() {
        checklistWin.close();
    });
        checklistWin.on("save", function() {
            // TODO still too tightly coupled to window internals; save event should just pass relevant data
            if (!Ext.getCmp('tableview').readOnly) {
                var store = checklistWin.down("grid").getStore();
                var origRecord = this.selectedRecord;
                var recModel = origRecord.get("model"); //subtask or full kit task
                var checklist = origRecord.get('checklistItems');
                var removedRecords = store.getRemovedRecords();                
                for(var i = removedRecords.length-1 ;i >=0 ;i--){
                    var rec = _.find(checklist,function(ck){
                        return ck.name == removedRecords[i].get('name');
                    });                    
                    origRecord.get('checklistItems').splice(checklist.indexOf(rec),1);
                }
                var updatedRecords = store.getUpdatedRecords();
                
                for(var i =0 ;i < updatedRecords.length;i++){
                    var rec = _.find(checklist,function(ck){
                        return ck.name == updatedRecords[i].get('name');
                    });
                    rec.complete = updatedRecords[i].get('complete');
                    rec.name = updatedRecords[i].get('name');
                }
                var newRecords = store.getNewRecords();
                for(var i =0 ;i < newRecords.length; i++){
                    if(!newRecords[i].get('dummy'))
                        origRecord.get('checklistItems').push(newRecords[i].data);                 
                }
                for(var i=0; i<checklist.length; i++){
                    var rec = store.findRecord('name',checklist[i].name,0,false,true,true);
                    checklist[i].order = store.indexOf(rec);
                }
                origRecord.data.checklistItems = _.sortBy(checklist, function(ck){ return ck.order; });
                origRecord.get('model').checklistItems = origRecord.data.checklistItems;
                var allComplete = false;
                    origRecord.set('checklistStatus', 0);
                    
                    if(origRecord.get('checklistItems') && origRecord.get('checklistItems').length > 0) {
                        origRecord.set('checklistStatus', 1);
                        var index = this.store.find( "complete", false);
                        allComplete = (index == -1 || index ==this.store.getCount()-1) ? true : false;
                        if(allComplete)
                            origRecord.set('checklistStatus', 2);
                    }
                    recModel.checklistStatus = origRecord.get('checklistStatus');
                    refreshChecklistIcon(origRecord);

                    if (origRecord.get("model").taskType === "fullkit") {
                        UpdateFKStatus(origRecord);
                    }

    		var record = isSubtask(origRecord) ? origRecord.parentNode : origRecord;
                if(record.get('type-internal') != "MILESTONE")
                    $(document).trigger("taskchange", [ Ext.getCmp('tableview'), record.get('model')]);
                else
                    $(document).trigger("milestoneupdate", [record.get('model'), '', null]);
            }
        });
    }

    function UpdateFKStatus(origRecord) {
        var percentCompletion = 0;
        var completedItems = 0;
        var oldStatus = origRecord.get('status');
        _.each(origRecord.get('checklistItems'), function (item, idx) {
            if (item.complete)
                completedItems++;
        });
        if (origRecord.get('checklistItems').length > 0) {
            percentCompletion = Math.round((completedItems / origRecord.get('checklistItems').length) * 100);
        }
    var checklistData = {
        completedItems: completedItems,
                                percentCompletion: percentCompletion
                            };
        stl.app.FKStatusUpdateBasedOnCheckListStatus(origRecord.get("model"), checklistData); //completedItems should be replaced, task.checkliststatus should serve the purpose
        
        //var configValue = stl.app.commonSettingValue('77AUTO_UPDATE_FK_PERCENT');
        if (stl.app.updatePercentCompleteFKBasedOnChecklistItems === "1") {
            origRecord.get("model").percentComplete = percentCompletion;
            //update FK status 
            stl.app.FKStatusUpdateBasedOnPercentComplete(origRecord.get("model"));
        }
        origRecord.set('status', origRecord.get("model").status);
        if (oldStatus != origRecord.get('status')) {
            Ext.getCmp('tableview').onTaskStatusChange(origRecord.get("model"), origRecord, origRecord.get('status'));
        }
    }

    function hasDuplicates(array) {
        var valuesSoFar = {};
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (Object.prototype.hasOwnProperty.call(valuesSoFar, value)) {
                return i;
            }
            valuesSoFar[value] = true;
        }
        return false;
    }

function isSubtask(record) {
        return record.get("type-internal") == "LIST_ITEM" ? true : false;
    }

function isBufferTask(record) {
        return multipleORs(record.get("type"),"CCFB","CCCB","CMSB","buffer");
    }
function isInternalMS(record){
    return multipleORs(record.get('type'),"PEMS","IPMS");
}

    function setPurchasingTaskProperties(record, newval, oldval){
        var expFinDate = record.get('model').date7;
        if(expFinDate && expFinDate != "Invalid Date"){
            record.set('endDate', expFinDate);
    } else {
            record.set('endDate', record.get('model').endDate);
        }
        record.set('duration',record.get('model').remainingDuration);
}