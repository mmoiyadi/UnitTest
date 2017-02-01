/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.EventEditor
@extends Ext.form.Panel

A plugin (ptype = 'scheduler_eventeditor') used to edit event start/end dates as well as any meta data. It inherits from {@link Ext.form.FormPanel} so you can define any fields and use any layout you want.

{@img scheduler/images/event-editor.png}

Normally, this plugin shows the same form for all events. However you can show different forms for different event types. To do that:

- the event type is supposed to be provided as the value of the `EventType` field in the event model.
- in the {@link #fieldsPanelConfig} provide the container with card layout. The children of that container should be the forms which will be used to edit different
event types
- each such form should contain the `EventType` configuration option, matching to the appropriate event type.
- the small top form, containing the start date, start time and duration fields is always shared among all forms.
- this whole behavior can be disabled with the `dynamicForm : false` option.

The overall picture will look like:

    fieldsPanelConfig : {
        xtype       : 'container',

        layout      : 'card',

        items       : [
            // form for "Meeting" EventType
            {
                EventType   : 'Meeting',

                xtype       : 'form',

                items       : [
                    ...
                ]
            },
            // eof form for "Meeting" EventType

            // form for "Appointment" EventType
            {
                EventType   : 'Appointment',

                xtype       : 'form',

                items       : [
                    ...
                ]
            }
            // eof form for "Appointment" EventType
        ]
    }

Note, that you can customize the start date, start time and duration fields with appropriate configuration options: {@link #dateConfig}, {@link #timeConfig}, {@link #durationConfig}


    var eventEditor    = Ext.create('Sch.plugin.EventEditor', {
        ...
        timeConfig      : {
            minValue    : '08:00',
            maxValue    : '18:00'
        },
        ...
    });


    var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
        ...

        resourceStore   : resourceStore,
        eventStore      : eventStore,

        plugins         : [
            eventEditor
        ]
    });


If you include additional components which have floating sub-components, such as combo boxes or date pickers -
you need to decorate them with a special CSS class so the editor will stay open when clicking 'outside' of the editor element.

    var myComboBox = new Ext.form.ComboBox({
        width           : 70,
        ...
    });

    // Tell the editor that this component and its picker are part of the editor, clicking them should not hide the editor.
    myComboBox.getPicker().addCls('sch-event-editor-ignore-click');

 */
