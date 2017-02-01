stl.app.isTaskHasSubtasks = function(task, project) {
    var isSubtaskExists = false;
    if (task.subtasks && task.subtasks.length > 0 & ConfigData.moduleSettingsMap.IS_SUBTASK_ENABLED.Enabled & project.isSubtaskEnabled) {
        isSubtaskExists = true;
    }
    return isSubtaskExists;
}

stl.app.isValueChanged = function(origDuration, newDuration)
{
	return origDuration !== newDuration;
}