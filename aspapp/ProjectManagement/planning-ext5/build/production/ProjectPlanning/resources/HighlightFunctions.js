function HighlightAllResources(d){var a=d.parent().find(".tool-item"),c=d.find("input").is(":checked");for(var b=1;b<a.length;b++){if(c){$(a[b]).find("input").prop("checked","checked")}else{$(a[b]).find("input").removeAttr("checked")}HighlightResources($(a[b]))}}function HighlightResources(g){var f=g.data("resource-id"),a=stl.app.ProjectDataFromServer.getResourceColorMap()[f],d=g.find("input").is(":checked");var b=[];var c=$(".matrix-view").find(".task.has-resource-"+f);var e=$(".timeline-view").find(".sch-event.has-resource-"+f);b.push(c);b.push(e);if(d){if(b){$.each(b,function(i,h){$(h).addClass("highlight-resource-"+a)})}}else{if(b){$.each(b,function(i,h){$(h).removeClass("highlight-resource-"+a)})}}if(c.length>0||e.length>0){updateLegend(d,a,g.find(".resource-name").text())}}function HighlightAllPhases(d){var a=d.parent().find(".tool-item"),c=d.find("input").is(":checked");for(var b=1;b<a.length;b++){if(c){$(a[b]).find("input").prop("checked","checked")}else{$(a[b]).find("input").removeAttr("checked")}HighlightPhases($(a[b]))}}function HighlightPhases(i){var d=i.data("phase-id"),g=stl.app.ProjectDataFromServer.getPhaseColorMap()[i.find(".phase-name").text()],c=i.find("input").is(":checked");var h=[];var f=stringToHex(stl.app.ProjectDataFromServer.getPhaseById(d).name.replace(/ /g,""));var a=$(".matrix-view").find(".has-phase-"+f);var e=$(".timeline-view").find(".sch-event.has-phase-"+f);var b=$(".timeline-view").find(".timeline-milestone-header .milestone-event.has-phase-"+f);h.push(a);h.push(e);h.push(b);if(c){if(h){$.each(h,function(k,j){$(j).addClass("highlight-phase-"+g)})}}else{if(h){$.each(h,function(k,j){$(j).removeClass("highlight-phase-"+g)})}}if(a.length>0||e.length>0||b.length>0){updateLegend(c,g,i.find(".phase-name").text())}}function HighlightAllTaskManagers(d){var a=d.parent().find(".tool-item"),c=d.find("input").is(":checked");for(var b=1;b<a.length;b++){if(c){$(a[b]).find("input").prop("checked","checked")}else{$(a[b]).find("input").removeAttr("checked")}HighlightTaskManagers($(a[b]))}}function HighlightTaskManagers(i){var a=i.data("task-manager-id"),k=stl.app.ProjectDataFromServer.getTaskManagerColorMap()[a],f=i.find("input").is(":checked");var h=[];var b=".task.has-task-manager-"+stringToHex(a.replace(/ /g,""));var d=".milestone.has-task-manager-"+stringToHex(a.replace(/ /g,""));var e=".sch-event.has-task-manager-"+stringToHex(a.replace(/ /g,""));var j=".timeline-milestone-header .milestone-event.has-task-manager-"+stringToHex(a.replace(/ /g,""));var g=$(".matrix-view").find(b+","+d);var c=$(".timeline-view").find(e+","+j);h.push(g);h.push(c);if(f){if(h){$.each(h,function(m,l){$(l).addClass("highlight-task-manager-"+k)})}}else{if(h){$.each(h,function(m,l){$(l).removeClass("highlight-task-manager-"+k)})}}if(g.length>0||c.length>0){updateLegend(f,k,i.find(".task-manager-name").text())}}stl.app.HighlightChainWith=function(d,e,f,a){if(d==undefined||d==null||d.length==0){return}if(stl.app.matrixView){var c=stl.app.matrixView.tasksByUid;var b=stl.app.matrixView.milestoneElementsById;$.each(d,function(h,j){var k=c[j];var i;if(k&&k.$el){i=k.$el}else{var g=b[j];if(g){i=g}}if(i){if(f){i.addClass(a)}else{i.removeClass(a)}}})}};stl.app.highlightChainInternal=function(d,f){var a=stl.app.ProjectDataFromServer.getChainsColorMap()[d];var e=stl.app.ProjectDataFromServer.getTaskIdsForChainNumber(d);if(e&&e.length>0){stl.app.HighlightChainWith(e,true,f,"highlight-chain-"+a);var c=Ext.getCmp("timelineview");var b=[];e.forEach(function(g){b.push({uid:g})});if(c){c.toggleHighlightChain(b,"highlight-chain-"+a,f)}return true}else{return false}};stl.app.HighlightProjectChain=function(d){var b=d.data("chain-id");var c=d.find("input").is(":checked");if(stl.app.highlightChainInternal(b,c)==true){var a=stl.app.ProjectDataFromServer.getChainsColorMap()[b];updateLegend(c,a,d.find(".chain-number").text())}};stl.app.HighlightPenChain=function(a){stl.app.highlightChainInternal(a,true)};stl.app.HighlightProjectPenChain=function(c){var b=c.getAllChainIds();if(b){var a=_.sortBy(b)}stl.app.HighlightPenChain(a[0])};stl.app.HighlightAllProjectChains=function(d){var a=d.parent().find(".tool-item"),c=d.find("input").is(":checked");for(var b=1;b<a.length;b++){if(c){$(a[b]).find("input").prop("checked","checked")}else{$(a[b]).find("input").removeAttr("checked")}stl.app.HighlightProjectChain($(a[b]))}};var chainHighlightInstance=(function(){var r=stl.app.ProjectDataFromServer;var q=[];var v=[];var p=[];var j={};var q=[];var e={};function h(y,z){var B;if(y._successors){$.each(y._successors,function(C,D){f(y,D,z)})}var A=y.text7;if(A&&A>0){b(y,v,A,z)}A=y.text5;if(A&&A>0&&A!=y.uid){c(y,v,A,z)}}function u(C,y,z,B){var A={};y[C.uid]=0;n(C,y,A,z,B)}function g(G,D,E,C,y){var A=[];var H,F;var z={};E[G.uid]=0;z[G.uid]=0;A.push(G);while(A.length>0){H=A[0];A.splice(0,1);var B={};B=y[H.uid];$.each(B,function(J,I){x(I,H,E);d(I,z);var K=k(I,z,D);if(K){A.push(I)}});l(H,E)}}function x(y,D,z){var C=0;var B=0;var A=0;var E;A=i(y);C=z[D.uid];B=z[y.uid];if(B){if((C+parseInt(A))>B){delete z[y.uid];z[y.uid]=C+parseInt(A)}}else{z[y.uid]=C+parseInt(A)}}function l(B,y){var z=0;var A=0;if(p.length>0){z=y[p[0].uid]}if(p.length>0&&y[p[0].uid]!=undefined){A=y[B.uid];if(A>z){p=[];p.push(B)}else{if(A==z){p.push(B)}}}else{p.push(B)}}function k(y,B,z){var A=false;if(B[y.uid]==z[y.uid]){A=true}return A}function o(B,z,y){var A;var C=[];var D=false;$.each(B,function(F,E){if(E.percentComplete==100){D=true}else{D=false}w(E,z,y,C,D)})}function w(H,B,C,F,E){var G;var D=0;var z=0;var A=0;if(F[H.uid]){return}if(!F[H.uid]){F[H.uid]=true;z=i(H);if(E==false){t(H)}D=C[H.uid]-z;$.each(H._successors,function(I,J){if(B[J.uid]!=undefined){if(D==C[J.uid]){E=E&&(J.percentComplete==100);w(J,B,C,F,E)}}});A=H.text7;if(A>0){var y;$.each(v,function(J,I){if(I.uid==A){y=I;return false}});G=y;if(G&&B[G.uid]!=undefined){if(D==C[G.uid]){E=E&&(G.percentComplete==100);w(G,B,C,F,E)}}}A=H.text5;if(A>0){var y;$.each(v,function(J,I){if(I.uid==A){y=I;return false}});G=y;if(G&&B[G.uid]!=undefined){if(D==C[G.uid]){E=E&&(G.percentComplete==100);w(G,B,C,F,E)}}}}}function f(y,z,A){var B={};B=A[z.uid];if(B){if(!B[y.uid]){B[y.uid]=y}}else{B={};B[y.uid]=y;A[z.uid]=B}}function b(y,D,C,B){try{var A;$.each(D,function(F,E){if(E.uid==C){A=E;return false}});f(y,A,B)}catch(z){}}function c(y,D,C,B){try{var A;$.each(D,function(F,E){if(E.uid==C){A=E;return false}});f(y,A,B)}catch(z){}}function n(E,z,D,A,C){var B={};B=C[E.uid];if(D[E.uid]==undefined){var y;$.each(B,function(G,F){d(F,z);n(F,z,D,A,C)});D[E.uid]=1}}function d(y,A){var z=0;z=A[y.uid];if(z!=undefined){delete A[y.uid];A[y.uid]=z+1}else{A[y.uid]=1}}function t(y){y.Flag17=true;y.Flag18=true;q.push(y)}function i(z){var H="FKCD";var D=0;var A=0;var y=0;var G=null;var E=[];var C=null;var B;var F=false;if(a(z)){B=z.text22;if(B!=undefined){G=B.split(";");for(A=0;A<G.length;A++){C=G[A];C=C.trim();F=C.indexOf(H);if(F!=-1){E=C.split("=");if(E[0]==H){y=E[1];D=y}}}}}else{if(s(z)){D=0}else{if(z.remainingDuration!=undefined){D=z.remainingDuration}}}return parseInt(D)}function a(y){var z=2;var A=false;if(y.text1==2){A=true}return A}function s(y){var A=false;var z=0;z=parseInt(y.text9);if(z==1||z==2||z==6){A=true}return A}function m(D){var z=D;var C={};var B={};v=[];var E=stl.app.ProjectDataFromServer;v=E.getAllTasks().concat(E._milestones);$.each(v,function(F,H){var G={};if(H.uid!=undefined){B[H.uid]=G}});$.each(v,function(F,G){h(G,B)});var y=z;e={};var A=z.text9;u(y,e,A,B);p=[];j={};q=[];g(y,e,j,A,B);o(p,e,j);return q}return{highlightLongestPredecessorChain:m}})();