Ext.define('ProjectPlanning.view.milestoneSheet.MilestoneSheetModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.milestonesheet-milestonesheet',
    data: {
        name: 'ProjectPlanning'
    },
    stores: {
        msGridStore : Ext.create("Ext.data.Store")
    }

});
