/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * Assignment store event->resources cache.
 * Uses event records or event record ids as keys.
 *
 * @private
 */
if (!Ext.ClassManager.get('Sch.data.util.AssignmentStoreEventResourcesCache')) Ext.define('Sch.data.util.AssignmentStoreEventResourcesCache', {
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
            var eventStore = me.assignmentStore.getEventStore(),
                resourceStore = eventStore && eventStore.getResourceStore();

            Ext.Array.forEach(assignments, function(assignment) {
                var resource = resourceStore && resourceStore.getModelById(assignment.getResourceId());

                if (resource) {
                    me.add(assignment.getEventId(), resource);
                }
                // Cache can't be validly updated, so clearing key entirily hoping that upon next key get() operation
                // the event will be there in the resource store
                else {
                    me.clear(assignment.getEventId());
                }
            });
        }

        function onAssignmentRemove(store, assignments) {
            var eventStore = me.assignmentStore.getEventStore(),
                resourceStore = eventStore && eventStore.getResourceStore();

            Ext.Array.forEach(assignments, function(assignment) {
                var resource = resourceStore.getModelById(assignment.getResourceId());

                if (resource) {
                    me.remove(assignment.getEventId(), resource);
                }
                // Cache can't be validly updated, so clearing key entirily hoping that upon next key get() operation
                // the event will be there in the resource store
                else {
                    me.clear(assignment.getEventId());
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
                resourceStore      = eventStore && eventStore.getResourceStore(),
                resource;

            if (operation != Ext.data.Model.COMMIT && (resourceIdChanged || eventIdChanged)) {

                previousResourceId = resourceIdChanged ? previousResourceId : assignment.getResourceId();
                previousEventId    = eventIdChanged    ? previousEventId    : assignment.getEventId();

                resource = resourceStore.getModelById(previousResourceId);
                if (resource) {
                    me.remove(previousEventId, resource);
                }
                else {
                    me.clear(previousEventId);
                }

                resource = resourceStore.getModelById(assignment.getResourceId());
                if (resource) {
                    me.add(assignment.getEventId(), resource);
                }
                else {
                    me.clear(assignment.getEventId());
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

        function onEventIdChanged(eventStore, event, oldId, newId) {
            me.move(oldId, newId);
        }

        function onEventRemove(eventStore, events) {
            Ext.Array.forEach(events, function(event) {
                me.clear(event);
            });
        }

        function onEventStoreClearOrReset() {
            me.clear();
        }

        function onEventStoreResourceStoreChange(eventStore, resourceStore) {
            me.clear();
            attachToResourceStore(resourceStore);
        }

        function onResourceRemove(resourceStore, resources) {
            Ext.Array.forEach(resources, function(resource) {
                me.uncache(resource);
            });
        }

        function onResourceStoreClearOrReset() {
            me.clear();
        }

        function attachToEventStore(eventStore) {
            Ext.destroy(me.eventStoreDetacher);
            me.eventStoreDetacher = eventStore && eventStore.on({
                idchanged           : onEventIdChanged,
                remove              : onEventRemove,
                clear               : onEventStoreClearOrReset,
                cacheresethint      : onEventStoreClearOrReset,
                rootchange          : onEventStoreClearOrReset,
                resourcestorechange : onEventStoreResourceStoreChange,
                priority            : 100,
                destroyable         : true
            });
        }

        function attachToResourceStore(resourceStore) {
            Ext.destory(me.resourceStoreDetacher);
            me.resourceStoreDetacher = resourceStore && resourceStore.on({
                remove         : onResourceRemove,
                clear          : onResourceStoreClearOrReset,
                cacheresethint : onResourceStoreClearOrReset,
                rootchange     : onResourceStoreClearOrReset,
                priority       : 100,
                destroyable    : true
            });
        }

        me.assignmentStoreDetacher = assignmentStore.on({
            add            : onAssignmentAdd,
            remove         : onAssignmentRemove,
            update         : onAssignmentUpdate,
            clear          : onAssignmentStoreClearOrReset,
            cacheresethint : onAssignmentStoreClearOrReset,
            // subscribing to the CRUD using priority - should guarantee that our listeners
            // will be called first (before any other listeners, that could be provided in the "listeners" config)
            // and state in other listeners will be correct
            priority    : 100,
            destroyable : true
        });

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
            return me.assignmentStore.mapAssignmentsForEvent(
                k,
                function mapper(assignment) {
                    return assignment.getResource();
                },
                function filter(resource) {
                    return !!resource;
                }
            );
        };

        return me.callParent([k, fn]);
    }
});
