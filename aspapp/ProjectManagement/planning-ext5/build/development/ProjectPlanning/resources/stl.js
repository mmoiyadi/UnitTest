/**
 * NOTES ON CURRENT APPLICATION STRUCTURE (June 16th, 2014)
 *
 * Ext controls the top-level view containers and the timeline view.
 * Everything else (matrix view) is done in jquery within a div provided by Ext.
 *
 * html body (Ext)
 *   |
 *   +- Ext.Viewport (Ext)
 *       |
 *       +- header (jquery): component drawn from static html content ".page-header"
 *       +- matrix-view (jquery): component initialized from static html content,
 *       |     then managed and populated by jquery (no Ext involvement)
 *       |     (uses the "template" div in the static html content)
 *       +- timeline-view (Ext): initialized by Ext without static content
 *       +- table-view (Ext)
 *
 * Rationale: I'd like to get away from Ext, but we have prototype code using the
  * Bryntum timeline view and my efforts to find a replacement timeline that's good enough
 * have not succeeded.  So for now, we're continuing to use our Ext-based timeline
 * and table views.
 *
 * New code will continue to be non-Ext.
 */

// Patch console for IE9
if (!window.console) {
    window.console = { 
            log : function(){},
            warn : function(){},
            error : function(){},
            time : function(){},
            timeEnd : function(){}
            };
}

window.stl = window.stl || {
    view: {},
    data: {},
    model: {}
};
stl.app = {};

var ValidationClassInstance = null;
stl.app.ProcessTypeEnum = {
            //Action                
        EDITCHECKOUT : 1, 
        CHECKOUT : 2,
        IDCC : 3,
        REDOCCFB : 4,
        CHECKBUFFERIMPACT : 5,
        CHECKIN :6,
        SAVE :7,
        AUTOSAVE : 8,
        VIEWPROJECT : 9,
        LOADPROJECTREVISON : 10 ,
        UNDOCHECKOUT:11 
    };
//TO DO: Remove this flag and its usage once testing is done
stl.app.loadByTemplating = true;
stl.app.generateAutoLinksAllowed =true;
var availableResources = [];
var DataStore = null;
var ConfigData = null;
stl.app.ResxStrings = null;
stl.app.customTextFieldsMap={
    "text26":"Text1",
    "text27":"Text2",
    "text28":"Text3",
    "text29":"Text4",
    "text30":"Text5",
    "text3":"Text6",
    "text11":"Text7",
    "text12":"Text8",
    "text13":"Text9",
    "text15":"Text10"
};

var mappedProjectStore = null;
var divisionStore = null;
var portfolioStore = null;
var businessStore = null;
var customerStore = null;
var managerStore = null;
var Attribute1Store = null;
var Attribute2Store = null;
var Attribute3Store = null;
var Attribute4Store = null;
var Attribute5Store = null;
var Attribute1FilterName = "";
var Attribute2FilterName = "";
var Attribute3FilterName = "";
var Attribute4FilterName = "";
var Attribute5FilterName = "";
var TemplateStore = null;
var isSaveOnBrowserClose = true;
var subtaskTypes = null;
var taskTypes = null;
var statusTypes = null;

var participantStore = Ext.create('Ext.data.Store', {
    fields: ['Id', 'Name']
});
participantStore.loadData([{
    Id: "par1",
    Name: "Person 1"
}, {
    Id: "par2",
    Name: "Person 2"
}, {
    Id: "par3",
    Name: "Person 3"
}]);
var projectStore = null;

var milestones = [{
    id: "m1",
    date: new Date(2014, 08, 31),
    name: "project end"
}, {
    id: "m2",
    date: new Date(2014, 08, 1),
    name: "deliverable 1"
}, {
    id: "m3",
    date: new Date(2014, 08, 1),
    name: "some other milestone"
}];

function LoadStoresWithData() {
    subtaskTypes = [
        {
            id: "3",
            name: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_WIP')
        },
        {
            id: "4",
            name: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_PARALLEL')
        }, 
        {
            id: "1",
            name: stl.app.getColumnDisplayName('SPI_COLUMNS_AND_LABELS_SUBTASK_TYPE_SEQUENTIAL')
        }
    ];
    taskTypes = [{
        id: "snet",
        name: SNET_TEXT
    }, {
        id: "purchasing",
        name: PURCHASING_TEXT
    }, {
        id: "normal",
        name: Normal
    },{
        id: "IMS",
        name: "IMS"
    },{
        id:"CMS",
        name:"CMS"
    },{
        id:"PE",
        name:"PE"
    }];
    statusTypes=[{
        status:'NS',
        name:DataStore.FilterNames.NotStartedFilterName
    },{
        status:'IP',
        name:DataStore.FilterNames.InProgressFilterName
    },{
        status:'RL',
        name:DataStore.FilterNames.ReleasedFilterName
    },{
        status:'CO',
        name:DataStore.FilterNames.CompletedFilterName
    }];

    mappedProjectStore = Ext.create('Ext.data.Store', {
        id: 'mappedProjectStore',
        fields: ["ProjectName", "Division", "SSTField", "Portfolio", "BusinessUnit", "ProjectManager", "Customer", "Attribute1", "Attribute2", "Attribute3", "Attribute4", "Attribute5", {  
            name: 'checked',
            type: 'boolean',          
            defaultValue: true
        }],        
        sorters: [{
            property: 'ProjectName',
            direction: 'ASC'
        }]
    });
    if(DataStore.MappedProjectsInfo != null)
        mappedProjectStore.loadData(DataStore.MappedProjectsInfo, true);

    divisionStore = Ext.create('Ext.data.Store', {
        id: 'divisionStore',
        fields: ["DivisionName", {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'DivisionName',
            direction: 'ASC'
        }]
    });
    if(DataStore.DivisonList != null)
        divisionStore.loadData(DataStore.DivisonList, true);
    portfolioStore = Ext.create('Ext.data.Store', {
        id: 'portfolioStore',
        fields: ["PortfolioName", "DivisionName", {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'PortfolioName',
            direction: 'ASC'
        }]
    });
    if(DataStore.PortfolioList != null)
        portfolioStore.loadData(DataStore.PortfolioList, true);
    businessStore = Ext.create('Ext.data.Store', {
        fields: ['BusinessUnitName', 'DivisionName', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        id: 'businessUnitStore',
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'BusinessUnitName',
            direction: 'ASC'
        }]

    });
    if(DataStore.BUList!= null)
        businessStore.loadData(DataStore.BUList, true);
    customerStore = Ext.create('Ext.data.Store', {
        fields: ['CustomerName', 'DivisionName', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        id: 'customerStore',
        listeners: {
            datachanged: function (store, eOPts) {

            }
        },
        sorters: [{
            property: 'CustomerName',
            direction: 'ASC'
        }]

    });
    if(DataStore.CustomerList != null)
        customerStore.loadData(DataStore.CustomerList, true);
    managerStore = Ext.create('Ext.data.Store', {
        fields: ['ProjectManagerID', 'ProjectManagerName', 'DivisionName', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        id: 'managerStore',
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'ProjectManagerName',
            direction: 'ASC'
        }]

    });
    if(DataStore.ProjectManagerList != null)
        managerStore.loadData(DataStore.ProjectManagerList, true);
    TemplateStore = Ext.create('Ext.data.Store', {
        fields: ['Uid','Name', 'Division', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        },{name:'Description', type:'string'}],
        id: 'TemplateStore',
        listeners: {
            datachanged: function (store, eOPts) {

            }
        },
        sorters: [{
            property: 'Name',
            direction: 'ASC'
        }]

    });
    var TemplateList = [];
    GetTemplates(DataStore.ProjectList, TemplateList);
    
    TemplateStore.loadData(TemplateList, true);

    function GetTemplates (ProjectList, TemplateList){
        for (i=0; i<ProjectList.length; i++){
            if (ProjectList[i].IsTemplate){
                TemplateList.push(ProjectList[i]);
            }
        }
       var DefaultTemplate = {};
        DefaultTemplate.Name = SELECT_TEMPLATE;
        DefaultTemplate.Description = "";
        DefaultTemplate.Division = "";
        TemplateList.push(DefaultTemplate);
    }
   
    if(DataStore.Attribute1List != null){
        Attribute1Store = Ext.create('Ext.data.Store', {
        fields: ['Attribute1Name', 'DivisionName', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        id: 'Attribute1Store',
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'Attribute1Name',
            direction: 'ASC'
        }]
    });
    Attribute1Store.loadData(DataStore.Attribute1List, true);
    }
    if(DataStore.Attribute2List != null){
        Attribute2Store = Ext.create('Ext.data.Store', {
        fields: ['Attribute2Name', 'DivisionName', {
            name: 'checked',
            type: 'boolean',
            defaultValue: true
        }],
        id: 'Attribute2Store',
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'Attribute2Name',
            direction: 'ASC'
        }]
    });
    Attribute2Store.loadData(DataStore.Attribute2List, true);
    }
    if(DataStore.Attribute3List != null){
        Attribute3Store = Ext.create('Ext.data.Store', {
            fields: ['Attribute3Name', 'DivisionName', {
                name: 'checked',
                type: 'boolean',
                defaultValue: true
            }],
            id: 'Attribute3Store',
            listeners: {
                datachanged: function (store, eOpts) {

                }
            },
            sorters: [{
                property: 'Attribute3Name',
                direction: 'ASC'
            }]
        });
        Attribute3Store.loadData(DataStore.Attribute3List, true);
    }
    if(DataStore.Attribute4List != null){
        Attribute4Store = Ext.create('Ext.data.Store', {
            fields: ['Attribute4Name', 'DivisionName', {
                name: 'checked',
                type: 'boolean',
                defaultValue: true
            }],
            id: 'Attribute4Store',
            listeners: {
                datachanged: function (store, eOpts) {

                }
            },
            sorters: [{
                property: 'Attribute4Name',
                direction: 'ASC'
            }]
        });
        Attribute4Store.loadData(DataStore.Attribute4List, true);
    }
    if(DataStore.Attribute5List != null){
        Attribute5Store = Ext.create('Ext.data.Store', {
            fields: ['Attribute5Name', 'DivisionName', {
                name: 'checked',
                type: 'boolean',
                defaultValue: true
            }],
            id: 'Attribute5Store',
            listeners: {
                datachanged: function (store, eOpts) {

                }
            },
            sorters: [{
                property: 'Attribute5Name',
                direction: 'ASC'
            }]
        });
        Attribute5Store.loadData(DataStore.Attribute5List, true);
    }
    projectStore = Ext.create('Ext.data.Store', {
        fields: ['Name', 'Manager', 'Status', 'Division', 'Portfolio', 'BusinessUnit', 'Customer',
            'Uid'
        ],
        id: 'projectStore',
        listeners: {
            datachanged: function (store, eOpts) {

            }
        },
        sorters: [{
            property: 'Name',
            direction: 'ASC'
        }]
    });
    projectStore.loadData(DataStore.ProjectList, true);
}


function showCentralMenu() {
    $(".centralMenu").show();
}

function hideCentralMenu() {
    $(".centralMenu").hide();
}

stl.app.onTaskSelectionChange = function(evt, $task) {
    stl.app.selectedTaskEl = $task;
}

function getHighlightMenu(evt) {
    var $menu = this.$highlightMenu,
        project = stl.model.Project.getProject();   // FIXME can't depend on global access to project
    var task = stl.app.selectedTaskEl;
    if (!$menu) {
        $(document.body).children(".highlight-popup").remove();
        $menu = this.$highlightMenu = $(".page-header .highlight").find(".tool-popup").clone(true);
        $(document.body).append($menu);
    }
    $menu.empty();

    function createMenuItem(text, cssClasses) {
        var $item = $([
            '<div class="tool-item">',
                '<label>',
                    text,
                '</label>',
            '</div>'].join(""));
        if (cssClasses) {
            $item.addClass(cssClasses);
        }
        return $item;
    }

    var $menuItem1 = createMenuItem(NONE);
    $menuItem1.off("click").on("click", highlightNoneClicked.bind(this, $menuItem1));
    //To show highlight popup in tabular view with only error option
    if(window.currentViewId != "table"){
            var $menuItem2 = createMenuItem(RESOURCES, "highlight-resources");
            $menuItem2.append($('<div class="tool-popup highlight-resources-popup"></div>'));
            $menuItem2.off("click").on("click", stl.app.onHighlightResourcesClick.bind(this));

            var $menuItem3 = createMenuItem(CC_TASKS, (!project.isIDCCed ? "disabled" : ""));
            $menuItem3.off("click").on("click", function(evt) {
                if (!project.isIDCCed) {
                    return;
                }
                clearAllHighlight();
                $(".page-header .highlight").find(".button-text").text("Highlight: " + evt.currentTarget.textContent);
                //Highlight requires nodes to be expanded to show all highlighted task
                $(document).trigger('expandAllScopeNodes');

                $(document).trigger('highlightcctasks');
            });
            
            var $menuItem4 = createMenuItem( RESOURCE_CONTENTION, (!isEnableResourceContentionOptionInHighlight(project)? "disabled" : ""));
            $menuItem4.off("click").on("click", onHighlightResourceContentionClick.bind(this, $menuItem4));            

            var $menuItem5 = createMenuItem(IMMEDIATE_PREDECESSORS);
            $menuItem5.off("click").on("click", onHighlightImmediatePredecessorsClick.bind(this, $menuItem5, task));

            var $menuItem6 = createMenuItem(IMMEDIATE_SUCCESSORS);
            $menuItem6.off("click").on("click", onHighlightImmediateSuccessorsClick.bind(this, $menuItem6, task));
            
            var $menuItem7 = createMenuItem(ALL_PREDECESSORS);
            $menuItem7.off("click").on("click", onHighlightAllPredecessorsClick.bind(this, $menuItem7, task));
            
            var $menuItem8 = createMenuItem(ALL_SUCCESSORS);
            $menuItem8.off("click").on("click", onHighlightAllSuccessorsClick.bind(this, $menuItem8, task));

            var $menuItem9 = createMenuItem(SHOW_CONSTRANING_SUCCESSOR_CHAIN);
            $menuItem9.off("click").on("click", onHighlightConstrainingSuccessorChainClick.bind(this, $menuItem9, task));

            var $menuItem10 = createMenuItem(SHOW_LONGEST_PREDECESSOR_CHAIN);
            $menuItem10.off("click").on("click", onHighlightLongestPredecessorChainClick.bind(this, $menuItem10, task));
            
            var $menuItem11 = createMenuItem(PHASES, "highlight-phases");
            $menuItem11.append($('<div class="tool-popup highlight-phases-popup"></div>'));
            $menuItem11.off("click").on("click", stl.app.onHighlightPhasesClick.bind(this));

            var $menuItem12 = createMenuItem(TASK_MANAGERS, "highlight-task-managers");
            $menuItem12.append($('<div class="tool-popup highlight-task-managers-popup"></div>'));
            $menuItem12.off("click").on("click", stl.app.onHighlightTaskManagersClick.bind(this)); 
            
            var isReplanEnabled = false;
            if($(".replan-mode-btn").hasClass("active btn-primary")){
                isReplanEnabled = true;
            }
            else if ($(".plan-mode-btn").hasClass("active btn-primary")){
                isReplanEnabled = false;
            }
            var $menuItem13 = createMenuItem(PROJECT_CMS_CHAINS, (isReplanEnabled ? "highlight-chains" : "disabled"));
            if(isReplanEnabled){
                $menuItem13.append($('<div class="tool-popup highlight-chains-popup"></div>'));
                $menuItem13.off("click").on("click", stl.app.onHighlightChainsClick.bind(this));
            }            

            var $menuItem14 = createMenuItem( SLACK, (!isEnableSlackInHighlightDropdown(project) ? "disabled" : ""));
            $menuItem14.off("click").on("click", onHighlightSlackClick.bind(this, $menuItem14));
    }

    $menu.append($menuItem1);
    //To show highlight popup in tabular view with only error option
    if(window.currentViewId != "table"){
        $menu.append($menuItem2);
        $menu.append($menuItem11);
        $menu.append($menuItem12);
        $menu.append($menuItem3);
        $menu.append($menuItem4);
        $menu.append($menuItem14);    
        $menu.append($menuItem5);
        $menu.append($menuItem6);
        $menu.append($menuItem7);
        $menu.append($menuItem8);
        $menu.append($menuItem9);
        $menu.append($menuItem10);   
        $menu.append($menuItem13);
               
    }
    return $menu;
}

