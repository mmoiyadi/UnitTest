
Ext.define("ProjectPlanning.view.cCSettings.CCSettings",{
    extend: 'Ext.window.Window',
    frame: false,
    title: CC_SETTIGNS_WINDOW_TITLE,
    height: 620,
    /*width: 560,*/
    cls: 'x-window cc-settings',
    resizeHandles: 'n',
    layout: {
        type: 'fit'
    },
    modal: true,
    //xtype: 'CCSettings',
    alias: 'widget.CCSettings',
    id: 'CC_Settings_Window',
    resizable: true,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [{
                xtype: 'form',
                frame: false,
                height: 440,
                /*width: 545,*/
                bodyPadding: 15,
                header: false,
                titleAlign: 'center',
                title:  PERCENTAGE_BUFFER_SIZES ,
                items: [{
                    xtype: 'fieldset',
                    //defaultType: 'radiofield',
                    defaults: {
                        flex: 1,
                        padding: '0 0 0 10'

                    },
                    layout: 'vbox',
                    title: "<b>"+HORIZON_START_DATE+"</b>",
                    items: [{
                        xtype: 'radiofield',
                        boxLabel: USE_TODAY_AS_HORIZON_START,
                        name: 'HorizonDate',
                        inputValue: '1',
                        id: 'Use_today_as_horizon',
                        checked: this.IsDateProvided ? false : true,
                        handler: function () {
                            Ext.getCmp('Horizon_Date_Select').enable();
                        }
                    }, {
                        xtype: 'fieldcontainer',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'radiofield',
                                boxLabel: USE_THIS_DATE_AS_HORIZON_START,
                                name: 'HorizonDate',
                                inputValue: '0',
                                id: 'Use_date_as_horizon',
                                checked: this.IsDateProvided ? true : false,
                                handler: function () {
                                    Ext.getCmp('Horizon_Date_Select').disable();
                                }

                            },
                            {

                                xtype: 'datefield',
                                width: 100,
                                value: this.IsDateProvided ? this.HorizonDate : ServerClientDateClass.getTodaysDate(),
                                padding: '0 0 0 15',
                                minValue: '01/01/2012',
                                id: 'Horizon_Date_Select',
                                format: ServerTimeFormat.getExtDateformat(),
                                handler: function (picker, date) {
                                    // do something with the selected date
                                }
                            }
                            //                            },
                            //                            {
                            //                                xtype: 'label',
                            //                                padding: '0 0 0 10',
                            //                                text: HORIZON_DATE_MESSAGE,
                            //                                margins: '5 0 0 10'
                            //                            }
                        ]


                    }]
                },
                    {
                        xtype: 'fieldset',
                        height: 130,
                        padding: 5,
                        layout: {
                            //align: 'stretch',
                            align: 'stretch',
                            pack: 'center',
                            type: 'form'
                        },
                        //defaultType: 'textfield',
                        defaults: {
                            allowBlank: false,
                            validateBlank: true,
                            msgTarget: 'side',
                            padding: '0 0 0 10',
                            value: 20
                        },
                        title: "<b>"+PERCENTAGE_BUFFER_SIZES+"</b>",
                        items: [
                            {

                                xtype: 'fieldcontainer',
                                layout: 'hbox',

                                items: [{
                                    xtype: 'textfield',
                                    padding: '0 0 0 15',
                                    name: 'name',
                                    labelWidth: FIELD_LABEL_WIDTH,
                                    emptyText: "0",
                                    allowBlank: false,
                                    regex: /^\d+$/,
                                    width: FIELD_WIDTH,
                                    fieldLabel: CCCB_PROJECT_BUFFER,
                                    id: 'CCCB_percentage_buffer',
                                    enableKeyEvents: true,
                                    listeners: {
                                        specialkey: function (f, e) {
                                            if (e.getKey() == e.ENTER) {
                                                e.preventDefault();
                                            }
                                        }
                                    },
                                    value: this.PercentageCCCB
                                },
                                    {
                                        xtype: 'label',
                                        padding: '0 0 0 5',
                                        text: PERCENTAGE,
                                        margins: '5 0 0 10'
                                    }
                                ]


                            },
                            {
                                xtype: 'fieldcontainer',
                                layout: 'hbox',

                                items: [{
                                    xtype: 'textfield',
                                    padding: '0 0 0 15',
                                    name: 'name',
                                    labelWidth: FIELD_LABEL_WIDTH,
                                    allowBlank: false,
                                    width: FIELD_WIDTH,
                                    regex: /^\d+$/,
                                    fieldLabel: CCFB_FEEDING_BUFFER,
                                    id: 'CCFB_percentage_buffer',
                                    emptyText: "0",
                                    enableKeyEvents: true,
                                    listeners: {
                                        specialkey: function (f, e) {
                                            if (e.getKey() == e.ENTER) {
                                                e.preventDefault();
                                            }
                                        }
                                    },
                                    value: this.PercentageCCFB
                                },
                                    {
                                        xtype: 'label',
                                        padding: '0 0 0 5',
                                        text: PERCENTAGE,
                                        margins: '5 0 0 10'
                                    }
                                ]


                            },
                            {
                                xtype: 'fieldcontainer',
                                layout: 'hbox',

                                items: [{
                                    xtype: 'textfield',
                                    padding: '0 0 0 15',
                                    name: 'name',
                                    labelWidth: FIELD_LABEL_WIDTH,
                                    width: FIELD_WIDTH,
                                    allowBlank: false,
                                    regex: /^\d+$/,
                                    fieldLabel: CMSB_MILESTONE_BUFFER,
                                    id: 'CMSB_percentage_buffer',
                                    emptyText: "0",
                                    enableKeyEvents: true,
                                    listeners: {
                                        specialkey: function (f, e) {
                                            if (e.getKey() == e.ENTER) {
                                                e.preventDefault();
                                            }
                                        }
                                    },
                                    value: this.PercentageCMSB
                                },
                                    {
                                        xtype: 'label',
                                        padding: '0 0 0 5',
                                        text: PERCENTAGE,
                                        margins: '5 0 0 10'
                                    }
                                ]


                            }]//End of items of fieldset items   PERCENTAGE_BUFFER_SIZES
                    },
                    {
                        xtype: 'fieldset',
                        height: 100,
                        padding: 5,
                        layout: {
                            //align: 'stretch',
                            pack: 'center',
                            type: 'form'
                        },
                        title: "<b>"+DURATION_REDUCTION+"</b>",
                        defaults:
                        {
                            padding: '0 0 0 10'
                        },
                        items: [
                            {
                                xtype: 'fieldcontainer',
                                layout: 'hbox',
                                defaults: {
                                    padding: '0 0 0 15'
                                },
                                items: [{
                                    xtype: 'textfield',
                                    name: 'name',
                                    fieldLabel: REDUCE_TASK_DURATION_BY,
                                    labelWidth: 170,
                                    width: 250,
                                    padding: '0 0 0 15',
                                    id: 'Reduce_task_duration_by',
                                    disabled: false, //this.IsApplyInNextRun == true ? false : true,
                                    allowBlank: false,
                                    regex: /^(?:- *)?([0-9]|[1-9][0-9]|100)$/,
                                    validateBlank: true,
                                    msgTarget: 'side',
                                    regexText: REDUCE_TASK_DURATION_REGEX_TEXT,
                                    //invalidText: 'Value must be less than 100',
                                    validator: function (val) {
                                        if (parseInt(val) >= 100) {
                                            return REDUCE_TASK_DURATION_VALIDATION_MSG;
                                        } else {
                                            return true;
                                        }
                                    },
                                    listeners: {
                                        blur: function (cb, event) {
                                            me.ReduceTaskDuration = event.target.value;
                                        },
                                        specialkey: function (f, e) {
                                            if (e.getKey() == e.ENTER) {
                                                e.preventDefault();
                                            }
                                        }
                                    },
                                    value: this.ReduceTaskDuration == "" || typeof (this.ReduceTaskDuration) == "undefined" ? stl.app.commonSettingValue('DURATION_REDUCTION_PERCENT') : this.ReduceTaskDuration
                                },
                                    {
                                        xtype: 'label',
                                        padding: '0 0 0 5',
                                        text: PERCENTAGE,
                                        margins: '5 0 0 10'
                                    },
                                    {
                                        xtype: 'checkboxfield',
                                        boxLabel: APPLY_IN_NEXT_RUN,
                                        name: 'topping',
                                        inputValue: '1',
                                        checked: this.IsApplyInNextRun == true ? true : false,
                                        id: 'Apply_in_next_run',
                                        listeners: {
                                            change: function (cb, checked) {
                                                if (!checked) {
                                                    //Ext.getCmp('Reduce_task_duration_by').setValue("0");
                                                }
                                                //Ext.getCmp('Reduce_task_duration_by').setDisabled(!checked);
                                            }
                                        }
                                    }]
                            },
                            {
                                xtype: 'fieldcontainer',
                                //fieldLabel: 'Size',
                                defaultType: 'radiofield',
                                defaults: {
                                    //flex: 1,
                                    padding: '0 0 0 10'
                                },
                                layout: 'hbox',
                                itemId: 'Duration_rounding',
                                items: [{
                                    boxLabel: NO_ROUDING,
                                    name: 'RoundingDuration',
                                    inputValue: NO_ROUNDING,
                                    id: 'Duration_no_rouding',
                                    checked: this.RoundOffDuration == NO_ROUNDING ? true : false
                                }, {
                                    boxLabel: ROUND_TO_A_DAY,
                                    name: 'RoundingDuration',
                                    inputValue: ROUND_TO_DAY,
                                    id: 'Duration_round_to_day',
                                    checked: this.RoundOffDuration == ROUND_TO_DAY ? true : false
                                }, {
                                    boxLabel: ROUND_TO_NEAREST_QUARTER,
                                    name: 'RoundingDuration',
                                    inputValue: ROUND_TO_QUARTER,
                                    id: 'Duration_round_to_quarter',
                                    checked: this.RoundOffDuration == ROUND_TO_QUARTER ? true : false
                                }]
                            }]//End of items of fieldset items   DURATION_REDUCTION
                    },
                    {
                        xtype: 'fieldset',
                        height: 120,
                        padding: 5,
                        layout: {
                            //align: 'stretch',
                            pack: 'center',
                            type: 'vbox'
                        },
                        //defaultType: 'numberfield',
                        defaults: {
                            allowBlank: false,
                            validateBlank: true,
                            msgTarget: 'side',
                            width: 500,
                            labelWidth: 170,
                            value: 0,
                            maxValue: 999999,
                            minValue: 0,
                            padding: '0 0 0 15'
                        },
                        title: "<b>"+FIXED_BUFFER_SIZES+"</b>",
                        items: [{
                            xtype: 'fieldcontainer',
                            layout: 'hbox',
                            items: [{
                                xtype: 'numberfield',
                                name: 'FixedCCCB',
                                fieldLabel: CCCB_PROJECT_BUFFER,
                                id: 'CCCB_fixed_buffer',
                                allowBlank: false,
                                validateBlank: true,
                                msgTarget: 'side',
                                enableKeyEvents: true,
                                width: FIELD_WIDTH,
                                labelWidth: FIELD_LABEL_WIDTH,
                                maxValue: 999999,
                                minValue: 0,
                                padding: '0 0 0 0',
                                value: this.FixedCCCB,
                                listeners: { keyup: function (txt, newValue, oldValue) {
                                    $("#CCCB_fixed_buffer_label").text(HRS + " (" + txt.value / 8 + SHORT_D + " )");
                                },
                                    spin: function (txt, direction, eOpts) {
                                        var value = "";
                                        if (direction == "up") {
                                            value = txt.value + 1;
                                        }
                                        else {
                                            value = txt.value - 1;
                                        }
                                        $("#CCCB_fixed_buffer_label").text(HRS + " (" + value / 8 + SHORT_D + " )");
                                    }

                                }
                            },
                                {
                                    xtype: 'label',
                                    labelWidth: 170,
                                    id: 'CCCB_fixed_buffer_label',
                                    text: 'Hrs ( 0.00 d)',
                                    margins: '5 0 0 10'
                                }]
                        },
                            {
                                xtype: 'fieldcontainer',
                                layout: 'hbox',
                                items: [{
                                    xtype: 'numberfield',
                                    name: 'name',
                                    fieldLabel: CCFB_FEEDING_BUFFER,
                                    id: 'CCFB_fixed_buffer',
                                    value: this.FixedCCFB,
                                    allowBlank: false,
                                    validateBlank: true,
                                    msgTarget: 'side',
                                    enableKeyEvents: true,
                                    width: FIELD_WIDTH,
                                    labelWidth: FIELD_LABEL_WIDTH,
                                    maxValue: 999999,
                                    minValue: 0,
                                    padding: '0 0 0 0',
                                    listeners: { keyup: function (txt, newValue, oldValue) {
                                        $("#CCFB_fixed_buffer_label").text(HRS + " (" + txt.value / 8 + SHORT_D + " )");
                                    },
                                        spin: function (txt, direction, eOpts) {
                                            var value = "";
                                            if (direction == "up") {
                                                value = txt.value + 1;
                                            }
                                            else {
                                                value = txt.value - 1;
                                            }
                                            $("#CCFB_fixed_buffer_label").text(HRS + " (" + value / 8 + SHORT_D + " )");
                                        }

                                    }
                                },
                                    {
                                        xtype: 'label',
                                        id: 'CCFB_fixed_buffer_label',
                                        text: 'Hrs ( 0.00 d)',
                                        margins: '5 0 0 10'
                                    }]


                            },
                            {
                                xtype: 'fieldcontainer',
                                layout: 'hbox',
                                items: [{
                                    xtype: 'numberfield',
                                    name: 'name',
                                    fieldLabel: CMSB_MILESTONE_BUFFER,
                                    id: 'CMSB_fixed_buffer',
                                    value: this.FixedCMSB,
                                    allowBlank: false,
                                    validateBlank: true,
                                    msgTarget: 'side',
                                    enableKeyEvents: true,
                                    width: FIELD_WIDTH,
                                    labelWidth: FIELD_LABEL_WIDTH,
                                    maxValue: 999999,
                                    minValue: 0,
                                    padding: '0 0 0 0',
                                    listeners: { keyup: function (txt, newValue, oldValue) {
                                        $("#CMSB_fixed_buffer_label").text(HRS + " (" + txt.value / 8 + SHORT_D + " )");
                                    },
                                        spin: function (txt, direction, eOpts) {
                                            var value = "";
                                            if (direction == "up") {
                                                value = txt.value + 1;
                                            }
                                            else {
                                                value = txt.value - 1;
                                            }
                                            $("#CMSB_fixed_buffer_label").text(HRS + " (" + value / 8 + SHORT_D + " )");
                                        }

                                    }
                                },
                                    {
                                        xtype: 'label',
                                        id: 'CMSB_fixed_buffer_label',
                                        text: 'Hrs ( 0.00 d)',
                                        margins: '5 0 0 10'
                                    }]


                            }]
                    },
                    {
                        xtype: 'fieldset',
                        height: 60,
                        padding: 5,
                        layout: {
                            //align: 'stretch',
                            pack: 'center',
                            type: 'vbox'
                        },
                        title: "<b>"+FEEDING_BUFFERS_POLICY+"</b>",
                        items: [{
                            xtype: 'fieldcontainer',
                            //fieldLabel: 'Size',
                            defaultType: 'radiofield',
                            defaults: {
                                //flex: 1,
                                padding: '0 0 0 10'
                            },
                            layout: 'hbox',
                            itemId: 'Buffer_Policy_Container',
                            items: [{
                                boxLabel: LEAVE_TASKS_IN_PAST,
                                name: 'FeedingBufferPolicy',
                                inputValue: LEAVE_TASKS_IN_PAST_VAL,
                                id: 'Leave_Tasks_In_Past_Radio',
                                checked: this.FeedingBuffersPolicyVal == LEAVE_TASKS_IN_PAST_VAL ? true : false
                            }, {
                                boxLabel: PUSH_OUT_PROJECT_DUE_DATE,
                                name: 'FeedingBufferPolicy',
                                inputValue: PUSH_OUT_PROJECT_DUE_DATE_VAL,
                                id: 'Push_Out_Project_Due_Date_Radio',
                                checked: this.FeedingBuffersPolicyVal == PUSH_OUT_PROJECT_DUE_DATE_VAL ? true : false
                            }, {
                                boxLabel: CONSUME_FEEDING_BUFFERS,
                                name: 'FeedingBufferPolicy',
                                inputValue: CONSUME_FEEDING_BUFFERS_VAL,
                                id: 'Consume_Feeding_Buffers_Radio',
                                checked: this.FeedingBuffersPolicyVal == CONSUME_FEEDING_BUFFERS_VAL ? true : false
                            }]

                        }]//End of items of fieldset items   FIXED_BUFFER_SIZES
                    }
                ], //End of items of form
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
                        handler: function (btn, e, opts) {
                            CCSETTINGS_OK_BUTTON_CLICKED(me);
                        }
                    }, {
                        xtype: 'button',
                        text: CANCEL_BUTTON,
                        tooltip: CANCEL_BUTTON,
                        listeners: {
                            click: function (btn, e, Opts) {
                                me.close();
                            }
                        }
                    }]
                }]//End of docked items of form

            }]//End of Items
        });
        me.callParent(arguments);
    },
    listeners: {
        afterrender: {
            fn: function () {
                if (!this.IsDateProvided) {
                    Ext.getCmp('Horizon_Date_Select').disable();
                    if (this.LastIDCCedHorizonDate == "") {
                        Ext.getCmp('Horizon_Date_Select').setValue(ServerClientDateClass.getTodaysDate());
                    } else {
                        Ext.getCmp('Horizon_Date_Select').setValue(new Date(this.LastIDCCedHorizonDate));
                    }

                    CCSettingsStore.ClearHorizonDate();
                }
                else {
                    Ext.getCmp('Horizon_Date_Select').setValue(new Date(this.HorizonDate));
                }


            }

        },
        beforeshow: {
            fn: function () {
                Ext.getCmp('CCCB_fixed_buffer_label').text = HRS + " (" + (Ext.getCmp('CCCB_fixed_buffer').value) / 8 + SHORT_D + " )";
                Ext.getCmp('CCFB_fixed_buffer_label').text = HRS + " (" + (Ext.getCmp('CCFB_fixed_buffer').value) / 8 + SHORT_D + " )";
                Ext.getCmp('CMSB_fixed_buffer_label').text = HRS + " (" + (Ext.getCmp('CMSB_fixed_buffer').value) / 8 + SHORT_D + " )";


                if (($("#replanMode").hasClass("active"))) {
                    Ext.getCmp("CCCB_percentage_buffer").setDisabled(true);
                    Ext.getCmp("CMSB_percentage_buffer").setDisabled(true);
                    Ext.getCmp("CCCB_fixed_buffer").setDisabled(true);
                    Ext.getCmp("CMSB_fixed_buffer").setDisabled(true);
                }
            }

        }
    }
});

