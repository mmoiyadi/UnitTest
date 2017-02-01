/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// IE8 doesn't have indexOf() on native array
// http://www.sencha.com/forum/showthread.php?292336-5.0.1-IE8-treepanel-broken-after-editing
if (!Ext.ClassManager.get("Sch.patches.NodeStore")) Ext.define('Sch.patches.NodeStore', {
    extend          : 'Sch.util.Patch',

    requires        : ['Ext.data.NodeStore'],

    target          : 'Ext.data.NodeStore',
    ieOnly          : true,
    maxVersion      : '5.1.1',
    overrides      : {

        afterEdit       : function (record, modifiedFields) {

            if (this.getNode() && modifiedFields) {
                if (Ext.Array.indexOf(modifiedFields, 'loaded') !== -1) {
                    return this.add(this.retrieveChildNodes(record));
                }
                if (Ext.Array.indexOf(modifiedFields, 'expanded') !== -1) {
                    return this.filter();
                }
                if (Ext.Array.indexOf(modifiedFields, 'sorted') !== -1) {
                    return this.sort();
                }
            }

            //
            Ext.data.Store.prototype.afterEdit.apply(this, arguments);
        }
    }

});
