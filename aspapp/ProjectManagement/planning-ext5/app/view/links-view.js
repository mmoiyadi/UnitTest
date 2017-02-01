/***
 * stl.view.Links
 *
 * Handles drawing and manipulation of lines connecting a set of rectangular
 * elements.
 *
 * IMPORTANT NOTE: This is designed to be agnostic of any underlying data model.  Therefore, all IDs
 * are auto-assigned *element* IDs ("linkable-element-id") which are internal to this library.  
 * The API exposed to the caller deals only in DOM elements.  It is the caller's responsibility 
 * to translate between elements and its own data model.
 */
stl.view.Links = function(cfg) {
	this.REFRESH_DELAY_MS = 100;
	this.ENDPOINT_HIDE_TIMEOUT_MS = 250;
	$.extend(this, cfg);
	this.$container = cfg.container;
	this.$elts = $();
    this.$linkedElts=$();
	this.$endpoints = $();
	this.$obstacleElts = $();
	this.nextLinkID = 0;
	this.minPathDistanceFromObstacle = cfg.minPathDistanceFromObstacle || 5;
	this.connectionsByEltID = {};
	this.endpointsByID = {};
	this.elementsByID = {};
    this.elementsByUniqueIndetifier = {};
	this.connectionPathsByID = {};
	this.linksByID = {};
	this.pendingEndpointHides = {};
	this.horizontalSegmentsInUseByY = {};
	this.verticalSegmentsInUseByX = {};
	this.arrowHeadIDsByColor = {};
    this.visible = (cfg.visible !== false);

    /**
     * spreadLinks: true (default) to shift links apart that share the same path
     */
    this.spreadLinks = (cfg.spreadLinks !== false);
    
	/*if (cfg.elements) {
		this.addElements(cfg.elements)
	}*/
    if (cfg.pathfindingStrategy === "NONE") {
        this.findRoute = this.getStraightLinePath;
    }
    if (this.visible) {
        //this.refresh();
    }

    //A new links view object shall be created each time links are drawn. Initializing few variables.
    
    this.containerPos = this.$container.offset();
    this.containerScrollLeft = this.$container.scrollLeft();
    this.containerScrollTop = this.$container.scrollTop();

	this.ready = true;
    this.bindWindowResizeForLinks();
};

