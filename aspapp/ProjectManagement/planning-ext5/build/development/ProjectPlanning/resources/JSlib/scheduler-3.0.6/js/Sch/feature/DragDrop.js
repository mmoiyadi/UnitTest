/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.feature.DragDrop
 * @private
 * Internal class enabling drag and drop for event nodes and creating drag proxy (classic or simplified).
 * Type of proxy can be configured with {@link Sch.mixin.SchedulerPanel#cfg-dragConfig SchedulerPanel} dragConfig property.
 */
Ext.define("Sch.feature.DragDrop", {

    requires : [
        'Ext.XTemplate',
        'Sch.feature.SchedulerDragZone'
    ],

    /**
     * An empty function by default, but provided so that you can perform custom validation on
     * the item being dragged. This function is called during the drag and drop process and also after the drop is made.
     * Return true if the new position is valid, false to prevent the drag.
     * @param {Sch.model.Event[]} dragRecords an array containing the records for the events being dragged
     * @param {Sch.model.Resource} targetResourceRecord the target resource of the the event
     * @param {Date} date The date corresponding to the current mouse position
     * @param {Number} duration The duration of the item being dragged
     * @param {Event} e The event object
     * @return {Boolean}
     */
    validatorFn : function(dragRecords, targetResourceRecord, date, duration, e) {
        return true;
    },


    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope        : null,

    /**
     * @cfg {Object} dragConfig
     *
     * The config object which will be passed to the `Sch.feature.SchedulerDragZone` instance
     */
    dragConfig              : null,

    /**
     * @constructor
     * @param {Sch.panel.SchedulerGrid} scheduler The scheduler instance
     * @param {Object} config The object containing the configuration of this model.
     */
    constructor : function(schedulerView, config) {
        Ext.apply(this, config);

        this.schedulerView = schedulerView;

        // The drag zone behaviour, can't attach to the view el (crash in IE), using panel el instead.
        schedulerView.eventDragZone = new Sch.feature.SchedulerDragZone(schedulerView.ownerCt.el, Ext.apply({
            ddGroup             : schedulerView.id,
            schedulerView       : schedulerView,
            validatorFn         : this.validatorFn,
            validatorFnScope    : this.validatorFnScope
        }, this.dragConfig));

        this.schedulerView.on("destroy", this.cleanUp, this);

        this.callParent([config]);
    },


    cleanUp : function() {
        var schedulerView       = this.schedulerView;

        if (schedulerView.eventDragZone) {
            schedulerView.eventDragZone.destroy();
        }
    }
});
