// TODO : Move this to store and need to find a way to load store into application cmd loading

var errStore = Ext.create('Ext.data.Store', {
    fields: ['code', 'desc', 'type', 'isError', 'items'],
    data: []
});


var warnStore = Ext.create('Ext.data.Store', {
    fields: ['code', 'desc', 'type', 'isError', 'items'],
    data: []
});

// TODO : Move this to store and need to find a way to load store into application cmd loading

Ext.define("ProjectPlanning.view.errorWarning.ErrorWarning",{
    extend: "Ext.tab.Panel",
 
    requires: [
        "ProjectPlanning.view.errorWarning.ErrorWarningController",
        "ProjectPlanning.view.errorWarning.ErrorWarningModel"
    ],
    
    controller: "errorwarning-errorwarning",
    viewModel: {
        type: "errorwarning-errorwarning"
    },

    width: 'auto',
    minWidth: 180,
    minHeight: 180,
    height: 200,
    autoscroll: true,
    baseCls: 'x-panel',
    tabPosition: 'top',
    //closable: true,
    closeAction: 'hide',
    //collapsible: true,
    alias: 'widget.errorWarningSheet',
    hidden: true,
    hideMode: 'display',
    id: 'Error_Warning_Window',
    //    layout: {
    //        type: 'fit'
    //    },
    preventHeader: true,
    //resizable: true,
    border: 1,
    style: {
        borderColor: 'gray',
        borderStyle: 'solid'
    },

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [{
                xtype: 'grid',
                id: 'errorDisplayGrid',
                //frame: false,
                minHeight: 180,
                scrollable:true,
                width: 'auto',
                header: false,
                titleAlign: 'left',
                store: errStore,
                title: ERROR_PANEL_HEADER,
                hideHeaders: true,
                columns: [{
                    xtype: 'gridcolumn',
                    text: ERR_WARNING_CODE,
                    minWidth: 50,
                    flex: 1,
                    sortable: true,
                    dataIndex: 'code',
                    //itemId:'scope',
                    align: 'left',
                    hidden: true
                },
                    {
                        xtype: 'gridcolumn',
                        text: ERR_WARNING_TYPE,
                        minWidth: 50,
                        flex: 1,
                        //width: 150,
                        sortable: true,
                        dataIndex: 'type',
                        // itemId:'phase',
                        align: 'left',
                        hidden: true,
                        renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                            if (record.get('isError')) {
                                metaData.tdCls = "ErrorClass"
                            }
                            else {
                                metaData.tdCls = "WarningClass"
                            }
                            return value;
                        }
                    },
                    {
                        xtype: 'gridcolumn',
                        text: ERR_WARNING_DESC,
                        minWidth: 100,
                        flex: 1,
                        sortable: true,
                        dataIndex: 'desc',
                        // itemId:'phase',
                        align: 'left',
                        renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                            if (record.get('isError')) {
                                metaData.tdCls = "ErrorClass"
                            }
                            else {
                                metaData.tdCls = "WarningClass"
                            }
                            return value;
                        }
                    }
                ],
                listeners: {
                    itemclick: function (dv, record, item, index, e) {
                        clearAllHighlight();
                        // TODO: Get Highllight:Custom from resource file
                        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + ERROR);
                        //Highlight requires nodes to be expanded to show all highlighted task
                        $(document).trigger('expandAllScopeNodes');
                        var items = record.get('items');
                        stl.app.highlightedTasks = [];
                        for (var i = 0; i < items.length; i++) {
                            var taskId = items[i].Id;
                            var taskUid = stl.app.ProjectDataFromServer.getTaskOrMilestoneUidById(taskId);
                            var task = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(taskUid);
                            stl.app.highlightedTasks.push(task);
                            $(document).trigger("errorHighlight", [taskId]);
                        }
                        //scope: this
                    }
                }
            },
                {
                    xtype: 'grid',
                    minHeight: 180,
                    scrollable:true,
                    width: 'auto',
                    bodyPadding: 15,
                    header: false,
                    titleAlign: 'left',
                    store: warnStore,
                    hidden: true,
                    title: ERROR_WARNING_TITLE,
                    columns: [{
                        xtype: 'gridcolumn',
                        text: ERR_WARNING_CODE,
                        minWidth: 50,
                        flex: 1,
                        sortable: true,
                        dataIndex: 'code',
                        //itemId:'scope',
                        align: 'left',
                        hidden: true
                    },
                        {
                            xtype: 'gridcolumn',
                            text: ERR_WARNING_TYPE,
                            minWidth: 50,
                            flex: 1,
                            sortable: true,
                            dataIndex: 'type',
                            // itemId:'phase',
                            align: 'left',
                            hidden: true,
                            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                                if (record.get('isError')) {
                                    metaData.tdCls = "ErrorClass"
                                }
                                else {
                                    metaData.tdCls = "WarningClass"
                                }
                                return value;
                            }
                        },
                        {
                            xtype: 'gridcolumn',
                            text: ERR_WARNING_DESC,
                            minWidth: 100,
                            flex: 1,
                            sortable: true,
                            dataIndex: 'desc',
                            // itemId:'phase',
                            align: 'left',
                            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                                if (record.get('isError')) {
                                    metaData.tdCls = "ErrorClass"
                                }
                                else {
                                    metaData.tdCls = "WarningClass"
                                }
                                return value;
                            }
                        }
                    ]
                    // html : 'Warnings goes here'
                }], //End of Items
            listeners: {
                afterRender: function (tabPanel) {
                    var bar = tabPanel.tabBar;
                    bar.insert(3, [
                        {
                            xtype: 'component',
                            flex: 1
                        },
                        {
                            xtype : 'container',
                            layout : 'hbox',
                            cls:'close_btn_container',
                            maxHeight:20,
                            maxWidth:18,
                            padding:0,
                            margin:0,
                            items:[{
                                xtype: 'button',
                                iconCls: Ext.isIE9m?'panelCloseButton':'',
                                cls:Ext.isIE9m?'':'panelCloseButton',
                                handler: function (button, event) {
                                    toggleDockingGrids('Error_Warning_Window', 'errorWarningSheet', false);
                                }
                            }]                            
                        }
                    ]);
                },
                beforeshow: function (tabPanel, eOpts) {
                    Ext.getCmp('errorDisplayGrid').bindStore(errStore);
                    Ext.getCmp('errorDisplayGrid').getView().refresh();
                }
            }
        });
        me.callParent(arguments);
    },
});
