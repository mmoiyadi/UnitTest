/*
@string : string to be replaced with arguments
@arguments : parameters passed as arguments which will be repalced in the string passed in @string
Eg: getStringWithArgs("And the %1 want to know whose %2 you %3", "papers", "shirt", "wear");
Limitastion: only up to 9 arguments can be passed
*/
function getStringWithArgs(string) {
  var args = arguments;
  var pattern = new RegExp("%([1-" + arguments.length + "])", "g");
  return String(string).replace(pattern, function(match, index) {
    return args[index];
  });
};

function CompareArrayOfObjects(x, y) {
    var objectsAreSame = true;
    
    if (x.length != y.length) {
        objectsAreSame = false;
    }

    if (objectsAreSame) {
        for (var i = 0; i < x.length; i++) {
            var itemX = x[i];
            var itemY = y[i];

            for (var propertyName in itemX) {
                if (itemX[propertyName] != itemY[propertyName]) {
                    objectsAreSame = false;
                    break;
                }
            }

        }
    }
    return objectsAreSame;
}

/*
Method to check  conditions of multiple ORs in one if condition
Can be used to check even one OR
Comparision is strongly typed
Eg:
if(task.taskType ===STRING_NORMAL || task.taskType === FULL_KIT || task.taskType === MILESTONE ) 
if(multipleORs(task.taskType,STRING_NORMAL,FULL_KIT,MILESTONE))

*/
function multipleORs(){
    var args =arguments;

    if(_.rest(args).indexOf(_.first(args)) !== -1)
        return true;
    else 
        return false;

}
/*
Converting string to hex
*/
function stringToHex (str) {
  var hex = '';
  for(var i=0;i<str.length;i++) {
    hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
}

/*
method to set labels in index page to strings in resx file
*/
function SetIndexPageLabelsFromResx(localizedResxStrings) {
    
    var labelElems = $('[data-resx-key]');
    if (labelElems) {
        _.each(labelElems, function(elem) {
            var mapKey = localizedResxStrings.indexPageLabelsStringsMap[$(elem).data().resxKey];
            var localizedValue;
            if (mapKey)
                localizedValue = mapKey.Value;
            if (localizedValue)
                elem.innerHTML = localizedValue;
        });
    }
}
function SetIndexPageLabelsFromColumnNames() {
    
    var labelElems = $('[data-columns-key]');
    if (labelElems) {
        _.each(labelElems, function(elem) {
            var mapKey = $(elem).data().columnsKey;
            var localizedValue;
           
            var columnName = stl.app.getColumnDisplayName(mapKey);
            localizedValue = ($(elem).data().addColon === false) ? columnName : columnName + SPACE_CONST + COLON_SEPARATOR;
            if (localizedValue)
                elem.innerHTML = localizedValue;
        });
    }
}

function SetIndexPageLabelsFromFilterNames() {
    
    var labelElems = $('[data-filtername-key]');
    if (labelElems) {
        _.each(labelElems, function(elem) {
            var mapKey = $(elem).data().filternameKey;
            var localizedValue = DataStore.FilterNames[mapKey];
             
            if (localizedValue)
                elem.innerHTML = localizedValue;
        });
    }
}

function SetPlaceHolderTextsFromResx(localizedResxStrings){
    var labelElems = $('[data-placeholder-key]');
    if (labelElems) {
        _.each(labelElems, function(elem) {
             var mapKey = localizedResxStrings.indexPageLabelsStringsMap[$(elem).data().placeholderKey];
            var localizedValue;
            if (mapKey)
                localizedValue = mapKey.Value;
            if (localizedValue)
                $(elem).attr('placeholder',localizedValue);
        });
    }
}


/*encapsulated the regex to check for float */
var isNumberFloat = function (value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
      .test(value))
        return Number(value);
    return NaN;
}

function isValidNumber(value){
    return /^[0-9]+$/.test(value);        
}

function ProjectNameValidation(str1) {
    var str;
    str = Trim(str1);

    var len1;
    len1 = str.length;

    var bValid;
    bValid = true;

    var countBlankSpaces;
    countBlankSpaces = 0;

    if (IsNonNullStr(str1)) {
        for (var j = 0; j < len1; j++) {
            if ((str.charAt(j) == ';') || (str.charAt(j) == ',') || (str.charAt(j) == '?') || (str.charAt(j) == '<') || (str.charAt(j) == '>') || (str.charAt(j) == ':') || (str.charAt(j) == '|') || (str.charAt(j) == '/') || (str.charAt(j) == "\"") || (str.charAt(j) == "\'") || (str.charAt(j) == "\\") || (str.charAt(j) == "*") || (str.charAt(j) == ".") || (str.charAt(j) == "#")) {
                bValid = false;
                break;
            }
            else {
                if (str.charAt(j) == ' ') {
                    countBlankSpaces++;
                    if (countBlankSpaces > 1) {
                        bValid = false;
                        break;
                    }
                }
                else
                    countBlankSpaces = 0;
            }
        }
    }
    return bValid;

}

