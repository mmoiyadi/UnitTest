/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define("Sch.eventlayout.Horizontal", {

    nbrOfBandsByResource      : null,
    bandIndexToPxConvertFn    : null,
    bandIndexToPxConvertScope : null,

    constructor : function (config) {
        Ext.apply(this, config);

        this.nbrOfBandsByResource = {};
    },


    clearCache : function (resource) {
        if (resource)
            delete this.nbrOfBandsByResource[resource.internalId];
        else
            this.nbrOfBandsByResource = {};
    },


    // Input:
    // 1. Resource record
    // 2. Array of Event models, or a function to call to receive such event records lazily
    getNumberOfBands    : function (resource, resourceEventsOrFn) {

        var nbrOfBandsByResource = this.nbrOfBandsByResource;

        if (nbrOfBandsByResource.hasOwnProperty(resource.internalId)) {
            return nbrOfBandsByResource[resource.internalId];
        }

        var resourceEvents = Ext.isFunction(resourceEventsOrFn) ? resourceEventsOrFn() : resourceEventsOrFn;

        var eventsData = Ext.Array.map(resourceEvents, function (event) {
            return {
                start : event.getStartDate(),
                end   : event.getEndDate(),
                event : event
            };
        });

        return this.applyLayout(eventsData, resource);
    },


    // TODO DOC
    applyLayout         : function (events, resource) {
        var rowEvents = events.slice();

        // Sort events by start date, and text properties.
        var me = this;

        rowEvents.sort(function (a, b) {
            return me.sortEvents(a.event, b.event);
        });

        // return a number of bands required
        return this.nbrOfBandsByResource[resource.internalId] = this.layoutEventsInBands(rowEvents);
    },


    // Override this sorting method to control in what order events are laid out. By default they are sorted by start date, then end date.
    sortEvents          : function (a, b) {

        var startA = a.getStartDate();
        var startB = b.getStartDate();
        var sameStart = (startA - startB === 0);

        if (sameStart) {
            return a.getEndDate() > b.getEndDate() ? -1 : 1;
        } else {
            return (startA < startB) ? -1 : 1;
        }
    },

    // Input: Array of event layout data
    layoutEventsInBands : function (events) {
        var verticalPosition = 0;

        do {
            var event = events[0];

            while (event) {
                // Apply band height to the event cfg
                event.top = this.bandIndexToPxConvertFn.call(this.bandIndexToPxConvertScope || this, verticalPosition, event.event);

                // Remove it from the array and continue searching
                Ext.Array.remove(events, event);

                event = this.findClosestSuccessor(event, events);
            }

            verticalPosition++;
        } while (events.length > 0);

        // Done!
        return verticalPosition;
    },


    findClosestSuccessor : function (event, events) {
        var minGap = Infinity,
            closest,
            eventEnd = event.end,
            gap,
            isMilestone = event.end - event.start === 0;

        for (var i = 0, l = events.length; i < l; i++) {
            gap = events[i].start - eventEnd;

            if (gap >= 0 && gap < minGap &&
                    // Two milestones should not overlap
                (gap > 0 || events[i].end - events[i].start > 0 || !isMilestone)) {
                closest = events[i];
                minGap = gap;
            }
        }
        return closest;
    }
});