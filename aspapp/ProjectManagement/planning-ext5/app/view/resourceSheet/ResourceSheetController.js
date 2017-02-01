Ext.define('ProjectPlanning.view.resourceSheet.ResourceSheetController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.resourcesheet-resourcesheet',

    onAddClick: function () {
        var view = this.getView();
        var store = view.getStore();
        var newResourceName = NEW_RESOURCE + SPACE_CONST + stl.app.getNextDefaultResourceIdx();
        store.add({
            'uid': '',
            'Name': newResourceName,
            'AssignedUnits': 0,
            'ProjectMaxUnits': "1",
            'GlobalMaxUnits': "",
            'CalendarUid': null,
            'taskModel': null,
            'BaseCalendarName': stl.app.ProjectDataFromServer.projectCalendarName
        });
        view.editingPlugin.startEditByPosition({
            'row': store.count() - 1,
            'column': 0
        });
    },
    
    onClose: function (panel, eOpts) {
        toggleDockingGrids('resGrid', 'resourceSheet', false);
    },

    onDeleteClick: function () {
        var view = this.getView();
        var selRec = view.getSelectionModel().getSelection()[0];
        if (selRec) {
            if (selRec.get('Name').toLowerCase() == TIME_BUFFER_LOWERCASE) {
                PPI_Notifier.info(BUFFER_RESOURCE_CANT_BE_DELETED);
            } else {
                //confirm to  be added
                var result = confirm(DELETE_ALL_RESOURCE_ASSIGNMENT_OF_THE_RESOURCE);
                if (result == true) {
                    view.getStore().remove(selRec);
                    view.getView().refresh();
                }

            }
        }
    }
    
});
