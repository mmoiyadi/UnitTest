
stl.model.PhaseLevelTaskPrperty = {
    PhaseId : 0,
    Status: "",
    Duration:0,
    Manager:"",
    Participants:[],
    Resources:[],

    SetPhaseLevelProperties : function (PhaseLevelTaskData) {
        this.PhaseId = PhaseLevelTaskData.PhaseId;
        this.Status = PhaseLevelTaskData.Status;
        this.Duration = PhaseLevelTaskData.Duration;
        this.Manager = PhaseLevelTaskData.Manager;
        this.Participants = PhaseLevelTaskData.Participants;
        this.Resources = PhaseLevelTaskData.Resources;
    } 
};