/*Resource highlight menu items */
stl.app.onHighlightResourcesClick = function (evt) {
    var retainResourceColorMenu = true; //resource color menu is not cleared when user clicks on resource menu for highlight  
    //matrixView = $(".matrix-view").data("view");    // FIXME move resource highlight menu generation out of matrix view
    //$(".page-header .highlight").find(".button-text").text("Highlight: " + evt.currentTarget.textContent);
    //clearAllHighlight(retainResourceColorMenu,false,false,false);
    hidePopups(getClassNameForRetainOption(retainResourceColorMenu,false,false, false));
    //Highlight requires nodes to be expanded to show all highlighted task
    $(document).trigger('expandAllScopeNodes');

    var $button = $(evt.target).closest(".highlight-resources"),
        buttonOffset = $button.offset(),
        $menu = stl.app.getResourceHighlightMenu();
    var showing = $menu.is(":visible");
    if (!showing) {
        $menu.show();
        $menu.css({
            top: buttonOffset.top,
            left: buttonOffset.left + $button.outerWidth()
        });
        evt.stopPropagation();
    }
};

stl.app.getResourceHighlightMenu = function () {
    if (!stl.app.$highlightResourcesMenu) {
        $(document.body).children(".highlight-resources-popup").remove();
        stl.app.$highlightResourcesMenu = $(".highlight-resources").find(".tool-popup").clone(true);
        $(document.body).append(stl.app.$highlightResourcesMenu);
    }
    if (!stl.app.resourceHighlightMenuIsCurrent) {
        stl.app.updateResourceHighlightMenu(stl.app.$highlightResourcesMenu);
    }
    return stl.app.$highlightResourcesMenu;
};

stl.app.updateResourceHighlightMenu = function ($menu, view) {
    var resources = stl.app.getAvailableResourceOptions(),
        i = 1;
    $menu.empty();
    $menu.append($([
        '<div class="tool-item" data-cmd="toggle-all-resource-highlight">',
        '<label>',
        '<input type="checkbox" /> <span class="resource-name">',
        ALL_TEXT,
        '</span>',
        '</label>',
        '</div>'
    ].join("")));
    resources.forEach(function (resource) {
        var $menuItem = $([
            '<div class="tool-item" data-cmd="toggle-resource-highlight">',
            '<label>',
            '<div class="resource-swatch resource-highlight-background-',
            String(i++), '"></div>',
            '<input type="checkbox" /> <span class="resource-name"></span>',
            '</label>',
            '</div>'
        ].join(""));
        if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_RESOURCES + 1))
            i = 1;
        $menuItem.find(".resource-name").text(resource.text);
        $menuItem.data("resource-id", resource.id);
        $menu.append($menuItem);
    });
    stl.app.addHighlightPopupMenuHandlers($menu);
    stl.app.resourceHighlightMenuIsCurrent = true;
};

stl.app.getAvailableResourceOptions = function () {
    stl.app.cachedAvailableResourceOptions = stl.app.ProjectDataFromServer.getAvailableResources().map(function (res) {
        return {
            id: res.uid,
            text: res.Name
        };
    });
    stl.app.cachedResourcesById = stl.app.ProjectDataFromServer.getAvailableResourcesByUid();
    return stl.app.cachedAvailableResourceOptions;
};

stl.app.onHighlightChainsClick = function(evt) {

    var retianChainsColorMenu = true, //chains color menu is not cleared when user clicks on resource menu for highlight  
        matrixView = $(".matrix-view").data("view");    // FIXME move resource highlight menu generation out of matrix view
    //$(".page-header .highlight").find(".button-text").text("Highlight: " + evt.currentTarget.textContent);
    //clearAllHighlight(false,false,false,retianChainsColorMenu);
    hidePopups(getClassNameForRetainOption(false,false,false,retianChainsColorMenu));
    var $button = $(evt.target).closest(".highlight-chains"),
        buttonOffset = $button.offset(),
        $menu = stl.app.getChainsHighlightMenu();
    var showing = $menu.is(":visible");
    if (!showing) {
        $menu.show();
        $menu.css({
            top: buttonOffset.top,
            left: buttonOffset.left + $button.outerWidth()
        });
        evt.stopPropagation();
    }
};

stl.app.getChainsHighlightMenu = function (view) {
    if (!stl.app.$chainsHighlightMenu) {
        $(document.body).children(".highlight-chains-popup").remove();
        stl.app.$chainsHighlightMenu = $(".highlight-chains").find(".tool-popup").clone(true);
        $(document.body).append(stl.app.$chainsHighlightMenu);
    }
    if (!stl.app.chainsHighlightMenuIsCurrent) {
        stl.app.updateChainsHighlightMenu(stl.app.$chainsHighlightMenu);
    }
    return stl.app.$chainsHighlightMenu;
};


stl.app.updateChainsHighlightMenu = function ($menu, view) {
    var allChainIdsSorted = stl.app.ProjectDataFromServer.getAllChainIds().sort(function (a, b) {
        return a - b
    });
    var chainsColorMap = stl.app.ProjectDataFromServer.getChainsColorMap();
    $menu.empty();
    $menu.append($([
        '<div class="tool-item" data-cmd="toggle-all-chains-highlight">',
        '<label>',
        '<input type="checkbox" /> <span class="chain-number">',
        ALL_TEXT,
        '</span>',
        '</label>',
        '</div>'
    ].join("")));
    allChainIdsSorted.forEach(function (chainId) {
        var $menuItem = $([
            '<div class="tool-item" data-cmd="toggle-chain-highlight">',
            '<label>',
            '<div class="chain-swatch chain-highlight-background-',
            String(chainsColorMap[chainId].colorId), '"></div>',
            '<input type="checkbox" /> <span class="chain-number"></span>',
            '</label>',
            '</div>'
        ].join(""));
        $menuItem.find(".chain-number").text(chainId);
        $menuItem.find("input[type=checkbox]").attr('checked',chainsColorMap[chainId].isChecked);
        $menuItem.data("chain-id", chainId);
        $menu.append($menuItem);
    });
    stl.app.addHighlightPopupMenuHandlers($menu);
    stl.app.chainsHighlightMenuIsCurrent = true;
};


/*Phase highlight Menu related*/

stl.app.onHighlightPhasesClick = function (evt) {
    var retianPhaseColorMenu = true; //phase color menu is not cleared when user clicks on phase menu for highlight  
    //matrixView = $(".matrix-view").data("view");
    //$(".page-header .highlight").find(".button-text").text("Highlight: " + evt.currentTarget.textContent);
    //clearAllHighlight(false, retianPhaseColorMenu,false,false);
    hidePopups(getClassNameForRetainOption(false, retianPhaseColorMenu,false,false));
    //Highlight requires nodes to be expanded to show all highlighted task
    $(document).trigger('expandAllScopeNodes');

    var $button = $(evt.target).closest(".highlight-phases"),
        buttonOffset = $button.offset(),
        $menu = stl.app.getPhaseHighlightMenu();
    var showing = $menu.is(":visible");
    if (!showing) {
        $menu.show();
        $menu.css({
            top: buttonOffset.top,
            left: buttonOffset.left + $button.outerWidth()
        });
        evt.stopPropagation();
    }
};

stl.app.getPhaseHighlightMenu = function () {
    if (!stl.app.$highlightPhasesMenu) {
        $(document.body).children(".highlight-phases-popup").remove();
        stl.app.$highlightPhasesMenu = $(".highlight-phases").find(".tool-popup").clone(true);
        $(document.body).append(stl.app.$highlightPhasesMenu);
    }
    if (!stl.app.phaseHighlightMenuIsCurrent) {
        stl.app.updatePhaseHighlightMenu(stl.app.$highlightPhasesMenu);
    }
    return stl.app.$highlightPhasesMenu;
};

stl.app.updatePhaseHighlightMenu = function ($menu) {
    var phases = stl.app.ProjectDataFromServer.phases,
        i = 1;
    $menu.empty();
    $menu.append($([
        '<div class="tool-item" data-cmd="toggle-all-phase-highlight">',
        '<label>',
        '<input type="checkbox" /> <span class="phase-name">',
        ALL_TEXT,
        '</span>',
        '</label>',
        '</div>'
    ].join("")));
    phases.forEach(function (phase) {
        if (phase.type == "normal") {
            var $menuItem = $([
                '<div class="tool-item" data-cmd="toggle-phase-highlight">',
                '<label>',
                '<div class="phase-swatch phase-highlight-background-',
                String(i++), '"></div>',
                '<input type="checkbox" /> <span class="phase-name"></span>',
                '</label>',
                '</div>'
            ].join(""));
            if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_PHASES + 1))
                i = 1;
            $menuItem.find(".phase-name").text(phase.name);
            $menuItem.data("phase-id", phase.uid);
            $menu.append($menuItem);
        }
    });
    stl.app.addHighlightPopupMenuHandlers($menu);
    stl.app.phaseHighlightMenuIsCurrent = true;
};


/*Task Manager highlight menus*/
stl.app.onHighlightTaskManagersClick = function (evt) {
    var retainTaskManagerColorMenu = true; //phase color menu is not cleared when user clicks on phase menu for highlight  
    //matrixView = $(".matrix-view").data("view");
    //$(".page-header .highlight").find(".button-text").text("Highlight: " + evt.currentTarget.textContent);
    //clearAllHighlight(false, false, retainTaskManagerColorMenu,false);
    hidePopups(getClassNameForRetainOption(false, false, retainTaskManagerColorMenu,false));
    //Highlight requires nodes to be expanded to show all highlighted task
    $(document).trigger('expandAllScopeNodes');

    var $button = $(evt.target).closest(".highlight-task-managers"),
        buttonOffset = $button.offset(),
        $menu = stl.app.getTaskManagerHighlightMenu();
    var showing = $menu.is(":visible");
    if (!showing) {
        $menu.show();
        $menu.css({
            top: buttonOffset.top,
            left: buttonOffset.left + $button.outerWidth()
        });
        evt.stopPropagation();
    }
};

stl.app.getTaskManagerHighlightMenu = function () {
    if (!stl.app.$highlightTaskManagersMenu) {
        $(document.body).children(".highlight-task-managers-popup").remove();
        stl.app.$highlightTaskManagersMenu = $(".highlight-task-managers").find(".tool-popup").clone(true);
        $(document.body).append(stl.app.$highlightTaskManagersMenu);
    }
    if (!stl.app.taskManagerHighlightMenuIsCurrent) {
        stl.app.updateTaskManagerHighlightMenu(stl.app.$highlightTaskManagersMenu);
    }
    return stl.app.$highlightTaskManagersMenu;
};

stl.app.updateTaskManagerHighlightMenu = function ($menu) {
    var taskManagers = stl.app.availablePeopleAndTeams,
        i = 1;
    $menu.empty();
    $menu.append($([
        '<div class="tool-item" data-cmd="toggle-all-task-manager-highlight">',
        '<label>',
        '<input type="checkbox" /> <span class="task-manager-name">',
        ALL_TEXT,
        '</span>',
        '</label>',
        '</div>'
    ].join("")));
    taskManagers.forEach(function (manager) {
        var $menuItem = $([
            '<div class="tool-item" data-cmd="toggle-task-manager-highlight">',
            '<label>',
            '<div class="task-manager-swatch task-manager-highlight-background-',
            String(i++), '"></div>',
            '<input type="checkbox" /> <span class="task-manager-name"></span>',
            '</label>',
            '</div>'
        ].join(""));
        if (i == (MAX_NUMBER_OF_COLORS_USED_FOR_HIGHLIGHTING_TASK_MANAGERS + 1))
            i = 1;
        $menuItem.find(".task-manager-name").text(manager.FullName);
        $menuItem.data("task-manager-id", manager.Name);
        $menu.append($menuItem);
    });
    stl.app.addHighlightPopupMenuHandlers($menu);
    stl.app.taskManagerHighlightMenuIsCurrent = true;
};



