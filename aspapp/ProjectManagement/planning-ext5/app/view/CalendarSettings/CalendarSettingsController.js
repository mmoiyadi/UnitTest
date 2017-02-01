Ext.define('ProjectPlanning.view.CalendarSettings.CalendarSettingsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.calendarsettings-calendarsettings',

    CalendarSettingsOKButtonClicked: function () {
        var view = this.getView();
        if (!stl.app.readOnlyFlag) {
            
            var calendarName = Ext.getCmp('Project_Calendar_Combo').value;
            var inheritBaseCalendarForResources = Ext.getCmp('Inherit_Base_Calendar_checkBox').value;
            stl.app.ProjectDataFromServer.InheritProjCalForResFlag = inheritBaseCalendarForResources ? 1 : 0;
            LoadCalendarData(stl.app.ProjectDataFromServer.division, calendarName, function () {
                stl.app.ProjectDataFromServer.initializeCalendarData();
                CalendarStore.PopulateStore(stl.app.getCalendarSettingsData());
                stl.app.ProjectDataFromServer.updateBaseCalendarForTimeBufferResource();
            });
            if (inheritBaseCalendarForResources) {
                stl.app.ProjectDataFromServer.updateResourceBaseCalendars(calendarName);
            }

            stl.app.triggerSave();
        }
        view.close();
    },

    CalendarSettingsCancelButtonClicked: function () {
        var view = this.getView();
        view.close();
    }

});
