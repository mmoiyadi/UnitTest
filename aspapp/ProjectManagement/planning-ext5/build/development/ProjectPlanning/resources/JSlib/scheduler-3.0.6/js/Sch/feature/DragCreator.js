/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @private
 * @class Sch.feature.DragCreator
 * @constructor
 * An internal class which shows a drag proxy while clicking and dragging.
 * Create a new instance of this plugin
 * @param {Object} config The configuration options
 */
Ext.define("Sch.feature.DragCreator", {
    requires : [
        'Ext.XTemplate',
        'Ext.ToolTip',
        'Sch.util.Date',
        'Sch.util.ScrollManager',
        'Sch.util.DragTracker',
        'Sch.tooltip.Tooltip',
        'Sch.tooltip.HoverTip'
    ],

    /**
     * @cfg {Boolean} disabled true to start disabled
     */
    disabled            : false,

    /**
     * @cfg {Boolean} showHoverTip true to show a time tooltip when hovering over the time cells
     */
    showHoverTip        : true,

    /**
     * @cfg {Boolean} showDragTip true to show a time tooltip when dragging to create a new event
     */
    showDragTip         : true,

    /**
     * @cfg {Ext.tip.ToolTip/Object} dragTip
     * The tooltip instance to show while dragging to create a new event or a configuration object for the default instance of
     * {@link Sch.tooltip.ToolTip}
     */
    dragTip             : null,

    /**
     * @cfg {Number} dragTolerance Number of pixels the drag target must be moved before dragging is considered to have started. Defaults to 2.
     */
    dragTolerance       : 2,

    /**
     * @cfg {Ext.tip.ToolTip/Object} hoverTip
     * The tooltip instance to show when mouse pointer is over scheduling area or a configuration object
     */
    hoverTip            : null,

    /**
     * An empty function by default, but provided so that you can perform custom validation on the event being created.
     * Return true if the new event is valid, false to prevent an event being created.
     * @param {Sch.model.Resource} resourceRecord the resource for which the event is being created
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Ext.EventObject} e The event object
     * @return {Boolean} isValid
     */
    validatorFn         : Ext.emptyFn,

    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope    : null,

    /**
     * @cfg {Object} trackerConfig A custom config object used to create the internal {@link Sch.util.DragTracker} instance
     */
    trackerConfig : null,

    schedulerView : null,

    /**
     * @cfg {Ext.Template/String} template The HTML template shown when dragging to create new items
     */
    template            : '<div class="sch-dragcreator-proxy">' +
                              '<div class="sch-event-inner">&#160;</div>' +
                          '</div>',

    constructor : function (config) {
        Ext.apply(this, config || {});

        this.lastTime = new Date();

        if (!(this.template instanceof Ext.Template)) {
            this.template = new Ext.Template(this.template);
        }

        this.schedulerView.on("destroy", this.onSchedulerDestroy, this);

        if (Ext.supports.Touch) {
            this.schedulerView.on('boxready', this.initDragTracker, this);
        } else {
            this.schedulerView.el.on('mousemove', this.initDragTracker, this, { single : true });
        }

        this.callParent([config]);
    },


    /**
     * Enable/disable the plugin
     * @param {Boolean} disabled True to disable this plugin
     */
    setDisabled : function (disabled) {
        this.disabled = disabled;

        if (this.hoverTip) {
            this.hoverTip.setDisabled(disabled);
        }

        if (this.dragTip) {
            this.dragTip.setDisabled(disabled);
        }
    },

    getProxy          : function () {
        if (!this.proxy) {
            this.proxy = this.template.append(this.schedulerView.getSecondaryCanvasEl(), {}, true);

            this.proxy.hide = function () {
                this.setStyle({
                    left : '-10000px',
                    top  : '-10000px'
                });
            };
        }
        return this.proxy;
    },

    // private
    onBeforeDragStart : function (tracker, e) {
        var s = this.schedulerView,
            t = e.getTarget('.' + s.timeCellCls, 5);

        if (t && this.isCreateAllowed(e) && (!e.event.touches || e.event.touches.length === 1)) {
            var resourceRecord = s.resolveResource(t);
            var dateTime = s.getDateFromDomEvent(e);

            if (!this.disabled && t && s.fireEvent('beforedragcreate', s, resourceRecord, dateTime, e) !== false) {

                // Save record if the user ends the drag outside the current row
                this.resourceRecord = resourceRecord;

                // Start time of the event to be created
                this.originalStart = dateTime;

                // Constrain the dragging within the current row schedule area
                this.resourceRegion = s.getScheduleRegion(this.resourceRecord, this.originalStart);

                // Save date constraints
                this.dateConstraints = s.getDateConstraints(this.resourceRecord, this.originalStart);

                // TODO apply xStep or yStep to drag tracker
                return true;
            }
        }
        return false;
    },

    isCreateAllowed : function (e) {
        return !e.getTarget(this.schedulerView.eventSelector);
    },

    // private
    onDragStart       : function () {
        var me = this,
            view = me.schedulerView,
            dragRegion = me.tracker.getRegion(),
            proxy = me.getProxy();

        this.dragging = true;

        if (this.hoverTip) {
            this.hoverTip.disable();
        }

        me.start = me.originalStart;
        me.end = me.start;
        me.originalScroll = view.getScroll();

        if (view.getMode() === 'horizontal') {
            me.rowBoundaries = {
                top    : me.resourceRegion.top,
                bottom : me.resourceRegion.bottom
            };

        } else {
            me.rowBoundaries = {
                left  : me.resourceRegion.left,
                right : me.resourceRegion.right
            };

        }

        Ext.apply(dragRegion, me.rowBoundaries);

        proxy.setBox(dragRegion);
        proxy.show();

        view.fireEvent('dragcreatestart', view, proxy);

        if (me.showDragTip) {
            me.dragTip.enable();
            me.dragTip.update(me.start, me.end, true);
            me.dragTip.show(proxy);

            // for some reason Ext set `visibility` to `hidden` after a couple of `.hide()` calls
            me.dragTip.setStyle('visibility', 'visible');
        }

        Sch.util.ScrollManager.activate(view, view.getMode() === 'horizontal' ? 'horizontal' : 'vertical');
    },


    // private
    onDrag            : function (tracker, e) {
        var me = this,
            view = me.schedulerView,
            dragRegion = me.tracker.getRegion(),
            dates = view.getStartEndDatesFromRegion(dragRegion, 'round'),
            message = '';

        if (!dates) {
            return;
        }

        me.start = dates.start || me.start;
        me.end = dates.end || me.end;

        var dc = me.dateConstraints;

        if (dc) {
            me.end = Sch.util.Date.constrain(me.end, dc.start, dc.end);
            me.start = Sch.util.Date.constrain(me.start, dc.start, dc.end);
        }

        me.valid = this.validatorFn.call(me.validatorFnScope || me, me.resourceRecord, me.start, me.end);

        if (me.valid && typeof me.valid !== 'boolean') {
            message = me.valid.message;
            me.valid = me.valid.valid;
        }

        // If users returns nothing, that's interpreted as valid
        me.valid = (me.valid !== false);

        if (me.showDragTip) {
            me.dragTip.update(me.start, me.end, me.valid, message);
        }

        Ext.apply(dragRegion, me.rowBoundaries);

        var scroll = view.getScroll();
        var proxy = this.getProxy();
        proxy.setBox(dragRegion);

        if (view.isHorizontal()) {
            proxy.setY(me.resourceRegion.top + me.originalScroll.top - scroll.top);
        }

    },

    eventSwallower : function (e) {
        e.stopPropagation();
        e.preventDefault();
    },

    // private
    onDragEnd         : function (tracker, e) {
        var me          = this,
            s           = me.schedulerView,
            doFinalize  = true,
            t           = e.getTarget(),
            el          = Ext.get(t);

        // When dragging, we don't want a regular scheduleclick to fire - swallow the coming "click" event
        el.on('click', this.eventSwallower);

        setTimeout(function () {
            el.un('click', me.eventSwallower);
        }, 100);

        me.dragging = false;

        if (me.showDragTip) {
            me.dragTip.disable();
        }

        if (!me.start || !me.end || (me.end - me.start <= 0)) {
            me.valid = false;
        }

        me.createContext = {
            start          : me.start,
            end            : me.end,
            resourceRecord : me.resourceRecord,
            e              : e,
            finalize       : function () {
                me.finalize.apply(me, arguments);
            }
        };

        if (me.valid) {
            doFinalize = s.fireEvent('beforedragcreatefinalize', me, me.createContext, e, this.getProxy()) !== false;
        }

        if (doFinalize) {
            me.finalize(me.valid);
        }

        Sch.util.ScrollManager.deactivate();
    },

    finalize : function (doCreate) {
        var context = this.createContext;
        var schedulerView = this.schedulerView;

        if (doCreate) {
            var ev = Ext.create(schedulerView.eventStore.model);

            // HACK, for the Gantt chart assignments to work properly - we need the task to be in the task store before assigning it
            // to the resource, same reasons apply if event store uses assignment store to store assignment relations
            // between events and resources.
            if (Ext.data.TreeStore && schedulerView.eventStore instanceof Ext.data.TreeStore) {
                ev.set('leaf', true);
                schedulerView.eventStore.append(ev);
            }
            else if (!!schedulerView.eventStore.getAssignmentStore()) {
                schedulerView.eventStore.append(ev);
            }

            ev.assign(context.resourceRecord);
            ev.setStartEndDate(context.start, context.end);
            schedulerView.fireEvent('dragcreateend', schedulerView, ev, context.resourceRecord, context.e, this.getProxy());
        } else {
            this.proxy.hide();
        }

        this.schedulerView.fireEvent('afterdragcreate', schedulerView, this.getProxy());

        if (this.hoverTip) {
            this.hoverTip.enable();
        }
    },

    dragging : false,

    // Lazy setup of additional functionality
    initDragTracker : function () {
        var me              = this,
            isTouch = Ext.supports.Touch,
            view = me.schedulerView;

        var config = Ext.apply({
            el                 : view.el,
            // defer drag create on touch devices since scrolling is the default action
            deferredActivation : isTouch ? 1000 : false,
            tolerance : me.dragTolerance,
            listeners : {
                mousedown       : me.verifyLeftButtonPressed,
                beforedragstart : me.onBeforeDragStart,
                dragstart       : me.onDragStart,
                drag            : me.onDrag,
                dragend         : me.onDragEnd,
                scope           : me
            }
        }, this.trackerConfig);

        // disable tips for touch mode
        if (isTouch) {
            this.showDragTip    = false;
            this.showHoverTip   = false;
            this.dragTip        = null;
            this.hoverTip       = null;
        } else {
            this.setupTooltips();
        }

        me.tracker = new Sch.util.DragTracker(config);
    },

    setupTooltips : function () {
        var me = this,
            sv = me.schedulerView;

        if (this.showDragTip) {
            var dragTip     = this.dragTip;

            if (dragTip instanceof Ext.tip.ToolTip) {
                Ext.applyIf(dragTip, { schedulerView   : sv });

                dragTip.on('beforeshow', function () {
                    return me.dragging;
                });
            } else {
                this.dragTip = new Sch.tooltip.Tooltip(Ext.apply({
                    cls             : 'sch-dragcreate-tip',
                    schedulerView   : sv,
                    listeners       : {
                        beforeshow      : function () {
                            return me.dragging;
                        }
                    }
                }, dragTip));
            }
        }

        if (me.showHoverTip) {
            var hoverTip     = me.hoverTip;

            if (hoverTip instanceof Ext.tip.ToolTip) {
                Ext.applyIf(hoverTip, {
                    schedulerView   : sv
                });
            } else {
                me.hoverTip = Ext.ComponentManager.create(Ext.applyIf({
                    renderTo        : Ext.getBody(),
                    target          : sv.el,
                    schedulerView   : sv
                }, hoverTip), 'scheduler_hovertip');
            }
        }
    },

    verifyLeftButtonPressed : function (dragTracker, e) {
        return e.button === 0;
    },


    onSchedulerDestroy : function () {
        if (this.hoverTip) {
            this.hoverTip.destroy();
        }

        if (this.dragTip) {
            this.dragTip.destroy();
        }

        if (this.tracker) {
            this.tracker.destroy();
        }

        if (this.proxy) {
            Ext.destroy(this.proxy);
            this.proxy = null;
        }
    }
});
