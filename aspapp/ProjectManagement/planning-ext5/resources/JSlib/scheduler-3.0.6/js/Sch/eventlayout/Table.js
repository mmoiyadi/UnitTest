/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Sch.eventlayout.Table', {
    extend  : 'Sch.eventlayout.Horizontal',
    
    timeAxisViewModel : null,
    
    layoutEventsInBands : function (events) {
        var timeAxisViewModel   = this.timeAxisViewModel;
        var timeAxis            = timeAxisViewModel.timeAxis;
        
        var verticalPosition = 0;

        do {
            var event = events[0];

            while (event) {
                // Apply band height to the event cfg
                event.top = this.bandIndexToPxConvertFn.call(this.bandIndexToPxConvertScope || this, verticalPosition, event.event);

                var tick    = Math.floor(timeAxis.getTickFromDate(event.start));
                var left    = this.timeAxisViewModel.getPositionFromDate(timeAxis.getAt(tick).getStartDate());
                var width   = this.timeAxisViewModel.getTickWidth();
                
                event.left = left;
                event.width = width;
                
                // Remove it from the array and continue searching
                Ext.Array.remove(events, event);

                event = this.findClosestSuccessor(event, events);
            }

            verticalPosition++;
        } while (events.length > 0);

        // Done!
        return verticalPosition;
    },
    
    findClosestSuccessor    : function(event, events) {
        var minGap = Infinity,
            closest,
            eventEnd = event.end,
            gap;
            
        var timeAxis    = this.timeAxisViewModel.timeAxis;
        var tickIndex   = Math.floor(timeAxis.getTickFromDate(event.start));
        var tick        = timeAxis.getAt(tickIndex);

        for (var i = 0, l = events.length; i < l; i++) {
            gap = events[i].start - eventEnd;

            if (gap >= 0 && gap < minGap && events[i].start >= tick.getEndDate()) {
                closest = events[i];
                minGap = gap;
            }
        }
        return closest;
    }
});