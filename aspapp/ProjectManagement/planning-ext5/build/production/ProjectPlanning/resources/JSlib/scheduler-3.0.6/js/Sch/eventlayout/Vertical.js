/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Sch.eventlayout.Vertical
 * @private
 *
 */
Ext.define("Sch.eventlayout.Vertical", {
    requires : ['Sch.util.Date'],

    view : null,

    constructor : function(config) {
        Ext.apply(this, config);
    },

    // Try to pack the events to consume as little space as possible
    applyLayout: function (events, columnWidth) {

        if (events.length === 0) {
            return;
        }

        // Sort events by start date, and text properties.
       var me = this;
       events.sort(function(a, b) { return me.sortEvents(a.event, b.event); });

        var start, end,
            view = this.view,
            D = Sch.util.Date,
            band = 1,
            startFraction,
            slot,
            totalAvailableWidth = columnWidth - (2*view.barMargin),
            firstInCluster,
            j;

        for (var i = 0, l = events.length; i < l; i++) {
            firstInCluster = events[i];
            start = firstInCluster.start;
            end = firstInCluster.end;

            slot = this.findStartSlot(events, firstInCluster);

            var cluster = this.getCluster(events, i);

            if (cluster.length > 1) {
                firstInCluster.left = slot.start;
                firstInCluster.width = slot.end - slot.start;

                // If there are multiple slots and events in the cluster have multiple start dates, group all same-start events into first slot
                j = 1;

                while(j < (cluster.length-1) && cluster[j+1].start - firstInCluster.start === 0) {
                    j++;
                }

                // See if there's more than 1 slot available for this cluster, if so - first group in cluster consumes the entire first slot
                var nextSlot = this.findStartSlot(events, cluster[j]);
                if (nextSlot && nextSlot.start < 0.8) {
                    cluster = cluster.slice(0, j);
                }
            }

            var count = cluster.length,
                barWidth = (slot.end-slot.start)/count;

            // Apply fraction values
            for (j = 0; j < count; j++) {
                cluster[j].width = barWidth;
                cluster[j].left = slot.start + (j*barWidth);
            }

            i += count - 1;
        }

        for (i = 0, l = events.length; i < l; i++) {
            events[i].width = events[i].width*totalAvailableWidth;
            events[i].left = view.barMargin + (events[i].left*totalAvailableWidth);
        }
    },

    findStartSlot : function(events, event) {
        var priorOverlappers = this.getPriorOverlappingEvents(events, event),
            i;

        if (priorOverlappers.length === 0) {
            return {
                start : 0,
                end : 1
            };
        }

        for (i = 0; i < priorOverlappers.length ; i++) {
            if (i === 0 && priorOverlappers[0].left > 0) {
                return {
                    start : 0,
                    end : priorOverlappers[0].left
                };
            } else if (priorOverlappers[i].left + priorOverlappers[i].width < (i < priorOverlappers.length - 1 ? priorOverlappers[i+1].left : 1)) {
                return {
                    start : priorOverlappers[i].left + priorOverlappers[i].width,
                    end : i < priorOverlappers.length - 1 ? priorOverlappers[i+1].left : 1
                };
            }
        }

        return false;
    },

    getPriorOverlappingEvents : function(events, event) {
        var D = Sch.util.Date,
            start = event.start,
            end = event.end,
            overlappers = [];

        for (var i = 0, l = Ext.Array.indexOf(events, event); i < l ; i++) {
            if (D.intersectSpans(start, end, events[i].start, events[i].end)) {
                overlappers.push(events[i]);
            }
        }

        overlappers.sort(this.sortOverlappers);

        return overlappers;
    },

    sortOverlappers : function(e1, e2) {
        return e1.left < e2.left ? -1 : 1;
    },

    getCluster : function(events, startIndex) {
        if (startIndex >= events.length-1) {
            return [events[startIndex]];
        }

        var evts    = [events[startIndex]],
            start   = events[startIndex].start,
            end     = events[startIndex].end,
            l       = events.length,
            D       = Sch.util.Date,
            i       = startIndex+1;

        while(i < l && D.intersectSpans(start, end, events[i].start, events[i].end)) {
            evts.push(events[i]);
            start = D.max(start, events[i].start);
            end = D.min(events[i].end, end);
            i++;
        }

        return evts;
    },

    sortEvents : function (a, b) {

        var startA = a.getStartDate(), endA = a.getEndDate();
        var startB = b.getStartDate(), endB = b.getEndDate();

        var sameStart = (startA - startB === 0);

        if (sameStart) {
            return endA > endB ? -1 : 1;
        } else {
            return (startA < startB) ? -1 : 1;
        }

    }
});
