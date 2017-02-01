var
/* Scope menu item */
    INSERTROWABOVE = "Insert row above",
    INSERTROWBELOW = "Insert row below",
    DELETEROW = "Remove row",
    INSERTCHILD = "Insert Child",
    INDENT = "Indent",
    OUTDENT = "Outdent",

/* Tool Tip Constants*/
	MATRIX_VIEW_TOOLTIP = "PERT View",
	TIMELINE_VIEW_TOOLTIP = "Timeline View",
	TABLE_VIEW_TOOLTIP = "Tabular View",
	SETTINGS_TOOLTIP = "Settings",
	HELP_TOOLTIP = "help",
	MILESTONE_PANEL_TOOLTIP = "Toggle Milestone window",
	ERROR_PANEL_TOOLTIP = "Toggle Error/Warning window",
	RESOURCE_PANEL_TOOLTIP = "Toggle Resource window",
	LINKS_TOOLTIP = "Toggle view of links",
	REVISION_HISTORY_TOOLTIP = "Show/Hide Revision history",
	ZOOM_OUT_TOOLTIP = "Zoom out tasks",
	ZOOM_IN_TOOLTIP = "Zoom in tasks",
	LEFT_INDENT_TOOLTIP = "Left Indent the tasks",
	RIGHT_INDENT_TOOLTIP = "Right Indent the tasks",
	REMOVE_BUFFERS_TOOLTIP ="Remove Buffers",
	CALENDAR_SETTING_TOOLTIP = "Calendar Setting",
	REMOVE_FILTER_TOOLTIP = "Remove Applied Filters",
	/*Titles/Constants used in CC Settings Window*/

	CC_SETTIGNS_WINDOW_TITLE = "CC Settings",
	CCCB_PROJECT_BUFFER = "CCCB (Project Buffer)*",
	CCFB_FEEDING_BUFFER = "CCFB (Feeding Buffer)*",
	CMSB_MILESTONE_BUFFER = "CMSB (Milestone Buffer)*",
	PERCENTAGE_BUFFER_SIZES = "<b>Percentage Buffer Sizes</b>",
	DURATION_REDUCTION = "<b>Duration Reduction</b>",
	REDUCE_TASK_DURATION_BY = "Reduce task durations by",
	REDUCE_TASK_DURATION_REGEX_TEXT = 'Value must be greater than or equal to -100',
	REDUCE_TASK_DURATION_VALIDATION_MSG = 'Value must be less than 100',
	APPLY_IN_NEXT_RUN = "Apply in next Run",
	NO_ROUDING = "No rounding",
	ROUND_TO_A_DAY = "Round to a day",
	ROUND_TO_NEAREST_QUARTER = "Round to nearest quarter",
	ADVANCED_SETTINGS = "Advanced Settings",
	FIXED_BUFFER_SIZES = "<b>Fixed Buffer Sizes</b>",
	HORIZON_START_DATE = "<b>Horizon Start Date</b>",
	USE_TODAY_AS_HORIZON_START = "Use today as Horizon start.",
	USE_TODAY = "Use today ",
	AS_HORIZON_START = "as Horizon start.",
	USE_THIS_DATE_AS_HORIZON_START = "Use this date as Horizon start:",
	DELETE_ALL_RESOURCE_ASSIGNMENT_OF_THE_RESOURCE = "This will delete all assignments of the resource. Are you sure you want to continue?",


	HRS = "Hrs",
	PERCENTAGE = "%",
	OK_BUTTON = "Ok",
	DELETE_BUTTON = "Delete",
	CANCEL_BUTTON = "Cancel",
	CLEAR_BUTTON_TITLE = 'Clear selected MPP file',
	BROWSE_BUTTON_TITLE = 'Select a mpp file',
    

	HORIZON_DATE_MESSAGE = "(Used in this session only)",

	FEEDING_BUFFERS_POLICY = "Feeding Buffers Policy",

    PROJECT_CALENDAR_SETTING = "Project Calendar Setting",
    PROJECT_CALENDAR = "Project Calendar",
    INHERIT_PROJECT_CALENDAR_FOR_RESOURCES = "Inherit selected project base calendar for resources",
	SELECTED_CALENDAR_DELETED = "Selected calendar %1 has been deleted from Conweb. Reverted to default calendar %2",

	LEAVE_TASKS_IN_PAST = "Leave tasks in the past",
	PUSH_OUT_PROJECT_DUE_DATE = "Push out project due date",
	CONSUME_FEEDING_BUFFERS = "Consume feeding buffers",



	/*End Of Titles/Constants used in CC Settings Window*/
	/*------------------------------------------------------------------------------------------------*/
	/*Titles/Constants used in Error/Warning Window*/

	ERROR_WARNING_WINDOW_TITLE = "Errors/Warnings",
	ERROR_WARNING_TITLE = 'Warnings',
	ERR_WARNING_CODE = "Code",
	ERR_WARNING_DESC = "Description",
	ERR_WARNING_TYPE = "Type",
	ERR_CODE = "ERR_RES",
	ERR_GEN = "GENERAL_ERROR",
	ERR_MSG_RESOURCE_ASSIGNMENT_VALIDATION = "Some tasks do not have Resource Assignments. Check Task IDs ",
	ERROR_PANEL_HEADER = "Errors",

	ERR_TYPE_RES_ASSIGNMENT = "Resource Assignment Failure",
	ERR_TYPE_RES_CREATION = "Resource Creation Failure",

	WARN_TYPE_RES_CREATION = "Resource Creation Warning",
	ERR_TYPE_RES_UPDATION = "Resource Updation Faliure",

	ERR_MSG_IDCC_NOT_DONE = "Critical Chain not found. Please run IDCC and Accept Plan before doing Check-in.",
	/*End of Titles/Constants used in Error/Warning Window*/
	/*------------------------------------------------------------------------------------------------*/
	
	/*------------------------------------------------------------------------------------------------*/
	/*Constants for Main.js*/
	CONFIRM_DIALOG_LABEL = 'Confirm',
	ARE_YOU_SURE_TEXT = 'Are you sure?',
	/*End of Titles/Constants used in Main Window*/
	/*------------------------------------------------------------------------------------------------*/
	
	/*------------------------------------------------------------------------------------------------*/
	/*Titles/Constants used in Checklist Window*/
	
	MARK_COMPLETE_BUTTON_TEXT = 'Mark Complete',
	MARK_INCOMPLETE_BUTTON_TEXT = 'Mark Incomplete',
	TOOLTIP_MSG_COMPLETE = 'Mark item incomplete',
	TOOLTIP_MSG_INCOMPLETE = 'Mark item complete',
	COLUMN_STATUS_CHECKLIST = 'Status',
	NEW_CHECKLIST_ITEM_PLACEHOLDER_TEXT = 'Enter checklist item(s)',
	/*End of Titles/Constants used in Checklist Window*/
	/*------------------------------------------------------------------------------------------------*/

	/*------------------------------------------------------------------------------------------------*/
	/*Titles/Constants used in Resource Panel*/
	RESOURCE_PANEL_HEADER = 'Project Resources',
	NEW_RESOURCE = "New Resource",
	ADD_RESOURCE_BUTTON_TEXT = 'Add Resource',
	DELETE_RESOURCE_BUTTON_TEXT = 'Delete Resource',
	NO_RESOURCE_IN_TASK_MESSAGE = 'There are no resources assigned to tasks in this project',
	RESOURCE_NAME_COLUMN_HEADER = 'The names of all resources assigned to tasks in <b>this</b> project',
	MAX_UNITS_VALIDATION_MESSAGE = 'Max Unit must be an integer greater than 0',
	/*End of Titles/Constants used in Resource Panel*/
	/*------------------------------------------------------------------------------------------------*/

	/*Titles used in "Milestone Sheet/CC Summary" Window*/


	MILESTONES = "Milestones",
	CC_SUMMARY = "Critical Chain Summary - ",
	PROJECT_BUFFER = "Project Buffer",
	PROJECT_LENGTH = "Project Length",
	CC_DURATION = "Critical Chain",
	PROJECT_START = "Project Start",
	PROJECT_END = "Project End",
	CRITICAL_PATH = "Critical Path",
	CC_SUMMARY_SHORT = "CC Analysis",
	CYCLE_TIME_SUMMARY = "Cycle Time Summary",
	SLACK = "Slack",
	NO_MILESTONES_ASSIGNED_IN_PROJECT = "There are no Milestones assigned to tasks in this project.",
	NO_FULL_KIT_TASKS_IN_PROJECT = "There are no full kit tasks in this project.",
	CC_PATH = "Critical Path",

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
	/*Days Hours Minutes constants*/
	HOURS = "hours",
	MINS = "minutes",
	/*Day Hour Minute constants*/
    	HOURS_STR = "hour",
    	MINS_STR = "minute",
    	DAY_STR = "day",

	PERCENTAGE_BUFFER_CONSUMPTION = "% Buffer Consumption",
	PERCENTAGE_CHAIN_COMPLETE = "% Chain Complete",
	LONGEST_PATH_HEADER = 'Longest Path',
	/*End of Titles used in "Milestone Sheet/CC Summary" Window*/


	FULL_KITS = "Full Kits",
    FULL_KIT_AND_PT = "Full Kits/Purchasing Tasks",
	FULL_KIT_TASK = "Full Kit Task",
	FULL_KIT_TASK_NEED_DATE = "Need Date",
	FULL_KIT_PULL_IN_DURATION = "Pull-in Offset",

	/*------------------------------------------------------------------------------------------------*/

	/* tool tip msgs used in "Milestone Sheet" */
	TOOLTIP_MSG_MILESTONE_NAME = "The names of milestones assigned to tasks in <b>this</b> project",
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

	ALL_TEXT = "All",

	CC_TASKS = "CC Tasks",

	RESOURCES = "Resources",

	PHASES = "Phases",

	TASK_MANAGERS = "Task Managers",

	NONE = "None",

	NONE_UPPER_CASE = "NONE",

	HIGHLIGHT = "Highlight: ",

	PLEASE_SELECT_A_TASK_TO_HIGHLIGHT = "Please select a task to highlight its ",

	LONGEST_PREDECESSOR_CHAIN = "Longest Predecessor Chain",

	PENETRATING_CHAIN = "Penetrating Chain",

	PROJECT_CMS_CHAINS = "All Chains",

	HIGHLIGHT_POPUPS_CSS_CLASS_SELECTOR = [".highlight-chains-popup",".highlight-resources-popup",".highlight-phases-popup",".highlight-task-managers-popup"],
	/* End of Titles/Constants used in Highlight Dropdown */

	/* Titles/Constants used in SaveTemplate dialog */


	ERR_TASKS_WITH_NO_SUCCESSORS = "Tasks without successors. Please check Task ID(s) ",
	ERR_PRJ_EXISTS = "Project with this name already exists",
	SAVE_TEMPLATE_TITLE = 'Save As Template',
	SAVE_AS_PROJECT_TITLE = 'Save As Project',

	/* End of Titles/Constants used in SaveTemplate dialog */

	/*------------------------------------------------------------------------------------------------*/

	ERRORS = "Errors",
	/*-----------------------Confirmation Msgs-----------------------------*/

	ACCEPT_PLAN_CONFIRM_MESSAGE = "Do you want to set the Due Dates as the Projected Date for all milestones?",
	REMOVE_ROW_CONFIRM_MESSAGE = "Are you sure you want to remove the row?",
	REMOVE_SCOPE_CONFIRM_MESSAGE = " Scope %1 and all tasks in it will be removed. Are you sure you want to continue?",
    REMOVE_SCOPES_CONFIRM_MESSAGE = "Scopes and all tasks in those will be removed. Are you sure you want to continue?",
	LINKS_WILL_BE_REMOVED_AFTER_AUTO_LINK = "Some links may be removed by this action . Links removed can not be restored later. Are you sure you want to continue?",

	/*-----------------------Information Msgs-----------------------------*/
	CMS_RESOURCES_NOT_ALLOWED = "Resource Assignments are not allowed on CMS Milestones",
	DELETING_PE_IS_NOT_ALLOWED = "Deleting Project End is not allowed.",
	SUBTASK_CANNOT_MARKED_COMPLETE = 'Subtasks can not be marked complete if one or more checklists are incomplete',
	SET_TO_DEFAULT = "Set to default.",
	//below three constants goes together
	ZERO_DURATION_NOT_ALLOWED = '0 duration is invalid for incomplete %1.' + SET_TO_DEFAULT, //shoule be formatted with TASKS or SUBTASKS
	TASKS = "task(s)",
	SUBTASKS = "subtask(s)",
	INVALID_DURATION = 'Invalid Duration Format. Set to default.',

	BUFFER_RESOURCE_CANT_BE_DELETED = "Buffer resource cannot be deleted.",
	RESOURCE_NAME_DUPLICATE = "Resource with same name already exists.",
	PROJECT_PHASE_NAME_DUPLICATE = "The resources already defined as virtual in projects in the database cannot be redefined as non-virtual.",
	DIVISION_PHASE_NAME_DUPLICATE = "The resource is already defined as virtual in projects in the division(s)(%1).It cannot be redefined as non-virtual.",
	RESOURCE_ADD_NAME_DUPLICATE = "Resource with same name already exists. Reverted to default name.",
	RESOURCE_ADD_VIRTUAL_NAME_DUPLICATE = "The resources already defined as virtual in projects in the database cannot be redefined as non-virtual. Reverted to default name.",
	ADD_RESOURCE_NAME_COLLIDES_WITH_DIVISION_PHASE = "The resource is already defined as virtual in projects in the division(s)(%1).It cannot be added as non-virtual. Reverted to default name.",

	RESOURCE_UPDATE_NAME_DUPLICATE = "Resource with same name already exists.",
    PHASE_NAME_DUPLICATE_ADD = "Phase with same name exists. Reverted to default name.",
    
    PHASE_NAME_DUPLICATE = "Phase with same name exists",
	SELECT_TASK_IMMED_PRED = "Please select a task to highlight its Immediate Predecessors.",
	SELECT_TASK_IMMED_SUCC = "Please select a task to highlight its Immediate Successors.",
	SELECT_TASK_ALL_PRED = "Please select a task to highlight its Predecessors.",
	SELECT_TASK_ALL_SUCC = "Please select a task to highlight its Successors.",
	SELECT_TASK_CONSTR_SUCC_CHAIN = "Please select a task to highlight its Constraining Successor Chain.",
	PE_MISSING = "PE task is not present in the project.",
	PE_ALREADY_EXISTS = "PE already exists in the project",
	PE_SHOULD_HAVE_PRED = "PE should have a Predecessor.",
	SAVE_PROJECT = "Save Project",
	REMOVE_REDUNDANT_LINKS = "Please remove the redundant link from Task ID:%1 to Task ID:%2",
	CONFIRM_CMS_PREFIX = "This Internal milestone will be made a contractual milestone. Would you like to prefix CMS to the milestone name?",
	CONFIRM_IMS_PREFIX = "This Contractual milestone will be made an internal milestone. Would you like to prefix IMS to the milestone name?",
	EMPTY_PHASE_NAMES_NOT_ALLOWED = "Empty Phase name not allowed.",
	EMPTY_SCOPE_NAMES_NOT_ALLOWED = "Empty Parent Scope name not allowed.",
    EMPTY_SUMMARY_TASK_NAME_NOT_ALLOWED = "Empty Summary task name is not allowed", 
	PURCHASING_TASK = "Purchasing Task",
	INFO_TASK_TYPE_CHANGE = "Subtasks are not allowed for %1. Please delete all subtasks.",
	PINCH_POINT_CREATE_INFO = "Pinch Point can only be created in a milestone phase.",
	MILESTONE_NAME_ERROR = "Milestone with that name already exists. Try a different one.",
	EMPTY_TASK_NAME_NOT_ALLOWED = "Empty task name is not allowed. Reverted to old name.",
	LINKS_ARE_NOT_DISPLAYED = 'For better performance dependencies have not been drawn. Please click "Toogle View Links" button to view dependencies.',
	INVALID_WIP_LIMIT = "Invalid Wip Limit. Reverted to old value.",
	/*-----------------------Titles-----------------------------*/

	DELETE_PHASE = "Delete Phase",
	DELETE_SCOPE = "Delete Scope",
	DELETE_ROW = "Delete Row",
	IMS_TITLE = "IMS",
	CMS_TITLE = "CMS",
	PINCH_POINT = "PP",
	PINCH_POINT_TITLE = "Pinch Point",
	MILESTONE_NAME_PREFIX = "Milestone",
	CHANGE_IMS_TO_CMS = "Change IMS To CMS",
	CHANGE_CMS_TO_IMS = "Change CMS to IMS",
	ACCEPT_PLAN_TITLE = "Accept Plan",
	CHECKLIST_TITLE = "Checklist for Task: ",
	FULLKIT_CHECKLIST_TITLE = "FK List: ",
	CHECKLIST_TITLE_SUBTASK = "Checklist for Subtask: ",
	AUTO_LINK = "Auto Link",

	/*-----------------------Success Msgs-----------------------------*/

	SUCCESS_MESSAGE = "Success",
	PROJECT_SAVED_SUCCESS = "Project saved successfully",
	PROJECT_SAVE_AS_SUCCESS = "%1 saved successfully",
	SUCCESSFUL = " successful",
	TEMPLATE_SAVED_SUCCESS = "Template saved successfully",
	PROJECT_UNDO_CHECKOUT_SUCCESS = "Undo Checkout Done!",
	PROJECT_SAVE_AS_CHECKIN_REQD = "IDCC is needed to checkin.",
	/*-----------------------Error Msgs-----------------------------*/

	ERROR_FOUND_DURING = "Errors found during ",
	CHECK_ERROR_DIALOG = ". Please check Error dialog for more details",
	FAILURE_MESSAGE = "Failure",
	PROJECT_SAVE_FAILED = "Project save failed!",
	CANT_REMOVE_LINK = "Cannot remove the link. " + PE_SHOULD_HAVE_PRED,
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
	PINCHPOINT_SHOULD_HAVE_SUCC = "Phase Pinch Point must have a successor.",
	CYCLIC_LINK = "This link creates a cycle.",
	REDUNDANT_LINK = "This link already exists through another path.",
	LINK_EXISTS = "This link already exists.",
	FLEXIBLE_LINKS_ALLOWANCE_CONFIG = "Modify the config to create more dependencies between tasks within a phase or across phases."
