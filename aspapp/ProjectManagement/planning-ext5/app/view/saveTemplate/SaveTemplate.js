
Ext.define("ProjectPlanning.view.saveTemplate.SaveTemplate",{
    extend: 'Ext.window.Window',
    frame: false,
    width: 500,
    cls: 'x-window cc-settings',
    resizeHandles: 'n',
    layout: {
        type: 'fit'
    },
    modal: true,
    alias: 'widget.SaveTemplate',
    id: 'SaveTemplate_Window',
    resizable: true,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [{
                xtype: 'form',
                frame: false,
                bodyPadding: 15,
                header: false,
                titleAlign: 'center',
                title: SAVE_TEMPLATE_TITLE,
                items: [{
                    xtype: 'fieldset',
                    defaults: {
                        flex: 1,
                        padding: '0 0 0 15'

                    },
                    layout: 'vbox',
                    items: [{
                        xtype: 'textfield',
                        padding: '10 10 10 10',
                        width: 400,
                        name: 'Template Name',
                        fieldLabel: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_PROJECT_NAME'),
                        id: 'Template_Name',
                        validateBlank: true,
                        msgTarget: 'side',
                        value: '',
                        enableKeyEvents: true,
                        listeners: {
                            specialkey: function (f, e) {
                                if (e.getKey() == e.ENTER) {
                                    e.preventDefault();
                                }
                            }
                        },
                        validator: function (value) {
                            if (!ProjectNameValidation(value)) {
                                return PROJECT_NAME_ERROR;
                            }
                            var proj = projectStore.findRecord('Name', value, 0, false, true, true);
                            if (proj) {
                                return ERR_PRJ_EXISTS;
                            }
                            return true;
                        }
                    }, {
                        xtype: 'textfield',
                        width: 400,
                        name: 'Template Description',
                        padding: '10 10 10 10',
                        fieldLabel: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_PROJECT_TITLE'),
                        id: 'Template_Description',
                        enableKeyEvents: true,
                        listeners: {
                            specialkey: function (f, e) {
                                if (e.getKey() == e.ENTER) {
                                    e.preventDefault();
                                }
                            }
                        },
                        value: ''
                    }]//End of Items

                }],

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
                        formBind: true, //only enabled once the form is valid
                        disabled: true,
                        handler: function (btn, e, opts) {
                            OK_BUTTON_CLICKED(me);
                        }
                    }, {
                        xtype: 'button',
                        text: CANCEL_BUTTON,
                        listeners: {
                            click: function (btn, e, Opts) {
                                me.close();
                            }
                        }
                    }]
                }]//End of docked items of form


            }]
        });
        me.callParent(arguments);
    }
});


var thisDialog;
function OK_BUTTON_CLICKED(me) {
    thisDialog = me;
    var templateData = {};
    templateData.name = Ext.getCmp('Template_Name').value;
    templateData.description = Ext.getCmp('Template_Description').value;
    if(thisDialog.title == SAVE_TEMPLATE_TITLE)
        stl.app.saveTemplateToServer(stl.app.ProcessTypeEnum.SAVE, TemplateSaved, templateData, false);
    else{
        stl.app.saveTemplateToServer(stl.app.ProcessTypeEnum.SAVE, TemplateSaved, templateData, true);
    }

}

function TemplateSaved(serverResponse, isCheckinFailed) {
    if (serverResponse === TRUE_CONSTANT) {
        if(thisDialog.title == SAVE_TEMPLATE_TITLE)
         PPI_Notifier.success(TEMPLATE_SAVED_SUCCESS, SUCCESS_MESSAGE);
        else{
            if(isCheckinFailed)
                PPI_Notifier.success(getStringWithArgs(PROJECT_SAVE_AS_SUCCESS,Ext.getCmp('Template_Name').value)+"<br>"+PROJECT_SAVE_AS_CHECKIN_REQD, SUCCESS_MESSAGE);
            else
            PPI_Notifier.success(getStringWithArgs(PROJECT_SAVE_AS_SUCCESS,Ext.getCmp('Template_Name').value), SUCCESS_MESSAGE);
            
        }thisDialog.close();
    } else {
        Ext.getCmp('Template_Name').inputEl.focus(); //myField.fieldEl.dom.focus();
    }
}

