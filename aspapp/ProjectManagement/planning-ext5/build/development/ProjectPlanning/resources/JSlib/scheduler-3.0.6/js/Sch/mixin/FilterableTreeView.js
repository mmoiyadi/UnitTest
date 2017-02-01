/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// !XXX when adding new methods to this mixing need to also update the
// `setupLockableTree` method in the Sch.mixin.Lockable
Ext.define("Sch.mixin.FilterableTreeView", {

    prevBlockRefresh        : null,


    initTreeFiltering : function () {
        var doInit  = function () {
            var treeStore       = this.store;

            this.mon(treeStore, 'nodestore-datachange-start', this.onFilterChangeStart, this);
            this.mon(treeStore, 'nodestore-datachange-end', this.onFilterChangeEnd, this);

            if (!treeStore.allowExpandCollapseWhileFiltered) {
                this.mon(treeStore, 'filter-clear', this.onFilterCleared, this);
                this.mon(treeStore, 'filter-set', this.onFilterSet, this);
            }
        };

        if (this.rendered)
            doInit.call(this);
        else
            this.on('beforerender', doInit, this, { single : true });
    },


    onFilterChangeStart : function () {
        this.prevBlockRefresh   = this.blockRefresh;

        // block refresh in filterable tree view, for the cases when this mixin is consumed by non-tree views
        // "blockRefresh" is already true in all tree views, so in the Sch.data.mixin.FilterableTreeStore
        // we use "nodeStore.fireEvent('clear', nodeStore);" hack, which is directly tied to "refresh" method of the view
        // in case when non-tree view consumes this mixin, we need to temporarily block the refresh manually,
        // to avoid double refresh
        this.blockRefresh       = true;

        Ext.suspendLayouts();
    },


    onFilterChangeEnd : function () {
        Ext.resumeLayouts(true);

        this.blockRefresh       = this.prevBlockRefresh;
    },


    onFilterCleared : function () {
        delete this.toggle;

        var el          = this.getEl();

        if (el) el.removeCls('sch-tree-filtered');
    },


    onFilterSet : function () {
        this.toggle     = function () {};

        var el          = this.getEl();

        if (el) el.addCls('sch-tree-filtered');
    }
});
