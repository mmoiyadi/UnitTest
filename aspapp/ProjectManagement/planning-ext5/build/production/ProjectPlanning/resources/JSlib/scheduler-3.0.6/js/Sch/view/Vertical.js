/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.view.Vertical

A mixin, purposed to be consumed along with {@link Sch.mixin.AbstractTimelineView} and providing the implementation of some methods, specific to vertical mode.

*/
Ext.define("Sch.view.Vertical", {

    // Provided by creator, in the config object
    view : null,

    constructor : function(config) {
        Ext.apply(this, config);
    },

    translateToScheduleCoordinate: function (y) {
        var view = this.view;
        return y - view.getEl().getY() + view.getScroll().top;
    },

    // private
    translateToPageCoordinate: function (y) {
        var view = this.view;
        var el = view.getEl(),
            scroll = el.getScroll();

        return y + el.getY() - scroll.top;
    },

    getDateFromXY   : function (xy, roundingMethod, local) {
        var coord   = xy[1];

        if (!local) {
            coord = this.translateToScheduleCoordinate(coord);
        }
        return this.view.timeAxisViewModel.getDateFromPosition(coord, roundingMethod);
    },

    getEventRenderData : function(event, resource, columnIndex) {
        var eventStart  = event.getStartDate(),
            eventEnd    = event.getEndDate(),
            view        = this.view,
            viewStart   = view.timeAxis.getStart(),
            viewEnd     = view.timeAxis.getEnd(),
            M           = Math,
            startY      = M.floor(view.getCoordinateFromDate(Sch.util.Date.max(eventStart, viewStart))),
            endY        = M.floor(view.getCoordinateFromDate(Sch.util.Date.min(eventEnd, viewEnd))),
            colWidth    = this.getResourceColumnWidth(resource),
            data;

        data = {
            top     : M.max(0, M.min(startY, endY) - view.eventBorderWidth),
            height  : M.max(1, M.abs(startY - endY))
        };

        if (view.managedEventSizing) {
            data.left = view.barMargin;
            data.width = colWidth - (2*view.barMargin) - view.eventBorderWidth;
        }

        data.start = eventStart;
        data.end = eventEnd;
        data.startsOutsideView = eventStart < viewStart;
        data.endsOutsideView = eventEnd > viewEnd;

        return data;
    },

    getScheduleRegion: function (resourceRecord, eventRecord) {
        var view        = this.view,
            region      = resourceRecord ? Ext.fly(view.getScheduleCell(0, view.resourceStore.indexOf(resourceRecord))).getRegion() : view.getTableRegion(),

            taStart     = view.timeAxis.getStart(),
            taEnd       = view.timeAxis.getEnd(),

            dateConstraints     = view.getDateConstraints(resourceRecord, eventRecord) || { start: taStart, end: taEnd },

            startY      = this.translateToPageCoordinate(view.getCoordinateFromDate(Sch.util.Date.max(taStart, dateConstraints.start))),
            endY        = this.translateToPageCoordinate(view.getCoordinateFromDate(Sch.util.Date.min(taEnd, dateConstraints.end))),

            left        = region.left + view.barMargin,
            right       = (resourceRecord ? (region.left + this.getResourceColumnWidth(resourceRecord)) : region.right) - view.barMargin;

        return new Ext.util.Region(Math.min(startY, endY), right, Math.max(startY, endY), left);
    },

    getResourceColumnWidth : function(resource) {
        return this.view.timeAxisViewModel.resourceColumnWidth;
    },

    /**
    * Gets the Ext.util.Region representing the passed resource and optionally just for a certain date interval.
    * @param {Sch.model.Resource} resourceRecord The resource record
    * @param {Date} startDate A start date constraining the region
    * @param {Date} endDate An end date constraining the region
    * @return {Ext.util.Region} The region of the resource
    */
    getResourceRegion: function (resourceRecord, startDate, endDate) {
        var view            = this.view,
            cellLeft        = view.resourceStore.indexOf(resourceRecord) * this.getResourceColumnWidth(resourceRecord),
            taStart         = view.timeAxis.getStart(),
            taEnd           = view.timeAxis.getEnd(),
            start           = startDate ? Sch.util.Date.max(taStart, startDate) : taStart,
            end             = endDate ? Sch.util.Date.min(taEnd, endDate) : taEnd,
            startY          = Math.max(0, view.getCoordinateFromDate(start) - view.cellTopBorderWidth),
            endY            = view.getCoordinateFromDate(end) - view.cellTopBorderWidth,
            left            = cellLeft + view.cellBorderWidth,
            right           = cellLeft + this.getResourceColumnWidth(resourceRecord) - view.cellBorderWidth;

        return new Ext.util.Region(Math.min(startY, endY), right, Math.max(startY, endY), left);
    },

    columnRenderer: function (val, meta, resourceRecord, rowIndex, colIndex) {
        var view = this.view;
        var retVal = '';

        if (rowIndex === 0) {
            var D               = Sch.util.Date,
                ta              = view.timeAxis,
                columnEvents,
                resourceEvents,
                i, l;

            columnEvents = [];
            resourceEvents = view.eventStore.getEventsForResource(resourceRecord);

            // Iterate events (belonging to current resource)
            for (i = 0, l = resourceEvents.length; i < l; i++) {
                var event   = resourceEvents[i],
                    start   = event.getStartDate(),
                    end     = event.getEndDate();

                // Determine if the event should be rendered or not
                if (start && end && ta.timeSpanInAxis(start, end)) {
                    columnEvents.push(view.generateTplData(event, resourceRecord, colIndex));
                }
            }
            view.eventLayout.vertical.applyLayout(columnEvents, this.getResourceColumnWidth(resourceRecord));
            retVal = '&#160;' + view.eventTpl.apply(columnEvents);
        }

        if (colIndex % 2 === 1) {
            meta.tdCls = (meta.tdCls || '') + ' ' + view.altColCls;
            meta.cellCls = (meta.cellCls || '') + ' ' + view.altColCls;
        }

        return retVal;
    },

    // private
    resolveResource: function(node) {
        var me     = this,
            view   = me.view,
            eventNode,
            index,
            result;

        eventNode = Ext.fly(node).is(view.eventSelector) && node || Ext.fly(node).up(view.eventSelector, null, true);

        if (eventNode) {
            // Fast case
            result = view.getResourceRecordFromDomId(eventNode.id);
        }
        else {
            // Not that fast case
            // I'm not sure if it's really needed, the method documentation doesn't state that node must be
            // within event node. If node might be outside of event node then yes, this branch is needed, otherwise
            // it is not.
            node = Ext.fly(node).is(view.timeCellSelector) ? node : Ext.fly(node).up(view.timeCellSelector, null, true);
            index = -1;

            if (node && Ext.isIE8m) {
                node = node.previousSibling;
                while (node) {
                    if (node.nodeType === 1 ) {
                        index++;
                    }
                    node = node.previousSibling;
                }
            }
            else if (node) {
                index = Ext.Array.indexOf(Array.prototype.slice.call(node.parentNode.children), node);
            }

            result = index >= 0 && view.resourceStore.getAt(index) || null;
        }

        return result;
    },

    // private
    onEventUpdate: function (store, event) {
        var me = this;
        var previous = event.previous || {};
        var view = me.view;
        var timeAxis = view.timeAxis;

        var newStartDate  = event.getStartDate();
        var newEndDate    = event.getEndDate();

        var startDate       = previous.StartDate || newStartDate;
        var endDate         = previous.EndDate || newEndDate;

        // event was visible or visible now
        var eventWasInView  = startDate && endDate && timeAxis.timeSpanInAxis(startDate, endDate);

        var resource;

        // resource has to be repainted only if it was changed and event was rendered/is still rendered
        if (event.resourceIdField in previous && eventWasInView) {
            // If an event has been moved to a new resource, refresh old resource first
            resource = store.getResourceStore().getById(previous[event.resourceIdField]);
            resource && me.relayoutRenderedEvents(resource);
        }

        // also resource has to be repanted if event was moved inside/outside of time axis
        if ((newStartDate && newEndDate && timeAxis.timeSpanInAxis(newStartDate, newEndDate)) || eventWasInView) {
            me.renderSingle(event);
            Ext.Array.forEach(event.getResources(), function(resource) {
                me.relayoutRenderedEvents(resource);
                view.getEventSelectionModel().isSelected(event) && view.onEventBarSelect(event, true);
            });
        }
    },

    // private
    onEventAdd: function (store, recs) {
        var me = this,
            view = me.view,
            event, startDate, endDate;

        if (recs.length === 1) {
            event     = recs[0];
            startDate = event.getStartDate();
            endDate   = event.getEndDate();

            if (startDate && endDate && view.timeAxis.timeSpanInAxis(startDate, endDate)) {
                me.renderSingle(event);
                // Here one could use event.getResources() as well, I use store.getResourcesForEvent() here
                // for consistency with onEventUpdate only
                Ext.Array.forEach(store.getResourcesForEvent(event), function(resource) {
                    me.relayoutRenderedEvents(resource);
                });
            }
        } else {
            view.repaintAllEvents();
        }
    },

    // private
    onEventRemove: function (s, events) {
        // a comment from `repaintEventsForResource`
        // For vertical, we always repaint all events (do per-column repaint is not supported)
        // so it seems we can't optimize and repaint only for single resource
        var me = this,
            view = me.view,
            event,
            startDate,
            endDate,
            i, len, gotEventInTimeSpan;

        for (gotEventInTimeSpan = false, i = 0, len = events.length; !gotEventInTimeSpan && i < len; i++) {
            event       = events[i];
            startDate   = event.getStartDate();
            endDate     = event.getEndDate();

            gotEventInTimeSpan = startDate && endDate && view.timeAxis.timeSpanInAxis(startDate, endDate);
            gotEventInTimeSpan && view.repaintAllEvents();
        }
    },


    relayoutRenderedEvents : function(resource) {
        var data   = [],
            view   = this.view,
            events = view.eventStore.getEventsForResource(resource);

        Ext.Array.forEach(view.eventStore.getEventsForResource(resource), function(event) {
            // In vertical mode there can be only 0 or 1 nodes rendered for each event/resource pair
            var nodes = view.getElementsFromEventRecord(event, resource);

            nodes.length && data.push({
                start : event.getStartDate(),
                end   : event.getEndDate(),
                event : event,
                node  : nodes[0]
            });
        });

        // Now do a layout pass to get updated dimension / position data for all affected events
        view.eventLayout.vertical.applyLayout(data, this.getResourceColumnWidth(resource));

        Ext.Array.forEach(data, function(event) {
            event.node.setStyle({
                left  : event.left + 'px',
                width : event.width + 'px'
            });

            view.fireEvent('eventrepaint', view, event.event, event.node);
        });
    },

    renderSingle : function (event) {
        // Inject moved event into correct cell
        var me          = this,
            view        = me.view,
            startDate   = event.getStartDate(),
            endDate     = event.getEndDate(),
            resources;

        // First removing existing event DOM elements, there might be one element per each event/resource pair
        Ext.Array.forEach(view.getElementsFromEventRecord(event), function(el) {
            el.destroy();
        });

        // If event is within a currently displayed timespan
        if (startDate && endDate && view.timeAxis.timeSpanInAxis(startDate, endDate)) {
            // then render event DOM elements for each event assigned resource
            Ext.Array.forEach(event.getResources(), function(resource) {
                var rIndex        = view.resourceStore.indexOf(resource),
                    containerCell = Ext.fly(view.getScheduleCell(0, rIndex)),
                    data;

                if (containerCell) { // This check is unclear, I've just left it as is after the method refactoring
                    data = view.generateTplData(event, resource, rIndex);
                    view.eventTpl.append(containerCell.first(), [data]);
                }
            });
        }
    },

    /**
    *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
    *  @param {Date} startDate The start date of the span
    *  @param {Date} endDate The end date of the span
    *  @return {Ext.util.Region} The region for the time span
    */
    getTimeSpanRegion: function (startDate, endDate) {
        var view        = this.view,
            startY      = view.getCoordinateFromDate(startDate),
            endY        = endDate ? view.getCoordinateFromDate(endDate) : startY,
            tableRegion = view.getTableRegion(),
            width       = tableRegion ? tableRegion.right - tableRegion.left : view.getEl().dom.clientWidth; // fallback in case grid is not rendered (no rows/table)

        return new Ext.util.Region(Math.min(startY, endY), width, Math.max(startY, endY), 0);
    },

    /**
    * Gets the start and end dates for an element Region
    * @param {Ext.util.Region} region The region to map to start and end dates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Object} an object containing start/end properties
    */
    getStartEndDatesFromRegion: function (region, roundingMethod, allowPartial) {
        var topDate = this.view.getDateFromCoordinate(region.top, roundingMethod),
            bottomDate = this.view.getDateFromCoordinate(region.bottom, roundingMethod);

        if (topDate && bottomDate) {
            return {
                start : Sch.util.Date.min(topDate, bottomDate),
                end : Sch.util.Date.max(topDate, bottomDate)
            };
        } else {
            return null;
        }
    },

    setColumnWidth : function (width, preventRefresh) {
        var view = this.view;

        view.resourceColumnWidth = width;
        view.getTimeAxisViewModel().setViewColumnWidth(width, preventRefresh);
    },

    /**
    * Method to get the currently visible date range in a scheduling view. Please note that it only works when the schedule is rendered.
    * @return {Object} object with `startDate` and `endDate` properties.
    */
    getVisibleDateRange: function () {
        var view = this.view;

        if (!view.rendered) {
            return null;
        }

        var scroll      = view.getScroll(),
            height      = view.getHeight(),
            tableRegion = view.getTableRegion(),
            viewEndDate = view.timeAxis.getEnd();

        if (tableRegion.bottom - tableRegion.top < height) {
            var startDate   = view.timeAxis.getStart();

            return { startDate: startDate, endDate: viewEndDate };
        }

        return {
            startDate   : view.getDateFromCoordinate(scroll.top, null, true),
            endDate     : view.getDateFromCoordinate(scroll.top + height, null, true) || viewEndDate
        };
    }
});
