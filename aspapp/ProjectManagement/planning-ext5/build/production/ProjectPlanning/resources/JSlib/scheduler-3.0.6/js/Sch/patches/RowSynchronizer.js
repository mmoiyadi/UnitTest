/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
if (!Ext.ClassManager.get("Sch.patches.RowSynchronizer")) {
    Ext.define('Sch.patches.RowSynchronizer', {
        extend : 'Sch.util.Patch',

        requires : ['Ext.grid.locking.RowSynchronizer'],

        target     : 'Ext.grid.locking.RowSynchronizer',
        minVersion : '5.1.0',

        overrides : Ext.versions.extjs.isGreaterThan('5.1.0') ? {

            finish : function (other) {
                if (!other) return;

                return this.callParent(arguments);
            }
        } : {}
    });
}
