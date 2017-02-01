

stl.app.UndoItem =  function  (action, data) {
	this.data = data;
	this.action = action;
}

stl.app.ActionItem =  function (undo, redo){
	this.undo = undo;
	this.redo = redo;
	
}

/**
 * UndoStack:
 * Easy undo-redo in JavaScript.
 **/
stl.app.initUndoStack = function(undoStack){
	undoStack.undostack = [];
	undoStack.redostack = [];
	undoStack.currentUndo = -1;
	undoStack.currentRedo = -1;
}

stl.app.undoStack = function (cfg) {
	stl.app.initUndoStack(this);
}



/**
 * UndoStack#push (action, data);
 * redo()  -> Function which performs redo based on previous state
 * undo() -> Function which performs undo based on current state
 * data -> Argument passed to undo/redo functions
 **/

 $.extend(stl.app.undoStack.prototype, (function () {
 		 return ({
        push: function (action, data) {
           
			// We need to invalidate all undo items after this new one
			// or people are going to be very confused.
			//this.stack.splice(this.current);
			this.undostack.push(new stl.app.UndoItem(action, data));
			this.currentUndo = this.undostack.length - 1;
        },
        undo: function () {
			var item;
			if (this.currentUndo >= 0) {
				item = this.undostack[this.currentUndo];
				if(item.action.undo(item.data)){
					this.undostack.splice(this.currentUndo, 1);
					this.currentUndo = this.undostack.length - 1;
					this.redostack.push(item);
					this.currentRedo = this.redostack.length - 1;
				}
				
			} else {
				PPI_Notifier.error(EARLIEST_CHANGE);
			}
		},
		redo: function () {
			var item;
			if (this.currentRedo >= 0) {
				item = this.redostack[this.currentRedo];
				if (item) {
					if(item.action.redo(item.data)){
						this.redostack.splice(this.currentRedo, 1);
						this.currentRedo = this.redostack.length - 1;
						this.undostack.push(item);
						this.currentUndo = this.undostack.length - 1;
					}					
				} 
			}
			else {
					PPI_Notifier.error(LATEST_CHANGE);
			}
		},
		invalidateAll: function () {
				stl.app.initUndoStack(this);
		}
	});
})());
