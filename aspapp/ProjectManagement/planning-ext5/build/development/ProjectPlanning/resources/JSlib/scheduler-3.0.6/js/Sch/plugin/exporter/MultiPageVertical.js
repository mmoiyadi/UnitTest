/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.exporter.MultiPageVertical
 @extends Sch.plugin.exporter.AbstractExporter

  This class extracts pages in a vertical order. It fits all locked columns and the timeaxis on a single page and will generate
  new pages vertically down for the rows.

  The exporterId of this exporter is `multipagevertical`

  To adjust column widths for specific export cases the function {@link #fitLockedColumnWidth} can be overridden.

*/

Ext.define('Sch.plugin.exporter.MultiPageVertical', {

    extend              : 'Sch.plugin.exporter.AbstractExporter',

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - name    : 'Multi pages (vertically)'
     */

    config              : {
        exporterId  : 'multipagevertical'
    },


    minRowHeight        : 20,

    visibleColumns      : null,

    visibleColumnsWidth : 0,

    onRowsCollected : function (lockedRows, normalRows) {
        var me          = this;

        me.iterateAsync(function (next, rowIndex) {

            if (rowIndex === lockedRows.length) {
                me.onPagesExtracted();
                return;
            }

            var index       = rowIndex,
                spaceLeft   = me.printHeight,
                rowsHeight  = 0,
                lockeds     = [],
                normals     = [],
                normal,
                newPage     = false;

            me.startPage();

            while (!newPage && index < lockedRows.length) {

                normal      = normalRows[index];
                spaceLeft   -= normal.height;

                if (spaceLeft > 0) {
                    rowsHeight  += normal.height;
                    lockeds.push(lockedRows[index]);
                    normals.push(normal);
                    index++;
                }
                else {
                    newPage = true;
                }
            }

            me.fillGrids(lockeds, normals);
            me.commitPage({ rowIndex : index, rowsHeight : rowsHeight });

            next( index );

        }, me, 0);
    },


    startPage : function () {
        var me      = this;
        me.callParent(arguments);

        var view    = me.getCurrentPage().select('#' + me.lockedView.id).first();
        view.dom.style.overflow = 'visible';
    },


    getExpectedNumberOfPages : function () {
        return Math.ceil(this.lockedRowsHeight / this.printHeight);
    },


    setComponent : function () {
        var me                  = this,
            visibleColumns      = me.visibleColumns = [];

        me.callParent(arguments);

        me.visibleColumnsWidth  = 0;

        me.lockedGrid.headerCt.items.each(function (column) {
            if (!column.hidden) {
                visibleColumns.push({
                    column  : column,
                    width   : column.getWidth()
                });

                me.visibleColumnsWidth += column.getWidth();
            }
        });

    },


    fitComponentIntoPage : function () {
        var me              = this,
            component       = me.getComponent(),
            normalGrid      = component.normalGrid,
            lockedGrid      = component.lockedGrid,
            totalWidth      = me.getTotalWidth(),
            ticks           = me.ticks,
            timeColumnWidth = me.timeColumnWidth || me.restoreSettings.columnWidth;

        var lockedWidth = Math.floor((me.visibleColumnsWidth / totalWidth) * me.paperWidth);
        var normalWidth = Math.floor((ticks.length * timeColumnWidth / totalWidth) * me.paperWidth);
        var tickWidth   = Math.floor(normalWidth / ticks.length);
        var rowHeight   = (tickWidth / timeColumnWidth) * me.getRowHeight();

        me.view.setRowHeight( rowHeight < me.minRowHeight ? me.minRowHeight : rowHeight );

        component.setWidth(me.paperWidth);
        normalGrid.setWidth(normalWidth);
        lockedGrid.setWidth(lockedWidth);

        me.fitLockedColumnWidth(lockedWidth);

        component.setTimeColumnWidth(tickWidth);
    },


    /**
     * Function that fits locked columns based on the available width.
     *
     * @param {String} totalWidth int indicating the totalWidth available for the locked columns.
     */

    fitLockedColumnWidth : function (totalWidth) {
        var visibleColumns = this.visibleColumns;

        if (visibleColumns.length) {

            var width = totalWidth / visibleColumns.length;

            for (var i = 0; i < visibleColumns.length; i++) {
                visibleColumns[i].column.setWidth(width);
            }

            this._restoreColumnWidth = true;
        }
    },


    restoreComponentState : function () {

        this.callParent(arguments);

        if (this._restoreColumnWidth) {

            var visibleColumns = this.visibleColumns;

            for (var i = 0; i < visibleColumns.length; i++) {
                var cWrap = visibleColumns[i];
                cWrap.column.setWidth(cWrap.width);
                cWrap.column.show();
            }
        }
    }

});