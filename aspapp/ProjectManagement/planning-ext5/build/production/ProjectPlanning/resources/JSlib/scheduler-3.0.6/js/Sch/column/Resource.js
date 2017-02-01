/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
@class Sch.column.Resource
@extends Ext.grid.Column
@private

A Column representing a resource, used only in vertical orientation. By default this column will use the resource
name as the header text. To get complete control over the rendering, you can use your own custom Column class by
using the {@link Sch.mixin.SchedulerPanel#resourceColumnClass resourceColumnClass} config on your SchedulerPanel.

*/
Ext.define("Sch.column.Resource", {
    extend          : "Ext.grid.Column",
    
    alias           : "widget.resourcecolumn",

    /*
     * Default resource column properties
     */
    align           : 'center',
    menuDisabled    : true,
    hideable        : false,
    sortable        : false,
    locked          : false,
    lockable        : false,
    draggable       : false,
    enableLocking   : false,

    /*
     * @property {Sch.model.Resource} model The resource model associated with this column
     * Default resource column properties
     */
    model           : null,

    initComponent     : function() {
        this.tdCls = (this.tdCls || '') + ' sch-timetd';
        this.cls = (this.cls || '') + ' sch-resourcecolumn-header';

        this.callParent(arguments);
    }
});