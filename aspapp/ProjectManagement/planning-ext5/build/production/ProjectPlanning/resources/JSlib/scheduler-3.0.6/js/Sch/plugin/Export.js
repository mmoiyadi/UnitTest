/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.Export
 @extends Ext.util.Observable

 A plugin (ptype = 'scheduler_export') for generating PDF/PNG out of a scheduler panel. NOTE: This plugin will make an AJAX request to the server, POSTing
 the HTML to be exported. The {@link #printServer} URL must therefore be on the same domain as your application.

 ##Configuring/usage

 To use this plugin, add it to your scheduler as any other plugin. It is also required to have [PhantomJS][1] and [Imagemagick][2]
 installed on the server. The complete process of setting up a backend for this plugin can be found in the readme file inside export examples
 as well as on our [blog][3]. Note that export is currently not supported if your view (or store) is buffered.

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.Export', {
                    // default values
                    printServer: 'server.php'
                })
            ]
        });

 The Scheduler instance will be extended with two new methods:

* {@link #showExportDialog}, which shows export settings dialog

        scheduler.showExportDialog();

* {@link #doExport} which actually performs the export operation using {@link #exportConfig} or provided config object :

        scheduler.doExport({
            format      : "A5",
            orientation : "landscape",
            range       : "complete",
            showHeader  : true,
            exporterId  : "singlepage"
        });


##Export options

 In the current state, plugin gives few options to modify the look and feel of the generated PDF document throught a dialog window :

 {@img scheduler/images/export_dialog.png}

If no changes are made to the form, the {@link #exportConfig} will be used.

###Export Range

 This setting controls the timespan visible on the exported document. Three options are available here :

 {@img scheduler/images/export_dialog_ranges.png}

####Complete schedule

 Whole current timespan will be visible on the exported document.

####Date range

 User can select the start and end dates (from the total timespan of the panel) visible on the exported document.

 {@img scheduler/images/export_dialog_ranges_date.png}

####Current view

 Timespan of the exported document/image will be set to the currently visible part of the time axis. User can control
 the width of the time column and height of row.

 {@img scheduler/images/export_dialog_ranges_current.png}

##Page number

 To add a page number is the header

 {@img scheduler/images/export_page_number.png}


##Export mode

 Choose an exporter. The default exporter is `Multi pages`.

 {@img scheduler/images/export_modes.png}

 Options:

-  `Single page`. Creates an export that fits one single page.

-  `Multi pages`. Creates an export that creates pages in both vertical and horizontal direction.

-  `Multi pages (vertical)`. Creates an export that creates pages in vertical direction.


##Paper Format

 This combo gives control of the size of the generated document/image by choosing one from a list of supported ISO paper sizes : (`A5`, `A4`, `A3`, `Letter`).
 Generated PDF has a fixed DPI value of 72. Dafault format is `A4`.

 {@img scheduler/images/export_dialog_format.png}

###Orientation

 This setting defines the orientation of the generated document/image.

 {@img scheduler/images/export_dialog_orientation.png}

 Default option is the `portrait` (horizontal) orientation :

 {@img scheduler/images/export_dialog_portrait.png}

 Second option is the `landscape` (vertical) orientation :

 {@img scheduler/images/export_dialog_landscape.png}

 ##Custom export styling
 A special "sch-export" CSS class is added to the body of the exported pages so that you can have special
 styles in your exported chart.

 [1]: http://www.phantomjs.org
 [2]: http://www.imagemagick.org
 [3]: http://bryntum.com/blog

 */
Ext.define('Sch.plugin.Export', {
    extend                  : 'Ext.util.Observable',

    alternateClassName      : 'Sch.plugin.PdfExport',

    alias                   : 'plugin.scheduler_export',

    mixins                  : ['Ext.AbstractPlugin', 'Sch.mixin.Localizable'],

    requires        : [
        'Ext.XTemplate',
        'Sch.plugin.exporter.SinglePage',
        'Sch.plugin.exporter.MultiPage',
        'Sch.plugin.exporter.MultiPageVertical'
    ],

    lockableScope           : 'top',

    /**
     * @cfg {Object} pageSizes
     * Definition of all available paper sizes.
     */
    pageSizes               : {
        A5      : {
            width   : 5.8,
            height  : 8.3
        },
        A4      : {
            width   : 8.3,
            height  : 11.7
        },
        A3      : {
            width   : 11.7,
            height  : 16.5
        },
        Letter  : {
            width   : 8.5,
            height  : 11
        },
        Legal   : {
            width   : 8.5,
            height  : 14
        }
    },


    /**
     * @cfg {Number} DPI
     * DPI (Dots per inch) resolution.
     */
    DPI                     : 72,

    /**
     * @cfg {String}
     * URL of the server responsible for running the export steps.
     */
    printServer             : undefined,


    /**
     * @cfg {Number}
     * The timeout in milliseconds to be used for print requests to server.
     */
    timeout                 : 60000,


    /**
     * @cfg {String} headerTpl
     * Template of extracted page header.
     */
    headerTpl               : null,

    /**
     * @cfg {Function} headerTplDataFn
     * If defined provides data for the {@link #headerTpl}.
     * To define the scope please use {@link #headerTplDataFnScope}.
     * @return {Object} Header template data.
     */
    headerTplDataFn        : null,

    /**
     * @cfg {Object} headerTplDataFnScope Scope for the {@link #headerTplDataFn} function.
     */
    headerTplDataFnScope   : null,

    /**
     * @cfg {String} tpl
     * Template of extracted page.
     */
    tpl                     : null,

    /**
     * @cfg {String} footerTpl
     * Template of extracted page footer.
     */
    footerTpl               : null,

    /**
     * @cfg {Function} footerTplDataFn
     * If defined provides data for the {@link #footerTpl}.
     * To define the scope please use {@link #footerTplDataFnScope}.
     * @return {Object} Footer template data.
     */
    footerTplDataFn        : null,

    /**
     * @cfg {Object} footerTplDataFnScope Scope for the {@link #footerTplDataFn} function.
     */
    footerTplDataFnScope   : null,

    /**
     * @cfg {String}
     * Class name of the dialog used to change export settings.
     */
    exportDialogClassName   : 'Sch.widget.ExportDialog',

    /**
     * @cfg {Object}
     * Config object for the {@link #exportDialogClassName}. Use this to override default values for the export dialog.
     */
    exportDialogConfig      : {},

    /**
     * @cfg {Object}
     * Config object to apply to each {@link Sch.plugin.exporter.AbstractExporter exporter} being registered.
     */
    exporterConfig          : null,

    /**
     * @cfg {Object}
     * Default export configuration.
     */
    exportConfig           : {
        format              : "A4",
        orientation         : "portrait",
        range               : "complete",
        showHeader          : true,
        showFooter          : false
    },

    /**
     * @cfg {Boolean} expandAllBeforeExport Only applicable for tree views, set to true to do a full expand prior to the export. Defaults to false.
     */
    expandAllBeforeExport   : false,

    /**
     * @cfg {Boolean} translateURLsToAbsolute `True` to replace all linked CSS files URLs to absolute before passing HTML to the server.
     */
    translateURLsToAbsolute : true,

    /**
     * @cfg {Boolean}
     * If set to true, open new window with the generated document after the operation has finished.
     */
    openAfterExport         : true,

    /**
     * An empty function by default, but provided so that you can perform a custom action
     * before the export plugin extracts data from the scheduler.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler instance
     * @param {Object[]} ticks The ticks gathered by plugin to export.
     * @template
     * @method beforeExport
     */
    beforeExport            : Ext.emptyFn,

    /**
     * An empty function by default, but provided so that you can perform a custom action
     * after the export plugin has extracted the data from the scheduler.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} scheduler The scheduler instance
     * @template
     * @method afterExport
     */
    afterExport             : Ext.emptyFn,



    /**
     * @cfg {String}
     * Format of the exported file, selectable from `pdf` or `png`. By default plugin exports panel contents to PDF
     * but PNG file format is also available.
     */
    fileFormat              : 'pdf',

    /**
     * @cfg {String}
     * The exporterId of the default exporter to be used.
     * The corresponding export mode will be selected in {@link Sch.widget.ExportDialog export dialog} by default.
     */
    defaultExporter         : 'multipage',

    /**
     * @cfg {Array[Sch.plugin.exporter.AbstractExporter/Object]}
     * The list of available exporters.
     * If no value is provided the list will be filled automatically (see {@link #buildExporters}).
     */
    exporters               : undefined,

    callbacks               : undefined,

    /**
     * @event hidedialogwindow
     * Fires to hide the dialog window.
     * @param {Object} response Full server response.
     */

    /**
     * @event showdialogerror
     * Fires to show error in the dialog window.
     * @param {Ext.window.Window} dialog The dialog used to change export settings.
     * @param {String} message Error message to show in the dialog window.
     * @param {Object} response Full server response.
     */

    /**
     * @event updateprogressbar
     * Fires when a progressbar of the {@link #exportDialogClassName dialog} should update it's value.
     * @param {Number} value Value (between 0 and 1) to set on the progressbar.
     * @param {Object} [response] Full server response. This argument is specified only when `value` equals to `1`.
     */

    /**
     * @event beforeexport
     * Fires before the exporting is started. Return `false` to cancel exporting.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} component A scheduler panel to be exported.
     * @param {Object} config Export configuration.
     */

    constructor : function (config) {
        var me              = this;

        config              = config || {};

        me.exportersIndex   = {};

        if (config.exportDialogConfig) {
            Ext.Object.each(this.exportConfig, function (k, v, o) {
                var configK = config.exportDialogConfig[k];
                if (configK) {
                    o[k] = configK;
                }
            });
        }

        me.callParent([ config ]);

        me.setFileFormat(me.fileFormat);

        // if no exporters specified let's set the list of available by default
        if (!me.exporters) {
            me.exporters    = me.buildExporters();
        }

        // instantiate exporters instances in case there were provided just objects w/ xclass
        me.initExporters();

        // listen to exporters events
        me.bindExporters();
    },

    init : function (scheduler) {
        var me                      = this;

        scheduler.showExportDialog  = Ext.Function.bind(me.showExportDialog, me);
        scheduler.doExport          = Ext.Function.bind(me.doExport, me);

        me.scheduler                = scheduler;
    },


    initExporters : function () {
        var me          = this,
            exporters   = me.exporters;

        for (var i = 0; i < exporters.length; i++) {
            if (!(exporters[i] instanceof Sch.plugin.exporter.AbstractExporter)) {
                exporters[i]    = me.createExporter(exporters[i]);
            }
        }
    },


    bindExporters : function () {
        var exporters   = this.exporters;

        for (var i = 0; i < exporters.length; i++) {
            this.bindExporter(exporters[i]);
        }
    },


    bindExporter : function (exporter) {
        var me  = this;

        me.mon(exporter, {
            commitpage  : me.onPageCommit,
            collectrows : me.onRowCollected,
            scope       : me
        });

    },


    unbindExporter : function (exporter) {
        var me  = this;

        me.mun(exporter, {
            commitpage  : me.onPageCommit,
            collectrows : me.onRowCollected,
            scope       : me
        });

    },


    /**
     * @protected
     * Provides the list of available exporter instances.
     * This method is used to build the default state of the list when no {@link #exporters} provided.
     * @returns {Array[Sch.plugin.exporter.AbstractExporter]} List of exporters.
     */
    buildExporters : function () {
        return [ 'Sch.plugin.exporter.SinglePage', 'Sch.plugin.exporter.MultiPage', 'Sch.plugin.exporter.MultiPageVertical' ];
    },

    /**
     * @protected
     * Returns config for an exporter being initialized.
     * Override this to provide custom options for exporters being created.
     */
    getExporterConfig : function (className, config) {
        var me      = this;

        var result  = Ext.apply({
            translateURLsToAbsolute : me.translateURLsToAbsolute,
            expandAllBeforeExport   : me.expandAllBeforeExport,
            DPI                     : me.DPI
        }, me.exporterConfig);

        if (me.headerTpl) result.headerTpl  = me.headerTpl;

        if (me.headerTplDataFn) {
            result.headerTplDataFn          = me.headerTplDataFn;
            result.headerTplDataFnScope     = me.headerTplDataFnScope;
        }

        if (me.tpl) result.tpl              = me.tpl;
        if (me.footerTpl) result.footerTpl  = me.footerTpl;

        if (me.footerTplDataFn) {
            result.footerTplDataFn          = me.footerTplDataFn;
            result.footerTplDataFnScope     = me.footerTplDataFnScope;
        }

        return result;
    },


    // @protected
    createExporter : function (className, config) {
        var me              = this,
            exporterConfig  = me.getExporterConfig(className, config);

        if (Ext.isObject(className)) {
            return Ext.create(Ext.apply(exporterConfig, className));
        } else {
            return Ext.create(className, Ext.apply(exporterConfig, config));
        }
    },


    /**
     * Adds an exporter.
     * @param  {Sch.plugin.exporter.AbstractExporter/String} [exporter] An exporter to add.
     * Might be provided as {@link Sch.plugin.exporter.AbstractExporter} instance or as a class name string plus a configuration object:
     *
     *   plugin.registerExporter('MyExporter', { foo : 'bar' });
     *
     * Can be ommited to use configuration object only:
     *
     *   plugin.registerExporter({ xclass : 'MyExporter', foo : 'bar' });
     *
     * @param  {Object} [config]    A configuration object
     */
    registerExporter : function (exporter, config) {
        if (!(exporter instanceof Sch.plugin.exporter.AbstractExporter)) {
            exporter    = this.createExporter.apply(this, arguments);
        }

        this.exporters.push(exporter);

        this.bindExporter(exporter);
    },


    /**
     * Function that returns an exporter instance based on provided exporterId.
     *
     * @param {String} exporterId string indicating the registered exporter.
     *
     * @return {Sch.plugin.exporter.AbstractExporter} an instance of the exporter.
     */
    getExporter : function (exporterId) {
        if (!exporterId) return;

        var result  = this.exportersIndex[exporterId];
        if (result) return result;

        result      = this.exportersIndex[exporterId] = Ext.Array.findBy(this.exporters, function (i) {
            return i.getExporterId() == exporterId;
        });

        return result;
    },

    /**
     * Function that returns all registered exporters.
     *
     * @return {Object} an Object containing registered exporters.
     */
    getExporters : function () {
        return this.exporters;
    },

    /**
     * Function for setting the {@link #fileFormat} of exporting panel. Can be either `pdf` or `png`.
     *
     * @param {String} format format of the file to set. Can take either `pdf` or `png`.
     */
    setFileFormat : function (format) {
        if (typeof format !== 'string') {
            this.fileFormat = 'pdf';
        } else {
            format = format.toLowerCase();

            if (format === 'png') {
                this.fileFormat = format;
            } else {
                this.fileFormat = 'pdf';
            }
        }
    },

    /**
     * Instantiates and shows a new {@link #exportDialogClassName} class using {@link #exportDialogConfig} config.
     * This popup should give user possibility to change export settings.
     */
    showExportDialog : function() {
        var me   = this,
            view = me.scheduler.getSchedulingView();

        //dialog window is always removed to avoid resetting its layout after hiding
        if (me.win) {
            me.win.destroy();
            me.win = null;
        }

        me.win  = Ext.create(me.exportDialogClassName, {
            plugin                  : me,
            exportDialogConfig      : Ext.apply({
                startDate       : me.scheduler.getStart(),
                endDate         : me.scheduler.getEnd(),
                rowHeight       : view.timeAxisViewModel.getViewRowHeight(),
                columnWidth     : view.timeAxisViewModel.getTickWidth(),
                defaultExporter : me.defaultExporter,
                exporters       : me.exporters,
                exportConfig    : me.exportConfig
            }, me.exportDialogConfig)
        });

        me.win.show();
    },


    getExportConfig : function (config) {
        var me      = this;

        var result      = Ext.apply({
            fileFormat      : me.fileFormat,
            exporterId      : me.defaultExporter,
            beforeExport    : Ext.Function.bind(me.beforeExport, me),
            afterExport     : Ext.Function.bind(me.afterExport, me)
        }, config, me.exportConfig);

        // get effective DPI
        result.DPI              = result.DPI || me.DPI;
        // get page size for provided paper format
        result.pageSize         = Ext.apply({}, me.pageSizes[result.format]);
        // covert page size to pixels
        result.pageSize.width   *= result.DPI;
        result.pageSize.height  *= result.DPI;

        return result;
    },


    /**
     * Function performing the export operation using provided config. After getting data
     * from the scheduler an XHR request to {@link #printServer} will be made with the following JSON encoded data :
     *
     * * `html`        - array of HTML strings containing data of each page
     * * `format`      - paper size of the exported file
     * * `orientation` - orientation of the exported file
     * * `range`       - range of the exported file
     * * `fileFormat`  - file format of the exported file
     *
     * @param {Object} [conf] Config options for exporting. If not provided, {@link #exportConfig} is used. Possible parameters are :
     * @param {String} [conf.format]            - format of the exported document/image, selectable from the {@link #pageSizes} list.
     * @param {String} [conf.orientation]       - orientation of the exported document/image. Either `portrait` or `landscape`.
     * @param {String} [conf.range]             - range of the panel to be exported. Selectable from `complete`, `current`, `date`.
     * @param {Boolean} [conf.showHeader]       - boolean value defining if exported pages should have row/column numbers added in the headers.
     * @param {String} [conf.exporterId]        - string value defining which exporter to use.
     *
     * @param {Function} [callback] Optional function that will be called after successful response from export backend script.
     * @param {Function} [errback] Optional function that will be called if export backend script returns error.
     */
    doExport : function (conf, callback, errback, scope) {

        var me          = this,
            component   = me.scheduler,
            config      = me.getExportConfig(conf);

        me.callbacks     = {
            success     : callback || Ext.emptyFn,
            failure     : errback || Ext.emptyFn,
            scope       : scope || me
        };

        var exporter    = me.exporter = me.getExporter(config.exporterId);

        // if we have exporter
        if (exporter && me.fireEvent('beforeexport', component, exporter, config) !== false) {

            me.mask();

            me.exporter.extractPages(component, config, function (pages) {

                me.fireEvent('updateprogressbar', 0.8, this.L('requestingPrintServer'));

                me.doRequest(pages, config);

            }, me);
        }
    },


    onRowCollected : function (exporter, startIndex, endIndex, total) {
        this.fireEvent('updateprogressbar', 0.2 * (endIndex + 1) / total, Ext.String.format(this.L('fetchingRows'), endIndex + 1, total));
    },


    onPageCommit : function (exporter, page, pageNum, total) {
        total   = Math.max(pageNum, total);
        this.fireEvent('updateprogressbar', 0.2 + 0.6 * pageNum / total, Ext.String.format(this.L('builtPage'), pageNum, total));
    },


    /**
     * @private
     * Function that is called when the exportserver returned success. This function will fire the events updateprogressbar and hidedialogwindow.
     * When provided in doExport the callback success function is called.
     * The exported file will be dialogged when the @openAfterExport property is set to true (default).
     */

    onExportSuccess : function (result) {
        var me          = this,
            win         = me.getWin(),
            callbacks   = me.callbacks,
            fn          = callbacks && callbacks.success,
            scope       = callbacks && callbacks.scope || me;

        //set progress to 100%
        me.fireEvent('updateprogressbar', 1);

        me.unmask();

        fn && fn.apply(scope, arguments);

        setTimeout(function() {
            me.fireEvent('hidedialogwindow', result);

            if (me.openAfterExport) {
                window.open(result.url, 'ExportedPanel');
            }

        }, win ? win.hideTime : 3000);
    },

    /**
     * @private
     * Function that is called when the exportserver returned failure. This function will fire the event showdialogerror.
     * When provided in doExport the callback failure is called.
     *
     * @param {String} message Error message provided with the failure.
     * @param {Object} Response object when the failure is a serverside failure.
     */

    onExportFailure : function (message, result) {
        var me          = this,
            win         = this.getWin(),
            callbacks   = me.callbacks,
            fn          = callbacks && callbacks.failure,
            scope       = callbacks && callbacks.scope || me;

        fn && fn.call(scope, message);

        me.fireEvent('showdialogerror', win, message, result);

        me.unmask();
    },


    /**
     * @protected
     * Launches a request to the {@link #printServer print server}.
     * On return {@link #onRequestSuccess} or {@link #onRequestFailure} will be called with the returned response.
     * @param {Array} exportedPages An array of paginated component content.
     * @param {Object} config Export configuratin.
     */
    doRequest : function (exportedPages, config) {

        var me          = this,
            component   = me.scheduler;

        if (!me.test && !me.debug) {

            if (me.printServer) {

                var ajaxConfig = {
                    type        : 'POST',
                    url         : me.printServer,
                    timeout     : me.timeout,
                    params      : Ext.apply({
                        html        : {
                            array : Ext.JSON.encode(exportedPages)
                        },
                        startDate   : component.getStartDate(),
                        endDate     : component.getEndDate(),
                        format      : me.exporter.getPaperFormat(),
                        orientation : config.orientation,
                        range       : config.range,
                        fileFormat  : me.fileFormat
                    }, this.getParameters()),
                    success     : me.onRequestSuccess,
                    failure     : me.onRequestFailure,
                    scope       : me
                };

                Ext.apply(ajaxConfig, this.getAjaxConfig(ajaxConfig));

                Ext.Ajax.request(ajaxConfig);

            } else {
                me.onExportFailure('Print server URL is not defined, please specify printServer config');
            }

        } else {

            if (me.debug) {
                var pages   = exportedPages || [];

                for (var i = 0, l = pages.length; i < l; i++) {
                    var w = window.open();

                    w.document.write(pages[i].html);
                    w.document.close();
                }
            }

            me.onExportSuccess(me.testResponse || { success : true, url : 'foo', htmlArray : exportedPages });
        }
    },

    /**
     * @protected
     * Runs on request succesful completion.
     * @param  {Object} response Server response.
     */
    onRequestSuccess : function (response) {
        var me  = this,
            result;

        try {
            result = Ext.JSON.decode(response.responseText);
        } catch (e) {
            me.onExportFailure('Wrong server response received');
            return;
        }

        if (result.success) {
            me.onExportSuccess(result);

        } else {
            me.onExportFailure(result.msg, result);
        }
    },

    /**
     * @protected
     * Runs on request failure.
     * @param  {Object} response Server response.
     */
    onRequestFailure : function (response) {
        var me  = this,
            msg = response.status === 200 ? response.responseText : response.statusText;

        me.onExportFailure(msg, response);
    },

    /**
     * @template
     * This method can be used to apply additional parameters to the 'params' property of the export {@link Ext.Ajax XHR} request.
     * By default this method returns an empty object.
     * @return {Object}
     */
    getParameters : function () {
        return {};
    },

    /**
     * This method can be used to return any extra configuration properties applied to the {@link Ext.Ajax#request} call.
     * @template
     * @param {Object} config The proposed Ajax configuration settings. You may read any properties from this object, but modify it at your own risk.
     * @return {Object}
     */
    getAjaxConfig : function (config) {
        return {};
    },

    //Private used to prevent using old reference in the response callbacks
    getWin : function () {
        return this.win || null;
    },

    /*
     * @private
     * Mask the body, hiding panel to allow changing it's parameters in the background.
     */
    mask : function () {
        var mask = Ext.getBody().mask();
        mask.addCls('sch-export-mask');
    },

    //Private.
    unmask : function () {
        Ext.getBody().unmask();
    },

    destroy : function () {
        this.callParent(arguments);

        if (this.win) {
            this.win.destroy();
        }
    }
});