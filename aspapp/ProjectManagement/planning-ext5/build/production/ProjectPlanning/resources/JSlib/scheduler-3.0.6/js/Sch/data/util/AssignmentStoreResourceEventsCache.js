/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * Assignment store resource->events cache.
 * Uses resource records or resource record ids as keys.
 *
 * @private
 */
if (!Ext.ClassManager.get('Sch.data.util.AssignmentStoreResourceEventsCache')) Ext.define('Sch.data.util.AssignmentStoreResourceEventsCache', {
    extend   : 'Sch.util.Cache',
    requires : [
        'Ext.data.Model'
    ],

    assignmentStore         : null,
    assignmentStoreDetacher : null,
    eventStoreDetacher      : null,
    resourceStoreDetacher   : null,

    constructor : function(assignmentStore) {
        var me = this,
            eventStore = assignmentStore.getEventStore(),
            resourceStore = eventStore && eventStore.getResourceStore();

        me.callParent();

        function onAssignmentAdd(store, assignments) {
            var eventStore = me.assignmentStore.getEventStore();

            Ext.Array.forEach(assignments, function(assignment) {
                var event = eventStore && eventStore.getModelById(assignment.getEventId());

                if (event) {
                    me.add(assignment.getResourceId(), event);
                }
                // Cache can't be validly updated, so clearing key entirily hoping that upon next key get() operation
                // the event will be there in the event store
                else {
                    me.clear(assignment.getResourceId());
                }
            });
        }

        function onAssignmentRemove(store, assignments) {
            var eventStore = me.assignmentStore.getEventStore();

            Ext.Array.forEach(assignments, function(assignment) {
                var event = eventStore && eventStore.getModelById(assignment.getEventId());

                if (event) {
                    me.remove(assignment.getResourceId(), event);
                }
                // Cache can't be validly updated, so clearing key entirily hoping that upon next key get() operation
                // the event will be there in the event store
                else {
                    me.clear(assignment.getResourceId());
                }
            });
        }

        function onAssignmentUpdate(store, assignment, operation) {
            var resourceIdField    = assignment.resourceIdField,
                resourceIdChanged  = assignment.previous && resourceIdField in assignment.previous,
                previousResourceId = resourceIdChanged && assignment.previous[resourceIdField],
                eventIdField       = assignment.eventIdField,
                eventIdChanged     = assignment.previous && eventIdField in assignment.previous,
                previousEventId    = eventIdChanged && assignment.previous[eventIdField],
                eventStore         = me.assignmentStore.getEventStore(),
                event;

            if (operation != Ext.data.Model.COMMIT && (resourceIdChanged || eventIdChanged)) {

                previousResourceId = resourceIdChanged ? previousResourceId : assignment.getResourceId();
                previousEventId    = eventIdChanged    ? previousEventId    : assignment.getEventId();

                event = eventStore && eventStore.getModelById(previousEventId);
                if (event) {
                    me.remove(previousResourceId, event);
                }
                else {
                    me.clear(previousResourceId);
                }

                event = eventStore && eventStore.getModelById(assignment.getEventId());
                if (event) {
                    me.add(assignment.getResourceId(), event);
                }
                else {
                    me.clear(assignment.getResourceId());
                }
            }
        }

        function onAssignmentStoreClearOrReset(store) {
            me.clear();
        }

        function onAssignmentStoreEventStoreChange(store, eventStore) {
            me.clear();
            attachToEventStore(eventStore);
            attachToResourceStore(eventStore && eventStore.getResourceStore());
        }

        function onEventRemove(eventStore, events) {
            Ext.Array.forEach(events, function(event) {
                me.uncache(event);
            });
        }

        function onEventStoreClearOrReset() {
            me.clear();
        }

        function onEventStoreResourceStoreChange(store, resourceStore) {
            me.clear();
            attachToResourceStore(resourceStore);
        }

        function onResourceIdChanged(resourceStore, resource, oldId, newId) {
            me.move(oldId, newId);
        }

        function onResourceRemove(resourceStore, resources) {
            Ext.Array.forEach(resources, function(resource) {
                me.clear(resource);
            });
        }

        function onResourceStoreClearOrReset() {
            me.clear();
        }

        function attachToEventStore(eventStore) {
            Ext.destroy(me.eventStoreDetacher);
            me.eventStoreDetacher = eventStore && eventStore.on({
                remove              : onEventRemove,
                cacheresethint      : onEventStoreClearOrReset,
                clear               : onEventStoreClearOrReset,
                rootchange          : onEventStoreClearOrReset,
                resourcestorechange : onEventStoreResourceStoreChange,
                priority            : 100,
                destroyable         : true
            });
        }

        function attachToResourceStore(resourceStore) {
            Ext.destroy(me.resourceStoreDetacher);
            me.resourceStoreDetacher = resourceStore && resourceStore.on({
                idchanged      : onResourceIdChanged,
                remove         : onResourceRemove,
                cacheresethint : onResourceStoreClearOrReset,
                clear          : onResourceStoreClearOrReset,
                rootchange     : onResourceStoreClearOrReset,
                priority       : 100,
                destroyable    : true
            });
        }

        me.assignmentStoreDetacher = assignmentStore.on({
            add              : onAssignmentAdd,
            remove           : onAssignmentRemove,
            update           : onAssignmentUpdate,
            cacheresethint   : onAssignmentStoreClearOrReset,
            clear            : onAssignmentStoreClearOrReset,
            eventstorechange : onAssignmentStoreEventStoreChange,
            // subscribing to the CRUD using priority - should guarantee that our listeners
            // will be called first (before any other listeners, that could be provided in the "listeners" config)
            // and state in other listeners will be correct
            priority         : 100,
            destroyable      : true
        });

        attachToEventStore(eventStore);
        attachToResourceStore(resourceStore);

        me.assignmentStore = assignmentStore;
    },

    destroy : function() {
        var me = this;
        Ext.destroyMembers(
            me,
            'assignmentStoreDetacher',
            'eventStoreDetacher',
            'resourceStoreDetacher'
        );
        me.assignmentStore = null;
    },

    get : function(k, fn) {
        var me = this;

        fn = fn || function() {
            return me.assignmentStore.mapAssignmentsForResource(
                k,
                function mapper(assignment) {
                    return assignment.getEvent();
                },
                function filter(event) {
                    return !!event;
                }
            );
        };

        return me.callParent([k, fn]);
    }
});
