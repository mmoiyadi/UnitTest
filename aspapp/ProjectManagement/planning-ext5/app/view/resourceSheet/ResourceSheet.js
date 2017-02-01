var pipeCellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
    pluginId: 'PipelineSummaryCellEditing'
});

Ext.define("ProjectPlanning.view.resourceSheet.ResourceSheet",{
    extend: "Ext.grid.Panel",
 
    requires: [
        "ProjectPlanning.view.resourceSheet.ResourceSheetController",
        "ProjectPlanning.view.resourceSheet.ResourceSheetModel"
    ],
    
    controller: "resourcesheet-resourcesheet",
    viewModel: {
        type: "resourcesheet-resourcesheet"
    },
    xtype : "resourceSheet",
    plugins: [pipeCellEditing],
    height: 200,
    minWidth: 180,
    minHeight: 180,
    width: 'auto',
    baseCls: 'x-panel',
    cls:'resource-sheet-grid',
    hideMode: 'display',
    //    layout: {
    //        type: 'fit'
    //    },
    border: 1,
    style: {
        borderColor: 'gray',
        borderStyle: 'solid'
    },
    title: RESOURCE_PANEL_HEADER,
    store: Ext.create('Ext.data.Store', {
        fields: ['uid', 'Name', 'AssignedUnits', 'ProjectMaxUnits', 'GlobalMaxUnits', 'CalendarUid', 'taskModel', 'taskElem'],
        listeners: {
            add: function (store, records, index, eOpts) {
            },
            remove: function (store, records, index, isMove, eOpts) {
                //remove that record from the list of available resources, if the resource record is not buffer resource
                var record = records[0];
                var isGlobal = false;
                if (record.get('GlobalMaxUnits') != "") {
                    isGlobal = true
                }
                if (record.get('Name').trim() != "") {
                    stl.model.Project.getProject().deleteResource(record.get('Name'), record.get('uid'),
                        record.get('ProjectMaxUnits'), isGlobal, record.get('CalendarUid'), record.get('taskModel'), record.get('taskElem'));
                }
            },
            update: function (store, record, operation, modifiedFieldNames, eOpts) {
            }
        }
    }),

    viewConfig: {
        stripeRows: false
    },


    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        cls: 'ccSummary resourceSheetToolBar',
        items: [{
            id: 'delete',
            text: DELETE_RESOURCE_BUTTON_TEXT,
            disabled: true,

            listeners: {
                click: {
                    fn: 'onDeleteClick'
                }
            }
        }, {
            xtype: 'tbspacer',
            width: 5
        }, '-', {
            xtype: 'tbspacer',
            width: 5
        }, {
            xtype: 'button',
            id: 'addButton',
            text: ADD_RESOURCE_BUTTON_TEXT,
            disabled: stl.app.isProjectOpenInViewOnlyMode() ? true : false,
            listeners: {
                click: {
                    fn: 'onAddClick'
                }
            }
        }]
    }],
    hidden: true,
    autoscroll: true,
    loadMask: true,
    selModel: { mode: 'SINGLE' },
    closable: true,
    closeAction: 'hide',
    resizable: true,
    collapsible: false,
    bufferedRenderer:false,

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            plugins: [{
                ptype: 'pipeCellEditing',
                clicksToEdit: 1,
                pluginId: 'pipelineEditor'
            }],
            viewConfig: {
                stripeRows: true,
                emptyText: NO_RESOURCE_IN_TASK_MESSAGE
            },
            columns: [{
                xtype: 'gridcolumn',
                minWidth: 120,
                dataIndex: 'Name',
                hideable: !stl.app.isColumnHidden('RESOURCE_PANEL_RESOURCE_NAME'),
                flex: 1,
                text: stl.app.getColumnDisplayName('RESOURCE_PANEL_RESOURCE_NAME'),
                hidden:stl.app.isColumnHidden('RESOURCE_PANEL_RESOURCE_NAME'),
                tooltip: RESOURCE_NAME_COLUMN_HEADER,
                editor: {
                    xtype: 'textfield',
                    id: 'NameTxtField',
                    selectOnFocus: true,
                    initialVal: null
                },
                renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                    return record.get('Name');
                }
            }, {
                xtype: 'gridcolumn',
                flex: 1,
                minWidth: 110,
                dataIndex: 'MaxUnits',
                hideable: !stl.app.isColumnHidden('RESOURCE_PANEL_PROJECT_MAX_UNITS'),
                text: stl.app.getColumnDisplayName('RESOURCE_PANEL_PROJECT_MAX_UNITS'),
                hidden:stl.app.isColumnHidden('RESOURCE_PANEL_PROJECT_MAX_UNITS'),
                tooltip: '',
                editor: {
                    xtype: 'textfield',
                    id: 'ProjectResourceUnitsTxtField',
                    selectOnFocus: true,
                    allowBlank: false,
                    validateBlank: true,
                    validator: function (val) {
                        if (isNaN(isNumberFloat(val.trim()))) {
                            return 'Max Unit must be either a valid frational or integer';
                        } else if (parseFloat(val.trim()) == 0){
                            return MAX_UNITS_VALIDATION_MESSAGE;
                        } 
                        else {
                            return true;
                        }
                    },
                },
                renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                        return record.get('ProjectMaxUnits');
                    }
                }, {
                    xtype: 'gridcolumn',
                    flex: 1,
                    minWidth: 110,
                    dataIndex: 'GlobalMaxUnits',
                    hideable: !stl.app.isColumnHidden('RESOURCE_PANEL_GLOBAL_MAX_UNITS'),
                    text: stl.app.getColumnDisplayName('RESOURCE_PANEL_GLOBAL_MAX_UNITS'),
                    hidden:stl.app.isColumnHidden('RESOURCE_PANEL_GLOBAL_MAX_UNITS'),
                    tooltip: '',
                    renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                        return record.get('GlobalMaxUnits');
                    }
                },
                {
                    xtype: 'gridcolumn',
                    minWidth: 120,
                    dataIndex: 'BaseCalendarName',
                    flex: 1,
                    text: "Resource Base Calendar",
                    editor: {
                        xtype: 'combobox',
                        valueField: 'BaseCalendarName',
                        displayField: 'BaseCalendarName',
                        //store: stl.app.CalendarStore,
                        forceSelection: true,
                        editable: false
                    },
                    
                renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {//BaseCalendarName
//                    if (record.get('type') === 'PE')
//                        return PROJECT_END;
//                    var storeItem = this.down('[dataIndex=type]').getEditor().getStore().findRecord('id', record.get('type'), 0, false, true, true);
//                    if (storeItem)
//                        return storeItem.get('text');
//                    return "";
                    Ext.getCmp('resGrid').down('[dataIndex=BaseCalendarName]').getEditor().bindStore(stl.app.arrAvailableCalendars)
                    return record.get('BaseCalendarName');
                }
            }
            ], // end grid columns array
            listeners: {
                afterrender: {
                    fn: me.onAfterRender,
                    scope: me
                },
                close: function () {
                    toggleDockingGrids('resGrid', 'resourceSheet', false);
                },
                beforeedit: {
                    fn: me.onBeforeEdit,
                    scope: me
                },
                edit: {
                    fn: me.onEdit,
                    scope: me
                },
                select: {
                    fn: me.onSelect,
                    scope: me
                },
                beforeshow:function(cmp){
                    if(stl.app.isProjectOpenInViewOnlyMode() || stl.app.honourConfigForGlobalResources()){
                        Ext.getCmp('addButton').setDisabled(true);
                    }
                }
            }
        });
        me.callParent(arguments);
    },

    onAfterRender: function (grid, eOpts) {
    },

    onSelect: function (grid, record, index, eOpts) {
        var isDeleteButtonDisabled = Ext.getCmp('delete').isDisabled();
        var isProjectViewOnlyMode = stl.app.isProjectOpenInViewOnlyMode();

        if (isDeleteButtonDisabled && !isProjectViewOnlyMode) {
            Ext.getCmp('delete').setDisabled(false);
        }
    },

    onBeforeEdit: function (editor, e, eOpts) {
        //We need to show all the panels as readonly when project is opened in view only mode.
        var isProjectViewOnlyMode = stl.app.ProjectDataFromServer.viewOnlyMode;
        var isEditable = true;
        var isEditableField = true;

        var rec = e.record;

        if (rec.get("Name").toLowerCase() == TIME_BUFFER_LOWERCASE) {
            isEditableField = false;
        }
		//check for global resources
        if (rec.get("GlobalMaxUnits")  && e.field.toString() == "Name") {
            isEditableField = false;
        }

        if (isProjectViewOnlyMode) {
            isEditable = false;
        }
        else {
            isEditable = isEditableField;
        }

        return isEditable;
    },

    onEdit: function (editor, e, eOpts) {
        var rec = e.record,
            editedCol = e.field,
            storeRec = editor.cmp.getStore().findRecord('uid', rec.get('uid'), 0, false, true, true),
        // FIXME eliminate global project reference
            availableResources = stl.model.Project.project.resources; //addProjectSpecificResource
        var res;
        var newResource = true;
        for (var i = 0; i < availableResources.length; i++) {
            if (availableResources[i].uid == rec.get('uid')) {
                res = availableResources[i];
                break;
            }
        }
        if (typeof (res) != "undefined") {
            newResource = false;
        }

        //        if (!newResource) { // if taskModel exists then its an existing resource
        //            var resources = storeRec.get('taskModel').resources;
        //            var res;
        //            for (var i = 0; i < resources.length; i++) {
        //                if (resources[i].resourceId == rec.get('uid')) {
        //                    res = resources[i];
        //                    break;
        //                }
        //            }
        //        }

        switch (editedCol) {
            case "Name":
                // if taskModel doesnt exist then its a new resource
                //if (!storeRec.get('taskModel')) {
                var isDuplicateName = stl.model.Project.getProject().isResourceNameDuplicate(rec.get('Name').toString(), rec.get('uid').toString());
                
                var phaseWithSameName = stl.model.Project.getProject().getPhaseWithSameNameIfExists(rec.get('Name').toString());
                var isDuplicateVirtualRes = phaseWithSameName != null ? true : false ;

                if (newResource) {
                    //call createResource function in matrix View so that new resource gets added to available list of resources
                    if (!isDuplicateName && !isDuplicateVirtualRes) {
                        if (rec.get('Name').trim() != "") {
                            var createdRes = stl.model.Project.getProject().createResource(rec.get('Name'), null, rec.get('ProjectMaxUnits'), false, null);
                            rec.set('uid', createdRes.uid);
                        } else {
                            this.getStore().remove(rec);
                        }
                    } else {
                        if(isDuplicateName){
                            PPI_Notifier.warning(RESOURCE_ADD_NAME_DUPLICATE, WARN_TYPE_RES_CREATION);
                            rec.set('Name',e.originalValue);
                            var createdRes = stl.model.Project.getProject().createResource(rec.get('Name'), null, rec.get('ProjectMaxUnits'), false, null);
                            rec.set('uid', createdRes.uid);
                            this.editingPlugin.cancelEdit();
                        }
                        else if(isDuplicateVirtualRes){

                            if(phaseWithSameName.IsGlobal){
                                    msg = getStringWithArgs(ADD_RESOURCE_NAME_COLLIDES_WITH_DIVISION_PHASE,phaseWithSameName.Divisions.join());
                                    PPI_Notifier.warning(msg, WARN_TYPE_RES_CREATION);
                            }
                            else
                                PPI_Notifier.warning(RESOURCE_ADD_VIRTUAL_NAME_DUPLICATE, WARN_TYPE_RES_CREATION);

                            rec.set('Name',e.originalValue);
                            var createdRes = stl.model.Project.getProject().createResource(rec.get('Name'), null, rec.get('ProjectMaxUnits'), false, null);
							rec.set('uid', createdRes.uid);
                            this.editingPlugin.cancelEdit();
                        }
                    }

                }
                else {
                    for (var i = 0; i < availableResources.length; i++) {
                        if (availableResources[i].uid == rec.get('uid')) {
                            if (!isDuplicateName && !isDuplicateVirtualRes) {
                                if (rec.get('Name').trim() != "") {
                                    availableResources[i].Name = rec.get('Name');
                                    //reload tasks where res assigned
                                    this.reloadResourceAssignmentsForTasks(rec.get('uid'));
                                } else {
                                    rec.set('Name', availableResources[i].Name);
                                }
                                break;
                            } else if(isDuplicateName){
                                PPI_Notifier.error(RESOURCE_UPDATE_NAME_DUPLICATE, ERR_TYPE_RES_UPDATION);
                                rec.set('Name',e.originalValue);
                                this.editingPlugin.cancelEdit();
                            } else if(isDuplicateVirtualRes){
                                if(phaseWithSameName.IsGlobal){
                                    msg = getStringWithArgs(DIVISION_PHASE_NAME_DUPLICATE,phaseWithSameName.Divisions.join());
                                    PPI_Notifier.error(msg, ERR_TYPE_RES_UPDATION);
                                }
                                else
                                    PPI_Notifier.error(PROJECT_PHASE_NAME_DUPLICATE, ERR_TYPE_RES_UPDATION);
                                rec.set('Name',e.originalValue);
                                this.editingPlugin.cancelEdit();

                            }
                        }
                    }
                }
                break;
            case "MaxUnits":
                res.MaxUnits = e.value.trim();
                rec.set('MaxUnits',res.MaxUnits);
                rec.set('ProjectMaxUnits',res.MaxUnits);
                break;
            case "GlobalMaxUnits":
                for (var i = 0; i < availableResources.length; i++) {
                    if (availableResources[i].uid == rec.get('uid')) {
                        availableResources[i].MaxUnits = rec.get('MaxWip');
                        break;
                    }
                }
                break;
            case "BaseCalendarName":
                res.BaseCalendarName = e.value.trim();
                rec.set('BaseCalendarName',res.BaseCalendarName);
                break;

            default:
        }


        if (storeRec && storeRec.get('taskModel')) {
            $(document).trigger("taskchange", [editor.cmp.getView(), storeRec.get('taskModel'), storeRec.get('taskModel').scopeItemId /* ,phaseId */]);
        }
    },

    reloadResourceAssignmentsForTasks: function (uid) {
        var isResourceNameChanged = false;
        var allTasks = stl.model.Project.getProject().getAllTasks();

        $.each(allTasks, function (index, taskModel) {
            if (taskModel.taskType != FULL_KIT) {
                var resources = taskModel.resources;
                for (var i = 0; i < resources.length; i++) {
                    var obj = resources[i];
                    if (obj.resourceId.toString() == uid.toString()) {

                        isResourceNameChanged = true;
                    }
                }
                if (isResourceNameChanged) {
                    isResourceNameChanged = false;
                    if ($(".matrix-view").data("view")){
                        if(Ext.getCmp('tableview')){
                            Ext.getCmp('tableview').updateResourceNameInTableView(taskModel);
                        }
                        var taskView = $(".matrix-view").data("view").tasksByUid[taskModel.uid].load(taskModel, null, true);
                        $($(".matrix-view").data("view").tasksByUid[taskModel.uid]).trigger("resourcechange");
                    }
                }
            }
        });


    },

    clearResourceStore: function(){
        this.store.removeAll();
    },

    updateResourceBaseCalendarsInResourceSheet : function(res, calendarName){
        var me = this;
        var rec = me.store.findRecord('uid', res.uid, 0, false, true, true)
        if (rec){
            rec.set('BaseCalendarName', calendarName);
        }
    },

    updateResourceBaseCalendarForTimeBufferInResourceSheet: function (timeBuffer){
        var rec = this.store.findRecord('uid', timeBuffer.uid, 0, false, true, true)
        if (rec){
            rec.set('BaseCalendarName', timeBuffer.BaseCalendarName);
        }
    },

    updateResourceSheet: function (res, units, blockdata) {
        var rec = this.store.findRecord('uid', res.uid, 0, false, true, true),
        // FIXME eliminate global project reference
            availableResources = stl.model.Project.project.resources; //stl.model.Project.project.getAvailableResources();
        var globalMaxUnits;
        if (!rec) {
            //add the record
            if (typeof(res.GlobalMaxUnits) == "undefined"){
                globalMaxUnits = res.MaxUnits;
            } else {
                globalMaxUnits = res.GlobalMaxUnits;
            }

            this.store.add({
                'uid': res.uid,
                'Name': res.Name,
                'AssignedUnits': units,
                'ProjectMaxUnits': res.MaxUnits,
                'GlobalMaxUnits': res.GlobalMaxUnits,
                'CalendarUid': res.calendarUid,
                'taskModel': blockdata,
                'BaseCalendarName' : this.getBaseCalendarForResource(res)
            });
        } else {
            //update
            rec.set('Name', res.Name);
            rec.set('taskModel', blockdata);
            
        }
    },

    getBaseCalendarForResource: function (res){
        if (res.BaseCalendarName){
            if (stl.app.CheckIfSelectedCalendarDeleted(res.BaseCalendarName)) {
                    stl.app.ProjectDataFromServer.setDeletedCalendarNames(res.BaseCalendarName);
                    //PPI_Notifier.info(getStringWithArgs(SELECTED_CALENDAR_DELETED, res.BaseCalendarName, stl.app.ProjectDataFromServer.projectCalendarName));
                    res.BaseCalendarName = stl.app.ProjectDataFromServer.projectCalendarName;
                }
        } else {
            res.BaseCalendarName = stl.app.ProjectDataFromServer.projectCalendarName
        }
        return res.BaseCalendarName;
    },

    updateAddDeleteButtons: function (){
        if(stl.app.isProjectOpenInViewOnlyMode()){
            Ext.getCmp('addButton').setDisabled(true);
            Ext.getCmp('delete').setDisabled(true);
        }
        else{
           Ext.getCmp('addButton').setDisabled(false); 
        }
    },
    resourceContentionInGrid: function(record, rowIndex, rowParams, store) {
        var cssClass = '';
        var isContentionExists = false;
        var resourceContentionData = CCSummaryStore.ResourceContentionData;
        if (resourceContentionData != undefined) {
            for (index = 0; index < resourceContentionData.length; index++) {
                if (record.data.Name == resourceContentionData[index].ResourceName) {
                    isContentionExists = true;
                    break;
                }
            }
        }
        if (isContentionExists) {
            cssClass = 'resourceContentedRow';
        }
        return cssClass;
    },

});
