stl.view.CreateTaskToolBar = function() {

	this.view = "matrixview";
	this.PEExists = false;
	this.initializeTaskSelectionToolBar();

}


$.extend(stl.view.CreateTaskToolBar.prototype, (function() {

	/*Private Dom manipulator for this view*/
	//Private Dom manipulator for this view
	var DMObject = function() {
		var baseClass =this;

		var classNames ={
			Selected :"selected",
			Disabled : "disabled",
			PEbtn :"PEIcon-btn",
			CMSbtn :"CMSIcon-btn",
			IMSbtn :"IMSIcon-btn",
			FKbtn :"FKIcon-btn",
			//TaskTypeButtonContainer :"create-task-buttons",
			TaskTypeButtonContainer :"page-header-toolbar-center",
			UndoRedoButtonContainer : "page-header-toolbar-undo-redo",
			TaskTypeToolBarImage :"toolbar-img",
			FilterBtn :"filter",
			Timeline_Chain_Switch : "timeline-chain-switch",
			CUTbtn : "CutIcon-btn",
			COPYbtn : "CopyIcon-btn",
			DELETEbtn : "DeleteIcon-btn",
			UNDObtn: "undoicon-btn",
			REDObtn: "redoicon-btn"
		};

		var eventNames = {
			click : "click"
		}	

		var $TaskSelectionToolBar = DOMManipulatorWrapperInstance.getElementsByClsName(classNames.TaskTypeButtonContainer),
			$UndoRedoToolBar = DOMManipulatorWrapperInstance.getElementsByClsName(classNames.UndoRedoButtonContainer),
			$TaskTypeBtns = DOMManipulatorWrapperInstance.findElementsByClsNames($TaskSelectionToolBar, classNames.TaskTypeToolBarImage);

		var	btnClsNameTaskTypeMap = {
				"PEIcon-btn": PE_SHORT,
				"CMSIcon-btn": CMS_SHORT,
				"IMSIcon-btn": IMS_SHORT,
				"FKIcon-btn": TASKTYPE_FULLKIT
			};

		function selectDefaultTaskType() {
			unSelectTaskTypeBtns();
			baseClass.setCurrentSelectedTaskType(STRING_NORMAL);

		};

		function selectTaskTypeButton(btnElement) {
			$(document).trigger("taskMultiSelectEnd");
			unSelectTaskTypeBtns();
			DOMManipulatorWrapperInstance.addClassNameToElement(btnElement, classNames.Selected);
			baseClass.setCurrentSelectedTaskType(getTaskTypeFromBtn(btnElement));
		};

		function unSelectTaskTypeBtns() {
			DOMManipulatorWrapperInstance.removeClassNameFromElement($TaskTypeBtns, classNames.Selected);
			baseClass.setCurrentSelectedTaskType(undefined);
		};

		function addOnClickEventToAllButtons() {
			_.each($TaskTypeBtns, function($TaskTypeButton) {
				DOMManipulatorWrapperInstance.attachEventListner($TaskTypeButton, eventNames.click ,function(evt) {
					selectTaskTypeButton(evt.target);
				});
			});
		};

		function removeOnClickEventFromAllButtons() {
			_.each($TaskTypeBtns, function($TaskTypeButton) {
				DOMManipulatorWrapperInstance.detachEventListner($TaskTypeButton, eventNames.click );
			});
		};

		function addClassOnAllToolBarBtns(clsName) {
			_.each($TaskTypeBtns, function($TaskTypeButton) {
				DOMManipulatorWrapperInstance.addClassNameToElement($TaskTypeButton,clsName);

			});
		};
		function removeClassFromAllToolBarBtns(clsName) {
			_.each($TaskTypeBtns, function($TaskTypeButton) {
				DOMManipulatorWrapperInstance.removeClassNameFromElement($TaskTypeButton,clsName);

			});
		};

		function getTaskTypeFromBtn(btnElement) {
			var btnClsName = _.find(Object.keys(btnClsNameTaskTypeMap), function(key) {
				return DOMManipulatorWrapperInstance.checkElementHasClass(btnElement, key);
			});
			return btnClsNameTaskTypeMap[btnClsName];
		};

		//CON-2012
		function disableBtn(btnName) {
			var $BtnEl=	DOMManipulatorWrapperInstance.getElementsByClsName(btnName);
			DOMManipulatorWrapperInstance.removeClassNameFromElement($BtnEl,classNames.Selected);
			DOMManipulatorWrapperInstance.detachEventListner($BtnEl ,eventNames.click );
			DOMManipulatorWrapperInstance.addClassNameToElement($BtnEl,classNames.Disabled);
		};
		
		function enableBtn(btnName) {
			var $BtnEl=	DOMManipulatorWrapperInstance.getElementsByClsName(btnName);
			if (btnName != classNames.CUTbtn && btnName != classNames.COPYbtn && btnName != classNames.DELETEbtn && 
				btnName != classNames.UNDObtn && btnName != classNames.REDObtn){
				DOMManipulatorWrapperInstance.attachEventListner($BtnEl ,eventNames.click , function(evt) {
					selectTaskTypeButton(evt.target);
				});
			}
			
			DOMManipulatorWrapperInstance.removeClassNameFromElement($BtnEl,classNames.Disabled);

		};

		function disablePEBtn() {
			disableBtn(classNames.PEbtn);
			if(baseClass.getCurrentSelectedTaskType() === PE_SHORT)
				selectDefaultTaskType();

		};

		function enablePEBtn() {
			enableBtn(classNames.PEbtn);
		};

		function disableCMSBtn() {
			disableBtn(classNames.CMSbtn);
		};

		function enableCMSBtn() {
			enableBtn(classNames.CMSbtn);
		};

		function disableIMSBtn() {
			disableBtn(classNames.IMSbtn);
		};

		function enableIMSBtn() {
			enableBtn(classNames.IMSbtn);
		};

		function disableFKBtn() {
			disableBtn(classNames.FKbtn);
		};

		function enableFKBtn() {
			enableBtn(classNames.FKbtn);
		};

		function disableCutBtn() {
			disableBtn(classNames.CUTbtn);
		};

		function enableCutBtn() {
			enableBtn(classNames.CUTbtn);
		};

		function disableCopyBtn() {
			disableBtn(classNames.COPYbtn);
		};
		
		function enableCopyBtn() {
			enableBtn(classNames.COPYbtn);
		};

		function disableDeleteBtn() {
			disableBtn(classNames.DELETEbtn);
		};

		function disableUndoBtn(){
			disableBtn(classNames.UNDObtn);
		};
		function enableUndoBtn(){
			enableBtn(classNames.UNDObtn);
		};
		
		function disableRedoBtn(){
			disableBtn(classNames.REDObtn);
		};
		function enableRedoBtn(){
			enableBtn(classNames.REDObtn);
		};

		function enableDeleteBtn() {
			enableBtn(classNames.DELETEbtn);
		};

		

		function hideToolBarBtns() {
			DOMManipulatorWrapperInstance.hideElement($TaskSelectionToolBar);
		};

		function showToolBarBtns() {
			DOMManipulatorWrapperInstance.showElement($TaskSelectionToolBar);
		};

		function showUndoRedoBtns() {
			DOMManipulatorWrapperInstance.showElement($UndoRedoToolBar);
		};

		function hideUndoRedoBtns() {
			DOMManipulatorWrapperInstance.hideElement($UndoRedoToolBar);
		};

		function showFilterBtn(){
			DOMManipulatorWrapperInstance.showElement(DOMManipulatorWrapperInstance.getElementsByClsName(classNames.FilterBtn));
		};
		function showSwitchBtn(){
			DOMManipulatorWrapperInstance.showElement(DOMManipulatorWrapperInstance.getElementsByClsName(classNames.Timeline_Chain_Switch));
		};
		function hideFilterBtn(){
			DOMManipulatorWrapperInstance.hideElement(DOMManipulatorWrapperInstance.getElementsByClsName(classNames.FilterBtn));
		};
		function hideSwitchBtn(){
			DOMManipulatorWrapperInstance.hideElement(DOMManipulatorWrapperInstance.getElementsByClsName(classNames.Timeline_Chain_Switch));
		};
		return {
			disablePEBtn: disablePEBtn,
			enablePEBtn : enablePEBtn,
			disableCMSBtn: disableCMSBtn,
			enableCMSBtn : enableCMSBtn,
			disableIMSBtn: disableIMSBtn,
			enableIMSBtn : enableIMSBtn,
			disableFKBtn: disableFKBtn,
			enableFKBtn : enableFKBtn,
			enableDeleteBtn : enableDeleteBtn,
			disableDeleteBtn : disableDeleteBtn,
			disableUndoBtn : disableUndoBtn,
			disableRedoBtn : disableRedoBtn,
			enableUndoBtn : enableUndoBtn,
			enableRedoBtn : enableRedoBtn,
			enableCutBtn: enableCutBtn,
			disableCutBtn : disableCutBtn,
			enableCopyBtn: enableCopyBtn,
			disableCopyBtn: disableCopyBtn,
			hideToolBarBtns: hideToolBarBtns,
			showToolBarBtns : showToolBarBtns,
			showUndoRedoBtns : showUndoRedoBtns,
			hideUndoRedoBtns : hideUndoRedoBtns,
			addOnClickEventToAllButtons : addOnClickEventToAllButtons,
			selectDefaultTaskType : selectDefaultTaskType,
			showFilterBtn : showFilterBtn,
			showSwitchBtn : showSwitchBtn,
			hideFilterBtn : hideFilterBtn,
			hideSwitchBtn : hideSwitchBtn
		};
	};



	//Private properties for the class
	var currentSelectedTaskType = STRING_NORMAL;
	var DMObject;

	//getters and setters for private properties
	function getCurrentSelectedTaskType() {
		return currentSelectedTaskType;
	};

	function setCurrentSelectedTaskType(value) {
		currentSelectedTaskType = value;
	};


	function IntializeDOMmanipulatorObject () {
		
			 return DMObject.bind(this)();
			 
	};

	//Private Methods
	function initializeTaskSelectionToolBar() {
		if(typeof(DMObject) === "function")
			DMObject = IntializeDOMmanipulatorObject.bind(this)();
		DMObject.addOnClickEventToAllButtons();
		DMObject.selectDefaultTaskType();
	};
	function onPEAddDelete (isAdd) {
		this.PEExists =isAdd;
		if(isAdd  ) {
			DMObject.disablePEBtn();
		}
		else {
			if(this.view === "matrixview")
				DMObject.enablePEBtn();
			}

	};
	//CON-2012
	function disableAllBtn() {
		DMObject.disablePEBtn();
		DMObject.disableCMSBtn();
		DMObject.disableIMSBtn();
		DMObject.disableFKBtn();
		DMObject.disableCopyBtn();
		DMObject.disableCutBtn();
		DMObject.disableDeleteBtn();
		DMObject.disableUndoBtn();
		DMObject.disableRedoBtn();
	};

	function enableAllBtn() {
		DMObject.enablePEBtn();
		DMObject.enableCMSBtn();
		DMObject.enableIMSBtn();
		DMObject.enableFKBtn();
		DMObject.enableCopyBtn();
		DMObject.enableCutBtn();
		DMObject.enableDeleteBtn();
		DMObject.enableUndoBtn();
		DMObject.enableRedoBtn();
	};
		
	function onViewChange(viewId) {
		switch (viewId) {
			case "timelineview":
				DMObject.hideToolBarBtns();
				DMObject.hideFilterBtn();
				DMObject.showSwitchBtn();
				DMObject.showUndoRedoBtns();
				break;
			case "tableview":
				DMObject.hideToolBarBtns();
				DMObject.hideUndoRedoBtns();
				DMObject.showFilterBtn();
				DMObject.hideSwitchBtn();
				break;
			case "chainview":
				DMObject.hideToolBarBtns();
				DMObject.showFilterBtn();
				DMObject.showSwitchBtn();
				DMObject.showUndoRedoBtns();
				break;
			default:
				DMObject.showToolBarBtns();
				DMObject.showUndoRedoBtns();
				if(this.PEExists)
					DMObject.disablePEBtn();
				else 
					DMObject.enablePEBtn();
				DMObject.hideFilterBtn();
				DMObject.hideSwitchBtn();
				break;
		}

		this.view = viewId;


	};

	function selectDefaultTaskType() {
		DMObject.selectDefaultTaskType();
	}


	//Exposed methods
	return {
		disableAllBtn: disableAllBtn,
		enableAllBtn:enableAllBtn,
		onPEAddDelete: onPEAddDelete,
		onViewChange : onViewChange,
		setCurrentSelectedTaskType : setCurrentSelectedTaskType,
		selectDefaultTaskType : selectDefaultTaskType,
		getCurrentSelectedTaskType: getCurrentSelectedTaskType,
		initializeTaskSelectionToolBar: initializeTaskSelectionToolBar
		
	}

}()));