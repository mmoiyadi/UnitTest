/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.crud.transport.Ajax
@abstract
Implements data transferring functional that can be used for {@link Sch.crud.AbstractManager} super classing.
Uses AJAX as a transport system.

    // let's make new CrudManager using AJAX as a transport system and XML for encoding
    Ext.define('MyCrudManager', {
        extend  : 'Sch.crud.AbstractManager',

        mixins  : ['Sch.crud.encoder.Xml', 'Sch.crud.transport.Ajax']
    });

*/
Ext.define('Sch.crud.transport.Ajax', {

    /**
     * @cfg {Object} transport
     * Configuration of the AJAX requests used to communicate with a server-side.
     * An object where you can set the following possible properties:
     * @cfg {Object} transport.load Load requests configuration:
     * @cfg {String} transport.load.url URL to request for data loading.
     * @cfg {String} [transport.load.method='POST'] HTTP method to be used for load requests.
     * @cfg {String} [transport.load.paramName] Name of parameter in which a packet will be transfered. If not specified then a packet will be transfered in a request body (default).
     * @cfg {Object} [transport.load.params] Extra load request params if needed.
     * @cfg {Object} [transport.load.requestConfig] Ext.Ajax.request config. Can be used instead of above `url`, `method`, `params`:
     *
     *      transport   : {
     *          load    : {
     *              requestConfig : {
     *                  url             : 'http://some-url',
     *                  method          : 'GET',
     *                  // get rid of cache-buster parameter
     *                  disableCaching  : false,
     *                  // extra request parameters
     *                  params          : {
     *                      foo         : 'bar'
     *                  },
     *                  // custom request headers
     *                  headers         : {
     *                      ...
     *                  }
     *              }
     *          }
     *      }
     *
     * @cfg {Object} transport.sync Sync requests configuration:
     * @cfg {String} transport.sync.url URL to request for data persisting.
     * @cfg {String} [transport.sync.method='POST'] HTTP method to be used for sync requests.
     * @cfg {String} [transport.sync.paramName] Name of parameter in which a packet will be transfered. If not specified then a packet will be transfered in a request body (default).
     * @cfg {Object} [transport.sync.params] Extra sync request params if needed.
     * @cfg {Object} [transport.sync.requestConfig] Ext.Ajax.request config. Can be used instead of above `url`, `method`, `params`:
     *
     *      transport   : {
     *          sync    : {
     *              requestConfig : {
     *                  url             : 'http://some-url',
     *                  method          : 'GET',
     *                  // get rid of cache-buster parameter
     *                  disableCaching  : false,
     *                  // extra request parameters
     *                  params          : {
     *                      foo         : 'bar'
     *                  },
     *                  // custom request headers
     *                  headers         : {
     *                      ...
     *                  }
     *              }
     *          }
     *      }
     */

    defaultMethod   : {
        load    : 'GET',
        sync    : 'POST'
    },

    /**
     * Cancels sent request.
     * @param {Object} request The descriptor of request to be canceled. The _request descriptor_ is a value returned by corresponding {@link #sendRequest} call.
     */
    cancelRequest : function (request) {
        Ext.Ajax.abort(request);
    },

    /**
     * Sends request to the server.
     * @param {Object} request The request configuration object having following properties:
     * @param {String} request.data The encoded request.
     * @param {String} request.type The request type. Either `load` or `sync`.
     * @param {Function} request.success A function to be started on successful request transferring.
     * @param {Function} request.failure A function to be started on request transfer failure.
     * @param {Object} request.scope A scope for the above `success` and `failure` functions.
     * @return {Object} The request descriptor.
     */
    sendRequest : function (config) {
        var pack        = config.data,
            packCfg     = this.transport[config.type],
            paramName   = packCfg.paramName,
            params      = Ext.apply({}, packCfg && packCfg.params),
            method      = packCfg.method || this.defaultMethod[config.type];

        var requestConfig   = Ext.apply({
            url         : packCfg.url,
            method      : method,
            params      : params,
            failure     : config.failure,
            success     : function (response, options) {
                if (config.success) {
                    config.success.call(config.scope || this, response.responseXml || response.responseText);
                }
            },
            scope       : config.scope
        }, packCfg.requestConfig);

        // if no param name specified then we'll transfer package in the request body
        if (!paramName) {
            if (this.format === 'xml') {
                Ext.apply(requestConfig, { xmlData : pack });
            } else {
                Ext.apply(requestConfig, { jsonData : pack });
            }
        // ..otherwise we use parameter
        } else {
            requestConfig.params            = requestConfig.params || {};
            requestConfig.params[paramName] = pack;
        }

        /**
         * @event beforesend
         * Fires before a request is sent to the server.

        crudManager.on('beforesend', function (crud, params, requestType) {
            // let's set "sync" request parameters
            if (requestType == 'sync') {
                // dynamically depending on "flag" value
                if (flag) {
                    params.foo = 'bar';
                } else {
                    params.foo = 'smth';
                }
            }
        });

         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         * @param {Object} params Request params
         * @param {String} requestType Request type (`load`/`sync`)
         * @param {Object} requestConfig Configuration object for Ext.Ajax.request call
         */
        this.fireEvent('beforesend', this, params, config.type, requestConfig);

        return Ext.Ajax.request(requestConfig);
    }

});
