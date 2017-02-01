describe("Links View Test", function () {
	//var scope, wipSettingsController, createController,$httpBackend;
	
	beforeEach(function () {
		var points = [];
		globalCount = 0;
		var openObjects = [];

		element =  {
            
        };

		element.elts = [];
		element.eq = function(i)
		{
    		return this.elts[i];
		};
		

		linksview = new stl.view.Links({
			visible:false,
			container: container,
		});
		element.elts = elts;
		element.length = element.elts.length;
		linksview.$elts = element;
	});
	
	
	it("Test getInterestingPoints of linksview with sample data",function () {
	  	var testOne = 1;
	  	expect(testOne).toEqual(1);
	  	expect(Ext).toBeDefined();
	  	linksview.getInterestingPoints();
	  	expect(linksview.elementPositions.length).toEqual(10);
	  	expect(linksview.elementPositions[0]).toEqual({left:10, top:6, right:170,bottom:38});
	  	expect(linksview.elementPositions[1]).toEqual({left:210, top:6, right:370,bottom:38});
	  	expect(linksview.elementPositions[2]).toEqual({left:431, top:6, right:591,bottom:38});
	  	expect(linksview.elementPositions[3]).toEqual({left:652, top:6, right:678,bottom:41});
	  	expect(linksview.elementPositions[4]).toEqual({left:728, top:6, right:888,bottom:38});
	  	expect(linksview.elementPositions[5]).toEqual({left:928, top:6, right:954,bottom:41});
	  	expect(linksview.elementPositions[6]).toEqual({left:10, top:54, right:170,bottom:86});
	  	expect(linksview.elementPositions[7]).toEqual({left:210, top:54, right:370,bottom:86});
	  	expect(linksview.elementPositions[8]).toEqual({left:652, top:54, right:812,bottom:86});
	  	expect(linksview.elementPositions[9]).toEqual({left:852, top:54, right:878,bottom:89});

	  	expect(linksview.elementPositionsByTop[6].length).toEqual(6);
	  	expect(linksview.elementPositionsByTop[54].length).toEqual(4);

	  	expect(linksview.elementPositionsByLeft[10].length).toEqual(2);
	  	expect(linksview.elementPositionsByLeft[210].length).toEqual(2);
	  	expect(linksview.elementPositionsByLeft[431].length).toEqual(1);
	  	expect(linksview.elementPositionsByLeft[652].length).toEqual(2);
	  	expect(linksview.elementPositionsByLeft[728].length).toEqual(1);
	  	expect(linksview.elementPositionsByLeft[852].length).toEqual(1);
	  	expect(linksview.elementPositionsByLeft[928].length).toEqual(1);

	  	expect(linksview.interestingPoints.length).toEqual(55);

	  	expect(linksview.interestingPointsByX[5].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[175].length).toEqual(4);
	  	expect(linksview.interestingPointsByX[205].length).toEqual(6);
	  	expect(linksview.interestingPointsByX[375].length).toEqual(6);
	  	expect(linksview.interestingPointsByX[426].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[596].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[647].length).toEqual(6);
	  	expect(linksview.interestingPointsByX[683].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[723].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[817].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[847].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[883].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[893].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[923].length).toEqual(3);
	  	expect(linksview.interestingPointsByX[959].length).toEqual(3);

		expect(linksview.interestingPointsByY[1].length).toEqual(10);
		expect(linksview.interestingPointsByY[22].length).toEqual(8);
		expect(linksview.interestingPointsByY[43].length).toEqual(6);
		expect(linksview.interestingPointsByY[46].length).toEqual(4);
		expect(linksview.interestingPointsByY[49].length).toEqual(8);
		expect(linksview.interestingPointsByY[70].length).toEqual(6);
		expect(linksview.interestingPointsByY[91].length).toEqual(5);
		expect(linksview.interestingPointsByY[94].length).toEqual(2);	  	
	});

/**********  populateConnectedPointsOnX   ************/
	// 1  |2|  3  4
	// Test with 4 points and 1 open object covering 2 -> 2 should be blocked and 3,4 should be connected	
	it("Test populateConnectedPointsOnX of linksview with sample data 1",function () {
		points = points1;
		openObjects = openObjects1;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts).toEqual([]);
		expect(points[1].blocked).toEqual(true);
		expect(points[1].connectedPts).toEqual([]);
		expect(points[2].blocked).toEqual(false);
		expect(points[2].connectedPts.length).toEqual(1);
		expect(points[2].connectedPts[0].x).toEqual(4);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(1);
		expect(points[3].connectedPts[0].x).toEqual(3);
	});

	// 1  |2 3|  4
	// Test with  4 points and 1 open object covering 2 and 3 -> 2, 3 should be blocked and all should be disconnected
	it("Test populateConnectedPointsOnX of linksview with sample data 2",function () {
		points = points2;
		openObjects = openObjects2;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts).toEqual([]);
		expect(points[1].blocked).toEqual(true);
		expect(points[1].connectedPts).toEqual([]);
		expect(points[2].blocked).toEqual(true);
		expect(points[2].connectedPts).toEqual([]);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts).toEqual([]);

	});

	// 1  2  3  4
	// Test with 4 points and zero open object -> all points should be connected and non-blocked
	it("Test populateConnectedPointsOnX of linksview with sample data 3",function () {
		points = points3;
		openObjects = openObjects3;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts.length).toEqual(3);
		expect(points[1].blocked).toEqual(false);
		expect(points[1].connectedPts.length).toEqual(3);
		expect(points[2].blocked).toEqual(false);
		expect(points[2].connectedPts.length).toEqual(3);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(3);

	});

	// 1  2  |3|  4  5
	// Test with 5 points and 1 open object covering 3 -> 3 should be blocked and 1,2 and 4,5 should be connected
	it("Test populateConnectedPointsOnX of linksview with sample data 4",function () {
		points = points4;
		openObjects = openObjects4;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts.length).toEqual(1);
		expect(points[1].blocked).toEqual(false);
		expect(points[1].connectedPts.length).toEqual(1);
		expect(points[2].blocked).toEqual(true);
		expect(points[2].connectedPts.length).toEqual(0);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(1);
		expect(points[4].blocked).toEqual(false);
		expect(points[4].connectedPts.length).toEqual(1);

	});

	// 1  2  |3  4|  5  6  |7| 8
	// Test with 8 points and 2 open object covering 3,4 and 7 respectively -> 3,4,7 should be blocked and 1,2 and 5,6 should be connected
	it("Test populateConnectedPointsOnX of linksview with sample data 5",function () {
		points = points5;
		openObjects = openObjects5;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts.length).toEqual(1);
		expect(points[1].blocked).toEqual(false);
		expect(points[1].connectedPts.length).toEqual(1);
		expect(points[2].blocked).toEqual(true);
		expect(points[2].connectedPts.length).toEqual(0);
		expect(points[3].blocked).toEqual(true);
		expect(points[3].connectedPts.length).toEqual(0);
		expect(points[4].blocked).toEqual(false);
		expect(points[4].connectedPts.length).toEqual(1);
		expect(points[5].blocked).toEqual(false);
		expect(points[5].connectedPts.length).toEqual(1);
		expect(points[6].blocked).toEqual(true);
		expect(points[6].connectedPts.length).toEqual(0);
		expect(points[7].blocked).toEqual(false);
		expect(points[7].connectedPts.length).toEqual(0);

	});

	// 1  2  3  |4  5  6|  7  8  9  |10|
	// Test with 10 points and 2 open object covering 4,5,6 and 10 respectively -> 4,5,6,10 should be blocked and 1,2,3 and 7,8,9 should be connected
	it("Test populateConnectedPointsOnX of linksview with sample data 6 in sorted order",function () {
		points = points6;
		openObjects = openObjects6;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);			// 1 - false
		expect(points[0].connectedPts.length).toEqual(2);	// len(1) - 2

		expect(points[1].blocked).toEqual(false);			// 2 - false
		expect(points[1].connectedPts.length).toEqual(2);	// len(2) - 2

		expect(points[2].blocked).toEqual(false);			// 3 - false
		expect(points[2].connectedPts.length).toEqual(2);	// len(3) - 2

		expect(points[3].blocked).toEqual(true);			// 4 - true
		expect(points[3].connectedPts.length).toEqual(0);	// len(4) - 0

		expect(points[4].blocked).toEqual(true);			// 5 - true
		expect(points[4].connectedPts.length).toEqual(0);	// len(5) - 0

		expect(points[5].blocked).toEqual(true);			// 6 - true
		expect(points[5].connectedPts.length).toEqual(0);	// len(6) - 0

		expect(points[6].blocked).toEqual(false);			// 7 - false
		expect(points[6].connectedPts.length).toEqual(2);	// len(7) - 2

		expect(points[7].blocked).toEqual(false);			// 8 - false
		expect(points[7].connectedPts.length).toEqual(2);	// len(8) - 2

		expect(points[8].blocked).toEqual(false);			// 9 - false
		expect(points[8].connectedPts.length).toEqual(2);	// len(9) - 2

		expect(points[9].blocked).toEqual(true);			// 10 - true
		expect(points[9].connectedPts.length).toEqual(0);	// len(10) - 0
	});

	// 1  2  3  |4  5  6|  7  8  9  |10|
	// Test with 10 points and 2 open object covering 4,5,6 and 10 respectively -> 4,5,6,10 should be blocked and 1,2,3 and 7,8,9 should be connected

	/*it("Test populateConnectedPointsOnX of linksview with sample data 6 in random order",function () {
		points = points7;
		openObjects = openObjects6;
		linksview.populateConnectedPointsOnXOptimized(points,openObjects);
		
		expect(points[0].blocked).toEqual(true);			// 5 - true
		expect(points[0].connectedPts.length).toEqual(0);	// len(5) - 0

		expect(points[1].blocked).toEqual(false);			// 2 - false
		expect(points[1].connectedPts.length).toEqual(2);	// len(2) - 2

		expect(points[2].blocked).toEqual(false);			// 3 - false
		expect(points[2].connectedPts.length).toEqual(2);	// len(3) - 2

		expect(points[3].blocked).toEqual(false);			// 9 - false
		expect(points[3].connectedPts.length).toEqual(2);	// len(9) - 2

		expect(points[4].blocked).toEqual(true);			// 4 - true
		expect(points[4].connectedPts.length).toEqual(0);	// len(4) - 0

		expect(points[5].blocked).toEqual(true);			// 6 - true
		expect(points[5].connectedPts.length).toEqual(0);	// len(6) - 0

		expect(points[6].blocked).toEqual(false);			// 7 - false
		expect(points[6].connectedPts.length).toEqual(2);	// len(7) - 2

		expect(points[7].blocked).toEqual(false);			// 1 - false
		expect(points[7].connectedPts.length).toEqual(2);	// len(1) - 2

		expect(points[8].blocked).toEqual(false);			// 8 - false
		expect(points[8].connectedPts.length).toEqual(2);	// len(8) - 2

		expect(points[9].blocked).toEqual(true);			// 10 - true
		expect(points[9].connectedPts.length).toEqual(0);	// len(10) - 0
		
	});
	*/
