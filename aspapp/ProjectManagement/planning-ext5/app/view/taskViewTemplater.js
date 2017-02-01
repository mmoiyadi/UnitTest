 stl.view.TaskViewTemplater = function(cfg) {
   var defaults = {
     taskBarTemplate: $("#task-hbs-template-task-bar"),
     taskPropertiesSubtasksTemplate: $("#task-hbs-template-properties-subtasks")

   };
   $.extend(this, defaults, cfg);
   this.init();

 };

 $.extend(stl.view.TaskViewTemplater.prototype, (function() {

   function getAssignedresources(task, project) {
     return stl.view.ResourcePicker.getReadOnlyText(task.resources, project);
   };

   function compileTemplate(templateSource) {
     return Handlebars.compile(templateSource);
   };

   function getTaskBarCompiledTemplate(taskBarTemplate) {
     return compileTemplate(taskBarTemplate.html());
   };

   function getTaskPropertiesSubtasksCompliedTemplate(taskPropertiesSubtasksTemplate) {
     return compileTemplate(taskPropertiesSubtasksTemplate.html());
   };

   function getTaskTemplateStaticLabelsAndStrings() {
     return getTaskTemplateLabelsAndStrings();
   };
    function getTaskTemplateToolTips() {
      var toolTips={};
      toolTips.CUT_SUBTASK_TOOLTIP = CUT_SUBTASK_TOOLTIP;
      toolTips.COPY_SUBTASK_TOOLTIP = COPY_SUBTASK_TOOLTIP;
      toolTips.PASTE_SUBTASK_TOOLTIP = PASTE_SUBTASK_TOOLTIP;
      toolTips.DELETE_SUBTASK_TOOLTIP = DELETE_SUBTASK_TOOLTIP;
      toolTips.CREATE_SUBTASK_STREAM_TOOLTIP = CREATE_SUBTASK_STREAM_TOOLTIP;
      toolTips.DELETE_SUBTASK_STREAM_TOOLTIP = DELETE_SUBTASK_STREAM_TOOLTIP;
      toolTips.MOVE_STREAM_DOWN_TOOLTIP = MOVE_STREAM_DOWN_TOOLTIP;
      toolTips.MOVE_STREAM_UP_TOOLTIP = MOVE_STREAM_UP_TOOLTIP;
     return toolTips;
   };


   return {
     init: function() {
       if (!this.intialized) {
         this.taskBarCompiledTemplate = getTaskBarCompiledTemplate(this.taskBarTemplate);
         this.taskPropertiesSubtasksCompiledTemplate = getTaskPropertiesSubtasksCompliedTemplate(this.taskPropertiesSubtasksTemplate);
         this.taskTemplateLabelsAndStrings = getTaskTemplateStaticLabelsAndStrings();
         this.toolTips = getTaskTemplateToolTips();
         this.intialized = true;
       }
     },
     getTemplateProperties: function(task, phase, row, project, isSubtaskEnabled) {
       //create classobjects in  task model: 
       var templateProperties = {};

       /*---------------class--------------------------*/
       //task bar class
       templateProperties.taskClass = "task";
       //notReadyToStart class
       if (task.isReadyToStart) {
         templateProperties.taskClass += SPACE_CONST + "readyToStart";
       } else {
         templateProperties.taskClass += SPACE_CONST + "notReadyToStart";
       }
       //NS Class
       templateProperties.taskClass += SPACE_CONST + task.status;
       //isCCTask Class
       if (task.isCritical) templateProperties.taskClass += SPACE_CONST + "isCCTask";
       //has-resource Class
       task.resources.forEach(function(assignedResource) {
         templateProperties.taskClass += SPACE_CONST + "has-resource-" + assignedResource.resourceId;
       });

       // has-phase-506861736531 
       // has-phase-31 
       templateProperties.taskClass += SPACE_CONST + "has-phase-" + stringToHex(project.getPhaseById(task.phaseId).name.replace(/ /g, ''));
       templateProperties.taskClass += SPACE_CONST + "has-phase-" + stringToHex(task.phaseId);
       if (task.manager) templateProperties.taskClass += SPACE_CONST + "has-task-manager-" + stringToHex(task.manager.replace(/ /g, ''));
       if (project.checkIfZeroDurationTask(task)) {
         templateProperties.isZeroDurationTask = true;
         templateProperties.taskClass += SPACE_CONST + "zero-duration-task";
       }
       if (task.bufferType === BUFFER_TYPE_CCFB || task.bufferType === BUFFER_TYPE_CCCB || task.bufferType === BUFFER_TYPE_CMSB) {
         templateProperties.taskClass += SPACE_CONST + "buffer-task " + task.bufferType.toLowerCase() + "-task";
       }

       // has-default-name 
       var taskUid = task.uid,
         scope = project.getScopeItemByUid(row.scopeItemUid);
       if (scope)
         var scopeName = scope.name;
       var nameInField = task.name;

       if (nameInField !== "" && nameInField.indexOf(project.getDefaultTaskNameCompareString(phase.name, scopeName)) !== -1) {
         templateProperties.taskClass += SPACE_CONST + "has-default-name";
       }

       //fullkit class
       if (task.taskType === FULL_KIT) {
         templateProperties.isFK = true;
         templateProperties.taskClass += SPACE_CONST + "fullkit";
         templateProperties.fkColorStyle = "background-color :" + task.taskColor;
       }

       //Purchasing task class
        if (task.taskType === TASKTYPE_PT) {
         templateProperties.taskClass += SPACE_CONST + "purchasingTask";
        }

       


       /*---------------values text--------------------------*/
       if (task.name) templateProperties.hasName = true;
       else templateProperties.hasName = false;

       templateProperties.taskColorStyle = "background-color :" + task.taskColor;


       if (isSubtaskEnabled && task.remainingSubtasks > 0) {
         templateProperties.isSubtaskEnabled = true;
         templateProperties.remainingSubtasksIndicatorStyle = "display: block;";
         templateProperties.remainingSubtasksIndicatorVal = task.remainingSubtasks;

       } else {
         templateProperties.isSubtaskEnabled = false;
         templateProperties.remainingSubtasksIndicatorStyle = "display: none;";
         templateProperties.remainingSubtasksIndicatorVal = 0;
       }



       return templateProperties;

     }


   };

 })());