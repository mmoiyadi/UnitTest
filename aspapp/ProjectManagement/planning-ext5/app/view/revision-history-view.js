//Revision History View



stl.view.RevisionHistory = function(cfg) {
    var defaults = {
    	revisionHistoryParentPanel:$('.revision-history-parent-panel'),
		revisionHistoryContentPanel:$('.revision-history-content'),
    	template:$("#revision-history-template"),
    	revisionHistoryList:{},
    	filteredRevisionHistoryList : {},
    	completeRevisionHistoryList : {},
        readOnly: false,
        visible:false,
        projectUid:null, 
        defaultCountInList:stl.app.commonSettingValue(NUMBER_OF_REVISIONS) || DEFAULT_REVISIONLIST_COUNT,
        curentCountInList:stl.app.commonSettingValue(NUMBER_OF_REVISIONS) || DEFAULT_REVISIONLIST_COUNT,
        filterActionTypes:[1],
        isShowLessDetailActive:true,
        lastRestoredVersion:1,
        fixedRevisionCount:true
    };

    $.extend(this, defaults, cfg);
};


$.extend(stl.view.RevisionHistory.prototype, (function () {
		//Private Members
		var templateRevisionHistory ;
		var RevisionTypeActionStringMap = {};
		


	return({

		init: function(){
			//this.projectUid = projectUid;
			RevisionTypeActionStringMap = {
			//Action 				
			0:{key:"Invalid_Action", value: INVALID_ACTION},
			1:{key:"Auto_Save",value: AUTO_SAVED_ACTION },		
			2:{key:"Save",value:  SAVED_MANUALLY_ACTION },			
			3:{key:"BM",value: BUFFER_MANAGEMENT_ACTION},		
			4:{key:"Check_In",value: CHECKED_IN_ACTION},
			5:{key:"Check_Out",value: CHECKED_OUT_ACTION},			
			6:{key:"IDCC",value: IDCC_ACTION},
			7:{key:"Redocc",value: REDOCC_ACTION},
			8:{key:"Buffer_Impact",value: BUFFER_IMPACT_ACTION},
			9:{key:"Undo_CheckOut",value: UNDO_CHECKOUT_ACTION},
		};
			//Freeze the obj to make it a complete ENUM
			Object.freeze(RevisionTypeActionStringMap);
			var templateSource   = this.template.html();
    	 	templateRevisionHistory = Handlebars.compile(templateSource); 
    	 	this.getRevisionListFromServerIntializePanel(this.projectUid,false);
		},
		appendItemsRevisionHistoryPanel: function(revisionList){
			this.revisionHistoryList.revisions =revisionList;
			this.revisionHistoryContentPanel.append(templateRevisionHistory(this.revisionHistoryList));
		},

		reloadItemsRevisionHistoryPanel: function(revisionList){
			this.revisionHistoryList.revisions =revisionList;
			this.revisionHistoryContentPanel.empty().append(templateRevisionHistory(this.revisionHistoryList));
		},
		refreshRevisionHistory: function(toggle){
			var me = this;
			me.getRevisionListFromServerIntializePanel(me.projectUid,toggle);
			
		},

		showRevisionHistoryPanel: function() {
				this.revisionHistoryParentPanel.show();
				this.visible=true;
				if(! $(".revisionHistoryImg").hasClass("pressed"))
					$(".revisionHistoryImg").addClass("pressed");
		},

		hideRevisionHistoryPanel: function() {
				this.revisionHistoryParentPanel.hide();
				this.visible=false;
				$(".revisionHistoryImg").removeClass("pressed");
		},

		toggleRevisionHistoryPanel: function() {
				if(this.visible){
					this.hideRevisionHistoryPanel();					
				}
				else{
					this.showRevisionHistoryPanel();
				}
		},

		toggleDetailLevel: function(evt) {
			var $btnToggleDetail =$(evt.target);
			this.fixedRevisionCount = false;
			if($btnToggleDetail.html() === SHOW_MORE_DETAILED_VERSIONS) {
				$btnToggleDetail.html(SHOW_LESS_DETAILED_VERSIONS);
				this.isShowLessDetailActive =false;
				this.loadRevisionListInContentPanel(this.completeRevisionHistoryList,true);
			}
			else {
				$btnToggleDetail.html(SHOW_MORE_DETAILED_VERSIONS);
				this.isShowLessDetailActive =true;
				this.loadRevisionListInContentPanel(this.filteredRevisionHistoryList,true);

			}
		},


		wireParentPanelEvents: function() {
			this.revisionHistoryParentPanel.find('.revision-history-close').off("click").on("click",this.toggleRevisionHistoryPanel.bind(this));
			this.revisionHistoryParentPanel.find('.revision-history-less-detailed').off("click").on("click",this.toggleDetailLevel.bind(this));
			//MM: removed the event handler for show more since we have removed it from UI.
			this.revisionHistoryParentPanel.find('.restore').off("click").on("click",this.refreshRevisionHistory.bind(this));
		},

		wireContentPanelEvents: function(){
			this.revisionHistoryContentPanel.find('.revision-history-img.restore > img').on("click",this.restoreRevision.bind(this));
		},

		
		getRevisionListFromServerIntializePanel: function(projectId,toggle){
			var me = this;
			LoadProjectRevisionList(projectId, function(response){
				var loadSuccessful = showErrorsAndWarnings(response,GET_REVISION_HISTORY);
				if(loadSuccessful ) {
					me.parseResponseList(response);
					me.initializeRevisionPanel();
					if(toggle){
						me.toggleRevisionHistoryPanel(); 
					}
				}
			});
		},

		getRevisionAsPerDetailFlag: function() {
			if(this.isShowLessDetailActive)
				return this.filteredRevisionHistoryList;
			else
				return this.completeRevisionHistoryList;

		},

		initializeRevisionPanel: function() {
			var revisionListToshow = this.getRevisionAsPerDetailFlag();
			this.loadRevisionListInContentPanel(revisionListToshow,true);
			this.wireParentPanelEvents();
			
		},

		loadRevisionListInContentPanel: function(parsedRevsionList,reload) {
			
			if(reload) { //empty and add

				var revisionListToshow = this.fixedRevisionCount ? this.extractItemsFromRevisonList(parsedRevsionList,0,this.defaultCountInList) : parsedRevsionList;
				this.reloadItemsRevisionHistoryPanel(revisionListToshow);
				this.curentCountInList = revisionListToshow.length;
				var $restoredRevision = this.revisionHistoryContentPanel.find("#revision-history-"+ this.lastRestoredVersion).closest(".revision-history-tile");
				this.highlightRestoredVersion($restoredRevision );
			}	
			else { //append
				var endIndex = this.curentCountInList + this.defaultCountInList,
					startIndex =this.curentCountInList,
					revisionListToAppend = this.extractItemsFromRevisonList(parsedRevsionList,
					startIndex,endIndex);
				this.appendItemsRevisionHistoryPanel(revisionListToAppend);
				this.curentCountInList += revisionListToAppend.length;
			}
			
			this.wireContentPanelEvents();  //Wires just Restore events in each revsion tile
			this.OnReadOnly();
		},

		restoreRevision: function(evt){
			var revisionId = $(evt.target).closest('.revision-history-img.restore').attr("id").substring(17); //id="revision-history-{{RevisionId}}"
			var $revision = $(evt.target).closest(".revision-history-tile");
			this.getRevision(this.projectUid,revisionId,$revision);
			this.lastRestoredVersion =revisionId;
		},

		
		

		highlightRestoredVersion: function($revision){
			this.revisionHistoryContentPanel.find(".revision-history-tile").removeClass("selected");
			$revision.addClass("selected");

		},

		getRevision: function(projectId,revisionId,$restoredRevision){
			var me = this;
			LoadProjectRevision(projectId,revisionId, function(response){
				var loadSuccessful = showErrorsAndWarnings(response,GET_REVISION);
				if(loadSuccessful ) {
					//stl.app.loadProjectJson(response,me.readOnly);
                    $(document).trigger("projectjsonchange", [response, me.readOnly /*readonly*/, false]);
					me.highlightRestoredVersion($restoredRevision);
				}
			});
		},

		parseResponseList: function(rawRevisionList) {
			var parsedRevsionList = JSON.parse(rawRevisionList, function(k,v) {
				if( k === "Timestamp") {
					return ServerTimeFormat.getRevisionHistoryFormat(v);
				}
				else
					return v;
			});
			var reformatedRevisionList = parsedRevsionList.map(function(currentElement) {
				
				currentElement.restoreRevsionTooltip = RESTORE_REVISION;
				currentElement.ActionString = RevisionTypeActionStringMap[currentElement.Type].value;
				currentElement.isBM = false;
				if(currentElement.Type === 3){
					currentElement.UserId = BUFFER_MANAGEMENT;
					currentElement.isBM = true;
				}
				return currentElement;
			});

			this.completeRevisionHistoryList = reformatedRevisionList;
			this.filteredRevisionHistoryList = this.filterRevisionListOnType(reformatedRevisionList);
			  
		},
		
		//Filter  items from Complete list
		filterRevisionListOnType: function(revisionList) {
			var me  = this;
			var filteredList = revisionList.filter(function(revisionItem){
				if(me.filterActionTypes.indexOf(revisionItem.Type) === -1){
					return revisionItem;
				}
			});
			return filteredList;
		},

		//Extract no of items from complete list
		extractItemsFromRevisonList: function(masterRevsionList, startIndex, endIndex) {
			var extractedList =masterRevsionList.slice(startIndex,endIndex);
			return extractedList;
		},
		// MM: The below method is currently not being used since 'Show More' has been removed from UI
		//  We may need it later when show more need to be implemented via scroll
		showMoreItems: function(evt) {
			var me = this;
			if(me.isShowLessDetailActive)
				me.loadRevisionListInContentPanel(me.filteredRevisionHistoryList,false)
			else
				me.loadRevisionListInContentPanel(me.completeRevisionHistoryList,false)

		},
		toggleRefreshRevsionHistoryPanel: function() {
			if(!this.visible){
             	this.refreshRevisionHistory(true); 
            }
            else
            {
            	this.toggleRevisionHistoryPanel();
            }

		},
		callBackAfterSave: function() {
            this.refreshRevisionHistory(false); 
            

		},

		OnReadOnly: function() {
			if(this.readOnly)
			  this.revisionHistoryContentPanel.find('.revision-history-img.restore').hide();
			else 
				this.revisionHistoryContentPanel.find('.revision-history-img.restore').show();
		}



	});
}() ));




