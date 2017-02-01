/*
This function is being usedto handle date-time difference between client-server when they are different timezones/dates.
We want server’s current date to be considered date for all calculations on client side instead of client’s date 
so I have called this function wherever we were using new Date(). 
*/

var ServerClientDateClass = (function () {

    var serverDateTimeInJS = new Date();
    var clientDateTimeInJS = new Date();
    var differenceInTime = 0;

    function getDifferenceBetweenServerAndClient() {
        var timeDifference = 0;

        var serverDate = ServerClientDateClass.serverDateTimeInJS;
        var clientDate = clientDateTimeInJS;

        var serverTimeInMs = serverDate.getTime(); //getTime - Return the number of milliseconds since 1970/01/01
        var clientTimeInMs = clientDate.getTime();

        var difference = clientTimeInMs - serverTimeInMs;

        differenceInTime = difference;

        return differenceInTime;
    }

    function getTodaysServerDate() {

        var difference = getDifferenceBetweenServerAndClient();

        var newClientTimeInMs = 0;
        var clientTimeInMs = new Date().getTime();

        //This takes care of both the scenarios 
        //1.Server date is in future
        //2.Client date is in future
        //It always return server date-time correctly

        newClientTimeInMs = clientTimeInMs - difference;

        return new Date(newClientTimeInMs);
    }

    function convertDateStringToObject(dateInStrFormat){
        var returnDateObj = "";

        if(dateInStrFormat){
            var convertedObj = new Date(dateInStrFormat);
            if(convertedObj != "Invalid Date")
                returnDateObj = convertedObj;
        }

        return returnDateObj;
    }

    return {
        serverDateTimeInJS: serverDateTimeInJS,
        getTodaysDate: getTodaysServerDate,
        convertDateStringToObject: convertDateStringToObject
    }
})();