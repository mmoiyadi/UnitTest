/**
 * @class Ext.grid.plugin.DragFill
 * 
 * Enables Excel-style "copy down" of values from one row to some number of rows below.
 * Click and drag to make an initial selection.  Drag the square handle at the bottom right
 * of the selected area to copy values from the selected row down to rows below.
 *
 * Uses Ext store to copy values, so records will be updated as if they had been edited
 * individually via the grid.
 */
Ext.define('Ext.grid.plugin.DragFill', (function() {

    var MOUSEOVER_THROTTLE_MS = 50,
        SELECTIONTYPE = {
            NONE: 0,
            SINGLE_ROW: 1,
            MULTI_ROW: 2
        };

    return {
        alias: 'plugin.dragfill',
        extend: 'Ext.AbstractPlugin',

        requires: [
            'Ext.grid.column.Column'
        ],

        mixins: {
            observable: 'Ext.util.Observable'
        },

        constructor: function(config) {
            var me = this;
            me.callParent(arguments);
            me.mixins.observable.constructor.call(me);
        },

        init: function(grid) {
            var me = this;
            me.grid = grid;
            me.view = grid.view;
            me.initEvents();
            grid.dragDownPlugin = grid.view.dragDownPlugin = me;
            me.selectionType = SELECTIONTYPE.NONE;
        },

        /**
         * @private
         * AbstractComponent calls destroy on all its plugins at destroy time.
         */
        destroy: function() {
            var me = this,
                grid = me.grid;

            // Clear all listeners from all our events, clear all managed listeners we added to other Observables
            me.clearListeners();

            delete me.grid.dragDownPlugin;
            delete me.grid.view.dragDownPlugin;
            delete me.grid;
            delete me.view;
        },

        // @private
        initEvents: function() {
            var me = this;
            me.mon(me.view, 'cellclick', me.onCellClick, me);
            me.mon(me.view, 'cellmousedown', me.onCellMousedown, me);
            me.mon(me.view, 'cellmouseup', me.onCellMouseup, me);
            me.view.on('render', me.onGridRendered, me, {single: true});
        },

        onGridRendered: function() {
            var me = this;
            me.mon(me.grid.getEl(), 'mouseover', 
                Ext.Function.createThrottled(me.onGridMouseOver, me.MOUSEOVER_THROTTLE_MS, me));
        },

        onCellClick: function(e, target) {
            var me = this;
            this.clearSelection();
            var cell = $(target).closest("td");
            var colIndex = cell.index();
            if(this.grid.readOnly)
                return;
            //filter for only visible columns else this will get the right column
            var availCols = _.filter(me.grid.headerCt.items.items, function(item){ return !item.hidden; });
            if (!availCols[colIndex].allowDragFill) {
                return;
            }
            var sourceRow = $(target).closest("tr");
            var sourceRec = this.grid.store.getRootNode().findChild('taskId',sourceRow.find(".x-grid-cell-taskId").find("div")[0].innerText, true);
            if(!sourceRec){
                var sourceRec = this.grid.store.getByInternalId(sourceRow.parent().parent().data("recordid"));
            }
            if(sourceRec && sourceRec.get('type')=="CMS")
                return;
            this.highlightSelection($(target).closest("td"), $(target).closest("td"));
        },

        onCellMousedown: function(e, target) {
            // NOTE, multi-cell selection is disabled for now -- only one cell can be selected at a time
            // this.startCell = $(target).closest("td");
            // this.highlightSelection(this.startCell, this.startCell);
            // // Starting a new drag
            // this.dragging = true;
        },

        onCellMouseup: function(e, target) {
            // End a dragfill
            if (this.draggingHandle) {
                var me=this;
                this.clearFillBorders();
                var lastHandleDragRowIndex = -1,highlightEndCellIndex = -1;
                lastHandleDragRowIndex = this.lastHandleDragRow.parent().parent().index();
                highlightEndCellIndex = this.highlightEndCell.closest("tr").parent().parent().index();
                if (lastHandleDragRowIndex > highlightEndCellIndex) {
                    var sourceRow = this.highlightEndCell.closest("tr");
                    var container = sourceRow.closest("table").parent();
                    //If there are any filtered rows, get index from filtered rows
                    var existing_rows = container.find("tr:visible");
                    // Copy values from first row into remaining rows
                    
                    var sourceRowIndex = container.find("tr:visible").index(sourceRow),//.index(),                        
                        startCellIndex = this.highlightStartCell.index(),
                        endCellIndex = this.highlightEndCell.index();
                    var sourceRec = this.grid.store.getRootNode().findChild('taskId',sourceRow.find(".x-grid-cell-taskId").find("div")[0].innerText, true);
                    if(!sourceRec){
                        var sourceRec = this.grid.store.getByInternalId(sourceRow.parent().parent().data("recordid"));
                    }
                    var targetRows = container.find("tr:visible").slice(sourceRowIndex+1, existing_rows.index(this.lastHandleDragRow) + 1);
                    this.grid.store.suspendEvents(true);
                    targetRows.each(function(index, targetRow) {               
               		   targetRec = this.grid.store.getRootNode().findChild('taskId',$(targetRow).find(".x-grid-cell-taskId").find("div")[0].innerText, true);
                        if(!targetRec){
                            targetRec = this.grid.store.getByInternalId($(targetRow).parent().parent().data("recordid"));
                        }
                        var fieldName;
                        //filter for only visible columns else this will get the right column
                        var availCols = _.filter(me.grid.headerCt.items.items, function(item){ return !item.hidden; });
                        for (var i = startCellIndex; i <= endCellIndex; i++) {
                            fieldName = availCols[i].dataIndex;
                            if (!this.validateFill || this.validateFill(targetRec, fieldName)) {
                                targetRec.set(fieldName, sourceRec.get(fieldName));
                            }
                        }
                        this.fireEvent('edit', targetRec,fieldName);
                    }.bind(this));
                    this.grid.store.resumeEvents();
                }
            }
            this.dragging = false;
            this.draggingHandle = false;
            this.clearSelection();
        },

        onGridMouseOver: function(e, target) {
            if (!this.dragging && !this.draggingHandle) return;
            this.lastMouseOverCell = $(target).closest("td");
            if (this.draggingHandle) {
                // Dragging handle to extend selection, overwriting cells
                this.highlightFillArea();
            } else if (this.lastMouseOverCell && this.lastMouseOverCell.length > 0) {
                // Normal select-drag
                // NOTE, multi-cell selection is disabled for now -- only one cell can be selected at a time
                // this.highlightSelection(this.startCell, this.lastMouseOverCell);
            }
        },

        clearSelection: function() {
            if (this.currentHighlight) {
                Object.keys(this.currentHighlight).forEach(function(key) {
                    this.currentHighlight[key].remove();
                }.bind(this));
            }
            this.currentHighlight = null;
            if (this.highlightedCells) {
                this.highlightedCells.removeClass('grid-dragfill-highlight');
                this.highlightedCells = null;
            }
        },

        /**
         * Highlights the normal selection area (blue borders and background)
         * Corner handle is enabled only when the selection is within a single row
         */
        highlightSelection: function(startCell, endCell) {
            // Swap start/end cells if dragging upward / leftward
            // This normalizes startCell and endCell to the top-left and bottom-right cell respectively
            if (endCell.index() < startCell.index()) {
                var tmp = startCell;
                startCell = endCell;
                endCell = tmp;
            }
            var startRow = startCell.closest("tr"),
                endRow = endCell.closest("tr");
            if (endRow.index() < startRow.index()) {
                var tmp = startRow;
                startRow = endRow;
                endRow = tmp;
                startCell = startRow.find('td').slice(startCell.index(), startCell.index() + 1);
                endCell = endRow.find('td').slice(endCell.index(), endCell.index() + 1);
            }
            var container = startRow.closest(".x-tree-view");
            var startPos = startCell.position(),
                endPos = endCell.position();
            endPos.left += endCell.width();
            endPos.top += endCell.height();
            var left = startPos.left /*+ container.scrollLeft()*/,
                top = startPos.top - 1 /*+ container.scrollTop()*/,
                width = (endPos.left - startPos.left + 1),
                height = (endPos.top - startPos.top + 1);
            // Generate markup for highlight borders + handle if not already present
            if (!this.currentHighlight) {
                this.currentHighlight = {};
                ['top','left','bottom','right'].forEach(function(edge) {
                    this.currentHighlight[edge] = $('<div class="grid-dragfill-highlight-' + edge + '"></div>');
                    this.currentHighlight[edge].css({
                        position: "absolute",
                        background: "rgb(137, 175, 249)"
                    });
                    container.append(this.currentHighlight[edge]);
                }.bind(this));
                this.currentHighlight.handle = $('<div class="grid-dragfill-handle"></div>')
                    .css({
                        position: "absolute",
                        background: "rgb(137, 175, 249)",
                        border: "2px solid white",
                        width: "9px",
                        height: "9px",
                        cursor: "crosshair"
                    });
                container.append(this.currentHighlight.handle);
                this.currentHighlight.handle.on("mousedown", this.onHandleMousedown.bind(this));
            }
            // Position borders
            this.currentHighlight.top.css({
                top: top + "px",
                left: left + "px",
                width: width + "px",
                height: "1px"
            });
            this.currentHighlight.bottom.css({
                top: (top + height) + "px",
                left: left + "px",
                width: width + "px",
                height: "1px"
            });
            this.currentHighlight.left.css({
                top: top + "px",
                left: left + "px",
                width: "1px",
                height: height + "px"
            });
            this.currentHighlight.right.css({
                top: top + "px",
                left: (left + width) + "px",
                width: "1px",
                height: height + "px"
            });
            this.currentHighlight.handle.css({
                left: (left + width - 4) + "px",
                top: (top + height - 4) + "px"
            });
            // Apply background to cells in range
            if (this.highlightedCells) {
                this.highlightedCells.removeClass('grid-dragfill-highlight');
            }
            var highlightedCells = $();
            container.find('tr').slice(startRow.index(), endRow.index() + 1).each(function(index, row) {
                var cells = $(row).find('td').slice(startCell.index(), endCell.index() + 1);
                highlightedCells = highlightedCells.add(cells);
            });
            this.highlightedCells = highlightedCells;
            this.highlightedCells.addClass('grid-dragfill-highlight');
            // Only show handle when single row selected
            this.currentHighlight.handle.toggle(startRow.is(endRow));
            this.highlightStartCell = startCell;
            this.highlightEndCell = endCell;
        },

        /**
         * When dragging the corner handle, this highlights an additional area in red to indicate the cells
         * that will be overwritten by a copy operation when the mouse is released.  The blue selected area
         * is left unchanged during this drag.
         */
        highlightFillArea: function() {
            var lastSelectedRow = this.highlightEndCell.closest("tr"),
                dragRow = this.lastMouseOverCell.closest("tr"),
                container = lastSelectedRow.closest(".x-tree-view");
            if (!this.fillAreaBorders) {
                this.fillAreaBorders = {};
                ['left','bottom','right'].forEach(function(edge) {
                    this.fillAreaBorders[edge] = $('<div class="grid-dragfill-overwrite-' + edge + '"></div>');
                    this.fillAreaBorders[edge].css({
                        position: "absolute",
                        background: "red"
                    });
                    container.append(this.fillAreaBorders[edge]);
                }.bind(this));
            }
            var dragRowIndex = -1,
                lastSelectedRowIndex = -1;
            dragRowIndex = dragRow.parent().parent().index();
            lastSelectedRowIndex = lastSelectedRow.parent().parent().index();
            if (dragRowIndex > lastSelectedRowIndex) {
                // Left / right are fixed; only vertical extension is allowed
                var startCellIndex = this.highlightStartCell.index(),
                    endCellIndex = this.highlightEndCell.index();
                var startCell = lastSelectedRow.find('td').slice(startCellIndex, startCellIndex + 1),
                    endCell = dragRow.find('td').slice(endCellIndex, endCellIndex + 1);
                var startPos = startCell.position(),
                    endPos = endCell.position();
                endPos.left += endCell.width();
                endPos.top += endCell.height();
                var left = startPos.left /*+ container.scrollLeft()*/,
                    top = startPos.top - 1 /*+ container.scrollTop()*/,
                    width = (endPos.left - startPos.left + 1),
                    height = (endPos.top - startPos.top + 1);
                this.fillAreaBorders.bottom.css({
                    top: (top + height) + "px",
                    left: left + "px",
                    width: width + "px",
                    height: "1px"
                }).show();
                this.fillAreaBorders.left.css({
                    top: top + "px",
                    left: left + "px",
                    width: "1px",
                    height: height + "px"
                }).show();
                this.fillAreaBorders.right.css({
                    top: top + "px",
                    left: (left + width) + "px",
                    width: "1px",
                    height: height + "px"
                }).show();
            } else {
                // Hide fill border
                Object.keys(this.fillAreaBorders).forEach(function(edge) {
                    this.fillAreaBorders[edge].hide();
                }.bind(this));
            }
            this.lastHandleDragRow = dragRow;
        },

        clearFillBorders: function() {
            if (this.fillAreaBorders) {
                Object.keys(this.fillAreaBorders).forEach(function(edge) {
                    this.fillAreaBorders[edge].remove();
                }.bind(this));
                delete this.fillAreaBorders;
            }
        },

        onHandleMousedown: function() {
            this.draggingHandle = true;
        }

    };

}()));