/**
 * New Project Window
 */
Ext.define('ProjectPlanning.view.newProject.NewProject', {
    extend: 'Ext.window.Window',
    frame: false,
    title: CREATE_NEW_PROJECT_TITLE,
    cls: 'x-window new-project',
    resizable: false,
    resizeHandles: 'n',
    modal: true,
    xtype: 'NewProject',
    id: 'NewProject',
    listeners: {
        close: function(panel, eOpts) {
            if (this.closewindow)
                window.close();
        }

    },
    initComponent: function() {
        var me = this;
        me.closewindow = true;
        Ext.applyIf(me, {
            items: [{
                xtype: 'form',
                frame: false,
                width: 360,
                bodyPadding: 5,
                items: [{
                    xtype: 'fieldset',
                    padding: 5,
                    defaults: {
                        anchor: '100%'
                    },
                    layout: 'anchor',
                    fieldDefaults: {
                        labelAlign: 'left',
                        labelWidth: 120
                    },
                    items: [{
                        xtype: 'textfield',
                        name: 'name',
                        //regex: new RegExp("^[a-zA-Z0-9-_!@$^&+=~`\\(\\)\\[\\] ]*[a-zA-Z0-9-_!@$^&+=~`\\[\\]\\(\\)]$"),
                        //regexText:PROJECT_NAME_ERROR,
                        fieldLabel: DataStore.FilterNames.ProjectFilterName,
                        id: 'projectName',
                        emptyText: PROJECT_NAME_EMPTY_TEXT,
                        allowBlank: false, //me.isProjectNameTextInputFieldToBeHidden(),
                        hidden: false,
                        validateBlank: true,
                        msgTarget: 'side',
                        validator: function(value) {

                            if (!ProjectNameValidation(value)) {
                                return PROJECT_NAME_ERROR;
                            }
                            var project = _.find(stl.app.allProjectList, function(proj) {
                                return proj.Name.toLowerCase() === value.trim().toLowerCase();
                            });
                            if (project) {
                                return ERR_PRJ_EXISTS;
                            }
                            return true;
                        }
                    }, {
                        xtype: 'combobox',
                        store: managerStore,
                        queryMode: 'local',
                        editable: true,
                        anyMatch: true,
                        forceSelection: true,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'ProjectManagerID',
                        displayField: 'ProjectManagerName',
                        readOnly: me.isFieldReadOnly('PROJECTMANAGER'),
                        name: 'manager',
                        id: 'managercombobox',
                        fieldLabel: DataStore.FilterNames.ProjectMangerFilterName,
                        value: ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled ? null : stl.app.loggedInUserName,
                        emptyText: SELECT_DOT,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },

                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (!Ext.getCmp("divisioncombobox").value) {
                                        cbx.store.filter(function(item) {
                                            return false;
                                        });
                                    }
                                }
                            },
                            select: function(id) {
                                if (id.value && id.value != "") {
                                    var bAccessToAllDiv = this.store.findRecord(this.valueField, id.value, 0, false, true, true).get('IsAccessToAllDiv');
                                    if (!bAccessToAllDiv) {
                                        setDivisionCombobox(this, id);
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'datefield',
                        anchor: '100%',
                        name: 'duedate',
                        id: 'projectDueDate',
                        fieldLabel: DataStore.FilterNames.DueDateFilterName,
                        emptyText: SELECT_DOT,
                        value: ServerClientDateClass.getTodaysDate(),
                        format: ServerTimeFormat.getExtDateformat(),
                        allowBlank: false
                    }, {
                        xtype: 'combobox',
                        id: 'divisioncombobox',
                        name: 'division',
                        store: divisionStore,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        valueField: 'DivisionName',
                        displayField: 'DivisionName',
                        emptyText: SELECT_DOT,
                        readOnly: me.isFieldReadOnly('DIVISION'),
                        fieldLabel: DataStore.FilterNames.DivisionFilterName,
                        allowBlank: false,
                        //editingField:null,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },
                        listeners: {
                            change: function(id) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    clearFilters();
                                }

                                if (this.editingField == null)
                                    this.editingField = this.name;
                                sortPortfolioListUsingDivision(id.value, null, this);
                                resetPortfolioCombobox();
                                sortCustomerListUsingDivision(id.value, null, this);
                                resetCustomerCombobox();
                                sortPMListUsingDivision(id.value, null, this);
                                resetManagerCombobox();
                                resetParticipantCombobox();
                                sortBUListUsingDivision(id.value, null, this);
                                resetBusinessUnitCombobox();
                                sortTemplateListUsingDivision(id.value, null);
                                resetTemplateCombobox();
                                if (Ext.getCmp('attribute1combobox').isVisible()) {
                                    sortAttribute1ListUsingDivision(id.value, null, this);
                                    resetAttribute1Combobox();
                                }
                                if (Ext.getCmp('attribute2combobox').isVisible()) {
                                    sortAttribute2ListUsingDivision(id.value, null, this);
                                    resetAttribute2Combobox();
                                }
                                if (Ext.getCmp('attribute3combobox').isVisible()) {
                                    sortAttribute3ListUsingDivision(id.value, null, this);
                                    resetAttribute3Combobox();
                                }
                                if (Ext.getCmp('attribute4combobox').isVisible()) {
                                    sortAttribute4ListUsingDivision(id.value, null, this);
                                    resetAttribute4Combobox();
                                }
                                if (Ext.getCmp('attribute5combobox').isVisible()) {
                                    sortAttribute5ListUsingDivision(id.value, null, this);
                                    resetAttribute5Combobox();
                                }
                                this.editingField = null;
                            },
                            render: function(cbx) {
                                // if(cbx.store.getCount() === 1){
                                //  cbx.setValue(cbx.store.getAt(0));
                                // }
                                // else if(cbx.store.getCount() > 1){
                                if (!ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    cbx.setValue(setDefaultDivision()); // To Set Division on Window Load
                                }
                                //}
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        id: 'portfoliocombobox',
                        name: 'portfolio',
                        store: portfolioStore,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        emptyText: SELECT_DOT,
                        valueField: 'PortfolioName',
                        displayField: 'PortfolioName',
                        readOnly: me.isFieldReadOnly('AUTHOR'),
                        fieldLabel: DataStore.FilterNames.PortfolioFilterName,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'AUTHOR') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'AUTHOR');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        name: 'businessUnit',
                        id: 'businessUnitcombobox',
                        store: businessStore,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        valueField: 'BusinessUnitName',
                        displayField: 'BusinessUnitName',
                        readOnly: me.isFieldReadOnly('CATEGORY'),
                        fieldLabel: DataStore.FilterNames.BusinessUnitFilterName,
                        emptyText: SELECT_DOT,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'CATEGORY') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'CATEGORY');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        name: 'customer',
                        id: 'customercombobox',
                        store: customerStore,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        valueField: 'CustomerName',
                        displayField: 'CustomerName',
                        readOnly: me.isFieldReadOnly('SUBJECT'),
                        fieldLabel: DataStore.FilterNames.CustomerFilterName,
                        emptyText: SELECT_DOT,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },

                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'SUBJECT') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'SUBJECT');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        store: Attribute1Store,
                        hidden: Attribute1Store == null ? true : false,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'Attribute1Name',
                        displayField: 'Attribute1Name',
                        readOnly: me.isFieldReadOnly('ATTRIBUTE1'),
                        name: 'attribute1',
                        id: 'attribute1combobox',
                        fieldLabel: DataStore.FilterNames.Attribute1FilterName,
                        emptyText: SELECT_DOT,
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'ATTRIBUTE1') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'ATTRIBUTE1');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        store: Attribute2Store,
                        hidden: Attribute2Store == null ? true : false,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'Attribute2Name',
                        displayField: 'Attribute2Name',
                        readOnly: me.isFieldReadOnly('ATTRIBUTE2'),
                        name: 'attribute2',
                        id: 'attribute2combobox',
                        fieldLabel: DataStore.FilterNames.Attribute2FilterName,
                        emptyText: SELECT_DOT,
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'ATTRIBUTE2') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'ATTRIBUTE2');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        store: Attribute3Store,
                        hidden: Attribute3Store == null ? true : false,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'Attribute3Name',
                        displayField: 'Attribute3Name',
                        readOnly: me.isFieldReadOnly('ATTRIBUTE3'),
                        name: 'attribute3',
                        id: 'attribute3combobox',
                        fieldLabel: DataStore.FilterNames.Attribute3FilterName,
                        emptyText: SELECT_DOT,
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'ATTRIBUTE3') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'ATTRIBUTE3');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        store: Attribute4Store,
                        hidden: Attribute4Store == null ? true : false,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'Attribute4Name',
                        displayField: 'Attribute4Name',
                        readOnly: me.isFieldReadOnly('ATTRIBUTE4'),
                        name: 'attribute4',
                        id: 'attribute4combobox',
                        fieldLabel: DataStore.FilterNames.Attribute4FilterName,
                        emptyText: SELECT_DOT,
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'ATTRIBUTE4') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'ATTRIBUTE4');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: 'combobox',
                        store: Attribute5Store,
                        hidden: Attribute5Store == null ? true : false,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        lastQuery: '',
                        valueField: 'Attribute5Name',
                        displayField: 'Attribute5Name',
                        readOnly: me.isFieldReadOnly('ATTRIBUTE5'),
                        name: 'attribute5',
                        id: 'attribute5combobox',
                        fieldLabel: DataStore.FilterNames.Attribute5FilterName,
                        emptyText: SELECT_DOT,
                        listeners: {
                            beforerender: function(cbx, eOpts) {
                                if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') != 'ATTRIBUTE5') {
                                        if (!Ext.getCmp("divisioncombobox").value) {
                                            cbx.store.filter(function(item) {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            },
                            change: function(id) {
                                if (id.value && id.value != "") {
                                    setDivisionCombobox(this, id);
                                    if (ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled) {
                                        updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, 'ATTRIBUTE5');
                                    }
                                }
                            }
                        }
                    }, {
                        xtype: "container",
                        layout: 'hbox',
                        hidden: false,
                        align: 'stretch',
                        height: "90px",
                        id: "participantsFilterContainer",
                        items: [{
                            xtype: "label",
                            text: DataStore.FilterNames.ProjectParticipantsFilterName + ":",
                            id: "participantsFilterLbl",
                            hidden: false,
                            flex: 2,
                            forId: 'participantsFilterComboBox'

                        }, {
                            xtype: "container",
                            flex: 3,
                            hidden: false,
                            id: 'participantsFilterComboBox',
                            listeners: {
                                afterrender: function(field, eOpts) {
                                    var cb = Ext.getCmp('participantsCheckBox');
                                    var np = Ext.getCmp("NewProject");
                                    np.initializeParticipantsFilter();
                                    np.setParticipantsFilterValue([]);
                                    np.addOrRemoveSelfAsParticipant(cb.getValue());
                                }
                            },
                            html: "<input id='participantsFilterSelectBox' type='text' > </input>"
                        }]

                    }, {
                        xtype: 'checkbox',
                        boxLabel: ADD_SELF_PROJECT_PARTICIPANT,
                        name: 'Add self as Project Participant',
                        checked: true,
                        inputValue: 'addSelfAsPP',
                        id: 'participantsCheckBox',
                        padding: '0 0 0 125',
                        hideLabel: false,
                        listeners: {
                            change: function(cb, checked) { 
                                    var np = Ext.getCmp("NewProject");
                                    np.addOrRemoveSelfAsParticipant(cb.getValue());
                               
                            }
                        }
                    }, {
                        xtype: 'container',
                        layout: 'column',
                        hidden: false,
                        items: [{
                            xtype: 'filefield',
                            name: 'Import',
                            fieldLabel: IMPORT_FIELD_TEXT,
                            labelWidth: 120,
                            regex: new RegExp(/^.*(\.mpp|\.spi)$/i),
                            regexText: SPI_MPP_FILETYPE_ERROR,
                            msgTarget: 'side',
                            allowBlank: true,
                            buttonConfig: {
                                tooltip: BROWSE_BUTTON_TITLE,
                                tooltipType: 'title'
                            },
                            buttonText: "...",
                            emptyText: SELECT_SPI_MPP_FILE,
                            id: 'importFromMPPorSPI',
                            columnWidth: .89,
                            listeners: {
                                change: function(field, value) {
                                    if (value && value != this.emptyText)
                                        Ext.getCmp("TemplateCombobox").setDisabled(true);
                                }
                            }
                        }, {
                            xtype: 'button',
                            width: 25,
                            columnWidth: .11,
                            margin: '0 5 5 5',
                            text: 'X',
                            tooltip: CLEAR_BUTTON_TITLE,
                            tooltipType: 'title',
                            id: 'clearButton',
                            listeners: {
                                click: function() {
                                    Ext.getCmp("importFromMPPorSPI").reset();
                                    Ext.getCmp("TemplateCombobox").setDisabled(false);
                                }
                            }
                        }]
                    }, {
                        xtype: 'combobox',
                        store: TemplateStore,
                        queryMode: 'local',
                        editable: false,
                        triggerAction: 'all',
                        multiSelect: false,
                        valueField: 'Name',
                        displayField: 'Name',
                        name: 'Template',
                        id: 'TemplateCombobox',
                        fieldLabel: TEMPLATE_FIELD_TEXT,
                        emptyText: SELECT_TEMPLATE,
                        onFocus: function() {
                            onComboboxFocus(this);
                        },
                        listeners: {
                            change: function(cbx, newValue, oldValue) {
                                if (newValue && newValue != this.emptyText) {
                                    Ext.getCmp("importFromMPPorSPI").setDisabled(true);
                                    Ext.getCmp("clearButton").setDisabled(true);
                                    var templateName = newValue;
                                    var templateDescription = TemplateStore.findRecord('Name', templateName, 0, false, true, true).get('Description');
                                    Ext.getCmp('TemplateDescription').setValue(templateDescription);
                                } else {
                                    //Ext.getCmp('TemplateDescription').setValue(null);
                                    //Ext.getCmp('TemplateCombobox').setValue(null);
                                    Ext.getCmp("importFromMPPorSPI").setDisabled(false);
                                    Ext.getCmp("clearButton").setDisabled(false);
                                }
                            }
                        }
                    }, {
                        xtype: 'displayfield',
                        id: 'TemplateDescription',
                        name: 'Template_Description',
                        padding: '0 0 0 125',
                        fieldCls: 'Template-Desciption'
                            //value: 'line 1'
                    }]
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    layout: {
                        pack: 'end',
                        type: 'hbox'
                    },
                    items: [{
                        xtype: 'button',
                        text: OK_BUTTON,
                        handler: function(btn, e, opts) {
                            if (!validateFields())
                                return;
                            var isImportFromMSProject = false;
                            var fileFieldValue = Ext.getCmp('importFromMPPorSPI').getValue();
                            isImportFromMSProject = (fileFieldValue != null && fileFieldValue != "" && fileFieldValue != SELECT_SPI_MPP_FILE);
                            if (isImportFromMSProject) {
                                var form = this.up('form').getForm();
                                if (form.isValid()) {
                                    form.submit({
                                        url: ROOTURL + 'ImportProject',
                                        waitMsg: UPLOAD_MSG,
                                        success: function(form, action) {
                                            showLoadingIcon(true);
                                            //initializeViews();
                                            var projectAttributes = populateProjectAttributes();
                                            stl.app.loadProjectJson(action.result.data, false /*readonly*/ , null, Ext.getCmp("NewProject").getProjectNameComponent().value, true, projectAttributes);
                                            var errorCollection = JSON.parse(action.result.errorCollection);
                                            ShowWarningMessageForImport(errorCollection);
                                            clearAndCloseForm(me, false);
                                        },
                                        failure: function(form, action) {
                                            if (!checkServerErrorInResponse(action.result.data)) {
                                                Ext.Msg.alert('Failure', 'Import Project: "' + JSON.parse(action.result.data).Errors[0].Description);
                                            } else
                                                clearAndCloseForm(me, false);
                                        }
                                    });
                                }
                            } else {


                                var projectAttributes = populateProjectAttributes();

                                // TODO instantiate project model here and send to matrix view as lone param
                                var templateSelected;
                                var isTemplateSelected = (Ext.getCmp('TemplateCombobox').getValue() != null && Ext.getCmp('TemplateCombobox').getValue() != SELECT_TEMPLATE);
                                if (isTemplateSelected) {
                                    var templateName = Ext.getCmp('TemplateCombobox').getValue();
                                    var templateUid = TemplateStore.findRecord('Name', templateName, 0, false, true, true).get('Uid');
                                    templateSelected = {};
                                    templateSelected.id = templateUid;
                                    templateSelected.name = templateName;
                                    OnTemplateSelect(templateSelected, null, Ext.getCmp("NewProject").getProjectNameComponent().value, projectAttributes);

                                } else {
                                    initializePertView();
                                    stl.app.matrixView.init(true, Ext.getCmp("NewProject").getProjectNameComponent().value, Ext.getCmp('divisioncombobox').value, projectAttributes);
                                }
                                clearAndCloseForm(me, false);
                            }
                        }
                    }, {
                        xtype: 'button',
                        text: CANCEL_BUTTON,
                        listeners: {
                            click: function(btn, e, Opts) {
                                clearAndCloseForm(me, true);
                            }
                        }
                    }]
                }]
            }]
        });
        me.callParent(arguments);
    },

    isFieldReadOnly: function(fieldName) {
        //debugger;
        var isExternalMappingEnabled = ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled;
        var SST_ID_Field = stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD');
        var EditableFields = stl.app.commonSettingValue('EXTERNAL_ATTRIB_EDITABLE_FIELDS');
        if (isExternalMappingEnabled) {
            var EditableFieldsArray = EditableFields.split(",");
            if (fieldName == SST_ID_Field) {
                return false;
            }
            if (!Ext.Array.contains(EditableFieldsArray, fieldName)) { //&& fieldName != SST_ID_Field
                return true;
            }
        }
        return false;
    },

    isProjectNameTextInputFieldToBeHidden: function() {
        var isExternalMappingEnabled = ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled;
        return !!isExternalMappingEnabled;
    },

    isProjectNameDropdownInputFieldToBeHidden: function() {
        var isExternalMappingEnabled = ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled;
        return !isExternalMappingEnabled;
    },

    getProjectNameComponent: function() {
        var isExternalMappingEnabled = ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled;
        return Ext.getCmp("projectName");
    },
    initializeParticipantsFilter: function() {
        var $participantsFilterSelectBox = $("#participantsFilterSelectBox");
        if ($participantsFilterSelectBox.length  > 0 && !this.initializedParticipantsField) {
            $participantsFilterSelectBox.select2({
                    placeholder: SELECT_DOT,
                    allowClear: true,
                    dropdownParent: $participantsFilterSelectBox,
                    query: this.managerDropDownQuery(),
                    containerCssClass: "newProjectSelect2",
                    multiple: true,
                    theme: "classic",
                    data: this.getAvailableManagerOptions()
                })
            this.initializedParticipantsField = true;
            this.$participantsFilterSelectBox = $participantsFilterSelectBox;
        }
    },
    setParticipantsFilterValue: function(participantsArr){
        this.$participantsFilterSelectBox.select2("val",participantsArr);
    },
    getParticipantsFilterValue: function(participantsArr){
        return this.$participantsFilterSelectBox.select2("val");
    },
    managerDropDownQuery: function(query) {
        if (query !== undefined) {
            var filteredData = this.filterManagers(query.term);
            query.callback({
                results: filteredData
            });
        }
    },
    filterManagers: function(searchTerm) {
        var filteredData = this.getAvailableManagerOptions();
        if (searchTerm) {
            filteredData = _.filter(filteredData, function(manager) {
                return (manager.text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
            });
        }
        return filteredData;
    },
    getAvailableManagerOptions: function() {
        var dropdnData = [];
        var selectedDiv =
            _.each(DataStore.ProjectManagerList, function(projMgr) {
                if (projMgr.IsAccessToAllDiv ||
                    Ext.getCmp("divisioncombobox").value.toLowerCase() === projMgr.DivisionName.toLowerCase()) {
                    dropdnData.push({
                        id: projMgr.ProjectManagerID,
                        text: projMgr.ProjectManagerName
                    });
                }
            });
        return dropdnData;
    },

    addOrRemoveSelfAsParticipant: function(checked) {
        var currentlySelectedItems = this.getParticipantsFilterValue();
        var currentIndexOfSelf = currentlySelectedItems.indexOf(stl.app.loggedInUserName);
        if (checked) {
            if (currentIndexOfSelf === -1) {
                currentlySelectedItems.push(stl.app.loggedInUserName)
                this.setParticipantsFilterValue(currentlySelectedItems);
            }
        } else {
            if (currentIndexOfSelf !== -1) {
                currentlySelectedItems.splice(currentIndexOfSelf, 1);
                this.setParticipantsFilterValue(currentlySelectedItems);
            }

        }
    }
});

