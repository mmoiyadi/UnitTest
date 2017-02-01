/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// https://www.sencha.com/forum/showthread.php?301258-Tooltip-should-not-ignore-mouseover-event-on-touch-devices
Ext.define('Sch.patches.ToolTip', {
    extend  : 'Sch.util.Patch',
    
    requires   : ['Ext.tip.ToolTip'],
    target     : 'Ext.tip.ToolTip',
    
    minVersion : '5.1.0',
    
    overrides : {
        setTarget: function(target) {
            var me = this,
                t = Ext.get(target),
                tg;
    
            if (me.target) {
                tg = Ext.get(me.target);
                me.mun(tg, {
                    mouseover: me.onTargetOver,
                    tap: me.onTargetOver,
                    mouseout: me.onTargetOut,
                    mousemove: me.onMouseMove,
                    scope: me
                });
            }
    
            me.target = t;
            if (t) {
                me.mon(t, {
                    mouseover: me.onTargetOver,
                    tap: me.onTargetOver,
                    mouseout: me.onTargetOut,
                    mousemove: me.onMouseMove,
                    scope: me
                });
            }
            if (me.anchor) {
                me.anchorTarget = me.target;
            }
        }
    }
});