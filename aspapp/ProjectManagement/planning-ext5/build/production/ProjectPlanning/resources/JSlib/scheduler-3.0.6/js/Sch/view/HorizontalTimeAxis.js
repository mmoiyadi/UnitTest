/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
* @class Sch.view.HorizontalTimeAxis
* @extends Ext.util.Observable
* @private
*
* A visual representation of the time axis described in the {@link Sch.preset.ViewPreset#headerConfig headerConfig}. 
* Normally you should not interact with this class directly.
*/
Ext.define("Sch.view.HorizontalTimeAxis", {
    extend: 'Ext.util.Observable',

    requires: [
        'Ext.XTemplate'
    ],

    /**
    * @cfg {Boolean} trackHeaderOver `true` to highlight each header cell when the mouse is moved over it. 
    */
    trackHeaderOver: true,

    /**
    * @cfg {Number} compactCellWidthThreshold The minimum width for a bottom row header cell to be considered 'compact', which adds a special CSS class to the row (for special styling). 
    *            Defaults to 15px.
    */
    compactCellWidthThreshold: 15,

    baseCls : 'sch-column-header',
    tableCls : 'sch-header-row',

    // a 2nd template for the 2nd mode, w/o `containerEl`
    headerHtmlRowTpl:
        '<table border="0" cellspacing="0" cellpadding="0" style="width: {totalWidth}px; {tstyle}" class="{{tableCls}} sch-header-row-{position} {cls}">' +
            '<thead>' +
                '<tr>' +
                    '<tpl for="cells">' +
                        '<td class="{{baseCls}} {headerCls}" style="position : static; text-align: {align}; width: {width}px; {style}" tabIndex="0"' +
                            'headerPosition="{parent.position}" headerIndex="{[xindex-1]}">' +
                                '<div class="sch-simple-timeheader">{header}</div>' +
                        '</td>' +
                    '</tpl>' +
                '</tr>' +
            '</thead>' +
        '</table>',
        
    // TODO DOCS
    model           : null,

    // TODO DOCS
    hoverCls        : '',
    
    // optional
    // this view class will work in 2 modes - one with provided `containerEl` and one w/o it
    containerEl     : null,

    // Only used for IE10 in Touch Scheduler since display:box is too buggy in IE.
    height : null,

    /**
     * @event timeheaderclick
     * Fires after a click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The start date of the header cell
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event timeheaderdblclick
     * Fires after a double click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The end date of the header cell
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event timeheadercontextmenu
     * Fires after a right click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The start date of the header cell
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event refresh
     * Fires after the view has been updated, (after the time axis has been reconfigured,
     * or as a result of time column width change or available schedule width change).
     * @param {Sch.view.HorizontalTimeAxis} timeAxisView The time axis view
     */

    constructor: function (config) {
        var me = this;
        var isTouch = !!Ext.versions.touch;
        var clickEventName = isTouch ? 'tap' : 'click';

        Ext.apply(this, config);
        me.callParent(arguments);

        me.model.on('update', me.onModelUpdate, this, { priority : 5 });

        me.containerEl = Ext.get(me.containerEl);

        if (!(me.headerHtmlRowTpl instanceof Ext.Template)) {
            me.headerHtmlRowTpl = me.headerHtmlRowTpl.replace('{{baseCls}}', this.baseCls).replace('{{tableCls}}', this.tableCls);
            me.headerHtmlRowTpl = new Ext.XTemplate(me.headerHtmlRowTpl);
        }

        if (me.trackHeaderOver && me.hoverCls) {
            me.containerEl.on({
                mousemove   : me.highlightCell,
                delegate    : '.sch-column-header',
                scope       : me
            });

            me.containerEl.on({
                mouseleave  : me.clearHighlight,
                scope       : me
            });
        }

        var listenerCfg = {
            scope       : this, 
            delegate    : '.sch-column-header'
        };

        if (isTouch) {
            listenerCfg.tap = this.onElClick('tap');
            listenerCfg.doubletap = this.onElClick('doubletap');

        } else {
            listenerCfg.click = this.onElClick('click');
            listenerCfg.dblclick = this.onElClick('dblclick');
            listenerCfg.contextmenu = this.onElClick('contextmenu');
        }

        me._listenerCfg = listenerCfg;
        if (me.containerEl) me.containerEl.on(listenerCfg);
    },

    destroy : function() {
        var me = this;
        
        if (me.containerEl) { 
            me.containerEl.un(me._listenerCfg);
            
            me.containerEl.un({
                mousemove   : me.highlightCell,
                delegate    : '.sch-simple-timeheader',
                scope       : me
            });
    
            me.containerEl.un({
                mouseleave: me.clearHighlight,
                scope: me
            });
        }

        me.model.un({
            update  : me.onModelUpdate,
            scope   : me
        });
    },

    onModelUpdate: function () {
        this.render();
    },
    
    
    getHTML : function (header, meta, column) {
        var columnConfig        = this.model.getColumnConfig();
        var totalWidth          = this.model.getTotalWidth();
        var nbrRows             = Ext.Object.getKeys(columnConfig).length;
        var rowHeight           = this.height ? this.height / nbrRows : 0;
        var html                = '';
        
        var currentCellWidth;
        
        if (columnConfig.top) {
            this.embedCellWidths(columnConfig.top);
            
            html                += this.headerHtmlRowTpl.apply({
                totalWidth      : totalWidth,
                cells           : columnConfig.top,
                position        : 'top',
                tstyle          : 'border-top : 0;' + (rowHeight ?  'height:' + rowHeight + 'px' : '')
            });
        }
        
        if (columnConfig.middle) {
            this.embedCellWidths(columnConfig.middle);

            html                += this.headerHtmlRowTpl.apply({
                totalWidth      : totalWidth,
                cells           : columnConfig.middle,
                position        : 'middle',
                tstyle          : (columnConfig.top ? '' : 'border-top : 0;') + (rowHeight ?  'height:' + rowHeight + 'px' : ''),
                cls             : !columnConfig.bottom && this.model.getTickWidth() <= this.compactCellWidthThreshold ? 'sch-header-row-compact' : ''
            });
        }
        
        if (columnConfig.bottom) {
            this.embedCellWidths(columnConfig.bottom);
            
            html                += this.headerHtmlRowTpl.apply({
                totalWidth      : totalWidth,
                cells           : columnConfig.bottom,
                position        : 'bottom',
                tstyle          : (rowHeight ? 'height:' + rowHeight + 'px' : ''),
                cls             : this.model.getTickWidth() <= this.compactCellWidthThreshold ? 'sch-header-row-compact' : ''
            });
        }

        return html + '<div class="sch-header-secondary-canvas"></div>';
    },
    

    // Outputs the tables and cells based on the header row config in the active viewPreset
    render: function () {
        if (!this.containerEl) return;
        
        var innerCt     = this.containerEl,
            ctDom       = innerCt.dom,
            oldDisplay  = ctDom.style.display,
            columnConfig = this.model.getColumnConfig(),
            parent      = ctDom.parentNode;

        ctDom.style.display = 'none';
        parent.removeChild(ctDom);

        var renderData = this.getHTML();

        ctDom.innerHTML = renderData;

        if (!columnConfig.top && !columnConfig.middle) {
            this.containerEl.addCls('sch-header-single-row');
        } else {
            this.containerEl.removeCls('sch-header-single-row');
        }

        parent && parent.appendChild(ctDom);
        ctDom.style.display = oldDisplay;
        
        this.fireEvent('refresh', this);
    },

    embedCellWidths : function (cells) {
        // For desktop only, flags such as Ext.isSafari only exist in Ext JS (in touch it's set in Ext.os)
        var widthAdjust     = (Ext.isIE7 || (Ext.isSafari && !Ext.supports.Touch)) ? 1 : 0;

        for (var i = 0; i < cells.length; i++) {
            var cell        = cells[ i ];
            var width       = this.model.getDistanceBetweenDates(cell.start, cell.end);
            
            if (width) {
                cell.width  = width - (i ? widthAdjust : 0);
            } else {
                cell.width  = 0;
                cell.style  = 'display: none';
            }
        }
    },
    

    // private
    onElClick: function(eventName) {
        return function (event, target) { 
            // Normalize ST vs Ext JS (Ext passes the delegated target as the target argument, ST passes the clicked DOM node)
            target = event.delegatedTarget || target;
            
            var position        = Ext.fly(target).getAttribute('headerPosition'),
                index           = Ext.fly(target).getAttribute('headerIndex'),
                headerConfig    = this.model.getColumnConfig()[position][index];
        
            this.fireEvent('timeheader' + eventName, this, headerConfig.start, headerConfig.end, event);
        };
    },


    highlightCell: function (e, cell) {
        var me = this;

        if (cell !== me.highlightedCell) {
            me.clearHighlight();
            me.highlightedCell = cell;
            Ext.fly(cell).addCls(me.hoverCls);
        }
    },

    clearHighlight: function () {
        var me = this,
            highlighted = me.highlightedCell;

        if (highlighted) {
            Ext.fly(highlighted).removeCls(me.hoverCls);
            delete me.highlightedCell;
        }
    }
    /* EOF Proxied model methods */
});


