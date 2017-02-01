﻿<%@ Page Language="VB" AutoEventWireup="false" CodeFile="index.aspx.vb" Inherits="ProjectManagement_ProjectPlanning_index" %>

<!DOCTYPE html>

<html >
<head runat="server">
    <title><%#UIUtility.GetConwebGlobalResourceObject("Concerto_Project_Planning_Interface")%></title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="shortcut icon" href="concerto.ico" />
    <script id="microloader" type="text/javascript" src="bootstrap.js"></script>

    <script type="text/javascript" >
        // ToString("r") - We are using this standard date-time format for all PPI dates.
        var serverTodayDate = "<%#DateTime.Now.ToUniversalTime().ToString("r") %>";
        var serverTimeformat = "<%#UIUtility.GetServerDateFormat()%>";
        var ReDirectUrl = "<%#HTTPUtilities.GetApplicationPath("default.aspx?timedout=1")%>";
        var logOffUrl = "<%#HTTPUtilities.GetApplicationPath("thankyou.aspx")%>";
        var HandlerUrl = "<%#HTTPUtilities.GetApplicationPath("Include/GetSessionValue.ashx")%>";

        DefaultSessionTimeout = "<%#Session.TimeOut%>";
        function checkNameTextLength(field){
            if(field.innerText.length > 255)
            {
               return false;
            }
        }
    </script>
   
    <script id="revision-history-template" type="text/x-handlebars-template">
            {{#each revisions}}
                <div class="revision-history-tile">
                    <div class="revision-history-img action-name" >
                        {{#if isBM}}
                            <img id="action-image" src="./resources/images/system-revision-history.png" title="{{ActionString}}"/>   
                        {{else}}
                            <img id="action-image" src="./resources/images/user.png" title="{{ActionString}}"/>   
                        {{/if}}
                    </div>
                    <div class="revision-info">
                            <div class="user-name"> {{UserId}}</div>
                            <div class="time-stamp"> {{Timestamp}}</div>
                   </div>
                   <div class="revision-history-img restore"  id="revision-history-{{RevisionId}}">
                        <img src="./resources/images/refresh.png" title="{{restoreRevsionTooltip}}"  />
                    </div>                
                </div>
            {{/each}}
    </script> 
    <script id="conweb-pop-over-template" type="text/x-handlebars-template">
    <div id="conweb-pop-over" class= "conweb-pop-over-base-cls">
         <div class="arrow float-left">
         </div> 
         <div class="popover-outer-content float-left">
            <div class="inner-content">
                {{#if isHeaderInfoPresent}}
                    <span>{{popoverInnerContentHeader}}</span>
                {{/if}}
                <ul>
                    {{#each messages}}
                        <li>{{this}}</li>
                    {{/each}}
                </ul>
                {{#if isWarning}}
                    <span>{{confirmationMessage}}</span>
                {{/if}}
            </div>
            <div class="popover-btn-grp btn-group  float-right" role="group">
			{{#if isWarning}}
               <button type="button"  id='popoverOkBtn' class=" button btn popover-btn ok-btn" ><b>{{okButtonText}}</b></button>
			{{/if}}
               <button type="button" id='popoverCancelBtn' class="button btn popover-btn cancel-btn"  ><b>{{cancelButtonText}}</b></button>
            </div>
         </div>

     </div>
     </script>

<!--Handlebar Template for Task-->
<script id="task-hbs-template-task-bar" type="text/x-handlebars-template">
    <div class="{{templateProperties.taskClass}}" data-linkable-element-name="{{name}}" id="{{uid}}" data-qtip="{{name}}">
        <div class="add-task-plus-icon"></div>
        <div class="task-name-overflow-edit" contenteditable="true" onkeydown="checkNameTextLength(this)" onkeypress="return (this.innerText.length < 255)"></div>
        <div class="task-content-wrapper" style="{{templateProperties.taskContentWrapperStyle}}">
            <div class="task-color" style="{{templateProperties.taskColorStyle}}"></div>
            <div class="remaining-subtasks-indicator" style="{{templateProperties.remainingSubtasksIndicatorStyle}}">
                {{remainingSubtasks}}</div>
            <div class="task-name">
                <div class="drag-drop-handle"></div>
                {{#if templateProperties.hasName}}
                <input class="task-name-input" type="text" value="{{name}}" maxlength="255" /> {{else}}
                <input class="task-name-input" type="text" value="" maxlength="255" /> {{/if}}
                <div class="task-controls">
                    <div class="task-magnify-button"></div>
                </div>
                {{#if templateProperties.isFK}}
                <div class="fullkit-name">FK</div>
                {{/if}}
            </div>
        </div>
        <div class="task-header-arrow"></div>
        {{#if templateProperties.isFK}}
        <div class="fullkit-color" style="{{templateProperties.fkColorStyle}}"></div>
        {{/if}}
    </div>
</script>
<script id="task-hbs-template-properties-subtasks" type="text/x-handlebars-template">
    <div class="task-properties">
        <div class="task-dates">
            <label id="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION">{{staticValues.SPI_COLUMNS_AND_LABELS_REMAINING_DURATION}}:</label>
            <input type="text" class="task-duration" value="{{templateProperties.taskDurationVal}}">
            <div class="conweb-icon duration-field info-help-icon" style="display:none;"></div>
            <div class="conweb-icon duration-field warning-help-icon" style="display:none;"></div>
        </div>
        <div class="task-checklist-icon {{templateProperties.taskChecklistIconCls}}"></div>
        {{#if templateProperties.isFK}}
        <div class="task-needDate">
            <div class="needDate">
                <label id="FK_PANEL_NEED_DATE">{{staticValues.FK_PANEL_NEED_DATE}}:</label>
                <input type="text" value="{{templateProperties.fkNeedDateVal}}" disabled>
            </div>
        </div>
        {{/if}}
        <div class="task-expectedFinishDate">
            <div class="expectedFinishDate">
                <label id="SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE">{{staticValues.SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE}}:</label>
                <input type="text" value="{{templateProperties.taskExpectedFinishDateVal}}">
            </div>
        </div>
        {{#if templateProperties.isFK}}
        <div class="fk-pullInFullKitDateBy">
            <label id="FK_PANEL_PULL_IN_OFFSET">{{staticValues.FK_PANEL_PULL_IN_OFFSET}}:</label>
            <div class="pullInFullKitDateBy">
                <input type="text" value="{{templateProperties.fkPullInFullKitDateByVal}}">
            </div>
        </div>
        {{/if}}
        <div class="task-resources">
            <label id="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST}}:</label>
            <span class="input-field resource-picker {{templateProperties.emptyReourcePickerCls}} {{templateProperties.readOnlyCls}}">{{templateProperties.assignedResourcesVal}}
            </span>
            <div class="conweb-icon resource-field info-help-icon" style="display:none;"></div>
            <div class="conweb-icon resource-field warning-help-icon" style="display:none;"></div>
            </div>
        <div class="task-status">
            <label id="SPI_COLUMNS_AND_LABELS_TASK_STATUS">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_STATUS}}:</label>
            <select>
                <option id="NotStartedFilterName" value="NS">{{staticValues.NotStartedFilterName}}</option>
                {{#unless templateProperties.isZeroDurationTask}}
                <option id="InProgressFilterName" value="IP">{{staticValues.InProgressFilterName}}</option>
                {{/unless}} {{#if templateProperties.isFK}}
                <option id="ReleasedFilterName" value="RL">{{staticValues.ReleasedFilterName}}</option>
                {{/if}}
                <option id="CompletedFilterName" value="CO">{{staticValues.CompletedFilterName}}</option>
            </select>
        </div>
        <div class="task-manager">
            <label id="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID}}:</label>
            <input type="text" value=""> </input>
        </div>
        <div class="task-participants">
            <label id="SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES">{{staticValues.SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES}}:</label>
            <input type="text" value="" />
        </div>
        <div class="task-type">
            <label id="SPI_COLUMNS_AND_LABELS_TASK_TYPE">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_TYPE}}:</label>
            <select>
                <option id="NORMAL_Key" value="normal">{{staticValues.NORMAL_Key}}</option>
                <option id="PURCHASING_Key" value="purchasing">{{staticValues.PURCHASING_Key}}</option>
                <option id="SNET_Key" value="snet">{{staticValues.SNET_Key}}</option>
            </select>
        </div>
        <div class="task-specific-properties task-specific-properties-snet" style="{{templateProperties.taskSpecificPropertiesSnetStyle}}">
            <div class="snet">
                <label id="SPI_COLUMNS_AND_LABELS_SNET_DATE">{{staticValues.SPI_COLUMNS_AND_LABELS_SNET_DATE}}:</label>
                <input placeholder="Select Date...">
            </div>
        </div>
        {{#if templateProperties.isFK}}
        <div class="fk-autolink">
            <div class"autolinkBtn" class="btn">{{staticValues.AUTOLINK_Key}}</div>
            
        </div>
        {{/if}}
    </div>
    <div class="subtasks" style="{{templateProperties.subtasksBlockStyle}}">
        <div class="subtasks-header">
            <div style="width:auto;"><input style="width:auto;" type="checkbox" name="subtask-header-checkbox"></div>
            <div class="subtask-header-status"></div>
            <div title="{{toolTips.CREATE_SUBTASK_STREAM_TOOLTIP}}" class="subtask-header-createStream-icon"></div>
            <div title="{{toolTips.DELETE_SUBTASK_STREAM_TOOLTIP}}" class="subtask-header-deleteStream-icon"></div>
            <div title="{{toolTips.CUT_SUBTASK_TOOLTIP}}" class="subtask-header-cut"></div>
            <div title="{{toolTips.COPY_SUBTASK_TOOLTIP}}" class="subtask-header-copy"></div>
            <div title="{{toolTips.PASTE_SUBTASK_TOOLTIP}}" class="subtask-header-paste"></div>
            <div title="{{toolTips.DELETE_SUBTASK_TOOLTIP}}" class="subtask-header-delete"></div>
            <div title="{{toolTips.UNDO_TOOLTIP}}" class="subtask-header-undo"></div>
            <div title="{{toolTips.REDO_TOOLTIP}}" class="subtask-header-redo"></div>
            <div class="subtask-header-name"></div>
            <div class="subtask-header-checklist-icon"></div>
            <div class="subtask-header-duration">
                <label id="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION">{{staticValues.SPI_COLUMNS_AND_LABELS_REMAINING_DURATION}}</label>
            </div>
            <div class="subtask-header-resources">
                <label id="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST}}</label>
            </div>
            <div class="subtask-header-owner">
                <label id="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID">{{staticValues.SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID}}</label>
            </div>
        </div>
        <ul class="sortable list">
            {{#templateSubtasks}}
            <li class="subtask subtask-status-{{status}}">
                <div style="width:auto;"><input style="width:auto;" type="checkbox" name="subtask-checkbox"></div>
                <div class="subtask-add"></div>
                <div class="subtask-status"></div>
                <div class="subtask-name editable-field">
                    <textarea value="{{name}}" title="{{name}}" style="{{subtaskNameStyle}}">{{name}}</textarea>
                </div>
                <div class="subtask-checklist-icon {{subtaskChecklistIconCls}}"></div>
                <div class="subtask-duration editable-field">
                    <input type="text" value="{{subtaskDurationVal}}">
                </div>
                <div class="subtask-resources {{resourcePickerCls}} {{emptyReourcePickerCls}}">{{subtaskResourcesVal}}</div>
                <div class="subtask-owner editable-field sl-editable-resource {{emptyManagerCls}}">{{manager}}</div>
            </li>
            {{/templateSubtasks}}
            <li class="subtask proto-subtask">
                <div style="width:auto;"><input style="width:auto;" type="checkbox" name="subtask-checkbox"></div>
                <div class="subtask-add"></div>
                <div class="subtask-status"></div>
                <div class="subtask-name editable-field">
                    <textarea maxlength="255" value="" placeholder="{{staticValues.Subtask_PlaceHolder_Key}}"></textarea>
                </div>
                <div class="subtask-checklist-icon"></div>
                <div class="subtask-duration editable-field">
                    <input type="text" value="">
                </div>
                <div class="subtask-resources"></div>
                <div class="subtask-owner editable-field sl-editable-resource"></div>
            </li>
            <li class="proto-separator">
                <div class="separator action-items">
                    <input style="width:auto;" type="checkbox" class="subtask-stream-checkbox" name="subtask-stream-checkbox">
                    <div title="" class="stream-header-expand"></div>
                </div>
                <div class="separator stream-name">
                    <textarea maxlength="255" value="" class="streamName"></textarea>
                </div>
                <div class="separator">
                    
                </div>
				<div class="separator">

                </div>
                <div class="separator handler"></div>
                <div class="separator">
                   
                </div>
                <div class="separator"></div>
                <div class="separator">
                    <div title="{{toolTips.MOVE_STREAM_UP_TOOLTIP}}" class="stream-header-singlemoveup"></div>
                    <div title="{{toolTips.MOVE_STREAM_DOWN_TOOLTIP}}" class="stream-header-singlemovedown"></div>
                    <button title="" type="button" class="stream-header-extension-menu"></button>
                </div>
            </li>
        </ul>
    </div>
    <div class="task-footer">
        <div class="task-id">
            <label id="task-id-label">{{staticValues.SPI_COLUMNS_AND_LABELS_MSP_TASK_ID}}:</label>
            <label id="task-id-value" value="{{id}}">{{id}}</label>
        </div>
        <div class="subtask-type" style="{{templateProperties.subtaskTypeStyle}}">
            
            <select id='task-subtask-type-select'>
                <option id="SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL" value="1">{{staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL}}
                </option>
                <option id="SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL" value="4">{{staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL}}</option>
                <option id="SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP" value="3">{{staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP}}</option>
                <option id="SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_STREAMS" value="5">Streams</option>
            </select>
            <input id="task-wip-limt-txt" type="text" class="WIP_Limit_textbox" value="{{templateProperties.stWipLimitVal}}" style="{{templateProperties.stWipLimitStyle}}" placeholder="{{WIP_LIMIT_Key}}" maxlength="5">
            <label class="Stream-rate-label" style="display:none;">Release Quantity: </label>
            <input id = 'task-stream-rate-txt' type="text" class="STREAM_RATE_textbox" style="display:none;" data-placeholder-key="WIP_LIMIT_Key" maxlength="4" style="width:25px"/>
            <label class="Stream-offset-label" style="display:none;">Frequency: </label>
            <input id = 'task-stream-offset-txt' type="text" class="STREAM_OFFSET_textbox" style="display:none;" style="width:25px"/>
            <img id="imgWIPExceeded" class="imgWIP" src="./resources/images/exclamation.gif" style="{{templateProperties.imgWIPExceededStyle}}" title="{{imgWIPExceededTitle}}">
        </div>
        <div class="rollUp-Btn-group btn-group" role="group">
            <button id="RollUp_Button_Key" class="roll-up-task-button button btn popover-btn cancel-btn">{{staticValues.RollUp_Button_Key}}</button>
        </div>
		<div id="Delete_Task_Key"   class="delete-task-button">{{staticValues.Delete_Task_Key}}</div>
        <div id="OK_BUTTON_Key"  class="ok-task-button">{{staticValues.OK_BUTTON_Key}}</div>
    </div>                
</script>

</head>
<body runat="server" >
   <!-- elements used to keep session alive issue in PPI-->
    <form id="form_SessionAlive">
        <input type="hidden" id="defaultSessionTimeout" name="defaultSessionTimeout" value=""/>
        <div id='div_iframe'></div>
    </form>


    <div id="fade" style="display: none;"></div>
    <div id="modal" style="display: none;">
            <img id="loader" src="./resources/images/loading-animation2.gif" />
    </div>
    <div id="templates" style="display: none">
        <div class="page-header-top">
            <div class="page-header-center">
               <!--  <span>Project Name:</span> -->
                <span class="title"><b></b></span>
            </div>
            <div class="page-header-right">
             <div class="revisionHistoryImg toolbar-img">
                        </div>
                <div class="settings">
                    <div class="btn-group setting-group">
                        <div id="calendar-button" class="requires-write calendarIcon">
                            <img class="requires-write calendarIcon"src="./resources/images/Calendar.png"/>
                        </div>
                        <div id="settings-button" class="requires-write">
                            <img class="requires-write "src="./resources/images/settings.png"/>
                        </div>
                    </div>
                </div>
                <div class="btn-group input-group" role="group">
                    <button id="checkin" data-resx-key = "CHECKIN_Key" class="checkin-btn btn button-text">Check-In</button>
                    <div id="checkindropdown" class="btn dropdown-caret">
                        <img src="./resources/images/arrow.png"/></div>
                    <div class="tool-popup checkin-popup"></div> 
                    <button id="checkout" data-resx-key = "Checkout_Key" class="checkout-btn btn button-text">Check-Out</button>
                    <button id="download" data-resx-key = "Download_Key" class="download-btn btn button-text">Download</button>
                    <div id="downloaddropdown" class="btn dropdown-caret requires-write">
                        <img src="./resources/images/arrow.png"/></div>
                    <div class="tool-popup download-popup"></div>
                    <button id="save"  data-resx-key = "Save_Key" class="save-btn btn button-text requires-write">Save   </button>
                    <div id="savedropdown" class="btn dropdown-caret requires-write">
                        <img src="./resources/images/arrow.png"/></div>
                    <div class="tool-popup save-popup"></div> 
                    <div class="tool-popup contextMenu-popup"></div>
                    <div class="tool-popup extensionMenu-popup"></div>  
                </div>
                <div class="help">
                    <div class="btn-group">
                        <a target="_blank" href="help.html"><div id="help-button">
                            <img class="requires-write "src="./resources/images/help.png"/>
                        </div></a>
                    </div>
                </div>
            </div>
            <div id='page-header-notifier' class="page-header-notifier">
                <span></span>
            </div>
        </div>
        <div class="page-header">
            <div class="page-header-toolbar-top">
                <div class="view-selector">
                    <div class="view-selector-buttons btn-group" role="group" aria-label="Plan">
                        <button class="matrix-view-btn btn btn-primary"></button>
                        <button class="timeline-view-btn btn"></button>
                        <button class="table-view-btn btn"></button>
                    </div>
                </div>
                <div class="highlight btn-group">
                        <button data-resx-key = "HIGHLIGHT_Key" class="btn button-text">Highlight:</button>
                        <div class="btn dropdown-caret"><img src="./resources/images/arrow.png"/></div>
                        <div class="tool-popup highlight-popup"></div>
                        <!-- <div class="tool-popup highlight-resources-popup"></div> -->
                </div>
                <div class="planningmode-selector-buttons btn-group" role="group" aria-label="Plan">
                        <button id="planMode" data-resx-key = "PLAN_Key" class="plan-mode-btn btn active btn-primary">Plan</button>
                        <button id="replanMode" data-resx-key = "REPLAN_Key" class="replan-mode-btn btn">Replan</button>
                </div>
                
                
                <div class="plan-buttons btn-group" role="group" aria-label="Plan">
                    <button id="identifyCC" data-resx-key = "IDENTIFYCC_Key"  class="button btn requires-write">Identify CC</button>
                    <button id="ccSummary" data-resx-key = "CCSUMMARY_Key" class="button btn disabled" disabled>CC Summary</button>
                    <!--button id="acceptPlan" data-resx-key = "ACCEPTPLAN_Key" class="button btn disabled requires-write" disabled>Accept Plan</button-->
                </div>
                <div class="replan-buttons btn-group" role="group" aria-label="Replan" style="display:none;">
                    <!--<button id="checkBufferImpact" class="button btn requires-write">Buffer Impact</button>-->
                    <button id="redoCCFB" data-resx-key = "REDOCC_Key" class="button btn requires-write" >Redo CC</button>
                    <button id="bufferSummary"  data-resx-key = "BUFFERSUMMARY_Key" class="button btn disabled" disabled>Buffer Summary</button>
                </div>
                <div class="btn-group" role="group" aria-label="AcceptPlan">
                    <button id="acceptPlan" data-resx-key = "ACCEPTPLAN_Key" class="button btn disabled requires-write" disabled>Accept Plan</button>
                </div>
                <div class="remove-buffers btn-group " role="group"  aria-label="RemoveBuffers">
                    <button id="undoCCAB"  class="remove-buffers-btn  btn disabled requires-write" disabled></button>
                    <!-- <button id="undoCCAB" data-resx-key = "REMOVEBUFFERS_Key" class="remove-buffers-btn button btn disabled requires-write" disabled></button> -->
                  <!--  <div id="undoCCAB"  class="button  disabled requires-write RBIcon-btn toolbar-img" disabled></div> -->
                </div>
                <div class="filter btn-group">
                        <button class="filter-options-btn btn button"></button>
                </div>  
               
        </div>  

         <div class="page-header-toolbar-center">
            <!-- <div class="page-header-toolbar-separator" ></div> -->
                    <div class="create-task-buttons" role="group" aria-label="CreateTaskTypes">
                            <div class="PEIcon-btn toolbar-img ">
                            </div>
                            <!-- <div class="PPIcon-btn toolbar-img ">
                            </div> -->
                            <div class="CMSIcon-btn toolbar-img ">
                            </div>
                            <div class="IMSIcon-btn toolbar-img ">
                            </div>
                            <div class="FKIcon-btn toolbar-img  ">
                           <!--  </div>
                             <div class="normalTaskIcon-btn toolbar-img  selected"> -->
                            </div>
                            
                            <div id="CutButtonToolBar" class="CutIcon-btn toolbar-img ">
                            </div>
                            <div id="CopyButtonToolBar" class="CopyIcon-btn toolbar-img ">
                            </div>
                            <div id="DeleteButtonToolBar" class="DeleteIcon-btn toolbar-img ">
                            </div>
                            
                    </div> 
        </div> 
        <div class="page-header-toolbar-undo-redo">
            <!-- <div class="page-header-toolbar-separator" ></div> -->
                    <div class="undo-redo-buttons" role="group" aria-label="CreateTaskTypes">
                            <div id = "UndoButtonToolBar" class="undoicon-btn toolbar-img">
                            </div>
                            <div id = "RedoButtonToolBar" class="redoicon-btn toolbar-img">
                            </div>
                            
                    </div> 
                    </div>        
            

            <div class="page-header-toolbar-right">
                <div class="view-controls btn-group">
                    <div class="timeline-chain-switch"><label class="switch">
                        <input class="switch-input" type="checkbox" />
                        <span class="switch-label" data-off="All Tasks" data-on="Chain View"></span> 
                        <span class="switch-handle"></span> 
                    </label></div>

                    <div class="show-hide-panels">
                        <div class="milestoneSheet toolbar-img">
                        </div>
                        <div class="errorWarningSheet toolbar-img">
                        </div>
                        <div class="resourceSheet toolbar-img">
                        </div>
                        <div class="toggle-links-button toolbar-img pressed">
                        </div>
                        <div class="toggle-auto-links-button  toolbar-img ">
                        </div>
                       
                    </div>
                    <div class="zoom-controls">
                        <div class="zoom-button zoom-out">
                            <div class="zoom-icon toolbar-img"></div>
                        </div>
                        <div class="zoom-button zoom-in">
                            <div class="zoom-icon toolbar-img"></div>
                        </div>
                    </div>
                    <div class="matrix-view-task-alignment">
                        <div class="task-align-left task-align-option toolbar-img pressed" data-alignment="left"></div>
                        <div class="task-align-right task-align-option toolbar-img" data-alignment="right"></div>
                    </div>
                </div>
                <div style="clear: both;"></div>
            </div>
        </div>

        <div class="matrix-view" data-zoom-level="2" role="matrix-view-template">
        </div>

        <div class="matrix-view-inner" role="matrix-view-inner-template">
            <div class="matrix-view-row header-row">
                <div class="phase-column phase-column-header">
                    <div class="phase-column-header-inner">
                        <span class="phase-name"></span>
                        <div class="dropdown-menu-caret">&or;</div>
                        <div class="tool-popup below align-right">
                            <div data-resx-key  = "INSERTPHASEBEFORE_Key" data-cmd="insert-phase-before" class="tool-item tool-item-insert-phase-before">Insert phase before</div>
                            <div data-resx-key  = "INSERTPHASEAFTER_Key" data-cmd="insert-phase-after" class="tool-item tool-hidden-for-fullkit">Insert phase after</div>
                            <div data-resx-key  = "INSERTMILESTONEAFTER_Key" data-cmd="insert-milestone-after" class="tool-item tool-item-insert-milestone-after tool-hidden-for-milestone tool-hidden-for-fullkit">Insert milestone after</div>
                            <div data-resx-key  = "INSERTFULLKITBEFORE_Key" data-cmd="insert-fullkit-before" class="tool-item tool-item-insert-fullkit-before tool-hidden-for-milestone tool-hidden-for-fullkit">Insert full-kit before</div>
                            <div data-resx-key  = "DELETEPHASE_Key" data-cmd="delete-phase" class="tool-item tool-item-delete-phase">Remove phase</div>
                            <div data-resx-key  = "PHASELEVELTASKPROPERTIES_Key" data-cmd="phase-level-task-properties" class="tool-item tool-item-phase-task-properties">Set task properties</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="matrix-view-end-marker"></div>
        </div>

        <div class="matrix-view-row" role="row-template">
            <!--div class="tree-column">
                <!-- <div class="tree-icon"></div> -->
                <!--div class="scope-item-label"></div>
                <div class="dropdown-menu-caret">&or;</div>
                <div class="tool-popup below align-right">                
                    <div data-resx-key = "INSERTROWABOVE_Key" data-cmd="insert-row-above" class="tool-item tool-item-insert-row-above">Insert row above</div>
                    <div data-resx-key = "INSERTROWBELOW_key" data-cmd="insert-row-below" class="tool-item tool-item-insert-row-below">Insert row below</div>
                    <div data-resx-key = "DELETEROW_Key" data-cmd="delete-row" class="tool-item tool-item-delete-row">Remove row</div>
                </div>
            </div-->
            <div class="phase-column hidden-title" role="phase-column-cell">
                <div class="task-placeholder"></div>
            </div>
        </div>

        <div class="task" role="task-template">
            <div class="add-task-plus-icon"></div>
            <div class="task-name-overflow-edit" contenteditable="true" onkeydown="checkNameTextLength(this)" onkeypress="return (this.innerText.length < 255)"></div>
            <div class="task-content-wrapper">
                <div class="task-color"></div>
                <div class="remaining-subtasks-indicator"></div>
                <div class="task-name">
                    <div class="date-range-indicator"></div>
                    <div class="drag-drop-handle"></div>
                    <!--<div class="status-indicator status-indicator-NS"></div>
                    <div class="status-indicator status-indicator-IP"></div>
                    <div class="status-indicator status-indicator-RL"></div>
                    <div class="status-indicator status-indicator-CO"></div>-->                   
                    <input type="text" value="" maxlength="255" readonly/>
                    <div class="task-controls">
                        <div class="task-magnify-button"></div>
                    </div>
                </div>
                <div class="task-properties">
                    <div class="task-dates">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION">
                        </label> 
                        <input type="text" class="task-duration" value=""/>
                        <div class="conweb-icon duration-field info-help-icon" style="display:none;"></div>
                        <div class="conweb-icon duration-field warning-help-icon" style="display:none;"></div>
                    </div>
                    <div class="task-checklist-icon"></div>
                    <div class="task-needDate" >
                        <div class="needDate">
                            <label data-columns-key ="FK_PANEL_NEED_DATE">
                        </label> 
                            <input type="text" disabled="disabled" value=""/>
                        </div>
                    </div>
                    <div class="task-expectedFinishDate" >
                        <div class="expectedFinishDate">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE">
                        </label>
                            <input type="text"  value=""/>
                        </div>
                    </div>
                    <div class="fk-pullInFullKitDateBy" >
                         <label data-columns-key ="FK_PANEL_PULL_IN_OFFSET">
                        </label>
                        <div class="pullInFullKitDateBy">
                            <input type="text"  value=""/>
                        </div>
                    </div>
                    <div class="task-resources">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST"></label> 
                        <span class="input-field"></span>
                        <div class="conweb-icon resource-field info-help-icon" style="display:none;"></div>
                        <div class="conweb-icon resource-field warning-help-icon" style="display:none;"></div>
                    </div>
                    <div class="task-status">
                       <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_STATUS"></label> 
                            <select>
                                <option  data-filtername-key = "NotStartedFilterName"  value="NS">Not started</option>
                                <option  data-filtername-key = "InProgressFilterName"  value="IP">In progress</option>
                                <option  data-filtername-key = "ReleasedFilterName"     value="RL">Released</option>
                                <option  data-filtername-key = "CompletedFilterName"    value="CO">Completed</option> 
                            </select>
                       
                    </div>
                    <div class="task-manager">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID"></label> 
                        <input type="text" value=""> </input>
                    </div>
                    <div class="task-participants">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES"></label>
                        <input type="text" value="" />
                    </div>
                    
                    <div class="task-type">
                        <label data-columns-key ='SPI_COLUMNS_AND_LABELS_TASK_TYPE'></label>
                        <select>
                            <option data-resx-key = "NORMAL_Key"        value="normal">Normal</option>
                            <option data-resx-key = "PURCHASING_Key"    value="purchasing">Purchasing</option>
                            <option data-resx-key = "SNET_Key"          value="snet">SNET</option>
                           <!--  <option data-resx-key = "IMS_TITLE_Key"     value="IMS">IMS</option> -->
                        </select>
                    </div>
                    <div class="task-specific-properties task-specific-properties-snet">
                        <div class="snet">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_SNET_DATE"></label> 
                            <input placeholder="Select Date..."></input>
                        </div>
                    </div>
                    
                    <div class="fk-autolink">
                        <div class"autolinkBtn" data-resx-key ="AUTOLINK_Key" class="btn"></div> 
                    </div>
                    <span class="extended-properties-trigger">&or;</span>
                </div>
                <div class="subtasks">
                    <div class="subtasks-header">
                        <div style="width:auto;"><input style="width:auto;" type="checkbox" name="subtask-header-checkbox"></div>
                        <!--div class="subtask-header-delete-subtask"></div-->
                        <div class="subtask-header-status"></div>
                        <!--  <div class="drag-handle"></div> -->
                        <div class="subtask-header-createStream-icon" style="display: inline-block"></div>
                        <div class="subtask-header-deleteStream-icon" style="display: inline-block"></div>
                        <div class="subtask-header-cut"></div>
                        <div class="subtask-header-copy"></div>
                        <div class="subtask-header-paste"></div>
                        <div class="subtask-header-delete"></div>
                        <div class="subtask-header-name"></div>
                        <div class="subtask-header-checklist-icon"></div>
                        
                        <div class="subtask-header-duration">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION" data-add-colon='false'></label>
                        </div>
                        <div class="subtask-header-resources">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST" data-add-colon='false'></label>
                        </div>
                        <div class="subtask-header-owner">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID" data-add-colon='false'></label>
                        </div>
                        <!-- <div class="subtask-header-participants">Participants</div> -->
                    </div>
                    <ul class="sortable list">
                        <li class="subtask proto-subtask" data-role="subtask-template">
                            <div style="width:auto;"><input style="width:auto;" type="checkbox" name="subtask-checkbox"></div>
                            <div class="subtask-add"></div>
                            <!--div class="delete-subtask" >X</div-->
                            <div class="subtask-status"></div>
                            <!--  <div class="drag-handle"></div> -->
                            <div class="subtask-name editable-field"><textarea data-placeholder-key="Subtask_PlaceHolder_Key" value="" maxlength="255"></textarea>
                            </div>
                            <!-- <div class="subtask-checklist-icon"><img src="./resources/images/checklistnone.gif"/></div> -->
                            <div class="subtask-checklist-icon"></div>
                            <div class="subtask-duration editable-field"><input type="text" value="" /></div>
                            <div class="subtask-resources"></div>
                            <div class="subtask-owner editable-field sl-editable-resource"></div>
                          
                        </li>
                        <li class="proto-separator">
                            <div class="separator action-items">
                                <input style="width:auto;" type="checkbox" class="subtask-stream-checkbox" name="subtask-stream-checkbox">
                                <div title="" class="stream-header-expand"></div>
                            </div>
                            <div class="separator stream-name">
                                <textarea maxlength="255" value="" class="streamName"></textarea>
                            </div>
                            <div class="separator">
                            </div>
                            <div class="separator">
                                
                            </div>
                            <div class="separator handler"></div>
                            <div class="separator">
                               
                            </div>
                            <div class="separator"></div>
                            <div class="separator">
                                <div title="" class="stream-header-singlemoveup"></div>
                                <div title="" class="stream-header-singlemovedown"></div>
                                <button title="" type="button" class="stream-header-extension-menu" value="..."></button>
                            </div>
                        </li>
                        
                    </ul>
                    
                </div>
                <div class="task-footer">
                    <div class="task-id" >
                         <label id='task-id-label' data-columns-key ="SPI_COLUMNS_AND_LABELS_MSP_TASK_ID"></label>
                        <label id='task-id-value' value =""></label>
                    </div>

                    <div class="WIP_Limit_Div" style="display:none;">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION"></label>
                        <input type="text" class="WIP_Limit_textbox" value="" maxlength="5"/>

                    </div>

                    <div class="subtask-type">
                        
                        <select id = 'task-subtask-type-select'>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL" data-add-colon='false' value="1">Sequential</option>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL" data-add-colon='false' value="4">Parallel</option>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP" data-add-colon='false' value="3">WIP</option>
                            <option  data-add-colon='false' value="5">Streams</option>
                        </select>
                        <input id = 'task-wip-limt-txt' type="text" class="WIP_Limit_textbox" style="display:none;" data-placeholder-key="WIP_LIMIT_Key" maxlength="5" />
                        <label class="Stream-rate-label" style="display:none;">Release Quantity: </label>
                        <input id = 'task-stream-rate-txt' type="text" class="STREAM_RATE_textbox" style="display:none;" data-placeholder-key="WIP_LIMIT_Key" style="width:25px" maxlength="4" />
                        <label class="Stream-offset-label" style="display:none;">Frequency: </label>
                        <input id = 'task-stream-offset-txt' type="text" class="STREAM_OFFSET_textbox" style="display:none;"  style="width:25px"/>
                        <img id="imgWIPExceeded" class="imgWIP" src="./resources/images/exclamation.gif" style="display:none;" /> 
                    </div>
                    <!-- 
                        Subtasks Types not being used
                        <div class="subtask-specific-property subtask-specific-property-volume">
                            <label data-resx-key ="Rate:"></label> 
                            <input class="volume" type="text" placeholder="enter rate" />
                        </div>
                        <div class="subtask-specific-property subtask-specific-property-wip">
                             <label data-resx-key ="Wip Limit:"></label> 
                              <input class="wip-limit" type="text" placeholder="enter wip limit" />
                        </div>
                        <div class="subtask-specific-property subtask-specific-property-resource">
                            <label data-resx-key ="unit:"></label> 
                             <input class="wip-limit" type="text" placeholder="enter units" />
                        </div>

                    -->
                    <div class="rollUp-Btn-group btn-group" role="group">
                        <button data-resx-key="RollUp_Button_Key" class="roll-up-task-button button btn popover-btn cancel-btn">Roll up</button>
                    </div>
                    <div data-resx-key = "Delete_Task_Key" class="btn delete-task-button">Delete</div>
                    <div data-resx-key = "OK_BUTTON_Key" class="btn ok-task-button">OK</div>
                </div>
            </div>
            <!-- <div class="task-header-arrow-border"></div> -->
            <div class="task-header-arrow"></div>
            <div class="tool-popup below">
                <div data-cmd="delete-fullkitTask"      data-resx-key = "DELETE_FULLKIT_Key" 
                class="tool-item tool-item-delete-milestone">Delete Fullkit</div>
                <div data-cmd="edit-fullkit-checklist"  data-resx-key = "EDIT_CHECKLIST_Key" 
                class="tool-item tool-item-edit-milestone">Edit Checklist</div>
                <div data-cmd="highlight-immediate-predecessors-for-fullkit" data-resx-key = "HIGHLIGHT_IMMEDIATE_PREDECESSOR_Key" class="tool-item tool-item-highlight-predecessors">Immediate Predecessor</div>
                <div data-cmd="highlight-all-predecessors-for-fullkit"  data-resx-key = "HIGHLIGHT_ALL_PREDECESSORS_Key" 
                class="tool-item tool-item-highlight-predecessors">All Predecessors</div>
                <div data-cmd="highlight-longest-predecessor-chain-for-fullkit"                                                        data-resx-key = "HIGHLIGHT_LONGEST_PREDECESSOR_CHAIN_key" 
                class="tool-item tool-item-highlight-longest-predecessor-chain">Longest Predecessor Chain</div>
            </div>
        </div>
          <div class="milestone ms" role="ms-template">
              <div class="add-task-plus-icon"></div> 
              <div class="ms-content-wrap">  
                    <div class="ms-icon">
                    <div class="milestone-icon-wrap">
                        <div class="milestone-icon"></div>
                        </div>
                        <div class="milestone-name"></div>
                        <div class="milestone-color" ></div>
                    </div>
                    
                    <div class="task-name-overflow-edit" contenteditable="true" onkeydown="checkNameTextLength(this)" onkeypress="return (this.innerText.length < 255)"></div>
                    <div class="task-content-wrapper" style="display: none">
                    <div class="milestone-quick-edit-color"></div>
                    <div class="task-name">
                        <div class="date-range-indicator"></div>
                        <div class="drag-drop-handle"></div>
                        <!--<div class="status-indicator status-indicator-NS"></div>
                        <div class="status-indicator status-indicator-IP"></div>
                        <div class="status-indicator status-indicator-CO"></div>-->
                        <input type="text" value="" maxlength="255"/>
                    </div>
                    <div class="task-properties">
                        <div class="task-type">
                            <label data-columns-key ="MILESTONE_PANEL_MILESTONE_TYPE"></label> 
                                <select>
                                    <option data-resx-key = "CMS_TITLE_Key"  value="CMS">CMS</option>
                                    <option data-resx-key = "IMS_TITLE_Key"  value="IMS">IMS</option>
                                    <option data-resx-key = "PE_TITLE_Key"  value="PE">PE</option>
                                    <!-- <option data-resx-key = "PP_TITLE_Key"  value="NONE">PP</option> -->
                                </select>
                            
                        </div>
                        <div class="task-checklist-icon"></div>
                        <div class="task-dates">
                            <div class="duedate">
                                 <label data-columns-key ="MILESTONE_PANEL_MS_DUE_DATE"></label> 
                                <input type="text" value=""/>
                            </div>
                        </div>
                    
                        <div class="task-status">
                            <label>Status: 
                                <select>
                                    <option value="NS">Not started</option>
                                    <option value="CO">Completed</option>
                                </select>
                            </label>
                        </div>
                        <div class="task-manager">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID"></label> 
                        <input type="text" value=""> </input>
                    </div>
                        <div class="ms-autolink">
                            <div class"autolinkBtn" data-resx-key ="AUTOLINK_Key" class="btn"></div>
                        </div>
                    
                    
                    </div>
                    <div class="task-footer">
                        <div class="task-id" >
                            <label id='task-id-label' data-columns-key ="SPI_COLUMNS_AND_LABELS_MSP_TASK_ID"></label>
                                <label id='task-id-value' value =""></label>
                        </div>
                    
                        <div data-resx-key = "Delete_Task_Key" class="btn delete-task-button">Delete</div>
                        <div data-resx-key = "OK_BUTTON_Key" class="btn ok-task-button">OK</div>
                    </div>
                    <div class="task-header-arrow"></div>
                </div>
            </div>
            
        </div>

        <div class="milestone" role="milestone-template">
            <div class="milestone-icon-wrap">
                <div class="milestone-icon"></div>
            </div>
            <div class="milestone-color" ></div>



            <div class="milestone-name"></div>
            <div class="tool-popup below">
                <div data-cmd="delete-milestone"    data-resx-key = "REMOVE_MILESTONE_Key" 
                class="tool-item tool-item-delete-milestone">Remove Milestone</div>
                <div data-cmd="edit-milestone"      data-resx-key = "EDIT_MILESTONE_Key" 
                class="tool-item tool-item-edit-milestone">Edit Milestone</div>
                <div data-cmd="view-checklist"      data-resx-key = "VIEW_CHECKLIST_Key" 
                class="tool-item tool-item-view-checklist">View Checklist</div>
                <div data-cmd="convert-to-CMS"      data-resx-key = "CHANGE_TO_CMS_Key" 
                class="tool-item tool-item-convert-to-CMS">Change to CMS</div>
                <div data-cmd="convert-to-IMS"      data-resx-key = "CHANGE_TO_IMS_key" 
                class="tool-item tool-item-convert-to-IMS">Change to IMS</div>
                <div data-cmd="convert-to-PE"      data-resx-key = "CHANGE_TO_PE_Key" 
                class="tool-item tool-item-convert-to-PE">Change to PE</div>
               <!--  <div data-cmd="convert-to-PP"       data-resx-key = "CHANGE_TO_PP_Key"
                class="tool-item tool-item-convert-to-PP">Change to PP</div> -->
                <div data-cmd="highlight-immediate-predecessors"    data-resx-key = "HIGHLIGHT_IMMEDIATE_PREDECESSOR_Key" 
                class="tool-item tool-item-highlight-imm-predecessors">Highlight Immediate Predecessor</div>
                <div data-cmd="highlight-all-predecessors"          data-resx-key = "HIGHLIGHT_ALL_PREDECESSORS_Key" 
                class="tool-item tool-item-highlight-all-predecessors">Highlight All Predecessors</div>
                <div data-cmd="highlight-milestone-longest-predecessor-chain" data-resx-key = "HIGHLIGHT_LONGEST_PREDECESSOR_CHAIN_key"
                class="tool-item tool-item-highlight-milestone-longest-predecessor-chain">Highlight Longest Predecessor Chain</div>
                <div data-cmd="highlight-all-chains" data-resx-key = "HIGHLIGHT_ALL_CHAIN_key""
                class="tool-item tool-item-highlight-all-chains">Highlight All Chains</div>
            </div>
        </div>

    </div>
    <div class="revision-history-parent-panel" style="display:none">
        <div  class="revision-history-heading">
                <Label data-resx-key = "REVISION_HISTORY_Key"> Revision History </Label>
                <div class="revision-history-close" >
                    x
                </div>

                
        </div>
        <div class="revision-history-content"></div>

        <div class="revision-history-footer">
            <div class="revision-history-less-detailed" data-resx-key = "SHOW_MORE_DETAILED_VERSIONS_Key">Show more detailed versions</div>
        </div>
        </div>
    </div>

    <iframe id="download_iframe" style="display:none;"/>
</body>
</html>