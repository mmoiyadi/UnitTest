/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.view.Calendar

A mixin, purposed to be consumed along with {@link Sch.mixin.AbstractTimelineView} and providing the implementation of some methods, specific to calendar mode.

*/
Ext.define("Sch.view.Calendar", {

    requires : [
        'Ext.util.Region'
    ],

    // Provided by creator, in the config object
    view : null,

    constructor : function(config) {
        Ext.apply(this, config);
    },

    // return columns that passes condition
    // if includeIndex is true then column index is also returned
    getColumnBy : function (conditionFn, includeIndex) {
        var columns = this.view.panel.headerCt.getGridColumns();

        var result = [];

        for (var i = 0; i < columns.length; i++) {
            if (conditionFn.call(this, columns[i])) {
                if (includeIndex !== true) {
                    result.push(columns[i]);
                } else {
                    result.push({
                        column  : columns[i],
                        index   : i
                    });
                }
            }
        }

        return result;
    },

    getEventColumns  : function (event, includeIndex) {
        return this.getColumnBy(function (column) {
            return !(event.getEndDate() <= column.start || event.getStartDate() >= column.end);
        }, includeIndex);
    },

    getColumnEvents : function (column) {
        var result  = [];

        this.view.eventStore.each(function (record) {
            if (!(record.getEndDate() <= column.start || record.getStartDate() >= column.end )) {
                result.push(record);
            }
        });

        return result;
    },

    getColumnByResource : function (resource, includeIndex) {
        return this.getColumnBy(function (column) {
            return column.start == resource.start;
        }, includeIndex)[0];
    },

    translateToScheduleCoordinate: function (coord) {
        var view = this.view;

        if (Ext.isArray(coord)) {
            return [
                coord[0] - view.getEl().getX() + view.getScroll().left,
                coord[1] - view.getEl().getY() + view.getScroll().top
            ];
        } else {
            return coord - view.getEl().getY() + view.getScroll().top;
        }
    },

    // private
    translateToPageCoordinate: function (coord) {
        var view = this.view;
        var el = view.getEl(),
            scroll = el.getScroll();

        if (Ext.isArray(coord)) {
            return [
                coord[0] + el.getX() - scroll.left,
                coord[1] + el.getY() - scroll.top
            ];
        } else {
            return coord + el.getY() - scroll.top;
        }
    },

    getDateFromXY   : function (xy, roundingMethod, local) {
        var coord   = xy;

        if (!local) {
            coord = this.translateToScheduleCoordinate(coord);
        }
        return this.view.timeAxisViewModel.getDateFromPosition(coord, roundingMethod);
    },

    getEventRenderData : function(event, resource, resourceIndex) {
        var eventStart  = event.getStartDate(),
            eventEnd    = event.getEndDate(),
            view        = this.view,
            columns     = view.panel.headerCt.getGridColumns(),
            viewStart   = columns[resourceIndex].start,
            viewEnd     = columns[resourceIndex].end,
            M           = Math;

        var startY      = Math.floor(view.getCoordinateFromDate(Sch.util.Date.max(eventStart, viewStart)));
        var endY        = Math.floor(view.timeAxisViewModel.getPositionFromDate(Sch.util.Date.min(eventEnd, viewEnd), true));
        var colWidth    = this.getCalendarColumnWidth();
        var data;

        // in calendar view we duplicate time for end of column and start of next column
        // if we got 0 that means end is in fact column bottom
        if (endY === 0) {
            endY    = view.getStore().getCount() * view.getRowHeight();
        }

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

    // we consider resourceRecord to be date
    getScheduleRegion: function (resourceRecord, eventRecord) {
        var view        = this.view,
            region      = resourceRecord ? this.getColumnByResource(resourceRecord).getRegion() : view.getTableRegion(),

            startY      = this.translateToPageCoordinate(0),
            endY        = this.translateToPageCoordinate(view.getStore().getCount() * view.getRowHeight()),

            left        = region.left + view.barMargin,
            right       = region.right - view.barMargin;

        return new Ext.util.Region(Math.min(startY, endY), right, Math.max(startY, endY), left);
    },

    getCalendarColumnWidth : function(resource) {
        return this.view.timeAxisViewModel.calendarColumnWidth;
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
            cellLeft        = view.resourceStore.indexOf(resourceRecord) * this.getCalendarColumnWidth(),
            taStart         = view.timeAxis.getStart(),
            taEnd           = view.timeAxis.getEnd(),
            start           = startDate ? Sch.util.Date.max(taStart, startDate) : taStart,
            end             = endDate ? Sch.util.Date.min(taEnd, endDate) : taEnd,
            startY          = Math.max(0, view.getCoordinateFromDate(start) - view.cellTopBorderWidth),
            endY            = view.getCoordinateFromDate(end) - view.cellTopBorderWidth,
            left            = cellLeft + view.cellBorderWidth,
            right           = cellLeft + this.getCalendarColumnWidth() - view.cellBorderWidth;

        return new Ext.util.Region(Math.min(startY, endY), right, Math.max(startY, endY), left);
    },

    columnRenderer: function (val, meta, resourceRecord, rowIndex, colIndex) {
        var view = this.view;
        var retVal = '';

        if (rowIndex === 0) {
            var columnEvents,
                resourceEvents,
                i, l;

            columnEvents = [];
            resourceEvents = this.getColumnEvents(meta.column);

            // Iterate events (belonging to current resource)
            for (i = 0, l = resourceEvents.length; i < l; i++) {
                var event   = resourceEvents[i];
                columnEvents.push(view.generateTplData(event, resourceRecord, colIndex));
            }
            view.eventLayout.vertical.applyLayout(columnEvents, this.getCalendarColumnWidth());
            retVal = '&#160;' + view.eventTpl.apply(columnEvents);
        }

        if (colIndex % 2 === 1) {
            meta.tdCls = (meta.tdCls || '') + ' ' + view.altColCls;
            meta.cellCls = (meta.cellCls || '') + ' ' + view.altColCls;
        }

        return retVal;
    },

    // private
    resolveResource: function (el) {
        var view = this.view;
        el = Ext.fly(el).is(view.timeCellSelector) ? el : Ext.fly(el).up(view.timeCellSelector);

        if (el) {
            var node = el.dom ? el.dom : el;
            var index = 0;

            if (Ext.isIE8m) {
                node = node.previousSibling;

                while (node) {
                    if( node.nodeType === 1 ) {
                        index++;
                    }

                    node = node.previousSibling;
                }
            } else {
                index = Ext.Array.indexOf(Array.prototype.slice.call(node.parentNode.children), node);
            }

            if (index >= 0) {
                // TODO: unsafe
                var column = view.panel.headerCt.getGridColumns()[index];
                return {
                    start   : column.start,
                    end     : column.end
                };
            }
        }
    },

    // private
    onEventUpdate: function (store, model) {
        this.renderSingle.call(this, model);

        //model previous is undefined after return store sync
        var previous = model.previous || {};

        // TODO: need to refactor, we call relayoutRenderedEvents() twice which may trigger redundant repainting of the same column(s) twice

        // relayout column we dragged from
        var tmpEvent = new Sch.model.Event({
            StartDate   : previous.StartDate || model.getStartDate(),
            EndDate     : previous.EndDate || model.getEndDate()
        });
        this.relayoutRenderedEvents(tmpEvent);

        // relayout column we dropped to
        this.relayoutRenderedEvents(model);


        // restore visual event selection
        var view = this.view;
        var sm = view.getEventSelectionModel();

        sm.forEachEventRelatedSelection(model, function(selectedRecord) {
            view.onEventBarSelect(selectedRecord);
        });
    },

    // private
    onEventAdd: function (s, recs) {
        var view = this.view;

        if (recs.length === 1) {
            this.renderSingle(recs[0]);
            this.relayoutRenderedEvents(recs[0]);
        } else {
            view.repaintAllEvents();
        }
    },

    // private
    onEventRemove: function (s, recs) {
        var view = this.view;

        if (recs.length === 1) {
            this.relayoutRenderedEvents(recs[0]);
        } else {
            view.repaintAllEvents();
        }
    },

    relayoutRenderedEvents : function(targetEvent) {
        var me      = this,
            columns = me.getEventColumns(targetEvent, true);

        // When event is rendered into multiple columns each part should behave like separate event.
        // For example, event is rendered into two columns. User created new event and dropped it so
        // new one is overlapping with old one in second column. Desired behavior is following:
        // part in the first column is untouched and part of old event in second column takes only half width.
        Ext.each(columns, function (column) {
            me.repaintEventsForColumn(column.column, column.index);
        });
    },

    renderSingle : function (event) {
        // Inject moved event into correct cell
        var view        = this.view;
        // TODO: we don't have resource for new event, let's simulate for now
        var resource    = this.view.resourceStore.first();
        var columns     = this.getEventColumns(event, true);

        Ext.each(view.getElementsFromEventRecord(event), function (el) {
            Ext.fly(el).destroy();
        });

        Ext.each(columns, function (column) {
            var containerCell   = Ext.fly(view.getScheduleCell(0, column.index));

            // if grid content is not yet rendered, then just do nothing
            if (!containerCell) return;

            var data            = view.generateTplData(event, resource, column.index);

            if (!Ext.versions.touch) {
                containerCell = containerCell.first();
            }

            view.eventTpl.append(containerCell, [data]);
        });
    },

    repaintEventsForColumn  : function (column, index) {
        var me      = this;
        var events  = me.getColumnEvents(column);
        var view    = me.view;
        var data    = [],
            i, l, event, node, start, end;

        if (events.length > 0) {
            for (i = 0, l = events.length; i < l; i++) {
                event   = events[i];
                node    = view.getElementsFromEventRecord(event)[0];

                // nothing is rendered yet
                if (!node) {
                    return;
                }

                // each event node if calendar view has column index in it
                // we need a common id without column index, so we perform split/pop/join
                var commonId    = node.id.split('-');
                commonId.pop();

                start   = event.getStartDate();
                end     = event.getEndDate();

                // simulate one-column events for vertical layout
                data.push({
                    start   : start < column.start ? column.start : start,
                    end     : end > column.end ? column.end : end,
                    event   : event,
                    id      : commonId.join('-')
                });
            }
        }

        view.eventLayout.vertical.applyLayout(data, column.getWidth());

        // We render events into first row in the table so we need this element to make lookups.
        var trEl    = Ext.get(Ext.DomQuery.selectNode('tr:nth-child(1)', view.el.dom));

        for (i = 0; i < data.length; i++) {
            event = data[i];
            // We should only touch events (events' parts) that are rendered into changed column.
            // Since parts of one event share element id we have to look up in certain cell.
            // In Ext5 Ext.dom.Query is not a default selector, so pseudo classes are failing in IE8
            var fly = Ext.get(Ext.DomQuery.selectNode('td:nth-child(' + (index + 1) + ') [id^=' + event.id + '-]', trEl.dom));
            // for the case when we relayout short event
            fly && fly.setStyle({
                left    : event.left + 'px',
                width   : Math.max(event.width, 0) + 'px'
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
            endY        = endDate ? view.getCoordinateFromDate(endDate, true, true) : startY;

        var startColumn = this.getColumnBy(function (column) {
            return column.start <= startDate && column.end > startDate;
        })[0];

        var endColumn   = this.getColumnBy(function (column) {
            return column.start < endDate && column.end >= endDate;
        })[0];

        var pair1 = this.translateToScheduleCoordinate([startColumn.getX(), 0]);
        var pair2 = this.translateToScheduleCoordinate([endColumn ? endColumn.getRegion().right : startColumn.getWidth() + pair1[0], 0]);

        return new Ext.util.Region(Math.min(startY, endY), pair2[0],  Math.max(startY, endY), pair1[0]);
    },

    /**
    * Gets the start and end dates for an element Region
    * @param {Ext.util.Region} region The region to map to start and end dates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Object} an object containing start/end properties
    */
    getStartEndDatesFromRegion: function (region, roundingMethod, allowPartial) {
        var topDate = this.view.getDateFromCoordinate([region.left, region.top], roundingMethod),
            bottomDate = this.view.getDateFromCoordinate([region.left, region.bottom], roundingMethod);

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

        view.calendarColumnWidth = width;
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
