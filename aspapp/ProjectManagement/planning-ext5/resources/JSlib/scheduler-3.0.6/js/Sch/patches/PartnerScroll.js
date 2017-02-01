/*

Ext Scheduler 3.0.6
Copyright(c) 2009-2015 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
//https://www.sencha.com/forum/showthread.php?299097-5.1.0-Chrome-Mac-Scrolling-stutters-in-locked-grid
Ext.define('Sch.patches.PartnerScroll', {
    extend   : 'Sch.util.Patch',

    requires   : ['Ext.scroll.Scroller'],

    minVersion : '5.1.0',

    maxVersion : '5.1.1',

    applyFn : function () {
        // https://www.assembla.com/spaces/bryntum/tickets/2114
        // This patch fixes not only scroll in mac but also in FF for Ext 5.1.0
        // Also in Ext 5.1.1 same issue is not reproducible for FF
        if (Ext.isMac || Ext.isGecko) {
            Ext.ClassManager.get('Ext.scroll.Scroller').override({

                constructor: function (config) {
                    var me = this;

                    me.callParent([config]);

                    this.doNotCall = {};
                },

                privates: {

                    onPartnerScrollEnd: function () {
                        this.doNotCall = {};
                    },

                    invokePartners: function (method, x, y) {
                        var partners = this._partners,
                            partner,
                            id;

                        if (!this.suspendSync) {
                            for (id in partners) {
                                partner = partners[id];
                                //do not bounce back
                                if (!partner.suspendSync && !this.doNotCall[partner.scroller.id]) {
                                    partner.scroller[method](this, x, y);
                                }
                                else {
                                    //needed to sync columnlines
                                    if (!partner.scroller.component.isTableView) {
                                        delete this.doNotCall[partner.scroller.id];
                                    }
                                }
                            }
                        }
                    },

                    onPartnerScroll: function (partner, x, y) {

                        var axis = partner._partners[this.getId()].axis;

                        if (axis) {
                            if (axis === 'x') {
                                y = null;
                            } else if (axis === 'y') {
                                x = null;
                            }
                        }

                        //do not bounce back on partner
                        this.doNotCall[partner.id] = true;

                        this.doScrollTo(x, y, null, false);

                    }
                }
            });
        }
    }
});
