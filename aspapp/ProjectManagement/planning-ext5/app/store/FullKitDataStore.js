/**
 * Created by ajetnewera on 09-06-2015.
 * Email : ravi.teja@navyuginfo.com
 */

Ext.define("ProjectPlanning.store.FullKitDataStore",{
    extend : 'Ext.data.Store',
    requires : [
        'ProjectPlanning.model.FullKitTask'
    ],
    model : "ProjectPlanning.model.FullKitTask"


});
