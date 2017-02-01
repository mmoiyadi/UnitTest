
Ext.define("ProjectPlanning.view.ScopeColumn.ScopeColumnView",{
    extend: "Ext.tree.Panel",
 
    requires: [
        "ProjectPlanning.view.ScopeColumn.ScopeColumnViewController",
        "ProjectPlanning.view.ScopeColumn.ScopeColumnViewModel"
    ],
    
    controller: "scopecolumn-scopecolumnview",
    viewModel: {
        type: "scopecolumn-scopecolumnview"
    },

    alias:'widget.WBSTree',
    width: 210,
    height:1000,
    scroll:false,    
    border: false,
    rootVisible: false,    
    id: 'scopeItemTree',
    useArrows: false,
    cls:'scopeItemTreeCls',
    selModel : {
        mode : 'MULTI'
    },
    selType:'rowmodel', //VMM - CON-2093 -  node is selected when it's expanded
    hideHeaders: true,
    
    columns: [{
        xtype: 'treecolumn',
        dataIndex: 'text',
        flex: 1,
        editor: {
            xtype: 'textfield'
        },
        renderer:function(value, metadata, record){
            if (!Ext.isIE9){
                metadata.tdCls = "notIE9";
            }
            var MAX_LENGTH_ALLOWED = 40;
            if(!Ext.getCmp('scopeItemTree').matrixView.project.isProjectComplex()){//for simple projects
                MAX_LENGTH_ALLOWED = 60;
            }

            var ScopeColumnName = value;
            var scopeNameToBeDisplayed = value;
            //metadata.tdAttr = 'data-qtip="' + Ext.String.htmlEncode(ScopeColumnName) + '"';
            if(ScopeColumnName.length > MAX_LENGTH_ALLOWED){                
                scopeNameToBeDisplayed = Ext.String.ellipsis(ScopeColumnName, MAX_LENGTH_ALLOWED, true); 
                return scopeNameToBeDisplayed;
            }
            return scopeNameToBeDisplayed;
        },
        listeners: {
            "mouseover": function(view, t){
              var spn = $(t).find("span");
              var presentText = spn.text();
              var txt = presentText;
              var ScopeName = view.getRecord(t).get("text")
              var avilableWidth;
              if (!Ext.getCmp('scopeItemTree').matrixView.project.isProjectComplex()){
                avilableWidth = 155;
              } else {
                var outlineLevel = view.getRecord(t).get("data").outlineLevel;
                avilableWidth = 155 - ((parseInt(outlineLevel))*24 + 5);
              }

              Ext.getCmp("scopeItemTree").hoveredText = presentText;
              if (presentText && spn.width() > avilableWidth){
                if (presentText){
                    var toolTip = new Ext.ToolTip({       
                        target: t,
                        id : 'toolTip',
                        html : ScopeName,
                        anchor: 'right' 
                    });
                    toolTip.show();
                  }
                while (spn.width() > avilableWidth) { txt = txt.slice(0, -1); spn.text(txt); }
              }
              
            },
            "mouseout": function(view, t){
              var grid = Ext.getCmp("scopeItemTree");
              if (Ext.getCmp('toolTip')){
                Ext.getCmp('toolTip').destroy();
              }
              
              if (typeof grid.hoveredText != "undefined"){
                $(t).find("span").text(grid.hoveredText);
                grid.hoveredText = "";
              }
              
            }
        }
    }],

    config: {
      scopeItemStore :'null',
      renderToPropertyVal: 'null',
      multiSelect: true          
    },

    viewConfig: {        
        getRowClass: function(record, index) {
            if (this.ownerCt.matrixView.project.isProjectComplex()){
                var isSummary = false;
                if (record.get("text") != "") {
                        isSummary = true;
                }
                if(isSummary){
                    return "summaryNode";
                }            
                return '';
            } else {
                return 'simpleProject';
            }
        }
    },

    /*plugins: [
            Ext.create('ScopeColumnView.CellEditor', {
                clicksToEdit: 0
            })
    ],*/

    initComponent: function () {
        var me = this;
        me.store = me.scopeItemStore;
        me.renderTo = me.renderToProperty;
        me.plugins = [me.cellEditingPlugin];
        Ext.applyIf(me, {
            //me.store = me.scopeItemStore;
        //me.renderTo = me.renderToProperty;
        });
        me.callParent(arguments);        
    },

    listeners: {
        itemexpand: function (item, eOpts) {
            this.onItemExpand(item, eOpts);                         
        },

        itemcollapse: function (item, eOpts) {
              this.onItemCollapse(item, eOpts);      
        },

        itemClick: function (view, record, item, index, e, eOpts) {
            if (this.matrixView.readOnly) return false;
            
            if (this.isClickOnImage(e)){
                if(this.cellEditingPlugin.editing){
                    this.cellEditingPlugin.cancelEdit();
                }
                if (!e.ctrlKey){
                    this.isCallFromImageClick = true;
                    this.eventPassed = e;
                    if (this.getSelectionModel().selected.items.length == 1){
                        this.getSelectionModel().deselectAll();
                    }
                    
                    this.eventPassed = null;
                    this.isCallFromImageClick = false;  
                }
                
                this.getSelectionModel().select(record, true);
                this.onItemContextMenu(view, record, item, index, e, eOpts);
            } else if (e.ctrlKey){
                if(this.cellEditingPlugin.editing){
                    this.cellEditingPlugin.completeEdit();
                }
                if (this.selectedRowUids && this.selectedRowUids[record.get("rowUid")]){
                    this.getSelectionModel().deselect(record, true);
                    delete this.selectedRowUids[record.get("rowUid")];
                } else {
                    this.selectedRowUids = this.selectedRowUids ? this.selectedRowUids : {};
                    this.selectedRowUids[record.get("rowUid")] = record.data;
                }
                
                

            } else {
            
                this.eventPassed = e;
                if (this.getSelectionModel().selected.items.length == 1 || !e.ctrlKey){
                    this.getSelectionModel().deselectAll();
                }
                
                this.eventPassed = null;
                this.getSelectionModel().select(record, true);
            }
                                
        },

        beforedeselect: function (view, record, index, eOpts){
            if (this.eventPassed){
                if (this.isClickOnImage(this.eventPassed) && !this.isCallFromImageClick){
                    return false;
                }
            } else {
                return false;
            }
            //console.log("deselect");
        },

        select: function (rowModel, record, index, eOpts) {           
        },

        itemmouseenter: function (view, record, item, index, e, eOpts) {
                this.onItemMouseEnter(view, record, item, index, e, eOpts);
        },

        itemcontextmenu: function( view, record, item, index, e, eOpts ){
            if (this.matrixView.readOnly) return false;                  
            if (Ext.isIE9) {
               this.onItemContextMenu(view, record, item, index, e, eOpts);
            }
        },
        beforeedit: function (editor, e, eOpts){
            if (this.matrixView.readOnly) return false;
        },
        edit: function (editor, e, eOpts) {
            this.onEdit(editor, e, eOpts);
        },
        beforeitemdblclick: function (){
            return false;
        }                
    },
    isClickOnImage: function(e){
        var evt = e ? e: window.event;
        if (evt.pageX > 168 && evt.pageX < 215 ){
            var adjustedY = evt.pageY - $(evt.target).offset().top;
            if (adjustedY > 8 && adjustedY < 35){
                return true;
            }
        }
        return false;

    },
    onItemExpand: function(item, eOpts){
        var selectedScopeItemUId = item.get("data").scopeItemUid,
            selectedScopeOutlineLevel = item.get("data").outlineLevel;

        var counter = 0,
            currentRowFound = false,
            expansionDone = false;                                   
        var scopeItemRows = $(".matrix-view-row");      
        var scopeTreeRootNode = this.store.getRootNode();     
        while(counter < scopeItemRows.length ){
            //var currentRowFound = false;
            scopeItemRow = scopeItemRows[counter];
            var rowModel = $(scopeItemRow).data("model");
            if(rowModel && (rowModel.scopeItemUid == selectedScopeItemUId)){
                currentRowFound = true;
                //continue;
                
            }
            if(currentRowFound){
                if(rowModel){
                    if(rowModel.outlineLevel > selectedScopeOutlineLevel){                       
                        var scopeNode = scopeTreeRootNode.findChild("rowUid", rowModel.uid, true);
                        if(scopeNode){
                            if(scopeNode.isLeaf()){
                                if(scopeNode.parentNode.isExpanded())
                                    $(scopeItemRow).css("display", "");
                            }
                            else {
                                $(scopeItemRow).css("display", "");
                            }
                        }                        
                        expansionDone = true;
                    }
                    if(expansionDone && rowModel.outlineLevel == selectedScopeOutlineLevel){
                        //break out of loop                                       
                        break;
                    }
                }
            }
            counter++;
            
        }
        this.matrixView.refreshLinks();
        this.matrixView.syncRowHeights();
        this.matrixView.syncColumnWidths();
        $(item.get("data").$el).data("model").isExpanded = true;
        $(document).trigger("expandScopeNode", [this.matrixView, item.get("data").uid]);
        
    },

    onItemCollapse: function(item, eOpts){
        var selectedScopeItemUId = item.get("data").scopeItemUid,
            selectedScopeOutlineLevel = item.get("data").outlineLevel;

        var counter = 0,
            currentRowFound = false,
            collapseDone = false;

        var scopeItemRows = $(".matrix-view-row");                 
        while(counter < scopeItemRows.length ){

                scopeItemRow = scopeItemRows[counter];
                var rowModel = $(scopeItemRow).data("model");
                if(rowModel && (rowModel.scopeItemUid == selectedScopeItemUId)){
                    currentRowFound = true;
                    //continue;
                }
                if(currentRowFound){
                    if(rowModel){
                        if(rowModel && rowModel.outlineLevel > selectedScopeOutlineLevel){
                            $(scopeItemRow).css("display", "none");
                            collapseDone = true;   
                        }
                        if(collapseDone && rowModel.outlineLevel == selectedScopeOutlineLevel){
                            //break out of loop                                         
                            break;
                        }
                    }

                }
            counter++;
                    
        }
        this.matrixView.refreshLinks();
        this.matrixView.syncRowHeights();
        this.matrixView.syncColumnWidths();

        $(item.get("data").$el).data("model").isExpanded = false;
        
        $(document).trigger("collapseScopeNode", [this.matrixView, item.get("data").uid]);
    },

    onItemClick: function(view, record, item, index, e, eOpts){

    },

    onSelect: function(view, record, item, index, e, eOpts){

    },

    onItemMouseEnter: function(view, record, item, index, e, eOpts){

    },

    onEdit: function (editor, e, eOpts) {
       var selectedNode = this.getSelectionModel().getSelection()[0];
       if (e.value.trim() == "" && selectedNode.childNodes.length > 0){
            selectedNode.set("text", e.originalValue);
            PPI_Notifier.info(EMPTY_SCOPE_NAMES_NOT_ALLOWED);
       } else {
            this.matrixView.onScopeItemChange(e, selectedNode);
       }
    },

    onItemContextMenu: function (view, record, item, index, e, eOpts) {
       e.stopEvent();
       var contextMenu = this.getContextMenu(record, view, this.matrixView);
       if(contextMenu){
        contextMenu.showAt(e.getXY());
       }

       return false;
    },

    
    findTreeChild:function(tree){
        var treeNode;
        tree.getRootNode().findChildBy(function (child) {
            var text = child.raw.data.text;
            if (regex.test(text) === true) {
                console.warn("selecting child", child);
                //panel.getSelectionModel().select(child, true);
            }
        });

        return treeNode;
    },

    getContextMenu: function (rec, treeView, matrixView) {
        var selectedNodes = treeView.getSelectionModel().getSelection();
        if (matrixView.readOnly || (!this.matrixView.project.isProjectComplex() && selectedNodes.length > 1)) return;
        var referenceScopeName = rec.get("text");
        var selectedOutlineLevel = rec.get("data").outlineLevel;
        var childCount = this.getNoOfAllChildNodes(rec);
        var selectedNodes = treeView.getSelectionModel().getSelection();
        var config = {};
        config.isIndentDisabled = this.isIndentDisabled(selectedNodes);
        config.isOutdentDisabled = this.isOutdentDisabled(selectedNodes);
        config.isInsertDisabled = this.isInsertDisabled(selectedNodes);
        config.isDeleteDisabled = this.isDeleteDisabled(selectedNodes);
        //if (!stl.app.contextMenu) {
        var menuCmp =Ext.getCmp('contextMenu');
        if(menuCmp) 
            menuCmp.destroy();
        var mnuContext = Ext.create('ProjectPlanning.view.ScopeColumn.ContextMenu', { selectedOutlineLevel: selectedOutlineLevel, referenceScopeName: referenceScopeName, treeView: treeView, childCount: childCount, matrixView: matrixView, selectedNodes: selectedNodes, config: config});
        return mnuContext;
        //}

    },

    isIndentDisabled: function (selectedNodes){
        var isDisabled = false;
        _.each(selectedNodes, function (selectedNode, idx){
        if (selectedNode.previousSibling == null){
                isDisabled = true;
        }
        });

        return isDisabled;
    },

    isOutdentDisabled: function (selectedNodes){
        var isDisabled = false;
        _.each(selectedNodes, function (selectedNode, idx){
        if (selectedNode.get("data").outlineLevel == 1){
                isDisabled = true;
            } 
        });

        return isDisabled;
      
    },

    isInsertDisabled: function (selectedNodes){
        if (selectedNodes.length > 1)
            return true;
        else
            return false;

    },

    isDeleteDisabled: function(selectedNodes){
        if (selectedNodes.length > 1)
            return true;
        else
            return false;
    },

    getNoOfAllChildNodes: function (Mynode) {
       var totalNodesCount = 0;
       recurFunc = function (Node) {
           if (Node.hasChildNodes() == false) {
               return 0;
           } else if (Node.hasChildNodes()) {
               totalNodesCount += Node.childNodes.length;
               Node.eachChild(recurFunc);
           }
       }

       if (Mynode.hasChildNodes() == false) {
           return 0;
       } else if (Mynode.hasChildNodes()) {
           totalNodesCount += Mynode.childNodes.length;
           Mynode.eachChild(recurFunc);
       }
       return totalNodesCount;
   },
      
});

