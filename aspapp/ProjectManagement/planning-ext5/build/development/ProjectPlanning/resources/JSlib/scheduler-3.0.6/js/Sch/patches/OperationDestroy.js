/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Sch.patches.OperationDestroy', {
    extend      : 'Sch.util.Patch',

    requires    : ['Ext.data.operation.Destroy'],
    target      : 'Ext.data.operation.Destroy',

    minVersion  : '5.1.1',

    maxVersion  : '5.1.2',

    overrides   : {
        doProcess   : function () {
            // clientRecords record size gets down on each clientRecords[i].setErased() call
            // so we make a copy by slicing this.getRecords()
            var clientRecords = Ext.Array.slice(this.getRecords()),
                clientLen = clientRecords.length,
                i;
            for (i = 0; i < clientLen; ++i) {
                clientRecords[i].setErased();
            }
        }
    }
});