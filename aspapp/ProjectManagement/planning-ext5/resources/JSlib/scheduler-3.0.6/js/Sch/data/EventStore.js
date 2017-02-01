/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.EventStore

This is a class holding all the {@link Sch.model.Event events} to be rendered into a {@link Sch.SchedulerPanel scheduler panel}.

*/
if (!Ext.ClassManager.get("Sch.data.EventStore")) Ext.define("Sch.data.EventStore", {
    extend      : 'Ext.data.Store',
    alias       : 'store.eventstore',
    mixins      : [
        'Sch.data.mixin.UniversalModelGetter',
        'Sch.data.mixin.CacheHintHelper',
        'Sch.data.mixin.EventStore'
    ],

    storeId     : 'events',
    model       : 'Sch.model.Event',
    config      : { model : 'Sch.model.Event' },
    proxy       : 'memory',

    constructor : function(config) {
        var me = this;

        me.callParent([config]);

        me.resourceStore   && me.setResourceStore(me.resourceStore);
        me.assignmentStore && me.setAssignmentStore(me.assignmentStore);

        if (me.getModel() !== Sch.model.Event && !(me.getModel().prototype instanceof Sch.model.Event)) {
            throw 'The model for the EventStore must subclass Sch.model.Event';
        }
    },

    /**
     * Appends a new record to the store
     * @param {Sch.model.Event} record The record to append to the store
     */
    append : function(record) {
        this.add(record);
    }
});
