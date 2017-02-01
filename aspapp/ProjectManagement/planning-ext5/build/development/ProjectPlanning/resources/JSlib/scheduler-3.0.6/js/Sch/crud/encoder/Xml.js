/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.crud.encoder.Xml
@abstract
Implements data encoding functional that should be mixed to a {@link Sch.crud.AbstractManager} sub-class.
Uses _XML_ as an encoding system.

    // let's make new CrudManager using AJAX as a transport system and XML for encoding
    Ext.define('MyCrudManager', {
        extend  : 'Sch.crud.AbstractManager',

        mixins  : ['Sch.crud.encoder.Xml', 'Sch.crud.transport.Ajax']
    });

# Request structure

Load request example:

    <load requestId="123890">
        <store id="store1" page="1" pageSize="10"/>
        <store id="store2"/>
        <store id="store3"/>
    </load>

Sync request:

    <sync requestId="123890" revision="123">
        <store id="store1">
            <added>
                <record>
                    <field id="$PhantomId">q1w2e3r4t5</field>
                    <field id="SomeField">smth</field>
                    ...
                </record>
                ...
            </added>
            <updated>
                <record>
                    <field id="Id">123</field>
                    <field id="SomeField">new value</field>
                    ...
                </record>
                ...
            </updated>
            <removed>
                <record>
                    <field id="Id">345</field>
                </record>
                ...
            </removed>
        </store>

        <store id="store2">
            <added>...</added>
            <updated>...</updated>
            <removed>...</removed>
        </store>
    </sync>

# Response structure

Load response example:

    <data requestId="123890" revision="123" success="true">

        <store id="store1">
            <rows total="5">
                <record>
                    <field id="Id">9000</field>
                    <field id="SomeField">xxxx</field>
                    ...
                </record>
                <record>
                    <field id="Id">123</field>
                    <field id="SomeField">yyyy</field>
                    ...
                </record>
            </rows>
        </store>

        <store id="store2">
            <rows total="2">
                <record>
                    <field id="Id">1</field>
                    <field id="Field1">aaa</field>
                    ...
                </record>
                <record>
                    <field id="Id">2</field>
                    <field id="Field1">bbb</field>
                    ...
                </record>
            </rows>
        </store>

        <store id="store3">
            <rows total="2">
                <record>
                    <field id="Id">1</field>
                    <field id="Field2">aaa</field>
                    ...
                </record>
                <record>
                    <field id="Id">2</field>
                    <field id="Field2">bbb</field>
                    ...
                </record>
            </rows>
        </store>
    </data>

Sync response:

    <data requestId="123890" success="true" revision="124">
        <store id="store1">
            <rows>
                <record>
                    <field id="$PhantomId">q1w2e3r4t5</field>
                    <field id="Id">9000</field>
                </record>
                <record>
                    <field id="Id">123</field>
                    <field id="SomeField2">2013-08-01</field>
                </record>
            </rows>
            <removed>
                <record>
                    <field id="Id">345</field>
                </record>
                ...
            </removed>
        </store>

        <store id="store2">
            <rows>...</rows>
            <removed>...</removed>
        </store>
    </data>

# Error response

    <data requestId="123890" success="true" code="13">
        <message>Error description goes here</message>
    </data>

