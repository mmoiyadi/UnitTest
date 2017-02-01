<%@ Page Language="VB" AutoEventWireup="false" CodeFile="index.aspx.vb" Inherits="ProjectManagement_ProjectPlanning_index" %>

<!DOCTYPE html>

<html >
<head runat="server">
    <title><%#UIUtility.GetConwebGlobalResourceObject("Concerto_Project_Planning_Interface")%></title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="shortcut icon" href="concerto.ico" />
    <script type="text/javascript">var Ext=Ext||{};Ext.manifest=Ext.manifest||"app.json";Ext=Ext||{};
Ext.Boot=Ext.Boot||function(j){function k(a){if(a.$isRequest)return a;a=a.url?a:{url:a};var b=a.url;p(a,{urls:b.charAt?[b]:b,charset:a.charset||d.config.charset});p(this,a)}function r(a){if(a.$isEntry)return a;var b=a.charset||d.config.charset,c=Ext.manifest,c=c&&c.loader,e=void 0!==a.cache?a.cache:c&&c.cache,m;void 0===e&&(e=!d.config.disableCaching);!1===e?m=+new Date:!0!==e&&(m=e);m&&(c=c&&c.cacheParam||d.config.disableCachingParam,m=c+"\x3d"+m);p(a,{charset:b,buster:m,requests:[]});p(this,a)}
var h=document,f=function(a,b,c){c&&f(a,c);if(a&&b&&"object"==typeof b)for(var e in b)a[e]=b[e];return a},t={disableCaching:/[?&](?:cache|disableCacheBuster)\b/i.test(location.search)||!/http[s]?\:/i.test(location.href)||/(^|[ ;])ext-cache=1/.test(h.cookie)?!1:!0,disableCachingParam:"_dc",loadDelay:!1,preserveScripts:!0,charset:void 0},v=/\.css(?:\?|$)/i,u=h.createElement("a"),q="undefined"!==typeof window,s={browser:q,node:!q&&"function"===typeof require,phantom:"undefined"!==typeof phantom&&phantom.fs},
n=Ext.platformTags={},p=function(a,b,c){c&&p(a,c);if(a&&b&&"object"===typeof b)for(var e in b)a[e]=b[e];return a},d={loading:0,loaded:0,env:s,config:t,scripts:{},currentFile:null,suspendedQueue:[],currentRequest:null,syncMode:!1,useElements:!0,listeners:[],Request:k,Entry:r,detectPlatformTags:function(){var a=navigator.userAgent,b=n.isMobile=/Mobile(\/|\s)/.test(a),c,e,m,l;c=document.createElement("div");e="iPhone;iPod;Android;Silk;Android 2;BlackBerry;BB;iPad;RIM Tablet OS;MSIE 10;Trident;Chrome;Tizen;Firefox;Safari;Windows Phone".split(";");
var g={};m=e.length;var w;for(w=0;w<m;w++)l=e[w],g[l]=RegExp(l).test(a);b=g.iPhone||g.iPod||!g.Silk&&g.Android&&(g["Android 2"]||b)||(g.BlackBerry||g.BB)&&g.isMobile||g["Windows Phone"];a=!n.isPhone&&(g.iPad||g.Android||g.Silk||g["RIM Tablet OS"]||g["MSIE 10"]&&/; Touch/.test(a));e="ontouchend"in c;!e&&(c.setAttribute&&c.removeAttribute)&&(c.setAttribute("ontouchend",""),e="function"===typeof c.ontouchend,"undefined"!==typeof c.ontouchend&&(c.ontouchend=void 0),c.removeAttribute("ontouchend"));e=
e||navigator.maxTouchPoints||navigator.msMaxTouchPoints;c=!b&&!a;m=g["MSIE 10"];l=g.Blackberry||g.BB;f(n,d.loadPlatformsParam(),{phone:b,tablet:a,desktop:c,touch:e,ios:g.iPad||g.iPhone||g.iPod,android:g.Android||g.Silk,blackberry:l,safari:g.Safari&&!l,chrome:g.Chrome,ie10:m,windows:m||g.Trident,tizen:g.Tizen,firefox:g.Firefox})},loadPlatformsParam:function(){var a=window.location.search.substr(1).split("\x26"),b={},c,e,d;for(c=0;c<a.length;c++)e=a[c].split("\x3d"),b[e[0]]=e[1];if(b.platformTags){e=
b.platform.split(/\W/);a=e.length;for(c=0;c<a;c++)d=e[c].split(":")}return d},filterPlatform:function(a){a=[].concat(a);var b,c,e;b=a.length;for(c=0;c<b;c++)if(e=a[c],n.hasOwnProperty(e))return!!n[e];return!1},init:function(){var a=h.getElementsByTagName("script"),b=a.length,c=/\/ext(\-[a-z\-]+)?\.js$/,e,m,l,g,f,x;for(x=0;x<b;x++)if(m=(e=a[x]).src)l=e.readyState||null,!g&&c.test(m)&&(d.hasReadyState="readyState"in e,d.hasAsync="async"in e||!d.hasReadyState,g=m),d.scripts[f=d.canonicalUrl(m)]||new r({key:f,
url:m,done:null===l||"loaded"===l||"complete"===l,el:e,prop:"src"});g||(e=a[a.length-1],g=e.src,d.hasReadyState="readyState"in e,d.hasAsync="async"in e||!d.hasReadyState);d.baseUrl=g.substring(0,g.lastIndexOf("/")+1);d.origin=window.location.origin||window.location.protocol+"//"+window.location.hostname+(window.location.port?":"+window.location.port:"");d.detectPlatformTags();Ext.filterPlatform=d.filterPlatform},canonicalUrl:function(a){u.href=a;a=u.href;var b=t.disableCachingParam,b=b?a.indexOf(b+
"\x3d"):-1,c,e;if(0<b&&("?"===(c=a.charAt(b-1))||"\x26"===c)){e=a.indexOf("\x26",b);if((e=0>e?"":a.substring(e))&&"?"===c)++b,e=e.substring(1);a=a.substring(0,b-1)+e}return a},getConfig:function(a){return a?d.config[a]:d.config},setConfig:function(a,b){if("string"===typeof a)d.config[a]=b;else for(var c in a)d.setConfig(c,a[c]);return d},getHead:function(){return d.docHead||(d.docHead=h.head||h.getElementsByTagName("head")[0])},create:function(a,b,c){c=c||{};c.url=a;c.key=b;return d.scripts[b]=new r(c)},
getEntry:function(a,b){var c=d.canonicalUrl(a),e=d.scripts[c];e||(e=d.create(a,c,b));return e},processRequest:function(a,b){a.loadEntries(b)},load:function(a){a=new k(a);if(a.sync||d.syncMode)return d.loadSync(a);d.currentRequest?(a.getEntries(),d.suspendedQueue.push(a)):(d.currentRequest=a,d.processRequest(a,!1));return d},loadSync:function(a){a=new k(a);d.syncMode++;d.processRequest(a,!0);d.syncMode--;return d},loadBasePrefix:function(a){a=new k(a);a.prependBaseUrl=!0;return d.load(a)},loadSyncBasePrefix:function(a){a=
new k(a);a.prependBaseUrl=!0;return d.loadSync(a)},requestComplete:function(a){if(d.currentRequest===a)for(d.currentRequest=null;0<d.suspendedQueue.length;)if(a=d.suspendedQueue.shift(),!a.done){d.load(a);break}!d.currentRequest&&0==d.suspendedQueue.length&&d.fireListeners()},isLoading:function(){return!d.currentRequest&&0==d.suspendedQueue.length},fireListeners:function(){for(var a;d.isLoading()&&(a=d.listeners.shift());)a()},onBootReady:function(a){d.isLoading()?d.listeners.push(a):a()},getPathsFromIndexes:function(a,
b){return k.prototype.getPathsFromIndexes(a,b)},createLoadOrderMap:function(a){return k.prototype.createLoadOrderMap(a)},fetch:function(a,b,c,e){e=void 0===e?!!b:e;var d=new XMLHttpRequest,l,g,f,h=!1,j=function(){d&&4==d.readyState&&(g=1223===d.status?204:0===d.status&&("file:"===(self.location||{}).protocol||"ionp:"===(self.location||{}).protocol)?200:d.status,f=d.responseText,l={content:f,status:g,exception:h},b&&b.call(c,l),d=null)};e&&(d.onreadystatechange=j);try{d.open("GET",a,e),d.send(null)}catch(k){return h=
k,j(),l}e||j();return l},notifyAll:function(a){a.notifyRequests()}};k.prototype={$isRequest:!0,createLoadOrderMap:function(a){var b=a.length,c={},e,d;for(e=0;e<b;e++)d=a[e],c[d.path]=d;return c},getLoadIndexes:function(a,b,c,e,m){var l=c[a],g,f,h,j,k;if(b[a])return b;b[a]=!0;for(a=!1;!a;){h=!1;for(j in b)if(b.hasOwnProperty(j)&&(l=c[j]))if(f=this.prepareUrl(l.path),f=d.getEntry(f),!m||!f||!f.done){f=l.requires;e&&l.uses&&(f=f.concat(l.uses));l=f.length;for(g=0;g<l;g++)k=f[g],b[k]||(h=b[k]=!0)}h||
(a=!0)}return b},getPathsFromIndexes:function(a,b){var c=[],e=[],d,f;for(d in a)a.hasOwnProperty(d)&&a[d]&&c.push(d);c.sort(function(a,b){return a-b});d=c.length;for(f=0;f<d;f++)e.push(b[c[f]].path);return e},expandUrl:function(a,b,c,e){"string"==typeof a&&(a=[a]);var d=this.loadOrder,f=this.loadOrderMap;if(d){this.loadOrderMap=f=f||this.createLoadOrderMap(d);b=b||{};var g=a.length,h=[],j,k;for(j=0;j<g;j++)(k=f[a[j]])?this.getLoadIndexes(k.idx,b,d,c,e):h.push(a[j]);return this.getPathsFromIndexes(b,
d).concat(h)}return a},expandUrls:function(a,b){"string"==typeof a&&(a=[a]);var c=[],d={},f,l=a.length,g,h,j,k;for(g=0;g<l;g++){f=this.expandUrl(a[g],{},b,!0);h=0;for(j=f.length;h<j;h++)k=f[h],d[k]||(d[k]=!0,c.push(k))}0==c.length&&(c=a);return c},expandLoadOrder:function(){var a=this.urls,b;this.expanded?b=a:(b=this.expandUrls(a,!0),this.expanded=!0);this.urls=b;a.length!=b.length&&(this.sequential=!0);return this},getUrls:function(){this.expandLoadOrder();return this.urls},prepareUrl:function(a){return this.prependBaseUrl?
d.baseUrl+a:a},getEntries:function(){var a=this.entries,b,c,e;if(!a){a=[];e=this.getUrls();for(b=0;b<e.length;b++)c=this.prepareUrl(e[b]),c=d.getEntry(c,{buster:this.buster,charset:this.charset}),c.requests.push(this),a.push(c);this.entries=a}return a},loadEntries:function(a){var b=this,c=b.getEntries(),d=c.length,f=b.loadStart||0,h,g;void 0!==a&&(b.sync=a);b.loaded=b.loaded||0;b.loading=b.loading||d;for(g=f;g<d;g++)if(h=c[g],f=h.loaded?!0:c[g].load(b.sync),!f){b.loadStart=g;h.onDone(function(){b.loadEntries(a)});
break}b.processLoadedEntries()},processLoadedEntries:function(){var a=this.getEntries(),b=a.length,c=this.startIndex||0,d;if(!this.done){for(;c<b;c++){d=a[c];if(!d.loaded){this.startIndex=c;return}d.evaluated||d.evaluate();d.error&&(this.error=!0)}this.notify()}},notify:function(){var a=this;if(!a.done){var b=a.error,c=a[b?"failure":"success"],b="delay"in a?a.delay:b?1:d.config.chainDelay,e=a.scope||a;a.done=!0;c&&(0===b||0<b?setTimeout(function(){c.call(e,a)},b):c.call(e,a));a.fireListeners();d.requestComplete(a)}},
onDone:function(a){var b=this.listeners||(this.listeners=[]);this.done?a(this):b.push(a)},fireListeners:function(){var a=this.listeners,b;if(a)for(;b=a.shift();)b(this)}};r.prototype={$isEntry:!0,done:!1,evaluated:!1,loaded:!1,isCrossDomain:function(){void 0===this.crossDomain&&(this.crossDomain=0!==this.getLoadUrl().indexOf(d.origin));return this.crossDomain},isCss:function(){void 0===this.css&&(this.css=this.url&&v.test(this.url));return this.css},getElement:function(a){var b=this.el;b||(this.isCss()?
(a=a||"link",b=h.createElement(a),"link"==a?(b.rel="stylesheet",this.prop="href"):this.prop="textContent",b.type="text/css"):(b=h.createElement(a||"script"),b.type="text/javascript",this.prop="src",d.hasAsync&&(b.async=!1)),this.el=b);return b},getLoadUrl:function(){var a=d.canonicalUrl(this.url);this.loadUrl||(this.loadUrl=this.buster?a+(-1===a.indexOf("?")?"?":"\x26")+this.buster:a);return this.loadUrl},fetch:function(a){var b=this.getLoadUrl();d.fetch(b,a.complete,this,!!a.async)},onContentLoaded:function(a){var b=
a.status,c=a.content;a=a.exception;this.getLoadUrl();this.loaded=!0;(a||0===b)&&!s.phantom?this.evaluated=this.error=!0:200<=b&&300>b||304===b||s.phantom||0===b&&0<c.length?this.content=c:this.evaluated=this.error=!0},createLoadElement:function(a){var b=this,c=b.getElement();b.preserve=!0;c.onerror=function(){b.error=!0;a&&a()};d.hasReadyState?c.onreadystatechange=function(){("loaded"===this.readyState||"complete"===this.readyState)&&a&&a()}:c.onload=a;c[b.prop]=b.getLoadUrl()},onLoadElementReady:function(){d.getHead().appendChild(this.getElement());
this.evaluated=!0},inject:function(a){var b=d.getHead(),c=this.url,e=this.key,f,j;this.isCss()?(this.preserve=!0,j=e.substring(0,e.lastIndexOf("/")+1),f=h.createElement("base"),f.href=j,b.firstChild?b.insertBefore(f,b.firstChild):b.appendChild(f),f.href=f.href,c&&(a+="\n/*# sourceURL\x3d"+e+" */"),c=this.getElement("style"),e="styleSheet"in c,b.appendChild(f),e?(b.appendChild(c),c.styleSheet.cssText=a):(c.textContent=a,b.appendChild(c)),b.removeChild(f)):(c&&(a+="\n//# sourceURL\x3d"+e),Ext.globalEval(a));
return this},loadCrossDomain:function(){var a=this,b=function(){a.loaded=a.evaluated=a.done=!0;a.notifyRequests()};if(a.isCss())a.createLoadElement(),a.evaluateLoadElement(),b();else return a.createLoadElement(function(){b()}),a.evaluateLoadElement(),!1;return!0},loadElement:function(){var a=this;if(a.isCss())return a.loadCrossDomain();a.createLoadElement(function(){a.loaded=a.evaluated=a.done=!0;a.notifyRequests()});a.evaluateLoadElement();return!0},loadSync:function(){var a=this;a.fetch({async:!1,
complete:function(b){a.onContentLoaded(b)}});a.evaluate();a.notifyRequests()},load:function(a){var b=this;if(!b.loaded){if(b.loading)return!1;b.loading=!0;if(a)b.loadSync();else{if(b.isCrossDomain())return b.loadCrossDomain();if(!b.isCss()&&d.hasReadyState)b.createLoadElement(function(){b.loaded=!0;b.notifyRequests()});else{if(d.useElements)return b.loadElement();b.fetch({async:!a,complete:function(a){b.onContentLoaded(a);b.notifyRequests()}})}}}return!0},evaluateContent:function(){this.inject(this.content);
this.content=null},evaluateLoadElement:function(){d.getHead().appendChild(this.getElement())},evaluate:function(){!this.evaluated&&!this.evaluating&&(this.evaluating=!0,void 0!==this.content?this.evaluateContent():this.error||this.evaluateLoadElement(),this.evaluated=this.done=!0,this.cleanup())},cleanup:function(){var a=this.el,b;if(a){if(!this.preserve)for(b in this.el=null,a.parentNode.removeChild(a),a)try{b!==this.prop&&(a[b]=null),delete a[b]}catch(c){}a.onload=a.onerror=a.onreadystatechange=
j}},notifyRequests:function(){var a=this.requests,b=a.length,c,d;for(c=0;c<b;c++)d=a[c],d.processLoadedEntries();this.done&&this.fireListeners()},onDone:function(a){var b=this.listeners||(this.listeners=[]);this.done?a(this):b.push(a)},fireListeners:function(){var a=this.listeners,b;if(a&&0<a.length)for(;b=a.shift();)b(this)}};Ext.disableCacheBuster=function(a,b){var c=new Date;c.setTime(c.getTime()+864E5*(a?3650:-1));c=c.toGMTString();h.cookie="ext-cache\x3d1; expires\x3d"+c+"; path\x3d"+(b||"/")};
d.init();return d}(function(){});Ext.globalEval=Ext.globalEval||(this.execScript?function(j){execScript(j)}:function(j){eval.call(window,j)});Function.prototype.bind||function(){var j=Array.prototype.slice,k=function(k){var h=j.call(arguments,1),f=this;if(h.length)return function(){var t=arguments;return f.apply(k,t.length?h.concat(j.call(t)):h)};h=null;return function(){return f.apply(k,arguments)}};Function.prototype.bind=k;k.$extjs=!0}();Ext=Ext||window.Ext||{};
Ext.Microloader=Ext.Microloader||function(){var j=Ext.Boot,k=[],r=!1,h={detectPlatformTags:function(){Ext.beforeLoad&&Ext.beforeLoad(Ext.platformTags)},initPlatformTags:function(){h.detectPlatformTags()},init:function(){h.initPlatformTags();var f=Ext._beforereadyhandler;Ext._beforereadyhandler=function(){Ext.Boot!==j&&(Ext.apply(Ext.Boot,j),Ext.Boot=j);f&&f()}},run:function(){h.init();var f=Ext.manifest;if("string"===typeof f){var k=f.indexOf(".json")===f.length-5?f:f+".json";j.fetch(k,function(j){f=
Ext.manifest=JSON.parse(j.content);h.load(f)})}else h.load(f)},load:function(f){var k=f.loadOrder,v=k?j.createLoadOrderMap(k):null,u=[],q=f.js||[],s=f.css||[],n,p=function(){r=!0;h.notify()};k&&(f.loadOrderMap=v);for(var d=s.concat(q),s=d.length,q=0;q<s;q++)f=d[q],n=!0,f.platform&&!j.filterPlatform(f.platform)&&(n=!1),n&&u.push(f.path);j.load({url:u,loadOrder:k,loadOrderMap:v,sequential:!0,success:p,failure:p})},onMicroloaderReady:function(f){r?f():k.push(f)},notify:function(){for(var f;f=k.shift();)f()}};
return h}();Ext.manifest=Ext.manifest||"bootstrap";Ext.Microloader.run();</script>

    <script type="text/javascript" >
        // ToString("r") - We are using this standard date-time format for all PPI dates.
        var serverTodayDate = "<%#DateTime.Now.ToUniversalTime().ToString("r") %>";
        var serverTimeformat = "<%#UIUtility.GetServerDateFormat()%>";
        var ReDirectUrl = "<%#HTTPUtilities.GetApplicationPath("default.aspx?timedout=1")%>";
        var logOffUrl = "<%#HTTPUtilities.GetApplicationPath("thankyou.aspx")%>";
        var HandlerUrl = "<%#HTTPUtilities.GetApplicationPath("Include/GetSessionValue.ashx")%>";

        DefaultSessionTimeout = "<%#Session.TimeOut%>";
        function checkNameTextLength(field){
            if(field.innerText.length > 255)
            {
               return false;
            }
        }
    </script>
   
    <script id="revision-history-template" type="text/x-handlebars-template">
            {{#each revisions}}
                <div class="revision-history-tile">
                    <div class="revision-history-img action-name" >
                        {{#if isBM}}
                            <img id="action-image" src="./resources/images/system-revision-history.png" title="{{ActionString}}"/>   
                        {{else}}
                            <img id="action-image" src="./resources/images/user.png" title="{{ActionString}}"/>   
                        {{/if}}
                    </div>
                    <div class="revision-info">
                            <div class="user-name"> {{UserId}}</div>
                            <div class="time-stamp"> {{Timestamp}}</div>
                   </div>
                   <div class="revision-history-img restore"  id="revision-history-{{RevisionId}}">
                        <img src="./resources/images/refresh.png" title="{{restoreRevsionTooltip}}"  />
                    </div>                
                </div>
            {{/each}}
    </script>    

</head>
<body runat="server" >
   <!-- elements used to keep session alive issue in PPI-->
    <form id="form_SessionAlive">
        <input type="hidden" id="defaultSessionTimeout" name="defaultSessionTimeout" value=""/>
        <div id='div_iframe'></div>
    </form>


    <div id="fade" style="display: none;"></div>
    <div id="modal" style="display: none;">
            <img id="loader" src="./resources/images/loading-animation2.gif" />
    </div>
    <div id="templates" style="display: none">
        <div class="page-header-top">
            <div class="page-header-center">
               <!--  <span>Project Name: </span> -->
                <span class="title"><b></b></span>
            </div>
            <div class="page-header-right">
             <div class="revisionHistoryImg toolbar-img">
                        </div>
                <div class="settings">
                    <div class="btn-group setting-group">
                        <div id="calendar-button" class="requires-write calendarIcon">
                            <img class="requires-write calendarIcon"src="./resources/images/Calendar.png"/>
                        </div>
                        <div id="settings-button" class="requires-write">
                            <img class="requires-write "src="./resources/images/settings.png"/>
                        </div>
                    </div>
                </div>
                <div class="btn-group input-group" role="group">
                    <button id="checkin" data-resx-key = "CHECKIN_Key" class="checkin-btn btn button-text">Check-In</button>
                    <div id="checkindropdown" class="btn dropdown-caret">
                        <img src="./resources/images/arrow.png"/></div>
                    <div class="tool-popup checkin-popup"></div> 
                    <button id="checkout" data-resx-key = "Checkout_Key" class="checkout-btn btn button-text">Check-Out</button>
                    <button id="download" data-resx-key = "Download_Key" class="download-btn btn button-text">Download</button>
                    <button id="save"  data-resx-key = "Save_Key" class="save-btn btn button-text requires-write">Save   </button>
                    <div id="savedropdown" class="btn dropdown-caret requires-write">
                        <img src="./resources/images/arrow.png"/></div>
                    <div class="tool-popup save-popup"></div>   
                </div>
                <div class="help">
                    <div class="btn-group">
                        <a target="_blank" href="help.html"><div id="help-button">
                            <img class="requires-write "src="./resources/images/help.png"/>
                        </div></a>
                    </div>
                </div>
            </div>
            <div id='page-header-notifier' class="page-header-notifier">
                <span></span>
            </div>
        </div>
        <div class="page-header">
            <div class="page-header-toolbar-top">
                <div class="view-selector">
                    <div class="view-selector-buttons btn-group" role="group" aria-label="Plan">
                        <button class="matrix-view-btn btn btn-primary"></button>
                        <button class="timeline-view-btn btn"></button>
                        <button class="table-view-btn btn"></button>
                    </div>
                </div>
                <div class="highlight btn-group">
                        <button data-resx-key = "HIGHLIGHT_Key" class="btn button-text">Highlight : </button>
                        <div class="btn dropdown-caret"><img src="./resources/images/arrow.png"/></div>
                        <div class="tool-popup highlight-popup"></div>
                        <!-- <div class="tool-popup highlight-resources-popup"></div> -->
                </div>
                <div class="planningmode-selector-buttons btn-group" role="group" aria-label="Plan">
                        <button id="planMode" data-resx-key = "PLAN_Key" class="plan-mode-btn btn active btn-primary">Plan</button>
                        <button id="replanMode" data-resx-key = "REPLAN_Key" class="replan-mode-btn btn">Replan</button>
                </div>
                
                
                <div class="plan-buttons btn-group" role="group" aria-label="Plan">
                    <button id="identifyCC" data-resx-key = "IDENTIFYCC_Key"  class="button btn requires-write">Identify CC</button>
                    <button id="ccSummary" data-resx-key = "CCSUMMARY_Key" class="button btn disabled" disabled>CC Summary</button>
                    <!--button id="acceptPlan" data-resx-key = "ACCEPTPLAN_Key" class="button btn disabled requires-write" disabled>Accept Plan</button-->
                </div>
                <div class="replan-buttons btn-group" role="group" aria-label="Replan" style="display:none;">
                    <!--<button id="checkBufferImpact" class="button btn requires-write">Buffer Impact</button>-->
                    <button id="redoCCFB" data-resx-key = "REDOCC_Key" class="button btn requires-write" >Redo CC</button>
                    <button id="bufferSummary"  data-resx-key = "BUFFERSUMMARY_Key" class="button btn disabled" disabled>Buffer Summary</button>
                </div>
                <div class="btn-group" role="group" aria-label="AcceptPlan">
                    <button id="acceptPlan" data-resx-key = "ACCEPTPLAN_Key" class="button btn disabled requires-write" disabled>Accept Plan</button>
                </div>
                <div class="remove-buffers btn-group " role="group"  aria-label="RemoveBuffers">
                    <button id="undoCCAB"  class="remove-buffers-btn  btn disabled requires-write" disabled></button>
                    <!-- <button id="undoCCAB" data-resx-key = "REMOVEBUFFERS_Key" class="remove-buffers-btn button btn disabled requires-write" disabled></button> -->
                  <!--  <div id="undoCCAB"  class="button  disabled requires-write RBIcon-btn toolbar-img" disabled></div> -->
                </div>  
               
        </div>  

         <div class="page-header-toolbar-center">
            <!-- <div class="page-header-toolbar-separator" ></div> -->
                    <div class="create-task-buttons" role="group" aria-label="CreateTaskTypes">
                            <div class="PEIcon-btn toolbar-img ">
                            </div>
                            <!-- <div class="PPIcon-btn toolbar-img ">
                            </div> -->
                            <div class="CMSIcon-btn toolbar-img ">
                            </div>
                            <div class="IMSIcon-btn toolbar-img ">
                            </div>
                            <div class="FKIcon-btn toolbar-img  ">
                           <!--  </div>
                             <div class="normalTaskIcon-btn toolbar-img  selected"> -->
                            </div>
                    </div> 
                    </div>         
            

            <div class="page-header-toolbar-right">
                <div class="view-controls btn-group"> 
                    <div class="show-hide-panels">
                        <div class="milestoneSheet toolbar-img">
                        </div>
                        <div class="errorWarningSheet toolbar-img">
                        </div>
                        <div class="resourceSheet toolbar-img">
                        </div>
                        <div class="toggle-links-button toolbar-img pressed">
                        </div>
                       
                    </div>
                    <div class="zoom-controls">
                        <div class="zoom-button zoom-out">
                            <div class="zoom-icon toolbar-img"></div>
                        </div>
                        <div class="zoom-button zoom-in">
                            <div class="zoom-icon toolbar-img"></div>
                        </div>
                    </div>
                    <div class="matrix-view-task-alignment">
                        <div class="task-align-left task-align-option toolbar-img pressed" data-alignment="left"></div>
                        <div class="task-align-right task-align-option toolbar-img" data-alignment="right"></div>
                    </div>
                </div>
                <div style="clear: both;"></div>
            </div>
        </div>

        <div class="matrix-view" data-zoom-level="2" role="matrix-view-template">
        </div>

        <div class="matrix-view-inner" role="matrix-view-inner-template">
            <div class="matrix-view-row header-row">
                <div class="phase-column phase-column-header">
                    <div class="phase-column-header-inner">
                        <span class="phase-name"></span>
                        <div class="dropdown-menu-caret">&or;</div>
                        <div class="tool-popup below align-right">
                            <div data-resx-key  = "INSERTPHASEBEFORE_Key" data-cmd="insert-phase-before" class="tool-item tool-item-insert-phase-before">Insert phase before</div>
                            <div data-resx-key  = "INSERTPHASEAFTER_Key" data-cmd="insert-phase-after" class="tool-item tool-hidden-for-fullkit">Insert phase after</div>
                            <div data-resx-key  = "INSERTMILESTONEAFTER_Key" data-cmd="insert-milestone-after" class="tool-item tool-item-insert-milestone-after tool-hidden-for-milestone tool-hidden-for-fullkit">Insert milestone after</div>
                            <div data-resx-key  = "INSERTFULLKITBEFORE_Key" data-cmd="insert-fullkit-before" class="tool-item tool-item-insert-fullkit-before tool-hidden-for-milestone tool-hidden-for-fullkit">Insert full-kit before</div>
                            <div data-resx-key  = "DELETEPHASE_Key" data-cmd="delete-phase" class="tool-item tool-item-delete-phase">Remove phase</div>
                            <div data-resx-key  = "PHASELEVELTASKPROPERTIES_Key" data-cmd="phase-level-task-properties" class="tool-item tool-item-phase-task-properties">Set task properties</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="matrix-view-end-marker"></div>
        </div>

        <div class="matrix-view-row" role="row-template">
            <!--div class="tree-column">
                <!-- <div class="tree-icon"></div> -->
                <!--div class="scope-item-label"></div>
                <div class="dropdown-menu-caret">&or;</div>
                <div class="tool-popup below align-right">                
                    <div data-resx-key = "INSERTROWABOVE_Key" data-cmd="insert-row-above" class="tool-item tool-item-insert-row-above">Insert row above</div>
                    <div data-resx-key = "INSERTROWBELOW_key" data-cmd="insert-row-below" class="tool-item tool-item-insert-row-below">Insert row below</div>
                    <div data-resx-key = "DELETEROW_Key" data-cmd="delete-row" class="tool-item tool-item-delete-row">Remove row</div>
                </div>
            </div-->
            <div class="phase-column hidden-title" role="phase-column-cell">
                <div class="task-placeholder"><img src="./resources/images/add-task.png"/></div>
            </div>
        </div>

        <div class="task" role="task-template">
            <div class="add-task-plus-icon"></div>
            <div class="task-name-overflow-edit" contenteditable="true" onkeydown="checkNameTextLength(this)" onkeypress="return (this.innerText.length < 255)"></div>
            <div class="task-content-wrapper">
                <div class="task-color"></div>
                <div class="remaining-subtasks-indicator"></div>
                <div class="task-name">
                    <div class="date-range-indicator"></div>
                    <div class="drag-drop-handle"></div>
                    <!--<div class="status-indicator status-indicator-NS"></div>
                    <div class="status-indicator status-indicator-IP"></div>
                    <div class="status-indicator status-indicator-RL"></div>
                    <div class="status-indicator status-indicator-CO"></div>-->                   
                    <input type="text" value="" maxlength="255"/>
                    <div class="task-controls">
                        <div class="task-magnify-button"></div>
                    </div>
                </div>
                <div class="task-properties">
                    <div class="task-dates">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION">
                        </label> 
                        <input type="text" class="task-duration" value=""/>
                    </div>
                    <div class="task-checklist-icon"></div>
                    <div class="task-needDate" >
                        <div class="needDate">
                            <label data-columns-key ="FK_PANEL_NEED_DATE">
                        </label> 
                            <input type="text" disabled="disabled" value=""/>
                        </div>
                    </div>
                    <div class="task-expectedFinishDate" >
                        <div class="expectedFinishDate">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE">
                        </label>
                            <input type="text"  value=""/>
                        </div>
                    </div>
                    <div class="fk-pullInFullKitDateBy" >
                         <label data-columns-key ="FK_PANEL_PULL_IN_OFFSET">
                        </label>
                        <div class="pullInFullKitDateBy">
                            <input type="text"  value=""/>
                        </div>
                    </div>
                    <div class="task-resources">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST"></label> 
                        <span class="input-field" />
                    </div>
                    <div class="task-status">
                       <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_STATUS"></label> 
                            <select>
                                <option  data-filtername-key = "NotStartedFilterName"  value="NS">Not started</option>
                                <option  data-filtername-key = "InProgressFilterName"  value="IP">In progress</option>
                                <option  data-filtername-key = "ReleasedFilterName"     value="RL">Released</option>
                                <option  data-filtername-key = "CompletedFilterName"    value="CO">Completed</option> 
                            </select>
                       
                    </div>
                    <div class="task-manager">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID"></label> 
                        <input type="text" value=""> </input>
                    </div>
                    <div class="task-participants">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES"></label>
                        <input type="text" value="" />
                    </div>
                    
                    <div class="task-type">
                        <label data-columns-key ='SPI_COLUMNS_AND_LABELS_TASK_TYPE'></label>
                        <select>
                            <option data-resx-key = "NORMAL_Key"        value="normal">Normal</option>
                            <option data-resx-key = "PURCHASING_Key"    value="purchasing">Purchasing</option>
                            <option data-resx-key = "SNET_Key"          value="snet">SNET</option>
                           <!--  <option data-resx-key = "IMS_TITLE_Key"     value="IMS">IMS</option> -->
                        </select>
                    </div>
                    <div class="task-specific-properties task-specific-properties-snet">
                        <div class="snet">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_SNET_DATE"></label> 
                            <input placeholder="Select Date..."></input>
                        </div>
                    </div>
                    
                    <div class="fk-autolink">
                        <input type="checkbox" name="autolink" value="autolink" checked/>       <label data-resx-key ="AUTOLINK_Key" data-add-colon='false'></label> 
                    </div>
                    <span class="extended-properties-trigger">&or;</span>
                </div>
                <div class="subtasks">
                    <div class="subtasks-header">
                        <div class="subtask-header-delete-subtask"></div>
                        <div class="subtask-header-status"></div>
                        <!--  <div class="drag-handle"></div> -->
                        <div class="subtask-header-name"></div>
                        <div class="subtask-header-checklist-icon"></div>
                        <div class="subtask-header-duration">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_REMAINING_DURATION" data-add-colon='false'></label>
                        </div>
                        <div class="subtask-header-resources">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST" data-add-colon='false'></label>
                        </div>
                        <div class="subtask-header-owner">
                            <label data-columns-key ="SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID" data-add-colon='false'></label>
                        </div>
                        <!-- <div class="subtask-header-participants">Participants</div> -->
                    </div>
                    <ul class="sortable list">
                        <li class="subtask proto-subtask" data-role="subtask-template">
                            <div class="delete-subtask" >X</div>
                            <div class="subtask-status"></div>
                            <!--  <div class="drag-handle"></div> -->
                            <div class="subtask-name editable-field"><input type="text" data-placeholder-key="Subtask_PlaceHolder_Key" value="" />
                            </div>
                            <!-- <div class="subtask-checklist-icon"><img src="./resources/images/checklistnone.gif"/></div> -->
                            <div class="subtask-checklist-icon"></div>
                            <div class="subtask-duration editable-field"><input type="text" value="" /></div>
                            <div class="subtask-resources"></div>
                            <div class="subtask-owner editable-field sl-editable-resource"></div>
                          
                        </li>
                    </ul>
                    
                </div>
                <div class="task-footer">
                    <div class="task-id" >
                         <label id='task-id-label' data-columns-key ="SPI_COLUMNS_AND_LABELS_MSP_TASK_ID"></label>
                        <label id='task-id-value' value =""></label>
                    </div>

                    <div class="WIP_Limit_Div" style="display:none;">
                        <label data-columns-key ="SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION"></label>
                        <input type="text" class="WIP_Limit_textbox" value="" maxlength="5"/>

                    </div>

                    <div class="subtask-type">
                        <label data-columns-key="SPI_COLUMNS_AND_LABELS_ROLL_UP_DURATION"></label>
                        <select id = 'task-subtask-type-select'>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL" data-add-colon='false' value="1">Sequential</option>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL" data-add-colon='false' value="4">Parallel</option>
                            <option data-columns-key = "SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP" data-add-colon='false' value="3">WIP</option>
                        </select>
                        <input id = 'task-wip-limt-txt' type="text" class="WIP_Limit_textbox" style="display:none;" data-placeholder-key="WIP_LIMIT_Key" maxlength="5" />
                        <img id="imgWIPExceeded" class="imgWIP" src="./resources/images/exclamation.gif" style="display:none;" /> 
                    </div>
                    <!-- 
                        Subtasks Types not being used
                        <div class="subtask-specific-property subtask-specific-property-volume">
                            <label data-resx-key ="Rate:"></label> 
                            <input class="volume" type="text" placeholder="enter rate" />
                        </div>
                        <div class="subtask-specific-property subtask-specific-property-wip">
                             <label data-resx-key ="Wip Limit:"></label> 
                              <input class="wip-limit" type="text" placeholder="enter wip limit" />
                        </div>
                        <div class="subtask-specific-property subtask-specific-property-resource">
                            <label data-resx-key ="unit:"></label> 
                             <input class="wip-limit" type="text" placeholder="enter units" />
                        </div>

                    -->
                    <div data-resx-key = "Delete_Task_Key" class="delete-task-button">Delete</div>
                    <div data-resx-key = "OK_BUTTON_Key" class="ok-task-button">OK</div>
                </div>
            </div>
            <!-- <div class="task-header-arrow-border"></div> -->
            <div class="task-header-arrow"></div>
            <div class="tool-popup below">
                <div data-cmd="delete-fullkitTask"      data-resx-key = "DELETE_FULLKIT_Key" 
                class="tool-item tool-item-delete-milestone">Delete Fullkit</div>
                <div data-cmd="edit-fullkit-checklist"  data-resx-key = "EDIT_CHECKLIST_Key" 
                class="tool-item tool-item-edit-milestone">Edit Checklist</div>
                <div data-cmd="highlight-immediate-predecessors-for-fullkit" data-resx-key = "HIGHLIGHT_IMMEDIATE_PREDECESSOR_Key" class="tool-item tool-item-highlight-predecessors">Immediate Predecessor</div>
                <div data-cmd="highlight-all-predecessors-for-fullkit"  data-resx-key = "HIGHLIGHT_ALL_PREDECESSORS_Key" 
                class="tool-item tool-item-highlight-predecessors">All Predecessors</div>
                <div data-cmd="highlight-longest-predecessor-chain-for-fullkit"                                                        data-resx-key = "HIGHLIGHT_LONGEST_PREDECESSOR_CHAIN_key" 
                class="tool-item tool-item-highlight-longest-predecessor-chain">Longest Predecessor Chain</div>
             </div>
        </div>
          <div class="milestone ms" role="ms-template">
              <div class="add-task-plus-icon"></div> 
              <div class="ms-content-wrap">  
                    <div class="ms-icon">
                    <div class="milestone-icon-wrap">
                        <div class="milestone-icon"></div>
                        </div>
                        <div class="milestone-name"></div>
                        <div class="milestone-color" ></div>
                    </div>
                    
                    <div class="task-name-overflow-edit" contenteditable="true" onkeydown="checkNameTextLength(this)" onkeypress="return (this.innerText.length < 255)"></div>
                    <div class="task-content-wrapper" style="display: none">
                    <div class="milestone-quick-edit-color"></div>
                    <div class="task-name">
                        <div class="date-range-indicator"></div>
                        <div class="drag-drop-handle"></div>
                        <!--<div class="status-indicator status-indicator-NS"></div>
                        <div class="status-indicator status-indicator-IP"></div>
                        <div class="status-indicator status-indicator-CO"></div>-->
                        <input type="text" value="" maxlength="255"/>
                    </div>
                    <div class="task-properties">
                        <div class="task-type">
                            <label data-columns-key ="MILESTONE_PANEL_MILESTONE_TYPE"></label> 
                                <select>
                                    <option data-resx-key = "CMS_TITLE_Key"  value="CMS">CMS</option>
                                    <option data-resx-key = "IMS_TITLE_Key"  value="IMS">IMS</option>
                                    <option data-resx-key = "PE_TITLE_Key"  value="PE">PE</option>
                                    <!-- <option data-resx-key = "PP_TITLE_Key"  value="NONE">PP</option> -->
                                </select>
                            
                        </div>
                        <div class="task-checklist-icon"></div>
                        <div class="task-dates">
                            <div class="duedate">
                                 <label data-columns-key ="MILESTONE_PANEL_MS_DUE_DATE"></label> 
                                <input type="text" value=""/>
                            </div>
                        </div>
                    
                        <div class="task-status">
                            <label>Status: 
                                <select>
                                    <option value="NS">Not started</option>
                                    <option value="CO">Completed</option>
                                </select>
                            </label>
                        </div>
                        <div class="ms-autolink">
                            <input type="checkbox" name="autolink" value="autolink" checked/>  <label data-resx-key ="AUTOLINK_Key" data-add-colon='false'></label> 
                        </div>
                    
                    
                    </div>
                    <div class="task-footer">
                        <div class="task-id" >
                            <label id='task-id-label' data-columns-key ="SPI_COLUMNS_AND_LABELS_MSP_TASK_ID"></label>
                                <label id='task-id-value' value =""></label>
                        </div>
                    
                        <div data-resx-key = "Delete_Task_Key" class="delete-task-button">Delete</div>
                        <div data-resx-key = "OK_BUTTON_Key" class="ok-task-button">OK</div>
                    </div>
                    <div class="task-header-arrow"></div>
                </div>
            </div>
            
        </div>

        <div class="milestone" role="milestone-template">
            <div class="milestone-icon-wrap">
                <div class="milestone-icon"></div>
            </div>
            <div class="milestone-color" ></div>



            <div class="milestone-name"></div>
            <div class="tool-popup below">
                <div data-cmd="delete-milestone"    data-resx-key = "REMOVE_MILESTONE_Key" 
                class="tool-item tool-item-delete-milestone">Remove Milestone</div>
                <div data-cmd="edit-milestone"      data-resx-key = "EDIT_MILESTONE_Key" 
                class="tool-item tool-item-edit-milestone">Edit Milestone</div>
                <div data-cmd="view-checklist"      data-resx-key = "VIEW_CHECKLIST_Key" 
                class="tool-item tool-item-view-checklist">View Checklist</div>
                <div data-cmd="convert-to-CMS"      data-resx-key = "CHANGE_TO_CMS_Key" 
                class="tool-item tool-item-convert-to-CMS">Change to CMS</div>
                <div data-cmd="convert-to-IMS"      data-resx-key = "CHANGE_TO_IMS_key" 
                class="tool-item tool-item-convert-to-IMS">Change to IMS</div>
                <div data-cmd="convert-to-PE"      data-resx-key = "CHANGE_TO_PE_Key" 
                class="tool-item tool-item-convert-to-PE">Change to PE</div>
               <!--  <div data-cmd="convert-to-PP"       data-resx-key = "CHANGE_TO_PP_Key"
                class="tool-item tool-item-convert-to-PP">Change to PP</div> -->
                <div data-cmd="highlight-immediate-predecessors"    data-resx-key = "HIGHLIGHT_IMMEDIATE_PREDECESSOR_Key" 
                class="tool-item tool-item-highlight-imm-predecessors">Highlight Immediate Predecessor</div>
                <div data-cmd="highlight-all-predecessors"          data-resx-key = "HIGHLIGHT_ALL_PREDECESSORS_Key" 
                class="tool-item tool-item-highlight-all-predecessors">Highlight All Predecessors</div>
                <div data-cmd="highlight-longest-predecessor-chain" data-resx-key = "HIGHLIGHT_LONGEST_PREDECESSOR_CHAIN_key"
                class="tool-item tool-item-highlight-longest-predecessor-chain">Highlight Longest Predecessor Chain</div>
            </div>
        </div>

    </div>
    <div class="revision-history-parent-panel" style="display:none">
        <div  class="revision-history-heading">
                <Label data-resx-key = "REVISION_HISTORY_Key"> Revision History </Label>
                <div class="revision-history-close" >
                    x
                </div>

                
        </div>
        <div class="revision-history-content"></div>

        <div class="revision-history-footer">
            <div class="revision-history-less-detailed" data-resx-key = "SHOW_MORE_DETAILED_VERSIONS_Key">Show more detailed versions</div>
        </div>
        </div>
    </div>

    <iframe id="download_iframe" style="display:none;"/>
</body>
</html>