/**********  populateConnectedPointsOnY   ************/
	// 1  |2|  3  4
	// Test with 4 points and 1 open object covering 2 -> 2 should be blocked and 3,4 should be connected	
	it("Test populateConnectedPointsOnY of linksview with sample data 1",function () {
		points = pointsY1;
		openObjects = openObjectsY1;
		linksview.populateConnectedPointsOnYOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts).toEqual([]);
		expect(points[1].blocked).toEqual(true);
		expect(points[1].connectedPts).toEqual([]);
		expect(points[2].blocked).toEqual(false);
		expect(points[2].connectedPts.length).toEqual(1);
		expect(points[2].connectedPts[0].y).toEqual(4);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(1);
		expect(points[3].connectedPts[0].y).toEqual(3);
	});

	// 1  |2 3|  4
	// Test with  4 points and 1 open object covering 2 and 3 -> 2, 3 should be blocked and all should be disconnected
	it("Test populateConnectedPointsOnY of linksview with sample data 2",function () {
		points = pointsY2;
		openObjects = openObjectsY2;
		linksview.populateConnectedPointsOnYOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts).toEqual([]);
		expect(points[1].blocked).toEqual(true);
		expect(points[1].connectedPts).toEqual([]);
		expect(points[2].blocked).toEqual(true);
		expect(points[2].connectedPts).toEqual([]);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts).toEqual([]);

	});

	// 1  2  3  4
	// Test with 4 points and zero open object -> all points should be connected and non-blocked
	it("Test populateConnectedPointsOnY of linksview with sample data 3",function () {
		points = pointsY3;
		openObjects = openObjectsY3;
		linksview.populateConnectedPointsOnYOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts.length).toEqual(3);
		expect(points[1].blocked).toEqual(false);
		expect(points[1].connectedPts.length).toEqual(3);
		expect(points[2].blocked).toEqual(false);
		expect(points[2].connectedPts.length).toEqual(3);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(3);

	});

	// 1  2  |3|  4  5
	// Test with 5 points and 1 open object covering 3 -> 3 should be blocked and 1,2 and 4,5 should be connected
	it("Test populateConnectedPointsOnY of linksview with sample data 4",function () {
		points = pointsY4;
		openObjects = openObjectsY4;
		linksview.populateConnectedPointsOnYOptimized(points,openObjects);
		expect(points[0].blocked).toEqual(false);
		expect(points[0].connectedPts.length).toEqual(1);
		expect(points[1].blocked).toEqual(false);
		expect(points[1].connectedPts.length).toEqual(1);
		expect(points[2].blocked).toEqual(true);
		expect(points[2].connectedPts.length).toEqual(0);
		expect(points[3].blocked).toEqual(false);
		expect(points[3].connectedPts.length).toEqual(1);
		expect(points[4].blocked).toEqual(false);
		expect(points[4].connectedPts.length).toEqual(1);

	});
});