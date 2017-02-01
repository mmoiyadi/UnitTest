alertify.defaults.theme.ok = "btn btn-primary";
			alertify.defaults.theme.cancel = "btn btn-danger";
			alertify.defaults.notifier.position = 'bottom-right';

PPI_Notifier = (function(){
	return {
		alert: function(msg,title){
			alertify.alert(msg).set('title',title).set({transition:'zoom'});
		},
		alertModal: function(msg,title,onok){
			alertify.alert(msg,onok).set({transition:'zoom'}).set({'modal': false,'closable':false,	'pinnable': false, 'title':title});
		},
		success: function(msg,title){
			toastr.success(msg,title);
		},
		error: function(msg,title){
			toastr.error(msg,title);
		},
		info: function(msg,title){
			toastr.info(msg,title);
		},
		warning: function(msg,title){
			toastr.warning(msg,title);
		},
		confirm: function(msg,title,onok,oncancel){
			alertify.dialog('confirm').set({
			    'labels':{ok:YES_STR, cancel:NO_STR}
			});
			alertify.confirm(msg,onok,oncancel).set('resizable', true).set('movable',false).resizeTo(546,180).set('title',title).set({transition:'zoom'});
		}
	};
}());