REDIRECT_LINK_TO_PE_TO_PEMS = "On IDCC network, link to PE is redirected to PEMS.",
	REDIRECT_LINK_TO_PE_TO_CCCB = "On IDCC network, link to PE is redirected to CCCB if PEMS doesn't exist",
	REDIRECT_LINK_TO_CCCB_TO_PEMS = "On IDCC network, link to CCCB is redirected to PEMS if it exists.",
	REDIRECT_LINK_TO_CMSB_TO_IPMS = "On IDCC network, link to CMSB is redirected to IPMS if it exists.",

	REDIRECT_LINK_FROM_PEMS_TO_PE_TO_CCCB = "Link from PEMS to PE is redirected to CCCB task, if it exists, else its linked to PE.",
	REDIRECT_LINK_FROM_IPMS_TO_CMS_TO_CMSB = "Link from IPMS to CMS/IMS is redirected to CMSB task, if it exists, else its linked to CMS/IMS.",
	REDIRECT_LINK_TO_CMS_TO_IPMS = "On IDCC network, link to CMS/IMS is redirected to IPMS.",
	REDIRECT_LINK_TO_CMS_TO_CMSB = "On IDCC network, link to CMS/IMS is redirected to CMSB if IPMS doesn't exist.",
	VALID_LINK_DIRECTION = "Backward dependencies are not allowed.",
	LINK_FROM_IPMS_TO_PEMS = "Dependency from IPMS/CMSB to PE/PEMS or vice-versa is not allowed.",
	IPMS_CMSB_ITS_OWN_CMS = "Dependency from an IPMS/CMSB can only be to its own CMS.",
	CCCB_CMS = "Dependency between CCCB task and CMS task cannot be created.",
	PROJECT_UNDO_CHECKOUT_FAILURE = "Undo Checkout Failed",
	ERROR_OCCURRED_PROJECT_LOAD ="Error occurred while loading project.",
	INTERNAL_ERROR_TITLE = "Internal Error",
	INTERNAL_ERROR_STRING = "Some internal error occurred. You will be logged out now. Please contact Realization support if error persists",
	
	/*-----------------------Warning Msgs-----------------------------*/

	IE_BELOW_NINE_WARNING_MESSAGE = "Project Planning works best on modern web browsers. We recommend using Chrome/Firefox/IE9 and above for the best viewing experience.",
	IE_BELOW_NINE_WARNING_MESSAGE_TITLE = "Incompatible Browser",

	/*-----------------------Info Msgs-----------------------------*/
    LAST_CHECKEDIN_FILE_DOWNLOADED = "Project is checked out. Last checkedin version downloaded",

	/*---------------------------------RegExpressions--------------------------*/
	//TO DO: bring Reg Ex for reading Urls in here




	/*-----------------------Constants in FilterFunctions.js-----------------------------*/
	Division = "Division",


	/*Start-----------------------Constants in StatusChangeHandler.js-----------------------------*/


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
	TASK_ALERT_MSG_FOR_NS_TO_CO = 'Do you want to mark all subtasks for this task as Completed(CO)? If "yes" all subtasks will be marked as CO, if "no" task status will be reverted to NS.',
	TASK_ALERT_MSG_FOR_NS_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',
	TASK_ALERT_MSG_FOR_IP_TO_CO = 'Do you want to mark all subtasks for this task as Completed(CO)? If "yes" all subtasks will be marked as CO, if "no" task status will be reverted to IP.',
	TASK_ALERT_MSG_FOR_IP_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',

	TASK_ALERT_MSG_FOR_IP_TO_NS = 'Do you want to mark all subtasks for this task as Not Started(NS)? If "yes" all subtasks will be marked as NS, if "no" task status will be reverted to IP.',
	TASK_ALERT_MSG_FOR_IP_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not Complete?',

	TASK_ALERT_MSG_FOR_CO_TO_NS = ' Not Started(NS)Task cannot have subtasks with CO or IP status. Do you want to mark all subtasks for this task as Not Started(NS)?',
	TASK_ALERT_MSG_FOR_CO_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not completed?',
	TASK_ALERT_MSG_FOR_CO_TO_IP = 'Do you want to mark all subtasks for this task as In Progress(IP)? If "yes" all subtasks will be marked IP, if "no" Only task will be marked as IP.',

	TASK_ALERT_MSG_FOR_RL_TO_NS_CHECKLIST = 'Do you want to mark all checklist items for this task as not completed?',
	TASK_ALERT_MSG_FOR_RL_TO_CO_CHECKLIST = 'Do you want to mark all checklist items for this task as Completed?',

	SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_CO = 'Since all subtasks are Completed(CO), Do you want to mark task as CO? If "yes" task will be marked CO, if "no" task will be marked as IP.',
	SUBTASK_ALERT_MSG_FOR_STATUS_CHANGE_TO_NS = 'Since all subtasks are Not Started(NS), Do you want to mark task as NS? If "yes" task will be marked NS, if "no" task will be marked as IP.',

	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it to Complete.',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_CO_NON_EMPTY_CHECKLIST = 'A Fullkit task cannot be marked complete until all checklist items are complete.',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_NS_NON_EMPTY_CHECKLIST = 'All checklist items should be marked incomplete for a Not Started Fullkit task.',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it to Complete.',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_CO_NON_EMPTY_CHECKLIST = 'A Fullkit task cannot be marked complete until all checklist items are complete.',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_NS_EMPTY_CHECKLIST = 'Checklist items should exist for a full kit task.',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_NS_NON_EMPTY_CHECKLIST = 'All Checklist items should be marked incomplete before marking the task NS(Not Started).'
FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_IP_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_IP_NON_EMPTY_CHECKLIST = 'To Roll back the status to IP you can add a checklist item or mark at least one of the existing checklist item as incomplete.',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_NS_TO_RL_NON_EMPTY_CHECKLIST = 'At least one of the checklist items should be marked complete to release the task.',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_IP_TO_RL_NON_EMPTY_CHECKLIST = 'At least one of the checklist items should be marked complete to release the task.',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_CO_TO_RL_NON_EMPTY_CHECKLIST = 'To Release a Full kit task either add a checklist item or mark at least one existing checklist item to incomplete.',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_NS_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_NS_NON_EMPTY_CHECKLIST = 'The Full Kit Percent Completion should be less than 0 for Not Started Full Kit task. All checklist items should be marked incomplete for Not Started fullkit task.',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_CO_EMPTY_CHECKLIST = 'Checklist items should exist for a task to mark it Released(RL).',
	FULLKIT_TASK_ERROR_MSG_FOR_RL_TO_CO_NON_EMPTY_CHECKLIST = 'Incomplete checklist items are present. All checklist items should be marked complete for Completed fullkit task.',
	DEFAULT_PERCENT_COMPLETE_ON_ROLL_BACK_TO_IP_RL = 99,
	DEFAULT_PHASE_NAME = "Phase",
	DEFAULT_SCOPE_NAME = "New Scope",
	MESSAGE_ACTION_CANNOT_UNDONE = " This action cannot be undone.",
	/* End-----------------------Constants in StatusChangeHandler.js-----------------------------*/

	/*-----------------------Constants in Revision History-----------------------------*/
	SHOW_LESS_DETAILED_VERSIONS = "Show less detailed versions",
	SHOW_MORE_DETAILED_VERSIONS = "Show more detailed versions",



	/*------------------- Constants in task properties window -------------------------*/

	DURATION = "Duration",
	PARTICIPANTS = "Participants",
	MANAGER = "Manager",
	SPECIAL_TASK_TYPE = "Special Task Type",
	STATUS = "Status",
	SNET_DATE = "SNET Date",
	TASK_PROPERTIES_UPDATED = "Task properties updated",
	TASK_PROPERTIES_TITLE = "Task Properties",
	SUBTASKS_UPDATED_MSG = "Subtasks have been updated for tasks with Ids ",

	/*------------------- Constants in task properties window -------------------------*/
	
	/*------------------- Constants in resource picker window -------------------------*/
	ADD_RESOURCE_PLACEHOLDER = "Add a resource...",
	MISSING_RESOURCE = "(Missing resource)",
	NONE_RESOURCE = "(None)",
	NO_MATCH_RESOURCE_SEARCH = "No Matching Resources Found",
	/*------------------- Constants in resource picker window -------------------------*/
	
	/*------------------- Constant related to rollup duration -------------------------*/
	ROLLUP_DURATION_ALERT_TITLE = "Rollup Duration",
	ROLLUP_DURATION_ALERT_MSG = "Rolledup task duration (%1) is greater than current remaining duration (%2). Do you want to update?",
	ROLLUP_DURATION_WARNING_MSG = "Roll up of subtask duration(%2) is greater than the current task Remaining duration(%1).",
	ROLLUP_DURATION_INFO_MSG = "Task duration changed to %1.",
	POPOVER_OK_BUTTON_TEXT="Ok",
	POPOVER_CANCEL_BUTTON_TEXT="Cancel",
	ROLLUP_DURATION_WARNING_CONFIRMATION_MSG = "Do you want to update the task duration to the subtask roll up duration of %1?",
	ROLLUP_RESOURCE_WARNING_MSG = "Task resource(s) will be rolled up from ",
	ROLLUP_RESOURCE_INFO_MSG = "Task resource(s) rolled up from ",
	ROLLUP_RESOURCE_ADDED_INFO_MSG = "%1 (%2 unit(s)) has been added",
	ROLLUP_RESOURCE_UPDATED_INFO_MSG = "%1 has been updated from %2 to %3 unit(s)",
	ROLLUP_RESOURCE_ADDED_WARNING_MSG = "%1 (%2 unit(s)) - Resource not present in the task.",
	ROLLUP_RESOURCE_UPDATED_WARNING_MSG = "%1 - Roll up based on subtask(%3 unit(s)) is greater than the units assigned on the task(%2).",
	ROLLUP_RESOURCE_WARNING_CONFIRMATION_MSG = "Do you want to update task resource units to the roll up of subtask resource units?",
	ROLLUP_RESOURCE_INFO_HEADER_MSG = "Automatic roll up of subtask resource units:",
	ROLLUP_RESOURCE_WARNING_HEADER_MSG = "Subtask resource units roll up mismatch:",	