function highlightNoneClicked(item, evt) {
    if (item.hasClass('select')) {
        item.removeClass('select');
    }
    else {
        $(".highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
        item.addClass('select');
        clearAllHighlight();
    }
}

function getClassNameForRetainOption(retainResourceColorMenu,retainPhaseColorMenu,retainTaskManagerColorMenu, retainChainColorMenu) {
    var className;
    if (retainChainColorMenu) {
        className = "highlight-chains-popup";
    } else if (retainResourceColorMenu) {
        className = "highlight-resources-popup";
    } else if (retainPhaseColorMenu) {
        className = "highlight-phases-popup";
    } else if (retainTaskManagerColorMenu) {
        className = "highlight-task-managers-popup";
    }
    return className;
}
function clearAllHighlight(retainResourceColorMenu,retainPhaseColorMenu,retainTaskManagerColorMenu, retainChainColorMenu)
{
    $(document).trigger("taskMultiSelectEnd");
    removeErrorHighlight();
    removePredecessorTaskHighlight();
    removeCCTaskHighlight();
    removeResourceContentionHighlight();
    removeSlackHighlight();

    var timelineViewInstance = Ext.getCmp("timelineview");
    if (timelineViewInstance) {
       timelineViewInstance.tasksToBeHighlighted = undefined;
    }
    var chainViewInstance = Ext.getCmp("chainview");
    if (chainViewInstance) {
       chainViewInstance.tasksToBeHighlighted = undefined;
    }
        
    var retainPopupOption = getClassNameForRetainOption(retainResourceColorMenu,retainPhaseColorMenu,retainTaskManagerColorMenu, retainChainColorMenu);
    if (!retainChainColorMenu) {
        removeChainsHighlight();
    } 
    if (!retainResourceColorMenu) {
        removeResourcesHighlight();
    }
    if (!retainPhaseColorMenu) {
        removePhasesHighlight();
    }
    if (!retainTaskManagerColorMenu) {
        removeTaskManagersHighlight();
    }
    resetPopups(retainPopupOption);
    removeLinksHighlight();
    removeConstrainingSuccessorChainHighlight();

    //MM: Removed setting selectedTask to null since quick edit mode won't exit
    $(document).trigger('allhighlightscleared');
    removeMilestoneHighlight();
    setResourceGridRowClass('');
    
}

function setResourceGridRowClass(className)
{
    var resView = Ext.getCmp('resGrid').getView();
    resView.getRowClass = className;
    resView.refresh();
}

function removeLinksHighlight()
{
    var me = $(".matrix-view").data("view");
    if (me) {
        if (me.linksView){
            var links = me.linksView.linksByID;
            $.each(links, function(index, value) {
                var link = value;
                var toTask = value.to;
                var fromTask = value.from;
                var isLinkInCC = false;

                isLinkInCC = me.linksView.isLinkInCriticalChain(toTask, fromTask);

                if(isLinkInCC)
                {
                    link.color = null;
                    me.linksView.triggerRefresh();
                }
            
            }); 
            }
        }
    
}

function removeErrorHighlight()
{
    $(".highlightedErrorTask").removeClass("highlightedErrorTask");
    $(".timeline-view").removeClass("highlightedErrorTask");
    //To remove error highlight in tabular view
    var tableView = Ext.getCmp('tableview');
    if(tableView){
        els = Ext.select('.errorhighlightclass', tableView.getView().getEl());
        if(els.getCount() > 0){
            els.each(function(el) {
                $(el.dom).removeClass('errorhighlightclass');
            });
        }
    }
}

function removeMilestoneHighlight()
{
    $(".highlightedMilestoneTask").removeClass("highlightedMilestoneTask");
    $(".timeline-view").removeClass("highlightedMilestoneTask");
}

function removePredecessorTaskHighlight()
{
    var highlightedResouces = $("[class*='task-highlight']");
    for (i = 0; i < highlightedResouces.length; i++){
        highlightedResouces[i].className = $(highlightedResouces[i]).attr('class').replace(/\btask-highlight.*?\b/g, '');
    }
}

function removeCCTaskHighlight()
{
    // TODO this should be handled by each view in response to a global event
    $(".highlightedCCTask").removeClass("highlightedCCTask");
    $(".timeline-view").removeClass("highlighting-cc");
}

function removeResourceContentionHighlight()
{
    // TODO this should be handled by each view in response to a global event
    $(".resourceContentionTask").removeClass("resourceContentionTask");
    $(".timeline-view").removeClass("resourceContentionTask");
}

function removeSlackHighlight()
{
    // TODO this should be handled by each view in response to a global event
    $(".slack").removeClass("slack");
    $(".timeline-view").removeClass("slack");
}

function removeConstrainingSuccessorChainHighlight()
{
    // TODO this should be handled by each view in response to a global event
    $(".constrainingSuccessorTask").removeClass("constrainingSuccessorTask");
    $(".timeline-view").removeClass("constrainingSuccessorTask");
}

function removeResourcesHighlight()
{
     var highlightedResouces = $("[class*='highlight-resource-']");
    for (i = 0; i < highlightedResouces.length; i++){
        highlightedResouces[i].className = $(highlightedResouces[i]).attr('class').replace(/\bhighlight-resource-.*?\b/g, '');
    }
    if(highlightedResouces.length > 0)
        removeLegend();
    stl.app.resourceHighlightMenuIsCurrent = false;
}
function removePhasesHighlight()
{
    var highlightedPhases = $("[class*='highlight-phase-']");
    for (i = 0; i < highlightedPhases.length; i++){
        highlightedPhases[i].className = $(highlightedPhases[i]).attr('class').replace(/\bhighlight-phase-.*?\b/g, '');
    }
    if(highlightedPhases.length > 0)
        removeLegend();
    stl.app.phaseHighlightMenuIsCurrent = false;
}
function removeTaskManagersHighlight()
{
    var highlightedTaskManagers = $("[class*='highlight-task-manager-']");
    for (i = 0; i < highlightedTaskManagers.length; i++){
        highlightedTaskManagers[i].className = $(highlightedTaskManagers[i]).attr('class').replace(/\bhighlight-task-manager-.*?\b/g, '');
    }
    if(highlightedTaskManagers.length > 0)
        removeLegend();
    stl.app.taskManagerHighlightMenuIsCurrent = false;
}
function removeChainsHighlight()
    {
         var highlightedChains = $("[class*='highlight-chain-']");
        for (i = 0; i < highlightedChains.length; i++){
            highlightedChains[i].className = $(highlightedChains[i]).attr('class').replace(/\bhighlight-chain-.*?\b/g, '');
        }
        if(highlightedChains.length > 0)
            removeLegend();
        stl.app.chainsHighlightMenuIsCurrent = false;
}
function hidePopups (exceptionOption){
    var removePopupOptions = Object.create(HIGHLIGHT_POPUPS_CSS_CLASS_SELECTOR);
    if (exceptionOption)
        removePopupOptions.splice(removePopupOptions.indexOf("."+exceptionOption),1);
    $(removePopupOptions.join(",")).hide();
}
function resetPopups (exceptionOption) {
    var removePopupOptions = Object.create(HIGHLIGHT_POPUPS_CSS_CLASS_SELECTOR);
    if (exceptionOption){
        removePopupOptions.splice(removePopupOptions.indexOf("."+exceptionOption),1);
        $('.tool-popup:not(".' + exceptionOption + '")').find("input").prop("checked",false); // retain checked attribute of given option.
    } else {
        $('.tool-popup').find("input").prop("checked",false); // uncheck all checkboxes in popups.
    }
    if(exceptionOption != "highlight-chains-popup")
        resetChainColorMap();
    $(removePopupOptions.join(",")).hide();
}
function resetChainColorMap(){
    var chainsColorMap = stl.app.ProjectDataFromServer.getChainsColorMap();
    _.each(chainsColorMap,function(obj){
        obj.isChecked = false;
    });
}
function onHighlightCCTasksClicked(item, evt) {
    if ($(this).hasClass('select')) {
        $(this).removeClass('select');
    }
    else {
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        $(".highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
        $(this).addClass('select');
    }
}

function onHighlightResourceContentionClick(item, evt) {
    if (!isEnableResourceContentionOptionInHighlight(stl.app.ProjectDataFromServer)) {
        return;
    }
    if ($(this).hasClass('select')) {
        $(this).removeClass('select');
    }
    else {
        $(".highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
        $(this).addClass('select');
    }
    clearAllHighlight();
    toggleDockingGrids('resGrid', 'resourceSheet', true);
    //Highlight requires nodes to be expanded to show all highlighted task
    $(document).trigger('expandAllScopeNodes');

    $(document).trigger('highlightResourceContention');
}

function onHighlightSlackClick(item, evt) {
    if (!isEnableSlackInHighlightDropdown(stl.app.ProjectDataFromServer)) {
        return;
    }
    if ($(this).hasClass('select')) {
        $(this).removeClass('select');
    }
    else {
        $(".highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
        $(this).addClass('select');
    }
    clearAllHighlight();
    //Highlight requires nodes to be expanded to show all highlighted task
    $(document).trigger('expandAllScopeNodes');
       
    $(document).trigger('highlightSlack');
}




function onHighlightConstrainingSuccessorChainClick(item, task, evt){
    if(task){
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        if(currentView == "matrix"){
            stl.app.matrixView.onHighlightConstraining(null,task);
        }
        else{
            if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){
                Ext.getCmp("chainview").onHighlightConstraining(null,task);
            }
            else
                Ext.getCmp("timelineview").onHighlightConstraining(null,task);
        }
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
    }    
    else{
        PPI_Notifier.info(SELECT_TASK_CONSTR_SUCC_CHAIN);
    }
    
}

stl.app.onHighlightConstraining = function (evt, $task) {
    // TODO use UIDs to find and highlight corresponding task, should not be passing around $elements here
    //if ($task.closest(this.$view).length === 0) return;
    stl.app.highlightConstrainingTasks($task);
};

stl.app.highlightConstrainingTasks = function (task) {
    var me = this;
    //if ($(task).closest(this.$view).length === 0) return;

    var taskdata = task.data("model");
    constrainingTaskIds = this.project.getConstrainingTasks(taskdata.uid);
    if (constrainingTaskIds.length > 0) {
        me.highlightChain(constrainingTaskIds, true, "constrainingSuccessorTask");
        stl.app.isHighlightPresent = true;
    }
    else
        stl.app.isHighlightPresent = false;
};



function onHighlightLongestPredecessorChainClick(item, task, evt){
    
    if(task){
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        if(currentView == "matrix"){
            stl.app.matrixView.onhighlightLongestPredecessorChain(null,task);
        }
        else{
            if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW){
                Ext.getCmp("chainview").onhighlightLongestPredecessorChain(null,task);
            }
            else
                Ext.getCmp("timelineview").onhighlightLongestPredecessorChain(null,task);
        }

        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
    }    
    else{
        PPI_Notifier.info(PLEASE_SELECT_A_TASK_TO_HIGHLIGHT + SPACE_CONST + LONGEST_PREDECESSOR_CHAIN);
    }
}



function onHighlightImmediatePredecessorsClick(item, task, evt) {
    if (task) {
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        var currentTaskUid;
        if (currentView == "matrix") {
            currentTaskUid = $(task).data("model").uid;
        }
        else {
            currentTaskUid = $(task).find(".task").data("task-uid");
        }
        highlightImmediatePredecessors(currentTaskUid);
    }
    else {
        PPI_Notifier.info(SELECT_TASK_IMMED_PRED);
    }

}
function onHighlightAllPredecessorsClick(item, task, evt) {
    if (task) {
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        var currentTaskUid;
        if (currentView == "matrix") {
            currentTaskUid = $(task).data("model").uid;
        }
        else {
            currentTaskUid = $(task).find(".task").data("task-uid");
        }
        highlightAllPredecessors(currentTaskUid);
    }
    else {
        PPI_Notifier.info(SELECT_TASK_ALL_PRED);
    }
}

function highlightImmediatePredecessors(currentTaskUid) {
   highlightPredecessors(currentTaskUid,false);
   $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + IMMEDIATE_PREDECESSORS);
}
function highlightAllPredecessors (currentTaskUid) {
   highlightPredecessors(currentTaskUid,true);
   $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + ALL_PREDECESSORS);
}
function highlightLongestPredecessorChainByUid(currentId) {
    var project = stl.app.ProjectDataFromServer,
        matrixView = $(".matrix-view").data("view");
        if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
            var timelineView = Ext.getCmp('chainview');
        else
            var timelineView = Ext.getCmp("timelineview");

                
    var milestoneElement = project.getTaskOrMilestoneByUid(currentId);
    tasksInPredecessorChain = chainHighlightInstance.highlightLongestPredecessorChain(milestoneElement);
    if (tasksInPredecessorChain.length > 0) {
        if (timelineView) {
            timelineView.tasksToBeHighlighted = tasksInPredecessorChain;
            timelineView.highlightChain(tasksInPredecessorChain, "constrainingSuccessorTask",currentId);
        }
        if(matrixView) {
            matrixView.highlightChain(tasksInPredecessorChain, false, "constrainingSuccessorTask");
        }
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + SHOW_LONGEST_PREDECESSOR_CHAIN);
        $(document).trigger("highlightchange");
        stl.app.highlightedTasks = tasksInPredecessorChain;
        stl.app.isHighlightPresent = true;
    }
}

function highlightPredecessors (currentTaskUid, isAllPredecessorsRequired) {
    var me = this;
    var predecessorsArray = [];

    var matrixView = $(".matrix-view").data("view");
    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
        var timelineView = Ext.getCmp("chainview");
    else
        var timelineView = Ext.getCmp("timelineview");

    getAllPredecessorsOfTask(predecessorsArray, currentTaskUid, isAllPredecessorsRequired);

    // FIXME links view should not know anything about matrix view or timeline views, or tasks
    if (timelineView) {
        timelineView.tasksToBeHighlighted = predecessorsArray;
        timelineView.highlightChain(predecessorsArray, "constrainingSuccessorTask",currentTaskUid);
    }
    if(matrixView) {
        matrixView.highlightChain(predecessorsArray, false, "constrainingSuccessorTask");
    }
    stl.app.highlightedTasks = predecessorsArray;
    stl.app.isHighlightPresent = true;

}
    
function onHighlightImmediateSuccessorsClick(item, task, evt) {
    if (task) {
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        var currentTaskUid;
        if (currentView == "matrix") {
            currentTaskUid = $(task).data("model").uid;
        }
        else {
            currentTaskUid = $(task).find(".task").data("task-uid");
        }
        highlightImmediateSuccessors(currentTaskUid);
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
    }
    else {
        PPI_Notifier.info(SELECT_TASK_IMMED_SUCC);
    }
}

function onHighlightAllSuccessorsClick(item, task, evt) {
    if (task) {
        clearAllHighlight();
        //Highlight requires nodes to be expanded to show all highlighted task
        $(document).trigger('expandAllScopeNodes');

        var currentView = window.currentViewId;
        var currentTaskUid;
        if (currentView == "matrix") {
            currentTaskUid = $(task).data("model").uid;
        }
        else {
            currentTaskUid = $(task).find(".task").data("task-uid");
        }
        highlightAllSuccessors(currentTaskUid);
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + evt.currentTarget.textContent);
    }
    else {
        PPI_Notifier.info(SELECT_TASK_ALL_SUCC);
    }
}


function highlightImmediateSuccessors (currentTaskUid) {
    highlightSuccessors(currentTaskUid,false);
}

function highlightAllSuccessors (currentTaskUid) {
    highlightSuccessors(currentTaskUid,true);
}
 
function highlightSuccessors (currentTaskUid, isAllSuccessorsRequired) {
    var me = this;
    var successorsArray = [];
    var matrixView = $(".matrix-view").data("view");
    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
        var timelineView = Ext.getCmp("chainview");
    else
        var timelineView = Ext.getCmp("timelineview");


    getAllSuccessorsOfTask(successorsArray, currentTaskUid, isAllSuccessorsRequired);

    // FIXME links view should not know anything about matrix view or timeline views, or tasks
    if (timelineView) {
        timelineView.tasksToBeHighlighted = successorsArray;
        timelineView.highlightChain(successorsArray, "constrainingSuccessorTask",currentTaskUid);
    }
    if(matrixView) {
        matrixView.highlightChain(successorsArray, false, "constrainingSuccessorTask");
    }
    stl.app.highlightedTasks = successorsArray;
    stl.app.isHighlightPresent = true;
}

function getAllPredecessorsOfTask (allPredecessors, currentTaskUid, isAllPredecessorsRequired) {
    var me = this;

    var currentTaskData, taskPredecessors, task;
    var project = stl.app.ProjectDataFromServer;
    task = project.getTaskOrMilestoneByUid(currentTaskUid);

    if (task) {
        taskPredecessors = task._predecessors;
        allPredecessors.push(task);
              
        if (isAllPredecessorsRequired) {
            $.each(taskPredecessors, function (index, taskArray) {
                getAllPredecessorsOfTask(allPredecessors, taskArray.uid, isAllPredecessorsRequired);
            });
        }
        else {
            
            $.each(taskPredecessors, function (index, taskInfo) {
                allPredecessors.push(taskInfo);
            });
        }
    }
}

function getAllSuccessorsOfTask (allSuccessors, currentTaskUid, isAllSuccessorsRequired) {
    var me = this;
    
    var currentTaskData, taskSuccessors, task;
    var project = stl.app.ProjectDataFromServer;
    task = project.getTaskOrMilestoneByUid(currentTaskUid);

    if (task) {
        taskSuccessors = task._successors;
        allSuccessors.push(task);

        if (isAllSuccessorsRequired) {
            $.each(taskSuccessors, function (index, taskArray) {
                getAllSuccessorsOfTask(allSuccessors, taskArray.uid, isAllSuccessorsRequired);
            });
        }
        else {
           
            $.each(taskSuccessors, function (index, taskInfo) {
                allSuccessors.push(taskInfo);
            });
        }
    }
}

