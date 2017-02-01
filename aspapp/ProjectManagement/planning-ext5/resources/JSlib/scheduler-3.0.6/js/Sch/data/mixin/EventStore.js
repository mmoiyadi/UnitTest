/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.mixin.EventStore

This is a mixin, containing functionality related to managing events.

It is consumed by the regular {@link Sch.data.EventStore} class and {@link Gnt.data.TaskStore} class
to allow data sharing between gantt chart and scheduler. Please note though, that datasharing is still
an experimental feature and not all methods of this mixin can be used yet on a TaskStore.

*/
if (!Ext.ClassManager.get("Sch.data.mixin.EventStore")) Ext.define("Sch.data.mixin.EventStore", {
    extend : 'Ext.Mixin',

    requires : [
        'Sch.util.Date',
        'Sch.data.util.IdConsistencyManager',
        'Sch.data.util.ModelPersistencyManager',
        'Sch.data.util.ResourceEventsCache'
    ],

    isEventStore : true,

    resourceStore         : null,
    resourceStoreDetacher : null,
    assignmentStore       : null,

    resourceEventsCache     : null,
    idConsistencyManager    : null,
    modelPersistencyManager : null,

    mixinConfig : {
        after : {
            constructor : 'constructor',
            destroy : 'destroy'
        }
    },

    /**
     * @constructor
     */
    constructor : function() {
        var me = this;
        me.resourceEventsCache     = me.createResourceEventsCache();
        me.idConsistencyManager    = me.createIdConsistencyManager();
        me.modelPersistencyManager = me.createModelPersistencyManager();
    },

    destroy : function() {
        var me = this;
        Ext.destroyMembers(
            me,
            'resourceEventsCache',
            'idConsistencyManager',
            'modelPersistencyManager'
        );
    },

    /**
     * Creates and returns Resource->Events cache.
     *
     * @return {Sch.data.util.ResourceEventsCache}
     * @template
     * @protected
     */
    createResourceEventsCache : function() {
        return new Sch.data.util.ResourceEventsCache(this);
    },

    /**
     * Creates and returns id consistency manager
     *
     * @return {Sch.data.util.IdConsistencyManager}
     * @tempalte
     * @protected
     */
    createIdConsistencyManager : function() {
        var me = this;
        return new Sch.data.util.IdConsistencyManager({
            eventStore      : me,
            resourceStore   : me.getResourceStore(),
            assignmentStore : me.getAssignmentStore()
        });
    },

    /**
     * Creates and returns model persistency manager
     *
     * @return {Sch.data.util.ModelPersistencyManager}
     * @tempalte
     * @protected
     */
    createModelPersistencyManager : function() {
        var me = this;
        return new Sch.data.util.ModelPersistencyManager({
            eventStore      : me,
            resourceStore   : me.getResourceStore(),
            assignmentStore : me.getAssignmentStore()
        });
    },

    /**
     * Gets the resource store for this store
     *
     * @return {Sch.data.ResourceStore} resourceStore
     */
    getResourceStore : function () {
        return this.resourceStore;
    },

    /**
     * Sets the resource store for this store
     *
     * @param {Sch.data.ResourceStore} resourceStore
     */
    setResourceStore : function (resourceStore) {
        var me = this,
            oldStore = me.resourceStore;

        if (me.resourceStore) {
            me.resourceStore.setEventStore(null);
            me.idConsistencyManager && me.idConsistencyManager.setResourceStore(null);
            me.modelPersistencyManager && me.modelPersistencyManager.setResourceStore(null);
        }

        me.resourceStore = resourceStore && Ext.StoreMgr.lookup(resourceStore) || null;

        if (me.resourceStore) {
            me.modelPersistencyManager && me.modelPersistencyManager.setResourceStore(me.resourceStore);
            me.idConsistencyManager && me.idConsistencyManager.setResourceStore(me.resourceStore);
            resourceStore.setEventStore(me);
        }

        if ((oldStore || resourceStore) && oldStore !== resourceStore) {
            /**
             * @event resourcestorechange
             * Fires when new resource store is set via {@link #setResourceStore} method.
             * @param {Sch.data.EventStore}         this
             * @param {Sch.data.ResourceStore|null} newResourceStore
             * @param {Sch.data.ResourceStore|null} oldResourceStore
             */
            me.fireEvent('resourcestorechange', me, resourceStore, oldStore);
        }
    },

    /**
     * Returns assignment store this event store is using by default.
     *
     * @return {Sch.data.AssignmentStore|null}
     */
    getAssignmentStore : function() {
        return this.assignmentStore;
    },

    /**
     * Sets assignment store instance this event store will be using by default.
     *
     * @param {Sch.data.AssignmentStore} store
     */
    setAssignmentStore : function(assignmentStore) {
        var me = this,
            oldStore = me.assignmentStore;

        if (me.assignmentStore) {
            me.assignmentStore.setEventStore(null);
            me.idConsistencyManager && me.idConsistencyManager.setAssignmentStore(null);
            me.modelPersistencyManager && me.modelPersistencyManager.setAssignmentStore(null);
        }

        me.assignmentStore = assignmentStore && Ext.StoreMgr.lookup(assignmentStore) || null;

        if (me.assignmentStore) {
            me.modelPersistencyManager && me.modelPersistencyManager.setAssignmentStore(me.assignmentStore);
            me.idConsistencyManager && me.idConsistencyManager.setAssignmentStore(me.assignmentStore);
            me.assignmentStore.setEventStore(me);
            // If assignment store's set then caching now will be done by it
            // and event store doesn't need to maintain it's own resource-to-events cache.
            Ext.destroy(me.resourceEventsCache);
        }
        else {
            // If assignment store's reset then caching now should be done by
            // event store again.
            me.resourceEventsCache = me.createResourceEventsCache();
        }

        if ((oldStore || assignmentStore) && oldStore !== assignmentStore) {
            /**
             * @event assignmentstorechange
             * Fires when new assignment store is set via {@link #setAssignmentStore} method.
             * @param {Sch.data.EventStore}           this
             * @param {Sch.data.AssignmentStore|null} newAssignmentStore
             * @param {Sch.data.AssignmentStore|null} oldAssignmentStore
             */
            me.fireEvent('assignmentstorechange', me, assignmentStore, oldStore);
        }
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
        var DATE = Sch.util.Date,
            events = this.getEventsForResource(resource),
            available = true;

        // This can be optimized further if we use simple for() statement (will lead to -1 function call in the loop)
        Ext.each(events, function (ev) {

            available = (
                excludeEvent === ev ||
                !DATE.intersectSpans(start, end, ev.getStartDate(), ev.getEndDate())
            );

            return available; // to immediately stop looping if interval is occupied by a non excluding event
        });

        return available;
    },

    /**
    * Returns events between the supplied start and end date
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @param {Boolean} allowPartial false to only include events that start and end inside of the span
    * @return {Ext.util.MixedCollection} the events
    */
    getEventsInTimeSpan: function (start, end, allowPartial) {
        var coll = new Ext.util.MixedCollection(); // TODO: do we real need the mixed collection here?
        var events = [];

        if (allowPartial !== false) {
            var DATE = Sch.util.Date;

            this.forEachScheduledEvent(function (event, eventStart, eventEnd) {
                if (DATE.intersectSpans(eventStart, eventEnd, start, end)) {
                    events.push(event);
                }
            });
        } else {
            this.forEachScheduledEvent(function (event, eventStart, eventEnd) {
                if (eventStart - start >= 0 && end - eventEnd >= 0) {
                    events.push(event);
                }
            });
        }

        coll.addAll(events);

        return coll;
    },

    /**
     * Calls the supplied iterator function once for every scheduled event, providing these arguments
     *      - event : the event record
     *      - startDate : the event start date
     *      - endDate : the event end date
     *
     * Returning false cancels the iteration.
     *
     * @param {Function} fn iterator function
     * @param {Object} scope scope for the function
     */
    forEachScheduledEvent : function (fn, scope) {

        this.each(function (event) {
            var eventStart = event.getStartDate(),
                eventEnd = event.getEndDate();

            if (eventStart && eventEnd) {
                return fn.call(scope || this, event, eventStart, eventEnd);
            }
        }, this);
    },

    /**
     * Returns an object defining the earliest start date and the latest end date of all the events in the store.
     *
     * @return {Object} An object with 'start' and 'end' Date properties (or null values if data is missing).
     */
    getTotalTimeSpan : function() {
        var earliest = new Date(9999,0,1),
            latest = new Date(0),
            D = Sch.util.Date;

        this.each(function(r) {
            if (r.getStartDate()) {
                earliest = D.min(r.getStartDate(), earliest);
            }
            if (r.getEndDate()) {
                latest = D.max(r.getEndDate(), latest);
            }
        });

        // TODO: this will fail in programs designed to work with events in the past (after Jan 1, 1970)
        earliest = earliest < new Date(9999,0,1) ? earliest : null;
        latest = latest > new Date(0) ? latest : null;

        return {
            start : earliest || null,
            end : latest || earliest || null
        };
    },

    /**
     * Filters the events associated with a resource, based on the function provided. An array will be returned for those
     * events where the passed function returns true.
     * @private {Sch.model.Resource} resource
     * @param {Sch.model.Resource} resource
     * @param {Function} fn The function
     * @param {Object} [scope] The 'this object' for the function
     * @return {Sch.model.Event[]} the events in the time span
     */
    filterEventsForResource : function (resource, fn, scope) {
        // `getEvents` method of the resource will use either `indexByResource` or perform a full scan of the event store
        var events = resource.getEvents(this);

        return Ext.Array.filter(events, fn, scope || this);
    },

    // This method provides a way for the store to append a new record, and the consuming class has to implement it
    // since Store and TreeStore don't share the add API.
    append : function(record) {
        throw 'Must be implemented by consuming class';
    },

    // {{{ Entire data model management methods

    /**
     * Returns all resources assigned to an event.
     *
     * @param {Sch.model.Event|Mixed} event
     * @return {[Sch.model.Resource]}
     */
    getResourcesForEvent : function(event) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            resourceStore   = me.getResourceStore(),
            result;

        if (assignmentStore) {
            result = assignmentStore.getResourcesForEvent(event);
        }
        else if (resourceStore) {
            event   = event instanceof Sch.model.Event && event || me.getModelById(event);
            result = event && resourceStore.getModelById(event.getResourceId());
            result = result && [result] || [];
        }
        else {
            result = [];
        }

        return result;
    },

    /**
     * Returns all events assigned to a resource
     *
     * @param {Sch.model.Resource|Mixed} resource
     * @return {[Sch.model.Event]}
     */
    getEventsForResource : function(resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            resourceStore,
            result;

        if (assignmentStore) {
            result = assignmentStore.getEventsForResource(resource);
        }
        // Resource->Events cache is not always accessable, a subclass might override createResourceEventsCache() method
        // returning null
        else if (me.resourceEventsCache) {
            result = me.resourceEventsCache.get(resource);
        }
        else {
            result = [];
        }

        return result;
    },

    /**
     * Returns all assignments for a given event.
     *
     * @param {Sch.model.Event|Mixed} event
     * @return {[Sch.model.Assignment]}
     */
    getAssignmentsForEvent : function(event) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        return assignmentStore && assignmentStore.getAssignmentsForEvent(event) || [];
    },

    /**
     * Returns all assignments for a given resource.
     *
     * @param {Sch.model.Resource|Mixed} resource
     * @return {[Sch.model.Assignment]}
     */
    getAssignmentsForResource : function(resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        return assignmentStore && assignmentStore.getAssignmentsForResource(resource) || [];
    },

    /**
     * Creates and adds assignment record for a given event and a resource.
     *
     * @param {Sch.model.Event|Mixed} The event
     * @param {Sch.model.Resource|Mixed|[Sch.model.Resource]|[Mixed]} The resource(s) to assign to the event
     */
    assignEventToResource : function(event, resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        if (assignmentStore) {
            assignmentStore.assignEventToResource(event, resource);
        }
        else {
            event = event instanceof Sch.model.Event && event || me.getModelById(event);
            resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator
            event && event.setResourceId(resource); // This will update resource events cache via 'update' event.
        }
    },

    /**
     * Removes assignment record for a given event and a resource.
     *
     * @param {Sch.model.Event|Mixed} event
     * @param {Sch.model.Resource|Mixed} resource
     */
    unassignEventFromResource : function(event, resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        if (assignmentStore) {
            assignmentStore.unassignEventFromResource(event, resource);
        }
        else  {
            event    = event instanceof Sch.model.Event && event || me.getModelById(event);
            resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator
            if (event && event.getResourceId() == resource) {
                event.setResourceId(null); // This will update resource events cache via 'update' event
            }
        }
    },

    /**
     * Reassigns an event from an old resource to a new resource
     *
     * @param {Sch.model.Event/Mixed}    event    An event to reassign
     * @param {Sch.model.Resource/Mixed} resource A resource to unassign from
     * @parma {Sch.model.Resource/Mixed} resource A resource to assign to
     */
    reassignEventFromResourceToResource : function(event, oldResource, newResource) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        if (assignmentStore) {
            assignmentStore.unassignEventFromResource(event, oldResource);
            assignmentStore.assignEventToResource(event, newResource);
        }
        else {
            event = event instanceof Sch.model.Event && event || me.getModelById(event);
            oldResource = oldResource instanceof Sch.model.Resource ? oldResource.getId() : oldResource; // resource id might be 0 thus we use ? operator
            newResource = newResource instanceof Sch.model.Resource ? newResource.getId() : newResource; // resource id might be 0 thus we use ? operator
            if (event.getResourceId() == oldResource) {
                event.setResourceId(newResource);
            }
        }
    },

    /**
     * Checks whether an event is assigned to a resource.
     *
     * @param {Sch.model.Event|Mixed} event
     * @param {Sch.model.Resource|Mixed} resource
     * @param {Function} [fn] Function which will resieve assignment record if one present
     * @return {Boolean}
     */
    isEventAssignedToResource : function(event, resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            result;

        if (assignmentStore) {
            result = assignmentStore.isEventAssignedToResource(event, resource);
        }
        else {
            event    = event    instanceof Sch.model.Event && event || me.getModelById(event);
            resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator
            result = event && (event.getResourceId() == resource) || false;
        }

        return result;
    },

    /**
     * Removes all assignments for given event
     *
     * @param {Sch.model.Event|Mixed} event
     */
    removeAssignmentsForEvent : function(event) {
        var me = this,
            assignmentStore = me.getAssignmentStore();

        if (assignmentStore) {
            assignmentStore.removeAssignmentsForEvent(event);
        }
        else {
            event = event instanceof Sch.model.Event && event || me.getModelById(event);
            event && event.setResourceId(null); // This will update resource events cache via 'update' event
        }
    },

    /**
     * Removes all assignments for given resource
     *
     * @param {Sch.model.Resource|Mixed} resource
     */
    removeAssignmentsForResource : function(resource) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            resourceStore   = me.getResourceStore();

        if (assignmentStore) {
            assignmentStore.removeAssignmentsForResource(resource);
        }
        else if (resourceStore) {
            resource = resource instanceof Sch.model.Resource && resource || resourceStore.getModelById(resource);
            resource && Ext.Array.forEach(me.resourceEventsCache.get(resource), function(event) {
                event.setResourceId(null); // This will update resource events cache via 'update' event
            });
        }
        else {
            resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator
            Ext.Array.forEach(me.getRange(), function(event) {
                event.getResourceId() == resource && event.setResourceId(null); // This will update resource events cache via 'update' event
            });
        }
    },

    /**
     * Checks if given event record is persistable.
     * In case assignment store is used to assign events to resources and vise versa event is considered to be always
     * persistable. Otherwise backward compatible logic is used, i.e. event is considered to be persistable when
     * resources it's assigned to are not phantom.
     *
     * @param {Sch.model.Range} event
     * @return {Boolean}
     */
    isEventPersistable : function(event) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            resources, i, len,
            result = true;

        if (!assignmentStore) {
            resources = event.getResources();
            for (i = 0, len = resources.length; result && i < len; ++i) {
                result = resources[i].phantom !== true;
            }
        }

        return result;
    }
    // }}}
});
