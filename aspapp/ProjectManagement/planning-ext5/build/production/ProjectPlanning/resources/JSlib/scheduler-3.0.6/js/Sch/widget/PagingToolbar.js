/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.widget.PagingToolbar

This class is a specialized paging toolbar that is aware of CRUD manager functionality.
The class uses a CRUD manager data loading if the store is included to CRUD collection.
This Component loads blocks of data into the store by passing parameters used for paging criteria.

        var crudManager     = Ext.create('Sch.data.CrudManager', {
            resourceStore   : resourceStore,
            eventStore      : eventStore
        });

        Ext.create('Sch.panel.SchedulerGrid', {
            eventBarTextField   : 'Name',
            viewPreset          : 'dayAndWeek',
            startDate           : new Date(2012, 8, 10),
            endDate             : new Date(2012, 10, 10),
            width               : 800,
            height              : 350,

            crudManager         : crudManager,

            //define bottom bar with pagination toolbar
            bbar                : {
                xtype           : 'sch_pagingtoolbar',
                store           : resourceStore,
                displayInfo     : true,
                displayMsg      : 'Displaying resources {0} - {1} of {2}',
                emptyMsg        : "No resources to display"
            }
        });

*/
Ext.define('Sch.widget.PagingToolbar', {
    extend  : 'Ext.toolbar.Paging',
    alias   : 'widget.sch_pagingtoolbar',

    getStoreId : function () {
        if (this.storeId) return this.storeId;

        var storeId     = this.store.storeId;

        if (!storeId) {
            var crudManager = this.store.crudManager;
            var store       = crudManager && crudManager.getStore(this.store);

            storeId         = store && store.storeId;
        }

        this.storeId    = storeId;

        return storeId;
    },

    loadPage : function (pageNum) {
        var me = this;

        if (me.store.crudManager) {
            var storeId     = me.getStoreId();

            if (storeId) {
                var params          = {};

                params[storeId]     = {
                    pageSize    : me.store.pageSize,
                    page        : pageNum
                };

                me.store.crudManager.load(params);
            }
        } else {
            me.store.loadPage(pageNum);
        }
    },

    // @OVERRIDE
    // @private
    onPagingKeyDown : function(field, e) {
        var me = this,
            k = e.getKey(),
            pageData = me.getPageData(),
            increment = e.shiftKey ? 10 : 1,
            pageNum;

        if (k == e.RETURN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum !== false) {
                pageNum = Math.min(Math.max(1, pageNum), pageData.pageCount);
                if(me.fireEvent('beforechange', me, pageNum) !== false){
                    me.loadPage(pageNum);
                }
            }
        } else if (k == e.HOME || k == e.END) {
            e.stopEvent();
            pageNum = k == e.HOME ? 1 : pageData.pageCount;
            field.setValue(pageNum);
        } else if (k == e.UP || k == e.PAGE_UP || k == e.DOWN || k == e.PAGE_DOWN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum) {
                if (k == e.DOWN || k == e.PAGE_DOWN) {
                    increment *= -1;
                }
                pageNum += increment;
                if (pageNum >= 1 && pageNum <= pageData.pageCount) {
                    field.setValue(pageNum);
                }
            }
        }
    },

    // @OVERRIDE
    /**
     * Move to the first page, has the same effect as clicking the 'first' button.
     */
    moveFirst : function(){
        if (this.fireEvent('beforechange', this, 1) !== false){
            this.loadPage(1);
        }
    },

    // @OVERRIDE
    /**
     * Move to the previous page, has the same effect as clicking the 'previous' button.
     */
    movePrevious : function(){
        var me = this,
            prev = me.store.currentPage - 1;

        if (prev > 0) {
            if (me.fireEvent('beforechange', me, prev) !== false) {
                me.loadPage(prev);
            }
        }
    },

    // @OVERRIDE
    /**
     * Move to the next page, has the same effect as clicking the 'next' button.
     */
    moveNext : function(){
        var me = this,
            total = me.getPageData().pageCount,
            next = me.store.currentPage + 1;

        if (next <= total) {
            if (me.fireEvent('beforechange', me, next) !== false) {
                me.loadPage(next);
            }
        }
    },

    // @OVERRIDE
    /**
     * Move to the last page, has the same effect as clicking the 'last' button.
     */
    moveLast : function(){
        var me = this,
            last = me.getPageData().pageCount;

        if (me.fireEvent('beforechange', me, last) !== false) {
            me.loadPage(last);
        }
    },

    // @OVERRIDE
    /**
     * Refresh the current page, has the same effect as clicking the 'refresh' button.
     */
    doRefresh : function(){
        var me = this,
            current = me.store.currentPage;

        if (me.fireEvent('beforechange', me, current) !== false) {
            me.loadPage(current);
        }
    }
});
