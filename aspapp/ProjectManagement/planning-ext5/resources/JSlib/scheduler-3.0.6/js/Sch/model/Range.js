/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

 @class Sch.model.Range
 @extends Sch.model.Customizable

 This class represent a simple date range. It is being used in various subclasses and plugins which operate on date ranges.

 Its a subclass of the {@link Sch.model.Customizable}, which is in turn subclass of {@link Ext.data.Model}.
 Please refer to documentation of those classes to become familar with the base interface of this class.

 A range has the following fields:

 - `StartDate`   - start date of the task in the ISO 8601 format
 - `EndDate`     - end date of the task in the ISO 8601 format (not inclusive)
 - `Name`        - an optional name of the range
 - `Cls`         - an optional CSS class to be associated with the range.

 The name of any field can be customized in the subclass. Please refer to {@link Sch.model.Customizable} for details.

 */

if (!Ext.ClassManager.get("Sch.model.Range")) {
    Ext.define('Sch.model.Range', {
        extend : 'Sch.model.Customizable',

        requires : [
            'Sch.util.Date'
        ],

        idProperty : 'Id',

        // For Sencha Touch
        config     : Ext.versions.touch ? { idProperty : 'Id' } : null,

        /**
         * @cfg {String} startDateField The name of the field that defines the range start date. Defaults to "StartDate".
         */
        startDateField : 'StartDate',

        /**
         * @cfg {String} endDateField The name of the field that defines the range end date. Defaults to "EndDate".
         */
        endDateField : 'EndDate',

        /**
         * @cfg {String} nameField The name of the field that defines the range name. Defaults to "Name".
         */
        nameField : 'Name',

        /**
         * @cfg {String} clsField The name of the field that holds the range "class" value (usually corresponds to a CSS class). Defaults to "Cls".
         */
        clsField : 'Cls',

        customizableFields : [
        /**
         * @method getStartDate
         *
         * Returns the range start date
         *
         * @return {Date} The start date
         */
            { name : 'StartDate', type : 'date', dateFormat : 'c' },

        /**
         * @method getEndDate
         *
         * Returns the range end date
         *
         * @return {Date} The end date
         */
            { name : 'EndDate', type : 'date', dateFormat : 'c' },

        /**
         * @method getCls
         *
         * Gets the "class" of the range
         *
         * @return {String} cls The "class" of the range
         */
        /**
         * @method setCls
         *
         * Sets the "class" of the range
         *
         * @param {String} cls The new class of the range
         */
            {
                name : 'Cls', type : 'string'
            },

        /**
         * @method getName
         *
         * Gets the name of the range
         *
         * @return {String} name The "name" of the range
         */
        /**
         * @method setName
         *
         * Sets the "name" of the range
         *
         * @param {String} name The new name of the range
         */
            {
                name : 'Name', type : 'string'
            }
        ],

        /**
         * @method setStartDate
         *
         * Sets the range start date
         *
         * @param {Date} date The new start date
         * @param {Boolean} keepDuration Pass `true` to keep the duration of the task ("move" the event), `false` to change the duration ("resize" the event).
         * Defaults to `false`
         */
        setStartDate : function (date, keepDuration) {
            var endDate = this.getEndDate();
            var oldStart = this.getStartDate();

            this.set(this.startDateField, date);

            if (keepDuration === true && endDate && oldStart) {
                this.setEndDate(Sch.util.Date.add(date, Sch.util.Date.MILLI, endDate - oldStart));
            }
        },

        /**
         * @method setEndDate
         *
         * Sets the range end date
         *
         * @param {Date} date The new end date
         * @param {Boolean} keepDuration Pass `true` to keep the duration of the task ("move" the event), `false` to change the duration ("resize" the event).
         * Defaults to `false`
         */
        setEndDate : function (date, keepDuration) {
            var startDate = this.getStartDate();
            var oldEnd = this.getEndDate();

            this.set(this.endDateField, date);

            if (keepDuration === true && startDate && oldEnd) {
                this.setStartDate(Sch.util.Date.add(date, Sch.util.Date.MILLI, -(oldEnd - startDate)));
            }
        },

        /**
         * Sets the event start and end dates
         *
         * @param {Date} start The new start date
         * @param {Date} end The new end date
         */
        setStartEndDate : function (start, end) {
            this.beginEdit();

            this.set(this.startDateField, start);
            this.set(this.endDateField, end);

            this.endEdit();
        },

        /**
         * Returns an array of dates in this range. If the range starts/ends not at the beginning of day, the whole day will be included.
         * @return {Date[]}
         */
        getDates : function () {
            var dates = [],
                endDate = this.getEndDate();

            for (var date = Ext.Date.clearTime(this.getStartDate(), true); date < endDate; date = Sch.util.Date.add(date, Sch.util.Date.DAY, 1)) {

                dates.push(date);
            }

            return dates;
        },


        /**
         * Iterates over the results from {@link #getDates}
         * @param {Function} func The function to call for each date
         * @param {Object} scope The scope to use for the function call
         */
        forEachDate : function (func, scope) {
            return Ext.each(this.getDates(), func, scope);
        },

        // Simple check if end date is greater than start date
        isValid     : function () {
            var valid = this.callParent(arguments);

            if (valid) {
                var start = this.getStartDate(),
                    end = this.getEndDate();

                valid = !start || !end || (end - start >= 0);
            }

            return valid;
        },

        /**
         * Shift the dates for the date range by the passed amount and unit
         * @param {String} unit The unit to shift by (e.g. range.shift(Sch.util.Date.DAY, 2); ) to bump the range 2 days forward
         * @param {Number} amount The amount to shift
         */
        shift : function (unit, amount) {
            this.setStartEndDate(
                Sch.util.Date.add(this.getStartDate(), unit, amount),
                Sch.util.Date.add(this.getEndDate(), unit, amount)
            );
        },

        fullCopy : function () {
            return this.copy.apply(this, arguments);
        }
    });
}