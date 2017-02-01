var CalendarStore = new function (Calendar_Data) {
    this.PopulateStore = function (Calendar_Data) {
        this.ProjectCalendarName = Calendar_Data.ProjectCalendarName;
        this.InheritProjCalForResFlag = Calendar_Data.InheritProjCalForResFlag;
    };

    this.GetCalendarSettings = function () {
        var CalendarSetting = {};
        CalendarSetting.ProjectCalendarName = this.ProjectCalendarName;
        CalendarSetting.InheritProjCalForResFlag = this.InheritProjCalForResFlag;
        return CalendarSetting;
    };

    this.GetInheritProjCalForResFlag = function () {
        return this.InheritProjCalForResFlag;
    }
}