/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.CrudManager

The Crud Manager (or "CM") is a class implementing centralized loading and saving of data in multiple stores.
Loading the stores and saving all changes is done using one ajax request. This class uses AJAX as a transport mechanism and JSON as the data encoding format.

For usage details please see [this guide](#!/guide/scheduler_crud_manager).

# Scheduler stores

The class supports Ext Scheduler specific stores (namely: resource, event and assignment stores).
For these stores, the CM has separate configs ({@link #resourceStore}, {@link #eventStore}, {@link #assignmentStore)
to register them. The class can also grab them from the task store (this behavior can be changed using
{@link #addRelatedStores} config).

    var crudManager = Ext.create('Sch.data.CrudManager', {
        autoLoad        : true,
        resourceStore   : resourceStore,
        eventStore      : eventStore,
        assignmentStore : assignmentStore,
        transport       : {
            load    : {
                url     : 'php/read.php'
            },
            sync    : {
                url     : 'php/save.php'
            }
        }
    });

# AJAX request configuration

To configure AJAX request parameters please take a look at the {@link #transport} config.

    var crudManager = Ext.create('Sch.data.CrudManager', {
        autoLoad        : true,
        resourceStore   : resourceStore,
        eventStore      : eventStore,
        assignmentStore : assignmentStore,
        transport       : {
            load    : {
                url         : 'php/read.php',
                // use GET request
                method      : 'GET',
                // pass request JSON in "rq" parameter
                paramName   : 'rq',
                // extra HTTP request parameters
                params      : {
                    foo     : 'bar'
                }
            },
            sync    : {
                url     : 'php/save.php'
            }
        }
    });


# Load order

The CM is aware of the proper load order for Scheduler specific stores so you don't need to worry about it.
If you provide any extra stores (using {@link #stores} config) they will be added to the start of collection before
 the Scheduler specific stores.
If you a different load order, you should use {@link #addStore} method to register your store:

    var crudManager = Ext.create('Sch.data.CrudManager', {
        resourceStore   : resourceStore,
        eventStore      : eventStore,
        assignmentStore : assignmentStore,
        // extra user defined stores will get to the start of collection
        // so they will be loaded first
        stores          : [ store1, store2 ],
        transport       : {
            load    : {
                url     : 'php/read.php'
            },
            sync    : {
                url     : 'php/save.php'
            }
        }
    });

    // append store3 to the end so it will be loaded last
    crudManager.addStore(store3);

    // now when we registered all the stores let's load them
    crudManager.load();

*/
Ext.define('Sch.data.CrudManager', {
    extend          : 'Sch.crud.AbstractManager',

    mixins          : ['Sch.crud.encoder.Json', 'Sch.crud.transport.Ajax'],

    /**
     * @cfg {Sch.data.ResourceStore/Object} resourceStore A store with resources (or its descriptor).
     */
    /**
     * @property {Object} resourceStore The resource store descriptor.
     */
    resourceStore   : null,
    /**
     * @cfg {Sch.data.EventStore/Object} eventStore A store with events (or its descriptor).
     */
    /**
     * @property {Object} eventStore The event store descriptor.
     */
    eventStore      : null,
    /**
     * @cfg {Sch.data.AssignmentStore/Object} assignmentStore A store with assignments (or its descriptor).
     */
    /**
     * @property {Object} assignmentStore The assignment store descriptor.
     */
    assignmentStore : null,

    /**
     * @cfg {Boolean} addRelatedStores
     * When set to `true` this class will try to get the {@link #resourceStore} and {@link #assignmentStore} stores from
     * the specified {@link #eventStore} instance.
     */
    addRelatedStores    : true,

    constructor : function (config) {
        config  = config || {};

        var resourceStore   = config.resourceStore   || this.resourceStore,
            eventStore      = config.eventStore      || this.eventStore,
            assignmentStore = config.assignmentStore || this.assignmentStore,
            // list of stores to add
            stores          = [];

        // retrieve stores registered on the provided taskStore
        if (eventStore && config.addRelatedStores !== false) {
            var extracted   = this.getEventStoreInfo(eventStore, config);

            assignmentStore = assignmentStore || extracted.assignmentStore;
            resourceStore   = resourceStore   || extracted.resourceStore;
        }

        // event store
        eventStore && stores.push(eventStore);
        // resource store
        resourceStore && stores.push(resourceStore);
        // assignment store
        assignmentStore && stores.push(assignmentStore);

        // all the Scheduler related stores will go after the user defined stores from the config.stores
        if (stores.length) {
            var syncSequence   = [];

            // For applying sync results we have a different order:
            // resources -> events -> assignments
            resourceStore && syncSequence.push(resourceStore);
            eventStore && syncSequence.push(eventStore);
            assignmentStore && syncSequence.push(assignmentStore);

            if (syncSequence.length) {
                config.syncApplySequence    = (config.syncApplySequence || config.stores || []).concat(syncSequence);
            }

            var _stores      = config.stores || this.stores;

            if (_stores && !Ext.isArray(_stores)) _stores = [_stores];

            config.stores   = (_stores || []).concat(stores);
        }

        this.callParent([ config ]);

        this.eventStore      = this.getStoreDescriptor(eventStore);
        this.resourceStore   = this.getStoreDescriptor(resourceStore);
        this.assignmentStore = this.getStoreDescriptor(assignmentStore);
    },

    getEventStoreInfo : function (eventStore, config) {
        if (!(eventStore instanceof Ext.data.AbstractStore)) {
            if (typeof eventStore == 'string') {
                eventStore   = Ext.data.StoreManager.get(eventStore);
            } else {
                eventStore   = eventStore.store;
            }
        }
        var result          = {},
            assignmentStore = config.assignmentStore,
            resourceStore   = config.resourceStore;

        !assignmentStore && (result.assignmentStore = eventStore.getAssignmentStore());
        !resourceStore   && (result.resourceStore   = eventStore.getResourceStore());

        return result;
    },

    /**
     * Returns the resource store bound to the CRUD manager.
     * @return {Sch.data.ResourceStore} The resource store.
     */
    getResourceStore : function () {
        return this.resourceStore && this.resourceStore.store;
    },

    /**
     * Returns the event store bound to the CRUD manager.
     * @return {Sch.data.EventStore} The event store.
     */
    getEventStore : function () {
        return this.eventStore && this.eventStore.store;
    },

    /**
     * Returns the assignment store bound to the CRUD mananger.
     * @return {Sch.data.AssignmentStore} The assignment store
     */
    getAssignmentStore : function() {
        return this.assignmentStore && this.assignmentStore.store;
    }
});
