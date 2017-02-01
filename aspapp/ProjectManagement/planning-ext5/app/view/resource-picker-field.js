Ext.define('ProjectPlanning.view.field.ResourcePicker', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.resourcepickerfield',
    xtype: 'resourcepickerfield',
    
    afterRender: function() {
        this.callParent(arguments);
         /**
         * Initializes this Field mixin on the current instance. Components using this Ext.form.field.Field mixin should call this method during
         * their own initialization process. - [SOURCE:EXTJS 5.1.1 docs for Ext.form.field.Field]
         */
        this.initField();
        // NOTE this timeout is to wait until Ext has positioned the editor; otherwise we get a totally wrong position
        setTimeout(function() {
            var $fieldBodyEl = $(this.getEl().dom).find(".x-form-item-body");
            this.inputEl = this.getEl();
            this.resourcePicker = new stl.view.ResourcePicker({
                el: $fieldBodyEl,
                val: this.value,
                project: this.project,
                inputModeOnly: (this.inputModeOnly !== false),
                alignPopup: false
            });
            $fieldBodyEl.on("editcomplete", function() {
                this.blur();
                this.fireEvent('blur');
            }.bind(this));
        }.bind(this), 10);
        /*In some cases the isDestroyed flag of this component is getting set to true because of which the 
        dom attribute gets a null value and there is an exception thrown while trying to retieve the value from dom*/
        this.on("beforedestroy",function(cmp,eopts){
            if(window.currentViewId === "matrix")
                return true;
            return false;
        });
    },

    /**
     * Block blur event because we use the resourcepicker popup and need to be able to focus within it
     * without the Editor thinking the edit is complete.  We'll manually complete by firing a blur event
     * when the resourcepicker fires editcomplete.
     */
    onBlur: function(evt) {
        evt.stopEvent();
    },

    getValue: function () {
        if (this.resourcePicker) {
            return this.resourcePicker.getValue();
        }
        return this.value;
    },

    setValue: function (value) {
        this.value = value || [];
        if (this.resourcePicker) {
            this.resourcePicker.setValue(this.value);
        }
    }
});