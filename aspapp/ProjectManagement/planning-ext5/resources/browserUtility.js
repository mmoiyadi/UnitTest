function isBrowserLessThanIE8() {
    var ver = getInternetExplorerVersion();
    if (ver != -1 && ver <= 8.0) {
        return true;
    } else {
        return false;
    }
}



/**
 * Stores the Server time format mapping with
 * client
 */
var ServerTimeFormat = (function () {
    window._format = "m/d/y";
	
	var ExtDateFormats = function (dateFormat, dayAndMonth, monthAndYear) {
		var obj = {"dateFormat":dateFormat, "dayAndMonth": dayAndMonth, "monthAndYear": monthAndYear};
		return obj;
	};
    var _mappedFormatsForExtDisplay =
    {
        "dd/mm/yyyy": "d/m/y",
        "dd/mm/yy": "d/m/y",
        "d/m/yy": "d/m/y",
        "d.m.yy": "d/m/y",
        "mm/dd/yyyy": "m/d/y",
        "mm/dd/yy": "m/d/y",
        "m/d/yy": "m/d/y",
        "m/d/yyyy": "m/d/y",
        "yyyy/mm/dd": "y/m/d"
    };

    /*

     Format                   Description
     ----------------------------------------------------
     d         Day of the month, 2 digits with leading zeros
     j         Day of the month without leading zeros
     m         Numeric representation of a month, with leading zeros
     n         Numeric representation of a month, without leading zeros
     y         A two digit representation of a year
     Y         A full numeric representation of a year, 4 digits

     */

    var mergedFormatsForExtdate = {
        "dd/mm/yyyy":  ExtDateFormats("d/m/Y", 'd/m', 'm/Y'),
        "dd/mm/yy":    ExtDateFormats("d/m/y", 'd/m', 'm/y'),
        "d/mm/yy":     ExtDateFormats("j/m/y", 'j/m', 'm/y'),
        "d/m/yy":      ExtDateFormats("j/n/y", 'j/n', 'n/y'),
        "d.m.yy":      ExtDateFormats("j.n.y", 'j.n', 'n.y'),
        "mm/dd/yyyy":  ExtDateFormats("m/d/Y", 'm/d', 'm/Y'),
        "mm/dd/yy":    ExtDateFormats("m/d/Y", 'm/d', 'm/y'),
        "m/d/yy":      ExtDateFormats("n/j/y", 'n/j', 'n/y'),
        "m/d/yyyy":    ExtDateFormats("n/j/Y", 'n/j', 'n/Y'),
        "yyyy/mm/dd":  ExtDateFormats("Y/m/d", 'm/d', 'Y/m'),
        "yyyy-mm-dd":  ExtDateFormats("Y-m-d", 'm-d', 'Y-m'),

        "dd/mmm/yy":   ExtDateFormats("d/M/y", 'd/M', 'M/y'),
        "dd-mmm-yy":   ExtDateFormats("d-M-y", 'd-M', 'M-y'),
        "dd/mmm/yyyy": ExtDateFormats("d/M/Y", 'd/M', 'M/Y'),
        "dd-mmm-yyyy": ExtDateFormats("d-M-Y", 'd-M', 'M-Y'),
        "dd:mmm:yy":   ExtDateFormats("d:M:y", 'd:M', 'M:y'),
        "mmm:dd:yy":   ExtDateFormats("M:d:y", 'M:d', 'M:y'),
        "dd-mm-yyyy":  ExtDateFormats("d-m-Y", 'd-m', 'm-Y'),
        "dd-mm-yy":    ExtDateFormats("d-m-y", 'd-m', 'm-y'),
        "mm-dd-yyyy":  ExtDateFormats("m-d-Y", 'm-d', 'm-Y'),
        "dd.mm.yyyy":  ExtDateFormats("d.m.Y", 'd.m', 'm.Y'),
        "mm.dd.yyyy":  ExtDateFormats("m.d.Y", 'm.d', 'm.Y'),
        "dd.mm.yy":    ExtDateFormats("d.m.y", 'd.m', 'm.y'),
        "dd.mmm.yyyy": ExtDateFormats("d.M.Y", 'd.M', 'M.Y'),
        "mm.dd.yy":    ExtDateFormats("m.d.y", 'm.d', 'm.y')

    };
    return {

        setformat: function (format) {
            window._format = format;
            console.log("DateTime Format :" + window._format);
        },

        setBootstrapDatePickerFormat: function () {
            var _format = this.getDateFieldFormat().toLowerCase();
            if(_format.search("mmmm") != -1) {
                stl.app.BootstrapDatePickerFormat = _format.replace("mmmm","MM");
            } else if(_format.search("mmm") != -1) {
                stl.app.BootstrapDatePickerFormat = _format.replace("mmm","M");
            } else {
                stl.app.BootstrapDatePickerFormat = _format;
            }
        },
        getMergedFormatObjFromDateFormat: function () {
            var _format = this.getDateFieldFormat().toLowerCase();
            if (mergedFormatsForExtdate[_format]) {
                return mergedFormatsForExtdate[_format];
            }

        },
        /*
            All regular date formats work for bootstrap datepicker except for the Months(mmm,mmmm)
            windows------- Bootstrap datepicker
            --------------------------------
             mmm--------->    M
             mmmm-------->    MM
            Format                   Description
             ----------------------------------------------------
            d, dd: Numeric date, no leading zero and leading zero, respectively. Eg, 5, 05.
            D, DD: Abbreviated and full weekday names, respectively. Eg, Mon, Monday.
            m, mm: Numeric month, no leading zero and leading zero, respectively. Eg, 7, 07.
            M, MM: Abbreviated and full month names, respectively. Eg, Jan, January
            yy, yyyy: 2- and 4-digit years, respectively. Eg, 12, 2012.
        */
        getBootstrapPickerDateFormat:function(){
            return stl.app.BootstrapDatePickerFormat;
        },
        getExtDateformat: function () {
            
            var mergedObj = this.getMergedFormatObjFromDateFormat();

            if (mergedObj) {
                return mergedObj.dateFormat;
            }
            else if (Ext.util.Format.dateFormat) {
                return Ext.util.Format.dateFormat;
            }

            return "j/n/y";
        },

        getExtMonthformat: function () {
            var mergedObj = this.getMergedFormatObjFromDateFormat();

            if (mergedObj) {
                return mergedObj.monthAndYear;
            }
        },

        getExtTimelineDayformat: function () {
            var mergedObj = this.getMergedFormatObjFromDateFormat();

            if (mergedObj) {
                return mergedObj.dayAndMonth;
            }
        },

        getDateFieldFormat: function () {
            if (window._format != null) {
                return window._format;
            }

            return "dd/mm/yy";
        },

        getRevisionHistoryFormat: function (dtStr) {
            // All PPI dates are converted to UTC format in middle layer using 'r' -  RFC1123 ("R", "r") Format Specifier
            // This conversion is not done for revision history dates. 
            // moment.utc() method displays dates in UTC format.
            return moment.utc(dtStr).format('DD MMMM, h:mm a'); 
        },


        //dateValue - Expecting dateVale as string
        getDateInLocaleFormat: function (dateValue) {
            var formattedDate = "";
            if (dateValue) {
                formattedDate = Ext.Date.format(ServerClientDateClass.convertDateStringToObject(dateValue), ServerTimeFormat.getExtDateformat());
            }
            return formattedDate;
        },

        getTodaysDateInLocaleFormat: function () {
            var formattedDate = "";

            formattedDate = Ext.Date.format(ServerClientDateClass.getTodaysDate(), ServerTimeFormat.getExtDateformat());

            return formattedDate;
        },

        //for bird's eye view
        getDateFormatForBirdEyeView: function (dateValue) {
            var formattedDate = "";
            if (dateValue) {
                formattedDate = Ext.Date.format(ServerClientDateClass.convertDateStringToObject(dateValue), "M d");
            }
            return formattedDate;
        }
    };

})();


