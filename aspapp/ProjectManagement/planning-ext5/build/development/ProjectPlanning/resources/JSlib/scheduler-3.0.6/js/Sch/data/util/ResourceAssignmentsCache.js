/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * Assignment store resource->assignments cache.
 * Uses resource records or resource record ids as keys.
 *
 * @private
 */
Ext.define('Sch.data.util.ResourceAssignmentsCache', {
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
            Ext.Array.forEach(assignments, function(assignment) {
                me.add(assignment.getResourceId(), assignment);
            });
        }

        function onAssignmentRemove(store, assignments) {
            Ext.Array.forEach(assignments, function(assignment) {
                me.remove(assignment.getResourceId(), assignment);
            });
        }

        function onAssignmentUpdate(store, assignment, operation) {
            var resourceIdField    = assignment.resourceIdField,
                resourceIdChanged  = assignment.previous && resourceIdField in assignment.previous,
                previousResourceId = resourceIdChanged && assignment.previous[resourceIdField];

            if (operation != Ext.data.Model.COMMIT && resourceIdChanged) {
                me.move(previousResourceId, assignment.getResourceId(), assignment);
            }
        }

        function onAssignmentStoreClearOrReset(store) {
            me.clear();
        }

        function onAssignmentStoreEventStoreChange(store, eventStore) {
            attachToEventStore(eventStore);
            attachToResourceStore(eventStore && eventStore.getResourceStore());
        }

        function onEventStoreResourceStoreChange(eventStore, resourceStore) {
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
                resourcestorechange : onEventStoreResourceStoreChange,
                priority    : 100,
                destroyable : true
            });
        }

        function attachToResourceStore(resourceStore) {
            Ext.destroy(me.resourceStoreDetacher);
            me.resourceStoreDetacher = resourceStore && resourceStore.on({
                idchanged      : onResourceIdChanged,
                remove         : onResourceRemove,
                clear          : onResourceStoreClearOrReset,
                cacheresethint : onResourceStoreClearOrReset,
                rootchange     : onResourceStoreClearOrReset,
                priority       : 100,
                destroyable    : true
            });
        }

        me.assignmentStoreDetacher = assignmentStore.on({
            add              : onAssignmentAdd,
            remove           : onAssignmentRemove,
            update           : onAssignmentUpdate,
            clear            : onAssignmentStoreClearOrReset,
            cacheresethint   : onAssignmentStoreClearOrReset,
            eventstorechange : onAssignmentStoreEventStoreChange,
            // subscribing to the CRUD using priority - should guarantee that our listeners
            // will be called first (before any other listeners, that could be provided in the "listeners" config)
            // and state in other listeners will be correct
            priority    : 100,
            destroyable : true
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

        k = me.key(k);

        fn = fn || function() {
            return Ext.Array.filter(me.assignmentStore.getRange(), function(assignment) {
                return assignment.getResourceId() == k;
            });
        };

        return me.callParent([k, fn]);
    }
});
