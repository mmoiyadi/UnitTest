/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
if (!Ext.ClassManager.get("Sch.patches.BufferedRenderer")) {

    Ext.define('Sch.patches.BufferedRenderer', {
        extend : 'Sch.util.Patch',

        requires : ['Ext.grid.plugin.BufferedRenderer'],
        target   : 'Ext.grid.plugin.BufferedRenderer',

        overrides : {
            // Patch to solve this issue: http://www.sencha.com/forum/showthread.php?294996
            // remove when fixed
            onRangeFetched : function () {
                this.tableTopBorderWidth = this.tableTopBorderWidth || 0;

                return this.callParent(arguments);
            },

            refreshSize : function (e, t) {

                var me = this,
                    view = me.view;

                if (view.body.dom) {
                    this.callParent(arguments);
                }
            }
        }
    });
}
