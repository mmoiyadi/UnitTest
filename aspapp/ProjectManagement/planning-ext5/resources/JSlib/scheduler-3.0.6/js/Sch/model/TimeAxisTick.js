/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Sch.model.TimeAxisTick
 * @extends Sch.model.Range
 *
 * A simple model with a start/end date interval defining a 'tick' on the time axis.
 */
if (!Ext.ClassManager.get("Sch.model.TimeAxisTick")) {
    Ext.define('Sch.model.TimeAxisTick', {
        extend : 'Sch.model.Range',

        startDateField : 'start',
        endDateField   : 'end'
    });
}
