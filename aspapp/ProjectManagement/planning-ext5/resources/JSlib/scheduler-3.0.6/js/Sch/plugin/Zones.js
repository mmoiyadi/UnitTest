/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.Zones
@extends Sch.feature.AbstractTimeSpan

Plugin (ptype = 'scheduler_zones') for showing "global" zones in the scheduler grid, these can by styled easily using just CSS.
To populate this plugin you need to pass it a store having `Sch.model.Range` as the model.

{@img scheduler/images/scheduler-grid-horizontal.png}

To add this plugin to scheduler:

        var zonesStore = Ext.create('Ext.data.Store', {
            model   : 'Sch.model.Range',
            data    : [
                {
                    StartDate   : new Date(2011, 0, 6),
                    EndDate     : new Date(2011, 0, 7),
                    Cls         : 'myZoneStyle'
                }
            ]
        });

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.Zones', { store : zonesStore })
            ]
        });


*/
Ext.define("Sch.plugin.Zones", {
    extend      : "Sch.feature.AbstractTimeSpan",
    alias       : "plugin.scheduler_zones",

    requires    : [
        'Sch.model.Range'
    ],

    /**
     * @cfg {String/Ext.XTemplate} innerTpl A template providing additional markup to render into each timespan element
     */
    innerTpl            : null,

    cls                 : 'sch-zone',
    side                : null,

    
    init : function (scheduler) {
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl);
        }

        this.side = scheduler.rtl ? 'right' : 'left';

        var innerTpl = this.innerTpl;

        if (!this.template) {
            this.template = new Ext.XTemplate(
                '<tpl for=".">' +
                    '<div id="{id}" class="{$cls}" style="' + this.side + ':{left}px;top:{top}px;height:{height}px;width:{width}px;{style}">' +
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
        
        
        if (Ext.isString(this.innerHeaderTpl)) {
            this.innerHeaderTpl = new Ext.XTemplate(this.innerHeaderTpl);
        }
        
        this.callParent(arguments);
    },

    
    getElementData : function(viewStart, viewEnd, records, isPrint) {
        var schedulerView   = this.schedulerView,
            data            = [];
        var region          = schedulerView.getTimeSpanRegion(viewStart, viewEnd, this.expandToFitView);
        var record, spanStart, spanEnd, zoneData, width, templateData;
        
        records             = records || this.store.getRange();
            
        for (var i = 0, l = records.length; i < l; i++) {
            record       = records[i];
            spanStart    = record.getStartDate();
            spanEnd      = record.getEndDate();
            templateData = this.getTemplateData(record);

            if (spanStart && spanEnd && Sch.util.Date.intersectSpans(spanStart, spanEnd, viewStart, viewEnd)) {
                zoneData = Ext.apply({}, templateData);

                zoneData.id = this.getElementId(record);
                // using $cls to avoid possible conflict with "Cls" field in the record
                // `getElementCls` will append the "Cls" field value to the class
                zoneData.$cls = this.getElementCls(record, templateData);

                var mode = schedulerView.getMode();

                if (mode === 'calendar') {
                    var timeSpanRegion = schedulerView.getTimeSpanRegion(spanStart, spanEnd);

                    zoneData.left = timeSpanRegion.left;
                    zoneData.top = timeSpanRegion.top;
                    zoneData.height = timeSpanRegion.bottom - timeSpanRegion.top;
                    zoneData.width = timeSpanRegion.right - timeSpanRegion.left;
                }
                else {
                    var startPos = schedulerView.getCoordinateFromDate(Sch.util.Date.max(spanStart, viewStart));
                    var endPos = schedulerView.getCoordinateFromDate(Sch.util.Date.min(spanEnd, viewEnd));

                    if (mode === 'horizontal') {
                        zoneData.left = startPos;
                        zoneData.top = region.top;

                        zoneData.width = isPrint ? 0 : endPos - startPos;
                        zoneData.height = region.bottom - region.top;

                        zoneData.style = isPrint ? ('border-left-width:' + (endPos - startPos) + 'px') : "";
                    } else {
                        zoneData.left = region.left;
                        zoneData.top = startPos;

                        zoneData.height = isPrint ? 0 : endPos - startPos;
                        zoneData.width = region.right - region.left;

                        zoneData.style = isPrint ? ('border-top-width:' + (endPos - startPos) + 'px') : "";
                    }
                }

                data.push(zoneData);
            }
        }
        return data;
    },
    
        
    getHeaderElementId : function(record, isStart) {
        return this.callParent([record]) + (isStart ? '-start' : '-end');
    },
    
    
    /**
     * Return header element class for data record.
     * 
     * @param {Sch.model.Range} record Data record
     * @param {Object} data
     * @param {Boolean} isStart
     * 
     * @return {String}
     */
    getHeaderElementCls : function(record, data, isStart) {
        var clsField = record.clsField || this.clsField;
            
        if (!data) {
            data = this.getTemplateData(record);
        }
        
        return 'sch-header-indicator sch-header-indicator-' + (isStart ? 'start ' : 'end ') +
            this.uniqueCls + ' ' + (data[clsField] || '');
    },
    
    
    getZoneHeaderElementData : function(startDate, endDate, record, isStart) {
        var date = isStart ? record.getStartDate() : record.getEndDate(),
            data = null,
            position, isHorizontal, templateData;
            
        if (date && Sch.util.Date.betweenLesser(date, startDate, endDate)) {
            position     = this.getHeaderElementPosition(date);
            isHorizontal = this.schedulerView.isHorizontal();
            templateData = this.getTemplateData(record);
            
            data = Ext.apply({
                id       : this.getHeaderElementId(record, isStart),
                cls      : this.getHeaderElementCls(record, templateData, isStart),
                isStart  : isStart,
                
                side     : isHorizontal ? this.side : 'top',
                position : position
            }, templateData);
        }
        
        return data;
    },
    
    
    getHeaderElementData : function(records) {
        var startDate = this.timeAxis.getStart(),
            endDate = this.timeAxis.getEnd(),
            data = [],
            record, startData, endData;
            
        records = records || this.store.getRange();
        
        for (var i = 0, l = records.length; i < l; i++) {
            record = records[i];
            
            startData = this.getZoneHeaderElementData(startDate, endDate, record, true);
            if (startData) {
                data.push(startData);
            }
            
            endData = this.getZoneHeaderElementData(startDate, endDate, record, false);
            if (endData) {
                data.push(endData);
            }
            
        }

        return data;
    },
    
    
    updateZoneHeaderElement : function(el, data) {
        // Reapply CSS classes
        el.dom.className = data.cls;

        if (this.schedulerView.isHorizontal()) {
            this.setElementX(el, data.position);
        } else {
            el.setTop(data.position);
        }
    },
    
    
    updateHeaderElement : function(record) {
        var startDate = this.timeAxis.getStart(),
            endDate = this.timeAxis.getEnd(),
            startEl = Ext.get(this.getHeaderElementId(record, true)),
            endEl   = Ext.get(this.getHeaderElementId(record, false)),
            startData = this.getZoneHeaderElementData(startDate, endDate, record, true),
            endData   = this.getZoneHeaderElementData(startDate, endDate, record, false);
            
        if (!(startEl && endData) || !(endEl && endData)) {
            Ext.destroy(startEl, endEl);
            this.renderHeaderElementsInternal([record]);
        } else {
            if (startEl) {
                if (!startData) {
                    Ext.destroy(startEl);
                } else {
                    this.updateZoneHeaderElement(startEl, startData);
                }
            }
            
            if (endEl) {
                if (!endData) {
                    Ext.destroy(endEl);
                } else {
                    this.updateZoneHeaderElement(endEl, endData);
                }
            }
        }
    }
    
}); 