function removeLegend(){
    if(stl.app.legendEl){
        $(stl.app.legendEl.dom).remove();
        delete stl.app.legendEl;
    }
}
function updateLegend(show,colorId,text,selectionOption){
    var selection = stl.app.getCurrentHighLightOption();//[DH]: to obtain proper highlight option
    if(selectionOption)
        selection = selectionOption;
    if(!stl.app.legendEl || stl.app.legendEl.dom.getAttribute('parentid') != window.currentViewId){
        switch(window.currentViewId){
            case "matrix":
                var legendEl = $(".matrix-view")[0];
                break;
            case "table":
                var legendEl = Ext.getCmp('tableview').getEl().dom;
                break;
            case "timeline":
            case "chainview":
                if(stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                    var legendEl = Ext.getCmp('chainview').getEl().dom;
                else
                    var legendEl = Ext.getCmp('timelineview').getEl().dom;
                break;
        }
        if(stl.app.legendEl){
            $(stl.app.legendEl.dom).remove();
            delete stl.app.legendEl;
        }
        stl.app.legendEl = Ext.DomHelper.append(legendEl, {
            tag: "div",
            cls: "legend",
            cmd: selection,
            parentId: window.currentViewId
        }, true);
    }   
    switch (selection) {
        case RESOURCES:
        case PHASES:
        case TASK_MANAGERS:
        case PROJECT_CMS_CHAINS:
        case "Chains":
        case PEN_CHAIN:
            this.updateLegendContent(
                show,
                colorId,
                text
            );
            break;
       
        default:
            stl.app.legendEl.hide();
            break;
    }
}
function updateLegendContent(isChecked,colorId,name) {
    // FIXME Doesn't handle duplicate names (the whole color-assignment mechanism is only a placeholder for demo purposes)
    // TODO extract to Ext template
    var content = $(stl.app.legendEl.dom).find(".legend-item");
        if(isChecked){
            var resourceColorEl = content.find(".resource-highlight-background-"+colorId);
            if(resourceColorEl.length <= 0){
                $(stl.app.legendEl.dom).append(['<div class="legend-item">',
                        '<div class="highlight-legend-swatch resource-swatch resource-highlight-background-',
                           colorId, 
                        '"></div>',
                        '<div class="legend-item-label">',
                            name,
                        '</div>',
                    '</div>'].join(""));
                var content = $(stl.app.legendEl.dom).find(".legend-item");
                if (content.length > 1) {
                    content.sort(function (a, b) { return $(b).find(".legend-item-label").text()>$(a).find(".legend-item-label").text()? a : b;});

                    stl.app.legendEl.show();
                } 
                if (content.length < 0){
                    stl.app.legendEl.hide();
                }
            } else {
                // else gets called when there are multiple resources with same colorId. 
                var legendItemDiv = resourceColorEl[0].parentElement;
                var legendItemLabel = $(legendItemDiv).find(".legend-item-label");
                var resourcesForThisColorId = legendItemLabel.text();
                var resourcesArr = resourcesForThisColorId.split(STRING_SEPARATOR);
                
                // to avoid re-entering of same resource in legends
                if (resourcesArr.indexOf(name.toString()) < 0) {
                    resourcesArr.push(name.toString());
                }
                resourcesArr.sort();
                legendItemLabel.html(resourcesArr.join());
            }
        }
        else{
            //this is to check if 2 items (resources,phases etc.) are present with same colorId.
            //previously whole legendDiv was getting removed. Legend Div should be removed only if initially
            //there was only one item selected. In case of multiple items selected we should 
            //retain the legend with remaining items
            var legendItemDiv = $(stl.app.legendEl.dom).find(".resource-highlight-background-"+colorId).parent();
            var legendItemLabel = $(legendItemDiv).find(".legend-item-label");
            var resourcesForThisColorId = legendItemLabel.text();
                if (resourcesForThisColorId!=null && resourcesForThisColorId!=undefined) {
                var resourcesArr = resourcesForThisColorId.split(STRING_SEPARATOR);
                if (resourcesArr.length === 1) {
                    legendItemDiv.remove();
                } else {
                    var indexOf = resourcesArr.indexOf(name);
                    if (indexOf >-1) {
                        resourcesArr.splice(indexOf,1);
                    }
                    legendItemLabel.html(resourcesArr.join());
                }
            }
            setTimeout(function(){
                if(stl.app.legendEl && $(stl.app.legendEl.dom).find(".legend-item").length <= 0){
                    $(stl.app.legendEl.dom).remove();
                    delete stl.app.legendEl;
                }
            },30);
        }
}

/**
 * Called when the project model has changed externally (on the server), for example when IDCC is completed
 */
stl.app.isViewChangeRequired = false;
stl.app.isHighlightRequired = false;
stl.app.onProjectJsonChange = function (evt, newJson, readOnlyFlag, isViewChangeRequired, isHighlightRequired, isViewDebuffered) {
    if (typeof (isViewChangeRequired) == "undefined")
        stl.app.isViewChangeRequired = false;
    else
        stl.app.isViewChangeRequired = isViewChangeRequired;

    if (typeof (isHighlightRequired) == "undefined")
        stl.app.isHighlightRequired = false;
    else
        stl.app.isHighlightRequired = isHighlightRequired;
    if (isViewDebuffered){
        stl.app.isViewDebuffered = true;
    } else {
        stl.app.isViewDebuffered = false;
    }
    stl.app.loadProjectJson(newJson, readOnlyFlag/*readonly*/);
};

stl.app.initView = function (viewName) {
    if (stl.app) {

        stl.app.deleteLinks();
        var pertView = Ext.getCmp("matrix-view-container");
        if (pertView) {
            $(stl.app.matrixView.linksView).off();
            $(stl.app.matrixView.taskView).off();
            pertView.destroy();
            stl.app.matrixView.destroy();
            stl.app.deleteTaskView();
        }

        if (stl.app.matrixView) {
            delete stl.app.matrixView;
        }

        var scopeItemTree = Ext.getCmp("scopeItemTree");
        if (scopeItemTree) {
            scopeItemTree.destroy();
        }
        var timelineView = Ext.getCmp("timelineview");
        if (timelineView) {
            timelineView.destroy();
        }
        var chainView = Ext.getCmp("chainview");
        if (chainView) {
            chainView.destroy();
        }
        var tableView = Ext.getCmp("tableview");
        if (tableView)
            tableView.destroy();

        if (stl.model.Project.project) {
            stl.model.Project.project.destroy();
        }
        delete stl.app.ProjectDataFromServer;
    }

    var dockingPanels = Ext.getCmp("dockingPanel");
    if (!Ext.getCmp('CCSummarygrid')) {
        dockingPanels.add([
            {
                xtype: 'milestoneSheet',
                id: 'CCSummarygrid',
                resizable: false,
                width: '30%',
                flex: 1//,
            },
            {
                xtype: 'errorWarningSheet',
                id: 'Error_Warning_Window',
                resizable: false,
                //resizeHandles: 'e',
                width: '40%',
                flex: 1//,
            },
            {
                xtype: 'resourceSheet',
                id: 'resGrid',
                resizable: false,
                //resizeHandles: 'e',
                width: '30%',
                flex: 1//,
            }
        ]);
    }
    var content = Ext.getCmp("content");
     $('#fade').addClass('reduced-height');

    switch (viewName) {
        case PERT_VIEW: content.add({ xtype: "component", id: "matrix-view-container" });
            break;
        case TIMELINE_VIEW: 
            $(".timeline-chain-switch .switch .switch-input").prop('checked',false);
            content.add({ xtype: "timelineview", id: "timelineview" });
            break;
        case TABLE_VIEW: content.add({ xtype: "ptableview", id: "tableview", tbar: Ext.create('ProjectPlanning.view.tableView.Toolbar') });
            break;
        case CHAIN_VIEW: 
            $(".timeline-chain-switch .switch .switch-input").prop('checked',true);
            content.add({ xtype: "chainview", id:"chainview"});

    }
    Ext.getCmp('project-header').show();
    showLoadingIcon(true);
    //intialize create task toolbar
    if (!stl.app.CreateTaskToolBar) {
        stl.app.CreateTaskToolBar = new stl.view.CreateTaskToolBar();
    }

    if (!stl.app.undoStackMgr) {
        stl.app.undoStackMgr = new stl.app.undoStackManager();
    }

    ConwebPopOverInstance.initTemplate('#conweb-pop-over-template');
};

stl.app.addView = function (viewName) {
    var content = Ext.getCmp("content");

    switch (viewName) {
        case PERT_VIEW: var pertView = Ext.getCmp("matrix-view-container");
            if (pertView) {
                $(stl.app.matrixView.linksView).off();
                $(stl.app.matrixView.taskView).off();
                pertView.destroy();
                stl.app.matrixView.destroy();
                stl.app.deleteTaskView();

            }
            var scopeItemTree = Ext.getCmp("scopeItemTree");
            if (scopeItemTree) {
                scopeItemTree.destroy();
            }
            content.add({ xtype: "component", id: "matrix-view-container" });
            break;
        case TIMELINE_VIEW: var timelineView = Ext.getCmp("timelineview");
            if (timelineView) {
                timelineView.destroy();
            }
            content.add({ xtype: "timelineview", id: "timelineview" });
            break;
        case CHAIN_VIEW: var chainView = Ext.getCmp("chainview");
            if (chainView) {
                chainView.destroy();
            }
            content.add({ xtype: "chainview", id: "chainview" });
            break;
        case TABLE_VIEW: var tableView = Ext.getCmp("tableview");
            if (tableView)
                tableView.destroy();
            content.add({ xtype: "ptableview", id: "tableview", tbar: Ext.create('ProjectPlanning.view.tableView.Toolbar') });
            break;

    }
};

  stl.app.deleteLinks = function () {
      if (stl.app.matrixView) {
          if (stl.app.matrixView.linksView) {
              stl.app.matrixView.linksView.clearAll();
              delete stl.app.matrixView.linksView;
          }
      }
      
      if (Ext.getCmp("timelineview")) {
          if (Ext.getCmp("timelineview").linksView) {
              Ext.getCmp("timelineview").linksView.clearAll();
              delete Ext.getCmp("timelineview").linksView;
          }
      }
      if (Ext.getCmp("chainview")) {
          if (Ext.getCmp("chainview").linksView) {
              Ext.getCmp("chainview").linksView.clearAll();
              delete Ext.getCmp("chainview").linksView;
          }
      }


  }

stl.app.deleteTaskView = function()
{
    if(stl.view.TaskView) {        
        for (var property in stl.view.TaskView) {
            if (stl.view.TaskView.hasOwnProperty(property)) {
                delete stl.view.TaskView[property];
                }
        }
        delete stl.view.TaskView.project;
    }
}

/*Project Model Update */
stl.app.addTaskToRowModel = function (taskModel, row, phase, prevTaskUid) {//successors
    var project = stl.app.ProjectDataFromServer;
    var phaseUID = phase.uid;
    var tasks = row.tasks[phaseUID];
    var index;
    var prevTask;
    var updatedOrderOfAddedTask;
    _.each(tasks, function (task, idx) {
        if (task.uid == prevTaskUid) {
            index = idx;
            prevTask = task;
        }
    });
    var orderInit = 0;
    tasks.splice(index + 1, 0, taskModel);
    for (i = index; i < tasks.length; i++) {
        if (i == index) {
            orderInit = tasks[i].order;
        } else {
            tasks[i].order = String(orderInit);
        }

        if (taskModel.uid == tasks[i].uid) {
            updatedOrderOfAddedTask = tasks[i].order;
        }
        orderInit++;
    }

    var presentSuccessorOfAddedTask = _.find(tasks, function (task) {
        return Number(task.order) == Number(updatedOrderOfAddedTask) + 1;
    });

    if (presentSuccessorOfAddedTask) {
        stl.app.removeLink(prevTask.uid, presentSuccessorOfAddedTask.uid);
        stl.app.addLink(taskModel.uid, presentSuccessorOfAddedTask.uid);
    }

    if(prevTask)
        stl.app.addLink(prevTask.uid, taskModel.uid);
    

};

stl.app.removeLink = function (fromUid, toUid) {
    stl.app.ProjectDataFromServer.removeLink(fromUid, toUid)
};

stl.app.addLink = function (fromUid, toUid) {
    stl.app.ProjectDataFromServer.addLink({
        from: fromUid, 
        to: toUid
    })
};

stl.app.removeTaskFromRowModel = function (taskModel, rowUid, phaseUid) {
    var project = stl.app.ProjectDataFromServer;
    var phaseUID = phaseUid;
    var tasks = project.getRowById(rowUid).tasks[phaseUID];
    var index;
    var prevTask;
    _.each(tasks, function (task, idx) {
        if (task.uid == taskModel.uid) {
            index = idx;
        }
    });
    var orderInit = 0;
    tasks.splice(index, 1);
    if (taskModel.isMS) {
        stl.app.removeLinksForTask(taskModel.uid);
    } else {
        stl.app.removeLinksForMS(taskModel.uid);
    }

};

stl.app.removeLinksForTask = function (taskUID) {
    var project = stl.app.ProjectDataFromServer;
    var links = project.links;
    for (var i = links.length - 1; i >= 0; i--) {
        var link = links[i];
        if (link && (link.from === taskUID || link.to === taskUID)) {
            project.removeLink(link.from, link.to);
        }
    }
    //this.triggerSave();
};

stl.app.removeLinksForMS = function (msUID) {
    var project = stl.app.ProjectDataFromServer;
    var links = project.links;
    for (var i = links.length - 1; i >= 0; i--) {
        var link = links[i];
        if (link && (link.from === msUID || link.to === msUID)) {
            project.removeLink(link.from, link.to);
        }
    }
    //this.triggerSave();
};

stl.app.updateExpandedStateOfRowModel = function (rowUid, isExpanded) {
    var updatedRow = _.find(stl.app.ProjectDataFromServer.rows, function (row) {
        return row.uid == rowUid;
    });

    updatedRow.isExpanded = isExpanded;
}



/*
stl.app.ProjectDataFromServer is a singleton object which is being initiated here and its reference is being passed across different views
this object contains all the updated values
*/
stl.app.ProjectDataFromServer;
stl.app.SERVER_ROOT_URL = "../../AppServices/PlanningUIService.svc/";

/**
* Save the project, immediately
*/
stl.app.save = function (saveType, callbk) {
    // Note the call to getJSON below is not the same as .toJSON()
    var me = this,
        modelJson = stl.app.ProjectDataFromServer;
    if (modelJson) {
        // localStorage.setItem(localStorageModelKey, modelJson);
        stl.app.saveProjectToServer(saveType, callbk);
    }
};

stl.app.triggerSave = function () {
    if (this.saveTriggerEnabled == true) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        if (!this.saveDelegate) {
            this.saveDelegate = stl.app.save.bind(this, stl.app.ProcessTypeEnum.AUTOSAVE);
        }
        var autoSaveDuration = (parseInt(ConfigData.commonSettingsMap.DURATION_AUTO_SAVE.Value) * DURATION_MILISEC_MULTIPLIER) || AUTOSAVE_DURATION_MILISEC;
        this.saveTimeout = window.setTimeout(this.saveDelegate, autoSaveDuration);
    }
};

stl.app.toggleSaveTrigger = function (enable) {
    if (enable) {
        this.saveTriggerEnabled = true;
    } else {
        this.saveTriggerEnabled = false;
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
    }
};

