/**
 * stl.view.MilestoneMenu
 *
 * The popup menu that appears when a milestone is clicked in matrix or timeline views.
 * Currently provides only static methods for binding menu events.
 * TODO Allow instantiation, provide methods for rendering a menu from scratch
 */
stl.view.MilestoneMenu = function() {
    throw "MilestoneMenu instantiation not supported";
};

$.extend(stl.view.MilestoneMenu.prototype, (function () {

    return {
        // static
        bindMilestoneMenu: function (timelineView, $menu, ms) {
            $menu.data("ms", ms);
            if (ms.taskType === "PE" || ms.taskType === "CMS" || ms.taskType === "IMS") {
                $menu.find(".tool-item-view-checklist").on("click", function (evt) {
                    timelineView.showChecklistPopupForMilestone(ms);
                    evt.stopPropagation();
                });
            }
            else {
                $menu.find(".tool-item-view-checklist").remove();
            }
            if (ms.taskType === "NONE")
                $menu.find(".tool-item-convert-to-PP").remove();
            if (ms.taskType === "CMS") {
                $menu.find(".tool-item-convert-to-CMS").remove();
            }
            if (ms.taskType === "IMS") {
                $menu.find(".tool-item-convert-to-IMS").remove();
            }
            if (ms.taskType === "PE")
                $menu.find(".tool-item-convert-to-PE").remove();
            $menu.find(".tool-item-delete-milestone").on("click", stl.view.MilestoneMenu.prototype.onMilestoneMenuDeleteClick.bind(this, ms, $menu));
            $menu.find(".tool-item-convert-to-CMS").on("click", stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this, ms, CMS_SHORT, ms.taskType));
            $menu.find(".tool-item-convert-to-IMS").on("click", stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this, ms, IMS_SHORT, ms.taskType));
            $menu.find(".tool-item-convert-to-PE").on("click", stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this, ms, PE_SHORT, ms.taskType));
            $menu.find(".tool-item-convert-to-PP").on("click", stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this, ms, 'NONE', ms.taskType));
            if (ms.taskType === "PEMS" || ms.taskType === "IPMS") {
                $menu.find(".tool-item-edit-milestone").addClass("disabled");
                $menu.find(".tool-item-convert-to-CMS").remove();
                $menu.find(".tool-item-convert-to-IMS").remove();
                $menu.find(".tool-item-convert-to-PE").remove();
                $menu.find(".tool-item-convert-to-PP").remove();
            }
            else {
                $menu.find(".tool-item-edit-milestone").on("click", stl.view.MilestoneMenu.prototype.onEditMilestoneClick.bind(this, ms));
            }
            if (stl.app.isProjectOpenInViewOnlyMode()) {
                $menu.find(".tool-item-edit-milestone").addClass("disabled");
                $menu.find(".tool-item-delete-milestone").addClass("disabled");
                if ($menu.find(".tool-item-convert-to-CMS").length > 0)
                    $menu.find(".tool-item-convert-to-CMS").remove();
                if ($menu.find(".tool-item-convert-to-IMS").length > 0)
                    $menu.find(".tool-item-convert-to-IMS").remove();
                $menu.find(".tool-item-convert-to-PE").remove();
                $menu.find(".tool-item-convert-to-PP").remove();
            }
            if (ms.status === "CO") {
                this.disableMilestoneMenuItem($menu, ".tool-item-edit-milestone");
                this.disableMilestoneMenuItem($menu, ".tool-item-convert-to-CMS");
                this.disableMilestoneMenuItem($menu, ".tool-item-convert-to-IMS");
                this.disableMilestoneMenuItem($menu, ".tool-item-convert-to-PE");
                this.disableMilestoneMenuItem($menu, ".tool-item-convert-to-PP");
            }

            // stl.app.addHighlightPopupMenuHandlers($menu);
            stl.view.MilestoneMenu.prototype.bindHighlightHandler(this,$menu,ms);
        },
        bindHighlightHandler: function (thisVal,$menu,ms) {
            $menu.find(".tool-item-highlight-imm-predecessors").on("click", stl.view.MilestoneMenu.prototype.highlightImmpredecessors.bind(thisVal,ms));
            $menu.find(".tool-item-highlight-all-predecessors").on("click", stl.view.MilestoneMenu.prototype.highlightAllpredecessors.bind(thisVal,ms));
            $menu.find(".tool-item-highlight-milestone-longest-predecessor-chain").on("click", stl.view.MilestoneMenu.prototype.highlightLongestpredecessors.bind(thisVal,ms));
            $menu.find(".tool-item-highlight-all-chains").on("click", stl.view.MilestoneMenu.prototype.highlightAllChains.bind(thisVal,ms));
            var isReplanEnabled = false;
            if($(".replan-mode-btn").hasClass("active btn-primary")){
                isReplanEnabled = true;
            }
            else if ($(".plan-mode-btn").hasClass("active btn-primary")){
                isReplanEnabled = false;
            }
            if(!isReplanEnabled)
                this.disableMilestoneMenuItem($menu, ".tool-item-highlight-all-chains");
                
        },
        highlightImmpredecessors: function (ms,evt) {
            clearAllHighlight();
            highlightImmediatePredecessors(ms.uid);
        },
        highlightAllpredecessors: function (ms,evt) {
            clearAllHighlight();
            highlightAllPredecessors(ms.uid);
        },
        highlightLongestpredecessors: function (ms,evt) {
            clearAllHighlight();
            highlightLongestPredecessorChainByUid(ms.uid);
            this.checkMSRecLongestPath(ms.uid);
        },
        highlightAllChains:function(ms,evt){
            clearAllHighlight();
            stl.app.HighlightChainsForMilestone(ms.uid);
            this.checkMSRecLongestPath(ms.uid);
        },
        disableMilestoneMenuItem: function ($menu, className) {
            $menu.find(className).addClass("disabled").off("click");
        },

        // static
        onMilestoneMenuDeleteClick: function (ms, $menu, evt) {
            var msUid = ms.uid;
            $menu.trigger("deletemilestone", [msUid, ms]);
        },

        // static
        onEditMilestoneClick: function (ms, evt) {
            var me = this;
            Ext.create('Ext.window.Window', {
                title: 'Edit Milestone',
                xtype: 'editMilestoneWindow',
                height: 170,
                width: 290,
                modal: true,
                defaults: {
                    anchor: '100%',
                    margin: '5 5 2 5'
                },
                layout: 'anchor',
                fieldDefaults: {
                    labelAlign: 'left',
                    labelWidth: 110
                },
                items: [{
                    xtype: 'textfield',
                    itemId: 'name',
                    fieldLabel: stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_NAME"),
                    allowBlank: false,
                    value: ms.name,
                    readOnly: ms.taskType == "PE" ? true : false
                }, {
                    xtype: 'combobox',
                    displayField: 'text',
                    itemId: 'type',
                    fieldLabel: stl.app.getColumnDisplayName("MILESTONE_PANEL_MILESTONE_TYPE"),
                    store: Ext.create('Ext.data.Store', {
                        fields: ['id', 'text'],
                        data: [
                                { id: PE_SHORT, text: PROJECT_END },
                                { id: CMS_SHORT, text: CONTRACTUAL_MILESTONE },
                                { id: IMS_SHORT, text: INTERNAL_MILESTONE }
                               ]
                    }),
                    valueField: 'id',
                    selectOnFocus: true,
                    allowBlank: false,
                    value: ms.taskType === "NONE" ? PINCH_POINT_TITLE : ms.taskType

                }, {
                    xtype: 'datefield',
                    anchor: '100%',
                    fieldLabel: stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_DUE_DATE"),
                    itemId: 'duedate',
                    format: ServerTimeFormat.getExtDateformat(),
                    value: new Date(ms.date1),
                    listeners: {
                        "render": function (val, id, rec) {
                            if (ms.taskType == "NONE") {
                                this.hide();
                            }
                        }
                    }
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        width: 70,
                        text: 'OK',
                        handler: function (btn, e, eOpts) {
                            var msRec = {
                                'uid': ms.uid,
                                'name': this.ownerCt.ownerCt.getComponent('name').getValue(),
                                'type': this.ownerCt.ownerCt.getComponent('type').getValue() === PP_LONG ? "NONE" : this.ownerCt.ownerCt.getComponent('type').getValue(),
                                'taskType': this.ownerCt.ownerCt.getComponent('type').getValue() === PP_LONG ? "NONE" : this.ownerCt.ownerCt.getComponent('type').getValue(),
                                'startDate': ms.startDate,
                                'endDate': ms.endDate,
                                'status':ms.status,
                                'date1': this.ownerCt.ownerCt.getComponent('duedate').getValue(),
                                'bufferSize': ms.bufferSize
                            };
                            if (ms.taskType != msRec.type) {
                                var editedField = "type";
                            }
                            if (editedField && editedField === "type")
                                switch (msRec.type) {
                                case CMS_SHORT:
                                    me.changeMilestoneType(ms, CMS_SHORT, ms.taskType);
                                    break;
                                case IMS_SHORT:
                                    me.changeMilestoneType(ms, IMS_SHORT, ms.taskType);
                                    break;
                                case PE_SHORT:
                                    me.changeMilestoneType(ms, PE_SHORT, ms.taskType);
                                    break;
                                case "NONE":
                                    me.changeMilestoneType(ms, 'NONE', ms.taskType);
                                    break;
                                default:
                            }
                            else {
                                $(document).trigger("milestoneupdate", [msRec, editedField]);
                                //Ext.getCmp('CCSummarygrid').updateMilestoneSheet(msRec);
                            }
                            if (msRec.type == "PE") {
                                UpdateProjectEnd(msRec.date1);
                            }
                            this.ownerCt.ownerCt.close();
                        }
                    }, {
                        xtype: 'button',
                        width: 70,
                        text: 'Cancel',
                        listeners: {
                            click: function (btn, e, Opts) {
                                this.ownerCt.ownerCt.close();
                            }
                        }
                    }]
                }]
            }).show();
        },
        changeMilestoneType: function (ms, type, oldType) {
//replace with stl.app.ProjectDataFromServer
            if (!stl.model.Project.project.validatePEandPPTypeConversion(ms, type)) {
                return;
            }
ms.taskType =type;
            var msRec = {
                'uid': ms.uid,
                'name': ms.name,
                'type': type,
                'startDate': ms.startDate,
                'endDate': ms.endDate,
                'date1': ms.date1 ? ms.date1 : ServerClientDateClass.getTodaysDate(),
                'status':ms.status,
                'bufferSize': ''
            };
            Ext.getCmp('CCSummarygrid').changeMilestoneNameByChangingType(type === PE_SHORT ? 'Project End' : type, msRec, msRec.name, oldType, function () {
                stl.app.ProjectDataFromServer.updateMilestone(msRec, oldType);
                
                $(document).trigger("milestoneupdate", [msRec, 'type', oldType]);
                $(document).trigger("taskchange",[this,ms]);
                Ext.getCmp('CCSummarygrid').updateMilestoneSheet(msRec);
            });
            if ($(".matrix-view").data("view")) {
                var $ms = $(".matrix-view").data("view").milestoneElementsById[ms.uid];
                //autolink all property should bre fired only in milestone phase	
                if (stl.model.Project.project.getPhaseById(ms.phaseId).type === STRING_MILESTONE_LOWER_CASE)
                    $($ms.data("view")).trigger("autolinkallChange", [$ms, $ms.find(".ms-autolink input").is(":checked")]);
            }
           stl.app.triggerSave();
        },
        UpdateProjectEnd: function (editedDueDate) {
            var project = stl.app.ProjectDataFromServer;
            project.dueDate = editedDueDate;
        },
        checkMSRecLongestPath:function(id){
            var msSheetRec = Ext.getCmp('msGrid').getStore().findRecord('uid',id,0,false,true,true);
            if(msSheetRec){
                msSheetRec.set('longestPaths2',true);
            }
        }
    };

} ()));
