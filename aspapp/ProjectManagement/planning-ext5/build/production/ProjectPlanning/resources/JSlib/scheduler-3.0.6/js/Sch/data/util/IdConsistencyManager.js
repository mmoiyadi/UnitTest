/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * This class manages id consistency among model stores, it listens to 'idchanged' event on each store and updates
 * referential fields referencing records with changed ids in other model entities.
 *
 * Note on update process:
 *  at the time when 'idchanged' handler is called we can effectively query stores which are using caches for
 *  a data cached under old id, but we cannot update related models with the new id since at the time of
 *  'idchanged' handler is called a record which id has been updated is still marked as phantom, it's
 *  phantom flag will be reset only at 'update' event time (and 'idchanged' event is always followed by 'update'
 *  event) and it's important we start updating related records after primary records are not phantoms
 *  any more since we might rely on this flag (for example a related store sync operation might be blocked
 *  if primary store records it relies on are still phantom).
 *
 * @private
 */
if (!Ext.ClassManager.get("Sch.data.util.IdConsistencyManager")) Ext.define('Sch.data.util.IdConsistencyManager', {

    config : {
        eventStore      : null,
        resourceStore   : null,
        assignmentStore : null
    },

    eventStoreDetacher     : null,
    resourceStoreDetacher  : null,

    constructor : function(config) {
        this.initConfig(config);
    },

    // {{{ Event attachers
    updateEventStore : function(newEventStore, oldEventStore) {
        var me = this;

        Ext.destroyMembers(me, 'eventStoreDetacher');

        if (newEventStore) {
            me.eventStoreDetacher = newEventStore.on({
                idchanged   : me.onEventIdChanged,
                scope       : me,
                destroyable : true,
                // It's important that priority here was more then in assignment/event store caches
                // otherwise quering by old id won't return correct results, assignment will be moved
                // to new event id already if this priority is lower then the one used in cache
                priority    : 200
            });
        }
    },

    updateResourceStore : function(newResourceStore, oldResourceStore) {
        var me = this;

        Ext.destroyMembers(me, 'resourceStoreDetacher');

        if (newResourceStore) {
            me.resourceStoreDetacher = newResourceStore.on({
                idchanged   : me.onResourceIdChanged,
                scope       : me,
                destroyable : true,
                // It's important that priority here was more then in assignment/event store caches
                // otherwise quering by old id won't return correct results, assignment will be moved
                // to new resource id already if this priority is lower then the one used in cache
                priority    : 200
            });
        }
    },
    // }}}

    // {{{ Event handlers

    // Please see the note at the class description
    onEventIdChanged : function(eventStore, event, oldId, newId) {
        var me = this,
            assignmentStore = me.getAssignmentStore(),
            assignmentsUpdater;

        if (assignmentStore) {
            assignmentsUpdater = me.getUpdateAssignmentEventIdFieldFn(assignmentStore, oldId, newId);
            eventStore.on(
                'update',
                assignmentsUpdater,
                null,
                { single : true, priority : 200 }
            );
        }
    },

    // Please see the note at the class description
    onResourceIdChanged : function(resourceStore, resource, oldId, newId) {
        var me = this,
            eventStore = me.getEventStore(),
            assignmentStore = me.getAssignmentStore(),
            eventsUpdater,
            assignmentsUpdater;

        if (eventStore && !assignmentStore) {
            eventsUpdater = me.getUpdateEventResourceIdFieldFn(eventStore, oldId, newId);
        }

        if (assignmentStore) {
            assignmentsUpdater = me.getUpdateAssignmentResourceIdFieldFn(assignmentStore, oldId, newId);
        }

        if (eventsUpdater || assignmentStore) {
            resourceStore.on(
                'update',
                function() {
                    eventsUpdater && eventsUpdater();
                    assignmentsUpdater && assignmentsUpdater();
                },
                null,
                { single : true, priority : 200 }
            );
        }
    },
    // }}}

    // {{{ Update rules
    getUpdateEventResourceIdFieldFn : function(eventStore, oldId, newId) {
        var events = eventStore.getRange();

        return function() {
            Ext.Array.forEach(events, function(event) {
                event.getResourceId() == oldId && event.setResourceId(newId);
            });
        };
    },

    getUpdateAssignmentEventIdFieldFn : function(assignmentStore, oldId, newId) {
        var assignments = assignmentStore.getAssignmentsForEvent(oldId);

        return function() {
            Ext.Array.forEach(assignments, function(assignment) {
                assignment.getEventId() == oldId && assignment.setEventId(newId);
            });
        };
    },

    getUpdateAssignmentResourceIdFieldFn : function(assignmentStore, oldId, newId) {
        var assignments = assignmentStore.getAssignmentsForResource(oldId);

        return function() {
            Ext.Array.forEach(assignments, function(assignment) {
                assignment.getResourceId() == oldId && assignment.setResourceId(newId);
            });
        };
    }
    // }}}
});
