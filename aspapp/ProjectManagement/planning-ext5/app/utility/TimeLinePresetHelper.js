Ext.define("ProjectPlanning.utility.TimeLinePresetHelper", function () {
	var presets = {}, zoomLevels = [];

	/*timeSpan: number of years for which the project spans*/
	var getMultiYearPreset = function (timeSpan) {
		var multiYearPreset = Ext.Object.merge(Sch.preset.Manager.defaultPresets.manyYears, {
            timeColumnWidth: 50,
            timeResolution: {
            	unit: "MONTH",
            	increment: 1
            },
            headerConfig: {
                top: {
                    unit: "YEAR",
                    dateFormat:"Y",
                    increment:1,
                    align:"center"
                },
                middle: {
                    unit: "QUARTER",
                    increment:1,
                    renderer: function (start, end, cfg) {
                         return MONTHS[Math.floor(start.getMonth() / 3)*3 ] + '-' + MONTHS[Math.floor(start.getMonth() / 3)*3 + 2];
                    },
                    align:"center"
                },
                bottom: {
                    unit: "MONTH",
                    renderer: null
                }
            }
        });

        return multiYearPreset;
	};

	var getYearPreset = function () {
		var yearPreset = Ext.Object.merge(Sch.preset.Manager.defaultPresets.year, {
			timeColumnWidth: 50,
			timeResolution: {
            	unit: "MONTH",
            	increment: 1
            },
            headerConfig: {
                 middle: {
                    unit: "QUARTER",
                    renderer: function (start, end, cfg) {
                         return MONTHS[Math.floor(start.getMonth() / 3)*3 ] + '-' + MONTHS[Math.floor(start.getMonth() / 3)*3 + 2];
                    }
                },
                bottom: {
                    unit: "MONTH",
                    renderer: null
                }
            }
        });

        return yearPreset;
	};

	var getMonthAndYearPreset = function () {
		var monthAndYearPreset = Ext.Object.merge(Sch.preset.Manager.defaultPresets.monthAndYear,{
            timeColumnWidth: 50,
            shiftUnit: "MONTH",
            shiftIncrement: 3,
            defaultSpan: 12, // By default, show 12 month
            headerConfig: {
                top: {
                    unit: "YEAR",
                    dateFormat:"Y",
                    align:"left"
                },
                middle: {
                    unit: "MONTH",
                    dateFormat: ServerTimeFormat.getExtMonthformat()
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        });
        return monthAndYearPreset;
	};

	var getMonthAndWeekPreset = function () {
		var monthAndWeekPreset = Ext.Object.merge(Sch.preset.Manager.defaultPresets.weekAndMonth, {
            timeColumnWidth: 10,
            defaultSpan: 6,
            headerConfig: {
                top: {
                    unit: "MONTH",
                    dateFormat: ServerTimeFormat.getExtMonthformat()
                },
                middle: {
                    unit: "WEEK",
                    renderer: function (start, end, cfg) {
                        cfg.align = 'left';
                        return Ext.Date.format(start, ServerTimeFormat.getExtTimelineDayformat());
                    }
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        });

        return monthAndWeekPreset;
	};

	var getDayAndWeekPreset = function () {
		var dayAndWeekPreset = {
            timeColumnWidth: 60,
            timeResolution: {
            	unit: "DAY",
            	increment: 1
            },
            shiftUnit: "WEEK",
            shiftIncrement: 1,
            defaultSpan: 1,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                top: {
                    unit: "WEEK",
                    dateFormat: ServerTimeFormat.getExtTimelineDayformat() + ' D'
                },
                middle: {
                    unit: "DAY",
                    align: 'center',
                    increment: 1,
                    dateFormat: ServerTimeFormat.getExtTimelineDayformat()
                },
                bottom: {
                    unit: "DAY",
                    renderer: null
                }
            }
        };

        return dayAndWeekPreset;
	};

	var getNoOfQuartersOfProject = function (startDate, endDate) {
		var noOfQuarters = Math.ceil((endDate.getMonth() - startDate.getMonth())/3);
		return noOfQuarters;
	};

	var getPresets = function (startDate, endDate) {
        presets = {};
        zoomLevels = [];
		var isProjectInMultipleQuarter = false, isProjectInMultipleMonth = false;
		var noOfYears = endDate.getFullYear() - startDate.getFullYear();
		if (noOfYears >= 1) {
			presets.multipleYear = getMultiYearPreset(noOfYears);
			zoomLevels = zoomLevels.concat(getZoomLevelsForMultiYearPreset(presets.multipleYear, noOfYears));
			isProjectInMultipleQuarter = true; 
		}
		if (isProjectInMultipleQuarter || getNoOfQuartersOfProject(startDate, endDate)>=1) {
			var quarters;
			presets.year = getYearPreset();
			if(isProjectInMultipleQuarter) {
				quarters = noOfYears * 4;
			} else {
				quarters =  getNoOfQuartersOfProject(startDate, endDate);
			}
			zoomLevels = zoomLevels.concat(getZoomLevelsForYearPreset(presets.year, 4));
			isProjectInMultipleMonth = true;
		}

		/*if (isProjectInMultipleMonth) {
			presets.monthAndYear = getMonthAndYearPreset();
			zoomLevels = zoomLevels.concat(getZoomLevelsForMonthAndYearPreset(presets.monthAndYear, 1));
		}
*/
		presets.weekAndMonth = getMonthAndWeekPreset();
		zoomLevels = zoomLevels.concat(getZoomLevelsForMonthAndWeekPreset(presets.weekAndMonth, 1));		
		
		presets.day = getDayAndWeekPreset();
		zoomLevels = zoomLevels.concat(getZoomLevelsForDayAndWeekPreset(presets.day, 1));		

		return presets;
	};
	var getZoomLevelsForPreset = function (presetName, presetConfig, noOfUnits, resolution, resolutionUnit) {
		var zoomLevels = [];
		var noOfZoomLevels = Math.ceil(Math.sqrt(noOfUnits));
		var count = noOfZoomLevels;
		for (count; count > 0; count--) {
			var zoomLevel = {
				width: presetConfig.timeColumnWidth/Math.pow(2,count-1),
				increment: 1,
				resolution: resolution,
				preset: presetName,
				resolutionUnit: resolutionUnit
			};
			zoomLevels.push(zoomLevel);
		}

		return zoomLevels;
	};
	
	var getZoomLevelsForMultiYearPreset = function (preset, noOfUnits) {
		return getZoomLevelsForPreset('multipleYear', preset, noOfUnits, 1, "MONTH");
	};
	
	var getZoomLevelsForYearPreset = function (preset, noOfUnits) {
		return getZoomLevelsForPreset('year', preset, noOfUnits, 1, "MONTH");
	};
	var getZoomLevelsForMonthAndYearPreset = function (preset, noOfUnits) {
		return getZoomLevelsForPreset('monthAndYear', preset, noOfUnits, 1, "QUARTER");
	};
	var getZoomLevelsForMonthAndWeekPreset = function (preset, noOfUnits) {
		return getZoomLevelsForPreset('weekAndMonth', preset, noOfUnits, "DAY");
	};
	var getZoomLevelsForDayAndWeekPreset = function (preset, noOfUnits) {
		return getZoomLevelsForPreset('day', preset, noOfUnits, 1, "DAY");
	};
	
	var getZoomLevels = function (startDate, endDate) {
		return zoomLevels;
	};
	return {
		getPresets: getPresets,
		getZoomLevels: getZoomLevels
	}
});