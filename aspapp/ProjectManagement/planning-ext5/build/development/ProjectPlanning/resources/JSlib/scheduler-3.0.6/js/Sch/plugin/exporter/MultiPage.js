/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.exporter.MultiPage
 @extends Sch.plugin.exporter.AbstractExporter

 This class extracts pages in a vertical and horizontal order.

 The exporterId of this exporter is `multipage`
 */

Ext.define('Sch.plugin.exporter.MultiPage', {

    extend          : 'Sch.plugin.exporter.AbstractExporter',


    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - name    : 'Multi pages'
     */

    config          : {
        exporterId  : 'multipage'
    },

    rowPageIndex    : 0,

    columnPageIndex : 0,

    pagesPerColumn  : 0,


    extractPages : function () {
        // stop garbage collecting
        this.enableGarbageCollector = Ext.enableGarbageCollector;
        Ext.enableGarbageCollector  = false;
        Ext.dom.GarbageCollector.pause();

        return this.callParent(arguments);
    },


    onRowsCollected : function (lockedRows, normalRows) {
        var me  = this;

        // reset row/column page counters
        me.rowPageIndex     = 0;
        me.columnPageIndex  = 0;
        me.pagesPerColumn   = 0;

        // - build page frame (skeleton) for each page column,
        me.buildPageFrames(function () {
            // - build pages by filling grids w/ collected rows
            me.buildPages(function () {
                // - finish exporting by launching `onPagesExtracted`
                me.onPagesExtracted.apply(me, arguments);
                // resume garbage collecting
                Ext.enableGarbageCollector = me.enableGarbageCollector;
                Ext.dom.GarbageCollector.resume();
            }, me, lockedRows, normalRows);
        });
    },

    /**
     * Builds pages using collected rows. Uses {@link #pagesFrames page frames} built by {@link #buildPageFrames} method.
     * Calls provided function on pages building completion.
     * @param  {Function} callback Function to be called on building completion.
     * @param  {Object}   [scope] Scope for the specified function. By default set to this exporter instance.
     */
    buildPages : function (callback, scope, lockedRows, normalRows) {
        var me      = this,
            frame   = me.pageFrames[0];

        // start new column page based on specified frame
        me.startPage(frame, true);

        // handle each collected row w/ `rowIteratorStep` method
        this.iterateAsync(me.rowIteratorStep, me, {
            rowIndex    : 0,
            pageFrame   : frame,
            rowsHeight  : 0,
            leftHeight  : this.printHeight,
            lockeds     : [],
            normals     : [],
            lockedRows  : lockedRows,
            normalRows  : normalRows,
            callback    : callback,
            scope       : scope || me
        });
    },

    /**
     * Processes a collected row and decides on its distribution between pages.
     * @param  {Function} next    A callback function to call to proceed w/ a next row.
     * @param  {Object}   context Processing context:
     * @param  {Object}   context.rowIndex Zero based index of the row.
     */
    rowIteratorStep : function (next, context) {

        var me          = this,
            rowIndex    = context.rowIndex,
            lockedRows  = context.lockedRows,
            normalRows  = context.normalRows,
            leftHeight  = context.leftHeight,
            lockeds     = context.lockeds,
            normals     = context.normals,
            async       = true;

        // if we have rows to handle
        if (rowIndex < lockedRows.length) {

            var lockedRow   = lockedRows[rowIndex],
                normalRow   = normalRows[rowIndex];

            // if row fits into current page
            if (lockedRow.height <= leftHeight) {
                // gather rows into temp arrays
                lockeds.push(lockedRow);
                normals.push(normalRow);

                context.leftHeight -= lockedRow.height;
                context.rowsHeight += lockedRow.height;

                async = false;

            // ..if doesn't fit
            } else {
                // flush temp arrays to fill page with gathered rows
                me.fillGrids(lockeds, normals, context.pageFrame);
                // and start a new page
                me.commitPage({ rowsHeight : context.rowsHeight });
                me.startPage( context.pageFrame );

                context.lockeds     = [ lockedRow ];
                context.normals     = [ normalRow ];
                context.leftHeight  = me.printHeight - lockedRow.height;
                context.rowsHeight  = lockedRow.height;
            }

            context.rowIndex++;

        // if we have more column pages to build
        } else if (me.columnPageIndex < me.pageFrames.length) {

            // flush temp arrays to fill page with gathered rows
            me.fillGrids(lockeds, normals, context.pageFrame);
            me.commitPage({ rowsHeight : context.rowsHeight });
            // me.columnPageIndex is 1-based so it points to the neaxt frame in me.pageFrames array
            context.pageFrame   = me.pageFrames[me.columnPageIndex];

            // start new column page based on specified frame
            me.startPage(context.pageFrame, true);

            context.leftHeight  = me.printHeight;
            context.rowsHeight  = 0;
            context.lockeds = [];
            context.normals = [];
            context.rowIndex = 0;

        // if we ran out of rows & columns then we finished
        } else {

            // flush temp arrays to fill page with gathered rows
            me.fillGrids(lockeds, normals, context.pageFrame);
            me.commitPage({ rowsHeight : context.rowsHeight });

            // run specified callback on completion
            context.callback.call(context.scope);
            return;
        }

        // handle next row
        if (async) {
            next(context);
        }
        else {
            me.rowIteratorStep(next, context);
        }
    },


    fillGrids : function (lockeds, normals, frame) {
        var me              = this,
            hasLockedGrid   = me.lockedColumnPages[me.columnPageIndex - 1],
            hasNormalGrid   = !hasLockedGrid || (hasLockedGrid && hasLockedGrid.leftWidth);

        if (hasLockedGrid) {
            me.fillLockedGrid(lockeds, true);
            me.removeHiddenLockedColumns(hasLockedGrid);
        }

        if (hasNormalGrid) {
            me.fillNormalGrid(normals, true);
            me.removeInvisibleEvents(-frame.normalGridOffset, -frame.normalGridOffset + frame.normalGridWidth);
        }
    },


    /**
     * @protected
     * Builds a page frame, a DOM-"skeleton" for a future pages.
     * @param  {Number} colIndex Zero based index of page column to build frame for.
     * @param  {Number} offset   Proper normal grid offset for the page column.
     * @return {Ext.dom.Element} Column page frame.
     */
    buildPageFrame : function (colIndex, offset) {
        var me          = this,
            lockedCols  = me.lockedColumnPages[ colIndex ];

        // if this page column has locked grid
        if (lockedCols) {
            me.lockedGrid.setWidth( me.showLockedColumns(lockedCols.start, lockedCols.end) + (lockedCols.startOffset || 0) );

            // if there is some room after locked grid let's show normal grid
            if (lockedCols.leftWidth) {
                me.normalGrid.show();
            // otherwise we hide normal grid
            } else {
                me.normalGrid.hide();
            }

        // if no locked grid on the page
        } else {
            me.lockedGrid.setWidth(0);
            me.lockedGrid.hide();
            me.normalGrid.show();
        }

        // now after we set locked columns/grid and normal grid visibility
        // we clone the content of the component
        var copy    = me.cloneElement(me.getComponent().body);

        copy.normalGridOffset   = offset;
        copy.lockedGridOffset   = lockedCols && lockedCols.startOffset || 0;
        copy.normalGridWidth    = me.normalGrid.getWidth();
        copy.lockedGridWidth    = me.lockedGrid.getWidth();

        // do some CSS-tweaks to shift locked grid
        copy.select(me.lockedBodySelector).first().dom.style.position   = '';
        copy.select('#' + me.lockedView.id).first().dom.style.overflow  = 'visible';

        // if normal grid is visible on this column page
        // do some CSS-tweaks to place normal grid to show only this page content
        if (!me.normalGrid.hidden) {
            var table   = copy.select(me.normalBodySelector).first();
            table.dom.style.position    = '';
            table.dom.style.top         = '0px';

            var body            = me.getNormalGridBody(copy);
            var header          = copy.select('#' + me.normalView.headerCt.id).first();
            var secondaryCanvas = copy.select('.sch-secondary-canvas').first();
            var view            = copy.select('#' + me.normalView.id).first();

            body.dom.style.left             = offset + 'px';
            header.dom.style.left           = offset + 'px';
            header.dom.style.overflow       = 'visible';
            secondaryCanvas.dom.style.left  = offset + 'px';
            view.dom.style.overflow         = 'visible';
        }

        return copy;
    },

    /**
     * @protected
     * Builds column page frames.
     * @param  {Function} callback A callback function to call on completion
     * @param  {Array[Ext.dom.Element]} callback.pageFrames An array of page frames built
     * @param  {[type]}   scope    A scope for the specified callback function
     */
    buildPageFrames : function (callback, scope) {
        var me                  = this;

        scope                   = scope || me;

        // markup locked columns ranges for page columns
        me.lockedColumnPages    = me.calculateLockedColumnPages();

        var columnPagesNum      = Math.ceil(me.getTotalWidth() / me.paperWidth),
            pageFrames          = me.pageFrames = [];

        me.iterateAsync(function (next, colIndex, offset) {
            // on build completion we call provided function
            if (colIndex >= columnPagesNum) {
                callback.call(scope, pageFrames);
                return;
            }

            pageFrames.push( me.buildPageFrame(colIndex, offset) );

            var lockedCols  = me.lockedColumnPages[ colIndex ];

            // adjust normal grid offset for the next page column
            if (lockedCols) {
                offset -= lockedCols.leftWidth || 0;
            } else {
                offset -= me.paperWidth;
            }

            // let's build frame for next page column
            next(colIndex + 1, offset);

        }, me, 0, 0);
    },


    startPage : function (pattern, newColumnPage) {
        var me  = this;

        if (newColumnPage) {
            // on the very first page commit step we know the exact number of row pages
            // let's keep that value
            if (me.columnPageIndex == 1) {
                me.pagesPerColumn = me.extractedPages.length;
            }
            me.rowPageIndex   = 0;
            me.columnPageIndex++;
        }

        me.rowPageIndex++;

        me.callParent(arguments);

        me.emptyNormalGrid();
        me.emptyLockedGrid();
    },


    commitPage : function (cfg) {
        var me  = this;
        me.callParent([ Ext.apply({ row : me.rowPageIndex, column : me.columnPageIndex }, cfg) ]);
    },


    getExpectedPagesPerColumn : function () {
        return this.pagesPerColumn || Math.ceil((this.lockedRowsHeight || this.component.store.count() * this.component.getRowHeight()) / this.printHeight);
    },


    getExpectedColumnsNumber : function () {
        return this.pageFrames ? this.pageFrames.length : Math.ceil((this.lockedGrid.getWidth() + this.ticks.length * this.view.timeAxisViewModel.getTickWidth()) / this.paperWidth);
    },


    getExpectedNumberOfPages : function () {
        return this.getExpectedColumnsNumber() * this.getExpectedPagesPerColumn();
    },


    /**
     * @protected
     * Calculates which locked columns belong to which page.
     * @return {Array[Object]} Array of object
     */
    calculateLockedColumnPages : function () {
        var me          = this,
            result      = [],
            columns     = me.lockedColumns,
            leftWidth   = me.paperWidth,
            page;

        for (var i = 0, l = columns.length; i < l; i++) {
            var column  = columns[i],
                width   = column.width;

            page        = page || { start : i, end : i };
            leftWidth   -= width;

            // if column violated page width
            if (leftWidth < 0) {
                // push page
                result.push(page);

                if (leftWidth) {
                    page    = { start : i, end : i };
                }

                leftWidth   = me.paperWidth - width + leftWidth;
            } else {
                page.end = i;
            }

/*
            // support for columns sharing between pages

            page        = page || { start : i };
            page.end    = i;
            leftWidth   -= width;

            // if column violated page width
            if (leftWidth <= 0) {
                // push page
                result.push(page);
                // if the column was split next page will start from it w/ corresponding offset
                if (leftWidth) {
                    page    = {
                        start       : i,
                        end         : i,
                        startOffset : leftWidth
                    };
                } else {
                    page    = null;
                }

                leftWidth   = me.paperWidth - width + leftWidth;
            }
*/
        }

        // if we have unpushed column page
        if (page) {
            page.leftWidth  = leftWidth;
            result.push(page);
        }

        return result;
    },


    getPageTplData : function (data) {
        return Ext.apply(this.callParent(arguments), {
            title : data.number + ' of ' + this.numberOfPages + ' (column: ' + data.column + ', row: ' + data.row + ')'
        });
    },


    showLockedColumns : function (startColumn, endColumn) {
        var me      = this,
            columns = me.lockedColumns,
            width   = 0;

        startColumn = startColumn || 0;
        endColumn   = endColumn || columns.length - 1;

        for (var i = 0; i < columns.length; i++) {

            var column = columns[i];

            if (i >= startColumn && i <= endColumn) {
                column.column.show();
                width += column.width;
            } else {
                column.column.hide();
            }
        }

        return width;
    },


    removeInvisibleEvents : function (leftBorder, rightBorder) {
        var me          = this,
            normalBody  = me.getNormalGridBody(),
            eventCls    = me.normalView.eventCls;

        var elements = normalBody.select('.' + eventCls).elements;

        for (var i = 0; i < elements.length; i++) {

            var start   = parseInt(elements[i].style.left, 10),
                end     = start + parseInt(elements[i].style.width, 10);

            if (end < leftBorder || start > rightBorder) {
                me.removeNode(elements[i]);
            }
        }
    },

    removeHiddenLockedColumns : function (lockedGrid) {
        var me = this,
            page = me.getCurrentPage(),
            tableBody = me.getLockedGridBody();

        for (var i = 0; i < me.lockedColumns.length; i++ ) {
            var column = me.lockedColumns[i].column;

            if ( i < lockedGrid.start || i > lockedGrid.end) {
                var headerSelector = '#' + column.getId();
                var header = page.select(headerSelector);
                me.removeNode(header);

                var cellSelector = column.getCellSelector();
                var cells = tableBody.select(cellSelector);
                me.removeNode(cells);
            }
        }
    },


    fitComponentIntoPage : function () {
        var me  = this;

        me.getComponent().setWidth(me.paperWidth);
    },


    restoreComponentState : function () {
        this.callParent(arguments);
        // restore locked columns visibility
        this.showLockedColumns();
    },


    setComponent : function () {
        var me      = this,
            columns = me.lockedColumns = [];

        me.callParent(arguments);

        // keep visible locked columns data
        me.lockedGrid.headerCt.items.each(function (column) {
            if (!column.hidden) {
                columns.push({
                    column  : column,
                    width   : column.getWidth()
                });
            }
        });
    }

});