function Trim(str1) {
    firstStr = new String(str1);
    var len1 = firstStr.length;
    var start1 = 0;
    var start2 = len1;
    var result = new String("");

    while ((start1 < len1)) {
        if ((firstStr.charAt(start1) == ' ') || (firstStr.charAt(start1) == '\t') || (firstStr.charAt(start1) == '\r') || (firstStr.charAt(start1) == '\n')) {
            start1++;
        }
        else {
            break;
        }
    }

    if (start2 >= 1)
        start2 = start2 - 1;
    while ((start2 > 0)) {
        if ((firstStr.charAt(start2) == ' ') || (firstStr.charAt(start2) == '\t') || (firstStr.charAt(start2) == '\r') || (firstStr.charAt(start2) == '\n')) {
            start2 = start2 - 1;
        }
        else {
            break;
        }
    }

    return firstStr.substr(start1, (start2 - start1 + 1));
}

function IsNonNullStr(szStr) {
    if ((szStr == null) || (szStr == ""))
        return false;
    var str = szStr;
    var len = str.length;
    var charString = false;
    var start = 0;
    while (start < len) {
        presentChar = str.charAt(start)
        if ((presentChar == " ") || (presentChar == "\r") || (presentChar == "\n") || (presentChar == "\t"));
        else {
            charString = true;
            break;
        }
        start++;
    }
    return (charString);
}

function convertDateStringToDateFormat(dateString){
    if (typeof dateString === 'string')
        return new Date(dateString.toUpperCase());
    return dateString;
}

function getTaskTemplateLabelsAndStrings(){
             //subtaskNameStyle
            /*---------------resx/Columns/filter name--------------------------*/
               var staticValues ={};
                staticValues.SPI_COLUMNS_AND_LABELS_REMAINING_DURATION =stl.app.getColumnDisplayName("SPI_COLUMNS_AND_LABELS_REMAINING_DURATION");

                staticValues.FK_PANEL_NEED_DATE = stl.app.getColumnDisplayName("FK_PANEL_NEED_DATE");
                staticValues.SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE = stl.app.getColumnDisplayName("SPI_COLUMNS_AND_LABELS_EXPECTED_FINISH_DATE");
                staticValues.FK_PANEL_PULL_IN_OFFSET = stl.app.getColumnDisplayName("FK_PANEL_PULL_IN_OFFSET");
                staticValues.SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST = stl.app.getColumnDisplayName("SPI_COLUMNS_AND_LABELS_TASK_RESOURCES_LIST");
                staticValues.SPI_COLUMNS_AND_LABELS_TASK_STATUS = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_STATUS');
                staticValues.SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_MANAGER_ID');
                staticValues.SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_RESOURCE_NOTES');
                staticValues.SPI_COLUMNS_AND_LABELS_TASK_TYPE = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_TASK_TYPE');
                staticValues.SPI_COLUMNS_AND_LABELS_SNET_DATE = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SNET_DATE');
                staticValues.SPI_COLUMNS_AND_LABELS_REMAINING_DURATION = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_REMAINING_DURATION');
                staticValues.SPI_COLUMNS_AND_LABELS_MSP_TASK_ID = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_MSP_TASK_ID');
                staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL');
                staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL');
                staticValues.SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP = stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP');
                
                
                
              
                staticValues.NotStartedFilterName =    DataStore.FilterNames.NotStartedFilterName;
               staticValues.ReleasedFilterName    = DataStore.FilterNames.ReleasedFilterName;
               staticValues.InProgressFilterName  =DataStore.FilterNames.InProgressFilterName;
               staticValues.CompletedFilterName  =DataStore.FilterNames.CompletedFilterName;
               staticValues.NORMAL_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["NORMAL_Key"].Value;
               staticValues.PURCHASING_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["PURCHASING_Key"].Value;
               staticValues.SNET_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["SNET_Key"].Value;
               staticValues.AUTOLINK_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["AUTOLINK_Key"].Value;
               staticValues.OK_BUTTON_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["OK_BUTTON_Key"].Value;
               staticValues.Delete_Task_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["Delete_Task_Key"].Value;
               staticValues.Subtask_PlaceHolder_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["Subtask_PlaceHolder_Key"].Value;
               staticValues.RollUp_Button_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["RollUp_Button_Key"].Value;
               
               //staticValues.WIP_LIMIT_Key = stl.app.SPILocalizedStrings.indexPageLabelsStringsMap["WIP_LIMIT_Key"].Value;
               return staticValues;
 
        }
