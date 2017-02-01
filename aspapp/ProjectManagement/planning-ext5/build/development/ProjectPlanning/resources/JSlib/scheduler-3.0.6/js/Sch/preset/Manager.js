/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.preset.Manager
@singleton

Provides a registry of the possible view presets that any instance of a Panel with {@link Sch.mixin.SchedulerPanel} mixin can use.

See the {@link Sch.preset.ViewPreset} and {@link Sch.preset.ViewPresetHeaderRow} classes for a description of the view preset properties.

Available presets are:

- `minuteAndHour` - creates 2 level headers - hour and minutes within it
- `hourAndDay` - creates 2 level headers - day and hours within it: {@img scheduler/images/hourAndDay.png}
- `dayAndWeek` - creates 2 level headers - week and days within it: {@img scheduler/images/dayAndWeek.png}
- `weekAndDay` - just like `dayAndWeek` but with different formatting: {@img scheduler/images/weekAndDay.png}
- `weekAndMonth` - creates 2 level headers - month and weeks within it: {@img scheduler/images/weekAndMonth.png}

- `monthAndYear` - creates 2 level headers - year and months within it: {@img scheduler/images/monthAndYear.png}
- `year` - creates 2 level headers - year and quarters within it: {@img scheduler/images/year-preset.png}
- `weekAndDayLetter` - creates a 2 level header - with weeks and day letters within it.
- `weekDateAndMonth` - creates 2 level headers - month and weeks within it (weeks shown by first day only): {@img scheduler/images/weekDateAndMonth.png}

