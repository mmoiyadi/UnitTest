/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.tooltip.HoverTip
 * HoverTip is a class that represents a tooltip with clock and time which updates as the mouse pointer moves over the schedule area.
 */
Ext.define('Sch.tooltip.HoverTip', {
    extend          : 'Ext.tip.ToolTip',
    
    alias           : 'widget.scheduler_hovertip',
    
    requires        : [
        'Sch.tooltip.ClockTemplate'
    ],
    
    trackMouse      : true,
    
    bodyCls         : 'sch-hovertip',
    
    messageTpl      : '<div class="sch-hovertip-msg">{message}</div>',
    
    autoHide        : false,
    
    dismissDelay    : 1000,
    
    showDelay       : 300,
    
    /**
     * @cfg {Sch.mixin.SchedulerView} schedulerView View instance to bind this tooltip to
     * @required
     */
    schedulerView   : null,
    
    initComponent   : function () {
        var me = this;
        
        var view = me.schedulerView;
        
        me.clockTpl = new Sch.tooltip.ClockTemplate();
        
        me.messageTpl = new Ext.XTemplate(me.messageTpl);
        
        me.lastTime = null;
        
        me.lastResource = null;
        
        me.callParent(arguments);
        
        me.on('beforeshow', me.tipOnBeforeShow, me);
        
        view.mon(view.el, {
            mouseleave : function () {
                me.hide();
            },
            mousemove  : me.handleMouseMove,
            scope      : me
        });
    },
    
    handleMouseMove       : function (e) {
        var me      = this;
        
        var view    = me.schedulerView;
        
        if (me.disabled) {
            return;
        }

        if (e.getTarget('.' + view.timeCellCls, 5) && !e.getTarget(view.eventSelector)) {
            var time = view.getDateFromDomEvent(e, 'floor');

            if (time) {
                var resourceRecord = view.resolveResource(e.getTarget());
                
                if (time - me.lastTime !== 0 || resourceRecord !== me.lastResource) {
                    me.lastResource = resourceRecord;
                    
                    me.updateHoverTip(time, e);

                    if (me.hidden) { // HACK, find better solution
                        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
                            me.addCls('sch-day-resolution');
                            me.removeCls('sch-hour-resolution');
                        } else {
                            me.removeCls('sch-day-resolution');
                            me.addCls('sch-hour-resolution');
                        }
                        me.show();
                    }
                }
            } else {
                me.hide();
                me.lastTime = null;
                me.lastResource = null;
            }
        } else {
            me.hide();
            me.lastTime = null;
            me.lastResource = null;
        }
    },
    
    /**
     * Override this to render custom text to default hover tip
     * @param {Date} date
     * @param {Ext.EventObject} e Browser event
     * @return {String}
     */
    getText : function () {},

    // private
    updateHoverTip    : function (date, e) {
        if (date) {
            var clockHtml = this.clockTpl.apply({ 
                date : date,
                text : this.schedulerView.getFormattedDate(date)
            });
            
            var messageHtml = this.messageTpl.apply({
                message : this.getText(date, e)
            });
            
            this.update(clockHtml + messageHtml);
            
            this.lastTime = date;
        }
    },
    
    tipOnBeforeShow : function (tip) {
        return !this.disabled && this.lastTime !== null;
    }
});
