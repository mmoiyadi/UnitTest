/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.TimeGap
 @extends Sch.plugin.Zones

 Plugin (ptype = 'scheduler_timegap') for highlighting unallocated slots of time for all resources. You can use the `getZoneCls` method to customize the css class of the "gaps".

 {@img scheduler/images/plugin-timegap.png}

 To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.TimeGap', {

                    getZoneCls : function (startDate, endDate) {
                        return 'myGapCls'
                    }
                })
            ]
        });

 */
Ext.define("Sch.plugin.TimeGap", {
    extend : "Sch.plugin.Zones",
    alias  : "plugin.scheduler_timegap",

    requires : [
        'Ext.data.JsonStore'
    ],

    /**
     * An empty function by default, but provided so that you can return a custom CSS class for each unallocated zone area
     * @param {Date} start The start date of the unallocated time slot
     * @param {Date} end The end date of the unallocated time slot
     * @return {String} The CSS class to be applied to the zone element
     */
    getZoneCls : Ext.emptyFn,

    init : function (scheduler) {

        this.store = new Ext.data.JsonStore({
            model : 'Sch.model.Range'
        });

        this.scheduler = scheduler;

        scheduler.mon(scheduler.eventStore, {
            load        : this.populateStore,
            update      : this.populateStore,
            remove      : this.populateStore,
            add         : this.populateStore,
            datachanged : this.populateStore,
            scope       : this
        });

        scheduler.on('viewchange', this.populateStore, this);

        this.schedulerView = scheduler.getSchedulingView();

        this.callParent(arguments);
    },

    populateStore : function (eventStore) {
        var eventsInView = this.schedulerView.getEventsInView(),
            timeGaps = [],
            viewStart = this.scheduler.getStart(),
            viewEnd = this.scheduler.getEnd(),
            l = eventsInView.getCount(),
            cursor = viewStart,
            eventStart,
            index = 0,
            r;

        // Sort by start time
        eventsInView.sortBy(function (r1, r2) {
            return r1.getStartDate() - r2.getStartDate();
        });

        r = eventsInView.getAt(0);

        while (cursor < viewEnd && index < l) {
            eventStart = r.getStartDate();

            if (!Sch.util.Date.betweenLesser(cursor, eventStart, r.getEndDate()) && cursor < eventStart) {
                timeGaps.push(new this.store.model({
                    StartDate : cursor,
                    EndDate   : eventStart,
                    Cls       : this.getZoneCls(cursor, eventStart) || ''
                }));
            }
            cursor = Sch.util.Date.max(r.getEndDate(), cursor);
            index++;
            r = eventsInView.getAt(index);
        }

        // Check if there's a gap between last cursor and view end time
        if (cursor < viewEnd) {
            timeGaps.push(new this.store.model({
                StartDate : cursor,
                EndDate   : viewEnd,
                Cls       : this.getZoneCls(cursor, viewEnd) || ''
            }));
        }

        // Don't refresh twice, the add will cause the zones to redraw
        this.store.removeAll(timeGaps.length > 0);
        this.store.add(timeGaps);
    }
});
