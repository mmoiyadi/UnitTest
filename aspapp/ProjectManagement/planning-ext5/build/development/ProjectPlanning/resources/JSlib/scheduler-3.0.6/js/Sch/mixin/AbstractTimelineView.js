/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.mixin.AbstractTimelineView
@private

A base mixin for giving to the consuming view "time line" functionality.
This means that the view will be capable to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

This class should not be used directly.

*/
Ext.define("Sch.mixin.AbstractTimelineView", {
    requires: [
        'Sch.data.TimeAxis',
        'Sch.view.Horizontal'
    ],

    /**
    * @cfg {String} selectedEventCls
    * A CSS class to apply to an event in the view on mouseover (defaults to 'sch-event-selected').
    */
    selectedEventCls : 'sch-event-selected',

    // private
    readOnly            : false,
    horizontalViewClass : 'Sch.view.Horizontal',

    //    can not "declare" it here, because will conflict with the default value from  SchedulerView
    //    verticalViewClass   : null,

    timeCellCls         : 'sch-timetd',
    timeCellSelector    : '.sch-timetd',

    eventBorderWidth        : 1,

    timeAxis            : null,
    timeAxisViewModel   : null,

    eventPrefix         : null,

    rowHeight           : null,
//    can not "declare" it here, because will conflict with the default value from  SchedulerView
//    barMargin           : null,

    // deprecated
    orientation         : 'horizontal',
    mode                : 'horizontal',

    horizontal          : null,
    vertical            : null,

    secondaryCanvasEl   : null,

    panel               : null,

    displayDateFormat   : null,

    // Accessor to the Ext.Element for this view
    el                  : null,

    constructor : function (config) {
        if (config && config.orientation) {
            config.mode = this.mode = config.orientation;
        }
        this.callParent([config]);
    },

    _initializeTimelineView         : function() {
        if (this.horizontalViewClass) {
            this.horizontal = Ext.create(this.horizontalViewClass, { view : this });
        }

        if (this.verticalViewClass) {
            this.vertical = Ext.create(this.verticalViewClass, { view : this });
        }

        if (this.calendarViewClass) {
            this.calendar = Ext.create(this.calendarViewClass, { view : this });
        }

        this.eventPrefix = (this.eventPrefix || this.getId()) + '-';
    },

    getTimeAxisViewModel : function () {
        return this.timeAxisViewModel;
    },

    /**
    * Method to get a formatted display date
    * @private
    * @param {Date} date The date
    * @return {String} The formatted date
    */
    getFormattedDate: function (date) {
        return Ext.Date.format(date, this.getDisplayDateFormat());
    },

    /**
    * Method to get a formatted end date for a scheduled event, the grid uses the "displayDateFormat" property defined in the current view preset.
    * @private
    * @param {Date} endDate The date to format
    * @param {Date} startDate The start date
    * @return {String} The formatted date
    */
    getFormattedEndDate: function (endDate, startDate) {
        var format = this.getDisplayDateFormat();

        if (
            // If time is midnight,
            endDate.getHours() === 0 && endDate.getMinutes() === 0 &&

            // and end date is greater then start date
            !(endDate.getYear() === startDate.getYear() && endDate.getMonth() === startDate.getMonth() && endDate.getDate() === startDate.getDate()) &&

            // and UI display format doesn't contain hour info (in this case we'll just display the exact date)
            !Sch.util.Date.hourInfoRe.test(format.replace(Sch.util.Date.stripEscapeRe, ''))
        ) {
            // format the date inclusively as 'the whole previous day'.
            endDate = Sch.util.Date.add(endDate, Sch.util.Date.DAY, -1);
        }

        return Ext.Date.format(endDate, format);
    },

    // private
    getDisplayDateFormat: function () {
        return this.displayDateFormat;
    },

    // private
    setDisplayDateFormat: function (format) {
        this.displayDateFormat = format;
    },


    /**
    * This function fits the schedule area columns into the available space in the grid.
    * @param {Boolean} preventRefresh `true` to prevent a refresh of view
    */
    fitColumns: function (preventRefresh) { // TODO test
        if (this.mode === 'horizontal') {
            this.getTimeAxisViewModel().fitToAvailableWidth(preventRefresh);
        } else {
            var w = Math.floor((this.panel.getWidth() - Ext.getScrollbarSize().width - 1) / this.headerCt.getColumnCount());
            this.setColumnWidth(w, preventRefresh);
        }
    },

    /**
     * Returns the Ext.Element representing an event record.
     *
     * @param {Sch.model.Event} eventRecord An event record
     * @param {Sch.model.Resource} [resourceRecord] A resource record
     *
     * @return {Ext.Element|null} The Ext.Element representing the event record
     * @deprecated Please use {@link #getElementsFromEventRecord}.
     */
    getElementFromEventRecord: function(eventRecord, resourceRecord) {
        var me = this,
            result;

        result = me.getElementsFromEventRecord(eventRecord, resourceRecord);

        if (result.length === 0) {
            result = null;
        }
        else if (result.length == 1) {
            result = result[0]; // We return Ext.Element as given in the method documentation
        }
        // TODO: Get rid of this else if branch, backward compatible behaviour
        else if (me.mode == 'calendar') {
            result = result[0];
        }
        else {
            Ext.Error.raise("The method getElementFromEventRecord() is deprecated, it can't handle the situation when several DOM elements correspond to a single event record, please use getElementsFromEventRecord() method instead!");
        }

        return result;
    },

    /**
     * Returns all the Ext.Element(s) representing an event record.
     *
     * @param {Sch.model.Event} eventRecord An event record
     * @param {Sch.model.Resource} [resourceRecord] A resource record
     *
     * @privateparam {Number} [index] Index used to distinguish DOM nodes corresponding to same event/resource but rendered on different columns inside calendar view.
     * @privateparam {Boolean [raw=false] Whether to return HTMLElements instead of Ext.Element
     *
     * @return {[Ext.Element|HTMLElement]} The Ext.Element(s) representing the event record
     */
    getElementsFromEventRecord: function(eventRecord, resourceRecord, index, raw) {
        var me = this,
            query;

        raw = raw || false;

        if (resourceRecord && (index !== null && index !== undefined)) {
            query = '[id^=' + me.eventPrefix + eventRecord.internalId + '-' + resourceRecord.internalId + '-' + index +']';
        }
        else if (resourceRecord) {
            query = '[id^=' + me.eventPrefix + eventRecord.internalId + '-' + resourceRecord.internalId + '-]';
        }
        else {
            query = '[id^=' + me.eventPrefix + eventRecord.internalId + '-]';
        }

        return me.getEl().query(query, raw);
    },

    /**
    * Gets the start and end dates for an element Region
    * @param {Ext.util.Region} region The region to map to start and end dates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Object} an object containing start/end properties
    */
    getStartEndDatesFromRegion: function (region, roundingMethod, allowPartial) {
        return this[this.mode].getStartEndDatesFromRegion(region, roundingMethod, allowPartial);
    },


    /**
    * Returns the current time resolution object, which contains a unit identifier and an increment count.
    * @return {Object} The time resolution object
    */
    getTimeResolution: function () {
        return this.timeAxis.getResolution();
    },

    /**
    * Sets the current time resolution, composed by a unit identifier and an increment count.
    * @return {Object} The time resolution object
    */
    setTimeResolution: function (unit, increment) {
        this.timeAxis.setResolution(unit, increment);

        // View will have to be updated to support snap to increment
        if (this.getTimeAxisViewModel().snapToIncrement) {
            this.refreshKeepingScroll();
        }
    },

    /**
    * <p>Returns the event id for a DOM id </p>
    * @private
    * @param {String} id The id of the DOM node
    * @return {String} An event record (internal) id
    */
    getEventIdFromDomNodeId: function (id) {
        // id format is "PREFIX"-eventid-resourceid[-part]
        return id.substring(this.eventPrefix.length).split('-')[0];
    },

    /**
     * Returns a resource id for a DOM id
     * @private
     * @param {String} id An id of an event DOM node
     * @return {String} A resource record (internal) id
     */
    getResourceIdFromDomNodeId : function(id) {
        // id format is "PREFIX"-eventid-resourceid[-part]
        return id.substring(this.eventPrefix.length).split('-')[1];
    },

    /**
    *  Gets the time for a DOM event such as 'mousemove' or 'click'
    *  @param {Ext.EventObject} e, the EventObject instance
    *  @param {String} roundingMethod (optional), 'floor' to floor the value or 'round' to round the value to nearest increment
    *  @returns {Date} The date corresponding to the EventObject x coordinate
    */
    getDateFromDomEvent : function(e, roundingMethod) {
        return this.getDateFromXY(e.getXY(), roundingMethod);
    },

    /**
    * [Experimental] Returns the pixel increment for the current view resolution.
    * @return {Number} The width increment
    */
    getSnapPixelAmount: function () {
        return this.getTimeAxisViewModel().getSnapPixelAmount();
    },

    /**
    * Controls whether the scheduler should snap to the resolution when interacting with it.
    * @param {Boolean} enabled true to enable snapping when interacting with events.
    */
    setSnapEnabled: function (enabled) {
        this.getTimeAxisViewModel().setSnapToIncrement(enabled);
    },

    /**
    * Sets the readonly state which limits the interactivity (resizing, drag and drop etc).
    * @param {Boolean} readOnly The new readOnly state
    */
    setReadOnly: function (readOnly) {
        this.readOnly = readOnly;
        this[readOnly ? 'addCls' : 'removeCls'](this._cmpCls + '-readonly');
    },

    /**
    * Returns true if the view is currently readOnly.
    * @return {Boolean} readOnly
    */
    isReadOnly: function () {
        return this.readOnly;
    },


    /**
    * Sets the current orientation.
    * @param {String} orientation Either 'horizontal' or 'vertical'
    * @deprecated
    */
    setOrientation  : function () {
        this.setMode.apply(this, arguments);
    },

    /**
    * Sets the current mode.
    * @param {String} mode Either 'horizontal', 'vertical' or 'calendar'
    */
    setMode : function (mode) {
        this.mode                   = mode;
        this.timeAxisViewModel.mode = mode;
    },

    /**
    * Returns the current view orientation
    * @return {String} The view orientation ('horizontal' or 'vertical')
    * @deprecated
    */
    getOrientation  : function () {
        return this.getMode.apply(this, arguments);
    },

    /**
    * Returns the current view mode
    * @return {String} The view mode ('horizontal', 'vertical' or 'calendar')
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
    * Gets the date for an XY coordinate
    * @param {Array} xy The page X and Y coordinates
    * @param {String} roundingMethod The rounding method to use
    * @param {Boolean} local, true if the coordinate is local to the scheduler view element
    * @returns {Date} the Date corresponding to the xy coordinate
    */
    getDateFromXY: function (xy, roundingMethod, local) {
        return this[this.mode].getDateFromXY(xy, roundingMethod, local);
    },

    /**
    * Gets the date for an X or Y coordinate, either local to the view element or the page based on the 3rd argument.
    * @param {Number} coordinate The X or Y coordinate
    * @param {String} roundingMethod The rounding method to use
    * @param {Boolean} local, true if the coordinate is local to the scheduler view element
    * @returns {Date} the Date corresponding to the xy coordinate
    */
    getDateFromCoordinate: function (coord, roundingMethod, local) {
        if (!local) {
            coord = this[this.mode].translateToScheduleCoordinate(coord);
        }
        return this.timeAxisViewModel.getDateFromPosition(coord, roundingMethod);
    },

    /**
    * Gets the date for the passed X coordinate.
    * If the coordinate is not in the currently rendered view, -1 will be returned.
    * @param {Number} x The X coordinate
    * @param {String} roundingMethod The rounding method to use
    * @returns {Date} the Date corresponding to the x coordinate
    * @abstract
    */
    getDateFromX: function (x, roundingMethod) {
        return this.getDateFromCoordinate(x, roundingMethod);
    },

    /**
    * Gets the date for the passed Y coordinate
    * If the coordinate is not in the currently rendered view, -1 will be returned.
    * @param {Number} y The Y coordinate
    * @param {String} roundingMethod The rounding method to use
    * @returns {Date} the Date corresponding to the y coordinate
    * @abstract
    */
    getDateFromY: function (y, roundingMethod) {
        return this.getDateFromCoordinate(y, roundingMethod);
    },

    /**
    *  Gets the x or y coordinate relative to the scheduling view element, or page coordinate (based on the 'local' flag)
    *  If the coordinate is not in the currently rendered view, -1 will be returned.
    *  @param {Date} date the date to query for
    *  @param {Boolean} local true to return a coordinate local to the scheduler view element (defaults to true)
    *  @returns {Number} the x or y position representing the date on the time axis
    */
    getCoordinateFromDate: function (date, local) {
        var pos = this.timeAxisViewModel.getPositionFromDate(date);

        if (local === false) {
            pos = this[this.mode].translateToPageCoordinate(pos);
        }

        return Math.round(pos);
    },

    /**
    *  Gets the x coordinate relative to the scheduling view element, or page coordinate (based on the 'local' flag)
    *  @param {Date} date the date to query for
    *  @param {Boolean} local true to return a coordinate local to the scheduler view element (defaults to false)
    *  @returns {Array} the XY coordinates representing the date
    */
    getXFromDate: function (date, local) {
        return this.getCoordinateFromDate(date, local);
    },

    /**
    *  Gets xy coordinates relative to the scheduling view element, or page coordinates (based on the 'local' flag)
    *  @param {Date} xy the page X and Y coordinates
    *  @param {Boolean} local true to return a coordinate local to the scheduler view element
    *  @returns {Array} the XY coordinates representing the date
    */
    getYFromDate: function (date, local) {
        return this.getCoordinateFromDate(date, local);
    },

    /**
    *  Returns the distance in pixels the for time span in the view.
    *  @param {Date} startDate The start date of the span
    *  @param {Date} endDate The end date of the span
    *  @return {Number} The distance in pixels
    */
    getTimeSpanDistance: function (startDate, endDate) {
        return this.timeAxisViewModel.getDistanceBetweenDates(startDate, endDate);
    },

    /**
    *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
    *  @param {Date} startDate The start date of the span
    *  @param {Date} endDate The end date of the span
    *  @return {Ext.util.Region} The region for the time span
    */
    getTimeSpanRegion: function (startDate, endDate) {
        return this[this.mode].getTimeSpanRegion(startDate, endDate);
    },

    /**
    * Gets the Ext.util.Region represented by the schedule and optionally only for a single resource. The view will ask the scheduler for
    * the resource availability by calling getResourceAvailability. By overriding that method you can constrain events differently for
    * different resources.
    * @param {Sch.model.Resource} resourceRecord (optional) The resource record
    * @param {Sch.model.Event} eventRecord (optional) The event record
    * @return {Ext.util.Region} The region of the schedule
    */
    getScheduleRegion: function (resourceRecord, eventRecord) {
        return this[this.mode].getScheduleRegion(resourceRecord, eventRecord);
    },

    // Returns the region of the table element containing the rows of the schedule
    getTableRegion : function () {
        throw 'Abstract method call';
    },

    // Returns the table element containing the rows of the schedule
    getRowNode: function (resourceRecord) {
        throw 'Abstract method call';
    },

    getRecordForRowNode : function(node) {
        throw 'Abstract method call';
    },

    /**
    * Method to get the currently visible date range in a scheduling view. Please note that it only works when the schedule is rendered.
    * @return {Object} object with `startDate` and `endDate` properties.
    */
    getVisibleDateRange: function () {
        return this[this.mode].getVisibleDateRange();
    },

    /**
     * Method to set the new columnWidth. The new width is passed in the case of a horizontal mode as tickWidth, resourceColumnWidth in the case of a vertical mode
     * and as calendarColumnWidth in the case of a calendar mode.
     * @param {Number} width The new width value
     * @param {Boolean} preventRefresh true to skip refreshing the view
     */
    setColumnWidth: function (width, preventRefresh) {
        this[this.mode].setColumnWidth(width, preventRefresh);
    },

    findRowByChild : function(t) {
        throw 'Abstract method call';
    },

    /**
    * Sets the amount of margin to keep between bars and rows.
    * @param {Number} margin The new margin value
    * @param {Boolean} preventRefresh true to skip refreshing the view
    */
    setBarMargin: function (margin, preventRefresh) {
        this.barMargin = margin;

        if (!preventRefresh) {
            this.refreshKeepingScroll();
        }
    },

    /**
     * Returns the current row height used by the view (only applicable in a horizontal view)
     * @return {Number} The row height
     */
    getRowHeight: function () {
        return this.timeAxisViewModel.getViewRowHeight();
    },

    /**
    * Sets the row height of the timeline
    * @param {Number} height The height to set
    * @param {Boolean} preventRefresh `true` to prevent view refresh
    */
    setRowHeight: function (height, preventRefresh) {
        this.timeAxisViewModel.setViewRowHeight(height, preventRefresh);
    },

    /**
    * Refreshes the view and maintains the scroll position.
    */
    refreshKeepingScroll : function() {
        throw 'Abstract method call';
    },

    /**
     * Scrolls the view vertically
     * @param {Number} y The y-value to scroll to
     * @param {Boolean/Object} animate An animation config, or true/false
     */
    scrollVerticallyTo : function(y, animate) {
        throw 'Abstract method call';
    },

    /**
     * Scrolls the view horizontally
     * @param {Number} x The x-value to scroll to
     * @param {Boolean/Object} animate An animation config, or true/false
     */
    scrollHorizontallyTo : function(x, animate) {
        throw 'Abstract method call';
    },

    /**
     * Returns the current vertical scroll value
     */
    getVerticalScroll : function() {
        throw 'Abstract method call';
    },

    /**
     * Returns the current horizontal scroll value
     */
    getHorizontalScroll : function() {
        throw 'Abstract method call';
    },

    // This method should be implemented by the consuming class
    getEl : Ext.emptyFn,


    // returns a secondary canvas el - the el to be used for drawing column lines, zones etc
    getSecondaryCanvasEl : function () {
        if (!this.rendered) throw 'Calling this method too early';

        if (!this.secondaryCanvasEl) {
            this.secondaryCanvasEl = (this.scrollerEl || this.getEl()).createChild({ cls : 'sch-secondary-canvas' });
        }
        return this.secondaryCanvasEl;
    },

    /**
     * Returns the current viewport scroll position as an object with left/top properties.
     */
    getScroll : function() {
        throw 'Abstract method call';
    },

    getOuterEl : function() {
        return this.getEl();
    },

    getRowContainerEl : function() {
        return this.getEl();
    },

    getScheduleCell : function(row, col) {
        return this.getCellByPosition({ row : row, column : col});
    },


    getScrollEventSource : function () {
        return this.getEl();
    },

    getViewportHeight : function () {
        return this.getEl().getHeight();
    },

    getViewportWidth : function () {
        return this.getEl().getWidth();
    },

    /**
     * Returns the center date of the currently visible timespan of scheduler.
     *
     * @return {Date} date Center date for the viewport.
     */
    getViewportCenterDate: function(){
        var scroll     = this.getScroll(),
            xy;

        if (this.getMode() === 'vertical') {
            xy                 = [ 0, scroll.top + this.getViewportHeight() / 2 ];
        } else {
            xy                 = [ scroll.left + this.getViewportWidth() / 2, 0 ];
        }

        return this.getDateFromXY(xy, null, true);
    },

    getDateConstraints : Ext.emptyFn
});


Ext.apply(Sch, {
    /*VERSION*/
});