*/
Ext.define("Sch.crud.encoder.Xml", {

    requires        : ['Ext.XTemplate'],

    format          : 'xml',

    stringReplaces  : [
        [ /&/g, '&amp;' ],
        [ /</g, '&lt;' ],
        [ />/g, '&gt;' ],
        [ /"/g, '&quot;' ]
    ],

    // Translates a string characters to XML safe ones
    encodeString : function (text) {
        if (!text) return text;

        var result      = text.toString(),
            replaces    = this.stringReplaces;
        for (var i = 0, l = replaces.length; i < l; i++) {
            result  = result.replace(replaces[i][0], replaces[i][1]);
        }

        return result;
    },

    encodeRecords : function (records) {
        var result = '';
        for (var i = 0, l = records.length; i < l; i++) {
            result += this.encodeRecord(records[i]);
        }
        return result;
    },

    encodeRecord : function (record) {
        var result = '<record>';

        for (var i in record) {
            var field   = record[i];

            result  += '<field id="' + this.encodeString(i) + '">' +
                (field && field.$store ? this.encodeStoreChanges({ storeId : i }, field) : this.encodeString(field)) +
                '</field>';
        }

        result += '</record>';

        return result;
    },

    encodeStoreChanges : function (store, changes) {
        var result = '<store id="' + this.encodeString(store.storeId) + '">';

        if (changes.added) {
            result += '<added>' + this.encodeRecords(changes.added) + '</added>';
        }
        if (changes.updated) {
            result += '<updated>' + this.encodeRecords(changes.updated) + '</updated>';
        }
        if (changes.removed) {
            result += '<removed>' + this.encodeRecords(changes.removed) + '</removed>';
        }

        result += '</store>';

        return result;
    },

    /**
     * Encodes an request object to _XML_ encoded string. The formats of requests are displayed in an intro.
     * @param {Object} request The request to encode.
     */
    encode : function (packet) {
        var result, i, l, store;

        switch (packet.type) {
            case 'load':
                result = '<load requestId="' + this.encodeString(packet.requestId) + '">';

                for (i = 0, l = packet.stores.length; i < l; i ++) {
                    store   = packet.stores[i];

                    if (typeof store === 'string') {
                        result += '<store id="' + this.encodeString(store) + '"/>';
                    } else {
                        result += '<store id="' + this.encodeString(store.storeId) + '" page="' +
                            this.encodeString(store.page) + '" pageSize="' + this.encodeString(store.pageSize) + '"/>';
                    }
                }

                result += '</load>';

                return result;

            case 'sync':
                result = '<sync requestId="' + this.encodeString(packet.requestId) + '" revision="' + this.encodeString(packet.revision) + '">';
                for (i in packet) {
                    if (packet.hasOwnProperty(i)) {
                        store   = this.getStore(i);

                        if (store) {
                            result += this.encodeStoreChanges(store, packet[i]);
                        }
                    }
                }
                result += '</sync>';
                break;
        }

        return result;
    },


    stringToXML : function (text) {
        if (!text) return;

        var document;
        
        /*global DOMParser: false, ActiveXObject: false */

        if (window.DOMParser) {
            document    = (new DOMParser()).parseFromString(text, 'text/xml');
        } else if (window.ActiveXObject) {
            document        = new ActiveXObject('Microsoft.XMLDOM');
            document.async  = false;
            document.loadXML(text);
        }

        return document;
    },


    decodeRecords : function (rows) {
        var result   = [];

        for (var j = 0, m = rows.length; j < m; j++) {
            result.push( this.decodeRecord(rows[j]) );
        }

        return result;
    },


    decodeRecord : function (node) {
        var fields  = node.childNodes,
            result  = {},
            value;

        for (var i = 0, l = fields.length; i < l; i++) {
            var field   = fields[i];

            if (field.nodeName == 'field') {

                value       = '';

                if (field.firstChild) {
                    var store   = this.getElementByTagName(field, 'store');

                    value       = store ? this.decodeStore(store) : field.firstChild.nodeValue;
                }

                result[field.getAttribute('id')]    = value;
            }
        }

        return result;
    },

    // search specified nodes only in a first level of children
    getElementsByTagName : function (node, name) {
        var children    = node.childNodes,
            records     = [];

        for (var i = 0, l = children.length; i < l; i++) {
            if (children[i].nodeName == name) records.push(children[i]);
        }

        return records;
    },

    getElementByTagName : function (node, name) {
        var children    = node.childNodes;

        for (var i = 0, l = children.length; i < l; i++) {
            if (children[i].nodeName == name) return children[i];
        }
    },

    decodeStore : function (store) {
        var data    = {},
            rows    = this.getElementsByTagName(store, 'rows');

        if (rows.length) {
            data.rows   = this.decodeRecords(this.getElementsByTagName(rows[0], 'record'));

            var total   = parseInt(rows[0].getAttribute('total'), 10);
            if (isNaN(total) || total < data.rows.length) total = data.rows.length;

            data.total  = total;
        }

        var removed = this.getElementByTagName(store, 'removed');
        if (removed) {
            data.removed    = this.decodeRecords(this.getElementsByTagName(removed, 'record'));
        }

        return data;
    },

    /**
     * Decodes (parses) a _XML_ response string to an object. The formats of processable server responses are displayed in an intro.
     * @param {Object} response The response to decode.
     */
    decode : function (packet) {
        var xml = typeof packet == 'string' ? this.stringToXML(packet) : packet;

        if (!xml) return;

        var result  = {},
            root    = xml.documentElement,
            stores  = root.getElementsByTagName('store'),
            store, storeId;

        result.requestId    = root.getAttribute('requestId');
        result.revision     = root.getAttribute('revision');
        result.success      = root.getAttribute('success') || 'false';
        result.success      = result.success.toLowerCase() == 'true';

        if (!result.success) {
            // extract error code
            result.code     = root.getAttribute('code');

            var message     = root.getElementsByTagName('message')[0];
            result.message  = message && message.firstChild && message.firstChild.nodeValue;
        }

        for (var i = 0, l = stores.length; i < l; i++) {
            store   = stores[i];
            storeId = store.getAttribute('id');

            if (this.getStore(storeId)) {
                result[storeId]     = this.decodeStore(store);
            }
        }

        return result;
    }

});
