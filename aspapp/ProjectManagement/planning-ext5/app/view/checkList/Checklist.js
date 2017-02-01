
Ext.define("ProjectPlanning.view.checkList.Checklist",{
    extend:'Ext.window.Window',
    itemId: 'ChecklistWindow',
    frame: false,
    width:450,
    height:300,
    minWidth: 450,
    minHeight: 300,
    header: true,
    title: 'Checklist',
    modal: true,
    cls:'x-window new-project',
    layout:'fit',
    listeners: {
        close: function (wnd, eOpts) {
            Ext.getCmp("checklistGrid").ownerCt.fireEvent("save");
            if (stl.app.handlerPtr != null) {
                window.removeEventListener("paste", stl.app.handlerPtr);
                stl.app.handlerPtr = null;
            }
        },
        show:function(win, e){
            stl.app.removePasteEventListener();
        }
    },

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'ChecklistGrid',
                    width:'100%',
                    header: false,
                    store: this.store
                }
            ]
        }); //End of Ext.applyIf
        me.callParent(arguments);
        me.mon(Ext.getBody(), 'click', function(el, e){
            me.close(me.closeAction);
        }, me, { delegate: '.x-mask' });
    } //End of initComponent
});
var checklistGrid = Ext.define('Checklist.Grid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.ChecklistGrid',
    id: 'checklistGrid',
    padding:'0 0 5 0',
    layout:'fit',
    scrollable:'y',
    height:250,
    requires: [
        'Ext.selection.CellModel',
        'Ext.grid.*',
        'Ext.data.*',
        'Ext.util.*',
        'Ext.form.*',
        'Ext.toolbar.TextItem',
        'Ext.ux.CheckColumn'
    ],
    xtype:'cell-editing',
    resizable:{
        handles:'',
        pinned:false
    },
    frame:false,
    viewConfig:{
        selModel: {
          selType: 'checkboxmodel',
          checkOnly:false,
          injectCheckbox:0,
          enableKeyNav: true,
          onHeaderClick: function(headerCt, header, e) {
                if (header === this.column) {
                    e.stopEvent();
                    var me = this,
                        isChecked = header.el.hasCls(Ext.baseCSSPrefix + 'grid-hd-checker-on');
         
                    if (isChecked) {
                        me.deselectAll();
                    } else {
                        me.selectAll();
                    }
                    if(!isChecked){
                        header.el.addCls(Ext.baseCSSPrefix + 'grid-hd-checker-on')
                    }
                    else{
                        header.el.removeCls(Ext.baseCSSPrefix + 'grid-hd-checker-on')
                    }
                }
            }
        },

        forceFit:true,
        plugins: {
            ptype: 'gridviewdragdrop',
            dragText: DRAG_DROP_TEXT,
            pluginId: 'dragndrop',
            containerScroll:true,
            allowCopy:false,
            copy:false
        }
    },
    plugins: [{
        ptype:'cellediting',
        clicksToEdit: 1,
        listeners:{
            validateedit:function(editor, context){
                var val = $.trim(context.value);
                if ( val == '' || val.length > 255 )
                    return false;
                return true;
            },
            edit:function(editor, e){
                if(e.field == "name"){
                    this.cmp.onAddClick(e.record);
                }
            }
        },
        onSpecialKey: function(ed, field, e) {
            var grid = Ext.getCmp('checklistGrid'),sm;
            sm = grid.getSelectionModel();
            if (e.getKey() === e.TAB) {
                e.stopEvent();                            
                if (sm.onEditorTab)sm.onEditorTab(this, e);
            }else if(e.getKey() === e.ENTER){
                e.stopEvent();
                if (sm.onEditorEnter)sm.onEditorEnter(this, e);
            }else if(e.getKey() === e.ESC){
                e.stopEvent();
                if (sm.onEditorEsc)sm.onEditorEsc(this, e);
            }
        }
    }],
    initComponent: function () {
        var me = this;
        Ext.apply(this, {
            tbar:{
                layout:'hbox',
                items:[                
                  { xtype: 'button', text: MARK_COMPLETE_BUTTON_TEXT, handler:this.markAllComplete.bind(this)},
                  { xtype: 'button', text: MARK_INCOMPLETE_BUTTON_TEXT, handler:this.markAllIncomplete.bind(this)},
                  { xtype: 'button', text: DELETE_BUTTON_TEXT, handler:this.markAllDelete.bind(this)},
                  { xtype: 'button', text: CUT_BUTTON_TEXT, handler:this.cutChecklistItems.bind(this)},
                  { xtype: 'button', text: COPY_BUTTON_TEXT, handler:this.copyChecklistItems.bind(this)},
                  { xtype: 'button', text: PASTE_BUTTON_TEXT, handler:this.pasteChecklistItems.bind(this)}
                ]
            },
            columns: [{
                xtype: 'actioncolumn',
                width: '20px',
                height:26,
                sortable: false,
                dataIndex:'complete',
                padding:'2 4 2 4',
                align:'center',
                menuDisabled: true,
                text:COLUMN_STATUS_CHECKLIST,
                items: [{
                    scope: this,
                    getClass: function(v, meta, rec) {
                        if(rec.get('dummy'))
                            return '.x-hide-display';
                        else{       
                            if(rec.get('complete')) {                                                                      
                                return 'checklist-complete-image';
                            }
                            else{
                                return 'checklist-incomplete-image';
                            }
                        }
                    },
                    getTip: function(value, metadata, rec, row, col, store) {
                        if(rec.get('dummy'))
                            return '';
                        else{       
                            if(rec.get('complete')) {                                                                      
                                return TOOLTIP_MSG_COMPLETE;
                            }
                            else{
                                return TOOLTIP_MSG_INCOMPLETE;
                            }
                        }
                    },
                    handler: this.changeChecklistStatus
                }]
            },{
                header: stl.app.getColumnDisplayName('CHECKLIST_PANEL_CHECKLIST_ITEM_NAME'),
                dataIndex: 'name',
                itemId:'checklistName',
                minHeight:26,
                sortable:false,
                width:'70%',
                flex:1,
                editor:{
                    xtype:'textfield',
                    selectOnFocus: true,
                    emptyText:NEW_CHECKLIST_ITEM_PLACEHOLDER_TEXT,
                    width:'100%',
                    height:'100%',
                    enableKeyEvents:true,
                    listeners:{
                        focus:function(cmp, e){
                            if (!stl.app.isPasteExternalInitiated())
                                stl.app.initPasteExternalEvent(me.pasteChecklistItemsCallbk.bind(me));
                            //me.getSelectionModel().select(cmp.)
                        },
                        blur:function(cmp,e){
                            stl.app.removePasteEventListener();
                        }
                    }
                },
                renderer: function(value, metaData, record) {                    
                    if (!value && record.data.dummy) {
                        return '<input type="text" placeholder="'+NEW_CHECKLIST_ITEM_PLACEHOLDER_TEXT+'"></input>';
                    } else {
                        return value;
                    }
                }          
            }],
            listeners:{
                viewready: function (grid) {
                    var view = grid.getView(),
                        dd = view.findPlugin('gridviewdragdrop');
                    
                    dd.dragZone.onBeforeDrag = function (data, e) {
                        var rec = view.getRecord(e.getTarget(view.itemSelector));
                        return !rec.get('dummy');
                    };
                    view.on('beforedrop', function(node , data , overModel , dropPosition , dropHandlers , eOpts ){
                        // Defer the handling
                        dropHandlers.wait = true;
                        var rec = this.getRecord(node);
                        if(rec){
                            if(rec.get('dummy')){
                                if(dropPosition == 'after'){
                                    PPI_Notifier.info(DRAG_DROP_ERROR_MSG, DRAG_DROP_ERROR_TITLE);
                                    dropHandlers.cancelDrop();
                                }
                                else
                                    dropHandlers.processDrop();
                            }
                            else
                                dropHandlers.processDrop();
                        }
                    });
                    view.on('drop', function(node , data , overModel , dropPosition , eOpts ){
                    })

                },
                afterrender:function(){
                    me.getSelectionModel().on('beforeselect',function(sender ,record ,index , eOpts){
                        if(record.get('dummy')){
                                return false;
                        }
                        return true;
                    }.bind(me));
                }
            }
        });
        //add a placeholder record in store
        this.getStore().add({
            complete: false,
            name: "",
            uid: "",
            dummy: true
        });
        this.callParent();
    },
    loadStore: function() {
        this.getStore().load({
            // store loading is asynchronous, use a load listener or callback to handle results
            callback: this.onStoreLoad
        });
    },
    onStoreLoad: function(){
    },
    onAddClick: function(rec){
        // Create a model instance
        var store = this.getStore();
        if(rec.get('dummy')){
            rec.set('dummy',false);
            this.getStore().add({
                complete: false,
                name: "",
                uid: "",
                dummy: true
            });
        }
    },
    changeChecklistStatus:function(view,rowIndex,colIndex,item,e,record,row){
        if(this.editingPlugin.editing)
            this.editingPlugin.completeEdit();
        if(record.get('complete'))
            record.set('complete',false);
        else
            record.set('complete',true);
        if (event) {
            if(!event.stopPropagation)
                event.cancelBubble = true;
            else
                event.stopImmediatePropagation();
        }
    },
    pasteChecklistItemsCallbk:function(pasteItems){
        if(this.editingPlugin.editing)
            this.editingPlugin.cancelEdit();
        var index = this.getStore().getCount() -1;
        var recs=[];       
        for (var i = 0; i < pasteItems.length; i++) {
            //Dont Paste checklist items with no name
            var pasteItemTrim = pasteItems[i].trim();
            if ( pasteItemTrim != "" && pasteItemTrim.length <=255 ) {
                var rec ={
                    complete:false, name: pasteItems[i], validated:true, uid:""
                };
                recs.push(rec);
            }
        }
        if(recs.length > 0){
            this.getStore().insert(index, recs);
        }
    },
    markAllDelete:function(){
        var sm = this.getSelectionModel()
        var recs = sm.getSelection();
        if(recs.length > 0){
            this.getStore().remove(recs);
        }
    },
    markAllIncomplete:function(){
        var sm = this.getSelectionModel()
        var recs = sm.getSelection();
        var store =this.getStore();
        if(recs.length > 0){
            store.suspendEvents();
            for(var i=0; i<recs.length; i++){
                if(recs[i].get('complete'))
                    recs[i].set('complete',false);
            }
            store.resumeEvents();
            this.getView().refresh();
        }
    },
    markAllComplete:function(){
        var sm = this.getSelectionModel()
        var recs = sm.getSelection();
        var store =this.getStore();
        if(recs.length > 0){
            store.suspendEvents();
            for(var i=0; i<recs.length; i++){
                if(!recs[i].get('complete'))
                    recs[i].set('complete',true);
            }
            store.resumeEvents();
            this.getView().refresh();
        }
    },
    cutChecklistItems:function(){
        var sm = this.getSelectionModel()
        var recs = sm.getSelection();
        //copy items to clipboard and delete them from this store
        if(recs.length > 0){
            stl.app.copyToInternalClipboard(recs,'checklist',false);
            this.getStore().remove(recs);
        }

    },
    copyChecklistItems:function(){
        var sm = this.getSelectionModel()
        var recs = sm.getSelection();
        //copy items to clipboard
        if(recs.length > 0)
            stl.app.copyToInternalClipboard(recs,'checklist',true);
    },
    pasteChecklistItems:function(){
        var recs = stl.app.pasteFromInternalClipboard();
        var newRecs=[];
        var sm = this.getSelectionModel()
        var sel = sm.getSelection();
        //paste new records at end of last selected record
        if(sel.length > 0){
            var index = this.getStore().indexOf(sel[sel.length-1]) + 1;
        }
        else
            var index = this.getStore().getCount() - 1;
        if(recs && recs.length > 0){
            for(var i=0; i<recs.length; i++){
                var newRec = recs[i].copy(null);
                newRec.data.uid="";
                newRecs.push(newRec);
            }
            this.getStore().insert(index, newRecs);
        }
    }
});
Ext.override(Ext.selection.CheckboxModel, {
    lastId:null,
    onEditorTab: function(ep, e) {
        /*var me = this,
            view = me.view,
            record = ep.getActiveRecord(),
            header = ep.getActiveColumn(),
            position = view.getPosition(record, header),
            direction = e.shiftKey ? 'left' : 'right',
            newPosition = view.walkCells(position, direction, e, false),
            newId=newPosition.row,
            grid=view.up('gridpanel');
        
        if (me.lastId!=newId && me.lastId!=null){
            deltaX = me.lastId<newId? -Infinity : Infinity;
            header=grid.headerCt.getHeaderAtIndex(newPosition.column);
            if(header){
                while(!header.getEditor()){
                    newPosition= view.walkCells(newPosition,direction, e, false);
                    header=grid.headerCt.getHeaderAtIndex(newPosition.column);
                }
            }
        }else{
            deltaX = ep.context.column.width * (direction== 'right' ? 1 : -1);
        }
        grid.scrollByDeltaX(deltaX);
        me.lastId=newPosition.row;
        Ext.defer(function(){
            if (newPosition){
                me.select(position.rowIdx);
                ep.startEditByPosition(newPosition);
            }
            else ep.completeEdit();
        }, 0);*/
    },
    onEditorEnter:function(ep,e){
        var me = this,
            view = me.view,
            record = ep.getActiveRecord(),
            header = ep.getActiveColumn(),
            position = view.getPosition(record, header),
            direction = e.shiftKey ? 'up' : 'down',
            newPosition = view.walkCells(position, direction, e, false),
            newId=newPosition.row,
            grid=view.up('gridpanel');

        deltaY=20 * (direction== 'down' ? 1 : -1);
        grid.scrollByDeltaY(deltaY);
        me.lastId=newPosition.row;
        Ext.defer(function(){
            if (newPosition){
                me.select(newPosition.rowIdx);
                ep.startEditByPosition(newPosition);
            }
            else{
                if(!ep.context.record.get('dummy')){
                    me.select(position.rowIdx+1);
                    ep.startEditByPosition({row: position.rowIdx+1, column:position.colIdx});
                }
                else{
                    me.select(position.rowIdx);
                    ep.startEditByPosition({row: position.rowIdx, column:position.colIdx});
                }
            }
        }, 50);
    },
    onEditorEsc:function(ep,e){
        ep.cancelEdit();
    }
});