function updateDivisionAndProjectAttributesBasedOnSSTIdSelection(id, fieldName) {
    if (stl.app.commonSettingValue('EXTERNAL_ATTRIB_SSTIDFIELD') == fieldName) {
        Ext.getCmp("divisioncombobox").fireEvent('change', Ext.getCmp("divisioncombobox"));
        setProjectAttributeComboboxes(this, id);
    }
};

function initializePertView() {
    stl.app.initView(PERT_VIEW);
    stl.app.matrixView = new stl.view.MatrixView({
        container: Ext.getCmp("matrix-view-container").el.dom
    });
    Ext.getCmp("content").getLayout().setActiveItem(1);

}

function validateFields() {
    var isExternalMappingEnabled = ConfigData.moduleSettingsMap.EXTERNAL_ATTRIB_MAPPING_ENABLED.Enabled;
    var projectNameComp = Ext.getCmp('projectName');
    //var projectNameComp = Ext.getCmp('projectName');

    if (projectNameComp.getActiveError() != "")
        return false;

    if (!projectNameComp.value || projectNameComp.value == "") {
        projectNameComp.setActiveError(REQUIRED_FIELD_MESSAGE);
        return false;
    }

    var divisioncombobox = Ext.getCmp('divisioncombobox');
    if (!divisioncombobox.value || divisioncombobox.value == "") {
        divisioncombobox.setActiveError(REQUIRED_FIELD_MESSAGE);
        return false;
    }

    var managercombobox = Ext.getCmp('managercombobox');
    if (!managercombobox.value || managercombobox.value == "") {
        managercombobox.setActiveError(REQUIRED_FIELD_MESSAGE);
        return false;
    }

    return true;

}

