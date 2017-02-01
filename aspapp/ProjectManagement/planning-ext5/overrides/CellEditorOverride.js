Ext.override(Ext.grid.CellEditor, {
    checkDocumentClick: function (event) {
        // Registering for this event is pretty cheap, but this contains() call can be expensive, so
        // we'll have to watch for performance issues.
        var editor
        if (this.editing) {
            if (this.field.getEl() && !this.field.getEl().contains(event.target)) {

                // We're editing, and the click was not on this field directly.  However, the user could have
                // clicked on the popup swatches used for selecting colors.  So let's also see if the click was
                // within the bounds of this component.
                var fieldBox = this.field.getBox();
                var clickPoint = event.getXY();
                if ((fieldBox.x > clickPoint[0]) ||
                     (fieldBox.y > clickPoint[1]) ||
                     (fieldBox.x + fieldBox.width < clickPoint[0]) ||
                     (fieldBox.y + fieldBox.height < clickPoint[1])
                     ) {
                    // The click is outside of the bounds of this component too, so we should close the
                    // hovering CellEditor.
                    //this.completeEdit();
                }
            }
        }
    },
    onRender: function () {
        this.callParent();
        this.mon(Ext.getDoc(), 'mousedown', this.checkDocumentClick, this);
    }
});
