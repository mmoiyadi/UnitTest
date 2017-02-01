/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
//@PATCH to fix https://www.assembla.com/spaces/bryntum/tickets/869#/activity/ticket
// When resizing columns with fixed locked grid width, columns become smaller due to the default Ext header resizing logic
Ext.define('Sch.patches.ColumnResizeTree', {
    override      : 'Sch.panel.TimelineTreePanel',

    afterRender : function() {
        this.callParent(arguments);

        var resizer = this.lockedGrid.headerCt.findPlugin('gridheaderresizer');

        if (resizer) {
            // Implementation from Ext 4.2.0
            resizer.getConstrainRegion = function() {
                var me       = this,
                    dragHdEl = me.dragHd.el,
                    nextHd;



                if (me.headerCt.forceFit) {
                    nextHd = me.dragHd.nextNode('gridcolumn:not([hidden]):not([isGroupHeader])');
                    if (!me.headerInSameGrid(nextHd)) {
                        nextHd = null;
                    }
                }

                return me.adjustConstrainRegion(
                    Ext.util.Region.getRegion(dragHdEl),
                    0,
                    me.headerCt.forceFit ? (nextHd ? nextHd.getWidth() - me.minColWidth : 0) : me.maxColWidth - dragHdEl.getWidth(),
                    0,
                    me.minColWidth
                );
            };
        }
    }
});