Ext.define("Sch.plugin.EventEditor", {
    extend      : "Ext.form.Panel",

    mixins      : [
        'Ext.AbstractPlugin',
        'Sch.mixin.Localizable'
    ],

    alias       : ['widget.eventeditor',  'plugin.scheduler_eventeditor'],

    lockableScope : 'normal',

    requires    : [
        'Sch.util.Date',
        'Ext.util.Region',
        'Ext.form.Label',
        'Ext.form.field.Date',
        'Ext.form.field.Time'
    ],

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - saveText    : 'Save',
            - deleteText  : 'Delete',
            - cancelText  : 'Cancel'
     */

    /**
     * @cfg {Boolean} hideOnBlur True to hide this panel if a click is detected outside the panel (defaults to true)
     */
    hideOnBlur      : true,

    /**
     * This property provides access to the start date field
     * @property {Ext.form.field.Date} startDateField
     */
    startDateField  : null,

    /**
     * This property provides access to the start time field
     * @property {Ext.form.field.Time} startTimeField
     */
    startTimeField  : null,

    /**
     * This property provides access to the duration spinner field
     * @property {Ext.form.field.Number} durationField
     */
    durationField   : null,

    /**
     * @cfg {Object} timeConfig Config for the `startTimeField` constructor.
     */
    timeConfig      : null,

    /**
     * @cfg {Object} dateConfig Config for the `startDateField` constructor.
     */
    dateConfig      : null,

    /**
     * @cfg {Object} durationConfig A custom config object that is used to configure the {@link Ext.form.field.Number duration field}.
     */
    durationConfig  : null,

    /**
     * @cfg {String} durationUnit The unit in which the duration is measured, defaults to Sch.util.Date.HOUR.
     *                            Please see {@link Sch.util.Date} for the possible values.
     */
    durationUnit    : null,

    /**
     * @cfg {String} durationText The text to show after the duration spinner field
     */
    durationText    : null,

    /**
     * @cfg {String} triggerEvent The event that shall trigger showing the editor. Defaults to 'eventdblclick', set to '' or null to disable editing of existing events.
     */
    triggerEvent    : 'eventdblclick',

    /**
     * @cfg {Object} fieldsPanelConfig A panel config representing your fields that is associated with a scheduled event.
     *
     * Example:

        fieldsPanelConfig : {
            layout      : 'form',

            style       : 'background : #fff',
            border      : false,
            cls         : 'editorpanel',
            labelAlign  : 'top',

            defaults    : {
                width : 135
            },

            items       : [
                titleField      = new Ext.form.TextField({
                    name            : 'Title',
                    fieldLabel      : 'Task'
                }),

                locationField   = new Ext.form.TextField({
                    name            : 'Location',
                    fieldLabel      : 'Location'
                })
            ]
        }
     *
     */
    fieldsPanelConfig   : null,

    /**
     * @cfg {String} dateFormat This config parameter is passed to the `startDateField` constructor.
     */
    dateFormat      : 'Y-m-d',

    /**
     * @cfg {String} timeFormat This config parameter is passed to the `startTimeField` constructor.
     */
    timeFormat      : 'H:i',


    cls             : 'sch-eventeditor',
    border          : false,
    shadow          : false,

    /**
     * @cfg {Boolean} dynamicForm True to use several forms. Default is `true`.
     */
    dynamicForm     : true,

    /**
     * @property {Sch.model.Event} eventRecord The current {@link Sch.model.Event} record, which is being edited by the event editor
     */
    eventRecord     : null,

    hidden          : true,
    collapsed       : true,
    currentForm     : null,
    schedulerView   : null,
    resourceRecord  : null,
    preventHeader   : true,
    floating        : true,
    hideMode        : 'offsets',
    ignoreCls       : 'sch-event-editor-ignore-click',
    readOnly        : false, // Cached value of scheduler setting

    layout          : {
        type    : 'vbox',
        align   : 'stretch'
    },

    dragProxyEl     : null,

    /**
     * @cfg {Boolean} constrain Pass `true` to enable the constraining - ie editor panel will not exceed the document edges. This option will disable the animation
     * during the expansion. Default value is `false`.
     */
    constrain           : false,

    /**
     * @event beforeeventdelete
     * Fires before an event is deleted (return false to cancel the operation)
     * @param {Sch.plugin.EventEditor} editor The editor instance
     * @param {Sch.model.Event} eventRecord The record about to be deleted
     */

    /**
     * @event beforeeventsave
     * Fires before an event is saved (return false to cancel the operation)
     * @param {Sch.plugin.EventEditor} editor The editor instance
     * @param {Sch.model.Event} eventRecord The record about to be saved
     */

    constructor : function(config) {
        config              = config || {};
        Ext.apply(this, config);

        this.durationUnit   = this.durationUnit || Sch.util.Date.HOUR;

        this.callParent(arguments);
    },


    initComponent : function() {

        if (!this.fieldsPanelConfig) throw 'Must define a fieldsPanelConfig property';

        Ext.apply(this, {
            fbar            : this.buttons || this.buildButtons(),

            items           : [
                {
                    xtype   : 'container',
                    layout  : 'hbox',
                    height  : 35,
                    border  : false,
                    cls     : 'sch-eventeditor-timefields',

                    items   : this.buildDurationFields()
                },
                Ext.applyIf(this.fieldsPanelConfig, {
                    flex        : 1,
                    activeItem  : 0
                })
            ]
        });

        this.callParent(arguments);
    },


    init : function (grid) {
        // setting the ownerCt helps a possible container of the scheduler (such as a window), to not try to
        // position itself above the editor, since it's in sort of a "child" of the Window component in that case.
        this.ownerCt        = grid;

        this.schedulerView  = grid.getView();
        this.eventStore     = this.schedulerView.getEventStore();

        this.schedulerView.on({
            afterrender     : this.onSchedulerRender,
            dragcreateend   : this.onDragCreateEnd,

            scope           : this
        });

        this.schedulerView.on('eventrepaint', this.onEventRepaint, this);

        if (this.triggerEvent) {
            this.schedulerView.on(this.triggerEvent, this.onActivateEditor, this);
        }

        this.schedulerView.registerEventEditor(this);
    },


    onSchedulerRender : function() {
        this.render(Ext.getBody());

        if (this.hideOnBlur) {
            // Hide when clicking outside panel
            this.mon(Ext.getDoc(), 'mousedown', this.onMouseDown, this);
        }
    },


    /**
     * Activates the editor for the passed event record.
     * @param {Sch.model.Event} eventRecord The record to show in the editor panel
     */
    show : function (eventRecord, alignToEl) {

        var readOnly = this.schedulerView.isReadOnly();

        if (readOnly !== this.readOnly) {
            Ext.Array.forEach(this.query('field'), function(field) {
                field.setReadOnly(readOnly);
            });

            this.saveButton.setVisible(!readOnly);
            this.deleteButton.setVisible(!readOnly);

            this.readOnly = readOnly;
        }

        // Only show delete button if the event belongs to a store
        if (this.deleteButton) {
            this.deleteButton.setVisible(!readOnly && this.eventStore.indexOf(eventRecord) >= 0);
        }

        this.eventRecord = eventRecord;

        // Manually set the duration field value
        this.durationField.setValue(Sch.util.Date.getDurationInUnit(eventRecord.getStartDate(), eventRecord.getEndDate(), this.durationUnit, true));

        var startDate = eventRecord.getStartDate();
        this.startDateField.setValue(startDate);
        this.startTimeField.setValue(startDate);

        // If the scheduler we're attached to is inside a floating component (window etc)
        // we need to make sure we're on top of it at show time.
        var floatingContainer = this.schedulerView.up('[floating=true]');
        if (floatingContainer){
            this.getEl().setZIndex(floatingContainer.getEl().getZIndex() + 1);
            floatingContainer.addCls(this.ignoreCls);
        }

        this.callParent();

        alignToEl = alignToEl || this.schedulerView.getElementsFromEventRecord(eventRecord)[0];

        this.alignTo(alignToEl, this.schedulerView.getMode() == 'horizontal' ? 'bl' : 'tl-tr', this.getConstrainOffsets(alignToEl));

        this.expand(!this.constrain);

        if (this.constrain) {
            this.doConstrain(Ext.util.Region.getRegion(Ext.getBody()));
        }

        var form,
            eventType = eventRecord.get('EventType');

        if (eventType && this.dynamicForm) {
            var fieldsPanel     = this.items.getAt(1),
                forms           = fieldsPanel.query('> component[EventType=' + eventType + ']');

            if (!forms.length)                                  {
                throw "Can't find form for EventType=" + eventType;
            }
            if (!fieldsPanel.getLayout().setActiveItem)         {
                throw "Can't switch active component in the 'fieldsPanel'";
            }

            form = forms[ 0 ];

            if (!(form instanceof Ext.form.Panel))              {
                throw "Each child component of 'fieldsPanel' should be a 'form'";
            }

            fieldsPanel.getLayout().setActiveItem(form);
        } else {
            form = this;
        }

        this.currentForm = form;

        // get the "basicForm" from current form and load it from event record
        form.getForm().loadRecord(eventRecord);
    },

    // Override this to add support for constraining the editor panel to the viewport or scheduler
    getConstrainOffsets : function(eventEl) {
        return [0, 0];
    },

    onSaveClick : function() {
        var me          = this,
            record      = me.eventRecord,
            form        = me.currentForm.getForm();

        if (form.isValid() && me.fireEvent('beforeeventsave', me, record) !== false) {

            var startDate   = me.startDateField.getValue(),
                endDate,
                startTime   = me.startTimeField.getValue(),
                duration    = me.durationField.getValue();

            if (startDate && duration >= 0) {

                if (startTime) {
                    Sch.util.Date.copyTimeValues(startDate, startTime);
                }

                endDate = Sch.util.Date.add(startDate, me.durationUnit, duration);
            } else {
                return;
            }


            if (!me.schedulerView.allowOverlap) {
                var resources = record.getResources(me.eventStore);
                var abort     = false;

                // Manually locate the event resource for new records
                resources = resources.length > 0 ? resources : [me.resourceRecord];

                Ext.each(resources, function(resource) {
                    return abort = !me.schedulerView.isDateRangeAvailable(startDate, endDate, record, resource);
                });

                if (abort) return;
            }

            // Prevent editor realignment while we're closing it
            me.schedulerView.un('eventrepaint', me.onEventRepaint, me);

            me.onBeforeSave(record);

            record.beginEdit();

            form.updateRecord(record);

            record.setStartEndDate(startDate, endDate);

            record.endEdit();

            // Check if me is a new record
            if (me.eventStore.indexOf(me.eventRecord) < 0) {
                if (me.schedulerView.fireEvent('beforeeventadd', me.schedulerView, record) !== false) {
                    me.eventStore.append(record);
                }
            }

            me.onAfterSave(record);

            me.collapse(null, true);

            me.schedulerView.on('eventrepaint', me.onEventRepaint, me);
        }
    },

    /**
     * Template method, intended to be overridden. Called before the event record has been updated.
     * @param {Sch.model.EventRecord} eventRecord The event record
     *
     **/
    onBeforeSave : function(eventRecord) {},

    /**
     * Template method, intended to be overridden. Called after the event record has been updated.
     * @param {Sch.model.EventRecord} eventRecord The event record
     *
     **/
    onAfterSave : function(eventRecord) {},

    onDeleteClick : function() {
        if (this.fireEvent('beforeeventdelete', this, this.eventRecord) !== false) {
            this.eventStore.remove(this.eventRecord);
        }
        this.collapse(null, true);
    },


    onCancelClick : function() {
        this.collapse(null, true);
    },

    buildButtons : function() {

        this.saveButton = new Ext.Button({
            text        : this.L('saveText'),

            scope       : this,
            handler     : this.onSaveClick
        });

        this.deleteButton = new Ext.Button({
            text        : this.L('deleteText'),

            scope       : this,
            handler     : this.onDeleteClick
        });

        this.cancelButton = new Ext.Button({
            text        : this.L('cancelText'),

            scope       : this,
            handler     : this.onCancelClick
        });

        return [ this.saveButton, this.deleteButton, this.cancelButton ];
    },


    buildDurationFields : function() {

        this.startDateField = new Ext.form.field.Date(Ext.apply({
            width           : 90,
            allowBlank      : false,
            format          : this.dateFormat
        }, this.dateConfig || {}));

        this.startDateField.getPicker().addCls(this.ignoreCls);

        this.startTimeField = new Ext.form.field.Time(Ext.apply({
            width           : 70,
            allowBlank      : false,
            format          : this.timeFormat

        }, this.timeConfig || {}));

        this.startTimeField.getPicker().addCls(this.ignoreCls);

        this.durationField = new Ext.form.field.Number(Ext.apply({

            width           : 45,

            value           : 0,

            minValue        : 0,
            allowNegative   : false

        }, this.durationConfig || {}));


        this.durationLabel = new Ext.form.Label({
            text            : this.getDurationText()
        });

        return [ this.startDateField, this.startTimeField, this.durationField, this.durationLabel ];
    },


    onActivateEditor : function(g, evtRecord) {
        this.show(evtRecord);
    },


    onMouseDown : function(e){

        if (
            this.collapsed || e.within(this.getEl()) ||
            // ignore the click on the menus and combo-boxes (which usually floats as the direct child of <body> and
            // leaks through the `e.within(this.getEl())` check

            // if clicks should be ignored for any other element - it should have this class
                e.getTarget('.' + this.ignoreCls, 9) ||
                e.getTarget(this.schedulerView.eventSelector)
        ) {
            return;
        }

        this.collapse();
    },


    onDragCreateEnd : function(s, eventRecord, resourceRecord, e, proxyEl) {
        this.dragProxyEl = proxyEl;

        this.resourceRecord = resourceRecord;

        // Call scheduler template method
        this.schedulerView.onEventCreated(eventRecord);

        this.show(eventRecord, this.dragProxyEl);
    },

    //@OVERRIDE
    hide : function() {
        this.callParent(arguments);
        var dpEl = this.dragProxyEl;

        if (dpEl) {
            dpEl.hide();
        }
    },

    //@OVERRIDE: Always hide drag proxy on collapse
    afterCollapse : function() {
        // currently the header is kept even after collapse, so need to hide the form completely
        this.hide();

        this.callParent(arguments);
    },


    getDurationText : function () {
        if (this.durationText) {
            return this.durationText;
        }

        return Sch.util.Date.getShortNameOfUnit(Sch.util.Date.getNameOfUnit(this.durationUnit));
    },

    // Reposition / update form content if event is moved
    onEventRepaint : function(store, record) {
        if (!this.getCollapsed() && record === this.eventRecord) {
            this.show(record);
        }
    }
});
