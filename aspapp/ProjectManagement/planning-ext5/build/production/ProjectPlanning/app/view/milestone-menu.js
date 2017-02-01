stl.view.MilestoneMenu=function(){throw"MilestoneMenu instantiation not supported"};$.extend(stl.view.MilestoneMenu.prototype,(function(){return{bindMilestoneMenu:function(b,c,a){c.data("ms",a);if(a.taskType==="PE"||a.taskType==="CMS"||a.taskType==="IMS"){c.find(".tool-item-view-checklist").on("click",function(d){b.showChecklistPopupForMilestone(a);d.stopPropagation()})}else{c.find(".tool-item-view-checklist").remove()}if(a.taskType==="NONE"){c.find(".tool-item-convert-to-PP").remove()}if(a.taskType==="CMS"){c.find(".tool-item-convert-to-CMS").remove()}if(a.taskType==="IMS"){c.find(".tool-item-convert-to-IMS").remove()}if(a.taskType==="PE"){c.find(".tool-item-convert-to-PE").remove()}c.find(".tool-item-delete-milestone").on("click",stl.view.MilestoneMenu.prototype.onMilestoneMenuDeleteClick.bind(this,a,c));c.find(".tool-item-convert-to-CMS").on("click",stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this,a,CMS_SHORT,a.taskType));c.find(".tool-item-convert-to-IMS").on("click",stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this,a,IMS_SHORT,a.taskType));c.find(".tool-item-convert-to-PE").on("click",stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this,a,PE_SHORT,a.taskType));c.find(".tool-item-convert-to-PP").on("click",stl.view.MilestoneMenu.prototype.changeMilestoneType.bind(this,a,"NONE",a.taskType));if(a.taskType==="PEMS"||a.taskType==="IPMS"){c.find(".tool-item-edit-milestone").addClass("disabled");c.find(".tool-item-convert-to-CMS").remove();c.find(".tool-item-convert-to-IMS").remove();c.find(".tool-item-convert-to-PE").remove();c.find(".tool-item-convert-to-PP").remove()}else{c.find(".tool-item-edit-milestone").on("click",stl.view.MilestoneMenu.prototype.onEditMilestoneClick.bind(this,a))}if(stl.app.isProjectOpenInViewOnlyMode()){c.find(".tool-item-edit-milestone").addClass("disabled");c.find(".tool-item-delete-milestone").addClass("disabled");if(c.find(".tool-item-convert-to-CMS").length>0){c.find(".tool-item-convert-to-CMS").remove()}if(c.find(".tool-item-convert-to-IMS").length>0){c.find(".tool-item-convert-to-IMS").remove()}c.find(".tool-item-convert-to-PE").remove();c.find(".tool-item-convert-to-PP").remove()}if(a.status==="CO"){this.disableMilestoneMenuItem(c,".tool-item-edit-milestone");this.disableMilestoneMenuItem(c,".tool-item-convert-to-CMS");this.disableMilestoneMenuItem(c,".tool-item-convert-to-IMS");this.disableMilestoneMenuItem(c,".tool-item-convert-to-PE");this.disableMilestoneMenuItem(c,".tool-item-convert-to-PP")}stl.view.MilestoneMenu.prototype.bindHighlightHandler(this,c,a)},bindHighlightHandler:function(c,b,a){b.find(".tool-item-highlight-imm-predecessors").on("click",stl.view.MilestoneMenu.prototype.highlightImmpredecessors.bind(c,a));b.find(".tool-item-highlight-all-predecessors").on("click",stl.view.MilestoneMenu.prototype.highlightAllpredecessors.bind(c,a));b.find(".tool-item-highlight-longest-predecessor-chain").on("click",stl.view.MilestoneMenu.prototype.highlightLongestpredecessors.bind(c,a))},highlightImmpredecessors:function(b,a){clearAllHighlight();highlightImmediatePredecessors(b.uid)},highlightAllpredecessors:function(b,a){clearAllHighlight();highlightAllPredecessors(b.uid)},highlightLongestpredecessors:function(b,a){clearAllHighlight();highlightLongestPredecessorChainByUid(b.uid)},disableMilestoneMenuItem:function(b,a){b.find(a).addClass("disabled").off("click")},onMilestoneMenuDeleteClick:function(c,d,b){var a=c.uid;d.trigger("deletemilestone",[a,c])},onEditMilestoneClick:function(b,a){var c=this;Ext.create("Ext.window.Window",{title:"Edit Milestone",xtype:"editMilestoneWindow",height:170,width:290,modal:true,defaults:{anchor:"100%",margin:"5 5 2 5"},layout:"anchor",fieldDefaults:{labelAlign:"left",labelWidth:110},items:[{xtype:"textfield",itemId:"name",fieldLabel:stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_NAME"),allowBlank:false,value:b.name,readOnly:b.taskType=="PE"?true:false},{xtype:"combobox",displayField:"text",itemId:"type",fieldLabel:stl.app.getColumnDisplayName("MILESTONE_PANEL_MILESTONE_TYPE"),store:Ext.create("Ext.data.Store",{fields:["id","text"],data:[{id:PE_SHORT,text:PROJECT_END},{id:CMS_SHORT,text:CONTRACTUAL_MILESTONE},{id:IMS_SHORT,text:INTERNAL_MILESTONE}]}),valueField:"id",selectOnFocus:true,allowBlank:false,value:b.taskType==="NONE"?PINCH_POINT_TITLE:b.taskType},{xtype:"datefield",anchor:"100%",fieldLabel:stl.app.getColumnDisplayName("MILESTONE_PANEL_MS_DUE_DATE"),itemId:"duedate",format:ServerTimeFormat.getExtDateformat(),value:new Date(b.date1),listeners:{render:function(e,f,d){if(b.taskType=="NONE"){this.hide()}}}}],dockedItems:[{xtype:"toolbar",dock:"bottom",ui:"footer",layout:{pack:"end",type:"hbox"},items:[{xtype:"button",width:70,text:"OK",handler:function(f,h,d){var g={uid:b.uid,name:this.ownerCt.ownerCt.getComponent("name").getValue(),type:this.ownerCt.ownerCt.getComponent("type").getValue()===PP_LONG?"NONE":this.ownerCt.ownerCt.getComponent("type").getValue(),taskType:this.ownerCt.ownerCt.getComponent("type").getValue()===PP_LONG?"NONE":this.ownerCt.ownerCt.getComponent("type").getValue(),startDate:b.startDate,endDate:b.endDate,status:b.status,date1:this.ownerCt.ownerCt.getComponent("duedate").getValue(),bufferSize:b.bufferSize};if(b.taskType!=g.type){var i="type"}if(i&&i==="type"){switch(g.type){case CMS_SHORT:c.changeMilestoneType(b,CMS_SHORT,b.taskType);break;case IMS_SHORT:c.changeMilestoneType(b,IMS_SHORT,b.taskType);break;case PE_SHORT:c.changeMilestoneType(b,PE_SHORT,b.taskType);break;case"NONE":c.changeMilestoneType(b,"NONE",b.taskType);break;default:}}else{$(document).trigger("milestoneupdate",[g,i])}if(g.type=="PE"){UpdateProjectEnd(g.date1)}this.ownerCt.ownerCt.close()}},{xtype:"button",width:70,text:"Cancel",listeners:{click:function(f,g,d){this.ownerCt.ownerCt.close()}}}]}]}).show()},changeMilestoneType:function(b,c,e){if(!stl.model.Project.project.validatePEandPPTypeConversion(b,c)){return}b.taskType=c;var d={uid:b.uid,name:b.name,type:c,startDate:b.startDate,endDate:b.endDate,date1:b.date1?b.date1:ServerClientDateClass.getTodaysDate(),status:b.status,bufferSize:""};Ext.getCmp("CCSummarygrid").changeMilestoneNameByChangingType(c===PE_SHORT?"Project End":c,d,d.name,e,function(){stl.app.ProjectDataFromServer.updateMilestone(d,e);$(document).trigger("milestoneupdate",[d,"type",e]);$(document).trigger("taskchange",[this,b]);Ext.getCmp("CCSummarygrid").updateMilestoneSheet(d)});if($(".matrix-view").data("view")){var a=$(".matrix-view").data("view").milestoneElementsById[b.uid];if(stl.model.Project.project.getPhaseById(b.phaseId).type===STRING_MILESTONE_LOWER_CASE){$(a.data("view")).trigger("autolinkallChange",[a,a.find(".ms-autolink input").is(":checked")])}}stl.app.triggerSave()},UpdateProjectEnd:function(a){var b=stl.app.ProjectDataFromServer;b.dueDate=a}}}()));