function clearAndCloseForm(me, closeme) {
    clearFilters();
    me.closewindow = closeme;
    me.close();

}

function populateProjectAttributes() {
    var projectAttributes = {
        'portfolio': Ext.getCmp('portfoliocombobox').getValue(),
        'businessUnit': Ext.getCmp('businessUnitcombobox').getValue(),
        'customer': Ext.getCmp('customercombobox').getValue(),
        'manager': Ext.getCmp('managercombobox').getValue(),
        'participants': $('#participantsFilterSelectBox').select2("val"),
        'duedate': Ext.getCmp('projectDueDate').getValue(),
        'division': Ext.getCmp('divisioncombobox').getValue()
    };
    var attribute1comboboxCmp = Ext.getCmp('attribute1combobox');
    if (attribute1comboboxCmp.isVisible())
        projectAttributes.attribute1 = attribute1comboboxCmp.getValue();

    var attribute2comboboxCmp = Ext.getCmp('attribute2combobox');
    if (attribute2comboboxCmp.isVisible())
        projectAttributes.attribute2 = attribute2comboboxCmp.getValue();

    var attribute3comboboxCmp = Ext.getCmp('attribute3combobox');
    if (attribute3comboboxCmp.isVisible())
        projectAttributes.attribute3 = attribute3comboboxCmp.getValue();

    var attribute4comboboxCmp = Ext.getCmp('attribute4combobox');
    if (attribute4comboboxCmp.isVisible())
        projectAttributes.attribute4 = attribute4comboboxCmp.getValue();

    var attribute5comboboxCmp = Ext.getCmp('attribute5combobox');
    if (attribute5comboboxCmp.isVisible())
        projectAttributes.attribute5 = attribute5comboboxCmp.getValue();

    projectAttributes.projectFileType = PROJECT_TYPE_PPI;
    return projectAttributes;
}