$.extend(stl.view.Links.prototype, (function () {

    var SHARED_POINT_SPREAD_PX = 5,
		LINK_COLOR = "rgb(200,200,200)",
		LINK_HIGHLIGHT_COLOR = "red",
		D3_LINE_FUNCTION = d3.svg.line()
			.x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate("linear"),
    // The minimum "length" of links that will be drawn; any too short will not be drawn
        MIN_LINK_DRAWING_MANHATTAN_DISTANCE = 1,
        MAX_SEARCH_ITERATIONS = 500;
        d3.selection.prototype.moveToFront = function () {
          return this.each(function () {
            if(this.parentNode.lastChild != this)
                this.parentNode.appendChild(this);
          });
        };
    return ({
        addLinkIds:function($elts){
            var me = this;
            $elts.each(function (index, elt) {
                var id = "link-" + String(me.nextLinkID++),
                    $elt = $(elt);
                $elt.data("linkable-element-id", id);
                me.elementsByID[id] = $elt;
                me.elementsByUniqueIndetifier[$elt.attr("id")] = $elt;
            });
            $elts.addClass("linkable-element");
            $elts.off('dragenter').on('dragenter', this.onElementDragEnter.bind(this));
            $elts.off("dragover").on('dragover', this.onElementDragOver.bind(this));
            $elts.off("dragout").on('dragout', this.onElementDragLeave.bind(this));
            $elts.off("drop").on('drop', this.onElementDrop.bind(this));
            $elts.off("mouseenter").on("mouseenter", this.onElementMouseEnter.bind(this));
            $elts.off("mouseleave").on("mouseleave", this.onElementMouseLeave.bind(this));
            this.$linkedElts = this.$linkedElts.add($elts);
            return $elts;
        },
        addElements: function ($elts) {
            var me = this;
            var $el=[]
            $elts.each(function(index, $elt){
                var index = me.$linkedElts.index($elt);
                if(index != -1)
                    $el.push(me.$linkedElts[index]);
                else{
                    $el.push(me.addLinkIds($($elt))[0]);
                }
            });
            this.$elts = this.$elts.add($el);
        },

        clearCollections: function(){
            //this.$container = cfg.container;
            this.$elts = $();
            this.$linkedElts=$();
            this.$endpoints = $();
            this.$obstacleElts = $();
            this.nextLinkID = 0;
            this.connectionsByEltID = {};
            this.endpointsByID = {};
            this.elementsByID = {};
            this.elementsByUniqueIndetifier = {};
            this.connectionPathsByID = {};
            this.linksByID = {};
            this.pendingEndpointHides = {};
            this.horizontalSegmentsInUseByY = {};
            this.verticalSegmentsInUseByX = {};
            this.arrowHeadIDsByColor = {};
            this.elementPositions = [];
            this.elementPositionsByTop = {};
            this.elementPositionsByLeft = {};
            this.interestingPoints = [];
            this.interestingPointsByX = {};
            this.interestingPointsByY = {};
            this.interestingYs = [];
            this.interestingXs = [];
            this.elementTops = [];
            this.elementLefts = [];
            this.pathEndpointsByElementID = {};
            this.existsPointAtXY = {}; // sparse [x][y] matrix
            this.cachedPaths = {};
            this.elements = [];
            this.$container = {};
            this.container = [];
            this.ElementIdMap = {};
            this.deleteCollections();

        },

        deleteCollections: function(){
            //this.$container = cfg.container;
            delete this.$elts;
            delete this.$linkedElts;
            delete this.$endpoints;
            delete this.$obstacleElts;
            delete this.nextLinkID;
            delete this.connectionsByEltID;
            delete this.endpointsByID;
            delete this.elementsByID;
            delete this.elementsByUniqueIndetifier;
            delete this.connectionPathsByID;
            delete this.linksByID;
            delete this.pendingEndpointHides;
            delete this.horizontalSegmentsInUseByY;
            delete this.verticalSegmentsInUseByX;
            delete this.arrowHeadIDsByColor;
            delete this.elementPositions;
            delete this.elementPositionsByTop;
            delete this.elementPositionsByLeft;
            delete this.interestingPoints;
            delete this.interestingPointsByX;
            delete this.interestingPointsByY;
            delete this.interestingYs;
            delete this.interestingXs;
            delete this.elementTops;
            delete this.elementLefts;
            delete this.pathEndpointsByElementID;
            delete this.existsPointAtXY; // sparse [x][y] matrix
            delete this.cachedPaths;
            delete this.elements;
            delete this.$container;
            delete this.container;
            delete this.visible;
            delete this.spreadLinks;
            delete this.ready;
            delete this.ElementIdMap;

        },

        updateContainer: function(container){
            this.$container = container;
        },

        addObstacles: function ($elts) {
            this.$obstacleElts = this.$obstacleElts.add($elts);
            this.refresh();
        },

        updateIdMapForTMElements: function(elem, uid){
            this.ElementIdMap = this.ElementIdMap || {};
            this.ElementIdMap[$(elem).attr("id")] = uid;
        },

        addConnection: function ($fromElt, $toElt, color) {
            // TODO check whether connection exists, abort if so (do nothing)
            var fromEltID = $fromElt.data("linkable-element-id") ? $fromElt.data("linkable-element-id") : $fromElt.parent().data("linkable-element-id"),
				toEltID = $toElt.data("linkable-element-id") ? $toElt.data("linkable-element-id") : $toElt.parent().data("linkable-element-id"),
				srcEltConns = this.getOrCreateConns(fromEltID),
				targetEltConns = this.getOrCreateConns(toEltID),
				linkID = this.getLinkID(fromEltID, toEltID);
            if (srcEltConns.outgoing.indexOf(toEltID) === -1) {
                srcEltConns.outgoing.push(toEltID);
            }
            // TODO might not even need to track the incoming connections (redundant)
            if (targetEltConns.incoming.indexOf(fromEltID) === -1) {
                targetEltConns.incoming.push(fromEltID);
            }
            this.linksByID[linkID] = {
                from: $fromElt,
                to: $toElt,
                color: color || null
            };
        },

        setLinkColor: function ($fromElt, $toElt, color) {
            var fromEltID = $fromElt.data("linkable-element-id") ? $fromElt.data("linkable-element-id") : $fromElt.parent().data("linkable-element-id"),
				toEltID = $toElt.data("linkable-element-id") ? $toElt.data("linkable-element-id") : $toElt.parent().data("linkable-element-id"),
				linkID = this.getLinkID(fromEltID, toEltID),
				link = this.linksByID[linkID];
            if (link) {
                link.color = color || null;
                //this.refresh(); // Not guaranteed that endpoints have been created yet, need full refresh
            }
        },

        setLinkZIndex: function ($fromElt, $toElt, zIndex) {
            var fromEltID = $fromElt.data("linkable-element-id"),
                toEltID = $toElt.data("linkable-element-id"),
                linkID = this.getLinkID(fromEltID, toEltID),
                link = this.linksByID[linkID],
                $pathEl = this.connectionPathsByID[linkID];
            if (link) {
                link.zIndex = zIndex || null;
                if ($pathEl ) {
                    if (this.isLinkSupportiveMode()) {
                        $pathEl.css("z-index", zIndex);
                    }
                } else {
                    //this.refresh();
                }
            }
        },

        setAllLinkProperties: function (color, zIndex) {
            Object.keys(this.linksByID).forEach(function (linkID) {
                var link = this.linksByID[linkID];
                if (link) {
                    link.color = color || null;
                    link.zIndex = zIndex || null;
                }
            } .bind(this));
            this.refresh();
        },

        removeConnection: function ($fromElt, $toElt) {
            var fromEltID = $fromElt.data("linkable-element-id"),
				toEltID = $toElt.data("linkable-element-id");
            this.removeConnectionByIDs(fromEltID, toEltID);
        },

        removeConnectionsForElement: function ($elt) {
            var me = this,
				eltID = $elt.data("linkable-element-id"),
				connections = this.getOrCreateConns(eltID);
            for (var i = connections.incoming.length - 1; i >= 0; i--) {
                me.removeConnectionByIDs(connections.incoming[i], eltID);
            };
            for (var i = connections.outgoing.length - 1; i >= 0; i--) {
                me.removeConnectionByIDs(eltID, connections.outgoing[i]);
            };
            delete this.connectionsByEltID[eltID];
            if (this.ready) {
                this.refresh();
            }
        },

        // private
        removeConnectionByIDs: function (fromEltID, toEltID) {
            var srcEltConns = this.getOrCreateConns(fromEltID),
				targetEltConns = this.getOrCreateConns(toEltID),
				outConnIx = srcEltConns.outgoing.indexOf(toEltID),
				inConnIx = targetEltConns.incoming.indexOf(fromEltID),
				linkID = this.getLinkID(fromEltID, toEltID);
            if (outConnIx > -1) {
                srcEltConns.outgoing.splice(outConnIx, 1);
            }
            if (inConnIx > -1) {
                targetEltConns.incoming.splice(inConnIx, 1);
            }
            if (this.linksByID[linkID]) {
                delete this.linksByID[linkID];
            }
            
        },

        removeElement: function ($elt) {
            var eltID = $elt.data("linkable-element-id"),
				outEndpoint = this.endpointsByID[eltID + "-out"],
				inEndpoint = this.endpointsByID[eltID + "-in"];
            this.removeConnectionsForElement($elt);
            if (outEndpoint) {
                outEndpoint.remove();
            }
            if (inEndpoint) {
                inEndpoint.remove();
            }
            delete this.elementsByID[eltID];
            this.$elts = this.$elts.not($elt);
        },

        clearAll: function () {
            this.$elts = $();
            this.elementsByID = {};
            this.connectionsByID = {};
            this.connectionsByEltID = {};
            this.connectionPathsByID = {};
            this.linksByID = {};
        },

        getOrCreateConns: function (eltID) {
            var conns = this.connectionsByEltID[eltID];
            if (!conns) {
                conns = {
                    incoming: [],
                    outgoing: []
                }
                this.connectionsByEltID[eltID] = conns;
            }
            return conns;
        },

        getInterestingPoints: function () {
            // TODO cache edges
            // TODO organize edges so we don't have to compare all
            // TODO add some padding around obstacles; we currently allow lines very close to obstacles.
            // Use minPathDistanceFromObstacle
            var pathOffset = this.minPathDistanceFromObstacle,
				endpointXOffset = this.outEndpointXOffset || 0;
            this.elementPositions = [];
            this.elementPositionsByTop = {};
            this.elementPositionsByLeft = {};
            this.interestingPoints = [];
            this.interestingPointsByX = {};
            this.interestingPointsByY = {};
            this.interestingYs = [];
            this.interestingXs = [];
            this.elementTops = [];
            this.elementLefts = [];
            this.pathEndpointsByElementID = {};
            this.existsPointAtXY = {}; // sparse [x][y] matrix
            this.cachedPaths = {};
            var containerPos = this.$container.offset(),
				leftEdge = this.leftEdge || 0,
				topEdge = this.topEdge || 0;
            containerPos.left -= this.$container.scrollLeft();
            containerPos.top -= this.$container.scrollTop();

            for (var i = 0; i < this.$elts.length; i++) {
                var $elt = this.$elts.eq(i);
					var pos = $elt.offset();
					var width = $elt.width();
					var height = $elt.outerHeight();
					var elemPos = {
					    left: pos.left - containerPos.left,
					    top: pos.top - containerPos.top,
					    right: pos.left - containerPos.left + width,
					    bottom: pos.top - containerPos.top + height
					};
                this.elementPositions.push(elemPos);

                if (!this.elementPositionsByTop[elemPos.top]) {
                    this.elementPositionsByTop[elemPos.top] = [];
                    this.elementTops.push(elemPos.top);
                }
                this.elementPositionsByTop[elemPos.top].push(elemPos);

                if (!this.elementPositionsByLeft[elemPos.left]) {
                    this.elementPositionsByLeft[elemPos.left] = [];
                    this.elementLefts.push(elemPos.left);
                }
                this.elementPositionsByLeft[elemPos.left].push(elemPos);

                // Corners
                if (elemPos.top - pathOffset > topEdge) {
                    this.addInterestingPoint(elemPos.left - pathOffset, elemPos.top - pathOffset);
                    this.addInterestingPoint(elemPos.left + width + pathOffset, elemPos.top - pathOffset);
                    
                    
                }
                this.addInterestingPoint(elemPos.left - pathOffset, elemPos.top + height + pathOffset);
                this.addInterestingPoint(elemPos.left + width + pathOffset, elemPos.top + height + pathOffset);
                // Path endpoints on left and right side
                var linkTargetHeight = height,
                    linkTargetSelector = $elt.data("link-target-selector");
                if (linkTargetSelector !== undefined) {
                    linkTargetHeight = $elt.find(linkTargetSelector).height();
                }
                var yOffset = elemPos.top + (this.outEndpointYOffset || (linkTargetHeight / 2));
                var inPt = this.addInterestingPoint(elemPos.left - pathOffset, yOffset, true),
					outPt = this.addInterestingPoint(elemPos.left + width + pathOffset + endpointXOffset, yOffset, true);
                this.pathEndpointsByElementID[$elt.data("linkable-element-id")] = {
                    inPt: inPt,
                    outPt: outPt
                };
            }
            
            // this.testRenderInterestingPoints();
            this.elementTops.sort(this.sortNumbers);
            this.elementLefts.sort(this.sortNumbers);
            this.interestingYs.sort(this.sortNumbers);
            this.interestingXs.sort(this.sortNumbers);
        },

        alreadyPointExistsInVicinty: function(x, y){
            var exists = false;
            if (this.interestingXs && this.interestingXs.length > 0){
                for (var i=1; i <=2; i++){
                    if(this.interestingXs.indexOf(x-i) > -1){
                        exists = true;
                        break;
                    }
                    if(this.interestingXs.indexOf(x + i) > -1){
                        exists = true;
                        break;
                    }
                }
                
                
            }
            if (!exists && this.interestingYs && this.interestingYs.length > 0){
                for (var i=1; i <=3; i++){
                    if(this.interestingYs.indexOf(y-i) > -1){
                        exists = true;
                        break;
                    }
                    if(this.interestingYs.indexOf(y + i) > -1){
                        exists = true;
                        break;
                    }
                }
                
                
            }
            
            return exists;
        },

        sortNumbers: function (a, b) {
            return a - b;
        },

        locationOfX: function(element, array, start, end) {
          start = start || 0;
          end = end || array.length;
          var pivot = parseInt(start + (end - start) / 2, 10);
          if (end-start <= 1 || array[pivot].x === element.x) return pivot;
          if (array[pivot].x < element.x) {
            return this.locationOfX(element, array, pivot, end);
          } else {
            return this.locationOfX(element, array, start, pivot);
          }
        },

        locationOfY: function(element, array, start, end) {
          start = start || 0;
          end = end || array.length;
          var pivot = parseInt(start + (end - start) / 2, 10);
          if (end-start <= 1 || array[pivot].y === element.y) return pivot;
          if (array[pivot].y < element.y) {
            return this.locationOfY(element, array, pivot, end);
          } else {
            return this.locationOfY(element, array, start, pivot);
          }
        },

        insertX: function(element, array) {
            array.splice(this.locationOfX(element, array) + 1, 0, element);
            return array;
        },

        insertY: function(element, array) {
            array.splice(this.locationOfY(element, array) + 1, 0, element);
            return array;
        },


        addInterestingPoint: function (x, y, isCompulsory) {
            if (!isCompulsory){
                if (this.alreadyPointExistsInVicinty(x, y)){
                    return;
                }
            }
            
            var pt = {
                x: x,
                y: y,
                connectedPts: [],
                id: String(x) + "," + String(y)
            };
            this.interestingPoints.push(pt);
            var ptsByY = this.interestingPointsByY[y];
            if (!ptsByY) {
                ptsByY = this.interestingPointsByY[y] = [];
                this.interestingYs.push(y);
            }
            this.insertX(pt,ptsByY);
            var ptsByX = this.interestingPointsByX[x];
            if (!ptsByX) {
                ptsByX = this.interestingPointsByX[x] = [];
                this.interestingXs.push(x);
                this.existsPointAtXY[x] = {};
            }
            this.existsPointAtXY[x][y] = true;
            this.insertY(pt,ptsByX)
            return pt;
        },

        testRenderInterestingPoints: function () {
            for (var i = 0; i < this.interestingPoints.length; i++) {
                var $pt = $('<div style="position: absolute; width: 2px; height: 2px; background: red"></div>')
    					.css({
					    top: this.interestingPoints[i].y - 2,
					    left: this.interestingPoints[i].x - 2
    					});
                    this.$container.append($pt);
                }
        },

        /**
        * Construct a graph where the vertices are all possible points our
        * paths could flow through, and edges connect only points with vertical or
        * horizontal visibility to each other.  Points are the (x,y) cross product
        * of all endpoint locations and generated points outside the corners of each
        * obstacle (to allow routing around obstacles).
        *
        * Algorithm due to Wybrow et al http://ww2.cs.mu.oz.au/~pjs/papers/gd09.pdf
        *
        * Here is an outline of the algorithm:
        * 1. Sweep downward through the Y-coordinates of all interesting points
        * 2. While sweeping, expand the set of points to all possible X,Y points 
        * 		made up of individual coords (x,y) from the set of existing points 
        *		(cross product)
        * 3. Also while sweeping downward, track a list of "open objects" (elements) that are
        * 		obstacles that our lines can't pass through.  Open and close these as we pass
        *		through them.
        * 4. At each y-position, check all pairs of points at that Y to see whether any
        * 		open object lies partially or entirely between the two points.  If not,
        * 		there is an allowed horizontal line segment between the two points.
        *		Record that.
        * 5. Now repeat the process moving left-to-right across X coordinates, to create
        *		a list of all possible vertical segments.  Only difference is we don't need
        *		to add any new points, as the first pass will have hit all possible (x,y)s.
        * 6. The end result is that we will have filled in the "connectedPts" property
        *		of our points collection with pointers to all other points that are
        *		directly connected via an unbroken horizontal or vertical line segment.
        *		The route-finding algorithm in findRoute will construct a path out of these.
        *
        * Note that this only needs to be done when positions of elements change.
        *
        * TODO there is probably room for an optimized "update graph" when a single element
        * moves, based on the fact that only segments lying within the region bounded by the
        * original and new positions of that element could have been broken.
        *
        */
        constructVisibilityGraph: function () {
            this.getInterestingPoints();
            // Scan vertically
            var openObjects = [],
				nextObjectTopIndex = 0,
				nextObjectLeftIndex = 0,
				interestingHorizontalSegments = [],
				interestingVerticalSegments = [];
            // Vertical scan down interesting points, finding those that are connected
            // horizontally by tracking which objects are currently "open" at that Y position
            // TODO have to go top to bottom
            for (var i = 0; i < this.interestingYs.length; i++) {
                var y = this.interestingYs[i];
                pts = this.interestingPointsByY[y];
                // Expand set of interesting points to be the cross product of the
                // individual X and Y components of existing points
                for (var xi = 0; xi < this.interestingXs.length; xi++) {
                    var x = this.interestingXs[xi];
                    if (!this.existsPointAtXY[x][y]) {
                        this.addInterestingPoint(x, y);
                    }
                }
                // Close open objects we've passed
                for (var j = openObjects.length - 1; j >= 0; j--) {
                    if (y > openObjects[j].bottom) {
                        openObjects.splice(j, 1);
                    }
                }
                // Add any new open objects
                for (var j = nextObjectTopIndex; j < this.elementTops.length; j++) {
                    if (this.elementTops[j] > y) {
                        nextObjectTopIndex = j;
                        break;
                    } else {
                        var objs = this.elementPositionsByTop[this.elementTops[j]];
                        for (var k = 0; k < objs.length; k++) {
                            var obj = objs[k];
                            if (obj.bottom >= y) {
                                openObjects.push(obj);
                            }
                        }
                    }
                }
                // MM: The code here has been optimized and moved to the function below. The non-optimized code is also present currently
                // TODO: Remove non-optimized function
                this.populateConnectedPointsOnXOptimized(pts,openObjects);
            }

            // Scan horizontally across points, same idea as above, find vertical segments
            openObjects = [];
            for (var i = 0; i < this.interestingXs.length; i++) {
                var x = this.interestingXs[i],
					pts = this.interestingPointsByX[x];
                for (var j = openObjects.length - 1; j >= 0; j--) {
                    if (x > openObjects[j].right) {
                        openObjects.splice(j, 1);
                    }
                }
                for (var j = nextObjectLeftIndex; j < this.elementLefts.length; j++) {
                    if (this.elementLefts[j] > x) {
                        nextObjectLeftIndex = j;
                        break;
                    } else {
                        var objs = this.elementPositionsByLeft[this.elementLefts[j]];
                        for (var k = 0; k < objs.length; k++) {
                            var obj = objs[k];
                            if (obj.right >= x) {
                                openObjects.push(obj);
                            }
                        }
                    }
                }
                // MM: The code here has been optimized and moved to the function below. The non-optimized code is also present currently
                // TODO: Remove non-optimized function
                this.populateConnectedPointsOnYOptimized(pts,openObjects);
            }
            // TESTING ONLY - draw segments
            // interestingHorizontalSegments.map(function(seg) {
            // 	this.$container.append('<div style="position: absolute; height: 0; border-top: 1px solid green; left: ' + seg.x0 + 'px; top:' + seg.y + 'px; width:' + (seg.x1 - seg.x0) + 'px"></div>');
            // }.bind(this));
            // interestingVerticalSegments.map(function(seg) {
            // 	this.$container.append('<div style="position: absolute; width: 0; border-left: 1px solid purple; top: ' + seg.y0 + 'px; left:' + seg.x + 'px; height:' + (seg.y1 - seg.y0) + 'px"></div>');
            // }.bind(this));
        },

        // MM: Optimized function to find connected points
        // Input: points on X axis (size:N), openObjects (size: K)
        // 1) First iterate over all points and objects to find blocked points, O(N*K)
        // 2) Iterate over consecutive non-blocked points to populate connected points collection, worst case:O(N*N)
        // Assumption: The points collection will be sorted asc by x
        populateConnectedPointsOnXOptimized: function(points, openObjects)
        {
            for (var j = 0; j < points.length; j++) {
                var point = points[j];
                for (var m = 0; m < openObjects.length; m++) {
                    var obj = openObjects[m];
                    if(obj.left <= point.x && obj.right >= point.x){
                        point.blocked = true;
                        break;
                    }
                }
            }

            for (var j = 0; j < points.length; j++) {
                for (var k = j + 1; k < points.length; k++) {
                    var connected = true,
                        leftPt = points[j],
                        rightPt = points[k];
                    if (leftPt.blocked || rightPt.blocked) {
                        break;
                    }
                    if (leftPt.x > rightPt.x) {
                        leftPt = rightPt;
                        rightPt = points[j];
                    }
                    for (var m = 0; m < openObjects.length; m++) {
                        var obj = openObjects[m];
                        if (obj.left >= leftPt.x && obj.left <= rightPt.x) {
                            connected = false;
                            break;
                        } else if (obj.right >= leftPt.x && obj.right <= rightPt.x) {
                            connected = false;
                            break;
                        }
                    }
                    if (connected) {
                        leftPt.connectedPts.push(rightPt);
                        rightPt.connectedPts.push(leftPt);
                    }
                }
            }
        },

        // MM: Unoptimized function to find connected points, this function is not currently used
        // Input: points on X axis (size:N), openObjects (size: K)
        // O(N*N*K)
        populateConnectedPointsOnX: function(points, openObjects)
        {
            for (var j = 0; j < points.length; j++) {
                for (var k = j + 1; k < points.length; k++) {
                    var connected = true,
                        leftPt = points[j],
                        rightPt = points[k];
                    if (leftPt.blocked || rightPt.blocked) {
                        continue;
                    }
                    if (leftPt.x > rightPt.x) {
                        leftPt = rightPt;
                        rightPt = points[j];
                    }
                    for (var m = 0; m < openObjects.length; m++) {
                        var obj = openObjects[m];
                        if (obj.left >= leftPt.x && obj.left <= rightPt.x) {
                            if (obj.right >= rightPt.x) {
                                rightPt.blocked = true;
                            }
                            connected = false;
                            break;
                        } else if (obj.right >= leftPt.x && obj.right <= rightPt.x) {
                            if (obj.left <= leftPt.x) {
                                leftPt.blocked = true;
                            }
                            connected = false;
                            break;
                        }
                    }
                    if (connected) {
                        leftPt.connectedPts.push(rightPt);
                        rightPt.connectedPts.push(leftPt);
                    }
                }
            }
        },

         // MM: Optimized function to find connected points
        // Input: points on X axis (size:N), openObjects (size: K)
        // 1) First iterate over all points and objects to find blocked points, O(N*K)
        // 2) Iterate over consecutive non-blocked points to populate connected points collection, worst case:O(N*N)
        // Assumption: The points collection will be sorted asc by y
        populateConnectedPointsOnYOptimized: function(points, openObjects)
        {
            for (var j = 0; j < points.length; j++) {
                var point = points[j];
                for (var m = 0; m < openObjects.length; m++) {
                    var obj = openObjects[m];
                    if(obj.top <= point.y && obj.bottom >= point.y){
                        point.blocked = true;
                        break;
                    }
                }
            }

            for (var j = 0; j < points.length; j++) {
                for (var k = j + 1; k < points.length; k++) {
                    var connected = true,
                        topPt = points[j],
                        bottomPt = points[k];
                    if (topPt.blocked || bottomPt.blocked) {
                        break;
                    }
                    if (topPt.y > bottomPt.y) {
                        topPt = bottomPt;
                        bottomPt = points[j];
                    }
                    for (var m = 0; m < openObjects.length; m++) {
                        var obj = openObjects[m];
                        if (obj.top >= topPt.y && obj.top <= bottomPt.y) {
                            connected = false;
                            break;
                        } else if (obj.bottom >= topPt.y && obj.bottom <= bottomPt.y) {
                            connected = false;
                            break;
                        }
                    }
                    if (connected) {
                        topPt.connectedPts.push(bottomPt);
                        bottomPt.connectedPts.push(topPt);
                    }
                }
            }


        },

        // MM: Unoptimized function to find connected points, this function is not currently used
        // Input: points on X axis (size:N), openObjects (size: K)
        // O(N*N*K)
        populateConnectedPointsOnY: function(points, openObjects)
        {
            for (var j = 0; j < points.length; j++) {
                for (var k = j + 1; k < points.length; k++) {
                    var connected = true,
                        topPt = points[j],
                        bottomPt = points[k];
                    if (topPt.blocked || bottomPt.blocked) {
                        continue;
                    }
                    if (topPt.y > bottomPt.y) {
                        topPt = bottomPt;
                        bottomPt = points[j];
                    }
                    for (var m = 0; m < openObjects.length; m++) {
                        var obj = openObjects[m];
                        if (obj.top >= topPt.y && obj.top <= bottomPt.y) {
                            if (obj.bottom >= bottomPt.y) {
                                bottomPt.blocked = true;
                            }
                            connected = false;
                            break;
                        } else if (obj.bottom >= topPt.y && obj.bottom <= bottomPt.y) {
                            if (obj.top <= topPt.y) {
                                topPt.blocked = true;
                            }
                            connected = false;
                            break;
                        }
                    }
                    if (connected) {
                        topPt.connectedPts.push(bottomPt);
                        bottomPt.connectedPts.push(topPt);
                        // interestingVerticalSegments.push({
                        //  x: x,
                        //  y0: topPt.y,
                        //  y1: bottomPt.y
                        // });
                    }
                }
            }      
        },

        /**
        * Use A* (http://en.wikipedia.org/wiki/A*_search_algorithm) 
        * to find the best path between start and end points,
        * considering neighbors in the visibility graph.  
        *
        * This is standard A*, with both the cost and the estimated cost heuristic 
        * based on Manhattan distance, combined with the number of bends in the path.
        *
        * TODO we might want to favor paths with "initial straightness", that is, greatest
        * distance before first bend.
        */
        findRoute: function (startPt, endPt) {
            // var startTime = ServerClientDateClass.getTodaysDate();
            var cacheForStartPt = this.cachedPaths[startPt.id];
            if (cacheForStartPt) {
                var cachedPath = cacheForStartPt[endPt.id];
                if (cachedPath) {
                    return cachedPath;
                }
            }
            var queue = [],
				queueByID = {},
				visited = {},
				done = false,
				startNode = {
				    prev: null,
				    pt: startPt,
				    cost: 0,
				    totalCost: 0,
				    estRemainingCost: this.manhattanDistance(
						startPt.x, startPt.y, endPt.x, endPt.y),
				    bends: 0,
				    distance: 0,
				    inDir: null
				},
                count = 0;
            queue.push(startNode);
            queueByID[startNode.pt.id] = startNode;
            while (!done) {
                var candidate = queue.pop();
                if (!candidate) {
                    if (this.debug) {
                        console.log("Couldn't find path between points", startPt, endPt, this);
                    }
                    // console.log("failed findroute took", ServerClientDateClass.getTodaysDate() - startTime, "ms and", count, "iterations");
                    return;
                }
                count++;
                if (count > MAX_SEARCH_ITERATIONS) {
                    if (this.debug) {
                        console.log("Aborting path search at", MAX_SEARCH_ITERATIONS, "iterations");
                    }
                    return;
                }
                delete queueByID[candidate.pt.id];
                if (candidate.pt === endPt) {
                    var path = [];
                    var thisNode = candidate;
                    while (thisNode) {
                        path.push({ x: thisNode.pt.x, y: thisNode.pt.y });
                        thisNode = thisNode.prev;
                    }
                    done = true;
                    path.reverse();
                    if (!cacheForStartPt) {
                        cacheForStartPt = this.cachedPaths[startPt.id] = {};
                    }
                    cacheForStartPt[endPt.id] = path;
                    path.distance = candidate.distance;
                    // console.log("successful findroute took", ServerClientDateClass.getTodaysDate() - startTime, "ms and", count, "iterations");
                    return path;
                }
                for (var i = 0; i < candidate.pt.connectedPts.length; i++) {
                    var neighborPt = candidate.pt.connectedPts[i];
                    if (visited[neighborPt.id]) {
                        continue;
                    }
                    var distance = candidate.distance
							+ this.manhattanDistance(candidate.pt.x, candidate.pt.y,
								neighborPt.x, neighborPt.y),
						bends = candidate.bends,
						dir = 'r';
                    if (neighborPt.x === candidate.pt.x) {
                        dir = (neighborPt.y > candidate.pt.y ? 'd' : 'u');
                    } else if (neighborPt.x < candidate.pt.x) {
                        dir = 'l';
                    }
                    if (dir !== candidate.inDir) {
                        bends++;
                    }
                    var cost = distance + bends,
						estRemainingCost = this.manhattanDistance(neighborPt.x, neighborPt.y,
							endPt.x, endPt.y), // TODO improve?  take bends into account?
						totalCost = cost + (2 * estRemainingCost);
                    // look to see if this is in the queue already and use that if so
                    var neighborNode = queueByID[neighborPt.id];
                    if (!neighborNode) {
                        neighborNode = { pt: neighborPt };
                        queue.push(neighborNode);
                        queueByID[neighborPt.id] = neighborNode;
                    }
                    if (typeof neighborNode.totalCost === 'undefined'
						|| (totalCost < neighborNode.totalCost)) {
                        neighborNode.cost = cost;
                        neighborNode.totalCost = totalCost;
                        neighborNode.bends = bends;
                        neighborNode.inDir = dir;
                        neighborNode.estRemainingCost = estRemainingCost;
                        neighborNode.prev = candidate;
                        neighborNode.distance = distance;
                    }
                }
                queue.sort(function (a, b) {
                    return (b.totalCost - a.totalCost);
                });
                visited[candidate.pt.id] = true;
            }
        },

        getStraightLinePath: function (startPt, endPt) {
            return [ 
                { x: startPt.x, y: startPt.y }, 
                { x: endPt.x, y: endPt.y }
            ];
        },

        manhattanDistance: function (x1, y1, x2, y2) {
            return (Math.abs(x2 - x1) + Math.abs(y2 - y1));
        },

        triggerRefresh: function() {
            if (stl.app.getCurrentViewId() !== TABLE_VIEW_ID) {
                if (!this.visible) {
                    this.refreshOnNextShow = true;
                    return;
                }
                if (this.refreshTimeout) {
                    clearTimeout(this.refreshTimeout);
                }
                if (!this.refreshDelegate) {
                    this.refreshDelegate = this.refresh.bind(this);
                }
                this.refreshTimeout = setTimeout(this.refreshDelegate, this.REFRESH_DELAY_MS);
            }
        },

        showRefreshLinksNotifier: function() {
            if (stl.app.getCurrentViewId() !== TABLE_VIEW_ID && this.visible) {
                showToolbarNotifier(DRAWING_DEPENDENCIES + PLEASE_WAIT);
            }
        },

        beforeLinkRefresh: function(linksView, refreshLinksCallBack) {
            refreshLinksCallBack.apply(linksView, [hideToolbarNotifier]);
        },


        /**
         * Redraw everything
         */
        refresh: function() {

            if (!this.$elts || this.$elts.length == 0) return; 
            this.arrowHeadIDsByColor = {};
            var connectionsToRedraw = [];
            this.horizontalSegmentsInUseByY = {};
            this.verticalSegmentsInUseByX = {};
            this.constructVisibilityGraph();
            // this.testRenderInterestingPoints();
            this.$container.find("svg.link").remove();
            this.$endpoints = $();
            var isIE9 = (document.all && !window.atob)
            if (isIE9 && !this.addedIE9Support && !this.$container.data("linkview-ie9-support-added")) {
                // Don't ask; all this fiasco is required for IE9 which has broken HTML5 drag-drop support
                this.$container.on('mousemove', function(evt) {
                    if (window.event.button === 1 && $(evt.target).hasClass("link-endpoint")) {
                        evt.target.dragDrop();
                    }
                });
                this.$container.data("linkview-ie9-support-added", true);
                this.addedIE9Support = true;
            }
            for (var i = 0, max = this.$elts.length; i < max; i++) {
                var $elt = this.$elts.eq(i),
                    linkEltID = $elt.data("linkable-element-id"),
                    connections = this.getOrCreateConns(linkEltID),
                    $outEndpoint = this.endpointsByID[linkEltID + "-out"],
                    $inEndpoint = this.endpointsByID[linkEltID + "-in"];
                // All elements have an out-endpoint
                if (!$outEndpoint) {
                    $outEndpoint = this.createEndpoint($elt, "out", isIE9);
                }
                if (connections.incoming.length > 0) {
                    if (!$inEndpoint) {
                        $inEndpoint = this.createEndpoint($elt, "in", isIE9);
                    }
                } else if ($inEndpoint) {
                    $inEndpoint.remove();
                    $inEndpoint = null;
                }
                this.positionEndpoints($elt, $inEndpoint, $outEndpoint);
                connectionsToRedraw.push({
                    elt: $elt,
                    inEndpoint: $inEndpoint,
                    outEndpoint: $outEndpoint,
                    connections: connections
                });
            }
			for (var i = 0, max = connectionsToRedraw.length; i < max; i++) {
                var c = connectionsToRedraw[i];
                if (this.isElementRowVisible(c.elt))
                    this.redrawOutgoingConnections(c.elt, c.connections);
            }
            setTimeout(function() {
                $(this).trigger("refreshcomplete");
            }.bind(this), 0);
            //this.setVisible(true)
            hideToolbarNotifier();
            if ($(".linksDeleteDialog").length > 0){
                stl.app.highlightLinkSelectedForDelete();
            }
            //this.highlightLinksIfRequired();
            
        },
        highlightLinksIfRequired: function(){
            var links = this.linksByID;
            $.each(links, function (index, link) {
                var toTask = link.to;
                var fromTask = link.from;

                var isLinkInCC = false;

                isLinkInCC = this.isLinkInCriticalChain(toTask, fromTask);

                if (isLinkInCC) {
                    this.setLinkColor(fromTask, toTask, "red");
                    this.setLinkZIndex(fromTask, toTask, 100);
                }
            } .bind(this));
        },

        isElementRowVisible:function($element){
            //Vrushali - Multilevel WBS - 
            //We will doing show/hide with matrix view rows so links to/from tasks inside hidden rows need not be displayed.
            
            var isElementVisible = true;
            if($element){
                var parentMatrixRow = $element.closest(".matrix-view-row");
                if(parentMatrixRow){
                    var isParentRowVisible = parentMatrixRow.css("display");
                    if(isParentRowVisible == "none"){
                        isElementVisible = false;
                    }                    
                }
            }
            
            return isElementVisible;
        },

        positionEndpoints: function ($elt, $in, $out) {
            var pos;
            var width;
            var height;
            var inCache = false;
            if (stl.app.getCurrentViewId() == "matrix") {
                if (stl.app.linkableElementOffsetAndWidthById){
                    inCache = true;
                    var model = $($elt).data("model"); 
                    if (model){
                        uid = model.uid;
                    } else {
                        uid = $($elt).parent().data("model").uid;
                    }
                    //console.log("in cache code");
                    var obj = stl.app.linkableElementOffsetAndWidthById[uid];
                    if (obj){
                        pos = obj.offset;
                        width = obj.width;
                        height = obj.height;
                    } else {
                        pos = $elt.offset();
                    }
                    
                    //pos = $elt.offset();
                } else {
                    pos = $elt.offset();
                }
            } else {
                pos = $elt.offset();
            }

            //var pos = $elt.offset(),
            height = height ? height : $elt.height();
            var containerPos = this.containerPos,
				left = pos.left + this.containerScrollLeft - containerPos.left + (this.outEndpointXOffset || 0),
				top = pos.top + this.containerScrollTop - containerPos.top + (this.outEndpointYOffset || (height / 2));
            var test = Date.now();
            width = width ? width : $elt.width();
            $out.css({
                "left": left + width + 1,
                "top": top
            });
            if ($in) {
                $in.css({
                    "left": left,
                    "top": top
                });
            }
        },

        redrawOutgoingConnections: function ($elt, connections) {
            var eltID = $elt.data("linkable-element-id");
            if (!connections) {
                connections = this.getOrCreateConns(eltID);
            }
            for (var i = 0, max = connections.outgoing.length; i < max; i++) {
                var targetEltID = connections.outgoing[i];
                var connID = this.getLinkID(eltID, targetEltID),
					$connPath = this.connectionPathsByID[connID];
                if ($connPath) {
                    // TODO always redrawing for now, eventually just modify existing path
                    $connPath.remove();
                }
                if(this.isElementRowVisible(this.elementsByID[targetEltID])){
                    if (this.elementsByID[targetEltID]){
                        this.connectionPathsByID[connID] = this.findAndDrawRoute($elt, this.elementsByID[targetEltID], true);
                        
                    }
                    
                }
            }
        },

        drawRoute: function (path, color, zIndex, fromID, toID) {
            // TODO look into whether we can still use one SVG element with multiple paths
            // without blocking other elements on the screen
            var svgEl = d3.select(this.$container[0]).select('svg');
            var isSVGAdded = svgEl.length > 0 && svgEl[0][0] != null;
            if(isSVGAdded)
                var svg = d3.select(this.$container[0]).select('svg');
            else                
                var svg = d3.select(this.$container[0]).append("svg");
			this.updateLinkSVGAttributes(svg, LINK_CLS);	

            if (!color) {
                color = LINK_COLOR;
            }
            var normalArrowHeadID = this.getOrCreateArrowMarker(svg, color),
				highlightArrowHeadID = this.getOrCreateArrowMarker(svg, LINK_HIGHLIGHT_COLOR);

            var viewName = stl.app.getCurrentViewId() == "matrix" ? "PERT" : "TM";

            var lineGraph = svg.append("path")
				.attr("class", "link-path")
	            .attr("d", D3_LINE_FUNCTION(path))
	            .attr("stroke", color)
	            .attr("stroke-width", 2)
	            .attr("fill", "none")
	            .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                .attr("PathId",viewName +fromID+"to"+toID)
                .attr("id", viewName +fromID+"to"+toID)
                .on("mouseleave", function () {
                    if (!stl.app.IsLinkSelectedForDelete(d3.select(this).attr("id"))){
                        d3.select(this)
                            .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                            .transition().duration(200)
                            .style("stroke", color);
                    }

                })
                .on("dblclick", function(){
                    //alert("clicked");
                    var event = event ? event : window.event;
                    //event.preventDefault();
                    d3.select(this).moveToFront();
                    if(Ext.isIE){
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", LINK_HIGHLIGHT_COLOR)                 
                        .transition()
                        .delay(1500)
                        .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                        .style("stroke", color);
                    }
                    else{
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", LINK_HIGHLIGHT_COLOR);
                    }   
                    stl.app.getLinksDeleteDialog(d3.select(this).attr("id"));



                })
	            .on("mouseenter",function () {
                    d3.select(this).moveToFront();
                    if(Ext.isIE){
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", LINK_HIGHLIGHT_COLOR)                 
                        .transition()
                        .delay(1500)
                        .attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                        .style("stroke", color);
                    }
                    else{
                        d3.select(this)
                        .attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
                        .transition().duration(200)
                        .style("stroke", LINK_HIGHLIGHT_COLOR);
                    }           
	                
                    
	            });
               
            if (zIndex && this.isLinkSupportiveMode()) {

                svg.style("z-index", zIndex);
            }


            return $(svg[0]);
        },

        getOrCreateArrowMarker: function (svgEl, color, isTransient) {
            var arrowID = this.arrowHeadIDsByColor[color];
            if (!arrowID || isTransient) {
                arrowID = this.createArrowMarker(svgEl, color);
                if (!isTransient) {
                    this.arrowHeadIDsByColor[color] = arrowID;
                }
            }
            return arrowID;
        },

        createArrowMarker: function (svgEl, color) {
            this.lastArrowMarkerID = (this.lastArrowMarkerID || 0) + 1;
            var id = "arrow-" + String(this.lastArrowMarkerID);
            var arrowDef = svgEl.append("svg:defs")
				.append("svg:marker")
					.attr("id", id)
					.attr("viewBox", "0 0 8 8")
					.attr("refX", 7)
					.attr("refY", 4)
					.attr("markerUnits", "strokeWidth")
					.attr("fill", color)
					.attr("stroke", "none")
					.attr("markerWidth", 5)
					.attr("markerHeight", 3)
					.attr("orient", "auto")
					.append("svg:path")
						.attr("d", "M 0 0 L 8 4 L 0 8 z");
            return id;
        },

        createEndpoint: function ($elt, type, isIE9) {
            var linkEltID = $elt.data("linkable-element-id"),
				$endpoint = (isIE9 ? $('<a href="javascript:;" draggable="true" class="link-endpoint"></a>')
                    : $('<div class="link-endpoint" draggable="true"></div>'));
            
            $endpoint.addClass("link-endpoint-" + type);
            $endpoint.data({
                "endpoint-element-id": linkEltID,
                "endpoint-type": type
            });
            $endpoint.on("dragstart", this.onEndpointDragStart.bind(this));
            $endpoint.on("dragend", this.onEndpointDragEnd.bind(this));
            $endpoint.on("mouseenter", this.onEndpointMouseEnter.bind(this));
            $endpoint.on("mouseleave", this.onEndpointMouseLeave.bind(this));
            $endpoint.on("click", this.onEndpointClick.bind(this));
            this.$container.append($endpoint);
            this.endpointsByID[linkEltID + "-" + type] = $endpoint;
            $endpoint.hide();
            return $endpoint;
        },

        onEndpointDragStart: function (evt) {
            if (this.readOnly) {
                evt.preventDefault();
                return false;
            }
            this.draggingEndpoint = true;
            var $endpoint = $(evt.target),
				endpointOffset = $endpoint.offset();
            // Must set some data for Firefox to fire other drag events
            evt.originalEvent.dataTransfer.setData('Text', '');
            this.dragContainerOffset = this.$container.offset();
            this.dragStartPos = endpointOffset;
            this.dragStartElementID = $endpoint.data("endpoint-element-id");
            this.dragRoutingStartPt =
				this.pathEndpointsByElementID[this.dragStartElementID]
					[$endpoint.data("endpoint-type") + "Pt"];
            this.dragStartingEndpointPos = $endpoint.offset();
            evt.stopPropagation();
        },

        onEndpointClick: function (evt) {
            if (this.readOnly) return;
            var $endpoint = $(evt.target).closest(".link-endpoint"),
				offset = $endpoint.offset(),
				sourceElID = $endpoint.data("endpoint-element-id"),
				targetEltIDs = this.connectionsByEltID[sourceElID].outgoing;
            if (!this.endpointPopup) {
                this.endpointPopup = $('<div class="tool-popup below"></div>');
                $(document.body).append(this.endpointPopup);
            }
            this.endpointPopup
				.data("link-source-id", sourceElID)
				.empty();
            for (var i = 0; i < targetEltIDs.length; i++) {
                var targetEltID = targetEltIDs[i];
                var targetEl = this.elementsByID[targetEltID];
                if (targetEl){
                    if(targetEl.hasClass('ms-content-wrap')){
                        var name = targetEl.parent().data("model").name;
                    }else{
                        var name = targetEl.data("model").name;
                    }
                    this.endpointPopup.append($('<div></div>')
                        .text("Remove link to " + name)
                        .data({
                            "delete-link-source-id": sourceElID,
                            "delete-link-target-id": targetEltID
                    }));
                }
                
            }
            this.endpointPopup.find("div").on("click", this.onDeleteLinkClick.bind(this));
            this.endpointPopup.find("div").on("mouseenter", this.onMouseHover.bind(this));
            this.endpointPopup.find("div").on("mouseleave", this.onMouseLeave.bind(this));
            this.endpointPopup.css({
                top: offset.top + 10,
                left: offset.left - (this.endpointPopup.width() / 2)
            });
            this.endpointPopup.show();
            evt.stopPropagation();
            evt.preventDefault();
        },

        getLinkId: function(link){
            var id;
            var toModel = $(link.to).data("model") ? $(link.to).data("model") : $(link.to).parent().data("model");
            var fromModel = $(link.from).data("model") ? $(link.from).data("model") : $(link.from).parent().data("model");
            var viewName = stl.app.getCurrentViewId() == "matrix" ? "PERT" : "TM";
            id = viewName + fromModel.uid +"to"+ toModel.uid;
            return id;
        },

        onMouseHover: function (evt) {
            if (this.readOnly) return;
            var $evtTarget = $(evt.target),
				linkToID = $evtTarget.data("delete-link-target-id"),
				linkFromID = $evtTarget.data("delete-link-source-id"),
				link = this.linksByID[this.getLinkID(linkFromID, linkToID)];
            var id = this.getLinkId(link);
            var svg = d3.select(this.$container[0]).select('svg');
            var highlightArrowHeadID = this.getOrCreateArrowMarker(svg, "orange");
            var elem = $("path#" + id )[0];
            d3.select(elem).moveToFront();
            link.oldColor = d3.select(elem).style("stroke");
            d3.select(elem).style("stroke","orange");
            d3.select(elem).attr("marker-end", "url(\#" + highlightArrowHeadID + ")")
            
            //link.color = "orange";
        },

        onMouseLeave: function (evt) {
            if (this.readOnly) return;
            if (!this.linksByID) return;
            var $evtTarget = $(evt.target),
				linkToID = $evtTarget.data("delete-link-target-id"),
				linkFromID = $evtTarget.data("delete-link-source-id"),
				link = this.linksByID[this.getLinkID(linkFromID, linkToID)];
            if (link) {
                if (link.oldColor != null){
                    var svg = d3.select(this.$container[0]).select('svg');
                    var normalArrowHeadID = this.getOrCreateArrowMarker(svg, link.oldColor);
                    var id = this.getLinkId(link);
                    var elem = $("path#" + id )[0];
                    d3.select(elem).style("stroke",link.oldColor)
                    d3.select(elem).attr("marker-end", "url(\#" + normalArrowHeadID + ")")
                    link.color = link.oldColor;
                } else
                    link.color = null;
                
            }
        },

        onDeleteLinkClick: function (evt) {
            if (this.readOnly) return;
            var $evtTarget = $(evt.target),
				linkToID = $evtTarget.data("delete-link-target-id"),
				linkFromID = $evtTarget.data("delete-link-source-id"),
				link = this.linksByID[this.getLinkID(linkFromID, linkToID)];
            this.endpointPopup.hide();
            if (link) {
                if (link.to.closest(".milestone").length > 0 && link.to.closest(".milestone").data("model").taskType == "PE") {
                    if (this.getOrCreateConns(linkToID).incoming.length == 1) {
						PPI_Notifier.alert(CANT_REMOVE_LINK,LINK_ERROR);
                        return;
                    }
                }
                this.removeConnectionByIDs(linkFromID, linkToID);
                $(this).trigger("linkremove", link);
                var linkWithId = {to : this.resolveLinkEndpointUID(link.to), from : this.resolveLinkEndpointUID(link.from)};
                stl.app.undoStackMgr.pushToUndoStackForLinkDelete(this, stl.app.ProjectDataFromServer, linkWithId);
                stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            }
        },

        setVisible: function (visible) {
            this.visible = visible;
            if (visible) {
                if (this.refreshOnNextShow) {
                    $(this).one("refreshcomplete", function() {
                        this.$container.removeClass("links-hidden");
                    }.bind(this));
                    this.showRefreshLinksNotifier();
                    this.refresh();
                    delete this.refreshOnNextShow;
                } else {
                    this.$container.removeClass("links-hidden");
                }
            } else {
                this.$container.addClass("links-hidden");
                this.$endpoints.hide();
            }
        },

        onEndpointDragEnd: function (evt) {
        	/*setTimeout(function() {
        		this.draggingEndpoint = false;
            // TODO re-show the actual endpoint el while drag in progress if applicable
        	}.bind(this), 0);*/
            this.draggingEndpoint = false;
            
        },

        onElementDragEnter: function (evt) {
            if (!this.draggingEndpoint) return;
            var $targetElt = $(evt.target).closest(".linkable-element"),
				targetElID = $targetElt.data("linkable-element-id"),
				linkID = this.getLinkID(this.dragStartElementID, targetElID);
            if (this.linksByID[linkID]) return; // link already exists
            evt.preventDefault();
            if (!this.elementsByID[this.dragStartElementID].is($targetElt) && $targetElt.hasClass("linkable-element")) {            

                /*this.lastDragLine = this.findAndDrawRoute(
					this.elementsByID[this.dragStartElementID], $targetElt, false);*/
                $targetElt.addClass("link-drop-target");
               /* if (this.lastDragLine) {
                    //$(this.lastDragLine[0]).remove();
                }*/
            }
        },

        findDirectRoute: function(startPt, endPt){
            var path = [];
            var firstPoint = {x: startPt.x +(endPt.x - startPt.x), y: startPt.y};
            var secondPoint = {x: endPt.x, y: startPt.y +(endPt.y - startPt.y)};
            path.push(firstPoint);
            path.push(secondPoint);
            return path;
        },

        findAndDrawRoute: function ($fromEl, $toEl, commit) {
            var fromID = $fromEl.data("linkable-element-id"),
				toID = $toEl.data("linkable-element-id"),
				
				linkObj = this.linksByID[this.getLinkID(fromID, toID)];
            var startPt, endPt, dist;
                
            if (this.pathEndpointsByElementID[fromID] && this.pathEndpointsByElementID[toID]){
                startPt = this.pathEndpointsByElementID[fromID]["outPt"];
                endPt = this.pathEndpointsByElementID[toID]["inPt"];
                dist = this.manhattanDistance(startPt.x, startPt.y, endPt.x, endPt.y);
            } else {
                return;
            }
            /*if (dist < MIN_LINK_DRAWING_MANHATTAN_DISTANCE || startPt.blocked || endPt.blocked) {
                // Silently don't draw any links that are below our length threshold
                return;
            }*/
            var path = this.findRoute(startPt, endPt);
            if (!path) {
                // This is an error condition, but we silently ignore unless in debug mode
                //return;
                path = this.findDirectRoute(startPt, endPt);
            }
            /* Note: timeline view can't find paths when elements are back to back - 
            the elements overlap the needed start/end segments, no route possible.
            That's OK because we don't want to draw them then, anyway. */
            path.splice(0, 0, { x: startPt.x - this.minPathDistanceFromObstacle, y: startPt.y });
            path.push({ x: endPt.x + this.minPathDistanceFromObstacle, y: endPt.y });
            if (this.spreadLinks && !path.adjusted) {
                this.adjustPath(path, commit);
                path.adjusted = true;
            }
            // console.log(this.printPath(path));
            var fromTaskId;//ElementIdMap
            var toTaskId;
            if (stl.app.getCurrentViewId() == "matrix") {
                var fromModel = $($fromEl).data("model"); 
                if (fromModel){
                    fromTaskId = fromModel.uid;
                } else {
                    fromTaskId = $($fromEl).parent().data("model").uid;
                };
                var toModel = $($toEl).data("model"); 
                if (toModel){
                    toTaskId = toModel.uid;
                } else {
                    toTaskId = $($toEl).parent().data("model").uid;
                };
            }

            if (stl.app.getCurrentViewId() == "timeline") {
                if (this.ElementIdMap){
                    fromTaskId =this.ElementIdMap[$fromEl.attr("id")];
                    toTaskId = this.ElementIdMap[$toEl.attr("id")];
                }
                
            }

            var color = linkObj ? linkObj.color : null,
                zIndex = linkObj ? linkObj.zIndex : null;
               if(commit)
            	return this.drawRoute(path, color, zIndex, fromTaskId, toTaskId);
            else
            	return true;
        },

        /*
        * Debugging helper method, returns a string with the points in the path
        */
        printPath: function (path) {
            return path.map(function (pt) {
                return "(" + pt.x + ", " + pt.y + ")";
            }).join(', ');
        },

        /**
        * Shifts paths apart that pass through the same line segment (for visual clarity)
        * commit: boolean - should we remember the path's new positions (IOTW, is this path being committed to the graph?)
        */
        adjustPath: function (path, commit) {
            var me = this,
				adjustedPath = [],
				lastDirWasRight = false,
				segmentsToCommit = [],
				pos = 1; // skip first point, it's fixed
            while (pos < path.length - 2) {	// skip last segment, we want to always converge on same segment
                var pt = path[pos],
					nextPt = path[pos + 1],
					isHorizontal = (nextPt.y === pt.y),
					offsetDimension = (isHorizontal ? "y" : "x"),
					extentDimension = (isHorizontal ? "x" : "y"),
					origOffset = pt[offsetDimension];
                // Combine any contiguous inline segments into one segment
                // Note, don't join the last line segment here; we want to force all arrows at the end of a path to share one segment
                while (pos + 2 < (path.length - 1)
					&& path[pos + 2][offsetDimension] === origOffset) {
                    path.splice(pos + 1, 1);
                    nextPt = path[pos + 1];
                }
                // Look for collisions with other registered segments
                var iteration = 1,
					candidatePosition = origOffset,
					start = pt[extentDimension],
					end = nextPt[extentDimension];
                while (this.segmentCollides(isHorizontal, candidatePosition, start, end)) {
                    candidatePosition += (iteration % 2 || -1) * iteration * SHARED_POINT_SPREAD_PX;
                    iteration++;
                }
                pt[offsetDimension] = candidatePosition;
                nextPt[offsetDimension] = candidatePosition;
                if (commit) {
                    this.rememberSegment(isHorizontal, candidatePosition, start, end);
                }
                // Cut off corner to make down-right diagonal angle connector (this is just for visual effect)
              /* if (lastDirWasRight && !isHorizontal && (nextPt.y - pt.y > 20)) {
                    path.splice(pos, 0, {
                        x: pt.x - 20,
                        y: pt.y
                    });
                    pt.y += 20;
                    pos++;
                }
                lastDirWasRight = (isHorizontal && (nextPt.x - pt.x > 20));*/
                pos++;
            }
        },

        /**
        * Keep a "used" segment in memory so we can avoid it for future paths
        * For i, j0, and j1, see the diagram for segmentCollides()
        */
        rememberSegment: function (isHorizontal, i, j0, j1) {
            var segmentsByDirection = (isHorizontal ?
					this.horizontalSegmentsInUseByY
					: this.verticalSegmentsInUseByX),
				segmentsAtOffset = segmentsByDirection[i];
            if (!segmentsAtOffset) {
                segmentsByDirection[i] = segmentsAtOffset = [];
            }
            segmentsAtOffset.push({
                start: j0,
                end: j1
            });
        },

        /**
        * Returns whether the given segment intersects any of the known used segments in memory.
        * i is either an x or y position, and j0, j1 the corresponding start and end points in the other dimension
        *
        * Example: horizontal segment
        *
        *     ^
        *     |
        *    i|   ---------
        *     |
        *     +---|-------|------>
        *         j0      j1
        *
        * For vertical segments, rotate the diagram above by 90 degrees
        */
        segmentCollides: function (isHorizontal, i, j0, j1) {
            var segments = (isHorizontal ? this.horizontalSegmentsInUseByY : this.verticalSegmentsInUseByX),
				segmentsAtI = segments[i];
            if(!isHorizontal)
                return false;
            if (!segmentsAtI) {
                return false;
            }
            for (var k = 0; k < segmentsAtI.length; k++) {
                var seg = segmentsAtI[k];
                if ((seg.start >= j0 && seg.start <= j1)
					|| (seg.end >= j1 && seg.end <= j1)
					|| (j0 >= seg.start && j0 <= seg.end)) {
                    return true;
                }
            }
            return false;
        },

        onElementMouseEnter: function (evt) {
            
            if (this.readOnly || !this.visible) return;
            var $elt = $(evt.target).closest(".linkable-element"),
				eltID = $elt.data("linkable-element-id");
            if (this.pendingEndpointHides[eltID]) {
                if(this.elementsByID[eltID] )
                    clearTimeout(this.pendingEndpointHides[eltID]);
            }
            var outEndpoint = this.endpointsByID[eltID + "-out"];
            if (outEndpoint) {
                //Dont show link endpoint if task is in quick edit mode
                if (this.elementsByID[eltID]){
                     var isTaskInQuickEdit = this.elementsByID[eltID].hasClass("quick-task-edit") || //for tasks
                                        this.elementsByID[eltID].parent().hasClass("quick-task-edit");  //for Milestones, we need to find the parent
                    if(this.elementsByID[eltID] && !isTaskInQuickEdit)
                        this.endpointsByID[eltID + "-out"].show();
                }
               
            }
        },

        onElementMouseLeave: function (evt) {
            if (this.readOnly) return;
            var $elt = $(evt.target).closest(".linkable-element"),
				eltID = $elt.data("linkable-element-id");
            this.triggerEndpointHide(eltID, this.endpointsByID[eltID + "-out"]);
        },

        onEndpointMouseEnter: function (evt) {
            if (this.readOnly) return;
            var eltID = $(evt.target).data("endpoint-element-id");
            if (this.pendingEndpointHides[eltID]) {
                clearTimeout(this.pendingEndpointHides[eltID]);
            }
        },

        onEndpointMouseLeave: function (evt) {
            if (this.readOnly) return;
            var $endpoint = $(evt.target),
				eltID = $endpoint.data("endpoint-element-id");
            this.triggerEndpointHide(eltID, $endpoint);
        },

        triggerEndpointHide: function (eltID, $endpoint) {
            this.pendingEndpointHides[eltID] = setTimeout(function () {
                if ($endpoint)
                    $endpoint.hide();
            }, this.ENDPOINT_HIDE_TIMEOUT_MS);
        },

        onElementDragLeave: function (evt) {
            if (!this.draggingEndpoint) return;
            var $elt = $(evt.target); //.closest(".linkable-element");
            if ($elt.hasClass("linkable-element")) {
                $elt.removeClass("link-drop-target");
                if (this.lastDragLine) {
                    $(this.lastDragLine[0]).remove();
                }
            }
        },

        onElementDragOver: function (evt) {
            if (!this.draggingEndpoint) return;
            evt.preventDefault();
        },

        onElementDrop: function (evt) {
            if (!this.draggingEndpoint) return;
            evt.preventDefault();
            var $targetEl = $(evt.target).closest(".linkable-element");
            if ($targetEl.length === 0) return;
            $targetEl.removeClass("link-drop-target");
            if (!this.elementsByUniqueIndetifier[$targetEl.attr("id")]){
                this.addLinkIds($targetEl);
                this.addElements($targetEl);

            }
            var targetElID = $targetEl.data("linkable-element-id"),
				linkID = this.getLinkID(this.dragStartElementID, targetElID);
            if (this.linksByID[linkID]) return; // link already exists
            var link = {
                from: this.elementsByID[this.dragStartElementID],
                to: this.elementsByID[targetElID],
                valid: true,
                errors:[]
            };
            // listeners can abort the link by setting .valid = false
            $(this).trigger("beforelinkadd", link);
            if (!link.valid) {
               /* if (this.lastDragLine) {
                    this.lastDragLine.remove();
                }*/
                return;
            }
            delete link.valid;
            this.addConnection(link.from, link.to);
            // Re-draw the path and this time, commit its position (for future collision detection)
            //this.findAndDrawRoute(link.from, link.to, true);
            $(this).trigger("linkadd", link);
            stl.app.CreatePredSuccMap(stl.app.ProjectDataFromServer);
            this.refresh();
        },

        getLinkID: function (fromElID, toElID) {
            return fromElID + "->" + toElID;
        },

        setReadOnly: function (readOnly) {
            if (readOnly === this.readOnly) {
                return;
            }
            this.readOnly = readOnly;
        },

        setOutEndpointOffsets: function (offsetsPx) {
            this.outEndpointYOffset = offsetsPx.y;
            this.outEndpointXOffset = offsetsPx.x;
        },

        clearHighlights: function () {
            this.$elts.each(function (index, elt) {
                if ($(elt).hasClass("task-highlight")) {
                    $(elt).removeClass("task-highlight");
                    if(stl.app.isChainViewLoaded && stl.app.getActiveTimelineViewName() === CHAIN_VIEW)
                        $(Ext.getCmp("chainview").linksView.$elts[index]).removeClass("task-highlight");
                    else
                        $(Ext.getCmp("timelineview").linksView.$elts[index]).removeClass("task-highlight");
                }
            });
        },

        isLinkInCriticalChain: function (toTask, fromTask) {

            var isLinkInCriticalChain = false;

            var toTaskModel = toTask.data("model");
            if (toTaskModel == undefined) {
                toTaskModel = toTask.parent().data("model"); //Milestone
            }

            var fromTaskModel = fromTask.data("model");
            if (fromTaskModel == undefined) {
                fromTaskModel = fromTask.parent().data("model"); // Milestone
            }

            isLinkInCriticalChain = false;


            if ((toTaskModel.taskType == "buffer" || toTaskModel.taskType == "normal" || toTaskModel.taskType == "fullkit")
                                && (fromTaskModel.taskType == "buffer" || fromTaskModel.taskType == "normal" || fromTaskModel.taskType == "fullkit")) {

                //none of the tasks are milestones
                isLinkInCriticalChain = toTask.hasClass("isCCTask") && fromTask.hasClass("isCCTask");

            } else if (toTaskModel.taskType == "buffer" || toTaskModel.taskType == "normal" || toTaskModel.taskType == "fullkit") {

                //To task is a normal task and From task is milestones
                isLinkInCriticalChain = toTask.hasClass("isCCTask") && fromTask.parent().hasClass("isCCTask");
            }
            else if (fromTaskModel.taskType == "buffer" || fromTaskModel.taskType == "normal" || fromTaskModel.taskType == "fullkit") {

                //From task is a normal task and to task is milestones
                isLinkInCriticalChain = toTask.parent().hasClass("isCCTask") && fromTask.hasClass("isCCTask");
            }
            else {
                //Both from and to tasks are milestones
                isLinkInCriticalChain = toTask.parent().hasClass("isCCTask") && fromTask.parent().hasClass("isCCTask");
            }

            return isLinkInCriticalChain;
        },
        
        updateLinkSVGAttributes: function(svg,defaultClass) {
            this.lastZoomLevel = getBrowserZoomLevel();
            if(!this.isLinkSupportiveMode()){
             this.nullifySVGWidthAndHeight(svg,defaultClass);
            }
            else{
                this.applySVGDefaultAttrs(svg,defaultClass);
            } 
            

        },
        bindWindowResizeForLinks: function(){
            if(isChromeBrowser() && !stl.app.eventResizeRegisetered){
                bindWindowResize(this.onChromeWindowResize.bind(this));
            }

        },
        nullifySVGWidthAndHeight: function(svg,defaultClass){
            defaultClass = (defaultClass.indexOf(MILESTONE_LINK_CLS) > -1) 
            ?(LINK_MILESTONE_LINK_CLS + SPACE_CONST + Z_INDEX_LINK_CLS)
            :LINK_CLS;
            svg.attr("class", defaultClass)
               .attr('width', null)
               .attr('height', null); 
        },
        applySVGDefaultAttrs: function(svg,defaultClass){
             defaultClass = defaultClass.indexOf(MILESTONE_LINK_CLS) > -1 
            ?(LINK_MILESTONE_LINK_CLS + SPACE_CONST + Z_INDEX_LINK_CLS)
            :LINK_CLS + SPACE_CONST + Z_INDEX_LINK_CLS;
             svg.attr("class", defaultClass)
                .attr("width", "1")
                .attr("height", "1");


        },
        onChromeWindowResize: function() {
            var me = this;
            var currentZoomLevel = getBrowserZoomLevel();
            if (me.lastZoomLevel !== currentZoomLevel) {
                var svgLinkContainers = d3.selectAll('svg');
                _.each(svgLinkContainers[0], function(svgEl) {
                    var d3SvgWrapper =  d3.select(svgEl);
                    var defaultClass = d3SvgWrapper.attr("class");
                    //;.indexOf(MILESTONE_LINK_CLS) > -1 ? (LINK_CLS + SPACE_CONST + MILESTONE_LINK_CLS) : LINK_CLS;
                    if (currentZoomLevel !== 1) {
                        me.nullifySVGWidthAndHeight(d3SvgWrapper, defaultClass);
                    } else {
                        me.applySVGDefaultAttrs(d3SvgWrapper, defaultClass);
                    }
                });
            }
            me.lastZoomLevel = currentZoomLevel;
        },

        isLinkSupportiveMode: function(){
          return   !(isChromeBrowser() && this.lastZoomLevel !== 1);
        },

        /**
        * Return the UID of the underlying task or milestone for the given linkable element
        */
        resolveLinkEndpointUID: function ($linkEndpointEl) {
            return ($linkEndpointEl.hasClass("ms-content-wrap") ?
                $linkEndpointEl.closest(".milestone").data("model").uid : $linkEndpointEl.data("model").uid);
        }
    });

})());



/*
 * jquery.event.dragout - v1.0
 *
 * Author: Dan Cork
 * Email: [Firstname].[Lastname]@kickinteractive.net
 * Copyright (c) 2012 Kick Interactive
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * Project home: http://github.com/dancork/jquery.event.dragout
 * 
 */
;(function($){

var $event = $.event, 
$special = $event.special,

dragout = $special.dragout = {

	current_elem: false,

	setup: function( data, namespaces, eventHandle ) {
		$('body').on('dragover.dragout',dragout.update_elem)
	},

	teardown: function( namespaces ) {
		$('body').off('dragover.dragout')
	},

	update_elem: function(event){
		if( event.target == dragout.current_elem ) return
		if( dragout.current_elem ) {
			$(dragout.current_elem).parents().andSelf().each(function(){
				if($(this).find(event.target).size()==0) $(this).triggerHandler('dragout')
			})
		}
		dragout.current_elem = event.target
		event.stopPropagation()
	}

}

})(window.jQuery);