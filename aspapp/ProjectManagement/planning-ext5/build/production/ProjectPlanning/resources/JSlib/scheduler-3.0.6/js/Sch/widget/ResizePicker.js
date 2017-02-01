/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.widget.ResizePicker
@private
@extends Ext.Panel

Size picker widget for changing column width/rows height.

*/
Ext.define('Sch.widget.ResizePicker', {
    extend          : 'Ext.Panel',
    alias           : 'widget.dualrangepicker',
    width           : 200,
    height          : 200,
    border          : true,
    collapsible     : false,
    bodyStyle       : 'position:absolute; margin:5px',

    verticalCfg     : {
        height      : 120,
        value       : 24,
        increment   : 2,
        minValue    : 20,
        maxValue    : 80,
        reverse     : true,
        disabled    : true
    },

    horizontalCfg   : {
        width       : 120,
        value       : 100,
        minValue    : 25,
        increment   : 5,
        maxValue    : 200,
        disable     : true
    },

    initComponent : function () {
        var me = this;

        //me.addEvents('change', 'changecomplete', 'select');

        me.horizontalCfg.value  = me.dialogConfig.columnWidth;
        me.verticalCfg.value    = me.dialogConfig.rowHeight;
        me.verticalCfg.disabled = me.dialogConfig.scrollerDisabled || false;

        me.dockedItems = [
            me.vertical     = new Ext.slider.Single(Ext.apply({
                dock        : 'left',
                style       : 'margin-top:10px',
                vertical    : true,
                listeners   : {
                    change          : me.onSliderChange,
                    changecomplete  : me.onSliderChangeComplete,
                    scope           : me
                }
            }, me.verticalCfg)),

            me.horizontal   = new Ext.slider.Single(Ext.apply({
                dock        : 'top',
                style       : 'margin-left:28px',
                listeners   : {
                    change          : me.onSliderChange,
                    changecomplete  : me.onSliderChangeComplete,
                    scope           : me
                }
            }, me.horizontalCfg))
        ];

        me.callParent(arguments);
    },

    afterRender : function () {
        var me = this;

        me.addCls('sch-ux-range-picker');
        me.valueHandle = this.body.createChild({
            cls : 'sch-ux-range-value',
            cn  : {
                tag: 'span'
            }
        });
        me.valueSpan = this.valueHandle.down('span');

        var dd = new Ext.dd.DD(this.valueHandle);

        Ext.apply(dd, {
            startDrag   : function () {
                me.dragging = true;
                this.constrainTo(me.body);
            },
            onDrag      : function () {
                me.onHandleDrag.apply(me, arguments);
            },
            endDrag     : function () {
                me.onHandleEndDrag.apply(me, arguments);
                me.dragging = false;
            },
            scope       : this
        });

        this.setValues(this.getValues());
        this.callParent(arguments);

        this.body.on('click', this.onBodyClick, this);
    },

    onBodyClick: function (e, t) {
        var xy = [e.getXY()[0] - 8 - this.body.getX(), e.getXY()[1] - 8 - this.body.getY()];

        this.valueHandle.setLeft(Ext.Number.constrain(xy[0], 0, this.getAvailableWidth()));
        this.valueHandle.setTop(Ext.Number.constrain(xy[1], 0, this.getAvailableHeight()));

        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]));
        this.onSliderChangeComplete();
    },

    getAvailableWidth: function () {
        return this.body.getWidth() - 18;
    },

    getAvailableHeight: function () {
        return this.body.getHeight() - 18;
    },

    onHandleDrag: function () {
        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]));
    },

    onHandleEndDrag: function () {
        this.setValues(this.getValuesFromXY([this.valueHandle.getLeft(true), this.valueHandle.getTop(true)]));
    },

    getValuesFromXY: function (xy) {
        var xFraction = xy[0] / this.getAvailableWidth();
        var yFraction = xy[1] / this.getAvailableHeight();

        var horizontalVal = Math.round((this.horizontalCfg.maxValue - this.horizontalCfg.minValue) * xFraction);
        var verticalVal = Math.round((this.verticalCfg.maxValue - this.verticalCfg.minValue) * yFraction) + this.verticalCfg.minValue;

        return [horizontalVal + this.horizontalCfg.minValue, verticalVal];
    },

    getXYFromValues: function (values) {
        var xRange = this.horizontalCfg.maxValue - this.horizontalCfg.minValue;
        var yRange = this.verticalCfg.maxValue - this.verticalCfg.minValue;

        var x = Math.round((values[0] - this.horizontalCfg.minValue) * this.getAvailableWidth() / xRange);

        var verticalVal = values[1] - this.verticalCfg.minValue;
        var y = Math.round(verticalVal * this.getAvailableHeight() / yRange);

        return [x, y];
    },

    updatePosition: function () {
        var values = this.getValues();
        var xy = this.getXYFromValues(values);

        this.valueHandle.setLeft(Ext.Number.constrain(xy[0], 0, this.getAvailableWidth()));
        if (this.verticalCfg.disabled){
            this.valueHandle.setTop(this.dialogConfig.rowHeight);
        } else {
            this.valueHandle.setTop(Ext.Number.constrain(xy[1], 0, this.getAvailableHeight()));
        }

        this.positionValueText();
        this.setValueText(values);
    },

    positionValueText: function () {
        var handleTop = this.valueHandle.getTop(true);
        var handleLeft = this.valueHandle.getLeft(true);

        this.valueSpan.setLeft(handleLeft > 30 ? -30 : 10);
        this.valueSpan.setTop(handleTop > 10 ? -20 : 20);
    },

    setValueText: function(values){
        if (this.verticalCfg.disabled) values[1] = this.dialogConfig.rowHeight;
        this.valueSpan.update('[' + values.toString() + ']');
    },

    setValues: function (values) {
        this.horizontal.setValue(values[0]);

        if (this.verticalCfg.reverse) {
            if (!this.verticalCfg.disabled) this.vertical.setValue(this.verticalCfg.maxValue + this.verticalCfg.minValue - values[1]);
        } else {
            if (!this.verticalCfg.disabled) this.vertical.setValue(values[1]);
        }

        if (!this.dragging) {
            this.updatePosition();
        }
        this.positionValueText();

        this.setValueText(values);
    },

    getValues: function () {
        if (!this.verticalCfg.disabled) {
            var verticalVal = this.vertical.getValue();

            if (this.verticalCfg.reverse) {
                verticalVal = this.verticalCfg.maxValue - verticalVal + this.verticalCfg.minValue;
            }

            return [this.horizontal.getValue(), verticalVal];

        }

        return [this.horizontal.getValue()];
    },

    onSliderChange: function () {
        this.fireEvent('change', this, this.getValues());

        if (!this.dragging) {
            this.updatePosition();
        }
    },

    onSliderChangeComplete: function () {
        this.fireEvent('changecomplete', this, this.getValues());
    },

    afterLayout: function () {
        this.callParent(arguments);
        this.updatePosition();
    }
});
