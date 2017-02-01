
/* stl.service.SimpleScheduler
 *
 * Schedules tasks based on link dependency order.
 * TODO Support "as late as possible" (currently "as early as possible")
 * TODO Support SNET in both "late" and "early" models
 */ 
if (!stl.service) stl.service = {};

stl.service.SimpleScheduler = function(cfg) {

	var defaults = {
		tasks: [],
		links: [],
		projectStartDate: ServerClientDateClass.getTodaysDate(),
        calendar: null
	};

	$.extend(this, defaults, cfg);

    if (this.calendar) {
        this.setCalendar(this.calendar);
    }
};

$.extend(stl.service.SimpleScheduler.prototype, (function(){

	var WORK_DAY_IN_SECONDS = 8 * 60 * 60,
        JS_DAY_CODES_BY_NAME = {
            "sunday": 0,
            "monday": 1,
            "tuesday": 2,
            "wednesday": 3,
            "thursday": 4,
            "friday": 5,
            "saturday": 6
        };

    return ({

    	scheduleAll: function() {
    		var tasksByUID = {},
    			incomingLinksByUID = {};
    		// Have to do some bookkeeping here since we accept the vertices and edges in separate arrays
    		for (var i = 0; i < this.tasks.length; i++) {
    			var task = this.tasks[i];
    			task.startDate = this.projectStartDate;	// TODO or task.startNoEarlierThan
                this.adjustTaskDatesForCalendarTime(task);
    			tasksByUID[task.uid] = task;
    		}
    		for (var i = 0; i < this.links.length; i++) {
    			var link = this.links[i],
                    fromTask = tasksByUID[link.from],
    				toTask = tasksByUID[link.to];
                if (fromTask && toTask) {
    				var inLinksForTask = toTask && incomingLinksByUID[toTask.uid];
        			if (!inLinksForTask) {
        				inLinksForTask = incomingLinksByUID[toTask.uid] = [];
        			}
        			inLinksForTask.push(link);
                } else {
                    // TODO need a way to check whether this is a subtask link, which we just skip, or an invalid link which is an error
                    // For now, just ignore links that we can't find targets for
                    //console.error("Missing task for link:", link.from, "->", link.to, fromTask, toTask);
                }
    		}
    		// Done with prep, now topologically sort the graph
    		for (var i = 0; i < this.tasks.length; i++) {
    			var task = this.tasks[i];
    			if (!task.visited) {
    				this.scheduleTask(task, incomingLinksByUID, tasksByUID);
    			}
    		}
    		// Clean up flags
    		for (var i = 0; i < this.tasks.length; i++) {
    			delete this.tasks[i].visited;
    			delete this.tasks[i].tempVisited;
    		}
    		// Print results for debugging
    		// for (var i = 0; i < this.tasks.length; i++) {
    		// 	console.log(this.tasks[i].name + ": " + this.tasks[i].startDate, this.tasks[i].visited);
    		// }
    	},

    	scheduleTask: function(task, incomingLinksByUID, tasksByUID) {
    		if (task.tempVisited) {
    			console.error("Cycle detected in link graph", task);
    			return;
    		}
    		if (!task.visited) {
                task.tempVisited = true;
                var inLinks = incomingLinksByUID[task.uid],
                    latestPredecessorEnd = 0;
	    		if (inLinks) {
	    			for (var i = 0; i < inLinks.length; i++) {
	    				var link = inLinks[i],
	    					predecessor = tasksByUID[link.from];
	    				if (predecessor) {
		    				this.scheduleTask(predecessor, incomingLinksByUID, tasksByUID);
		    				var newPredecessorEndTime = predecessor.endDate.getTime();
		    				if (newPredecessorEndTime >= latestPredecessorEnd) {
		    					latestPredecessorEnd = newPredecessorEndTime;
		    				}
		    			} else {
		    				console.error("Found link from nonexistent task; link is", link, ", target task is", task);
		    			}
	    			}
	    		}
	    		if (latestPredecessorEnd > 0 && latestPredecessorEnd > task.startDate.getTime()) {
	    			task.startDate = this.addDays(new Date(latestPredecessorEnd), 1);
                    task.startDate.setHours(0, 0, 0, 0);
                    this.adjustTaskDatesForCalendarTime(task);
	    		}
	    		delete task.tempVisited;
	    		task.visited = true;
	    	}
    	},

        // Move end date to [duration] working days after start date
        adjustTaskDatesForCalendarTime: function(task) {
            if (task.status === "CO") {
                return;
            }
            //If we are going to do client side scheduling after IDCC, this piece of code will fail
            //For idcced project , milestone start and end date should be projected date ie date7
            if(multipleORs(task.taskType, PE_SHORT, CMS_SHORT, IMS_SHORT)){
                task.endDate = new Date(task.date1);//Set to due date
                task.startDate =new Date(task.date1);//Set to due date
                return;
            }
            task.duration = task.duration || 0;
            task.endDate = task.startDate;
            // Move start date to first worked day, per calendar
            var daysShifted = 0;
            while (!this.dayIsWorking[task.startDate.getDay()] && daysShifted < 7) {
                task.startDate = this.addDays(task.startDate, 1);
                daysShifted++;
            }
            if (daysShifted === 7) {
                console.log("Error: Couldn't find working day to start task", task);
                return;
            }
            var durationInDays = task.duration / ONE_DAY_DURATION_DEFAULT_SEC,
                workedDays = 0;
            while (workedDays < durationInDays) {
                if (this.dayIsWorking[task.endDate.getDay()]) {
                    workedDays++;
                }
                task.endDate = this.addDays(task.endDate, 1);
            }
            // For now, set end to one minute before midnight
            // But not if it's zero-duration, otherwise that would put end before start
            if (durationInDays !== 0) {
                task.endDate = this.addMinutes(task.endDate, -1);
            }
        },

         // Move end date to [duration] working days after start date
		/*add or substract duration flag isAdd - true for add/ false for Substract*/
        adjustDatesForDuration: function(date,duration,isAdd) {
            var adjustedDate = date;
            var durationInDays = duration/ ONE_DAY_DURATION_DEFAULT_SEC,
                workedDays = 0;
            if(isAdd){
                while (workedDays < durationInDays) {
                    adjustedDate = this.addDays(adjustedDate, 1);
                    if (this.dayIsWorking[adjustedDate.getDay()]) {
                        workedDays++;
                        }              
                    }
            }
            else{
                while (durationInDays && durationInDays > 0) {
                    adjustedDate = this.substractDays(adjustedDate, 1);
                    if (this.dayIsWorking[adjustedDate.getDay()]) {
                        durationInDays--;
                    }              
                }     
            }
            return adjustedDate;
        },

        subtractDurationFromDate: function(date,duration,isAdd) {            
            var adjustedDate = date;
            var durationInDays = Math.floor(duration/ ONE_DAY_DURATION_DEFAULT_SEC),
                workedDays = 0;
            var mod = (duration/ONE_DAY_DURATION_DEFAULT_SEC)%1;//to handle 0.5, 2.6 etc
            

                if(isAdd){
                    while (workedDays < durationInDays) {
                        adjustedDate = this.addDays(adjustedDate, 1);
                        if (this.dayIsWorking[adjustedDate.getDay()]) {
                            workedDays++;
                        }              
                    }
                   if(mod != 0){                                            
                        var daysToBeAdded = 1;
                         while (daysToBeAdded == 1) {
                            adjustedDate = Ext.Date.add(new Date(adjustedDate), Ext.Date.DAY, mod)                            
                            if (this.dayIsWorking[adjustedDate.getDay()]) {
                                daysToBeAdded++;
                            }              
                        }
                    }
                }
                else{
                    while (durationInDays && durationInDays > 0) {
                        adjustedDate = this.substractDays(adjustedDate, 1);
                        if (this.dayIsWorking[adjustedDate.getDay()]) {
                            durationInDays--;
                        }              
                    }
                    if(mod != 0){                                        
                        var daysToBeSubtracted = 1;
                         while (daysToBeSubtracted == 1) {
                            adjustedDate = Ext.Date.add(new Date(adjustedDate), Ext.Date.DAY, -mod)
                            
                            if (this.dayIsWorking[adjustedDate.getDay()]) {
                                daysToBeSubtracted--;
                            }              
                        }
                    } 
                }
            
            return adjustedDate;
        },

        getDifferenceBetweenDays : function(endDate, startDate){
            var adjustedDate = endDate;
            var workingDaysDifferenceBetweenDays = 0;
            var endDateInMs = endDate.getTime();
            var startDateInMS = startDate.getTime();

            var differenceBetweenDatesInSeconds = (endDateInMs - startDateInMS)/1000;
            var differenceInDays = Math.floor(differenceBetweenDatesInSeconds/86400);
            var mod = (differenceBetweenDatesInSeconds/86400)%1; // sometimes difference is 2.5 days etc
            
            var nonWorkingDays = 0;
            var durationInDays = differenceInDays;
            
            while (durationInDays && durationInDays > 0) {
                adjustedDate = this.substractDays(adjustedDate, 1);
                if (!this.dayIsWorking[adjustedDate.getDay()]) {
                    nonWorkingDays++;
                }
                durationInDays--;              
            }           

            workingDaysDifferenceBetweenDays = differenceInDays - nonWorkingDays + mod;
            workingDaysDifferenceBetweenDays = parseFloat(workingDaysDifferenceBetweenDays.toFixed(2));
            return workingDaysDifferenceBetweenDays;
        },

    	addDays: function(date, days) {
    		var newDate = new Date(date);
    		newDate.setDate(date.getDate() + days);
    		return newDate;
    	},
        substractDays: function(date, days) {
            var newDate = new Date(date);
            newDate.setDate(date.getDate() - days);
    		return newDate;
    	},

        addMinutes: function(date, minutes) {
            return new Date(date.getTime() + (minutes * 60000));
        },

        subtractMinutes: function(date, minutes) {
            //alternate way - Ext.Date.add(new Date(adjustedDate), Ext.Date.DAY, -mod);
            return new Date(date.getTime() - (minutes * 60000));
        },

        setCalendar: function(calendar) {
            this.dayIsWorking = [true, true, true, true, true, true, true]; // all days working by default (no calendar)
            calendar.WeekDays.forEach(function(dayInfo) {
                var dayCode = JS_DAY_CODES_BY_NAME[dayInfo.Day.toLowerCase()];
                this.dayIsWorking[dayCode] = dayInfo.IsWorking;
            }.bind(this));
        }
    });

})());