/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.field.CellEditor
@extend Ext.form.field.Text

This class is used as an input element for {@link Sch.plugin.CellPlugin} plugin. Expect user to type values 
of the following format: {startDate}{divider}{endDate}. Both start and end dates have same format defined by
{@link #dateFormat} property. Divider is also configurable via {@link #divider} property.

NOTE: make sure divider isn't a part of date format. e.g. if dateFormat is set to 'H:i', divider cannot be colon character (:).
Otherwise it will lead to wrong results. 
 */
Ext.define('Sch.field.CellEditor', {
    extend          : 'Ext.form.field.Text',
    alias           : 'widget.celleditorfield',
    
    hidden          : true,

    enableKeyEvents : true,
    
    /**
     * @cfg {String} divider Character used for join/split value. e.g. 10-12 will be split to [10,12].
     */
    divider         : '-',
    
    /**
     * @cfg {String/String[]} dateFormat Date {@link Ext.Date.format} for parsing start/end dates from input value. 
     * If array is provided editor will return first succesfull parsed results.
     */
    dateFormat      : 'H',
    
    /**
     * Special implementation of {@link Ext.form.field.Field#getErrors} method. Checks if input value could be split
     * into two dates according to {@link #divider} and {@link #dateFormat} properties. 
     * @param {String} value
     * @return {String[]}
     */
    getErrors       : function (value) {
        var me      = this,
            result  = me.callParent(arguments);
                    
        if (value == null) return result;
        
        var dates   = this.getDates(value);
        
        if (!dates[0]) {
            result.push('Start date is incorrect');
        }
        
        if (!dates[1]) {
            result.push('End date is incorrect');
        }
        
        if (dates[1] - dates[0] < 0) {
            result.push('Start date is less then end date');
        }
        
        return result;
    },
    
    /**
     * This method parses start/end dates from user input. 
     * @param {String} value
     * @return {Date[]}
     */
    getDates    : function (value) {
        var me      = this;
        
        var values  = value.split(me.divider);
        var start, end;
        
        if (Ext.isArray(me.dateFormat)) {
            for (var i = 0; i < me.dateFormat.length; i++) {
                start   = start || Ext.Date.parse(values[0], me.dateFormat[i]);
                end     = end || Ext.Date.parse(values[1], me.dateFormat[i]); 
            }
        } else {
            start   = Ext.Date.parse(values[0], me.dateFormat);
            end     = Ext.Date.parse(values[1], me.dateFormat);
        }
        
        if (!start || !end) {
            return [];
        }
        
        if (me.record) {
            start   = Sch.util.Date.mergeDates(me.record.getStartDate(), start, me.bottomUnit);
            end     = Sch.util.Date.mergeDates(me.record.getEndDate(), end, me.bottomUnit);
        } else {
            start   = Sch.util.Date.mergeDates(me.startDate, start, me.bottomUnit);
            end     = Sch.util.Date.mergeDates(me.startDate, end, me.bottomUnit);
        }
        
        return [start, end];
    }
});