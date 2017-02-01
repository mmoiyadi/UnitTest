﻿
/*-----------Constants used in CC Settings Window-----------*/

var CCCBPC = 0,
CCFBPC = 1,
CMSBPC = 2,
NO_ROUNDING = "0",
ROUND_TO_DAY = "1",
ROUND_TO_QUARTER = "2",
LEAVE_TASKS_IN_PAST_VAL = "0",
PUSH_OUT_PROJECT_DUE_DATE_VAL = "1",
FIELD_LABEL_WIDTH = 220,
FIELD_WIDTH = 280,
CONSUME_FEEDING_BUFFERS_VAL = "2";

/*----------End of - Constants used in CC Settings Window------*/

/*----------Constants used for subtasks-----------------------*/

var TASK_DURATION_DEFAULT = 10,
SUBTASK_DURATION_DEFAULT =1,
HOURS_PER_DAY =8,
TASK_DURATION_DEFAULT_SEC = 10 * HOURS_PER_DAY * 60 * 60,
SUBTASK_DURATION_DEFAULT_SEC =1 * HOURS_PER_DAY * 60 * 60,
ONE_DAY_DURATION_DEFAULT_SEC =1 * HOURS_PER_DAY * 60 * 60,
SECS_PER_HR = 3600 ;
var SubtaskTypesEnum = {
	SEQUENTIAL : 1,
	VOLUME : 2,
	WIP : 3,
	PARALLEL : 4,
	STREAMS: 5
};
var DEFAULT_WIP_LIMIT = 1;

var WIPSubtasktypesConfigKey = "SUBTASK_TYPE_WIP",
SeqentialSubtasktypesConfigKey = "SUBTASK_TYPE_SEQUENTIAL",
StreamsSubtasktypesConfigKey = "SUBTASK_TYPE_STREAM",
ParallelSubtasktypesConfigKey = "SUBTASK_TYPE_PARALLEL";


/*----------End of - Constants used for subtasks----------------*/


/*----------Constants used for highlighting Droddown------------*/

var MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_RESOURCES = 20,
MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_PHASES = 20,
MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_TASK_MANAGERS = 20,
HIGHLIGHT_POPUPS_CSS_CLASS_SELECTOR = [".highlight-chains-popup", ".highlight-resources-popup", ".highlight-phases-popup", ".highlight-task-managers-popup"],
MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_CHAINS = 20;

/*----------End of Constants used for highlighting Droddown------*/


/*----------Project Status Constants------------*/

var PLANNED_TYPE = 0,
IN_PROCESS_TYPE = 2,
COMPLETE_TYPE = 8,
CIQ_TYPE = 16,
ON_HOLD_TYPE = 32,
VAR_CAP_WITHOUT_MPP_FILE = -2,
IN_PLAN_TYPE = 64;

/*----------End of Project Status Constants------*/

/*----------Plan Replan Mode Constants------------*/

var PLAN = 1,
REPLAN = 2;

/*----------End of Plan Replan Mode Constants------*/

/*----------FK Task Percent Completion Constants------------*/

var FALLBACK_TASKCOMPLETION_FROM_CO_TO_IP_RL = 99;

/*----------End ofFK Task Percent Completion Constants------------*/

var STRING_SEPARATOR = ",";
var COLON_SEPARATOR = ":";
var HYPHEN_SEPARATOR = "-";

var DURATION_MILISEC_MULTIPLIER = 60*1000; 
var AUTOSAVE_DURATION_MILISEC = 2*60*1000; 
var DEFAULT_REVISIONLIST_COUNT =15;

var SPACE_CONST = ' ',
EMPTY_STRING = "",
PERIOD_CONSTANT = ".",
TRUE_CONSTANT = "True",
FALSE_CONSTANT = "False",
NA_STRING = "NA",
STRING_NORMAL = "normal",

TASK_DURATION_DEFAULT_STR = "10 days",
SUBTASK_DURATION_DEFAULT_STR = "1 day",
ZERO_DURATION_STR = "0 day",

PROJECT_STATUS_IN_PLAN = "In Plan",
PROJECT_STATUS_IN_PLAN_INTEGER = 64,
PROJECT_TYPE_PPI_TEMPLATE = "Template",
PROJECT_TYPE_PPI = "SPI",

FULL_KIT = "fullkit",
FK_SHORT = "FK",
PE_SHORT = "PE",
CMS_SHORT = "CMS",
PP_SHORT = "PP",

 IMS_SHORT ="IMS",
PEMS_SHORT ="PEMS",
IPMS_SHORT ="IPMS",

PP_LONG = "Pinch Point",
TASKTYPE_FULLKIT = "fullkit",
TASKTYPE_BUFFER = "buffer",
TASKTYPE_PT = "purchasing",
TASKTYPE_SNET = "snet",

