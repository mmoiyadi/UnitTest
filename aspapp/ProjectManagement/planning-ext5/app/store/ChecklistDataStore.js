Ext.define("ProjectPlanning.store.ChecklistDataStore",{
    extend : 'Ext.data.Store',
    requires : [
        'ProjectPlanning.model.ChecklistModel'
    ],
    model : "ProjectPlanning.model.ChecklistModel"
});
