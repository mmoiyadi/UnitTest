function getStringWithArgs(b){var a=arguments;var c=new RegExp("%([1-"+arguments.length+"])","g");return String(b).replace(c,function(e,d){return a[d]})}function CompareArrayOfObjects(a,g){var f=true;if(a.length!=g.length){f=false}if(f){for(var c=0;c<a.length;c++){var e=a[c];var d=g[c];for(var b in e){if(e[b]!=d[b]){f=false;break}}}}return f}function multipleORs(){var a=arguments;if(_.rest(a).indexOf(_.first(a))!==-1){return true}else{return false}}function stringToHex(c){var b="";for(var a=0;a<c.length;a++){b+=""+c.charCodeAt(a).toString(16)}return b}function SetIndexPageLabelsFromResx(a){var b=$("[data-resx-key]");if(b){_.each(b,function(d){var e=a.indexPageLabelsStringsMap[$(d).data().resxKey];var c;if(e){c=e.Value}if(c){d.innerHTML=c}})}}function SetIndexPageLabelsFromColumnNames(){var a=$("[data-columns-key]");if(a){_.each(a,function(d){var e=$(d).data().columnsKey;var c;var b=stl.app.getColumnDisplayName(e);c=($(d).data().addColon===false)?b:b+SPACE_CONST+COLON_SEPARATOR;if(c){d.innerHTML=c}})}}function SetIndexPageLabelsFromFilterNames(){var a=$("[data-filtername-key]");if(a){_.each(a,function(c){var d=$(c).data().filternameKey;var b=DataStore.FilterNames[d];if(b){c.innerHTML=b}})}}function SetPlaceHolderTextsFromResx(a){var b=$("[data-placeholder-key]");if(b){_.each(b,function(d){var e=a.indexPageLabelsStringsMap[$(d).data().placeholderKey];var c;if(e){c=e.Value}if(c){$(d).attr("placeholder",c)}})}}var isNumberFloat=function(a){if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(a)){return Number(a)}return NaN};function isValidNumber(a){return/^[0-9]+$/.test(a)}function ProjectNameValidation(d){var f;f=Trim(d);var b;b=f.length;var c;c=true;var e;e=0;if(IsNonNullStr(d)){for(var a=0;a<b;a++){if((f.charAt(a)==";")||(f.charAt(a)==",")||(f.charAt(a)=="?")||(f.charAt(a)=="<")||(f.charAt(a)==">")||(f.charAt(a)==":")||(f.charAt(a)=="|")||(f.charAt(a)=="/")||(f.charAt(a)=='"')||(f.charAt(a)=="'")||(f.charAt(a)=="\\")||(f.charAt(a)=="*")||(f.charAt(a)==".")||(f.charAt(a)=="#")){c=false;break}else{if(f.charAt(a)==" "){e++;if(e>1){c=false;break}}else{e=0}}}}return c}function Trim(e){firstStr=new String(e);var b=firstStr.length;var d=0;var c=b;var a=new String("");while((d<b)){if((firstStr.charAt(d)==" ")||(firstStr.charAt(d)=="\t")||(firstStr.charAt(d)=="\r")||(firstStr.charAt(d)=="\n")){d++}else{break}}if(c>=1){c=c-1}while((c>0)){if((firstStr.charAt(c)==" ")||(firstStr.charAt(c)=="\t")||(firstStr.charAt(c)=="\r")||(firstStr.charAt(c)=="\n")){c=c-1}else{break}}return firstStr.substr(d,(c-d+1))}function IsNonNullStr(e){if((e==null)||(e=="")){return false}var c=e;var b=c.length;var a=false;var d=0;while(d<b){presentChar=c.charAt(d);if((presentChar==" ")||(presentChar=="\r")||(presentChar=="\n")||(presentChar=="\t")){}else{a=true;break}d++}return(a)}function convertDateStringToDateFormat(a){if(typeof a==="string"){return new Date(a.toUpperCase())}return a};