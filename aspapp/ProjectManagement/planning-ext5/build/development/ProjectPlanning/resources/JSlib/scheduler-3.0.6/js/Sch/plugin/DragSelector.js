/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.DragSelector
@extends Ext.util.Observable

Plugin (ptype = 'scheduler_dragselector') for selecting multiple events by "dragging" an area in the scheduler chart. Currently only enabled **when CTRL is pressed**

{@img scheduler/images/drag-selector.png}

To add this plugin to scheduler:

    var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
        ...
    
        resourceStore   : resourceStore,
        eventStore      : eventStore,
    
        plugins         : [
            Ext.create('Sch.plugin.DragSelector')
        ]
    });

*/
Ext.define("Sch.plugin.DragSelector", {
    extend        : "Sch.util.DragTracker",
    alias         : 'plugin.scheduler_dragselector',
    mixins        : ['Ext.AbstractPlugin'],

    requires      : [
        'Sch.util.ScrollManager'
    ],

    lockableScope : 'top',

    schedulerView : null,
    eventData     : null,
    sm            : null,
    proxy         : null,
    bodyRegion    : null,

    constructor : function (cfg) {
        cfg = cfg || {};

        Ext.applyIf(cfg, {
            onBeforeStart : this.onBeforeStart,
            onStart       : this.onStart,
            onDrag        : this.onDrag,
            onEnd         : this.onEnd
        });

        this.callParent(arguments);
    },

    init : function (scheduler) {

        var view = this.schedulerView = scheduler.getSchedulingView();

        view.on({
            afterrender : this.onSchedulingViewRender,
            scope       : this
        });
    },

    onBeforeStart : function (e) {
        // Only react when not clicking event nodes and when CTRL is pressed
        return !e.getTarget('.sch-event') && e.ctrlKey;
    },

    onStart : function (e) {
        var schedulerView = this.schedulerView;

        this.proxy.show();

        this.bodyRegion = schedulerView.getScheduleRegion();

        var eventData = [];

        schedulerView.getEventNodes().each(function (el) {
            eventData[ eventData.length ] = {
                region : el.getRegion(),
                node   : el.dom
            };
        });

        this.eventData = eventData;

        this.sm.deselectAll();

        Sch.util.ScrollManager.activate(schedulerView);
    },

    onDrag : function (e) {
        var sm              = this.sm,
            eventData       = this.eventData,
            dragRegion      = this.getRegion().constrainTo(this.bodyRegion),
            i, ev, len, sel;

        this.proxy.setBox(dragRegion);

        for (i = 0, len = eventData.length; i < len; i++) {
            ev = eventData[i];
            sel = dragRegion.intersect(ev.region);

            if (sel && !ev.selected) {
                ev.selected = true;
                sm.selectNode(ev.node, true);
            } else if (!sel && ev.selected) {
                ev.selected = false;
                sm.deselectNode(ev.node);
            }
        }
    },

    onEnd : function (e) {
        if (this.proxy) {
            this.proxy.setDisplayed(false);
        }

        Sch.util.ScrollManager.deactivate();
    },

    onSchedulingViewRender : function (view) {
        this.sm = view.getEventSelectionModel();

        this.initEl(this.schedulerView.el);

        // the proxy has to be set up immediately after rendering the view, so it will be included in the
        // "fixedNodes" of the grid view and won't be overwritten after refresh
        this.proxy = view.el.createChild({ cls : 'sch-drag-selector' });
    },

    destroy : function () {
        if (this.proxy) Ext.destroy(this.proxy);

        this.callParent(arguments);
    }
});

