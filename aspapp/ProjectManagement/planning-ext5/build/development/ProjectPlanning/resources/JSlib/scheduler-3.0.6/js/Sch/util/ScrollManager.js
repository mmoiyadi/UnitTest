/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class 
 * @static
 * @private
 * Private utility class for dealing with scroll triggering based on various mousemove events in the UI
 */
Ext.define('Sch.util.ScrollManager', {
    singleton      : true,

    vthresh        : 25,
    hthresh        : 25,
    increment      : 100,
    frequency      : 500,
    animate        : true,
    animDuration   : 200,
    activeCmp      : null,
    activeEl       : null,
    targetScroller : null,
    scrollElRegion : null,
    scrollProcess  : {},
    pt             : null,
    scrollWidth    : null,
    scrollHeight   : null,

    // "horizontal", "vertical" or "both"
    direction		: 'both',

    constructor : function () {
        this.doScroll = Ext.Function.bind(this.doScroll, this);
    },

    triggerRefresh : function () {

        if (this.activeEl) {

            this.refreshElRegion();

            this.clearScrollInterval();
            this.onMouseMove();
        }
    },

    doScroll : function () {
        var scrollProcess   = this.scrollProcess,
            scrollProcessCmp = scrollProcess.cmp,
            dir              = scrollProcess.dir[0],
            increment        = this.increment,
            scrollLeft       = this.activeCmp.getScrollX(),
            scrollTop        = this.activeCmp.getScrollY();

        // Make sure we don't scroll too far
        if (dir === 'r') {
            increment = Math.min(increment, this.scrollWidth - scrollLeft - this.activeEl.dom.clientWidth);
        } else if (dir === 'd') {
            increment = Math.min(increment, this.scrollHeight - scrollTop - this.activeEl.dom.clientHeight);
        }

        increment = Math.max(increment, 0);
        var deltaX = 0, deltaY = 0;

        if (dir === 'r') deltaX = increment;
        if (dir === 'l') deltaX = -increment;
        if (dir === 'u') deltaY = -increment;
        if (dir === 'd') deltaY = increment;

        scrollProcessCmp.scrollBy(deltaX, deltaY, {
            duration : this.animDuration,
            callback : this.triggerRefresh,
            scope    : this
        });
    },

    clearScrollInterval : function () {
        var scrollProcess = this.scrollProcess;

        if (scrollProcess.id) {
            clearTimeout(scrollProcess.id);
        }

        scrollProcess.id = 0;
        scrollProcess.cmp = null;
        scrollProcess.dir = "";
    },

	isScrollAllowed : function(dir){
		
		switch(this.direction){
			case 'both':
				return true;
				
			case 'horizontal':
				return dir === 'right' || dir === 'left';	
		
			case 'vertical':
				return dir === 'up' || dir === 'down';
				
			default:
				throw 'Invalid direction: ' + this.direction;
		
		}
		
	},

    startScrollInterval : function (cmp, dir) {

       if(!this.isScrollAllowed(dir)){
			return;
       }
        
        this.clearScrollInterval();
        this.scrollProcess.cmp = cmp;
        this.scrollProcess.dir = dir;

        this.scrollProcess.id = setTimeout(this.doScroll, this.frequency);
    },

    onMouseMove : function (e) {

        var pt = e ? e.getPoint() : this.pt,
            x = pt.x,
            y = pt.y,
            scrollProcess = this.scrollProcess,
            scrollLeft    = this.activeCmp.getScrollX(),
            scrollTop     = this.activeCmp.getScrollY(),
            id,
            cmp = this.activeCmp,
            el = this.activeEl,
            region = this.scrollElRegion,
            elDom = el.dom,
            me = this;

        this.pt = pt;

        if (region && region.contains(pt) && el.isScrollable()) {
            if (region.bottom - y <= me.vthresh && (this.scrollHeight - scrollTop - elDom.clientHeight > 0)) {

                if (scrollProcess.cmp != cmp) {
                    this.startScrollInterval(this.activeCmp, "down");
                }
                return;
            } else if (region.right - x <= me.hthresh && (this.scrollWidth - scrollLeft - elDom.clientWidth > 0) ) {

                if (scrollProcess.cmp != cmp) {
                    this.startScrollInterval(this.activeCmp, "right");
                }
                return;
            } else if (y - region.top <= me.vthresh && scrollTop > 0) {
                if (scrollProcess.cmp != cmp) {
                    this.startScrollInterval(this.activeCmp, "up");
                }
                return;
            } else if (x - region.left <= me.hthresh && scrollLeft > 0) {
                if (scrollProcess.cmp != cmp) {
                    this.startScrollInterval(this.activeCmp, "left");
                }
                return;
            }
        }

        this.clearScrollInterval();
    },

    refreshElRegion : function () {
        this.scrollElRegion = this.activeEl.getRegion();
    },

    // Pass an element, and optionally a direction ("horizontal", "vertical" or "both")
    activate : function (cmp, direction) {
        
        this.direction = direction || 'both';

        this.activeCmp = cmp;
        this.activeEl  = cmp.getEl();

        if (cmp.scrollManager) {
            this.targetScroller = cmp.scrollManager.scroller;

            this.scrollWidth  = this.targetScroller.getMaxPosition().x;
            this.scrollHeight = this.targetScroller.getMaxPosition().y;
        } else {
            this.scrollWidth  = this.activeEl.dom.scrollWidth;
            this.scrollHeight = this.activeEl.dom.scrollHeight;
        }

        this.refreshElRegion();
        this.activeEl.on('mousemove', this.onMouseMove, this);
    },

    deactivate : function () {
        this.clearScrollInterval();

        this.activeEl.un('mousemove', this.onMouseMove, this);
        this.targetScroller = this.activeEl = this.activeCmp = this.scrollElRegion = this.scrollWidth = this.scrollHeight = null;

        this.direction = 'both';
    }
});
