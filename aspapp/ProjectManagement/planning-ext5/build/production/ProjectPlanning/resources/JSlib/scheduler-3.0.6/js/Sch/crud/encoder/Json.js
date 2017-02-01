/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.crud.encoder.Json
@abstract
Implements data encoding functional that should be mixed to a {@link Sch.crud.AbstractManager} sub-class.
Uses _JSON_ as an encoding system.

    // let's make new CrudManager using AJAX as a transport system and JSON for encoding
    Ext.define('MyCrudManager', {
        extend  : 'Sch.crud.AbstractManager',

        mixins  : ['Sch.crud.encoder.Json', 'Sch.crud.transport.Ajax']
    });

*/
Ext.define('Sch.crud.encoder.Json', {

    format  : 'json',

    /**
     * Encodes an request object to _JSON_ encoded string.
     * @param {Object} request The request to encode.
     */
    encode : function (request) {
        return Ext.JSON.encode(request);
    },

    /**
     * Decodes (parses) a _JSON_ response string to an object.
     * @param {Object} response The response to decode.
     */
    decode : function (response) {
        if (typeof response == 'object') return response;

        return Ext.JSON.decode(response, true);
    }

});
