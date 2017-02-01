/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.template.Event

 */
Ext.define("Sch.template.Event", {
    extend : 'Ext.XTemplate',

    eventPrefix   : null,

    // 'none', 'start', 'end' or 'both'
    resizeHandles : null,
    resizeTpl     : '<div class="sch-resizable-handle sch-resizable-handle-{0}"></div>',

    constructor   : function (config) {

        Ext.apply(this, config);

        var startResizeHandles = (this.resizeHandles === 'start' || this.resizeHandles === 'both' ? '<div class="sch-resizable-handle sch-resizable-handle-start"></div>' : '');
        var endResizeHandles = (this.resizeHandles === 'end' || this.resizeHandles === 'both' ? '<div class="sch-resizable-handle sch-resizable-handle-end"></div>' : '');

        this.callParent([
            '<tpl for=".">' +
                '<div unselectable="on" tabindex="-1" id="' + this.eventPrefix + '{id}" style="right:{right}px;left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class="sch-event ' + Ext.baseCSSPrefix + 'unselectable {internalCls} {cls}">' +
                    startResizeHandles +
                    '<div unselectable="on" class="sch-event-inner {iconCls}">' +
                        '{body}' +
                    '</div>' +
                    endResizeHandles +
                '</div>' +
            '</tpl>'
        ]);
    }

});
