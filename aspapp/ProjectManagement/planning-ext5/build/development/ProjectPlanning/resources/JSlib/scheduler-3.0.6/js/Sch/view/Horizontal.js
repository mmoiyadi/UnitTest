/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.view.Horizontal
 * @private
 *
 * An internal view mixin, purposed to be consumed along with {@link Sch.mixin.AbstractTimelineView}.
 * This class is consumed by the scheduling view and provides the horizontal implementation of certain methods.
 */
Ext.define("Sch.view.Horizontal", {
    requires : [
        'Ext.util.Region',
        'Ext.Element',
        'Sch.util.Date'
    ],
    // Provided by creator, in the config object
    view: null,

    constructor: function (config) {
        Ext.apply(this, config);
    },

    translateToScheduleCoordinate: function (x) {
        var view = this.view;

        if (view.rtl) {
            return view.getHorizontalTimeAxisColumn().getEl().getRight() - x;
        }
        return x - view.getEl().getX() + view.getScroll().left;
    },

    translateToPageCoordinate: function (x) {
        var view = this.view;
        return x + view.getEl().getX() - view.getScroll().left;
    },

    getDateFromXY   : function (xy, roundingMethod, local) {
        var coord   = xy[0];

        if (!local) {
            coord = this.translateToScheduleCoordinate(coord);
        }
        return this.view.timeAxisViewModel.getDateFromPosition(coord, roundingMethod);
    },

    getEventRenderData: function (event) {
        var eventStart  = event.getStartDate(),
            eventEnd    = event.getEndDate() || eventStart, // Allow events to be rendered even they are missing an end date
            view        = this.view,
            viewStart   = view.timeAxis.getStart(),
            viewEnd     = view.timeAxis.getEnd(),
            M           = Math,
            startX      = view.getXFromDate(Sch.util.Date.max(eventStart, viewStart)),
            endX        = view.getXFromDate(Sch.util.Date.min(eventEnd, viewEnd)),
            data        = {};

        if (this.view.rtl) {
            data.right = M.min(startX, endX);
        } else {
            data.left = M.min(startX, endX);
        }

        data.width = M.max(1, M.abs(endX - startX)) - view.eventBorderWidth;

        if (view.managedEventSizing) {
            data.top = M.max(0, (view.barMargin - ((Ext.isIE && !Ext.isStrict) ? 0 : view.eventBorderWidth - view.cellTopBorderWidth)));
            data.height = view.timeAxisViewModel.rowHeightHorizontal - (2 * view.barMargin) - view.eventBorderWidth;
        }

        data.start              = eventStart;
        data.end                = eventEnd;
        data.startsOutsideView  = eventStart < viewStart;
        data.endsOutsideView    = eventEnd > viewEnd;
        return data;
    },

    /**
    * Gets the Ext.util.Region, relative to the page, represented by the schedule and optionally only for a single resource. This method will call getDateConstraints to
    * allow for additional resource/event based constraints. By overriding that method you can constrain events differently for
    * different resources.
    * @param {Sch.model.Resource} resourceRecord (optional) The resource record
    * @param {Sch.model.Event} eventRecord (optional) The event record
    * @return {Ext.util.Region} The region of the schedule
    */
    getScheduleRegion: function (resourceRecord, eventRecord) {
        var getRegionFn     = Ext.Element.prototype.getRegion ? 'getRegion' : 'getPageBox',
            view            = this.view,
            region          = resourceRecord ? Ext.fly(view.getRowNode(resourceRecord))[getRegionFn]() : view.getTableRegion(),
            taStart         = view.timeAxis.getStart(),
            taEnd           = view.timeAxis.getEnd(),
            dateConstraints = view.getDateConstraints(resourceRecord, eventRecord) || { start: taStart, end: taEnd },
            startX          = this.translateToPageCoordinate(view.getXFromDate(Sch.util.Date.max(taStart, dateConstraints.start))),
            endX            = this.translateToPageCoordinate(view.getXFromDate(Sch.util.Date.min(taEnd, dateConstraints.end))),
            top             = region.top + view.barMargin,
            bottom          = region.bottom - view.barMargin - view.eventBorderWidth;

        return new Ext.util.Region(top, Math.max(startX, endX), bottom, Math.min(startX, endX));
    },


    /**
    * Gets the Ext.util.Region, relative to the scheduling view element, representing the passed resource and optionally just for a certain date interval.
    * @param {Sch.model.Resource} resourceRecord The resource record
    * @param {Date} startDate A start date constraining the region
    * @param {Date} endDate An end date constraining the region
    * @return {Ext.util.Region} The region of the resource
    */
    getResourceRegion: function (resourceRecord, startDate, endDate) {
        var view        = this.view,
            rowNode     = view.getRowNode(resourceRecord),
            offsets     = Ext.fly(rowNode).getOffsetsTo(view.getEl()),
            taStart     = view.timeAxis.getStart(),
            taEnd       = view.timeAxis.getEnd(),
            start       = startDate ? Sch.util.Date.max(taStart, startDate) : taStart,
            end         = endDate ? Sch.util.Date.min(taEnd, endDate) : taEnd,
            startX      = view.getXFromDate(start),
            endX        = view.getXFromDate(end),
            top         = offsets[1] + view.cellTopBorderWidth,
            bottom      = offsets[1] + Ext.fly(rowNode).getHeight() - view.cellBottomBorderWidth;

        if (!Ext.versions.touch) {
            var ctElScroll  = view.getScroll();
            top += ctElScroll.top;
            bottom += ctElScroll.top;
        }
        return new Ext.util.Region(top, Math.max(startX, endX), bottom, Math.min(startX, endX));
    },


    columnRenderer: function (val, meta, resourceRecord, rowIndex, colIndex) {
        var view            = this.view;
        var resourceEvents  = view.eventStore.filterEventsForResource(resourceRecord, function(event) {
            return view.timeAxis.isRangeInAxis(event);
        });

        if (resourceEvents.length === 0) {
            return;
        }

        // Iterate events belonging to current row
        var eventsTplData = Ext.Array.map(resourceEvents, function(event) {
            return view.generateTplData(event, resourceRecord, rowIndex);
        });

        // Event data is now gathered, calculate layout properties for each event (if dynamicRowHeight is used)
        if (view.dynamicRowHeight) {
            var layout              = view.eventLayout.horizontal;
            var nbrOfBandsRequired = layout.applyLayout(eventsTplData, resourceRecord, this.layoutEventVertically, this);

            var rowHeight = (nbrOfBandsRequired * view.timeAxisViewModel.rowHeightHorizontal) - ((nbrOfBandsRequired - 1) * view.barMargin);
                            view.cellTopBorderWidth - view.cellBottomBorderWidth;

            meta.rowHeight      = rowHeight;
        }

        return view.eventTpl.apply(eventsTplData);
    },

    layoutEventVertically : function(bandIndex, eventRecord) {
        var view     = this.view;
        var eventTop = bandIndex === 0 ? view.barMargin : (bandIndex * view.timeAxisViewModel.rowHeightHorizontal - (bandIndex - 1) * view.barMargin);

        if (eventTop >= view.cellBottomBorderWidth) {
            eventTop -= view.cellBottomBorderWidth;
        }

        return eventTop;
    },

    // private
    resolveResource: function (node) {
        var me = this,
            view = me.view,
            eventNode,
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
            node = view.findRowByChild(node);
            result = node && view.getRecordForRowNode(node) || null;
        }

        return result;
    },

    /**
    *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
    *  @param {Date} startDate The start date of the span
    *  @param {Date} endDate The end date of the span
    *  @return {Ext.util.Region} The region for the time span
    */
    getTimeSpanRegion: function (startDate, endDate, useViewSize) {
        var view    = this.view,
            startX  = view.getXFromDate(startDate),
            endX    = endDate ? view.getXFromDate(endDate) : startX,
            height, region;

        region = view.getTableRegion();

        if (useViewSize) {
            height = Math.max(region ? region.bottom - region.top: 0, view.getEl().dom.clientHeight); // fallback in case grid is not rendered (no rows/table)
        } else {
            height = region ? region.bottom - region.top: 0;
        }
        return new Ext.util.Region(0, Math.max(startX, endX), height, Math.min(startX, endX));
    },

    /**
    * Gets the start and end dates for an element Region
    * @param {Ext.util.Region} region The region to map to start and end dates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Object} an object containing start/end properties
    */
    getStartEndDatesFromRegion: function (region, roundingMethod, allowPartial) {
        var view        = this.view;
        var rtl         = view.rtl;

        var startDate   = view.getDateFromCoordinate(rtl ? region.right : region.left, roundingMethod),
            endDate     = view.getDateFromCoordinate(rtl ? region.left : region.right, roundingMethod);

        if (startDate && endDate || allowPartial && (startDate || endDate)) {
            return {
                start   : startDate,
                end     : endDate
            };
        }

        return null;
    },

    // private
    onEventAdd: function (s, events) {
        var view = this.view,
            affectedResources = {},
            event, startDate, endDate,
            resources, resource,
            i, l, j, k;

        for (i = 0, l = events.length; i < l; i++) {
            event       = events[i];
            startDate   = event.getStartDate();
            endDate     = event.getEndDate();

            if (startDate && endDate && view.timeAxis.timeSpanInAxis(startDate, endDate)) {
                // repaint row only if event is in time axis
                resources = events[i].getResources(view.eventStore);

                for (j = 0, k = resources.length; j < k; j++) {
                    resource = resources[j];

                    affectedResources[resource.getId()] = resource;
                }
            }
        }

        Ext.Object.each(affectedResources, function (id, resource) {
            view.repaintEventsForResource(resource);
        });
    },

    // private
    onEventRemove: function (s, eventRecords) {
        var me            = this,
            view          = me.view,
            resourceStore = me.resourceStore,
            eventStore    = view.eventStore,
            resources,
            nodes;

        resources = Ext.Array.unique(
                        Ext.Array.flatten(
                            Ext.Array.map(eventRecords, function(r) {
                                // It's important to use event store's method here, instead just
                                // r.getResources(). r.getResources() will always return empty array here
                                // since r is already removed from the event store.
                                return eventStore.getResourcesForEvent(r);
                            })
                        )
                    );

        function updateResource(resource) {
            view.store.indexOf(resource) >= 0 && view.repaintEventsForResource(resource);
        }

        // TODO:
        // I really don't know why this logic is important here
        // Why anyone need to distinguish between multiple resources case and single resource case here.
        // I've just left it as it were before.
        if (resources.length > 1) {
            Ext.Array.forEach(resources, updateResource);
        }
        else if (resources.length == 1) {
            nodes = Ext.Array.flatten(
                        Ext.Array.map(eventRecords, function(r) {
                            return view.getElementsFromEventRecord(r, null, null, true);
                        })
                    );
            nodes = new Ext.CompositeElementLite(nodes);

            nodes.fadeOut({
                callback: function() { updateResource(resources[0]); }
            });
        }
    },

    // private
    onEventUpdate: function (eventStore, model) {
        var previous = model.previous || {};
        var view = this.view;
        var timeAxis = view.timeAxis;

        var newStartDate  = model.getStartDate();
        var newEndDate    = model.getEndDate();

        var startDate       = previous.StartDate || newStartDate;
        var endDate         = previous.EndDate || newEndDate;

        // event was visible or visible now
        var eventWasInView  = startDate && endDate && timeAxis.timeSpanInAxis(startDate, endDate);

        var resource;

        // resource has to be repainted only if it was changed and event was rendered/is still rendered
        if (model.resourceIdField in previous && eventWasInView) {
            // If an event has been moved to a new row, refresh old row first
            resource = eventStore.getResourceStore().getById(previous[model.resourceIdField]);
            resource && view.repaintEventsForResource(resource, true);
        }

        // also resource has to be repainted if event was moved inside/outside of time axis
        if ((newStartDate && newEndDate && timeAxis.timeSpanInAxis(newStartDate, newEndDate)) || eventWasInView) {
            Ext.Array.forEach(model.getResources(), function(resource) {
                view.repaintEventsForResource(resource, true);
            });
        }
    },

    setColumnWidth: function (width, preventRefresh) {
        var view = this.view;

        view.getTimeAxisViewModel().setViewColumnWidth(width, preventRefresh);
    },

    /**
    * Method to get the currently visible date range in a scheduling view. Please note that it only works when the schedule is rendered.
    * @return {Object} object with `startDate` and `endDate` properties.
    */
    getVisibleDateRange: function () {
        var view = this.view;

        if (!view.getEl()) {
            return null;
        }

        var tableRegion = view.getTableRegion(),
            startDate   = view.timeAxis.getStart(),
            endDate     = view.timeAxis.getEnd(),
            width       = view.getWidth();

        if ((tableRegion.right - tableRegion.left) < width) {
            return { startDate: startDate, endDate: endDate };
        }

        var scroll      = view.getScroll();

        return {
            startDate   : view.getDateFromCoordinate(scroll.left, null, true),
            endDate     : view.getDateFromCoordinate(scroll.left + width, null, true)
        };
    }
});