function clearFilters() {
    Ext.getCmp('portfoliocombobox').getStore().clearFilter();
    Ext.getCmp('businessUnitcombobox').getStore().clearFilter();
    Ext.getCmp('customercombobox').getStore().clearFilter();
    Ext.getCmp('managercombobox').getStore().clearFilter();
    Ext.getCmp('attribute1combobox').getStore().clearFilter();
    Ext.getCmp('attribute2combobox').getStore().clearFilter();
    Ext.getCmp('attribute3combobox').getStore().clearFilter();
    Ext.getCmp('attribute4combobox').getStore().clearFilter();
    Ext.getCmp('attribute5combobox').getStore().clearFilter();
}

function setDivisionCombobox(cbx, id) {
    var divisioncomboboxCmp = Ext.getCmp('divisioncombobox');
    var div = cbx.store.findRecord(cbx.valueField, id.value, 0, false, true, true).get('DivisionName');
    if (divisioncomboboxCmp) {
        divisioncomboboxCmp.editingField = cbx.name;
        div = div.split(",");

        if (div.length > 0) {
            var currentDivFieldvalue = divisioncomboboxCmp.getValue();
            if (currentDivFieldvalue && div.indexOf(currentDivFieldvalue) != -1) {
                //No need to set division field value
            } else
                divisioncomboboxCmp.setValue(divisionStore.findRecord('DivisionName', div[0], 0, false, true, true));
        }
    }
}