stl.app.getProjectSummaryInfo = function () {
    return {
        ProjectUid: stl.app.ProjectDataFromServer.uid || "",
        //name: unescape(encodeURIComponent(stl.app.ProjectDataFromServer.name)),
        name: stl.app.ProjectDataFromServer.name,
        //startDate: stl.app.ProjectDataFromServer.startDate.getDate() + "/" + (stl.app.ProjectDataFromServer.startDate.getMonth() + 1) + "/" + stl.app.ProjectDataFromServer.startDate.getFullYear(),
        duedate: new Date(stl.app.ProjectDataFromServer.dueDate),
        Division: stl.app.ProjectDataFromServer.division,
        Author: stl.app.ProjectDataFromServer.author,
        Subject: stl.app.ProjectDataFromServer.subject,
        Category: stl.app.ProjectDataFromServer.category,
        LastSaved: new Date(stl.app.ProjectDataFromServer.lastSaved),
        Manager: stl.app.ProjectDataFromServer.manager,
        isIDCCed: stl.app.ProjectDataFromServer.isIDCCed,
        Attribute1: stl.app.ProjectDataFromServer.attribute1,
        Attribute2: stl.app.ProjectDataFromServer.attribute2,
        Attribute3: stl.app.ProjectDataFromServer.attribute3,
        Attribute4: stl.app.ProjectDataFromServer.attribute4,
        Attribute5: stl.app.ProjectDataFromServer.attribute5,
        ProjectFileType: stl.app.ProjectDataFromServer.projectFileType,
        IsSubtaskEnabled: stl.app.ProjectDataFromServer.isSubtaskEnabled,
        ProjectParticipants: stl.app.ProjectDataFromServer.participants,
        ProjectPlanningMode: stl.app.ProjectDataFromServer.ProjectPlanningMode,
        ProjectCalendarName: stl.app.ProjectDataFromServer.projectCalendarName,
        DefaultStartTime: stl.app.ProjectDataFromServer.defaultStartTime,
        DefaultFinishTime: stl.app.ProjectDataFromServer.defaultFinishTime,
        DefaultHrsPerDay: stl.app.ProjectDataFromServer.defaultHrsPerDay,
        DefaultDaysPerWeek: stl.app.ProjectDataFromServer.defaultDaysPerWeek,
        CheckedOutUser: stl.app.ProjectDataFromServer.CheckedOutUser,
        CheckedOutStatus: stl.app.ProjectDataFromServer.CheckedOutStatus,
        ProjectStatus: stl.app.ProjectDataFromServer.ProjectStatus,
        IsComplexMode: stl.app.ProjectDataFromServer.IsComplexMode,
        Description:stl.app.ProjectDataFromServer.Description,
        CustomDate1: stl.app.checkIfValidDate(stl.app.ProjectDataFromServer.CustomDate1)? new Date(stl.app.ProjectDataFromServer.CustomDate1) : null,
        CustomDate2: stl.app.checkIfValidDate(stl.app.ProjectDataFromServer.CustomDate2)? new Date(stl.app.ProjectDataFromServer.CustomDate2) : null,
        PlannedDate:  stl.app.checkIfValidDate(stl.app.ProjectDataFromServer.PlannedDate)?new Date(stl.app.ProjectDataFromServer.PlannedDate) :null,
        InheritProjCalForResFlag : stl.app.ProjectDataFromServer.InheritProjCalForResFlag

    };
};
stl.app.checkIfValidDate = function(date){
    if(date){
        if(typeof date == "string"){
            if(date.indexOf("0001") != -1)
                return false;
            if(date.indexOf("1901") != -1)
                return false;
            if(date.indexOf("1899") != -1)
                return false;
            if(date.indexOf("2001") != -1)
                return false;
        }
        else{
            if(date.getFullYear() == 0001)
                return false;
            if(date.getFullYear() == 1901)
                return false;
            if(date.getFullYear() == 1899)
                return false;
            if(date.getFullYear() == 2001)
                return false;
        }
        return true;
    }
};
stl.app.saveProjectToServer = function (saveType, callbk) {
    // console.log("about to save project to server", stl.app.ProjectDataFromServer.uid, stl.app.ProjectDataFromServer);
    var me = this,
        projectSummaryInfo = stl.app.getProjectSummaryInfo();

    if (!stl.app.ProjectDataFromServer.uid) {

        $.ajax({
            type: "POST",
            dataType: "json",
            url: stl.app.SERVER_ROOT_URL + "SaveProjectTableData",
            data: JSON.stringify(projectSummaryInfo),
            contentType: "application/json; charset=utf-8"
        })
            .success(function (response) {
                if (response != SESSION_TIMED_OUT) {
                    stl.app.onProjectSummarySaved(saveType, projectSummaryInfo, response, callbk);
                } else {
                    RedirectToLogInPage();
                }
            } .bind(this));

    } else {
        this.saveProjectJsonToServer(saveType, projectSummaryInfo, callbk);
    }
};

stl.app.saveTemplateToServer= function (saveType, callbk, TemplateData, isProjectSave) {
    var isTemplate = true;
    // console.log("about to save project to server", stl.app.ProjectDataFromServer.uid, stl.app.ProjectDataFromServer);
    var me = this,
        projectSummaryInfo = {
            ProjectUid: "",
            Description: TemplateData.description,
            //name: unescape(encodeURIComponent(TemplateData.name)),
            name: TemplateData.name,
            // startDate: stl.app.ProjectDataFromServer.startDate.getDate() + "/" + (stl.app.ProjectDataFromServer.startDate.getMonth() + 1) + "/" + stl.app.ProjectDataFromServer.startDate.getFullYear(),
            duedate: stl.app.ProjectDataFromServer.dueDate,
            Division: stl.app.ProjectDataFromServer.division,
            Author: stl.app.ProjectDataFromServer.author,
            Subject: stl.app.ProjectDataFromServer.subject,
            Category: stl.app.ProjectDataFromServer.category,
            LastSaved: stl.app.ProjectDataFromServer.lastSaved,
            Manager: stl.app.ProjectDataFromServer.manager,
            isIDCCed: stl.app.ProjectDataFromServer.isIDCCed,
            Attribute1: stl.app.ProjectDataFromServer.attribute1,
            Attribute2: stl.app.ProjectDataFromServer.attribute2,
            Attribute3: stl.app.ProjectDataFromServer.attribute3,
            Attribute4: stl.app.ProjectDataFromServer.attribute4,
            Attribute5: stl.app.ProjectDataFromServer.attribute5,
            ProjectFileType: !isProjectSave? PROJECT_TYPE_PPI_TEMPLATE : stl.app.ProjectDataFromServer.projectFileType,
            IsSubtaskEnabled: stl.app.ProjectDataFromServer.isSubtaskEnabled,
            ProjectPlanningMode: stl.app.ProjectDataFromServer.ProjectPlanningMode,
            ProjectParticipants: stl.app.ProjectDataFromServer.participants,
            ProjectCalendarName: stl.app.ProjectDataFromServer.projectCalendarName,
            DefaultStartTime: stl.app.ProjectDataFromServer.defaultStartTime,
            DefaultFinishTime: stl.app.ProjectDataFromServer.defaultFinishTime,
            DefaultHrsPerDay: stl.app.ProjectDataFromServer.defaultHrsPerDay,
            DefaultDaysPerWeek: stl.app.ProjectDataFromServer.defaultDaysPerWeek,
            IsComplexMode: stl.app.ProjectDataFromServer.IsComplexMode,
            CheckedOutUser: stl.app.ProjectDataFromServer.CheckedOutUser,
            CheckedOutStatus: stl.app.ProjectDataFromServer.CheckedOutStatus,
            ProjectStatus: stl.app.ProjectDataFromServer.ProjectStatus,
            InheritProjCalForResFlag: stl.app.ProjectDataFromServer.InheritProjCalForResFlag
            
        };


    $.ajax({
        type: "POST",
        dataType: "json",
        url: stl.app.SERVER_ROOT_URL + "SaveProjectTableData",
        data: JSON.stringify(projectSummaryInfo),
        contentType: "application/json; charset=utf-8"
    })
        .success(function (response) {
            if (response != SESSION_TIMED_OUT) {
                stl.app.onProjectSummarySaved(saveType, projectSummaryInfo, response, callbk, isTemplate, isProjectSave);
            } else {
                RedirectToLogInPage();
            }
        });

};

    stl.app.onProjectSummarySaved = function (saveType, projectSummary, serverResponse, callbk, isTemplate,isProjectSave) {
    if (parseInt(serverResponse) !== 0) {
        projectSummary.ProjectUid = serverResponse;

        // Do not update the Project UID of existing Project while saving as template
        // Update only for PPI type not for  PPI_TEMPLATE
        if (projectSummary.ProjectFileType === PROJECT_TYPE_PPI && !isTemplate)
            stl.app.ProjectDataFromServer.uid = serverResponse;

        if (callbk) {
            stl.app.saveProjectJsonToServer(saveType, projectSummary, callbk, isTemplate, isProjectSave);
        } else {
            stl.app.saveProjectJsonToServer(saveType, projectSummary, null, isTemplate);
        }
    } else {
        PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);
        if (callbk)
            callbk(serverResponse);
    }
};

stl.app.saveProjectJsonToServer = function (saveType, projectSummary, callbk, isTemplate, isProjectSave) {
    // Manually constructing JSON here because we can't call stringify on project directly
    var json = stl.app.ProjectDataFromServer.getJSON(isTemplate, projectSummary.name);
    var serverJson = "{ \"processType\": " + saveType + ",\"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + json + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + ", \"CCSummary\": " + JSON.stringify(GetUpdatedCCSummaryData()) + " }";
    $.ajax({
        type: "POST",
        dataType: "json",
        url: stl.app.SERVER_ROOT_URL + "SaveJsonBlobData",
        data: serverJson,
        contentType: "application/json; charset=utf-8"
    })
        .success(function (response) {
            if (response != SESSION_TIMED_OUT) {
                //localStorage.setItem(LOCAL_STORAGE_LAST_PROJECT_UID_KEY, projectSummary.ProjectUid);
                if (response !== FALSE_CONSTANT) {
                    if (callbk) {
                        if (projectSummary.isIDCCed && isTemplate && isProjectSave)
                            CheckInSaveAsProject(projectSummary, json, function(response, callingMethod){
                                if (response) {
                                    var responseObj = parseServerResponse(response);
                                    if (!checkServerErrorInResponse(responseObj)) {
                                        if (responseObj.Errors && responseObj.Errors.length > 0)
                                            callbk(TRUE_CONSTANT, true);
                                        else
                                            callbk(TRUE_CONSTANT);
                                    }
                                }
                                hideLoadingIcon();
                            });
                        else
                            callbk(response);
                    }
                    if (!stl.app.revisionHistory) {
                        stl.app.revisionHistory = new stl.view.RevisionHistory({
                            projectUid: projectSummary.ProjectUid
                        });
                        stl.app.revisionHistory.init();
                    } else
                        stl.app.revisionHistory.callBackAfterSave();
                } else {
                    if(isTemplate && isProjectSave){
                        hideLoadingIcon();
                        callbk(false);
                    }
                    PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);
                }
            } else {
                RedirectToLogInPage();
            }
        })
};

stl.app.DownloadDebufferedProject = function () {
    // Manually constructing JSON here because we can't call stringify on project directly
    var projectSummary = stl.app.getProjectSummaryInfo();
    var isTemplate = false;
    var serverJson = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.ProjectDataFromServer.getJSON(isTemplate, projectSummary.name) + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + ", \"CCSummary\": " + JSON.stringify(GetUpdatedCCSummaryData()) + " }";
    $.ajax({
        type: "POST",
        dataType: "json",
        url: stl.app.SERVER_ROOT_URL + "DownloadDebufferedProject",
        data: serverJson,
        contentType: "application/json; charset=utf-8"
    })
        .success(function (response) {
            if (response != SESSION_TIMED_OUT) {
                //localStorage.setItem(LOCAL_STORAGE_LAST_PROJECT_UID_KEY, projectSummary.ProjectUid);
                if (response !== FALSE_CONSTANT) {
                    response = JSON.parse(response);
                    stl.app.DownloadSPIProjectAsSPI.call(this, response, DOWNLOAD_DEBUFFERED_PLAN);
                    
                } else {
                    //PPI_Notifier.error(PROJECT_SAVE_FAILED, FAILURE_MESSAGE);
                }
            } else {
                RedirectToLogInPage();
            }
        })
};

stl.app.getActiveView = function (objProject) {
    if (stl.app.isViewChangeRequired) {
        if (!objProject.projectData.isIDCCed) {
            return PERT_VIEW;
        } else {
            return TIMELINE_VIEW;
        }
    } else {
        if ($(".view-selector .btn.active").length == 0) {
            return PERT_VIEW;
        } else {
            var viewButton = $(".view-selector .btn.active").attr("class").split(" ")[0];
            //Table view cannot load independently. Hence, redirecting the view to Matrix view if the existing view is table view
            if (viewButton == TABLE_VIEW) {
                viewButton = PERT_VIEW;
            }
            return viewButton;
        }
    }
};

/**
* Load a project, replacing all views
*/
stl.app.loadProjectEnd;
stl.app.readOnlyFlag;
stl.app.setProjectStatusToInPlan = function(project){
    project.ProjectStatus = IN_PLAN_TYPE;
};

stl.app.loadProjectJson = function (jsonWithSummary, readOnlyFlag, newProjectId, newProjectName, isTemplateSelected, projectAttributes) {
    try {
        /*
        Global variables are checked if already the projectModel is set else view is initiated and model is loaded
        */
        if(stl.app.undoStackMgr)
            stl.app.undoStackMgr.invalidateAll();
        stl.app.isMatrixViewLoaded = false;
        stl.app.isTimelineViewLoaded = false;
        stl.app.isChainViewLoaded = false;
        stl.app.isTableViewLoaded = false;
        console.log('Method called stl.app.loadProjectJson');

        //Nilesh: Resource store must be cleared if it exists - move to initview
        var resGrid = Ext.getCmp('resGrid');
        if (resGrid)
            resGrid.clearResourceStore();

        //stl.app.initViews();
        var wrapperObj;
        if (jsonWithSummary != "") {
            wrapperObj = JSON.parse(jsonWithSummary, stl.model.Project.reconstituteDates);
        }



        var readOnly = readOnlyFlag;
        stl.app.readOnlyFlag = readOnly;
        if (wrapperObj != null) {
            if (!wrapperObj.Errors) {

                var projectName = wrapperObj.projectData.name,
                    projectUid = wrapperObj.projectData.ProjectUid;

                Ext.suspendLayouts();
                stl.app.DestroyMilestoneDialog(); //remove existing milestones - clear milestone store
                var activeView = stl.app.getActiveView(wrapperObj);
                stl.app.initView(activeView, false/*isSwitch*/);
                stl.app.setActiveView(activeView);
                stl.app.wireSpecialKeyBoardEvents();
                //Set readOnly as a property in projectData Object
                wrapperObj.projectData.viewOnlyMode = stl.app.readOnlyFlag;

                var me = this,
                project = stl.model.Project.fromJSON(wrapperObj);
                project.readOnly = stl.app.readOnlyFlag;
                project.CC_Settings = wrapperObj.CC_Settings;

                if (typeof (projectAttributes) != "undefined") {
                    project.updateProjectRootScopeName(newProjectName);
                    project.uid = newProjectId;
                    project.name = newProjectName;
                    stl.app.setProjectInfo(project, projectAttributes);
                    stl.app.updateMilestoneDueDate(project, projectAttributes.duedate);
                    stl.app.setProjectStatusToInPlan(project);
                }
                if (wrapperObj.projectData) {
                    project.isIDCCed = wrapperObj.projectData.isIDCCed;
                    project.isSubtaskEnabled = wrapperObj.projectData.IsSubtaskEnabled;
                    project.viewOnlyMode = wrapperObj.projectData.viewOnlyMode;
                    project.ProjectPlanningMode = wrapperObj.projectData.ProjectPlanningMode;
                    project.projectCalendarName = wrapperObj.projectData.ProjectCalendarName;
                    project.defaultStartTime = wrapperObj.projectData.DefaultStartTime;
                    project.defaultFinishTime = wrapperObj.projectData.DefaultFinishTime;
                    project.defaultHrsPerDay = wrapperObj.projectData.DefaultHrsPerDay;
                    project.defaultDaysPerWeek = wrapperObj.projectData.DefaultDaysPerWeek;
                    project.CheckedOutUser = wrapperObj.projectData.CheckedOutUser;
                    project.CheckedOutStatus = wrapperObj.projectData.CheckedOutStatus;
                    project.Description = wrapperObj.projectData.Description;
                    project.CustomDate1 = wrapperObj.projectData.CustomDate1;
                    project.CustomDate2 = wrapperObj.projectData.CustomDate2;
                    project.PlannedDate = wrapperObj.projectData.PlannedDate;
                }

                if(project.readOnly)
                    $(".page-header-top .page-header-center .title")[0].innerHTML = project.name + PROJECT_NAME_READONLY_SUFFIX;
                else
                    $(".page-header-top .page-header-center .title")[0].innerHTML = project.name ;



                stl.app.setDrawLinksOnLoad(project.links.length);


                stl.app.RevisionHistory = new stl.view.RevisionHistory({
                    projectUid: projectUid
                });

                if (wrapperObj.projectData.ProjectPlanningMode == PLAN) {
                    if (wrapperObj.CCSummary != null) {
                        enableCCSummarybutton();
                        disableBufferSummaryButton();
                        PopulateCCSummaryStore(wrapperObj.CCSummary);

                    }
                } else if (wrapperObj.projectData.ProjectPlanningMode == REPLAN) {
                    if (wrapperObj.BufferSummaryData) {
                        enableBufferSummaryButton();
                        disableCCSummarybutton();
                        PopulateBufferSummaryStore(wrapperObj.BufferSummaryData);

                    }
                }



                if (wrapperObj.CCSettings != null) {
                    CCSettingsStore.PopulateStore(wrapperObj.CCSettings);
                }



                //CON-2012
                if (stl.app.readOnlyFlag) {
                    stl.app.CreateTaskToolBar.disableAllBtn();
                } else {
                    stl.app.CreateTaskToolBar.enableAllBtn();
                }

                stl.app.ProjectDataFromServer = project;

                stl.app.CreatePredSuccMap(project);

                stl.app.updateMilestoneSheet();

                stl.app.enableRemoveBuffersOption();



                stl.app.loadProjectInReqdView(activeView);
                stl.app.populateDivisionPhases(project.division);

                //resume ext layout, suspended in initview
                Ext.resumeLayouts(true);

                if (!readOnly) //dont want ot save projects in Read only mode
                    stl.app.save(stl.app.ProcessTypeEnum.AUTOSAVE);

                if (stl.app.isViewDebuffered){
                    stl.app.ProjectDataFromServer.removeBufferTasks(null/*arrCopiedTasks */, true/* isCallFromDebufferedPlan*/);
                    var projectSummary = stl.app.getProjectSummaryInfo();
                    projectSummary.isIDCCed = false;
                    stl.app.isProjectViewDebuffered = true;
                    var JsonData = "{ \"projectData\": " + JSON.stringify(projectSummary) + ", \"jsonBlob\": " + stl.app.ProjectDataFromServer.getJSON() + ", \"CCSettings\": " + JSON.stringify(CCSettingsStore.GetCCSettings()) + " }";
                    $(document).trigger("projectjsonchange", [JsonData, true /*readonly*/ , true /*isViewChangeReqd*/ ]);
                    toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
                    Ext.getCmp('msGrid').store.clearData();
                    undoCCABClick();
                    return;
                    
                }

            } else {
                showErrorsAndWarnings(jsonWithSummary, "Check Out");
            }

            if (readOnly) {
                $(".page-header-toolbar-top .requires-write").not(".calendarIcon").attr("disabled", true).addClass("disabled");
                $(".page-header-top .requires-write").not(".calendarIcon").attr("disabled", true).addClass("disabled");
            } else {
                $(".page-header-toolbar-top .requires-write").attr("disabled", false).removeClass("disabled");
                $(".page-header-top .requires-write").attr("disabled", false).removeClass("disabled");
            }

            if (resGrid) {
                resGrid.updateAddDeleteButtons();
            }
        }
        //Load user priviledges
        LoadProjectPrivlegeData(stl.app.ProjectDataFromServer.uid, stl.app.ProjectDataFromServer.name);
    }
    catch (e) {
        console.log(e);
        onProjectLoadFailed();

    }
};

