stl.app.initPasteExternalEvent=function(b){var c=this;stl.app.removePasteEventListener();function a(h){if(!window.Clipboard&&!window.ClipboardEvent){var d=window.clipboardData;if(d){var i=d.getData("text");if(b){b(processPastedItems(i))}else{setCallbkFunction(h,processPastedItems(i))}h.preventDefault()}}if(h.clipboardData){if(h.clipboardData.items&&h.clipboardData.items[0].type.indexOf("text")!==-1){var g=h.clipboardData.items[0];g.getAsString(function(e){if(b){b(processPastedItems(e))}else{setCallbkFunction(h,processPastedItems(e))}}.bind(h))}else{if(h.clipboardData.types.length>0){var f=h.clipboardData.getData(h.clipboardData.types[0]);if(b){b(processPastedItems(f))}else{setCallbkFunction(h,processPastedItems(f))}}}}if(Ext.isGecko){document.designMode="Off"}}if(Ext.isGecko){document.designMode="On"}stl.app.addPasteEventListener(a)};function processPastedItems(a){var b=a.split("\n");if(b[b.length-1]==","){b.pop()}return b}function setCallbkFunction(b,a){var c=$(b.target).closest(".task");if($(b.target).parent().hasClass("subtask-name")){if(c.length>0){c.data("view").pasteSubtasksCallbk(a)}}}stl.app.removePasteEventListener=function(){if(stl.app.handlerPtr!=null){window.removeEventListener("paste",stl.app.handlerPtr);stl.app.handlerPtr=null}};stl.app.addPasteEventListener=function(a){window.addEventListener("paste",a);stl.app.handlerPtr=a};stl.app.isPasteExternalInitiated=function(){if(stl.app.handlerPtr!=null){return true}return false};