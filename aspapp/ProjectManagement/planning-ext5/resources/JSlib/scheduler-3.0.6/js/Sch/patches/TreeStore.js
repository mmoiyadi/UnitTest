/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// TreeStore doesn't support rejectChanges very well
// https://www.sencha.com/forum/showthread.php?300339-rejectChanges-doesn-t-work-for-TreeStore-added-removed-records&p=1097116#post1097116
if (!Ext.ClassManager.get("Sch.patches.TreeStore")) {

    Ext.define('Sch.patches.TreeStore', {
        extend          : 'Sch.util.Patch',

        requires        : ['Ext.data.TreeStore'],

        target          : 'Ext.data.TreeStore',
        minVersion      : '5.1.0',
        overrides      : {

            getRejectRecords : function () {
                return this.getModifiedRecords();
            },

            rejectChanges : function () {
                this.removed = this.removedNodes;
                this.callParent(arguments);
            },

            remove : function (node) {
                if (node.isModel) {

                    node.remove();

                } else if (node instanceof Array && node[0].isModel) {

                    for (var i = 0; i < node.length; i++) node[i].remove();

                } else {
                    this.callParent(arguments);
                }
            }
        }

    });

}