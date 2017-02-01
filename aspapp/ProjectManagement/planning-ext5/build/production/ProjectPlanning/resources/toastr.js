(function(a){a(["jquery"],function(b){return(function(){var o;var d;var x=0;var c={error:"error",info:"info",success:"success",warning:"warning"};var v={clear:m,remove:w,error:q,getContainer:s,info:u,options:{},subscribe:h,success:f,version:"2.1.0",warning:p};var g;return v;function q(z,A,y){return l({type:c.error,iconClass:j().iconClasses.error,message:z,optionsOverride:y,title:A})}function s(y,z){if(!y){y=j()}o=b("#"+y.containerId);if(o.length){return o}if(z){o=e(y)}return o}function u(z,A,y){return l({type:c.info,iconClass:j().iconClasses.info,message:z,optionsOverride:y,title:A})}function h(y){d=y}function f(z,A,y){return l({type:c.success,iconClass:j().iconClasses.success,message:z,optionsOverride:y,title:A})}function p(z,A,y){return l({type:c.warning,iconClass:j().iconClasses.warning,message:z,optionsOverride:y,title:A})}function m(y){var z=j();if(!o){s(z)}if(!t(y,z)){n(z)}}function w(y){var z=j();if(!o){s(z)}if(y&&b(":focus",y).length===0){k(y);return}if(o.children().length){o.remove()}}function n(y){var A=o.children();for(var z=A.length-1;z>=0;z--){t(b(A[z]),y)}}function t(y,z){if(y&&b(":focus",y).length===0){y[z.hideMethod]({duration:z.hideDuration,easing:z.hideEasing,complete:function(){k(y)}});return true}return false}function e(y){o=b("<div/>").attr("id",y.containerId).addClass(y.positionClass).attr("aria-live","polite").attr("role","alert");o.appendTo(b(y.target));return o}function i(){return{tapToDismiss:true,toastClass:"toast",containerId:"toast-container",debug:false,showMethod:"fadeIn",showDuration:300,showEasing:"swing",onShown:undefined,hideMethod:"fadeOut",hideDuration:1000,hideEasing:"swing",onHidden:undefined,extendedTimeOut:1000,iconClasses:{error:"toast-error",info:"toast-info",success:"toast-success",warning:"toast-warning"},iconClass:"toast-info",positionClass:"toast-top-right",timeOut:5000,titleClass:"toast-title",messageClass:"toast-message",target:"body",closeHtml:'<button type="button">&times;</button>',newestOnTop:true,preventDuplicates:false,progressBar:false}}function r(y){if(!d){return}d(y)}function l(z){var M=j(),I=z.iconClass||M.iconClass;if(typeof(z.optionsOverride)!=="undefined"){M=b.extend(M,z.optionsOverride);I=z.optionsOverride.iconClass||I}if(M.preventDuplicates){if(z.message===g){return}else{g=z.message}}x++;o=s(M,true);var L=null,D=b("<div/>"),F=b("<div/>"),y=b("<div/>"),K=b("<div/>"),G=b(M.closeHtml),H={intervalId:null,hideEta:null,maxHideTime:null},E={toastId:x,state:"visible",startTime:new Date(),options:M,map:z};if(z.iconClass){D.addClass(M.toastClass).addClass(I)}if(z.title){F.append(z.title).addClass(M.titleClass);D.append(F)}if(z.message){y.append(z.message).addClass(M.messageClass);D.append(y)}if(M.closeButton){G.addClass("toast-close-button").attr("role","button");D.prepend(G)}if(M.progressBar){K.addClass("toast-progress");D.prepend(K)}D.hide();if(M.newestOnTop){o.prepend(D)}else{o.append(D)}D[M.showMethod]({duration:M.showDuration,easing:M.showEasing,complete:M.onShown});if(M.timeOut>0){L=setTimeout(C,M.timeOut);H.maxHideTime=parseFloat(M.timeOut);H.hideEta=new Date().getTime()+H.maxHideTime;if(M.progressBar){H.intervalId=setInterval(A,10)}}D.hover(B,J);if(!M.onclick&&M.tapToDismiss){D.click(C)}if(M.closeButton&&G){G.click(function(N){if(N.stopPropagation){N.stopPropagation()}else{if(N.cancelBubble!==undefined&&N.cancelBubble!==true){N.cancelBubble=true}}C(true)})}if(M.onclick){D.click(function(){M.onclick();C()})}r(E);if(M.debug&&console){console.log(E)}return D;function C(N){if(b(":focus",D).length&&!N){return}clearTimeout(H.intervalId);return D[M.hideMethod]({duration:M.hideDuration,easing:M.hideEasing,complete:function(){k(D);if(M.onHidden&&E.state!=="hidden"){M.onHidden()}E.state="hidden";E.endTime=new Date();r(E)}})}function J(){if(M.timeOut>0||M.extendedTimeOut>0){L=setTimeout(C,M.extendedTimeOut);H.maxHideTime=parseFloat(M.extendedTimeOut);H.hideEta=new Date().getTime()+H.maxHideTime}}function B(){clearTimeout(L);H.hideEta=0;D.stop(true,true)[M.showMethod]({duration:M.showDuration,easing:M.showEasing})}function A(){var N=((H.hideEta-(new Date().getTime()))/H.maxHideTime)*100;K.width(N+"%")}}function j(){return b.extend({},i(),v.options)}function k(y){if(!o){o=s()}if(y.is(":visible")){return}y.remove();y=null;if(o.children().length===0){o.remove();g=undefined}}})()})}(typeof define==="function"&&define.amd?define:function(b,a){if(typeof module!=="undefined"&&module.exports){module.exports=a(require("jquery"))}else{window.toastr=a(window.jQuery)}}));