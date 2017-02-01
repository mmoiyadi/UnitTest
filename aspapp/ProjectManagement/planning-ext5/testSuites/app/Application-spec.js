describe("PlanningWeb Application Test", function () {
	//var scope, wipSettingsController, createController,$httpBackend;
	
	beforeEach(function () {
		console.log("testing beforeEach...");

		// setup common routines here
	});
	
	
	it("test Ext JS",function () {
	  	var testOne = 1;
	  	expect(testOne).toEqual(1);
	  	expect(Ext).toBeDefined();
	});
	
});