/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.HeaderZoom
@extends Sch.util.DragTracker

This plugin (ptype = 'scheduler_headerzoom') enables zooming to a timespan selected using drag drop in the header area of the scheduler panel.

Zooming will be performed to the nearest zooming level that will make all columns to fit in the scheduling view width,
additionally a column width of that zooming level will be slightly adjusted to improve the fit.

After zooming, the selected time span will appear centered in the scheduling view.

**NOTE*: This plugin only supports panels in horizontal orientation.

To add this plugin to scheduler:

        var s1  = new Sch.panel.SchedulerGrid({
            ...
                
            plugins     : [
                new Sch.plugin.HeaderZoom(),

                // or lazy style definition
                'scheduler_headerzoom'
            ]
        })
    
*/
Ext.define("Sch.plugin.HeaderZoom", {
    extend        : "Sch.util.DragTracker",
    mixins        : [ 'Ext.AbstractPlugin' ],
    alias         : 'plugin.scheduler_headerzoom',
    lockableScope : 'top',

    scheduler      : null,
    proxy          : null,
    headerRegion   : null,

    init : function (scheduler) {

        this.scheduler      = scheduler;

        this.onModeChange();

        scheduler.on('modechange', this.onModeChange, this);
    },
    
    onOrientationChange : function () {
        return this.onModeChange.apply(this, arguments);
    },
    
    onModeChange   : function () {
        var timeAxisColumn = this.scheduler.down('timeaxiscolumn');
        
        if (timeAxisColumn) {
            
            if (timeAxisColumn.rendered) {
                this.onTimeAxisColumnRender(timeAxisColumn);
            } else {
                timeAxisColumn.on({
                    afterrender : this.onTimeAxisColumnRender,
                    scope       : this
                });
            }
        }
    },

    onTimeAxisColumnRender : function (column) {
        this.proxy = column.el.createChild({ cls : 'sch-drag-selector' });

        this.initEl(column.el);
    },

    
    onStart : function (e) {
        this.proxy.show();

        this.headerRegion   = this.scheduler.normalGrid.headerCt.getRegion();
    },

    
    onDrag : function (e) {
        var headerRegion    = this.headerRegion;
        var dragRegion      = this.getRegion().constrainTo(headerRegion);
        
        dragRegion.top      = headerRegion.top;
        dragRegion.bottom   = headerRegion.bottom;

        this.proxy.setBox(dragRegion);
    },

    
    onEnd : function (e) {
        if (this.proxy) {
            this.proxy.setDisplayed(false);

            var scheduler   = this.scheduler;
            var timeAxis    = scheduler.timeAxis;
            var region      = this.getRegion();
            var unit        = scheduler.getSchedulingView().timeAxisViewModel.getBottomHeader().unit;
            var range       = scheduler.getSchedulingView().getStartEndDatesFromRegion(region);
            
            scheduler.zoomToSpan({
                start   : timeAxis.floorDate(range.start, false, unit, 1),
                end     : timeAxis.ceilDate(range.end, false, unit, 1)
            });
        }
    },

    
    destroy : function () {
        if (this.proxy) {
            Ext.destroy(this.proxy);

            this.proxy = null;
        }

        this.callParent(arguments);
    }
});