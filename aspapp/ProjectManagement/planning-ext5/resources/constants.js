var SPACE_CONST = ' ',
	EMPTY_STRING = "",
	PERIOD_CONSTANT = ".",
	TRUE_CONSTANT = "True",
	FALSE_CONSTANT = "False",
    NA_STRING = "NA",
	STRING_NORMAL = "normal",
	SESSION_TIMED_OUT = "SESSIONTIMEOUT";
    
/*Titles/Constants used in CC Settings Window*/

	CC_SETTIGNS_WINDOW_TITLE = "CC Settings",
	CCCB_PROJECT_BUFFER = "CCCB (Project Buffer)*",
	CCFB_FEEDING_BUFFER = "CCFB (Feeding Buffer)*",
	CMSB_MILESTONE_BUFFER = "CMSB (Milestone Buffer)*",
	PERCENTAGE_BUFFER_SIZES = "<b>Percentage Buffer Sizes</b>",
	DURATION_REDUCTION = "<b>Duration Reduction</b>",
	REDUCE_TASK_DURATION_BY = "Reduce task durations by",
	APPLY_IN_NEXT_RUN = "Apply in next Run",
	NO_ROUDING = "No rounding",
	ROUND_TO_A_DAY = "Round to a day",
	ROUND_TO_NEAREST_QUARTER = "Round to nearest quarter",
	ADVANCED_SETTINGS = "Advanced Settings",
	FIXED_BUFFER_SIZES = "<b>Fixed Buffer Sizes</b>",
	HORIZON_START_DATE = "<b>Horizon Start Date</b>",
	USE_TODAY_AS_HORIZON_START = "Use today({0}) as Horizon start.",
	USE_TODAY = "Use today ",
	AS_HORIZON_START = "as Horizon start.",
	USE_THIS_DATE_AS_HORIZON_START = "Use this date as Horizon start:",
    DELETE_ALL_RESOURCE_ASSIGNMENT_OF_THE_RESOURCE = "This will delete all assignments of the resource. Are you sure you want to continue?",
    

	HRS = "Hrs",
	PERCENTAGE = "%",
	OK_BUTTON = "Ok",
	CANCEL_BUTTON = "Cancel",

	TASK_DURATION_DEFAULT_STR = "10 days",
    SUBTASK_DURATION_DEFAULT_STR = "1 day",
    ZERO_DURATION_STR = "0 day",
    HORIZON_DATE_MESSAGE = "(Used in this session only)",

    FEEDING_BUFFERS_POLICY = "Feeding Buffers Policy",

	LEAVE_TASKS_IN_PAST = "Leave tasks in the past",
	PUSH_OUT_PROJECT_DUE_DATE ="Push out project due date",
	CONSUME_FEEDING_BUFFERS = "Consume feeding buffers",



	/*End Of Titles/Constants used in CC Settings Window*/
	/*------------------------------------------------------------------------------------------------*/
	/*Titles/Constants used in Error/Warning Window*/

	ERROR_WARNING_WINDOW_TITLE="Errors/Warnings",
	ERR_WARNING_CODE="Code",
	ERR_WARNING_DESC="Description",
	ERR_WARNING_TYPE="Type",
    ERR_CODE = "ERR_RES",
	ERR_GEN = "GENERAL_ERROR"
	ERR_MSG_RESOURCE_ASSIGNMENT_VALIDATION = "Some tasks do not have Resource Assignments. Check Task IDs ",

	ERR_TYPE_RES_ASSIGNMENT = "Resource Assignment Failure",
	ERR_TYPE_RES_CREATION = "Resource Creation Failure",

	WARN_TYPE_RES_CREATION = "Resource Creation Warning",
	ERR_TYPE_RES_UPDATION = "Resource Updation Faliure",

	ERR_MSG_IDCC_NOT_DONE = "Critical Chain not found. Please run IDCC and Accept Plan before doing Check-in.",
	/*End of Titles/Constants used in Error/Warning Window*/
	/*------------------------------------------------------------------------------------------------*/

	/*Titles used in "Milestone Sheet/CC Summary" Window*/


	MILESTONES = "Milestones"
	CC_SUMMARY = "Critical Chain Summary - ",
	PROJECT_BUFFER = "Project Buffer",
	PROJECT_LENGTH = "Project Length",
	CC_DURATION = "CC Duration",
	PROJECT_START = "Project Start",
	PROJECT_END = "Project End",
	CRITICAL_PATH = "Critical Path",
	CC_SUMMARY = "CC Summary",
	CYCLE_TIME_SUMMARY = "Cycle Time Summary",
	SLACK = "Slack",
	NO_MILESTONES_ASSIGNED_IN_PROJECT = "There are no Milestones assigned to tasks in this project.",
	NO_FULL_KIT_TASKS_IN_PROJECT = "There are no full kit tasks in this project.",
	CC_PATH = "CC Path",

	MILESTONE_NAME = "Milestone Name",
	MILESTONE_TYPE = "Milestone Type",
	BUFFER_SIZE = "Buffer Size (d)",
	DUE_DATE = "Due Date",
	PROJECTED_DATE = "Projected Date",

	PROJECT_END = "Project End",
	CONTRACTUAL_MILESTONE = "Contractual Milestone",
	INTERNAL_MILESTONE = "Internal Milestone",
	CHECKLIST = "Checklist",

	SHORT_D = "d",
	DAYS = "days",

    PERCENTAGE_BUFFER_CONSUMPTION = "% Buffer Consumption",
	PERCENTAGE_CHAIN_COMPLETE = "% Chain Complete",
	/*End of Titles used in "Milestone Sheet/CC Summary" Window*/


	FULL_KITS = "Full Kits",
	FULL_KIT_TASK = "Full Kit Task",
	FULL_KIT_TASK_NEED_DATE = "Need Date",
	FULL_KIT_PULL_IN_DURATION = "Pull-in Offset",

	/*------------------------------------------------------------------------------------------------*/

	/* tool tip msgs used in "Milestone Sheet" */
	TOOLTIP_MSG_MILESTONE_NAME =  "The names of milestones assigned to tasks in <b>this</b> project",
	TOOLTIP_MSG_MILESTONE_TYPE = "The type of milestone eg: CMS, IMS, PE",
	TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH = "Show longest path",
	TOOLTIP_MSG_MILESTONE_PANEL_LONGEST_PATH_PEN_CHAIN = "Show Pen. Chain",


	/*------------------------------------------------------------------------------------------------*/


	/* Titles/Constants used in Highlight Dropdown */

    LONGEST_PATH = "Longest Path",
    PEN_CHAIN = "Pen. Chain",

    ERROR = "Error",

    RESOURCE_CONTENTION = "Resource Contention",

	SHOW_CONSTRANING_SUCCESSOR_CHAIN = "Show Constraining Successor Chain",

	SHOW_LONGEST_PREDECESSOR_CHAIN = "Show Longest Predecessor Chain",

	SHOW_PENETRATING_CHAIN = "Show Penetrating Chain",

	IMMEDIATE_PREDECESSORS = "Immediate Predecessors",

	IMMEDIATE_SUCCESSORS = "Immediate Successors",

	ALL_PREDECESSORS = "All Predecessors",

	ALL_SUCCESSORS = "All Successors",

	CC_TASKS = "CC Tasks",

    RESOURCES = "Resources",

	PHASES = "Phases",

	TASK_MANAGERS = "Task Managers",

	NONE = "None",

	NONE_UPPER_CASE ="NONE",

	HIGHLIGHT = "Highlight: ",

	PLEASE_SELECT_A_TASK_TO_HIGHLIGHT = "Please select a task to highlight its ",

	LONGEST_PREDECESSOR_CHAIN = "Longest Predecessor Chain",

    PENETRATING_CHAIN = "Penetrating Chain",

    PROJECT_CMS_CHAINS = "All Chains",


	/* End of Titles/Constants used in Highlight Dropdown */

	/* Titles/Constants used in SaveTemplate dialog */


    ERR_TASKS_WITH_NO_SUCCESSORS = "Tasks without successors. Please check Task ID(s) ",
	ERR_PRJ_EXISTS = "Project with this name already exists",
	PROJECT_STATUS_IN_PLAN = "In Plan",
	PROJECT_STATUS_IN_PLAN_INTEGER = 64,
	PROJECT_TYPE_PPI_TEMPLATE = "Template",
	PROJECT_TYPE_PPI = "CCP",

	/* End of Titles/Constants used in SaveTemplate dialog */

	/*------------------------------------------------------------------------------------------------*/


	ERRORS = "Errors",
	FULL_KIT = "fullkit",
	NO_TEMPLATE = "No Template",
	FK_SHORT = "FK",


    /*----------------------Task types-------------------------------------------*/


	TASKTYPE_FULLKIT = "fullkit",
	TASKTYPE_BUFFER = "buffer",
	TASKTYPE_PT = "purchasing",
	TASKTYPE_SNET = "snet",

	NEW_RESOURCE_ = "New Resource "
	TIME_BUFFER_LOWERCASE = "time_buffer",


	/*-----------------------Confirmation Msgs-----------------------------*/

	ACCEPT_PLAN_CONFIRM_MESSAGE = "Are you sure you want to set the Due Date as the Projected Date for all milestones?",
	REMOVE_ROW_CONFIRM_MESSAGE = "Are you sure you want to remove the row ?",
	REMOVE_SCOPE_CONFIRM_MESSAGE = " Scope %1 and all tasks in it will be removed .Are you sure you want to continue?",

	/*-----------------------Information Msgs-----------------------------*/
	CMS_RESOURCES_NOT_ALLOWED = "Resource Assignments are not allowed on CMS Milestones",
	DELETING_PE_IS_NOT_ALLOWED   ="Deleting Project End is not allowed.",
   	SUBTASK_CANNOT_MARKED_COMPLETE = 'Subtasks can not be marked complete if one or more checklists are incomplete',
   	SET_TO_DEFAULT = "Set to default.",
   	//below three constants goes together
	ZERO_DURATION_NOT_ALLOWED = '0 duration is invalid for incomplete %1.' + SET_TO_DEFAULT ,//shoule be formatted with TASKS or SUBTASKS
	TASKS = "task(s)",
	SUBTASKS = "subtask(s)",
	INVALID_DURATION = 'Invalid Duration Format.' + SET_TO_DEFAULT,

	BUFFER_RESOURCE_CANT_BE_DELETED = "Buffer resource cannot be deleted",
	RESOURCE_NAME_DUPLICATE = "Resource with same name already exists.",
	RESOURCE_ADD_NAME_DUPLICATE = "Resource with same name already exists. Reverted to default name",
    RESOURCE_UPDATE_NAME_DUPLICATE = "Resource with same name already exists.",
	SELECT_TASK_IMMED_PRED = "Please select a task to highlight its Immediate Predecessors.",
	SELECT_TASK_IMMED_SUCC = "Please select a task to highlight its Immediate Successors.",
	SELECT_TASK_ALL_PRED = "Please select a task to highlight its Predecessors",
	SELECT_TASK_ALL_SUCC = "Please select a task to highlight its Successors",
	SELECT_TASK_CONSTR_SUCC_CHAIN = "Please select a task to highlight its Constraining Successor Chain",
	PE_SHOULD_HAVE_PRED = 	"PE should have a Predecessor."
	SAVE_PROJECT = "Save Project",
	REMOVE_REDUNDANT_LINKS = "Please remove the redundant link from Task ID:%1 to Task ID:%2",
    CONFIRM_CMS_PREFIX = "This Internal milestone will be made a contractual milestone. Would you like to prefix CMS to the milestone name?",
	CONFIRM_IMS_PREFIX = "This Contractual milestone will be made an internal milestone. Would you like to prefix IMS to the milestone name?",
	EMPTY_PHASE_NAMES_NOT_ALLOWED ="Empty Phase name not allowed.",
	EMPTY_SCOPE_NAMES_NOT_ALLOWED = "Empty Parent Scope name not allowed.",
	PURCHASING_TASK = "Purchasing Task",
	INFO_TASK_TYPE_CHANGE = "Subtasks are not allowed for %1. Please delete all subtasks",
	EMPTY_TASK_NAME_NOT_ALLOWED = "Empty task name is not allowed. Reverted to old name.",

	/*-----------------------Titles-----------------------------*/

	DELETE_PHASE = "Delete Phase",
	DELETE_SCOPE = "Delete Scope",
	DELETE_ROW = "Delete Row",
	IMS_TITLE = "IMS",
    CMS_TITLE = "CMS",
    PINCH_POINT = "PP",
    PINCH_POINT_TITLE = "Pinch Point",
	CHANGE_IMS_TO_CMS = "Change IMS To CMS",
	CHANGE_CMS_TO_IMS = "Change CMS to IMS",
    ACCEPT_PLAN_TITLE = "Accept Plan",
	CHECKLIST_TITLE = "Checklist for Task: ",
	CHECKLIST_TITLE_SUBTASK = "Checklist for Subtask: ",

	/*-----------------------Success Msgs-----------------------------*/

	SUCCESS_MESSAGE = "Success",
	PROJECT_SAVED_SUCCESS = "Project saved successfully",
	SUCCESSFUL = " successful",
	TEMPLATE_SAVED_SUCCESS = "Template saved successfully",
    PROJECT_UNDO_CHECKOUT_SUCCESS = "Undo Checkout Done!",
	/*-----------------------Error Msgs-----------------------------*/

	ERROR_FOUND_DURING = "Errors found during ",
	CHECK_ERROR_DIALOG = ". Please check Error dialog for more details",
	FAILURE_MESSAGE = "Failure",
	PROJECT_SAVE_FAILED = "Project save failed!",
	CANT_REMOVE_LINK =	"Cannot remove the link. " +  PE_SHOULD_HAVE_PRED,
	LINK_ERROR = "Link Error",
	//Outgoing Links PE and CMS links
	NO_SUCC_FOR_CMS_PE = "No Successors for CMS/PE",
	//Outgoing links PEMS and CCCB links
	PEMS_CCCB_LINK_LIMITATION = "A PEMS/CCCB task cannot be linked to any task outside its own cell",
	//Outgoing links IPMS and CMSB links
	IPMS_CMSB_LINK_LIMITATION = "A IPMS/CMSB task cannot be linked to any task outside its own cell",
	//Incoming Links PE
	INCOMING_LINKS_TO_PE = "PE cannot have predecessors of type CMSB, CMS, PE, IPMS, FK",
	//Incoming Links CMS
	INCOMING_LINKS_TO_CMS = "CMS cannot have predecessors of type CCCB, CMS, PE, PEMS, FK",
	//Incoming Links PEMS/IPMS
	INCOMING_LINKS_TO_PEMS_IPMS = "PEMS/IPMS can have predecessors of type Normal, CCFB, IMS tasks",
	//Incoming Links IMS
	INCOMING_LINKS_TO_IMS = "IMS cannot have predecessors of type CCCB, CMSB.",
	//Incoming Links CCCB
	INCOMING_LINKS_TO_CCCB = "CCCB cannot have predecessors of type CMSB, CCCB, CMS, PE, PEMS, IPMS, FK",
	//Incoming Links CMSB
	INCOMING_LINKS_TO_CMSB = "CMSB cannot have predecessors of type CMSB, CCCB, CMS, PE, PEMS, IPMS, FK",
	//Incoming Links CCFB
	INCOMING_LINKS_TO_CCFB = "CCFB cannot have predecessors of type CMSB, CCCB, CMS, PE, PEMS, IPMS",
	//Incoming Links Normal
	INCOMING_LINKS_TO_NORMAL = "Normal/Fullkit tasks cannot have predecessors of type CMSB, CCCB, CMS, PE, IPMS, PEMS",

	OUTGOING_LINKS_FROM_PEMS = "PEMS can only have successors of type CCCB/PE",
	OUTGOING_LINKS_FROM_CCCB = "CCCB can only have successors of type PE",
	OUTGOING_LINKS_FROM_CMSB = "CMSB can only have successors of type CMS/IMS",

	IMS_SHOULD_HAVE_SUCC = "Internal Milestone should have a successor.",
    CMS_SHOULD_NOT_HAVE_SUCC = "Contractual Milestone should not have a successor.",
    PINCHPOINT_SHOULD_HAVE_SUCC = "Phase Pinch Point must have a successor",
	CYCLIC_LINK = "This link creates a cycle.",
	REDUNDANT_LINK = "This link already exists through another path.",
	LINK_EXISTS = "This link already exists.",
	FLEXIBLE_LINKS_ALLOWANCE_CONFIG = "Modify the config to create more dependencies between tasks within a phase or across phases."
	REDIRECT_LINK_TO_PE_TO_PEMS = "On IDCC network, link to PE is redirected to PEMS",
	REDIRECT_LINK_TO_PE_TO_CCCB = "On IDCC network, link to PE is redirected to CCCB if PEMS doesn't exist",
	REDIRECT_LINK_TO_CCCB_TO_PEMS="On IDCC network, link to CCCB is redirected to PEMS if it exists",
	REDIRECT_LINK_TO_CMSB_TO_IPMS="On IDCC network, link to CMSB is redirected to IPMS if it exists",
	
	REDIRECT_LINK_FROM_PEMS_TO_PE_TO_CCCB = "Link from PEMS to PE is redirected to CCCB task, if it exists, else its linked to PE.",
	REDIRECT_LINK_FROM_IPMS_TO_CMS_TO_CMSB = "Link from IPMS to CMS/IMS is redirected to CMSB task, if it exists, else its linked to CMS/IMS.",
	REDIRECT_LINK_TO_CMS_TO_IPMS = "On IDCC network, link to CMS/IMS is redirected to IPMS",
	REDIRECT_LINK_TO_CMS_TO_CMSB = "On IDCC network, link to CMS/IMS is redirected to CMSB if IPMS doesn't exist",
	VALID_LINK_DIRECTION = "Backward dependencies are not allowed",
	LINK_FROM_IPMS_TO_PEMS = "Dependency from IPMS/CMSB to PE/PEMS or vice-versa is not allowed",
	IPMS_CMSB_ITS_OWN_CMS = "Dependency from an IPMS/CMSB can only be to its own CMS",
	CCCB_CMS = "Dependency between CCCB task and CMS task cannot be created",
    PROJECT_UNDO_CHECKOUT_FAILURE = "Undo Checkout Failed",
	/*-----------------------Warning Msgs-----------------------------*/

	IE_BELOW_NINE_WARNING_MESSAGE ="Project Planning works best on modern web browsers. We recommend using Chrome/Firefox/IE9 and above for the best viewing experience.",
	IE_BELOW_NINE_WARNING_MESSAGE_TITLE ="Incompatible Browser",

	/*---------------------------------RegExpressions--------------------------*/
	//TO DO: bring Reg Ex for reading Urls in here

	ZERO_DURATION_REGEX = /^0$|^0{1,}[dh\s]/,


	KEYPRESS = "keypress",
	MSIE = 'Microsoft Internet Explorer',


	/*-----------------------Constants in FilterFunctions.js-----------------------------*/
	Division = "Division",


	/*Start-----------------------Constants in StatusChangeHandler.js-----------------------------*/
	STATUS_IP = 'IP',
	STATUS_CO = 'CO',
	STATUS_NS = 'NS',

	SEQUENTIAL = "1",
	VOLUME = "2",
	WIP = "3",
	RESOURCE = "4",

	TASK_STATUS_CHANGE_FROM_NS_TO_CO = ' Status Change: Not Started(NS) to Completed(CO)',
	TASK_STATUS_CHANGE_FROM_IP_TO_CO = ' Status Change: In Progress(IP) to Completed(CO)',
	TASK_STATUS_CHANGE_FROM_IP_TO_NS = ' Status Change: In Progress(IP) to Not Started(NS)',
	TASK_STATUS_CHANGE_FROM_CO_TO_NS = ' Status Change: Completed(CO) to Not Started(NS)',
	TASK_STATUS_CHANGE_FROM_CO_TO_IP = ' Status Change: Completed(CO) to In Progress(IP)',
	TASK_STATUS_CHANGE_FROM_NS_TO_RL = ' Status Change: Not Started(NS) to Released(RL)',
	TASK_STATUS_CHANGE_FROM_IP_TO_RL = ' Status Change: In Progress(IP) to Released(RL)',
	TASK_STATUS_CHANGE_FROM_CO_TO_RL = ' Status Change: Completed(CO) to Released(RL)',
	TASK_STATUS_CHANGE_FROM_RL_TO_NS = ' Status Change: Released(RL) to Not Started(NS)', 
	TASK_STATUS_CHANGE_FROM_RL_TO_CO = ' Status Change: Released(RL) to Completed(CO)',
	TASK_ALERT_MSG_FOR_NS_TO_CO = 'Do you want to mark all subtasks for this task as Completed(CO)? If "yes" all subtasks will be marked as CO, if "no" task status will be reverted to NS',
	TASK_ALERT_MSG_FOR_NS_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',
	TASK_ALERT_MSG_FOR_IP_TO_CO = 'Do you want to mark all subtasks for this task as Completed(CO)? If "yes" all subtasks will be marked as CO, if "no" task status will be reverted to IP',
	TASK_ALERT_MSG_FOR_IP_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',
	
	TASK_ALERT_MSG_FOR_IP_TO_NS = 'Do you want to mark all subtasks for this task as Not Started(NS)? If "yes" all subtasks will be marked as NS, if "no" task status will be reverted to IP',
	TASK_ALERT_MSG_FOR_IP_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not Complete?',
	
	TASK_ALERT_MSG_FOR_CO_TO_NS = ' Not Started(NS)Task cannot have subtasks with CO or IP status. Do you want to mark all subtasks for this task as Not Started(NS)?',
	TASK_ALERT_MSG_FOR_CO_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not completed?',
	TASK_ALERT_MSG_FOR_CO_TO_IP = 'Do you want to mark all subtasks for this task as In Progress(IP)? If "yes" all subtasks will be marked IP, if "no" Only task will be marked as IP',

	TASK_ALERT_MSG_FOR_RL_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not completed?',
	TASK_ALERT_MSG_FOR_RL_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',
	
	SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_CO = 'Since all subtasks are Completed(CO), Do you want to mark task as CO? If "yes" task will be marked CO, if "no" task will be marked as IP',
	SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_NS = 'Since all subtasks are Not Started(NS), Do you want to mark task as NS? If "yes" task will be marked NS, if "no" task will be marked as IP',

	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it to Complete',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_CO_NON_EMPTY_CHECKLIST = 'A Fullkit task cannot be marked complete until all checklist items are complete',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_NS_NON_EMPTY_CHECKLIST = 'All checklist items should be marked incomplete for a Not Started Fullkit task',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it to Complete',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_CO_NON_EMPTY_CHECKLIST = 'A Fullkit task cannot be marked complete until all checklist items are complete',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_NS_EMPTY_CHECKLIST = 'Checklist items should exist for a full kit task',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_NS_NON_EMPTY_CHECKLIST = 'All Checklist items should be marked incomplete before marking the task NS(Not Started)'
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_IP_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_IP_NON_EMPTY_CHECKLIST = 'To Roll back the status to IP you can add a checklist item or mark at least one of the existing checklist item as incomplete',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_NON_EMPTY_CHECKLIST = 'At least one of the checklist items should be marked complete to release the task',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_NON_EMPTY_CHECKLIST = 'At least one of the checklist items should be marked complete to release the task',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_NON_EMPTY_CHECKLIST = 'To Release a Full kit task either add a checklist item or mark at least one existing checklist item to incomplete',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_NS_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_NS_NON_EMPTY_CHECKLIST = 'The Full Kit Percent Completion should be less than 0 for Not Started Full Kit task. All checklist items should be marked incomplete for Not Started fullkit task',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL)',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_CO_NON_EMPTY_CHECKLIST = 'Incomplete checklist items are present. All checklist items should be marked complete for Completed fullkit task',
	DEFAULT_PERCENT_COMPLETE_ON_ROLL_BACK_TO_IP_RL = 99,
	/* End-----------------------Constants in StatusChangeHandler.js-----------------------------*/

	/*-----------------------Constants in Revision History-----------------------------*/
	SHOW_LESS_DETAILED_VERSIONS = "Show less detailed versions",
	SHOW_MORE_DETAILED_VERSIONS ="Show more detailed versions",



	/*------------------- Constants in task properties window -------------------------*/

	DURATION = "Duration",
	RESOURCES = "Resources",
	PARTICIPANTS = "Participants",
	MANAGER = "Manager",
	SPECIAL_TASK_TYPE = "Special Task Type",
	STATUS = "Status",
    SNET_DATE = "SNET Date",
	TASK_PROPERTIES_UPDATED = "Task properties updated",
	SUBTASKS_UPDATED_MSG = "Subtasks have been updated for tasks with Ids ",

	/*------------------- Constants in task properties window -------------------------*/

	/*------------------- Constant related to rollup duration -------------------------*/
	ROLLUP_DURATION_ALERT_TITLE = "Rollup Duration",
	ROLLUP_DURATION_ALERT_MESG = "Total subtasks duration is greater than task duration. Do you want to update task duration?",

	/*------------------- Header Button Text  -------------------------*/
	CHECK_OUT = "Check Out",
	UNDO_CHECK_OUT = "Undo Checkout",
	SAVE_PROJECT_TEXT = "Save Project",
	SAVE_TEMPLATE_TEXT = "Save As Template",
	SETTINGS_TEXT = "Settings";


	/*-------------------Call back method names---------------------*/
	var GET_CONFIG_SETTINGS = "Get Config Settings",
        IDCC = "Identify CC",
        CHECKIN_PROJECT = "Checkin",
        CHECKOUT = "Check Out",
        VIEW_PROJECT = "View Project",
        CHECK_BUFFER_IMPACT = "Check Buffer Impact",
        REDO_CC = "ReDoCC",
        GET_REVISION_HISTORY = "Get Revision History",
        GET_REVISION = "Get Revision",
        UNDO_CHECKOUT = "Undo Checkout",
        BUFFER_MANAGEMENT = "Buffer Management",
        NUMBER_OF_REVISIONS='NUMBER_OF_REVISIONS';

	/*--------------End of Call back method names----------------*/

	/*-------------------Config keys---------------------*/
	var NUMBER_OF_REVISIONS='NUMBER_OF_REVISIONS';

	/*--------------End of Call back method names----------------*/


