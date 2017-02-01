/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * This mixin eliminates differences between flat/tree store in get by [internal] id functionality and it should be
 * mixed into data model stores.
 *
 * It adds two methods {@link #getModelById getModelById()} and {@link #getModelByInternalId getModelByInternalId()}
 * which should be used everywhere in the code instead of native getById() / getByInternalId() methods.
 *
 * @private
 */
if (!Ext.ClassManager.get("Sch.data.mixin.UniversalModelGetter")) Ext.define('Sch.data.mixin.UniversalModelGetter', {

    getModelById : function(id) {
        var me = this;
        return me.getNodeById ? me.getNodeById(id) : me.getById(id);
    },

    getModelByInternalId : function(id) {
        var me = this;
        return me.byInternalIdMap ? me.byInternalIdMap[id] : me.getByInternalId(id);
    }

});
