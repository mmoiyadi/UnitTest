/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 *
 * TODO - Replace this content of this view to suite the needs of your application.
 */
Ext.define('ProjectPlanning.view.main.Main', {
    extend: 'Ext.container.Container',
    requires: [
        'ProjectPlanning.view.main.MainController',
        'ProjectPlanning.view.main.MainModel',
        'ProjectPlanning.store.ChecklistDataStore'
    ],

    xtype: 'app-main',

    controller: 'main',
    viewModel: {
        type: 'main'
    },

    layout: {
        type: 'border'
    },

    style: {
        background: "#394B66",
    },

    items: [
        {
            xtype: "component",
            autoEl: {
                tag: "div",
                cls: "mask-view"
            }
        },
        {
            region: 'west',
            id: 'main-nav',
            collapsible: true,
            hidden: true,
            margins: '0 0 0 0',
            flex: 0,
            listeners: {
                "afterrender": function () {
                }
            }
        },
        {
            region: 'north',
            margins: '0 0 0 0',
            id: 'project-header',
            hidden: true,
            border: true,
            items: [{
                contentEl: $(".page-header-top")[0],
                id: 'project-header1',
                hidden: false,
                border: true,
                margins: '0 0 0 0'
            }, {
                contentEl: $(".page-header")[0],
                id: 'project-header2',
                hidden: false,
                border: false,
                margins: '0 0 0 0'
            }]

        },
        {
            region: 'south',
            xtype: 'panel',
            id: 'dockingPanel',
            resizable: true,
            resizeHandles: 'n',
            height: 'auto',
            //flex:1,
            layout: {
                align: 'stretch',
                type: 'hbox'
            }
        },
        {
            region: 'center',
            xtype: "container",
            id: "content",
            layout: 'card',
            flex: 1,
            listeners:{
                beforeadd:function(container, component, index, eOpts){
                    var id = component.id;
                    switch (id){
                        case "chainview":
                            $(".timeline-chain-switch .switch .switch-input").prop('checked',true);
                        break;
                        case "timelineview":
                            $(".timeline-chain-switch .switch .switch-input").prop('checked',false);
                        break;
                    }
                    return true;
                }
            },
            items: [
                {
                    xtype: "component",
                    id: "recent-projects",
                    cls: "recent-projects",
                    listeners: {
                        // TODO this area is not used, it's the placeholder for what we'd show if no project is loaded (e.g., recent projects list)
                    }
                }
            ]
        }
    ]


});
