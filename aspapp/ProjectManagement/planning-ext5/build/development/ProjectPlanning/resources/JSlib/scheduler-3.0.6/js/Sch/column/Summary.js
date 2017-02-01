/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.column.Summary
@extends Ext.grid.column.Column

A Column showing the currently allocated time for the resources in the grid. It will simply summarize the durations **of the events that are in the current view**.
The information can be displayed as either a time unit or a percentage of the available time.

To add this column to the scheduler:

        var summaryCol = Ext.create("Sch.column.Summary", {
            header      : 'Time allocated',
            width       : 80,
            showPercent : false 
        });

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            columns         : [
                ...
                summaryCol,
                ...
            ]
        });

*/
Ext.define('Sch.column.Summary', {
    extend          : "Ext.grid.column.Column",
    alias           : [
        "widget.summarycolumn",
        "plugin.scheduler_summarycolumn" /*TODO REMOVE for 3.0 */
    ],

    // TODO REMOVE THESE FOR 3.0 (BREAKING)
    mixins          : ['Ext.AbstractPlugin'],
    alternateClassName : 'Sch.plugin.SummaryColumn',
    init            : Ext.emptyFn,
    // -------- EOF TODO

    lockableScope   : 'top',

    /**
     * @cfg {Boolean} showPercent True to show percentage values, false to show summarized time. Default value is `false`.
     */
    showPercent     : false,

    /**
     * @cfg {Number} nbrDecimals The number of decimals to show, only applicable when `showPercent` is set to false
     */
    nbrDecimals     : 1,

    sortable        : false,
    fixed           : true,
    menuDisabled    : true,

    width           : 80,
    dataIndex       : '_sch_not_used',

    timeAxis        : null,
    eventStore      : null,

    constructor     : function(config){
        this.scope = this;

        this.callParent(arguments);

        this.on('beforerender', this.onMyBeforeRender, this);
    },

    onMyBeforeRender    : function() {

        var pnl = this.up('tablepanel[lockable=true]');

        this.timeAxis = pnl.getTimeAxis();
        this.eventStore = pnl.getEventStore();
    },


    renderer : function(v, p, record){
        var timeAxis        = this.timeAxis,
            eventStore      = this.eventStore,
            viewStart       = timeAxis.getStart(),
            viewEnd         = timeAxis.getEnd(),
            retVal          = 0,
            totalAllocatedMinutesInView = this.calculate(eventStore.getEventsForResource(record), viewStart, viewEnd);

        if (totalAllocatedMinutesInView <= 0) {
            return '';
        }

        if (this.showPercent) {
            var timeInView = Sch.util.Date.getDurationInMinutes(viewStart, viewEnd);

            return (Math.round((totalAllocatedMinutesInView * 100)/ timeInView)) + ' %';
        } else {
            if (totalAllocatedMinutesInView > 1440) {
                return (totalAllocatedMinutesInView / 1440).toFixed(this.nbrDecimals) + ' ' + Sch.util.Date.getShortNameOfUnit("DAY");
            }
            if (totalAllocatedMinutesInView >= 30) {
                return (totalAllocatedMinutesInView / 60).toFixed(this.nbrDecimals) + ' ' + Sch.util.Date.getShortNameOfUnit("HOUR");
            }
            return totalAllocatedMinutesInView + ' ' + Sch.util.Date.getShortNameOfUnit("MINUTE");
        }
    },

    calculate : function(eventRecords, viewStart, viewEnd){
        var totalTime = 0,
            eventStart,
            eventEnd,
            D = Sch.util.Date;

        Ext.each(eventRecords, function(eRec) {
            eventStart = eRec.getStartDate();
            eventEnd = eRec.getEndDate();

            if (D.intersectSpans(viewStart, viewEnd, eventStart, eventEnd)) {
               totalTime += D.getDurationInMinutes(D.max(eventStart, viewStart), D.min(eventEnd, viewEnd));
            }
        });

        return totalTime;
    }
});