function setProjectAttributeComboboxes(cbx, id) {
    var portfoliocomboboxCmp = Ext.getCmp('portfoliocombobox');
    var businessunitcomboboxCmp = Ext.getCmp('businessUnitcombobox');
    var customercomboboxCmp = Ext.getCmp('customercombobox');
    var managercomboboxCmp = Ext.getCmp('managercombobox');
    var attribute1comboboxCmp = Ext.getCmp('attribute1combobox');
    var attribute2comboboxCmp = Ext.getCmp('attribute2combobox');
    var attribute3comboboxCmp = Ext.getCmp('attribute3combobox');
    var attribute4comboboxCmp = Ext.getCmp('attribute4combobox');
    var attribute5comboboxCmp = Ext.getCmp('attribute5combobox');
    //var div = cbx.store.findRecord(cbx.valueField, id.value, 0, false, true, true).get('DivisionName');
    if (portfoliocomboboxCmp) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var portfolioValue = getMappedAttributeValue(id, 'Portfolio');
        if (portfolioValue && portfolioValue.trim() != "") {
            setValueInCombobox(portfoliocomboboxCmp, portfolioValue, "PortfolioName");
        }
    }

    if (businessunitcomboboxCmp) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var BusinessUnitValue = getMappedAttributeValue(id, 'BusinessUnit');
        if (BusinessUnitValue && BusinessUnitValue.trim() != "") {
            setValueInCombobox(businessunitcomboboxCmp, BusinessUnitValue, "BusinessUnitName");
        }
    }

    if (customercomboboxCmp) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var customerValue = getMappedAttributeValue(id, 'Customer');
        if (customerValue && customerValue.trim() != "") {
            setValueInCombobox(customercomboboxCmp, customerValue, "CustomerName");
        }
    }

    if (managercomboboxCmp) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var managerValue = getMappedAttributeValue(id, 'ProjectManager');
        if (managerValue && managerValue.trim() != "") {
            setValueInCombobox(managercomboboxCmp, managerValue, "ProjectManagerID");
        }
    }

    if (attribute1comboboxCmp && attribute1comboboxCmp.isVisible()) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var attribute1Value = getMappedAttributeValue(id, 'Attribute1');
        if (attribute1Value && attribute1Value.trim() != "") {
            setValueInCombobox(attribute1comboboxCmp, attribute1Value, "Attribute1Name");
        }
    }

    if (attribute2comboboxCmp && attribute2comboboxCmp.isVisible()) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var attribute2Value = getMappedAttributeValue(id, 'Attribute2');
        if (attribute2Value && attribute2Value.trim() != "") {
            setValueInCombobox(attribute2comboboxCmp, attribute2Value, "Attribute2Name");
        }
    }

    if (attribute3comboboxCmp && attribute3comboboxCmp.isVisible()) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var attribute3Value = getMappedAttributeValue(id, 'Attribute3');
        if (attribute3Value && attribute3Value.trim() != "") {
            setValueInCombobox(attribute3comboboxCmp, attribute3Value, "Attribute3Name");
        }
    }

    if (attribute4comboboxCmp && attribute4comboboxCmp.isVisible()) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var attribute4Value = getMappedAttributeValue(id, 'Attribute4');
        if (attribute4Value && attribute4Value.trim() != "") {
            setValueInCombobox(attribute4comboboxCmp, attribute4Value, "Attribute4Name");
        }
    }

    if (attribute5comboboxCmp && attribute5comboboxCmp.isVisible()) {
        //divisioncomboboxCmp.editingField = cbx.name;
        //div = div.split(",");
        var attribute5Value = getMappedAttributeValue(id, 'Attribute5');
        if (attribute5Value && attribute5Value.trim() != "") {
            setValueInCombobox(attribute5comboboxCmp, attribute5Value, "Attribute5Name");
        }
    }


}

