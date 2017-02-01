/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.plugin.CellPlugin
@extends Ext.AbstractPlugin
@mixin Ext.util.Observable

This plugin allow user to navigate through cells using arrow keys or simple clicking, creating/editing events
and perform selection. Plugin is built on "1 cell - 1 event" logic and tested over that,
using this plugin under different conditions may lead to unpredictable results.

NOTES:
1) supports only horizontal view
2) Tested mainly for 'table' event layout, 'horizontal' works, but you may experience some glitches

*/
Ext.define('Sch.plugin.CellPlugin', {
    extend          : 'Ext.AbstractPlugin',
    alias           : 'plugin.scheduler_cellplugin',

    requires        : ['Ext.form.field.Base'],

    mixins          : {
        observable      : 'Ext.util.Observable'
    },

    /**
     * @cfg {String} frameCls CSS class of the plugin container div.
     */
    frameCls        : 'sch-cellplugin-highlighter',

    /**
     * @cfg {Ext.Template/Ext.XTemplate} frameTemplate A template providing markup for plugin.
     */
    frameTemplate   : new Ext.Template([
        '<div class="{cls} active" style="width: {width}px; height: {height}px;">',
            '<div class="sch-cellplugin-border sch-cellplugin-border-horizontal sch-cellplugin-border-top"></div>',
            '<div class="sch-cellplugin-border sch-cellplugin-border-horizontal sch-cellplugin-border-bottom"></div>',
            '<div class="sch-cellplugin-border sch-cellplugin-border-vertical sch-cellplugin-border-left"></div>',
            '<div class="sch-cellplugin-border sch-cellplugin-border-vertical sch-cellplugin-border-right"></div>',
        '</div>'
    ]),

    /**
     * @cfg {String/Object/Ext.form.field.Field} editor Configuration for the {@link Sch.field.CellEditor}.
     *
     * Examples:
     *
     *      @example
     *      // Simple string config:
     *      var plugin1 = new Sch.plugin.CellPlugin({
     *          editor  : 'Ext.form.field.Text'
     *      });
     *
     *      // {@link Sch.field.CellEditor} config
     *      var plugin2 = new Sch.plugin.CellPlugin({
     *          editor  : {
     *              dateFormat  : 'H:i',
     *              divider     : ' '
     *          }
     *      });
     *
     *      // Custom field
     *      Ext.define('MyEditor', {
     *          extend  : 'Ext.form.field.Trigger'
     *      });
     *
     *      var plugin3 = new Sch.plugin.CellPlugin({
     *          editor  : new MyEditor()
     *      });
     *
     */
    editor          : 'Sch.field.CellEditor',

    /**
     * @cfg {Boolean} singleClickEditing If true editing mode will be set on plugin on a single click in the cell.
     */
    singleClickEditing  : true,

    /**
     * @cfg {Integer} dblClickTimeout Timeout required to catch cell double click event if {@link #singleClickEditing} is true
     */
    dblClickTimeout : 100,

    clickTimer      : [],

    editing         : false,

    /**
     * @property {Object} context Object containing information about current selection. Isn't used for navigation purposes.
     * @property {Date} context.startDate Start date of selected tick
     * @property {Date} context.endDate End date of selected tick
     * @property {Sch.model.Resource} context.resource Selected resource
     * @private
     */
    context         : {},

    /**
     * @property {Object[]} selContext Array of {@link #context} objects for multiple selection. Doesn't contain
     * currently selected cell.
     * @private
     */
    selContext      : [],

    /**
     * @event cellclick
     * Fires when cell click performed and not intercepted by double click. Return false to prevent handling.
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {Integer} tickIndex Current tick
     * @param {Integer} resourceIndex Current resource
     */

    /**
     * @event celldblclick
     * Fires when cell double click performed. Return false to prevent handling.
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {Integer} tickIndex Current tick
     * @param {Integer} resourceIndex Current resource
     */

    /**
     * @event beforeselect
     * Fires before cell is selected. Return false to prevent selection.
     *
     * @param {Sch.view.TimelineGridView} view Scheduling view
     * @param {Sch.model.Resource} resource Currently selected resource
     * @param {Date} startDate Current tick start date
     * @param {Date} endDate Current tick end date
     */

    /**
     * @event select
     * Fires after cell is selected.
     *
     * @param {Sch.view.TimelineGridView} view Scheduling view
     * @param {Sch.model.Resource} resource Currently selected resource
     * @param {Date} startDate Current tick start date
     * @param {Date} endDate Current tick end date
     */

    /**
     * @event selectionchange
     * Fires after {@link #select} event.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event beforecelledit
     * Fires before cell enters editing mode. Return false to prevent editing.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event begincelledit
     * Fires after {@link #select} event.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event beforecompletecelledit
     * Fires before cell enters editing mode. Return false to continue editing cell.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {String} value Editor value
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event completecelledit
     * Fires before cell enters editing mode. Return false to continue editing cell.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {String} value Editor value
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event beforecancelcelledit
     * Fires before cell editing is cancelled. Return false to continue editing cell.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {String} value Editor value
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    /**
     * @event cancelcelledit
     * Fires after cell editing is cancelled.
     *
     * @param {Sch.plugin.CellPlugin} this Plugin instance
     * @param {String} value Editor value
     * @param {Object[]} selection Current selection
     * @param {Sch.model.Resource} selection.resource Currently selected resource
     * @param {Date} selection.startDate Current tick start date
     * @param {Date} selection.endDate Current tick end date
     */

    constructor : function (cfg) {
        Ext.apply(this, cfg || {}, {
            context         : {},
            editing         : false,

            tickIndex       : null,
            resource        : null,
            startDate       : null,

            // index of currently selected event in cell
            eventIndexInCell    : -1,
            // currently selected event
            eventRecord         : null
        });

        this.mixins.observable.constructor.call(this);

        this.callParent(arguments);
    },

    init  : function (scheduler) {
        var me          = this;
        me.view         = scheduler.getSchedulingView();

        me.lockedView   = scheduler.lockedGrid.getView();
        // disable default grid key navigation to handle multiple cell events

        // HACK keynav couldn't be disabled using config http://www.sencha.com/forum/showthread.php?296161
        scheduler.getNavigationModel().setPosition = Ext.emptyFn;

        me.timeAxisViewModel    = scheduler.timeAxisViewModel;

        me.tickCount    = scheduler.timeAxis.getCount();
        me.rowsCount    = scheduler.resourceStore.getCount();

        me.keyNav = new Ext.util.KeyNav({
            target: scheduler.lockedGrid.view,
            eventName: 'itemkeydown',
            processEvent: function(view, record, node, index, event) {
                return event;
            },
            ignoreInputFields: true,
            up      : this.onKeyUp,
            down    : this.onKeyDown,
            right   : this.onKeyRight,
            left    : this.onKeyLeft,
            tab     : this.onKeyTab,
            enter   : this.onKeyEnter,
            esc     : this.onKeyEsc,
            scope   : this
        });

        if (me.view.bufferedRenderer) {
            me.view.on('afterrender', function () {
                me.view.el.on('scroll', me.onViewScroll, me);
            }, me, { single : true });

            me.mon(me.view, 'itemadd', me.onItemAdd, me);
        }

        me.mon(scheduler, {
            headerclick         : me.onContainerClick,
            zoomchange          : me.destroyHighlighter,
            scope               : me
        });

        me.mon(me.view, {
            containerclick      : me.onContainerClick,
            scheduleclick       : me.onCellClick,
            scheduledblclick    : me.onCellDblClick,
            eventclick          : me.onEventClick,
            eventdblclick       : me.onEventDblClick,
            // in case editor doesn't allow 'keydown' events we listem them on view
            containerkeydown    : me.onEditorKeyDown,
            groupcollapse       : me.onGroupCollapse,
            groupexpand         : me.onGroupExpand,
            scope               : me
        });

        me.mon(me.timeAxisViewModel, {
            update              : me.onViewModelUpdate,
            scope               : me
        });

        me.mon(me.view.timeAxis, {
            beforereconfigure   : me.onBeforeReconfigure,
            scope               : me
        });

        me.mon(me.view.resourceStore, {
            load                : me.onResourceLoad,
            add                 : me.onResourceAdd,
            remove              : me.onResourceRemove,
            clear               : me.destroyHighlighter,
            scope               : me
        });

        me.mon(me.view.eventStore, {
            load                : me.destroyHighlighter,
            scope               : me
        });

        me.mon(me.lockedView, {
            cellclick           : me.onLockedCellClick,
            beforeitemkeydown   : me.onBeforeItemKeyDown,
            scope               : me
        });
    },

    onEditorKeyDown : function (view, e, eOpts) {
        switch (e.getKey()) {
            case e.TAB    :
                e.preventDefault();

                if (e.shiftKey) {
                    this.moveLeft(e);
                } else {
                    this.moveRight(e);
                }
                break;
            case e.ENTER  :
                this.onEditorKeyEnter();
                break;
            case e.ESC    :
                this.cancelEdit(e);
                break;
            default : break;
        }
    },

    onEditorKeyEnter    : function () {
        if (this.completeEdit()) {
            this.beginEditBelow();
        } else {
            this.showEditorInCell(this.getEventOrCell(this.context, true));
        }
    },

    destroy : function () {
        this.keyNav.destroy();
    },

    destroyHighlighter  : function () {
        var me = this;

        me.clearSelection();
        me.containerEl && me.containerEl.destroy();

        delete me.containerEl;
        delete me.startDate;
        delete me.resource;
        delete me.resourceIndex;
        delete me.eventRecord;

        delete me.tickIndex;
    },

    onGroupCollapse     : function () {
        var me = this;

        me.rowsCount = me.view.getNodes().length;

        if (me.getResourceIndex() === -1) {
            me.destroyHighlighter();
        } else {
            me.refreshCell();
        }
    },

    onGroupExpand       : function () {
        var me = this;

        me.rowsCount = me.view.getNodes().length;
        me.refreshCell();
    },

    onViewScroll        : function () {
        var me = this;

        if (me.containerEl) {
            var node        = Ext.get(me.view.getNodeByRecord(me.resource));
            if (node) {
                me.containerEl.setY(node.getY() - 1);
            }
        }
    },

    onItemAdd    : function () {
        var me      = this;

        if (!me.resource) return;

        var node = me.view.getNodeByRecord(me.resource);

        // record is rendered to view
        if (node) {
            me.containerEl.show();
        } else {
            me.containerEl.hide();
        }
    },

    getResourceIndex    : function (resource) {
        var me      = this;
        resource    = resource || me.resource;

        // dataSource.indexOf will return index of this record in main store
        // we need index of this record in dataSource store, so we add 'data' property
        return me.view.dataSource.data.indexOf(resource);
    },

    getResource         : function (resourceIndex) {
        return this.view.dataSource.getAt(resourceIndex);
    },

    onResourceLoad      : function (store, records, successful) {
        if (successful) {
            this.rowsCount  = records.length;
        }
    },

    onResourceAdd       : function (store, records) {
        this.rowsCount += records.length;

        this.refreshCell();
    },

    onResourceRemove    : function (store, records, index, isMove) {
        var me = this;

        me.rowsCount = store.getCount();

        // if all rows are removed we should also remove box
        if (me.rowsCount === 0) {
            me.destroyHighlighter();
        }
        // TODO: also check if selection should be partially removed

        // currently selected row is removed
        if (Ext.Array.indexOf(records, me.resource) !== -1) {
            me.destroyHighlighter();
        }

        me.refreshCell();
    },

    onBeforeReconfigure : function (timeAxis) {
        // save editor position only if it wasn't saved before
        if (!this.startDate && Ext.isNumber(this.tickIndex)) {
            this.startDate = timeAxis.getAt(this.tickIndex).getStartDate();
        }
    },

    onLockedCellClick : function (lockedView, td, cellIndex, record, tr, rowIndex, e) {
        this.showEditorInCell({
            tickIndex       : this.tickIndex || 0,
            resourceIndex   : rowIndex,
            eventIndexInCell: 0
        }, e);
    },

    // this method is responsible for type-away behavior
    onBeforeItemKeyDown : function (lockedView, record, item, index, e, eOpts) {
        if (!e.isSpecialKey()) {
            this.beginEdit();
        }
    },

    onViewModelUpdate : function (timeAxisViewModel) {
        var me          = this,
            timeAxis    = timeAxisViewModel.timeAxis;

        me.tickCount    = timeAxis.getCount();

        // if selection was active before reconfigure we should try to show editor
        if (me.startDate) {
            var newTick     = timeAxis.getTickFromDate(me.startDate);

            if (newTick >= 0) {
                // remove saved editor position
                delete me.startDate;

                me.tickIndex = newTick;

                if (!me.containerEl) {
                    me.renderElement();
                }
                me.refreshCell();
            } else {
                me.containerEl.destroy();
                delete me.containerEl;

                me.clearSelection();
            }
        } else {
            me.refreshCell();
        }
    },

    refreshCell         : function () {
        var me      = this;
        var width   = me.timeAxisViewModel.getTickWidth();

        if (me.containerEl) {
            me.containerEl.setWidth(width);
            me.containerEl.setLeft(width);

            me.showEditorInCell({
                tickIndex       : me.tickIndex,
                resourceIndex   : me.getResourceIndex()
            });
        }

        if (me.editor instanceof Ext.form.field.Base) {
            me.editor.setMaxWidth(width);
        }
    },

    clearSelection      : function () {
        var me = this;

        me.view.getSecondaryCanvasEl().select('.' + me.frameCls + '.clone').remove();
        me.selContext = [];
    },

    addSelection        : function () {
        var me          = this;

        // cloning container element leads to id issues in IE9
        var clone       = me.frameTemplate.apply({
            cls     : me.frameCls,
            width   : me.containerEl.getWidth(),
            height  : me.containerEl.getHeight()
        });
        clone = Ext.get(Ext.DomHelper.append(me.containerEl.parent(), clone));

        clone.setStyle('top', me.containerEl.getStyle('top'));
        clone.setStyle('left', me.containerEl.getStyle('left'));

        clone.removeCls('active');
        clone.addCls('clone');

        me.selContext.push(Ext.apply({}, me.context));
    },

    renderElement       : function () {
        var me = this;

        me.containerEl          = me.view.getSecondaryCanvasEl();

        var width               = me.timeAxisViewModel.getTickWidth();
        var height              = me.timeAxisViewModel.getViewRowHeight();

        var el                  = me.frameTemplate.apply({
            cls     : me.frameCls,
            width   : width,
            height  : height
        });

        me.containerEl = Ext.get(Ext.DomHelper.append(me.containerEl, el));

        var defaultCfg = {
            height      : height,
            maxHeight   : height,
            width       : width,
            maxWidth    : width,
            renderTo    : me.containerEl
        };

        if (Ext.isObject(me.editor) && !(me.editor instanceof Ext.Base)) {
            me.editor = Ext.create(Ext.apply(defaultCfg, me.editor, { xclass : 'Sch.field.CellEditor' }));
        } else if (Ext.isString(me.editor)) {
            me.editor = Ext.create(me.editor, defaultCfg);
        } else {
            // editor is instance of form.field.Base
            me.containerEl.appendChild(me.editor.el);
        }
    },

    // for correct work we should always keep focus on elements in locked grid
    onContainerClick    : function () {
        var me = this;

        if (me.lockedView.getSelectionModel().getSelection().length > 0) {
            // focus row from locked grid only if one is selected and we are not editing cell
            if (me.editor.isVisible && me.editor.isVisible()) {
                me.lockedView.getFocusEl().focus();
            }
        }
    },

    onCellClick : function (view, date, rowIndex, resource, e) {
        var me = this;

        me.clickTimer.push(setTimeout(function () {
            me.handleCellClick(view, date, rowIndex, resource, e);
        }, me.dblClickTimeout));
    },

    handleCellClick     : function (view, date, rowIndex, resource, e) {
        var me = this;

        var colIndex    = Math.floor(me.view.timeAxis.getTickFromDate(date));

        if (me.fireEvent('cellclick', me, colIndex, rowIndex) !== false) {
            me.showEditorInCell({
                tickIndex       : colIndex,
                resourceIndex   : rowIndex
            }, e);

            if (me.singleClickEditing) {
                me.beginEdit();
            }
        }
    },

    onCellDblClick      : function (view, date, rowIndex, resource, e) {
        Ext.each(this.clickTimer, function (timer) {
            clearTimeout(timer);
        });

        this.handleCellDblClick(view, date, rowIndex, resource, e);
    },

    handleCellDblClick  : function (view, date, rowIndex, resource, e) {
        var me = this;

        var colIndex    = Math.floor(me.view.timeAxis.getTickFromDate(date));

        if (me.fireEvent('celldblclick', me, colIndex, rowIndex) !== false) {
            me.showEditorInCell({
                tickIndex       : colIndex,
                resourceIndex   : rowIndex
            }, e);
            me.beginEdit();
        }
    },

    onEventClick        : function (view, eventRecord, e) {
        var me      = this;
        var date    = me.view.getDateFromDomEvent(e);
        var col     = Math.floor(me.view.timeAxis.getTickFromDate(date));
        // in case of grouped view we can't lookup indices in main store
        var row     = me.view.dataSource.data.indexOf(eventRecord.getResource());

        me.showEditorInCell({
            tickIndex       : col,
            resourceIndex   : row,
            eventRecord     : eventRecord
        }, e);
    },

    onEventDblClick     : function (view, eventRecord, e) {
        var me      = this;
        var date    = me.view.getDateFromDomEvent(e);
        var col     = Math.floor(me.view.timeAxis.getTickFromDate(date));
        // in case of grouped view we can't lookup indices in main store
        var row     = me.view.dataSource.data.indexOf(eventRecord.getResource());

        me.showEditorInCell({
            tickIndex       : col,
            resourceIndex   : row,
            eventRecord     : eventRecord
        }, e);
        me.beginEdit();
    },

    // resource record is optional param
    showEditorInCell    : function (params, e) {
        var me      = this;

        var col     = 'tickIndex' in params ? params.tickIndex : me.tickIndex;
        var row     = 'resourceIndex' in params ? params.resourceIndex : me.resourceIndex;

        if (col === -1 || row === -1) return;

        var tick        = me.view.timeAxis.getAt(col);
        var startDate   = tick.getStartDate();
        var endDate     = tick.getEndDate();
        // in case view is configured with grouping feature
        // and there is at least one collapsed group
        // we have to lookup resources like this
        var resource    = me.view.dataSource.getAt(row);

        // user clicked on locked cell or normal cell (only if event layout is not table)
        if (e && e.type === 'click' && !params.eventRecord) {
            params.eventRecord = me.getCellEvents({
                startDate   : startDate,
                endDate     : endDate,
                resource    : resource
            }).getAt(0);
        }

        if (me.fireEvent('beforeselect', me, resource, startDate, endDate, params.eventRecord) === false) {
            return;
        }

        me.onBeforeSelect(e);

        if (!me.containerEl) {
            me.renderElement();
        } else {
            if (e && e.ctrlKey) {
                me.addSelection();
            } else {
                me.clearSelection();
            }
        }

        Ext.apply(me.context, {
            startDate       : startDate,
            endDate         : endDate,
            resource        : resource
        });

        if (params.eventRecord) {
            me.context.eventRecord = params.eventRecord;
        } else {
            delete me.context.eventRecord;
        }

        me.tickIndex    = col;
        me.resource     = resource;
        me.resourceIndex = row;
        me.eventIndexInCell   = params.eventIndexInCell;

        if (params.eventRecord) {
            me.alignEditorWithRecord(params.eventRecord, params.resource);
        } else {
            me.alignEditorWithCell();
        }

        me.onAfterSelect(e);

        me.fireEvent('select', me, resource, startDate, endDate);
        // TODO: append check for actual selection change
        me.fireEvent('selectionchange', me, me.getSelection());
    },

    alignEditorWithRecord   : function(eventRecord, resourceRecord) {
        var me = this;

        // some enhancements to make box visible
        // TODO: use z-index or wrap box around event body
        var els = me.view.getElementsFromEventRecord(eventRecord, resourceRecord),
            box = els[0].getBox();
        box.y--;
        box.x--;
        me.alignEditor(box);
    },

    alignEditorWithCell : function () {
        var me = this;

        var node = Ext.get(me.view.getRowByRecord(me.resource));
        node && me.alignEditor({
            left    : me.timeAxisViewModel.getTickWidth() * me.tickIndex,
            y       : node.getTop() - 1,
            height  : node.getHeight(),
            width   : me.timeAxisViewModel.getTickWidth()
        });
    },

    alignEditor : function (box) {
        var me = this;

        me.containerEl.setY(box.y);
        // 'x' key is passed when box is positioned using event element - absolute coordinates
        if ('x' in box) {
            me.containerEl.setX(box.x);
        } else {
            me.containerEl.setLeft(box.left);
        }

        me.containerEl.setWidth(box.width);
        me.containerEl.setHeight(box.height);

        if (Ext.isIE8m) {
            me.containerEl.setHeight(box.height + 1);
            // top border is hidden in some cases, this style is fixing that
            me.containerEl.setStyle('padding-top', 1);
            me.containerEl.select('.sch-cellplugin-border-top').setStyle('top', 1);
            // height/width is inherited in IE8 bug display is buggy
            me.containerEl.select('.sch-cellplugin-border-vertical').setHeight(box.height);
            me.containerEl.select('.sch-cellplugin-border-horizontal').setWidth(box.width);
        } else if (Ext.isChrome) {
            // chrome 43 is buggy too, height isn't inherited correctly
            me.containerEl.select('.sch-cellplugin-border-vertical').setHeight(box.height);
        }

        me.containerEl.show();
    },

    getSelection    : function () {
        return this.selContext.concat(this.context);
    },

    /**
     * @method getEventRecord
     * Accepts current context (selected cell) and should always return one event record.
     * @param {Object} context
     * @param {Sch.model.Resource} context.resource Selected resource
     * @param {Date} context.startDate Current cell start date
     * @param {Date} context.endDate Current cell end date
     * @return {Sch.model.Event}
     */
    getEventRecord  : function (context) {
        return context.eventRecord;
    },

    /**
     * @method getResourceRecord
     * Accepts current context (selected cell) and should always return one resource record.
     * @param {Object} context
     * @param {Sch.model.Resource} context.resource Selected resource
     * @param {Date} context.startDate Current cell start date
     * @param {Date} context.endDate Current cell end date
     * @return {Sch.model.Resource}
     */
    getResourceRecord : function (context) {
        return context.resource;
    },

    onKeyUp : function (e) {
        this.moveUp(e);
    },

    onKeyDown   : function (e) {
        this.moveDown(e);
    },

    onKeyLeft   : function (e) {
        this.moveLeft(e);
    },

    onKeyRight  : function (e) {
        this.moveRight(e);
    },

    onKeyTab    : function (e) {
        if (e.shiftKey) {
            this.moveLeft(e);
        } else {
            this.moveRight(e);
        }
    },

    onKeyEnter  : function () {
        this.beginEdit();
    },

    onKeyEsc    : function () {
        this.destroyHighlighter();
    },

    findPreviousIndex   : function (e) {
        var me      = this;
        var index   = me.getResourceIndex();

        var prevRecord = me.view.walkRecs(me.resource, -1);

        if (prevRecord !== me.resource) {
            return me.getResourceIndex(prevRecord);
        } else {
            return -1;
        }
    },

    findNextIndex       : function (e) {
        var me      = this;
        var index   = me.getResourceIndex();

        var prevRecord = me.view.walkRecs(me.resource, 1);

        if (prevRecord !== me.resource) {
            return me.getResourceIndex(prevRecord);
        } else {
            return -1;
        }
    },

    getCellEvents   : function (context) {
        var me  = this;
        context = context || me.context;

        if (context.resourceIndex === -1 || context.tickIndex === -1) {
            return new Ext.util.MixedCollection();
        }

        var events = me.view.eventStore.queryBy(function (event) {
            return event.getResourceId() === context.resource.getId() &&
                   event.getStartDate()  >=  context.startDate &&
                   event.getStartDate()  <   context.endDate;
        });

        events.sortBy(function (a, b) {
            var aEl = me.view.getElementsFromEventRecord(a, context.resource)[0],
                bEl = me.view.getElementsFromEventRecord(b, context.resource)[0];

            return aEl.getY() < bEl.getY() ? -1 : 1;
        });

        return events;
    },

    getAbove    : function (context) {
        var me  = this,
            newEventIndex;

        context = context || me.context;

        // if event was clicked, we don't know relative index, have to calculate it
        if (context.eventRecord && me.eventIndexInCell == null) {
            me.eventIndexInCell = me.getCellEvents(context).indexOf(context.eventRecord);
        }

        // if box is currently on event in cell, check if we can just reduce the index
        if (me.eventIndexInCell > 0) {
            newEventIndex = me.eventIndexInCell - 1;

            return {
                eventIndexInCell    : newEventIndex,
                eventRecord         : me.getCellEvents(context).getAt(newEventIndex)
            };
        }

        var newResourceIndex = me.findPreviousIndex();

        // last expanded resource, cannot move down
        if (newResourceIndex === -1) {
            // have to return special index to exit routine later
            return { resourceIndex : -1 };
        }

        return me.getEventOrCell(Ext.applyIf({
            resourceIndex   : newResourceIndex
        }, context), true);
    },

    getBelow    : function (context) {
        var me  = this;

        context = context || me.context;

        // if event was clicked, we don't know relative index, have to calculate it
        if (context.eventRecord && me.eventIndexInCell == null) {
            me.eventIndexInCell = me.getCellEvents(context).indexOf(context.eventRecord);
        }

        if (me.eventIndexInCell >= 0) {
            var events  = me.getCellEvents(context);
            var newEventIndex = me.eventIndexInCell + 1;
            // we still have some events in cell
            if (events.getCount() > newEventIndex) {
                return {
                    eventIndexInCell    : newEventIndex,
                    eventRecord         : events.getAt(newEventIndex)
                };
            }
        }

        var newResourceIndex = me.findNextIndex();

        // last expanded resource, cannot move down
        if (newResourceIndex === -1) {
            return { resourceIndex : -1 };
        }

        return me.getEventOrCell(Ext.applyIf({
            resourceIndex   : newResourceIndex
        }, context));
    },

    /**
     * @method getEventOrCell
     * Moving box in horizontal direction should select first event in cell, or whole cell.
     * Method requires not only conventional context for next cell, but also new tickIndex and resourceIndex -
     * to avoid unnesessary lookups.
     * @param {Object} context Current {@link #context} updated with two optional properties:
     * @param {Integer} [context.tickIndex] Tick index of new cell. If not provided - current is used.
     * @param {Integer} [context.resourceIndex] Resource index of new cell. If not provided - current is used.
     * @param {Boolean} [pickLast=false] Pass true if you want to pick last event of cell
     *
     * @return {Object} Navigation params
     * @return {Integer} [return.tickIndex] New tick index, if box moved horizontally
     * @return {Integer} [return.resourceIndex] New resource index, if box moved vertically
     * @return {Integer} [return.eventIndexInCell] Index of the event to be selected, or null if cell is empty
     * @return {Sch.model.Event} [return.eventRecord] First/last event in cell or null, if there's no events
     * @private
     */
    getEventOrCell    : function (context, pickLast) {
        var me                  = this,
            eventIndexInCell    = -1,
            eventRecord         = null,
            tickIndex           = me.tickIndex,
            resourceIndex       = me.resourceIndex;

        // if tickIndex was provided, we have to update context for getCellEvents method
        if ('tickIndex' in context) {
            tickIndex = context.tickIndex;
            var tick = me.view.timeAxis.getAt(tickIndex);
            context.startDate   = tick.getStartDate();
            context.endDate     = tick.getEndDate();
        }

        if ('resourceIndex' in context) {
            resourceIndex = context.resourceIndex;
            context.resource = me.view.dataSource.getAt(resourceIndex);
        }

        var events = me.getCellEvents(context);
        if (events.getCount()) {
            if (pickLast === true) {
                eventIndexInCell = events.getCount() - 1;
                eventRecord = events.getAt(eventIndexInCell);
            } else {
                eventIndexInCell = 0;
                eventRecord = events.getAt(0);
            }
        }

        return {
            tickIndex           : tickIndex,
            resourceIndex       : resourceIndex,
            eventIndexInCell    : eventIndexInCell,
            eventRecord         : eventRecord
        };
    },

    getPrevious : function (context) {
        var me  = this;

        context = context || me.context;

        var resourceIndex = me.getResourceIndex();

        if (me.tickIndex > 0) {
            return me.getEventOrCell(Ext.applyIf({
                tickIndex   : me.tickIndex - 1
            }, context));
        } else {
            return me.getEventOrCell(Ext.applyIf({
                tickIndex       : me.tickCount - 1,
                resourceIndex   : me.findPreviousIndex()
            }, context));
        }
    },

    getNext     : function (context) {
        var me  = this;

        context = context || me.context;

        if (me.tickIndex < me.tickCount - 1) {
            return me.getEventOrCell(Ext.applyIf({
                tickIndex       : ++me.tickIndex,
                resourceIndex   : me.getResourceIndex()
            }, context));
        } else {
            return me.getEventOrCell(Ext.applyIf({
                tickIndex       : 0,
                resourceIndex   : me.findNextIndex()
            }, context));
        }
    },

    moveUp      : function (e) {
        var me = this;

        if (!me.containerEl) {
            return;
        }

        me.showEditorInCell(me.getAbove(), e);
    },

    moveDown    : function (e) {
        var me = this;

        if (!me.containerEl) {
            return;
        }

        me.showEditorInCell(me.getBelow(), e);
    },

    moveLeft    : function (e) {
        var me = this;

        if (!me.containerEl) {
            return;
        }

        me.showEditorInCell(me.getPrevious(), e);
    },

    moveRight   : function (e) {
        var me = this;

        if (!me.containerEl) {
            return;
        }

        me.showEditorInCell(me.getNext(), e);
    },

    expandResourceRow   : function (height) {
        var me = this;

        var resourceNode = Ext.get(me.view.getNodeByRecord(me.context.resource));
        var box = resourceNode.getBox();

        var record = me.getCellEvents().last();
        if (record) {
            var eventBox = me.view.getElementsFromEventRecord(record, me.context.resource)[0].getBox();

            if (Math.abs(eventBox.bottom - box.bottom) <= height) {
                resourceNode.setHeight(box.height + height);
                Ext.get(me.lockedView.getNodeByRecord(me.context.resource)).setHeight(box.height + height);

                me.__oldHeight = box.height;

                return box.bottom;
            } else {
                return eventBox.bottom;
            }
        }
    },

    collapseResourceRow : function () {
        var me = this;

        if (me.__oldHeight) {
            Ext.get(me.view.getNodeByRecord(me.context.resource)).setHeight(me.__oldHeight);
            Ext.get(me.lockedView.getNodeByRecord(me.context.resource)).setHeight(me.__oldHeight);

            delete me.__oldHeight;
        }
    },

    beginEditBelow  : function () {
        var me  = this;

        if (!me.containerEl) {
            return;
        }

        delete me.context.eventRecord;

        me.beginEdit();

        var height = me.timeAxisViewModel.getViewRowHeight();

        var bottom = me.expandResourceRow(height);

        me.alignEditor({
            left    : me.timeAxisViewModel.getTickWidth() * me.tickIndex,
            y       : bottom,
            width   : me.timeAxisViewModel.getTickWidth(),
            height  : height
        });
    },

    beginEdit   : function () {
        var me      = this;

        if (!me.containerEl) {
            return;
        }

        // such event makes sense only if user is provided with selection information
        // e.g. he selected readonly cell
        if (me.fireEvent('beforecelledit', me, me.getSelection()) === false) {
            return;
        }

        me.editing      = true;

        me.editor.startDate = me.context.startDate;
        me.editor.bottomUnit = Sch.util.Date.getSubUnit(me.timeAxisViewModel.getBottomHeader().unit);

        me.containerEl.select('.sch-cellplugin-border').hide();
        // set z-index in order to intercept clicks in editor
        me.containerEl.setStyle('z-index', 1);

        var event       = me.getEventRecord(me.context),
            resource    = me.getResourceRecord(me.context);

        if (event) {
            var date        = Ext.Date;

            // TODO: this should be implemented in editor, not here
            var format      = Ext.isArray(me.editor.dateFormat) ? me.editor.dateFormat[0] : me.editor.dateFormat;
            var startDate   = date.format(event.getStartDate(), format);
            var endDate     = date.format(event.getEndDate(), format);

            me.editor.record = event;

            me.editor.setValue([startDate, endDate].join(me.editor.divider));

            me.editor.recordNode = me.view.getElementsFromEventRecord(event, resource)[0];
            Ext.fly(me.editor.recordNode).hide();
        }

        me.editor.show();
        me.editor.setWidth(me.editor.getMaxWidth());
        me.editor.focus();

        me.fireEvent('begincelledit', me, me.getSelection());
    },

    cancelEdit      : function () {
        var me          = this;

        var value       = me.editor.getValue();
        var selection   = me.getSelection();

        if (me.fireEvent('beforecancelcelledit', me, value, selection) === false) {
            return;
        }

        me.stopEditing();

        me.fireEvent('cancelcelledit', me, value, selection);
    },

    completeEdit    : function () {
        var me          = this,
            addNewLine  = false;

        // plugin is not in editing mode
        if (!me.editing || !me.containerEl) {
            return;
        }

        var value = me.editor.getValue();
        var selection = me.getSelection();

        if (me.fireEvent('beforecompletecelledit', me, value, selection) === false) {
            return;
        }

        if (value && me.editor.isValid()) {
            var record  = me.editor.record;

            var UD      = Sch.util.Date;
            var unit    = UD.getSubUnit(me.timeAxisViewModel.getBottomHeader().unit);

            var dates   = me.editor.getDates(value);

            var startDate   = dates[0];
            var endDate     = dates[1];

            if (record) {
                record.setStartEndDate(startDate, endDate);
                delete me.editor.record;
            } else {
                var newRecord = new me.view.eventStore.model({
                    StartDate   : startDate,
                    EndDate     : endDate,
                    ResourceId  : me.context.resource.getId()
                });

                me.view.onEventCreated(newRecord);

                me.view.eventStore.add(newRecord);
            }

            addNewLine = true;
        }

        me.stopEditing();

        me.fireEvent('completecelledit', me, value, selection);

        return addNewLine;
    },

    // resets value, restores view to state before editing
    stopEditing     : function () {
        var me = this;

        if (me.editor.recordNode) {
            Ext.fly(me.editor.recordNode).show();
            delete me.editor.recordNode;
        }

        me.collapseResourceRow();

        me.editor.setValue('');

        me.editing  = false;
        me.clearSelection();

        me.containerEl.select('.sch-cellplugin-border').show();
        me.containerEl.setStyle('z-index', 'auto');
        me.editor.hide();

        var node = me.lockedView.getRowByRecord(me.resource);
        // TODO: in IE if locked grid will have more than 1 column this can mess scroll position
        node && Ext.fly(node).down('td').focus();
    },

    onBeforeSelect  : function (e) {
        var me = this;

        e && e.isNavKeyPress && e.isNavKeyPress() && me.clearSelection();

        me.restoreEditing = me.editing;
        me.editing && me.completeEdit();
    },

    onAfterSelect   : function (e) {
        var me = this;

        me.lockedView.getSelectionModel().select(me.resource);
        me.lockedView.getNodeByRecord(me.resource).focus();

        me.editor.setValue('');

        // we don't want to enable editing back if we changed cell using click
        // but also we want to enable editing using showEditorInCell(col, row, true) function
        if (me.restoreEditing && (e === true || e && e.isNavKeyPress())) {
            me.beginEdit();
        }
        me.restoreEditing = false;

        me.containerEl.scrollIntoView(me.view.getEl());
    }
});
