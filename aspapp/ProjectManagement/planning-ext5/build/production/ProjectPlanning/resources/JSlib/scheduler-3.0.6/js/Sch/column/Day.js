/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Sch.column.timeAxis.Vertical
 * @private
 * @extends Ext.grid.column.Column
 * A Column representing the time axis in vertical orientation
 * @constructor
 * @param {Object} config The configuration options
 */
Ext.define('Sch.column.Day', {

    extend : 'Ext.grid.column.Column',
    alias  : 'widget.weekview-day',
    align  : 'center',

    // date range for this Day column
    start  : null,
    end    : null,

    draggable       : false,
    groupable       : false,
    hideable        : false,
    sortable        : false,
    menuDisabled    : true,
    enableLocking   : false,
    flex            : 1,
    resizable       : false,
    
    tdCls  : 'sch-timetd',

    initComponent : function () {

        var now = new Date();

        this.addCls('sch-daycolumn-header');

        if (this.isWeekend()) {
            this.addCls('sch-daycolumn-header-weekend');

            this.tdCls  = (this.tdCls || '') + ' sch-daycolumn-weekend';
        }

        if (this.start.getDate()    === now.getDate() &&
            this.start.getMonth()   === now.getMonth() &&
            this.start.getYear()    === now.getYear())
        {
            this.addCls('sch-daycolumn-header-today');
            this.tdCls  = (this.tdCls || '') + ' sch-daycolumn-today';
        }

        this.callParent(arguments);
    },

    isWeekend : function() {
        var day = this.start.getDay();

        return day === 6 || day === 0;
    }
});

