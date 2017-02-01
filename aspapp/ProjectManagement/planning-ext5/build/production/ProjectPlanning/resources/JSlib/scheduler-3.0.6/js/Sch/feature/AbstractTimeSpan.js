/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.feature.AbstractTimeSpan
@extends Ext.AbstractPlugin

Plugin for visualizing "global" time span in the scheduler grid, these can by styled easily using just CSS. This is an abstract class not intended for direct use.

*/

if (!Ext.ClassManager.get("Sch.feature.AbstractTimeSpan")) {

Ext.define("Sch.feature.AbstractTimeSpan", {
    extend              : 'Ext.AbstractPlugin',
    
    mixins              : {
        observable      : 'Ext.util.Observable'
    },
    
    lockableScope       : 'top',
    
    schedulerView       : null,
    timeAxis            : null,
    containerEl         : null,
    
    // If lines/zones should stretch to fill the whole view container element in case the table does not fill it
    expandToFitView     : false,
    
    disabled            : false,
    
    /**
     * @property {String} cls An internal css class which is added to each rendered timespan element
     * @private
     */
    cls                 : null,
    
    /**
     * @cfg {String} clsField Name of field  
     */
    clsField            : 'Cls',
    
    /**
     * @cfg {Ext.XTemplate} template Template to render the timespan elements  
     */
    template            : null,
    
    /**
     * @cfg {Ext.data.Store/String} store A store with timespan data, or a string identifying a store.
     */
    store               : null,
    
    renderElementsBuffered      : false,
    
    /**
     * @cfg {Number} renderDelay Delay the zones rendering by this amount (in ms) to speed up the default rendering of rows and events.
     */
    renderDelay                 : 15,

    // true to refresh the sizes of the rendered elements when an item in the bound view changes
    // false to do a full refresh instead
    refreshSizeOnItemUpdate     : true,

    _resizeTimer                : null,
    _renderTimer                : null,
    
    /**
     * @cfg {Boolean} showHeaderElements Set this to `true` to show indicators in the timeline header area.
     * 
     * Header indicators are placed right above the corresponding element of the scheduling view. You can customize the HTML markup
     * for these indicators with the {@link #headerTemplate} config. Note that the indicators are rendered as a regular div element,
     * which will be styled differently in modern vs legacy browsers.
     *
     */
    showHeaderElements          : false,
    
    /**
     * @private
     * @cfg {Ext.XTemplate} headerTemplate Template used to render the header elements
     */
    headerTemplate              : null,
    
    
    /**
     * @cfg {String/Ext.XTemplate} innerHeaderTpl A template providing additional markup to render into each timespan header element
     */
    innerHeaderTpl              : null,
    
    headerContainerCls          : 'sch-header-secondary-canvas',
    headerContainerEl           : null,
    
    // event to be fired, when rendering has completed (only fired when all elements are rendered, not single)
    renderingDoneEvent          : null,
    

    constructor : function(cfg) {
        // unique css class to be able to identify only the zones belonging to this plugin instance
        this.uniqueCls = this.uniqueCls || ('sch-timespangroup-' + Ext.id());
        
        Ext.apply(this, cfg);
        
        this.mixins.observable.constructor.call(this);

        this.callParent(arguments);
    },

    
    /**
     * @param {Boolean} disabled Pass `true` to disable the plugin and remove all rendered elements.
     */
    setDisabled : function(disabled) {
        if (disabled) {
            this.removeElements();
        }
        
        this.disabled = disabled;
    },

    
    removeElements : function () {
        this.removeBodyElements();
        
        if (this.showHeaderElements) {
            this.removeHeaderElements();
        }
    },
    
    //Returns the currently rendered DOM elements of this plugin (if any), as a {@link Ext.CompositeElementLite} collection.
    getBodyElements : function() {
        if (this.containerEl) {
            return this.containerEl.select('.' + this.uniqueCls);
        }

        return null;
    },
    
    /**
     * Returns container to render header elements.
     * 
     * @return {Ext.dom.Element}
     */
    getHeaderContainerEl : function() {
        var containerEl = this.headerContainerEl,
            prefix = Ext.baseCSSPrefix,
            parent;
            
        if (!containerEl || !containerEl.dom) {
            if (this.schedulerView.isHorizontal()) {
                parent = this.panel.getHorizontalTimeAxisColumn().headerView.containerEl;
            } else {
                parent = this.panel.el.down('.' + prefix + 'grid-inner-locked' +
                    ' .' + prefix + 'panel-body' +
                    ' .' + prefix + 'grid-view');
            }
            
            if (parent) {
                containerEl = parent.down('.' + this.headerContainerCls);
                
                if (!containerEl) {
                    containerEl = parent.appendChild({
                        cls : this.headerContainerCls
                    });
                }
                
                this.headerContainerEl = containerEl;
            }
        }

        return containerEl;
    },
    
    
    getHeaderElements : function() {
        var containerEl = this.getHeaderContainerEl();
        
        if (containerEl) {
            return containerEl.select('.' + this.uniqueCls);
        }

        return null;
    },
    
    
    // private
    removeBodyElements : function() {
        var els = this.getBodyElements();
        
        if (els) {
            els.each(function(el) { el.destroy(); });
        }
    },
    
    
    removeHeaderElements : function() {
        var els = this.getHeaderElements();
        
        if (els) {
            els.each(function(el) { el.destroy(); });
        }
    },
    
    /**
     * Returns id of element for data record.
     * 
     * @param {Ext.data.Model} record
     * 
     * @return {String}
     */
    getElementId : function(record) {
        return this.uniqueCls + '-' + record.internalId;
    },
    
    /**
     * Returns id of header element for data record.
     * 
     * @param {Ext.data.Model} record
     * 
     * @return {String}
     */
    getHeaderElementId : function(record) {
        return this.uniqueCls + '-header-' + record.internalId;
    },
    
    /**
     * Returns template data to render elements.
     * 
     * @param {Ext.data.Model} record
     * 
     * @return {Object}
     */
    getTemplateData : function(record) {
        return this.prepareTemplateData ? this.prepareTemplateData(record) : record.data;
    },
    
    
    /**
     * Return element class for a record.
     * 
     * @param {Ext.data.Model} record Data record
     * @param {Object} data Template data
     * 
     * @return {String}
     */
    getElementCls : function(record, data) {
        var clsField = record.clsField || this.clsField;
            
        if (!data) {
            data = this.getTemplateData(record);
        }
        
        return this.cls + ' ' + this.uniqueCls + ' ' + (data[clsField] || '');
    },
    
    
    /**
     * Return header element class for data record.
     * 
     * @param {Ext.data.Model} record Data record
     * @param {Object} data
     * 
     * @return {String}
     */
    getHeaderElementCls : function(record, data) {
        var clsField = record.clsField || this.clsField;
            
        if (!data) {
            data = this.getTemplateData(record);
        }

        return 'sch-header-indicator ' + this.uniqueCls + ' ' + (data[clsField] || '');
    },
    
    
    init:function(scheduler) {
        // TODO COMMENT
        if (Ext.versions.touch && !scheduler.isReady()) {
            scheduler.on('viewready', function() { this.init(scheduler); }, this);
            return;
        }
        
        if (Ext.isString(this.innerHeaderTpl)) {
            this.innerHeaderTpl = new Ext.XTemplate(this.innerHeaderTpl);
        }
        
        var innerHeaderTpl = this.innerHeaderTpl;
        
        if (!this.headerTemplate) {
            this.headerTemplate = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div id="{id}" class="{cls}" style="{side}:{position}px;">' +
                    (innerHeaderTpl ? '{[this.renderInner(values)]}' : '') +
                    '</div>',
                '</tpl>',
                {
                    renderInner : function(values) {
                        return innerHeaderTpl.apply(values);
                    }
                }
            );
        }

        this.schedulerView = scheduler.getSchedulingView(); 
        this.panel = scheduler;
        this.timeAxis = scheduler.getTimeAxis();

        this.store = Ext.StoreManager.lookup(this.store);

        if (!this.store) {
            Ext.Error.raise("Error: You must define a store for this plugin");
        }

        if (!this.schedulerView.getEl()) {
            this.schedulerView.on({
                afterrender : this.onAfterRender, 
                scope       : this
            });
        } else {
            this.onAfterRender();
        }
    },
    
    
    onAfterRender : function (scheduler) {
        var view            = this.schedulerView;
        this.containerEl    = view.getSecondaryCanvasEl();

        this.storeListeners = {
            load            : this.renderElements,
            datachanged     : this.renderElements, 
            clear           : this.renderElements,
            
            // Ext JS
            add             : this.renderElements,
            remove          : this.renderElements, 
            update          : this.refreshSingle, 
            
            // Sencha Touch
            addrecords      : this.renderElements,
            removerecords   : this.renderElements,
            updaterecord    : this.refreshSingle,

            // Tree Store
            expand          : this.renderElements,
            collapse        : this.renderElements,

            scope           : this
        };

        this.store.on(this.storeListeners);

        view.on({
            bufferedrefresh     : this.renderElements,
            refresh             : this.renderElements,
            itemadd             : this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,
            itemremove          : this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,
            itemupdate          : this.refreshSizeOnItemUpdate ? this.refreshSizes : this.renderElements,

            // start grouping events
            groupexpand         : this.renderElements, 
            groupcollapse       : this.renderElements,
            
            columnwidthchange   : this.renderElements,
            resize              : this.renderElements,

            scope               : this
        });

        if (view.headerCt) {
            view.headerCt.on({
                add         : this.renderElements,
                remove      : this.renderElements,
                scope       : this
            });
        }

        this.panel.on({
            viewchange          : this.renderElements,
            show                : this.refreshSizes,
            modechange          : this.forceNewRenderingTimeout,
            
            scope               : this
        });
        
        var rowContainer = view.getRowContainerEl();

        if (rowContainer && rowContainer.down('.sch-timetd')) {
            this.renderElements();
        }
    },
    
    
    forceNewRenderingTimeout : function () {
        this.renderElementsBuffered = false;
        
        clearTimeout(this._renderTimer);
        clearTimeout(this._resizeTimer);

        this.renderElements();
    },

    
    refreshSizesInternal : function() {
        // This can only be called in Horizontal mode
        if (!this.schedulerView.isDestroyed && this.schedulerView.isHorizontal()) {
    
            // Date here is irrelevant, we just want a fresh height value
            var region = this.schedulerView.getTimeSpanRegion(new Date(), null, this.expandToFitView);
            this.getBodyElements().setHeight(region.bottom - region.top);
        }
    },
    
    refreshSizes : function() {
        clearTimeout(this._resizeTimer);

        this._resizeTimer = Ext.Function.defer(this.refreshSizesInternal, this.renderDelay, this);
    },

    
    renderElements : function() {
        if (this.renderElementsBuffered || this.disabled) return;

        this.renderElementsBuffered = true;

        clearTimeout(this._renderTimer);
        
        // Defer to make sure rendering is not delayed by this plugin
        // deferring on 15 because the cascade delay is 10 (cascading will trigger a view refresh)
        this._renderTimer = Ext.Function.defer(this.renderElementsInternal, this.renderDelay, this);
    },
    
    
    /**
     * Sets element X-coordinate relative direction (rtl or ltr).
     * 
     * @param {Ext.Element} el
     * @param {Number} x
     */
    setElementX : function(el, x) {
        if (this.panel.rtl) {
            el.setRight(x);
        } else {
            el.setLeft(x);
        }
    },

    /**
     * Returns position of header element by date.
     * 
     * @param {Date} date
     * 
     * @return {Number}
     */
    getHeaderElementPosition : function(date) {
        var viewModel = this.schedulerView.getTimeAxisViewModel();
        
        return Math.round(viewModel.getPositionFromDate(date));
    },
    
    
    renderBodyElementsInternal : function (records) {
        Ext.DomHelper.append(this.containerEl, this.generateMarkup(false, records));
    },
    
    
    getHeaderElementData : function(records, isPrint) {
        throw 'Abstract method call';
    },
    
    
    renderHeaderElementsInternal : function (records) {
        var containerEl = this.getHeaderContainerEl();
        
        if (containerEl) {
            Ext.DomHelper.append(containerEl, this.generateHeaderMarkup(false, records));
        }
    },
    
 
    renderElementsInternal : function() {
        this.renderElementsBuffered = false;

        // component could be destroyed during the buffering time frame
        if (this.disabled || this.schedulerView.isDestroyed) return;

        if (Ext.versions.extjs && !this.schedulerView.el.down('.' + Ext.baseCSSPrefix + 'grid-item-container')) return;

        this.removeElements();

        this.renderBodyElementsInternal();

        if (this.showHeaderElements) {
            this.headerContainerEl = null;
            this.renderHeaderElementsInternal();
        }
        
        if (this.renderingDoneEvent) this.fireEvent(this.renderingDoneEvent, this);
    },

    
    /**
     * Generates markup for elements.
     * 
     * @param {Boolean} isPrint
     * @param {Array} records
     *  
     * @return {String}
     */
    generateMarkup : function(isPrint, records) {
        var start       = this.timeAxis.getStart(),
            end         = this.timeAxis.getEnd(),
            data        = this.getElementData(start, end, records, isPrint);

        return this.template.apply(data);
    },
    
    
    /**
     * Generates markup for headers elements.
     * 
     * @param {Boolean} isPrint
     * @param {Array} records
     *  
     * @return {String}
     */
    generateHeaderMarkup : function (isPrint, records) {
        var data = this.getHeaderElementData(records, isPrint);

        return this.headerTemplate.apply(data);
    },


    getElementData : function (viewStart, viewEnd, records, isPrint) {
        throw 'Abstract method call';
    },
    
    
    updateBodyElement : function (record) {
        var el = Ext.get(this.getElementId(record));
        
        if (el) {
            var start       = this.timeAxis.getStart(), 
                end         = this.timeAxis.getEnd(),
                data        = this.getElementData(start, end, [record])[0];

            if (data) {
                // Reapply CSS classes
                el.dom.className = data.$cls;

                el.setTop(data.top);
                this.setElementX(el, data.left);
                
                el.setSize(data.width, data.height);
            } else {
                Ext.destroy(el);
            }
        } else {
            // if element is not found, then its probably a newly added record in the store
            // in this case `renderBodyElementsInternal` will only add markup for that record
            this.renderBodyElementsInternal([ record ]);
        }
    },
    
    
    updateHeaderElement : function (record) {
        var el = Ext.get(this.getHeaderElementId(record));
        
        if (el) {
            var data = this.getHeaderElementData([record])[0];

            if (data) {
                // Reapply CSS classes
                el.dom.className = data.cls;

                if (this.schedulerView.isHorizontal()) {
                    this.setElementX(el, data.position);
                    el.setWidth(data.size);
                } else {
                    el.setTop(data.position);
                    el.setHeight(data.size);
                }
            } else {
                Ext.destroy(el);
            }
        } else {
            // if element is not found, then its probably a newly added record in the store
            // in this case `renderHeaderElementsInternal` will only add markup for that record
            this.renderHeaderElementsInternal([record]);
        }
    },
    
    
    destroy : function() {
        clearTimeout(this._renderTimer);
        clearTimeout(this._resizeTimer);

        if (this.store.autoDestroy) {
            this.store.destroy();
        }

        this.store.un(this.storeListeners);
    },
    

    refreshSingle : function(store, records) {

        records = records instanceof Array ? records : [records];

        Ext.Array.forEach(records, function(record) {
            this.updateBodyElement(record);

            if (this.showHeaderElements) {
                this.updateHeaderElement(record);
            }
        }, this);
    }
}); 

}