//ROLLUP_DURATION_ALERT_MSG = "Total subtasks duration is greater than task duration. Do you want to update task duration?",

	/*------------------- Header Button Text  -------------------------*/
	CHECK_OUT = "Check Out",
	UNDO_CHECK_OUT = "Undo Checkout",
	SAVE_PROJECT_TEXT = "Save Project",
	SAVE_TEMPLATE_TEXT = "Save As Template",
	SAVE_AS_PROJECT_TEXT = "Save As Project",
	SETTINGS_TEXT = "Settings";
/*--------------Revision History Action Type Strings ----------------*/
var INVALID_ACTION = "Invalid Action",
	AUTO_SAVED_ACTION = "Auto saved",
	SAVED_MANUALLY_ACTION = "Saved manually",
	BUFFER_MANAGEMENT_ACTION = "Buffer Management",
	CHECKED_IN_ACTION = "Checked In",
	CHECKED_OUT_ACTION = "Checked Out",
	IDCC_ACTION = "IDCC",
	REDOCC_ACTION = "RedoCC",
	BUFFER_IMPACT_ACTION = "Checked Buffer Impact",
	UNDO_CHECKOUT_ACTION = "Undo Checked Out",
	RESTORE_REVISION = "Restore this revision";

/*table view tool bar buttons string*/

