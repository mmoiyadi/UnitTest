/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/** 

@class Sch.panel.SchedulerGrid
@extends Sch.panel.TimelineGridPanel
@mixin Sch.mixin.SchedulerPanel

@alternateClassName Sch.SchedulerPanel

A scheduler panel based on the {@link Ext.grid.Panel} class which allows you to visualize and manage "resources" and their scheduled "events".

Please refer to the <a href="#!/guide/scheduler_getting_started">getting started guide</a> for a detailed introduction.

{@img scheduler/images/ext-scheduler.png}

*/
Ext.define("Sch.panel.SchedulerGrid", {
    extend                  : "Sch.panel.TimelineGridPanel",
    mixins                  : [ 
        'Sch.mixin.SchedulerPanel'
    ],
    alias                   : [ 'widget.schedulergrid', 'widget.schedulerpanel'],
    alternateClassName      : 'Sch.SchedulerPanel',
    viewType                : 'schedulergridview',

    initComponent : function() {
        this.callParent(arguments);
        this.getSchedulingView()._initializeSchedulerView();
    }

}, function() {
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {});
});