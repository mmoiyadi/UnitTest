//this is used only to redirect to login screen
//HandlerUrl will determine if session is timed out
function SessionTimeOut(ReDirectUrl,HandlerUrl) {
    this.IsSessionTimeOut = function () {
        var randonnum = Math.floor(Math.random() * 999999);
        var u = HandlerUrl + "?key=objASPSession&rand=" + randonnum;
        $.ajax({
            url: u,
            async: false,
            success: function (data) {
                var retValue = data;
                if (retValue == "SESSIONTIMEOUT") {
                    //$(document).find("body").html("");
                    //$(document).find("body").html("Session Timeout");//You have to logon to Concerto before accessing this page.
                    top.location = ReDirectUrl;
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        return false;
    }
}

function RedirectToLogInPage() {
    top.location = ReDirectUrl;
}

function logoutUser() {
    top.location = logOffUrl;
}

function NE_SessionAlive() {
    timeOutID = window.setTimeout(NE_StartSessionPing, TimeToPing);
}

function NE_StartSessionPing() {
    document.getElementById("div_iframe").innerHTML = "<iframe src='Taskupdt/blank.htm' id='frmSessionAlive' style='display:none;' name='frmSessionAlive' width='0' height='0'></iframe>"
    document.forms["form_SessionAlive"].defaultSessionTimeout.value = DefaultSessionTimeout
    document.forms["form_SessionAlive"].target = "frmSessionAlive"
    document.forms["form_SessionAlive"].action = "../../NetworkEdit/NE_SessionAlive.aspx"
    document.forms["form_SessionAlive"].submit();
    window.clearTimeout(timeOutID);
    timeOutID = window.setTimeout(NE_StartSessionPing, TimeToPing);
}

function NE_RemoveSessionPing() {
    window.clearTimeout(timeOutID);
}
