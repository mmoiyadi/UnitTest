/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.SimpleEditor
@extends Ext.Editor

A plugin (ptype = 'scheduler_simpleeditor') for basic text editing of an event name.

{@img scheduler/images/simple-editor.png}

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.SimpleEditor', { dataIndex : 'Title' })
            ]
        });


*/
Ext.define("Sch.plugin.SimpleEditor", {
    extend              : "Ext.Editor",
    alias               : 'plugin.scheduler_simpleeditor',

    requires            : [
        "Ext.form.TextField"
    ],

    mixins              : ['Ext.AbstractPlugin', 'Sch.mixin.Localizable'],
    lockableScope       : 'top',
    cls                 : 'sch-simpleeditor',
    allowBlur           : false,

    // private
    delegate            : '.sch-event-inner',

    /**
     * @cfg {String} dataIndex Required. A field, containing the task's title. This field will be updated by the editor. Defaults to the value of the {@link Sch.model.Event#nameField}.
     */
    dataIndex           : null,

    completeOnEnter     : true,
    cancelOnEsc         : true,
    ignoreNoChange      : true,
    height              : 19,
    dragProxyEl         : null,

    /**
     * @cfg {String} newEventText The text to assign as the name for a newly created Event.
     */
    newEventText        : null,

    autoSize            : {
        width   : 'boundEl' // The width will be determined by the width of the boundEl, the height from the editor (21)
    },


    initComponent : function() {
        this.field = this.field || { xtype : 'textfield', selectOnFocus : true };

        this.callParent(arguments);
    },


    init : function(scheduler) {
        this.scheduler = scheduler.getSchedulingView();

        scheduler.on('afterrender', this.onSchedulerRender, this);
        this.scheduler.registerEventEditor(this);

        this.dataIndex = this.dataIndex || this.scheduler.getEventStore().model.prototype.nameField;
    },

    // Programmatically enter edit mode
    edit : function(record, el) {
        el = el || this.scheduler.getElementsFromEventRecord(record)[0];

        this.startEdit(el.child(this.delegate));
        // workaround http://www.sencha.com/forum/showthread.php?296716
        this.realign();

        this.record = record;
        this.setValue(this.record.get(this.dataIndex));
    },


    onSchedulerRender : function(scheduler) {

        this.on({
            startedit   : this.onStartEdit,

            complete    : function(editor, value, original) {
                var record = this.record;
                var eventStore = this.scheduler.eventStore;

                record.set(this.dataIndex, value);

                // Check if this is a new record
                if (eventStore.indexOf(record) < 0) {
                    if (this.scheduler.fireEvent('beforeeventadd', this.scheduler, record) !== false) {
                        eventStore.append(record);
                    }
                }

                this.onAfterEdit();
            },

            canceledit  : this.onAfterEdit,

            hide        : function() {
                if (this.dragProxyEl) {
                    this.dragProxyEl.hide();
                }
            },

            scope       : this
        });

        scheduler.on({
            eventdblclick   : function(s, r, e){
                if (!scheduler.isReadOnly()) {
                    this.edit(r);
                }
            },
            dragcreateend   : this.onDragCreateEnd,
            scope           : this
        });
    },

    onStartEdit  : function() {
        if (!this.allowBlur) {
            // This should be removed when this bug is fixed:
            // http://www.sencha.com/forum/showthread.php?244580-4.1-allowBlur-on-Ext.Editor-not-working
            Ext.getBody().on('mousedown', this.onMouseDown, this);
            this.scheduler.on('eventmousedown', function() { this.cancelEdit(); }, this);
        }
    },

    onAfterEdit  : function() {
        if (!this.allowBlur) {
            Ext.getBody().un('mousedown', this.onMouseDown, this);
            this.scheduler.un('eventmousedown', function() { this.cancelEdit(); }, this);
        }
    },

    onMouseDown : function(e, t) {
        if (this.editing && this.el && !e.within(this.el)) {
            this.cancelEdit();
        }
    },

    onDragCreateEnd : function(s, eventRecord, resourceRecord, e, proxyEl) {
        this.dragProxyEl = proxyEl;

        // Call scheduler template method
        this.scheduler.onEventCreated(eventRecord);

        if (eventRecord.get(this.dataIndex) === '') {
            eventRecord.set(this.dataIndex, this.newEventText || this.L('newEventText'));
        }
        this.edit(eventRecord, this.dragProxyEl);
    }
});
