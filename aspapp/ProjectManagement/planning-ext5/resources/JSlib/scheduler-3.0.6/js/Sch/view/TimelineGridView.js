/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.view.TimelineGridView
@extends Ext.grid.View
@mixin Sch.mixin.TimelineView

A grid view class, that consumes the {@link Sch.mixin.TimelineView} mixin. Used internally.

*/

Ext.define('Sch.view.TimelineGridView', {
    extend                  : 'Ext.grid.View',
    mixins                  : [ 'Sch.mixin.TimelineView' ],

    infiniteScroll          : false,

    bufferCoef              : 5,
    bufferThreshold         : 0.2,

    // the scrolLeft position, as Date (not as pixels offset)
    cachedScrollLeftDate    : null,
    boxIsReady              : false,

    ignoreNextHorizontalScroll      : false,


    constructor : function (config) {
        this.callParent(arguments);

        // setup has to happen in the "afterrender" event, because at that point, the view is not "ready" yet
        // so we can freely change the start/end dates of the timeaxis and no refreshes will happen
        if (this.infiniteScroll) {
            this.on('boxready', this.setupInfiniteScroll, this);
        }

        if(this.timeAxisViewModel) {
            this.relayEvents(this.timeAxisViewModel, ['columnwidthchange']);
        }
    },

    setupInfiniteScroll : function () {
        var planner                 = this.panel.ownerCt;
        this.cachedScrollLeftDate   = planner.startDate || this.timeAxis.getStart();

        // check if it's touch microsoft
        if (Ext.supports.Touch && Ext.os.is.Windows) {
            var headerScroll    = this.panel.headerCt.scrollable;
            var viewScroll      = this.scrollable;

            // When scroll is done, Ext throws special event called 'idle'
            // Touch scroller handles that event and performs scroll to [0, 0]
            // Our 'scroll' event handler remembers new view start date and keeps it in memory
            // Disabling this handler seemingly doesn't break anything in case of infinite scroll enabled

            // Try unsubscribing from event. If there's an exception, do nothing
            try {
                Ext.GlobalEvents.un('idle', headerScroll.onIdle, headerScroll);
                Ext.GlobalEvents.un('idle', viewScroll.onIdle, viewScroll);
            }
            catch (e) {
                Ext.log('Cannot unsubscribe required listener, zooming may be broken');
            }
        }

        var me                      = this;

        planner.calculateOptimalDateRange = function (centerDate, panelSize, nextZoomLevel, span) {
            if (span) {
                return span;
            }

            var preset      = Sch.preset.Manager.getPreset(nextZoomLevel.preset);

            return me.calculateInfiniteScrollingDateRange(
                // me.ol.dom.scrollLeft can differ for obvious reasons thus method can return different result for same arguments
                // better user centerDate
                //me.getDateFromCoordinate(me.el.dom.scrollLeft, null, true),
                centerDate,
                preset.getBottomHeader().unit,
                nextZoomLevel.increment,
                nextZoomLevel.width
            );
        };

        // setup scroll/resize listeners
        this.bindInfiniteScrollListeners();
    },


    bindInfiniteScrollListeners : function () {
        if (this.scrollManager) {
            this.scrollManager.scroller.on('scroll', this.onHorizontalScroll, this);
        } else {
            this.el.on('scroll', this.onHorizontalScroll, this);
        }

        // this event is fired immediately after `afterrender`
        this.on('resize', this.onSelfResize, this);
    },


    unbindInfiniteScrollListeners : function () {
        if (this.scrollManager) {
            this.scrollManager.scroller.un('scroll', this.onHorizontalScroll, this);
        } else {
            this.el.un('scroll', this.onHorizontalScroll, this);
        }

        this.un('resize', this.onSelfResize, this);
    },


    onHorizontalScroll : function () {
        if (this.ignoreNextHorizontalScroll || this.cachedScrollLeftDate) {
            this.ignoreNextHorizontalScroll = false;
            return;
        }

        var dom         = this.el.dom,
            width       = this.getWidth(),
            left        = this.getScroll().left,
            scrollWidth = this.scrollManager ? this.scrollManager.scroller.getMaxPosition().x : dom.scrollWidth,
            limit       = width * this.bufferThreshold * this.bufferCoef;

        // if scroll violates limits let's shift timespan
        if ((scrollWidth - left - width < limit) || left < limit) {
            this.shiftToDate(this.getDateFromCoordinate(left, null, true));

            // Make sure any scrolling which could have been triggered by the Bryntum ScrollManager (drag drop of task),
            // is cancelled
            this.el.stopAnimation();
        }
    },


    refresh : function () {
        this.callParent(arguments);

        // `scrollStateSaved` will mean that refresh happens as part of `refreshKeepingScroll`,
        // which already does `restoreScrollState`, which includes `restoreScrollLeftDate`
        if (this.infiniteScroll && !this.scrollStateSaved && this.boxIsReady) {
            this.restoreScrollLeftDate();
        }
    },


    onSelfResize : function (view, width, height, oldWidth, oldHeight) {
        this.boxIsReady = true;

        // TODO this should be optimized to not perform any operations as long as view size doesn't increase
        // enough to pass the buffer limits
        if (width !== oldWidth) {
            // When size increases - we should maintain the left visible date in the component to not confuse the user
            this.shiftToDate(this.cachedScrollLeftDate || this.getVisibleDateRange().startDate, this.cachedScrollCentered);
        }
    },


    restoreScrollLeftDate : function () {
        if (this.cachedScrollLeftDate && this.boxIsReady) {
            this.ignoreNextHorizontalScroll     = true;

            this.scrollToDate(this.cachedScrollLeftDate);

            this.cachedScrollLeftDate           = null;
        }
    },


    scrollToDate : function (toDate) {
        this.cachedScrollLeftDate           = toDate;

        if (this.cachedScrollCentered){
            this.panel.ownerCt.scrollToDateCentered(toDate);
        } else {
            this.panel.ownerCt.scrollToDate(toDate);
        }

        var scrollLeft                      = this.getScroll().left;

        // the `onRestoreHorzScroll` method in Ext.panel.Table is called during Ext.resumeLayouts(true) (in the `refreshKeepingScroll`)
        // and messes up the scrolling position (in the called `syncHorizontalScroll` method).
        // Overwrite the property `syncHorizontalScroll` is using to read the scroll position, so that no actual change will happen
        this.panel.scrollLeftPos            = scrollLeft;

        // the previous line however, breaks the header sync, doing that manually
        this.headerCt.el.dom.scrollLeft     = scrollLeft;
    },


    saveScrollState : function () {
        this.scrollStateSaved       = this.boxIsReady;

        this.callParent(arguments);
    },


    restoreScrollState : function () {
        this.scrollStateSaved       = false;

        // if we have scroll date then let's calculate left-coordinate by this date
        // and top-coordinate we'll get from the last saved scroll state
        if (this.infiniteScroll && this.cachedScrollLeftDate) {
            this.restoreScrollLeftDate();

            this.el.dom.scrollTop = this.scrollState.top;

            return;
        }

        this.callParent(arguments);
    },


    // `calculateOptimalDateRange` already exists in Zoomable plugin
    calculateInfiniteScrollingDateRange : function (srollLeftDate, unit, increment, tickWidth) {
        var timeAxis            = this.timeAxis;
        var viewWidth           = this.getWidth();

        tickWidth               = tickWidth || this.timeAxisViewModel.getTickWidth();
        increment               = increment || timeAxis.increment || 1;
        unit                    = unit || timeAxis.unit;

        var DATE                = Sch.util.Date;

        var bufferedTicks       = Math.ceil(viewWidth * this.bufferCoef / tickWidth);

        return {
            start   : timeAxis.floorDate(DATE.add(srollLeftDate, unit, -bufferedTicks * increment), false, unit, increment),
            end     : timeAxis.ceilDate(DATE.add(srollLeftDate, unit, Math.ceil((viewWidth / tickWidth + bufferedTicks) * increment)), false, unit, increment)
        };
    },


    shiftToDate : function (scrollLeftDate, scrollCentered) {
        var newRange            = this.calculateInfiniteScrollingDateRange(scrollLeftDate);

        // we set scroll date here since it will be required during timeAxis.setTimeSpan() call
        this.cachedScrollLeftDate   = scrollLeftDate;
        this.cachedScrollCentered   = scrollCentered;

        // this will trigger a refresh (`refreshKeepingScroll`) which will perform `restoreScrollState` and sync the scrolling position
        this.timeAxis.setTimeSpan(newRange.start, newRange.end);
    },


    destroy : function () {
        if (this.infiniteScroll && this.rendered) this.unbindInfiniteScrollListeners();

        this.callParent(arguments);
    }

});
