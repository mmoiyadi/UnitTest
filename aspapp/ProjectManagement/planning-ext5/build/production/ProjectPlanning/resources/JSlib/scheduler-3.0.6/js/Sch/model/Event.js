/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.model.Event
@extends Sch.model.Range

This class represent a single event in your schedule. Its a subclass of the {@link Sch.model.Range}, which is in turn subclass of {@link Sch.model.Customizable} and {@link Ext.data.Model}.
Please refer to documentation of those classes to become familar with the base interface of the task.

The Event model has a few predefined fields as seen below. If you want to add new fields or change the options for the existing fields,
you can do that by subclassing this class (see example below).

Fields
------

- `Id`          - (mandatory) unique identificator of task
- `Name`        - name of the event (task title)
- `StartDate`   - start date of the task in the ISO 8601 format
- `EndDate`     - end date of the task in the ISO 8601 format,
- `ResourceId`  - The id of the associated resource
- `Resizable`   - A field allowing you to easily control how an event can be resized. You can set it to: true, false, 'start' or 'end' as its value.
- `Draggable`   - A field allowing you to easily control if an event can be dragged. (true or false)
- `Cls`         - A field containing a CSS class to be added to the rendered event element.

Subclassing the Event model class
--------------------

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',

        fields      : [
            // adding new field
            { name: 'MyField', type : 'number', defaultValue : 0 }
        ],

        myCheckMethod : function () {
            return this.get('MyField') > 0
        },
        ...
    });

If you want to use other names for the StartDate, EndDate, ResourceId and Name fields you can configure them as seen below:

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',

        startDateField  : 'taskStart',
        endDateField    : 'taskEnd',

        // just rename the fields
        resourceIdField : 'userId',
        nameField       : 'taskTitle',

        fields      : [
            // completely change the definition of fields
            { name: 'taskStart', type: 'date', dateFormat : 'Y-m-d' },
            { name: 'taskEnd', type: 'date', dateFormat : 'Y-m-d' },
        ]
        ...
    });

Please refer to {@link Sch.model.Customizable} for additional details.