stl.app.CreatePredSuccMap = function(project){
    stl.app.PredecessorMap = _.groupBy(project.links, function(link){
        return link.to;
    });
    stl.app.SuccessorMap = _.groupBy(project.links, function(link){
        return link.from;
    });
}


stl.app.GroupLinks = function(links){
    var groupedLinks = _.groupBy(links, function(link){
        return parseInt(link.to);
    })
    stl.app.GroupedLinks = groupedLinks;
};

stl.app.setProjectInfo = function (project, projectAttributes) {
    project.dueDate = projectAttributes.duedate;
    project.author = projectAttributes.portfolio;
    project.category = projectAttributes.businessUnit;
    project.subject = projectAttributes.customer;
    project.manager = projectAttributes.manager;
    project.division = projectAttributes.division;

    project.attribute1 = projectAttributes.attribute1;
    project.attribute2 = projectAttributes.attribute2;
    project.attribute3 = projectAttributes.attribute3;
    project.attribute4 = projectAttributes.attribute4;
    project.attribute5 = projectAttributes.attribute5;
    project.projectFileType = projectAttributes.projectFileType;
    project.participants = projectAttributes.participants;
};

stl.app.doUIChangesafterIDCC = function () {
    //FIXME - There should be a good way to recognize if IDCC was run after loading the project
    var isRenderingAfterIDCC = !($("#ccSummary").hasClass("disabled") ? true : false);

    if (stl.app.ProjectDataFromServer.isIDCCed && isRenderingAfterIDCC) {

        toggleDockingGrids('CCSummarygrid', 'milestoneSheet', true); // once milestones are rendered, 
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + NONE);

        if (stl.app.isViewChangeRequired) {
            $(".matrix-view-task-alignment").hide();
            $(".zoom-controls").css('display', 'inline-block');
            $(".highlight.btn").css('display', '');
            $(document).trigger("viewchange", "timelineview");
           /* if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                Ext.getCmp('chainview').handleHighlightDropdownSelection();
            else*/
                Ext.getCmp('timelineview').handleHighlightDropdownSelection();
            //stl.app.CreateTaskToolBar.onViewChange("timelineview");
        }

        if (stl.app.isHighlightRequired) {
            //Highlight requires nodes to be expanded to show all highlighted task
            $(document).trigger('expandAllScopeNodes');

            //After IDCC we need to highlight CC tasks and switch to timeline view
            $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + CC_TASKS);
            $(document).trigger('highlightcctasks');
        }

    }
};

stl.app.doUIChangesafterReDoCCFB = function () {
    //FIXME - There should be a good way to recognize if ReDoCCFB was run after loading the project
    var isRenderingAfterReDoCCFB = !($("#bufferSummary").hasClass("disabled") ? true : false);

    if (isRenderingAfterReDoCCFB) {
        toggleDockingGrids('CCSummarygrid', 'milestoneSheet', true); // once milestones are rendered, 
        $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + NONE);

        if (stl.app.isViewChangeRequired) {
            $(".matrix-view-task-alignment").hide();
            $(".zoom-controls").css('display', 'inline-block');
            $(".highlight.btn").css('display', '');
            $(document).trigger("viewchange", "timelineview");
            /*if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                Ext.getCmp('chainview').handleHighlightDropdownSelection();
            else*/
                 Ext.getCmp('timelineview').handleHighlightDropdownSelection();
            //stl.app.CreateTaskToolBar.onViewChange("timelineview");
        }

        if (stl.app.isHighlightRequired) {
            //Highlight requires nodes to be expanded to show all highlighted task
            $(document).trigger('expandAllScopeNodes');

            //After ReDoCCFB highlight pen chain
            $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + PEN_CHAIN);
            $(document).trigger('highlightPenChain');
        }
    }
};

stl.app.DestroyMilestoneDialog = function () {
    if (Ext.getCmp('msGrid')) {
        Ext.getCmp('msGrid').store.clearData();
        toggleDockingGrids('CCSummarygrid', 'milestoneSheet', false);
    }
};

stl.app.updateMilestoneSheet = function () {
    var project = stl.app.ProjectDataFromServer;
    _.each(project._milestones, function (ms, idx) {
        Ext.getCmp('CCSummarygrid').updateMilestoneSheet(ms);
    });
};

stl.app.setProjectDataFromServer = function (project) {
    stl.app.ProjectDataFromServer = project;
};

stl.app.getCalendarSettingsData = function () {
    var objCalendarSetting = {};
    objCalendarSetting.ProjectCalendarName = stl.app.ProjectDataFromServer.projectCalendarName;
    objCalendarSetting.InheritProjCalForResFlag = stl.app.ProjectDataFromServer.InheritProjCalForResFlag;
    return objCalendarSetting;
};

stl.app.loadProjectInReqdView = function (activeView) {
    var divisionId = stl.app.ProjectDataFromServer.division;
    //var activeView = stl.app.getActiveView(stl.app.ProjectDataFromServer);
    stl.app.loadResources(divisionId, function () {
        stl.app.loadPeopleAndTeams(divisionId, function () {
            stl.app.loadAvailableCalendars(divisionId, function () {
                if (stl.app.CheckIfSelectedCalendarDeleted(stl.app.ProjectDataFromServer.projectCalendarName)) {
                    //PPI_Notifier.info(getStringWithArgs(SELECTED_CALENDAR_DELETED, stl.app.ProjectDataFromServer.projectCalendarName, stl.app.defaultCalendarName));
                    stl.app.ProjectDataFromServer.setDeletedCalendarNames(stl.app.ProjectDataFromServer.projectCalendarName);
                    stl.app.ProjectDataFromServer.projectCalendarName = stl.app.defaultCalendarName;
                }
                // TODO LoadCalendarData should be encapsulated as an app method
                LoadCalendarData(divisionId, stl.app.ProjectDataFromServer.projectCalendarName, function () {
                    stl.app.ProjectDataFromServer.initializeCalendarData();
                    //stl.model.Project.InitializeNewProject(stl.app.ProjectDataFromServer);
                    CalendarStore.PopulateStore(stl.app.getCalendarSettingsData());
                    stl.app.ProjectDataFromServer.updateGlobalMaxUnitsOfGlobalResourcesAssignedToProject();
                    stl.app.ProjectDataFromServer.updateResourceSheet();
                    //SS fix this : Should be intialized in different way
                    stl.app.ProjectDataFromServer.getInfoMsgForUpdateCalendarNamesForResources();
                    stl.app.setProjectModel(stl.app.ProjectDataFromServer, activeView);
                    if(stl.app.isViewChangeRequired === false){
                        if(activeView == TIMELINE_VIEW){
                            $(document).trigger("viewchange", "timeline");
                        }
                        else if(activeView == CHAIN_VIEW)
                            $(document).trigger("viewchange", "chainview");
                    }
                    if (activeView == TIMELINE_VIEW){
                        stl.app.CreateTaskToolBar.onViewChange("timelineview")
                    } else {
                        stl.app.CreateTaskToolBar.onViewChange("matrixview")
                    }
                    if (stl.app.ProjectDataFromServer.ProjectPlanningMode == 1) {
                        stl.app.switchToPlanMode();
                        stl.app.doUIChangesafterIDCC();
                    } else if (stl.app.ProjectDataFromServer.ProjectPlanningMode == 2) {
                        stl.app.switchToReplanMode();
                        stl.app.doUIChangesafterReDoCCFB();
                    }
                });
            });
        });
    });

};

stl.app.CheckIfSelectedCalendarDeleted = function (selectedCalendarName) {
    var availableCalendars = stl.app.arrAvailableCalendars;
    var lengthOfCalendars = availableCalendars.length;
    var calDeleted = true;
    for (var i = 0; i < lengthOfCalendars; i++) {
        if (availableCalendars[i] == selectedCalendarName) { 
            calDeleted = false;
            break;
        }

    }
    return calDeleted;
};


stl.app.enableRemoveBuffersOption = function () {
    if (stl.app.ProjectDataFromServer.isBufferTasksExist && !stl.app.readOnlyFlag) {
        $("#undoCCAB").removeClass("disabled");
        $("#undoCCAB").removeAttr("disabled");
    }
},

stl.app.updateMilestoneDueDate = function (project, projectDueDate) {
    _.each(project._milestones, function (ms, idx) {
        ms.date1 = projectDueDate;
    });

};

stl.app.setProjectModel = function (model, viewName) {
    switch (viewName) {
        case PERT_VIEW: stl.app.matrixView = new stl.view.MatrixView({
                            container: Ext.getCmp("matrix-view-container").el.dom,
                            readOnly: stl.app.readOnlyFlag
                        });
                        stl.app.matrixView.init(null, model.name);

                        stl.app.matrixView.loadProjectJson(model);
                        break;
    case TIMELINE_VIEW: var timelineView = Ext.getCmp("timelineview");
                        if (timelineView) {
                            timelineView.setProjectModel(model);
                            timelineview.readOnly = stl.app.readOnlyFlag;
                        }
                        
        break;
    case TABLE_VIEW: var tableview = Ext.getCmp("tableview");
                    if (tableview) {
                        tableview.readOnly = stl.app.readOnlyFlag;
                        tableview.setProjectModel(model, stl.app.availablePeopleAndTeams);
                    }
                    break;
    case CHAIN_VIEW:var chainView = Ext.getCmp("chainview");
                        if (chainView) {
                            chainView.setProjectModel(model);
                            chainView.readOnly = stl.app.readOnlyFlag;
                        }
                        
        break;
    }
};

/*
Load Resources and Teams
*/
// TODO extract to application level
stl.app.loadResources = function(division, callbk) {
    var me = this,
        divisionID = division; // FIXME (dynamic)

    var callbackForResourceData = function(response) {
        var serverData = validateResponseFromServer(response);
        if(serverData.errorReturned){
         stl.app.handleErrorsWarningsReturnedFromServer(serverData.Errors ,SHOW_SERVER_ERRORS_IN.TOASTR, MSG_TYPES.ERROR)
        }
        if(serverData.warningReturned){
          stl.app.handleErrorsWarningsReturnedFromServer(serverData.Warnings ,SHOW_SERVER_ERRORS_IN.TOASTR, MSG_TYPES.WARNING)    
        }
        var resources = [];
        if (serverData.dataReturned) {
            var resources = serverData.Data;
        } 
        //CON-2892 and CON-2835
        //initializing the list of global resources
        stl.app.globalResources = [];
        delete stl.app.globalResourcesByUid;
        stl.app.globalResourcesByUid = {};
        // availableResources = [];
        for (var i = 0; i < resources.length; i++) {
            // console.log("resource:", resources[i]);
            var serverResource = resources[i],
                newResource = stl.app.addGlobalResource(serverResource);
        }
        callbk();
    }

    LoadResourceData(divisionID, callbackForResourceData);
};

// TODO extract to application level
stl.app.loadPeopleAndTeams = function (division, callbk) {
    var me = stl.app,
        divisionID = division; // FIXME (dynamic)
    stl.app.availablePeopleAndTeams = [];

    var callbackFunction = function (response) {
        me.availablePeopleAndTeams = JSON.parse(response);
        DataStore.availablePeopleAndTeams = me.availablePeopleAndTeams;
        callbk();
    }

    LoadUserAndTeamData(divisionID, callbackFunction);
};

stl.app.defaultCalendarName;
stl.app.arrAvailableCalendars = [];
stl.app.loadAvailableCalendars = function (division, callbk) {
    var me = this,
        divisionID = division; // FIXME (dynamic)

    var callback = function (response) {
        var calendarVariantFromBE = JSON.parse(response);
        var calData = calendarVariantFromBE[0];
        stl.app.defaultCalendarName = calData[1];
        stl.app.arrAvailableCalendars = calData[0];
        
        
        callbk();
    }

    GetDivisionBaseCalendars(divisionID, callback);
};

stl.app.globalResources = [];
stl.app.globalResourcesByUid = {};
stl.app.nextResourceUid = 1;
stl.app.nextDefaultResourceIdx = 0;
stl.app.nextDefaultPhaseIdx = 0;

/**
* Register a global resource, making it available for selectors.
* If a resource with the same UID is already registered, it will be replaced.
* Will assign a UID if none present.
*/
stl.app.addGlobalResource = function(resource) {
    var me = stl.app;
    if (resource.uid) {
        stl.app.nextResourceUid = Math.max(stl.app.nextResourceUid, Number(resource.uid) + 1);
    } else {
        resource.uid = me.getNextResourceUid();
    }
    existingResource = me.globalResourcesByUid[resource.uid];
    if (existingResource) {
        // Replace
        me.globalResources.splice(me.globalResources.indexOf(existingResource), 1, resource);
    } else {
        me.globalResources.push(resource);
    }
    me.globalResourcesByUid[resource.uid] = resource;
    $(me).trigger("resourcesinvalidated");
    return resource;
};

stl.app.getNextResourceUid = function() {
    return String(stl.app.nextResourceUid++);
};

