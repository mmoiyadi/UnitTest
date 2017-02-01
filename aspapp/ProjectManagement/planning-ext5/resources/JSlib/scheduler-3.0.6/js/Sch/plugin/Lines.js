/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.Lines
@extends Sch.feature.AbstractTimeSpan

Plugin (ptype = 'scheduler_lines') for showing "global" time lines in the scheduler grid. It uses a store to populate itself, records in this store should have the following fields:

- `Date` The date of the line. This date is formatted based on what's configured in the {@link Sch.preset.ViewPreset#displayDateFormat} option of the current "viewPreset".
- `Text` The Text to show when hovering over the line (optional)
- `Cls`  A CSS class to add to the line (optional)

To add this plugin to scheduler:

        var dayStore    = new Ext.data.Store({
            fields  : [ 'Date', 'Text', 'Cls' ],

            data    : [
                {
                    Date        : new Date(2011, 06, 19),
                    Text        : 'Some important day'
                }
            ]
        });


        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.Lines', { store : dayStore })
            ]
        });


*/
Ext.define("Sch.plugin.Lines", {
    extend              : "Sch.feature.AbstractTimeSpan",
    alias               : 'plugin.scheduler_lines',

    cls                 : 'sch-timeline',

    /**
     * @cfg {Boolean} showTip 'true' to include a native browser tooltip when hovering over the line.
     */
    showTip             : true,

    /**
     * @cfg {String/Ext.XTemplate} innerTpl A template providing additional markup to render into each timespan element
     */
    innerTpl            : null,
    

    prepareTemplateData : null,
    side                : null,

    init : function(scheduler) {
        if (Ext.isString(this.innerTpl)) {
            this.innerTpl = new Ext.XTemplate(this.innerTpl);
        }

        this.side = scheduler.rtl ? 'right' : 'left';

        var innerTpl = this.innerTpl;

        if (!this.template) {
            this.template = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div id="{id}" ' + (this.showTip ? 'title="{[this.getTipText(values)]}" ' : '') + 'class="{$cls}" style="' + this.side + ':{left}px;top:{top}px;height:{height}px;width:{width}px">' +
                    (innerTpl ? '{[this.renderInner(values)]}' : '') +
                    '</div>',
                '</tpl>',
                {
                    getTipText : function (values) {
                        return scheduler.getSchedulingView().getFormattedDate(values.Date) + ' ' + (values.Text || "");
                    },

                    renderInner : function(values) {
                        return innerTpl.apply(values);
                    }
                }
            );
        }
        
        this.callParent(arguments);
    },

    generateMarkup : function(isPrint, records) {
        return this.schedulerView.getMode() === 'calendar' ? '' : this.callParent(arguments);
    },

    generateHeaderMarkup : function (isPrint, records) {
        return this.schedulerView.getMode() === 'calendar' ? '' : this.callParent(arguments);
    },

    getElementData : function(viewStart, viewEnd, records) {
        var s = this.store,
            scheduler = this.schedulerView,
            isHorizontal = scheduler.isHorizontal(),
            rs = records || s.getRange(),
            data = [],
            height,
            width,
            region = scheduler.getTimeSpanRegion(viewStart, null, this.expandToFitView),
            record, date, templateData;

        if (Ext.versions.touch){
            height = '100%';
        } else {
            height = isHorizontal ? region.bottom - region.top : 1;
        }

        width = isHorizontal ? 1 : region.right - region.left;

        for (var i = 0, l = rs.length; i < l; i++) {
            record = rs[i];
            date = record.get('Date');

            if (date && Sch.util.Date.betweenLesser(date, viewStart, viewEnd)) {
                var pos = scheduler.getCoordinateFromDate(date);

                templateData = Ext.apply({}, this.getTemplateData(record));
                templateData.id = this.getElementId(record);
                // using $cls to avoid possible conflict with "Cls" field in the record
                // `getElementCls` will append the "Cls" field value to the class
                templateData.$cls = this.getElementCls(record, templateData);

                templateData.width = width;
                templateData.height = height;

                if (isHorizontal) {
                    templateData.left = pos;
                } else{
                    templateData.top = pos;
                }
                data.push(templateData);
            }
        }
        
        return data;
    },
    
    
    getHeaderElementData : function(records) {
        var startDate = this.timeAxis.getStart(),
            endDate = this.timeAxis.getEnd(),
            isHorizontal = this.schedulerView.isHorizontal(),
            data = [],
            record, date, position, templateData;

        records = records || this.store.getRange();

        for (var i = 0, l = records.length; i < l; i++) {
            record = records[i];
            date = record.get('Date');
            
            if (date && Sch.util.Date.betweenLesser(date, startDate, endDate)) {
                position = this.getHeaderElementPosition(date);
                templateData = this.getTemplateData(record);
                
                templateData = Ext.apply({
                    side     : isHorizontal ? this.side : 'top',
                    cls      : this.getHeaderElementCls(record, templateData),
                    position : position
                }, templateData);
                
                // Overwrite id manually as it might exist in the record raw data
                templateData.id = this.getHeaderElementId(record);

                data.push(templateData);
            }
        }
        
        return data;
    }
    
});
