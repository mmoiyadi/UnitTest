stl.view.Validation = function(cfg) {
    var defaults = {
    	// TODO
    };
    $.extend(this, defaults, cfg);
   
};


$.extend(stl.view.Validation.prototype, (function () {
    // Private static variables

    // Public API
    return ({

        getValidDuration: function (val, defaultDuration, isShowMsg) {
            var delocalizedVal = this.deLocalizeTimeString(val);
            var parsed = 0;
            try {
                parsed = Math.round(juration.parse(delocalizedVal));
            }
            catch (e) {
                parsed = TASK_DURATION_DEFAULT_SEC;
                if (isShowMsg)
                    PPI_Notifier.error(INVALID_DURATION);
            }
            return parsed;
        },

        getValidDurationString: function(val, defaultDuration, isShowMsg) {
            var parsedStr = defaultDuration;
            try {
                parsedStr = juration.stringifyToDays(val);
            } catch (e) {
                parsedStr = defaultDuration;
                if (isShowMsg)
                    PPI_Notifier.error(INVALID_DURATION);
            }
            if (parsedStr === EMPTY_STRING) {
                parsedStr = ZERO_DURATION_STR;
            }
            return this.localizeTimeString(parsedStr);


        },
        localizeTimeString: function (parsedStr) {
            if (parsedStr.indexOf("days") != -1) {
                parsedStr = parsedStr.replace("days", DAYS);
            } else {
                parsedStr = parsedStr.replace("day", DAY_STR);
            }

            if (parsedStr.indexOf("hours") != -1)
                parsedStr = parsedStr.replace("hours", HOURS);
            else
                parsedStr = parsedStr.replace("hour", HOURS_STR);

            if (parsedStr.indexOf("minutes") != -1)
                parsedStr = parsedStr.replace("minutes", MINS);
            else
                parsedStr = parsedStr.replace("minute", MINS_STR);

            return parsedStr;
        },

         deLocalizeTimeString: function (val) {
            if (val.indexOf(DAYS) != -1) {
                val = val.replace(DAYS,"days");
            } else {
                val = val.replace(DAY_STR ,"day");
            }
            if (val.indexOf(HOURS) != -1)
                val = val.replace(HOURS ,"hours");
            else
                val = val.replace(HOURS_STR ,"hour");

            if (val.indexOf(MINS) != -1)
                val = val.replace(MINS ,"minutes");
            else
                val = val.replace(MINS_STR ,"minute");

            return val;
        },

        convertSecondsInDays: function (durationInSeconds) {
            var durationInDays = "0 " + DAYS;

            if (durationInSeconds) {
                durationInDays = durationInSeconds / ONE_DAY_DURATION_DEFAULT_SEC;
                Math.round(durationInDays); // durationInDays.toFixed(2);

                durationInDays = durationInDays + " " + DAYS;
            }

            return durationInDays;
        }
    });
})());

