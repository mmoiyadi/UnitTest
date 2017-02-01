/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.TreeCellEditing
@extends Ext.grid.plugin.CellEditing

A specialized "cell editing" plugin (ptype = 'scheduler_treecellediting'), purposed to correctly work with trees. Add it to your component (scheduler with tree view or gantt)
as usual grid plugin:

    var gantt = Ext.create('Gnt.panel.Gantt', {

        plugins             : [
            Ext.create('Sch.plugin.TreeCellEditing', {
                clicksToEdit: 1
            })
        ],
        ...
    })

This class allows us to do 'complex data editing', which is not supported by the regular CellEditing plugin or the Ext.grid.CellEditor which
 assumes a column is always tied to a single field existing on the grid store model (which is not the case for Gantt, dependencies, assignments etc).
*/
Ext.define('Sch.plugin.TreeCellEditing', {
    extend              : 'Ext.grid.plugin.CellEditing',
    alias               : 'plugin.scheduler_treecellediting',

    lockableScope       : 'locked',

    editorsStarted      : 0,

    init : function (pnl) {
        this._grid      = pnl;

        // This is used to prevent editing of readonly cells
        this.on('beforeedit', this.onMyBeforeEdit, this);

        this.callParent(arguments);
    },


    showEditor : function (ed) {
        var me      = this,
            field   = ed.field;

        if (!ed._cancelEdit) {
            ed._cancelEdit  = ed.cancelEdit;
            ed.cancelEdit   = me.myCancelEdit;
        }

        if (field.setSuppressTaskUpdate) field.setSuppressTaskUpdate(true);
        this.callParent(arguments);
        if (field.setSuppressTaskUpdate) field.setSuppressTaskUpdate(false);
    },

    /*
     * Checks if panel is not locked for editing, and prevents cell edits if needed
     */
    checkReadOnly : function() {
        var pnl = this._grid;

        if (!(pnl instanceof Sch.panel.TimelineTreePanel)) {
            pnl = pnl.up('tablepanel');
        }
        return !pnl.isReadOnly();
    },

    // @OVERRIDE - model set() method, since we need to do more than just a simple update of a Model field in certain editors
    // Check for 'applyChanges' method and call it if exists
    onEditComplete : function(ed, value, startValue) {
        var me = this;

        // if field instance contains applyChanges() method
        // then we delegate saving to it
        // TODO: though this is a dirty code and must be rethought
        if (ed.field.applyChanges) {
            ed.field.applyChanges(ed.field.task || me.context.record);
            // Calling parent with value === startValue makes it not to call record.set() method, we don't need it
            // to be called since changes are already applyed, but leaves all other functionality inplace.
            return me.callParent([ed, value, value]);
        }
        else {
            return me.callParent([ed, value, startValue]);
        }
    },


    myCancelEdit : function () {
        var me      = this,
            field   = me.field;

        if (field && field.applyChanges) {
            var instantUpdate = field.instantUpdate;

            // we force the field to persist "originalValue" back to the task
            field.instantUpdate = true;
            var result = me._cancelEdit.apply(this, arguments);
            field.instantUpdate = instantUpdate;

            return result;

        } else {
            return me._cancelEdit.apply(this, arguments);
        }
    },


    onMyBeforeEdit : function(sender, context) {

        var field               = context.column.getEditor();

        //When an editor is already active we should call completeEdit because else the new task
        //is set before completeEdit is called (in showEditor)
        if (this.editing) {
            this.completeEdit();
        }

        if (field) {
            // if it's a field mixed with TaskField mixin
            if (field.setTask) {
                // then after setTask calling field already has correct value
                field.setTask(context.record);
                context.value = context.originalValue = field.getValue();
            }
        }

        return this.checkReadOnly();
    }

});
