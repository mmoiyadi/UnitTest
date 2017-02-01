/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.util.Date
 * @static
 * Static utility class for Date manipulation
 */
Ext.define('Sch.util.Date', {
    requires        : 'Ext.Date',
    mixins          : ['Sch.mixin.Localizable'],
    singleton       : true,

    // These stem from Ext.Date in Ext JS but since they don't exist in Sencha Touch we'll need to keep them here
    stripEscapeRe   : /(\\.)/g,
    hourInfoRe      : /([gGhHisucUOPZ]|MS)/,

    unitHash        : null,
    unitsByName     : {},

    // Override this to localize the time unit names.
    //unitNames   : {
        //YEAR    : { single : 'year', plural : 'years', abbrev : 'yr' },
        //QUARTER : { single : 'quarter', plural : 'quarters', abbrev : 'q' },
        //MONTH   : { single : 'month', plural : 'months', abbrev : 'mon' },
        //WEEK    : { single : 'week', plural : 'weeks', abbrev : 'w' },
        //DAY     : { single : 'day', plural : 'days', abbrev : 'd' },
        //HOUR    : { single : 'hour', plural : 'hours', abbrev : 'h' },
        //MINUTE  : { single : 'minute', plural : 'minutes', abbrev : 'min' },
        //SECOND  : { single : 'second', plural : 'seconds', abbrev : 's' },
        //MILLI   : { single : 'ms', plural : 'ms', abbrev : 'ms' }
    //},


    constructor : function () {
        var ED = Ext.Date;
        var unitHash = this.unitHash = {
            /**
             * Date interval constant
             * @static
             * @type String
             */
            MILLI : ED.MILLI,

            /**
             * Date interval constant
             * @static
             * @type String
             */
            SECOND : ED.SECOND,

            /**
             * Date interval constant
             * @static
             * @type String
             */
            MINUTE : ED.MINUTE,

            /** Date interval constant
             * @static
             * @type String
             */
            HOUR : ED.HOUR,

            /**
             * Date interval constant
             * @static
             * @type String
             */
            DAY : ED.DAY,

            /**
             * Date interval constant
             * @static
             * @type String
             */
            WEEK : "w",

            /**
             * Date interval constant
             * @static
             * @type String
             */
            MONTH : ED.MONTH,

            /**
             * Date interval constant
             * @static
             * @type String
             */
            QUARTER : "q",

            /**
             * Date interval constant
             * @static
             * @type String
             */
            YEAR : ED.YEAR
        };
        Ext.apply(this, unitHash);

        var me = this;
        this.units = [me.MILLI, me.SECOND, me.MINUTE, me.HOUR, me.DAY, me.WEEK, me.MONTH, me.QUARTER, me.YEAR];
    },


    onLocalized : function () {
        this.setUnitNames(this.L('unitNames'));
    },


    /**
     * Call this method to provide your own, localized values for duration unit names. See the "/js/Sch/locale/sch-lang-*.js" files for examples
     *
     * @param {Object} unitNames
     */
    setUnitNames : function (unitNames, preserveLocales) {
        var unitsByName = this.unitsByName = {};

        this.l10n.unitNames = unitNames;

        this._unitNames     = Ext.apply({}, unitNames);

        var unitHash        = this.unitHash;

        // Make it possible to lookup readable date names from both 'DAY' and 'd' etc.
        for (var name in unitHash) {
            if (unitHash.hasOwnProperty(name)) {
                var unitValue = unitHash[name];

                this._unitNames[ unitValue ] = this._unitNames[name];

                unitsByName[ name ] = unitValue;
                unitsByName[ unitValue ] = unitValue;
            }
        }
    },


    /**
     * Checks if this date is >= start and < end.
     * @param {Date} date The source date
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Boolean} true if this date falls on or between the given start and end dates.
     * @static
     */
    betweenLesser : function (date, start, end) {
        var t = date.getTime();
        return start.getTime() <= t && t < end.getTime();
    },

    /**
     * Constrains the date within a min and a max date
     * @param {Date} date The date to constrain
     * @param {Date} min Min date
     * @param {Date} max Max date
     * @return {Date} The constrained date
     * @static
     */
    constrain : function (date, min, max) {
        return this.min(this.max(date, min), max);
    },

    /**
     * Returns 1 if first param is a greater unit than second param, -1 if the opposite is true or 0 if they're equal
     * @static
     *
     * @param {String} unit1 The 1st unit
     * @param {String} unit2 The 2nd unit
     */
    compareUnits : function (u1, u2) {
        var ind1 = Ext.Array.indexOf(this.units, u1),
            ind2 = Ext.Array.indexOf(this.units, u2);

        return ind1 > ind2 ? 1 : (ind1 < ind2 ? -1 : 0);
    },

    /**
     * Returns true if first unit passed is strictly greater than the second.
     * @static
     *
     * @param {String} unit1 The 1st unit
     * @param {String} unit2 The 2nd unit
     */
    isUnitGreater : function (u1, u2) {
        return this.compareUnits(u1, u2) > 0;
    },

    /**
     * Copies hours, minutes, seconds, milliseconds from one date to another
     * @static
     *
     * @param {String} targetDate The target date
     * @param {String} sourceDate The source date
     */
    copyTimeValues : function (targetDate, sourceDate) {
        targetDate.setHours(sourceDate.getHours());
        targetDate.setMinutes(sourceDate.getMinutes());
        targetDate.setSeconds(sourceDate.getSeconds());
        targetDate.setMilliseconds(sourceDate.getMilliseconds());
    },

    /**
     * Adds a date unit and interval
     * @param {Date} date The source date
     * @param {String} unit The date unit to add
     * @param {Number} value The number of units to add to the date
     * @return {Date} The new date
     * @static
     */
    add : function (date, unit, value) {
        var d = Ext.Date.clone(date);
        if (!unit || value === 0) return d;

        switch (unit.toLowerCase()) {
            case this.MILLI:
                d = new Date(date.getTime() + value);
                break;
            case this.SECOND:
                d = new Date(date.getTime() + (value * 1000));
                break;
            case this.MINUTE:
                d = new Date(date.getTime() + (value * 60000));
                break;
            case this.HOUR:
                d = new Date(date.getTime() + (value * 3600000));
                break;
            case this.DAY:
                d.setDate(date.getDate() + value);

                if(d.getHours() === 23 && date.getHours() === 0) {
                    d = Ext.Date.add(d, Ext.Date.HOUR, 1);
                }
                break;
            case this.WEEK:
                d.setDate(date.getDate() + value * 7);
                break;
            case this.MONTH:
                var day = date.getDate();
                if (day > 28) {
                    day = Math.min(day, Ext.Date.getLastDateOfMonth(this.add(Ext.Date.getFirstDateOfMonth(date), this.MONTH, value)).getDate());
                }
                d.setDate(day);
                d.setMonth(d.getMonth() + value);
                break;
            case this.QUARTER:
                d = this.add(date, this.MONTH, value * 3);
                break;
            case this.YEAR:
                d.setFullYear(date.getFullYear() + value);
                break;
        }
        return d;
    },
    
    
    getUnitDurationInMs : function (unit) {
        // hopefully there were no DST changes in year 1
        return this.add(new Date(1, 0, 1), unit, 1) - new Date(1, 0, 1);
    },


    getMeasuringUnit : function (unit) {
        if (unit === this.WEEK) {
            return this.DAY;
        }
        return unit;
    },


    /**
     * Returns a duration of the timeframe in the given unit.
     * @static
     * @param {Date} start The start date of the timeframe
     * @param {Date} end The end date of the timeframe
     * @param {String} unit Duration unit
     * @return {Number} The duration in the units
     */
    getDurationInUnit : function (start, end, unit, doNotRound) {
        var units;

        switch (unit) {
            case this.YEAR:
                units = this.getDurationInYears(start, end);
                break;

            case this.QUARTER:
                units = this.getDurationInMonths(start, end) / 3;
                break;

            case this.MONTH:
                units = this.getDurationInMonths(start, end);
                break;

            case this.WEEK:
                units = this.getDurationInDays(start, end) / 7;
                break;

            case this.DAY:
                units = this.getDurationInDays(start, end);
                break;

            case this.HOUR:
                units = this.getDurationInHours(start, end);
                break;

            case this.MINUTE:
                units = this.getDurationInMinutes(start, end);
                break;

            case this.SECOND:
                units = this.getDurationInSeconds(start, end);
                break;

            case this.MILLI:
                units = this.getDurationInMilliseconds(start, end);
                break;
        }

        return doNotRound ? units : Math.round(units);
    },


    getUnitToBaseUnitRatio : function (baseUnit, unit) {
        if (baseUnit === unit) {
            return 1;
        }

        switch (baseUnit) {
            case this.YEAR:
                switch (unit) {
                    case this.QUARTER:
                        return 1 / 4;

                    case this.MONTH:
                        return 1 / 12;
                }
                break;

            case this.QUARTER:
                switch (unit) {
                    case this.YEAR:
                        return 4;

                    case this.MONTH:
                        return 1 / 3;
                }
                break;

            case this.MONTH:
                switch (unit) {
                    case this.YEAR:
                        return 12;

                    case this.QUARTER:
                        return 3;
                }
                break;

            case this.WEEK:
                switch (unit) {
                    case this.DAY:
                        return 1 / 7;

                    case this.HOUR:
                        return 1 / 168;
                }
                break;

            case this.DAY:
                switch (unit) {
                    case this.WEEK:
                        return 7;

                    case this.HOUR:
                        return 1 / 24;

                    case this.MINUTE:
                        return 1 / 1440;
                }
                break;

            case this.HOUR:
                switch (unit) {
                    case this.DAY:
                        return 24;

                    case this.MINUTE:
                        return 1 / 60;
                }
                break;

            case this.MINUTE:
                switch (unit) {
                    case this.HOUR:
                        return 60;

                    case this.SECOND:
                        return 1 / 60;

                    case this.MILLI:
                        return 1 / 60000;
                }
                break;

            case this.SECOND:
                switch (unit) {
                    case this.MILLI:
                        return 1 / 1000;
                }
                break;


            case this.MILLI:
                switch (unit) {
                    case this.SECOND:
                        return 1000;
                }
                break;

        }

        return -1;
    },

    /**
     * Returns the number of milliseconds between the two dates
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} true number of minutes between the two dates
     * @static
     */
    getDurationInMilliseconds : function (start, end) {
        return (end - start);
    },

    /**
     * Returns the number of seconds between the two dates
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} The number of seconds between the two dates
     * @static
     */
    getDurationInSeconds : function (start, end) {
        return (end - start) / 1000;
    },

    /**
     * Returns the number of minutes between the two dates
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} true number of minutes between the two dates
     * @static
     */
    getDurationInMinutes : function (start, end) {
        return (end - start) / 60000;
    },

    /**
     * Returns the number of hours between the two dates.
     *
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} true number of hours between the two dates
     * @static
     */
    getDurationInHours : function (start, end) {
        return (end - start) / 3600000;
    },

    /**
     * This method returns the number of days between the two dates. It assumes a day is 24 hours and tries to take the DST into account.
     * 
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} true number of days between the two dates
     * 
     * @static
     */
    getDurationInDays : function (start, end) {
        var dstDiff     = start.getTimezoneOffset() - end.getTimezoneOffset();
        
        return (end - start + dstDiff * 60 * 1000) / 86400000;
    },

    /**
     * Returns the number of whole months between the two dates
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} The number of whole months between the two dates
     * @static
     */
    getDurationInMonths : function (start, end) {
        return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
    },

    /**
     * Returns the number of years between the two dates
     * @param {Date} start Start date
     * @param {Date} end End date
     * @return {Number} The number of whole months between the two dates
     * @static
     */
    getDurationInYears : function (start, end) {
        return this.getDurationInMonths(start, end) / 12;
    },

    /**
     * Returns the lesser of the two dates
     * @param {Date} date1
     * @param {Date} date2
     * @return {Date} Returns the lesser of the two dates
     * @static
     */
    min : function (d1, d2) {
        return d1 < d2 ? d1 : d2;
    },

    /**
     * Returns the greater of the two dates
     * @param {Date} date1
     * @param {Date} date2
     * @return {Date} Returns the greater of the two dates
     * @static
     */
    max : function (d1, d2) {
        return d1 > d2 ? d1 : d2;
    },

    /**
     * Returns true if dates intersect
     * @param {Date} start1
     * @param {Date} end1
     * @param {Date} start2
     * @param {Date} end2
     * @return {Boolean} Returns true if dates intersect
     * @static
     */
    intersectSpans : function (date1Start, date1End, date2Start, date2End) {
        return this.betweenLesser(date1Start, date2Start, date2End) ||
            this.betweenLesser(date2Start, date1Start, date1End);
    },

    /**
     * Returns a name of the duration unit, matching its property on the Sch.util.Date class.
     * So, for example:
     *
     *      Sch.util.Date.getNameOfUnit(Sch.util.Date.DAY) == 'DAY' // true
     *
     * @static
     * @param {String} unit Duration unit
     * @return {String}
     */
    getNameOfUnit : function (unit) {
        unit = this.getUnitByName(unit);

        switch (unit.toLowerCase()) {
            case this.YEAR      :
                return 'YEAR';
            case this.QUARTER   :
                return 'QUARTER';
            case this.MONTH     :
                return 'MONTH';
            case this.WEEK      :
                return 'WEEK';
            case this.DAY       :
                return 'DAY';
            case this.HOUR      :
                return 'HOUR';
            case this.MINUTE    :
                return 'MINUTE';
            case this.SECOND    :
                return 'SECOND';
            case this.MILLI     :
                return 'MILLI';
        }

        throw "Incorrect UnitName";
    },

    /**
     * Returns a human-readable name of the duration unit. For for example for `Sch.util.Date.DAY` it will return either
     * "day" or "days", depending from the `plural` argument
     * @static
     * @param {String} unit Duration unit
     * @param {Boolean} plural Whether to return a plural name or singular
     * @return {String}
     */
    getReadableNameOfUnit : function (unit, plural) {
        if (!this.isLocaleApplied()) this.applyLocale();
        return this._unitNames[ unit ][ plural ? 'plural' : 'single' ];
    },

    /**
     * Returns an abbreviated form of the name of the duration unit.
     * @static
     * @param {String} unit Duration unit
     * @return {String}
     */
    getShortNameOfUnit : function (unit) {
        if (!this.isLocaleApplied()) this.applyLocale();
        return this._unitNames[ unit ].abbrev;
    },

    getUnitByName : function (name) {
        if (!this.isLocaleApplied()) this.applyLocale();

        if (!this.unitsByName[ name ]) {
            Ext.Error.raise('Unknown unit name: ' + name);
        }

        return this.unitsByName[ name ];
    },


    /**
     * Returns the beginning of the Nth next duration unit, after the provided `date`.
     * For example for the this call:
     *      Sch.util.Date.getNext(new Date('Jul 15, 2011'), Sch.util.Date.MONTH, 1)
     *
     * will return: Aug 1, 2011
     *
     * @static
     * @param {Date} date The date
     * @param {String} unit The duration unit
     * @param {Number} increment How many duration units to skip
     * @param {Number} weekStartDay The day index of the 1st day of the week.
     *                Only required when `unit` is `WEEK`. 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on (defaults to 1).
     * @return {Date} The beginning of the next duration unit interval
     */
    getNext : function (date, unit, increment, weekStartDay) {
        var dt          = Ext.Date.clone(date);

        weekStartDay    = arguments.length < 4 ? 1 : weekStartDay;
        // support 0 increment
        increment       = increment == null ? 1 : increment;

        switch (unit) {
            case this.MILLI:
                dt = this.add(date, unit, increment);
                break;

            case this.SECOND:
                dt = this.add(date, unit, increment);

                if (dt.getMilliseconds() > 0) {
                    dt.setMilliseconds(0);
                }
                break;

            case this.MINUTE:
                dt = this.add(date, unit, increment);

                if (dt.getSeconds() > 0) {
                    dt.setSeconds(0);
                }
                if (dt.getMilliseconds() > 0) {
                    dt.setMilliseconds(0);
                }
                break;

            case this.HOUR:
                dt = this.add(date, unit, increment);

                // Without these checks Firefox messes up the date and it changes timezone in certain edge cases
                // See test 021_sch_util_date_dst.t.js
                if (dt.getMinutes() > 0) {
                    dt.setMinutes(0);
                }
                if (dt.getSeconds() > 0) {
                    dt.setSeconds(0);
                }
                if (dt.getMilliseconds() > 0) {
                    dt.setMilliseconds(0);
                }
                break;

            case this.DAY:
                // Check if date has 23 hrs and is in Chile timezone
                var midnightNotInTimeScale = date.getHours() === 23 && this.add(dt, this.HOUR, 1).getHours() === 1;

                if (midnightNotInTimeScale) {
                    // Correct the date manually for DST transitions happening at 00:00
                    dt = this.add(dt, this.DAY, 2);
                    this.clearTime(dt);

                    return dt;
                }

                this.clearTime(dt);

                dt = this.add(dt, this.DAY, increment);

                // Brazil timezone issue #1642, tested in 028_timeaxis_dst.t.js
                if (dt.getHours() === 1) {
                    this.clearTime(dt);
                }
                break;

            case this.WEEK:

                this.clearTime(dt);
                var day = dt.getDay();
                dt = this.add(dt, this.DAY, weekStartDay - day + 7 * (increment - (weekStartDay <= day ? 0 : 1)));

                // For south american timezones, midnight does not exist on DST transitions, adjust...
                if (dt.getDay() !== weekStartDay) {
                    dt = this.add(dt, this.HOUR, 1);
                } else {
                    this.clearTime(dt);
                }
                break;

            case this.MONTH:
                dt = this.add(dt, this.MONTH, increment);
                dt.setDate(1);
                this.clearTime(dt);
                break;

            case this.QUARTER:
                dt = this.add(dt, this.MONTH, ((increment - 1) * 3) + (3 - (dt.getMonth() % 3)));
                this.clearTime(dt);
                dt.setDate(1);
                break;

            case this.YEAR:
                dt = new Date(dt.getFullYear() + increment, 0, 1);
                break;

            default:
                throw 'Invalid date unit';
        }

        return dt;
    },


    getNumberOfMsFromTheStartOfDay : function (date) {
        return date - this.clearTime(date, true) || 86400000;
    },


    getNumberOfMsTillTheEndOfDay : function (date) {
        return this.getStartOfNextDay(date, true) - date;
    },


    getStartOfNextDay : function (date, clone, noNeedToClearTime) {
        var nextDay = this.add(noNeedToClearTime ? date : this.clearTime(date, clone), this.DAY, 1);

        // DST case
        if (nextDay.getDate() == date.getDate()) {
            var offsetNextDay   = this.add(this.clearTime(date, clone), this.DAY, 2).getTimezoneOffset();
            var offsetDate      = date.getTimezoneOffset();

            nextDay             = this.add(nextDay, this.MINUTE, offsetDate - offsetNextDay);
        }

        return nextDay;
    },

    getEndOfPreviousDay : function (date, noNeedToClearTime) {
        var dateOnly = noNeedToClearTime ? date : this.clearTime(date, true);

        // dates are different
        if (dateOnly - date) {
            return dateOnly;
        } else {
            return this.add(dateOnly, this.DAY, -1);
        }
    },

    /**
     * Returns true if the first time span completely 'covers' the second time span. E.g.
     *      Sch.util.Date.timeSpanContains(new Date(2010, 1, 2), new Date(2010, 1, 5), new Date(2010, 1, 3), new Date(2010, 1, 4)) ==> true
     *      Sch.util.Date.timeSpanContains(new Date(2010, 1, 2), new Date(2010, 1, 5), new Date(2010, 1, 3), new Date(2010, 1, 6)) ==> false
     * @static
     * @param {Date} spanStart The start date for initial time span
     * @param {Date} spanEnd The end date for initial time span
     * @param {Date} otherSpanStart The start date for the 2nd time span
     * @param {Date} otherSpanEnd The end date for the 2nd time span
     * @return {Boolean}
     */
    timeSpanContains : function (spanStart, spanEnd, otherSpanStart, otherSpanEnd) {
        return (otherSpanStart - spanStart) >= 0 && (spanEnd - otherSpanEnd) >= 0;
    },

    /**
     * Compares two days with given precision, for example if `date1` is Aug 1st, 2014 08:00 AM and `date2` 
     * is Aug 1st, 2014 09:00 and `precisionUnit` is {@link Sch.util.Date.DAY} then both dates a considered equal
     * since they point to the same day.
     *
     * @param {Date} date1
     * @param {Date} date2
     * @param {String} [precisionUnit=Sch.util.Date.MILLI]
     * @return {Integer}
     * - -1 if `date1` is lesser than `date2`
     * - +1 if `date1` is greater than `date2`
     * -  0 if `date1` is equal to `date2`
     */
    compareWithPrecision : function(date1, date2, precisionUnit) {
        var D = Sch.util.Date,
            ED = Ext.Date,
            result;
        
        switch (precisionUnit) {
            case D.DAY:
                date1 = Number(ED.format(date1, 'Ymd'));
                date2 = Number(ED.format(date2, 'Ymd'));
                break;
            case D.WEEK:
                date1 = Number(ED.format(date1, 'YmW'));
                date2 = Number(ED.format(date2, 'YmW'));
                break;
            case D.MONTH:
                date1 = Number(ED.format(date1, 'Ym'));
                date2 = Number(ED.format(date2, 'Ym'));
                break;
            case D.QUARTER:
                date1 = date1.getFullYear() * 4 + Math.floor(date1.getMonth() / 3);
                date2 = date2.getFullYear() * 4 + Math.floor(date2.getMonth() / 3);
                break;
            case D.YEAR:
                date1 = date1.getFullYear();
                date2 = date2.getFullYear();
                break;
            default:
            case D.MILLI:
            case D.SECOND:
            case D.MINUTE:
            case D.HOUR:
                precisionUnit = precisionUnit && this.getUnitDurationInMs(precisionUnit) || 1;
                date1 = Math.floor(date1.valueOf() / precisionUnit);
                date2 = Math.floor(date2.valueOf() / precisionUnit);
                break;
        }

        ((date1 < date2) && (result = -1)) ||
        ((date1 > date2) && (result = +1)) ||
                            (result =  0);
                            
        return result;
    },

    getValueInUnits : function (date, unit) {
        switch (unit) {
            case this.MONTH : return date.getMonth();
            case this.DAY   : return date.getDate();
            case this.HOUR  : return date.getHours();
            case this.MINUTE    : return date.getMinutes();
            case this.SECOND    : return date.getSeconds();
        }
    },
    
    setValueInUnits : function (date, unit, value) {
        var result = Ext.Date.clone(date),
            f;
        
        switch (unit) {
            case this.YEAR      : f = 'setFullYear'; break;
            case this.MONTH     : f = 'setMonth'; break;
            case this.DAY       : f = 'setDate'; break;
            case this.HOUR      : f = 'setHours'; break;
            case this.MINUTE    : f = 'setMinutes'; break;
            case this.SECOND    : f = 'setSeconds'; break;
            case this.MILLI     : f = 'setMilliseconds'; break;
        }
        
        result[f](value);
        
        return result;
    },
    
    getSubUnit          : function (unit) {
        switch (unit) {
            case this.YEAR      : return this.MONTH;
            /* falls through */
            case this.MONTH     : return this.DAY;
            /* falls through */
            case this.DAY       : return this.HOUR;
            /* falls through */
            case this.HOUR      : return this.MINUTE;
            /* falls through */
            case this.MINUTE    : return this.SECOND;
            /* falls through */
            case this.SECOND    : return this.MILLI;
            /* falls through */
        }
    },
    
    setValueInSubUnits  : function (date, unit, value) {
        unit = this.getSubUnit(unit);
        return this.setValueInUnits(date, unit, value);
    },
    /*
     * section for calendar view related functions
     */
    
    mergeDates : function (target, source, unit) {
        var copy        = Ext.Date.clone(target);

        switch (unit) {
            case this.YEAR      : copy.setFullYear(source.getFullYear()); 

            /* falls through */
            case this.MONTH     : copy.setMonth(source.getMonth()); 

            /* falls through */
            case this.WEEK      :

            /* falls through */
            case this.DAY       :
                // we want to return week start day for this case
                if (unit === this.WEEK) {
                    copy = this.add(copy, this.DAY, source.getDay() - copy.getDay());
                } else {
                    copy.setDate(source.getDate());
                }

            /* falls through */
            case this.HOUR      : copy.setHours(source.getHours()); 

            /* falls through */
            case this.MINUTE    : copy.setMinutes(source.getMinutes()); 

            /* falls through */
            case this.SECOND    : copy.setSeconds(source.getSeconds());

            /* falls through */
            case this.MILLI     : copy.setMilliseconds(source.getMilliseconds());
        }
        
        return copy;
    },
    
    // splitting specified unit to subunits including start of the next span
    // e.g. week will be split to days, days to hours, etc.
    splitToSubUnits : function (start, unit, increment, weekStartDay) {
        increment       = increment || 1;
        weekStartDay    = arguments.length < 4 ? 1 : weekStartDay;
        switch (unit) {
//            case this.YEAR      : return this.splitYear(start, increment, weekStartDay);
            case this.MONTH     : return this.splitMonth(start, increment, weekStartDay);
            case this.WEEK      : //return this.splitWeek(start, increment, weekStartDay);
            /* falls through */
            case this.DAY       : return this.splitDay(start, increment);
//            case this.HOUR      : return this.splitHour(start, increment);
//            case this.MINUTE    : return this.splitMinute(start, increment);
            default : break;
        }
    },
    
    splitYear   : function (start, increment) {
        var newStart    = this.clearTime(start, true);
        newStart.setMonth(0);
        newStart.setDate(1);
        
        var result      = [];
        
        for (var i = 0; i <= 12; i = i + increment) {
            result.push(this.add(newStart, this.MONTH, i));
        }
        
        return result;
    },
    
    splitMonth  : function (start, increment, weekStartDay) {
        var newStart    = this.clearTime(start, true);
        newStart.setDate(1);
        newStart        = this.add(newStart, this.DAY, weekStartDay - newStart.getDay());
        
        var currentDate = Ext.Date.clone(newStart);
        var monthEnd    = this.add(newStart, this.MONTH, 1);
        
        var result      = [];
        
        for (var i = 0; currentDate.getTime() < monthEnd.getTime(); i = i + increment) {
            currentDate = this.add(newStart, this.WEEK, i);
            result.push(currentDate);
        }
        
        return result;
    },
    
    splitWeek   : function (start, increment, weekStartDay) {
        var newStart    = this.add(start, this.DAY, weekStartDay - start.getDay());
        newStart        = this.clearTime(newStart);
        
        var result      = [];
        
        for (var i = 0; i <= 7; i = i + increment) {
            result.push(this.add(newStart, this.DAY, i));
        }
        
        return result;
    },
    
    splitDay    : function (start, increment) {
        var copy    = this.clearTime(start, true);
        
        var result  = [];
        
        for (var i = 0; i <= 24; i = i + increment) {
            result.push(this.add(copy, this.HOUR, i));
        }

        return result;
    },
    
    splitHour   : function (start, increment) {
        var copy = new Date(start.getTime());
        copy.setMinutes(0);
        copy.setSeconds(0);
        copy.setMilliseconds(0);
        
        var result = [];
        
        for (var i = 0; i <= 60; i = i + increment) {
            result.push(this.add(copy, this.MINUTE, i));
        }
        
        return result;
    },
    
    splitMinute : function (start, increment) {
        var copy    = Ext.Date.clone(start);
        copy.setSeconds(0);
        copy.setMilliseconds(0);
        
        var result  = [];
        
        for (var i = 0; i <= 60; i = i + increment) {
            result.push(this.add(copy, this.SECOND, i));
        }
        
        return result;
    },

    // Need this to prevent some browsers (Safari in Sydney timezone) to not mess up a date
    // See tests marked *dst* and https://www.assembla.com/spaces/bryntum/tickets/1757#/activity/ticket:
    clearTime : function(dt, clone) {
        if (dt.getHours() > 0 || dt.getMinutes() > 0 || dt.getSeconds() > 0) {
            return Ext.Date.clearTime(dt, clone);
        }
        
        return clone ? Ext.Date.clone(dt) : dt;
    }
});
