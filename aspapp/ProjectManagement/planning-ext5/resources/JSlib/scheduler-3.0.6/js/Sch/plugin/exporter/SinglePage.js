/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.exporter.SinglePage
 @extends Sch.plugin.exporter.AbstractExporter

 This class extracts all scheduler data to fit in a single page.

 The exporterId of this exporter is `singlepage`
 */


Ext.define('Sch.plugin.exporter.SinglePage', {

    extend  : 'Sch.plugin.exporter.AbstractExporter',

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - name    : 'Single page'
     */

    config  : {
        exporterId : 'singlepage',

        headerTpl   : '<div class="sch-export-header" style="height:{height}px; width:{width}px"></div>'
    },

    getExpectedNumberOfPages : function () {
        return 1;
    },

    getPaperFormat : function () {
        var me          = this,
            realSize    = me.getTotalSize(),
            dpi         = me.exportConfig.DPI,
            width       = Ext.Number.toFixed(realSize.width / dpi, 1),
            height      = Ext.Number.toFixed(realSize.height / dpi, 1);

        return width+'in*'+height+'in';
    },


    onRowsCollected : function () {
        var me = this;

        me.startPage();
        me.fillGrids();
        me.commitPage();

        me.onPagesExtracted();
    },


    getPageTplData : function () {
        var me          = this,
            realSize    = me.getTotalSize();

        return Ext.apply(me.callParent(arguments), {
            bodyHeight  : realSize.height,
            showHeader  : false,
            totalWidth  : realSize.width
        });
    },

    getHeaderTplData : function (pageInfo) {
        var me  = this;

        return {
            width       : me.getTotalWidth(),
            height      : me.pageHeaderHeight
        };
    },


    fitComponentIntoPage : function () {
        var me          = this,
            lockedGrid  = me.lockedGrid;

        lockedGrid.setWidth(lockedGrid.headerCt.getEl().first().getWidth());
    },

    preparePageToCommit : function () {
        var me          = this,
            frag        = me.callParent(arguments),
            secondaryCanvas = frag.select('.sch-secondary-canvas').first(),
            zones = secondaryCanvas.select('.sch-zone'),
            lines = secondaryCanvas.select('.sch-column-line');

        var height = me.getTotalHeight();

        secondaryCanvas.setTop(0);
        zones.setHeight(height);
        lines.setHeight(height);

        return frag;
    }

});