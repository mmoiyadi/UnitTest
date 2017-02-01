/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.preset.ViewPresetHeaderRow

A part of the {@link Sch.preset.ViewPreset} declaration. Not used directly, but the properties below are rather provided 
inline as seen in sources of {@link Sch.preset.Manager}. This class is just provided for documentation purposes.

A sample header configuration will looks like: 

        headerConfig    : {
             bottom     : {
                unit        : "WEEK",
                increment   : 1,
                renderer    : function(start, end, headerConfig, index) {
                    return Ext.Date.format(start, 'd');
                }
            },
            middle : {
                unit        : "MONTH",
                renderer : function(start, end, headerConfig, index) {
                    var month = start.getMonth();
                    // Simple alternating month in bold
                    if (start.getMonth()) % 2) {
                        return '<strong>' + month + '</strong'>';
                    }
                    return month
                },
                align       : 'left'
            }
        }

*/
Ext.define("Sch.preset.ViewPresetHeaderRow", {
    /**
    * @cfg {String} unit The unit of time represented by each cell in this header row. See also increment property. 
    * Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
    */

    /**
    * @cfg {Number} increment The number of units each header cell will represent (e.g. 30 together with unit: "MINUTE" for 30 minute cells)
    */

    /**
    * @cfg {String} dateFormat Defines how the cell date will be formatted 
    */

    /**
    * @cfg {Function} renderer A custom renderer function used to render the cell contents. It should return the text to put in the header cell.
    * The render function is called with the following parameters:
    * 
    * - `startDate` : Date - The start date of the cell.
    * - `endDate` : Date - The end date of the cell
    * - `headerConfig` : Object - An object containing the header config object. You can set 'align' (for text-align) and headerCls (a CSS class added to the cell) properties on it.
    * - `i` : Int - The index of the cell in the row.
    * 
    * Example : 

    function (startDate, endDate, headerConfig, i) {
        headerConfig.align = "left";
        headerConfig.headerCls = "myClass"; // will be added as a CSS class of the header cell DOM element

        return Ext.Date.format(startDate, 'Y-m-d');
    }

    */

    /**
    * @cfg {Object} scope The scope to use for the renderer function
    */

    /**
    * @cfg {Function} cellGenerator A function that should return an array of objects containing 'start', 'end' and 'header' properties. 
    * Use this if you want full control over how the header rows are generated. This is not applicable for the lowest row in your configuration. 
    */
});

