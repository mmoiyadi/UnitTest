/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.EventTools
@extends Ext.Container

A plugin (ptype = 'scheduler_eventtools') showing a tools menu with event actions when the mouse hovers over a rendered event in the timeline.
Each tool can also define a visibleFn, which is called before the tools menu is shown. This allows you to get control over which actions
can be performed on which events.

Sample usage:
    
    plugins : [
        Ext.create('Sch.plugin.EventTools', {
            items : [
                { type: 'details',  handler: onToolClick, tooltip: 'Show Event Details' },
                { type: 'edit',     handler: onToolClick, tooltip: 'Edit Event' },
                { type: 'repeat',   handler: onToolClick, tooltip: 'Repeat Event' },
                { type: 'drop',     handler: onToolClick, tooltip: 'Remove Event', visibleFn: function(model) { return !!model.get('Deletable'); } }
            ]
        })
    ]

*/
Ext.define('Sch.plugin.EventTools', {
    extend          : 'Ext.Container',
    mixins          : ['Ext.AbstractPlugin'],
    lockableScope   : 'top',
    alias           : 'plugin.scheduler_eventtools',

    /**
    * @cfg {Number} hideDelay The menu will be hidden after this number of ms, when the mouse leaves the tools element. 
    */
    hideDelay       : 500,
    
    /**
    * @cfg {String} align The alignment of the tools menu
    */
    align           : 'right',
    
    /**
    * @cfg {Object} defaults The defaults for each action item in the tools menu
    */
    defaults: {
        xtype       : 'tool',
        baseCls     : 'sch-tool',
        overCls     : 'sch-tool-over',
        width       : 20,
        height      : 20,
        visibleFn   : Ext.emptyFn
    },

    // private
    hideTimer   : null,
    
    // private
    lastPosition    : null,
    
    // private
    cachedSize      : null,

    // private
    offset          : { x: 0, y: 1 },

    autoRender      : true,
    floating        : true,
    hideMode        : 'offsets',
    hidden          : true,

    /**
    * Returns the record that this tools menu is currently associated with
    * @return {Sch.model.Event} record The event record
    */
    getRecord : function() {
        return this.record;
    },
     
    init: function (scheduler) {
        if (!this.items) throw 'Must define an items property for this plugin to function correctly';

        // Let client use 'cls' property
        this.addCls('sch-event-tools');

        this.scheduler = scheduler;

        scheduler.on({
            // Suspend during resize
            'eventresizestart'  : this.onOperationStart,
            'eventresizeend'    : this.onOperationEnd,
            
            // Suspend during drag drop
            'eventdragstart'    : this.onOperationStart,
            'eventdrop'         : this.onOperationEnd,
            
            'eventmouseenter'   : this.onEventMouseEnter,
            'eventmouseleave'   : this.onContainerMouseLeave,
            
            scope: this
        });
    },

    onRender: function () {
        this.callParent(arguments);

        this.scheduler.mon(this.el, {
            mouseenter : this.onContainerMouseEnter,
            mouseleave : this.onContainerMouseLeave,
            scope       : this
        });
    },

    onEventMouseEnter: function (sch, model, event) {

        var doShow  = false;
        var visible;
        this.record = model;
        
        this.items.each(function (tool) {
            visible = tool.visibleFn(model) !== false;
            tool.setVisible(visible);

            if (visible) {
                doShow = true;
            }
        }, this);

        if (!doShow) return;

        if (!this.rendered) {
            this.doAutoRender();
        }

        var node    = event.getTarget(sch.eventSelector);
        var box     = Ext.fly(node).getBox();

        this.doLayout();

        // Needs to be done after doLayout
        var size = this.getSize();

        this.lastPosition = [
            event.getXY()[0] - (size.width/2), 
            box.y - size.height - this.offset.y
        ];

        this.onContainerMouseEnter();
    },

    onContainerMouseEnter: function () {
        window.clearTimeout(this.hideTimer);
        this.setPosition.apply(this, this.lastPosition);
        this.show();
    },

    onContainerMouseLeave: function () {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = Ext.defer(this.hide, this.hideDelay, this);
    },

    onOperationStart: function () {
        this.scheduler.un("eventmouseenter", this.onEventMouseEnter, this);
        window.clearTimeout(this.hideTimer);
        this.hide();
    },

    onOperationEnd: function () {
        this.scheduler.on("eventmouseenter", this.onEventMouseEnter, this);
    }
});