var TABLE_VIEW_ADD_TASK = 'Add Task',
	TABLE_VIEW_REMOVE_TASK = 'Remove',
	TABLE_VIEW_ADD_SUBTASK = 'Add Subtask',
	TABLE_VIEW_ADD_FULLKIT = 'Add Fullkit',
	TABLE_VIEW_ADD_MILESTONE ='Add Milestone',
	TABLE_VIEW_ADD_CMS ='Add CMS',
	TABLE_VIEW_ADD_PE ='Add PE',
	TABLE_VIEW_ADD_IMS ='Add IMS',
	HIDE_SUMMARY_STRUCTURE='Hide Summary Structure',
	SEARCH = 'Search',
	ENTER_ONLY_NUMERIC_VALUE_STR = "Enter only numeric values. ",
	IS_NOT_NUMBER = " is not a number",
	EXPAND_ALL_SCOPE_ITEMS_TOOLTIP = 'Expand all scope items',
	SNET_TEXT = "SNET",
	Normal = "Normal",
	Sequential = "Sequential",
	PARALLEL = "Parallel",
	WIP = "WIP",
	NEW_SUBTASK_STR = "New Subtask",
	PURCHASING_TEXT = "Purchasing",
	FULLKIT_TEXT = "Full kit",
	SUMMARY_TASK_TYPE = "Summary",
	NO_MATCHED_RECORDS_FOUND = 'No records found matching the search criteria.',
	COLLAPSE_ALL_SCOPE_ITEMS_TOOLTIP = 'Collapse all scope items';
	EXPORT_EXCEL_TOOLTIP = 'Export to Excel';


