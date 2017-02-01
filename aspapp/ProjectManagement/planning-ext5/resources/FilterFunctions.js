/*********
	Filter.js defines functions used for filtering Projects, Business Units, Portfolios, 
	Customer, Project manager etc in navigation bar as well in the new project window
*********/
function sortProjectListUsingDivision(division,selectedItem,isChecked){
    if(isChecked){
        if(projectStore.getCount() == 0){
            projectStore.loadData(DataStore.ProjectList,false);
            projectStore.clearFilter(false);
            projectStore.filter([{filterFn:function(record,index,count){
                if(record.get('Division') == division && record.get(selectedItem.name) == selectedItem.value)
                    return true;
            }}]);
        }
        else{
            var ProjectList = projectStore.data.items;
            projectStore.clearFilter(false);
            projectStore.filter([{filterFn:function(record,index,count){
                    if(record.get('Division') == division && record.get(selectedItem.name) == selectedItem.value)
                        return true;
            }}]);
            projectStore.add(ProjectList);
        }
    }
    else if(isChecked == false){
         projectStore.filter([{filterFn:function(record,index,count){
                if(record.get('Division') != division && record.get(selectedItem.name) != selectedItem.value)
                    return true;
        }}]);
    }
    else{

    }
}
function sortProjectListUsingStatus(status,isChecked){
    if(isChecked){
        if(projectStore.getCount() == 0){
            projectStore.loadData(DataStore.ProjectList,false);
            projectStore.clearFilter(false);
            projectStore.filter([{filterFn:function(record,index,count){
                if(record.get('Status') == status)
                    return true;
        }}]);
        }
        else{
            var projectList = projectStore.data.items;
            projectStore.clearFilter(false);
            projectStore.filter([{filterFn:function(record,index,count){
                    if(record.get('Status') == status)
                        return true;
            }}]);
            projectStore.add(projectList);
        }
    }
    else if(isChecked == false){
        projectStore.filter([{filterFn:function(record,index,count){
                if(record.get('Status') != status)
                    return true;
        }}]);
    }
    else{

    }
}
function sortFilters(field){
	var projectlist = DataStore.ProjectList;
    DataStore.BUList = businessStore.data;
    DataStore.PortfolioList = portfolioStore.data;
    DataStore.CustomerList = customerStore.data;
    DataStore.ProjectManagerList = managerStore.data;
    for(var i =0; i< projectlist.length;i++){
        var div = projectlist[i].Division;
        DataStore.BUList= DataStore.BUList.filter(function(obj){
            return obj["DivisionName"] == div;
        });
        var container = field.ownerCt.ownerCt.getComponent('business-container');
        container.fireEvent('beforeshow',container);
        DataStore.CustomerList = DataStore.CustomerList.filter(function(obj){
            return obj["DivisionName"] == div;
        });
        var container = field.ownerCt.ownerCt.getComponent('customer-container');
        container.fireEvent('beforeshow',container);

        DataStore.ProjectManagerList =DataStore.ProjectManagerList.filter(function(obj){
            return obj["DivisionName"] == div;
        });
        var container = field.ownerCt.ownerCt.getComponent('manager-container');
        container.fireEvent('beforeshow',container);
    }
}
function sortStoreUsingDivision(store, storeData, division, isChecked){
     if(isChecked){
        if(store.getCount() == 0){
            store.loadData(storeData,false);
            store.clearFilter(false);
            store.filter([{filterFn:function(record,index,count){
                return checkForDivisionAccess(record,division);
            }}]);
        }
        else{
            var storeList = store.data.items;
            store.clearFilter(false);
            store.filter([{filterFn:function(record,index,count){
                return checkForDivisionAccess(record,division);
            }}]);
            store.add(storeList);
        }
    }
    else if(isChecked == false){
         store.filter([{filterFn:function(record,index,count){
            return checkForDivisionAccess(record,division);
        }}]);
    }
    else{
        store.clearFilter();
        store.filter([{filterFn:function(record,index,count){
                return checkForDivisionAccess(record,division);
        }}]);
    }
}

function checkForDivisionAccess(record,division){
    if((record.get('DivisionName').split(",").indexOf(division) != -1) || (record.get('IsAccessToAllDiv') == true))
        return true;
    else 
        return false;
}
function getAllManagerStore(){
    return DataStore.ProjectManagerList;
}
function sortBUListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(businessStore, DataStore.BUList, division, isChecked);
}
function sortPortfolioListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(portfolioStore, DataStore.PortfolioList, division, isChecked);
}
function sortCustomerListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(customerStore, DataStore.CustomerList, division, isChecked);
}
function sortPMListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(managerStore, DataStore.ProjectManagerList, division, isChecked);
}
function sortAttribute1ListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(Attribute1Store, DataStore.Attribute1List, division, isChecked);
}
function sortAttribute2ListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(Attribute2Store, DataStore.Attribute2List, division, isChecked);
}
function sortAttribute3ListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(Attribute3Store, DataStore.Attribute3List, division, isChecked);
}
function sortAttribute4ListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(Attribute4Store, DataStore.Attribute4List, division, isChecked);
}
function sortAttribute5ListUsingDivision(division,isChecked){
    this.sortStoreUsingDivision(Attribute5Store, DataStore.Attribute5List, division, isChecked);
}
function sortTemplateListUsingDivision(division, isChecked) {
    if (isChecked) {
        if (TemplateStore.getCount() == 0) {
            TemplateStore.loadData(DataStore.ProjectList, false);
            TemplateStore.clearFilter(false);
            TemplateStore.filter([{ filterFn: function (record, index, count) {
                if (record.get('Division').split(",").indexOf(division) != -1 || record.get('Division') == "")
                    return true;
            } 
            }]);
        }
        else {
            var TemplateList = TemplateStore.data.items;
            TemplateStore.clearFilter(false);
            TemplateStore.filter([{ filterFn: function (record, index, count) {
                if (record.get('Division').split(",").indexOf(division) != -1 || record.get('Division') == "")
                    return true;
            } 
            }]);
            TemplateStore.add(TemplateList);
        }
    }
    else if (isChecked == false) {
        TemplateStore.filter([{ filterFn: function (record, index, count) {
            if (record.get('Division').split(",").indexOf(division) != -1 || record.get('Division') == "")
                return true;
        } 
        }]);
    }
    else {
        TemplateStore.clearFilter();
        TemplateStore.filter([{ filterFn: function (record, index, count) {
            if (record.get('Division').split(",").indexOf(division) != -1 || record.get('Division') == "")
                return true;
        } 
        }]);
    }
}