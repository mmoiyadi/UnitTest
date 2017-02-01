/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * This class manages model persistency, it listens to model stores' beforesync event and removes all non persistable
 * records from sync operation. The logic has meaning only for CRUD-less sync operations.
 *
 * @private
 */
if (!Ext.ClassManager.get("Sch.data.util.ModelPersistencyManager")) Ext.define('Sch.data.util.ModelPersistencyManager', {

    config : {
        eventStore      : null,
        resourceStore   : null,
        assignmentStore : null
    },

    eventStoreDetacher      : null,
    resourceStoreDetacher   : null,
    assignmentStoreDetacher : null,

    constructor : function(config) {
        this.initConfig(config);
    },

    // {{{ Event attachers
    updateEventStore : function(newEventStore, oldEventStore) {
        var me = this;

        Ext.destroyMembers(me, 'eventStoreDetacher');

        if (newEventStore && newEventStore.autoSync) {
            me.eventStoreDetacher = newEventStore.on({
                beforesync  : me.onEventStoreBeforeSync,
                scope       : me,
                destroyable : true,
                // Just in case
                priority    : 100
            });
        }
    },

    updateResourceStore : function(newResourceStore, oldResourceStore) {
        var me = this;

        Ext.destroyMembers(me, 'resourceStoreDetacher');

        if (newResourceStore && newResourceStore.autoSync) {
            me.resourceStoreDetacher = newResourceStore.on({
                beforesync  : me.onResourceStoreBeforeSync,
                scope       : me,
                destroyable : true,
                // Just in case
                priority    : 100
            });
        }
    },

    updateAssignmentStore : function(newAssignmentStore, oldAssignmentStore) {
        var me = this;

        Ext.destroyMembers(me, 'assignmentStoreDetacher');

        if (newAssignmentStore && newAssignmentStore.autoSync) {
            me.assignmentStoreDetacher = newAssignmentStore.on({
                beforesync  : me.onAssignmentStoreBeforeSync,
                scope       : me,
                destroyable : true,
                // Just in case
                priority    : 100
            });
        }
    },
    // }}}

    // {{{ Event handlers
    onEventStoreBeforeSync : function(options) {
        var me = this;
        me.removeNonPersistableRecordsToCreate(options);
        return me.shallContinueSync(options);
    },

    onResourceStoreBeforeSync : function(options) {
        var me = this;
        me.removeNonPersistableRecordsToCreate(options);
        return me.shallContinueSync(options);
    },

    onAssignmentStoreBeforeSync : function(options) {
        var me = this;
        me.removeNonPersistableRecordsToCreate(options);
        return me.shallContinueSync(options);
    },
    // }}}

    // {{{ Management rules
    removeNonPersistableRecordsToCreate : function(options) {
        var recordsToCreate = options.create || [],
            r, i;

        // We remove from the array we iterate thus we iterate from end to start
        for (i = recordsToCreate.length - 1; i >= 0; --i) {
            r = recordsToCreate[i];
            if (!r.isPersistable()) {
                Ext.Array.remove(recordsToCreate, r);
            }
        }

        // Prevent empty create request
        if (recordsToCreate.length === 0) {
            delete options.create;
        }
    },

    shallContinueSync : function(options) {
        return Boolean((options.create  && options.create.length  > 0) ||
                       (options.update  && options.update.length  > 0) ||
                       (options.destroy && options.destroy.length > 0));
    }
    // }}}
});
