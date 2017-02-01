Ext.override(Sch.eventlayout.Horizontal, {
    applyLayout: function (events, resource) {
         var rowEvents = events.slice();

        // Sort events by start date, and text properties.
        var me = this;

        rowEvents.sort(function (a, b) {
            return me.sortEvents(a.event, b.event);
        });

        // return a number of bands required
        return this.nbrOfBandsByResource[resource.internalId] = this.layoutEventsInBands(rowEvents);
    }
    
});

Ext.define('ProjectPlanning.view.chainview.ChainView', {
    extend: 'Sch.panel.SchedulerTree',

    requires: [
        "Sch.panel.SchedulerTree",
        "ProjectPlanning.view.chainview.ChainViewController",
        "ProjectPlanning.view.chainview.ChainViewModel"
    ],

    controller: "chainview-chainview",
    viewModel: {
        type: "chainview-chainview"
    },
    xtype: 'chainview',
    cls: 'timeline-view',
    allowOverlap:false,
    useArrows: false,
    multiSelect: false,
    singleExpand: false,
    autoHeight: true,
    enableAnimation: false,
    enableEventDragDrop: false,
    enableDragCreation: false,

    TASK_OUT_ENDPOINT_OFFSETS: {
        x: -4,
        y: 12
    },
    MILESTONE_LINK_COLOR: "rgb(200,200,200)",
    MILESTONE_LINK_HIGHLIGHT_COLOR: "red",
    D3_LINE_FUNCTION: d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate("linear"),
    NORMAL_ZOOM_TASKWIDTH: 660,
    MILESTONE_LINK_REFRESH_TIMEOUT_MS: 50,
    LINK_REFRESH_BUFFER_MS: 50,

    customViewPresets: {
        "multipleYear": Ext.Object.merge(Sch.preset.Manager.defaultPresets.year, {
            timeColumnWidth: 50,
            headerConfig: {
                bottom: {
                    unit: "MONTH",
                    renderer: null
                }
            }
        }),

        "year": Ext.Object.merge(Sch.preset.Manager.defaultPresets.year, {
            headerConfig: {
                 middle: {
                    unit: "QUARTER",
                    renderer: function (start, end, cfg) {
                         return MONTHS[Math.floor(start.getMonth() / 3)*3 ] + '-' + MONTHS[Math.floor(start.getMonth() / 3)*3 + 2];
                    }
                },
                bottom: {
                    unit: "MONTH",
                    renderer: null
                }
            }
        }),

        "quarter": {
            timeColumnWidth: 15,
            resourceColumnWidth: 100, // Only used in vertical orientation
            displayDateFormat: 'Y-m-d',
            shiftUnit: "QUARTER",
            shiftIncrement: 1,
            defaultSpan: 1, // By default, show 1 year
            timeResolution: {
                unit: "WEEK",
                increment: 1
            },
            headerConfig: {
                top: {
                    unit: "QUARTER",
                    renderer: function (start, end, cfg) {
                        return MONTHS[Math.floor(start.getMonth() / 3)*3 ] + '-' + MONTHS[Math.floor(start.getMonth() / 3)*3 + 2];
                    }
                },
                middle: {
                    unit: "MONTH",
                    dateFormat: ServerTimeFormat.getExtMonthformat()
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        },

        "month": Ext.Object.merge(Sch.preset.Manager.defaultPresets.monthAndYear, {
            timeColumnWidth: 60,
            headerConfig: {
                top: {
                    unit: "MONTH",
                    dateFormat: ServerTimeFormat.getExtMonthformat()
                },
                middle: {
                    unit: "WEEK",
                    renderer: function (start, end, cfg) {
                        cfg.align = 'left';
                        return Ext.Date.format(start, ServerTimeFormat.getExtTimelineDayformat());
                    }
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        }),

        "day": {
            timeColumnWidth: 60,
            resourceColumnWidth: 100,
            displayDateFormat: 'Y-m-d',
            shiftUnit: "WEEK",
            shiftIncrement: 1,
            defaultSpan: 1,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                top: {
                    unit: "WEEK",
                    dateFormat: ServerTimeFormat.getExtTimelineDayformat() + ' D'
                },
                middle: {
                    unit: "DAY",
                    align: 'center',
                    increment: 1,
                    dateFormat: ServerTimeFormat.getExtTimelineDayformat()
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        }
    },

    zoomLevels: [{
        width: 50,
        increment: 1,
        resolution: 1,
        preset: 'multipleYear',
        resolutionUnit: 'MONTH'
    }, {
        width: 300,
        increment: 1,
        resolution: 1,
        preset: 'year',
        resolutionUnit: 'MONTH'
    }, {
        width: 15,
        increment: 1,
        resolution: 1,
        preset: 'quarter',
        resolutionUnit: 'WEEK'
    }, {
        width: 30,
        increment: 1,
        resolution: 1,
        preset: 'month',
        resolutionUnit: 'DAY'
    }, {
        width: 60,
        increment: 1,
        resolution: 1,
        preset: 'day',
        resolutionUnit: 'DAY'
    }],

    rowHeight: 45,
    tooltipTpl: '{Name}',
    eventBodyTemplate: [
        '<tpl if="IsMilestone">',
            '<tpl if="IsIMS">',
                '<div id ="chain-view-taskMS-{TaskUID}" class="IMS-Milestone" data-ms-uid="{TaskUID}"></div>',
            '</tpl>',
             '<tpl if="IsInternalMS">',
                '<div id ="chain-view-taskMS-{TaskUID}" class="Internal-Milestone" data-task-uid="{TaskUID}"></div>',
            '</tpl>',
            '{Name}',
            '<div class="milestone-color" style="background-color: {msColor}"></div>',
        '<tpl else>',
                '<tpl if="IsSummary">',
                        '<div id ="chain-view-taskMS-{TaskUID}" class="TimelineSummaryBar" data-task-uid="{TaskUID}">',
                            '<div class="summary-completion-bar" style="width: {CompletionPercentage}%">',
                            '</div>',
                        '</div>',
                '<tpl else>',
                        '<div class="task-color" style="background-color: {TaskColor}"></div>',
                        '<tpl if="ShowSubTaskIndicator">',
                            '<div class="remaining-subtasks-indicator">{SubtaskCount}</div>',
                        '</tpl>',
                        '<div  id ="chain-view-taskMS-{TaskUID}" class="task" data-task-uid="{TaskUID}">',
                        '<div class="task-color" style="background-color: {TaskColor}">',
                        '</div>',
                        '<div class="task-content-wrapper">',
                        '<div class="task-name">',                        
                        '<div class="task-completion-bar" style="width: {CompletionPercentage}%">',
                        '</div>',
                        '<div class="task-idle-bar" style="width: {TaskIdlePercentage}%;left:{TaskIdleBarLeftPosition}%">',
                        '</div>',
                        '<div class="task-name-text">{Name}',
                        '</div>',
                        '</div>',
                        '</div>',
                        '<div class="task-header-arrow"></div>',
                        '<div class="task-header-arrow task-completion-arrow"></div>',
                        '</div>',
                '</tpl>',
        '</tpl>',
    ].join(''),

    milestoneTooltipTemplate: new Ext.XTemplate([
        '<div class="milestone-tooltip">',
        '<table>',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_NAME")]} :</th>',
        '<td>{name}</td>',
        '</tr>',
        '<tpl if="taskType == &quot;NONE&quot;">',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_MILESTONE_TYPE")]} :</th>',
        '<td>PP</td>',
        '</tr>',
        '</tpl>',
        '<tpl if="taskType != &quot;NONE&quot;">',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_MILESTONE_TYPE")]} :</th>',
        '<td>{taskType}</td>',
        '</tr>',
        '</tpl>',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_BUFFER_SIZE_D")]} :</th>',
        '<td>{[values.bufferSize?values.bufferSize == "1"?values.bufferSize+" day":values.bufferSize+" days":""]}</td>',
        '</tr>',
        '<tpl if="taskType != &quot;NONE&quot;">',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_DUE_DATE")]} :</th>',
        '<td>{[Ext.Date.format(new Date(values.date1), ServerTimeFormat.getExtDateformat())]}</td>',
        '</tr>',
        '</tpl>',
        '<tpl if="taskType != &quot;NONE&quot;">',
        '<tr>',
        '<th>{[stl.app.getColumnDisplayName("MILESTONE_PANEL_PROJECTED_DATE")]} :</th>',
        '<td>{[values.projectedDate?Ext.Date.format(new Date(values.projectedDate), ServerTimeFormat.getExtDateformat()):""]}</td>',
        '</tr>',
        '</tpl>',
        '</table>',
        '</div>',
    ].join('')),

    viewConfig: {

        getRowClass: function (record, index, rowParams, store) {
            switch (record.get('type')) {
                case "NEW_ROW":
                    return 'x-grid-row-placeholder node-depth-' + record.get('depth');
                case "TASK":
                    return 'x-grid-row-task node-depth-' + record.get('depth');
                case "TASK_LIST":
                    return 'x-grid-row-task-list node-depth-' + record.get('depth');
                case "":
                default:
                    return 'simpleProject';
            }
            return 'node-depth-' + record.get('depth');
        },

        listeners: {
        }
    },

    dragConfig: {
        // overClass: "test"
    },

    plugins: [],

    eventSelModel: {
        listeners: {
            "beforeselect": function () {
                return false;
            },
            scope: this
        }
    },

    initComponent: function () {

        var me = this,
            frozenHeaderRenderer = this.frozenHeaderRenderer.bind(this);
        this.refreshLinksView = Ext.Function.createBuffered(this.refreshLinksViewImmediate,
            this.LINK_REFRESH_BUFFER_MS, this);
        Object.keys(me.customViewPresets).map(function (presetName) {
            Sch.preset.Manager.registerPreset(presetName, me.customViewPresets[presetName]);
            Sch.preset.Manager.get(presetName).headerConfig.bottom.renderer = frozenHeaderRenderer;
        });
        this.resourceStore = new Sch.data.ResourceTreeStore({
            model: Sch.model.Resource,
            rootVisible: false,
            folderSort: true,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json'
                }
            },
            listeners: {
                nodecollapse: function (item, eOpts) {
                    if (item.get("Id") == "root") return;
                },
                nodeexpand: function (item, eOpts) {
                    if (item.get("Id") == "root") return;

                }
            }

        });
        this.eventStore = new Sch.data.EventStore({
            data: [],
            isFiltered:false
        });

        this.zonesStore = Ext.create('Ext.data.Store', {
            model: 'Sch.model.Range',
            data: []
        });
        Ext.apply(this, {
            viewPreset: 'month',
            columns: [{
                xtype: 'treecolumn',
                text: '',
                width: 200,
                sortable: false,
                dataIndex: 'Name',
                locked: false,
                editor: {
                    xtype: 'textfield',
                    allowBlank: false,
                    allowOnlyWhitespace: false
                },
                renderer: function (val, metadata, record) {
                        var MAX_LENGTH_ALLOWED = 50;

                        var ScopeColumnName = val;
                        var scopeNameToBeDisplayed = val;
                        metadata.tdAttr = 'data-qtip="' + Ext.String.htmlEncode(ScopeColumnName) + '"';
                        if(ScopeColumnName.length > MAX_LENGTH_ALLOWED){                
                            scopeNameToBeDisplayed = Ext.String.ellipsis(ScopeColumnName, MAX_LENGTH_ALLOWED, true); 
                            return scopeNameToBeDisplayed;
                        }
                        return scopeNameToBeDisplayed;
                }
            }],
            plugins: this.plugins.concat([
                Ext.create('Sch.plugin.Zones', {
                    store: this.zonesStore
                })
            ])
        });

        // TODO maybe these could be moved to "listeners" config
        this.on({

            "beforeselect": function () {
                return false;
            },
            "afterlayout": this.onAfterLayout,
            "eventclick": this.onEventClick,
            "viewchange": this.onTimelineViewChange,
            "zoomchange": this.onTimelineZoomChange,
            "timeheaderclick": this.onTimelineHeaderClick
        }, this, {
            destroyable: true
        });

        this.zoomLevel = 2;
        this.lastHoverDateMs = null;

        this.callParent(arguments);

        this.pendingScrollToDate = Sch.util.Date.add(this.getToday(), Sch.util.Date.DAY, -3);
        this.defaultNewTaskDate = Sch.util.Date.add(this.getStart(), Sch.util.Date.DAY, 1);

        this.on("afterrender", function () {
            // test whether data is loaded
            if (me.project) {
                me.onTimelineViewChange();
                me.onTimelineZoomChange();
                me.refreshLinksView();
            }
            $(me.el.dom).on("click", me.onBackgroundClick.bind(this));
            this.toolTip = Ext.create('Ext.tip.ToolTip', {
                target: this.getEl(),
                delegate: ".milestone-event, .sch-event, .sch-event-milestone",
                dismissDelay: 0,
                listeners: {
                    beforeshow: function toolTipBeforeShow(tip) {
                        var triggerElementUId = $(tip.triggerElement).data("ms-uid");
                        if($(tip.triggerElement).hasClass("sch-event-milestone"))
                            triggerElementUId = $(tip.triggerElement).find(".IMS-Milestone").data("ms-uid");

                        //Check for summary task
                        if (!triggerElementUId) {
                            triggerElementUId = $(tip.triggerElement).find(".TimelineSummaryBar").data("task-uid");
                        }

                        var eventRec = me.eventStore.getById(String(triggerElementUId));
                        if (eventRec) {
                            var isMilestone = eventRec.get("taskModel").isMS;

                            if (isMilestone) {
                                //Tooltip for milestones shown in frozen header renderer
                                tip.update(me.milestoneTooltipTemplate.apply(eventRec.data.taskModel));
                            } 
                        }
                        else
                            return false;
                    }
                }
            });
        }, this, {
            destroyable: true
        });
        this.addGlobalListener("taskChangeAtPhaseLevel", this.onTaskChangeAtPhaseLevel.bind(this));
        this.addGlobalListener("updateResourcesDeleted", this.onUpdateResourcesDeleted.bind(this));
        this.addGlobalListener("taskchange", this.onTaskChange.bind(this));
        this.addGlobalListener("taskadd", this.onTaskAdd.bind(this));
        this.addGlobalListener("taskremove", this.onTaskRemove.bind(this));
        this.addGlobalListener("phasechange", this.onPhaseChange.bind(this));
        this.addGlobalListener("phaseadd", this.onPhaseAdd.bind(this));
        this.addGlobalListener("phaseremove", this.onPhaseRemove.bind(this));
        this.addGlobalListener("milestoneupdate", this.onMilestoneInfoChange.bind(this));

        this.addGlobalListener("zoomin", this.onZoomIn.bind(this));
        this.addGlobalListener("zoomout", this.onZoomOut.bind(this));
        this.addGlobalListener("viewchange", this.onAppViewChange.bind(this));
        this.addGlobalListener("highlightcctasks", this.onHighlightCCTasks.bind(this));
        this.addGlobalListener("highlightPenChain", this.onHighlightPenChain.bind(this));
        this.addGlobalListener("allhighlightscleared", this.onAllHighlightsCleared.bind(this));
        this.addGlobalListener("errorHighlight", this.onErrorHighlight.bind(this));
        this.addGlobalListener("highlightResourceContention", this.onHighlightResourceContention.bind(this));
        this.addGlobalListener("highlightSlack", this.onHighlightSlack.bind(this));
        this.addGlobalListener("highlightchange", this.onHighlightChange.bind(this));
        this.addGlobalListener("highlight-milestone", this.onHighlightMilestone.bind(this));
        this.addGlobalListener("togglelinks", this.onToggleLinks.bind(this));

        this.addGlobalListener("milestoneadd", this.onMilestoneAdd.bind(this));
        this.addGlobalListener("acceptPlanClicked", this.onAcceptPlan.bind(this));
        this.addGlobalListener("projectload", this.onProjectLoaded.bind(this));
        this.addGlobalListener("removeBufferTaskAndPEMS", this.removeBufferTaskAndPEMS.bind(this));
        this.addGlobalListener("removeBufferTaskAndIPMS", this.removeBufferTaskAndIPMS.bind(this));


        var timeAxisColumn = this.down('timeaxiscolumn');
        this.eventStore.on({
            add: timeAxisColumn.refresh,
            remove: timeAxisColumn.refresh,
            update: timeAxisColumn.refresh,
            scope: timeAxisColumn
        });
    },

    onToggleLinks: function (evt, showLinks) {
        if (this.linksView) {
            this.linksView.setVisible(showLinks);
            this.refreshMilestoneLinks();
        }
    },

    // row item expandeded in left panel
    onRowItemExpanded: function (evt, row) {
        this.refreshLinksView();
    },


    // row item collapsed in left panel
    onRowItemCollapsed: function (evt, row) {
        //remove all links for tasks in row
        this.refreshLinksView();
    },

    //return all child row ids which are being collapsed/expanded
    getAllChildRowIds: function (row, rowIds) {
        if (row) {
            var childNodes = row.childNodes;
            var me = this;
            _.forEach(childNodes, function (node) {
                if (node.childNodes.length > 0) {
                    me.getAllChildRowIds(node, rowIds);
                }
                rowIds.push(node.data.Id)
            })
        }
    },

    //remove link connection
    removeLinkConnection: function (me, link) {
        var 
        //links view
        linksView = me.linksView,
        //event store of sch
        eventStore = me.eventStore,
        //sch view
        schedulingView = me.getSchedulingView(),

        fromMilestone = false,
        toMilestone = false,
        fromRec = eventStore.getById(link.from),
        fromEventEl = (fromRec ? schedulingView.getElementFromEventRecord(fromRec) : null),
        toRec = eventStore.getById(link.to),
        toEventEl = (toRec ? schedulingView.getElementFromEventRecord(toRec) : null),
        $from,
        $to;

        if (fromEventEl) {
            $from = $(fromEventEl.dom);
        } else {
            $from = $(".timeline-milestone-header .milestone-uid-" + link.from, me.el.dom);
        }
        if (toEventEl) {
            $to = $(toEventEl.dom);
        } else {
            $to = $(".timeline-milestone-header .milestone-uid-" + link.to, me.el.dom);
        }

        if ($from && $to) {
            linksView.removeConnection($from, $to);
        }
    },

    //remove link conncetion for specified links in linksToRemove array
    removeLinksConnection: function (me, linksToRemove) {
        _.forEach(linksToRemove, function (link) {
            me.removeLinkConnection(me, link);
        });
    },

    //get all tasks ids in a row
    getAllTaskIdsForRowId: function (me, rowId) {
        //all tasks in project
        var tasks = me.project.getAllTasks();

        //get all tasks in row
        var taskInRow = _.filter(tasks, function (task) { return task.rowId == rowId; });

        //create array of task ids
        var taskIdsInRow = [];
        _.forEach(taskInRow, function (task) {
            taskIdsInRow.push(task.uid);
        });

        return taskIdsInRow;

    },

    //return links array from project links for a given row id
    getLinksArrayForRowId: function (me, rowId) {
        //all links in project
        var links = me.project.links;

        //get array of task ids
        var taskIdsInRow = me.getAllTaskIdsForRowId(me, rowId);

        //get links for row
        var linksInRow = _.filter(links, function (link) {
            return _.contains(taskIdsInRow, link.from) || _.contains(taskIdsInRow, link.to);
        });

        return linksInRow;
    },

    //remove link connection for given row (also for child rows) - 
    //this will only remove connection not link, on refreshLinksView these links will be connected again
    removeLinkConncectionsForRow: function (row) {
        var rowIds = [];
        //get all child row ids which are being collapsed/expanded
        this.getAllChildRowIds(row, rowIds);

        //timeline view
        var me = this;

        //for each rowId get all links  and remove link connection
        _.forEach(rowIds, function (rowId) {
            //get links from project links for row id
            var linksToRemove = me.getLinksArrayForRowId(me, rowId);
            //remove links 
            me.removeLinksConnection(me, linksToRemove);
        });
    },

    onMilestoneInfoChange: function (evt, milestone, editedField, oldVal) {
        // TODO extract the logic that changes CMS<->IMS etc out of matrix view; should be
        // done by the project model, with matrix and timeline view just updating their displays as needed.  
        // Currently we're letting matrix view continue handling it and delaying our refresh here so we
        // wait till after matrix view is done updating the milestone model.
        var msModel = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(milestone.uid);
        var selectedTask = this.selectedTask;
        //if (milestone.checklistStatus)
        //this.refreshChecklistIcon($ms, milestone);
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

                if (oldVal == PE_SHORT)
                    this.removeBufferTaskAndPEMS("", milestone.uid);
                else
                    this.removeBufferTaskAndIPMS("", milestone.uid);
                var isRemoved = this.removeSuccessorLinks(milestone.uid);
                this.selectedTask = selectedTask;
            } else if (msType === IMS_SHORT) {
                //Change this milestone to IMS

                if (oldVal == PE_SHORT)
                    this.removeBufferTaskAndPEMS("", milestone.uid);
                else
                    this.removeBufferTaskAndIPMS("", milestone.uid);
                this.selectedTask = selectedTask;
                //PPI_Notifier.alert(IMS_SHOULD_HAVE_SUCC, IMS_TITLE);
                //If autolink is checked automatically connect the successor tasks
            } else if (msType === "NONE") {

                if (oldVal == PE_SHORT)
                    this.removeBufferTaskAndPEMS("", milestone.uid);
                else if (oldVal == CMS_SHORT || oldVal == IMS_SHORT)
                    this.removeBufferTaskAndIPMS("", milestone.uid);
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
                if (oldVal == CMS_SHORT || oldVal == IMS_SHORT)
                    this.removeBufferTaskAndIPMS("", milestone.uid);
                var isRemoved = this.removeSuccessorLinks(milestone.uid);
                this.selectedTask = selectedTask;
            }
        }
        if (msType == CMS_SHORT) {
            //remove the resources if any exist in the model
            if (msModel.resources.length != 0)
                msModel.resources = [];
        }
        this.project.updateMilestone(milestone, oldVal);
        //Due date is not reflected in timeline birds eye view 
        //when edited from milestone panel
        var eventRec = this.eventStore.getById(milestone.uid);
        eventRec.data.date1= milestone.date1;
        
        setTimeout(function () {
            this.down('timeaxiscolumn').refresh(); 
        } .bind(this), 0);
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

    onTimelineHeaderClick: function (column, startDate, endDate, e, eOpts) {
        //if (this.readOnly) return;
        $(".tool-popup.below").hide();
        var $target = $(e.target), //$(e.browserEvent.target),
            $ms = $target.closest(".milestone-event");
        if ($ms.length > 0) {
            var msUid = $ms.data("ms-uid"),
                msEventRec = this.eventStore.getById(String(msUid)),
                $newMenu = $("#templates div[role=milestone-template] .tool-popup").clone(true),
                $container = $(this.getEl().dom),
                containerOffset = $container.offset(),
                msOffset = $ms.offset();
            // Generate menu and show it
            stl.view.MilestoneMenu.prototype.bindMilestoneMenu(this, $newMenu, msEventRec.data.taskModel);
            $container.append($newMenu);
            $newMenu.on("deletemilestone", this.onMilestoneDelete.bind(this));
            $newMenu.css({
                top: (msOffset.top - containerOffset.top + 24) + "px",
                left: (msOffset.left - containerOffset.left + 24 - ($newMenu.width() / 2)) + "px"
            }).show();
            e.stopPropagation();
        }
    },

    // Handles "delete milestone" user action raised by milestone popup menu
    onMilestoneDelete: function (evt, msUid, ms) {
        var msType = ms.taskType;
        if (msType === PE_SHORT) {
            this.removeBufferTaskAndPEMS("", ms.uid);
            //this.project.removeBufferTaskAndPEMS(msUid);
        }
        //Remove CMSB buffer and IPMS if they exist
        //no need to remove buffer task and IPMS for IPMS
        if (msType === CMS_SHORT) {
            this.removeBufferTaskAndIPMS("", ms.uid);
            //this.project.removeBufferTaskAndIPMS(msUid);
        }
        var MV = Ext.getCmp("matrix-view-container");
        if (MV) {
            //do nothing
        } else {
            stl.app.removeTaskFromRowModel(ms, ms.rowId, ms.phaseId);
        }

        this.project.deleteMilestone(this, msUid);

        //this.refreshLinksView();
    },



    removeBufferTaskAndPEMS: function (evt, msUid) {
        
        if (!stl.app.isMatrixViewLoaded) {
            var CCCBTask;
            var PEMSTask;
            CCCBTask = stl.app.ProjectDataFromServer.getBufferTaskForMS(stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(msUid));
            PEMSTask = stl.app.ProjectDataFromServer.getPEMS();
            if (CCCBTask) {
            this.onTaskRemove("", this, CCCBTask, CCCBTask.rowId, CCCBTask.phaseId);
            stl.app.removeTaskFromRowModel(CCCBTask, CCCBTask.rowId, CCCBTask.phaseId);
            }
            if (PEMSTask) {
            stl.app.ProjectDataFromServer.deleteMilestone(this, PEMSTask.uid);
            stl.app.removeTaskFromRowModel(PEMSTask, PEMSTask.rowId, PEMSTask.phaseId);
        }
        }

    },

    removeBufferTaskAndIPMS: function (evt, msUid) {
        
        if (!stl.app.isMatrixViewLoaded) {
            var CMSBTask;
            var IPMSTask;
            var CMS = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(msUid);
            CMSBTask = stl.app.ProjectDataFromServer.getBufferTaskForMS(CMS);
            IPMSTask = stl.app.ProjectDataFromServer.getIPMSForCMS(CMS);

            if (CMSBTask) {
            this.onTaskRemove("", this, CMSBTask, CMSBTask.rowId, CMSBTask.phaseId);
            stl.app.removeTaskFromRowModel(CMSBTask, CMSBTask.rowId, CMSBTask.phaseId);
            }
            if (IPMSTask) {
            stl.app.ProjectDataFromServer.deleteMilestone(this, IPMSTask.uid);
            stl.app.removeTaskFromRowModel(IPMSTask, IPMSTask.rowId, IPMSTask.phaseId);
        }

        }

    },


    onBackgroundClick: function (evt) {
        $(".tool-popup").hide();
        if ($(evt.target).closest(".task").length === 0 && $(evt.target).closest(".fk").length === 0 && this.editTaskView) {
            this.editTaskView.$el.hide();
            this.editTaskView.exitQuickEditMode();
            this.stopEditingTask();
        }
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
        this.clearListeners();

        if (this.$milestoneLinks) {
            $.each(this.$milestoneLinks, function (index, msLink) {
                if (msLink) {
                    $(msLink).off();
                }
            });
        }

        $(this.eventStore).off();
        this.eventStore.clearListeners();
        this.resourceStore.clearListeners();
        this.zonesStore.clearListeners();
        this.eventStore.destroy();
        this.resourceStore.destroy();
        this.zonesStore.destroy();
        this.callParent(arguments);
    },
    showMilestoneChain:function(rec,toShow, classname){
        if(toShow){
            this.resourceStore.hideNodesBy(function(node){
                if(!node.get('root')){
                    if(node.get('Id')==rec.get('id')){
                        return false;
                    }
                    return !this.resourceStore.isVisible(node);                     
                }
                return true;
            }.bind(this));
            //showing a row in chainview showing all tasks for that resource even if they are hidden
            this.hideEvents(rec.get('id'));
            this.handleViewChange();
        }
        else{
            //first show any events in that row that are common for other rows.If they are keep those and hide rest
            //no common events then hide the row;
            this.showCommonEventsForOtherChains(rec,classname);
            this.hideEvents(rec.get('id'));
            this.handleViewChange();
        }
    },
    checkIfResourceIsVisible:function(resId){
        var res = this.resourceStore.findRecord('Id',resId,0,false,true,true);
        if(res)
            return this.resourceStore.isVisible(res);
        return false;
    },
    checkIfLongestPathChecked:function(resId){
        var MSsheetRecord = this.getMsSheetRecord(resId);
        if(MSsheetRecord)
            return MSsheetRecord.get('longestPaths2');
        return false;
    },
    hideEvents:function(excludeId){
        var timelineviewRefreshReqd=false;
        this.resourceStore.data.items.forEach(function(resource){
            if(this.resourceStore.isVisible(resource)){
                var events = resource.getEvents(this.eventStore);
                for(var i=0; i<events.length; i++){
                    //hide events which are already hidden but came back due to hideNodesBy function
                    var $eventRec = $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +events[i].get('id') + "']");
                    if($eventRec.length == 0){
                        var $eventRec = $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +events[i].get('id') + "']");
                    }
                    if(events[i].data.isHiddenInView){
                        if(!$eventRec.parents().eq(1).hasClass("hideEventRec")){
                            timelineviewRefreshReqd = true;
                            $eventRec.parents().eq(1).addClass("hideEventRec");
                            $eventRec.hide();
                        }
                    }
                    else{
                        //case when there is a task in this row only beacuse it is common in other row, but the other row is hidden
                        var commonResIds = events[i].data.commonResourceIds;
                        var ishide = true;
                        if(commonResIds && commonResIds.length>0){
                            for(var j=0; j<commonResIds.length;j++){
                                var isShown = this.checkIfResourceIsVisible(commonResIds[j]) || this.checkIfLongestPathChecked(resource.get('Id'));
                                if(isShown){
                                    ishide = false;                                
                                    break;
                                }
                            }
                            if(ishide){
                                events[i].data.isHiddenInView = true;
                                timelineviewRefreshReqd = true;
                                $eventRec.parents().eq(1).addClass("hideEventRec");
                                $eventRec.hide();
                            }
                            else{
                                //add classNames from highlightClassNames array such that highlight is retained
                                //CON-4434:CV_SPI: Highlighting goes off when longest path for multiple MS are highlighted.
                                this.addClassNameForEvent($eventRec,events[i].data.highlightClassNames);
                            }
                        }
                        else{
                            //add classNames from highlightClassNames array such that highlight is retained
                            //CON-4434:CV_SPI: Highlighting goes off when longest path for multiple MS are highlighted.
                            this.addClassNameForEvent($eventRec,events[i].data.highlightClassNames);
                        }
                    }
                }
            }
        }.bind(this));
    },
    hideEvent:function(eventRec, classname){
        var $eventRec = $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +eventRec.get('id') + "']");
        if($eventRec.length == 0)
            var $eventRec = $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +eventRec.get('id') + "']");
        $eventRec.parents().eq(1).addClass("hideEventRec");
        //remove constraining and pen chain class names on this hidden task
        if(classname)
            $eventRec.removeClass(classname);

        $eventRec.hide();
        eventRec.data.isHiddenInView = true;
    },
    getVisibleResourceIds:function(){
        var resIds=[]
        this.resourceStore.each(function(res){
            if(this.resourceStore.isVisible(res))
                resIds.push(res.get('Id'));
        }.bind(this));
        return resIds;
    },
    getMsSheetRecord:function(resourceId){
        return Ext.getCmp('msGrid').getStore().findRecord('id',resourceId,0,false,true,true);
    },
    checkIfAllLongestPathsAreHidden:function(){
        var allUnchecked = true;
        Ext.getCmp('msGrid').getStore().each(function(rec){
            if(rec.get('longestPaths2')){
                allUnchecked = false;
                return;
            }
        });
        return allUnchecked;
    },
    showCommonEventsForOtherChains:function(MSsheetRecord, classname){
        var rs = this.resourceStore;
        var res = rs.findRecord('Id',MSsheetRecord.get('id'));        
        var eventsForRes = res.getEvents(this.eventStore);
        var hideNode = true;
        var visibleResIds = this.getVisibleResourceIds();
        var me= this;
        for(var i=0; i<eventsForRes.length; i++){
            var commonResourceIds = eventsForRes[i].get('commonResourceIds') || [];
            if(commonResourceIds.length>0){
                //since this event is common to other chains which are visible it cannot be hidden else it can be hidden
                if(_.intersection(visibleResIds,commonResourceIds).length>0){
                    hideNode = false;
                }
                else
                    this.hideEvent(eventsForRes[i], classname);
            }
            else{
                this.hideEvent(eventsForRes[i], classname);
            }
        }
        if(hideNode){
            var areAllPathsHidden = this.checkIfAllLongestPathsAreHidden();
            rs.hideNodesBy(function(node){
                if(!node.get('root')){
                    if(node.get('Id')==MSsheetRecord.get('id')){
                        return true;
                    }
                    //when all longestPaths are unchecked,rows containing tasks that belong to other rows should also be hidden
                    if(areAllPathsHidden){
                        return true;
                    }
                    else
                        return !rs.isVisible(node);
                }
                return true;
            }.bind(rs));
        }
    },
    onHighlightCCTasks: function () {
        var $tasks = $("#chainview .sch-timelineview table .sch-event", this.getEl().dom);
        $(this.getEl().dom).addClass("highlighting-cc");
        this.highlightCCLinks();
    },

    onHighlightPenChain: function () {
        stl.app.HighlightProjectPenChain(this.project);
    },

    onHighlightResourceContention: function () {
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        var resourceContentionData = CCSummaryStore.ResourceContentionData;
        var visibleTaskUid=[];
        var tasksArray=[];
        for (index = 0; index < resourceContentionData.length; index++) {
            var startTaskUID = resourceContentionData[index].StartActivityUID;
            var endTaskUID = resourceContentionData[index].EndActivityUID;
            tasksArray.push({"uid": startTaskUID});
            tasksArray.push({"uid": endTaskUID});
        }
        $.each($tasks, function (index, taskInfo) {            
            if (resourceContentionData) {
                for (index = 0; index < resourceContentionData.length; index++) {
                    var startTaskUID = resourceContentionData[index].StartActivityUID;
                    var endTaskUID = resourceContentionData[index].EndActivityUID;
                    var taskUid = taskInfo.getAttribute("data-task-uid");
                    if (taskUid == startTaskUID || taskUid == endTaskUID) {
                        var eventRec = this.eventStore.findRecord('id', taskUid, 0, false, true, true);
                        if(eventRec && visibleTaskUid.indexOf(taskUid) == -1){
                            $(taskInfo).addClass("resourceContentionTask");
                            if(eventRec.data.highlightClassNames.indexOf("resourceContentionTask") == -1)
                                eventRec.get('highlightClassNames').push("resourceContentionTask");
                            visibleTaskUid.push(taskUid);
                        }
                    }
                }
            }
        }.bind(this));
        this.showTasksNotInView(visibleTaskUid,tasksArray,false, false,null,"resourceContentionTask");
        setResourceGridRowClass(Ext.getCmp('resGrid').resourceContentionInGrid);
    },

    onHighlightSlack: function () {
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        this.highLightSlack($tasks, "data-task-uid");

        var $milestones = $("#chainview .timeline-milestone-header").find(".milestone-event");
        this.highLightSlack($milestones, "data-ms-uid");
    },

    highLightSlack: function (taskMsArr, matchParam) {
        var slackData = CCSummaryStore.SlackData;
        var visibleTaskUid=[];
        var tasksArray=[];
        if(matchParam == "data-task-uid"){
            for (index = 0; index < slackData.length; index++) {
                var fromTaskUID = slackData[index].FromActivityUID;
                var toTaskUID = slackData[index].ToActivityUID;
                if(slackData[index].FromActivity != "N/A")
                    tasksArray.push({"uid": fromTaskUID});
                if(slackData[index].ToActivity != "N/A")
                    tasksArray.push({"uid": toTaskUID});
            }
        }
        $.each(taskMsArr, function (index, itemInfo) {
            
            if (slackData) {
                for (index = 0; index < slackData.length; index++) {

                    var fromTaskUID = slackData[index].FromActivityUID;
                    var toTaskUID = slackData[index].ToActivityUID;
                    var itemUid = itemInfo.getAttribute(matchParam);

                    if (itemUid == fromTaskUID || itemUid == toTaskUID) {
                        var eventRec = this.eventStore.findRecord('id', itemUid, 0, false, true, true);
                        if(eventRec && visibleTaskUid.indexOf(itemUid) == -1){
                            $(itemInfo).addClass("slack");
                            if(eventRec.data.highlightClassNames.indexOf("slack") == -1)
                                eventRec.get('highlightClassNames').push("slack");
                            visibleTaskUid.push(itemUid);
                        }
                    }
                }
            }
        }.bind(this));
        if(matchParam == "data-task-uid")
            this.showTasksNotInView(visibleTaskUid,tasksArray,false, false,null,"slack");
    },

    onErrorHighlight: function (sender, id) {
       var taskUid = this.project.getTaskOrMilestoneUidById(id);
        var $highlightEl = $('#chain-view-taskMS-'+ taskUid);
        if($highlightEl) {
            if($highlightEl.hasClass('IMS-Milestone')){
                $highlightEl.closest('.sch-event-milestone.milestone').addClass("highlightedErrorTask"); 
            }else{
                $highlightEl.addClass("highlightedErrorTask");
            }
        }
    },

    getLinkId: function(link){
        var id;
        id = "ChainView" +link.fromModel.get("id") +"to"+ link.toModel.get("id");
        return id;
    },

    highlightCCLinks: function () {
        var me = this;
        if (!this.isVisible()) {
            this.pendingHighlightAction = this.highlightCCLinks.bind(this);
            return;
        }
        if (this.linksView) {
            var links = this.linksView.linksByID;
            $.each(links, function (index, link) {
                var toTask = link.to;
                var fromTask = link.from;
                var isLinkInCC = (toTask.hasClass("cc-task") && fromTask.hasClass("cc-task")) || (fromTask.hasClass("cc-task") && toTask.hasClass("PE-milestone"))
                if (isLinkInCC) {
                    me.linksView.setLinkColor(fromTask, toTask, "red");
                    me.linksView.setLinkZIndex(fromTask, toTask, 100);
                }
                // TODO highlight milestone links
            });

            
        }
        var color = "red";
        var me = this;
        if (me.milestoneLinks){
            this.highlightMilestoneLinks(color);
        }

        if (this.linksView){
            this.linksView.refresh();
        }
    },

    highlightPenChain: function (milestoneUId) {
        var penChainIDs = this.project.getPenChainID(milestoneUId);

        if (penChainIDs && penChainIDs != -1)
            for(var i=0; i<penChainIDs.length; i++)
                stl.app.HighlightPenChain(penChainIDs[i]);
    },
    removeHighlightChain:function(tasksArray, className){
        tasksArray.forEach(function(task){
            var eventRec = this.eventStore.findRecord('id',task.uid, 0, false, true,true);
            if(eventRec){
                if(eventRec.data.highlightClassNames.indexOf(className) != -1)
                    eventRec.get('highlightClassNames').splice(eventRec.data.highlightClassNames.indexOf(className), 1);
            }
        }.bind(this));
    },
    removeHighlightPenChain: function (milestoneUId) {
        var penChainIDs = this.project.getPenChainID(milestoneUId);        
        if (penChainIDs && penChainIDs != -1){
            for(var i=0; i<penChainIDs.length; i++){
                var chainColorId = stl.app.ProjectDataFromServer.getChainsColorMap()[penChainIDs[i]].colorId;
                var tasksForChainId = stl.app.ProjectDataFromServer.getTaskIdsAndMilestoneUIdForChainNumber(penChainIDs[i]).taskIds;    
                if(tasksForChainId && tasksForChainId.length >0){
                    tasksForChainId.forEach(function(taskId){
                        var eventRec = this.eventStore.findRecord('id',taskId, 0, false, true,true);
                        if(eventRec){
                            if(eventRec.data.highlightClassNames.indexOf("highlight-chain-" + chainColorId) != -1)
                                eventRec.get('highlightClassNames').splice(eventRec.data.highlightClassNames.indexOf("highlight-chain-" + chainColorId), 1);
                        }
                    }.bind(this));
                }
            }
        }
        if(chainColorId)
            return  "highlight-chain-"+chainColorId;   
    },

    onAllHighlightsCleared: function () {
        if (!this.isVisible()) {
            this.pendingHighlightAction = this.onAllHighlightsCleared.bind(this);
            this.clearHighlightsOnEvents();
            return;
        }
        if (this.linksView) {
            this.linksView.setAllLinkProperties(null, null);
        }

        if (this.milestoneLinks){
            this.removeMilestonelinksHighlight();
        }
    },

    removeMilestonelinksHighlight: function(){
        var color = this.MILESTONE_LINK_COLOR;
        var me =this;
        this.highlightMilestoneLinks(color);
    },

    highlightMilestoneLinks: function(color){
        var me = this;
        $.each( me.milestoneLinks, function (index, link) {
            var toTask = link.to;
            var fromTask = link.from;
            var isLinkInCC = (toTask.hasClass("cc-task") && fromTask.hasClass("cc-task")) || (fromTask.hasClass("cc-task") && toTask.hasClass("PE-milestone"))
            if (isLinkInCC) {
                /*this.linksView.setLinkColor(fromTask, toTask, "red");
                this.linksView.setLinkZIndex(fromTask, toTask, 100);*/
                var id = me.getLinkId(link);
                var elem = $("path#" + id )[0];
                //d3.select(elem).moveToFront();
                if (elem){

                    var identifer = link.fromModel.get("id") +"to"+ link.toModel.get("id");
                    var svg = d3.select('#ChainViewSvg'+identifer);
                    var normalArrowHeadID = me.linksView.getOrCreateArrowMarker(svg, color, true);
                    
                    link.oldColor = d3.select(elem).style("stroke");
                    d3.select(elem).transition().duration(200)
                    d3.select(elem).style("stroke",color);
                    d3.select(elem).attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                }
                
            }
            // TODO highlight milestone links
        } .bind(this));
    },


    highlightSelectedPenChain: function () {
        //find tasks in timeline view with current pen chain highlighted
        var selectedPenChainTasks = $(".matrix-view").find("*[class*='highlight-chain-']");
        if (selectedPenChainTasks.length > 0) {
            var lasthighlightChainClass="";
            //find highlight-chain- class
            for(var i=0; i<selectedPenChainTasks.length; i++){
                var highlightChainClassA = (/highlight-chain-[0-9]*/i.exec($(selectedPenChainTasks[i]).attr("class")));
                if (highlightChainClassA.length > 0) {
                    //find chain number
                    if(lasthighlightChainClass != highlightChainClassA[0]){
                        var classKeywordsA = highlightChainClassA[0].split("-");
                        var chainId = classKeywordsA[2];
                        stl.app.HighlightPenChain(chainId);
                        lasthighlightChainClass = highlightChainClassA[0];
                    }
                }
            }
        }
        else{
            if(stl.app.highlightedChainId && stl.app.highlightedChainId.length > 0){
                var isChecked = true;
                if(stl.app.isChainViewLoaded){
                    var msRec = Ext.getCmp('msGrid').getStore().findRecord('uid', stl.app.milestoneUIDForChainToBeHighlighted, 0 ,false, true, true);
                    if(msRec)
                        isChecked = msRec.get('longestPaths2');
                }
                for(var i=0; i<stl.app.highlightedChainId.length; i++){
                    stl.app.HighlightPenChain(stl.app.highlightedChainId[i], isChecked);
                }
            }
        }
    },

    highlightOnViewChange: function (className) {

        // FIXME should not be using matrix view directly here
        var me = this;

        var highlightedTasksElements = $(".matrix-view").find("." + className);
        var highlightedTaskData = [];
        if(highlightedTasksElements.length <=0)
            highlightedTaskData = stl.app.highlightedTasks;
        else{
            $.each(highlightedTasksElements, function (index, taskElement) {
                highlightedTaskData.push($(taskElement).data("model"));
            });
        }
        highlightedTaskData = me.tasksToBeHighlighted || highlightedTaskData;
        me.highlightChain(highlightedTaskData, className, null, true);

    },
    findResourceId:function(currentTaskUid){
        if(currentTaskUid){
            var eventStoreRec = this.eventStore.getById(currentTaskUid);
            if(eventStoreRec.get('ResourceId') == "timeline-milestone-row"){
                return Ext.getCmp('msGrid').getStore().findRecord('uid',currentTaskUid).get('id');
            }
            else
                return eventStore.get('ResourceId');
        }
        return null;
    },
    showTasksNotInView:function(visibleTaskUid,tasksArray,timelineviewRefreshReqd, viewchange,currentTaskUid,className){
        var hideEventsReq = false;
        var addClassNameReq = false;
        if(visibleTaskUid.length < tasksArray.length){
            var allTaskUid =[];
            for (i = 0; i < tasksArray.length; i++) {
                allTaskUid.push(tasksArray[i].uid);
            }
            var missedEvents = _.difference( allTaskUid, visibleTaskUid);
            for (i = 0; i < missedEvents.length && visibleTaskUid.length < tasksArray.length; i++) {
                if(visibleTaskUid.indexOf(missedEvents[i]) == -1){
                    var eventRec = this.eventStore.getById(missedEvents[i]);
                    if(eventRec){
                        var resource = eventRec.getResource();
                        if(!resource.get('visible')){
                            this.resourceStore.hideNodesBy(function(node){
                                if(!node.get('root')){
                                    if(node.get('Id')==resource.get('Id')){
                                        var msRec = this.getMsSheetRecord(node.get('Id'));
                                        if(msRec && !msRec.get('longestPaths2') && viewchange)
                                            msRec.set('longestPaths2',true);
                                        return false;
                                    }
                                        if(this.resourceStore.isVisible(node))
                                            hideEventsReq = true;
                                        return !this.resourceStore.isVisible(node);                             
                                }
                                return true;
                            }.bind(this));
                            timelineviewRefreshReqd = true;
                        }
                        //get events for this resource and show only those events that match with the id
                        var resEvents = resource.getEvents(this.eventStore);
                        for(var j=0; j<resEvents.length;j++){
                            if(missedEvents.indexOf(resEvents[j].get('id'))!= -1){
                                visibleTaskUid.push(resEvents[j].get('id'));
                                resEvents[j].data.isHiddenInView= false;
                                if(resEvents[j].data.isIMS){
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +resEvents[j].get('id') + "']").parents().eq(1).removeClass("hideEventRec");
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +resEvents[j].get('id') + "']").show();
                                }
                                else{
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +resEvents[j].get('id') + "']").parents().eq(1).removeClass("hideEventRec");
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +resEvents[j].get('id') + "']").show();
                                }
                            }
                            else{
                                resEvents[j].data.isHiddenInView = true;
                                if(resEvents[j].data.isIMS){
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +resEvents[j].get('id') + "']").parents().eq(1).addClass("hideEventRec");
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-ms-uid='" +resEvents[j].get('id') + "']").hide();
                                }
                                else{
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +resEvents[j].get('id') + "']").parents().eq(1).addClass("hideEventRec");
                                    $("#chainview .sch-timelineview table .sch-event").find("[data-task-uid='" +resEvents[j].get('id') + "']").hide();                            
                                }
                            }
                            timelineviewRefreshReqd = true;
                            addClassNameReq = true;
                        }
                    }
                    else{
                        this.addMissingTasksToEventStore(missedEvents[i],currentTaskUid,className,visibleTaskUid);
                        timelineviewRefreshReqd = true;
                        addClassNameReq = true;
                    }
                }
            }
            
        }
        if(hideEventsReq)
            this.hideEvents();
        if(addClassNameReq){            
            //adding a task to event store removing the highlight
            this.addClassNameForTasks(visibleTaskUid,className);
        }
        if(!hideEventsReq && timelineviewRefreshReqd)
            this.refreshLinksView();
    },
    addMissingTasksToEventStore:function(taskUID,currentTaskUid,className,visibleTaskUid){
        var events = this.eventStore.data.items;
        var task = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(taskUID);
        var resourceId = this.findResourceId(currentTaskUid);
        if(task){
            //create a new resource which is a child of the milestone resource
            if(resourceId == null){
                var selTask = stl.app.selectedTaskEl;
                var chainRow;
                if(selTask)
                    chainRow = this.resourceStore.findRecord('Id',selTask.get('id'),0, false, true, true);
                if(chainRow){
                    if(chainRow && msUid){
                        if(!chainRow.findChild('Id', chainRow.get('Id')+" child-"+ index)){
                            chainRow.appendChild({
                                'Id': chainRow.get('Id')+" child-"+ index,
                                'Name': chainId,
                                expandable: true,
                                expanded:  true,
                                rowModel: null,
                                children: []
                            });
                        }
                    }
                    resourceId = chainRow.get('Id')+" child-"+ index;
                }
                else{
                    var dummyRes = this.resourceStore.findRecord('Id','dummy',0,false,true,true);
                    if(!dummyRes){
                        var dummyResNew={
                            'Id': 'dummy',
                            'Name': '',
                            expandable: false,
                            expanded:  true,
                            rowModel: null,
                            children: []
                        };
                    }
                    resourceId = "dummy";
                }
            }
            if(task.isMS)
                var eventConfig = this.createEventConfigForMilestone(task,resourceId);
            else           
                var eventConfig = this.createEventConfigForTask(task,resourceId);
            var index = _.findIndex(events,function(evt){
                if(evt.id == eventConfig.id)
                    return true;
            });
            if(index == -1){
                eventConfig.isHiddenInView= false;
                this.eventStore.add(eventConfig);
                visibleTaskUid.push(taskUID);
                var taskEl = this.getSchedulingView().getElementFromEventRecord(eventConfig);
                if (taskEl) {
                    $(taskEl.dom).find(".task").addClass(className);
                    if(eventConfig.highlightClassNames.indexOf(className) == -1)
                        eventConfig.highlightClassNames.push(className);                       
                }
            }
            if(dummyResNew){
                this.resourceStore.getRoot().appendChild(dummyResNew);
            }
        }
    },
    highlightChain: function (tasksArray, className, currentTaskUid, viewchange) {
        var timelineView = Ext.getCmp("chainview");
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        var $internalMS = $("#chainview .sch-timelineview table .sch-event").find(".Internal-Milestone");
        var $ims_tasks = $("#chainview .sch-timelineview table .sch-event").find(".IMS-Milestone");
        var selTask = this.eventStore.getById(String($(stl.app.selectedTaskEl).find(".task").data("task-uid")));
        var visibleTaskUid=[];
        var timelineviewRefreshReqd=false;
        
        $.each($tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {                
                if (taskUid == tasksArray[i].uid && eventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);    
                    if(eventRec && eventRec.data.isHiddenInView == true){
                        eventRec.data.isHiddenInView = false;                        
                        $(taskInfo).parents().eq(1).removeClass("hideEventRec");
                        $(taskInfo).show();
                        timelineviewRefreshReqd = true;
                    }
                    $(taskInfo).addClass(className);
                    if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                        eventRec.get('highlightClassNames').push(className);
                    break;
                }
            }
        }.bind(this));
         $.each($ims_tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-ms-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {                
                if (taskUid == tasksArray[i].uid && eventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);    
                    if(eventRec && eventRec.data.isHiddenInView == true){
                        eventRec.data.isHiddenInView = false;                        
                        $(taskInfo).parents().eq(1).removeClass("hideEventRec");
                        $(taskInfo).show();
                        timelineviewRefreshReqd = true;
                    }
                    $(taskInfo).closest('.sch-event-milestone.milestone').addClass(className);
                    if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                        eventRec.get('highlightClassNames').push(className);
                    break;
                }
            }
        }.bind(this));
        $.each($internalMS, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            var MSeventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {                
                if (taskUid == tasksArray[i].uid && MSeventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    if(MSeventRec && MSeventRec.data.isHiddenInView == true)
                        MSeventRec.data.isHiddenInView = false;
                    break;
                }
            }
        }.bind(this));
        var $milestones = $(".milestone-event", this.getEl().dom);
        $.each($milestones, function (index, milestoneInfo) {
            for (i = 0; i < tasksArray.length; i++) {
                if ($(milestoneInfo).hasClass("milestone-uid-" + tasksArray[i].uid) && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    $(milestoneInfo).addClass(className);
                    break;
                }
            }

        });
        //show also the tasks that are in this chain but in a different row
        this.showTasksNotInView(visibleTaskUid,tasksArray,timelineviewRefreshReqd,viewchange,currentTaskUid,className);
    },

    //For a list of task UIds, apply or remove class className based on isChecked flag
    toggleHighlightChain: function (tasksArray, className, isChecked, msUid, index,chainId) {
        var timelineView = Ext.getCmp("chainview");
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        var $ims_tasks = $("#chainview .sch-timelineview table .sch-event").find(".IMS-Milestone");
        var $internalMS = $("#chainview .sch-timelineview table .sch-event").find(".Internal-Milestone");
        var selTask = Ext.getCmp('msGrid').getStore().findRecord('uid',msUid, 0, false, true, true);        
        var visibleTaskUid=[];
        var timelineviewRefreshReqd=false;
        $.each($tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {
                if (taskUid == tasksArray[i].uid && eventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    if (isChecked){
                        if(eventRec && eventRec.data.isHiddenInView == true){
                            eventRec.data.isHiddenInView = false;
                            $(taskInfo).parents().eq(1).removeClass("hideEventRec");
                            $(taskInfo).show();
                            timelineviewRefreshReqd = true;
                        }
                        $(taskInfo).closest(".sch-event").addClass(className);
                        if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                            eventRec.get('highlightClassNames').push(className);
                    }
                    else{
                        $(taskInfo).closest(".sch-event").removeClass(className);
                        $(taskInfo).removeClass(className);
                        if(eventRec.data.highlightClassNames.indexOf(className) != -1)
                            eventRec.get('highlightClassNames').splice(eventRec.data.highlightClassNames.indexOf(className),1);
                    }
                    break;
                }
            }
        }.bind(this));
        $.each($ims_tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-ms-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {
                if (taskUid == tasksArray[i].uid && eventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    if (isChecked){
                        if(eventRec && eventRec.data.isHiddenInView == true){
                            eventRec.data.isHiddenInView = false;
                            $(taskInfo).parents().eq(1).removeClass("hideEventRec");
                            $(taskInfo).show();
                            timelineviewRefreshReqd = true;
                        }
                        $(taskInfo).closest(".sch-event").addClass(className);
                        if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                            eventRec.get('highlightClassNames').push(className);
                    }
                    else{
                        $(taskInfo).closest(".sch-event").removeClass(className);
                        $(taskInfo).removeClass(className);
                        if(eventRec.data.highlightClassNames.indexOf(className) != -1)
                            eventRec.get('highlightClassNames').splice(eventRec.data.highlightClassNames.indexOf(className),1);
                    }
                    break;
                }
            }
        }.bind(this));
        $.each($internalMS, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            var MSeventRec = this.eventStore.findRecord('id',taskUid,0,false,true,true);
            for (i = 0; i < tasksArray.length; i++) {                
                if (taskUid == tasksArray[i].uid && MSeventRec && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    if(MSeventRec && MSeventRec.data.isHiddenInView == true)
                        MSeventRec.data.isHiddenInView = false;
                    break;
                }
            }
        }.bind(this));
        var $milestones = $(".milestone-event", this.getEl().dom);
        $.each($milestones, function (index, milestoneInfo) {
            for (i = 0; i < tasksArray.length; i++) {
                if ($(milestoneInfo).hasClass("milestone-uid-" + tasksArray[i].uid) && visibleTaskUid.indexOf(tasksArray[i].uid) == -1) {
                    visibleTaskUid.push(tasksArray[i].uid);
                    if (isChecked)
                        $(milestoneInfo).addClass(className);
                    else
                        $(milestoneInfo).removeClass(className);
                    break;
                }
            }
        });
        if(isChecked)
            this.showTasksNotInView(visibleTaskUid,tasksArray,timelineviewRefreshReqd,false,msUid,className);
    },

    onhighlightLongestPredecessorChain: function (sender, task) {
        var me = this;        
        var taskUID = $(task).find(".task").data("task-uid");
        var eventRec = this.eventStore.getById(taskUID);
        if(eventRec){
            var taskModel = eventRec.data.taskModel;
            var tasksInPredecessorChain = chainHighlightInstance.highlightLongestPredecessorChain(taskModel);
            if (tasksInPredecessorChain.length > 0) {
                me.tasksToBeHighlighted = tasksInPredecessorChain;
                me.highlightLongestPredecessorChainTasks(tasksInPredecessorChain, eventRec);
            }
        }        
    },


    highlightLongestPredecessorChainTasks: function (tasksToBeHighlighted, eventRec) {
        // var $tasks = $(".sch-timelineview table .sch-event", this.getEl().dom);
        var tasksPresent=[];
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        $.each($tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            for (i = 0; i < tasksToBeHighlighted.length; i++) {
                if (taskUid == tasksToBeHighlighted[i].uid) {
                    tasksPresent.push(i);
                    $(taskInfo).addClass("constrainingSuccessorTask");
                    break;
                }
            }
        });

        var $milestones = $(".milestone-event", this.getEl().dom);
        $.each($milestones, function (index, milestoneInfo) {

            for (i = 0; i < tasksToBeHighlighted.length; i++) {
                if ($(milestoneInfo).hasClass("milestone-uid-" + tasksToBeHighlighted[i].uid)) {
                    tasksPresent.push(i);
                    $(milestoneInfo).addClass("constrainingSuccessorTask");
                    break;
                }
            }

        });
        var events = this.eventStore.data.items;
        for(var i=0; i<tasksToBeHighlighted.length;i++){
            if(tasksPresent.indexOf(i)== -1){
                var task = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(tasksToBeHighlighted[i].uid);
            if(task){
                if(task.isMS)
                    var eventConfig = this.createEventConfigForMilestone(task,eventRec.get('ResourceId'));
                else           
                    var eventConfig = this.createEventConfigForTask(task,eventRec.get('ResourceId'));
                var index = _.findIndex(events,function(evt){
                    if(evt.id == eventConfig.id)
                        return true;
                });
                if(index == -1){
                    this.eventStore.add(eventConfig);
                    var taskEl = this.getSchedulingView().getElementFromEventRecord(eventConfig);
                    if (taskEl) {
                        $(taskEl.dom).find(".task").addClass("constrainingSuccessorTask");
                        return;
                    }
                }
            }
            }
        }
        var matrixView = $(".matrix-view").data("view");
        if(matrixView)//When timeline view is the landing page - matrix view is not initialized
            matrixView.highlightChain(tasksToBeHighlighted, false);

    },

    highlightConstrainingTasks: function ($taskEvent) {
        var taskuid = $taskEvent.find(".task").data("task-uid"),
            constrainingTaskIds = this.project.getConstrainingTasks(taskuid),
            schedView = this.getSchedulingView();
        var selTask = this.eventStore.getById(String(taskuid));
        // to format the tasks in the way that highlightOnViewChange can use them
        this.tasksToBeHighlighted = constrainingTaskIds.map(function (constrainingTaskId) {
            var task = {};
            task.uid = constrainingTaskId; // comparison happens on equality check with task.uid
            return task;
        });
        if(selTask){
            var events = this.eventStore.data.items;
            $.each(constrainingTaskIds, function (index, ctaskUid) {
                
                var task = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(ctaskUid);
                if(task){
                    if(task.isMS)
                        var eventConfig = this.createEventConfigForMilestone(task,selTask.get('ResourceId'));
                    else           
                        var eventConfig = this.createEventConfigForTask(task,selTask.get('ResourceId'));
                    var index = _.findIndex(events,function(evt){
                        if(evt.id == eventConfig.id)
                            return true;
                    });
                    if(index == -1){
                        this.eventStore.add(eventConfig);
                    }
                }
                var ctaskRec = this.eventStore.getById(String(ctaskUid)),
                    taskEl;
                if (ctaskRec) {
                    taskEl = schedView.getElementFromEventRecord(ctaskRec);
                    if (taskEl) {
                        $(taskEl.dom).find(".task").addClass("constrainingSuccessorTask");
                        return;
                    }
                }
                var $milestoneEl = $(".timeline-milestone-header .milestone-uid-" + ctaskUid, this.el.dom);
                if ($milestoneEl) {
                    $milestoneEl.addClass("constrainingSuccessorTask");
                }
            } .bind(this));
        }

        var matrixView = $(".matrix-view").data("view");
        if(matrixView)//When timeline view is the landing page - matrix view is not initialized
            matrixView.highlightChain(constrainingTaskIds, true);
    },
    addClassNameForTasks:function(tasksUid,className){
        var timelineView = Ext.getCmp("chainview");
        var $tasks = $("#chainview .sch-timelineview table .sch-event").find(".task");
        var $internalMS = $("#chainview .sch-timelineview table .sch-event").find(".Internal-Milestone");
        var $ims_tasks = $("#chainview .sch-timelineview table .sch-event").find(".IMS-Milestone");
        $.each($tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid, 0, false, true, true);
            this.addClassNameForEvent($(taskInfo),eventRec.data.highlightClassNames);  
            for (i = 0; i < tasksUid.length; i++) {
                if (taskUid == tasksUid[i]) {
                    $(taskInfo).addClass(className);
                    if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                        eventRec.get('highlightClassNames').push(className);
                    break;
                }
            }
        }.bind(this));
         $.each($ims_tasks, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-ms-uid");
            var eventRec = this.eventStore.findRecord('id',taskUid, 0, false, true, true);
            this.addClassNameForEvent($(taskInfo),eventRec.data.highlightClassNames); 
            for (i = 0; i < tasksUid.length; i++) {                
                if (taskUid == tasksUid[i]) {
                    var eventRec = this.eventStore.findRecord('id',taskUid, 0, false, true, true);
                    $(taskInfo).addClass(className);
                    if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                        eventRec.get('highlightClassNames').push(className);
                    break;
                }
            }
        }.bind(this));
        $.each($internalMS, function (index, taskInfo) {
            var taskUid = taskInfo.getAttribute("data-task-uid");
            for (i = 0; i < tasksUid.length; i++) {                
                if (taskUid == tasksUid[i]) {
                   $(taskInfo).addClass(className);
                }
            }
        }.bind(this));
        var $milestones = $(".milestone-event", this.getEl().dom);
        $.each($milestones, function (index, milestoneInfo) {
            for (i = 0; i < tasksUid.length; i++) {
                if ($(milestoneInfo).hasClass("milestone-uid-" + tasksUid[i])) {
                    $(milestoneInfo).addClass(className);
                    break;
                }
            }
        });
    },
    addClassNameForEvent:function($event,classNames){
        classNames.forEach(function(className){
            $event.addClass(className);
        })
    },

    checkIfElementInViewingArea: function(bounds){
        var win = $(window);
        var viewport = {
            top : win.scrollTop() + 70,
            left : win.scrollLeft() + 180
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var isVisible = false;
        if (((bounds.left > viewport.left && bounds.left < viewport.right) || (bounds.right > viewport.left && bounds.right < viewport.right))&&(( bounds.top > viewport.top && bounds.top < viewport.bottom) || (bounds.bottom > viewport.top && bounds.bottom < viewport.bottom))) {
           
            isVisible = true;
        }

        return isVisible;


    },

    getAllTaskElementsInTimelineBody: function(){
        var allTasks = this.project.getAllTasks();
        var allTaskElements = [];
        var timeline = this;
        var schedulingView = this.getSchedulingView();
        _.each(allTasks, function(task){
            var uid = task.uid;
            var rec = timeline.eventStore.getById(uid);

            if (rec){
                var taskRec = schedulingView.getElementFromEventRecord(rec);
            }
            
            var task;
            if (taskRec){
                task = taskRec.dom;
            } else {
                task = $(".timeline-milestone-header .milestone-uid-" + uid, timeline.el.dom);
            }
            if ($(task).length > 0){
                allTaskElements.push($(task)[0]);
            }
        });
        return $(allTaskElements);
    },

    getTasksInViewPort: function(){

        var start = Date.now();
        var win = $(window);
        var allTaskElements = this.project ? this.getAllTaskElementsInTimelineBody() : [];/*
        var tasks = $(".sch-timelineview table .sch-event").find(".task")
        var milestonesInTimelineBody = $(".sch-timelineview table .sch-event").closest(".milestone");
        if (milestonesInTimelineBody.length > 0){
            tasks = tasks.add(milestonesInTimelineBody);
        }
        
        var milestones = $(".milestone-event", this.getEl().dom);
        var len = tasks.length;
        for(i=0; i<len; i++){
            allTaskElements.push(tasks[i]);
        }
        len = milestones.length;
        for(i=0; i<len; i++){
            allTaskElements.push(milestones[i]);
        }*/

        var viewport = {
            top : win.scrollTop(),
            left : win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var applicableTaskElements = [];
        var tempObj ={};
        var timeline = this;
        var objTempLocation = {};
        
        var filteredTaskElements = _.filter(allTaskElements, function(elem){
            var bounds = elem.getBoundingClientRect();
            var isVisible = false;
            var taskData;
            var element 
            if ($(elem).find("div[data-ms-uid]").length > 0){
                element = $(elem).find("div[data-ms-uid]")[0];
            } else if ($(elem).find("div[data-task-uid]").length > 0){
                element = $(elem).find("div[data-task-uid]")[0];
            } else {
                element = $(elem).closest("div[data-ms-uid]")[0];
            }
            var id = element.getAttribute("data-task-uid") || element.getAttribute("data-ms-uid");
            objTempLocation[id] = bounds;
            if (timeline.checkIfElementInViewingArea(bounds)){//taskInfo.getAttribute("data-task-uid")//data-ms-uid
                if (element.getAttribute("data-task-uid")){
                    //taskData = $(elem).data("model");
                    var uid = element.getAttribute("data-task-uid");
                } else if (element.getAttribute("data-ms-uid")){
                    //taskData = $(elem).parent().data("model");
                    var uid = element.getAttribute("data-ms-uid");
                }
                tempObj[uid] = "test";
                isVisible = true;
            }
            
            return isVisible;
        });
        //applicableTaskElements = applicableTaskElements.concat(filteredTaskElements);
        var schedulingView = this.getSchedulingView();
        stl.app.ElementLocationInTimelineByUid = objTempLocation;
        
        
        _.each(filteredTaskElements, function(elem){
            var element 
            if ($(elem).find("div[data-ms-uid]").length > 0){
                element = $(elem).find("div[data-ms-uid]")[0];
            } else if ($(elem).find("div[data-task-uid]").length > 0){
                element = $(elem).find("div[data-task-uid]")[0];
            } else {
                element = $(elem).closest("div[data-ms-uid]")[0];
            }
            var taskUid = element.getAttribute("data-task-uid") ? element.getAttribute("data-task-uid") : element.getAttribute("data-ms-uid");
            //var taskData = timeline.eventStore.findRecord("id",taskUid,0,false, true, true)
            applicableTaskElements.push($(elem));
            var immediateTasksIds = timeline.getImmediatePredecessorAndSuccessorOfTask(taskUid, tempObj);
            var immediateTasks = [];
            _.each(immediateTasksIds, function(uid){
                var rec = timeline.eventStore.getById(uid);

                if (rec){
                    var taskRec = schedulingView.getElementFromEventRecord(rec);
                }
                
                var task;
                if (taskRec){
                    task = taskRec.dom;
                } else {
                    task = $(".timeline-milestone-header .milestone-uid-" + uid, timeline.el.dom);
                }
                if ($(task).length > 0){
                    immediateTasks.push($(task));
                }
                
            })
            applicableTaskElements = applicableTaskElements.concat(immediateTasks);
        });

        this.linkableElemIds = [];
        var tm = this;
        _.each(Object.keys(tempObj), function(key){
            tm.linkableElemIds.push(key);
        });

        tempObj = null;
        var linkableElems = [];
        _.each(applicableTaskElements, function(elem){
            
            linkableElems.push($(elem)[0]);
        });

        return $(linkableElems);
    },

    getImmediatePredecessorAndSuccessorOfTask: function(taskUid, addedElementListObj){
        
        var uids = [];
        var tasks = [];
        var matrix = this;
        var _predecessors = stl.app.PredecessorMap[taskUid];
        _.each(_predecessors, function(item){
            if (!addedElementListObj[item.from]){
                addedElementListObj[item.from] = item;
                uids.push(item.from);
            }
            
        });
        var _successors = stl.app.SuccessorMap[taskUid];
        _.each(_successors, function(item){
            if (!addedElementListObj[item.to]){
                addedElementListObj[item.to] = item;
                uids.push(item.to);
            }
        });

        /*_.each(uids, function(uid){
            if (matrix.getTaskElementByUid(uid)){
                tasks.push($(matrix.getTaskElementByUid(uid))[0]);
            } else if (matrix.getMilestoneElementByUid(uid)){
                var linkableElem = $(matrix.getMilestoneElementByUid(uid)).find(".ms-content-wrap");
                tasks.push(linkableElem[0]);
            }
        });*/

        return uids;
    },

    /*getTasksInViewPort: function(allTaskElements){
        var taskElements = [];
        
        var win = $(window);
    
        var viewport = {
            top : win.scrollTop(),
            left : win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        
        var filteredTaskElements = _.filter(allTaskElements, function(elem){
            var bounds = elem.getBoundingClientRect();
            return bounds.left > viewport.left && bounds.right < viewport.right && bounds.top > viewport.top && bounds.bottom < viewport.bottom;
        });



        console.log("TM VIEW:" + filteredTaskElements.length);
        return $(filteredTaskElements);
    },*/

    checkIfElementVisible: function(elt){
        var isVisible = false;
        var win = $(window);
    
        var viewport = {
            top : win.scrollTop(),
            left : win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        
        var bounds = elt[0].getBoundingClientRect();

        if (bounds.left > viewport.left && bounds.right < viewport.right && bounds.top > viewport.top && bounds.bottom < viewport.bottom){
            isVisible = true;
        }

        return isVisible;
    },

    showRefreshLinksNotifier: function() {
        if (stl.app.getCurrentViewId() !== TABLE_VIEW_ID && this.visible) {
            showToolbarNotifier(DRAWING_DEPENDENCIES + PLEASE_WAIT);
        }
    },
    /**
    * Immediately forces a refresh of the LinksView.  You should never need to call this method.
    * Instead, call refreshLinksView, which is a throttled version of this method.
    */
    refreshLinksViewImmediate: function (isMSLinksOnly) {
        if (!this.isVisible()) {
            // refreshLinksView will be called by onShow next time the timeline view becomes visible
            this.pendingHighlightAction = null;
            return;
        }
        this.showRefreshLinksNotifier();
        // Can't include links to milestones here, because the milestones scroll separately from the events
        if (!this.getEl()) return;
        var schedulingView = this.getSchedulingView();
        
        //this.linksView.showRefreshLinksNotifier();
        var $from,
            $to;
        this.milestoneLinks = [];
        var tm = this;
        var project = this.project;
        var applicableLinks = [];
        var applicableLinks = [];
        var tempObjLinks = {};
        var linkableElem = this.linkableElemIds;
        _.each(linkableElem, function(uid){
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
        
        var timelineView = this;
        this.taskLinks = [];
        if (this.project) {
            
            var me= this;          
                _.each(applicableLinks, function(link){
                

                var    fromMilestone = false,
                    toMilestone = false,
                    fromTaskVisible = false,
                    toTaskVisible = false,
                    fromRec = me.eventStore.getById(link.from),
                    fromEventEl = (fromRec ? schedulingView.getElementFromEventRecord(fromRec) : null),
                    toRec = me.eventStore.getById(link.to),
                    toEventEl = (toRec ? schedulingView.getElementFromEventRecord(toRec) : null);
                if (fromEventEl) {
                    $from = $(fromEventEl.dom);
                    //VMM- on collapse of scope node some tasks are made hidden and this classes is added
                    // through eventRenderer
                    if (!$from.hasClass("hideEventRec")) {
                        fromTaskVisible = true;
                    }
                } else {
                    $from = $(".timeline-milestone-header .milestone-uid-" + link.from, me.el.dom);
                    fromMilestone = true;
                }
                if (toEventEl) {
                    $to = $(toEventEl.dom);
                    //VMM- on collapse of scope node some tasks are made hidden and this classes is added
                    // through eventRenderer
                    if (!$to.hasClass("hideEventRec")) {
                        toTaskVisible = true;
                    }
                } else {
                    $to = $(".timeline-milestone-header .milestone-uid-" + link.to, me.el.dom);
                    toMilestone = true;
                }
                if ($from && $to && $from.length > 0 && $to.length > 0) {
                    if (timelineView.checkIfElementVisible($from) || timelineView.checkIfElementVisible($to)){
                       if (fromMilestone || toMilestone) {
                            me.milestoneLinks.push({
                                from: $from,
                                to: $to,
                                fromMilestone: fromMilestone,
                                toMilestone: toMilestone,
                                fromModel: fromRec,
                                toModel: toRec
                            });
                        } else if(!isMSLinksOnly){
                                if (fromTaskVisible && toTaskVisible){
                                    me.taskLinks.push({
                                        from: $from,
                                        to: $to,
                                        fromRec: fromRec,
                                        toRec: toRec
                                    })
                                    
                                }
                        } 
                    }
                    
                    

                    
                }
            });
            
        }
        this.refreshMilestoneLinks();
        this.refreshTaskLinks();
        if ($(this.getEl().dom).hasClass("highlighting-cc")) {
            this.highlightCCLinks();
        }
        if ($(".linksDeleteDialog").length > 0){
            stl.app.highlightLinkSelectedForDelete();
        }
        this.linksViewRendered = true;
    },

    refreshTaskLinks: function(){
        var $nonLockedGridView = $(".sch-timelineview", this.getEl().dom), //$(".x-panel", this.el.dom).eq(1),
            $linkableElements = $nonLockedGridView.find(".sch-event");
        //.add($(".timeline-milestone-header .milestone-event"));
        if (this.linksView)
            this.linksView = null;
        if (!this.linksView) {
            var elems = this.getTasksInViewPort();
            this.linksView = new stl.view.Links({
                container: $nonLockedGridView,
                elements: elems,
                visible: $(".toggle-links-button").hasClass("pressed")
            });
            this.linksView.addLinkIds($linkableElements);
            this.linksView.addElements(elems);
            //this.linksView.showRefreshLinksNotifier();
            this.linksView.setOutEndpointOffsets(this.TASK_OUT_ENDPOINT_OFFSETS);
        } 
        
        var me = this;
        _.each(this.taskLinks, function(link){
            me.linksView.addConnection(link.from, link.to);
            me.linksView.updateIdMapForTMElements(link.from, link.fromRec.get("id"));
            me.linksView.updateIdMapForTMElements(link.to, link.toRec.get("id"));
        })
        this.linksView.triggerRefresh();
    },

    /**
    * Milestone links are managed separately from LinksView -- since they must move as the user scrolls (milestones are in
    * a different scroll window than tasks), we don't route around anything.  Instead we just draw a smooth line that we can
    * quickly redraw during scroll.
    */
    refreshMilestoneLinks: function () {
        var me = this,
            $scrollingViewContainer = $(this.getSchedulingView().getEl().dom).closest(".x-panel"),
            $existingLinks = $scrollingViewContainer.find(".milestone-link"),
            $taskArea = $(this.getSchedulingView().getEl().dom).closest("#chainview .sch-timelineview"),
            containerOffset = $scrollingViewContainer.offset(),
            taskAreaYStart = $taskArea.offset().top - containerOffset.top,
            taskAreaYEnd = taskAreaYStart + $taskArea.height();
        $existingLinks.remove();
        if (!$(".toggle-links-button").hasClass("pressed")) {
            return;
        }
        var $milestoneLinks = $();
        if (!this.milestoneLinks) return;
        for (var i = 0; i < this.milestoneLinks.length; i++) {
            // Render link to/from a milestone
            var linkInfo = this.milestoneLinks[i];
            var fromElOffset = linkInfo.from.offset(),
                toElOffset = linkInfo.to.offset(),
                fromRightEdge = fromElOffset.left - containerOffset.left + linkInfo.from.width(),
                fromYMidpoint = fromElOffset.top - containerOffset.top + (linkInfo.from.height() / 2),
                toLeftEdge = toElOffset.left - containerOffset.left,
                toYBottomEdge = toElOffset.top - containerOffset.top + linkInfo.to.height(),
                toXBottomEdge = toElOffset.left - containerOffset.left + (linkInfo.to.width() / 2),
                toYMidpoint = toElOffset.top - containerOffset.top + (linkInfo.to.height() / 2),
                fromId = linkInfo.fromModel.get("id"),
                toId = linkInfo.toModel.get("id"),
                svg = d3.select($scrollingViewContainer[0]).append("svg")
                .attr("id","ChainViewSvg"+fromId+"to"+toId),
                deltaY = toYMidpoint - fromYMidpoint;
                this.linksView.updateLinkSVGAttributes(svg, LINK_MILESTONE_LINK_CLS);
            // Skip links to/from tasks that are scrolled out of view vertically
            if ((!linkInfo.fromMilestone && (fromYMidpoint < taskAreaYStart)) || (!linkInfo.toMilestone && (toYMidpoint < taskAreaYStart))) {
                continue;
            }
            fromRightEdge += (linkInfo.fromMilestone ? 0 : this.TASK_OUT_ENDPOINT_OFFSETS.x);

            color = this.MILESTONE_LINK_COLOR;
            var path = [{
                // Start at right midpoint of source task/milestone
                x: fromRightEdge,
                y: fromYMidpoint
            }, {
                // 20 pixels left of end point
                x: toXBottomEdge,//toLeftEdge - 20,
                y: fromYMidpoint//toYMidpoint
            }, {
                // End at left midpoint of target task/milestone
                x: toXBottomEdge,//toLeftEdge,
                y: toYBottomEdge//toYMidpoint
            }],
                normalArrowHeadID = this.linksView.getOrCreateArrowMarker(svg, color, true),
                highlightArrowHeadID = this.linksView.getOrCreateArrowMarker(svg, this.MILESTONE_LINK_HIGHLIGHT_COLOR, true);
            var me = this;
            var lineGraph = svg.append("path")
                .attr("class", "link-path")
                .attr("d", this.D3_LINE_FUNCTION(path))
                .attr("stroke", color)
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                .attr("id", "ChainView" +fromId +"to"+toId)
                .on("mouseenter", function () {
                    d3.select(this).moveToFront();
                    if(Ext.isIE){
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", me.MILESTONE_LINK_HIGHLIGHT_COLOR)                 
                        .transition()
                        .delay(1500)
                        .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                        .style("stroke", color);
                    }
                    else{
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", me.MILESTONE_LINK_HIGHLIGHT_COLOR);
                    } 
                        
                })
                .on("dblclick", function(){
                    //alert("clicked");
                    var event = event ? event : window.event;
                    //event.preventDefault();
                    d3.select(this).moveToFront();
                    if(Ext.isIE){
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", me.MILESTONE_LINK_HIGHLIGHT_COLOR)                 
                        .transition()
                        .delay(1500)
                        .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                        .style("stroke", color);
                    }
                    else{
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", me.MILESTONE_LINK_HIGHLIGHT_COLOR);
                    }   
                    stl.app.getLinksDeleteDialog(d3.select(this).attr("id"));



                })
                .on("mouseleave", function () {
                    var selection = stl.app.getCurrentHighLightOption();
                    var arrowhead = normalArrowHeadID;
                    if (!stl.app.IsLinkSelectedForDelete(d3.select(this).attr("id"))){
                        if (selection == CC_TASKS && me.project.checkIfLinkInCriticalChain(d3.select(this).attr("id"))) {
                            color = "red";
                            arrowhead = highlightArrowHeadID;
                        } else {
                            color = me.MILESTONE_LINK_COLOR;
                        }

                        d3.select(this)
                            .attr("marker-end", "url(\#" + arrowhead + ")")
                            .transition().duration(200)
                            .style("stroke", color);
                    }
                });
            $milestoneLinks = $milestoneLinks.add(svg[0]);
        }
        this.$milestoneLinks = $milestoneLinks;
        
        //this.linksView.triggerRefresh();
    },

    setZoomLevel: function (zoomLevel) {
        // Each view needs to manage zoom button enabled status separately as there may be a different # of zoom levels
        if (zoomLevel === 0) {
            $(".zoom-button.zoom-out").addClass("disabled");
        } else {
            $(".zoom-button.zoom-out").removeClass("disabled");
        }
        if (zoomLevel === this.zoomLevels.length - 1) {
            $(".zoom-button.zoom-in").addClass("disabled");
        } else {
            $(".zoom-button.zoom-in").removeClass("disabled");
        }
        var zoomLevelObj = this.zoomLevels[zoomLevel];
        if (zoomLevelObj != undefined && zoomLevelObj.preset === "multipleYear" && zoomLevelObj.width != zoomLevelObj.actualWidth && zoomLevelObj.width != this.timeAxisViewModel.tickWidth) {
            this.configureWidthMultipleYear(zoomLevel);
        }
        this.zoomToLevel(zoomLevel, {
            start: Sch.util.Date.add(this.projectStartDate, Sch.util.Date.DAY, -10),
            end: Sch.util.Date.add(this.projectEndDate, Sch.util.Date.DAY, 10)
        });
        this.zoomLevel = zoomLevel;
        this.hideEvents();
    },

    configureWidthMultipleYear: function (zoomLevel) {
        var zoomLevelObj = this.zoomLevels[zoomLevel];
        if (zoomLevelObj.width != zoomLevelObj.actualWidth && zoomLevelObj.width != this.timeAxisViewModel.tickWidth) {
            zoomLevelObj.width = this.timeAxisViewModel.tickWidth;
        }
    },
    onAppViewChange: function (evt, newViewId) {
        if (newViewId === "chainview") {
            this.setZoomLevel(this.zoomLevel);
        }
    },

    onZoomIn: function (evt) {
        // TODO remove dependency on global var
        if (window.currentViewId !== "chainview") return;
        if (this.zoomLevel < this.zoomLevels.length - 1) {
            this.setZoomLevel(this.zoomLevel + 1);
        }
    },

    onZoomOut: function (evt) {
        // TODO remove dependency on global var
        if (window.currentViewId !== "chainview") return;
        if (this.zoomLevel > 0) {
            this.setZoomLevel(this.zoomLevel - 1);
        }
    },

    onTaskChangeAtPhaseLevel: function (evt, sender, tasks) {
        var me = this;
        _.each(tasks, function (task, idx) {
            if (task.isSummary) return;
            var eventRec = me.eventStore.getById(task.uid);
            // eventMsRec = this.eventStore.getById(task.uid + "-ms");
            if (eventRec) {
                //FIXME: need a better way to distinguish milestones
                //only milestones and PP in milestone phase are visible in frozen header
             var isMilestone = task.isMS,
                newConfig = isMilestone ?
                me.createEventConfigForMilestone(task,eventRec.get('ResourceId')) :
                me.createEventConfigForTask(task,eventRec.get('ResourceId'));
                $.extend(eventRec.data, newConfig);
                eventRec.set(newConfig);
                var el = me.getSchedulingView().getElementFromEventRecord(eventRec),
                colorMap = me.project.getResourceColorMap();
                if (el) {
                    var $el = $(el.dom),
                    classNames = $el.attr('class').split(/\s+/);
                    classNames.forEach(function (className) {
                        if (className.indexOf("has-resource-") >= 0) {
                            $el.removeClass(className);
                        }
                        if (className.indexOf("has-phase-") >= 0)
                            $el.removeClass(className);
                        if (className.indexOf("has-task-manager-") >= 0)
                            $el.removeClass(className);
                    });
                    if (task.taskType == 'normal') {
                        $el.addClass("has-phase-" + stringToHex(task.phaseId));
                        $el.addClass("has-phase-" + stringToHex(me.project.getPhaseById(task.phaseId).name.replace(/ /g, '')));
                    }
                    if (task.manager)
                        $el.addClass("has-task-manager-" + stringToHex(task.manager.replace(/ /g,'')));
                    if (task.resources) {
                        task.resources.forEach(function (assignedResource) {
                            //$el.addClass("has-resource-" + colorMap[assignedResource.resourceId]);
                            $el.addClass("has-resource-" + assignedResource.resourceId);
                        });
                    }
                    if (task.isCritical) {
                        $el.addClass("cc-task");
                    }
                }
            }
        });

        this.handleHighlightDropdownSelection();
    },

    onUpdateResourcesDeleted: function (evt, sender, tasks) {
        var me = this;
        _.each(tasks, function (task, idx) {
            if (task.isSummary) return;
            var eventRec = me.eventStore.getById(task.uid);
            // eventMsRec = this.eventStore.getById(task.uid + "-ms");
            if (eventRec) {
                //FIXME: need a better way to distinguish milestones
                //only milestones and PP in milestone phase are visible in frozen header

                // var isMilestone = this.project.getPhaseById(task.phaseId).type === "milestone" && task.bufferType === "None";
                var isMilestone = task.isMS,
            newConfig = isMilestone ?
                me.createEventConfigForMilestone(task,eventRec.get('ResourceId')) :
                me.createEventConfigForTask(task,eventRec.get('ResourceId'));
                $.extend(eventRec.data, newConfig);
                eventRec.set(newConfig);
                var el = me.getSchedulingView().getElementFromEventRecord(eventRec),
                colorMap = me.project.getResourceColorMap();
                if (el) {
                    var $el = $(el.dom),
                    classNames = $el.attr('class').split(/\s+/);
                    classNames.forEach(function (className) {
                        if (className.indexOf("has-resource-") >= 0) {
                            $el.removeClass(className);
                        }
                        if (className.indexOf("has-phase-") >= 0)
                            $el.removeClass(className);
                        if (className.indexOf("has-task-manager-") >= 0)
                            $el.removeClass(className);
                    });
                    if (task.taskType == 'normal') {
                        $el.addClass("has-phase-" + stringToHex(task.phaseId));
                        $el.addClass("has-phase-" + stringToHex(me.project.getPhaseById(task.phaseId).name.replace(/ /g, '')));
                    }
                    if (task.manager)
                        $el.addClass("has-task-manager-" + stringToHex(task.manager.replace(/ /g,'')));
                    if (task.resources) {
                        task.resources.forEach(function (assignedResource) {
                            //$el.addClass("has-resource-" + colorMap[assignedResource.resourceId]);
                            $el.addClass("has-resource-" + assignedResource.resourceId);
                        });
                    }
                    if (task.isCritical) {
                        $el.addClass("cc-task");
                    }
                }
            }
        });

        this.handleHighlightDropdownSelection();
    },

    onTaskChange: function (evt, sender, task) {
        // if (sender === this) return;
        // this.eventStore.suspendEvents(true);
        var eventRec = this.eventStore.getById(task.uid);
        // eventMsRec = this.eventStore.getById(task.uid + "-ms");
        if (eventRec) {
            //FIXME: need a better way to distinguish milestones
            //only milestones and PP in milestone phase are visible in frozen header
            var isMilestone = task.isMS,
            newConfig = isMilestone ?
                this.createEventConfigForMilestone(task,eventRec.get('ResourceId')) :
                this.createEventConfigForTask(task,eventRec.get('ResourceId'));
        //[VK] this is required to show CMS in milestone row and IMS in task row when IMS is converted to CMS and viceversa
            if(isMilestone && (eventRec.data.isIMS || newConfig.isIMS)){
                this.eventStore.remove(eventRec);
                this.eventStore.add(newConfig);
            }
            else{
                $.extend(eventRec.data, newConfig);
                eventRec.set(newConfig);
            }
            var el = this.getSchedulingView().getElementFromEventRecord(eventRec),
                colorMap = this.project.getResourceColorMap();
            if (el) {
                var $el = $(el.dom),
                    classNames = $el.attr('class').split(/\s+/);
                $el.find('.task-name .task-name-text').html(newConfig.Name);
                classNames.forEach(function (className) {
                    if (className.indexOf("has-resource-") >= 0) {
                        $el.removeClass(className);
                    }
                    if (className.indexOf("has-phase-") >= 0)
                        $el.removeClass(className);
                    if (className.indexOf("has-task-manager-") >= 0)
                        $el.removeClass(className);
                });
                if (task.taskType == 'normal') {
                    $el.addClass("has-phase-" + stringToHex(task.phaseId));
                    $el.addClass("has-phase-" + stringToHex(this.project.getPhaseById(task.phaseId).name.replace(/ /g, '')));
                }
                if (task.manager)
                    $el.addClass("has-task-manager-" + task.manager);
                if (task.resources) {
                    task.resources.forEach(function (assignedResource) {
                        //$el.addClass("has-resource-" + colorMap[assignedResource.resourceId]);
                        $el.addClass("has-resource-" + assignedResource.resourceId);
                    });
                }
                if (task.isCritical) {
                    $el.addClass("cc-task");
                }
                if(sender==this){
                    this.processZeroDurationTask(task,el);
                }
            }
        }
        this.handleHighlightDropdownSelection();
    },
    //This function is used only when nonzero duration task is converted to zero duration or vice versa in Timeline view
    processZeroDurationTask:function(task,el){
        if(this.project.checkIfZeroDurationTask(task)){                            
            var taskHasQuickEdit =$(el.dom).hasClass('quick-task-edit');                
            if(taskHasQuickEdit ){
                if($(el.dom).hasClass("zero-duration-task")){
                    Ext.fly(el.dom).removeCls('zero-duration-task');
                }
            }
            else{
                if(! $(el.dom).hasClass("zero-duration-task")){
                    Ext.fly(el.dom).addCls('zero-duration-task');
                }
            }
        }
        else{
            if($(el.dom).hasClass("zero-duration-task")){
                Ext.fly(el.dom).removeCls('zero-duration-task');
            }
        }
        this.refreshLinksView();
    },
    onTaskAdd: function (evt, sender, task, scope, phase, $row) {
        if (sender === this) return;
        var dummyRes = this.resourceStore.findRecord('Id','dummy',0,false,true,true);
        if(!dummyRes){
            this.resourceStore.add({
                'Id': 'dummy',
                'Name': '',
                expandable: false,
                expanded:  true,
                rowModel: null,
                children: []
            });
        }
        this.eventStore.add(this.createEventConfigForTask(task,'dummy'));
        //this.requestReschedule();
    },

    onTaskRemove: function (evt, sender, task, parentRow_id, phase_id) {
        // Removing the rec from the store - VK
        // Handles all task deletion, including locally from timeline view
        var id = task.uid;
        var eventRec = this.eventStore.getById(id);
        if (eventRec) {
            this.eventStore.remove(eventRec);
            Ext.getBody().unmask();
        }
        //this.requestReschedule();
        if ((task.bufferType === "CCCB") ||
            (task.bufferType === "CMSB") ||
            (task.bufferType === "CCFB")) {
            this.project.isIDCCed = false;
        }
    },

    onAcceptPlan: function (evt, sender, milestones) {
        var me = this;
        _.each(milestones, function (ms, idx) {
            var eventRec = me.eventStore.getById(ms.uid);
            if (eventRec) {
                eventRec.data.date1 = ms.date1;
            }
        });
        setTimeout(function () {
            this.down('timeaxiscolumn').refresh();
        } .bind(this), 0);

    },


    onExpandAllScopeNodes: function () {
        var Node;
        var me = this;
        _.each(this.project.rows, function (row, idx) {
            Node = me.resourceStore.getRoot().findChild("Id", row.uid, true);
            if (!Node.get("expanded")) {
                Node.expand(false);
            }
        });

    },

    onExpandScopeNode: function (evt, sender, rowUid) {
        if (sender == this) return;

        var Node = this.resourceStore.getRoot().findChild("Id", rowUid, true);
        if (!Node.get("expanded")) {
            Node.expand(false);
        } else return;

    },

    onCollapseScopeNode: function (evt, sender, rowUid) {
        if (sender == this) return;

        var Node = this.resourceStore.getRoot().findChild("Id", rowUid, true);
        if (Node.childNodes.length > 0 && Node.get("expanded")) {
            Node.collapse(false);
        } else return;
    },


    onRowAdd: function (evt, sender, rowModel, phases, insertType, selectedNode) {
        if (sender === this) return;
        var dataNode;
        var selectedIdx;
        var selectedRowId;
        var parentNode;
        var referenceNode;
        if (selectedNode.get("data").uid != Ext.getCmp('scopeItemTree').getRootNode().get("data").uid) {
            selectedRowId = Number(selectedNode.data.data.uid);
            parentNode = this.resourceStore.getRoot(); //Project
            referenceNode = this.resourceStore.getRoot().findChild("Id", selectedRowId, true);
            selectedIdx = referenceNode.parentNode.indexOf(referenceNode);
        } else {
            referenceNode = this.resourceStore.getRoot();

        }
        if (sender.xtype == "tableview") {
            // FIXME should not instantiate new matrix view
            // FIXME what is scopeItemModel here?
            var rowModel = new stl.view.MatrixView().getBlankRowModel(scopeItemModel.name);
            rowModel.id = scopeItemModel.Id;
            dataNode = {
                'Id': rowModel.uid,
                'Name': rowModel.name,
                expandable: true,
                expanded: true,
                rowModel: rowModel,
                children: []
            };
        } else {
            dataNode = {
                'Id': rowModel.uid,
                'Name': rowModel.name,
                expandable: true,
                expanded: true,
                rowModel: rowModel,
                children: []
            };

        }
    },

    requestReschedule: function () {
        //Vrushali - CON-2275 Import: summary remaining duration comes out to 0 after project import
        //We decided to do rescheduling on IDCCed project as well.
        if (this.project.isIDCCed) {
            // No client-side scheduling after IDCC run (for now)
            return;
        }
        if (this.rescheduleTimeout) {
            clearTimeout(this.rescheduleTimeout);
        }
        if (!this.rescheduleDelegate) {
            this.rescheduleDelegate = this.reschedule.bind(this);
        }
        this.rescheduleTimeout = setTimeout(this.rescheduleDelegate, 500);
    },

    reschedule: function () {
        var me = this;
        var project = this.project;
        var allTasksAndMilestones = project.getAllTasks(),
            DATE = Sch.util.Date,
            today = ServerClientDateClass.getTodaysDate(),
            dateRange = {
                first: DATE.add(today, DATE.DAY, -1),
                last: DATE.add(today, DATE.DAY, 1)
            };
        var scheduler = new stl.service.SimpleScheduler({
            tasks: allTasksAndMilestones,
            links: project.links,
            projectStartDate: new Date(project.startDate),
            calendar: stl.app.calendar
        });
        scheduler.scheduleAll();

        //var summaryTasksInProject = [];
        project.getAllTasks().map(function (task) {
                var eventRec = me.eventStore.getById(task.uid);
                if (eventRec) {
                        //for milestones incorrect config was getting passed-VK
                        var config = task.isMS ? me.createEventConfigForMilestone(task,eventRec.get('ResourceId')):me.createEventConfigForTask(task,eventRec.get('ResourceId'));
                        eventRec.setStartDate(task.startDate);
                        dateRange.first = DATE.min(dateRange.first,config.StartDate);
                        eventRec.setStartEndDate(config.StartDate, config.EndDate);
                        dateRange.last = DATE.max(dateRange.last,config.EndDate);
                }
        });
        //CON-2240: This is to properly set the time span in scheduler. Previously the time span of the scheduler
        // was not getting calculated properly and hence to see the task lying outside the date range we had to click the task.
        me.setTimeSpan(
            Sch.util.Date.add(dateRange.first, Sch.util.Date.DAY, -10),
            Sch.util.Date.add(dateRange.last, Sch.util.Date.DAY, 10)
        );
        me.projectEndDate = dateRange.last;
        me.zoomToFitProject(dateRange.first, dateRange.last);
    },

    updateParentAsLeafNode:function(node,resourceRec){
        if (node && node.get('children').length == 0) {
            node.set("leaf", true);            
        }
        node.removeChild(resourceRec);
    },
    onPhaseChange: function (evt, phaseModel) {
        // TODO (not sure what we might need to do here, if anything - not currently showing phases)
    },

    onPhaseAdd: function (evt, sender, phaseModel, phaseIndex) {
        // TODO
    },

    onPhaseRemove: function (evt, phase, phaseIndex) {
        // TODO
        return;
    },

    onAfterLayout: function () {
        var me = this;
        if (this.linksView && this.linksView.updateLinks) {
            this.linksView.updateLinks();
        }
        //changed onTimelineScroll to onTimelineScrollDelegate so that on initial load, link refresh is called twice
        this.getSchedulingView().getEl().on("scroll", this.onTimelineScrollDelegate.bind(this));
    },

    onTimelineScrollDelegate: function(){
        if (this.timelineScrollTimeout) {
            clearTimeout(this.timelineScrollTimeout);
        }
        if (!this.timelineScrollFunc) {
            this.timelineScrollFunc = this.onTimelineScroll.bind(this);
        }
        var val = 100;
        this.timelineScrollTimeout = setTimeout(this.timelineScrollFunc, val);

    },

    onEventClick: function (view, eventRec, e, eOpts) {
        if (eventRec.data.isMilestone || eventRec.data.isSummary) {
            if(eventRec.data.isIMS){
                this.onTimelineMilestoneClick(e);
            }
            return;
        }
        this.lastEditWasNew = false; // TODO is this used?
        this.startEditingTask(eventRec, e);
    },

    onTimelineMilestoneClick: function (e) {
        $(".tool-popup.below").hide();
        var $target = $(e.target), //$(e.browserEvent.target),
            $ms = $target.find(".IMS-Milestone");
        if ($ms.length > 0) {
            var msUid = $ms.data("ms-uid"),
                msEventRec = this.eventStore.getById(String(msUid)),
                $newMenu = $("#templates div[role=milestone-template] .tool-popup").clone(true),
                $container = $(this.getEl().dom),
                containerOffset = $container.offset(),
                msOffset = $ms.offset();
            // Generate menu and show it
            stl.view.MilestoneMenu.prototype.bindMilestoneMenu(this, $newMenu, msEventRec.data.taskModel);
            $container.append($newMenu);
            $newMenu.on("deletemilestone", this.onMilestoneDelete.bind(this));
            $newMenu.css({
                top: (msOffset.top - containerOffset.top + 24) + "px",
                left: (msOffset.left - containerOffset.left + 24 - ($newMenu.width() / 2)) + "px"
            }).show();
            e.stopPropagation();
        }
    },

    setReadOnly: function (readOnly) {
        this.readOnly = readOnly;
        if (readOnly) {
            this.el.addCls("read-only");
        } else {
            this.el.removeCls("read-only");
        }
        this.callParent(arguments);
    },

    startEditingTask: function(eventRec, eventData) {
        //SS :CON-2316
        //Links are distorted when quick edit mode is opened and resource is assigned from timeline view
        //
        var task = eventRec.data.taskModel;
        if (!task) return;
        if (this.editTaskView) {
            this.stopEditingTask();
        }
        var taskPhase = _.find(this.project.phases, function(phase) {
                return phase.uid === task.phaseId;
            }),
            schedulingView = this.getSchedulingView(),
            $eventEl = $(schedulingView.getElementFromEventRecord(eventRec).dom),

            eventElOffset = $eventEl.offset(),
            eventElWidth = $eventEl.width(),
            $overlayContainerEl = $(this.el.dom).find(".x-grid-view.sch-timelineview"),
            containerOffset = $overlayContainerEl.offset(),
            containerWidth = $overlayContainerEl.width(),
            containerHeight = $overlayContainerEl.height();


        this.positioningTaskView = true;
        var viewScrolled = false;
        var currentScrollLeft = $overlayContainerEl.scrollLeft();
        var quickEditApproxWidth =300;
        /*if (containerOffset.left > eventElOffset.left) {
            //schedulingView.scrollEventIntoView(eventRec, false, false);
            $overlayContainerEl.scrollLeft(currentScrollLeft - eventElWidth);
            viewScrolled = true;
        } else if (containerOffset.left + containerWidth < eventElOffset.left + quickEditApproxWidth) {
            var scrollTo = quickEditApproxWidth;
            if (eventElWidth > quickEditApproxWidth)
                scrollTo = eventElWidth;
            $overlayContainerEl.scrollLeft(currentScrollLeft + scrollTo);
            viewScrolled = true;

        }*/
        var $maskEl = $(Ext.getBody().mask().dom);
        $maskEl.off("click").on("click", this.onMaskClick.bind(this));
        var taskView = new stl.view.TaskView({
            insertBefore: INSERT_TASK_BEFORE_TIMELINE_VIEW,
            project: this.project,
            phase: taskPhase,

            // FIXME should not have dependency on matrix view - people and teams belong to project anyway
            availablePeopleAndTeams: stl.app.availablePeopleAndTeams,
            readOnly: this.readOnly,
            isSubtaskEnabled: ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled & this.project.isSubtaskEnabled,
            completeSubtaskOnChecklistComplete: ConfigData.reportSettingsMap.TASKLIST_COMPLETECHECK_WITH_COMPLETECHECKCLIST.Enabled,
            //this check is not needed in SPI. with this check subtasks are hidden when they are marked complete which is not desirable-VK
            includeCompletedSubtask: true,//ConfigData.reportSettingsMap.REPORTFILTER_TASKLIST_COMPLETEDSUBTASKS.Enabled,
            task: task
        });
        $(taskView).on({
            "zoom": this.onTaskZoom.bind(this),
            "delete": this.onTaskViewDelete.bind(this),
            "resourcechange": this.onTaskResourceChange.bind(this),
            "deletesubtask": this.onTaskViewSubtaskDelete.bind(this),
            "enterquickedit": this.onTaskEnterQuickEdit.bind(this),
            "exitquickedit": this.onTaskExitQuickEdit.bind(this),
            "change": this.onTaskViewChange.bind(this)
        });
        var $task = taskView.$el;
        taskView.enterQuickEditMode(eventData);
        $overlayContainerEl.before($task);
        var offsetObj = {"top": ($(window).height())/3, "left": ($(window).width())/3};
        $task.offset(offsetObj);

        this.editTaskView = taskView;
        if (task.taskType != "fullkit" && task.bufferType == "None"){
            $task.find(".task-magnify-button").trigger("click");
        }

        // Have to fudge the timing here because Ext delays the scroll handler we just fired and would cancel the edit there :(
        setTimeout(function() {
            this.positioningTaskView = false;
        }.bind(this), 300);
    },

    onTaskEnterQuickEdit: function (evt) {
        var taskView = evt.target,
            taskUID = taskView.task.uid;
        taskEventRec = this.eventStore.getById(taskUID);
        if (taskEventRec) {
            var taskEl = this.getSchedulingView().getElementFromEventRecord(taskEventRec);
            $(document).trigger("taskselectionchange", [$(taskEl.dom)]);
        }
    },

    onTaskExitQuickEdit: function (evt) {
        //$(document).trigger("taskselectionchange", [null]);
    },

    onMSEnterQuickEdit: function (evt) {
        var taskView = evt.target,
            taskUID = taskView.task.uid;
        taskEventRec = this.eventStore.getById(taskUID);
        if (taskEventRec) {
            //var taskEl = this.getSchedulingView().getElementFromEventRecord(taskEventRec);
            //$(document).trigger("taskselectionchange", [$(taskView.$el)]);

        }
    },

    onMSExitQuickEdit: function (evt) {
        //$(document).trigger("taskselectionchange", [null]);
    },

    // TODO this is basically the same logic as in matrix view -- extract common code into TaskView
    onTaskZoom: function (evt) {
        var taskView = evt.target,
            $task = taskView.$el,
            $parentphase = $task.closest(".phase-column.hidden-title"),
            newWidth = null,
            newHeight = null,
            zoomingIn = false,
            NORMAL_ZOOM_TASKWIDTH = 660, // See matrix-view.js
            QUICK_ENTRY_TASK_WIDTH = 250, // See task-view.js
            TASK_HEADER_HEIGHT = 32, // See matrix-view.js
            $taskProperties = $task.find(".task-properties"),
            taskPropertiesHorizPadding = ($taskProperties.outerWidth() - $taskProperties.width());
        if ($task.hasClass("task-zoom-normal")) {
            this.onMaskClick();
            return;
        } else {
            // Zoom in 
            var newWidth = NORMAL_ZOOM_TASKWIDTH;
            newHeight = 'auto';
            zoomingIn = true;

            $task.find(".subtask-type").show();

            $task.addClass("task-zoom-normal");
            $task.removeClass("task-zoom-small");
            var $maskEl = $(Ext.getBody().mask().dom);
            $maskEl.on("click", this.onMaskClick.bind(this));
            //set height of text area of subtasks in chain view and timeline view
            this.resizeSubtaskNameTextAreas($task);

        }
        if (newWidth && newHeight && zoomingIn) {
            $taskProperties.width(newWidth - taskPropertiesHorizPadding);
            //$task.find(".task-name-overflow-edit").css("min-width", "630px");
            $task.find(".task-content-wrapper").width(newWidth).height(newHeight);
        }
    },

    /**
    * User has edited a task here in the timeline view; broadcast globally
    */
    onTaskViewChange: function (evt) {
        var taskView = evt.target,
            task = taskView.task;
        $(document).trigger("taskchange", [this, task]);

    },

    onTaskResourceChange: function () {
        // TODO
    },

    onTaskViewDelete: function (evt) {
        var taskView = evt.target,
            task = taskView.task;
        this.stopEditingTask();
        var MV = Ext.getCmp("matrix-view-container");
        if (MV) {
            $(document).trigger("taskremove", [
                this,
                task,
                task.rowId,
                task.phaseId
            ]);
        } else {
            this.onTaskRemove("", this, task, task.rowId, task.phaseId);
            stl.app.removeTaskFromRowModel(task, task.rowId, task.phaseId);
        }
        delete this.project._tasksAndMilestonesByUid[task.uid];
    },

    onTaskViewSubtaskDelete: function (evt, subtask, task) {
        $(document).trigger("subtaskremove", [
            this,
            subtask,
            task

        ]);

        evt.stopPropagation();
        //Ext.getBody().unmask();
    },

    stopEditingTask: function () {
        ConwebPopOverInstance.destroyPopOver();
        this.editTaskView.$el.remove();
        this.el.unmask();
        $(document).trigger("taskchange", [this, this.editTaskView.task]);
        if(stl.view.ResourcePicker.isResourcePickerPopupVisible(this.editTaskView.taskResourcePicker.$popup))
            stl.view.ResourcePicker.closeResourcePicker(this.editTaskView.taskResourcePicker);
        this.editTaskView = null;
        $(document).trigger("taskselectionchange", [null]);
        this.refreshAll(true);
    },

    onMaskClick: function () {
        //this.editTaskView.save();
        this.stopEditingTask();
        Ext.getBody().unmask();
    },

    updateTaskDateRangeBar: function ($task, startDate, endDate) {
        var view = this.getSchedulingView(),
            startX = view.getXFromDate(startDate, false),
            endX = view.getXFromDate(endDate, false),
            taskLeft = $task.offset().left;
        $task.find(".date-range-indicator").css({
            left: Math.max(startX - taskLeft, 0) + "px",
            width: Math.max(endX - startX, 0) + "px"
        });
    },

    onRender: function (ct, position) {
        var me = this;
        this.callParent(arguments);
        this.schedulingView = this.getSchedulingView();
        this.drawTodayLine();
    },

    onTimelineScroll: function (evt, targetEl) {
        //milestone context-menu needs to closed on scroll 
        $(".tool-popup.below").hide();

        if (this.editTaskView && !this.positioningTaskView && !this.editTaskView.$el.hasClass('task-zoom-normal')) {
            this.stopEditingTask();
        }

       this.refreshLinksView();
    },

    renderZoomControls: function () {
        var me = this;
        this.timelineZoomEl = $('<div class="zoom-controls timeline-zoom-controls"><div class="zoom-in">+</div><div class="zoom-out">-</div></div>');
        $(".sch-schedulerpanel", this.el.dom).append(this.timelineZoomEl);
        $(".timeline-zoom-controls .zoom-in").on("click", this.onTimelineZoomInClick.bind(this));
        $(".timeline-zoom-controls .zoom-out").on("click", this.onTimelineZoomOutClick.bind(this));
        $(".sch-schedulerpanel .x-grid-header-ct").hover(function () {
            me.timelineZoomEl.addClass("header-hover");
        }, function (evt) {
            me.timelineZoomEl.removeClass("header-hover");
        });
    },

    onTimelineViewChange: function () {
        if (this.el) {
            this.el.removeCls("zooming");
            this.drawTodayLine();
            this.handleViewChange(); // TODO consolidate            
        }
    },

    onShow: function () {
        this.callParent(arguments);
        if (this.pendingRefreshAll) {
            this.refreshAll();
        }
        setTimeout(function () {
            if (this.pendingHighlightAction) {
                this.pendingHighlightAction.call(this);
            }
        } .bind(this));
    },

    onTimelineZoomInClick: function () {
        this.zoomLevel++;
        this.el.addCls("zooming");
        this.zoomIn();
    },

    onTimelineZoomOutClick: function () {
        var me = this;
        this.zoomLevel--;
        this.el.addCls("zooming");
        window.setTimeout(function () {
            me.zoomOut();
        }, 0);
    },

    getToday: function () {
        var date = ServerClientDateClass.getTodaysDate();
        date.setHours(0, 0, 0, 0);
        return date;
    },

    drawTodayLine: function () {
    },

    onStreamUpdated: function (id, rec) {
        // TODO more efficient finding of stream
        var myRec = this.resourceStore.getById(id);
        if (myRec) {
            // FIXME create central method to merge records, ALSO fix fieldnames for consistency
            myRec.set({
                "Name": rec.get("Name") || rec.get("name"),
                "name": rec.get("Name") || rec.get("name"),
                "Id": rec.get("Id") || rec.get("id"),
                "id": rec.get("Id") || rec.get("id")
            });
            // TODO handle "moved to new parent" (maybe just move the record and then re-render all)
        }
    },

    onTaskUpdated: function (id, rec) {
        // TODO more efficient finding of stream
        var myRec = this.eventStore.getById(id);
        if (myRec) {
            // FIXME create central method to merge records, ALSO fix fieldnames for consistency
            myRec.set({
                "Name": rec.get("Name") || rec.get("name"),
                "name": rec.get("Name") || rec.get("name"),
                "Id": rec.get("Id") || rec.get("id"),
                "id": rec.get("Id") || rec.get("id"),
                "duration": rec.get("Duration") || rec.get("duration"),
                "Duration": rec.get("Duration") || rec.get("duration")
            });
            // TODO handle "moved to new parent" (maybe just move the record and then re-render all)
        }
    },

    setProjectModel: function (model) {
        this.project = model;
        this.loadProject(model);
    },



    loadProject: function (model, ignoreTimeAxisChange) {
        var newRoot = {
            'Id': 'proj-container',
            'Name': 'Project',
            expandable: true,
            expanded: true,
            children: []
        };
        var events = [],
            links = [];
        var i = 0,
            j,
            k,
            prevTaskId,
            lastEndDate = null,
            DATE = Sch.util.Date,
            today = ServerClientDateClass.getTodaysDate(),
            dateRange = {
                first: DATE.add(today, DATE.DAY, -1),
                last: DATE.add(today, DATE.DAY, 1)
            },
            usedMilestones = {};
        today.setHours(0, 0, 0, 0);

        var today = ServerClientDateClass.getTodaysDate();
        var msGridItems = Ext.getCmp('msGrid').getStore().getData();
        var numberOfRows = msGridItems.getCount();
        for (var j = 0; j < numberOfRows; j++) {
            if(msGridItems.getAt(j).get('type') != IMS_SHORT)
                this.loadRow(newRoot, msGridItems.getAt(j), events, dateRange, usedMilestones);
        }

        this.resourceStore.setRoot(newRoot);

        // var me =this;
        model._milestones.forEach(function (ms) {
            //me = this;
            if(ms.taskType != "PEMS" && ms.taskType != "IPMS" && ms.taskType != IMS_SHORT){
                var msEventRec = this.createEventConfigForMilestone(ms);
                if (msEventRec) {
                    events.push(msEventRec);
                }
            }
        }
        .bind(this));
        //this.requestReschedule();
        if (!model.isIDCCed) {
            var allTasksAndMilestones = stl.app.ProjectDataFromServer.getAllTasks();
            var scheduler = new stl.service.SimpleScheduler({
                tasks: allTasksAndMilestones,
                links: this.project.links,
                projectStartDate: new Date(stl.app.ProjectDataFromServer.startDate),
                calendar: stl.app.calendar
            });
            scheduler.scheduleAll();
        }
        this.project.createScheduler(stl.app.calendar);
        this.eventStore.loadData(events);

        //reset the highlightbutton else zoomTOFitProject fires timelineviewchange which intern calls handle highlightdropdown
        stl.app.resetHighlightButton();
        this.onTimelineViewChange();

        this.projectStartDate = dateRange.first;
        this.projectEndDate = dateRange.last;

        this.setTimeSpan(
            Sch.util.Date.add(dateRange.first, Sch.util.Date.DAY, -10),
            Sch.util.Date.add(dateRange.last, Sch.util.Date.DAY, 10)
        );

        if (!ignoreTimeAxisChange) {
            this.zoomToFitProject(dateRange.first, dateRange.last);
            this.scrollToDateCentered(ServerClientDateClass.getTodaysDate());
        }

        $(this.project).on({
            // "milestoneadd": this.onMilestoneAdd.bind(this),
            "milestoneremove": this.onMilestoneRemove.bind(this),
            "linkremove": this.onLinkRemove.bind(this),
            "linkadd": this.onLinkAdd.bind(this)
        });

        this.setReadOnly(stl.app.readOnlyFlag);
        $(document).trigger("projectload", [this]);
        stl.app.chainView = this;
        stl.app.isChainViewLoaded = true;
    },

    refreshAll: function (ignoreTimeAxisChange) {
        if (!this.isVisible()) {
            this.pendingRefreshAll = true;
            return;
        }
        if (this.project) {
            // reload
            this.loadProject(this.project, ignoreTimeAxisChange);
        }
        this.down('timeaxiscolumn').refresh();
        delete this.pendingRefreshAll;
    },
    onProjectLoaded: function (evt, sender) {
        //this.$view.data("view", this);
        if (sender === this) {
            hideLoadingIcon();
            stl.app.handleCheckoutButtonAsPerProjectPrivilege(this.project.CheckedOutStatus, this.project.CheckedOutUser);
            stl.app.UpdateDownloadButtonBasedOnProjectStatus(this.project.ProjectStatus, this.project.projectFileType);
        }
    },

    /**
    * Choose the smallest zoom level that can fit the whole project, or year if none
    * Note, zero is "most zoomed out" (most condensed)
    */
    zoomToFitProject: function (startDate, endDate) {
        var days = Sch.util.Date.getDurationInDays(startDate, endDate);
        var i = 0; // this to make sure we are accessing right element from zoomLevels array.
        //in case we have multiple years in zoomlevel then i=0 
        //in case we have year view, we have i=-1 to ensure we are accessing proper element from zoomLevels array.
        //this is to avoid repetation of code in in if else blocks.
        if (days >= 265) {
            this.setZoomLevel(i); // multiple year
        } else if (days > 110) {
            this.setZoomLevel(i + 1); // year
        } else if (days > 35) {
            this.setZoomLevel(i + 2); // quarter
        } else if (days > 18) {
            this.setZoomLevel(i + 3); // month
        } else {
            this.setZoomLevel(i + 4); // weeks
        }
    },

    /**
    * Handle addition of a link from another view
    * Sender is the project model
    */
    onLinkAdd: function (evt, link) {
        this.refreshLinksView();
        //this.requestReschedule();
    },

    /**
    * Handle removal of the link from another view
    * Sender is the project model
    */
    onLinkRemove: function (evt, link) {
        this.refreshLinksView();
        //this.requestReschedule();
    },

    onMilestoneAdd: function (evt, sender, newMs, scope, row, phase, prevTaskId) {
        var msEventRec = this.createEventConfigForMilestone(newMs);
        if (msEventRec) {
            this.eventStore.add(msEventRec);
        }
    },

    /**
    * Creates an Event record config object that can be added to the eventStore,
    * from a milestone model.  If the milestone type is not supported for timeline
    * view, returns null.
    */
    createEventConfigForMilestone: function (ms,resourceId) {
        var startDate = new Date(ms.startDate),
            endDate;
        
        endDate = ms.projectedDate ? new Date(ms.projectedDate) : startDate;
        startDate.setHours(0, 0, 0, 0); // Start date will be displayed as starting at midnight (even if it's e.g. 8am)
        endDate.setHours(23, 59, 59, 999); // Same for end date

        // We put "generated milestones" (PEMS, IPMS) inline with the tasks.  All
        // other milestones (PE, IMS, CMS) appear in the milestone header bar.
        var isGeneratedMilestone = (ms.taskType === "PEMS" || ms.taskType === "IPMS");
        return {
            "id": ms.uid,
            "Id": ms.uid,
            "Name": (isGeneratedMilestone ? "" : ms.taskType),
            "ResourceId": (isGeneratedMilestone ? String(resourceId) : (ms.taskType===IMS_SHORT ? String(resourceId) : "timeline-milestone-row")),
            "StartDate": (isGeneratedMilestone ? startDate : (ms.taskType===IMS_SHORT ? startDate: endDate)),
            "EndDate": (isGeneratedMilestone ? startDate : (ms.taskType===IMS_SHORT ? startDate: endDate)),
            "taskModel": ms,
            "Draggable": false,
            "Resizable": false,
            "isMilestone": true,
            "isCritical": !!ms.isCritical,
            "msColor": ms.taskColor,
            "date1": ms.date1,
            "projectedDate": ms.projectedDate,
            "isPinchPoint": ms.taskType === "NONE" ? true : false,
            "isIMS":ms.taskType === IMS_SHORT ? true : false,
            "isSummary": false, //task.isSummary
            "isFiltered":false,
            "highlightClassNames":[]
        };
    },

    onMilestoneRemove: function (evt, sender, ms) {
        var msEventRec = this.eventStore.getById(ms.uid);
        if (msEventRec) {
            this.eventStore.remove(msEventRec);
        }
        this.refreshLinksView();
    },

    loadRow: function (parentDataNode, row, events, dateRange, usedMilestones) {
        var me = this,
            DATE = Sch.util.Date,
            dataNode = {
                'Id': row.data.id,
                'Name': row.get('name'),
                expandable: true,
                expanded:  true,
                rowModel: row,
                children: []
            };
            parentDataNode.children.push(dataNode);
        // get tasks in that chain
        var isRedoCC = !$("#bufferSummary").hasClass("disabled");
        if(!isRedoCC)
            var tasks =chainHighlightInstance.highlightLongestPredecessorChain(row.data);
        else{
            var penChainIDs = this.project.getPenChainID(row.get('uid'));
            var tasks=[];
            if (penChainIDs && penChainIDs != -1){
                for(var i=0; i<penChainIDs.length; i++){
                    var tasksForChainId = stl.app.ProjectDataFromServer.getTaskIdsAndMilestoneUIdForChainNumber(penChainIDs[i]).taskIds;
                    tasks = tasks.concat(stl.app.ProjectDataFromServer.getTaskObjectsFromTaskIds(tasksForChainId));
                }
            }
        }
        var prevTaskId = null,
            lastEndDate = null;
        if (tasks) {
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];

                if (task.startDate && task.endDate && task.taskType != CMS_SHORT && task.taskType!= PE_SHORT) {
                    if (!task.isSummary) {
                        if(task.isMS)
                            var eventConfig = me.createEventConfigForMilestone(task,row.data.id);
                        else           
                            var eventConfig = me.createEventConfigForTask(task,row.data.id);
                        var index = _.findIndex(events,function(evt){
                            if(evt.id == eventConfig.id){
                                evt.commonResourceIds.push(eventConfig.ResourceId);
                                return true;
                            }
                        });
                        if(index == -1){
                            events.push(eventConfig);
                            dateRange.first = DATE.min(dateRange.first, eventConfig.StartDate);
                            dateRange.last = DATE.max(dateRange.last, eventConfig.EndDate);
                            prevTaskId = task.id;
                            if(task.subtasks && task.subtasks.length > 0 ){
                                me.project.reCalculateSubTaskStartDate(task);
                            }
                        }
                    }
                }
            }
        }
    },

    createEventConfigForTask: function (task, resourceId) {
        var startDate = new Date(task.startDate),
            endDate;
        //for zero duration task, startdate is set to 1 day ahead of end date in db, causing problem in timeline view
        //end date is set to start date for 0 duration task  
        if (task.startDate > task.endDate)
            endDate = new Date(task.startDate);
        else
            endDate = new Date(task.endDate);

        switch (task.status) {
            case "IP":
                if (task.actualStartDate) {
                    startDate = new Date(task.actualStartDate);
                }
                break;
            case "CO":
                if (task.actualStartDate) {
                    startDate = new Date(task.actualStartDate);
                }
                if (task.actualFinishDate) {
                    endDate = new Date(task.actualFinishDate);
                }
                break;
        }
        startDate.setHours(0, 0, 0, 0); // Start date will be displayed as starting at midnight (even if it's e.g. 8am)
        endDate.setHours(23, 59, 59, 999); // Same for end date
        return ({
            "id": task.uid,
            "Id": task.uid,
            "Name": (task.taskType === "fullkit" ? "FK" : task.name),
            "ResourceId": resourceId,
            "StartDate": startDate,
            "EndDate": endDate,
            "taskModel": task,
            "Draggable": false,
            "Resizable": false,
            "isCritical": !!task.isCritical,
            "completionPercentage": task.percentComplete,
            "taskColor": task.taskColor,
            "isSummary": task.isSummary,
            "isFiltered":false,
            "commonResourceIds":[],
            "highlightClassNames":[],
            "subtaskCount":task.remainingSubtasks
        });
    },

    eventRenderer: function (eventRec, resourceRec, templateData) {
        if (!this.timelineView) {
            this.timelineView = this.up("chainview");
        }
        var cssClasses = [],
            isMilestone = !!eventRec.data.isMilestone,
            isSummary = eventRec.data.isSummary,
            isIMS = false,
            isInternalMS = false;
        //isMilestone = eventRec.data.taskModel.isMS,
            name = eventRec.getName(),
            completionPercentage = 0,
            taskIdlePercentage = 0,
            taskIdleBarLeftPosition = 0;
        if (!isMilestone && !isSummary && this.timelineView.project.checkIfZeroDurationTask(eventRec.data.taskModel))
            cssClasses.push("zero-duration-task");

        if (isMilestone) {
            isIMS = eventRec.data.taskModel.taskType==="IMS";
            isInternalMS = eventRec.data.taskModel.taskType === "IPMS" || eventRec.data.taskModel.taskType === "PEMS";
            cssClasses.push("milestone");
            if (eventRec.get("IsOverdueMilestone") === true) {
                cssClasses.push("overdue-milestone");
            }
            if (eventRec.get("IsProjectedMilestone") === true) {
                cssClasses.push("projected-milestone");
            }
        } else if (eventRec.get("IsPinchPoint") === true) {
            cssClasses = ["pinchpoint"];
        } else {
            // Shorten normal task bars by 5px to account for the right-facing arrow, to prevent visual overlap
            templateData.width = Math.max(0, templateData.width - 5);
        }
        if (eventRec.get("IsRollup") === true) {
            cssClasses.push("rollup");
        }
        if (eventRec.data.isCritical) {
            cssClasses.push("cc-task");
        }
        cssClasses.push("has-phase-" + stringToHex(eventRec.data.taskModel.phaseId));
        cssClasses.push("has-phase-" + stringToHex(this.timelineView.project.getPhaseById(eventRec.data.taskModel.phaseId).name.replace(/ /g, '')));
        if (eventRec.data.taskModel.manager)
            cssClasses.push("has-task-manager-" + stringToHex(eventRec.data.taskModel.manager.replace(/ /g, '')));
        var resourceColorMap = this.timelineView.project.getResourceColorMap();
        if (eventRec.data.taskModel.resources && eventRec.data.taskModel.resources.length > 0) {
            eventRec.data.taskModel.resources.forEach(function (assignedResource) {
                //cssClasses.push("has-resource-" + resourceColorMap[assignedResource.resourceId]);
                cssClasses.push("has-resource-" + assignedResource.resourceId);
            });
        }
        if (!isMilestone) {
            var bufferType = eventRec.data.taskModel.bufferType;
            if (bufferType === "CCCB" || bufferType === "CCFB" || bufferType === "CMSB") {
                cssClasses.push("buffer-task " + bufferType.toLowerCase() + "-task");
            }
            var taskType = eventRec.data.taskModel.taskType;
            if (taskType === "fullkit") {
                cssClasses.push("fullkit-task");
            }
            if (eventRec.data.completionPercentage) {
                completionPercentage =this.timelineView.computeTaskCompletionPercentage(eventRec.data.taskModel);
                cssClasses.push("has-completion-bar");
            }
        //Task split is shown only for normal/purchasing/snet tasks which are In progress
            var SSD = convertDateStringToDateFormat(eventRec.data.taskModel.suggestedStartDate);
            if(SSD && taskType != "fullkit" && taskType !=IMS_SHORT && eventRec.data.taskModel.status === STATUS_IP){
                var today = new Date();
                if(SSD >today){
                    taskIdlePercentage = this.timelineView.computeTaskIdlePercentage(eventRec.data.taskModel);
                    if(taskIdlePercentage>0 && taskIdlePercentage < 100){
                        if(completionPercentage!=0 && taskIdlePercentage!=0)
                            taskIdleBarLeftPosition = completionPercentage;                    
                        cssClasses.push("has-task-idle-bar");
                    }
                }
            }
            if (eventRec.data.taskModel.status === "CO") {
                cssClasses.push("task-complete");
            }
        }

        var isScopeExpanded = resourceRec.get('expanded');
        var isSummaryTask = eventRec.data.taskModel.isSummary;
        if (isSummaryTask) {
            cssClasses.push("summaryTask");
        }
        //if item is filtered, show it else hide it
        if(eventRec.data.isFiltered)
            cssClasses.push("hideEvent");
        
        // Vrushali - if scope column (resource Rec) is expanded - Hide summary tasks and show normal/fk tasks,
        // if scope column (resource Rec) is collapsed - Hide normal/fk tasks and display summary tasks
        if (isSummaryTask) {
            templateData.cls = cssClasses.push("hideEventRec");
        }

        templateData.cls = cssClasses.join(" ");

        return {
            Name: name,
            TaskUID: eventRec.getId(),
            IsMilestone: isMilestone,
            CompletionPercentage: completionPercentage,
            TaskIdlePercentage: taskIdlePercentage,
            TaskIdleBarLeftPosition:taskIdleBarLeftPosition,
            TaskColor: eventRec.data.taskColor,
            msColor: eventRec.data.msColor,
            IsSummary: isSummaryTask,
            IsIMS:isIMS,
            IsInternalMS:isInternalMS,
            SubtaskCount:eventRec.data.subtaskCount ? eventRec.data.subtaskCount : 0,
            ShowSubTaskIndicator: eventRec.data.subtaskCount && eventRec.data.subtaskCount > 0 ? true : false
        };
    },

    handleViewChange: function () {
        var me = this,
            schedulingView = me.getSchedulingView();
        this.linesInvalid = true;
        this.refreshLinksView();
    },

    // When global highlight state is changed, update our view to match
    // Note, this currently only fires on certain milestone highlight events (from matrix view)
    onHighlightChange: function () {
        if(stl.app.getActiveTimelineViewName() == CHAIN_VIEW)
            this.handleHighlightDropdownSelection();
    },

    handleHighlightDropdownSelection: function () {
        var me = this;
        var selection = stl.app.getCurrentHighLightOption(); //[DH]: to obtain proper highlight option
        me.clearHighlightsOnEvents();
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
            case CC_TASKS:
                me.onHighlightCCTasks();
                break;
            case RESOURCE_CONTENTION:
                me.onHighlightResourceContention();
                break;
            case SLACK:
                me.onHighlightSlack();
                break;
            case PROJECT_CMS_CHAINS:
                    var chainToolItems = stl.app.ProjectDataFromServer.getChainsColorMap();
                $.each(chainToolItems, function (index, $toolItem) {
                    if (index != 0)
                        stl.app.HighlightProjectChain($($toolItem));
                });
                break;
            case ERROR:
                me.highlightOnViewChange("highlightedErrorTask");
                break;
            case IMMEDIATE_PREDECESSORS: //, , 
            case IMMEDIATE_SUCCESSORS:
            case ALL_PREDECESSORS:
            case ALL_SUCCESSORS:
                me.highlightOnViewChange("constrainingSuccessorTask");
                break;

            case SHOW_CONSTRANING_SUCCESSOR_CHAIN:
                me.highlightOnViewChange("constrainingSuccessorTask");
                break;

            case SHOW_LONGEST_PREDECESSOR_CHAIN:
            case LONGEST_PATH:
                me.highlightOnViewChange("constrainingSuccessorTask");
                break;
            case PEN_CHAIN:
                me.highlightSelectedPenChain();
                break;

        }
    },
    clearHighlightsOnEvents:function(){
        var events = this.eventStore.data.items;
        _.each(events, function(evt){
            evt.set('highlightClassNames',[]);
        });
    },

    updateHighlightsOnEvents:function(tasksArray, className, isOn){
         $.each(tasksArray, function (index, task) {
            if($(task).length > 0 && task.find(".task").length > 0){
                var eventRec = this.eventStore.findRecord('id', task.find(".task")[0].getAttribute('data-task-uid'), 0, false, true,true);
                if(eventRec){
                    if(isOn){
                        if(eventRec.data.highlightClassNames.indexOf(className) == -1)
                            eventRec.get('highlightClassNames').push(className);
                    }
                    else{
                        if(eventRec.data.highlightClassNames.indexOf(className) != -1)
                           eventRec.get('highlightClassNames').splice(eventRec.data.highlightClassNames.indexOf(className), 1);
                    }
                }
            }
        }.bind(this));
    },
    onTimelineZoomChange: function () {
        this.zonesStore.loadData(this.getAllNonWorkingDays(this.getStart(), this.getEnd()));
        this.handleHighlightDropdownSelection();
    },

    getAllNonWorkingDays: function (startDate, endDate) {
        var nonWorkingDays = [],
            dayIsWorking = [true, true, true, true, true, true, true],
            JS_DAY_CODES_BY_NAME = {
                "sunday": 0,
                "monday": 1,
                "tuesday": 2,
                "wednesday": 3,
                "thursday": 4,
                "friday": 5,
                "saturday": 6
            };
        stl.app.calendar.WeekDays.forEach(function (dayInfo) {
            var dayCode = JS_DAY_CODES_BY_NAME[dayInfo.Day.toLowerCase()];
            dayIsWorking[dayCode] = dayInfo.IsWorking;
        } .bind(this));
        for (var date = startDate; date.getTime() < endDate.getTime(); date = Sch.util.Date.add(date, Sch.util.Date.DAY, 1)) {
            if (!dayIsWorking[date.getDay()]) {
                nonWorkingDays.push({
                    StartDate: date,
                    EndDate: Sch.util.Date.add(date, Sch.util.Date.DAY, 1),
                    Cls: "timeline-nonworkingday"
                });
            }
        }
        return nonWorkingDays;
    },

    positionMilestones: function (msRegions) {
        var count = msRegions.length,
            lastCount = -1,
            fixedMilestoneHeight = 40,
            minHorizSpacing = 20,
            halfMinHorizSpacing = minHorizSpacing / 2,
            requiredHeight = fixedMilestoneHeight,
            $header = $(this.getEl().dom).find(".timeline-milestone-header");
        var shiftMilestones = function () {
            var movedCount = 0;
            for (var i = 0; i < count; i++) {
                for (var j = 0; j < count; j++) {
                    if (i !== j) {
                        var ms1 = msRegions[i],
                            ms2 = msRegions[j];
                        if (!ms1.el) {
                            ms1.el = $header.find(".milestone-uid-" + ms1.eventRec.get("Id"));
                            ms1.width = ms1.el.find(".label").width();
                            ms1.left -= (ms1.width / 2);
                        }
                        if (!ms2.el) {
                            ms2.el = $header.find(".milestone-uid-" + ms2.eventRec.get("Id"));
                            ms2.width = ms2.el.find(".label").width();
                            ms2.left -= (ms2.width / 2);
                        }
                        var ms1Right = ms1.left + (ms1.width / 2) + halfMinHorizSpacing,
                            ms2Right = ms2.left + (ms2.width / 2) + halfMinHorizSpacing;
                        if ((ms1.top === ms2.top) && !(ms2Right < ms1.left || ms2.left > ms1Right)) {
                            // Overlap
                            var newTop = ms1.top + fixedMilestoneHeight,
                                elToMove = (ms1.left < ms2.left ? ms2 : ms1);
                            elToMove.top = newTop;
                            elToMove.el.css("top", parseInt(elToMove.el.css("top"), 10) + fixedMilestoneHeight);
                            movedCount++;
                            requiredHeight = Math.max(requiredHeight, newTop + fixedMilestoneHeight);
                            heightIncreased = true;
                        }
                    }
                }
            }
            return movedCount;
        } .bind(this);
        while (lastCount !== 0) {
            var shiftCount = shiftMilestones();
            if (shiftCount == lastCount)
                break;
            lastCount = shiftCount;
        }
        if (requiredHeight > fixedMilestoneHeight) {
            // Need to increase header height, but that requires a re-render of entire header
            // That would be a catch-22, so we save the rendered html and height and have
            // a special case for the 2nd pass in frozenHeaderRenderer, which will run for a
            // second time when we call .refresh() below.
            this.pendingMsHeaderHtml = $header.html();
            this.pendingMsHeaderHeight = requiredHeight;
            this.down('timeaxiscolumn').refresh();
        }
        // If we rearranged the milestones in the header, we need to redraw links, because
        // milestone elements have been replaced.  Can't just call refreshMilestoneLinks because
        // that works off a cached copy of milestone elements.
        if (this.linksViewRendered) {
            setTimeout(this.refreshLinksView.bind(this), 0);
        }
    },

    /**
    * This is called automatically by the scheduler component when it renders the headers.
    * This may run twice - first we lay out all milestones in a single row, then we call
    * positionMilestones (above) to detect any overlaps.  If an overlap is detected, we have
    * to ask the renderer to re-render the header in order to increase the height.  However, in
    * that case we don't want to re-arrange milestones again, so we have a special case here
    * where we just re-use the pre-arranged HTML that we saved during the first pass.
    */
    frozenHeaderRenderer: function (start, end, cfg, i, eventStore) {

        var me = this;
        // This function is called MANY times in succession, once for each time interval.  We only want to
        // do anything on the first interval, and skip the rest.
        if (i !== 0) return;
        if(stl.app.getActiveTimelineViewName() == TIMELINE_VIEW){
            var tv = Ext.getCmp('timelineview');
            return tv.frozenHeaderRenderer.call(tv,start,end,cfg,i,tv.eventStore);
        }
        var headerHeight = this.pendingMsHeaderHeight || 50, // default - will be updated by positionMilestones
            html = ['<div class="timeline-milestone-header" style="height: ' + headerHeight + 'px">'];
        if (this.pendingMsHeaderHtml) {
            // Second pass due to milestone layout change that required header height increase
            // HTML is already rendered; only the header height has now changed
            html.push(this.pendingMsHeaderHtml);
            delete this.pendingMsHeaderHtml;
            delete this.pendingMsHeaderHeight;

            setTimeout(function () {
                this.doLayout();
                if (this.linksViewRendered) {
                    this.refreshLinksView();
                }
            } .bind(this), 50);

        } else {
            // First pass, just lay out all milestones in one row
            var msRegions = [];
            eventStore.each(function (eventRec) {
                if (eventRec.getResourceId() === 'timeline-milestone-row') {
                    msRegions.push({
                        left: me.getSchedulingView().getXFromDate(eventRec.getStartDate()),
                        top: 10,
                        eventRec: eventRec
                    });
                }
            });
            var headerHeight = 50, // default - will be updated by positionMilestones
                html = ['<div class="timeline-milestone-header" style="height: ' + headerHeight + 'px">'];
            msRegions.map(function (msRegion) {

                if (msRegion.eventRec.data) {
                    var dueDate = msRegion.eventRec.data.isPinchPoint ? "" : me.formatDateForBirdsView(msRegion.eventRec.data.date1),
                        projectedDate = msRegion.eventRec.data.isPinchPoint ? "" : me.formatDateForBirdsView(msRegion.eventRec.data.projectedDate),
                        pinchPointClass = msRegion.eventRec.data.isPinchPoint ? " has-PP-milestone" : "",
                        name = msRegion.eventRec.data.isPinchPoint ? PINCH_POINT : msRegion.eventRec.get("Name"),
                        managerClass = msRegion.eventRec.data.taskModel.manager ? " has-task-manager-" + stringToHex(msRegion.eventRec.data.taskModel.manager.replace(/ /g, '')) + " " : "",
                        phaseClass = ' has-phase-' + stringToHex(me.project.getPhaseById(msRegion.eventRec.data.taskModel.phaseId).name.replace(/ /g, "")),
                        criticalClass = msRegion.eventRec.get("isCritical") ? " cc-task" : "" ;

                    html.push('<div id ="chain-view-taskMS-{TaskUID}" class="milestone-event milestone-uid-' + msRegion.eventRec.get("Id") + pinchPointClass + phaseClass + managerClass + criticalClass + '" style="left:' + msRegion.left + 'px; top: 8px" data-ms-uid="' + msRegion.eventRec.get("Id") + '"><div class="marker"></div>' + '<div class="label">' + name + '</div>' + '<div class="msProjectedDate">' + projectedDate + '</div>' + '<div class="msDueDate">' + dueDate + '</div>' + '<div class="milestone-color" style="background-color:' + msRegion.eventRec.data.msColor + '"></div></div>');
                }
            });
            html.push('</div>');
            // Need to postpone until header is rendered - then rearrange to avoid overlapping milestones
            if (this.positionMilestonesTimeout) {
                clearTimeout(this.positionMilestonesTimeout);
            }
            this.positionMilestonesTimeout = setTimeout(this.positionMilestones.bind(this, msRegions), 0);
        }
        html.push('</div>');
        return html.join('');
    },

    formatDateForBirdsView: function (milestoneDate) {
        var msDateForBirdsView = NA_STRING;
        if (milestoneDate) {
            msDateForBirdsView = ServerTimeFormat.getDateFormatForBirdEyeView(milestoneDate);
        }
        return msDateForBirdsView;
    },

    onHighlightAdjacent: function (evt, $task, highlightPredecessors) {
        // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
        if ($task.closest(this.el.dom).length === 0) return;
        this.linksView.highlightImmediateTasks($task, highlightPredecessors);
    },

    onHighlightPredecessors: function (evt, $task) {
        // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
        if ($task.closest(this.el.dom).length === 0) return;
        this.linksView.highlightAllPredecessors($task);
    },

    onHighlightSuccessors: function (evt, $task) {
        // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
        if ($task.closest(this.el.dom).length === 0) return;
        this.linksView.highlightSuccessorTasks($task);
    },

    onHighlightConstraining: function (evt, $taskEvent) {
        // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
        if ($taskEvent.closest(this.el.dom).length === 0) return;
        this.highlightConstrainingTasks($taskEvent);
    },

    onHighlightMilestone: function (sender, id) {
        var $ms = $(".milestone-event", this.getEl().dom);
        $.each($ms, function (index, msInfo) {
            if ($(msInfo).hasClass("milestone-uid-" + id)) {
                $(msInfo).addClass("highlightedMilestoneTask");
            }
        });
    },

    getStartDateOfTask: function (task) {
        var taskStartDate = task.startDate;
        if (task.status == "IP" || task.status == "CO") {
            if (task.actualStartDate) {
                taskStartDate = new Date(task.actualStartDate);
            }
        }
        return taskStartDate;
    },

    getEndDateOfTask: function (task) {
        var taskEndDate = task.endDate;
        if (task.status == "CO") {
            if (task.actualStartDate) {
                taskEndDate = new Date(task.actualFinishDate);
            }
        }
        return taskEndDate;
    },

    showChecklistPopupForSubtask: function ($subtask) {
        var subtask = $subtask.closest(".task").data("model")
            .subtasks[$subtask.index()],
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
        var task = $task.data("model"),
            title = CHECKLIST_TITLE + task.name;
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
    * Show the checklist popup for a full-kit task or a subtask
    */
    showChecklistPopup: function (checklistItems, title, saveCallback) {
        $(".tool-popup").hide();
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
                if(!rec.get('dummy')){
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
            
            $(document).trigger("taskchange", [this, taskData]);
            //this.triggerSave();
            this.checklistPopupOpen = false;
        }
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
                var taskView = this.editTaskView,
                $taskEl = taskView.$el;
                taskView.setTaskStatus(task.status,$taskEl);
            }
        },
        /*
        If suggested start date is less than or equal to today, completion percentage is same as it is sent from BE/Middle layer
        else it is today - ActualStartDate percentage of EndDate - ActualStartDate
        */
    computeTaskCompletionPercentage:function(task){
        if (multipleORs(task.bufferType, BUFFER_TYPE_CCFB, BUFFER_TYPE_CCCB,BUFFER_TYPE_CMSB))
            return task.percentComplete;   
        var SSD = convertDateStringToDateFormat(task.suggestedStartDate);
        var today = new Date();
        if(SSD <= new Date())
            return task.percentComplete;
        var ASD = convertDateStringToDateFormat(task.actualStartDate);
        if(!ASD)
            ASD = convertDateStringToDateFormat(task.startDate);
        if(today > ASD ){
            var completionTimeInMilliSec = today - ASD;
            var totalTaskLengthInMilliSec = this.computeTotalTaskLength(task);
            return Math.round((completionTimeInMilliSec/totalTaskLengthInMilliSec) * 100) ;
        }
        return 0;
    },
    /*
    If suggestedStartDate is less than or equal to today, task idle percentage is 0
        else it is SuggestedStartDate - Today percentage of EndDate - ActualStartDate
        shading width is CP + IP 
    */
    computeTaskIdlePercentage:function(task){
        var SSD = convertDateStringToDateFormat(task.suggestedStartDate);
        var today = new Date();
        if(SSD <= today)
            return 0;
        else{
            var idleTimeInMilliSec = SSD - today;
            var totalTaskLengthInMilliSec = this.computeTotalTaskLength(task);
            return Math.round((idleTimeInMilliSec/totalTaskLengthInMilliSec) * 100) ;
        }
    },
    computeTotalTaskLength:function(task){
        var ASD = convertDateStringToDateFormat(task.actualStartDate);
        if(!ASD)
            ASD = convertDateStringToDateFormat(task.startDate);
        var ED = convertDateStringToDateFormat(task.endDate);
        var totalTaskLengthInMilliSec = ED - ASD;
        return totalTaskLengthInMilliSec;
    },
    resizeSubtaskNameTextAreas:function($task){
        var subtasks = $task.find(".subtasks ul li");
        for(var i=0; i<subtasks.length; i++){
            var height = $(subtasks[i]).find(".subtask-name textarea")[0].scrollHeight;
            if(height != 0){
                $(subtasks[i]).find(".subtask-name textarea").height(height);
            }
        }
    }

});