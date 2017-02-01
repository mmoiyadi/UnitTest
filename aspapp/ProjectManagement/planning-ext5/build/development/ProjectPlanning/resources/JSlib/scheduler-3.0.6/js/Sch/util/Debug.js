/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * To analyze possible errors in your setup, include this on your HTML page and use Firebug (or any other console application) to execute line below:
 * >
 * > Sch.util.Debug.runDiagnostics();
 * > ...
 */
Ext.define("Sch.util.Debug", {
    singleton : true,

    runDiagnostics : function () {
        var log;
        var me = this;
        var C = window.console;

        if (C && C.log) {
            log = function () {
                C.log.apply(C, arguments);
            };
        } else {
            if (!me.schedulerDebugWin) {
                me.schedulerDebugWin = new Ext.Window({
                    height      : 400,
                    width       : 500,
                    bodyStyle   : 'padding:10px',
                    closeAction : 'hide',
                    autoScroll  : true
                });
            }
            me.schedulerDebugWin.show();
            me.schedulerDebugWin.update('');

            log = function (text) {
                me.schedulerDebugWin.update((me.schedulerDebugWin.body.dom.innerHTML || '') + text + '<br/>');
            };
        }

        var els = Ext.select('.sch-schedulerpanel');

        if (els.getCount() === 0) log('No scheduler component found');

        var s               = Ext.getCmp(els.elements[0].id),
            resourceStore   = s.getResourceStore(),
            eventStore      = s.getEventStore();

        if (!eventStore.isEventStore) {
            log("Your event store must be or extend Sch.data.EventStore");
        }

        log('Scheduler view start: ' + s.getStart() + ', end: ' + s.getEnd());

        if (!resourceStore) {
            log('No store configured');
            return;
        }
        if (!eventStore) {
            log('No event store configured');
            return;
        }

        var eventFields     = new Ext.util.MixedCollection(),
            resourceFields  = new Ext.util.MixedCollection();

        for (var i = 0; i < eventStore.model.prototype.fields.length; i++) {
            eventFields.add(eventStore.model.prototype.fields[i].name, eventStore.model.prototype.fields[i]);
        }

        for (i = 0; i < resourceStore.model.prototype.fields.length; i++) {
            resourceFields.add(resourceStore.model.prototype.fields[i].name, resourceStore.model.prototype.fields[i]);
        }

        log(resourceStore.getCount() + ' records in the resource store');
        log(eventStore.getCount() + ' records in the eventStore');
        var eventIdProp = eventStore.model.prototype.idProperty;
        var resourceIdProp = resourceStore.model.prototype.idProperty;

        var eventIdPropertyFound = eventFields.getByKey(eventIdProp);
        var resourceIdPropertyFound = resourceFields.getByKey(resourceIdProp);

        if (!(new eventStore.model() instanceof Sch.model.Event)) {
            log("Your event model must extend Sch.model.Event");
        }
        if (!(new resourceStore.model() instanceof Sch.model.Resource)) {
            log("Your resource model must extend Sch.model.Resource");
        }

        if (!eventIdPropertyFound) {
            log("idProperty on the event model is incorrectly setup, value: " + eventIdProp);
        }
        if (!resourceIdPropertyFound) {
            log("idProperty on the resource model is incorrectly setup, value: " + resourceIdProp);
        }

        var view = s.getSchedulingView();

        log(view.el.select(view.eventSelector).getCount() + ' events present in the DOM');

        if (eventStore.getCount() > 0) {
            if (!eventStore.first().getStartDate() || !(eventStore.first().getStartDate() instanceof Date)) {
                log('The eventStore reader is misconfigured - The StartDate field is not setup correctly, please investigate');
                log('StartDate is configured with dateFormat: ' + eventFields.getByKey(eventStore.model.prototype.startDateField).dateFormat);
                log('See Ext JS docs for information about different date formats: http://docs.sencha.com/extjs/#!/api/Ext.Date');
            }

            if (!eventStore.first().getEndDate() || !(eventStore.first().getEndDate() instanceof Date)) {
                log('The eventStore reader is misconfigured - The EndDate field is not setup correctly, please investigate');
                log('EndDate is configured with dateFormat: ' + eventFields.getByKey(eventStore.model.prototype.endDateField).dateFormat);
                log('See Ext JS docs for information about different date formats: http://docs.sencha.com/extjs/#!/api/Ext.Date');
            }

            if (eventStore.proxy && eventStore.proxy.reader && eventStore.proxy.reader.jsonData) {
                log('Dumping jsonData to console');
                console && console.dir && console.dir(eventStore.proxy.reader.rawData);
            }

            log('Records in the event store:');
            eventStore.each(function (r, i) {
                log((i + 1) + '. ' + r.startDateField + ':' + r.getStartDate() + ', ' + r.endDateField + ':' + r.getEndDate() + ', ' + r.resourceIdField + ':' + r.getResourceId());

                if (!r.getStartDate()) {
                    log(r.getStartDate());
                }
            });
        } else {
            log('Event store has no data. Has it been loaded properly?');
        }

        if (resourceStore instanceof Ext.data.TreeStore) resourceStore = resourceStore.nodeStore;

        if (resourceStore.getCount() > 0) {
            log('Records in the resource store:');
            resourceStore.each(function (r, i) {
                log((i + 1) + '. ' + r.idProperty + ':' + r.getId());
                return;
            });
        } else {
            log('Resource store has no data.');
            return;
        }

        log('Everything seems to be setup ok!');
    }
});
