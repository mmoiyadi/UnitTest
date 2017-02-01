/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.ResourceZones
@extends Sch.feature.AbstractTimeSpan

A plugin (ptype = 'scheduler_resourcezones') for visualizing resource specific meta data such as availability, used internally by the Scheduler.
To use this feature, assign an {@link Sch.data.EventStore eventStore} to the {@link Sch.mixin.SchedulerPanel#cfg-resourceZones resourceZones}  
config on the main Scheduler panel class. Additionally, you can provide the {@link Sch.mixin.SchedulerPanel#cfg-resourceZonesConfig resourceZonesConfig} object
with configuration options.

    {
         xtype           : 'schedulergrid',
         region          : 'center',
         startDate       : new Date(2013, 0, 1),
         endDate         : new Date(2014, 0, 1),
         resourceStore   : new Sch.data.ResourceStore(),
         resourceZones   : new Sch.data.EventStore(), // Meta events such as availabilities can be visualized here
         resourceZonesConfig : {
            innerTpl                : '... customized template here ...'
         },
         eventStore      : new Sch.data.EventStore()  // Regular tasks in this store
    },

Records in the store should be regular {@link Sch.model.Event events} where you can specify the Resource, StartDate, EndDate and Cls (to set a CSS class on the rendered zone).
*/
Ext.define("Sch.plugin.ResourceZones", {
    extend              : 'Sch.plugin.Zones',
    alias               : 'plugin.scheduler_resourcezones',

    /**
     * @cfg {String/Ext.XTemplate} innerTpl A template providing additional markup to render into each timespan element
     */
    innerTpl            : null,

    /**
    * @cfg {Sch.data.EventStore} store (required) The store containing the meta 'events' to be rendered for each resource
    */
    store               : null,

    cls                 : 'sch-resourcezone',

    init : function(scheduler) {
        // unique css class to be able to identify the elements belonging to this instance
        this.uniqueCls = this.uniqueCls || ('sch-timespangroup-' + Ext.id());

        this.scheduler = scheduler;

        scheduler.registerRenderer(this.renderer, this);

        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl);
        }

        var innerTpl = this.innerTpl;

        if (!this.template) {
            this.template = new Ext.XTemplate(
                '<tpl for=".">' +
                    '<div id="' + this.uniqueCls + '-{id}" class="' + this.cls + ' ' + this.uniqueCls + ' {Cls}" style="' + (scheduler.rtl ? 'right' : 'left') + ':{start}px;width:{width}px;top:{start}px;height:{width}px;{style}">' +
                    (innerTpl ? '{[this.renderInner(values)]}' : '') +

                    '</div>' +
                    '</tpl>',
                {
                    renderInner : function(values) {
                        return innerTpl.apply(values);
                    }
                }
            );
        }

        this.storeListeners = {
            load            : this.fullRefresh,
            datachanged     : this.fullRefresh,
            clear           : this.fullRefresh,

            // Ext JS
            add             : this.fullRefresh,
            remove          : this.fullRefresh,
            update          : this.refreshSingle,

            // Sencha Touch
            addrecords      : this.fullRefresh,
            removerecords   : this.fullRefresh,
            updaterecord    : this.refreshSingle,

            scope           : this
        };

        this.store.on(this.storeListeners);
    },

    destroy : function() {
        this.store.un(this.storeListeners);

        this.callParent(arguments);
    },

    fullRefresh : function() {
        this.scheduler.getSchedulingView().refresh();
    },

    renderer : function (val, meta, resource, rowIndex) {
        if (this.scheduler.getOrientation() === 'horizontal' || rowIndex === 0) {
            return this.renderZones(resource);
        }

        return '';
    },

    renderZones : function (resource) {
        var zoneStore = this.store,
            scheduler = this.scheduler,
            viewStart = scheduler.timeAxis.getStart(),
            viewEnd = scheduler.timeAxis.getEnd(),
            data = [],
            zonesForResource = resource.getEvents(zoneStore),
            spanStartDate, spanEndDate;

        for (var i = 0, len = zonesForResource.length; i < len; i++) {
            var record   = zonesForResource[i];

            spanStartDate = record.getStartDate();
            spanEndDate = record.getEndDate();

            // Make sure resource exists in resourceStore (filtering etc)
            if (spanStartDate && spanEndDate &&
                // Make sure this zone is inside current view
                Sch.util.Date.intersectSpans(spanStartDate, spanEndDate, viewStart, viewEnd)
            ) {
                var renderData = scheduler.getSchedulingView()[scheduler.getOrientation()].getEventRenderData(record);
                var start, width;

                if (scheduler.getMode() === 'horizontal') {
                    start = scheduler.rtl ? renderData.right : renderData.left;
                    width = renderData.width;
                } else {
                    start = renderData.top;
                    width = renderData.height;
                }

                data[data.length] = Ext.apply({
                    id      : record.internalId,

                    start   : start,
                    width   : width,

                    Cls     : record.getCls()
                }, record.data);
            }
        }

        return this.template.apply(data);
    },

    refreshSingle : function(store, record) {
        var el = Ext.get(this.uniqueCls + '-' + record.internalId);

        if (el) {
            var scheduler = this.scheduler,
                viewStart = scheduler.timeAxis.getStart(),
                viewEnd = scheduler.timeAxis.getEnd();

            var start       = Sch.util.Date.max(viewStart, record.getStartDate()),
                end         = Sch.util.Date.min(viewEnd, record.getEndDate()),
                cls         = record.getCls();

            var startPos = scheduler.getSchedulingView().getCoordinateFromDate(start);
            var width = scheduler.getSchedulingView().getCoordinateFromDate(end) - startPos;

            // Reapply CSS classes
            el.dom.className = this.cls + ' ' + this.uniqueCls + ' ' + (cls || '');

            el.setStyle({ left : startPos+'px', top : startPos+'px', height : width+'px', width : width+'px' });
        }
    }
});