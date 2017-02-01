/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.preset.ViewPreset
Not used directly, but the properties below are rather provided inline as seen in the source of {@link Sch.preset.Manager}. This class is just provided for documentation purposes.

A sample preset looks like:

    hourAndDay : {
        timeColumnWidth         : 60,       // Time column width (used for rowHeight in vertical mode)
        rowHeight               : 24,       // Only used in horizontal orientation
        resourceColumnWidth     : 100,      // Only used in vertical orientation

        displayDateFormat       : 'G:i',    // Controls how dates will be displayed in tooltips etc

        shiftIncrement          : 1,        // Controls how much time to skip when calling shiftNext and shiftPrevious.
        shiftUnit               : "DAY",    // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
        defaultSpan             : 12,       // By default, if no end date is supplied to a view it will show 12 hours

        timeResolution          : {         // Dates will be snapped to this resolution
            unit        : "MINUTE",         // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            increment   : 15
        },

        headerConfig            : {         // This defines your header, you must include a "middle" object, and top/bottom are optional.
            middle      : {                 // For each row you can define "unit", "increment", "dateFormat", "renderer", "align", and "scope"
                unit        : "HOUR",
                dateFormat  : 'G:i'
            },
            top         : {
                unit        : "DAY",
                dateFormat  : 'D d/m'
            }
        },

        linesFor                : 'middle'  // Defines header level column lines will be drawn for
    },

See the {@link Sch.preset.Manager} for the list of available presets.

*/
Ext.define("Sch.preset.ViewPreset", {
    name                : null,

    /**
     * @cfg {Number} rowHeight The height of the row in horizontal orientation
     */
    rowHeight           : null,

    /**
     * @cfg {Number} timeColumnWidth The width of the time tick column in horizontal orientation. Also used as height of time tick row
     * in vertical orientation, unless {@link #timeRowHeight} is provided.
     */
    timeColumnWidth     : 50,

    /**
     * @cfg {Number} timeRowHeight The height of the time tick row in vertical orientation. If omitted, a value of {@link #timeColumnWidth}
     * is used.
     */
    timeRowHeight       : null,

    /**
     * @cfg {Number} timeAxisColumnWidth The width of the time axis column in the vertical orientation
     */
    timeAxisColumnWidth : null,

    /**
    * @cfg {String} displayDateFormat Defines how dates will be formatted in tooltips etc
    */
    displayDateFormat   : 'G:i',

    /**
     * @cfg {String} shiftUnit The unit to shift when calling shiftNext/shiftPrevious to navigate in the chart.
     * Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
     */
    shiftUnit           : "HOUR",

    /**
     * @cfg {Number} shiftIncrement The amount to shift (in shiftUnits)
     */
    shiftIncrement      : 1,

    /**
     * @cfg {Number} defaultSpan The amount of time to show by default in a view (in the unit defined by the middle header)
     */
    defaultSpan         : 12,

    /**
     * @cfg {Object} timeResolution An object containing a unit identifier and an increment variable. Example:
     *
        timeResolution : {
            unit        : "HOUR",  //Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            increment   : 1
        }
     *
     */
    timeResolution      : null,

    /**
     * @cfg {Object} headerConfig An object containing one or more {@link Sch.preset.ViewPresetHeaderRow} rows defining how your headers shall be composed.
     * Your 'main' unit should be the middle header unit. This object can contain "bottom", "middle" and "top" header definitions. The 'middle' header is mandatory.
     */
    headerConfig        : null,

    /**
     * @cfg {String} columnLinesFor Defines the header level that the column lines will be drawn for. See {@link Sch.mixin.AbstractTimelinePanel#columnLines}
     */
    columnLinesFor            : 'middle',

    // internal properties
    headers             : null,
    mainHeader          : 0,


    constructor : function (config) {
        Ext.apply(this, config);
    },

    getHeaders : function () {
        if (this.headers) return this.headers;

        var headerConfig        = this.headerConfig;

        this.mainHeader         = headerConfig.top ? 1 : 0;

        return this.headers     = [].concat(headerConfig.top || [], headerConfig.middle || [], headerConfig.bottom || []);
    },


    getMainHeader : function () {
        return this.getHeaders()[ this.mainHeader ];
    },


    getBottomHeader : function () {
        var headers     = this.getHeaders();

        return headers[ headers.length - 1 ];
    },


    clone : function () {
        var config      = {};
        var me          = this;

        Ext.each([
            'rowHeight',
            'timeColumnWidth',
            'timeRowHeight',
            'timeAxisColumnWidth',
            'displayDateFormat',
            'shiftUnit',
            'shiftIncrement',
            'defaultSpan',
            'timeResolution',
            'headerConfig'
        ], function (name) {
            config[ name ] = me[ name ];
        });

        return new this.self(Ext.clone(config));
    }
});
