/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// byInternalIdMap is removed from 5.1.1 and it is widely used in projection mechanism
Ext.define('Sch.patches.TreeStoreInternalIdMap', {
    extend      : 'Sch.util.Patch',

    requires    : ['Ext.data.TreeStore'],
    target      : 'Ext.data.TreeStore',

    minVersion  : '5.1.1',

    overrides   : {
        registerNode: function(node, includeChildren) {
            var me = this;

            if (!me.byInternalIdMap) {
                me.byInternalIdMap = {};
            }

            me.byInternalIdMap[node.internalId] = node;

            me.callParent(arguments);
        },

        unregisterNode: function(node, includeChildren) {
            var me = this;

            if (me.byInternalIdMap) {
                delete me.byInternalIdMap[node.internalId];
            }

            me.callParent(arguments);
        },

        updateRoot: function () {
            this.byInternalIdMap = {};

            this.callParent(arguments);
        }
    }
});