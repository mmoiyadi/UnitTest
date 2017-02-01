/**
 * Represents a task, as shown in blocks in the matrix view or on the timeline.
 * This is the blank model with default values from which all instances are cloned.
 */
stl.model.Subtask = {

	id: null,	// Assigned at runtime
    name: "",
    complete: false,
    status:"NS",
    deleted:false,
    duration: SUBTASK_DURATION_DEFAULT_SEC,
    remainingDuration: SUBTASK_DURATION_DEFAULT_SEC,
    order: null,
    startDate:null,
    endDate:null,
    resources: null,
    units: null,
    manager: null,
    participants: null,
    checklistItems: null,
    checklistStatus:0,
    absolutePriority: 0,
    streamId: 0,

    setTaskDefaultDuration : function(defaultDuration)
    {
        this.duration = defaultDuration;
        this.remainingDuration = defaultDuration;
    }

};