stl.app.getNextAvailableResourceUid = function() {
    return String(stl.app.nextResourceUid);
};

stl.app.setNextAvailableResourceUid = function(value) {
    stl.app.nextResourceUid = value;
};

stl.app.getNextDefaultResourceIdx = function(value) {
    return String(stl.app.nextDefaultResourceIdx++);
};

stl.app.getNextAvailableDefaultResourceIdx = function(value) {
    return stl.app.nextDefaultResourceIdx;
};
stl.app.setDefaultResourceIdx = function(value) {
    stl.app.nextDefaultResourceIdx = value;
};

stl.app.getGlobalResources = function() {
    return stl.app.globalResources;
};

stl.app.getNextDefaultPhaseIdx = function(value) {
    return String(stl.app.nextDefaultPhaseIdx++);
};

stl.app.getNextAvailableDefaultPhaseIdx = function(value) {
    return stl.app.nextDefaultPhaseIdx;
};
stl.app.setDefaultPhaseIdx = function(value) {
    stl.app.nextDefaultPhaseIdx = value;
};

stl.app.isProjectOpenInViewOnlyMode = function() {
    var isProjectReadOnly = false;
    if (stl.app.ProjectDataFromServer)
        isProjectReadOnly = stl.app.ProjectDataFromServer.viewOnlyMode
    return isProjectReadOnly;
};

stl.app.getColumnDisplayName = function(configKey) {
       if(configKey && ConfigData && ConfigData.columnSettingsMap[configKey])
            return ConfigData.columnSettingsMap[configKey].ColumnDisplayName;
        else 
            return configKey;
};
stl.app.isColumnHidden = function(configKey) {
       if(configKey && ConfigData && ConfigData.columnSettingsMap[configKey])
            return ConfigData.columnSettingsMap[configKey].IsHidden;
        else 
            return false;
};

stl.app.commonSettingValue = function(configKey) {
       if(configKey && ConfigData && ConfigData.commonSettingsMap[configKey])
            return ConfigData.commonSettingsMap[configKey].Value;
        else 
            return "";
    };

stl.app.getDefaultSubtaskType = function () {
            var sConfig = stl.app.commonSettingValue('DEFAULT_SUBTASK_TYPE');
            var subtaskType;
            if (sConfig == WIPSubtasktypesConfigKey) {
                subtaskType = SubtaskTypesEnum.WIP;
            } else if (sConfig == SeqentialSubtasktypesConfigKey) {
                subtaskType = SubtaskTypesEnum.SEQUENTIAL;
            }
            else if (sConfig == ParallelSubtasktypesConfigKey) {
                subtaskType = SubtaskTypesEnum.PARALLEL;
            }
            return subtaskType;
        };

stl.app.defaultFeedingBufferPolicyValue = function() {
       if(ConfigData.commonSettingsMap['FEEDING_BUFFERS_POLICY'])
       { if(ConfigData.commonSettingsMap['FEEDING_BUFFERS_POLICY'].Value == "LEAVE_TASKS_IN_PAST_VAL")
           return "0";
       else if (ConfigData.commonSettingsMap['FEEDING_BUFFERS_POLICY'].Value == "PUSH_OUT_PROJECT_DUE_DATE_VAL")
           return "1";
       else if(ConfigData.commonSettingsMap['FEEDING_BUFFERS_POLICY'].Value == "CONSUME_FEEDING_BUFFERS_VAL")
           return "2";
       }
        else 
            return "1";
};

// stl.app.loggedInUser = function() {
//         return ConfigData.LoggedInUser
// };

stl.app.defaultDurationReductionRoundingValue = function() {
       if(ConfigData.commonSettingsMap['DURATION_REDUCTION_ROUNDING'])
       { if(ConfigData.commonSettingsMap['DURATION_REDUCTION_ROUNDING'].Value == "NO_ROUNDING")
           return "0";
       else if (ConfigData.commonSettingsMap['DURATION_REDUCTION_ROUNDING'].Value == "ROUND_TO_DAY")
           return "1";
       else if(ConfigData.commonSettingsMap['DURATION_REDUCTION_ROUNDING'].Value == "ROUND_TO_QUARTER")
           return "2";
       }
        else 
            return "1";
};

stl.app.deletePropertiesOfObjectCollection =  function(objCollection) {
    $.each(objCollection, function (index, obj) {
        if (obj) {
            $(obj).off();
            for (var property in obj) {
                delete obj[property];
            }
            delete obj;
        }
    });
};

stl.app.getDownloadURL = function(fileName){
    var sURL = "../DownloadFileWithoutTimeStamp.aspx?ProjectName=" + encodeURIComponent(this.ProjectDataFromServer.name) + "&FileNameWithTimeStamp="+ encodeURIComponent(fileName) +"&FileExtension=ccx&viewDebuf=False";
    return sURL;
};

stl.app.getDownloadURLForSPI = function (fileName) {
    var sURL = "../DownloadFileWithoutTimeStamp.aspx?ProjectName=" + encodeURIComponent(this.ProjectDataFromServer.name) + "&FileNameWithTimeStamp=" + encodeURIComponent(fileName) + "&FileExtension=spi&viewDebuf=False";
    return sURL;
};

stl.app.DownloadSPIProject = function(response){
    if (!response.success){
        PPI_Notifier.error(response.data.toString());
        return;
    }
    if (Number(stl.app.ProjectCheckOutStatus) == 1) {
        PPI_Notifier.info(LAST_CHECKEDIN_FILE_DOWNLOADED);
    } 
    document.getElementById('download_iframe').src = stl.app.getDownloadURL(response.data.toString());
};

stl.app.DownloadSPIProjectAsSPI = function (response) {
    if (!response.success){
        PPI_Notifier.error(response.data.toString());
        return;
    }
    document.getElementById('download_iframe').src = stl.app.getDownloadURLForSPI(response.data.toString());
};

stl.app.CheckOutAndDownloadSPIProject = function(projectDownloadFormat){
    var projectData = this.ProjectDataFromServer;
   // var projectFileName = 
   switch(projectDownloadFormat){
        case "SPI": CheckOutSPIProject(projectData.uid, projectData.name, this.DownloadSPIProjectAsSPI, projectDownloadFormat);
            break;
        case "CCX": CheckOutSPIProject(projectData.uid, projectData.name, this.DownloadSPIProject, projectDownloadFormat);
            break;


   }
    
};
stl.app.setServerDateTimeFormat = function() {
    ServerClientDateClass.serverDateTimeInJS = new Date(serverTodayDate);        
    ServerTimeFormat.setformat(serverTimeformat);
    ServerTimeFormat.setBootstrapDatePickerFormat();
};
stl.app.setDrawLinksOnLoad = function(linksLength) {
    var linkCountLimit = 50;
    if (getInternetExplorerVersion() === 9 && linksLength > linkCountLimit){
        $(".toggle-links-button").removeClass("pressed");
        PPI_Notifier.info(LINKS_ARE_NOT_DISPLAYED);
    }
    else
        $(".toggle-links-button").addClass("pressed");

};

stl.app.manageTimeOutSettings = function() {
    var oSessionTimeout = new SessionTimeOut(ReDirectUrl,HandlerUrl);
    TimeLag = DefaultSessionTimeout - 1;
    if (TimeLag <= 0)
        TimeLag = 1;
    TimeToPing = TimeLag * 60 * 1000;
    timeOutID = 0;
};

stl.app.getCurrentHighLightOption = function () {
    var highlightSelection = $(".highlight").find(".button-text").text();
    var highlightOptArr = highlightSelection.split(COLON_SEPARATOR);
    var selection = highlightOptArr[1].trim();//[DH]: to obtain proper highlight option
    return selection;
};

/**
        * Initializes the menu item handlers for a popup menu, or all menus in the 
        * document if $root is not specified
        */
