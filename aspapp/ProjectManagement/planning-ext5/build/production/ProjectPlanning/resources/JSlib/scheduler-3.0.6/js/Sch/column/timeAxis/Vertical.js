/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Sch.column.timeAxis.Vertical
 *
 * @extends Ext.grid.column.Column
 * A Column representing the time axis in vertical orientation
 * @constructor
 * @param {Object} config The configuration options
 */
Ext.define('Sch.column.timeAxis.Vertical', {

    extend : 'Ext.grid.column.Column',

    alias : 'widget.verticaltimeaxis',


    /*
     * Default timeaxis column properties
     */
    align : 'right',

    draggable             : false,
    groupable             : false,
    hideable              : false,
    sortable              : false,
    menuDisabled          : true,
    timeAxis              : null,
    timeAxisViewModel     : null,
    cellTopBorderWidth    : null,
    cellBottomBorderWidth : null,
    totalBorderWidth      : null,
    enableLocking         : false,
    locked                : true,

    initComponent : function () {
        this.callParent(arguments);
        this.tdCls = (this.tdCls || '') + ' sch-verticaltimeaxis-cell';
        this.scope = this;

        this.totalBorderWidth = this.cellTopBorderWidth + this.cellBottomBorderWidth;
    },

    // HACK, until we have a proper time axis view for vertical too (not relying on Ext column)
    afterRender   : function () {
        this.callParent(arguments);
        var panel = this.up('panel');
        panel.getView().on('resize', this.onContainerResize, this);
    },

    onContainerResize : function (cmp, width, height) {
        // Grab the full height of the view, minus the spacer el height and an extra buffer
        this.timeAxisViewModel.update(height - 21);
    },

    renderer : function (val, meta, record, rowIndex) {
        var hc          = this.timeAxisViewModel.getBottomHeader();

        meta.style      = 'height:' + (this.timeAxisViewModel.getTickWidth() - this.totalBorderWidth) + 'px';

        if (hc.renderer) {
            return hc.renderer.call(hc.scope || this, record.data.start, record.data.end, meta, rowIndex);
        } else {
            return Ext.Date.format(record.data.start, hc.dateFormat);
        }
    }
});