*/
!Ext.ClassManager.get("Sch.model.Event") && Ext.define('Sch.model.Event', {
    extend : 'Sch.model.Range',

    idProperty : 'Id',

    customizableFields : [
        { name : 'ResourceId' },
        { name : 'Draggable', type : 'boolean', persist : false, defaultValue : true },   // true or false
        { name : 'Resizable', persist : false, defaultValue : true }                     // true, false, 'start' or 'end'
    ],

    /**
     * @cfg {String} resourceIdField The name of the field identifying the resource to which an event belongs. Defaults to "ResourceId".
     */
    resourceIdField : 'ResourceId',

    /**
     * @cfg {String} draggableField The name of the field specifying if the event should be draggable in the timeline
     */
    draggableField : 'Draggable',

    /**
     * @cfg {String} resizableField The name of the field specifying if/how the event should be resizable.
     */
    resizableField : 'Resizable',

    getInternalId : function() {
        return this.internalId;
    },

    /**
     * Returns an event store this event is part of. Event must be part
     * of an event store to be able to retrieve event store.
     *
     * @return {Sch.data.EventStore|null}
     */
    getEventStore : function() {
        var me = this,
            result = me.joined && me.joined[ 0 ];

        if (result && !result.isEventStore) {
            Ext.Array.sort(me.joined, function(a, b) {
                return (a.isEventStore || false) > (b.isEventStore || false) && -1 || 1;
            });
            result = me.joined[ 0 ];
        }

        return result;
    },

    /**
     * Returns a resource store this event uses as default resource store. Event must be part
     * of an event store to be able to retrieve default resource store.
     *
     * @return {Sch.data.ResourceStore|null}
     */
    getResourceStore : function() {
        var eventStore = this.getEventStore();
        return eventStore && eventStore.getResourceStore();
    },

    /**
     * Returns an assigment store this event uses as default assignment store. Event must be part
     * of an event store to be able to retrieve default assignment store.
     *
     * @return {Sch.data.AssigmentStore|null}
     */
    getAssignmentStore : function() {
        var eventStore = this.getEventStore();
        return eventStore && eventStore.getAssignmentStore();
    },

    /**
     * Returns all resources assigned to an event.
     *
     * @return {[Sch.model.Resource]}
     */
    getResources : function() {
        var me = this,
            eventStore = me.getEventStore();

        return eventStore && eventStore.getResourcesForEvent(me) || [];
    },

    /**
     * @private
     */
    forEachResource : function (fn, scope) {
        var rs = this.getResources();

        for (var i = 0; i < rs.length; i++) {
            if (fn.call(scope || this, rs[i]) === false) {
                return;
            }
        }
    },

    /**
     * Returns either the resource associated with this event (when called w/o `resourceId`) or resource
     * with specified id.
     *
     * @param {String} resourceId (optional)
     * @return {Sch.model.Resource}
     */
    getResource : function (resourceId, eventStore) { // TODO: this signature sucks, eventStore WHY?
        var me              = this,
            result          = null,
            resourceStore;

        eventStore    = eventStore || me.getEventStore();
        resourceStore = eventStore && eventStore.getResourceStore();

        // Allow 0 as a valid resource id
        resourceId = resourceId == null ? me.getResourceId() : resourceId;

        if (eventStore && (resourceId === null || resourceId === undefined)) {
            result = eventStore.getResourcesForEvent(me);

            if (result.length == 1) {
                result = result[0];
            }
            else if (result.length > 1) {
                Ext.Error.raise("Event::getResource() is not applicable for events with multiple assignments, please use Event::getResources() instead.");
            }
            else {
                result = null;
            }
        }
        else if (resourceStore) {
            result = resourceStore.getModelById(resourceId);
        }

        return result;
    },

    /**
     * Sets the resource which the event should belong to.
     *
     * @param {Sch.model.Resource/Mixed} resource The new resource
     */
    setResource : function(resource) {
        var me = this,
            eventStore = me.getEventStore();

        eventStore && eventStore.removeAssignmentsForEvent(me);

        me.assign(resource);
    },

    /**
     * Assigns this event to the specified resource.
     *
     * @param {Sch.model.Resource|Mixed|Array} resource A new resource for this event, either as a full Resource record or an id (or an array of such).
     */
    assign : function(resource) {
        var me = this,
            eventStore = me.getEventStore();

        resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator

        if (eventStore) {
            eventStore.assignEventToResource(me, resource);
        }
        else {
            me.setResourceId(resource);
        }
    },

    /**
     * Unassigns this event from the specified resource
     *
     * @param {Sch.model.Resource/Mixed/Array} [resource] The resource to unassign from.
     */
    unassign : function(resource) {
        var me = this,
            eventStore = me.getEventStore();

        resource = resource instanceof Sch.model.Resource ? resource.getId() : resource; // resource id might be 0 thus we use ? operator

        if (eventStore) {
            eventStore.unassignEventFromResource(me, resource);
        }
        else if (me.getResourceId() == resource) {
            me.setResourceId(null);
        }
    },

    /**
     * Reassigns an event from an old resource to a new resource
     *
     * @param {Sch.model.Resource/Mixed} resource A resource to unassign from
     * @param {Sch.model.Resource/Mixed} resource A resource to assign to
     */
    reassign : function(oldResource, newResource) {
        var me = this,
            eventStore = me.getEventStore();

        oldResource = oldResource instanceof Sch.model.Resource ? oldResource.getId() : oldResource; // resource id might be 0 thus we use ? operator
        newResource = newResource instanceof Sch.model.Resource ? newResource.getId() : newResource; // resource id might be 0 thus we use ? operator

        if (eventStore) {
            eventStore.reassignEventFromResourceToResource(me, oldResource, newResource);
        }
        else {
            me.setResourceId(newResource);
        }
    },

    /**
     * @method isAssignedTo
     * Returns true if this event is assigned to a certain resource.
     *
     * @param {Sch.model.Resource|Mixed} resource The resource to query for
     * @return {Boolean}
     */
    isAssignedTo : function(resource) {
        var me = this,
            eventStore = me.getEventStore(),
            result = false;

        resource = resource instanceof Sch.model.Resource && resource.getId() || resource;

        if (eventStore) {
            result = eventStore.isEventAssignedToResource(me, resource);
        }
        else {
            result = me.getResourceId() == resource;
        }

        return result;
    },

    /**
     * Returns all assignments for the event. Event must be part of the store for this method to work.
     *
     * @return {[Sch.model.Assignment]}
     */
    getAssignments : function() {
        var me = this,
            eventStore = me.getEventStore();

        return eventStore && eventStore.getAssignmentsForEvent(me);
    },

    /**
     * @method setDraggable
     *
     * Sets the new draggable state for the event
     * @param {Boolean} draggable true if this event should be draggable
     */

    /**
     * @method isDraggable
     *
     * Returns true if event can be drag and dropped
     * @return {Mixed} The draggable state for the event.
     */
    isDraggable : function () {
        return this.getDraggable();
    },

    /**
     * @method setResizable
     *
     * Sets the new resizable state for the event. You can specify true/false, or 'start'/'end' to only allow resizing one end of an event.
     * @param {Boolean} resizable true if this event should be resizable
     */

    /**
     * @method getResourceId
     *
     * Returns the resource id of the resource that the event belongs to.
     * @return {Mixed} The resource Id
     */

    /**
     * @method isResizable
     *
     * Returns true if event can be resized, but can additionally return 'start' or 'end' indicating how this event can be resized.
     * @return {Mixed} The resource Id
     */
    isResizable : function () {
        return this.getResizable();
    },

    /**
     * @method setResourceId
     *
     * Sets the new resource id of the resource that the event belongs to.
     * @param {Mixed} resourceId The resource Id
     */

    /**
     * Returns false if a linked resource is a phantom record, i.e. it's not persisted in the database.
     *
     * @return {Boolean} valid
     */
    isPersistable : function () {
        var me = this,
            eventStore = me.getEventStore();
        return eventStore && eventStore.isEventPersistable(me);
    }
});