stl.app.addHighlightPopupMenuHandlers = function ($root) {
    if (!$root) {
        $root = $("body");
    }
    var me = this;
    $root.find(".tool-item").off("click").on("click", function (evt) {
        var $toolitem = $(evt.target).closest(".tool-item"),
                    $phaseCol = $toolitem.closest(".tool-popup").data("phase-column"),
                    cmd = $toolitem.data("cmd"),
                    keepPopupOpen = false;
        if ($toolitem.hasClass("disabled")) {
            return;
        };
        switch (cmd) {
            case "toggle-all-resource-highlight":
			    $(".page-header .highlight").find(".button-text").text("Highlight: " + RESOURCES);
                clearAllHighlight(true,false,false,false);
                HighlightAllResources($toolitem);                
                keepPopupOpen = true;
                break;
            case "toggle-resource-highlight":
                $("div[data-cmd='toggle-all-resource-highlight']").find("input").removeAttr('checked');                
  		        $(".page-header .highlight").find(".button-text").text("Highlight: " + RESOURCES);
                clearAllHighlight(true,false,false,false);
                HighlightResources($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-all-phase-highlight":
                $(".page-header .highlight").find(".button-text").text("Highlight: " + PHASES);
                clearAllHighlight(false, true,false,false);
                HighlightAllPhases($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-phase-highlight":
                $("div[data-cmd='toggle-all-phase-highlight']").find("input").removeAttr('checked');                
                $(".page-header .highlight").find(".button-text").text("Highlight: " + PHASES);
                clearAllHighlight(false, true,false,false);
                HighlightPhases($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-all-task-manager-highlight":
                $(".page-header .highlight").find(".button-text").text("Highlight: " + TASK_MANAGERS);
                clearAllHighlight(false, false, true,false);
                HighlightAllTaskManagers($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-task-manager-highlight":
                $("div[data-cmd='toggle-all-task-manager-highlight']").find("input").removeAttr('checked');
                $(".page-header .highlight").find(".button-text").text("Highlight: " + TASK_MANAGERS);
                clearAllHighlight(false, false, true,false);
                HighlightTaskManagers($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-all-chains-highlight":
                $(".page-header .highlight").find(".button-text").text("Highlight: " + PROJECT_CMS_CHAINS);
                clearAllHighlight(false,false,false,true);
                stl.app.HighlightAllProjectChains($toolitem);
                keepPopupOpen = true;
                break;
            case "toggle-chain-highlight":                
                $("div[data-cmd='toggle-all-chains-highlight']").find("input").removeAttr('checked');                
                $(".page-header .highlight").find(".button-text").text("Highlight: " + PROJECT_CMS_CHAINS);
                clearAllHighlight(false,false,false,true);
                stl.app.HighlightProjectChain($toolitem);
                keepPopupOpen = true;
                break;

            case "highlight-immediate-predecessors":
                clearAllHighlight();
                var ms = $(evt.target).closest(".tool-popup").data("ms");
                highlightImmediatePredecessors(ms.uid);
                break;

            case "highlight-all-predecessors":
                clearAllHighlight();
                var ms = $(evt.target).closest(".tool-popup").data("ms");
                highlightAllPredecessors(ms.uid);
                break;

            case "highlight-successors":
                break;

            case "highlight-constraining-successors":
                clearAllHighlight();
                var ms = $(evt.target).closest(".tool-popup").data("ms"),
                            milestoneElement = me.milestoneElementsById[ms.uid];
                me.highlightConstrainingTasks(milestoneElement);
                $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + SHOW_CONSTRANING_SUCCESSOR_CHAIN);
                $(document).trigger("highlightchange");
                break;

            case "highlight-longest-predecessor-chain":
                clearAllHighlight();
                var project = stl.app.ProjectDataFromServer;
                var ms = $(evt.target).closest(".tool-popup").data("ms");
                highlightLongestPredecessorChainByUid(ms.uid);
                break;
            case "highlight-immediate-predecessors-for-fullkit":
                clearAllHighlight();
                var fullkitTaskUid = $(evt.target).closest(".task").data("model").uid;
                var fullKitTaskElement = me.tasksByUid[$(evt.target).closest(".task").data("model").uid].$el;
                highlightImmediatePredecessors(fullkitTaskUid);
                break;

            case "highlight-all-predecessors-for-fullkit":
                clearAllHighlight();
                var fullkitTaskUid = $(evt.target).closest(".task").data("model").uid;
                var fullKitTaskElement = me.tasksByUid[$(evt.target).closest(".task").data("model").uid].$el;
                highlightAllPredecessors(fullkitTaskUid);
                break;

            case "highlight-longest-predecessor-chain-for-fullkit":
                clearAllHighlight();

                var fullkitTaskElement = $(evt.target).closest(".task");
                var tasksInPredecessorChain = [];

                tasksInPredecessorChain = me.highlightLongestPredecessorChain(fullkitTaskElement);

                if (tasksInPredecessorChain.length > 0) {
                    me.highlightChain(tasksInPredecessorChain, false, "constrainingSuccessorTask");
                    $(".page-header .highlight").find(".button-text").text(HIGHLIGHT + SHOW_LONGEST_PREDECESSOR_CHAIN);
                    stl.app.isHighlightPresent = true;
                }
                else
                    stl.app.isHighlightPresent = false;
                break;
        }
        if (keepPopupOpen) {
            evt.stopPropagation();
        } else {
            $toolitem.closest(".tool-popup").fadeOut(250);
        }
    });

};
stl.app.getActiveTimelineViewName = function(){
    var checkInput = $(".timeline-chain-switch .switch .switch-input");
    if(checkInput.is(":visible") && checkInput.is(":checked"))
        return CHAIN_VIEW;
    return TIMELINE_VIEW;
};

stl.app.getLinksDeleteDialog = function(linkId){
    clearSelection();
    if (stl.app.isProjectOpenInViewOnlyMode()) return;
    if ($(".linksDeleteDialog").length > 0) return;
    var event = event ? event : window.event;
    //event.preventDefault();
    
    $('<div></div>').dialog({
        title: DELETE_TASK_LINK,
        dialogClass: 'linksDeleteDialog',
        id: 'linksDeleteDialog' + linkId,
        position:[event.clientX,event.clientY],
        open: function() {
          var markup = stl.app.getLinkDisplayName(linkId);
          $(this).html(markup);
          $($(".linksDeleteDialog").find(".ui-dialog-content.ui-widget-content")).css("minHeight","");
          $(this).dialog('widget').attr('id', 'linksDeleteDialog' + linkId);
        },
        buttons: [
            {
                text: YES_STR,
                "class": "btn",
                click: function() {
                    var obj = stl.app.getLinkFromAndToIds(linkId);
                    stl.app.ProjectDataFromServer.removeLink(obj.fromId, obj.toId);
                    var link = {
                        from: obj.fromId,
                        to: obj.toId,
                        valid: true,
                        error: []
                    }
                    stl.app.undoStackMgr.pushToUndoStackForLinkDelete(null, stl.app.ProjectDataFromServer,link);

                    $( this ).dialog( "close" );
                }
            },
            {
                text: NO_STR,
                "class": "btn",
                click: function() {
                    $( this ).dialog( "close" );
                }
            }
        ],
        close: function(){
            $(this).remove();
            stl.app.isLinksDeleteDialogActive = false;
            stl.app.removeLinkHighlightedForDelete(linkId);
        }
      });
    stl.app.isLinksDeleteDialogActive = true;
}

stl.app.removeLinkHighlightedForDelete = function(linkId){
    var path = $("path#" + linkId);
    var event = document.createEvent('Event');
    event.initEvent('mouseleave', true, true);
    if (path.length > 0){
        path[0].dispatchEvent(event);
    }
}

stl.app.getLinkFromAndToIds = function(LinkId){
    var linkIdInfo = LinkId.split("to");
    var fromId = linkIdInfo[0];
    if (fromId.indexOf("TMView") > -1){
        fromId = fromId.split("TMView")[1];
    } else if (fromId.indexOf("ChainView") > -1){
        fromId = fromId.split("ChainView")[1];
    } else if (fromId.indexOf("PERT") > -1){
        fromId = fromId.split("PERT")[1];
    } else if (fromId.indexOf("TM") > -1){
        fromId = fromId.split("TM")[1];
    }
    
    var toId = linkIdInfo[1];
    return {fromId: fromId, toId: toId};
}

stl.app.getLinkDisplayName = function(linkId){
    var obj = stl.app.getLinkFromAndToIds(linkId);
    var fromId = obj.fromId;
    var toId = obj.toId;
    var fromTask = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(fromId);
    var toTask = stl.app.ProjectDataFromServer.getTaskOrMilestoneByUid(toId);
    var fromTaskPara = "<tr><td valign='top'><p>"+ TASK_FROM +"</td><td>"+ fromTask.name +"</p></td></tr>";
    var toTaskPara = "<tr><td valign='top'><p>"+ TASK_TO +"</td><td>"+ toTask.name +"</p></td></tr>";
    return "<table><tbody>"+fromTaskPara + toTaskPara + "</tbody></table>";
}

stl.app.IsLinkSelectedForDelete = function(linkId){
    dialog = $("#linksDeleteDialog"+linkId);
    if (dialog.length > 0){
        return dialog;
    }
    return false;
}

stl.app.highlightLinkSelectedForDelete = function(){
    var linkId = $(".linksDeleteDialog").attr("id").split("linksDeleteDialog")[1];
    var path = $("path#" + linkId);
    var event = document.createEvent('Event');
    event.initEvent('mouseenter', true, true);
    if (path.length > 0){
        path[0].dispatchEvent(event);
    }
};

stl.app.removeLinksDeleteDialog = function (){
    if ($(".linksDeleteDialog").length > 0){
        var dialogElem = $(".linksDeleteDialog").find(".ui-widget-content")[0];
        $(dialogElem).dialog("close");
    }
}

function clearSelection() {
    if(document.selection && document.selection.empty) {
        document.selection.empty();
    } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
};

stl.app.saveCultureSpecificSeparators = function (cultureSeparators) {
    this.NumberDecimalSeparator = cultureSeparators.NumberDecimalSeparator;
    this.Validator = Ext.create("Realization.Validator");
};


stl.app.handleErrorsWarningsReturnedFromServer = function(errorsOrWarningsCollection, whereToShowErrors, msgType, title) {
    switch (whereToShowErrors) {
        case SHOW_SERVER_ERRORS_IN.TOASTR:
            stl.app.showMultipleMsgsInToastr(errorsOrWarningsCollection, msgType, title);
            break;
        case SHOW_SERVER_ERRORS_IN.ERROR_PANEL:
            break;
        default:
    }
};
stl.app.showMultipleMsgsInToastr = function(messages, msgType, title) {
    var concatenatedStrings = stl.app.getMsgsStringsForToastr(messages);
    switch (msgType) {
        case MSG_TYPES.ERROR:
            PPI_Notifier.error(concatenatedStrings, title);
            break;
        case MSG_TYPES.WARNING:
            PPI_Notifier.warning(concatenatedStrings, title);
            break;
        default:    
    }
};
stl.app.getMsgsStringsForToastr = function(messages) {
    var concatenatedMsg = EMPTY_STRING;
    _.each(messages, function(msg) {
        concatenatedMsg += msg.Description;
        concatenatedMsg += "</br>";
    });
    return concatenatedMsg;
};

stl.app.wireSpecialKeyBoardEvents = function(){
    $(document).off('keydown').on("keydown", function(evt){
        var evt = evt || window.event;
        if (stl.app.readOnlyFlag) return;
        if (evt.keyCode == ESC_KEY) { // escape key maps to keycode `27`
            if (stl.app.matrixView){
               if (stl.app.matrixView.selectedTask){
                    var taskView = stl.app.matrixView.selectedTask.data("view");
                    
                } 
            }
            if (stl.app.timelineView){
               if (stl.app.timelineView.editTaskView){
                    var taskView = stl.app.timelineView.editTaskView;
                    
                }
            }

            if (stl.app.chainView){
               if (stl.app.chainView.editTaskView){
                    var taskView = stl.app.chainView.editTaskView;
                    
                }
            }
            
            if (taskView){
                if (taskView.isNameInEditMode()){
                    taskView.revertTasName();
                    return;
                }
            }
            
            

            $(document).trigger("taskMultiSelectEnd");
            return;
        } 

        if (evt.ctrlKey && evt.keyCode == C_KEY){//Ctrl + C
            DOMManipulatorWrapperInstance.addClassNameToElement($("#CopyButtonToolBar"), "selected");
            DOMManipulatorWrapperInstance.removeClassNameFromElement($("#CutButtonToolBar"), "selected");
            $(document).trigger("taskCopyStart");
        }

        if (evt.ctrlKey && evt.keyCode == X_KEY){//Ctrl + X
            DOMManipulatorWrapperInstance.addClassNameToElement($("#CutButtonToolBar"), "selected");
            DOMManipulatorWrapperInstance.removeClassNameFromElement($("#CopyButtonToolBar"), "selected");
            $(document).trigger("taskCutStart");
        }

        if(evt.ctrlKey && evt.keyCode == Z_KEY && stl.app.getCurrentViewId() !== TABLE_VIEW_ID){// Ctrl + Z (Undo)
            evt.preventDefault();
            stl.app.undoStackMgr.undo();
        }

        if(evt.ctrlKey && evt.keyCode == Y_KEY && stl.app.getCurrentViewId() !== TABLE_VIEW_ID){// Ctrl + Y (Redo)
            evt.preventDefault();
            stl.app.undoStackMgr.redo();
        }
    });

    $("#DeleteButtonToolBar").off('click').on('click', function(evt) {
        DOMManipulatorWrapperInstance.addClassNameToElement($(evt.target), "selected");
        
        DeleteTasksClicked();
    });

    $("#CutButtonToolBar").off('click').on('click', function(evt) {
        DOMManipulatorWrapperInstance.addClassNameToElement($(evt.target), "selected");
        DOMManipulatorWrapperInstance.removeClassNameFromElement($("#CopyButtonToolBar"), "selected");
        CutTasksClicked();
    });

    $("#CopyButtonToolBar").off('click').on('click', function(evt) {
        DOMManipulatorWrapperInstance.addClassNameToElement($(evt.target), "selected");
        DOMManipulatorWrapperInstance.removeClassNameFromElement($("#CutButtonToolBar"), "selected");
        CopyTasksClicked();
    });

    $("#UndoButtonToolBar").off('click').on('click', function(evt) {
        stl.app.undoStackMgr.undo();
    });

    $("#RedoButtonToolBar").off('click').on('click', function(evt) {

        stl.app.undoStackMgr.redo();
    });
};

stl.app.populateDivisionPhases = function(division){
    
    stl.app.divisionPhases = _.pluck(_.filter(stl.app.PhasesFromAllDivisions, function(virtualResource){
        return virtualResource.IsGlobal && 
        _.contains(virtualResource.Divisions,division);

    }),"Name");

    stl.app.AllDivisionPhaseNames = _.pluck(stl.app.PhasesFromAllDivisions, "Name");
};

stl.app.setPredSuccIdsArray = function(task) {
    task._predecessorsIds= []
    _.each(task._predecessors, function(predTask) {
        task._predecessorsIds.push(predTask.uid)
    });
    task._successorsIds = []
    _.each(task._successors, function(succTask) {
       task._successorsIds.push(succTask.uid)
    });
};
/*********************************** Custom Text Field Editors,renderers, updaters *********************************/
stl.app.getCustomTextFieldEditor = function(customColumn,record){
    var customTextField = customColumn.dataIndex;
    //get from config if its a text field or combobox
    var key = "CUSTOM_TASK_" + stl.app.customTextFieldsMap[customTextField].toUpperCase();
    var customConfig = ConfigData.customTextFieldsSettingsMap[key];
    var field={};
    field.customTextField = customTextField;
    switch(customConfig.textFieldType){
        case 0:
            //only textfield
            field.xtype = "textfield";
            field.allowBlank = false;
            field.allowOnlyWhitespace = false;
            field.selectOnFocus = true;            
        break;
        case 1:
            //Dropdown field with no text and fixed width
            field.xtype = "combobox";
            field.queryMode = 'local';
            field.store = customConfig.textFieldItems;
            field.displayField = 'name';
            field.valueField = 'name';
            field.minWidth = customConfig.dropdownWidth;
            field.forceSelection = true;
            field.editable = false;
            field.multiSelect = false;

        break;
        case 2:
            //Dropdown with text and fixed width
            field.xtype = "combobox";
            field.queryMode = 'local';
            field.store = customConfig.textFieldItems;
            field.displayField = 'name';
            field.valueField = 'name';
            field.minWidth = customConfig.dropdownWidth;
            field.forceSelection = false;
            field.multiSelect = true;
        break;
        case 3:
            //Dropdown with no text and no field width
            field.xtype = "combobox";
            field.queryMode = 'local';
            field.store = customConfig.textFieldItems;
            field.displayField = 'name';
            field.valueField = 'name';
            field.forceSelection = true;
            field.editable = false;
            field.multiSelect = false;
        break;
        case 4:
            //Dropdown with text and no fixed width
            field.xtype = "combobox";
            field.queryMode = 'local';
            field.store = customConfig.textFieldItems;
            field.displayField = 'name';
            field.valueField = 'name';
            field.forceSelection = false;
            field.multiSelect = true;
    }
    return field;
};
stl.app.renderCustomTextField = function(customTextField, innerTextField, taskRec){
    //get from config if its a text field or combobox
    var key = "CUSTOM_TASK_" + customTextField.toUpperCase();
    var customConfig = ConfigData.customTextFieldsSettingsMap[key];
    if(customConfig.checkListEnabled){
        var checklistStatusKey = taskRec.get('model')[innerTextField+"CheckListStatus"];
        var id = 'custom'+customTextField+'ChecklistImg' + taskRec.get('Id'),
        img = "resources/images/checklistnone.gif";
        if (checklistStatusKey === 2) {
            img = "resources/images/chklistcomplete.gif";
        } else if (checklistStatusKey === 1) {
            img = "resources/images/checklist.GIF";
        } else if (checklistStatusKey === 0) {
            img = "resources/images/checklistnone.GIF";
        }
        var txt ="";
        if(taskRec.get(innerTextField))
            txt = taskRec.get(innerTextField);
        return txt+"<img id= '" + id + "' class='image-button' src='" + img + "' onclick='stl.app.showChecklistItems(event,\""+innerTextField+"\")'></img>";
    }else{
        return taskRec.get(innerTextField);
    }
};
stl.app.showChecklistItems = function(event,customField){
    if(!event.stopPropagation)
            event.cancelBubble = true;
        else
            event.stopImmediatePropagation();
        var tableview = Ext.getCmp('tableview');
        var tableViewStore = tableview.getStore();
        var eventRecordId = event.target.id;
        var searchId = eventRecordId.substring(('custom'+stl.app.customTextFieldsMap[customField]+'ChecklistImg').length);
        var record = tableViewStore.findRecord("id", searchId);
        tableview.isCheckListIconClicked = true;
        var checklist = record.get('model')[customField+'ChecklistItems'];
        var title = stl.app.customTextFieldsMap[customField] +" "+ CHECKLIST_TITLE + record.data.name;
        var data=[];
        if(checklist && checklist.length > 0){
            for(var i =0 ;i<checklist.length; i++){
                data.push({
                    complete:checklist[i].complete,
                    name: checklist[i].name,
                    uid:checklist[i].uid,
                    dummy:false,
                    order:checklist[i].order
                });
            }
        }
        var store =  Ext.create('Ext.data.Store',{
            fields:['complete', 'name', 'uid'],
            data:data
        });
        var checklistWin = Ext.create('ProjectPlanning.view.checkList.Checklist', {
            selectedRecord: record,
            store: store,
            title: title
        });
        var grid = Ext.getCmp('checklistGrid');
        if (Ext.getCmp('tableview').readOnly) {
            grid.disable();
        }
        checklistWin.show();
        $(".x-mask").on("click", function() {
            checklistWin.close();
        });
        checklistWin.on("save", function() {
            // TODO still too tightly coupled to window internals; save event should just pass relevant data
            if (!Ext.getCmp('tableview').readOnly) {
                var store = checklistWin.down("grid").getStore();
                var origRecord = this.selectedRecord;
                var recModel = origRecord.get("model"); //subtask or full kit task
                var checklist = origRecord.get('model')[customField+'ChecklistItems'];
                var removedRecords = store.getRemovedRecords();                
                for(var i = removedRecords.length-1 ;i >=0 ;i--){
                    var rec = _.find(checklist,function(ck){
                        return ck.name == removedRecords[i].get('name');
                    });                    
                    recModel[customField+'ChecklistItems'].splice(checklist.indexOf(rec),1);
                }
                var updatedRecords = store.getUpdatedRecords();
                for(var i =0 ;i < updatedRecords.length;i++){
                    var rec = _.find(checklist,function(ck){
                        return ck.name == updatedRecords[i].get('name');
                    });
                    rec.complete = updatedRecords[i].get('complete');
                    rec.name = updatedRecords[i].get('name');
                }
                var newRecords = store.getNewRecords();
                for(var i =0 ;i < newRecords.length; i++){
                    if(!newRecords[i].get('dummy'))
                        recModel[customField+'ChecklistItems'].push(newRecords[i].data);                 
                }
                for(var i=0; i<checklist.length; i++){
                    var rec = store.findRecord('name',checklist[i].name,0,false,true,true);
                    checklist[i].order = store.indexOf(rec);
                }
                recModel[customField+'ChecklistItems'] = _.sortBy(checklist, function(ck){ return ck.order; });
                var allComplete = false;
                recModel[customField+'CheckListStatus'] = 0;
                if(recModel[customField+'ChecklistItems'] && recModel[customField+'ChecklistItems'].length > 0) {
                    recModel[customField+'CheckListStatus'] = 1;
                    var index = this.store.find( "complete", false);
                    allComplete = (index == -1 || index ==this.store.getCount()-1) ? true : false;
                    if(allComplete)
                       recModel[customField+'CheckListStatus'] = 2;
                }
                stl.app.refreshChecklistIcon(recModel,customField);
                var record = isSubtask(origRecord) ? origRecord.parentNode : origRecord;
                $(document).trigger("taskchange", [ Ext.getCmp('tableview'), record.get('model')]);
            }
        });
};
stl.app.refreshChecklistIcon = function( origRecord, customField) {
    var chkstatus,id;
    if(! origRecord.get){
        chkstatus = origRecord[customField+'CheckListStatus'];
        id = origRecord.uid;
    }else{
        chkstatus = origRecord.get(customField+'CheckListStatus');
        id= origRecord.get('Id');
    }
    if (chkstatus === 2) {
        var img = document.getElementById('custom'+stl.app.customTextFieldsMap[customField]+'ChecklistImg' + id);
        img.src = "resources/images/chklistcomplete.gif";
    } else if (chkstatus === 1) {
        var img = document.getElementById('custom'+stl.app.customTextFieldsMap[customField]+'ChecklistImg' + id);
        img.src = "resources/images/checklist.GIF";
    } else if (chkstatus === 0) {
        var img = document.getElementById('custom'+stl.app.customTextFieldsMap[customField]+'ChecklistImg' + id);
        img.src = "resources/images/checklistnone.GIF";
    }
};
stl.app.updateCustomTextField= function(field,record){
    if(field.xtype == "combobox" && field.editable){
        var fieldVal = field.getValue();
        if(!fieldVal)
            fieldVal = field.getRawValue();
        field.setValue(fieldVal);
        record.get('model')[field.customTextField] = fieldVal;
    }
    else{
        record.get('model')[field.customTextField] = field.getValue();
    }
}

stl.app.honourConfigForGlobalResources = function(){
    return stl.app.useGlobalResourcesOnly == "1";
};

stl.app.honourConfigForGlobalPhases = function(){
    return stl.app.useGlobalPhasesOnly == "1";
};




