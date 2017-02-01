/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.mixin.AbstractSchedulerPanel
@private

A mixin providing "scheduling" functionality to the consuming "panel".
A consuming class should have already consumed the {@link Sch.mixin.AbstractTimelinePanel} mixin.

This should not be used directly.

*/

Ext.define('Sch.mixin.AbstractSchedulerPanel', {

    requires: [
        'Sch.model.Event',
        'Sch.model.Resource',
        'Sch.data.EventStore',
        'Sch.data.ResourceStore',
        'Sch.util.Date',
        'Sch.plugin.ResourceZones'
    ],

    /**
    * @cfg {String} eventBarIconClsField
    * A field in the Event model whose value will be applied as a CSS class to each event bar to place a 16x16 icon.
    */
    eventBarIconClsField    : '',

    /**
    * @cfg {Boolean} enableEventDragDrop true to enable drag and drop of events, defaults to true
    */
    enableEventDragDrop: true,

    /**
    * @cfg {String} eventBarTextField The field in your data model that will be rendered into each event bar.
    * You can alternatively use the eventBarRenderer to get full control over what gets displayed.
    */

    /**
     * @cfg {String} resourceColumnClass
     * Defines the column class for the resources, override this to use your own custom column class. (Used only in vertical orientation)
     */
    resourceColumnClass : "Sch.column.Resource",

    /**
     * @cfg {Number} resourceColumnWidth
     * Used only in vertical mode. Defines the width of a single column.
     */
    resourceColumnWidth : null,
    
    /**
     * @cfg {Number} calendarColumnWidth
     * Used only in calendar mode. Defines the width of a single column.
     */
    calendarColumnWidth : null,

    /**
    * @cfg {Boolean} allowOverlap Set to false if you don't want to allow events overlapping (defaults to true).
    */
    allowOverlap: true,

    /**
    * @cfg {String} startParamName The name of the start date parameter that will be passed to in every `eventStore` load request.
    */
    startParamName: 'startDate',

    /**
    * @cfg {String} endParamName The name of the end date parameter that will be passed to in every `eventStore` load request.
    */
    endParamName: 'endDate',

    /**
    * @cfg {Boolean} passStartEndParameters true to apply start and end dates of the current view to any `eventStore` load requests.
    */
    passStartEndParameters: false,

    variableRowHeight : true,
    
    /**
     * @cfg {Number} barMargin
     * Controls how much space to leave between the event bars and the row borders. Defaults to 1.
     */

    /**
     * @cfg {Boolean} constrainDragToResource
     * Set to true to only allow dragging events within the same resource. Defaults to false.
     */

    /**
    * @cfg {Function} eventRenderer
    * An empty function by default, but provided so that you can override it. This function is called each time an event
    * is rendered into the schedule to render the contents of the event. It's called with the event, its resource and a tplData object which
    * allows you to populate data placeholders inside the event template.
    * By default, the {@link #eventTpl} includes placeholders for 'cls' and 'style'. The cls property is a CSS class which will be added to the
    * event element. The style property is an inline style declaration for the event element. If you override the default {@link #eventTpl}, you can of course
    * include other placeholder in your template markup. Note: You will still need to keep the original built-in placeholders for the scheduler to work.
    *
    * <pre>
    *  eventRenderer : function (eventRec, resourceRec, templateData) {
    *      templateData.style = 'color:white';                 // You can use inline styles too.
    *      templateData.cls = resourceRec.get('Category');     // Read a property from the resource record, used as a CSS class to style the event
    *
    *      return Ext.Date.format(eventRec.getStartDate(), 'Y-m-d') + ': ' + eventRec.getName();
    *  }
    *</pre>
    * @param {Sch.model.Event} eventRecord The event about to be rendered
    * @param {Sch.model.Resource} resourceRecord The resource row in which the event is being created
    * @param {Object} tplData An object that will be applied to the containing {@link #eventTpl}.
    * @param {Number} row The row index
    * @param {Number} col The column index
    * @param {Sch.data.ResourceStore} ds The resource store
    * @return {String/Object} A simple string, or a custom object which will be applied to the {@link #eventBodyTemplate}, creating the actual HTML
    */
    eventRenderer: null,

    /**
    * @cfg {Object} eventRendererScope The scope to use for the {@link #eventRenderer} function
    */
    eventRendererScope : null,

    /**
     * @cfg {Sch.data.EventStore} eventStore The {@link Ext.data.Store} holding the events to be rendered into the scheduler (required).
     * @required
     */
    eventStore: null,

    /**
     * @cfg {Sch.data.ResourceStore} resourceStore The {@link Ext.data.Store} holding the resources to be rendered into the scheduler (required).
     */
    resourceStore: null,

    /**
     * @method onEventCreated An empty function by default, but provided so that you can override it to supply default record values etc. This function is called after a new event has been created (but
     * before it is inserted to the store). This is for example called after a user dragged a new bar in the scheduler (the DragFreate feature).
     * @param {Sch.model.Event} eventRecord The event that was just created
     */
    onEventCreated: function (newEventRecord) {},

    /**
    * @cfg {Ext.Template} eventTpl The wrapping template used to renderer your events in the scheduler. Normally you should not override this,
    * only do so if you need total control of how the events are rendered/styled. See the {@link #eventBodyTemplate} for more information.
    */

    /**
    * @cfg {String/Ext.Template} eventBodyTemplate The template used to generate the markup of your events in the scheduler. To 'populate' the eventBodyTemplate with data, use the {@link #eventRenderer} method
    */

    /**
    *  @cfg {Object} timeAxisColumnCfg A {@link Ext.grid.column.Column} config used to configure the time axis column in vertical mode.
    */
    
    /**
     * @cfg {Object} calendarTimeAxisCfg A {@link Ext.grid.column.Column} config used to configure the time axis column in calendar mode.
     */

    /**
     * @cfg {Sch.data.EventStore} resourceZones A special store containing data used to highlight the underlying schedule for the resources,
     * using {@link Sch.plugin.ResourceZones}. This can be used to color non-working time or any other meta data associated with a resource.
     * See also {@link #resourceZonesConfig}.
     */
    resourceZones       : null,

    /**
     * @cfg {Object} resourceZonesConfig An object with configuration options for {@link Sch.plugin.ResourceZones}. Ignored if no {@link #resourceZones}
     * config is provided.
     */
    resourceZonesConfig : null,

    initStores : function() {
        var resourceStore   = this.resourceStore || this.store;

        if (!resourceStore) {
            if (this.crudManager) {
                resourceStore = this.resourceStore = this.crudManager.getResourceStore();
            }

            resourceStore = resourceStore || new Sch.data.ResourceStore();
        }

        if (!this.eventStore) {

            if (this.crudManager) {
                this.eventStore = this.crudManager.getEventStore();
            }

            this.eventStore = this.eventStore || new Sch.data.EventStore();
            if (!this.eventStore) {
                Ext.Error.raise("You must specify an eventStore config");
            }
        }

        // Set "store" for the grid panel API
        this.store          = Ext.StoreManager.lookup(resourceStore);
        this.resourceStore  = this.store;
        this.eventStore     = Ext.StoreManager.lookup(this.eventStore);

        if (!this.eventStore.isEventStore) {
            Ext.Error.raise("Your eventStore should be a subclass of Sch.data.EventStore (or consume the EventStore mixin)");
        }

        this.resourceStore.eventStore = this.eventStore;

        if (this.passStartEndParameters) {
            this.eventStore.on('beforeload', this.applyStartEndParameters, this);
        }
    },

    _initializeSchedulerPanel : function() {
        this.initStores();

        if (this.eventBodyTemplate && Ext.isString(this.eventBodyTemplate)) {
            this.eventBodyTemplate = new Ext.XTemplate(this.eventBodyTemplate);
        }
    },

    /**
    * Returns the resource store instance
    * @return {Sch.data.ResourceStore}
    */
    getResourceStore: function () {
        return this.resourceStore;
    },

    /**
    * Returns the event store instance
    * @return {Sch.data.EventStore}
    */
    getEventStore: function () {
        return this.eventStore;
    },

    // Applies the start and end date to each event store request
    applyStartEndParameters: function (eventStore, options) {
        var proxy = eventStore.getProxy();

        proxy.setExtraParam(this.startParamName, this.getStart());
        proxy.setExtraParam(this.endParamName, this.getEnd());
    },

    createResourceColumns : function (colWidth) {
        var newItems = [];
        var me = this;

        this.resourceStore.each(function (resource) {
            newItems.push(
                Ext.create(me.resourceColumnClass, {
                    renderer : me.mainRenderer,
                    scope    : me,
                    width    : colWidth || 100,
                    text     : resource.getName(),
                    model    : resource
                })
            );
        });

        return newItems;
    }
});

