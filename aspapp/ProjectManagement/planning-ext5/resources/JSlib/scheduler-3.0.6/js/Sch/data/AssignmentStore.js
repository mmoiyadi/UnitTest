/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.data.AssignmentStore
 * @extends Ext.data.Store
 *
 * A class representing a collection of assignments between events in the {@link Sch.data.EventStore} and resources
 * in the {@link Sch.data.ResourceStore}.
 *
 * Contains a collection of {@link Sch.model.Assignment} records.
 */
if (!Ext.ClassManager.get("Sch.data.AssignmentStore")) Ext.define('Sch.data.AssignmentStore', {
    extend      : 'Ext.data.Store',

    mixins : [
        'Sch.data.mixin.UniversalModelGetter',
        'Sch.data.mixin.CacheHintHelper'
    ],

    requires    : [
        'Sch.model.Assignment',
        'Sch.model.Range',
        'Sch.model.Resource',
        'Sch.data.util.EventAssignmentsCache',
        'Sch.data.util.ResourceAssignmentsCache',
        'Sch.data.util.AssignmentStoreEventResourcesCache',
        'Sch.data.util.AssignmentStoreResourceEventsCache'
    ],

    model       : 'Sch.model.Assignment',
    alias       : 'store.assignmentstore',
    storeId     : 'assignments',
    proxy       : 'memory',

    eventResourceCache    : null,
    resourceEventsCache   : null,

    eventStoreDetacher    : null,
    resourceStoreDetacher : null,

    /**
     * @property {Sch.data.EventStore} eventStore The event store to which this assignment store is associated.
     * Usually it is configured automatically, by the event store itself.
     *
     * @readonly
     */
    eventStore   : null,

    constructor : function(config) {
        var me = this;

        me.callParent([config]);

        me.eventAssignmentsCache    = me.eventAssignmentsCache    || new Sch.data.util.EventAssignmentsCache(me);
        me.resourceAssignmentsCache = me.resourceAssignmentsCache || new Sch.data.util.ResourceAssignmentsCache(me);
        // The caches commented are conflicting with the fact that assignments might be added to assignment store
        // before corresponding events/records are. For example SchedulerDragZone::updateRecords() does that
        // as soon as it's fixed this might be uncommented thus we might gain more performace at
        // event::getResources()/resource::getEvents() and corresponding methods
        //me.eventResourceCache       = me.eventResourceCache       || new Sch.data.util.AssignmentStoreEventResourcesCache(me);
        //me.resourceEventsCache      = me.resourceEventsCache      || new Sch.data.util.AssignmentStoreResourceEventsCache(me);
    },

    destroy : function() {
        var me = this;
        Ext.destroyMembers(
            me,
            'eventResourceCache',
            'resourceEventsCache',
            'eventAssignmentsCache',
            'resourceEventsCache',
            'eventStoreDetacher',
            'resourceStoreDetacher'
        );
        me.callParent();
    },

    /**
     * Returns the associated event store instance.
     *
     * @return {Gnt.data.EventStore}
     */
    getEventStore: function() {
        return this.eventStore;
    },

    /**
     * Sets the associated event store instance.
     *
     * @param {Sch.data.EventStore} eventStore
     */
    setEventStore: function(eventStore) {
        var me = this,
            oldStore = me.eventStore;

        if (me.eventStore) {
        }

        me.eventStore = eventStore && Ext.StoreMgr.lookup(eventStore) || null;

        if (me.eventStore) {
        }

        me.attachToEventStore(me.eventStore);

        if ((oldStore || eventStore) && oldStore !== eventStore) {
            /**
             * @event eventstorechange
             * Fires when new event store is set via {@link #setEventStore} method.
             * @param {Sch.data.AssignmentStore} this
             * @param {Sch.data.EventStore|null} newEventStore
             * @param {Sch.data.EventStore|null} oldEventStore
             */
            me.fireEvent('eventstorechange', me, eventStore, oldStore);
        }
    },

    attachToEventStore : function(eventStore) {
        var me = this;

        Ext.destroy(me.eventStoreDetacher);

        if (eventStore && eventStore instanceof Ext.data.TreeStore) {
            me.eventStoreDetacher = eventStore.on({
                'noderemove'          : me.onEventNodeRemove,
                'resourcestorechange' : me.onEventStoreResourceStoreChange,
                scope       : me,
                destroyable : true,
                priority    : 200 // higher then in cache
            });
        }
        else if (eventStore) {
            me.eventStoreDetacher = eventStore.on({
                'remove'              : me.onEventRemove,
                'resourcestorechange' : me.onEventStoreResourceStoreChange,
                scope       : me,
                destroyable : true,
                priority    : 200 // higher then in cache
            });
        }

        me.attachToResourceStore(eventStore && eventStore.getResourceStore());
    },

    attachToResourceStore : function(resourceStore) {
        var me = this;

        Ext.destroy(me.resourceStoreDetacher);

        if (resourceStore && resourceStore instanceof Ext.data.TreeStore) {
            me.resourceStoreDetacher = resourceStore.on({
                'noderemove' : me.onResourceNodeRemove,
                scope        : me,
                destroyable  : true,
                priority     : 200 // higher then in cache
            });
        }
        else if (resourceStore) {
            me.resourceStoreDetacher = resourceStore.on({
                'remove'    : me.onResourceRemove,
                scope       : me,
                destroyable : true,
                priority    : 200 // higher then in cache
            });
        }
    },

    onEventStoreResourceStoreChange : function(eventStore, newResourceStore, oldResourceStore) {
        this.attachToResourceStore(newResourceStore);
    },

    onEventRemove : function(eventStore, events, index, isMove) {
        var me = this,
            assignments;

        if (!isMove) {
            assignments = [];

            Ext.Array.forEach(events, function(event) {
                assignments = assignments.concat(me.getAssignmentsForEvent(event));
            });

            assignments.length && me.remove(assignments);
        }
    },

    onEventNodeRemove : function(eventStore, event, isMove) {
        var me = this,
            assignments;

        if (!isMove) {
            assignments = [];

            event.cascadeBy(function(cascadingEvent) {
                assignments = assignments.concat(me.getAssignmentsForEvent(cascadingEvent));
            });

            assignments.length && me.remove(assignments);
        }
    },

    onResourceRemove : function(resourceStore, resources, index, isMove) {
        var me = this,
            assignments;

        if (!isMove) {
            assignments = [];

            Ext.Array.forEach(resources, function(resource) {
                assignments = assignments.concat(me.getAssignmentsForResource(resource));
            });

            assignments.length && me.remove(assignments);
        }
    },

    onResourceNodeRemove : function(resourceStore, resource, isMove) {
        var me = this,
            assignments;

        if (!isMove) {
            assignments = [];

            resource.cascadeBy(function(cascadingResource) {
                assignments = assignments.concat(me.getAssignmentsForResource(cascadingResource));
            });

            assignments.length && me.remove(assignments);
        }
    },

    /**
     * Maps over event assignments.
     *
     * @param {Sch.model.Range|Mixed} event
     * @param {Function} [fn=Ext.identityFn]
     * @param {Function} [filterFn=Ext.returnTrue]
     * @return {[Mixed]}
     */
    mapAssignmentsForEvent : function(event, fn, filterFn) {
        var me = this,
            result = [];

        fn       = fn || Ext.identityFn;
        filterFn = filterFn || Ext.returnTrue;


        if (fn !== Ext.identityFn || filterFn !== Ext.returnTrue) {
            Ext.Array.forEach(me.eventAssignmentsCache.get(event), function(assignment) {
                var mapResult = fn(assignment);
                filterFn(mapResult) && result.push(mapResult);
            });
        }
        else {
            result = [].concat(me.eventAssignmentsCache.get(event));
        }

        return result;
    },

    /**
     * Maps over resource assignments.
     *
     * @param {Sch.model.Resource|Mixed} resource
     * @param {Function} [fn=Ext.identityFn]
     * @param {Function} [filterFn=Ext.returnTrue]
     * @return {[Mixed]}
     */
    mapAssignmentsForResource : function(resource, fn, filterFn) {
        var me = this,
            result = [];

        fn       = fn || Ext.identityFn;
        filterFn = filterFn || Ext.returnTrue;

        if (fn !== Ext.identityFn || filterFn !== Ext.returnTrue) {
            Ext.Array.forEach(me.resourceAssignmentsCache.get(resource), function(assignment) {
                var mapResult = fn(assignment);
                filterFn(mapResult) && result.push(mapResult);
            });
        }
        else {
            result = [].concat(me.resourceAssignmentsCache.get(resource));
        }

        return result;
    },

    /**
     * Returns all assignments for a given event.
     *
     * @param {Sch.model.Range|Mixed} event
     * @return {[Sch.model.Assignment]}
     */
    getAssignmentsForEvent : function(event) {
        return this.mapAssignmentsForEvent(event);
    },

    /**
     * Removes all assignments for given event
     *
     * @param {Sch.model.Range|Mixed} event
     */
    removeAssignmentsForEvent : function(event) {
        var me = this;
        me.remove(me.getAssignmentsForEvent(event));
    },

    /**
     * Returns all assignments for a given resource.
     *
     * @param {Sch.model.Resource|Mixed} event
     * @return {[Sch.model.Range]}
     */
    getAssignmentsForResource : function(resource) {
        return this.mapAssignmentsForResource(resource);
    },

    /**
     * Removes all assignments for given resource
     *
     * @param {Sch.model.Resource|Mixed} resource
     */
    removeAssignmentsForResource : function(resource) {
        var me = this;
        me.remove(me.getAssignmentsForResource(resource));
    },

    /**
     * Returns all resources assigned to an event.
     *
     * @param {Sch.model.Range|Mixed} event
     * @return {[Sch.model.Resource]}
     */
    getResourcesForEvent : function(event) {
        var me = this,
            result;

        if (me.eventResourceCache) {
            result = me.eventResourceCache.get(event);
        }
        else {
            result = me.mapAssignmentsForEvent(
                event,
                function mapper(assignment) {
                    return assignment.getResource();
                },
                function filter(resource) {
                    return !!resource;
                }
            );
        }

        return result;
    },

    /**
     * Returns all events assigned to a resource
     *
     * @param {Sch.model.Resource|Mixed} resource
     * @return {[Sch.model.Range]}
     */
    getEventsForResource : function(resource) {
        var me = this,
            result;

        if (me.resourceEventsCache) {
            result = me.resourceEventsCache.get(resource);
        }
        else {
            result = me.mapAssignmentsForResource(
                resource,
                function mapper(assignment) {
                    return assignment.getEvent();
                },
                function filter(event) {
                    return !!event;
                }
            );
        }

        return result;
    },

    /**
     * Creates and adds assignment record for a given event and a resource.
     *
     * @param {Sch.model.Range|Mixed} event
     * @param {Sch.model.Resource|Mixed|Array} resource The resource(s) to assign to the event
     * @privateparam {Function} [assignmentSetupFn=Ext.identityFn]
     * @return {[Sch.model.Assignment]} An array with the created assignment(s)
     */
    assignEventToResource : function(event, resource, assignmentSetupFn) {
        var me = this,
            assignments = [];

        assignmentSetupFn = assignmentSetupFn || Ext.identityFn;

        var resources = Ext.isArray(resource) ? resource : [resource];

        Ext.Array.forEach(resources, function(resource) {
            if (!me.isEventAssignedToResource(event, resource)) {
                var assignment = new me.model();
                assignment.setEventId(event instanceof Ext.data.Model && event.getId() || event);
                assignment.setResourceId(resource instanceof Ext.data.Model && resource.getId() || resource);
                assignment = assignmentSetupFn(assignment);

                assignments.push(assignment);
            }
        });

        me.add(assignments);

        return assignments;
    },

    /**
     * Removes assignment record for a given event and a resource.
     *
     * @param {Sch.model.Range|Mixed} event
     * @param {Sch.model.Resource|Mixed} [resource] The resource to unassign the event from. If omitted, all resources of the events will be unassigned
     * @return {Sch.model.Assignment}
     */
    unassignEventFromResource : function(event, resource) {
        var me = this,
            assignment;

        if (!resource) {
            this.removeAssignmentsForEvent(event);
        } else if (me.isEventAssignedToResource(event, resource)) {
            assignment = me.getAssignmentForEventAndResource(event, resource);
            me.remove(assignment);
        }

        return assignment;
    },

    /**
     * Checks whether an event is assigned to a resource.
     *
     * @param {Sch.model.Range|Mixed} event
     * @param {Sch.model.Resource|Mixed} resource
     * @return {Boolean}
     */
    isEventAssignedToResource : function(event, resource) {
        var me = this,
            records = me.getResourcesForEvent(event),
            result = false,
            i, len;

        resource = resource instanceof Ext.data.Model && resource.getId() || resource;

        for (i = 0, len = records.length; !result && i < len; i++) {
            result = records[i];
            result = result.getId() == resource;
        }

        return result;
    },

    /**
     * Returns assignment record for given event and resource
     *
     * @param {Sch.model.Range} event
     * @param {Sch.model.Resource} resource
     * @return {Sch.model.Assignment|null}
     */
    getAssignmentForEventAndResource : function(event, resource) {
        var me = this,
            records = me.getAssignmentsForEvent(event),
            result = null,
            i, len;

        resource = resource instanceof Ext.data.Model && resource.getId() || resource;

        for (i = 0, len = records.length; !result && i < len; i++) {
            result = records[i];
            result = result.getResourceId() == resource && result || null;
        }

        return result;
    }
});
