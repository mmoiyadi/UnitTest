
Ext.define("ProjectPlanning.view.CalendarSettings.CalendarSettings", {
    extend: "Ext.window.Window",

    requires: [
        "ProjectPlanning.view.CalendarSettings.CalendarSettingsController",
        "ProjectPlanning.view.CalendarSettings.CalendarSettingsModel"
    ],

    controller: "calendarsettings-calendarsettings",
    viewModel: {
        type: "calendarsettings-calendarsettings"
    },

    frame: false,
    title: PROJECT_CALENDAR_SETTING,
    height: 200,
    /*width: 560,*/
    cls: 'x-window cc-settings',
    resizeHandles: 'n',
    layout: {
        type: 'fit'
    },
    modal: true,
    //xtype: 'CCSettings',
    alias: 'widget.CCSettings',
    id: 'CalendarSettings_Window',
    resizable: true,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [{
                xtype: 'form',
                frame: false,
                height: 200,
                /*width: 545,*/
                bodyPadding: 15,
                header: false,
                titleAlign: 'center',
                items: [{
                    xtype: 'fieldset',
                    padding: 5,
                    layout: {
                        //align: 'stretch',
                        pack: 'center',
                        type: 'vbox'
                    },
                    title: PROJECT_CALENDAR_SETTING,
                    items: [{
                        xtype: 'fieldcontainer',
                        defaults: {
                            padding: '0 0 0 10'
                        },
                        //layout: 'hbox',
                        items: [{
                            xtype: "combo",
                            fieldLabel: PROJECT_CALENDAR,
                            labelWidth:150,
                            id: 'Project_Calendar_Combo',
                            editable: false,
                            readOnly: stl.app.readOnlyFlag,
                            store: stl.app.arrAvailableCalendars,
                            value: this.ProjectCalendarName,
                            valueField: 'CalendarName',
                            displayField: 'CalendarName'

                        },
                        {
                            xtype: 'checkbox',
                            boxLabel: INHERIT_PROJECT_CALENDAR_FOR_RESOURCES,
                            id: 'Inherit_Base_Calendar_checkBox',
                            readOnly: stl.app.readOnlyFlag,
                            checked: this.InheritProjCalForResFlag == 1 ? true: false
                        }
                        ]
                    }]
                }], //End of items of form
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    resizeHandles: 'n',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        text: OK_BUTTON,
                        tooltip: OK_BUTTON,
                        formBind: true, //only enabled once the form is valid
                        disabled: true,
                        listeners: {
                            click: {
                                fn: 'CalendarSettingsOKButtonClicked'
                            }
                        }
                    }, {
                        xtype: 'button',
                        text: CANCEL_BUTTON,
                        tooltip: CANCEL_BUTTON,
                        listeners: {
                            click: {
                                fn: 'CalendarSettingsCancelButtonClicked'
                            }
                        }
                    }]
                }]//End of docked items of form
            }]

        });
        me.callParent(arguments);
    }
});