/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 */
function getInternetExplorerVersion() {
    var rv = -1;
    if (navigator.appName == MSIE) {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1);
    }
    else if (navigator.appName == 'Netscape')/*For IE11*/
    {
        var ua = navigator.userAgent;
        var re = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1);
    }
    return rv;
}


function showIncompatibleBrowserWarning() {
    if (isBrowserLessThanIE8()) {
        PPI_Notifier.warning(IE_BELOW_NINE_WARNING_MESSAGE, IE_BELOW_NINE_WARNING_MESSAGE_TITLE);
    }
}
function isChromeBrowser() {
    // please note, 
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    var isChromeBrowserReturnVal = false, 
        isChromium = window.chrome,
        winNav = window.navigator,
        vendorName = winNav.vendor,
        isOpera = winNav.userAgent.indexOf("OPR") > -1,
        isIEedge = winNav.userAgent.indexOf("Edge") > -1,
        isIOSChrome = winNav.userAgent.match("CriOS");

    if (isIOSChrome) {
        // is Google Chrome on IOS
        
    } else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
        // is Google Chrome
        isChromeBrowserReturnVal = true;
    } else {
        // not Google Chrome 
    }
    return isChromeBrowserReturnVal;

}
//Should be used only for IE11 and chrome for now
//IE9  does not support window.devicePixelRatio
function getBrowserZoomLevel(){
    return window.devicePixelRatio;

}

function bindWindowResize(onResize){
    
        window.onresize =onResize;
        stl.app.eventResizeRegisetered =true;
   
}
