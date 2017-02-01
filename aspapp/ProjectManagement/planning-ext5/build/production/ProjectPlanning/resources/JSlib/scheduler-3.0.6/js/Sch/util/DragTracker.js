/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.util.DragTracker
 * @private
 *
 * Simple drag tracker with an extra useful getRegion method
 **/
Ext.define('Sch.util.DragTracker', {
    extend : 'Ext.dd.DragTracker',

    requires : [
        'Ext.util.Region'
    ],

    /**
     * @cfg {Number} xStep
     * The number of horizontal pixels to snap to when dragging
     */
    xStep : 1,

    /**
     * @cfg {Number} yStep
     * The number of vertical pixels to snap to when dragging
     */
    yStep : 1,

    /**
     * @cfg {Number} deferredActivation
     * The number of ms to defer the activation of the drag tracker
     */
    deferredActivation : 0,

    constructor : function () {

        this.callParent(arguments);

        // ScrollManager might trigger a scroll as we are dragging, trigger manual onMouseMove in this case
        this.on('dragstart', function () {
            var el = this.el;

            var listeners = {
                scroll     : this.onMouseMove,
                // We only care about single touches
                pinchstart : this.onMouseUp,
                scope      : this
            };

            el.on(listeners);

            this.on('dragend', function () {
                el.un(listeners);
            }, this, {single : true});
        });

        this.moveListener = {
            pinchstart : this.abortWait,
            touchend   : this.abortWait,
            mouseup    : this.abortWait,
            mousemove  : this.onMoveWhileWaiting,
            scope      : this,
            capture    : true
        };
    },

    /**
     * Set the number of horizontal pixels to snap to when dragging
     * @param {Number} step
     */
    setXStep : function (step) {
        this.xStep = step;
    },

    startScroll : null,

    deferTimer     : null,
    deferTolerance : 10,

    moveListener : null,

    /**
     * Set the number of vertical pixels to snap to when dragging
     * @param {Number} step
     */
    setYStep : function (step) {
        this.yStep = step;
    },

    onMoveWhileWaiting : function (e, t) {

        var xy = e.getXY();
        var s = this.startXY;

        if (Math.max(Math.abs(s[0] - xy[0]), Math.abs(s[1] - xy[1])) > this.deferTolerance) {
            this.abortWait();
            this.onMouseUp(e);
        }
    },

    abortWait : function () {
        clearTimeout(this.deferTimer);
        this.deferTimer = null;

        Ext.getDoc().un(this.moveListener);
    },

    getRegion   : function () {
        var startXY = this.startXY,
            currentScroll = this.el.getScroll(),
            currentXY = this.getXY(),
            currentX = currentXY[0],
            currentY = currentXY[1],
            scrollLeftDelta = currentScroll.left - this.startScroll.left,
            scrollTopDelta = currentScroll.top - this.startScroll.top,
            startX = startXY[0] - scrollLeftDelta,
            startY = startXY[1] - scrollTopDelta,
            minX = Math.min(startX, currentX),
            minY = Math.min(startY, currentY),
            width = Math.abs(startX - currentX),
            height = Math.abs(startY - currentY);

        return new Ext.util.Region(minY, minX + width, minY + height, minX);
    },


    // @OVERRIDE
    onMouseDown : function (e, target) {

        // Ignore multi touches
        if (e.event.touches && e.event.touches.length > 1) return;

        // HACK - Ext calls stopPropagation which prevents global mousedown listeners on the document/body
        // which messes up blur of EventEditor plugin. See event editor tests for reference
        e.stopPropagation = Ext.emptyFn;

        this.startXY = e.getXY();

        if (this.deferredActivation) {
            var me = this;

            Ext.getDoc().on(this.moveListener);

            this.deferTimer = setTimeout(function () {
                var old = me.deferredActivation;

                // Detect moves and abort if exceeding threshold
                Ext.getDoc().un(me.moveListener);

                me.deferredActivation = false;
                me.onMouseDown(e, target);
                me.deferredActivation = old;
            }, this.deferredActivation);

            return;
        }

        this.callParent([e, target]);

        this.lastXY = this.startXY;
        this.startScroll = this.el.getScroll();
    },

    // @OVERRIDE
    // Adds support for snapping to increments while dragging
    onMouseMove : function (e, target) {
        // Bug fix required for IE
        if (this.active && e.type === 'mousemove' && Ext.isIE9m && !e.browserEvent.button) {
            e.preventDefault();
            this.onMouseUp(e);
            return;
        }

        e.preventDefault();

        var xy = e.type === 'scroll' ? this.lastXY : e.getXY(),
            s = this.startXY;

        if (!this.active) {
            if (Math.max(Math.abs(s[0] - xy[0]), Math.abs(s[1] - xy[1])) > this.tolerance) {
                this.triggerStart(e);
            } else {
                return;
            }
        }

        var x = xy[0],
            y = xy[1];

        // TODO handle if this.el is scrolled
        if (this.xStep > 1) {
            x -= this.startXY[0];
            x = Math.round(x / this.xStep) * this.xStep;
            x += this.startXY[0];
        }

        if (this.yStep > 1) {
            y -= this.startXY[1];
            y = Math.round(y / this.yStep) * this.yStep;
            y += this.startXY[1];
        }

        var snapping = this.xStep > 1 || this.yStep > 1;

        if (!snapping || x !== xy[0] || y !== xy[1]) {
            this.lastXY = [x, y];

            if (this.fireEvent('mousemove', this, e) === false) {
                this.onMouseUp(e);
            } else {
                this.onDrag(e);
                this.fireEvent('drag', this, e);
            }
        }
    }
});