/*Create new plan screen constants*/
var SELECT_DOT = "Select...",
    SELECT_MANAGER = "Select Manager ..",
    SELECT_DUE_DATE = "Select Due Date ..",
    SELECT_DIVISION_DOT = "Select Division ..",
	SELECT_CUSTOMER = "Select Customer ..",
	SELECT_PORTFOLIO = "Select Portfolio ..",
	SELECT_PARTICIPANTS = "Select Participants ..",
	SELECT_BUSINESSUNIT = "Select Business Unit ..",
	SELECT_SPI_MPP_FILE = "Select SPI or MPP ..",
	SELECT_TEMPLATE = "Select Template ..",
	UPLOAD_MSG = 'Uploading MS Project ..',
	PROJECT_NAME_ERROR = "Incorrect Text: Use only Alphabets(A-Z,a-Z), numbers(0-9) or special characters(-_!@$^&amp;+=~`()[])",
	CREATE_NEW_PROJECT_TITLE = "Create New Project",
	ADD_SELF_PROJECT_PARTICIPANT = 'Add self as Project Participant',
	IMPORT_FIELD_TEXT = 'Import',
	TEMPLATE_FIELD_TEXT = 'Template',
	TEMPLATE_DESCRIPTION_FIELD_TEXT = 'Template_Description',
	SPI_MPP_FILETYPE_ERROR = "Please select valid MPP or SPI file.",	
	COLLAPSE_ALL_SCOPE_ITEMS_TOOLTIP = 'Collapse all scope items',
	DURING_IMPORT = "During Import, ",
	LINK_TYPE_ERROR = "Links of types other than 'Finish-to-Start' are dropped.",
	LINK_LAG_ERROR = " Link Lag set to 0.",
	PROJECT_NAME_EMPTY_TEXT = "Enter Project Name ..",
	REQUIRED_FIELD_MESSAGE = "This is required field";

