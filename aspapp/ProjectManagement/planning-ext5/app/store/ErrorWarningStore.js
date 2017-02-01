/**
 * Created by ajetnewera on 09-06-2015.
 * Email : ravi.teja@navyuginfo.com
 */

var errStore = Ext.create('Ext.data.Store', {
    fields: ['code', 'desc', 'type', 'isError', 'items'],
    data: []
});


var warnStore = Ext.create('Ext.data.Store', {
    fields: ['code', 'desc', 'type', 'isError', 'items'],
    data: []
});
