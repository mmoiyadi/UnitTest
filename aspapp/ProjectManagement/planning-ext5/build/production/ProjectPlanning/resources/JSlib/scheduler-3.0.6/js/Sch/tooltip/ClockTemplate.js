/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.tooltip.ClockTemplate
 * @extends Ext.XTemplate
 * @private
 * A template showing a clock. It accepts an object containing a 'date' and a 'text' property to its apply method.
 * @constructor
 * @param {Object} config The object containing the configuration of this model.
 **/
Ext.define("Sch.tooltip.ClockTemplate", {
    extend : 'Ext.XTemplate',

    minuteHeight : 8,
    minuteTop    : 2,
    hourHeight   : 8,
    hourTop      : 2,
    handLeft     : 10,

    getRotateStyle : function (degrees) {
        return "transform:rotate(Ddeg);-ms-transform:rotate(Ddeg);-moz-transform: rotate(Ddeg);-webkit-transform: rotate(Ddeg);-o-transform:rotate(Ddeg);".replace(/D/g, degrees);
    },

    getRotateStyleIE : (function () {
        var toRad = Math.PI / 180,
            cos = Math.cos,
            sin = Math.sin;

        return function (degrees, top, height) {
            var me = this,
                rad = degrees * toRad,
                cosV = cos(rad),
                sinV = sin(rad),
                y = height * sin((90 - degrees) * toRad),
                x = height * cos((90 - degrees) * toRad),
                topAdjust = Math.min(height, height - y),
                leftAdjust = degrees > 180 ? x : 0,
                matrixString = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cosV + ", M12 = " + (-sinV) + ", M21 = " + sinV + ", M22 = " + cosV + ")";

            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", matrixString, topAdjust + top, leftAdjust + me.handLeft);
        };
    })(),

    constructor : function () {
        var isLegacyIE = Ext.isIE && Ext.isIE8m;

        this.callParent([
            '<div class="sch-clockwrap ' + (isLegacyIE ? '' : 'sch-supports-border-radius') + ' {cls}">' +
                '<div class="sch-clock">' +
                    '<div class="sch-hourIndicator" style="{[this.getHourStyle((values.date.getHours() % 12) * 30,' + this.hourTop + ', + ' + this.hourHeight + ')]}">{[Ext.Date.monthNames[values.date.getMonth()].substr(0,3)]}</div>' +
                    '<div class="sch-minuteIndicator" style="{[this.getMinuteStyle(values.date.getMinutes() * 6,' + this.minuteTop + ', + ' + this.minuteHeight + ')]}">{[values.date.getDate()]}</div>' +
                    (isLegacyIE ? '' : '<div class="sch-clock-dot"></div>') +
                '</div>' +
                '<span class="sch-clock-text">{text}</span>' +
            '</div>',
            {
                disableFormats : true,

                getMinuteStyle : isLegacyIE ? this.getRotateStyleIE : this.getRotateStyle,
                getHourStyle   : isLegacyIE ? this.getRotateStyleIE : this.getRotateStyle
            }
        ]);
    }
})
;
