/*
Dom manipulator wrapper
*/


var DOMManipulatorWrapperInstance = (function() {

	function attachEventListner(element, evtName, fn ) {
		$(element).off(evtName)
			.on(evtName, fn);
	};

	function detachEventListner(element, evtName, fn ) {
		$(element).off(evtName);
			
	};

	function getElementsByClsName(clsName) {
		return $('.' + clsName);

	};
	function getElementsById(id) {
		return $('#' + id);

	};

	function findElementsByClsNames(findInElement,clsName) {
		return $(findInElement).find('.' + clsName);
	};
	function addClassNameToElement(element,clsName) {
		 $(element).addClass( clsName);



	};
	function removeClassNameFromElement(element,clsName) {
		 $(element).removeClass( clsName);



	};

	function checkElementHasClass(element,clsName) {
		return  $(element).hasClass( clsName);

	};

	function getPrevElement(element, clsName) {
		if (clsName)
			return $(element).prev(clsName);
		else
			return $(element).prev();

	};

	function getNextElement(element, clsName){
		if(clsName)
			return $(element).next(clsName);
		else 
			return  $(element).next();

	};

	function hideElement(element) {
		element.hide();
	};
	
	function showElement(element) {
		element.show();
	};

	return {
		getElementsById:getElementsById,
		getElementsByClsName: getElementsByClsName,
		attachEventListner: attachEventListner,
		detachEventListner : detachEventListner,
		findElementsByClsNames : findElementsByClsNames,
		addClassNameToElement : addClassNameToElement,
		removeClassNameFromElement : removeClassNameFromElement,
		checkElementHasClass : checkElementHasClass,
		getNextElement : getNextElement,
		getPrevElement : getPrevElement,
		hideElement : hideElement,
		showElement : showElement
	}
})();