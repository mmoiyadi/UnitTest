Ext.define("ProjectPlanning.model.FullKitTask",{extend:"Ext.data.Model",fields:[{name:"TaskUID",type:"string"},{name:"TaskName",type:"string"},{name:"FKDate",type:"string"},{name:"FKPullInDuration",type:"string"},{name:"FKSuggestedDate",type:"string"}],createFKRecord:function(a){this.set("TaskUID",a.TaskUID);this.set("TaskName",a.TaskName);this.set("FKDate",a.FKDate);this.set("FKPullInDuration",a.FKPullInDuration);this.set("FKSuggestedDate",a.FKSuggestedDate);return this}});