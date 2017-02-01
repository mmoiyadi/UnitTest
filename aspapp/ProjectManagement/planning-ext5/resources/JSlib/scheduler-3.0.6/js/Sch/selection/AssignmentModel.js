/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.selection.EventModel
 * @extends Ext.selection.Model
 *
 * This class provides assignment selection model for multiple assignments mode, i.e. when the event store is configured
 * with assignment store and uses it for storring event to resource and resource to event assignment information.
 * In multiple assignment mode there're might be several event bars rendered for each event in the event store, thus
 * an inconsistency appears, to solve the inconsistency we use assignment record as entities being selected since
 * there's direct correspondence between event bar and assignment the bar is rendered for.
 */
Ext.define('Sch.selection.AssignmentModel', {
    extend : 'Sch.selection.EventModel',
    alias  : 'selection.assignmentmodel',

    /**
     * @event beforedeselect
     * Fired before a record is deselected. If any listener returns false, the
     * deselection is cancelled.
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Assignment} record The selected assignment
     */

    /**
     * @event beforeselect
     * Fired before a record is selected. If any listener returns false, the
     * selection is cancelled.
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Assignment} record The selected assignment
     */

    /**
     * @event deselect
     * Fired after a record is deselected
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Assignment} record The selected assignment
     */

    /**
     * @event select
     * Fired after a record is selected
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Assignment} record The selected assignment
     */

    assignmentStoreDetacher : null,

    destroy : function() {
        var me = this;

        Ext.destroyMembers(
            me,
            'assignmentStoreDetacher'
        );

        me.callParent();
    },

    bindToView : function(view) {
        var me = this,
            eventStore,
            assignmentStore;

        me.callParent([view]);

        eventStore = me.view.eventStore;
        assignmentStore = eventStore.getAssignmentStore();

        if (assignmentStore) {
            me.assignmentStoreDetacher = assignmentStore.on({
                'remove'    : me.onAssignmentStoreRemove,
                'clear'     : me.onAssignmentStoreClear,
                'refresh'   : me.onAssignmentStoreRefresh,
                scope       : me,
                destroyable : true
            });
        }
    },

    selectWithEvent : function(eventRecord, e) {
        var me = this,
            view = me.view,
            resourceRecord = view.resolveResource(e.getTarget()),
            assignmentStore,
            assignmentRecord;

        if (resourceRecord) {
            assignmentStore  = view.eventStore.getAssignmentStore();
            assignmentRecord = assignmentStore.getAssignmentForEventAndResource(eventRecord, resourceRecord);
            if (assignmentRecord) {
                me.callParent([assignmentRecord, e]);
            }
        }
    },


    getFirstSelectedEventForResource : function(resource) {
        var selections = this.getSelection(),
            event = null,
            i, len, r;

        for (i = 0, len = selections.length; !event && i < len; ++i) {
            r = selections[i];
            if (r.getEvent().isAssignedTo(resource)) {
                event = r;
            }
        }

        return event;
    },

    getDraggableSelections : function() {
        return Ext.Array.filter(
            this.getSelection(),
            function(record) {
                return record.getEvent().isDraggable();
            }
        );
    },

    forEachEventRelatedSelection : function(eventRecord, fn) {
        Ext.Array.forEach(this.getSelection(), function(selectedRecord) {
            selectedRecord.getEvent() === eventRecord && fn(selectedRecord);
        });
    },

    onAssignmentStoreRemove : function(assignmentStore, removedRecords) {
        this.deselect(removedRecords, true);
    },

    onAssignmentStoreClear : function(assignmentStore) {
        this.clearSelections();
    },

    onAssignmentStoreRefresh : function(assignmentStore) {
        this.clearSelections();
    }
});
