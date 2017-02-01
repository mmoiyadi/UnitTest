/**********
	This file contains functions to be called to initate Paste from external sources for Matrix View and
	Timeline View (this uses ctrl+v opertaion for paste)
*******/

/*
	This function needs to be called first before calling the handler for ctrl+v. This function attaches the paste Event listener on the window
*/
stl.app.initPasteExternalEvent = function(callbk){
    var me = this;
   stl.app.removePasteEventListener();
   /*
   	This is the paste handler for ctrl+v opertaion
   */
    function pasteHandler(e) {
    	// IE support
        if (!window.Clipboard && !window.ClipboardEvent) {
            var cb = window.clipboardData;
            if (cb) {
                var cbItem = cb.getData("text");
                if(callbk)
                	callbk(processPastedItems(cbItem));
                else
                	setCallbkFunction(e,processPastedItems(cbItem));
                e.preventDefault();
            }
        } 
        //Chrome support
        if (e.clipboardData) {
            // Get the items from the clipboard
            if (e.clipboardData.items && e.clipboardData.items[0].type.indexOf("text") !== -1) {
                var item = e.clipboardData.items[0];
                item.getAsString(function (pastedText) {
                	if(callbk)             	
                    	callbk(processPastedItems(pastedText));
                    else
                    	setCallbkFunction(e,processPastedItems(pastedText));
                }.bind(e));
            } else if (e.clipboardData.types.length > 0) {
                var pastedText = e.clipboardData.getData(e.clipboardData.types[0]);
                if(callbk)
                	callbk(processPastedItems(pastedText));
                else
                	setCallbkFunction(e,processPastedItems(pastedText));
            }
        }
        if (Ext.isGecko) {
            document.designMode = 'Off';
        }
    }
    // Firefox support
    if (Ext.isGecko) {
        document.designMode = 'On';
    }
    stl.app.addPasteEventListener(pasteHandler);
};
/*
Function to be called from other files to remove paste listener after finishing paste operation
*/
stl.app.removePasteEventListener = function(){
	 if (stl.app.handlerPtr != null) {
        window.removeEventListener("paste", stl.app.handlerPtr);
        stl.app.handlerPtr = null;
    }
}
/*
 Internal Function to add paste listener before pressing ctrl+v
*/
stl.app.addPasteEventListener = function(pasteHandler){
	window.addEventListener("paste", pasteHandler);
    stl.app.handlerPtr = pasteHandler;
}
/*
 Utility Function to check if a paste event is already initialized
*/
stl.app.isPasteExternalInitiated = function(){
	if(stl.app.handlerPtr != null)
		return true;
	return false;
}
/*
Function to copy data to Internal clipboard. called from cut/copy handlers in checklist window
*/
stl.app.copyToInternalClipboard = function(data, calledFrom, isCopy){
    stl.app.internalClipboard = data;
    if(isCopy)
        PPI_Notifier.info("Copied items to clipboard, Click Paste button to paste the items", "Copy Success");
    
}
/*
Function to retrieve data from Internal clipboard. called from paste handlers in checklist window
*/
stl.app.pasteFromInternalClipboard = function(){
    if(stl.app.internalClipboard)
        return stl.app.internalClipboard;
}
/******************** Internal Functions **********************************/
/*
Internal function to process pasted items
*/
function processPastedItems(pastedText){
    var pasteItems = pastedText.split('\n');
    if (pasteItems[pasteItems.length - 1] == ',')
        pasteItems.pop();
    return pasteItems;
};
/*
In some cases(like task zoom in last level using the + icon in toolbar) callbk function is not passed.
For these cases we have to determine what callbk function needs to be called from target element where the user clicks ctrl+v
*/
function setCallbkFunction(e,pastedText){
    var $task = $(e.target).closest(".task");
    if($(e.target).parent().hasClass("subtask-name")){
        if($task.length > 0)
            $task.data("view").pasteSubtasksCallbk(pastedText);
    }

};