/* 2nd row toolbar tooltips*/
var CREATE_PE_TOOLTIP = "Create Project End",
	CREATE_CMS_TOOLTIP = "Create CMS",
	CREATE_IMS_TOOLTIP = "Create IMS",
	CREATE_PP_TOOLTIP = "Create Pinch Point",
	CREATE_FK_TOOLTIP = "Create Full Kit",
	CREATE_TASK_TOOLTIP = "Create Task",
	DELETE_TASK_TOOLTIP = "Delete task(s)",
	CUT_TASK_TOOLTIP = "Cut task(s)(Ctrl+X)",
	PASTE_TASK_TOOLTIP = "Paste task(s)",
	COPY_TASK_TOOLTIP = "Copy task(s)(Ctrl+C)",
	UNDO_TOOLTIP = "Undo (Ctrl+Z)",
	REDO_TOOLTIP = "Redo (Ctrl+Y)",
	AUTO_LINKS_DISABLED_TOOLTIP = "Links auto creation disabled",
	AUTO_LINKS_ENABLED_TOOLTIP = "Links auto creation enabled";
/* Subtask header buttons tooltips */
var CUT_SUBTASK_TOOLTIP = "Cut selected subtask(s)",
    COPY_SUBTASK_TOOLTIP = "Copy selected subtask(s) to clipboard",
    PASTE_SUBTASK_TOOLTIP = "Paste subtask(s) from clipboard at end",
    DELETE_SUBTASK_TOOLTIP = "Delete selected subtask(s)";