function getChangedValues(me) {

    var isTodayHorizonDate = Ext.ComponentQuery.query('[name=HorizonDate]')[0].getGroupValue();
    var horizonDate ;
    if (isTodayHorizonDate == "0") {
        horizonDate = Ext.getCmp('Horizon_Date_Select').value;
    }
    else {
        horizonDate = "";
    }
    var isDateProvided;
    if (horizonDate == "") {
        isDateProvided = false;
    } else {
        isDateProvided = true;
    }
    var reductionValue = Ext.getCmp('Reduce_task_duration_by').value;
    var reduceTaskDuration = reductionValue.split(' ').join('');
    var isApplyNextRunChecked = Ext.getCmp("Apply_in_next_run").value;


    var changedCCSettingsData = {
        HorizonDate: horizonDate,
        PercentageCCCB: parseInt(Ext.getCmp('CCCB_percentage_buffer').value),
        PercentageCCFB: parseInt(Ext.getCmp('CCFB_percentage_buffer').value),
        PercentageCMSB: parseInt(Ext.getCmp('CMSB_percentage_buffer').value),
        FixedCCCB: Ext.getCmp('CCCB_fixed_buffer').value,
        FixedCCFB: Ext.getCmp('CCFB_fixed_buffer').value,
        FixedCMSB: Ext.getCmp('CMSB_fixed_buffer').value,
        RoundOffDuration: Ext.ComponentQuery.query('[name=RoundingDuration]')[0].getGroupValue(),
        ReduceTaskDuration: reduceTaskDuration,
        IsApplyInNextRun: isApplyNextRunChecked == true? true : "undefined",
        IsDateProvided: isDateProvided,
        FeedingBuffersPolicyVal: Ext.ComponentQuery.query('[name=FeedingBufferPolicy]')[0].getGroupValue()
    };
    CCSettingsStore.PopulateStoreFromCCSettingsDialog(changedCCSettingsData);
}

function CCSETTINGS_OK_BUTTON_CLICKED(me) {
    getChangedValues(me);
    stl.app.triggerSave();
    me.close();
}


