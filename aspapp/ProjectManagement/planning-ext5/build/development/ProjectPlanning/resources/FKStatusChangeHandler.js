//FK status update based on checklist updation
stl.app.FKStatusUpdateBasedOnCheckListStatus = function (task, completedChecklist) {
    if (task.status === "NS" && completedChecklist.completedItems > 0) {
        task.status = "IP"
    } else if (task.status === "CO" && completedChecklist.percentCompletion < 100) {
        task.status = "IP"
        task.percentComplete == FALLBACK_TASKCOMPLETION_FROM_CO_TO_IP_RL;
    }
};

//FK status update based on percent completion
stl.app.FKStatusUpdateBasedOnPercentComplete = function (task) {
    if (task.status === "NS" && task.percentComplete > 0) {
        task.status = "IP"
    } else if (task.status === "NS" && task.percentComplete == 100) {
        task.status = "CO"
    } else if (task.status === "IP" && task.percentComplete == 100) {
        task.status = "CO"
    } else if (task.status === "RL" && task.percentComplete == 0) {
        task.status = "IP"
    } else if (task.status === "RL" && task.percentComplete == 100) {
        task.status = "CO"
    }
};

