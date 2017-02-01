/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.mixin.TimelineView

A base mixin for {@link Ext.view.View} classes, giving to the consuming view the "time line" functionality.
This means that the view will be capable to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

By itself this mixin is not enough for correct rendering. The class, consuming this mixin, should also consume one of the
{@link Sch.view.Horizontal}, {@link Sch.view.Vertical} or {@link Sch.view.Calendar} mixins, which provides the implementation of some mode-specfic methods.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} instead.

*/
Ext.define("Sch.mixin.TimelineView", {
    extend : 'Sch.mixin.AbstractTimelineView',

    requires : [
        'Ext.tip.ToolTip',
        'Sch.patches.TouchScroll',
        'Sch.patches.PartnerScroll',
        'Sch.patches.View',
        'Sch.patches.TableView',
        'Sch.patches.Collection',
        'Sch.patches.ToolTip'
    ],

    tip : null,

    /**
    * @cfg {String} overScheduledEventClass
    * A CSS class to apply to each event in the view on mouseover (defaults to 'sch-event-hover').
    */
    overScheduledEventClass: 'sch-event-hover',

    ScheduleBarEvents    : [
        "mousedown",
        "mouseup",
        "click",
        "dblclick",
        "contextmenu"
    ],

    ResourceRowEvents      : [
        "keydown",
        "keyup"
    ],

    // allow the panel to prevent adding the hover CSS class in some cases - during drag drop operations
    preventOverCls      : false,

    /**
     * @event beforetooltipshow
     * Fires before the event tooltip is shown, return false to suppress it.
     * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
     * @param {Sch.model.Event} eventRecord The event record corresponding to the rendered event
     */

    /**
     * @event columnwidthchange
     * @private
     * Fires after the column width has changed
     */

    _initializeTimelineView : function() {
        this.callParent(arguments);

        this.on('destroy', this._onDestroy, this);
        this.on('afterrender', this._onAfterRender, this);
        this.panel.on('viewready', this._onViewReady, this);

        this.setMode(this.mode);

        this.enableBubble('columnwidthchange');

        this.addCls("sch-timelineview");

        if (this.readOnly) {
            this.addCls(this._cmpCls + '-readonly');
        }

        this.addCls(this._cmpCls);

        if (this.eventAnimations) {
            this.addCls('sch-animations-enabled');
        }

    },

    handleScheduleBarEvent: function(e, eventBarNode){
        this.fireEvent(this.scheduledEventName + e.type, this, this.resolveEventRecord(eventBarNode), e);
    },

    handleResourceRowEvent: function (e, resourceRowNode) {
        this.fireEvent(this.scheduledEventName + e.type, this, this.resolveEventRecordFromResourceRow(resourceRowNode), e);
    },

    // private, clean up
    _onDestroy: function () {
        if (this.tip) {
            this.tip.destroy();
        }
    },

    _onViewReady : function () {
        // If device support touch events ext is going to wrap node container in a special scroller element.
        // That will place secondary canvas element on a second position in view.
        if (this.touchScroll) {
            this.getSecondaryCanvasEl().insertBefore(this.getNodeContainer());
        }
    },


    _onAfterRender : function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true);
        }

        if (this.tooltipTpl) {
            if (typeof this.tooltipTpl === 'string') {
                this.tooltipTpl = new Ext.XTemplate(this.tooltipTpl);
            }
            this.el.on('mousemove', this.setupTooltip, this, { single : true });
        }

        var bufferedRenderer    = this.bufferedRenderer;

        if (bufferedRenderer) {
            this.patchBufferedRenderingPlugin(bufferedRenderer);
            this.patchBufferedRenderingPlugin(this.lockingPartner.bufferedRenderer);
        }

        this.on('bufferedrefresh', this.onBufferedRefresh, this, { buffer : 10 });

        this.setupTimeCellEvents();

        // The `secondaryCanvasEl` needs to be setup early, for the underlying gridview to know about it
        // and not remove it on later 'refresh' calls.
        var el = this.getSecondaryCanvasEl();

        // Simple smoke check to make sure CSS has been included correctly on the page
        if (el.getStyle('position').toLowerCase() !== 'absolute') {
            var context = Ext.Msg || window;

            context.alert('ERROR: The CSS file for the Bryntum component has not been loaded.');
        }

        var eventBarListeners = {
            delegate    : this.eventSelector,
            scope       : this
        };

        var resourceRowListeners = {
            delegate    : this.rowSelector,
            scope       : this
        };

        Ext.Array.forEach(this.ScheduleBarEvents, function(name) { eventBarListeners[name] = this.handleScheduleBarEvent; }, this);
        Ext.Array.forEach(this.ResourceRowEvents, function(name) { resourceRowListeners[name] = this.handleResourceRowEvent; }, this);

        this.el.on(eventBarListeners);
        this.el.on(resourceRowListeners);
    },


    patchBufferedRenderingPlugin : function (plugin) {
        var me                      = this;
        var oldSetBodyTop           = plugin.setBodyTop;

        // @OVERRIDE Overriding buffered renderer plugin
        plugin.setBodyTop           = function (bodyTop, calculatedTop) {
            var val                 = oldSetBodyTop.apply(this, arguments);

            me.fireEvent('bufferedrefresh', this);

            return val;
        };
    },


    onBufferedRefresh : function() {
        var el              = this.body.dom;
        if (!el) return;

        var style           = el.style;

        if (Ext.isIE9m) {
            this.getSecondaryCanvasEl().dom.style.top = this.body.dom.style.top;
        } else {
            var transform       = style.transform || style.msTransform || style.webkitTransform;

            var match;

            if (transform) {
                match           = /\(-?\d+px,\s*(-?\d+px),\s*(-?\d+)px\)/.exec(transform);
            }

            if (match) {
                this.getSecondaryCanvasEl().dom.style.top = transform ? match[ 1 ] : el.style.top;
            }
        }
    },

    setMouseOverEnabled : function(enabled) {
        this[enabled ? "mon" : "mun"](this.el, {
            mouseover : this.onEventMouseOver,
            mouseout  : this.onEventMouseOut,
            delegate  : this.eventSelector,
            scope     : this
        });
    },

    // private
    onEventMouseOver: function (e, t) {
        if (t !== this.lastItem && !this.preventOverCls) {
            this.lastItem = t;

            Ext.fly(t).addCls(this.overScheduledEventClass);

            var eventModel      = this.resolveEventRecord(t);

            // do not fire this event if model cannot be found
            // this can be the case for "sch-dragcreator-proxy" elements for example
            if (eventModel) this.fireEvent('eventmouseenter', this, eventModel, e);
        }
    },

    // private
    onEventMouseOut: function (e, t) {
        if (this.lastItem) {
            if (!e.within(this.lastItem, true, true)) {
                Ext.fly(this.lastItem).removeCls(this.overScheduledEventClass);

                this.fireEvent('eventmouseleave', this, this.resolveEventRecord(this.lastItem), e);
                delete this.lastItem;
            }
        }
    },

    // Overridden since locked grid can try to highlight items in the unlocked grid while it's loading/empty
    highlightItem: function(item) {
        if (item) {
            var me = this;
            me.clearHighlight();
            me.highlightedItem = item;
            Ext.fly(item).addCls(me.overItemCls);
        }
    },

    // private
    setupTooltip: function () {
        var me = this,
            tipCfg = Ext.apply({
                delegate    : me.eventSelector,
                target      : me.el,
                anchor      : 'b',
                rtl         : me.rtl,

                show : function() {
                    Ext.ToolTip.prototype.show.apply(this, arguments);

                    // Some extra help required to correct alignment (in cases where event is in part outside the scrollable area
                    // https://www.assembla.com/spaces/bryntum/tickets/626#/activity/ticket:
                    if (this.triggerElement && me.getMode() === 'horizontal') {
                        this.setX(this.targetXY[0] - 10);

                        var box = Ext.fly(this.triggerElement).getBox();
                        var newY = box.top - this.getHeight() - 10;

                        // if tip won't be fully visible, move it to bottom edge
                        this.setY(newY < 0 ? box.bottom + 10 : newY);
                    }
                }
            }, me.tipCfg);

        me.tip = new Ext.ToolTip(tipCfg);

        me.tip.on({
            beforeshow: function (tip) {
                if (!tip.triggerElement || !tip.triggerElement.id) {
                    return false;
                }

                var record = this.resolveEventRecord(tip.triggerElement);

                if (!record || this.fireEvent('beforetooltipshow', this, record) === false) {
                    return false;
                }

                var dataForTip = this.getDataForTooltipTpl(record, tip.triggerElement),
                    tooltipString;

                if (!dataForTip) return false;

                tooltipString = this.tooltipTpl.apply(dataForTip);

                if (!tooltipString) return false;

                tip.update(tooltipString);
            },

            scope: this
        });
        
        if (Ext.supports.Touch) {
            // https://www.sencha.com/forum/showthread.php?301307-single-event-listener-isn-t-unbound
            me.el.un({
                touchmove   : me.setupTooltip,
                mousemove   : me.setupTooltip,
                scope       : me
            });
        }
    },

    getHorizontalTimeAxisColumn : function () {
        if (!this.timeAxisColumn) {
            this.timeAxisColumn = this.headerCt.down('timeaxiscolumn');

            if (this.timeAxisColumn) {
                this.timeAxisColumn.on('destroy', function() {
                    this.timeAxisColumn = null;
                }, this);
            }
        }

        return this.timeAxisColumn;
    },

    /**
    * Template method to allow you to easily provide data for your {@link Sch.mixin.TimelinePanel#tooltipTpl} template.
     * @param {Sch.model.Range} event The event record corresponding to the HTML element that triggered the tooltip to show.
     * @param {HTMLElement} triggerElement The HTML element that triggered the tooltip.
     * @return {Object} The data to be applied to your template, typically any object or array.
    */
    getDataForTooltipTpl : function(record, triggerElement) {
        return Ext.apply({
            _record : record
        }, record.data);
    },

    /**
     * Refreshes the view and maintains the scroll position.
     */
    refreshKeepingScroll : function() {

        Ext.suspendLayouts();

        this.saveScrollState();

        this.refresh();

        // we have to resume layouts before scroll in order to let element receive its new width after refresh
        Ext.resumeLayouts(true);

        // If el is not scrolled, skip setting scroll state (can be a costly DOM operation)
        // This speeds up initial rendering
        // HACK: reading private scrollState property in Ext JS superclass
        // infinite scroll requires the restore scroll state always
        if (this.scrollState.left !== 0 || this.scrollState.top !== 0 || this.infiniteScroll) {
            this.restoreScrollState();
        }
    },

    setupTimeCellEvents: function () {
        this.mon(this.el, {
            // `handleScheduleEvent` is an abstract method, defined in "SchedulerView" and "GanttView"
            click       : this.handleScheduleEvent,
            dblclick    : this.handleScheduleEvent,
            contextmenu : this.handleScheduleEvent,

            pinch       : this.handleScheduleEvent,
            pinchstart  : this.handleScheduleEvent,
            pinchend    : this.handleScheduleEvent,
            scope       : this
        });
    },

    getTableRegion: function () {
        var tableEl = this.el.down('.' + Ext.baseCSSPrefix + 'grid-item-container');

        // Also handle odd timing cases where the table hasn't yet been inserted into the dom
        return (tableEl || this.el).getRegion();
    },

    // Returns the row element for a given row record
    getRowNode: function (resourceRecord) {
        return this.getNodeByRecord(resourceRecord);
    },

    findRowByChild : function(t) {
        return this.findItemByChild(t);
    },

    getRecordForRowNode : function(node) {
        return this.getRecord(node);
    },

    /**
    * Refreshes the view and maintains the resource axis scroll position.
    */
    refreshKeepingResourceScroll : function() {
        var scroll = this.getScroll();

        this.refresh();

        if (this.getMode() === 'horizontal') {
            this.scrollVerticallyTo(scroll.top);
        } else {
            this.scrollHorizontallyTo(scroll.left);
        }
    },

    scrollHorizontallyTo : function(x, animate) {
        var el = this.getEl();

        if (el && Ext.supports.Touch) {
            this.setScrollX(x);
        }
        else if (el) {
            el.scrollTo('left', Math.max(0, x), animate);
        }
    },

    scrollVerticallyTo : function(y, animate) {
        var el = this.getEl();

        if (el && Ext.supports.Touch) {
            this.setScrollY(y);
        }
        else if (el) {
           el.scrollTo('top', Math.max(0,  y), animate);
        }
    },

    getVerticalScroll : function() {
        var el = this.getEl();
        return el.getScroll().top;
    },

    getHorizontalScroll : function() {
        var el = this.getEl();
        return el.getScroll().left;
    },

    getScroll : function() {
        var me = this;

        return {
            top  : me.getScrollY(),
            left : me.getScrollX()
        };
    },

    handleScheduleEvent : function () {},

    // A slightly modified Ext.Element#scrollIntoView method using an offset for the edges
    scrollElementIntoView: function(el, hscroll, animate, highlight, edgeOffset, callback, scope) {

        var me              = this,
            dom             = el.dom,
            container       = Ext.getDom(me.getEl()),
            offsets         = el.getOffsetsTo(container),
            scroll          = me.getScroll(),
            left            = offsets[0] + scroll.left,
            top             = offsets[1] + scroll.top,
            bottom          = top + dom.offsetHeight,
            right           = left + dom.offsetWidth,

            ctClientHeight  = container.clientHeight,
            ctScrollTop     = parseInt(scroll.top, 10),
            ctScrollLeft    = parseInt(scroll.left, 10),
            ctBottom        = ctScrollTop + ctClientHeight,
            ctRight         = ctScrollLeft + container.clientWidth,

            newPosX,
            newPosY;

        edgeOffset = edgeOffset === null || edgeOffset === undefined ? 20 : edgeOffset;

        if (dom.offsetHeight > ctClientHeight || top < ctScrollTop) {
            newPosY = top - edgeOffset;
        }
        else if (bottom > ctBottom) {
            newPosY = bottom - ctClientHeight + edgeOffset;
        }

        if (hscroll !== false && dom.offsetWidth > container.clientWidth || left < ctScrollLeft) {
            newPosX = left - edgeOffset;
        }
        else if (hscroll !== false && right > ctRight) {
            newPosX = right - container.clientWidth + edgeOffset;
        }

        animate   = animate   === true && {} || animate;
        highlight = highlight === true && {} || highlight;
        scope     = scope || me;

        if (animate && highlight) {
            animate.listeners = Ext.apply(animate.listeners || {}, {
                'afteranimate' : function() {
                    highlight.listeners = Ext.apply(highlight.listeners || {}, {
                        'afteranimate' : function() {
                            callback && callback.call(scope);
                            callback = null;
                        }
                    });
                    Ext.fly(dom).highlight(null, highlight);
                }
            });
        }
        else if (animate) {
            animate.listeners = Ext.apply(animate.listeners, {
                'afteranimate' : function() {
                    callback && callback.call(scope);
                    callback = null;
                }
            });
        }
        else if (highlight) {
            highlight.listeners = Ext.apply(highlight.listeners || {}, {
                'afteranimate' : function() {
                    callback && callback.call(scope);
                    callback = null;
                }
            });
        }

        newPosY !== undefined && me.setScrollY(newPosY, animate);
        newPosX !== undefined && me.setScrollX(newPosX, animate);

        !animate && highlight && Ext.fly(dom).highlight(null, highlight);

        !animate && !highlight && callback && callback.call(scope);
    },

    disableViewScroller : function(disabled) {
        var scroller = this.getScrollable();

        if (scroller) {
            scroller.setDisabled(disabled);
        }
    }
});
