/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

 @class Sch.mixin.SchedulerPanel
 @extends Sch.mixin.AbstractSchedulerPanel

 A mixin for {@link Ext.panel.Panel} classes, providing "scheduling" functionality to the consuming panel.
 A consuming class should have already consumed the {@link Sch.mixin.TimelinePanel} mixin.

 Generally, should not be used directly, if you need to subclass the scheduler panel, subclass the {@link Sch.panel.SchedulerGrid} or {@link Sch.panel.SchedulerTree}
 instead.

 */
Ext.define('Sch.mixin.SchedulerPanel', {

    extend              : 'Sch.mixin.AbstractSchedulerPanel',

    requires            : [
        'Sch.view.SchedulerGridView',
        'Sch.selection.EventModel',
        'Sch.column.timeAxis.Vertical'
    ],

    /**
     * @cfg {String} eventSelModelType The xtype of the selection model to be used to events. Should be a {@link Sch.selection.EventModel} or its subclass.
     */
    eventSelModelType   : null, // 'eventmodel', 'assignmentmodel'

    /**
     * @cfg {Object} eventSelModel The configuration object for the event selection model. See {@link Sch.selection.EventModel} for available configuration options.
     */
    eventSelModel       : null,

    /**
     * @cfg {Boolean} enableEventDragDrop true to enable drag and drop of events, defaults to true
     */
    enableEventDragDrop : true,

    /**
     * @cfg {Boolean} enableDragCreation true to enable creating new events by click and drag, defaults to true
     */
    enableDragCreation  : true,

    /**
     * @cfg {Object} dragConfig Custom config to pass to the {@link Sch.feature.SchedulerDragZone}
     * instance which will be created by {@link Sch.feature.DragDrop}.
     */
    dragConfig          : null,

    /**
     * @cfg {Object} timeAxisColumnCfg A {@link Ext.grid.column.Column} config used to configure the time axis column in vertical mode.
     */

     /**
     * @cfg {Object} calendarTimeAxisCfg A {@link Ext.grid.column.Column} config used to configure the time axis column in calendar mode.
     */

    /**
     * @cfg {Object} createConfig Custom config to pass to the {@link Sch.feature.DragCreator} instance
     */

    /**
     * @cfg {Object} resizeConfig Custom config to pass to the {@link Sch.feature.ResizeZone} instance
     */

    componentCls                : 'sch-schedulerpanel',

    // even that this config "belongs" to the Sch.mixin.TimelinePanel mixin
    // we can't define it there, because of various reasons (extjs mixin system)
    // this is guarded by the 203_buffered_view_1.t.js test in gantt and 092_rowheight.t.js in scheduler
    /**
     * @ignore
     * @cfg {Boolean} lockedGridDependsOnSchedule set this to true if you require the left (locked) grid section to be refreshed when the schedule is updated.
     */
    lockedGridDependsOnSchedule : true,

    /**
     * @cfg {Boolean} [multiSelect=false]
     * True to allow selection of more than one event at a time, false to allow selection of only a single item
     * at a time or no selection at all, depending on the value of {@link #singleSelect}.
     */
    /**
     * @cfg {Boolean} [singleSelect]
     * Allows selection of exactly one event at a time. As this is the default selection mode anyway, this config
     * is completely ignored.
     */
    /**
     * @cfg {Boolean} [simpleSelect=false]
     * True to enable multiselection by clicking on multiple events without requiring the user to hold Shift or Ctrl,
     * false to force the user to hold Ctrl or Shift to select more than on item.
     */

    /**
     * @cfg {Function} dndValidatorFn
     * An empty function by default, but provided so that you can perform custom validation on
     * the item being dragged. This function is called during a drag and drop process and also after the drop is made.
     * To control what 'this' points to inside this function, use
     * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
     * Return true if the drop position is valid, else false to prevent a drop.
     * @param {Array} dragRecords an array containing the records for the events being dragged
     * @param {Sch.model.Resource} targetResourceRecord the target resource of the the event
     * @param {Date} date The date corresponding to the drag proxy position
     * @param {Number} duration The duration of the item being dragged in milliseconds
     * @param {Event} e The event object
     * @return {Boolean}
     */

    /**
     * @cfg {Function} resizeValidatorFn
     * Provide to perform custom validation on an item being resized.
     * To control what 'this' points to inside this function, use
     * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
     * Return true if the resize state is valid, else false.
     * @param {Sch.model.Resource} resourceRecord the resource of the row in which the event is located
     * @param {Sch.model.Event} eventRecord the event being resized
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Event} e The event object
     * @return {Boolean}
     */


    /**
     * @cfg {Function} createValidatorFn
     * Provide to perform custom validation on the item being created.
     * To control what 'this' points to inside this function, use
     * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
     * Return true to signal that the new event is valid, or false prevent it.
     * @param {Sch.model.Resource} resourceRecord the resource for which the event is being created
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Event} e The event object
     * @return {Boolean} true
     */

    verticalListeners : null,

    /**
     * @event orientationchange
     * Fires after an orientation change
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler panel
     * @param {String} orientation The new orientation ('horizontal' or 'vertical')
     * @deprecated 2.2.22 Use {@link #modechange}
     */

     /**
     * @event modechange
     * Fires after a mode change
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler panel
     * @param {String} mode The new mode ('horizontal', 'vertical', 'calendar')
     */

    // Cached value of locked grid width used when switching orientation
    horizontalLockedWidth : null,

    inheritables : function () {
        return {
            variableRowHeight   : true,

            // private
            initComponent : function () {
                var viewConfig = this.normalViewConfig = this.normalViewConfig || {};
                this._initializeSchedulerPanel();

                this.verticalListeners = {
                    clear       : this.refreshResourceColumns,
                    datachanged : this.refreshResourceColumns,
                    update      : this.refreshResourceColumns, // TODO WASTEFUL
                    load        : this.refreshResourceColumns,
                    scope       : this
                };

                this.calendarListeners = {
                    reconfigure     : this.refreshCalendarColumns,
                    priority        : 1,
                    scope           : this
                };

                this.calendarViewListeners = {
                    columnresize    : this.onCalendarColumnResize,
                    scope           : this
                };

                Ext.apply(viewConfig, {
                    eventStore        : this.eventStore,
                    resourceStore     : this.resourceStore,
                    eventBarTextField : this.eventBarTextField || this.eventStore.model.prototype.nameField
                });

                Ext.Array.forEach(
                    [
                        "barMargin",
                        "eventBodyTemplate",
                        "eventTpl",
                        "allowOverlap",
                        "dragConfig",
                        "eventBarIconClsField",
                        "onEventCreated",
                        "constrainDragToResource",
                        "snapRelativeToEventStartDate",
                        "eventSelModelType",
                        "simpleSelect",
                        "multiSelect",
                        "allowDeselect"
                    ],
                    function (prop) {
                        if (prop in this) viewConfig[prop] = this[prop];
                    },
                    this
                );

                this.callParent(arguments);

                // mode is safe to use after callParent where we check for deprecated 'orientation' option
                if (this.mode === 'vertical') {
                    this.mon(this.resourceStore, this.verticalListeners);
                }

                var lockedView      = this.lockedGrid.getView();
                var normalView      = this.getSchedulingView();

                this.registerRenderer(normalView.columnRenderer, normalView);

                if (this.resourceZones) {
                    var resourceZoneStore = Ext.StoreManager.lookup(this.resourceZones);
                    resourceZoneStore.setResourceStore(this.resourceStore);

                    this.resourceZonesPlug = new Sch.plugin.ResourceZones(Ext.apply({
                        store : resourceZoneStore
                    }, this.resourceZonesConfig));

                    this.resourceZonesPlug.init(this);
                }

                normalView.on('columnwidthchange', this.onColWidthChange, this);

                // Relaying after parent class has setup the locking grid components
                this.relayEvents(normalView, [
                /**
                 * @event eventclick
                 * Fires when an event is clicked
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} eventRecord The event record of the clicked event
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventclick',

                /**
                 * @event eventmousedown
                 * Fires when a mousedown event is detected on a rendered event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventmousedown',

                /**
                 * @event eventmouseup
                 * Fires when a mouseup event is detected on a rendered event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventmouseup',

                /**
                 * @event eventdblclick
                 * Fires when an event is double clicked
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} eventRecord The event record of the clicked event
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventdblclick',

                /**
                 * @event eventcontextmenu
                 * Fires when contextmenu is activated on an event
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} eventRecord The event record of the clicked event
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventcontextmenu',

                /**
                 * @event eventmouseenter
                 * Fires when the mouse moves over an event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventmouseenter',

                /**
                 * @event eventmouseleave
                 * Fires when the mouse moves out of an event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventmouseleave',

                /**
                 * @event eventkeydown
                 * Fires when a keydown event is detected on an event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventkeydown',

                /**
                 * @event eventkeyup
                 * Fires when a keyup event is detected on an event
                 * @param {Mixed} view The scheduler view instance
                 * @param {Sch.model.Event} eventRecord The event record
                 * @param {Ext.EventObject} e The event object
                 */
                    'eventkeyup',
                    // Resizing events start --------------------------
                /**
                 * @event beforeeventresize
                 * Fires before a resize starts, return false to stop the execution
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} record The record about to be resized
                 * @param {Ext.EventObject} e The event object
                 */
                    'beforeeventresize',

                /**
                 * @event eventresizestart
                 * Fires when resize starts
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} record The event record being resized
                 */
                    'eventresizestart',

                /**
                 * @event eventpartialresize
                 * Fires during a resize operation and provides information about the current start and end of the resized event
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} record The event record being resized
                 * @param {Date} startDate The new start date of the event
                 * @param {Date} endDate The new end date of the event
                 * @param {Ext.Element} element The proxy element being resized
                 */
                    'eventpartialresize',

                /**
                 * @event beforeeventresizefinalize
                 * Fires before a succesful resize operation is finalized. Return false from a listener function to prevent the finalizing to
                 * be done immediately, giving you a chance to show a confirmation popup before applying the new values.
                 * To finalize the operation, call the 'finalize' method available on the resizeContext object.
                 * @param {Mixed} view The scheduler view instance
                 * @param {Object} resizeContext An object containing 'eventRecord', 'start', 'end' and 'finalize' properties.
                 * @param {Ext.EventObject} e The event object
                 */
                    'beforeeventresizefinalize',

                /**
                 * @event eventresizeend
                 * Fires after a succesful resize operation
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} record The updated event record
                 */
                    'eventresizeend',
                    // Resizing events end --------------------------

                    // Dnd events start --------------------------
                /**
                 * @event beforeeventdrag
                 * Fires before a dnd operation is initiated, return false to cancel it
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} record The record corresponding to the node that's about to be dragged
                 * @param {Ext.EventObject} e The event object
                 */
                    'beforeeventdrag',

                /**
                 * @event eventdragstart
                 * Fires when a dnd operation starts
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event[]} records An array with the records being dragged
                 */
                    'eventdragstart',

                /**
                 * @event eventdrag
                 * Fires when an event is dragged onto a new resource or time slot
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event[]} records An array with the records being dragged
                 * @param {Date} date The new start date of the main event record
                 * @param {Sch.model.Resource} resource The new resource for the main event record
                 * @param {Object} dragData A custom drag drop context object
                 */
                    'eventdrag',

                /**
                 * @event beforeeventdropfinalize
                 * Fires before a succesful drop operation is finalized. Return false to finalize the drop at a later time.
                 * To finalize the operation, call the 'finalize' method available on the context object. Pass `true` to it to accept drop or false if you want to cancel it
                 * NOTE: you should **always** call `finalize` method whether or not drop operation has been canceled
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Object} dragContext An object containing 'eventRecord', 'start', 'end', 'newResource', 'finalize' properties.
                 * @param {Ext.EventObject} e The event object
                 */
                    'beforeeventdropfinalize',

                /**
                 * @event eventdrop
                 * Fires after a succesful drag-drop operation
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event[]} records the affected records (if copies were made, they were not inserted into the store)
                 * @param {Boolean} isCopy True if the records were copied instead of moved
                 */
                    'eventdrop',

                /**
                 * @event aftereventdrop
                 * Fires after a drag-drop operation, even when drop was performed on an invalid location
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 */
                    'aftereventdrop',
                    // Dnd events end --------------------------

                    // Drag create events start --------------------------
                /**
                 * @event beforedragcreate
                 * Fires before a drag starts, return false to stop the execution
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Resource} resource The resource record
                 * @param {Date} date The clicked date on the timeaxis
                 * @param {Ext.EventObject} e The event object
                 */
                    'beforedragcreate',

                /**
                 * @event dragcreatestart
                 * Fires before a drag starts
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Ext.Element} el The proxy element
                 */
                    'dragcreatestart',

                /**
                 * @event beforedragcreatefinalize
                 * Fires before a succesful resize operation is finalized. Return false from a listener function to prevent the finalizing to
                 * be done immediately, giving you a chance to show a confirmation popup before applying the new values.
                 * To finalize the operation, call the 'finalize' method available on the createContext object.
                 * @param {Mixed} view The scheduler view instance
                 * @param {Object} createContext An object containing, 'start', 'end', 'resourceRecord' properties.
                 * @param {Ext.EventObject} e The event object
                 * @param {Ext.Element} el The proxy element
                 */
                    'beforedragcreatefinalize',

                /**
                 * @event dragcreateend
                 * Fires after a successful drag-create operation
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} newEventRecord The newly created event record (added to the store in onEventCreated method)
                 * @param {Sch.model.Resource} resource The resource record to which the event belongs
                 * @param {Ext.EventObject} e The event object
                 * @param {Ext.Element} el The proxy element
                 */
                    'dragcreateend',

                /**
                 * @event afterdragcreate
                 * Always fires after a drag-create operation
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Ext.Element} el The proxy element
                 */
                    'afterdragcreate',
                    // Drag create events end --------------------------

                /**
                 * @event beforeeventadd
                 * Fires after a successful drag-create operation, before the new event is added to the store. Return false to prevent the event from being added to the store.
                 * @param {Sch.view.SchedulerGridView} scheduler The scheduler view
                 * @param {Sch.model.Event} newEventRecord The newly created event record
                 */
                    'beforeeventadd'
                ]);

                // enable our row height injection if the default extjs row height synching mechanism is disabled
                // (it is disabled by default in our Lockable mixin, because it's slow)
                if (!this.syncRowHeight) this.enableRowHeightInjection(lockedView, normalView);


            },

            applyViewSettings: function (preset, initial) {
                this.callParent(arguments);

                var schedulingView = this.getSchedulingView(),
                    height;

                initial = initial || !this.rendered;

                if (this.orientation === 'vertical') {
                    // timeColumnWidth is used for row height in vertical mode
                    height = preset.timeColumnWidth || 60;
                    schedulingView.setColumnWidth(preset.resourceColumnWidth || 100, true);
                    schedulingView.setRowHeight(height, true);
                }
            },

            afterRender : function (){
                this.callParent(arguments);

                 if (this.mode === 'calendar') {
                    this.mon(this.timeAxis, this.calendarListeners);
                    this.normalGrid.on(this.calendarViewListeners);
                }

                this.getSchedulingView().on({
                    // Performance enhancements
                    eventdragstart      : this.doSuspendLayouts,
                    aftereventdrop      : this.doResumeLayouts,

                    eventresizestart    : this.doSuspendLayouts,
                    eventresizeend      : this.doResumeLayouts,
                    // EOF Performance enhancements

                    scope               : this
                });

                if (this.lockedGridDependsOnSchedule) {
                    this.normalGrid.getView().on('itemupdate', this.onNormalViewItemUpdate, this);
                }

                this.relayEvents(this.getEventSelectionModel(), [
                    /**
                     * @event eventselectionchange
                     * Fired after a selection change has occurred
                     * @param {Sch.selection.EventModel} this
                     * @param {Sch.model.Event[]} selected The selected events
                     */
                    'selectionchange',

                    /**
                     * @event eventdeselect
                     * Fired after a record is deselected
                     * @param {Sch.selection.EventModel} this
                     * @param  {Sch.model.Event} record The deselected event
                     */
                    'deselect',

                    /**
                     * @event eventselect
                     * Fired after a record is selected
                     * @param {Sch.selection.EventModel} this
                     * @param  {Sch.model.Event} record The selected event
                     */
                    'select'
                ], 'event');
            },

            getTimeSpanDefiningStore : function () {
                return this.eventStore;
            }
        };
    },

    doSuspendLayouts : function() {
        // if infinite scroll is set we want to resume layouts for short timespan when scheduler is being refreshed
        var s = this.getSchedulingView();

        s.infiniteScroll && s.timeAxis.on({
            beginreconfigure    : this.onBeginReconfigure,
            endreconfigure      : this.onEndReconfigure,
            scope               : this
        });

        this.lockedGrid.suspendLayouts();
        this.normalGrid.suspendLayouts();
    },

    doResumeLayouts : function() {
        var s = this.getSchedulingView();

        s.infiniteScroll && s.timeAxis.un({
            beginreconfigure    : this.onBeginReconfigure,
            endreconfigure      : this.onEndReconfigure,
            scope               : this
        });

        this.lockedGrid.resumeLayouts();
        this.normalGrid.resumeLayouts();
    },

    onBeginReconfigure : function() {
        this.normalGrid.resumeLayouts();
    },

    onEndReconfigure : function() {
        this.normalGrid.suspendLayouts();
    },

    onColWidthChange : function (timeAxisViewModel, width) {
        switch (this.getMode()) {
            case 'vertical'     :
                this.resourceColumnWidth = width;
                this.refreshResourceColumns();
                break;
            case 'calendar'     :
                this.calendarColumnWidth = width;
                this.refreshCalendarColumns();
                break;
        }
    },

    enableRowHeightInjection : function (lockedView, schedulingView) {
        var me = this;

        var cellTpl = new Ext.XTemplate(
            '{%',
                'this.processCellValues(values);',
                'this.nextTpl.applyOut(values, out, parent);',
            '%}',
            {
                priority          : 1,
                processCellValues : function (cellValues) {
                    if (schedulingView.mode === 'horizontal') {
                        var nbrBands        = 1;

                        if (schedulingView.dynamicRowHeight) {
                            var resource        = cellValues.record;
                            var layout          = schedulingView.eventLayout.horizontal;

                            nbrBands            = layout.getNumberOfBands(resource, function() {
                                return schedulingView.eventStore.filterEventsForResource(resource, schedulingView.timeAxis.isRangeInAxis, schedulingView.timeAxis);
                            });
                        }

                        var rowHeight       = (nbrBands * me.getRowHeight()) - ((nbrBands - 1) * schedulingView.barMargin) - schedulingView.cellTopBorderWidth - schedulingView.cellBottomBorderWidth;

                        cellValues.style    = (cellValues.style || '') + ';height:' + rowHeight + 'px;';
                    }
                }
            }
        );

        lockedView.addCellTpl(cellTpl);

        // this is a workaround, to force ExtJS grid to use "long" rendering path when doing cell updates
        // which involves the cell templates (which we had overrode)
        // w/o it, grid may use "fast" path and only update the cell content, leaving the row height unsynchronized
        Ext.Array.forEach(lockedView.getColumnManager().getColumns(), function (column) {
            column.hasCustomRenderer    = true;
        });

        // on the `refresh` event from the store, we want the normal view to be refreshed first,
        // because refreshing it will also cache the events layout data. After that, the locked view will just reuse the
        // cached data, otherwise the layout data would be calculated twice
        lockedView.store.un('refresh', lockedView.onDataRefresh, lockedView);
        lockedView.store.on('refresh', lockedView.onDataRefresh, lockedView);

        lockedView.on('destroy', function() {
            lockedView.store.un('refresh', lockedView.onDataRefresh, lockedView);
        });
    },


    /**
     * Returns the selection model being used, and creates it via the configuration
     * if it has not been created already.
     * @return {Sch.selection.EventModel} selModel
     */
    getEventSelectionModel : function () {
        return this.getSchedulingView().getEventSelectionModel();
    },

    refreshResourceColumns : function () {
        var w = this.resourceColumnWidth || this.timeAxisViewModel.resourceColumnWidth;

        this.normalGrid.reconfigure(null, this.createResourceColumns(w));
    },

    onCalendarColumnResize    : function (headerCt, column, width) {
        // Columns for calendar view are not resizable and configured to fill all available space (like forceFit)
        // After panel is resized 'columnresize' is fired for each column containing same 'width' value
        // and the simpliest way to refresh events is to render them per column.
        // Also have to save new column width to view model
        this.timeAxisViewModel.setViewColumnWidth(width, true);

        var calendarView = this.getSchedulingView().calendar;
        calendarView.repaintEventsForColumn(column, column.getIndex());
    },

    refreshCalendarColumns : function () {
        var rows    = this.createCalendarRows();
        var columns = this.createCalendarColumns();

        this.reconfigure(rows, this.calendarColumns.concat(columns));
    },

    /**
     * Switches the orientation of this panel
     * @param {String} orientation Either "horizontal" or "vertical"
     * @deprecated
     */
    setOrientation  : function () {
        this.setMode.apply(this, arguments);
    },

    /**
     * Switches the mode of this panel
     * @param {String} mode Either "horizontal", "vertical" or "calendar"
     */
    setMode : function (mode, force) {
        // This could be called too early during initComponent phase (by responsive mechanism in Ext JS)
        if (!this.normalGrid) {
            this.on('afterrender', function() {
                this.setMode(mode, true);
            });

            return;
        }

        if (mode === this.mode && !force) {
            return;
        }

        // calendar and vertical modes are similar, but we have to recognize them individually
        // in order to do that we consider sch-vertical as a main CSS for both,
        // sch-calendar for calendar and sch-vertical-resource for vertical
        switch (mode) {
            case 'horizontal'   :
                this.addCls('sch-horizontal');
                this.removeCls(['sch-vertical', 'sch-calendar', 'sch-vertical-resource']);
                break;
            case 'vertical'     :
                this.addCls(['sch-vertical-resource', 'sch-vertical']);
                this.removeCls(['sch-calendar', 'sch-horizontal']);
                break;
            case 'calendar'     :
                this.addCls(['sch-calendar', 'sch-vertical']);
                this.removeCls(['sch-vertical-resource', 'sch-horizontal']);
                break;
        }

        this.mode = mode;

        var me              = this,
            preventer       = function () { return false;},
            normalGrid      = me.normalGrid,
            lockedView      = me.lockedGrid.getView(),
            schedulingView  = me.getSchedulingView(),
            normalHeaderCt  = normalGrid.headerCt;

        lockedView.on('beforerefresh', preventer);
        schedulingView.on('beforerefresh', preventer);

        schedulingView.blockRefresh = lockedView.blockRefresh = true;
        schedulingView.setMode(mode);

        Ext.suspendLayouts();
        normalHeaderCt.removeAll(true);
        Ext.resumeLayouts();

        // activate required manager
        if (mode !== 'calendar') {
            me.timeAxis.setMode('plain');

            // remove listeners to avoid refreshing calendar columns using wrong presets
            me.mun(me.timeAxis, me.calendarListeners);

            if (me._oldViewPreset) {
                me.setViewPreset.apply(me, me._oldViewPreset);
                delete me._oldViewPreset;
            }
        } else {
            me._oldViewPreset    = [me.viewPreset, me.timeAxis.getStart(), me.timeAxis.getEnd()];

            me.timeAxis.setMode('calendar');

            me.setViewPreset(me.calendarViewPreset);

            me.mon(me.timeAxis, me.calendarListeners);
        }


        if (mode === 'horizontal') {
            me.mun(me.resourceStore, me.verticalListeners);
            me.normalGrid.un(me.calendarViewListeners);

            schedulingView.setRowHeight(me.rowHeight || me.timeAxisViewModel.rowHeightHorizontal, true);
            me.reconfigure(me.resourceStore, me.horizontalColumns);

            if (this.horizontalLockedWidth !== null) {
                this.lockedGrid.setWidth(this.horizontalLockedWidth);
            }

        } else if (mode === 'calendar') {
            // TODO: we want to save time span of the axis and restore it upon switching back
            me.mun(me.resourceStore, me.verticalListeners);
            me.normalGrid.on(me.calendarViewListeners);

            me.refreshCalendarColumns();

            schedulingView.setRowHeight(me.rowHeight || me.timeAxisViewModel.rowHeightVertical, true);
            schedulingView.setColumnWidth(me.timeAxisViewModel.calendarColumnWidth || 100, true);
        } else {
            me.normalGrid.un(me.calendarViewListeners);

            var lockedWidth = 0;
            this.horizontalLockedWidth = this.lockedGrid.getWidth();

            me.mon(me.resourceStore, me.verticalListeners);

            me.reconfigure(me.timeAxis, me.verticalColumns.concat(me.createResourceColumns(me.resourceColumnWidth || me.timeAxisViewModel.resourceColumnWidth)));

            Ext.Array.forEach(me.lockedGrid.query('gridcolumn'), function(col) { lockedWidth += col.rendered ? col.getWidth() : col.width || 100; });

            schedulingView.setColumnWidth(me.timeAxisViewModel.resourceColumnWidth || 100, true);

            me.lockedGrid.setWidth(lockedWidth);
        }

        lockedView.un('beforerefresh', preventer);
        schedulingView.un('beforerefresh', preventer);
        schedulingView.blockRefresh = lockedView.blockRefresh = false;

        me.getView().refresh();

        this.fireEvent('modechange', this, mode);
        this.fireEvent('orientationchange', this, mode);
    },

    createCalendarRows    : function () {
        var me      = this;
        var rows    = me.timeAxis.getRowTicks();

        // we have to cache calerndar rows amount to use it in timeAxisViewModel calculations
        me.timeAxisViewModel.calendarRowsAmount = rows.length;

        return new Ext.data.Store({
            model   : 'Sch.model.TimeAxisTick',
            data    : rows
        });
    },

    createCalendarColumns : function () {
        var me              = this;
        var currentHeader   = me.timeAxis.headerConfig.middle;
        var columns         = [];

        me.timeAxis.forEachAuxInterval(currentHeader.splitUnit, null, function (start, end, i) {
            // we iterate not over generated ticks, but over split units which are used to build columns
            // so this method wouldn't return correct start/end dates in case startTime/endTime has changed
            start.setHours(this.startTime);
            end = new Date(start);
            end.setHours(this.endTime);

            var header = {
                xtype       : 'weekview-day',
                renderer    : me.mainRenderer,
                scope       : me,
                start       : start,
                end         : end
            };

            if (currentHeader.renderer) {
                header.text = currentHeader.renderer.call(currentHeader.scope || me, start, end, header, i, me.eventStore);
            } else {
                header.text = Ext.Date.format(start, currentHeader.dateFormat);
            }

            columns.push(header);
        });

        return columns;
    },

    /**
     * Sets the row height of the timeline panel
     * @param {Number} height The height to set
     * @param {Boolean} preventRefresh `true` to prevent view refresh
     */
    setRowHeight: function (height, preventRefresh) {
        // Prevent any side effects if the panel is not yet done initializing
        preventRefresh = preventRefresh || !this.lockedGrid;

        this.timeAxisViewModel.setViewRowHeight(height, preventRefresh);
    },

    onNormalViewItemUpdate : function (record, index, oldRowEl) {
        if (this.lockedGridDependsOnSchedule) {
            var lockedView = this.lockedGrid.getView();

            lockedView.suspendEvents();
            // we cannot trust 'index' argument it may be wrong in case of grouping feature enabled
            lockedView.refreshNode(lockedView.indexOf(record));
            lockedView.resumeEvents();
        }
    }
});

