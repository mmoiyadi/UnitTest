/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.feature.ResizeZone
 * @extends Ext.util.Observable
 * @private
 * Internal classing enabling resizing of rendered events
 * @constructor
 * @param {Sch.panel.SchedulerGrid} scheduler The scheduler instance
 * @param {Object} config The object containing the configuration of this model.
 */

Ext.define("Sch.feature.ResizeZone" , {
    extend      : "Ext.util.Observable",
    requires    : [
        'Ext.resizer.Resizer',
        'Sch.tooltip.Tooltip',
        'Sch.util.ScrollManager'
    ],

    /**
      * @cfg {Boolean} showTooltip `false` to not show a tooltip while resizing
      */
    showTooltip         : true,

    /**
     * @type {Boolean} showExactResizePosition true to see exact event length during resizing
     */
    showExactResizePosition : false,

    /**
     * An empty function by default, but provided so that you can perform custom validation on
     * the item being resized. Return true if the new duration is valid, false to signal that it is not.
     * @param {Sch.model.Resource} resourceRecord the resource to which the event belongs
     * @param {Sch.model.Event} eventRecord the event being resized
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Ext.EventObject} e The event object
     * @return {Boolean}
     */
    validatorFn         : Ext.emptyFn,

    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope    : null,

    schedulerView       : null,

    origEl              : null,
    handlePos           : null,
    eventRec            : null,

    /**
     * @cfg {Ext.tip.ToolTip/Object} tip
     *
     * The tooltip instance to show while resizing an event or a configuration object for the {@link Sch.tooltip.Tooltip}.
     */
    tip                 : null,
    // cached reference to the created tooltip instance
    tipInstance         : null,


    startScroll         : null,

    constructor : function(config) {
        Ext.apply(this, config);
        var s = this.schedulerView;

        s.on({
            destroy : this.cleanUp,
            scope   : this
        });

        s.mon(s.el, {
            mousedown       : this.onMouseDown,
            mouseup         : this.onMouseUp,
            scope           : this,
            delegate        : '.sch-resizable-handle'
        });
        this.callParent(arguments);
    },

    onMouseDown : function(e, t) {
        var s               = this.schedulerView;
        var eventRec        = this.eventRec = s.resolveEventRecord(t);
        var isResizable     = eventRec.isResizable();

        if (e.button !== 0 || (isResizable === false || typeof isResizable === 'string' && !t.className.match(isResizable))) {
            return;
        }

        this.eventRec       = eventRec;
        this.handlePos      = this.getHandlePosition(t);
        this.origEl         = Ext.get(e.getTarget('.sch-event'));

        s.el.on({
            mousemove   : this.onMouseMove,
            scope       : this,
            single      : true
        });
    },

    onMouseUp : function(e, t) {
        var s = this.schedulerView;

        s.el.un({
            mousemove   : this.onMouseMove,
            scope       : this,
            single      : true
        });
    },


    getTipInstance : function () {
        if (this.tipInstance) return this.tipInstance;

        var s               = this.schedulerView;
        var tip             = this.tip;
        var containerEl     = s.up('[lockable=true]').el;

        if (tip instanceof Ext.tip.ToolTip) {
            Ext.applyIf(tip, { schedulerView : s });
        } else {
            tip     = new Sch.tooltip.Tooltip(Ext.apply({
                rtl             : this.rtl,
                schedulerView   : s,
                constrainTo     : containerEl,
                cls             : 'sch-resize-tip',
                onMyMouseMove   : function (ev) {
                    this.el.alignTo(this.target, 'bl-tl', [ ev.getX() - this.target.getX(), -5 ]);
                }
            }, tip));
        }

        return this.tipInstance = tip;
    },


    onMouseMove : function(e, t) {
        var s           = this.schedulerView,
            eventRec    = this.eventRec,
            handlePos   = this.handlePos;

        if (!eventRec || s.fireEvent('beforeeventresize', s, eventRec, e) === false) {
            return;
        }

        delete this.eventRec;
        e.stopEvent();

        this.origEl.addCls('sch-event-resizing');

        this.resizer    = this.createResizer(this.origEl, eventRec, handlePos);

        var tracker     = this.resizer.resizeTracker;

        if (this.showTooltip) {
            var tip     = this.getTipInstance();

            // update requires target that was removed after previous resize
            tip.setTarget(this.origEl);
            tip.update(eventRec.getStartDate(), eventRec.getEndDate(), true);
            tip.show(this.origEl);
        }

        // HACK, fake the start of the resizing right away
        tracker.onMouseDown(e, this.resizer[ handlePos ].dom);
        tracker.onMouseMove(e, this.resizer[ handlePos ].dom);

        s.fireEvent('eventresizestart', s, eventRec);

        // Handle inifinite scroll case
        s.el.on('scroll', this.onViewElScroll, this);
    },

    getHandlePosition : function(node) {
        var isStart = node.className.match('start');

        if (this.schedulerView.getMode() === 'horizontal') {
            if (this.schedulerView.rtl) {
                return isStart ? 'east' : 'west';
            }
            return isStart ? 'west' : 'east';
        } else {
             return isStart ? 'north' : 'south';
        }
    },

    // private
    createResizer : function (eventEl, eventRecord, handlePos) {
        var s                   = this.schedulerView,
            me                  = this,
            resourceRecord      = s.resolveResource(eventEl),
            increment           = s.getSnapPixelAmount(),
            constrainRegion     = s.getScheduleRegion(resourceRecord, eventRecord),
            dateConstraints     = s.getDateConstraints(resourceRecord, eventRecord),
            height              = eventEl.getHeight(),
            isStart             = (s.rtl && handlePos[0] === 'e') || (!s.rtl && handlePos[0] === 'w') || handlePos[0] === 'n',
            isVertical          = s.getMode() !== 'horizontal',

            resizerCfg          = {
                otherEdgeX      : isStart ? eventEl.getRight() : eventEl.getLeft(),
                otherEdgeY      : isStart ? eventEl.getBottom() : eventEl.getTop(),
                target          : eventEl,
                isStart         : isStart,
                // calculate event's position relative to cell
                startYOffset    : eventEl.getY() - eventEl.parent().getY(),
                startXOffset    : eventEl.getX() - eventEl.parent().getX(),
                dateConstraints : dateConstraints,
                resourceRecord  : resourceRecord,
                eventRecord     : eventRecord,
                handles         : handlePos[0],
                minHeight       : height,
                constrainTo     : constrainRegion,

                listeners       : {
                    resizedrag  : this.partialResize,
                    resize      : this.afterResize,
                    scope       : this
                }
            };



        // HACK, make it unique to prevent Ext JS from getting the wrong one if multiple events with same Id exist.
        // Remove this when scheduler has assignment store awareness
        var prevId          = eventEl.id;
        var newId           = '_' + prevId;

        eventEl.id               = eventEl.dom.id = newId;

        // duplicate the cache entry for this element, so Ext.get(newId) or Ext.get(el) will reference the same entry
        Ext.cache[ newId ]  = Ext.cache[ prevId ];
        // EOF HACK

        // Apply orientation specific configs
        if (isVertical) {
            if (increment > 0) {
                var w = eventEl.getWidth();

                Ext.apply(resizerCfg, {
                    minHeight       : increment,
                    // To avoid SHIFT causing a ratio preserve
                    minWidth        : w,
                    maxWidth        : w,
                    heightIncrement : increment
                });
            }
        } else {
            if (increment > 0) {

                Ext.apply(resizerCfg, {
                    minWidth        : increment,
                    // To avoid SHIFT causing a ratio preserve
                    maxHeight       : height,
                    widthIncrement  : increment
                });
            }
        }

        var resizer = new Ext.resizer.Resizer(resizerCfg);

        resizer.prevId  = prevId;

        if (resizer.resizeTracker) {

            // Force tracker to start tracking even with just 1px movement, defaults to 3.
            resizer.resizeTracker.tolerance = -1;

            // Ignore resizing action if dragging outside the scheduler
            // Fixes WebKit issue https://www.assembla.com/spaces/bryntum/tickets/994#/activity/ticket:
            var old = resizer.resizeTracker.updateDimensions;

            resizer.resizeTracker.updateDimensions = function(e) {
                if (!Ext.isWebKit || e.getTarget('.sch-timelineview')) {
                    var scrollDelta;

                    // minWidth needs to be adjusted to take a new scroll position into account
                    if (isVertical) {
                        scrollDelta = s.el.getScroll().top - me.startScroll.top;
                        resizer.resizeTracker.minHeight = resizerCfg.minHeight - Math.abs(scrollDelta);
                    } else {
                        scrollDelta = s.el.getScroll().left - me.startScroll.left;
                        resizer.resizeTracker.minWidth = resizerCfg.minWidth - Math.abs(scrollDelta);
                    }

                    old.apply(this, arguments);
                }
            };

            // Patched to handle changes in containing scheduler view el scroll position
            resizer.resizeTracker.resize = function(box) {
                var scrollDelta;

                if (isVertical) {
                    scrollDelta = s.el.getScroll().top - me.startScroll.top;

                    if (handlePos[0] === 's') {
                        box.y -= scrollDelta;
                    }

                    box.height += Math.abs(scrollDelta);
                } else {
                    scrollDelta = s.el.getScroll().left - me.startScroll.left;

                    if (handlePos[0] === 'e') {
                        box.x -= scrollDelta;
                    }

                    box.width += Math.abs(scrollDelta);
                }

                Ext.resizer.ResizeTracker.prototype.resize.apply(this, arguments);
            };
        }

        // Make sure the resizing event is on top of other events
        eventEl.setStyle('z-index', parseInt(eventEl.getStyle('z-index'), 10)+1);

        Sch.util.ScrollManager.activate(s, s.getMode() === 'horizontal' ? 'horizontal' : 'vertical');

        this.startScroll = s.el.getScroll();

        return resizer;
    },

    getStartEndDates : function() {
        var r           = this.resizer,
            rEl         = r.el,
            s           = this.schedulerView,
            isStart     = r.isStart,
            start, end, xy;

        if (isStart) {
            if (s.getMode() === 'horizontal') {
                xy          = [s.rtl ? rEl.getRight() : rEl.getLeft() + 1, rEl.getTop()];
            } else {
                xy          = [(rEl.getRight() + rEl.getLeft()) / 2, rEl.getTop()];
            }
            end         = r.eventRecord.getEndDate();

            if (s.snapRelativeToEventStartDate) {
                start       = s.getDateFromXY(xy);
                start       = s.timeAxis.roundDate(start, r.eventRecord.getStartDate());
            } else {
                start       = s.getDateFromXY(xy, 'round');
            }
        } else {
            if (s.getMode() === 'horizontal') {
                xy          = [s.rtl ? rEl.getLeft() : rEl.getRight(), rEl.getBottom()];
            } else {
                xy          = [(rEl.getRight() + rEl.getLeft()) / 2, rEl.getBottom()];
            }

            start       = r.eventRecord.getStartDate();

            if (s.snapRelativeToEventStartDate) {
                end         = s.getDateFromXY(xy);
                end         = s.timeAxis.roundDate(end, r.eventRecord.getEndDate());
            } else {
                end         = s.getDateFromXY(xy, 'round');
            }
        }

        start   = start || r.start;
        end     = end   || r.end;

        if (r.dateConstraints) {
            start       = Sch.util.Date.constrain(start, r.dateConstraints.start, r.dateConstraints.end);
            end         = Sch.util.Date.constrain(end, r.dateConstraints.start, r.dateConstraints.end);
        }

        return {
            start   : start,
            end     : end
        };
    },

    // private
    partialResize : function (r, width, height, e) {
        var s               = this.schedulerView,
            xy              = e.type === 'scroll' ? this.resizer.resizeTracker.lastXY : e.getXY(),
            startEndDates   = this.getStartEndDates(xy),
            start           = startEndDates.start,
            end             = startEndDates.end,
            record          = r.eventRecord,
            mode            = s.getMode(),
            isHorizontal    = s.isHorizontal();


        if (isHorizontal) {
            r.target.el.setY(r.target.parent().getY() + r.startYOffset);
        } else {
            r.target.el.setX(r.target.parent().getX() + r.startXOffset);
        }

        if (this.showTooltip) {
            var valid = this.validatorFn.call(this.validatorFnScope || this, r.resourceRecord, record, start, end);
            var message = '';

            // Implementer could also return an object { valid : false, message : 'foo' }
            if (valid && typeof valid !== 'boolean') {
                message = valid.message;
                valid   = valid.valid;
            }

            this.getTipInstance().update(start, end, valid !== false, message);
        }

        if (this.showExactResizePosition) {
            var target          = r.target.el,
                exactWidth,
                cursorDate,
                offset;

            if (r.isStart) {
                if (s.getMode() === 'calendar') {
                    var column  = s.calendar.getEventColumns(record)[0];
                    exactWidth  = s.timeAxisViewModel.getDistanceBetweenDates(start, column.end);
                } else {
                    exactWidth  = s.timeAxisViewModel.getDistanceBetweenDates(start, record.getEndDate());
                }

                if (isHorizontal) {
                    cursorDate  = s.getDateFromCoordinate(r.otherEdgeX - Math.min(width, r.maxWidth)) || start;
                    offset      = s.timeAxisViewModel.getDistanceBetweenDates(cursorDate, start);
                    target.setWidth(exactWidth);
                    target.setX(target.getX() + offset);
                } else {
                    cursorDate  = s.getDateFromCoordinate(r.otherEdgeY - Math.min(width, r.maxHeight)) || start;
                    offset      = s.timeAxisViewModel.getDistanceBetweenDates(cursorDate, start);
                    target.setHeight(exactWidth);
                    target.setY(target.getY() + offset);
                }

            } else {
                exactWidth      = s.timeAxisViewModel.getDistanceBetweenDates(record.getStartDate(), end);
                if (isHorizontal) {
                    target.setWidth(exactWidth);
                } else {
                    target.setHeight(exactWidth);
                }
            }
        } else {
            if (!start || !end || ((r.start - start === 0) && (r.end - end === 0))) {
                return;
            }
        }

        r.end   = end;
        r.start = start;

        s.fireEvent('eventpartialresize', s, record, start, end, r.el);


    },

    onViewElScroll : function(e, t) {
        this.resizer.resizeTracker.onDrag.apply(this.resizer.resizeTracker, arguments);
        this.partialResize(this.resizer, 0, 0, e);
    },

    // private
    afterResize : function (r, w, h, e) {
        var me              = this,
            resourceRecord  = r.resourceRecord,
            eventRecord     = r.eventRecord,
            oldStart        = eventRecord.getStartDate(),
            oldEnd          = eventRecord.getEndDate(),
            start           = r.start || oldStart,
            end             = r.end || oldEnd,
            sv              = me.schedulerView,
            modified        = false,
            doFinalize      = true,
            valid           = me.validatorFn.call(me.validatorFnScope || me, resourceRecord, eventRecord, start, end, e);

        Sch.util.ScrollManager.deactivate();
        sv.el.un('scroll', this.onViewElScroll , this);

        if (this.showTooltip) {
            this.getTipInstance().hide();
        }

        sv.el.select('[id^=calendar-resizer-placeholder]').remove();

        // HACK, restore original id
        // removing extra cache entry for this element
        delete Ext.cache[ r.el.id ];

        r.el.id = r.el.dom.id = r.el.id.substr(1);
        // EOF HACK
        me.resizeContext    = {
            resourceRecord  : r.resourceRecord,
            eventRecord     : eventRecord,
            start           : start,
            end             : end,
            finalize        : function() { me.finalize.apply(me, arguments); }
        };

        // Implementer could also return an object { valid : false, message : 'foo' }
        if (valid && typeof valid !== 'boolean') {
            valid = valid.valid;
        }

        if (start && end && (end - start > 0) && // Input sanity check
            ((start - oldStart !== 0) || (end - oldEnd !== 0)) && // Make sure start OR end changed
            valid !== false) {

            // Seems to be a valid resize operation, ask outside world if anyone wants to take control over the finalizing,
            // to show a confirm dialog prior to applying the new values.
            doFinalize = sv.fireEvent('beforeeventresizefinalize', me, me.resizeContext, e) !== false;
            modified = true;
        } else {
            sv.repaintEventsForResource(resourceRecord);
        }

        if (doFinalize) {
            me.finalize(modified);
        }
    },

    finalize : function(updateRecord) {
        var sv = this.schedulerView;
        var context = this.resizeContext;
        var wasChanged = false;
        var checker = function () { wasChanged = true; };

        sv.eventStore.on('update', checker);

        // Without manually destroying the target, Ext Element cache gets confused
        this.resizer.target.destroy();

        if (updateRecord) {
            if (this.resizer.isStart) {
                context.eventRecord.setStartDate(context.start, false, sv.eventStore.skipWeekendsDuringDragDrop);
            } else {
                context.eventRecord.setEndDate(context.end, false, sv.eventStore.skipWeekendsDuringDragDrop);
            }
            if (!wasChanged) sv.repaintEventsForResource(context.resourceRecord);
        } else {
            sv.repaintEventsForResource(context.resourceRecord);
        }

        // Destroy resizer
        this.resizer.destroy();

        sv.eventStore.un('update', checker);
        sv.fireEvent('eventresizeend', sv, context.eventRecord);

        this.resizeContext = null;
    },

    cleanUp : function() {
        if (this.tipInstance) {
            this.tipInstance.destroy();
        }
    }
});
