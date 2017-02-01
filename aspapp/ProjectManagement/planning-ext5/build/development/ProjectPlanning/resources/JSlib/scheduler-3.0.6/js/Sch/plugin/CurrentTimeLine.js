/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.CurrentTimeLine
@extends Sch.plugin.Lines

Plugin (ptype = 'scheduler_currenttimeline') indicating the current date and time as a line in the schedule.

To add this plugin to scheduler:

    var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
        ...

        resourceStore   : resourceStore,
        eventStore      : eventStore,

        plugins         : [
            Ext.create('Sch.plugin.CurrentTimeLine', { updateInterval : 30000 })
        ]
    });


*/
Ext.define("Sch.plugin.CurrentTimeLine", {
    extend              : "Sch.plugin.Lines",
    alias               : 'plugin.scheduler_currenttimeline',
    mixins              : ['Sch.mixin.Localizable'],

    requires            : [
        'Ext.data.JsonStore'
    ],

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - tooltipText : 'Current time'
     */

    /**
     * @cfg {Number} updateInterval This value (in ms) defines how often the timeline shall be refreshed. Defaults to every once every minute.
     */
    updateInterval      : 60000,

    showHeaderElements  : true,

    /**
     * @cfg {Boolean} autoUpdate true to automatically update the line position over time. Default value is `true`
     */
    autoUpdate          : true,

    expandToFitView     : true,

    timer               : null,

    init                : function(cmp) {
        // touch scheduler does not support header elements
        if (Ext.getVersion('touch')) this.showHeaderElements = false;
        
        var store = new Ext.data.JsonStore({
            fields  : ['Date', 'Cls', 'Text'],
            data    : [
                { Date : new Date(), Cls : 'sch-todayLine', Text : this.L('tooltipText')}
            ]
        });

        var record = store.first();

        if (this.autoUpdate) {
            this.timer = setInterval(function() {
                record.set('Date', new Date());
            }, this.updateInterval);
        }

        this.store = store;
        this.callParent(arguments);
    },

    destroy       : function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.store.autoDestroy) {
            this.store.destroy();
        }

        this.callParent(arguments);
    }
});