function getMappedAttributeValue(id, fieldName) {
    if (mappedProjectStore.findRecord('SSTField', id.value, 0, false, true, true)) {
        return mappedProjectStore.findRecord('SSTField', id.value, 0, false, true, true).get(fieldName)
    } else {
        return null
    }
    //return mappedProjectStore.findRecord('SSTField', id.value, 0, false, true, true).get(fieldName)
};

function setValueInCombobox(comboboxCmp, value, fieldName) {
    comboboxCmp.setValue(comboboxCmp.store.findRecord(fieldName, value, 0, false, true, true));
}

function setDefaultDivision() {

    var managerComboBox = Ext.getCmp('managercombobox'); //obtain active manager
    var defaultDivision = managerComboBox.store.findRecord(managerComboBox.valueField, managerComboBox.value, 0, false, true, true).get('DivisionName');
    var defaultDivision = defaultDivision.split(",");
    var returnValue = divisionStore.first(); //Initialize with first diviosn available
    if (defaultDivision.length > 0) {
        returnValue = divisionStore.findRecord('DivisionName', defaultDivision[0], 0, false, true, true); //set division corresponding to manager

    }
    return returnValue;

}

function resetCombobox(cb) {
    var store = cb.getStore();
    if (cb.value) {
        if (!store.findRecord(cb.valueField, cb.value, 0, false, true, true))
            cb.clearValue();
    }
}

