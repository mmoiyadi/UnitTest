Ext.define('ProjectPlanning.view.tableView.ContextMenu', {
    extend: 'Ext.menu.Menu',
    alias: 'widget.tableViewContextMenu',
    xtype: "tableViewContextMenu",
    id:'tableViewContextMenuId',
    cls: 'tableViewContextMenuCls',
    

    items: [{

        id: 'addTaskMenu',
        text: TABLE_VIEW_ADD_TASK,
        iconCls: 'context-menu-test-add-task',
        //disabled: this.ownerCt.config.taskMenuDisabled,
        listeners: {
            click: function(item, e) {

                this.ownerCt.createTaskAndMilestone(STRING_NORMAL);
             }
            

        }

    }, {
         id: 'addFKMenu',
        text: TABLE_VIEW_ADD_FULLKIT,
        iconCls: 'context-menu-test-add-FK',
        listeners: {
            click: function(item, e) {
                this.ownerCt.createTaskAndMilestone(TASKTYPE_FULLKIT);
            }
        }
    }, {
        id: 'addMSMenu',
        text: TABLE_VIEW_ADD_MILESTONE,
        menu: {
            cls: 'tableViewContextMenuCls',
            //disabled: this.MSMenuDisabled,
            items: [{
                id: 'addIMSMenu',
                text:TABLE_VIEW_ADD_IMS,
                iconCls: 'context-menu-test-add-IMS',
                listeners: {
                    click: function(item, e) {
                       this.parentMenu.ownerCmp.ownerCt.createTaskAndMilestone(IMS_SHORT);
                    }
                }
            }, {
                id: 'addCMSMenu',
                text: TABLE_VIEW_ADD_CMS,
                iconCls: 'context-menu-test-add-CMS',
                listeners: {
                    click: function(item, e) {
                        this.parentMenu.ownerCmp.ownerCt.createTaskAndMilestone(CMS_SHORT);
                    }
                }
            }, {
                id: 'addPEMenu',
                text: TABLE_VIEW_ADD_PE,
                iconCls: 'context-menu-test-add-PE',
                listeners: {
                    click: function(item, e) {
                        this.parentMenu.ownerCmp.ownerCt.createTaskAndMilestone(PE_SHORT);
                    }
                }
            }]
        }
    }, {
        id: 'addSubtaskMenu',
        text: TABLE_VIEW_ADD_SUBTASK,
        iconCls: 'context-menu-test-add-SubTask',
        listeners: {
            click: function(item, e) {
                this.ownerCt.createTaskAndMilestone('SUBTASK');
            }
        }
    }, {
        id: 'removeTaskMenu',
        text: TABLE_VIEW_REMOVE_TASK,
        iconCls: 'context-menu-test-remove',
        listeners: {
            click: function(item, e) {
                this.ownerCt.removeTaskSubtask();
            }
        }
    },{
        xtype:'menucheckitem',
        id:'showHideSummaryTasks',
        text:HIDE_SUMMARY_STRUCTURE,
        listeners:{
            checkchange:function(item, checked, e){
                if(checked){
                    //hide summary Tasks i.e load Table view with flat structure
                    this.ownerCt.config.tableview.store.getRoot().removeAll();
                    this.ownerCt.config.tableview.setProjectModel(stl.app.ProjectDataFromServer, stl.app.availablePeopleAndTeams, true);
                }
                else{
                    //show summary task
                    this.ownerCt.config.tableview.store.getRoot().removeAll();
                    this.ownerCt.config.tableview.setProjectModel(stl.app.ProjectDataFromServer, stl.app.availablePeopleAndTeams, false);
                }
                this.ownerCt.close();
            },
            render:function(item, eOpts ){
                    item.setChecked(!this.ownerCt.config.tableview.summaryStructureVisible, true);
            }
        }
    }],
    listeners:{
        beforeShow: function(item, e) {
                Ext.getCmp('addTaskMenu').setDisabled(this.config.taskMenuDisabled);
                Ext.getCmp('addFKMenu').setDisabled(this.config.FKMenuDisabled);
                Ext.getCmp('addMSMenu').setDisabled(this.config.MSMenuDisabled);
                Ext.getCmp('addPEMenu').setDisabled(this.config.PEMenuDisabled);
                Ext.getCmp('addSubtaskMenu').setDisabled(this.config.subTaskMenuDisabled);
                Ext.getCmp('removeTaskMenu').setDisabled(this.config.removeTaskMenuDisabled);
                Ext.getCmp('showHideSummaryTasks').setVisible(this.config.tableview.project.isProjectComplex());
            }

    },
      createTaskAndMilestone: function(taskType) {
        var tableView, selectedRec, index;
        var tableView = this.config.tableview;
        var selectedRec = this.config.rec;
        var index = this.config.recIndex;
        var indexOfSubtaskClicked = selectedRec.data.index;
        if(taskType === 'SUBTASK')
            tableView.createSubtask(tableView, selectedRec, index, indexOfSubtaskClicked);
        else
        tableView.createTaskAndMilestone(tableView, selectedRec, index, taskType);

    },

    removeTaskSubtask: function() {
        var tableView, selectedRec, index;
        tableView = this.config.tableview;
        selectedRec = this.config.rec;
        index = this.config.recIndex;
        if(selectedRec.get('type-internal') == "SUMMARY_TASK")
            tableView.removeSummaryTask(tableView, selectedRec, index);
        else
            tableView.removeTaskSubtask(tableView, selectedRec, index);
        
    }
 


   



});