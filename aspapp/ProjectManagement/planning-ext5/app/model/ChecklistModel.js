Ext.define('ProjectPlanning.model.ChecklistModel', {
    extend: 'Ext.data.Model',
    
    fields: [
        { name: 'complete', type: 'boolean' },
        { name: 'dummy', type: 'boolean', defaultValue: false },
        { name: 'date1', type: 'string' },
        { name: 'date2', type: 'string' },
        { name: 'fieldId', type: 'int' },
        { name: 'name', type: 'string' },
        { name: 'order', type: 'int' },
        { name: 'text1', type: 'string' },
        { name: 'text2', type: 'string' },
        { name: 'text3', type: 'string' },
        { name: 'text4', type: 'string' },
        { name: 'uid', type: 'string' }

    ]
});
