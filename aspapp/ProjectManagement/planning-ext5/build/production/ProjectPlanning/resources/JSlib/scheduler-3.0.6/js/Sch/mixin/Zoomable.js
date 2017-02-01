/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.mixin.Zoomable

A mixin for {@link Sch.mixin.TimelinePanel} class, providing "zooming" functionality to the consuming panel.

The zooming feature works by reconfiguring panel's time axis with the current zoom level values selected from the {@link #zoomLevels} array.
Zoom levels can be added and removed from the array to change the amount of available steps. Range of zooming in/out can be also
modified with {@link #maxZoomLevel} / {@link #minZoomLevel} properties.

This mixin adds additional methods to the timeline panel : {@link #setMaxZoomLevel}, {@link #setMinZoomLevel}, {@link #zoomToLevel}, {@link #zoomIn},
{@link #zoomOut}, {@link #zoomInFull}, {@link #zoomOutFull}.

* **Notice**: Zooming doesn't work properly when `forceFit` option is set to true for the panel or for filtered timeaxis.
*/

Ext.define('Sch.mixin.Zoomable', {

    /**
     * @cfg {Array} [zoomLevels=[]] Predefined map of zoom levels for each preset in the ascending order. Zoom level is basically a {@link Sch.preset.ViewPreset view preset},
     * which is based on another preset, with some values overriden.
     *
     * Each element is an {Object} with the following parameters :
     *
     * - `preset` (String)      - {@link Sch.preset.ViewPreset} to be used for this zoom level. This must be a valid preset name registered in {@link Sch.preset.Manager preset manager}.
     * - `width` (Int)          - {@link Sch.preset.ViewPreset#timeColumnWidth timeColumnWidth} time column width value from the preset
     * - `increment` (Int)      - {@link Sch.preset.ViewPresetHeaderRow#increment increment} value from the bottom header row of the preset
     * - `resolution` (Int)     - {@link Sch.preset.ViewPreset#timeResolution increment} part of the `timeResolution` object in the preset
     * - `resolutionUnit` (String) (Optional) - {@link Sch.preset.ViewPreset#timeResolution unit} part of the `timeResolution` object in the preset
     */
    zoomLevels: [
        //YEAR
        { width: 40,    increment: 1,   resolution: 1, preset: 'manyYears', resolutionUnit: 'YEAR' },
        { width: 80,    increment: 1,   resolution: 1, preset: 'manyYears', resolutionUnit: 'YEAR' },
        
        { width: 30,    increment: 1,   resolution: 1, preset: 'year', resolutionUnit: 'MONTH' },
        { width: 50,    increment: 1,   resolution: 1, preset: 'year', resolutionUnit: 'MONTH'},
        { width: 100,   increment: 1,   resolution: 1, preset: 'year', resolutionUnit: 'MONTH'},
        { width: 200,   increment: 1,   resolution: 1, preset: 'year', resolutionUnit: 'MONTH'},

        //MONTH
        { width: 100,   increment: 1,   resolution: 7, preset: 'monthAndYear', resolutionUnit: 'DAY'},
        { width: 30,    increment: 1,   resolution: 1, preset: 'weekDateAndMonth', resolutionUnit: 'DAY'},

        //WEEK
        { width: 35,    increment: 1,   resolution: 1, preset: 'weekAndMonth', resolutionUnit: 'DAY'},
        { width: 50,    increment: 1,   resolution: 1, preset: 'weekAndMonth', resolutionUnit: 'DAY'},
        { width: 20,    increment: 1,   resolution: 1, preset: 'weekAndDayLetter' },

        //DAY
        { width: 50,    increment: 1,   resolution: 1, preset: 'weekAndDay', resolutionUnit: 'HOUR'},
        { width: 100,   increment: 1,   resolution: 1, preset: 'weekAndDay', resolutionUnit: 'HOUR' },

        //HOUR
        { width: 50,    increment: 6,   resolution: 30, preset: 'hourAndDay', resolutionUnit: 'MINUTE' },
        { width: 100,   increment: 6,   resolution: 30, preset: 'hourAndDay', resolutionUnit: 'MINUTE' },
        { width: 60,    increment: 2,   resolution: 30, preset: 'hourAndDay', resolutionUnit: 'MINUTE' },
        { width: 60,    increment: 1,   resolution: 30, preset: 'hourAndDay', resolutionUnit: 'MINUTE' },

        //MINUTE
        { width: 30,    increment: 15,  resolution: 5, preset: 'minuteAndHour' },
        { width: 60,    increment: 15,  resolution: 5, preset: 'minuteAndHour' },
        { width: 130,   increment: 15,  resolution: 5, preset: 'minuteAndHour' },
        { width: 60,    increment: 5,   resolution: 5, preset: 'minuteAndHour' },
        { width: 100,   increment: 5,   resolution: 5, preset: 'minuteAndHour' },
        { width: 50,    increment: 2,   resolution: 1, preset: 'minuteAndHour' },

        //SECOND
        { width: 30,    increment: 10,  resolution: 5,  preset: 'secondAndMinute' },
        { width: 60,    increment: 10,  resolution: 5,  preset: 'secondAndMinute' },
        { width: 130,   increment: 5,   resolution: 5,  preset: 'secondAndMinute' }
    ],

    /**
     * @cfg {Number} minZoomLevel Minimal zoom level to which {@link #zoomOut} will work.
     */
    minZoomLevel        : null,

    /**
     * @cfg {Number} maxZoomLevel Maximal zoom level to which {@link #zoomIn} will work.
     */
    maxZoomLevel        : null,


    /**
     * Integer number indicating the size of timespan during zooming. When zooming, the timespan is adjusted to make the scrolling area `visibleZoomFactor` times
     * wider than the timeline area itself. Used in {@link #zoomToSpan} and {@link #zoomToLevel} functions.
     */
    visibleZoomFactor   : 5,
    
    /**
     * @cfg {Boolean} zoomKeepsOriginalTimespan Whether the originally rendered timespan should be preserved while zooming. By default it is set to `false`,
     * meaning the timeline panel will adjust the currently rendered timespan to limit the amount of HTML content to render. When setting this option
     * to `true`, be careful not to allow to zoom a big timespan in seconds resolution for example. That will cause **a lot** of HTML content
     * to be rendered and affect performance. You can use {@link #minZoomLevel} and {@link #maxZoomLevel} config options for that.
     */
    zoomKeepsOriginalTimespan    : false,


    cachedCenterDate    : null,
    isFirstZoom         : true,
    isZooming           : false,
    

    initializeZooming: function () {
        //create instance-specific copy of zoomLevels
        this.zoomLevels         = this.zoomLevels.slice();

        this.setMinZoomLevel(this.minZoomLevel || 0);
        this.setMaxZoomLevel(this.maxZoomLevel !== null ? this.maxZoomLevel : this.zoomLevels.length - 1);

        this.on('viewchange', this.clearCenterDateCache, this);
    },


    getZoomLevelUnit : function (zoomLevel) {
        return Sch.preset.Manager.getPreset(zoomLevel.preset).getBottomHeader().unit;
    },

    /*
     * @private
     * Returns number of milliseconds per pixel.
     * @param {Object} level Element from array of {@link #zoomLevels}.
     * @param {Boolean} ignoreActualWidth If true, then density will be calculated using default zoom level settings. 
     * Otherwise density will be calculated for actual tick width.
     * @return {Number} Return number of milliseconds per pixel.
     */
    getMilliSecondsPerPixelForZoomLevel : function (level, ignoreActualWidth) {
        var DATE    = Sch.util.Date;

        // trying to convert the unit + increment to a number of milliseconds
        // this number is not fixed (month can be 28, 30 or 31 day), but at least this convertion
        // will be consistent (should be no DST changes at year 1)
        return Math.round(
            (DATE.add(new Date(1, 0, 1), this.getZoomLevelUnit(level), level.increment) - new Date(1, 0, 1)) /
            // `actualWidth` is a column width after view adjustments applied to it (see `calculateTickWidth`)
            // we use it if available to return the precise index value from `getCurrentZoomLevelIndex` 
            (ignoreActualWidth ? level.width : level.actualWidth || level.width)
        );
    },


    presetToZoomLevel : function (presetName) {
        var preset              = Sch.preset.Manager.getPreset(presetName);

        return {
            preset          : presetName,
            increment       : preset.getBottomHeader().increment || 1,
            resolution      : preset.timeResolution.increment,
            resolutionUnit  : preset.timeResolution.unit,
            width           : preset.timeColumnWidth
        };
    },
    
    
    zoomLevelToPreset : function (zoomLevel) {
        var preset              = Sch.preset.Manager.getPreset(zoomLevel.preset).clone();
        
        var bottomHeader        = preset.getBottomHeader();
        
        bottomHeader.increment  = zoomLevel.increment;
        // TODO support vertical
        preset.timeColumnWidth  = zoomLevel.width;
        
        if (zoomLevel.resolutionUnit || zoomLevel.resolution) {
            preset.timeResolution   = {
                unit        : zoomLevel.resolutionUnit || preset.timeResolution.unit || bottomHeader.unit,
                increment   : zoomLevel.resolution || preset.timeResolution.increment || 1
            };
        }
        
        return preset;
    },


    calculateCurrentZoomLevel : function () {
        var zoomLevel       = this.presetToZoomLevel(this.viewPreset),
            min             = Number.MAX_VALUE,
            viewModel       = this.timeAxisViewModel,
            actualWidth     = viewModel.timeColumnWidth;

        zoomLevel.width     = actualWidth;
        zoomLevel.increment = viewModel.getBottomHeader().increment || 1;

        // when calculating current zoom level we should use tick width from defined zoomLevels
        // otherwise levels might be skipped
        for (var i = 0, l = this.zoomLevels.length; i < l; i++) {
            var curentLevel = this.zoomLevels[i];

            // search for a zoom level having the same preset...
            if (curentLevel.preset !== zoomLevel.preset) continue;

            // and the most close column width to the actual one
            var delta = Math.abs(curentLevel.width - actualWidth);
            if (delta < min) {
                min                     = delta;
                zoomLevel.actualWidth   = curentLevel.actualWidth;
                zoomLevel.width         = curentLevel.width;
            }
        }

        return zoomLevel;
    },


    getCurrentZoomLevelIndex : function () {
        var currentZoomLevel        = this.calculateCurrentZoomLevel();
        var currentFactor           = this.getMilliSecondsPerPixelForZoomLevel(currentZoomLevel);

        var zoomLevels              = this.zoomLevels;

        for (var i = 0; i < zoomLevels.length; i++) {
            var zoomLevelFactor     = this.getMilliSecondsPerPixelForZoomLevel(zoomLevels[ i ]);

            if (zoomLevelFactor == currentFactor) return i;

            // current zoom level is outside of pre-defined zoom levels
            if (i === 0 && currentFactor > zoomLevelFactor) return -0.5;
            if (i == zoomLevels.length - 1 && currentFactor < zoomLevelFactor) return zoomLevels.length - 1 + 0.5;

            var nextLevelFactor     = this.getMilliSecondsPerPixelForZoomLevel(zoomLevels[ i + 1 ]);
            
            if (zoomLevelFactor > currentFactor && currentFactor > nextLevelFactor) return i + 0.5;
        }

        throw "Can't find current zoom level index";
    },


    /**
    * Sets the {@link #maxZoomLevel} value.
    * @param {Number} level The level to limit zooming in to.
    */
    setMaxZoomLevel: function (level) {
        if (level < 0 || level >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`");
        }

        this.maxZoomLevel = level;
    },

    /**
    * Sets the {@link #minZoomLevel} value.
    * @param {Number} level The level to limit zooming out to.
    */
    setMinZoomLevel: function (level) {
        if (level < 0 || level >= this.zoomLevels.length) {
            throw new Error("Invalid range for `setMinZoomLevel`");
        }

        this.minZoomLevel = level;
    },


    // when zooming out, the precision for the center date becomes not so good (1px starts to contains too big time interval)
    // because of that zooming will be "floating"
    // to prevent that we cache the center date
    // cache will be cleared after any user scroll operation
    /** @ignore */
    getViewportCenterDateCached : function () {
        if (this.cachedCenterDate) return this.cachedCenterDate;

        return this.cachedCenterDate = this.getViewportCenterDate();
    },


    clearCenterDateCache : function () {
        this.cachedCenterDate = null;
    },


    /**
     * Allows zooming to certain level of {@link #zoomLevels} array. Automatically limits zooming between {@link #maxZoomLevel} 
     * and {@link #minZoomLevel}. Can also set time axis timespan to the supplied start and end dates.
     *
     * @param {Number} level Level to zoom to.
     * @param {Object} span The time frame. Used to set time axis timespan to the supplied start and end dates. If provided, the view
     * will be centered in this time interval
     * @param {Date} span.start The time frame start.
     * @param {Date} span.end The time frame end.
     *
     * @param {Object} [options] Object, containing options for this method
     * @param {Number} options.customWidth Lowest tick width. Might be increased automatically
     * @param {Date} options.scrollTo Date that should be scrolled to
     * @return {Number} level Current zoom level or null if it hasn't changed.
     */
    zoomToLevel: function (level, span, options) {
        level                       = Ext.Number.constrain(level, this.minZoomLevel, this.maxZoomLevel);
        options                     = options || {};

        var currentZoomLevel        = this.calculateCurrentZoomLevel();
        var currentFactor           = this.getMilliSecondsPerPixelForZoomLevel(currentZoomLevel);

        var nextZoomLevel           = this.zoomLevels[ level ];
        var nextFactor              = this.getMilliSecondsPerPixelForZoomLevel(nextZoomLevel);

        if (currentFactor == nextFactor && !span) {
            // already at requested zoom level
            return null;
        }

        var me                      = this;
        var view                    = this.getSchedulingView();
        var viewEl                  = view.getOuterEl();
        var scrollSource            = view.getScrollEventSource();


        var isVertical              = this.mode == 'vertical';

        var centerDate              = span ? new Date((span.start.getTime() + span.end.getTime()) / 2) : this.getViewportCenterDateCached();

        var panelSize               = isVertical ? viewEl.getHeight() : viewEl.getWidth();

        var presetCopy              = Sch.preset.Manager.getPreset(nextZoomLevel.preset).clone();
        var bottomHeader            = presetCopy.getBottomHeader();
        
        var hasSpanProvided         = Boolean(span);

        span                        = this.calculateOptimalDateRange(centerDate, panelSize, nextZoomLevel, span);
        
        presetCopy[ isVertical ? 'timeRowHeight' : 'timeColumnWidth' ] = options.customWidth || nextZoomLevel.width;

        bottomHeader.increment      = nextZoomLevel.increment;

        this.isZooming              = true;

        this.viewPreset             = nextZoomLevel.preset;
        
        var timeAxis                = this.timeAxis;
            
        presetCopy.increment        = nextZoomLevel.increment;
        presetCopy.timeResolution.unit   = Sch.util.Date.getUnitByName(nextZoomLevel.resolutionUnit || presetCopy.timeResolution.unit || bottomHeader.unit);
        presetCopy.timeResolution.increment  = nextZoomLevel.resolution;

        this.setViewPreset(presetCopy, span.start || this.getStart(), span.end || this.getEnd(), false, true);
        
        // after switching the view preset the `width` config of the zoom level may change, because of adjustments
        // we will save the real value in the `actualWidth` property, so that `getCurrentZoomLevelIndex` method
        // will return the exact level index after zooming
        nextZoomLevel.actualWidth   = this.timeAxisViewModel.getTickWidth();
        
        // re-calculate the center date after reconfiguring the timeaxis, 
        // because the actual start/end date may change because of time axis "autoAdjust" property
        if (hasSpanProvided) centerDate = options.centerDate || new Date((timeAxis.getStart().getTime() + timeAxis.getEnd().getTime()) / 2);

        var x = null, y = null;

        if (isVertical) {
            y = view.getYFromDate(centerDate, true) - panelSize / 2;

            me.cachedCenterDate = centerDate;
            
            // there's a missync between header scroll and view scroll which can corrupt view center date
            view.getScrollable().scrollTo(null, y);
            view.headerCt.getScrollable().scrollTo(null, y);
        } else {
            x = view.getXFromDate(centerDate, true) - panelSize / 2;
            me.cachedCenterDate = centerDate;
            
            // there's a missync between header scroll and view scroll which can corrupt view center date
            view.getScrollable().scrollTo(x);
            view.headerCt.getScrollable().scrollTo(x);
        }

        me.isZooming              = false;
        
        me.fireEvent('zoomchange', me, level, x, y);

        /**
         * @event zoomchange
         *
         * Fires after zoom level has been changed
         *
         * @param {Sch.mixin.TimelinePanel} timelinePanel The timeline object
         * @param {Number} level The index of the new zoom level
         */


        return level;
    },

    /*
     * Alias for {@link #zoomToLevel}
     */
    setZoomLevel : function() {
        this.zoomToLevel.apply(this, arguments);
    },

    /**
     * Sets time frame to specified range and applies zoom level which allows to fit all columns to this range.
     * 
     * The given time span will be centered in the scheduling view, in the same time, the start/end date of the whole time axis
     * will be extended in the same way as {@link #zoomToLevel} method does, to allow scrolling for user. 
     *
     * @param {Object} span The time frame.
     * @param {Date} span.start The time frame start.
     * @param {Date} span.end The time frame end.
     *
     * @return {Number} level Current zoom level or null if it hasn't changed.
     */
    zoomToSpan : function (span, config) {
        if (span.start && span.end && span.start < span.end) {
            config = config || {};
            
            if (config.leftMargin || config.rightMargin) {
                config.adjustStart = 0;
                config.adjustEnd = 0;
            }
            
            Ext.applyIf(config, {
                leftMargin  : 0,
                rightMargin : 0
            });
            
            var start       = span.start,
                end         = span.end,
                // this config enables old zoomToSpan behavior which we want o use for zoomToFit in Gantt 
                needToAdjust  = config.adjustStart >= 0 && config.adjustEnd >=0;
                
            if (needToAdjust) {
                start       = Sch.util.Date.add(start, this.timeAxis.mainUnit, - config.adjustStart);
                end         = Sch.util.Date.add(end, this.timeAxis.mainUnit, config.adjustEnd);    
            }

            // get scheduling view width
            var availableWidth  = this.getSchedulingView().getTimeAxisViewModel().getAvailableWidth();

            // if potential width of col is less than col width provided by zoom level
            //   - we'll zoom out panel until col width fit into width from zoom level
            // and if width of column is more than width from zoom level
            //   - we'll zoom in until col width fit won't fit into width from zoom level

            var currLevel       = Math.floor(this.getCurrentZoomLevelIndex());

            // if we zoomed out even more than the highest zoom level - limit it to the highest zoom level
            if (currLevel == -1) currLevel = 0;

            var zoomLevels      = this.zoomLevels;
            
            var diffMS          = end - start,
                msPerPixel      = this.getMilliSecondsPerPixelForZoomLevel(zoomLevels[ currLevel ], true),
                // increment to get next zoom level:
                // -1 means that given timespan won't fit the available width in the current zoom level, we need to zoom out,
                // so that more content will "fit" into 1 px
                //
                // +1 mean that given timespan will already fit into available width in the current zoom level, but,
                // perhaps if we'll zoom in a bit more, the fitting will be better 
                inc             = diffMS / msPerPixel + config.leftMargin + config.rightMargin > availableWidth ? -1 : 1,
                candidateLevel  = currLevel + inc;

            var zoomLevel, levelToZoom = null;

            // loop over zoom levels
            while (candidateLevel >= 0 && candidateLevel <= zoomLevels.length - 1) {

                // get zoom level
                zoomLevel   = zoomLevels[ candidateLevel ];

//                // get its preset copy
//                preset      = this.zoomLevelToPreset(zoomLevel);
//                
//                // apply zoom level params to timeAxis
//                timeAxis.consumeViewPreset(preset);
                
                msPerPixel = this.getMilliSecondsPerPixelForZoomLevel(zoomLevel, true);
                var spanWidth   = diffMS / msPerPixel + config.leftMargin + config.rightMargin;
                
                // if zooming out
                if (inc == -1) {
                    // if columns fit into available space, then all is fine, we've found appropriate zoom level
                    if (spanWidth <= availableWidth) {
                        levelToZoom     = candidateLevel;
                        // stop searching
                        break;
                    }
                // if zooming in
                } else {
                    // if columns still fits into available space, we need to remember the candidate zoom level as a potential
                    // resulting zoom level, the indication that we've found correct zoom level will be that timespan won't fit
                    // into available view
                    if (spanWidth <= availableWidth) {
                        // if it's not currently active level
                        if (currLevel !== candidateLevel - inc) {
                            // remember this level as applicable
                            levelToZoom     = candidateLevel;
                        }
                    } else {
                        // Sanity check to find the following case:
                        // If we're already zoomed in at the appropriate level, but the current zoomLevel is "too small" to fit and had to be expanded,
                        // there is an edge case where we should actually just stop and use the currently selected zoomLevel
                        break;
                    }
                }

                candidateLevel += inc;
            }

            // If we didn't find a large/small enough zoom level, use the lowest/highest level
            levelToZoom     = levelToZoom !== null ? levelToZoom : candidateLevel - inc;
            
            zoomLevel       = zoomLevels[ levelToZoom ];
            
            var unitToZoom  = Sch.preset.Manager.getPreset(zoomLevel.preset).getBottomHeader().unit;
            
            if (config.leftMargin || config.rightMargin) {
                // time axis doesn't yet know about new view preset (zoom level) so it cannot round/ceil date correctly
                start = new Date(start.getTime() - msPerPixel * config.leftMargin);
                end = new Date(end.getTime() + msPerPixel * config.rightMargin);
            }
            
            var columnCount = Sch.util.Date.getDurationInUnit(start, end, unitToZoom, true) / zoomLevel.increment;

            if (columnCount === 0) {
                return;
            }
            
            var customWidth = Math.floor(availableWidth / columnCount);
            
            var centerDate  = new Date((start.getTime() + end.getTime()) / 2);
            
            var range;
            
            if (needToAdjust) {
                range = {
                    start   : start,
                    end     : end
                };
            } else {
                range = this.calculateOptimalDateRange(centerDate, availableWidth, zoomLevel);
            }
            
            return this.zoomToLevel(levelToZoom, 
                range,
                { 
                    customWidth : customWidth, 
                    centerDate  : centerDate 
                }
            );
        }

        return null;
    },

    /**
    * Zooms in the timeline according to the array of zoom levels. If the amount of levels to zoom is given, the view will zoom in by this value.
    * Otherwise a value of `1` will be used.
    *
    * @param {Number} levels (optional) amount of levels to zoom in
    *
    * @return {Number} currentLevel New zoom level of the panel or null if level hasn't changed.
    */
    zoomIn: function (levels) {
        //if called without parameters or with 0, zoomIn by 1 level
        levels          = levels || 1;

        var currentZoomLevelIndex       = this.getCurrentZoomLevelIndex();

        if (currentZoomLevelIndex >= this.zoomLevels.length - 1) return null;

        return this.zoomToLevel(Math.floor(currentZoomLevelIndex) + levels);
    },

    /**
    * Zooms out the timeline according to the array of zoom levels. If the amount of levels to zoom is given, the view will zoom out by this value.
    * Otherwise a value of `1` will be used.
    *
    * @param {Number} levels (optional) amount of levels to zoom out
    *
    * @return {Number} currentLevel New zoom level of the panel or null if level hasn't changed.
    */
    zoomOut: function(levels){
        //if called without parameters or with 0, zoomIn by 1 level
        levels          = levels || 1;

        var currentZoomLevelIndex       = this.getCurrentZoomLevelIndex();

        if (currentZoomLevelIndex <= 0) return null;

        return this.zoomToLevel(Math.ceil(currentZoomLevelIndex) - levels);
    },

    /**
    * Zooms in the timeline to the {@link #maxZoomLevel} according to the array of zoom levels.
    *
    * @return {Number} currentLevel New zoom level of the panel or null if level hasn't changed.
    */
    zoomInFull: function () {
        return this.zoomToLevel(this.maxZoomLevel);
    },

    /**
    * Zooms out the timeline to the {@link #minZoomLevel} according to the array of zoom levels.
    *
    * @return {Number} currentLevel New zoom level of the panel or null if level hasn't changed.
    */
    zoomOutFull: function () {
        return this.zoomToLevel(this.minZoomLevel);
    },


    /*
    * Adjusts the timespan of the panel to the new zoom level. Used for performance reasons,
    * as rendering too many columns takes noticeable amount of time so their number is limited.
    */
    calculateOptimalDateRange: function (centerDate, panelSize, zoomLevel, userProvidedSpan) {
        // this line allows us to always use the `calculateOptimalDateRange` method when calculating date range for zooming
        // (even in case when user has provided own interval)
        // other methods may override/hook into `calculateOptimalDateRange` to insert own processing
        // (inifinte scrolling feature does)
        if (userProvidedSpan) return userProvidedSpan;
        
        var timeAxis            = this.timeAxis;
        
        if (this.zoomKeepsOriginalTimespan) {
            return {
                start           : timeAxis.getStart(),
                end             : timeAxis.getEnd()
            };
        }
        
        var schDate             = Sch.util.Date;


        var unit                = this.getZoomLevelUnit(zoomLevel);

        var difference          = Math.ceil(panelSize / zoomLevel.width * zoomLevel.increment * this.visibleZoomFactor / 2);

        var startDate           = schDate.add(centerDate, unit, -difference);
        var endDate             = schDate.add(centerDate, unit, difference);

        return {
            start   : timeAxis.floorDate(startDate, false, unit, zoomLevel.increment),
            end     : timeAxis.ceilDate(endDate, false, unit, zoomLevel.increment)
        };
    }
});
