/**
 * Created by ajetnewera on 09-06-2015.
 * Email : ravi.teja@navyuginfo.com
 */

Ext.define('ProjectPlanning.model.FullKitTask', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'TaskUID', type: 'string' },
        { name: 'TaskName', type: 'string' },
        { name: 'FKDate', type: 'string' },
        { name: 'FKPullInDuration', type: 'string' },
        { name: 'FKSuggestedDate', type: 'string' }
    ],
    createFKRecord: function (task) {
        this.set('TaskUID', task.TaskUID);
        this.set('TaskName', task.TaskName);
        this.set('FKDate', task.FKDate);
        this.set('FKPullInDuration', task.FKPullInDuration);
        this.set('FKSuggestedDate', task.FKSuggestedDate);
        return this;
    }
});