function resetPortfolioCombobox() {
    this.resetCombobox(Ext.getCmp('portfoliocombobox'));
}

function resetManagerCombobox() {
    var managercomboboxCmp = Ext.getCmp('managercombobox');
    this.resetCombobox(managercomboboxCmp);
    managercomboboxCmp.suspendEvents();
    if (managerStore.findRecord('ProjectManagerID', stl.app.loggedInUserName, 0, false, true, true) == null) {
        managercomboboxCmp.setValue(managerStore.first());
    } else {
        managercomboboxCmp.setValue(stl.app.loggedInUserName);
    }

    managercomboboxCmp.resumeEvents();
}


function resetParticipantCombobox() {
    var participantsCheckBox = Ext.getCmp('participantsCheckBox');
    var np = Ext.getCmp('NewProject');
    np.initializeParticipantsFilter();
    np.setParticipantsFilterValue([]);
    np.addOrRemoveSelfAsParticipant(participantsCheckBox.getValue());
}


function resetCustomerCombobox() {
    this.resetCombobox(Ext.getCmp('customercombobox'));
}

function resetBusinessUnitCombobox() {
    this.resetCombobox(Ext.getCmp('businessUnitcombobox'));
}

function resetAttribute1Combobox() {
    this.resetCombobox(Ext.getCmp('attribute1combobox'));
}