You can register your own preset with the {@link #registerPreset} call

*/
Ext.define('Sch.preset.Manager', {
    extend: 'Ext.util.MixedCollection',
    requires: [
        'Sch.util.Date',
        'Sch.preset.ViewPreset'
    ],
    mixins: ['Sch.mixin.Localizable'],

    singleton: true,

    defaultPresets : {
        secondAndMinute : {
            timeColumnWidth     : 30,   // Time column width (used for rowHeight in vertical mode)
            rowHeight           : 24,    // Only used in horizontal orientation
            resourceColumnWidth : 100,   // Only used in vertical orientation
            displayDateFormat   : 'G:i:s', // Controls how dates will be displayed in tooltips etc
            shiftIncrement      : 10,     // Controls how much time to skip when calling shiftNext and shiftPrevious.
            shiftUnit           : 'MINUTE',// Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            defaultSpan         : 24,    // By default, if no end date is supplied to a view it will show 24 hours
            timeResolution      : {      // Dates will be snapped to this resolution
                unit        : 'SECOND',  // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
                increment   : 5
            },
            headerConfig        : {      // This defines your header, you must include a "middle" object, top/bottom are optional. For each row you can define "unit", "increment", "dateFormat", "renderer", "align", and "scope"
                middle  : {
                    unit        : 'SECOND',
                    increment   : 10,
                    align       : 'center',
                    dateFormat  : 's'
                },
                top     : {
                    unit        : 'MINUTE',
                    align       : 'center',
                    dateFormat  : 'D, d g:iA'
                }
            }
        },
        minuteAndHour : {
            timeColumnWidth     : 100,   // Time column width (used for rowHeight in vertical mode)
            rowHeight           : 24,    // Only used in horizontal orientation
            resourceColumnWidth : 100,   // Only used in vertical orientation
            displayDateFormat   : 'G:i', // Controls how dates will be displayed in tooltips etc
            shiftIncrement      : 1,     // Controls how much time to skip when calling shiftNext and shiftPrevious.
            shiftUnit           : 'HOUR',// Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            defaultSpan         : 24,    // By default, if no end date is supplied to a view it will show 24 hours
            timeResolution      : {      // Dates will be snapped to this resolution
                unit        : 'MINUTE',  // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
                increment   : 30
            },
            headerConfig        : {      // This defines your header, you must include a "middle" object, top/bottom are optional. For each row you can define "unit", "increment", "dateFormat", "renderer", "align", and "scope"
                middle  : {
                    unit        : 'MINUTE',
                    increment   : '30',
                    align       : 'center',
                    dateFormat  : 'i'
                },
                top     : {
                    unit        : 'HOUR',
                    align       : 'center',
                    dateFormat  : 'D, gA/d'
                }
            }
        },
        hourAndDay : {
            timeColumnWidth     : 60,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'G:i',
            shiftIncrement      : 1,
            shiftUnit           : 'DAY',
            defaultSpan         : 24,
            timeResolution      : {
                unit        : 'MINUTE',
                increment   : 30
            },
            headerConfig        : {
                middle      : {
                    unit        : 'HOUR',
                    align       : 'center',
                    dateFormat  : 'G:i'
                },
                top         : {
                    unit        : 'DAY',
                    align       : 'center',
                    dateFormat  : 'D d/m'
                }
            }
        },
        dayAndWeek : {
            timeColumnWidth     : 100,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d G:i',
            shiftUnit           : 'DAY',
            shiftIncrement      : 1,
            defaultSpan         : 5,
            timeResolution      : {
                unit        : 'HOUR',
                increment   : 1
            },
            headerConfig        : {
                middle      : {
                    unit        : 'DAY',
                    align       : 'center',
                    dateFormat  : 'D d M'
                },
                top : {
                    unit        : 'WEEK',
                    align       : 'center',
                    renderer    : function(start, end, cfg) {
                        return Sch.util.Date.getShortNameOfUnit('WEEK') + '.' + Ext.Date.format(start, 'W M Y');
                    }
                }
            }
        },

        weekAndDay : {
            timeColumnWidth     : 100,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'WEEK',
            shiftIncrement      : 1,
            defaultSpan         : 1,
            timeResolution      : {
                unit        : 'DAY',
                increment   : 1
            },
            headerConfig        : {
                bottom : {
                    unit        : 'DAY',
                    align       : 'center',
                    increment   : 1,
                    dateFormat  : 'd/m'
                },
                middle : {
                    unit        : 'WEEK',
                    dateFormat  : 'D d M'
                }
            }
        },

        weekAndMonth : {
            timeColumnWidth     : 100,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'WEEK',
            shiftIncrement      : 5,
            defaultSpan         : 6,
            timeResolution      : {
                unit        : 'DAY',
                increment   : 1
            },
            headerConfig        : {
                middle      : {
                    unit    : 'WEEK',
                    renderer: function(start, end, cfg) {
                        return Ext.Date.format(start, 'd M');
                    }
                },
                top         : {
                    unit        : 'MONTH',
                    align       : 'center',
                    dateFormat  : 'M Y'
                }
            }
        },

        monthAndYear : {
            timeColumnWidth     : 110,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftIncrement      : 3,
            shiftUnit           : 'MONTH',
            defaultSpan         : 12,
            timeResolution      : {
                unit        : 'DAY',
                increment   : 1
            },
            headerConfig        : {
                middle      : {
                    unit        : 'MONTH',
                    align       : 'center',
                    dateFormat  : 'M Y'
                },
                top         : {
                    unit        : 'YEAR',
                    align       : 'center',
                    dateFormat  : 'Y'
                }
            }
        },
        year : {
            timeColumnWidth     : 100,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'YEAR',
            shiftIncrement      : 1,
            defaultSpan         : 1,
            timeResolution      : {
                unit        : 'MONTH',
                increment   : 1
            },
            headerConfig        : {
                middle      : {
                    unit        : 'QUARTER',
                    align       : 'center',
                    renderer    : function(start, end, cfg) {
                        return Ext.String.format(Sch.util.Date.getShortNameOfUnit('QUARTER').toUpperCase() + '{0}', Math.floor(start.getMonth() / 3) + 1);
                    }
                },
                top         : {
                    unit        : 'YEAR',
                    align       : 'center',
                    dateFormat  : 'Y'
                }
            }
        },
        manyYears : {
            timeColumnWidth     : 50,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'YEAR',
            shiftIncrement      : 1,
            defaultSpan         : 1,
            timeResolution      : {
                unit        : 'YEAR',
                increment   : 1
            },
            headerConfig        : {
                middle      : {
                    unit        : 'YEAR',
                    align       : 'center',
                    dateFormat  : 'Y',
                    increment   : 5
                },
                // smallest zoom level looked back
                // we have to specify increments here since 'increment' in zoomLevel affects only bottom header
                bottom      : {
                    unit        : 'YEAR',
                    align       : 'center',
                    dateFormat  : 'y',
                    increment   : 1
                }
            }
        },
        weekAndDayLetter : {
            timeColumnWidth     : 20,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'WEEK',
            shiftIncrement      : 1,
            defaultSpan         : 10,
            timeResolution      : {
                unit        : 'DAY',
                increment   : 1
            },
            headerConfig        : {
                bottom  : {
                    unit        : 'DAY',
                    align       : 'center',
                    renderer    : function(start) {
                        return Ext.Date.dayNames[start.getDay()].substring(0, 1);
                    }
                },
                middle          : {
                    unit        : 'WEEK',
                    dateFormat  : 'D d M Y'
                }
            }
        },
        weekDateAndMonth : {
            timeColumnWidth     : 30,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'Y-m-d',
            shiftUnit           : 'WEEK',
            shiftIncrement      : 1,
            defaultSpan         : 10,
            timeResolution      : {
                unit        : 'DAY',
                increment   : 1
            },
            headerConfig : {
                middle      : {
                    unit        : 'WEEK',
                    align       : 'center',
                    dateFormat  : 'd'
                },
                top         : {
                    unit        : 'MONTH',
                    dateFormat  : 'Y F'
                }
            }
        },

        day : {
            timeRowHeight       : 40,
            calendarColumnWidth : 200,
            displayDateFormat   : 'G:i',
            shiftIncrement      : 1,
            shiftUnit           : 'DAY',
            defaultSpan         : 24,
            timeResolution      : {
                unit        : 'MINUTE',
                increment   : 30
            },
            headerConfig        : {
                bottom  : {
                    unit        : 'HOUR',
                    align       : 'center',
                    renderer    : function (value) {
                        return Ext.String.format(
                            '<div class="sch-calendarcolumn-ct"><span class="sch-calendarcolumn-hours">{0}</span>' +
                            '<span class="sch-calendarcolumn-minutes">{1}</span></div>',
                            Ext.Date.format(value, 'H'),
                            Ext.Date.format(value, 'i')
                        );
                    }
                },
                middle  : {
                    unit        : 'DAY',
                    align       : 'center',
                    dateFormat  : 'D d/m',
                    splitUnit   : 'DAY'
                }
            }
        },

        week : {
            timeRowHeight       : 40,
            calendarColumnWidth : 164,
            displayDateFormat   : 'G:i',
            shiftIncrement      : 1,
            shiftUnit           : 'WEEK',
            defaultSpan         : 24,
            timeResolution      : {
                unit        : 'MINUTE',
                increment   : 30
            },
            headerConfig        : {
                bottom  : {
                    unit        : 'HOUR',
                    align       : 'center',
                    dateFormat  : 'H:i',    // will be overridden by renderer
                    renderer    : function (value) {
                        return Ext.String.format(
                            '<div class="sch-calendarcolumn-ct">' +
                                '<span class="sch-calendarcolumn-hours">{0}</span>' +
                                '<span class="sch-calendarcolumn-minutes">{1}</span>' +
                            '</div>',

                            Ext.Date.format(value, 'H'),
                            Ext.Date.format(value, 'i')
                        );
                    }
                },
                middle  : {
                    unit        : 'WEEK',
                    align       : 'center',
                    dateFormat  : 'D d',
                    splitUnit   : 'DAY'
                }
            }
        },

        month : {
            timeColumnWidth     : 60,
            rowHeight           : 24,
            resourceColumnWidth : 100,
            displayDateFormat   : 'G:i',
            shiftIncrement      : 1,
            shiftUnit           : 'MONTH',
            defaultSpan         : 4,
            timeResolution      : {
                unit        : 'HOUR',
                increment   : 12
            },
            headerConfig        : {
                bottom  : {
                    unit        : 'DAY',
                    align       : 'center',
                    dateFormat  : 'D',
                    splitUnit   : 'WEEK'
                },
                middle  : {
                    unit        : 'WEEK',
                    align       : 'center',
                    dateFormat  : 'D d/m'
                },
                top     : {
                    unit        : 'MONTH',
                    align       : 'center',
                    renderer    : function(start, end, cfg) {
                        return Ext.Date.format(start, 'd/m') + ' - ' + Ext.Date.format(end, 'd/m, Y');
                    },
                    splitUnit   : 'WEEK'
                }
            }
        }
    },

    constructor : function() {
        this.callParent(arguments);
        this.registerDefaults();
    },

    onLocalized : function () {
        var me = this;

        this.eachKey(function (name, preset) {
            if (me.l10n[name]) {
                var locale  = me.L(name);

                locale.displayDateFormat && (preset.displayDateFormat = locale.displayDateFormat);
                locale.middleDateFormat && (preset.headerConfig.middle.dateFormat = locale.middleDateFormat);
                locale.topDateFormat && (preset.headerConfig.top.dateFormat = locale.topDateFormat);
                locale.bottomDateFormat && (preset.headerConfig.bottom.dateFormat = locale.bottomDateFormat);
            }
        });
    },

    /**
    * Registers a new view preset to be used by any scheduler grid or tree on the page.
    * @param {String} name The unique name identifying this preset
    * @param {Object} config The configuration properties of the view preset (see {@link Sch.preset.ViewPreset} for more information)
    */
    registerPreset : function(name, cfg) {
        if (cfg) {
            var headerConfig    = cfg.headerConfig;
            var DATE            = Sch.util.Date;

            // Make sure date "unit" constant specified in the preset are resolved
            for (var o in headerConfig) {
                if (headerConfig.hasOwnProperty(o)) {
                    if (DATE[headerConfig[o].unit]) {
                        headerConfig[o].unit = DATE[headerConfig[o].unit.toUpperCase()];
                    }

                    if (DATE[headerConfig[o].splitUnit]) {
                        headerConfig[o].splitUnit = DATE[headerConfig[o].splitUnit.toUpperCase()];
                    }
                }
            }

            if (!cfg.timeColumnWidth) cfg.timeColumnWidth = 50;
            if (!cfg.rowHeight) cfg.rowHeight = 24;

            var timeResolution  = cfg.timeResolution;

            // Resolve date units
            if (timeResolution && DATE[ timeResolution.unit ]) {
                timeResolution.unit = DATE[ timeResolution.unit.toUpperCase() ];
            }

            var shiftUnit       = cfg.shiftUnit;

            // Resolve date units
            if (shiftUnit && DATE[ shiftUnit ]) {
                cfg.shiftUnit = DATE[ shiftUnit.toUpperCase() ];
            }
        }

        if (this.isValidPreset(cfg)) {
            if (this.containsKey(name)) this.removeAtKey(name);

            cfg.name        = name;

            this.add(name, new Sch.preset.ViewPreset(cfg));
        } else {
            throw 'Invalid preset, please check your configuration';
        }
    },

    isValidPreset : function(cfg) {
        var D = Sch.util.Date,
            valid = true,
            validUnits = Sch.util.Date.units,
            ownKeys = {};

        // Make sure all date "unit" constants are valid
        for (var o in cfg.headerConfig) {
            if (cfg.headerConfig.hasOwnProperty(o)) {
                ownKeys[o] = true;
                valid = valid && Ext.Array.indexOf(validUnits, cfg.headerConfig[o].unit) >= 0;
            }
        }

        if (!(cfg.columnLinesFor in ownKeys)) {
            cfg.columnLinesFor = 'middle';
        }

        if (cfg.timeResolution) {
            valid = valid && Ext.Array.indexOf(validUnits, cfg.timeResolution.unit) >= 0;
        }

        if (cfg.shiftUnit) {
            valid = valid && Ext.Array.indexOf(validUnits, cfg.shiftUnit) >= 0;
        }

        return valid;
    },

    /**
    * Fetches a view preset from the global cache
    * @param {String} name The name of the preset
    * @return {Object} The view preset, see {@link Sch.preset.ViewPreset} for more information
    */
    getPreset : function(name) {
        return this.get(name);
    },

    /**
    * Deletes a view preset
    * @param {String} name The name of the preset
    */
    deletePreset : function(name) {
        this.removeAtKey(name);
    },

    registerDefaults : function() {
        var pm = this,
            vp = this.defaultPresets;

        for (var p in vp) {
            pm.registerPreset(p, vp[p]);
        }
    }
});