var SELECT_TASKS_MSG = "Please select task(s)";
/*Phase level Drop down options*/

var REMOVE_MS_PHASE = "Remove milestone Phase",
	REMOVE_FULLKIT = "Remove full-kit";

/*Timeline View Constants */
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
var YES_STR = 'Yes',
	NO_STR = 'No';

/*------------------- Constant related Subtask -------------------------*/
var	WIP_LIMIT_EXCEEDED_TITLE = "WIP Limit Exceeded",
	WIP_LIMIT_EXCEEDED_ALERT_MESG = "Marking this task as IP will exceed the current WIP Limit. Do you want to continue?",
	WIP_LIMIT = "WIP Limit",
	NUMBER_OF_IP_TASKS_EXCEED_WIP_LIMIT = "Number of IP tasks exceed WIP limit" ;


var NA = "NA";
var PROJECT_NAME_READONLY_SUFFIX = " (Read Only)";
var PLEASE_WAIT =' Please Wait...',
	DRAWING_DEPENDENCIES ='Refreshing dependencies.';

/*---------------------- Drag & Drop Constants -------------------------*/
var DRAG_DROP_TEXT = 'Drag and drop to reorganize',
	DRAG_DROP_ERROR_MSG = 'Items cannot be dropped after blank row',
	DRAG_DROP_ERROR_TITLE = 'Drop error';

/*--------------------- Delete, Cut, Copy, Paste Button Texts -----------------*/
var DELETE_BUTTON_TEXT = 'Delete',
	CUT_BUTTON_TEXT = 'Cut',
	COPY_BUTTON_TEXT = 'Copy',
	PASTE_BUTTON_TEXT = 'Paste',
	SET_TASK_PROPERTIES = "Set Task Properties";

var PROJECT_END_STR = "Project End";
var AND_BUFFER_TASKS_STR = ", Buffer tasks";
var BUFFER_TASKS_STR = "Buffer tasks";
var AND_IPMS_TASKS_STR = ", IPMS";
var IPMS_TASKS_STR = "IPMS";
var AND_PEMS_TASKS_STR = ", PEMS";
var PEMS_TASKS_STR = "PEMS";
var COPY_AND_PASTE_OF = "Copy and Paste of ";
var CUT_AND_PASTE_OF = "Cut and Paste of ";
var NOT_ALLOWED = " is not allowed."
var TBD_PLACEHOLDER = "TBD";

var LINK_STR = "Link: ";
var TASK_FROM = "From: ";
var TASK_TO = "To: ";
var DELETE_TASK_LINK = "Delete Task Link";

var CCX_FORMAT = "CCX";
var SPI_FORMAT = "SPI";

var DISABLE_AUTOLINK = "Disable Autolink";
var ENABLE_AUTOLINK = "Enable Autolink";

var COPY_OF_ = "Copy of ";

/*--------------------- Roll up pop over consts -----------------*/

/*----------------phase Validations----------------------*/

var CREATE_GLOBAL_PHASE_FROM_EDIT_GLOBAL_FILE = "No global phases available. Please create phases in Edit Global File to add new phases.",
    NOT_A_GLOBAL_RESOURCE = "Entered phase name is not a global phase. Reverted to old name.";
	
/*----------------phase Validations----------------------*/

var EARLIEST_CHANGE = "Already at earliest change";
var LATEST_CHANGE = "Already at latest change";