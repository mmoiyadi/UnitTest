/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.feature.Grouping
 @extends Ext.grid.feature.Grouping

 A feature extending the native Ext JS grouping feature (ftype = 'scheduler_grouping'). This features provides a
 {@link #headerRenderer} hook that you can use to render custom HTML into the group header for
 every time interval in the {@link Sch.data.TimeAxis}. This header will be automatically refreshed when changes happen in the eventStore and
 resourceStore.

 To add this feature to the scheduler:

    var scheduler = Ext.create("Sch.panel.SchedulerGrid", {

        features      : [
            {
                id                 : 'group',
                ftype              : 'scheduler_grouping',
                hideGroupedHeader  : true,
                enableGroupingMenu : false,

                headerRenderer : function (intervalStartDate, intervalEndDate, groupResources, meta) {

                    meta.cellStyle = 'background : rgba(255, 0, 0, 0.5)';
                    meta.cellCls   = 'some-css-class';

                    return 'Any text here';
                }
            }
        ],

        ...
    });
 */
Ext.define('Sch.feature.Grouping', {
    extend : 'Ext.grid.feature.Grouping',
    alias  : 'feature.scheduler_grouping',

    /**
     * This renderer method is called once for each time interval in the {@link Sch.data.TimeAxis time axis} when the scheduler is rendered.
     * Additionally, it is also called when resources and events are updated, added and removed. You can return any
     * arbitrary HTML to be added to each 'cell' of the header.
     *
     * @param {Date} intervalStartDate Start date of the current time interval
     * @param {Date} intervalEndDate End date of the current time interval
     * @param {Sch.model.Resource[]} groupResources The resources in the current group
     * @param {Object} meta A special object containing rendering properties for the current cell
     * @param {Object} meta.cellCls A CSS class to add to the cell DIV
     * @param {Object} meta.cellStyle Any inline styles to add to the cell DIV
     * @return {String}
     */
    headerRenderer      : Ext.emptyFn,

    timeAxisViewModel   : null,

    headerCellTpl       : '<tpl for=".">' +
        '<div class="sch-grid-group-hd-cell {cellCls}" style="{cellStyle}; width: {width}px;">' +
        '<span>{value}</span>' +
        '</div>' +
        '</tpl>',

    renderCells         : function (data) {
        var tplData = [];
        var viewModel = this.timeAxisViewModel;
        var ticks = viewModel.columnConfig[this.timeAxisViewModel.columnLinesFor];

        for (var i = 0; i < ticks.length; i++) {
            var meta = {};
            var value = this.headerRenderer(ticks[i].start, ticks[i].end, data.children, meta);

            meta.value = value;
            meta.width = viewModel.getPositionFromDate(ticks[i].end) - viewModel.getPositionFromDate(ticks[i].start);

            tplData.push(meta);
        }

        return this.headerCellTpl.apply(tplData);
    },

    init : function () {
        var view = this.view;
        var me   = this;

        this.callParent(arguments);

        if (typeof this.headerCellTpl === 'string') {
            this.headerCellTpl = new Ext.XTemplate(this.headerCellTpl);
        }

        // The functionality of this class only applies to the scheduling view section
        if (view.eventStore) {

            this.timeAxisViewModel = view.timeAxisViewModel;

            view.mon(this.view.eventStore, {
                add    : this.onEventAddOrRemove,
                remove : this.onEventAddOrRemove,
                update : this.onEventUpdate,
                scope  : this
            });

            this.groupHeaderTpl = new Ext.XTemplate(this.schedulerGroupHeaderTpl, {
                renderCells : Ext.Function.bind(me.renderCells, me)
            });
        }
        
        if (view.resourceStore) {
            view.mon(this.view.resourceStore, {
                add     : function (store, records) {
                    me.refreshGroupHeader(records.length ? records[0] : records);
                }
            });
        }

        //HACK
        //http://www.sencha.com/forum/showthread.php?288604-Ext-5.0.0-view.getNode%28record%29-returns-record-and-groupheader&p=1054623#post1054623
        Ext.apply(view, {
             getRowNode: function (resourceRecord) {
                 return this.retrieveNode(this.getRowId(resourceRecord), true);
             }
        });
    },

    getGroupHeaderNodeIndex : function (view, resourceRecord) {
        var store = view.resourceStore;
        // in case this method is called after 'remove' event record.getResource() will return null
        // so we pass a custom eventStore to this method
        var groupString = store.getGrouper().getGroupString(resourceRecord);
        var group = this.getGroup(groupString);

        // first child in this group is the first node that holds the grouping header
        return view.store.indexOf(group.items[0]);
    },

    onEventUpdate : function (store, record) {
        var groupField = store.getResourceStore().getGroupField();
        var rowChanged = record.previous && record.resourceIdField in record.previous;
        var newResource = record.getResource();

        if (rowChanged) {
            var oldResource = store.getResourceStore().getById(record.previous[record.resourceIdField]);

            if (oldResource && oldResource.get(groupField) !== newResource.get(groupField)) {
                this.refreshGroupHeader(oldResource);
            }
        }

        if (newResource) {
            this.refreshGroupHeader(newResource);
        }
    },

    onEventAddOrRemove : function(store, eventRecords) {
        var me      = this;
        var view    = me.view;

        Ext.Array.forEach(eventRecords, function (event) {
            var resource = event.getResource(null, view.eventStore);

            if (resource) {
                me.refreshGroupHeader(resource);
            }
        });
    },

    refreshGroupHeader : function (resource) {
        var me      = this,
            view    = me.view;

        view.refreshNode(me.getGroupHeaderNodeIndex(view, resource));
    },

    schedulerGroupHeaderTpl : '{[this.renderCells(values)]}'
});