/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.mixin.AbstractTimelinePanel
@private

A base mixin giving the consuming panel "time line" functionality.
This means that the panel will be capable to display a list of "events", along a {@link Sch.data.TimeAxis time axis}.

This class should not be used directly.

*/

Ext.define('Sch.mixin.AbstractTimelinePanel', {
    requires: [
        'Sch.data.TimeAxis',
        'Sch.view.model.TimeAxis',
        'Sch.feature.ColumnLines',
        'Sch.preset.Manager'
    ],

    mixins: [
        'Sch.mixin.Zoomable'
    ],
    
    /**
     * @cfg {String} orientation An initial orientation of the view - can be either `horizontal` or `vertical`. Default value is `horizontal`.
     * Options: ['horizontal', 'vertical']
     * @deprecated Use {@link #mode} instead
     */
    orientation             : 'horizontal',
    
    /**
     * @cfg {String} mode An initial mode of the view - can be either `calendar`, `horizontal` or `vertical`. Default value is `horizontal`.
     * Please note, that view preset for vertical and horizontal mode is defined by {@link #viewPreset} and view preset for calendar is 
     * defined by {@link #calendarViewPreset}
     * 
     * 
     * Options: ['calendar', 'horizontal', 'vertical']
     */

    /**
     * @cfg {Number} weekStartDay A valid JS date index between 0-6. (0: Sunday, 1: Monday etc.).
     */
    weekStartDay            : 1,

    /**
     * @cfg {Boolean} snapToIncrement true to snap to resolution increment while interacting with scheduled events.
     */
    snapToIncrement         : false,

    /**
     * @cfg {Boolean} readOnly true to disable editing.
     */
    readOnly                : false,

    /**
     * @cfg {Boolean} forceFit Set to true to force the time columns to fit to the available horizontal space.
     */
    forceFit                : false,

    /**
     * @cfg {String} eventResizeHandles Defines which resize handles to use for resizing events. Possible values: 'none', 'start', 'end', 'both'. Defaults to 'both'
     */
    eventResizeHandles      : 'both',

    /**
     * @cfg {Number} rowHeight The row height (used in horizontal mode only)
     */

    /**
     * @cfg {Sch.data.TimeAxis} timeAxis The backing store providing the input date data for the timeline panel.
     */
    timeAxis                : null,

    /**
     * @cfg {Boolean} autoAdjustTimeAxis The value for the {@link Sch.data.TimeAxis#autoAdjust} config option, which will be used
     * when creating the time axis instance. You can set this option to `false` to make the timeline panel start and end on the exact provided
     * {@link #startDate}/{@link #endDate} w/o adjusting them.
     */
    autoAdjustTimeAxis      : true,

    /**
     * @private
     * @cfg {Sch.view.model.TimeAxis/Object} timeAxisViewModel The backing view model for the visual representation of the time axis.
     * Either a real instance or a simple config object.
     */
    timeAxisViewModel       : null,

    /**
     * @cfg {Object} validatorFnScope
     * The scope used for the different validator functions.
     */

    /**
     * @cfg {Sch.crud.AbstractManager} crudManager The CRUD manager holding all the project stores.
     */
    crudManager : null,

    /**
     * @cfg {String} viewPreset
     * @property {String} viewPreset
     * A key used to lookup a predefined {@link Sch.preset.ViewPreset} (e.g. 'weekAndDay', 'hourAndDay'), managed by {@link Sch.preset.Manager}. See {@link Sch.preset.Manager} for more information.
     * 
     * 
     * Options: ['secondAndMinute', 'minuteAndHour', 'hourAndDay', 'dayAndWeek', 'weekAndDay', 'weekAndMonth', 'monthAndYear', 'year', 'manyYears', 'weekAndDayLetter', 'weekDateAndMonth']
     */
    viewPreset              : 'weekAndDay',
    
    /**
     * @cfg {String} calendarViewPreset
     * @property {String} calendarViewPreset
     * A key used to lookup a predefined {@link Sch.preset.ViewPreset}, managed by {@link Sch.preset.Manager}. See {@link Sch.preset.Manager} for more information.
     * Default view preset for scheduler in calendar mode
     * 
     * 
     * Options: ['day', 'week']
     */
    calendarViewPreset      : 'week',

    /**
     * @cfg {Boolean} trackHeaderOver `true` to highlight each header cell when the mouse is moved over it.
     */
    trackHeaderOver         : true,

    /**
     * @cfg {Date} startDate The start date of the timeline. If omitted, and a TimeAxis has been set, the start date of the provided {@link Sch.data.TimeAxis} will be used.
     * If no TimeAxis has been configured, it'll use the start/end dates of the loaded event dataset. If no date information exists in the event data
     * set, it defaults to the current date and time.
     */
    startDate               : null,

    /**
     * @cfg {Date} endDate The end date of the timeline. If omitted, it will be calculated based on the {@link #startDate} setting and
     * the 'defaultSpan' property of the current {@link #viewPreset}.
     */
    endDate                 : null,
    
    /**
     * @cfg {Number} startTime Start time for calendar mode, used only with day/week presets.
     */
    startTime               : 0,
    
    /**
     * @cfg {Number} endTime End time for calendar mode, used only with day/week presets.
     */
    endTime                 : 24,

    columnLines             : true,

    /**
     * Returns dates that will constrain resize and drag operations. The method will be called with the Resource, and
     * for operations on existing events - the event. For drag create operation, the mousedown date will be passed as the second parameter
     * @return {Object} Constaining object
     * @return {Date} return.start Start date
     * @return {Date} return.end End date
     */
    getDateConstraints		: Ext.emptyFn,
    
    /**
     * @cfg {Boolean} snapRelativeToEventStartDate Affects drag drop and resizing of events when {@link #snapToIncrement} is enabled. If set to `true`, dates will be snapped relative to event start.
     * e.g. for a zoom level with timeResolution = { unit: "s", increment: "20" }, an event that starts at 10:00:03 and is dragged would snap its start date to 10:00:23, 10:00:43 etc.
     * When set to `false`, dates will be snapped relative to the timeAxis startDate (tick start) - 10:00:03, 10:00:20, 10:00:40 etc.
     */
    snapRelativeToEventStartDate    : false,
    
    trackMouseOver          : false,

    // If user supplied a 'rowHeight' config or a panel subclass with such a value - skip reading this setting
    // from the viewpreset
    readRowHeightFromPreset : true,

    /**
     * @cfg {Number} eventBorderWidth
     * The width of the border of your event, needed to calculate the correct start/end positions
     */
    eventBorderWidth        : 1,

    /**
    * Returns the orientation of this panel, "horizontal" or "vertical"
    * @return {String}
    * @deprecated
    */
    getOrientation  : function () {
        return this.getMode.apply(this, arguments);
    },
    
    /**
    * Returns the mode of this panel, "horizontal", "vertical" or "calendar"
    * @return {String}
    */
    getMode: function () {
        return this.mode;
    },


    isHorizontal : function() {
        return this.getMode() === 'horizontal';
    },


    isVertical : function() {
        return !this.isHorizontal();
    },

    /**
     * @event beforeviewchange
     * Fires before the current view changes to a new view type or a new time span. Return false to abort this action.
     * @param {Sch.mixin.TimelinePanel} timelinePanel The timeline panel instance
     * @param {Object} preset The new preset
     */

    /**
     * @event viewchange
     * Fires after current view preset or time span has changed
     * @param {Sch.mixin.TimelinePanel} timelinePanel The timeline panel instance
     */


    cellBorderWidth         : 1,
    cellTopBorderWidth      : 1,        // 0 since Ext JS 4.2.1
    cellBottomBorderWidth   : 1,

    renderers               : null,


    // Must be called during initialization by consuming class
    _initializeTimelinePanel : function() {
        // this is an entry point to this mixin, so we should wrap 'mode' here
        this.mode = this.mode || this.orientation || 'horizontal';

        if (this.mode === 'calendar') {
            this.oldViewPreset  = this.viewPreset;
            this.viewPreset     = this.calendarViewPreset;    
        }
        
        var preset      = this.viewPreset && Sch.preset.Manager.getPreset(this.viewPreset);

        if (!preset) {
            throw 'You must define a valid view preset object. See Sch.preset.Manager class for reference';
        }

        this.initializeZooming();

        this.renderers                  = [];

        // Setting a rowHeight config on the panel should override any rowHeight value in the view presets
        if (this.readRowHeightFromPreset) {
            this.readRowHeightFromPreset    = !this.rowHeight;
        }

        if (!this.timeAxis) {
            this.timeAxis = new Sch.data.TimeAxis({ 
                autoAdjust  : this.autoAdjustTimeAxis,
                mode        : this.mode === 'calendar' ? 'calendar' : 'plain'
            });
        }

        if (!this.timeAxisViewModel || !(this.timeAxisViewModel instanceof Sch.view.model.TimeAxis)) {
            var config                  = Ext.apply({
                mode            : this.mode,
                snapToIncrement : this.snapToIncrement,
                forceFit        : this.forceFit,
                timeAxis        : this.timeAxis,
                eventStore      : this.getEventStore(),
                viewPreset      : this.viewPreset
            }, this.timeAxisViewModel || {});

            this.timeAxisViewModel      = new Sch.view.model.TimeAxis(config);
        }
        
        this.timeAxisViewModel.on('update', this.onTimeAxisViewModelUpdate, this);
        
        this.timeAxisViewModel.refCount++;

        this.on('destroy', this.onPanelDestroyed, this);
        
        var orientationClasses;
        switch (this.mode) {
            case 'horizontal'   : orientationClasses = ['sch-horizontal']; break;
            case 'vertical'     : orientationClasses = ['sch-vertical', 'sch-vertical-resource']; break;
            case 'calendar'     : orientationClasses = ['sch-vertical', 'sch-calendar']; break;
        }
        
        this.addCls([].concat.apply(['sch-timelinepanel'], orientationClasses));
    },

    onTimeAxisViewModelUpdate : function() {
        var view = this.getSchedulingView();

        if (view && view.viewReady) {
            view.refreshKeepingScroll();

            this.fireEvent('viewchange', this);
        }
    },

    onPanelDestroyed : function() {
        var timeAxisViewModel   = this.timeAxisViewModel;

        timeAxisViewModel.un('update', this.onTimeAxisViewModelUpdate, this);
        timeAxisViewModel.refCount--;

        if (timeAxisViewModel.refCount <= 0) {
            timeAxisViewModel.destroy();
        }
    },

    /**
    * @abstract
    *
    * @return {Sch.mixin.AbstractSchedulerView} A view consuming the {@link Sch.mixin.AbstractSchedulerView} mixin
    */
    getSchedulingView: function () {
        throw 'Abstract method call';
    },

    /**
    * The {@link #readOnly} accessor. Use it to switch the `readonly` state.
    */
    setReadOnly: function (readOnly) {
        this.getSchedulingView().setReadOnly(readOnly);
    },

    /**
    * Returns true if the panel is currently read only.
    * @return {Boolean} readOnly
    */
    isReadOnly: function () {
        return this.getSchedulingView().isReadOnly();
    },

    /**
     * Alias for {@link setViewPreset}
     */
    switchViewPreset: function () {
        this.setViewPreset.apply(this, arguments);
    },

    /**
     * Sets the current view preset. See the {@link Sch.preset.Manager} class for details.
     * Calling it will first fire a {@link Sch.panel.SchedulerGrid#beforeviewchange SchedulerGrid} /
     * {@link Sch.panel.SchedulerTree#beforeviewchange SchedulerTree} beforeviewchange event,
     * followed by a {@link Sch.panel.SchedulerGrid#viewchange SchedulerGrid} /
     * {@link Sch.panel.SchedulerTree#viewchange SchedulerTree} viewchange event.
     * Returning `false` from any 'beforeviewchange' listener will cancel the operation.
     *
     * @param {String} preset The id of the new preset (see {@link Sch.preset.Manager} for details)
     * @param {Date} [startDate] A new start date for the time axis
     * @param {Date} [endDate] A new end date for the time axis
     */
    setViewPreset : function(preset, startDate, endDate, initial, noScroll) {
        var timeAxis        = this.timeAxis;

        if (this.fireEvent('beforeviewchange', this, preset, startDate, endDate) !== false) {

            var isHorizontal        = this.getMode() === 'horizontal';

            if (Ext.isString(preset)) {
                this.viewPreset     = preset;
                preset              = Sch.preset.Manager.getPreset(preset);
            }

            if (!preset) {
                throw 'View preset not found';
            }

            // Timeaxis may already be configured (in case of sharing with the timeline partner), no need to reconfigure it
            if (!(initial && timeAxis.isConfigured)) {
                var timeAxisCfg     = {
                    weekStartDay    : this.weekStartDay,
                    startTime       : this.startTime,
                    endTime         : this.endTime
                };

                if (initial) {
                    if (timeAxis.getCount() === 0 || startDate) {
                        timeAxisCfg.start = startDate || new Date();
                    }
                } else {
                    timeAxisCfg.start   = startDate || timeAxis.getStart();
                }

                timeAxisCfg.end     = endDate;

                timeAxis.consumeViewPreset(preset);
                timeAxis.reconfigure(timeAxisCfg, true);

                this.timeAxisViewModel.reconfigure({
                    headerConfig        : preset.headerConfig,
                    columnLinesFor      : preset.columnLinesFor || 'middle',
                    rowHeightHorizontal : this.readRowHeightFromPreset ? preset.rowHeight : (this.rowHeight || this.timeAxisViewModel.getViewRowHeight()),
                    tickWidth           : isHorizontal ? preset.timeColumnWidth : preset.timeRowHeight || preset.timeColumnWidth || 60,
                    timeColumnWidth     : preset.timeColumnWidth,

                    // timeColumnWidth is also used for row height in vertical mode
                    rowHeightVertical   : preset.timeRowHeight || preset.timeColumnWidth || 60,
                    timeAxisColumnWidth : preset.timeAxisColumnWidth,
                    resourceColumnWidth : this.resourceColumnWidth || preset.resourceColumnWidth || 100
                });
            }

            var view = this.getSchedulingView();

            view.setDisplayDateFormat(preset.displayDateFormat);

            if (this.getMode() === 'vertical') {
                view.setColumnWidth(this.resourceColumnWidth || preset.resourceColumnWidth || 100, true);
            }

            if (!noScroll) {
                if (isHorizontal) {
                    view.scrollHorizontallyTo(0);
                } else {
                    view.scrollVerticallyTo(0);
                }
            }
        }
    },

    /**
     * Method to get the current view preset of the timeline panel.
     * @return {String} The name of the currently active view preset
     */
    getViewPreset : function() {
        return this.viewPreset;
    },

    /**
     * Method to get the current start date of the scheduler
     * @return {Date} The start date
     */
    getStart: function () {
        return this.getStartDate();
    },

    /**
     * Method to get the current start date of the scheduler
     * @return {Date} The start date
     */
    getStartDate: function () {
        return this.timeAxis.getStart();
    },


    /**
     * Method to get the current end date of the scheduler
     * @return {Date} The end date
     */
    getEnd: function () {
        return this.getEndDate();
    },

    /**
     * Method to get the current end date of the scheduler
     * @return {Date} The end date
     */
    getEndDate: function () {
        return this.timeAxis.getEnd();
    },

    /**
     * Updates the widths of all the time columns to the supplied value. Only applicable when {@link #forceFit} is set to false.
     * @param {Number} width The new time column width
     */
    setTimeColumnWidth: function (width, preventRefresh) {
        this.timeAxisViewModel.setTickWidth(width, preventRefresh);
    },

    /**
     * @return {Number} width The time column width
     */
    getTimeColumnWidth: function () {
        return this.timeAxisViewModel.getTickWidth();
    },

    getRowHeight: function () {
        return this.timeAxisViewModel.getViewRowHeight();
    },

    /**
    * Moves the time axis forward in time in units specified by the view preset 'shiftUnit', and by the amount specified by the parameter or by the shiftIncrement config of the current view preset.
    * @param {Number} amount (optional) The number of units to jump forward
    */
    shiftNext: function (amount) {
        this.suspendLayouts && this.suspendLayouts();

        this.timeAxis.shiftNext(amount);

        this.suspendLayouts && this.resumeLayouts(true);
    },

    /**
    * Moves the time axis backward in time in units specified by the view preset 'shiftUnit', and by the amount specified by the parameter or by the shiftIncrement config of the current view preset.
    * @param {Number} amount (optional) The number of units to jump backward
    */
    shiftPrevious: function (amount) {
        this.suspendLayouts && this.suspendLayouts();

        this.timeAxis.shiftPrevious(amount);

        this.suspendLayouts && this.resumeLayouts(true);
    },

    /**
    * Convenience method to go to current date.
    */
    goToNow: function () {
        this.setTimeSpan(new Date());
    },

    /**
    * Changes the time axis timespan to the supplied start and end dates.
    * @param {Date} start The new start date
    * @param {Date} end (Optional) The new end date. If not supplied, the {@link Sch.preset.ViewPreset#defaultSpan} property of the current view preset will be used to calculate the new end date.
    */
    setTimeSpan: function (start, end) {
        if (this.timeAxis) {
            this.timeAxis.setTimeSpan(start, end);
        }
    },

    /**
    * Changes the time axis start date to the supplied date.
    * @param {Date} amount The new start date
    */
    setStart: function (date) {
        this.setTimeSpan(date);
    },

    /**
    * Changes the time end start date to the supplied date.
    * @param {Date} amount The new end date
    */
    setEnd: function (date) {
        this.setTimeSpan(null, date);
    },

    /**
    * Returns the {@link Sch.data.TimeAxis} instance in use.
    * @return {Sch.data.TimeAxis}
    */
    getTimeAxis: function () {
        return this.timeAxis;
    },


    /**
    * Scrolls the time line to the specified `date`.
    * @param {Date} date The date to which to scroll the time line
    */
    scrollToDate: function (date, animate) {
        var view = this.getSchedulingView();
        var coordinate = view.getCoordinateFromDate(date, true);

        this.scrollToCoordinate(coordinate, date, animate, false);
    },

    /**
    * Scrolls the time line so that specified `date` is in the center of the view.
    * @param {Date} date The date to which to scroll the time line
    * @param {Boolean} animate (optional) Whether or not scroll should be animated 
    */
    scrollToDateCentered: function (date, animate) {
        var view = this.getSchedulingView();
        var delta = 0;
        
        if (this.mode === 'horizontal') {
            delta = view.getBox().width / 2;
        } else {
            delta = view.getBox().height / 2;
        }

        var coordinate = Math.round(view.getCoordinateFromDate(date, true) - delta);
        this.scrollToCoordinate(coordinate, date, animate, true);
    },

    //private
    scrollToCoordinate: function (coordinate, date, animate, centered) {
        var view    = this.getSchedulingView();
        var me      = this;
        // Not currently have this date in a timeaxis
        if (coordinate < 0) {
            if (this.infiniteScroll) {
                // for infinite scroll we have a special formula to calculate adjustment borders
                // shiftToDate() will perform adjustment and then recall scrollToDate() again
                view.shiftToDate(date, centered);

            } else {
                // adjust the timeaxis first
                var halfVisibleSpan = (this.timeAxis.getEnd() - this.timeAxis.getStart()) / 2;

                this.setTimeSpan(new Date(date.getTime() - halfVisibleSpan), new Date(date.getTime() + halfVisibleSpan));

                if (centered) {
                    me.scrollToDateCentered(date, animate);
                } else {
                    me.scrollToDate(date, animate);
                }
            }

            return;
        }

        if (this.mode === 'horizontal') {
            view.scrollHorizontallyTo(coordinate, animate);
        } else {
            view.scrollVerticallyTo(coordinate, animate);
        }
        view.fireEvent('scroll', this, coordinate);
    },

    /**
     * Returns the center date of the currently visible timespan of scheduler.
     *
     * @return {Date} date Center date for the viewport.
     */
    getViewportCenterDate: function(){
        return this.getSchedulingView().getViewportCenterDate();
    },

    addCls : function() {
        throw 'Abstract method call';
    },

    removeCls : function() {
        throw 'Abstract method call';
    },

    registerRenderer : function(fn, scope) {
        this.renderers.push({
            fn      : fn,
            scope   : scope
        });
    },

    deregisterRenderer : function(fn, scope) {
        Ext.each(this.renderers, function(rend, i) {
            if (fn === rend) {
                Ext.Array.removeAt(this.renderers, i);
                return false;
            }
        });
    }

    /**
     * Returns the event store instance
     * @method getEventStore
     * @abstract
     * @return {Ext.data.AbstractStore}
     */
});
