/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.mixin.Localizable

A mixin providing localization functionality to the consuming class.

    Ext.define('My.Toolbar', {
        extend      : 'Ext.Toolbar',
        mixins      : [ 'Sch.mixin.Localizable' ],

        initComponent   : function () {
            Ext.apply(this, {
                items   : [
                    {
                        xtype       : 'button',

                        // get the button label from the current locale
                        text        : this.L('loginText')
                    }
                ]
            });

            this.callParent(arguments);
        }
    });

*/
Ext.define('Sch.mixin.Localizable', {

    // This line used to be like this:
    //      if Sch.config.locale is specified then we'll require corresponding class
    //      by default we require Sch.locale.En class
//          requires            : [ typeof Sch != 'undefined' && Sch.config && Sch.config.locale || 'Sch.locale.En' ],
    //
    // But, SenchaCMD does not support dynamic expressions for `requires`
    // Falling back to requiring English locale - that will cause English locale to always be included in the build
    // (even if user has specified another locale in other `requires`), but thats better than requiring users
    // to always specify and load the locale they need explicitly
    requires            : [ 'Sch.locale.En' ],

    legacyMode          : false,

    activeLocaleId      : '',

    /**
     * @cfg {Object} l10n Container of locales for the class.
     */
    l10n                : null,

    isLocaleApplied     : function () {
        var activeLocaleId = (this.singleton && this.activeLocaleId) || this.self.activeLocaleId;

        if (!activeLocaleId) return false;

        for (var ns in Sch.locale.Active) {
            if (activeLocaleId === Sch.locale.Active[ns].self.getName()) return true;
        }

        return false;
    },

    applyLocale         : function () {
        // loop over activated locale classes and call apply() method of each one
        for (var ns in Sch.locale.Active) {
            Sch.locale.Active[ns].apply(this.singleton ? this : this.self.getName());
        }
    },

    /**
     * This is shorthand reference to {@link #localize}. Retrieves translation of a phrase.
     * @param {String} id Identifier of phrase.
     * @param {String} [legacyHolderProp=this.legacyHolderProp] Legacy class property name containing locales.
     * @param {Boolean} [skipLocalizedCheck=false] Do not localize class if it's not localized yet.
     * @return {String} Translation of specified phrase.
     */
    L                   : function () {
        return this.localize.apply(this, arguments);
    },

    /**
     * Retrieves translation of a phrase. There is a shorthand {@link #L} for this method.
     * @param {String} id Identifier of phrase.
     * @param {String} [legacyHolderProp=this.legacyHolderProp] Legacy class property name containing locales.
     * @param {Boolean} [skipLocalizedCheck=false] Do not localize class if it's not localized yet.
     * @return {String} Translation of specified phrase.
     */
    localize            : function (id, legacyHolderProp, skipLocalizedCheck) {
        // if not localized yet let's do it
        if (!this.isLocaleApplied() && !skipLocalizedCheck) {
            this.applyLocale();
        }

        // `l10n` instance property has highest priority
        if (this.hasOwnProperty('l10n') && this.l10n.hasOwnProperty(id) && 'function' != typeof this.l10n[id]) return this.l10n[id];

        var clsProto    = this.self && this.self.prototype;

        // if there were old properties for localization on this class
        if (this.legacyMode) {
            // if they were kept under some property
            var prop        = legacyHolderProp || this.legacyHolderProp;

            // check object instance first
            var instHolder  = prop ? this[prop] : this;
            if (instHolder && instHolder.hasOwnProperty(id) && 'function' != typeof instHolder[id]) return instHolder[id];

            if (clsProto) {
                // then let's check class definition
                var clsHolder = prop ? clsProto[prop] : clsProto;
                if (clsHolder && clsHolder.hasOwnProperty(id) && 'function' != typeof clsHolder[id]) return clsHolder[id];
            }
        }

        // let's try to get locale from class prototype `l10n` property
        var result      = clsProto.l10n && clsProto.l10n[id];

        // if no transalation found
        if (result === null || result === undefined) {

            var superClass  = clsProto && clsProto.superclass;
            // if parent class also has localize() method
            if (superClass && superClass.localize) {
                // try to get phrase translation from parent class
                result = superClass.localize(id, legacyHolderProp, skipLocalizedCheck);
            }

            if (result === null || result === undefined) throw 'Cannot find locale: '+id+' ['+this.self.getName()+']';
        }

        return result;
    }
});
