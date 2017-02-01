/**
 * Represents a task, as shown in blocks in the matrix view or on the timeline.
 * This is the blank model with default values from which all instances are cloned.
 */
stl.model.Task = {

    id: null,   // Assigned at runtime
    name: "",
    emptyText:"",
    status: STATUS_NS,   // placeholder, not yet used
    duration: TASK_DURATION_DEFAULT_SEC,    // 10 days default duration
    remainingDuration: TASK_DURATION_DEFAULT_SEC,   // 10 days default remainingDuration
    startDate:null,
    endDate: null,
    actualStartDate: null,
    actualFinishDate: null,
    suggestedStartDate : null,
    order: null,
    startNoEarlierThan: null,
    manager: null,

    // One of: "normal" / "fullkit" / "purchasing" / "snet"/"PE"/"PEMS"/"CMS"/"IMS"/"IPMS"/"NONE"
    taskType: STRING_NORMAL,

    // One of: "criticalpath" / "volume" / "wip" / "resources"
    subtaskType: SubtaskTypesEnum.WIP,
    subtasksWIPLimit: DEFAULT_WIP_LIMIT,
    resources: null,
    participants: null,
    subtasks: null,
    checklistItems: null,
    checklistStatus: 0,
    remainingSubtasks:0,
    volume: null,   // used by "volume" subtask type
    wipLimit: null,     // used by "wip" subtask type
    isCritical: false, 
    bufferType: STRING_NONE_PASCSAL_CASE,
    taskColor:"",
    fullkitPullInDuration:0,

    isMS:false,
    milestoneColor:"",
    text22:'',
    phaseId:1,
    rowId:1,
    percentBufferConsumption: '0',
    percentChainComplete:'0',
    resources: [],
    participants: [],
    subtasks: [],
    subtaskCount: 0,
    checklistItems: [],
    _successors: [],
    _predecessors: [],
     _successorsIds: [],
    _predecessorsIds: [],
    date1: ServerClientDateClass.getTodaysDate(),
    date7: ServerClientDateClass.getTodaysDate(),
    isReadyToStart : false,
    fullkitPercentCompleteAtRL: 0,
    subtaskStreams:[],
    subtaskStreamRate: 5,
    subtaskStreamOffset: "10 days",
    setTaskDefaultDuration : function(defaultDuration)
    {
        this.duration = defaultDuration;
        this.remainingDuration = defaultDuration;
    }
};