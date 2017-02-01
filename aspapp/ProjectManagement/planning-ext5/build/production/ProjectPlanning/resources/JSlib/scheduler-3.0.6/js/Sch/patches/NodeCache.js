/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// http://www.sencha.com/forum/showthread.php?295795-Crash-when-adding-new-record-to-tree-with-locked-cols&p=1079983#post1079983
//
if (!Ext.ClassManager.get("Sch.patches.NodeCache")) {

    Ext.define('Sch.patches.NodeCache', {
        extend : 'Sch.util.Patch',

        requires   : ['Ext.view.NodeCache'],
        target     : 'Ext.view.NodeCache',
        minVersion : '5.1.0',

        overrides : {
            scroll : function (newRecords, direction, removeCount) {
                var res;

                if (newRecords.length === 0) {
                    res = [];
                } else {
                    res = this.callParent(arguments);
                }

                return res;
            }
        }
    });
}