BUFFER_TYPE_CCFB = "CCFB",
BUFFER_TYPE_CCCB = "CCCB",
BUFFER_TYPE_CMSB = "CMSB",

NEW_RESOURCE_ = "New Resource "
TIME_BUFFER_LOWERCASE = "time_buffer",

ZERO_DURATION_REGEX = /^0$|^0{1,}[dh\s]/,
REMOVE_TRAILING_COMMASPACE = /, +$/gm,


KEYPRESS = "keypress",
MSIE = 'Microsoft Internet Explorer',

STATUS_IP = 'IP',
STATUS_CO = 'CO',
STATUS_NS = 'NS',
STATUS_RL = 'RL',

//SEQUENTIAL = "1",
//VOLUME = "2",
//WIP = "3",
//RESOURCE = "4",
INVALID_DATE = "Invalid Date";




/*-------------------Call back method names---------------------*/
var GET_CONFIG_SETTINGS = "Get Config Settings",
GET_RESX_STRINGS = "Get Resx strings",
IDCC = "Identify CC",
CHECKIN_PROJECT = "Check-In",
CHECKOUT = "Check-Out",
VIEW_PROJECT = "View Project",
VIEW_DEBUFFERED_PROJECT = "View Debuffered Project",
CHECK_BUFFER_IMPACT = "Check Buffer Impact",
REDO_CC = "Redo CC",
GET_REVISION_HISTORY = "Get Revision History",
GET_REVISION = "Get Revision",
UNDO_CHECKOUT = "Undo Check-Out",
BUFFER_MANAGEMENT = "Buffer Management",
GET_PROJECT_LIST = "Get Project List",
GET_VIRTUAL_RESOURCES_FOR_ALL_PROJECTS = "Get Virtual Resources For All Projects",
LOAD_JSON_DATA ="Load Json Blob Data";
DOWNLOAD_DEBUFFERED_PLAN = "Download debuffered plan";

/*--------------End of Call back method names----------------*/

/*-------------------Config keys---------------------*/
var NUMBER_OF_REVISIONS='NUMBER_OF_REVISIONS';

var STRING_NONE_PASCSAL_CASE = "None";
var STRING_NONE_UPPER_CASE = "NONE";
var STRING_MILESTONE_LOWER_CASE = "milestone";

/*------------Error Codes----------*/
var SERVER_ERROR_CODE = "2";
var SERVER_RESPONSE_RETURN_TYPE_CODES ={
	FAILURE : 0,
    SUCCESS : 1,
    SYSTEM_ADMINISTRATOR_ERROR : 2,
    SESSION_TIMED_OUT : 3
};
var SHOW_SERVER_ERRORS_IN ={
	TOASTR:1,
	ERROR_PANEL:2
}

var MSG_TYPES ={
	ERROR:1,
	WARNING:2,
	INFO:3
}


/*------------Add Row/Child insert type----------*/
var INSERT_ROW_ABOVE = 1,
    INSERT_ROW_BELOW = 2,
    ADD_CHILD = 3;

/*------------Indentation type----------*/
 var INDENT_ROW = 1,
 OUTDENT_ROW = 2;

/*------------View Name----------*/
var PERT_VIEW = "matrix-view-btn",
TIMELINE_VIEW = "timeline-view-btn",
TABLE_VIEW = "table-view-btn";
CHAIN_VIEW = "chain-view-btn";

/*-----------------Task View Constants----------*/
var INSERT_TASK_BEFORE_TIMELINE_VIEW= 'TimelineView';




/*------------Highlight constant---------------*/
//var NONE = 0,

/*View Ids*/

var TABLE_VIEW_ID = "table",
TIMELINE_VIEW_ID = "timeline",
MATRIX_VIEW_ID = "matrix",
CHAIN_VIEW_ID = "chainview";
/*ID constants*/
var CHECKLIST_IMG = "checklistImg";


var BUFFER_HORIZONTAL = 200;
var BUFFER_VERTICAL = 200;

var DOWNLOAD_TYPE_SPI = "SPI";
var DOWNLOAD_TYPE_CCX = "CCX";

/*------------------links View css class constants--------------*/
var LINK_CLS = 'link';
var MILESTONE_LINK_CLS = 'milestone-link';
var Z_INDEX_LINK_CLS = 'link-z-index';
var LINK_MILESTONE_LINK_CLS = 'link milestone-link';


var ESC_KEY = 27;
var C_KEY = 67;
var X_KEY = 88;
var Z_KEY = 90; // UNDO
var Y_KEY = 89; // REDO

var UndoStackTypesEnum = {
	TaskStack : 1,
	ProjectStack : 2
};

var UndoStackEventName = {
	TaskAdd: "taskadd",
	TaskDelete: "taskremove",
	MilestoneAdd: "milestoneadd",
	MilestoneDelete: "milestoneremove"
};

var NOT_SAME = "NOT_SAME";