Ext.define("ProjectPlanning.view.ScopeColumn.ContextMenu", {
    extend: Ext.menu.Menu,
    initComponent: function () {
        var me = this;
        me.callParent(arguments);
    },
    id: 'contextMenu',
    items: [{
        id: 'insertAbove',
        text: INSERTROWABOVE,
        listeners: {
            click: function (item, e) {
                this.ownerCt.matrixView.insertBlankRowAtPosition(this.ownerCt.selectedOutlineLevel, this.ownerCt.selectedNodes[0], INSERT_ROW_ABOVE, false);
            }
        }
    },
    {
        id: 'insertBelow',
        text: INSERTROWBELOW,
        listeners: {
            click: function (item, evt) {
                this.ownerCt.matrixView.insertBlankRowAtPosition(this.ownerCt.selectedOutlineLevel, this.ownerCt.selectedNodes[0], INSERT_ROW_BELOW, false);
            }
        }
    },
    {
        id: 'insertChild',
        text: INSERTCHILD,
        listeners: {
            click: function (item, evt) {
                this.ownerCt.matrixView.insertBlankRowAtPosition(this.ownerCt.selectedOutlineLevel + 1, this.ownerCt.selectedNodes[0], ADD_CHILD, false);
            }
        }
    },
    {
        id: 'deleteRow',
        text: DELETEROW,
        listeners: {
            click: function (item, evt) {
                this.ownerCt.matrixView.deleteScope(this.ownerCt.selectedNodes);
            }
        }
    },
    {
        id: 'indent',
        text: INDENT,
        //disabled: ,
        listeners: {
            click: function (item, evt) {
                this.ownerCt.matrixView.indentRow(this.ownerCt, this.ownerCt.selectedNodes);
            }
        }
    },
    {
        id: 'outdent',
        text: OUTDENT,
        //hidden: ,
        listeners: {
            click: function (item, evt) {
                this.ownerCt.matrixView.outdentRow(this.ownerCt, this.ownerCt.selectedNodes);
            }
        }
    }
    ],
    listeners:{
        beforeShow: function(item, e) {
                if (!this.matrixView.project.isProjectComplex()){
                    Ext.getCmp('outdent').setHidden(true);
                    Ext.getCmp('indent').setHidden(true);
                    Ext.getCmp('deleteRow').setHidden(this.config.isDeleteDisabled);
                    Ext.getCmp('insertChild').setHidden(true);
                    Ext.getCmp('insertBelow').setHidden(this.config.isInsertDisabled);
                    Ext.getCmp('insertAbove').setHidden(this.config.isInsertDisabled);
                } else {
                    Ext.getCmp('outdent').setDisabled(this.config.isOutdentDisabled);
                    Ext.getCmp('indent').setDisabled(this.config.isIndentDisabled);
                    Ext.getCmp('deleteRow').setHidden(this.config.isDeleteDisabled);
                    Ext.getCmp('insertChild').setHidden(this.config.isInsertDisabled);
                    Ext.getCmp('insertBelow').setHidden(this.config.isInsertDisabled);
                    Ext.getCmp('insertAbove').setHidden(this.config.isInsertDisabled);
                }
            }

    }
});
