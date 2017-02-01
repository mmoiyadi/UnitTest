/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.mixin.AbstractSchedulerView
@private

A mixin for {@link Ext.view.View} classes, providing "scheduling" functionality to the consuming view. A consuming class
should have already consumed the {@link Sch.mixin.TimelineView} mixin.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} instead.

*/
Ext.define('Sch.mixin.AbstractSchedulerView', {
    requires                : [
        'Sch.model.Assignment',
        'Sch.template.Event',
        'Sch.eventlayout.Horizontal',
        'Sch.view.Vertical',
        'Sch.eventlayout.Vertical'
    ],

    _cmpCls                 : 'sch-schedulerview',
    scheduledEventName      : 'event',
    eventTemplateClass      : 'Sch.template.Event',

    // The template instance responsible for rendering the event bars
    eventTpl                : null,

    /**
    * @cfg {Number} barMargin
    * Controls how much space to leave between the event bars and the row borders.
    */
    barMargin               : 1,

    /**
    * @cfg {Boolean} constrainDragToResource Set to true to only allow dragging events within the same resource.
    */
    constrainDragToResource : false,

    // Provided by panel
    allowOverlap            : null,
    readOnly                : null,

    altColCls               : 'sch-col-alt',

    /**
    * @cfg {Boolean} dynamicRowHeight
    * True to layout events without overlapping, meaning the row height will be dynamically calculated to fit any overlapping events.
    */
    dynamicRowHeight        : true,

    /**
    * @cfg {Boolean} managedEventSizing
    * True to size events based on the rowHeight and barMargin settings. Set this to false if you want to control height and top properties via CSS instead.
    */
    managedEventSizing      : true,

    /**
    * @cfg {Boolean} eventAnimations
    * True to animate event updates, currently only used in vertical mode in CSS3 enabled browsers.
    */
    eventAnimations         : true,

    /**
     * @cfg {String} horizontalLayoutCls
     * The class name responsible for the horizontal event layout process. Override this to take control over the layout process.
     */
    horizontalLayoutCls     : 'Sch.eventlayout.Horizontal',


    horizontalEventSorterFn     : null,
    /**
     * @cfg {Function} horizontalEventSorterFn
     *
     *  Override this method to provide a custom sort function to sort any overlapping events. By default,
     *  overlapping events are laid out based on the start date. If the start date is equal, events with earlier end date go first.
     *
     *  Here's a sample sort function, sorting on start- and end date. If this function returns -1, then event a is placed above event b.
     *
     horizontalEventSorterFn : function (a, b) {

            var startA = a.getStartDate(), endA = a.getEndDate();
            var startB = b.getStartDate(), endB = b.getEndDate();

            var sameStart = (startA - startB === 0);

            if (sameStart) {
                return endA > endB ? -1 : 1;
            } else {
                return (startA < startB) ? -1 : 1;
            }
        }
     *
     * @param  {Sch.model.Event} a
     * @param  {Sch.model.Event} b
     * @return {Int}
     */

    /**
     * @cfg {String} verticalLayoutCls
     * The class name responsible for the vertical event layout process. Override this to take control over the layout process.
     */

    verticalLayoutCls       : 'Sch.eventlayout.Vertical',

    /**
     * @cfg {Function} verticalEventSorterFn
     * Override this method to provide a custom sort function to sort any overlapping events. By default,
     * overlapping events are laid out based on the start date. If the start date is equal, events with earlier end date go first.
     *
     * If this function returns -1, then event a is placed above event b.
     * See also {@link #horizontalEventSorterFn} for a description.
     * @param {Sch.model.Event} a
     * @param {Sch.model.Event} b
     * @return {Int}
     */

    verticalEventSorterFn     : null,

    eventCls                : 'sch-event',

    verticalViewClass       : 'Sch.view.Vertical',

    eventStore              : null,
    resourceStore           : null,
    eventLayout             : null,

    /**
     * @event eventrepaint
     * Fires after an event has been repainted by the view.
     * @param {Sch.mixin.AbstractSchedulerView} view The view instance
     * @param {Sch.model.Event} event
     * @param {HTMLElement} node The updated DOM representation of the event
     */

    _initializeSchedulerView        : function() {
        var horLayoutCls = Ext.ClassManager.get(this.horizontalLayoutCls);
        var vertLayoutCls = Ext.ClassManager.get(this.verticalLayoutCls);

        this.eventSelector = '.' + this.eventCls;

        this.eventLayout = {};

        if (horLayoutCls) {

            this.eventLayout.horizontal = new horLayoutCls(
                Ext.apply(
                    // this is required for table layout
                    { timeAxisViewModel : this.timeAxisViewModel },
                    {
                        bandIndexToPxConvertFn    : this.horizontal.layoutEventVertically,
                        bandIndexToPxConvertScope : this.horizontal
                    },
                    this.horizontalEventSorterFn ? { sortEvents: this.horizontalEventSorterFn } : {}
                )
            );
        }

        if (vertLayoutCls) {
            this.eventLayout.vertical = new vertLayoutCls(
                Ext.apply(
                    {},
                    { view : this },
                    this.verticalEventSorterFn ? { sortEvents: this.verticalEventSorterFn } : {}
                )
            );
        }

        this.store              = this.store || this.resourceStore;
        this.resourceStore      = this.resourceStore || this.store;
    },

    generateTplData: function (event, resourceRecord, columnIndex) {
        var renderData = this[this.mode].getEventRenderData(event, resourceRecord, columnIndex),
            start       = event.getStartDate(),
            end         = event.getEndDate(),
            internalCls = event.getCls() || '';

        internalCls += ' sch-event-resizable-' + event.getResizable();

        if (event.dirty)                    internalCls += ' sch-dirty ';
        if (renderData.endsOutsideView)     internalCls += ' sch-event-endsoutside ';
        if (renderData.startsOutsideView)   internalCls += ' sch-event-startsoutside ';
        if (this.eventBarIconClsField)      internalCls += ' sch-event-withicon ';
        if (event.isDraggable() === false)  internalCls += ' sch-event-fixed ';
        if (end - start === 0)              internalCls += ' sch-event-milestone ';

        // in calendar mode event can be rendered in miltiple columns yet it remains the same
        // to distinguish them we append resource index to element id
        renderData.id          = event.internalId + '-' + resourceRecord.internalId + (this.getMode() === 'calendar' ? ('-' + columnIndex) : '-x' /* this is important for getElement(s)FromEventRecord() */);
        renderData.internalCls = internalCls;
        renderData.start       = start;
        renderData.end         = end;
        renderData.iconCls     = event.data[this.eventBarIconClsField] || '';
        renderData.event       = event;

        if (this.eventRenderer) {
            // User has specified a renderer fn, either to return a simple string, or an object intended for the eventBodyTemplate
            var value = this.eventRenderer.call(this.eventRendererScope || this, event, resourceRecord, renderData, columnIndex);
            if (Ext.isObject(value) && this.eventBodyTemplate) {
                renderData.body = this.eventBodyTemplate.apply(value);
            } else {
                renderData.body = value;
            }
        } else if (this.eventBodyTemplate) {
            // User has specified an eventBodyTemplate, but no renderer - just apply the entire event record data.
            renderData.body = this.eventBodyTemplate.apply(event.data);
        } else if (this.eventBarTextField) {
            // User has specified a field in the data model to read from
            renderData.body = event.data[this.eventBarTextField] || '';
        }
        return renderData;
    },

    /**
    * Resolves the resource based on a dom element
    * @param {HtmlElement} node The HTML element
    * @return {Sch.model.Resource} The resource corresponding to the element, or null if not found.
    */
    resolveResource: function (node) {
        var me = this;
        return me[me.mode].resolveResource(node);
    },

    /**
    * Gets the Ext.util.Region representing the passed resource and optionally just for a certain date interval.
    * @param {Sch.model.Resource} resourceRecord The resource record
    * @param {Date} startDate A start date constraining the region
    * @param {Date} endDate An end date constraining the region
    * @return {Ext.util.Region} The region of the resource
    */
    getResourceRegion: function (resourceRecord, startDate, endDate) {
        return this[this.mode].getResourceRegion(resourceRecord, startDate, endDate);
    },

    /**
    * <p>Returns the event record for a DOM element </p>
    * @param {HTMLElement/Ext.Element} el The DOM node or Ext Element to lookup
    * @return {Sch.model.Event|Null} The event record
    */
    resolveEventRecord: function (el) {
        // Normalize to DOM node
        el = el.dom ? el.dom : el;

        if (!(Ext.fly(el).is(this.eventSelector))) {
            el = Ext.fly(el).up(this.eventSelector);
        }

        return el && this.getEventRecordFromDomId(el.id);
    },

    // TODO: Get rid of this, make it in inline?, move it to mixins/SchedulerView
    resolveEventRecordFromResourceRow: function (el) {
        var me = this,
            sm = me.getEventSelectionModel(),
            resource,
            event;

        el = el.dom ? el.dom : el;
        resource = me.getRecord(el);

        return sm.getFirstSelectedEventForResource(resource);
    },


    /**
    * Returns an assignment record for a DOM element
    *
    * @param {HTMLElement/Ext.Element} el The DOM node or Ext Element to lookup
    * @return {Sch.model.Assignment|Null} The assignment record
    */
    resolveAssignmentRecord : function(el) {
        var me = this,
            assignmentStore = me.eventStore.getAssignmentStore(),
            assignment = null,
            event,
            resource;

        if (assignmentStore) {
            el = el.dom && el.dom || el;
            event = me.getEventRecordFromDomId(el.id);
            resource = me.getResourceRecordFromDomId(el.id);
            if (event && resource) {
                assignment = assignmentStore.getAssignmentForEventAndResource(event, resource);
            }
        }

        return assignment;
    },

    /**
    * <p>Returns the event record for a DOM id </p>
    * @param {String} id The id of the DOM node
    * @return {Sch.model.Event} The event record
    */
    getEventRecordFromDomId: function(id) {
        id = this.getEventIdFromDomNodeId(id);
        return this.eventStore.getModelByInternalId(id);
    },

    /**
     * Returns a resource record for a DOM id
     * @param {String} id An id of an event DOM node
     * @return {Sch.model.Resource} A resource record
     */
    getResourceRecordFromDomId : function(id) {
        id = this.getResourceIdFromDomNodeId(id);
        return this.eventStore.getResourceStore().getByInternalId(id);
    },

    /**
    * Checks if a date range is allocated or not for a given resource.
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @param {Sch.model.Event} excludeEvent An event to exclude from the check (or null)
    * @param {Sch.model.Resource} resource The resource
    * @return {Boolean} True if the timespan is available for the resource
    */
    isDateRangeAvailable: function (start, end, excludeEvent, resource) {
        return this.eventStore.isDateRangeAvailable(start, end, excludeEvent, resource);
    },

    /**
    * Returns events that are (partly or fully) inside the timespan of the current view.
    * @return {Ext.util.MixedCollection} The collection of events
    */
    getEventsInView: function () {
        var viewStart = this.timeAxis.getStart(),
            viewEnd = this.timeAxis.getEnd();

        return this.eventStore.getEventsInTimeSpan(viewStart, viewEnd);
    },

    /**
    * Returns the current set of rendered event nodes
    * @return {Ext.CompositeElement} The collection of event nodes
    */
    getEventNodes: function () {
        return this.getEl().select(this.eventSelector);
    },

    onEventCreated: function (newEventRecord) {
        // Empty but provided so that you can override it to supply default record values etc.
    },

    getEventStore: function () {
        return this.eventStore;
    },

    registerEventEditor: function (editor) {
        this.eventEditor = editor;
    },

    getEventEditor: function () {
        return this.eventEditor;
    },

    // Call mode specific implementation
    onEventUpdate: function (store, model, operation) {
        this[this.mode].onEventUpdate(store, model, operation);
    },

    // Call mode specific implementation
    onEventAdd: function (s, recs) {
        // TreeStore 'insert' and 'append' events pass a single Model instance, not an array
        if (!Ext.isArray(recs)) recs = [recs];

        this[this.mode].onEventAdd(s, recs);
    },

    // Call mode specific implementation
    onAssignmentAdd : function(store, assignments) {
        var me = this;

        Ext.Array.forEach(assignments, function(assignment) {
            var resource = assignment.getResource();
            resource && me.repaintEventsForResource(resource);
        });
    },

    onAssignmentUpdate : function(store, assignment) {
        var me            = this,
            oldResourceId = assignment.previous && assignment.previous[assignment.resourceIdField],
            newResourceId = assignment.getResourceId(),
            oldResource,
            newResource;

        if (oldResourceId) {
            oldResource = me.resourceStore.getModelById(oldResourceId);
            me.repaintEventsForResource(oldResource);
        }

        if (newResourceId) {
            newResource = me.resourceStore.getModelById(newResourceId);
            me.repaintEventsForResource(newResource);
        }
    },

    onAssignmentRemove : function(store, assignments) {
        var me = this;

        Ext.Array.forEach(assignments, function(assignment) {
            var resourceId = assignment.getResourceId();
            var resource = resourceId && me.resourceStore.getModelById(resourceId);
            resource && me.repaintEventsForResource(resource);
        });
    },

    // Call orientation specific implementation
    onEventRemove: function (s, recs) {
        this[this.mode].onEventRemove(s, recs);
    },

    bindEventStore: function (eventStore, initial) {

        var me = this;
        var listenerCfg = {
            scope       : me,
            refresh     : me.onEventDataRefresh,

            // Sencha Touch
            addrecords      : me.onEventAdd,
            updaterecord    : me.onEventUpdate,
            removerecords   : me.onEventRemove,

            // Ext JS
            add         : me.onEventAdd,
            update      : me.onEventUpdate,
            remove      : me.onEventRemove,

            // If the eventStore is a TreeStore
            nodeinsert  : me.onEventAdd,
            nodeappend  : me.onEventAdd
        };

        // In case there is an assigment store used
        var assignmentListenerCfg = {
            scope       : me,
            refresh     : me.onEventDataRefresh,
            load        : me.onEventDataRefresh,
            update      : me.onAssignmentUpdate,
            add         : me.onAssignmentAdd,
            remove      : me.onAssignmentRemove
        };

        // Sencha Touch fires "refresh" when clearing the store. Avoid double repaints
        if (!Ext.versions.touch) {
            listenerCfg.clear = me.onEventDataRefresh;
        }

        if (!initial && me.eventStore) {
            me.eventStore.setResourceStore(null);

            if (eventStore !== me.eventStore && me.eventStore.autoDestroy) {
                me.eventStore.destroy();
            }
            else {
                if (me.mun) {
                    me.mun(me.eventStore, listenerCfg);

                    var oldAssignmentStore = me.eventStore.getAssignmentStore && me.eventStore.getAssignmentStore();

                    if (oldAssignmentStore) {
                        me.mun(oldAssignmentStore, assignmentListenerCfg);
                    }
                } else {
                    me.eventStore.un(listenerCfg);
                }
            }

            if (!eventStore) {
                me.eventStore = null;
            }
        }
        if (eventStore) {
            eventStore = Ext.data.StoreManager.lookup(eventStore);

            if (me.mon) {
                me.mon(eventStore, listenerCfg);
            } else {
                eventStore.on(listenerCfg);
            }

            me.eventStore = eventStore;

            eventStore.setResourceStore(me.resourceStore);

            var assignmentStore = eventStore.getAssignmentStore && eventStore.getAssignmentStore();

            if (assignmentStore) {
                me.mon(assignmentStore, assignmentListenerCfg);
            }
        }

        if (eventStore && !initial) {
            me.refresh();
        }
    },

    onEventDataRefresh: function () {
        this.refreshKeepingScroll();
    },

    // invoked by the selection model to maintain visual UI cues
    onEventBarSelect: function (record) {
        var me = this,
            event,
            resource;

        if (record instanceof Sch.model.Assignment) {
            event = record.getEvent();
            resource = record.getResource();
        }
        else {
            event = record;
            resource = null;
        }

        Ext.Array.forEach(me.getElementsFromEventRecord(event, resource), function(el) {
            el.addCls(me.selectedEventCls);
        });
    },

    // invoked by the selection model to maintain visual UI cues
    onEventBarDeselect: function (record) {
        var me = this,
            event,
            resource;

        if (record instanceof Sch.model.Assignment) {
            event = record.getEvent();
            resource = record.getResource();
        }
        else {
            event = record;
            resource = null;
        }

        event && Ext.Array.forEach(me.getElementsFromEventRecord(event, resource), function(el) {
            el.removeCls(me.selectedEventCls);
        });
    },

    refresh : function() {
        throw 'Abstract method call';
    },

    /**
    * Refreshes the events for a single resource
    * @param {Sch.model.Resource} resource
    */
    repaintEventsForResource : function (record) {
        throw 'Abstract method call';
    },

    /**
     * Refreshes all events in the scheduler view
     */
    repaintAllEvents : function () {
        this.refreshKeepingScroll();
    },

    /**
     * Scrolls an event record into the viewport.
     * If the resource store is a tree store, this method will also expand all relevant parent nodes to locate the event.
     *
     * @param {Sch.model.Event} eventRec, the event record to scroll into view
     * @param {Boolean/Object} highlight, either `true/false` or a highlight config object used to highlight the element after scrolling it into view
     * @param {Boolean/Object} animate, either `true/false` or an animation config object used to scroll the element
     *
     * @deprecated
     */
    scrollEventIntoView: function (eventRec, highlight, animate, callback, scope) {
        var me = this,
            resources = eventRec.getResources();

        resources.length && me.scrollResourceEventIntoView(resources[0], eventRec, null, highlight, animate, callback, scope);
    },

    /**
     * Scrolls a resource event record into the viewport.
     *
     * If the resource store is a tree store, this method will also expand all relevant parent nodes
     * to locate the event.
     *
     * @param {Sch.model.Resource} resourceRec A resource record an event record is assigned to
     * @param {Sch.model.Event} eventRec    An event record to scroll into view
     * @param {Number} index                DOM node index, applicable only for Calendar view mode
     * @param {Boolean/Object} highlight    Either `true/false` or a highlight config object used to highlight the element after scrolling it into view
     * @param {Boolean/Object} animate      Either `true/false` or an animation config object used to scroll the element
     */
    scrollResourceEventIntoView : function(resourceRec, eventRec, index, highlight, animate, callback, scope) {
        var me = this,
            eventStart = eventRec.getStartDate(),
            eventEnd   = eventRec.getEndDate(),
            currentTimeSpanRange,
            el;

        // Make sure resource is visible if it's part of a TreeStore
        if (Ext.data.TreeStore && me.resourceStore instanceof Ext.data.TreeStore) {
            resourceRec.bubble(function(node) { node.expand(); });
        }

        // Make sure event is within current time axis time span
        if (!me.timeAxis.dateInAxis(eventStart) || !me.timeAxis.dateInAxis(eventEnd)) {
            currentTimeSpanRange = me.timeAxis.getEnd() - me.timeAxis.getStart();
            me.timeAxis.setTimeSpan(
                new Date(eventStart.valueOf() - currentTimeSpanRange / 2),
                new Date(eventEnd.getTime()   + currentTimeSpanRange / 2)
            );
            // HACK:
            // After a time axis change, the header is resized and Ext JS TablePanel reacts to the size change.
            // Ext JS reacts after a short delay, so we cancel this task to prevent Ext from messing up the scroll sync
            me.up('panel').scrollTask.cancel();
        }

        // Scrolling
        me.panel.ownerCt.ensureVisible(resourceRec, {
            callback : function() {
                // 1. ensureVisible on a lockable grid will call callback twice one for normal grid and another
                //    for locked grid
                // 2. since we do not provide the scope for the callback then 'this' here will point to either
                //    normal grid or locked grid the callback is called for
                // 3. We use this.isLocked to execute callback logic for the normal grid only.
                if (this.isLocked === false) {
                    // Establishing element to scroll to
                    el = me.getElementsFromEventRecord(eventRec, resourceRec, index);
                    el = el.length && el[0] || null; // In Calendar view there might be several elements correspond to resource/event pair.
                    // Scrolling with view with animation and highlighting if needed
                    me.scrollElementIntoView(el, true, animate, highlight, null, callback, scope);
                }
            }
        });
    }
});
