function SessionTimeOut(a,b){this.IsSessionTimeOut=function(){var d=Math.floor(Math.random()*999999);var c=b+"?key=objASPSession&rand="+d;$.ajax({url:c,async:false,success:function(e){var f=e;if(f=="SESSIONTIMEOUT"){top.location=a;return true}else{return false}}});return false}}function RedirectToLogInPage(){top.location=ReDirectUrl}function logoutUser(){top.location=logOffUrl}function NE_SessionAlive(){timeOutID=window.setTimeout(NE_StartSessionPing,TimeToPing)}function NE_StartSessionPing(){document.getElementById("div_iframe").innerHTML="<iframe src='Taskupdt/blank.htm' id='frmSessionAlive' style='display:none;' name='frmSessionAlive' width='0' height='0'></iframe>";document.forms.form_SessionAlive.defaultSessionTimeout.value=DefaultSessionTimeout;document.forms.form_SessionAlive.target="frmSessionAlive";document.forms.form_SessionAlive.action="../../NetworkEdit/NE_SessionAlive.aspx";document.forms.form_SessionAlive.submit();window.clearTimeout(timeOutID);timeOutID=window.setTimeout(NE_StartSessionPing,TimeToPing)}function NE_RemoveSessionPing(){window.clearTimeout(timeOutID)};