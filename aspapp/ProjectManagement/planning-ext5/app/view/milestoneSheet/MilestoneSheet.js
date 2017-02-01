//FIXME - this shudnt be required.. CON 490
var FullKitDataStore = Ext.create('ProjectPlanning.store.FullKitDataStore', {
    storeId: 'FullKitStore'
});

Ext.define('ProjectPlanning.view.milestoneSheet.MilestoneSheet', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.milestoneSheet',
    xtype: 'milestoneSheet',
    requires: [
        "ProjectPlanning.view.milestoneSheet.MilestoneSheetController",
        "ProjectPlanning.view.milestoneSheet.MilestoneSheetModel",
        "ProjectPlanning.store.FullKitDataStore",
        "ProjectPlanning.model.Milestone"
    ],
    controller: "milestonesheet-milestonesheet",
    viewModel: {
        type: "milestonesheet-milestonesheet"
    },

    // View Parameters setting
    minHeight: 180,
    minWidth: 180,
    width: 'auto',
    height: 200,
    border: 1,
    baseCls: 'x-panel',
    cls: 'cc-settings',
    style: {
        borderColor: 'gray',
        borderStyle: 'solid',
        fontStyle:'Helvetica',
        fontWeight:'bold',
        color:'#434343'
    },
    id: 'CCSummarygrid',
    hidden: true,
    autoscroll: true,
    preventHeader: true,
    hideMode: 'display',


    // Adding the view Items below
    items: [{
        xtype: 'grid',
        id: 'msGrid',
        bind : {
                store : "{msGridStore}"
        },
        width: '100%',
        minHeight: 180,
        header: false,
        scrollable:true,
        titleAlign: 'left',
        title: MILESTONES,
        layout: 'fit',
        overflowX: 'auto',
        plugins: [
                    {
                        ptype: 'cellediting',
                        clicksToEdit: 1
                    }
                ],
        viewConfig: {
            stripeRows: true,
            emptyText: NO_MILESTONES_ASSIGNED_IN_PROJECT,
            makeDirty: false
        },
        columns:[
        {
            xtype: 'gridcolumn',
            minWidth: 15,
            width: 15,
            hideable:false,
            dataIndex: 'milestoneColor',
            resizable: false,
            sortable: false,
            text: "",
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                //metaData.style = "background-color:" + value + "; border-radius:50%;";
                metaData.tdCls = stl.model.Project.project.getTaskStatusColorFromHexValue(value);
            }
        }, //0
        {
            xtype: 'gridcolumn',
            minWidth: 120,
            dataIndex: 'name',
            flex: 1,
            text: MILESTONE_NAME,
            configKey : 'MILESTONE_PANEL_MS_NAME',
            tooltip: TOOLTIP_MSG_MILESTONE_NAME,
            editor: {
                xtype: 'textfield',
                id: 'NameTxtField',
                selectOnFocus: true,
                allowBlank: false,
                initialVal: null
            },
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                return record.get('name');
            }
        }, //1
        {
            xtype: 'gridcolumn',
            minWidth: 120,
            dataIndex: 'type',
            flex: 1,
            text: MILESTONE_TYPE,
            configKey : 'MILESTONE_PANEL_MILESTONE_TYPE',
            tooltip: TOOLTIP_MSG_MILESTONE_TYPE,
            editor: {
                xtype: 'combobox',
                displayField: 'text',
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'text'],
                    data: [
                             { id: 'CMS', text: CONTRACTUAL_MILESTONE },
                             { id: 'IMS', text: INTERNAL_MILESTONE },
                             { id: 'PE', text: PROJECT_END }
                         ]
                }),
                valueField: 'id',
                selectOnFocus: true,
                allowBlank: false,
                initialVal: null
            },
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                if (record.get('type') === 'PE')
                    return PROJECT_END;
                var storeItem = this.down('[dataIndex=type]').getEditor().getStore().findRecord('id', record.get('type'), 0, false, true, true);
                if (storeItem)
                    return storeItem.get('text');
                return "";
            }
        }, //2
        {
            text: BUFFER_SIZE,
            configKey: 'MILESTONE_PANEL_BUFFER_SIZE_D',
            minWidth: 110,
            hidden: $("#ccSummary").hasClass("disabled") ? true : false,
            dataIndex: 'bufferSize',
            format: '0 days',
            align: 'right',
            readOnly: true,
            sortable: true,
            tooltip: '',
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                if (value && value != '') {
                    if (value == "1")
                        return value + SPACE_CONST + DAY_STR;
                    return value + SPACE_CONST + DAYS;
                }
                return '';
            }
        }, //3                                      
        {
            xtype: 'gridcolumn',
            flex: 1,
            minWidth: 90,
            dataIndex: 'date1',
            text: DUE_DATE,
            configKey : 'MILESTONE_PANEL_MS_DUE_DATE',
            tooltip: '',
            editor: {
                xtype: 'datefield',
                format: ServerTimeFormat.getExtDateformat(),
                allowBlank: false,
                autoShow: true,
                selectOnFocus: true,
                initialVal: null
            },
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                if (record.get('date1') != '' && record.get('date1') != null) {
                    Ext.getCmp('CCSummarygrid').setDateFieldFormat(metaData);
                    var duedate = Ext.Date.format(record.get('date1'), ServerTimeFormat.getExtDateformat());
                    return duedate;
                }
                return '';
            }
        }, //4
        {
            xtype: 'gridcolumn',
            flex: 1,
            minWidth: 110,
            dataIndex: 'projectedDate',
            text: PROJECTED_DATE,
            configKey : 'MILESTONE_PANEL_PROJECTED_DATE',
            editable: false,
            tooltip: '',
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                        if (record.get('projectedDate') != '' && record.get('projectedDate') != null && (stl.model.Project.project.isIDCCed || stl.app.isProjectViewDebuffered)) {
                    var projecteddate = Ext.Date.format(new Date(record.get('projectedDate')), ServerTimeFormat.getExtDateformat());
                    return projecteddate;
                }
                        return NA_STRING;
            }
        }, //5
        {
            xtype: 'gridcolumn',
            minWidth: 120,
            dataIndex: 'percentBufferConsumption',
            hidden: $("#bufferSummary").hasClass("disabled") ? true : false,
            flex: 1,
            text: PERCENTAGE_BUFFER_CONSUMPTION,
            configKey : 'MILESTONE_PANEL_BUFFER_CONSUMPTION',               
        }, //6
        {
            xtype: 'gridcolumn',
            minWidth: 120,
            dataIndex: 'percentChainComplete',
            hidden: $("#bufferSummary").hasClass("disabled") ? true : false,
            flex: 1,
            text: PERCENTAGE_CHAIN_COMPLETE,
            configKey : 'MILESTONE_PANEL_CHAIN_COMPLETE',
        }, //7
	    {
	        xtype: 'actioncolumn',
            flex: 1,
            minWidth: 110,
            hidden: $("#ccSummary").hasClass("disabled")|| stl.app.getActiveTimelineViewName() === CHAIN_VIEW ? true : false,
            sortable: true,
            editable: false,
            dataIndex: 'longestPaths1',
            text: LONGEST_PATH_HEADER,
            configKey : 'MILESTONE_PANEL_LONGEST_PATH',
            menuText: LONGEST_PATH_HEADER,
            tooltip: '',
            items: [
                {
                    icon: './resources/images/NavNext.png',
                    iconCls: 'text-align:center',
                    hidden: $("#ccSummary").hasClass("disabled") ? true : false,
                    getClass: function (value, metadata, record) {                                   
                        if (record.get('type') == "IMS") {
                            return 'hide-longest-chain-icon';
                        } else {
                            return 'x-grid-left-icon';
                        }
                    },
                    handler: function (grid, rowIndex, colIndex, item, e, record) {
                        var isRedoCC = !$("#bufferSummary").hasClass("disabled");
                        var ccSummarygrid = Ext.getCmp('CCSummarygrid');
                        if(!record.get('longestPaths2'))
                            record.set('longestPaths2', true);
                        if( !isRedoCC)
                            ccSummarygrid.highlightLongestPath(grid, rowIndex, colIndex, item, e, record);
                        else
                            ccSummarygrid.highlightPenChain(grid, rowIndex, colIndex, item, e, record);

                    },
            }],
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                return "";
            }
	    },
        {
            xtype: 'checkcolumn',
            flex: 1,
            minWidth: 110,
            hidden: $("#ccSummary").hasClass("disabled")|| stl.app.getActiveTimelineViewName() != CHAIN_VIEW? true : false,
            sortable: true,
            editable: false,
            dataIndex: 'longestPaths2',
            text: LONGEST_PATH_HEADER,
            configKey : 'MILESTONE_PANEL_LONGEST_PATH',
            menuText: LONGEST_PATH_HEADER,
            tooltip: '',
            renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
                if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){
                    var cssPrefix = Ext.baseCSSPrefix,
                    cls = cssPrefix + 'grid-checkcolumn';

                    if (record.get('type') == "IMS") {
                        cls += ' ' + this.disabledCls;
                    }
                    var rs = Ext.getCmp('chainview').getResourceStore();
                    var resNode = rs.getNodeById(record.get('id'));
                    if(resNode && rs.isVisible(resNode) && value==undefined){
                        cls += ' ' + cssPrefix + 'grid-checkcolumn-checked';
                        record.set('longestPaths2', true);
                    }
                    if (value!= undefined) {
                        if(value)
                            cls += ' ' + cssPrefix + 'grid-checkcolumn-checked';
                        record.set('longestPaths2', value);
                    }
                    return '<img class="' + cls + '" src="' + Ext.BLANK_IMAGE_URL + '"/>';
                }                
            },
            listeners:{
                beforecheckchange:function(checkcolumn, rowIndex, checked, eOpts){
                     var grid = Ext.getCmp('msGrid'),
                            record = grid.getStore().getData().getAt(rowIndex);
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){                        
                        return record.get('type') !== "IMS";
                    }
                },
                checkchange:function(checkcolumn, rowIndex, checked, eOpts){
                    var isRedoCC = !$("#bufferSummary").hasClass("disabled");
                    var grid = Ext.getCmp('msGrid'),
                        record = grid.getStore().getData().getAt(rowIndex),
                        colIndex = this.getIndex();
                    var ccSummarygrid = Ext.getCmp('CCSummarygrid');
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){
                        var cv = Ext.getCmp('chainview');
                        if(checked){
                            cv.showMilestoneChain(record,true);                            
                            if( !isRedoCC)
                                ccSummarygrid.highlightLongestPath(grid, rowIndex, colIndex, null, eOpts, record);
                            else
                                ccSummarygrid.highlightPenChain(grid, rowIndex, colIndex, null, eOpts, record);
                        }
                        else{                            
                            if( !isRedoCC)
                                var classname = ccSummarygrid.removeHighlightLongestPath(grid, rowIndex, colIndex, null, eOpts, record);
                            else
                                var classname = ccSummarygrid.removeHighlightPenChain(grid, rowIndex, colIndex, null, eOpts, record);
                            cv.showMilestoneChain(record,false, classname);
                        }
                        
                    }
                    
                }
            }
        }//8
        ],
        listeners: {
                beforeedit: function (editor, e, eOpts) {
                    return Ext.getCmp('CCSummarygrid').onBeforeEdit(editor, e, eOpts);
                },
                edit: function (editor, e, eOpts) {
                    Ext.getCmp('CCSummarygrid').onEdit(editor, e, eOpts);
                },
                itemmouseenter: function (dv, record, item, index, e) {
                    removeMilestoneHighlight();
                    var uid = record.get('uid');
                    $(document).trigger("highlight-milestone", [uid]);
                },
                itemmouseleave: function (dv, record, item, index, e) {
                    removeMilestoneHighlight();
                },
            destroyable : true
        }
    }, //End of Milestone grid
    {
    xtype: 'form',
    id: 'CycleTimeSummaryPanel',
    minHeight: 180,
    width: 'auto',
    header: false,
    titleAlign: 'left',
    hidden: true,
    title: CC_SUMMARY,
    bodyPadding: 5,
    layout: 'vbox',
    overflowX: 'auto',
    overflowY: 'auto',
    items: [
    {
        xtype: 'container',
        layout: 'column',
        items: [{
            xtype: 'container',
            columnWidth: .3,
            layout: 'anchor',
            items: [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    padding: '5 5 5 5',
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: CC_PATH,
                        name: 'CCPath',
                        readOnly: true,
                        value: CCSummaryStore.CCPath,
                        labelWidth: 100,
                        width: 200
                    }, {
                        xtype: 'displayfield',
                        value: DAYS,
                        width: 50,
                        padding: '0 0 0 10'
                    }]
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    padding: '5 5 5 5',
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: PROJECT_LENGTH,
                        readOnly: true,
                        name: 'ProjectLength',
                        labelWidth: 100,
                        value: CCSummaryStore.ProjectLength,
                        width: 200
                    },
                    {
                        xtype: 'displayfield',
                        value: DAYS,
                        width: 50,
                        padding: '0 0 0 10'

                    }]
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    padding: '5 5 5 5',
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: PROJECT_START,
                        name: 'ProjectStart',
                        readOnly: true,
                        labelWidth: 100,
                        value: CCSummaryStore.ProjectStart,
                        width: 200

                    }]
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    padding: '5 5 5 5',
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: PROJECT_END,
                        name: 'ProjectEnd',
                        readOnly: true,
                        labelWidth: 100,
                        value: CCSummaryStore.ProjectEnd,
                        width: 200

                    }]
                }]
        },
                {
                    xtype: 'container',
                    columnWidth: .3,
                    layout: 'anchor',
                    defaults: {
                        labelWidth: 150
                    },
                    items: [
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        padding: '5 5 5 5',
                        items: [{
                            xtype: 'textfield',
                            fieldLabel: CC_DURATION,
                            name: 'CCDuration',
                            labelWidth: 140,
                            readOnly: true,
                            value: CCSummaryStore.CCDuration,
                            width: 220,
                            anchor: '70%'
                        }, {
                            xtype: 'displayfield',
                            value: DAYS,
                            padding: '0 0 0 10',
                            anchor: '30%'
                        }]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        padding: '5 5 5 5',
                        items: [{
                            xtype: 'textfield',
                            fieldLabel: PROJECT_BUFFER,
                            name: 'ProjectBuffer',
                            labelWidth: 140,
                            readOnly: true,
                            value: CCSummaryStore.ProjectBuffer,
                            width: 220,
                            anchor: '70%'
                        }, {
                            xtype: 'displayfield',
                            value: DAYS,
                            padding: '0 0 0 10',
                            anchor: '30%'
                        }]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        padding: '5 5 5 5',
                        items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: RESOURCE_CONTENTION,
                            id: 'resourceContentionlink',
                            name: 'ResourceContention',
                            labelWidth: 140,
                            readOnly: true,
                            value: CCSummaryStore.TotalResourceContention,
                            width: 220,
                            anchor: '70%',
                            listeners: {
                                afterrender: function () {
                                    Ext.getCmp('CCSummarygrid').setStyleOfResourceContentionField();
                                },
                                destroyable : true
                            }

                        }, {
                            xtype: 'displayfield',
                            value: DAYS,
                            padding: '0 0 0 10',
                            anchor: '30%'
                        }]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        padding: '5 5 5 5',
                        items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: SLACK,
                            id: 'slackLink',
                            name: 'Slack',
                            labelWidth: 140,
                            readOnly: true,
                            value: CCSummaryStore.TotalSlackDuration,
                            width: 220,
                            anchor: '70%',
                            listeners: {
                                afterrender: function () {
                                    Ext.getCmp('CCSummarygrid').setStyleOfSlackField();
                                }
                            }

                        }, {
                            xtype: 'displayfield',
                            value: DAYS,
                            padding: '0 0 0 10',
                            anchor: '30%'
                        }]
                    }]
                }]

                }]

    },
    {
        xtype: 'grid',
        id: 'CCSummaryFullKitGrid',
        minHeight: 180,
        width: '100%',
        header: false,
        titleAlign: 'left',
        scrollable:true,
        hidden: true,
        store: FullKitDataStore,

        title: FULL_KITS,
        layout: 'fit',
        viewConfig: {
            stripeRows: true,
            emptyText: NO_FULL_KIT_TASKS_IN_PROJECT
        },
        columns: [
                    {
                        xtype: 'gridcolumn',
                        minWidth: 120,
                        dataIndex: 'TaskName',
                        flex: 1,
                        text: FULL_KIT_TASK,
                        configKey : 'FK_PANEL_FULLKIT_TASK_NAME'
                    },
                    {
                        xtype: 'gridcolumn',
                        minWidth: 120,
                        dataIndex: 'FKPullInDuration',
                        flex: 1,
                        text: FULL_KIT_PULL_IN_DURATION,
                        configKey : 'FK_PANEL_PULL_IN_OFFSET'
                    },
                    {
                        xtype: 'gridcolumn',
                        minWidth: 120,
                        dataIndex: 'FKDate',
                        flex: 1,
                        text: FULL_KIT_TASK_NEED_DATE,
                        configKey : 'FK_PANEL_NEED_DATE'
                    }
                    ],    //End Of FK grid columns

        setSummaryFKGridColumnNameAndVisibilityFromConfig: function(){
                var grdColumns = Ext.getCmp('CCSummaryFullKitGrid').columns;
                _.each(grdColumns, function(column){
                var configKey = column.configKey;
                if(configKey)
                {           
                column.setText(stl.app.getColumnDisplayName(configKey));
                var isHiddenConfig =  stl.app.isColumnHidden(configKey);                        
                column.setVisible(!isHiddenConfig);
                column.hideable = !isHiddenConfig;
                }
            });    
        },   

        listeners: {
            afterrender: {
                // fn: me.loadFullKitData
            },
            itemmouseenter: function (dv, record, item, index, e) {
                removeMilestoneHighlight();
                var uid = record.get('TaskUID');
                $(document).trigger("highlight-milestone", [uid]);
            },
            itemmouseleave: function (dv, record, item, index, e) {
                removeMilestoneHighlight();
            },                    

            beforeshow: function(){                        
                     
                this.setSummaryFKGridColumnNameAndVisibilityFromConfig();
            },
            destroyable : true
        }
    }],

            setMSGridColumnNameAndVisibilityFromConfig: function(){
                var grdColumns = Ext.getCmp('msGrid').columns;
                        _.each(grdColumns, function(column){
                        var configKey = column.configKey;
                        if(configKey)
                        {           
                        column.setText(stl.app.getColumnDisplayName(configKey));
                        var isHiddenConfig =  stl.app.isColumnHidden(configKey);                        
                        column.setVisible(!isHiddenConfig);
                        column.hideable = !isHiddenConfig;
                        }
                    });     
            }   ,   
        
        listeners: {
            
        beforeshow: function (tabPanel, eOpts) {

            var msGrid = Ext.getCmp('msGrid');
            var MilestoneStore = msGrid.getStore();
            
            var msGridColumns = msGrid.columns;
            var milestoneColorColumn = _.find(msGridColumns, function(column){ return  column.dataIndex == 'milestoneColor';}); //0
            var bufferSizeColumn = _.find(msGridColumns, function(column){ return  column.dataIndex == 'bufferSize';}); //3  
            var percentBufferConsumptionColumn = _.find(msGridColumns, function(column){ return  column.dataIndex == 'percentBufferConsumption';}); //6
            var percentChainCompleteColumn = _.find(msGridColumns, function(column){ return  column.dataIndex == 'percentChainComplete';}); //7          
            var longestPathsColumn1 = _.find(msGridColumns, function(column){ return  column.dataIndex == 'longestPaths1';}); //8
            var longestPathsColumn2 = _.find(msGridColumns, function(column){ return  column.dataIndex == 'longestPaths2';}); //8

            var tabPanelItems = tabPanel.items.items;
            var milestoneTab = tabPanelItems[0].tab;
            var ccsummaryTab = tabPanelItems[1].tab;
            var fkTab = tabPanelItems[2].tab;
            //CON-1528: Milestone color column shall be visible whenever it is available from BE(after ReDoCC or Checkin).- Nilesh
            var PE_Rec = MilestoneStore.findRecord('type',PE_SHORT);
            if(PE_Rec)
                var isMilestoneColorAvailable = (typeof(PE_Rec.get('milestoneColor')) == "string");
            else
                var isMilestoneColorAvailable = false;
            
            milestoneTab.setText(MILESTONES);
            ccsummaryTab.setText(CC_SUMMARY_SHORT);
            fkTab.setText(FULL_KIT_AND_PT);

            tabPanel.setActiveTab(0);

            this.setMSGridColumnNameAndVisibilityFromConfig(); 
            milestoneColorColumn.setVisible(isMilestoneColorAvailable);

            if (!($("#ccSummary").hasClass("disabled"))) {                              
                
                msGrid.bindStore(MilestoneStore);

                //before setting columns visible,check if column is visible from config. 
                //method setMSGridColumnNameAndVisibilityFromConfig  set visibility of column from config
                if(bufferSizeColumn.isVisible()) 
                {
                    bufferSizeColumn.setVisible(true);
                }
                
                if(longestPathsColumn1.isVisible())
                {
                    longestPathsColumn1.setText(stl.app.getColumnDisplayName('MILESTONE_PANEL_LONGEST_PATH'));
                    longestPathsColumn1.tooltip = TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH;
                    if(stl.app.getActiveTimelineViewName() != CHAIN_VIEW)
                        longestPathsColumn1.setVisible(true);
                    else
                        longestPathsColumn1.setVisible(false);
                }
                if(longestPathsColumn2.isVisible())
                {
                    longestPathsColumn2.setText(stl.app.getColumnDisplayName('MILESTONE_PANEL_LONGEST_PATH'));
                    longestPathsColumn2.tooltip = TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH;
                    if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
                        longestPathsColumn2.setVisible(true);
                    else
                        longestPathsColumn2.setVisible(false);
                }

                
                                
                percentBufferConsumptionColumn.setVisible(false);                
                percentChainCompleteColumn.setVisible(false);

                msGrid.bufferedRenderer.refreshView();
                //Ext.getCmp('msGrid').doLayout();
                this.loadFullKitAndPurchasingTaskData();
                Ext.getCmp('CCSummaryFullKitGrid').bindStore(FullKitDataStore);

                var record = Ext.create('ProjectPlanning.model.CCSummary',{
                    CCPath: CCSummaryStore.CCPath,
                    ProjectLength: CCSummaryStore.ProjectLength,
                    ProjectStart: CCSummaryStore.ProjectStart,
                    ProjectEnd: CCSummaryStore.ProjectEnd,
                    CCDuration: CCSummaryStore.CCDuration,
                    ProjectBuffer: CCSummaryStore.ProjectBuffer,
                    ResourceContention: CCSummaryStore.TotalResourceContention,
                    Slack:CCSummaryStore.TotalSlackDuration
                });
                var cycleTimeSummary = Ext.getCmp('CycleTimeSummaryPanel').loadRecord(record);

                this.setStyleOfResourceContentionField();
                this.setStyleOfSlackField();

                ccsummaryTab.show(); //ccsummary
                fkTab.show(); //fk

            }
            else if (!($("#bufferSummary").hasClass("disabled"))) {
                
                msGrid.bindStore(MilestoneStore);
                
                //before setting columns visible,check if column is visible from config. 
                //method setMSGridColumnNameAndVisibilityFromConfig  set visibility of column from config
                if(percentBufferConsumptionColumn.isVisible())
                {
                    percentBufferConsumptionColumn.setVisible(true);
                }
                if(percentChainCompleteColumn.isVisible())
                {
                    percentChainCompleteColumn.setVisible(true);
                }

                if(longestPathsColumn1.isVisible())
                {
                    //TBD- add/get column name from config
                    longestPathsColumn1.setText(PEN_CHAIN);
                    longestPathsColumn1.tooltip = TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH_PEN_CHAIN;
                    if(stl.app.getActiveTimelineViewName() != CHAIN_VIEW)
                        longestPathsColumn1.setVisible(true);
                    else
                        longestPathsColumn1.setVisible(false);
                }
                if(longestPathsColumn2.isVisible())
                {
                    //TBD- add/get column name from config
                    longestPathsColumn2.setText(PEN_CHAIN);
                    longestPathsColumn2.tooltip = TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH_PEN_CHAIN;
                    if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
                        longestPathsColumn2.setVisible(true);
                    else
                        longestPathsColumn2.setVisible(false);
                }
                bufferSizeColumn.setVisible(false);
                msGrid.bufferedRenderer.refreshView();
                ccsummaryTab.hide(); //ccsummary
                fkTab.hide(); //fk
            }
            else {
                milestoneColorColumn.setVisible(false);
                bufferSizeColumn.setVisible(false);
                if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
                    longestPathsColumn2.setVisible(true);
                else
                    longestPathsColumn2.setVisible(false);
                if(stl.app.getActiveTimelineViewName() != CHAIN_VIEW)
                    longestPathsColumn1.setVisible(true);
                else
                    longestPathsColumn1.setVisible(false);

                percentBufferConsumptionColumn.setVisible(false);
                percentChainCompleteColumn.setVisible(false);
                ccsummaryTab.hide(); //ccsummary
                fkTab.hide(); //fk
            }
        },
        
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
                                    toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
                                }
                            }]
                        }
                    ]);
        },
        destroyable : true

    },

    
    onBeforeEdit: function (editor, e, eOpts) {
        //We need to show all the panels as readonly when project is opened in view only mode.
        if (!stl.app.isProjectOpenInViewOnlyMode()) {


            if(e.field === 'type'){
            var msData =_.find(stl.model.Project.project._milestones,function(ms){return ms.uid == e.record.get('uid');});
            if(msData.status === STATUS_CO)
                return false;
        }
            if (e.record.get('type') === "PE" && (e.column.dataIndex == "name"))
                return false;
            else
                return true;
        }
        else {
            return false;
        }
        

    },
    onEdit: function (editor, e, eOpts) {

        var rec = e.record;
        var editedCol = e.field;
        var msRec = editor.cmp.getStore().findRecord('uid', rec.get('uid'), 0, false, true, true);
        var msModel = _.find(stl.model.Project.project._milestones,function(ms){return ms.uid == rec.get('uid');})
        var originalValue = e.originalValue;
        var newValue = e.value;
        if (newValue != originalValue) {
            if (editedCol == "type") {
                if (msRec.get('type') === "IMS") {
                    msRec.set('bufferSize', '');
                    this.changeMilestoneNameByChangingType("IMS", msRec, msRec.get('name'), originalValue, function() {
                        $(document).trigger("milestoneupdate", [msRec.data, editedCol, originalValue]);
                    });
                } else if (msRec.get('type') === "CMS") {
                    if (msRec.get('date1') == '' || msRec.get('date1') === null)
                        msRec.set('date1', ServerClientDateClass.getTodaysDate());
                    this.changeMilestoneNameByChangingType("CMS", msRec, msRec.get('name'), originalValue, function() {
                        $(document).trigger("milestoneupdate", [msRec.data, editedCol, originalValue]);
                    });
                } else if (msRec.get('type') === "PE") {
                    if (!stl.model.Project.project.validatePEandPPTypeConversion(msRec.data, msRec.get('type'))) {
                        msRec.set('type', e.originalValue);
                        return;
                    } else {
                        this.changeMilestoneNameByChangingType("Project End", msRec, msRec.get('name'), originalValue, function() {
                            $(document).trigger("milestoneupdate", [msRec.data, editedCol, originalValue]);
                        });
                    }
                }
                if ($(".matrix-view").data("view")) {
                    var $ms = $(".matrix-view").data("view").milestoneElementsById[rec.get('uid')];
                    //autolink all property should bre fired only in milestone phase
					if (stl.app.ProjectDataFromServer.getPhaseById(msModel.phaseId).type === STRING_MILESTONE_LOWER_CASE)
                        $($ms.data("view")).trigger("autolinkallChange", [$ms, $ms.find(".ms-autolink input").is(":checked")])
                }
                stl.app.save();
            }
            else if (editedCol == "name") {
                if (stl.model.Project.project.checkIfNameAlreadyExists(newValue)) {
                    PPI_Notifier.alert(MILESTONE_NAME_ERROR, MILESTONE_NAME);
                    rec.set("name", originalValue);
                    return;
                }
                msModel.name = msRec.data.name;
                $(document).trigger("milestoneupdate", [msModel, editedCol, originalValue]);
            } else if (editedCol == "date1") {
                msModel.date1 = msRec.data.date1
                $(document).trigger("milestoneupdate", [msModel, editedCol, originalValue]);
            }
            
            if (rec.get('type') == "PE") {
                UpdateProjectEnd(rec.get('date1'));
            }
            $(document).trigger("taskchange",[this,msModel]);
        }
    },

    onClose: function () {
        toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
    },
    changeMilestoneNameByChangingType: function (toAppend, msRec, name, oldType, callbk) {
        var type = msRec.type;
        if(msRec.data)
            type = msRec.data.type;
        if (type == PE_SHORT) {          
            name='Project End';           
            if(msRec.set)
                msRec.set('name', 'Project End');
            else
                msRec.name = 'Project End';
            callbk();
        }
        if (name.indexOf(toAppend) === -1) {
            stl.model.Project.project.changeMilestone(toAppend, msRec, callbk);
        }
        else
            callbk();
    },

    changeMilestoneDueDate: function (msRec, callbk) {
        if (msRec.set)
            msRec.set('date1', msRec.date1);
        else
            msRec.date1 = msRec.date1;
        callbk();
    },

    setStyleOfResourceContentionField: function () {
        var resourceContentionField = Ext.getCmp('resourceContentionlink');
        var resourceContentionVal = parseInt(CCSummaryStore.TotalResourceContention);
         this.setCSSForLinkFields(resourceContentionField,resourceContentionVal, true);
    },

    setStyleOfSlackField: function () {
        var slackField = Ext.getCmp('slackLink');
        var slackVal = parseInt(CCSummaryStore.TotalSlackDuration);
        this.setCSSForLinkFields(slackField,slackVal, false);
    },

    setCSSForLinkFields: function(field, fieldValue, isResourceContentionField){
        var clickHandler = function (e, t, eOpts) {
            if(isResourceContentionField){
                Ext.getCmp('CCSummarygrid').highlightResourceContention();
            }
            else{
                Ext.getCmp('CCSummarygrid').highlightSlack();
            }

        };
        if (fieldValue == 0) {

            field.setFieldStyle('color: black; text-decoration:none; cursor:default');            
            if (field.getEl()) {
                field.getEl().removeListener('click',clickHandler);
            }
        }
        else {
            field.setFieldStyle('color: blue; text-decoration:underline; cursor:pointer');
            if (field.getEl()) {
                field.getEl().on('click',clickHandler);
            }
        }
    },

    updateMilestoneSheet: function (ms, remove) {

        // var MilestoneGrid = Ext.getCmp('msGrid');
        var milestoneStore = this.getViewModel().getStore('msGridStore');
                    
        if (ms.taskType != "PEMS" && ms.taskType != "IPMS") {

            var rec = milestoneStore.findRecord('uid', ms.uid, 0, false, true, true);
            if (rec == null) {
                if (ms.taskType != "NONE") { // record not to be added if milestone type is NONE
                    //add the record            
                    milestoneStore.add(Ext.create('ProjectPlanning.model.Milestone').createMSNode(ms));
                }
            }
            else {
                if (remove) {
                    milestoneStore.remove(rec);
                }
                //update
                if (ms.taskType == "NONE") { // record to be deleted if milestone type is updated to NONE
                    milestoneStore.remove(rec);
                } else {
                    rec.set('date1', ms.date1);
                    rec.set('name', ms.name);
                    if (ms.type) {
                        rec.set('type', ms.type);
                    } else if (ms.taskType) {
                        rec.set('type', ms.taskType);
                    }
                }
            }
        }
    },

    highlightResourceContention: function () {
        clearAllHighlight();
        toggleDockingGrids('resGrid', 'resourceSheet', true);
        $(document).trigger('highlightResourceContention');
        $(".highlight").find(".button-text").text("Highlight: " + RESOURCE_CONTENTION);
    },


    highlightSlack: function () {
        clearAllHighlight();        
        $(document).trigger('highlightSlack');
        $(".highlight").find(".button-text").text(HIGHLIGHT + SLACK);
    },


    loadFullKitAndPurchasingTaskData: function () {

        //FIXME - Unfortunaltely this method isnt working though everything is written correctly
        //FullKitGrid.getStore().add(FullkitRecord) - line adds garbage entries in milestone tab.
        //CON - 490
        var me = this;
        var FullKitGrid = Ext.getCmp('CCSummaryFullKitGrid');
        FullKitGrid.store.removeAll();

        var CCSummaryFullKitData = CCSummaryStore.FullKitData;
        for (i = 0; i < CCSummaryFullKitData.length; i++) {

            var FullkitRecord = Ext.create('ProjectPlanning.model.FullKitTask',{
                TaskUID: CCSummaryFullKitData[i].TaskUID,
                TaskName: CCSummaryFullKitData[i].TaskName,
                FKDate: CCSummaryFullKitData[i].FKDate,
                FKPullInDuration: CCSummaryFullKitData[i].FKPullInDuration,
                FKSuggestedDate: CCSummaryFullKitData[i].FKSuggestedDate
            });

            FullKitGrid.getStore().add(FullkitRecord);

        }

        var PurchasingTasks = _.filter(stl.app.ProjectDataFromServer.getAllTasks(), function (task){
            return task.taskType == TASKTYPE_PT;
        }); 

        _.each(PurchasingTasks, function(PT){
            var rec = FullKitGrid.store.findRecord('TaskUID', PT.uid, 0, false, true, true);
            if (rec == null) {
                //add the record         
                var PTRecord = Ext.create('ProjectPlanning.model.FullKitTask',{
                    TaskUID: PT.uid,
                    TaskName: PT.name,
                    FKDate: ServerTimeFormat.getDateInLocaleFormat(PT.date1),
                    FKPullInDuration: NA,
                    FKSuggestedDate: ServerTimeFormat.getDateInLocaleFormat(PT.date7)
                });
                FullKitGrid.getStore().add(PTRecord);
            } else {
                me.UpdateTaskNameInCCSummary(PT);
            }

        });

    },

    updateMilestoneSheetForAcceptPlan: function (ms, remove) {
        var MilestoneGrid = Ext.getCmp('msGrid');
        if (ms.taskType != "PEMS" && ms.taskType != "IPMS") {
            var rec = MilestoneGrid.store.findRecord('uid', ms.uid, 0, false, true, true);
            if (rec == null) {
                //add the record         
                MilestoneGrid.store.add(Ext.create('ProjectPlanning.model.Milestone').createMSNode(ms));
            }
            else {
                if (remove)
                    MilestoneGrid.store.remove(rec);
                //update
                rec.set('date1', new Date(ms.projectedDate));
            }
        }
    },

    highlightLongestPath: function (grid, rowIndex, colIndex, item, e, record) {//checkColumn, rowIndex, checked, eOpts
        clearAllHighlight();

        var taskModel = record;
        var tasksInPredecessorChain = chainHighlightInstance.highlightLongestPredecessorChain(taskModel.data);
        if(tasksInPredecessorChain.length > 0){            

            var matrixViewInstance = $(".matrix-view").data("view");
            if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                var timelineViewInstance = Ext.getCmp("chainview");
            else
                var timelineViewInstance = Ext.getCmp("timelineview");
            var tableViewInstance = Ext.getCmp("tableview");
            if(matrixViewInstance){
                matrixViewInstance.highlightChain(tasksInPredecessorChain,false,"constrainingSuccessorTask");
            }
            if(timelineViewInstance){                    
                timelineViewInstance.highlightChain(tasksInPredecessorChain, "constrainingSuccessorTask");                    
            }
            if(tableViewInstance){
                tableViewInstance.highlightChain(tasksInPredecessorChain,"constrainingSuccessorTask");
            }
        }

        $(".highlight").find(".button-text").text(HIGHLIGHT + LONGEST_PATH);
    },
    removeHighlightLongestPath: function (grid, rowIndex, colIndex, item, e, record) {//checkColumn, rowIndex, checked, eOpts
        var taskModel = record;
        var tasksInPredecessorChain = chainHighlightInstance.highlightLongestPredecessorChain(taskModel.data);
        if(tasksInPredecessorChain.length > 0){
            if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                var timelineViewInstance = Ext.getCmp("chainview");
            if(timelineViewInstance){                    
                timelineViewInstance.removeHighlightChain(tasksInPredecessorChain, "constrainingSuccessorTask");                    
            }
        }
        return 'constrainingSuccessorTask';
    },

    highlightPenChain:  function (grid, rowIndex, colIndex, item, e, record) {//checkColumn, rowIndex, checked, eOpts
        clearAllHighlight();

        var milestoneUId = record.get('uid');
        var matrixViewInstance = $(".matrix-view").data("view");
        if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
            var timelineViewInstance = Ext.getCmp("chainview");
        else
            var timelineViewInstance = Ext.getCmp("timelineview");
        var tableViewInstance = Ext.getCmp("tableview");
        stl.app.milestoneUIDForChainToBeHighlighted = milestoneUId; 
        $(".highlight").find(".button-text").text(HIGHLIGHT + PEN_CHAIN);   
        if(milestoneUId && matrixViewInstance)
            matrixViewInstance.highlightPenChain(milestoneUId,'constrainingSuccessorTask');
        if (milestoneUId && timelineViewInstance) 
            timelineViewInstance.highlightPenChain(milestoneUId);
        
        if(milestoneUId && tableViewInstance){
            tableViewInstance.highlightPenChain(milestoneUId);
        }
    },
    removeHighlightPenChain:  function (grid, rowIndex, colIndex, item, e, record) {//checkColumn, rowIndex, checked, eOpts

        var milestoneUId = record.get('uid');
        if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
            var timelineViewInstance = Ext.getCmp("chainview");
        stl.app.milestoneUIDForChainToBeHighlighted = milestoneUId;
        if (milestoneUId && timelineViewInstance) 
            var className = timelineViewInstance.removeHighlightPenChain(milestoneUId);
        return className;
    },

    setDateFieldFormat: function (columnMetaData) {
        var columnEditor = columnMetaData.column.editor;
        if (columnEditor != null) {
            if (columnEditor.format != ServerTimeFormat.getExtDateformat()) {
                columnEditor.format = ServerTimeFormat.getExtDateformat();
            }
        }
    },

    UpdateFullKitDataInCCSummary: function (fktask) {

        var FullKitGrid = Ext.getCmp('CCSummaryFullKitGrid');
        if(FullKitGrid){
            var rec = FullKitGrid.store.findRecord('TaskUID', fktask.uid, 0, false, true, true);
            if (rec) {
                    rec.set('FKDate', ServerTimeFormat.getDateInLocaleFormat(fktask.date1));
                    rec.set('FKSuggestedDate', ServerTimeFormat.getDateInLocaleFormat(fktask.date1)); 
                    rec.set('FKPullInDuration', ValidationClassInstance.getValidDurationString(fktask.fullkitPullInDuration,ZERO_DURATION_STR,true));
            }
        }
    },

    UpdateFullKitNameInCCSummary: function (fktask) {

        var FullKitGrid = Ext.getCmp('CCSummaryFullKitGrid');
        if(FullKitGrid){
            var rec = FullKitGrid.store.findRecord('TaskUID', fktask.uid, 0, false, true, true);
            if (rec) {
                rec.set('TaskName', fktask.name);
            }
        }
    },

    UpdateTaskNameInCCSummary: function (task) {

        var FullKitGrid = Ext.getCmp('CCSummaryFullKitGrid');
        if(FullKitGrid){
            var rec = FullKitGrid.store.findRecord('TaskUID', task.uid, 0, false, true, true);
            if (rec) {
                rec.set('TaskName', task.name);
            }
        }
    }
});

function UpdateProjectEnd(editedDueDate) {
    var project = stl.model.Project.project;
    project.dueDate = editedDueDate;
}

