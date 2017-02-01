/**********
    # Tree Filter #

    A Third party plugin to filter a tree panel.
    src: http://try.sencha.com/extjs/4.1.1/community/treefilter/

***/
Ext.define('TreeFilter', {
    extend: 'Ext.AbstractPlugin'
        , alias: 'plugin.treefilter'

        , collapseOnClear: true                                                 // collapse all nodes when clearing/resetting the filter
        , allowParentFolders: false                                             // allow nodes not designated as 'leaf' (and their child items) to  be matched by the filter

        , init: function (tree) {
            var me = this;
            me.tree = tree;

            tree.filter = Ext.Function.bind(me.filter, me);
            tree.clearFilter = Ext.Function.bind(me.clearFilter, me);
        }

        , filter: function (value, property, re) {
            var me = this
                , tree = me.tree
                , matches = []                                                  // array of nodes matching the search criteria
                , root = tree.getRootNode()                                     // root node of the tree
                , property = property || 'name'                                 // property is optional - will be set to the 'text' propert of the  treeStore record by default        
                , visibleNodes = []                                             // array of nodes matching the search criteria + each parent non-leaf  node up to root
                , viewNode;
            if(property != "resources" && property != "Id")
                var re = re || new RegExp(value.toString(), "ig");// the regExp could be modified to allow for case-sensitive, starts  with, etc.
            if (Ext.isEmpty(value)) {                                           // if the search field is empty
                me.clearFilter();
                return;
            }
            if(property=='participants')
                property='participantsFullNames';
            tree.expandAll();                                                   // expand all nodes for the the following iterative routines

            // iterate over all nodes in the tree in order to evalute them against the search criteria
            if(property == 'resources'){
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        var resources = node.get(property);
                        if(resources){
                            var resourcesList = stl.app.getAvailableResourceOptions();
                            var resourcesNameValArray=[];
                            _.each(resources, function(res){
                                resourcesNameValArray.push(_.find(resourcesList,function(res1){
                                    return res1.id==res.resourceId;
                                }).text);
                            });                       
                            if(value.indexOf("(") != -1){
                                var units = value.slice(value.indexOf("(")+1, value.length -1);
                                var resName = value.slice(0,value.indexOf("("));
                                if(units){
                                    /*var resVal = $.grep(resourcesList, function(e){ return e.text.indexOf(resName) != -1; });
                                    var resNameValArray=[];
                                    _.each(resVal, function(res){
                                        resNameValArray.push(res.text);
                                    });
                                    if(resVal.length >0){
                                        for(var i =0; i< resources.length; i++){
                                            if(resNameValArray.indexOf(resources[i].resourceId == resVal[0].id && resources[i].units == parseInt(units))
                                                matches.push(node);                                         // add the node to the matches array
                                        }
                                    }*/
                                    for(var i =0; i< resources.length; i++){
                                        if(resourcesNameValArray.toString().indexOf(resName) != -1 && resources[i].units == units)
                                            matches.push(node);                                         // add the node to the matches array
                                        }
                                }
                            }
                            else{
                                /*var resVal = $.grep(resourcesList, function(e){ return e.text.indexOf(value)!= -1; });
                                if(resVal.length > 0){
                                    for(var i =0; i< resources.length; i++){
                                        if(resources[i].resourceId == resVal[0].id)
                                            matches.push(node);                                         // add the node to the matches array
                                    }
                                }*/
                                if(resourcesNameValArray.length > 0)
                                    if(resourcesNameValArray.toString().indexOf(value) != -1)
                                        matches.push(node);
                            }
                        }
                    }
                });
            }
            else if(property == "duration"){
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        if(node.get(property) >= 0){
                            if (node.get(property).toString() == value.toString()) {                             // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                                matches.push(node);                                         // add the node to the matches array
                            }
                        }
                    }                    
                });
            }
            else if(property == "snet" || property =="startDate" || property == "endDate"){
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        if(node.get(property)){
                            var valueDt = new Date(value);
                            var nodeDt = node.get(property);
                            if (nodeDt.getDate() == valueDt.getDate() &&
                                nodeDt.getMonth() == valueDt.getMonth() &&
                                nodeDt.getYear() == valueDt.getYear()) {
                                // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                                matches.push(node);  // add the node to the matches array
                            }
                        }
                    }                    
                });
            }
            else if(property == "manager"){
                var managers = stl.app.availablePeopleAndTeams;
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        var person = $.grep(managers, function(e){ return e.Name == node.get(property); });
                        if(person.length > 0){
                            var fullName = person[0].FullName;
                            if (fullName.match(re)) {                             // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                                matches.push(node);                                         // add the node to the matches array
                            }
                        }
                    }                    
                });
            }
            else if(property == "status"){
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){                        
                        if(node.get(property) != ""){
                            if (getTaskStatusShort(node).match(re)) {                             // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                                matches.push(node);                                         // add the node to the matches array
                            }
                        }
                    }                    
                });
            }
            else if(property == "Id"){
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        if (value.indexOf(node.get(property)) >-1) {                             // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                            matches.push(node);                                         // add the node to the matches array
                        }
                    }                    
                });
            }
            else{
                root.cascadeBy(function (node) {
                    if(!node.isRoot()){
                        if (node.get(property).toString().match(re)) {                             // if the node matches the search criteria and is a leaf (could be  modified to searh non-leaf nodes)
                            matches.push(node);                                         // add the node to the matches array
                        }
                    }                    
                });
            }

            if (me.allowParentFolders === false) {                              // if me.allowParentFolders is false (default) then remove any  non-leaf nodes from the regex match
                Ext.each(matches, function (match) {
                    if (!match.isLeaf()) {
                        Ext.Array.remove(matches, match);
                    }
                });
            }

            Ext.each(matches, function (item, i, arr) {                         // loop through all matching leaf nodes
                root.cascadeBy(function (node) {                                // find each parent node containing the node from the matches array
                    if (node.contains(item) == true) {
                        visibleNodes.push(node);                                // if it's an ancestor of the evaluated node add it to the visibleNodes  array
                    }
                });
                if (me.allowParentFolders === true && !item.isLeaf()) {        // if me.allowParentFolders is true and the item is  a non-leaf item
                    item.cascadeBy(function (node) {                            // iterate over its children and set them as visible
                        visibleNodes.push(node);
                    });
                }
                visibleNodes.push(item);                                        // also add the evaluated node itself to the visibleNodes array
            });

            root.cascadeBy(function (node) {                                    // finally loop to hide/show each node
                viewNode = Ext.fly(tree.getView().getNode(node));               // get the dom element assocaited with each node
                if (viewNode) {                                                 // the first one is undefined ? escape it with a conditional
                    viewNode.setVisibilityMode(Ext.Element.DISPLAY);            // set the visibility mode of the dom node to display (vs offsets)
                    viewNode.setVisible(Ext.Array.contains(visibleNodes, node));
                }
            });
            return matches;
        }

        , clearFilter: function () {
            var me = this
                , tree = this.tree
                , root = tree.getRootNode();

            if (me.collapseOnClear) {
                tree.collapseAll();                                             // collapse the tree nodes
            }
            root.cascadeBy(function (node) {                                    // final loop to hide/show each node
                viewNode = Ext.fly(tree.getView().getNode(node));               // get the dom element assocaited with each node
                if (viewNode) {                                                 // the first one is undefined ? escape it with a conditional and show  all nodes
                    viewNode.show();
                }
            });
        }
});