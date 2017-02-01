/*
	Milestone Model
*/
Ext.define('ProjectPlanning.model.Milestone', {
    extend: 'Ext.data.Model',
    fields: [
	    {name:'uid', type:'string'},
        {name: 'name', type: 'string'},
        {name: 'type', type: 'string'},
        {name: 'priority', type:'int', defaultValue:999},
        {name:'scopeItemId', type:'string'},
        {name:'scopeItemName',type:'string'},
        {name:'phaseId', type:'string'},
        {name:'phaseName',type:'string'},
        {name:'startDate', type:'date'},
        {name:'endDate', type:'date'},
        { name: 'date1', type: 'date' },
        { name: 'bufferSize', type: 'string' },
        {name: 'projectedDate', type: 'string', sortType:function(value){
            return new Date(value);
        }},
        {name:'status', type: 'string' },
        {name: 'milestoneColor' },
        {name:'bufferConsumption'},
        {name:'longestChainComplete'}
    ],
    createMSNode:function(ms){
    	this.set('uid',ms.uid);
    	this.set('name',ms.name);
    	this.set('type',ms.taskType);
    	this.set('startDate',ms.startDate);
    	this.set('endDate', ms.endDate);
    	this.set('date1', ms.date1);
    	this.set('bufferSize', ms.bufferSize);
    	this.set('projectedDate', ms.projectedDate);
    	this.set('percentBufferConsumption', ms.percentBufferConsumption);
    	this.set('percentChainComplete', ms.percentChainComplete);
    	this.set('milestoneColor', ms.milestoneColor);
        this.set('status',ms.status);
    	return this;
    }
});