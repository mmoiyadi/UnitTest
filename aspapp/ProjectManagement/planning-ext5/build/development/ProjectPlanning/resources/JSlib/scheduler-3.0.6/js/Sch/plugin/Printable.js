/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.Printable

Plugin (ptype = 'scheduler_printable') for printing an Ext Scheduler instance. Please note that this will not generate a picture perfect
 printed version, due to various limitations in the browser print implementations. If you require a high quality print, you should use the Export plugin instead and first export to PDF.

 To use this plugin, add it to scheduler as usual. The plugin will add an additional `print` method to the scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.Printable', {
                    // default values
                    docType             : '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
                    autoPrintAndClose   : true
                })
            ]
        });

        ...

        scheduler.print();

In the opened print window, a special 'sch-print-body' CSS class will be added to the BODY element. You can use this to
 further customize the printed contents.

*/
Ext.define("Sch.plugin.Printable", {
    extend          : 'Ext.AbstractPlugin',

    alias           : 'plugin.scheduler_printable',

    requires        : [
        'Ext.XTemplate'
    ],

    lockableScope   : 'top',

    /**
     * @cfg {String} docType This is the DOCTYPE to use for the print window. It should be the same DOCTYPE as on your application page.
     */
    docType             : '<!DOCTYPE HTML>',

    /**
     * An empty function by default, but provided so that you can perform a custom action
     * before the print plugin extracts data from the scheduler.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler instance
     * @method beforePrint
     */
    beforePrint         : Ext.emptyFn,

    /**
     * An empty function by default, but provided so that you can perform a custom action
     * after the print plugin has extracted the data from the scheduler.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler instance
     * @method afterPrint
     */
    afterPrint          : Ext.emptyFn,

    /**
     * @cfg {Boolean} autoPrintAndClose True to automatically call print and close the new window after printing. Default value is `true`
     */
    autoPrintAndClose   : true,

     /**
     * @cfg {Boolean} fakeBackgroundColor True to reset background-color of events and enable use of border-width to fake background color (borders print by default in every browser). Default value is `true`
     */
    fakeBackgroundColor : true,

    scheduler           : null,

    // private, the template for the new window
    mainTpl        : null,

    constructor : function(config) {
        Ext.apply(this, config);

        if (!this.mainTpl) {

            this.mainTpl = new Ext.XTemplate('{docType}' +
                '<html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}">' +
                '<head>' +
                '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />' +
                '<title>{title}</title>' +
                '{styles}' +
                '</head>' +
                '<body class="sch-print-body {bodyClasses}">' +
                '<div class="sch-print-ct {componentClasses}" style="width:{totalWidth}px">' +
                '<div class="sch-print-headerbg" style="border-left-width:{totalWidth}px;height:{headerHeight}px;"></div>' +
                '<div class="sch-print-header-wrap">' +
                '{[this.printLockedHeader(values)]}' +
                '{[this.printNormalHeader(values)]}' +
                '</div>' +
                '{[this.printLockedGrid(values)]}' +
                '{[this.printNormalGrid(values)]}' +
                '</div>' +
                '<script type="text/javascript">' +
                '{setupScript}' +
                '</script>' +
                '</body>' +
                '</html>',
            {
                printLockedHeader : function (values) {
                    var str = '';

                    if (values.lockedGrid) {
                        str += '<div style="left:-' + values.lockedScroll + 'px;margin-right:-' + values.lockedScroll + 'px;width:' + (values.lockedWidth + values.lockedScroll) + 'px"';
                        str += 'class="sch-print-lockedheader ' + values.lockedGrid.headerCt.el.dom.className + '">';
                        str += values.lockedHeader;
                        str += '</div>';
                    }
                    return str;
                },
                printNormalHeader : function (values) {
                    var str = '';

                    if (values.normalGrid) {
                        str += '<div style="left:' + (values.lockedGrid ? values.lockedWidth : '0') + 'px;width:' + values.normalWidth + 'px;" class="sch-print-normalheader ' + values.normalGrid.headerCt.el.dom.className + '">';
                        str += '<div style="margin-left:-' + values.normalScroll + 'px">' + values.normalHeader + '</div>';
                        str += '</div>';
                    }
                    return str;
                },
                printLockedGrid   : function (values) {
                    var str = '';

                    if (values.lockedGrid) {
                        str += '<div id="lockedRowsCt" style="left:-' + values.lockedScroll + 'px;margin-right:-' + values.lockedScroll + 'px;width:' + (values.lockedWidth + values.lockedScroll) + 'px;top:' + values.headerHeight + 'px;" class="sch-print-locked-rows-ct ' + values.innerLockedClasses + ' ' + Ext.baseCSSPrefix + 'grid-inner-locked">';
                        str += values.lockedRows;
                        str += '</div>';
                    }
                    return str;
                },
                printNormalGrid   : function (values) {
                    var str = '';

                    if (values.normalGrid) {
                        str += '<div id="normalRowsCt" style="left:' + (values.lockedGrid ? values.lockedWidth : '0') + 'px;top:' + values.headerHeight + 'px;width:' + values.normalWidth + 'px" class="sch-print-normal-rows-ct ' + values.innerNormalClasses + '">';
                        str += '<div style="position:relative;overflow:visible;margin-left:-' + values.normalScroll + 'px">' + values.normalRows + '</div>';
                        str += '</div>';
                    }
                    return str;
                }
            });
        }
    },

    init : function(scheduler) {
        this.scheduler = scheduler;

        scheduler.print = Ext.Function.bind(this.print, this);
    },

    // private
    getGridContent : function(component) {
        var normalGrid = component.normalGrid,
            lockedGrid = component.lockedGrid,
            lockedView = lockedGrid.getView(),
            normalView = normalGrid.getView(),
            header, lockedRows, normalRows, lockedScroll, normalScroll,
            normalWidth, lockedWidth;

        this.beforePrint(component);

        if (lockedGrid.collapsed && !normalGrid.collapsed){
            normalWidth = lockedGrid.getWidth() + normalGrid.getWidth();
        } else {
            normalWidth = normalGrid.getWidth();
            lockedWidth = lockedGrid.getWidth();
        }

        // Render rows
        var records  = lockedView.store.getRange();
        lockedRows   = lockedView.tpl.apply(lockedView.collectData(records, 0));
        normalRows   = normalView.tpl.apply(normalView.collectData(records, 0));
        lockedScroll = lockedView.el.getScroll().left;
        normalScroll = normalView.el.getScroll().left;

        var div = document.createElement('div');
        div.innerHTML = lockedRows;
        // Need to manually set a width on the table el
        div.firstChild.style.width = lockedView.el.dom.style.width;

        lockedRows = div.innerHTML;

        // Print additional markup produced by lines plugins, zones plugins etc
        if (Sch.feature && Sch.feature.AbstractTimeSpan) {
            var toIterate = (component.plugins || []).concat(component.normalGrid.plugins || []).concat(component.columnLinesFeature || []);
            Ext.each(toIterate, function(plug) {
                if (plug instanceof Sch.feature.AbstractTimeSpan && plug.generateMarkup) {
                    normalRows = plug.generateMarkup(true) + normalRows;
                }
            });
        }

        this.afterPrint(component);

        return {
            normalHeader       : normalGrid.headerCt.el.dom.innerHTML,
            lockedHeader       : lockedGrid.headerCt.el.dom.innerHTML,
            lockedGrid         : lockedGrid.collapsed ? false : lockedGrid,
            normalGrid         : normalGrid.collapsed ? false : normalGrid,
            lockedRows         : lockedRows,
            normalRows         : normalRows,
            lockedScroll       : lockedScroll,
            normalScroll       : normalScroll,
            lockedWidth        : lockedWidth - (Ext.isWebKit ? 1 : 0),
            normalWidth        : normalWidth,
            headerHeight       : normalGrid.headerCt.getHeight(),
            innerLockedClasses : lockedGrid.view.el.dom.className,
            innerNormalClasses : normalGrid.view.el.dom.className + (this.fakeBackgroundColor ? ' sch-print-fake-background' : ''),
            width              : component.getWidth()
        };
    },

    getStylesheets : function() {
        return Ext.getDoc().select('link[rel="stylesheet"]');
    },

    /**
     * Prints a scheduler panel. This method will be aliased to the main scheduler instance, so you can call it directly:
     *
     *      scheduler.print()
     */
    print : function() {
        var component = this.scheduler;

        if (!(this.mainTpl instanceof Ext.Template)) {
            // Compile the tpl upon first call
            var headerRowHeight = 22;

            this.mainTpl = new Ext.XTemplate(this.mainTpl, {
                compiled : true,
                disableFormats : true
            });
        }

        var v = component.getView(),
            styles = this.getStylesheets(),
            ctTmp = Ext.get(Ext.core.DomHelper.createDom({
                tag : 'div'
            })),
            styleFragment;

        styles.each(function(s) {
            ctTmp.appendChild(s.dom.cloneNode(true));
        });

        styleFragment = ctTmp.dom.innerHTML + '';

        var gridContent = this.getGridContent(component),
            html = this.mainTpl.apply(Ext.apply({
                waitText            : this.waitText,
                docType             : this.docType,
                htmlClasses         : Ext.getBody().parent().dom.className,
                bodyClasses         : Ext.getBody().dom.className,
                componentClasses    : component.el.dom.className,
                title               : (component.title || ''),
                styles              : styleFragment,
                totalWidth          : component.getWidth(),
                setupScript         : ("window.onload = function(){ (" + this.setupScript.toString() + ")(" +
                    component.syncRowHeight + ", " + this.autoPrintAndClose + ", " + Ext.isChrome + ", " + Ext.isIE +
                "); };")
            }, gridContent));

        var win             = window.open('', 'printgrid');

        // this crazy case (there's a window but win.document is null) happens sometimes in IE10 during testing in automation mode
        if (!win || !win.document) return false;

        // Assign to this for testability, need a reference to the opened window
        this.printWindow    = win;

        win.document.write(html);
        win.document.close();
    },

    // Script executed in the newly open window, to sync row heights
    setupScript : function (syncRowHeight, autoPrintAndClose, isChrome, isIE) {
        var syncHeightAndPrint  = function () {
            if (syncRowHeight) {
                var lockedTableCt = document.getElementById('lockedRowsCt'),
                    normalTableCt = document.getElementById('normalRowsCt'),

                    //checks added in case of hidden/collapsed grids
                    lockedRows = lockedTableCt && lockedTableCt.getElementsByTagName('tr'),
                    normalRows = normalTableCt && normalTableCt.getElementsByTagName('tr'),
                    count      = normalRows && lockedRows ? normalRows.length : 0;

                for (var i = 0; i < count; i++) {
                    var normalHeight    = normalRows[ i ].clientHeight;
                    var lockedHeight    = lockedRows[ i ].clientHeight;

                    var max             = Math.max(normalHeight, lockedHeight) + 'px';

                    lockedRows[ i ].style.height = normalRows[ i ].style.height = max;
                }
            }

            // Let's make special mark saying that document is loaded. This is needed for test purposes.
            document._loaded  = true;

            if (autoPrintAndClose) {
                window.print();
                // Chrome cannot print the page if you close the window being printed
                if (!isChrome) {
                    window.close();
                }
            }
        };

        if (isIE)
            // TODO: probably we don't need this anymore, as we now use window.onload to call setupScript
            setTimeout(syncHeightAndPrint, 0);
        else
            syncHeightAndPrint();
    }
});
