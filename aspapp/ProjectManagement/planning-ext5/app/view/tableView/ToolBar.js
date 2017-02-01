Ext.define('ProjectPlanning.view.tableView.Toolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.tableviewtoolbar',
    requires: [
        "ProjectPlanning.view.tableView.ToolBarController",
        "ProjectPlanning.view.tableView.ToolBarModel",
        "ProjectPlanning.view.override.GridWithExcelExport"
    ],

    controller: "tableview-toolbar",
    viewModel: {
        type: "tableview-toolbar"
    },
    xtype:"tableviewtoolbar",
    dock: 'top',
    height:'36px',
    padding:0,
    cls: 'tool-bar',
    width: 500,
    items: [/*{//Commenting for now as it is confusing whether its a rename for Scope or Phase or Task
            // xtype: 'button', // default for Toolbars
            text: 'Rename',
            id:'rename',
            handler:function(btn, e){
                var view = Ext.getCmp("tableview");
                var selectedRec = view.getSelectionModel().getSelection();
                view.editingPlugin.startEdit(selectedRec[0],0);

            }
        },*/
        /*{            
            text : 'Add New Row',
            id:'addRow',
            handler:function(btn, e){
                var me = this;
                var view = Ext.getCmp("tableview");
                var selectedRec = view.getSelectionModel().getSelection();
                var rootNode = view.getRootNode();
                var index = rootNode.indexOf(selectedRec[0]);
                var rowModel = new stl.view.MatrixView().getBlankRowModel("");
                var totalPhases = rootNode.childNodes[0].childNodes;
                var scopeNode = {
                    'Id': "sl-scope-item-" + (Math.random() * 10000000),
                    "type-internal": "SCOPE_ITEM",
                    "name": "new scope item",
                    "complete":false,
                    expandable: true,
                    expanded: true,
                    children: [],
                    scope_item_model: rowModel
                    
                };
                for(var i =0 ;i <totalPhases.length;i++){
                    scopeNode.children.push({
                        'Id': totalPhases[i].get("Id"),
                        'name':totalPhases[i].get("name"),
                        'type-internal':"PHASE",
                        'type':totalPhases[i].get("type") ? totalPhases[i].get("type") : "",
                        expandable:true,
                        expanded:true,
                        children:[],
                        phase_model:totalPhases[i].get('data')
                    })
                }
                var addedNode = rootNode.insertChild(index+1,scopeNode);
                 
                view.editingPlugin.startEdit(addedNode,0);
                $(document).trigger("scopeitemadd", [
                    view,
                    addedNode.data,
                    index+1     
                ]);
            }
        },      
        {
            text: 'Remove Row',
            id:'deleteRow',
            handler:function(btn, e){
                var view = Ext.getCmp("tableview");
                var selectedRec = view.getSelectionModel().getSelection();
                var rootNode = view.getRootNode();
                var removedNode = rootNode.removeChild(selectedRec[0]);
                $(document).trigger("scopeitemremove", [
                            view,
                            removedNode
                ]);
            }
        },
        {
            text: 'Add New Phase',
            id:'addPhase',
            handler:function(btn, e){
                var view = Ext.getCmp("tableview");
                var rootNode = view.getRootNode();
                var position = rootNode.childNodes[0].childNodes.length;
                var previousPhaseEndDate = (position === 1 ? ServerClientDateClass.getTodaysDate() : Sch.util.Date.add(new Date(rootNode.childNodes[0].childNodes[position - 1].endDate))); 
                var newPhaseModel ={
                        'id': "sl-phase-" + String(Math.random() * 10000000),
                        'name':"New phase",
                        'startDate':Sch.util.Date.add(previousPhaseEndDate, Sch.util.Date.DAY, 1),
                        'endDate':Sch.util.Date.add(Sch.util.Date.add(previousPhaseEndDate, Sch.util.Date.DAY, 1), Sch.util.Date.DAY, 30)
                }
                for(var i =0; i< rootNode.childNodes.length;i++){
                    var scopeItem= rootNode.childNodes[i];                    
                    scopeItem.insertChild(scopeItem.childNodes.length,{
                        'id': newPhaseModel.id,
                        'name':newPhaseModel.name,
                        'type-internal':'PHASE',
                        'type': newPhaseModel.type ? newPhaseModel.type : "",
                        expandable:true,
                        expanded:true,
                        phase_model:newPhaseModel
                    });
                }
                $(document).trigger("phaseadd", [
                    view,
                    newPhaseModel,
                    position
                ]);
            }
        },{
            text: 'Remove New Phase',
            id:'deletePhase',
            handler:function(btn, e){
               // var callbk = function(){
                    var view = Ext.getCmp("tableview");
                    var rootNode = view.getRootNode();
                    var selectedRec = view.getSelectionModel().getSelection();
                    var removedNode;
                    var position = rootNode.childNodes[0].indexOf(selectedRec[0]);
                    for(var i =0 ; i< rootNode.childNodes.length ; i++){
                        var scopeItem = rootNode.childNodes[i];
                        var toRemovePhase = scopeItem.findChild('id', selectedRec[0].data.id, true);
                        scopeItem.removeChild(toRemovePhase);
                    }                
                    $(document).trigger("phaseremove", [
                                view,
                                removedNode,
                                position
                    ]);
                //}
                //Ext.create('stl.view.Danger-Window', {'callbk':callbk}).show();                
            }
        },*/
        // {
        //     text: ADD_TASK,
        //     id:'addTask',
        //     cls:['button','btn'],
        //     disabledCls:'toolbar-button-disabled',
        //     overCls:'toolbar-button-hover',
        //     hidden:true,
        //     style:{
        //         top:"6px",
        //         margin:"0px 6px 6px 6px"
        //     },
        //     handler:function(btn, e) {
        //         var view = Ext.getCmp("tableview");
        //         var rootNode = view.getRootNode();
        //         var selectedRec = view.getSelectionModel().getSelection();
        //         var index = rootNode.indexOf(selectedRec[0]);                
        //         var block_model = view.project.createTask(selectedRec[0].get('phase_model'),selectedRec[0].get('row_model'),STRING_NORMAL);
        //         var newTaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createTaskNode(block_model,selectedRec[0].get('scope_model'), selectedRec[0].get('row_model'), selectedRec[0].get('phase_model'));
        //         /*To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
        //             The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
        //             or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
        //             tree only on client side, we set the loaded property to true saying it doesn't have children*/
        //         newTaskNode.set('loaded',true);
        //         rootNode.insertChild(index+1, newTaskNode);
        //         $(document).trigger("taskadd", [
        //                     view,
        //                     null,
        //                     block_model,
        //                     selectedRec[0].get('scope_model'),
        //                     selectedRec[0].get('phase_model')
        //         ]);
        //     }
        // },{
        //     text: REMOVE_TASK,
        //     id: 'removeTask',
        //     cls:['button','btn'],
        //     disabledCls:'toolbar-button-disabled',
        //     overCls:'toolbar-button-hover',
        //     hidden:true,
        //     style:{
        //         margin:"0px 6px 6px 0px",
        //         left:"87px",
        //         top:"6px"
        //     },
        //     handler:function(btn, e){
        //         var view = Ext.getCmp("tableview");
        //         var selectedRec = view.getSelectionModel().getSelection()[0];
        //         var rootNode = selectedRec.parentNode;
        //         var removedBlock = rootNode.removeChild(selectedRec);
                    
        //         // TODO this function should belong to the project model
        //         var MV = $(".matrix-view").data("view");
        //         if(selectedRec.get('type-internal') === "MILESTONE"){
        //             var milestone = MV.getMilestoneElementByUid(selectedRec.get('id'));
        //             MV.onMilestoneDeleteLocal(null,selectedRec.get('id'),milestone);
        //         }else{
        //             var task = MV.getTaskById(selectedRec.get('id'));                
        //             MV.deleteTask(MV.tasksByUid[task.uid].$el,false);
        //         }
        //         $(document).trigger("taskremove", [
        //                     view,
        //                     task,
        //                     selectedRec.get('scope_model').id,
        //                     selectedRec.get('phase_model').id
        //         ]);
        //     }
        // },{
        //     text: ADD_SUBTASK,
        //     id:'addSubtask',
        //     cls:['button','btn'],
        //     disabledCls:'toolbar-button-disabled',
        //     overCls:'toolbar-button-hover',
        //     hidden:true,
        //     style:{
        //         top:"6px",
        //         margin:"0px 6px 6px 0px"
        //     },
        //     handler:function(btn, e){
        //         var view = Ext.getCmp("tableview");
        //         var selectedRec = view.getSelectionModel().getSelection()[0];
        //         var rootNode = selectedRec.parentNode;
        //         var index = selectedRec.childNodes.length;
        //         var blockdata =selectedRec.get('model');
        //         var subtask_model = view.project.createSubtask({name: "New Subtask"+(index+1)},blockdata);
        //         blockdata.subtasks.push(subtask_model);
        //         var newSubtaskNode = Ext.create('ProjectPlanning.model.ProjectTreeNode').createSubtaskNode(blockdata,subtask_model);
        //         newSubtaskNode.order = blockdata.subtasks.length;
        // /*To prevent showing expand/collapse triangle in a tree. ExtJS trees are designed to load the nodes via a proxy, 
        //             The presence of an expander icon next to a node indicates that it has children (either already in the client-side tree, 
        //             or server-side children that have not yet been loaded) and therefore can be expanded. Since we are using this 
        //             tree only on client side, we set the loaded property to true saying it doesn't have children*/
        //         newSubtaskNode.set('loaded',true);
        //         selectedRec = rootNode.findChild('id', selectedRec.get('id'), false);
        //         selectedRec.insertChild(index,newSubtaskNode);
        //         $(document).trigger("taskchange", [
        //                     view,
        //                     blockdata,
        //                     selectedRec.get('scope_model').id,
        //                     null,
        //                     true
        //         ]);
        //         view.rollupDurationChange(view,selectedRec.get('model'),rootNode);
        //         view.expandNode(selectedRec);
        //     }
        // },{
        //     text : REMOVE_SUBTASK,
        //     cls:['button','btn'],
        //     disabledCls:'toolbar-button-disabled',
        //     overCls:'toolbar-button-hover',
        //     id:'removeSubtask',
        //     hidden:true,
        //     style:{
        //         top:"6px",
        //         margin:"0px 6px 6px 0px"
        //     },
        //     handler:function(btn, e){
        //         var view = Ext.getCmp("tableview");
        //         var selectedRec = view.getSelectionModel().getSelection()[0];
        //             parentRec = selectedRec.parentNode;
        //         var index = selectedRec.parentNode.indexOf(selectedRec);                
        //         var blockdata =selectedRec.parentNode.get('model');
        //         $(document).trigger("taskchange", [
        //                     view,
        //                     blockdata,
        //                     selectedRec.parentNode.get('scope_model').id,
        //                     index
        //         ]);
        //         selectedRec.parentNode.removeChild(selectedRec);
        //         view.project.reCalculateSubTaskStartDate(blockdata); 
        //         view.setSubtaskStartDates(blockdata,parentRec);
        //     }
        // },'->',
        '->',{
            xtype: 'button',
            id : 'exportExcel',
            tooltip: EXPORT_EXCEL_TOOLTIP,
            disabledCls:'toolbar-button-disabled',
            overCls:'toolbar-button-hover',
            cls:['button','btn'],
            iconCls:'exportExcelCls',

            style:{
                top:"6px",
                margin:"0px 6px 6px 0px"
            },
            handler: function(btn, e) {
                var tableView = btn.up("ptableview"),
                    title = tableView.project.name || "Untitled Project";
                tableView.downloadExcelXml(false, title);
            }
        },{
            xtype: 'button',
            tooltip: EXPAND_ALL_SCOPE_ITEMS_TOOLTIP,
            id: 'expandAll',
            disabledCls:'toolbar-button-disabled',
            overCls:'toolbar-button-hover',
            cls:['button','btn'],
            iconCls:'expandAllCls',
            handler: function () {
                var view = Ext.getCmp("tableview");
                if(view){
                    view.suspendLayouts();
                    view.expandAll();
                    view.resumeLayouts(true);
                }
            }
        },{
            xtype: 'button',
            tooltip: COLLAPSE_ALL_SCOPE_ITEMS_TOOLTIP,
            id: 'collapseAll',
            cls:['button','btn'],
            disabledCls:'toolbar-button-disabled',
            overCls:'toolbar-button-hover',
            iconCls:'collapseAllCls',
            style:{
                top:"6px",
                margin:"0px 6px 6px 0px"
            },      
            handler: function () {
                var view = Ext.getCmp("tableview");
                if(view){
                    view.suspendLayouts();
                    view.collapseAll();
                    view.resumeLayouts(true);
                }    
            }
        },{
            xtype:'container',
            layout:'hbox',
            renderTo: Ext.getCmp("tableview"),
            border:false,
            style:{
                top:"6px",
                margin:"0px 6px 6px 0px"
            },
            items:[{
                xtype:'combobox',
                queryMode:'local',
                displayField:'columnName',
                id:'searchCombo',
                editable:false,
                valueField:'columnId',
                fieldLabel: SEARCH,
                labelAlign:'right',
                labelWidth:50,
                labelStyle:'color:#40566f;',
                matchFieldWidth:false,
                listConfig:{
                    maxHeight: 400,
                    minWidth: 170
                },
                listeners:{
                    afterRender:function(cbx, width, height){
                        var tree = Ext.getCmp("tableview");
                        var store = Ext.create('Ext.data.Store', {
                            fields: ['columnId', 'columnName'],
                        });
                        for(var i=0; i<tree.columns.length; i++){
                            if(!tree.columns[i].hidden && tree.columns[i].dataIndex != "taskColor")
                                store.add({columnId:tree.columns[i].dataIndex, columnName:tree.columns[i].text});
                        }
                        cbx.bindStore(store);
                        if(!cbx.getValue()){
                            var phaseRec = store.findRecord('columnId','phaseId',0, false,true,true);
                            if(phaseRec)
                                cbx.setValue(phaseRec);
                            else
                                cbx.setValue(store.getAt(0));
                        }
                    },
                    change:function(cbx, newVal, oldVal){
                        Ext.getCmp('search').reset();
                        Ext.getCmp('search').focus();
                    },
                    refresh:function(column,add){
                        var cbx = Ext.getCmp('searchCombo');
                        var store = cbx.getStore();
                        if(add){
                            //add this column to search criteria
                            store.add({columnId:column.dataIndex, columnName:column.text});
                        }else{
                            //remove this column name from search criteria
                            store.remove(store.findRecord('columnId',column.dataIndex,0,false,true,true));
                        }                        
                        if(!cbx.getValue() || (cbx.getValue() && cbx.getValue() == column.dataIndex))
                            cbx.setValue(store.getAt(0));
                    }
                }
            },{
                xtype: 'trigger',
                id:'search',
                style:{
                    margin:"0px 6px 6px 0px"
                },
                triggerCls: 'x-form-clear-trigger',
                onTriggerClick: function () {
                    this.reset();
                    this.focus();
                },
                listeners: {
                    change: function (field, newVal) {
                        var tree = Ext.getCmp("tableview");
                        var storeRec = Ext.getCmp('searchCombo').getStore().findRecord('columnName', Ext.getCmp('searchCombo').getValue(), 0, false, true, true);
                        //if(storeRec){
                            var fieldToFilter = Ext.getCmp('searchCombo').getValue();
                            if(fieldToFilter == 'scopeItemId')
                                fieldToFilter = 'scopeItemName';
                            else if(fieldToFilter == 'phaseId')
                                fieldToFilter = 'phaseName';
                            else if(fieldToFilter == 'duration')
                                newVal = newVal!=""?Math.round(juration.parse(newVal)):"";
                            /*else if(fieldToFilter == 'resources'){
                                if(newVal.indexOf("(")!= -1 && newVal.indexOf(")") != -1){
                                    var resUnits = newVal.slice(newVal.indexOf("("),newVal.indexOf(")"));
                                }
                                var resourcesList = $(".matrix-view").data('view').getAvailableResourceOptions();
                                var resVal = $.grep(resourcesList, function(e){ return e.text == newVal; });
                                newVal = resVal.id;
                            }*/
                            else
                                fieldToFilter = fieldToFilter;                            
                            var matchedRecords = tree.filter(newVal,fieldToFilter);
                            if(matchedRecords && matchedRecords.length == 0){
                                if(!tree.getComponent('noRecordMsg')){
                                    var added = tree.add({
                                        xtype: 'label',
                                        text: NO_MATCHED_RECORDS_FOUND,
                                        id:'noRecordMsg',
                                        margin: '0 0 0 10'
                                    });
                                }
                            }
                            else{
                                if(Ext.getCmp('noRecordMsg')){
                                    tree.getView().setVisible(true); 
                                    tree.remove(Ext.getCmp('noRecordMsg'));
                                }
                            }
                            

                        //}
                        field.focus();
                    },
                    buffer: 100
                }
            }]
        }
    ],
    listeners : {
        beforerender: function()
        {
           Ext.getCmp('exportExcel').setTooltip(EXPORT_EXCEL_TOOLTIP);
           Ext.getCmp('expandAll').setTooltip(EXPAND_ALL_SCOPE_ITEMS_TOOLTIP);
           Ext.getCmp('collapseAll').setTooltip(COLLAPSE_ALL_SCOPE_ITEMS_TOOLTIP);
           Ext.getCmp('searchCombo').setFieldLabel(SEARCH);
     }
        
    },
    disableAll:function(){
        for(var i = 0 ; i < this.items.length; i++){
    //Dont disable expand, collapse, search items in toolbar
            if(this.items.items[i].xtype=="tbfill")
                break;
            this.items.items[i].setDisabled(true);
        }
    }
});