function resetAttribute2Combobox() {
    this.resetCombobox(Ext.getCmp('attribute2combobox'));
}

function resetAttribute3Combobox() {
    this.resetCombobox(Ext.getCmp('attribute3combobox'));
}

function resetAttribute4Combobox() {
    this.resetCombobox(Ext.getCmp('attribute4combobox'));
}

function resetAttribute5Combobox() {
    this.resetCombobox(Ext.getCmp('attribute5combobox'));
}

function resetTemplateCombobox() {
    var cb = Ext.getCmp('TemplateCombobox');
    var store = cb.getStore();
    if (cb.value) {
        if (!store.findRecord('Name', cb.value, 0, false, true, true))
            cb.clearValue();
    }

}

//add this "onFocus" config to avoid cursor in IE
function onComboboxFocus(cb) {
    setTimeout(function(cb) {
        if (typeof(cb) !== "undefined") {
            if (!cb.isExpanded) {
                cb.expand();
            }
            cb.getPicker().focus();
        }
    }.bind(cb), 0);
}

function ShowWarningMessageForImport(errorCollection) {
    var ErrorString = DURING_IMPORT;
    if (errorCollection.IsLinkTypeErrorFound == true) {
        ErrorString += LINK_TYPE_ERROR;
    }

    if (errorCollection.IsLinkLagErrorFound == true) {
        ErrorString += LINK_LAG_ERROR;
    }
    if (errorCollection.IsLinkTypeErrorFound == true || errorCollection.IsLinkTypeErrorFound == true) {
        PPI_Notifier.warning(ErrorString);
    }
}